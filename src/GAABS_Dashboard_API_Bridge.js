const BASE = import.meta.env.VITE_RELEVANCE_BASE
  || "https://api-d7b62b.stack.tryrelevance.com/latest";
const TOKEN = import.meta.env.VITE_RELEVANCE_TOKEN || "";
const HEADERS = { "Authorization": TOKEN, "Content-Type": "application/json" };
 
export async function fetchControllingData(projectId = null) {
  try {
    const filter = projectId
      ? [{ field:"project_id", filter_type:"exact_match", condition_value:projectId }]
      : [];
    const res = await fetch(`${BASE}/datasets/gaabs_controlling/documents/get_where`,
      { method:"POST", headers:HEADERS,
        body:JSON.stringify({ filters:filter, page_size:50 }) });
    return (await res.json()).results || [];
  } catch(e) { return []; }
}
 
export async function fetchActiveProjects() {
  try {
    const res = await fetch(`${BASE}/datasets/gaabs_projects/documents/get_where`,
      { method:"POST", headers:HEADERS,
        body:JSON.stringify({
          filters:[{field:"status",filter_type:"exact_match",condition_value:"active"}],
          page_size:30 }) });
    return (await res.json()).results || [];
  } catch(e) { return []; }
}
 
export async function fetchScopeAlerts() {
  try {
    const res = await fetch(`${BASE}/datasets/gaabs_activity_log/documents/get_where`,
      { method:"POST", headers:HEADERS,
        body:JSON.stringify({
          filters:[
            {field:"scope_deviation_detected",filter_type:"exact_match",condition_value:true},
            {field:"client_notified",filter_type:"exact_match",condition_value:false}
          ], page_size:20 }) });
    return (await res.json()).results || [];
  } catch(e) { return []; }
}
 
export async function fetchOpenChangeOrders() {
  try {
    const res = await fetch(`${BASE}/datasets/gaabs_change_orders/documents/get_where`,
      { method:"POST", headers:HEADERS,
        body:JSON.stringify({
          filters:[{field:"status",filter_type:"exact_match",condition_value:"draft"}],
          page_size:20 }) });
    return (await res.json()).results || [];
  } catch(e) { return []; }
}