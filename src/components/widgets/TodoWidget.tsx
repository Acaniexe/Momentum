import { useState, useRef, useEffect } from "react";
import type { CSSProperties, Dispatch, SetStateAction } from "react";
import type { Task } from "../../types";
import WidgetLabel from "../shared/Widgetlabel";

const card: CSSProperties = { background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 11, padding: 14 };
const inp: CSSProperties = { flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#A8A49E", fontSize: 12, outline: "none" };
const priorityButton: CSSProperties = { minWidth: 92, padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.04)", color: "#A8A49E", fontSize: 12, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" };
const dropdownMenu: CSSProperties = { position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, borderRadius: 10, background: "rgba(10,9,8,0.95)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 18px 45px rgba(0,0,0,0.35)", zIndex: 20 };
const optionStyle: CSSProperties = { width: "100%", padding: "10px 12px", border: "none", background: "transparent", color: "#F0EDE8", textAlign: "left", cursor: "pointer", fontSize: 12 };

export default function TodoWidget({ tasks, setTasks }: { tasks: Task[]; setTasks: Dispatch<SetStateAction<Task[]>> }) {
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("mid");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const PC: Record<Task["priority"], string> = { high: "#F87171", mid: "#FCD34D", low: "#6EE7B7" };
  const priorityLabel: Record<Task["priority"], string> = { high: "High", mid: "Medium", low: "Low" };
  const remaining = tasks.filter(t => !t.done).length;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (open && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const add = () => {
    if (!input.trim()) return;
    setTasks(ts => [...ts, { id: Date.now(), text: input.trim(), done: false, priority }]);
    setInput("");
  };

  return (
    <div style={card}>
      <WidgetLabel icon="✓" label="Tasks" badge={remaining ? `${remaining} open` : "all done"} badgeColor="#6EE7B7" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add a task…" style={inp} />
        <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setOpen(o => !o)} style={{ ...priorityButton, color: PC[priority], fontWeight: 600 }}>
            <span>{priorityLabel[priority]}</span>
            <span style={{ marginLeft: 8, opacity: 0.65 }}>▾</span>
          </button>
          {open && (
            <div style={dropdownMenu}>
              {(Object.keys(priorityLabel) as Task["priority"][]).map((option) => (
                <button
                  key={option}
                  onClick={() => { setPriority(option); setOpen(false); }}
                  style={{
                    ...optionStyle,
                    color: PC[option],
                    background: option === priority ? "rgba(255,255,255,0.08)" : "transparent"
                  }}
                >
                  {priorityLabel[option]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={add} style={{ width: 36, height: 36, borderRadius: 12, border: "none", background: "#6EE7B7", color: "#0A0908", fontWeight: 700, fontSize: 18, cursor: "pointer", flexShrink: 0 }}>+</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {tasks.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 8px", borderRadius: 7, background: t.done ? "transparent" : "rgba(255,255,255,0.025)", border: `1px solid ${t.done ? "transparent" : "rgba(255,255,255,0.045)"}`, transition: "all 0.2s" }}>
            <button onClick={() => setTasks(ts => ts.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} style={{ width: 14, height: 14, borderRadius: 3, cursor: "pointer", flexShrink: 0, border: `1.5px solid ${PC[t.priority]}`, background: t.done ? PC[t.priority] : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#0A0908" }}>{t.done ? "✓" : ""}</button>
            <span style={{ flex: 1, fontSize: 12, color: t.done ? "#3A3734" : "#A8A49E", textDecoration: t.done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</span>
            <span style={{ fontSize: 8, color: PC[t.priority], opacity: t.done ? 0.25 : 0.7, flexShrink: 0 }}>{t.priority}</span>
            <button onClick={() => setTasks(ts => ts.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: "#3A3734", cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
