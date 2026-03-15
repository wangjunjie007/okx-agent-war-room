# Architecture

## Frontend
- `public/index.html`: War Room shell and panels
- `public/app.js`: runtime orchestration, polling, replay playback, archive interactions, watchlist, leaderboard, score/backtest/simulator widgets
- `public/js/api.js`: API client helpers
- `public/js/constants.js`: agent definitions for UI rendering

## Backend
- `src/app.js`: Express app bootstrap
- `src/routes/api.js`: mission / replay / analytics / watchlist API surface
- `src/lib/okx.js`: OKX public market data adapter + watchlist snapshots
- `src/lib/mission-engine.js`: multi-agent orchestration entry
- `src/lib/analytics.js`: signal scoring + simplified backtest preview + execution simulator + leaderboard summarizer
- `src/lib/execution-bridge.js`: execution bridge builder
- `src/lib/replay.js`: replay frame serializer
- `src/lib/run-engine.js`: async mission progression + persisted replay frames
- `src/lib/store.js`: JSON run storage layer
- `src/agents/*.js`: six specialized backend agent modules

## Runtime flow
1. User submits a mission from the UI
2. Frontend refreshes live market watchlist and historical leaderboard in the background
3. Frontend calls `POST /api/mission/runs`
4. Backend fetches a richer OKX snapshot:
   - spot ticker
   - swap ticker
   - candles
   - order book
   - recent trades
   - open interest
   - funding rate
5. Analytics layer derives:
   - signal score
   - direction / confidence / action
   - simplified hourly backtest preview
   - execution simulator (entry / stop / target / notional / RR)
6. Mission engine runs six backend agents independently
7. Execution Bridge is assembled from strategy + risk consensus + simulator context
8. Run engine persists:
   - run object
   - events
   - stage timeline
   - replay frames
9. Frontend polls live state and can later replay archived runs or inspect leaderboard results

## Final demo additions
- live watchlist panel for multi-asset market context
- leaderboard from saved runs for comparative storytelling
- execution simulator to make the war room feel closer to a trading operating system
- richer archive summary with score + backtest edge
- dashboard-level metrics that are investor/demo friendly

## Design principle
The system is structured so the execution bridge can later be swapped with a real broker/exchange adapter without rewriting the UI or the six-agent mission model.

The analytics layer is intentionally lightweight and interpretable, making it a safe public demo surface before any future real-order integration.
