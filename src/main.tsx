import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Emit a startup debug log (if preload exposes the debug bridge)
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wnd = window as any;
  const bridgePresent = !!wnd.electron;
  wnd.electron?.debug?.log?.(`[Renderer] startup bridgePresent=${bridgePresent} location=${window.location.href}`);
  // report stored redirect URI if present
  try {
    const stored = localStorage.getItem('momentum.spotify.redirect_uri');
    if (stored) wnd.electron?.debug?.log?.(`[Renderer] storedRedirectUri=${stored}`);
  } catch {}
} catch {}
