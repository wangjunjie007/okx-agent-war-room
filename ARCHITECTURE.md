# Architecture

## Frontend
- `public/index.html`: War Room shell and panels
- `public/app.js`: runtime orchestration, polling, replay playback, archive interactions, score/backtest widgets
- `public/js/api.js`: API client helpers
- `public/js/constants.js`: agent definitions for UI rendering

## Backend
- `src/app.js`: Express app bootstrap
- `src/routes/api.js`: mission / replay / analytics API surface
- `src/lib/okx.js`: OKX public market data adapter
- `src/lib/mission-engine.js`: multi-agent orchestration entry
- `src/lib/analytics.js`: signal scoring + simplified backtest preview
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
5. Mission engine runs six backend agents independently
6. Execution Bridge is assembled from strategy + risk consensus
7. Run engine persists:
   - run object
   - events
   - stage timeline
   - replay frames
8. Frontend polls live state and can later replay archived runs

## Stage 4 additions
- score engine for confidence-based signal framing
- simplified backtest preview for recent candles
- analytics API bundle per run
- dashboard widgets for score / direction / action / win rate / drawdown
- archive summary now includes score context

## Design principle
The system is structured so the execution bridge can later be swapped with a real broker/exchange adapter without rewriting the UI or the six-agent mission model.

The analytics layer is intentionally lightweight and interpretable, making it a safe public demo surface before any future real-order integration.
