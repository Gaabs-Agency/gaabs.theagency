function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateTimestampId(prefix) {
  const now = new Date();
  const ts = now.getUTCFullYear().toString() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    String(now.getUTCMilliseconds()).padStart(3, "0");
  return `${prefix}-${ts}`;
}

function validateDateString(value) {
  if (!value || typeof value !== "string") return false;
  return !Number.isNaN(new Date(value).getTime());
}

function buildProjectDocument({ project_id, client_slug, project_name, client, kickoff_date, deadline }) {
  return {
    project_id,
    client_slug,
    project_name,
    client,
    phase: "pre_production",
    next_milestone: "Kickoff Meeting",
    project_completion_pct: 0,
    health: "green",
    status: "active",
    kickoff_date,
    deadline
  };
}

function buildActivityLogDocument({ project_id, proposal_id, pm_agent }) {
  return {
    log_id: generateTimestampId("LOG"),
    project_id,
    proposal_id,
    timestamp: new Date().toISOString(),
    logged_by: pm_agent,
    log_type: "internal_decision",
    log_entry: "Projekt aus freigegebenem Proposal erstellt",
    reference_email: "",
    task_id: "",
    scope_check_performed: true,
    scope_deviation_detected: false,
    scope_impact_description: "",
    scope_impact_type: "none",
    change_order_triggered: false,
    change_order_id: "",
    escalated_to: "",
    client_notified: false,
    client_notification_sent: "",
    notes: "Initial project creation log"
  };
}

function buildInitialTasks({ project_id, proposal_id, pm_agent, kickoff_date, deadline }) {
  const today = new Date().toISOString().split("T")[0];
  const base = {
    assigned_to: pm_agent,
    assigned_by: "E2-08",
    created_date: today,
    status: "open",
    priority: "high",
    type: "deliverable",
    resource_type: "agent",
    in_proposal: true,
    output_link: "",
    handoff_to: "",
    handoff_notes: "",
    time_spent_h: 0,
    notes: "Auto-created initial task",
    project_id,
    proposal_id
  };

  return [
    {
      ...base,
      task_id: generateTimestampId("TASK"),
      title: "Kickoff vorbereiten",
      description: "Kickoff-Meeting vorbereiten und Agenda definieren",
      due_date: kickoff_date,
      time_estimated_h: 2,
      scope_reference: `Proposal ${proposal_id} Kickoff`
    },
    {
      ...base,
      task_id: generateTimestampId("TASK"),
      title: "Milestones aufsetzen",
      description: "Projektmeilensteine und Timeline im PM-System anlegen",
      due_date: kickoff_date,
      time_estimated_h: 2,
      scope_reference: `Proposal ${proposal_id} Milestone Setup`
    },
    {
      ...base,
      task_id: generateTimestampId("TASK"),
      title: "Scope Review durchführen",
      description: "Proposal-Scope, Exclusions und Revisionsgrenzen prüfen",
      due_date: deadline,
      time_estimated_h: 1.5,
      scope_reference: `Proposal ${proposal_id} Scope Review`
    }
  ];
}

async function relevanceBulkInsert(BASE, AUTH, dataset, documents) {
  const res = await fetch(`${BASE}/datasets/${dataset}/documents/bulk_insert`, {
    method: "POST",
    headers: { Authorization: AUTH, "Content-Type": "application/json" },
    body: JSON.stringify({ documents })
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed. Use POST." });
  }

  try {
    const BASE = process.env.RELEVANCE_BASE;
    const AUTH = process.env.RELEVANCE_AUTH;

    if (!BASE || !AUTH) {
      return res.status(500).json({ success: false, error: "Missing RELEVANCE_BASE or RELEVANCE_AUTH." });
    }

    const { proposal_id, project_name, client, kickoff_date, deadline, pm_agent } = req.body || {};

    const missing = [];
    if (!proposal_id) missing.push("proposal_id");
    if (!project_name) missing.push("project_name");
    if (!client) missing.push("client");
    if (!kickoff_date) missing.push("kickoff_date");
    if (!deadline) missing.push("deadline");
    if (!pm_agent) missing.push("pm_agent");
    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing: ${missing.join(", ")}` });
    }

    if (!validateDateString(kickoff_date)) {
      return res.status(400).json({ success: false, error: "Invalid kickoff_date" });
    }
    if (!validateDateString(deadline)) {
      return res.status(400).json({ success: false, error: "Invalid deadline" });
    }
    if (new Date(deadline) < new Date(kickoff_date)) {
      return res.status(400).json({ success: false, error: "deadline must be >= kickoff_date" });
    }

    const cleanName = String(project_name).trim();
    const cleanClient = String(client).trim();
    if (!cleanName) return res.status(400).json({ success: false, error: "project_name is empty" });
    if (!cleanClient) return res.status(400).json({ success: false, error: "client is empty" });

    const client_slug = slugify(cleanName);
    if (!client_slug) return res.status(400).json({ success: false, error: "Could not generate client_slug" });

    const project_id = generateTimestampId("PROJ");

    // Step 1: gaabs_projects
    const projectDoc = buildProjectDocument({
      project_id, client_slug,
      project_name: cleanName, client: cleanClient,
      kickoff_date, deadline
    });
    const projectResult = await relevanceBulkInsert(BASE, AUTH, "gaabs_projects", [projectDoc]);
    if (!projectResult.ok) {
      return res.status(projectResult.status).json({
        success: false,
        error: "gaabs_projects insert failed",
        relevance_response: projectResult.data
      });
    }

    // Step 2: gaabs_activity_log
    const logDoc = buildActivityLogDocument({ project_id, proposal_id, pm_agent });
    const logResult = await relevanceBulkInsert(BASE, AUTH, "gaabs_activity_log", [logDoc]);

    // Step 3: gaabs_tasks
    const tasks = buildInitialTasks({ project_id, proposal_id, pm_agent, kickoff_date, deadline });
    const tasksResult = await relevanceBulkInsert(BASE, AUTH, "gaabs_tasks", tasks);

    return res.status(200).json({
      success: true,
      message: "Project created with activity log and initial tasks",
      proposal_id,
      pm_agent,
      project_record_created: true,
      activity_log_created: logResult.ok,
      initial_tasks_created: tasksResult.ok ? tasks.length : 0,
      project: projectDoc,
      activity_log: logDoc,
      tasks,
      client_dashboard_url: `/client/${client_slug}`
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Unknown server error" });
  }
}