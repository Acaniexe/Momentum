# Momentum

A focused productivity dashboard built with React, TypeScript, Vite, and Electron. Momentum combines a Pomodoro timer, task management, weather, news, and Spotify integration into a sleek, distraction-free interface.

## Features

- **Task Management**: Create, prioritize (High/Medium/Low), and track tasks with persistent storage
- **Pomodoro Timer**: Focus sessions with automatic breaks (25min focus → 5min break → 15min long break)
- **Weather Widget**: Real-time weather updates from OpenWeatherMap
- **News Sidebar**: Categorized news feed with auto-refresh every 5 minutes
- **Spotify Integration**: Connect your Spotify account and control playback directly
- **Quote Ticker**: Inspirational quotes that rotate every 14 seconds
- **Frameless Window**: Custom draggable topbar with app info panel
- **Resizable Panels**: Adjust sidebar width and persist preference to localStorage

## Prerequisites

- **Node.js** 18+ and npm
- **Spotify API credentials** (optional, for Spotify widget): https://developer.spotify.com/dashboard
- **OpenWeatherMap API key** (optional, for weather): https://openweathermap.org/api
- **NewsAPI key** (optional, for news): https://newsapi.org

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Momentum
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your API keys:
     ```
     VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
     VITE_WEATHER_KEY=your_openweathermap_key
     VITE_NEWS_KEY=your_newsapi_key
     VITE_QUOTES_KEY=optional_quotes_api_key
     ```

## Usage

### Development

Start the Vite dev server and Electron app:
```bash
npm run electron:dev
```

This will:
- Launch Vite on `http://localhost:5173` (or auto-increment if port is in use)
- Open the Electron app with DevTools
- Enable hot module reloading

### Build

Create a production build:
```bash
npm run build
```

Outputs optimized assets to `dist/`.

### Build Executable

Package the app as a Windows portable executable:
```bash
npm run electron:build
```

Outputs `.exe` to `dist/`.

### Linting

Check code quality:
```bash
npm lint
```

## Configuration

### Environment Variables

- `VITE_SPOTIFY_CLIENT_ID`: Spotify OAuth client ID
- `VITE_WEATHER_KEY`: OpenWeatherMap API key (currently hardcoded to London)
- `VITE_NEWS_KEY`: NewsAPI key
- `VITE_QUOTES_KEY`: Unused placeholder

### Secrets Storage

- **Development**: Secrets are stored in `localStorage` (browser fallback)
- **Production**: Secrets are stored in `~/.config/Momentum/secrets.json` (secure Electron storage via IPC)

Spotify refresh tokens are automatically persisted and refreshed as needed.

### News Refresh Interval

Edit `src/components/layout/NewsFeedpanel.tsx`:
```typescript
const REFRESH_INTERVAL = 1000 * 60 * 5;  // 5 minutes (change to 1000 * 60 for 1 minute)
```

### Pomodoro Timings

Edit `src/data/dashboard.tsx`:
```typescript
export const POM_DURATIONS: Record<PomMode, number> = { 
  focus: 25 * 60,   // 25 minutes
  short: 5 * 60,    // 5 minutes
  long: 15 * 60     // 15 minutes
};
```

## Project Structure

```
src/
├── App.tsx                          # Root component with task state
├── main.tsx                         # React entry point
├── index.css                        # Global styles
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx              # Header with clock, weather, quotes
│   │   └── NewsFeedpanel.tsx       # News sidebar with resizing
│   ├── shared/
│   │   ├── Div.tsx                 # Divider component
│   │   └── Widgetlabel.tsx         # Widget header label
│   └── widgets/
│       ├── TodoWidget.tsx          # Task management
│       ├── PomodoroWidget.tsx      # Pomodoro timer
│       ├── Calendar.tsx            # Placeholder
│       └── Spotify.tsx             # Spotify player control
├── config/
│   ├── spotifyAuth.ts              # OAuth flow & token management
│   ├── secureStore.ts              # Electron IPC secret storage
│   └── secrets.ts                  # Env var mapping
├── data/
│   └── dashboard.tsx               # Constants (quotes, durations, etc.)
└── types/
    ├── global.d.ts                 # Global type definitions
    └── index.ts                    # Task, NewsItem, etc.

electron/
├── main.js                         # Electron main process
├── preload.js                      # Context bridge for secrets IPC
└── (auto-generated on build)

public/
└── Momentum.ico                    # App icon

.env.example                        # Environment template
tsconfig.json                       # TypeScript config
vite.config.ts                      # Vite config
package.json                        # Dependencies & scripts
```

## Technologies

- **Frontend**: React 19, TypeScript, CSS-in-JS
- **Build Tool**: Vite
- **Desktop**: Electron 42
- **State**: React hooks (useState, useEffect, useRef)
- **APIs**: Spotify Web API, OpenWeatherMap, NewsAPI
- **Storage**: localStorage, Electron secure storage

## Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app and get your Client ID
3. Add redirect URI: `http://localhost:5173/auth/spotify/callback` (dev) or your deployed URL
4. Set `VITE_SPOTIFY_CLIENT_ID` in `.env.local`
5. Click "Connect" in the app to authorize

Refresh tokens are stored securely and renewed automatically.

## Troubleshooting

### White screen on launch
- Ensure `npm run dev` starts Vite on port 5173+ before Electron loads
- Check DevTools console (auto-opens in dev) for errors
- Verify all env vars are set in `.env.local`

### News not updating
- Confirm `VITE_NEWS_KEY` is set and valid
- Check the "Updated" timestamp in the news panel header
- Default refresh is every 5 minutes—see Configuration section to adjust

### Weather always shows London
- Currently hardcoded; to change, edit the `fetch` call in `src/components/layout/TopBar.tsx`

### Spotify won't connect
- Verify redirect URI matches your app's callback handler
- Check Client ID is correct in `.env.local`
- Clear browser cache and try again

## Build & Deployment

### Windows Executable

```bash
npm run electron:build
```

Outputs `dist/Momentum-0.1.0.exe` (portable, no installer needed).

## License

MIT (or your preferred license)

## Author

Momentum Team

---

**Version**: 0.1.0  
**Last Updated**: May 2026
