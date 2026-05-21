interface WidgetLabelProps {
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: string;
}

export default function WidgetLabel({ icon, label, badge, badgeColor }: WidgetLabelProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
      <span style={{ fontSize: 10, color: badgeColor ?? "#4A4744" }}>{icon}</span>
      <span style={{ fontSize: 8, fontWeight: 700, color: "#3A3734", letterSpacing: 1.5, textTransform: "uppercase" }}>{label}</span>
      {badge && <span style={{ fontSize: 7, color: badgeColor, background: `${badgeColor}18`, padding: "2px 6px", borderRadius: 99 }}>{badge}</span>}
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.04)" }} />
    </div>
  );
}
