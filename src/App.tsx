import { useEffect, useState } from "react";
import type { Task } from "./types";
import { SEED_TASKS } from "./data/dashboard";
import TopBar from "./components/layout/TopBar";
import NewsFeedPanel from "./components/layout/NewsFeedpanel";
import TodoWidget from "./components/widgets/TodoWidget";
import PomodoroWidget from "./components/widgets/PomodoroWidget";
import SpotifyWidget from "./components/widgets/Spotify";

export default function ProductivityManager() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem("momentum-tasks");
      return raw ? (JSON.parse(raw) as Task[]) : SEED_TASKS;
    } catch {
      return SEED_TASKS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("momentum-tasks", JSON.stringify(tasks));
    } catch {
      // ignore write errors
    }
  }, [tasks]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { min-height: 100%; height: 100%; min-width: 100%; width: 100%; overflow: hidden; background: #0A0908; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 99px; }
        ::-webkit-scrollbar-horizontal { height: 0; }
        @keyframes blink { 50% { opacity: 0; } }
        input, select, button { font-family: inherit; }
        input::placeholder { color: #3A3734; }

        .widget-grid {
          width: 100%;
          max-width: 960px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        @media (max-width: 840px) {
          .widget-grid {
            grid-template-columns: 1fr;
            max-width: 560px;
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh", minWidth: "100vw", display: "flex", flexDirection: "column", background: "#0A0908", fontFamily: "'Outfit', sans-serif", color: "#F0EDE8", overflow: "hidden" }}>
        <TopBar />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            <div className="widget-grid">
              <TodoWidget tasks={tasks} setTasks={setTasks} />
              <PomodoroWidget tasks={tasks} />
              <SpotifyWidget />
            </div>
          </div>

          <NewsFeedPanel />
        </div>
      </div>
    </>
  );
}
