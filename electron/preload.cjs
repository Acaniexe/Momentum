const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  secrets: {
    get: (key) => ipcRenderer.invoke("secret-get", key),
    set: (key, value) => ipcRenderer.invoke("secret-set", key, value),
    clear: (key) => ipcRenderer.invoke("secret-clear", key),
  },
  news: {
    fetch: (options) => ipcRenderer.invoke("news-fetch", options),
    proxyPort: () => ipcRenderer.invoke("news-proxy-port"),
  },
  spotify: {
    startAuth: (authUrl, redirectUri) => ipcRenderer.invoke("spotify-start-auth", authUrl, redirectUri),
    onOAuthCallback: (callback) => ipcRenderer.on("spotify-oauth-callback", (_, url) => callback(url)),
  },
  app: {
    isPackaged: () => ipcRenderer.invoke("is-packaged"),
  },
  debug: {
    log: (message) => ipcRenderer.invoke("debug-log", message),
    filePath: () => ipcRenderer.invoke("debug-log-file-path"),
  },
});