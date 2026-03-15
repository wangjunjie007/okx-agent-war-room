# Architecture

## Frontend
- `public/index.html`: War Room shell and panels
- `public/app.js`: runtime orchestration, polling, replay playback, archive interactions, watchlist refresh, leaderboard refresh, score/backtest/simulator widgets
- `public/js/api.js`: API client helpers
- `public/js/constants.js`: agent definitions for UI rendering

## Backend
- `src/app.js`: Express app bootstrap
- `src/routes/api.js`: mission / replay / analytics / market API surface
- `src/lib/okx.js`: OKX public market data adapter + watchlist snapshots
- `src/lib/mission-engine.js`: multi-agent orchestration entry
- `src/lib/analytics.js`: signal scoring + simplified backtest preview + execution simulator + leaderboard summaries
- `src/lib/execution-bridge.js`: execution bridge builder
- `src/lib/replay.js`: replay frame serializer
- `src/lib/run-engine.js`: async mission progression + persisted replay frames
- `src/lib/store.js`: JSON run storage layer
- `src/agents/*.js`: six specialized backend agent modules

## Runtime flow
1. User submits a mission from the UI
2. Frontend calls `POST /api/mission/runs`
3. Backend fetches a richer OKX snapshot:
   - spot ticker
   - swap ticker
   - candles
   - order book
   - recent trades
   - open interest
   - funding rate
4. Analytics layer derives:
   - signal score
   - direction / confidence / action
   - simplified hourly backtest preview
   - execution simulator suggestions
5. Mission engine runs six backend agents independently
6. Execution Bridge is assembled from strategy + risk consensus + simulator context
7. Run engine persists:
   - run object
   - events
   - stage timeline
   - replay frames
8. Frontend polls live state, refreshes watchlist/leaderboard, and can replay archived runs

## Final-version additions
- live watchlist API and UI strip for multi-asset monitoring
- leaderboard API and UI for comparing historical runs
- execution simulator for entry / stop / targets / notional guidance
- archive summaries enriched with signal score + pnl context
- dashboard upgraded into a more coherent product-style demo surface

## Design principle
The system is structured so the execution bridge can later be swapped with a real broker/exchange adapter without rewriting the UI or the six-agent mission model.

The analytics layer remains intentionally lightweight and interpretable, making it suitable for public demos, product storytelling, and later expansion toward more advanced research or execution systems.
