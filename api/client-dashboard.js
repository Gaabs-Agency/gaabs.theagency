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

  const headers = {
    Authorization: AUTH,
    "Content-Type": "application/json"
  };

  // Alle Endpoints die wir probieren — erster der funktioniert gewinnt
  const attempts = [
    {
      label: "GET /documents?page_size=100",
      fn: () => fetch(`${BASE}/datasets/gaabs_projects/documents?page_size=100`, {
        method: "GET", headers
      })
    },
    {
      label: "POST /documents/list",
      fn: () => fetch(`${BASE}/datasets/gaabs_projects/documents/list`, {
        method: "POST", headers,
        body: JSON.stringify({ page_size: 100 })
      })
    },
    {
      label: "POST /documents/filter",
      fn: () => fetch(`${BASE}/datasets/gaabs_projects/documents/filter`, {
        method: "POST", headers,
        body: JSON.stringify({ filters: [], page_size: 100 })
      })
    }
  ];

  const triedErrors = [];

  for (const attempt of attempts) {
    try {
      const r = await attempt.fn();
      const text = await r.text();

      if (r.ok) {
        let data = {};
        try { data = JSON.parse(text); } catch { data = {}; }

        const allDocs = data.results || data.documents || data.items || [];
        const project = allDocs.find(doc => doc.client_slug === slug);

        if (!project) {
          return res.status(404).json({
            error: `No project found for slug: ${slug}`,
            endpoint_used: attempt.label,
            total_docs: allDocs.length
          });
        }

        return res.status(200).json({
          success: true,
          endpoint_used: attempt.label,
          project
        });
      }

      triedErrors.push({ endpoint: attempt.label, status: r.status, body: text.slice(0, 200) });

    } catch (err) {
      triedErrors.push({ endpoint: attempt.label, error: err.message });
    }
  }

  // Keiner hat funktioniert
  return res.status(502).json({
    error: "All Relevance endpoints failed",
    tried: triedErrors
  });
}
