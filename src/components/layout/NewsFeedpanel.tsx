import { useState, useEffect, useRef } from "react";
import type { NewsItem } from "../../types";
import { FALLBACK_NEWS, NEWS_CATEGORIES, CAT_COLORS } from "../../data/dashboard";
import { SECRETS } from "../../config/secrets";
import { getSecret as getSecretFallback } from "../../config/secureStore";

export default function NewsFeedPanel() {
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Resizable width (in px)
  const MIN_W = 210;
  const MAX_W = 560;
  const defaultW = 260;
  const [width, setWidth] = useState<number>(() => {
    try { const v = localStorage.getItem("news-panel-width"); return v ? Number(v) : defaultW; } catch { return defaultW; }
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const REFRESH_INTERVAL = 1000 * 60 * 5;

    async function loadNews() {
      setLoading(true);
      setError(null);

      let key = SECRETS.NEWS_KEY;
      if (!key) key = await getSecretFallback("NEWS_KEY") ?? "";
      if (!key) {
        setError("No News API key configured.");
        setLoading(false);
        return;
      }

      try {
        const apiKey = key;
        let data: any = null;
        let responseOk = false;
        let responseError: string | null = null;
        const isElectronFile = window.location.protocol === "file:" || window.location.protocol === "app:";

        if (window.electron?.news?.fetch) {
          const result = await window.electron.news.fetch({ apiKey, country: "us", pageSize: 12 });
          responseOk = result?.ok === true;
          data = result?.body;
          responseError = result?.error ?? null;

          if (!responseOk && responseError?.toLowerCase().includes("missing news api key")) {
            const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=12&apiKey=${encodeURIComponent(apiKey)}`);
            data = await response.json();
            responseOk = response.ok;
            responseError = data?.message ?? null;
          }
        } else if (isElectronFile) {
          const proxyPort = await window.electron?.news?.proxyPort?.() ?? 42424;
          const proxyUrl = new URL(`http://127.0.0.1:${proxyPort}/news`);
          proxyUrl.searchParams.set("country", "us");
          proxyUrl.searchParams.set("pageSize", "12");
          proxyUrl.searchParams.set("apiKey", apiKey);

          const response = await fetch(proxyUrl.toString());
          data = await response.json();
          responseOk = response.ok;
          responseError = data?.error ?? null;
        } else {
          const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=12&apiKey=${encodeURIComponent(apiKey)}`);
          data = await response.json();
          responseOk = response.ok;
          responseError = data?.message ?? null;
        }

        if (!cancelled) {
          if (responseOk && data?.status === "ok" && Array.isArray(data.articles)) {
            const mapped: NewsItem[] = data.articles.map((item: any) => ({
              title: item.title ?? "Untitled",
              source: item.source?.name ?? "News",
              time: item.publishedAt ? new Date(item.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
              url: item.url ?? "#",
              category: guessCat(`${item.title ?? ""} ${item.description ?? ""}`),
            }));
            setNews(mapped);
            setError(null);
            setLastUpdated(Date.now());
          } else {
            setError(responseError ? `News API error: ${responseError}` : "Unable to load news.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError("Network error while loading news.");
          console.warn("News fetch failed:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNews();
    const interval = window.setInterval(loadNews, REFRESH_INTERVAL);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, []);

  function guessCat(text: string): string {
    const t = text.toLowerCase();
    if (/tech|ai|software|apple|google|microsoft|meta|openai/.test(t)) return "tech";
    if (/market|stock|gdp|inflation|economy|finance|bank/.test(t)) return "finance";
    if (/science|space|climate|health|study|research/.test(t)) return "science";
    if (/war|election|government|minister|president|policy/.test(t)) return "world";
    if (/business|company|startup|ceo|revenue|merger/.test(t)) return "business";
    return "world";
  }

  const filtered = catFilter === "all" ? news : news.filter(n => n.category === catFilter);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const clientX = e.clientX;
      const nw = Math.round(startW.current - (clientX - startX.current));
      const clamped = Math.max(MIN_W, Math.min(MAX_W, nw));
      setWidth(clamped);
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        try { localStorage.setItem("news-panel-width", String(width)); } catch {}
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [width]);

  function handleMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = rootRef.current ? rootRef.current.getBoundingClientRect().width : width;
    e.preventDefault();
  }

  return (
    <div ref={rootRef} className="sidebar right" style={{ width: width, minWidth: MIN_W, maxWidth: MAX_W, height: "100%", background: "#0C0B0A", borderLeft: "1px solid rgba(255,255,255,0.055)", display: "flex", flexDirection: "column", flexShrink: 0, fontSize: 13, position: "relative" }}>
      {/* Drag handle */}
      <div onMouseDown={handleMouseDown} style={{ position: "absolute", left: -8, top: 0, bottom: 0, width: 16, cursor: "col-resize", zIndex: 40 }} />

      <div style={{ padding: "13px 13px 9px", borderBottom: "1px solid rgba(255,255,255,0.04)", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, position: "relative", zIndex: 2, background: "transparent" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4A4744", letterSpacing: 1.5, textTransform: "uppercase" }}>News</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastUpdated && (
              <span style={{ fontSize: 9, color: "#3A3734", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {loading && <span style={{ fontSize: 9, color: "#3A3734", letterSpacing: 0.5 }}>LOADING…</span>}
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: loading ? "#3A3734" : "#6EE7B7", transition: "background 0.5s" }} />
            </div>
          </div>
        </div>
        <div className="no-scrollbar" style={{ display: "flex", gap: 6, overflowX: "visible", paddingBottom: 6, whiteSpace: "normal", flexWrap: "wrap", position: "relative", zIndex: 1, width: "100%", boxSizing: "border-box" }}>
          {NEWS_CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              style={{
                fontSize: 12,
                padding: "4px 6px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flex: "0 1 auto",
                minWidth: 0,
                background: catFilter === c ? `${CAT_COLORS[c] ?? "rgba(255,255,255,0.15)"}22` : "transparent",
                color: catFilter === c ? (CAT_COLORS[c] ?? "#A8A49E") : "#3A3734",
                letterSpacing: 0.5,
                textTransform: "capitalize",
                transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {error && <div style={{ padding: 20, color: "#FC8181", textAlign: "center", fontSize: 12 }}>{error}</div>}
        {!error && filtered.length === 0 && <div style={{ padding: 20, color: "#8A8680", textAlign: "center" }}>No info..</div>}
        {!error && filtered.length > 0 && filtered.map((item, i) => (
          <div
            key={i}
            onClick={() => {
              setSelected(selected === i ? null : i);
              if (item.url !== "#") window.open(item.url, "_blank");
            }}
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              cursor: "pointer",
              background: selected === i ? "rgba(255,255,255,0.03)" : "transparent",
              transition: "background 0.14s",
            }}
          >
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 99, background: `${CAT_COLORS[item.category] ?? "#ffffff"}15`, color: CAT_COLORS[item.category] ?? "#A8A49E", letterSpacing: 0.5, textTransform: "uppercase" }}>{item.category}</span>
            </div>
            <div style={{ fontSize: 12, color: "#A8A49E", lineHeight: 1.45, marginBottom: 5 }}>{item.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#3A3734" }}>{item.source}</span>
              <span style={{ fontSize: 10, color: "#3A3734", fontFamily: "'DM Mono', monospace" }}>{item.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
