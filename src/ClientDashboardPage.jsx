import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const C = {
  bg:"#0B0F14", card:"#141D28", border:"#1E2D3D",
  teal:"#00C9A7", gold:"#C8A96E", text:"#E2E8F0",
  muted:"#64748B", muted2:"#94A3B8", green:"#10B981"
};

function Card({ children, style={} }) {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,...style}}>{children}</div>;
}

function ProgressBar({ value }) {
  return (
    <div style={{background:C.border,borderRadius:9999,height:8,overflow:"hidden"}}>
      <div style={{width:`${Math.max(0,Math.min(100,value||0))}%`,height:"100%",background:C.teal,borderRadius:9999}} />
    </div>
  );
}

export default function ClientDashboardPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/client-dashboard?slug=${encodeURIComponent(slug)}`)
      .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(t); }))
      .then(setData)
      .catch(e => setErr(String(e.message || e)))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{minHeight:"100vh",background:C.bg,color:C.text,padding:32,fontFamily:"Inter,sans-serif"}}>⏳ Lade Client Dashboard...</div>;
  if (err) return <div style={{minHeight:"100vh",background:C.bg,color:C.text,padding:32,fontFamily:"Inter,sans-serif"}}>❌ Fehler: {err}</div>;
  if (!data?.project) return <div style={{minHeight:"100vh",background:C.bg,color:C.text,padding:32,fontFamily:"Inter,sans-serif"}}>Kein Projekt gefunden.</div>;

  const { project, alerts=[], change_orders=[] } = data;

  return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,padding:24,fontFamily:"'IBM Plex Sans',Inter,sans-serif"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>

        <div style={{background:"linear-gradient(135deg,#0D2A2A,#0D1A2A)",border:`1px solid ${C.teal}33`,borderRadius:12,padding:"18px 22px",marginBottom:16}}>
          <div style={{fontSize:10,color:C.teal,fontWeight:700,letterSpacing:2}}>CLIENT PROJECT VIEW — CONFIDENTIAL</div>
          <div style={{fontSize:28,fontWeight:800,marginTop:4}}>{project.project_name}</div>
          <div style={{fontSize:12,color:C.muted2,marginTop:6}}>Client: {project.client} · Phase: {project.phase}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <Card>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.2,marginBottom:8}}>PROJECT PROGRESS</div>
            <div style={{fontSize:32,fontWeight:800,color:C.teal,marginBottom:8}}>{project.progress||0}%</div>
            <ProgressBar value={project.progress||0} />
          </Card>
          <Card style={{textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.2,marginBottom:8}}>SCOPE HEALTH</div>
            <div style={{fontSize:40}}>{project.health==="green"?"🟢":project.health==="yellow"?"🟡":"🔴"}</div>
            <div style={{fontSize:11,color:C.muted2,marginTop:4}}>{project.health||"green"}</div>
          </Card>
          <Card>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.2,marginBottom:8}}>NEXT MILESTONE</div>
            <div style={{fontSize:16,fontWeight:700,color:C.gold,marginTop:8}}>{project.next_milestone||"TBD"}</div>
          </Card>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Card>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.2,marginBottom:12}}>PROJECT ALERTS</div>
            {alerts.length ? alerts.map((a,i)=>(
              <div key={i} style={{padding:"8px 12px",marginBottom:8,borderRadius:8,background:"#1A1F29",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,fontWeight:700}}>{a.log_type||"Activity"}</div>
                <div style={{fontSize:10,color:C.muted2,marginTop:2}}>{a.log_entry||"Update"}</div>
              </div>
            )) : <div style={{fontSize:12,color:C.muted2}}>✅ Keine offenen Alerts.</div>}
          </Card>
          <Card>
            <div style={{fontSize:10,color:C.muted,fontWeight:700,letterSpacing:1.2,marginBottom:12}}>CHANGE ORDERS</div>
            {change_orders.length ? change_orders.map((co,i)=>(
              <div key={i} style={{padding:"8px 12px",marginBottom:8,borderRadius:8,background:"#1A1F29",border:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,fontWeight:700}}>{co.title||"Change Order"}</div>
                <div style={{fontSize:10,color:C.muted2,marginTop:2}}>Status: {co.status||"draft"}</div>
              </div>
            )) : <div style={{fontSize:12,color:C.muted2}}>✅ Keine Change Orders.</div>}
          </Card>
        </div>
      </div>
    </div>
  );
}