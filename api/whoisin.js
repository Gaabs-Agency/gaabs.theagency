const SB='https://ocuxostmzpqlkktmlqsu.supabase.co';
const OK=new Set(['freelancers','artbuying_requests','artbuying_invites','artbuying_email_queue','artbuying_booking_log','artbuying_nda_templates']);
export default async function handler(req,res){
  const o=req.headers.origin||'';
  res.setHeader('Access-Control-Allow-Origin',o.includes('gaabs-theagency')||o.includes('localhost')||o===''?o:'https://gaabs-theagency-flax.vercel.app');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Prefer,Range');
  res.setHeader('Access-Control-Expose-Headers','Content-Range');
  if(req.method==='OPTIONS')return res.status(200).end();
  const key=process.env.supabase_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY;
  if(!key)return res.status(500).json({error:'Missing key'});
  const{table,filter,select,order,limit,offset}=req.query;
  if(!table)return res.status(400).json({error:'Missing table'});
  if(!OK.has(table))return res.status(403).json({error:'Not allowed: '+table});
  let url=`${SB}/rest/v1/${table}`;
  const p=new URLSearchParams();
  if(select)p.set('select',select);
  if(order)p.set('order',order);
  if(limit)p.set('limit',limit);
  if(offset)p.set('offset',offset);
  if(filter){filter.split('&').forEach(f=>{const[k,...v]=f.split('=');if(k&&v.length)p.set(k,v.join('='));});}
  const qs=p.toString();
  if(qs)url+='?'+qs;
  const h={'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'};
  if(req.headers['prefer'])h['Prefer']=req.headers['prefer'];
  try{
    const r=await fetch(url,{method:req.method,headers:h,body:['POST','PATCH','PUT'].includes(req.method)?JSON.stringify(req.body):undefined});
    const txt=await r.text();
    let d;try{d=JSON.parse(txt);}catch{d=txt;}
    const cr=r.headers.get('content-range');
    if(cr)res.setHeader('Content-Range',cr);
    return res.status(r.status).json(d);
  }catch(e){return res.status(500).json({error:'Proxy error: '+e.message});}
}
