// Helper to centralize access to local environment secrets.
// Usage:
// - Copy `.env.example` -> `.env.local` at the project root
// - Fill the `VITE_...` values there (these are loaded by Vite locally)
// - Use `import { SECRETS, getSecret } from './config/secrets'` in your app
// NOTE: Do NOT commit `.env.local`. For production, proxy requests through a server
// and keep secret keys on the server side — exposing secret API keys in client
// applications is insecure.

export const SECRETS = {
  NEWS_KEY: (import.meta.env.VITE_NEWS_KEY ?? "") as string,
  SPOTIFY_CLIENT_ID: (import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? import.meta.env.VITE_SPOTIFY_KEY ?? "") as string,
  WEATHER_KEY: (import.meta.env.VITE_WEATHER_KEY ?? "") as string,
  QUOTES_KEY: (import.meta.env.VITE_QUOTES_KEY ?? "") as string,
};

export function getSecret(key: keyof typeof SECRETS) {
  return SECRETS[key];
}

export function requireSecret(key: keyof typeof SECRETS) {
  const v = getSecret(key);
  if (!v) throw new Error(`Missing required secret: ${key}`);
  return v;
}

export default SECRETS;
