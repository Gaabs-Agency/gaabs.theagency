export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Missing slug parameter" });

  const BASE = process.env.RELEVANCE_BASE;
  const AUTH = process.env.RELEVANCE_AUTH;

  if (!BASE || !AUTH) {
    return res.status(500).json({ error: "Missing RELEVANCE_BASE or RELEVANCE_AUTH" });
  }

  try {
    // Alle Dokumente aus gaabs_projects holen und client-seitig filtern
    const relevanceRes = await fetch(
      `${BASE}/datasets/gaabs_projects/documents?page_size=100`,
      {
        method: "GET",
        headers: {
          Authorization: AUTH,
          "Content-Type": "application/json"
        }
      }
    );

    if (!relevanceRes.ok) {
      const errText = await relevanceRes.text();
      return res.status(relevanceRes.status).json({ error: errText });
    }

    const data = await relevanceRes.json();
    const allDocs = data.results || data.documents || [];

    // Nach client_slug filtern
    const project = allDocs.find(doc => doc.client_slug === slug);

    if (!project) {
      return res.status(404).json({ error: `No project found for slug: ${slug}` });
    }

    return res.status(200).json({ success: true, project });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
}
