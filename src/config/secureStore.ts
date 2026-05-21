// Abstraction over secret storage. When running inside Electron with a preload
// that exposes `window.electron.secrets`, it will use that (keytar-backed in main).
// In the browser (dev) it falls back to localStorage, then to Vite env vars.

import { SECRETS } from "./secrets";

export async function getSecret(key: string): Promise<string | null> {
  try {
    if (window?.electron?.secrets?.get) {
      const value = await window.electron.secrets.get(key);
      if (value) return value;
    }
  } catch (e) {
    // ignore and fallback
  }

  try {
    const v = localStorage.getItem(`momentum.secret.${key}`);
    if (v) return v;
  } catch {
    // ignore and fallback
  }

  return (SECRETS as Record<string, string>)[key] ?? null;
}

export async function setSecret(key: string, value: string): Promise<boolean> {
  try {
    if (window?.electron?.secrets?.set) {
      return await window.electron.secrets.set(key, value);
    }
  } catch (e) {
    // ignore and fallback
  }

  try {
    localStorage.setItem(`momentum.secret.${key}`, value);
    return true;
  } catch {
    return false;
  }
}

export async function clearSecret(key: string): Promise<boolean> {
  try {
    if (window?.electron?.secrets?.set) {
      // no direct delete API in preload — set empty
      await window.electron.secrets.set(key, "");
      return true;
    }
  } catch {}

  try {
    localStorage.removeItem(`momentum.secret.${key}`);
    return true;
  } catch {
    return false;
  }
}

export default { getSecret, setSecret, clearSecret };
