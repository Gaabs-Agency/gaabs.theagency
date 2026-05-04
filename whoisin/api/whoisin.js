/**
 * Who's In — Supabase Proxy
 * 
 * All requests from the HTML tool go through here.
 * SUPABASE_ANON_KEY lives only in Vercel Environment Variables — never in the HTML.
 * 
 * Usage: /api/whoisin?table=freelancers&method=GET
 *        /api/whoisin?table=artbuying_requests&method=POST  (body in request)
 *        /api/whoisin?table=artbuying_invites&method=PATCH&filter=id=eq.xxx
 */

const SB_URL = 'https://ocuxostmzpqlkktmlqsu.supabase.co';

// Allowed tables — whitelist for security, nothing else can be accessed
const ALLOWED_TABLES = new Set([
  'freelancers',
  'artbuying_requests',
  'artbuying_invites',
  'artbuying_email_queue',
  'artbuying_booking_log',
  'artbuying_nda_templates',
]);

export default async function handler(req, res) {

  // CORS — only allow requests from own domain
  const origin = req.headers.origin || '';
  const allowed = origin.includes('gaabs-theagency') || origin.includes('localhost') || origin === '';
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : 'https://gaabs-theagency-flax.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Prefer, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Vercel Supabase integration uses supabase_ prefix
  const key = process.env.supabase_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) return res.status(500).json({ error: 'Server misconfigured — SUPABASE_ANON_KEY missing' });

  // Parse query params
  const { table, filter, select, order, limit, offset } = req.query;

  if (!table) return res.status(400).json({ error: 'Missing table parameter' });
  if (!ALLOWED_TABLES.has(table)) return res.status(403).json({ error: 'Table not allowed: ' + table });

  // Build Supabase URL
  let url = `${SB_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();
  if (select) params.set('select', select);
  if (order) params.set('order', order);
  if (limit) params.set('limit', limit);
  if (offset) params.set('offset', offset);

  // Filter can be like "id=eq.xxx" or "token=eq.abc&status=eq.pending"
  if (filter) {
    filter.split('&').forEach(f => {
      const [k, v] = f.split('=');
      if (k && v) params.set(k, v);
    });
  }

  const qs = params.toString();
  if (qs) url += '?' + qs;

  // Forward request headers
  const headers = {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
  };
  if (req.headers['prefer']) headers['Prefer'] = req.headers['prefer'];

  try {
    const sbRes = await fetch(url, {
      method: req.method,
      headers,
      body: ['POST', 'PATCH', 'PUT'].includes(req.method) ? JSON.stringify(req.body) : undefined,
    });

    const text = await sbRes.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    // Forward content-range header if present (for counts)
    if (sbRes.headers.get('content-range')) {
      res.setHeader('Content-Range', sbRes.headers.get('content-range'));
    }

    return res.status(sbRes.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
