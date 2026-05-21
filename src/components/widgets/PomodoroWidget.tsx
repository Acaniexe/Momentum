import { useState, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { Task } from "../../types";
import WidgetLabel from "../shared/Widgetlabel";
import { POM_DURATIONS, POM_LABELS, POM_COLORS } from "../../data/dashboard";

const card: CSSProperties = { background: "rgba(255,255,255,0.022)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 11, padding: 14 };
const ctrl: CSSProperties = { width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "none", color: "#6B6762", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

export default function PomodoroWidget({ tasks }: { tasks: Task[] }) {
  const [mode, setMode] = useState<"focus" | "short" | "long">("focus");
  const [secondsLeft, setSecondsLeft] = useState(POM_DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [focusTask, setFocusTask] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = POM_DURATIONS[mode];
  const pct = ((total - secondsLeft) / total) * 100;
  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  const accent = POM_COLORS[mode];
  const statusLabel = mode === "focus" ? "Focus session" : mode === "short" ? "Short break" : "Long break";

  const switchMode = (m: "focus" | "short" | "long") => { setMode(m); setSecondsLeft(POM_DURATIONS[m]); setRunning(false); };
  const reset = () => { setSecondsLeft(POM_DURATIONS[mode]); setRunning(false); };

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (mode === "focus") {
            setSessions(n => n + 1);
            const nextMode = ((sessions + 1) % 4 === 0) ? "long" : "short";
            setMode(nextMode);
            setSecondsLeft(POM_DURATIONS[nextMode]);
          } else {
            setMode("focus");
            setSecondsLeft(POM_DURATIONS.focus);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, sessions]);

  const openTasks = tasks.filter(t => !t.done);

  return (
    <div style={card}>
      <WidgetLabel icon="◎" label="Pomodoro" badge={sessions > 0 ? `${sessions} session${sessions > 1 ? "s" : ""}` : undefined} badgeColor={accent} />
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {(["focus", "short", "long"] as const).map(m => (
          <button key={m} onClick={() => switchMode(m)} style={{
            flex: 1,
            padding: "4px 0",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: 0.5,
            background: mode === m ? `${POM_COLORS[m]}18` : "transparent",
            color: mode === m ? POM_COLORS[m] : "#3A3734",
            borderBottom: mode === m ? `1.5px solid ${POM_COLORS[m]}` : "1.5px solid transparent",
            transition: "all 0.15s",
          }}>{POM_LABELS[m]}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "relative", width: 110, height: 110 }}>
          <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="55" cy="55" r={44} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
            <circle cx="55" cy="55" r={44} fill="none" stroke={accent} strokeWidth="5" strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 - (pct / 100) * 2 * Math.PI * 44} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s linear, stroke 0.3s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 500, color: "#F0EDE8", letterSpacing: 2, lineHeight: 1 }}>{mm}:{ss}</span>
            <span style={{ fontSize: 8, color: "#4A4744", marginTop: 3, letterSpacing: 0.5 }}>{POM_LABELS[mode].toUpperCase()}</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: 10, color: accent, marginBottom: 12 }}>{statusLabel}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={reset} style={{ ...ctrl, fontSize: 10 }}>↺</button>
        <button onClick={() => setRunning(r => !r)} style={{ ...ctrl, width: 40, height: 40, borderRadius: "50%", background: running ? `${accent}22` : accent, color: running ? accent : "#0A0908", fontSize: 14, border: running ? `1.5px solid ${accent}` : "none", boxShadow: running ? `0 0 14px ${accent}44` : "none", transition: "all 0.2s" }}>
          {running ? "⏸" : "▶"}
        </button>
        <button onClick={() => switchMode(mode === "focus" ? "short" : "focus")} style={{ ...ctrl, fontSize: 9 }}>⏭</button>
      </div>
      {openTasks.length > 0 && (
        <div>
          <div style={{ fontSize: 8, color: "#3A3734", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Focusing on</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {openTasks.slice(0, 3).map(t => (
              <button key={t.id} onClick={() => setFocusTask(focusTask === t.id ? null : t.id)} style={{
                textAlign: "left",
                padding: "5px 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: focusTask === t.id ? `${accent}15` : "rgba(255,255,255,0.025)",
                borderLeft: `2px solid ${focusTask === t.id ? accent : "transparent"}`,
                fontSize: 11,
                color: focusTask === t.id ? "#D8D4CE" : "#5A5754",
                transition: "all 0.15s",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>{t.text}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
