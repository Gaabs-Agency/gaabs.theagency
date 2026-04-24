// WorkingHoursWidget.jsx
// STATIC until 31.12.2026 — approved by Rebecca 24.04.2026
// Scope: 3h human work/user/day | 6 users | capacity 8h/user
// DO NOT connect to live API until P1 spec is approved

const STATIC_CONFIG = {
  hoursPerUserPerDay: 3,       // human daily contribution
  capacityPerUser:   8,        // full working day
  totalUsers:        6,
  validUntil:        '31.12.2026',
};

export default function WorkingHoursWidget() {
  const { hoursPerUserPerDay, capacityPerUser, totalUsers, validUntil } = STATIC_CONFIG;

  const totalHumanHours  = hoursPerUserPerDay * totalUsers;   // 18h
  const totalCapacity    = capacityPerUser    * totalUsers;   // 48h
  const utilizationPct   = Math.round((totalHumanHours / totalCapacity) * 100); // 37%
  const aiHours          = totalCapacity - totalHumanHours;  // 30h AI

  return (
    <div style={{
      background: '#141D28',
      border: '1px solid #1E2D3D',
      borderRadius: 12,
      padding: '20px 24px',
      minWidth: 240,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#647485',
        letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase'
      }}>
        Working Hours Today
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: '#E2E8F0', lineHeight: 1 }}>
        {totalHumanHours}h
        <span style={{ fontSize: 14, fontWeight: 400, color: '#647485', marginLeft: 4 }}>
          / {totalCapacity}h total
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        marginTop: 10, height: 6, background: '#1E2D3D',
        borderRadius: 999, overflow: 'hidden'
      }}>
        <div style={{
          width: `${utilizationPct}%`, height: '100%',
          background: 'linear-gradient(90deg, #00C9A7, #3B82F6)',
          borderRadius: 999, transition: 'width 0.4s ease'
        }} />
      </div>

      <div style={{
        marginTop: 10, fontSize: 12, color: '#94A3B8',
        display: 'flex', justifyContent: 'space-between'
      }}>
        <span>👤 {totalUsers} Members × {hoursPerUserPerDay}h</span>
        <span style={{ color: '#00C9A7', fontWeight: 600 }}>{utilizationPct}%</span>
      </div>

      <div style={{
        marginTop: 8, fontSize: 11, color: '#647485',
        borderTop: '1px solid #1E2D3D', paddingTop: 8,
        display: 'flex', justifyContent: 'space-between'
      }}>
        <span>🤖 AI: {aiHours}h delegiert</span>
        <span>Static bis {validUntil}</span>
      </div>
    </div>
  );
}
