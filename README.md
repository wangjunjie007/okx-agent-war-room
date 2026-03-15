# OKX Agent Trade Kit · AI War Room

A multi-agent trading command center built around the idea that trading AI should work like a coordinated desk — not a single chatbot.

## What it does

This project turns a trading mission into a multi-agent workflow:

- **Intel Agent** — reads market narrative and momentum
- **Flow Agent** — inspects order-book / flow proxy signals
- **Strategy Agent** — turns signals into tactical paths
- **Risk Agent** — applies execution guardrails
- **Execution Agent** — converts consensus into an OKX execution playbook
- **Review Agent** — writes the final mission conclusion

The current release is a **working open-source MVP**:
- browser UI for the War Room
- backend mission engine
- live market snapshot from OKX public market APIs
- generated multi-agent plan, execution path, and conclusion summary

## Stack

- Frontend: vanilla HTML/CSS/JS
- Backend: Node.js + Express
- Data: OKX public market endpoints

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

Body:

```json
{
  "mission": "Monitor ETH sentiment and flow, then prepare a low-risk staged execution plan.",
  "mode": "alpha"
}
```

## Notes

This repository intentionally separates:
- **mission orchestration**
- **agent reasoning layers**
- **execution playbook generation**
- **presentation layer**

The execution layer currently generates structured execution plans and guardrails rather than sending real orders. That keeps the repo safe to run publicly while preserving the complete end-to-end coordination model.

## Why this project exists

Most trading AI tools answer questions. This project explores a different idea:

> the future trading interface is not one model giving one answer —
> it is a team of AI agents coordinating analysis, risk, execution, and review.

## License

MIT
