// GAABS Client Dashboard API v3
// Auth fix: tries region:project:key format (derived from App URL /knowledge/d7b62b/...)

const REGION = "d7b62b";
const PROJECT_ID = "d82ca31b-33c0-4b90-ab6b-5a42298cf982";
const DATASET = "gaabs_projects";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  const BASE = process.env.RELEVANCE_BASE;
  const AUTH_RAW = process.env.RELEVANCE_AUTH;
  if (!BASE || !AUTH_RAW) return res.status(500).json({ error: "Missing env vars" });

  // Auth format variants — Relevance AI uses region:project:key
  const authFormats = [
    `${REGION}:${PROJECT_ID}:${AUTH_RAW.split(":").pop()}`, // region:project:key
    AUTH_RAW,                                               // as stored in env (project:key)
    `Bearer ${AUTH_RAW.split(":").pop()}`,                  // Bearer key
  ];

  // Path variants derived from App URL: /knowledge/d7b62b/{project_id}/gaabs_projects
  const pathVariants = [
    `/knowledge/${PROJECT_ID}/${DATASET}/documents`,
    `/knowledge/${REGION}/${PROJECT_ID}/${DATASET}/documents`,
    `/datasets/${DATASET}/documents`,
    `/knowledge/${DATASET}/documents`,
  ];

  const tried = [];

  for (const auth of authFormats) {
    for (const path of pathVariants) {
      const url = `${BASE}${path}?page_size=100`;
      try {
        const r = await fetch(url, {
          method: "GET",
          headers: { Authorization: auth, "Content-Type": "application/json" }
        });
        const text = await r.text();
        if (r.ok) {
          let data = {};
          try { data = JSON.parse(text); } catch { data = {}; }
          const docs = data.results || data.documents || data.items || [];
          const project = docs.find(d => d.client_slug === slug);
          if (!project) {
            return res.status(404).json({
              error: `No project found for: ${slug}`,
              endpoint: path,
              total_docs: docs.length
            });
          }
          return res.status(200).json({ success: true, project, endpoint: path });
        }
        tried.push({ auth: auth.substring(0, 20) + "...", path, status: r.status });
      } catch (err) {
        tried.push({ auth: auth.substring(0, 20) + "...", path, error: err.message });
      }
    }
  }

  return res.status(502).json({ error: "All endpoints failed", tried });
}