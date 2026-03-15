import express from 'express';
import { buildReplayFrames } from '../lib/replay.js';
import { buildMissionPlan } from '../lib/mission-engine.js';
import { createAndStartRun } from '../lib/run-engine.js';
import { listRuns, loadRun } from '../lib/store.js';

export function createApiRouter() {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'okx-agent-war-room', time: new Date().toISOString() });
  });

  router.get('/mission/runs', (req, res) => {
    const limit = Number(req.query.limit || 20);
    res.json({ ok: true, runs: listRuns(limit) });
  });

  router.get('/mission/runs/:id', (req, res) => {
    const run = loadRun(req.params.id);
    if (!run) return res.status(404).json({ ok: false, error: 'Run not found' });
    res.json({ ok: true, run });
  });

  router.get('/mission/runs/:id/events', (req, res) => {
    const run = loadRun(req.params.id);
    if (!run) return res.status(404).json({ ok: false, error: 'Run not found' });
    res.json({ ok: true, events: run.events || [] });
  });

  router.get('/mission/runs/:id/replay', (req, res) => {
    const run = loadRun(req.params.id);
    if (!run) return res.status(404).json({ ok: false, error: 'Run not found' });
    res.json({ ok: true, replay: buildReplayFrames(run) });
  });

  router.get('/mission/runs/:id/analytics', (req, res) => {
    const run = loadRun(req.params.id);
    if (!run) return res.status(404).json({ ok: false, error: 'Run not found' });
    res.json({
      ok: true,
      analytics: {
        signalScore: run.plan?.signalScore || null,
        backtest: run.plan?.backtest || null,
        executionBridge: run.plan?.executionBridge || null
      }
    });
  });

  router.post('/mission/runs', async (req, res) => {
    try {
      const mission = String(req.body?.mission || '').trim() || 'Monitor ETH sentiment and flow, then prepare a low-risk staged execution plan.';
      const mode = String(req.body?.mode || 'alpha').trim() || 'alpha';
      const run = await createAndStartRun({ mission, mode });
      res.status(201).json({ ok: true, run });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  router.post('/mission/plan', async (req, res) => {
    try {
      const mission = String(req.body?.mission || '').trim() || 'Monitor ETH sentiment and flow, then prepare a low-risk staged execution plan.';
      const mode = String(req.body?.mode || 'alpha').trim() || 'alpha';
      const plan = await buildMissionPlan({ mission, mode });
      res.json({ ok: true, plan });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message || String(error) });
    }
  });

  return router;
}
