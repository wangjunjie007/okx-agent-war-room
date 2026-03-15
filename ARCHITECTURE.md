# Architecture

## Frontend
- Single-page War Room UI in `public/index.html`
- Visualizes:
  - multi-agent cards
  - command routing
  - live comms stream
  - execution and risk summaries

## Backend
- `src/server.js`: HTTP server + static host + API
- `src/lib/okx.js`: OKX public market data adapter
- `src/lib/mission-engine.js`: mission orchestration + agent outputs

## Runtime flow
1. User submits a mission from the UI
2. Frontend calls `POST /api/mission/plan`
3. Backend fetches OKX market snapshot
4. Mission engine converts snapshot into:
   - intel view
   - flow view
   - strategy path
   - risk stance
   - execution playbook
   - final conclusion
5. Frontend replays the mission inside the War Room UI

## Design principle
This project is intentionally structured so the execution layer can later be replaced with real broker / exchange actions while keeping the UI and agent roles stable.


## Stage 2 additions
- persisted run objects in `data/runs/*.json`
- backend async run engine for multi-agent mission progression
- frontend polling-based playback of live run state
- run history and event replay API surface
