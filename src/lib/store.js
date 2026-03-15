import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const runsDir = path.join(dataDir, 'runs');

fs.mkdirSync(runsDir, { recursive: true });

function runPath(id) {
  return path.join(runsDir, `${id}.json`);
}

export function createRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function saveRun(run) {
  const payload = {
    ...run,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(runPath(run.id), JSON.stringify(payload, null, 2));
  return payload;
}

export function loadRun(id) {
  const p = runPath(id);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function listRuns(limit = 20) {
  return fs.readdirSync(runsDir)
    .filter(name => name.endsWith('.json'))
    .map(name => JSON.parse(fs.readFileSync(path.join(runsDir, name), 'utf8')))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, limit);
}

export function appendEvent(id, event) {
  const run = loadRun(id);
  if (!run) throw new Error(`Run not found: ${id}`);
  run.events = run.events || [];
  run.events.push({
    ts: new Date().toISOString(),
    ...event
  });
  return saveRun(run);
}

export function patchRun(id, patch) {
  const run = loadRun(id);
  if (!run) throw new Error(`Run not found: ${id}`);
  Object.assign(run, patch);
  return saveRun(run);
}
