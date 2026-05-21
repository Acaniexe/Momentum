import { getSecret, setSecret, clearSecret } from "./secureStore";

const SPOTIFY_CLIENT_ID_KEY = "SPOTIFY_CLIENT_ID";
const SPOTIFY_TOKEN_KEY = "SPOTIFY_TOKEN";
const SPOTIFY_REFRESH_KEY = "SPOTIFY_REFRESH_TOKEN";
const SPOTIFY_EXPIRES_KEY = "SPOTIFY_TOKEN_EXPIRES";
const SPOTIFY_REDIRECT_URI_KEY = "momentum.spotify.redirect_uri";
const SPOTIFY_PKCE_VERIFIER = "momentum.spotify.pkce_verifier";
const SPOTIFY_PKCE_STATE = "momentum.spotify.state";
const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

const SPOTIFY_SCOPES = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-private",
  "user-read-email",
].join(" ");

function randomString(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return window.crypto.subtle.digest("SHA-256", data);
}

function getRedirectUris() {
  const raw = ((import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? "") as string).trim();
  const defaultUris = [
    "http://127.0.0.1:5173/callback",
    "http://127.0.0.1:8888/callback",
  ];
  if (!raw) {
    return defaultUris;
  }

  const list = raw.split(/[,;\s]+/).map((uri) => uri.trim()).filter(Boolean);
  if (list.length === 0) {
    return defaultUris;
  }

  const normalized = list[0];
  if (defaultUris.includes(normalized)) {
    return [normalized, ...defaultUris.filter((uri) => uri !== normalized)];
  }
  return list;
}

function getStoredRedirectUri(): string {
  const stored = localStorage.getItem(SPOTIFY_REDIRECT_URI_KEY);
  if (stored) return stored;
  return getRedirectUris()[0];
}

async function saveTokenResponse(data: any) {
  await setSecret(SPOTIFY_TOKEN_KEY, data.access_token);
  if (data.refresh_token) {
    await setSecret(SPOTIFY_REFRESH_KEY, data.refresh_token);
  }

  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  await setSecret(SPOTIFY_EXPIRES_KEY, String(expiresAt));
}

export async function startSpotifySignIn() {
  const clientId = await getSecret(SPOTIFY_CLIENT_ID_KEY);
  if (!clientId) {
    throw new Error("Missing Spotify Client ID.");
  }

  const verifier = randomString(128);
  const electronBridgeAvailable = !!window.electron?.spotify?.startAuth;
  console.log("[Spotify] startSpotifySignIn", { clientIdExists: !!clientId, electronBridgeAvailable });
  window.electron?.debug?.log?.(`[Spotify] startSpotifySignIn clientIdExists=${!!clientId} electronBridgeAvailable=${electronBridgeAvailable}`);
  const challenge = base64UrlEncode(await sha256(verifier));
  const state = randomString(24);

  localStorage.setItem(SPOTIFY_PKCE_VERIFIER, verifier);
  localStorage.setItem(SPOTIFY_PKCE_STATE, state);

  const redirectUris = getRedirectUris();
  console.log("[Spotify] available redirectUris", redirectUris);
  let lastError: string | null = null;

  for (const redirectUri of redirectUris) {
    console.log("[Spotify] attempting redirectUri", redirectUri);
    window.electron?.debug?.log?.(`[Spotify] attempting redirectUri ${redirectUri}`);
    localStorage.setItem(SPOTIFY_REDIRECT_URI_KEY, redirectUri);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: SPOTIFY_SCOPES,
      show_dialog: "true",
    });

    const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
    if (window.electron?.spotify?.startAuth) {
      const result = await window.electron.spotify.startAuth(authUrl, redirectUri) as SpotifyElectronAuthResult | null;
      if (!result || ("cancelled" in result && result.cancelled)) {
        throw new Error("Spotify login was cancelled.");
      }
      if ("error" in result) {
        const description = typeof result.error_description === "string" ? `: ${result.error_description}` : "";
        const message = `${result.error}${description}`;
        console.warn("[Spotify] startAuth returned error", { message, redirectUri, result });
        lastError = message;
        if (/callback server|EADDRINUSE|port.*in use|redirect uri/i.test(message) && redirectUris.length > 1) {
          continue;
        }
        throw new Error(message);
      }
      if (!("code" in result) || !result.code) {
        throw new Error("Spotify returned no authorization code.");
      }

      return await exchangeSpotifyCode(result.code, verifier);
    }

    window.location.href = authUrl;
    return new Promise(() => {});
  }

  throw new Error(lastError ?? "Spotify login failed.");
}

function clearSpotifyCallbackParams() {
  const pathname = window.location.pathname === "/callback" ? "/" : window.location.pathname;
  window.history.replaceState({}, "", pathname);
}

type SpotifyCallbackResult = { accessToken?: string; error?: string };

type SpotifyElectronAuthResult =
  | { cancelled: true }
  | { error: string; error_description?: string }
  | { code: string; state?: string; [key: string]: string | undefined };

export async function handleSpotifyCallback(): Promise<SpotifyCallbackResult | null> {
  const query = new URLSearchParams(window.location.search);
  const code = query.get("code");
  const error = query.get("error");
  const errorDescription = query.get("error_description");
  const state = query.get("state");

  if (!code && !error) {
    return null;
  }

  const storedState = localStorage.getItem(SPOTIFY_PKCE_STATE);
  const verifier = localStorage.getItem(SPOTIFY_PKCE_VERIFIER);
  console.log("[Spotify] handleSpotifyCallback", { code, error, errorDescription, state, storedState, verifier });
  window.electron?.debug?.log?.(`[Spotify] handleSpotifyCallback code=${code ?? "null"} error=${error ?? "null"} state=${state ?? "null"} storedState=${storedState ? "present" : "missing"} verifier=${verifier ? "present" : "missing"}`);
  localStorage.removeItem(SPOTIFY_PKCE_STATE);
  localStorage.removeItem(SPOTIFY_PKCE_VERIFIER);
  clearSpotifyCallbackParams();

  if (error) {
    const redirectUri = getStoredRedirectUri();
    const description = errorDescription ? `: ${errorDescription}` : "";
    return {
      error: `Spotify callback failed (${error}${description}). Add ${redirectUri} to your Spotify app redirect URIs.`,
    };
  }

  if (!code || !state || state !== storedState || !verifier) {
    console.warn("Spotify callback failed", { error, code, state, storedState, verifier });
    return { error: "Spotify callback validation failed. Please try again." };
  }

  try {
    const accessToken = await exchangeSpotifyCode(code, verifier);
    return { accessToken };
  } catch (err) {
    console.warn("Spotify code exchange failed", err);
    return { error: `Spotify token exchange failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}

async function exchangeSpotifyCode(code: string, verifier: string) {
  const clientId = await getSecret(SPOTIFY_CLIENT_ID_KEY);
  if (!clientId) {
    throw new Error("Missing Spotify Client ID.");
  }
  const redirectUri = getStoredRedirectUri();
  console.log("[Spotify] exchangeSpotifyCode", { code, redirectUri });
  window.electron?.debug?.log?.(`[Spotify] exchangeSpotifyCode code=${code} redirectUri=${redirectUri}`);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getStoredRedirectUri(),
    client_id: clientId,
    code_verifier: verifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? "Spotify token exchange failed");
  }

  await saveTokenResponse(data);
  return data.access_token as string;
}

export async function getSpotifyAccessToken(): Promise<string | null> {
  const token = await getSecret(SPOTIFY_TOKEN_KEY);
  const expires = Number(await getSecret(SPOTIFY_EXPIRES_KEY) ?? "0");

  if (token && Date.now() < expires - 60_000) {
    return token;
  }

  const refreshToken = await getSecret(SPOTIFY_REFRESH_KEY);
  if (!refreshToken) {
    return token;
  }

  try {
    return await refreshSpotifyToken(refreshToken);
  } catch (err) {
    console.warn("Spotify refresh failed", err);
    return token;
  }
}

async function refreshSpotifyToken(refreshToken: string) {
  const clientId = await getSecret(SPOTIFY_CLIENT_ID_KEY);
  if (!clientId) {
    throw new Error("Missing Spotify Client ID.");
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? "Spotify refresh failed");
  }

  await saveTokenResponse({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? refreshToken,
    expires_in: data.expires_in,
  });
  return data.access_token as string;
}

export async function clearSpotifySession(): Promise<void> {
  await clearSecret(SPOTIFY_TOKEN_KEY);
  await clearSecret(SPOTIFY_REFRESH_KEY);
  await clearSecret(SPOTIFY_EXPIRES_KEY);
}
