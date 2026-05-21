import type { CSSProperties } from "react";
import WidgetLabel from "../shared/Widgetlabel";
import { EVENTS, DAYS_SHORT } from "../../data/dashboard";

const card: CSSProperties = { background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 11, padding: 14 };

export default function CalendarWidget() {
  const today = new Date(2026, 4, 18);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; });

  return (
    <div style={card}>
      <WidgetLabel icon="◈" label="Calendar" badge={`${EVENTS.length} events`} badgeColor="#93C5FD" />
      <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
        {week.map((d, i) => {
          const isToday = d.getDate() === today.getDate();
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 7, color: "#3A3734", letterSpacing: 0.5 }}>{DAYS_SHORT[i].toUpperCase()}</span>
              <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: isToday ? 700 : 400, background: isToday ? "#93C5FD" : "transparent", color: isToday ? "#0A0908" : "#4A4744" }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {EVENTS.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "#3A3734", fontFamily: "'DM Mono', monospace", width: 34, flexShrink: 0 }}>{e.time}</span>
            <div style={{ flex: 1, padding: "5px 8px", borderRadius: 5, background: `${e.color}0C`, borderLeft: `2px solid ${e.color}` }}>
              <span style={{ fontSize: 11, color: "#A8A49E" }}>{e.title}</span>
              <span style={{ fontSize: 8, color: "#3A3734", marginLeft: 6 }}>{e.end}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
