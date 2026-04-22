export default async function handler(req, res) {
  try {
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const BASE = process.env.RELEVANCE_BASE;
    const AUTH = process.env.RELEVANCE_AUTH;
    if (!BASE || !AUTH) return res.status(500).json({ error: "Missing env vars" });

    async function rf(path, body) {
      const r = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { Authorization: AUTH, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`${r.status}: ${text.slice(0,200)}`);
      return text ? JSON.parse(text) : {};
    }

    const pResp = await rf("/datasets/gaabs_projects/documents/get_where", {
      filters: [{ field:"client_slug", filter_type:"exact_match", condition_value:slug }],
      page_size: 1
    });
    const project = (pResp.results||[])[0];
    if (!project) return res.status(404).json({ error: "Project not found" });

    const pid = project.project_id || project.id;

    const [aResp, coResp] = await Promise.all([
      rf("/datasets/gaabs_activity_log/documents/get_where", {
        filters:[{field:"project_id",filter_type:"exact_match",condition_value:pid}], page_size:20
      }),
      rf("/datasets/gaabs_change_orders/documents/get_where", {
        filters:[{field:"project_id",filter_type:"exact_match",condition_value:pid}], page_size:20
      })
    ]);

    return res.status(200).json({
      project: {
        project_id: project.project_id,
        project_name: project.project_name,
        client: project.client,
        phase: project.phase,
        next_milestone: project.next_milestone,
        progress: project.project_completion_pct || 0,
        health: project.health || "green"
      },
      alerts: (aResp.results||[]).map(a=>({log_type:a.log_type, log_entry:a.log_entry})),
      change_orders: (coResp.results||[]).map(co=>({title:co.title, status:co.status}))
    });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}