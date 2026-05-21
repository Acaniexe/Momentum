import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import { createServer } from "node:http";
import express from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const preloadPath = join(__dirname, "preload.cjs");
const secretFile = join(app.getPath("userData"), "secrets.json");
const debugLogFile = join(app.getPath("userData"), "spotify-debug.log");

let pendingProtocolUrl = null;

function dispatchProtocolUrl(url) {
  writeDebugLog(`[Spotify] dispatchProtocolUrl ${url}`);
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("spotify-oauth-callback", url);
    pendingProtocolUrl = null;
    return true;
  }
  pendingProtocolUrl = url;
  return false;
}

const NEWS_PROXY_HOST = "127.0.0.1";
const NEWS_PROXY_PORT = 42424;
let activeNewsProxyPort = NEWS_PROXY_PORT;

async function createNewsProxy() {
  const proxyApp = express();

  proxyApp.get("/news", async (req, res) => {
    let apiKey = String(req.query.apiKey ?? "").trim();
    if (!apiKey) {
      apiKey = await getSecret("NEWS_KEY");
    }
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: "No News API key configured." });
    }

    const country = String(req.query.country ?? "us");
    const pageSize = Number(req.query.pageSize ?? 12);
    const result = await fetchNews({ apiKey, country, pageSize });

    if (!result.ok) {
      return res.status(result.status ?? 500).json({ ok: false, error: result.error ?? "News proxy request failed." });
    }

    return res.status(200).json(result.body);
  });

  return new Promise((resolve, reject) => {
    const server = proxyApp.listen(NEWS_PROXY_PORT, NEWS_PROXY_HOST, () => {
      activeNewsProxyPort = server.address()?.port ?? NEWS_PROXY_PORT;
      console.log(`News proxy listening on http://${NEWS_PROXY_HOST}:${activeNewsProxyPort}`);
      resolve(server);
    });

    server.on("error", async (err) => {
      if (err?.code === "EADDRINUSE") {
        const fallback = proxyApp.listen(0, NEWS_PROXY_HOST, () => {
          activeNewsProxyPort = fallback.address()?.port ?? NEWS_PROXY_PORT;
          console.log(`News proxy fallback listening on http://${NEWS_PROXY_HOST}:${activeNewsProxyPort}`);
          resolve(fallback);
        });
        fallback.on("error", reject);
      } else {
        reject(err);
      }
    });
  });
}

function getNewsProxyPort() {
  return activeNewsProxyPort;
}

async function readSecrets() {
  try {
    const content = await fs.readFile(secretFile, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function appendDebugLog(entry) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} - ${entry}\n`;
  await fs.mkdir(dirname(debugLogFile), { recursive: true });
  await fs.appendFile(debugLogFile, line, "utf8");
}

async function writeDebugLog(entry) {
  console.log(entry);
  try {
    await appendDebugLog(typeof entry === "string" ? entry : JSON.stringify(entry));
  } catch (err) {
    console.error("Failed to write debug log:", err);
  }
}

async function writeDebugLogFilePath() {
  return debugLogFile;
}

async function writeSecrets(data) {
  await fs.mkdir(dirname(secretFile), { recursive: true });
  await fs.writeFile(secretFile, JSON.stringify(data, null, 2), "utf8");
}

async function getSecret(key) {
  const data = await readSecrets();
  return data[key] ?? null;
}

async function setSecret(key, value) {
  const data = await readSecrets();
  data[key] = value;
  await writeSecrets(data);
  return true;
}

async function clearSecret(key) {
  const data = await readSecrets();
  delete data[key];
  await writeSecrets(data);
  return true;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    frame: false,
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    icon: join(__dirname, "../public/Momentum.ico"),
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (pendingProtocolUrl) {
      writeDebugLog(`[Spotify] dispatching pending protocol callback after ready: ${pendingProtocolUrl}`);
      dispatchProtocolUrl(pendingProtocolUrl);
    }
  });

  if (app.isPackaged) {
    mainWindow.loadFile(join(__dirname, "../dist/index.html"));
    // Enable DevTools temporarily in packaged build for OAuth debugging
    //try { mainWindow.webContents.openDevTools({ mode: "detach" }); } catch (e) {}
  } else {
    // Try to detect the active Vite dev server port (in case it auto-incremented)
    const http = await import('node:http');
    async function probePort(port) {
      const hosts = ['127.0.0.1', 'localhost'];
      for (const host of hosts) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await new Promise((resolve) => {
          const req = http.request({ method: 'HEAD', host, port, path: '/', timeout: 800 }, (res) => { res.destroy(); resolve(true); });
          req.on('error', () => resolve(false));
          req.on('timeout', () => { req.destroy(); resolve(false); });
          req.end();
        });
        if (ok) return true;
      }
      return false;
    }

    let foundPort = null;
    for (let p = 5173; p <= 5185; p++) {
      // prefer localhost/127.0.0.1 tests
      // try both localhost and 127.0.0.1 indirectly by probing the port on 127.0.0.1
      // since Vite binds to localhost, probing 127.0.0.1 should succeed in most cases
      // if a port responds, use it
      // eslint-disable-next-line no-await-in-loop
      const ok = await probePort(p);
      if (ok) { foundPort = p; break; }
    }

    if (!foundPort) {
      const fallback = 'http://localhost:5173';
      console.error('No dev server detected on ports 5173-5180, falling back to', fallback);
      mainWindow.loadURL(fallback).catch(err => console.error('loadURL error', err));
    } else {
      const devURL = `http://localhost:${foundPort}`;
      console.log('Loading dev server at', devURL);
      mainWindow.loadURL(devURL).catch(err => console.error('loadURL error', err));
    }

    // open DevTools in development for debugging white-screen issues
    /*try { mainWindow.webContents.openDevTools({ mode: "detach" }); } catch (e) {}
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('did-fail-load', { errorCode, errorDescription, validatedURL });
    });*/
  }

  // Prevent navigation on OAuth callback URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('momentum://')) {
      event.preventDefault();
      writeDebugLog(`[Spotify] prevented navigation to ${url}`);
    }
  });
}

async function fetchNews(options = {}) {
  const { apiKey = "", country = "us", pageSize = 12 } = options;
  if (!apiKey) {
    return { ok: false, error: "Missing News API key." };
  }

  const url = new URL("https://newsapi.org/v2/top-headlines");
  url.searchParams.set("country", country);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("apiKey", apiKey);

  try {
    const response = await fetch(url.toString());
    const body = await response.json();
    return { ok: response.ok, status: response.status, body, error: body?.message ?? null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function createBrowserAuthWindow(authUrl, redirectUri) {
  const redirectURL = new URL(redirectUri);
  const useLocalHttpCallback = redirectURL.protocol === "http:" && ["127.0.0.1", "localhost"].includes(redirectURL.hostname);
  const useExternalBrowser = !useLocalHttpCallback;
  writeDebugLog(`[Spotify] createBrowserAuthWindow authUrl=${authUrl} redirectUri=${redirectUri} useLocalHttpCallback=${useLocalHttpCallback} useExternalBrowser=${useExternalBrowser}`);

  return new Promise((resolve) => {
    let authWindow = null;
    let finished = false;
    let server = null;

    const cleanup = () => {
      if (server) {
        try {
          server.close();
        } catch {}
        server = null;
      }
      if (authWindow && !authWindow.isDestroyed()) {
        authWindow.close();
      }
      authWindow = null;
    };

    const finish = (result) => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve(result);
    };

    const targetUrl = new URL(redirectUri);
    const targetOrigin = targetUrl.origin;
    const targetPathname = targetUrl.pathname;

    const tryResolve = (url) => {
      if (finished || typeof url !== "string") return false;
      let maybeUrl;
      try {
        maybeUrl = new URL(url, redirectUri);
      } catch (err) {
        console.warn("[Spotify] tryResolve invalid URL", { url, err });
        writeDebugLog(`[Spotify] tryResolve invalid URL ${url} - ${err instanceof Error ? err.message : String(err)}`);
        return false;
      }

      console.log("[Spotify] tryResolve", { url, origin: maybeUrl.origin, pathname: maybeUrl.pathname, targetOrigin, targetPathname });
      writeDebugLog(`[Spotify] tryResolve ${url} origin=${maybeUrl.origin} pathname=${maybeUrl.pathname} targetOrigin=${targetOrigin} targetPathname=${targetPathname}`);
      if (maybeUrl.origin !== targetOrigin || maybeUrl.pathname !== targetPathname) return false;

      const params = Object.fromEntries(maybeUrl.searchParams.entries());
      console.log("[Spotify] callback matched", { params });
      writeDebugLog(`[Spotify] callback matched ${JSON.stringify(params)}`);
      finish(params);
      return true;
    };

    const startServer = () => {
      server = createServer((req, res) => {
        try {
          const requestUrl = new URL(req.url ?? "", redirectUri);
          writeDebugLog(`[Spotify] callback request ${req.method} ${req.url} parsed=${requestUrl.toString()} pathname=${requestUrl.pathname}`);
          if (requestUrl.pathname !== redirectURL.pathname) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not Found");
            return;
          }

          const params = Object.fromEntries(requestUrl.searchParams.entries());
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spotify Login Complete</title></head><body style="font-family:system-ui, sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#101010;color:#f3f3f3;"><h1>Spotify login complete</h1><p>You can safely close this window.</p></body></html>`);
          tryResolve(requestUrl.toString());
        } catch (err) {
          console.error("Spotify callback server error:", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Callback error");
          }
        }
      });

      server.on("error", (err) => {
        console.error("Spotify callback server error:", err);
        writeDebugLog(`[Spotify] callback server error ${err instanceof Error ? err.message : String(err)}`);
        finish({ error: `Spotify callback server error: ${err.message}` });
      });

      const listenHost = ["127.0.0.1", "localhost"].includes(redirectURL.hostname)
        ? undefined
        : redirectURL.hostname;
      writeDebugLog(`[Spotify] startServer listening host=${listenHost ?? "default"} port=${redirectURL.port} redirectUri=${redirectUri}`);
      server.listen(Number(redirectURL.port), listenHost, () => {
        console.log(`Spotify callback server listening on ${redirectUri}`);
        writeDebugLog(`Spotify callback server listening on ${redirectUri}`);
      });
    };

    const createWaitingWindow = (message) => {
      if (authWindow && !authWindow.isDestroyed()) {
        return authWindow;
      }
      authWindow = new BrowserWindow({
        width: 500,
        height: 360,
        resizable: false,
        autoHideMenuBar: true,
        show: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      authWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spotify Login</title></head><body style="font-family:system-ui, sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#101010;color:#f3f3f3;text-align:center;"><h1>${message}</h1><p>Please complete the login in the browser window that opened.</p><p>If the browser does not open, copy and paste the URL manually.</p></body></html>`)}`);
      authWindow.on("closed", () => {
        if (!finished) {
          finish({ cancelled: true });
        }
      });
      return authWindow;
    };

    if (useLocalHttpCallback) {
      console.log("[Spotify] opening external browser for auth", { authUrl, redirectUri });
      writeDebugLog(`[Spotify] opening external browser for auth redirectUri=${redirectUri}`);
      startServer();
      shell.openExternal(authUrl).then(() => {
        console.log("[Spotify] shell.openExternal succeeded");
        writeDebugLog("[Spotify] shell.openExternal succeeded");
      }).catch((err) => {
        console.error("Failed to open browser for Spotify auth:", err);
        writeDebugLog(`[Spotify] Failed to open browser for Spotify auth: ${err instanceof Error ? err.message : String(err)}`);
        finish({ error: `Failed to open browser for Spotify auth: ${err.message}` });
      });
      createWaitingWindow("Spotify login opened in your browser");
    } else if (useExternalBrowser) {
      console.log("[Spotify] opening external browser for auth", { authUrl, redirectUri });
      writeDebugLog(`[Spotify] opening external browser for auth redirectUri=${redirectUri}`);
      shell.openExternal(authUrl).then(() => {
        console.log("[Spotify] shell.openExternal succeeded");
        writeDebugLog("[Spotify] shell.openExternal succeeded");
      }).catch((err) => {
        console.error("Failed to open browser for Spotify auth:", err);
        writeDebugLog(`[Spotify] Failed to open browser for Spotify auth: ${err instanceof Error ? err.message : String(err)}`);
        finish({ error: `Failed to open browser for Spotify auth: ${err.message}` });
      });
      createWaitingWindow("Spotify login opened in your browser");
    } else {
      console.log("[Spotify] opening embedded auth window", { authUrl, redirectUri });
      writeDebugLog(`[Spotify] opening embedded auth window redirectUri=${redirectUri}`);
      authWindow = new BrowserWindow({
        width: 520,
        height: 700,
        resizable: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const filter = { urls: [`${redirectUri}*`] };
      authWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
        tryResolve(details.url);
        callback({ cancel: false });
      });

      authWindow.webContents.on("will-redirect", (event, url) => {
        if (tryResolve(url)) {
          event.preventDefault();
        }
      });
      authWindow.webContents.on("will-navigate", (event, url) => {
        if (tryResolve(url)) event.preventDefault();
      });
      authWindow.webContents.on("did-navigate", (_event, url) => {
        tryResolve(url);
      });
      authWindow.webContents.on("did-navigate-in-page", (_event, url) => {
        tryResolve(url);
      });
      authWindow.webContents.on("did-finish-load", () => {
        if (authWindow) {
          tryResolve(authWindow.webContents.getURL());
        }
      });

      authWindow.on("closed", () => {
        if (!finished) {
          finish({ cancelled: true });
        }
      });
      authWindow.loadURL(authUrl).catch((err) => {
        if (!finished) {
          finish({ error: err instanceof Error ? err.message : String(err) });
        }
      });
    }
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.whenReady().then(async () => {
  // remove the default application menu (no toolbar/menu)
  try { Menu.setApplicationMenu(null); } catch {}

  // Register custom protocol handler for packaged app OAuth
  if (app.isPackaged) {
    app.setAsDefaultProtocolClient("momentum");
  }

  try {
    await createNewsProxy();
  } catch (err) {
    console.error("Failed to start News proxy:", err);
  }
  writeDebugLog(`Electron ready. isPackaged=${app.isPackaged} userData=${app.getPath("userData")}`);

  ipcMain.handle("secret-get", (_event, key) => getSecret(key));
  ipcMain.handle("secret-set", (_event, key, value) => setSecret(key, value));
  ipcMain.handle("secret-clear", (_event, key) => clearSecret(key));
  ipcMain.handle("news-fetch", (_event, options) => fetchNews(options));
  ipcMain.handle("news-proxy-port", () => getNewsProxyPort());
  ipcMain.handle("spotify-start-auth", (_event, authUrl, redirectUri) => createBrowserAuthWindow(authUrl, redirectUri));
  ipcMain.handle("debug-log", (_event, message) => writeDebugLog(message));
  ipcMain.handle("debug-log-file-path", () => writeDebugLogFilePath());
  ipcMain.handle("is-packaged", () => app.isPackaged);

  if (process.platform === "win32") {
    const initialUrl = process.argv.find((arg) => typeof arg === "string" && arg.startsWith("momentum://"));
    if (initialUrl) {
      writeDebugLog(`[Spotify] initial Windows protocol URL: ${initialUrl}`);
      pendingProtocolUrl = initialUrl;
    }
  }

  createWindow().catch(err => console.error('createWindow error', err));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handle custom protocol URL (momentum://callback?code=...&state=...)
app.on("open-url", (event, url) => {
  event.preventDefault();
  writeDebugLog(`[Spotify] open-url event: ${url}`);
  if (!dispatchProtocolUrl(url)) {
    writeDebugLog(`[Spotify] queued protocol callback until window is ready: ${url}`);
  }
});

app.on("second-instance", (_event, argv) => {
  const protocolUrl = argv.find((arg) => typeof arg === "string" && arg.startsWith("momentum://"));
  if (protocolUrl) {
    writeDebugLog(`[Spotify] second-instance protocol: ${protocolUrl}`);
    dispatchProtocolUrl(protocolUrl);
  }
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
