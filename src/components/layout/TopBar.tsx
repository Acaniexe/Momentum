import { useState, useEffect, useCallback, type CSSProperties } from "react";
import Div from "../shared/Div";
import { QUOTES, DAYS_SHORT, MONTHS, VERSION, MADE_BY } from "../../data/dashboard";
import { SECRETS } from "../../config/secrets";

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");

  return (
    <div style={{ textAlign: "right", lineHeight: 1 }}>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: "#F0EDE8", letterSpacing: 2 }}>
        {hh}<span style={{ opacity: 0.3, animation: "blink 1s step-end infinite" }}>:</span>{mm}
      </div>
      <div style={{ fontSize: 9, color: "#4A4744", letterSpacing: 1, marginTop: 3, textTransform: "uppercase" }}>
        {DAYS_SHORT[now.getDay()]}, {MONTHS[now.getMonth()].slice(0,3)} {now.getDate()}
      </div>
    </div>
  );
}

function WeatherChip() {
  const [unit, setUnit] = useState<"C"|"F">("C");
  const [tempC, setTempC] = useState<number | null>(17);
  const [desc, setDesc] = useState<string | null>(null);

  useEffect(() => {
    const key = SECRETS.WEATHER_KEY;
    if (!key) return;
    // simple fetch to OpenWeatherMap (metric)
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=London&units=metric&appid=${encodeURIComponent(key)}`)
      .then(r => r.json())
      .then((data) => {
        if (data && data.main && typeof data.main.temp === "number") {
          setTempC(Math.round(data.main.temp));
          setDesc(data.weather && data.weather[0] && data.weather[0].description ? data.weather[0].description : null);
        }
      }).catch(() => {});
  }, []);

  const temp = tempC === null ? "--" : (unit === "C" ? `${tempC}` : `${Math.round((tempC * 9) / 5 + 32)}`);

  return (
      <div style={{ WebkitAppRegion: "no-drag", display: "flex", alignItems: "center", gap: 8 } as CSSProperties}>
      <span style={{ fontSize: 16 }}>⛅</span>
      <div style={{ lineHeight: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 17, fontWeight: 500, color: "#E8E4DE" }}>{temp}</span>
          <button
            onClick={() => setUnit(u => u === "C" ? "F" : "C")}
            onMouseDown={e => e.currentTarget.blur()}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#55524E", padding: 0, fontFamily: "inherit", outline: "none", boxShadow: "none", WebkitAppearance: "none" }}
            aria-label="Toggle temperature unit"
          >
            °{unit}
          </button>
        </div>
        <div style={{ fontSize: 8, color: "#4A4744", letterSpacing: 0.7, marginTop: 2 }}>{desc ? desc.toUpperCase() : "LONDON"}</div>
      </div>
    </div>
  );
}

function QuoteTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const next = useCallback(() => {
    setVisible(false);
    setTimeout(() => { setIdx(i => (i + 1) % QUOTES.length); setVisible(true); }, 280);
  }, []);

  useEffect(() => { const id = setInterval(next, 14000); return () => clearInterval(id); }, [next]);
  const q = QUOTES[idx];
  const quoteStyle: any = { WebkitAppRegion: "no-drag", flex: 1, overflow: "hidden", cursor: "pointer", opacity: visible ? 1 : 0, transition: "opacity 0.28s", display: "flex", alignItems: "center", gap: 8, minWidth: 0 };

  return (
    <div onClick={next} title="Click for next" style={quoteStyle}>
      <span style={{ fontSize: 16, color: "#2A2724", fontFamily: "Georgia, serif", flexShrink: 0, lineHeight: 1 }}>
        "
      </span>
      <span style={{ fontSize: 11, color: "#6B6762", fontFamily: "Georgia, serif", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {q.text}
      </span>
      <span style={{ fontSize: 9, color: "#3A3734", fontFamily: "Georgia, serif", flexShrink: 0 }}>
        — {q.author}
      </span>
    </div>
  );
}

export default function TopBar() {
  const [showVersion, setShowVersion] = useState(false);
  const containerStyle: any = { WebkitAppRegion: "drag", height: 46, background: "#0C0B0A", borderBottom: "1px solid rgba(255,255,255,0.055)", display: "flex", alignItems: "center", padding: "0 18px", gap: 16, flexShrink: 0, zIndex: 10 };
  const logoWrapperStyle: any = { WebkitAppRegion: "no-drag", position: "relative", display: "inline-block", flexShrink: 0 };
  const popupStyle: any = { position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#0C0B0A", color: "#E8E4DE", padding: "10px 12px", borderRadius: 8, fontSize: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.6)", minWidth: 200 };

  return (
    <div style={containerStyle}>
      <div style={logoWrapperStyle} onMouseEnter={() => setShowVersion(true)} onMouseLeave={() => setShowVersion(false)}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: "#252320", textTransform: "uppercase" }}>MOMENTUM</span>
        {showVersion && (
          <div style={popupStyle}>
            <div style={{ fontSize: 11, color: "#C8C5C1", marginBottom: 6 }}>App Info</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}></div>
            <div style={{ fontSize: 12, color: "#D8D4CE", marginBottom: 4 }}><strong>Version:</strong> {VERSION}</div>
            <div style={{ fontSize: 12, color: "#D8D4CE" }}><strong>Made by:</strong> {MADE_BY}</div>
          </div>
        )}
      </div>
      <Div />
      <QuoteTicker />
      <Div />
      <WeatherChip />
      <Div />
      <LiveClock />
    </div>
  );
}
