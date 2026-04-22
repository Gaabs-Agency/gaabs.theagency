import projects from '../data/projects.json' assert { type: 'json' };

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug" });

  const project = projects.find(p => p.client_slug === slug);

  if (!project) {
    return res.status(404).json({ error: `No project found for: ${slug}` });
  }

  return res.status(200).json({ success: true, project });
}
