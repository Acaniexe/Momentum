import { useEffect, useMemo, useState } from "react";
import {
  clearSpotifySession,
  getSpotifyAccessToken,
  handleSpotifyCallback,
  startSpotifySignIn,
} from "../../config/spotifyAuth";

type TrackState = {
  title: string;
  artist: string;
  durationMs: number;
  progressMs: number;
  playing: boolean;
  albumArtUrl?: string;
  device?: string;
};

export default function SpotifyWidget() {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [message, setMessage] = useState<string | null>(null);
  const [track, setTrack] = useState<TrackState | null>(null);
  const [liked, setLiked] = useState(false);

  const isConnected = status === "connected";
  const showPlayback = isConnected && track !== null;

  const formattedProgress = useMemo(() => {
    if (!track) return 0;
    return Math.min(100, Math.max(0, (track.progressMs / track.durationMs) * 100));
  }, [track]);

  const cardStyle = {
    width: "100%",
    minWidth: 280,
    maxWidth: 520,
    padding: 24,
    borderRadius: 22,
    background: "rgba(255,255,255,0.022)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
  } as const;

  const controlButton = {
    all: "unset",
    cursor: "pointer",
    width: 34,
    height: 34,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    display: "grid",
    placeItems: "center",
    color: "#F0EDE8",
  } as const;

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  async function fetchPlayback() {
    try {
      const token = await getSpotifyAccessToken();
      if (!token) {
        setStatus("disconnected");
        setTrack(null);
        return;
      }

      const response = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 204) {
        setTrack(null);
        setStatus("connected");
        setMessage("No active Spotify playback detected.");
        return;
      }

      if (!response.ok) {
        if (response.status === 401) {
          setStatus("disconnected");
          setTrack(null);
          setMessage("Spotify session expired. Please reconnect.");
          await clearSpotifySession();
          return;
        }

        const errorData = await response.json().catch(() => null);
        setMessage(errorData?.error?.message ?? "Failed to load Spotify playback.");
        setTrack(null);
        return;
      }

      const data = await response.json();
      const item = data.item;
      if (!item) {
        setTrack(null);
        setStatus("connected");
        setMessage("No track is currently playing.");
        return;
      }

      setTrack({
        title: item.name,
        artist: item.artists?.map((a: any) => a.name).join(", ") ?? "Unknown artist",
        durationMs: item.duration_ms,
        progressMs: data.progress_ms ?? 0,
        playing: data.is_playing ?? false,
        albumArtUrl: item.album?.images?.[0]?.url,
        device: data.device?.name,
      });
      setStatus("connected");
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setTrack(null);
      setStatus("disconnected");
    }
  }

  async function sendPlayerCommand(method: string, endpoint: string) {
    const token = await getSpotifyAccessToken();
    if (!token) {
      setStatus("disconnected");
      setTrack(null);
      return;
    }

    await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setTimeout(fetchPlayback, 500);
  }

  useEffect(() => {
    async function init() {
      setMessage(null);
      try {
        const callback = await handleSpotifyCallback();
        if (callback?.error) {
          setMessage(callback.error);
        }

        await fetchPlayback();
      } catch (error) {
        setStatus("disconnected");
        setMessage(error instanceof Error ? error.message : String(error));
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (!track?.playing) return;
    const timer = window.setInterval(() => {
      setTrack((current) => {
        if (!current) return current;
        const nextProgress = Math.min(current.durationMs, current.progressMs + 1000);
        if (nextProgress >= current.durationMs) {
          fetchPlayback();
        }
        return { ...current, progressMs: nextProgress };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [track?.playing]);

  useEffect(() => {
    if (status !== "connected") return;
    const interval = window.setInterval(fetchPlayback, 10000);
    return () => window.clearInterval(interval);
  }, [status]);

  const onConnect = async () => {
    setMessage(null);
    try {
      await startSpotifySignIn();
      await fetchPlayback();
      setMessage("Spotify connected successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const onDisconnect = async () => {
    await clearSpotifySession();
    setStatus("disconnected");
    setTrack(null);
    setMessage("Spotify session cleared.");
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E4DE", marginBottom: 4 }}>Now Playing</div>
        </div>
        {!isConnected ? (
          <button
            onClick={onConnect}
            style={{ background: "#1DB954", color: "#000", border: "none", borderRadius: 999, padding: "10px 18px", cursor: "pointer", fontWeight: 700, minWidth: 120 }}
          >
            Connect
          </button>
        ) : null}
      </div>

      {showPlayback ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", background: "linear-gradient(135deg, #1a3a2a, #0d1f16)", boxShadow: track.playing ? "0 0 12px rgba(29,185,84,0.22)" : "none", transition: "box-shadow 0.4s" }}>
              {track.albumArtUrl ? (
                <img src={track.albumArtUrl} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                "♪"
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#E8E4DE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
              <div style={{ fontSize: 10, color: "#4A4744", marginTop: 1 }}>{track.artist}</div>
            </div>
            <button
              onClick={() => setLiked((prev) => !prev)}
              style={{ background: "none", border: "none", fontSize: 13, color: liked ? "#F87171" : "#3A3734", cursor: "pointer", padding: "0 2px" }}
            >
              {liked ? "♥" : "♡"}
            </button>
          </div>

          <div
            style={{ height: 2, background: "rgba(255,255,255,0.07)", borderRadius: 99, cursor: "pointer", marginBottom: 3 }}
          >
            <div style={{ height: "100%", width: `${formattedProgress}%`, background: "#1DB954", borderRadius: 99, transition: "width 0.3s" }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 8, color: "#3A3734", fontFamily: "'DM Mono', monospace" }}>{formatTime(track.progressMs)}</span>
            <span style={{ fontSize: 8, color: "#3A3734", fontFamily: "'DM Mono', monospace" }}>{formatTime(track.durationMs)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <button onClick={() => sendPlayerCommand("POST", "previous")} style={controlButton}>⏮</button>
            <button
              onClick={() => sendPlayerCommand(track.playing ? "PUT" : "PUT", track.playing ? "pause" : "play")}
              style={{
                ...controlButton,
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#1DB954",
                color: "#000",
                fontSize: 13,
                boxShadow: track.playing ? "0 0 12px rgba(29,185,84,0.38)" : "none",
                transition: "box-shadow 0.3s",
              }}
            >
              {track.playing ? "⏸" : "▶"}
            </button>
            <button onClick={() => sendPlayerCommand("POST", "next")} style={controlButton}>⏭</button>
          </div>
        </>
      ) : (
        <div style={{ padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 14, color: "#F0EDE8", marginBottom: 8 }}>No Spotify playback available.</div>
          <div style={{ fontSize: 12, color: "#C8C5C1" }}>
            {isConnected
              ? "Start playing a song in Spotify or open Spotify on one of your devices to control it here."
              : "Connect your Spotify account to see now playing information."}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, color: "#C8C5C1", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 10 }}>
        {isConnected ? (
          <button
            onClick={onDisconnect}
            style={{ background: "rgba(255,255,255,0.04)", color: "#F0EDE8", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "10px 18px", cursor: "pointer", alignSelf: "center" }}
          >
            Disconnect
          </button>
        ) : null}
        {message ? <div style={{ color: "#F3B53D" }}>{message}</div> : null}
      </div>
    </div>
  );
}
