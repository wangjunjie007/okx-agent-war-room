export const AGENTS = [
  { key: 'intel', role: '情报总监', lane: 'left', theme: 'intel' },
  { key: 'chain', role: '链上侦察官', lane: 'left', theme: 'chain' },
  { key: 'strategy', role: '策略指挥官', lane: 'right', theme: 'strategy' },
  { key: 'risk', role: '风控总监', lane: 'right', theme: 'risk' },
  { key: 'exec', role: '执行官', lane: 'right', theme: 'exec' },
  { key: 'review', role: '复盘官', lane: 'left', theme: 'review' }
];

export function makeAgentState(key, pct, status, note, badge = 'Active') {
  return { key, pct, status, note, badge, busy: pct > 0 && pct < 100 };
}
