import { useState, useEffect, useRef } from "react";

// ─── GAABS VPE LOGIC ─────────────────────────────────────────────────────────
const LEVEL_RATES = {
  E1: { daily: 2200, hourly: 275, quality_factor: 2.5, label: "Founder" },
  E2: { daily: 1400, hourly: 175, quality_factor: 1.8, label: "Lead" },
  E3: { daily:  900, hourly: 112, quality_factor: 1.3, label: "Senior" },
  E4: { daily:  500, hourly:  62, quality_factor: 1.0, label: "Junior" },
};

const AGENTS = [
  { id:"E1-01", name:"Maximilian Voss",  level:"E1", role:"Creative Director",   avatar:"MV", active:true,  tasks_today:4,  vav_today:1840 },
  { id:"E1-02", name:"Sophia Brenner",   level:"E1", role:"Managing Director",   avatar:"SB", active:false, tasks_today:2,  vav_today: 920 },
  { id:"E2-01", name:"Lena Hartmann",    level:"E2", role:"Executive Creative",  avatar:"LH", active:true,  tasks_today:8,  vav_today:2100, alert:"Latency >120ms" },
  { id:"E2-02", name:"Jonas Weber",      level:"E2", role:"Head of Strategy",    avatar:"JW", active:true,  tasks_today:5,  vav_today:1400 },
  { id:"E2-03", name:"Isabelle Müller",  level:"E2", role:"Head of Production",  avatar:"IM", active:true,  tasks_today:6,  vav_today:1260 },
  { id:"E2-04", name:"Felix Kramer",     level:"E2", role:"Head of BizDev",      avatar:"FK", active:true,  tasks_today:3,  vav_today: 840 },
  { id:"E2-05", name:"Nora Schmidt",     level:"E2", role:"Head of Media",       avatar:"NS", active:false, tasks_today:2,  vav_today: 560 },
  { id:"E3-01", name:"Alicia Bauer",     level:"E3", role:"Senior Art Director", avatar:"AB", active:true,  tasks_today:6,  vav_today: 900 },
  { id:"E3-02", name:"David Richter",    level:"E3", role:"Senior Copywriter",   avatar:"DR", active:true,  tasks_today:9,  vav_today:1350 },
  { id:"E3-03", name:"Yuki Tanaka",      level:"E3", role:"CGI / Motion Lead",   avatar:"YT", active:true,  tasks_today:4,  vav_today:1000, alert:"Rate Limit approaching" },
  { id:"E3-05", name:"Amara Osei",       level:"E3", role:"Trend Intelligence",  avatar:"AO", active:true,  tasks_today:7,  vav_today: 945 },
  { id:"E3-06", name:"Tobias Lang",      level:"E3", role:"Senior PM",           avatar:"TL", active:true,  tasks_today:12, vav_today: 810 },
  { id:"E3-08", name:"Stefan Neumann",   level:"E3", role:"Financial Controller",avatar:"SN", active:true,  tasks_today:5,  vav_today: 675 },
  { id:"E4-02", name:"Ben Schäfer",      level:"E4", role:"Junior Copywriter",   avatar:"BS", active:true,  tasks_today:4,  vav_today: 248 },
  { id:"E4-08", name:"Lea Winter",       level:"E4", role:"Strategy Research",   avatar:"LW", active:true,  tasks_today:6,  vav_today: 372 },
  { id:"E4-09", name:"Tom Berger",       level:"E4", role:"Junior PM",           avatar:"TB", active:true,  tasks_today:8,  vav_today: 496 },
];

const PROJECTS = [
  { id:"PROJ-001", name:"Nike AW26 Campaign",    client:"Nike",    progress:67, vav:845920, status:"stable",   phase:"Production",    scope_health:"green", change_orders:0, velocity:3.2 },
  { id:"PROJ-002", name:"Zalando Spring Drop",    client:"Zalando", progress:34, vav:22130,  status:"fast",     phase:"Pre-Production",scope_health:"green", change_orders:1, velocity:2.8 },
  { id:"PROJ-003", name:"Porsche Heritage Film",  client:"Porsche", progress:89, vav:68400,  status:"delivery", phase:"Post",          scope_health:"yellow",change_orders:2, velocity:4.1 },
  { id:"PROJ-004", name:"LVMH Brand Strategy",    client:"LVMH",    progress:12, vav:16790,  status:"on_hold",  phase:"Briefing",      scope_health:"green", change_orders:0, velocity:1.0 },
  { id:"PROJ-005", name:"USM Digital Campaign",   client:"USM",     progress:45, vav:31200,  status:"stable",   phase:"Creative",      scope_health:"green", change_orders:1, velocity:2.4 },
];

// VPE Calculation engine
function calcVPE(agent, human_hours, task_type = "standard", express = false) {
  const rate = LEVEL_RATES[agent.level];
  const substitution_value = rate.hourly * human_hours;
  const quality_value = substitution_value * rate.quality_factor;
  const express_factor = express ? 1.25 : 1.0;
  const vpe_value = quality_value * express_factor;
  const api_cost = human_hours * 0.08; // ~€0.08 per hour equivalent
  const margin = ((vpe_value - api_cost) / vpe_value) * 100;
  return { substitution_value, quality_value, vpe_value, api_cost, margin };
}

const TOTAL_VAV = AGENTS.reduce((s, a) => s + a.vav_today, 0);
const TOTAL_API_COST = 2130;
const ARBITRAGE_MARGIN = TOTAL_VAV - TOTAL_API_COST;

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:       "#0B0F14",
  surface:  "#111820",
  card:     "#141D28",
  border:   "#1E2D3D",
  border2:  "#243344",
  gold:     "#C8A96E",
  gold2:    "#E8C88E",
  teal:     "#00C9A7",
  teal2:    "#00E5BF",
  blue:     "#3B82F6",
  red:      "#EF4444",
  orange:   "#F59E0B",
  green:    "#10B981",
  text:     "#E2E8F0",
  muted:    "#64748B",
  muted2:   "#94A3B8",
  E1:       "#C8A96E",
  E2:       "#3B82F6",
  E3:       "#8B5CF6",
  E4:       "#6B7280",
};

// ─── MINI COMPONENTS ─────────────────────────────────────────────────────────
function Metric({ label, value, sub, trend, color = C.teal, size = "lg" }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: size === "lg" ? 36 : 24, fontWeight: 800, color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted2, marginTop: 4 }}>{sub}</div>}
      {trend && (
        <div style={{ fontSize: 11, color: trend.startsWith("+") ? C.green : C.red, marginTop: 2, fontWeight: 600 }}>
          {trend}
        </div>
      )}
    </div>
  );
}

function Badge({ text, color }) {
  const map = {
    stable:   { bg:"#0D2A1F", text:"#10B981", label:"Stable" },
    fast:     { bg:"#0D1F2A", text:"#3B82F6", label:"Fast" },
    delivery: { bg:"#1A1A0D", text:"#C8A96E", label:"Delivery" },
    on_hold:  { bg:"#2A1A0D", text:"#F59E0B", label:"On Hold" },
    green:    { bg:"#0D2A1F", text:"#10B981", label:"OK" },
    yellow:   { bg:"#1F1A0D", text:"#F59E0B", label:"Watch" },
    red:      { bg:"#2A0D0D", text:"#EF4444", label:"Alert" },
  };
  const s = map[text] || { bg:"#1A1A1A", text:"#888", label: text };
  return (
    <span style={{
      background: s.bg, color: s.text,
      fontSize: 9, fontWeight: 700, letterSpacing: 1,
      padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap"
    }}>{s.label.toUpperCase()}</span>
  );
}

function ProgressBar({ value, color = C.teal, height = 4 }) {
  return (
    <div style={{ background: C.border, borderRadius: 9999, height, overflow: "hidden" }}>
      <div style={{
        width: `${value}%`, height: "100%",
        background: color, borderRadius: 9999,
        transition: "width 1s ease"
      }} />
    </div>
  );
}

function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card, border: `1px solid ${hov ? C.border2 : C.border}`,
        borderRadius: 12, padding: 20,
        transition: "border-color 0.2s",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ initials, level, size = 28, pulse = false }) {
  const color = C[level] || C.muted;
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `${color}22`,
        border: `1.5px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.32, fontWeight: 700, color,
        flexShrink: 0
      }}>
        {initials}
      </div>
      {pulse && (
        <div style={{
          position: "absolute", bottom: 0, right: 0,
          width: 8, height: 8, borderRadius: "50%",
          background: C.teal,
          boxShadow: `0 0 6px ${C.teal}`,
          animation: "pulse 2s infinite"
        }} />
      )}
    </div>
  );
}

// Gauge / Speedometer
function Gauge({ value, max, label, color = C.teal }) {
  const pct = Math.min(value / max, 1);
  const angle = -135 + pct * 270;
  const r = 44;
  const cx = 56, cy = 56;
  const startAngle = -135 * (Math.PI / 180);
  const endAngle = (startAngle) + (270 * Math.PI / 180);
  const arcEnd = (-135 + pct * 270) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(arcEnd);
  const y2 = cy + r * Math.sin(arcEnd);
  const large = pct > 0.5 ? 1 : 0;
  const pathBg = `M ${cx + r * Math.cos(startAngle)} ${cy + r * Math.sin(startAngle)} A ${r} ${r} 0 1 1 ${cx + r * Math.cos(endAngle)} ${cy + r * Math.sin(endAngle)}`;
  const pathFg = pct > 0.005 ? `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}` : "";

  return (
    <div style={{ textAlign: "center" }}>
      <svg width={112} height={80} viewBox="0 0 112 80">
        <path d={pathBg} fill="none" stroke={C.border2} strokeWidth={6} strokeLinecap="round" />
        {pathFg && <path d={pathFg} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" />}
        <text x={cx} y={cy + 10} textAnchor="middle" fill={color} fontSize={20} fontWeight={800} fontFamily="'DM Mono', monospace">
          {value}x
        </text>
      </svg>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginTop: -8 }}>{label}</div>
    </div>
  );
}

// Mini bar chart
function MiniBar({ value, maxValue, color }) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div style={{ background: C.border, borderRadius: 2, height: 6, flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 1.2s ease" }} />
    </div>
  );
}

// Activity heat strip (like the GitHub contribution graph but horizontal)
function ActivityStrip({ tasks, color }) {
  const cells = Array.from({ length: 28 }, (_, i) => {
    const intensity = i < tasks ? Math.min(1, 0.3 + (i / tasks) * 0.7) : 0;
    return intensity;
  });
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {cells.map((v, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: 2,
          background: v > 0 ? `${color}` : C.border,
          opacity: v > 0 ? v : 0.3,
          flexShrink: 0
        }} />
      ))}
    </div>
  );
}

// Donut chart (simple SVG)
function DonutChart({ data, size = 100 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  const r = 38, cx = size / 2, cy = size / 2;
  const segments = data.map(d => {
    const frac = d.value / total;
    const startAngle = (cumulative - 0.25) * Math.PI * 2;
    cumulative += frac;
    const endAngle = (cumulative - 0.25) * Math.PI * 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = frac > 0.5 ? 1 : 0;
    return { ...d, path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${cx} ${cy}`, frac };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.9} />
      ))}
      <circle cx={cx} cy={cy} r={24} fill={C.card} />
    </svg>
  );
}

// ─── BOARD DASHBOARD ─────────────────────────────────────────────────────────
function BoardDashboard({ tickerValue }) {
  const activeAgents = AGENTS.filter(a => a.active);
  const alertAgents  = AGENTS.filter(a => a.alert);

  const revenueByLevel = ["E1","E2","E3","E4"].map(lvl => ({
    level: lvl,
    vav: AGENTS.filter(a=>a.level===lvl).reduce((s,a)=>s+a.vav_today, 0),
    color: C[lvl]
  }));
  const maxRevLevel = Math.max(...revenueByLevel.map(r => r.vav));

  const taskTypeData = [
    { label:"Concept",  value:35, color:"#00C9A7" },
    { label:"Copy",     value:28, color:"#3B82F6" },
    { label:"Research", value:22, color:"#8B5CF6" },
    { label:"Admin",    value:15, color:"#6B7280" },
  ];

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>

      {/* Row 1 — 3 Financial KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        {/* VAV */}
        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
            TOTAL AGENT-GENERATED REVENUE (VAV)
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.teal, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            € {tickerValue.toLocaleString("de-DE")}
          </div>
          <div style={{ fontSize: 11, color: C.green, marginTop: 4, fontWeight: 600 }}>
            ↑ +22% vs human parity
          </div>
          {/* Sparkline */}
          <div style={{ marginTop: 12, display: "flex", alignItems: "flex-end", gap: 2, height: 32 }}>
            {[180,220,310,280,420,380,510,490,620,580,720,848].map((v,i) => (
              <div key={i} style={{
                flex: 1, background: i === 11 ? C.teal : `${C.teal}44`,
                height: `${(v/848)*100}%`, borderRadius: 2, minWidth: 0
              }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: C.muted }}>Q1 2026</span>
            <span style={{ fontSize: 9, color: C.muted }}>Q1 2026</span>
          </div>
        </Card>

        {/* API Cost */}
        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
            ACTUAL API COST (CLOUD)
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.text, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            € 2,130
          </div>
          <div style={{ fontSize: 11, color: C.muted2, marginTop: 4 }}>0.25% of revenue</div>
          <div style={{ marginTop: 14 }}>
            {[
              { label: "API/Server", value: 2, color: C.teal },
              { label: "Human Parity", value: 100, color: C.border2 },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: C.muted, width: 70 }}>{r.label}</div>
                <div style={{ flex: 1, background: C.border, borderRadius: 2, height: 8 }}>
                  <div style={{ width: `${r.value}%`, height: "100%", background: r.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Arbitrage */}
        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
            ARBITRAGE MARGIN (NET)
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: C.gold, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            € {ARBITRAGE_MARGIN.toLocaleString("de-DE")}
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Gauge value={99.7} max={100} label="Gross Profit" color={C.gold} />
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: C.muted2, marginTop: 4 }}>Maximized Efficiency</div>
        </Card>
      </div>

      {/* Row 2 — Revenue by Level + Task Type */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16 }}>
            REVENUE BY AGENT LEVEL
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {revenueByLevel.map(r => (
              <div key={r.level} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: C.muted }}>€{Math.round(r.vav/1000)}k</div>
                <div style={{
                  width: "100%",
                  height: `${(r.vav / maxRevLevel) * 72}px`,
                  background: r.color,
                  borderRadius: "4px 4px 0 0",
                  opacity: 0.85
                }} />
                <div style={{ fontSize: 10, color: r.color, fontWeight: 700 }}>{r.level}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>
            REVENUE BY TASK TYPE
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart data={taskTypeData} size={100} />
            <div style={{ flex: 1 }}>
              {taskTypeData.map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.muted2, flex: 1 }}>{d.label}</span>
                  <span style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 — Agent Utilization + Alerts + Projects */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Agent Utilization */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700 }}>AGENT UTILIZATION (TOP 5)</div>
            <div style={{ fontSize: 9, color: C.muted }}>Active hours</div>
          </div>
          {AGENTS.filter(a => a.active).slice(0, 5).map(agent => (
            <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Avatar initials={agent.avatar} level={agent.level} size={26} pulse={agent.active} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: C.text, fontWeight: 600 }}>{agent.id} {agent.name.split(" ")[0]}</div>
                <ActivityStrip tasks={Math.min(agent.tasks_today, 28)} color={C[agent.level]} />
              </div>
            </div>
          ))}
        </Card>

        {/* Right: Velocity + Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <Card style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>VELOCITY INDEX</div>
            <div style={{ textAlign: "center" }}>
              <Gauge value={32} max={50} label="avg faster than human" color={C.teal} />
            </div>
          </Card>

          <Card>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>CRITICAL ALERTS</div>
            {alertAgents.map(a => (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                padding: "6px 8px", borderRadius: 6,
                background: a.alert.includes("Rate") ? "#2A0D0D" : "#1F1A0D",
                border: `1px solid ${a.alert.includes("Rate") ? C.red+"44" : C.orange+"44"}`
              }}>
                <div style={{ fontSize: 9, color: C.text, fontWeight: 700, flex: 1 }}>
                  {a.id} {a.name.split(" ")[0]}
                  <div style={{ fontSize: 8, color: C.muted2, fontWeight: 400 }}>{a.alert}</div>
                </div>
                <div style={{ fontSize: 16 }}>{a.alert.includes("Rate") ? "🔴" : "⚠️"}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Row 4 — Top Projects */}
      <Card>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14 }}>
          TOP 5 ACTIVE PROJECTS
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Project Name","Client","Progress","Revenue Gen.","Status"].map(h => (
                <th key={h} style={{ fontSize: 9, color: C.muted, letterSpacing: 1, textAlign: "left", paddingBottom: 8, fontWeight: 700 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p, i) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                <td style={{ padding: "10px 0", fontSize: 12, color: C.text, fontWeight: 600 }}>{p.name}</td>
                <td style={{ padding: "10px 8px", fontSize: 11, color: C.muted2 }}>{p.client}</td>
                <td style={{ padding: "10px 8px", minWidth: 100 }}>
                  <ProgressBar value={p.progress} color={C.teal} />
                </td>
                <td style={{ padding: "10px 8px", fontSize: 12, color: C.gold, fontFamily: "'DM Mono', monospace", fontWeight: 700 }}>
                  € {p.vav.toLocaleString("de-DE")}
                </td>
                <td style={{ padding: "10px 0" }}>
                  <Badge text={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── CLIENT DASHBOARD ─────────────────────────────────────────────────────────
function ClientDashboard({ project, tick }) {
  const activeAgents = AGENTS.filter(a => a.active).slice(0, 6);

  // Milestone data
  const milestones = [
    { label: "Strategy Paper", done: true,  date: "Apr 28" },
    { label: "Creative Brief",  done: true,  date: "May 5"  },
    { label: "Hero Film 1",     done: false, date: "Aug 1"  },
    { label: "Hero Film 2",     done: false, date: "Aug 8"  },
    { label: "Social Cutdowns", done: false, date: "Aug 15" },
    { label: "Final Delivery",  done: false, date: "Aug 20" },
  ];

  const revisionsSaved = 4;

  return (
    <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>

      {/* Header Banner */}
      <div style={{
        background: `linear-gradient(135deg, #0D2A2A 0%, #0D1A2A 100%)`,
        border: `1px solid ${C.teal}33`,
        borderRadius: 12, padding: "16px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: 9, color: C.teal, letterSpacing: 2, fontWeight: 700 }}>ACTIVE PROJECT</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 2 }}>{project.name}</div>
          <div style={{ fontSize: 11, color: C.muted2, marginTop: 2 }}>Client: {project.client} · Phase: {project.phase}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, marginBottom: 4 }}>STRATEGIC ASSET VALUE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.gold, fontFamily: "'DM Mono', monospace" }}>
            € {project.vav.toLocaleString("de-DE")}
          </div>
          <div style={{ fontSize: 10, color: C.muted2 }}>Expertise delivered to date</div>
        </div>
      </div>

      {/* Row 1 — 3 Client KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>PROJECT VELOCITY INDEX</div>
          <Gauge value={project.velocity} max={5} label="× faster than industry standard" color={C.teal} />
          <div style={{ fontSize: 11, color: C.muted2, marginTop: 8 }}>Compared to traditional agency timelines</div>
        </Card>

        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>MILESTONE BURN-UP</div>
          <div style={{ marginBottom: 6 }}>
            <ProgressBar value={project.progress} color={C.teal} height={8} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: C.muted }}>0%</span>
              <span style={{ fontSize: 11, color: C.teal, fontWeight: 700 }}>{project.progress}% complete</span>
              <span style={{ fontSize: 9, color: C.muted }}>100%</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            {milestones.slice(0, 4).map(m => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.done ? C.teal : C.border, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: m.done ? C.text : C.muted, flex: 1 }}>{m.label}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{m.date}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>REVISIONS SAVED</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: C.green, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
              {revisionsSaved}
            </div>
            <div style={{ fontSize: 12, color: C.muted2 }}>rounds<br/>intercepted</div>
          </div>
          <div style={{ fontSize: 11, color: C.muted2, marginTop: 8, lineHeight: 1.5 }}>
            Internal AI pre-validation by Senior Leads prevented {revisionsSaved} client revision cycles
          </div>
          <div style={{ marginTop: 10, padding: "6px 10px", background: "#0D2A1F", borderRadius: 6, border: `1px solid ${C.green}33` }}>
            <div style={{ fontSize: 10, color: C.green, fontWeight: 600 }}>≈ {revisionsSaved * 3} days saved</div>
          </div>
        </Card>
      </div>

      {/* Live Agency Activity */}
      <Card>
        <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 16 }}>
          LIVE AGENCY ACTIVITY
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {activeAgents.map((agent, i) => {
            const isWorking = (tick + i) % 3 !== 0;
            const tasks = ["Creating Creative Brief", "Reviewing Strategy", "Generating CGI Assets", "Writing Copy", "Trend Research", "Budget Analysis"];
            return (
              <div key={agent.id} style={{
                padding: "10px 12px", borderRadius: 8,
                background: isWorking ? `${C[agent.level]}11` : C.surface,
                border: `1px solid ${isWorking ? C[agent.level]+"44" : C.border}`,
                transition: "all 0.5s ease"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Avatar initials={agent.avatar} level={agent.level} size={24} pulse={isWorking} />
                  <div>
                    <div style={{ fontSize: 10, color: C.text, fontWeight: 700, lineHeight: 1 }}>{agent.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 8, color: C[agent.level] }}>{agent.level} · {agent.role.split(" ")[0]}</div>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: isWorking ? C.text : C.muted, lineHeight: 1.4 }}>
                  {isWorking ? tasks[i % tasks.length] : "Standby"}
                </div>
                {isWorking && (
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar value={((tick * 7 + i * 13) % 80) + 10} color={C[agent.level]} height={2} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Scope Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>DELIVERABLE OVERVIEW</div>
          {milestones.map(m => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                background: m.done ? `${C.teal}22` : C.surface,
                border: `1.5px solid ${m.done ? C.teal : C.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0
              }}>
                {m.done && <span style={{ fontSize: 10, color: C.teal }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, color: m.done ? C.text : C.muted, flex: 1 }}>{m.label}</span>
              <span style={{ fontSize: 10, color: C.muted }}>{m.date}</span>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 12 }}>SCOPE HEALTH</div>
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {project.scope_health === "green" ? "🟢" : project.scope_health === "yellow" ? "🟡" : "🔴"}
            </div>
            <Badge text={project.scope_health === "green" ? "stable" : "on_hold"} />
            <div style={{ fontSize: 12, color: C.muted2, marginTop: 12 }}>
              {project.change_orders === 0 ? "No scope changes" : `${project.change_orders} change order(s) active`}
            </div>
            {project.change_orders > 0 && (
              <div style={{ marginTop: 10, padding: "6px 10px", background: "#1F1A0D", borderRadius: 6, border: `1px solid ${C.orange}33` }}>
                <div style={{ fontSize: 10, color: C.orange }}>Change Order pending approval</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]           = useState("board");
  const [activeProject, setProj]  = useState(PROJECTS[0]);
  const [tick, setTick]           = useState(0);
  const [tickerValue, setTicker]  = useState(TOTAL_VAV - 12000);

  // Animate ticker and live activity
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      setTicker(v => Math.min(v + Math.floor(Math.random() * 800 + 200), TOTAL_VAV));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', 'Inter', sans-serif",
      color: C.text
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.3)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1E2D3D; border-radius: 4px; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 52,
        background: C.surface, borderRight: `1px solid ${C.border}`,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "12px 0", gap: 8, zIndex: 100
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.teal} 0%, ${C.blue} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#000", marginBottom: 8
        }}>TG</div>

        {[
          { icon: "⊞", id: "board",  title: "Board" },
          { icon: "◷", id: "client", title: "Client" },
          { icon: "◈", id: "vpe",    title: "VPE" },
          { icon: "⊙", id: "agents", title: "Agents" },
          { icon: "⚙", id: "ctrl",   title: "Settings" },
        ].map(item => (
          <button key={item.id}
            onClick={() => setView(item.id)}
            title={item.title}
            style={{
              width: 36, height: 36, borderRadius: 8, border: "none",
              background: view === item.id ? `${C.teal}22` : "transparent",
              color: view === item.id ? C.teal : C.muted,
              fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", transition: "all 0.15s"
            }}>
            {item.icon}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: 52, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ── TOP BAR ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: `${C.surface}EE`, backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "10px 20px", display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>
            TG | <span style={{ color: C.teal }}>AI Agency Board</span>
          </div>

          {/* View Switcher */}
          <div style={{ display: "flex", background: C.card, borderRadius: 8, padding: 3, marginLeft: 12, border: `1px solid ${C.border}` }}>
            {[
              { id: "board",  label: "E0 Board" },
              { id: "client", label: "Client View" },
              { id: "vpe",    label: "VPE Matrix" },
            ].map(v => (
              <button key={v.id}
                onClick={() => setView(v.id)}
                style={{
                  padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: view === v.id ? C.teal : "transparent",
                  color: view === v.id ? "#000" : C.muted,
                  fontSize: 11, fontWeight: view === v.id ? 700 : 500,
                  transition: "all 0.15s"
                }}>
                {v.label}
              </button>
            ))}
          </div>

          {view === "client" && (
            <select
              value={activeProject.id}
              onChange={e => setProj(PROJECTS.find(p => p.id === e.target.value))}
              style={{
                background: C.card, color: C.text, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "5px 10px", fontSize: 11
              }}>
              {PROJECTS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 10, color: C.muted }}>LIVE</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>Admin E0 ▾</div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 11, color: C.muted }}>
              📅 April 2026
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 11, color: C.muted }}>
              🔍 Search...
            </div>
          </div>
        </div>

        {/* ── PAGE CONTENT ── */}
        <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>

          {/* Board Dashboard */}
          {view === "board" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
                  EXECUTIVE OVERVIEW <span style={{ color: C.teal, fontWeight: 400, fontSize: 14 }}>| E0 LEVEL</span>
                </h1>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 6 }}>
                  <div style={{ fontSize: 11, color: C.muted }}>FINANCIAL CONTROLLING</div>
                  <div style={{ fontSize: 11, color: C.muted }}>PROJECT MANAGEMENT OVERVIEWS</div>
                </div>
              </div>
              <BoardDashboard tickerValue={tickerValue} />
            </>
          )}

          {/* Client Dashboard */}
          {view === "client" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
                  PROJECT STATUS <span style={{ color: C.teal, fontWeight: 400, fontSize: 14 }}>| CLIENT VIEW</span>
                </h1>
                <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>
                  Premium expertise in Lichtgeschwindigkeit · Transparent · Real-time
                </p>
              </div>
              <ClientDashboard project={activeProject} tick={tick} />
            </>
          )}

          {/* VPE Matrix */}
          {view === "vpe" && (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
                  VPE MATRIX <span style={{ color: C.gold, fontWeight: 400, fontSize: 14 }}>| VIRTUAL PROFESSIONAL EQUIVALENT</span>
                </h1>
                <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>
                  Ghost Accounting · Internal Arbitrage · Gaabs Virtual Value Formula
                </p>
              </div>

              {/* Formula Card */}
              <Card style={{ marginBottom: 12, background: "#0D1A2A", border: `1px solid ${C.gold}44` }}>
                <div style={{ fontSize: 9, color: C.gold, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>GAABS VIRTUAL VALUE FORMULA</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: C.text, lineHeight: 2 }}>
                  <span style={{ color: C.teal }}>VPE_Value</span> = (Tagessatz / 8h) × Zeit_Äquivalent × Qualitäts_Faktor × Express_Faktor
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 12 }}>
                  {[
                    { label:"E1 Founder", factor:"2.5×", rate:"€275/h", color: C.E1 },
                    { label:"E2 Lead",    factor:"1.8×", rate:"€175/h", color: C.E2 },
                    { label:"E3 Senior",  factor:"1.3×", rate:"€112/h", color: C.E3 },
                    { label:"E4 Junior",  factor:"1.0×", rate:"€62/h",  color: C.E4 },
                  ].map(l => (
                    <div key={l.label} style={{ padding: "8px 10px", background: `${l.color}11`, borderRadius: 8, border: `1px solid ${l.color}33` }}>
                      <div style={{ fontSize: 10, color: l.color, fontWeight: 700 }}>{l.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: l.color, fontFamily: "'DM Mono', monospace" }}>{l.factor}</div>
                      <div style={{ fontSize: 10, color: C.muted }}>{l.rate}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* VPE Table */}
              <Card>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 700, marginBottom: 14 }}>
                  INTERNAL VERRECHNUNGSMATRIX — LIVE AGENTS
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Agent","Level","Task Type","Human Hours","Internal Rate","VPE Value","API Cost","Margin"].map(h => (
                        <th key={h} style={{ fontSize: 8, color: C.muted, letterSpacing: 1, textAlign: "left", paddingBottom: 8, fontWeight: 700 }}>{h.toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { agent: AGENTS[0], task:"Strategy Validation", hours:1.5, express: false },
                      { agent: AGENTS[2], task:"Creative Concept",    hours:4.0, express: false },
                      { agent: AGENTS[8], task:"Brand Copy 5x",       hours:3.0, express: false },
                      { agent: AGENTS[9], task:"CGI Key Visual",      hours:2.0, express: true  },
                      { agent: AGENTS[7], task:"Art Direction",        hours:3.5, express: false },
                      { agent: AGENTS[12],task:"Controlling Report",  hours:6.0, express: false },
                      { agent: AGENTS[14],task:"Trend Research",      hours:2.5, express: false },
                      { agent: AGENTS[15],task:"PM Admin",            hours:1.0, express: false },
                    ].map((row, i) => {
                      const vpe = calcVPE(row.agent, row.hours, row.task, row.express);
                      const bg = i % 2 === 0 ? "transparent" : "#ffffff04";
                      return (
                        <tr key={i} style={{ background: bg, borderTop: `1px solid ${C.border}` }}>
                          <td style={{ padding:"8px 0", fontSize: 11, color: C.text }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <Avatar initials={row.agent.avatar} level={row.agent.level} size={22} />
                              <div>
                                <div style={{ fontWeight: 600 }}>{row.agent.name.split(" ")[0]}</div>
                                <div style={{ fontSize: 9, color: C.muted }}>{row.agent.id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"8px 6px" }}>
                            <span style={{ fontSize: 9, padding:"2px 6px", borderRadius:4, background:`${C[row.agent.level]}22`, color:C[row.agent.level], fontWeight:700 }}>
                              {row.agent.level}
                            </span>
                          </td>
                          <td style={{ padding:"8px 6px", fontSize: 11, color: C.muted2 }}>
                            {row.task}
                            {row.express && <span style={{ marginLeft:4, fontSize:8, color:C.orange, background:`${C.orange}22`, padding:"1px 4px", borderRadius:3 }}>EXPRESS +25%</span>}
                          </td>
                          <td style={{ padding:"8px 6px", fontSize:12, color:C.text, fontFamily:"'DM Mono',monospace" }}>{row.hours}h</td>
                          <td style={{ padding:"8px 6px", fontSize:12, color:C.muted2, fontFamily:"'DM Mono',monospace" }}>
                            € {LEVEL_RATES[row.agent.level].hourly * LEVEL_RATES[row.agent.level].quality_factor | 0}/h
                          </td>
                          <td style={{ padding:"8px 6px", fontSize:13, color:C.gold, fontFamily:"'DM Mono',monospace", fontWeight:700 }}>
                            € {Math.round(vpe.vpe_value).toLocaleString("de-DE")}
                          </td>
                          <td style={{ padding:"8px 6px", fontSize:11, color:C.muted, fontFamily:"'DM Mono',monospace" }}>
                            € {vpe.api_cost.toFixed(2)}
                          </td>
                          <td style={{ padding:"8px 6px" }}>
                            <div style={{ fontSize:12, color:C.green, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>
                              {Math.round(vpe.margin)}%
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>

              {/* Ghost Accounting explainer */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
                <Card style={{ borderColor:`${C.teal}33` }}>
                  <div style={{ fontSize: 9, color: C.teal, letterSpacing:1.5, fontWeight:700, marginBottom:10 }}>CLIENT RECORD (EXTERN)</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, lineHeight:2, color:C.muted2 }}>
                    <div><span style={{color:C.text}}>Task:</span> Revision by Senior Lead</div>
                    <div><span style={{color:C.text}}>Rolle:</span> E2 Creative Lead</div>
                    <div><span style={{color:C.text}}>Wert:</span> <span style={{color:C.gold}}>€ 450.00</span></div>
                    <div><span style={{color:C.text}}>Status:</span> <span style={{color:C.green}}>Delivered</span></div>
                  </div>
                </Card>
                <Card style={{ borderColor:`${C.gold}33` }}>
                  <div style={{ fontSize: 9, color: C.gold, letterSpacing:1.5, fontWeight:700, marginBottom:10 }}>BOARD RECORD (INTERN)</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:12, lineHeight:2, color:C.muted2 }}>
                    <div><span style={{color:C.text}}>Task:</span> Revision by Agent E2-01</div>
                    <div><span style={{color:C.text}}>API Cost:</span> <span style={{color:C.red}}>€ 0.02</span></div>
                    <div><span style={{color:C.text}}>Gross Margin:</span> <span style={{color:C.green}}>€ 449.98</span></div>
                    <div><span style={{color:C.text}}>Margin%:</span> <span style={{color:C.green}}>99.9%</span></div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
