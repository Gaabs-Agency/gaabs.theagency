const PROJECTS = [
  { project_id: "PROJ-001", client_slug: "nike-aw26", project_name: "Nike AW26 Campaign", client: "Nike", phase: "Production", next_milestone: "Hero Film Delivery - Aug 1", project_completion_pct: 67, health: "green", status: "active", kickoff_date: "2026-03-01", deadline: "2026-08-20" },
  { project_id: "PROJ-002", client_slug: "zalando-spring", project_name: "Zalando Spring Drop", client: "Zalando", phase: "Pre-Production", next_milestone: "Creative Brief - May 15", project_completion_pct: 34, health: "green", status: "active", kickoff_date: "2026-02-01", deadline: "2026-06-30" },
  { project_id: "PROJ-003", client_slug: "porsche-heritage", project_name: "Porsche Heritage Film", client: "Porsche", phase: "Post Production", next_milestone: "Final Delivery - Aug 20", project_completion_pct: 89, health: "yellow", status: "active", kickoff_date: "2026-01-15", deadline: "2026-08-20" },
  { project_id: "PROJ-ROLLOUT-001", client_slug: "gaabs-hybrid-rollout", project_name: "Gaabs Hybrid Rollout", client: "GAABS GmbH (Internal)", phase: "pre_production", next_milestone: "Relevance API verified + all tools deployed", project_completion_pct: 15, health: "green", status: "active", kickoff_date: "2026-04-23", deadline: "2026-06-30" }
];

module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  const project = PROJECTS.find(p => p.client_slug === slug);
  if (!project) return res.status(404).json({ error: "No project found for: " + slug });

  return res.status(200).json({ success: true, project });
};
