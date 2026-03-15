# Architecture

## Frontend
- `public/index.html`: War Room shell and panels
- `public/app.js`: runtime orchestration, polling, replay playback, archive interactions
- `public/js/api.js`: API client helpers
- `public/js/constants.js`: agent definitions for UI rendering

## Backend
- `src/app.js`: Express app bootstrap
- `src/routes/api.js`: mission / replay API surface
- `src/lib/okx.js`: OKX public market data adapter
- `src/lib/mission-engine.js`: multi-agent orchestration entry
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
4. Mission engine runs six backend agents independently
5. Execution Bridge is assembled from strategy + risk consensus
6. Run engine persists:
   - run object
   - events
   - stage timeline
   - replay frames
7. Frontend polls live state and can later replay archived runs

## Stage 3 additions
- backend modularization into app/router/agent/service layers
- frontend JS modularization
- richer data-source coverage beyond ticker+candles
- execution bridge abstraction for future exchange integration
- replay API + archive UI for mission history playback

## Design principle
The system is structured so the execution bridge can later be swapped with a real broker/exchange adapter without rewriting the UI or the six-agent mission model.
