import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildMissionPlan } from './lib/mission-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const app = express();
const port = process.env.PORT || 8848;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'okx-agent-war-room', time: new Date().toISOString() });
});

app.post('/api/mission/plan', async (req, res) => {
  try {
    const mission = String(req.body?.mission || '').trim() || 'Monitor ETH sentiment and flow, then prepare a low-risk staged execution plan.';
    const mode = String(req.body?.mode || 'alpha').trim() || 'alpha';
    const plan = await buildMissionPlan({ mission, mode });
    res.json({ ok: true, plan });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || String(error) });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`okx-agent-war-room listening on http://127.0.0.1:${port}`);
});
