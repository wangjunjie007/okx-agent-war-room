# OKX Agent Trade Kit · AI War Room

A multi-agent trading command center built around the idea that trading AI should work like a coordinated desk — not a single chatbot.

## What it does

This project turns a trading mission into a multi-agent workflow:

- **Intel Agent** — reads market narrative and momentum
- **Chain Agent** — inspects flow, trades, basis, and derivatives proxies
- **Strategy Agent** — turns signals into tactical paths
- **Risk Agent** — applies execution guardrails
- **Execution Agent** — converts consensus into an Execution Bridge plan
- **Review Agent** — writes the final mission conclusion and replay archive

## Current release

The repo is now a **final demo-ready MVP**:

- modular backend app/router layout
- six independent backend agent modules
- richer OKX public market inputs:
  - spot ticker
  - swap ticker / basis
  - candles
  - order book imbalance
  - recent trades buy ratio
  - open interest
  - funding rate
- persisted mission runs and replay frames
- frontend mission archive with one-click replay
- execution bridge panel with routes / guardrails / triggers
- signal scoring engine for direction / confidence / action suggestion
- simplified backtest preview over recent hourly candles
- execution simulator with entry / stop / targets / notional cap / reward-risk
- live multi-asset watchlist (BTC / ETH / SOL / OKB)
- strategy leaderboard derived from historical runs
- dashboard widgets for score + backtest edge + simulator outputs

## Stack

- Frontend: vanilla HTML/CSS/JS modules
- Backend: Node.js + Express
- Data: OKX public market endpoints
- Storage: JSON files under `data/runs/`

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:8848/
```

## API

### Health

`GET /api/health`

### Build mission plan

`POST /api/mission/plan`

### Market watchlist

`GET /api/market/watchlist`

### Strategy leaderboard

`GET /api/analytics/leaderboard`

### Create persisted mission run

`POST /api/mission/runs`

### List mission runs

`GET /api/mission/runs`

### Get mission run

`GET /api/mission/runs/:id`

### Get mission run events

`GET /api/mission/runs/:id/events`

### Get replay frames

`GET /api/mission/runs/:id/replay`

### Get analytics bundle

`GET /api/mission/runs/:id/analytics`

Body:

```json
{
  "mission": "Monitor ETH sentiment and flow, then prepare a low-risk staged execution plan.",
  "mode": "alpha"
}
```

## Repo layout

```text
public/
  app.js
  js/
    api.js
    constants.js
src/
  agents/
  lib/
  routes/
  app.js
  server.js
```

## Notes

The execution layer still produces structured execution plans rather than real orders. That keeps the repo safe to run publicly while preserving the end-to-end coordination model.

The score / backtest / simulator modules are **decision-support layers**, not live trading promises. They are intentionally lightweight, explainable, and safe to demo publicly.

## License

MIT
