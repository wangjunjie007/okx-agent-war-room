import { getMarketSnapshot } from './okx.js';

function detectAsset(mission = '') {
  const upper = mission.toUpperCase();
  if (upper.includes('BTC')) return 'BTC';
  if (upper.includes('SOL')) return 'SOL';
  if (upper.includes('OKB')) return 'OKB';
  return 'ETH';
}

function decideTone(mode, snapshot) {
  const up = snapshot.change24hPct >= 0;
  if (mode === 'risk') return up ? ['波动抑制', '回撤控制', '风险走廊'] : ['防守信号', '止损纪律', '收缩敞口'];
  if (mode === 'swing') return up ? ['区间突破', '波段延续', '择时强化'] : ['区间回撤', '节奏切换', '反弹确认'];
  if (mode === 'ops') return ['多市场联动', '任务编排', '执行切换'];
  return up ? ['热点追踪', '机会窗口', '高置信强化'] : ['弱转强观察', '反身性窗口', '防守优先'];
}

function side(snapshot) {
  if (snapshot.change24hPct > 1.5) return '偏多';
  if (snapshot.change24hPct < -1.5) return '偏空';
  return '中性偏观察';
}

function riskLevel(snapshot) {
  if (snapshot.volatilityPct > 3.5) return 'HIGH';
  if (snapshot.volatilityPct > 1.8) return 'MED';
  return 'LOW';
}

function fmt(n, digits = 2) {
  return Number(n || 0).toFixed(digits);
}

export async function buildMissionPlan({ mission, mode = 'alpha' }) {
  const asset = detectAsset(mission);
  const snapshot = await getMarketSnapshot(asset);
  const tones = decideTone(mode, snapshot);
  const bias = side(snapshot);
  const risk = riskLevel(snapshot);
  const bidHeavy = snapshot.flowImbalance > 0.08;

  const intel = `已解析 ${asset} 当前市场状态：现价 ${fmt(snapshot.last)}，24h 涨跌 ${fmt(snapshot.change24hPct)}%，波动率代理 ${fmt(snapshot.volatilityPct)}%。当前叙事偏向「${tones[0]} / ${tones[1]} / ${tones[2]}」。`;
  const flow = bidHeavy
    ? `盘口买盘强度占优，流量代理呈现净流入倾向（imbalance ${fmt(snapshot.flowImbalance * 100)}%），更适合观察顺势推进窗口。`
    : `盘口优势不明显或卖压偏高（imbalance ${fmt(snapshot.flowImbalance * 100)}%），更适合先做确认，再谈推进。`;
  const strategy = bias === '偏多'
    ? `策略层建议采用“轻仓试探 → 二次确认 → 条件加仓”的三段式推进。`
    : bias === '偏空'
      ? `策略层建议采用“反弹观察 → 防守优先 → 条件反手”的保守路线。`
      : `策略层建议维持“观察态 + 触发式执行”，避免在中性区间过早扩大敞口。`;
  const riskText = risk === 'HIGH'
    ? '波动等级偏高，风控要求降低节奏、收紧仓位、先保留退出缓冲。'
    : risk === 'MED'
      ? '波动等级中等，允许低风险试探，但必须绑定止损与阶段性退出条件。'
      : '波动等级较低，可考虑更稳定的分批执行，但仍需保持风险护栏。';

  const execution = [
    `交易对象：${snapshot.instId}`,
    `方向判断：${bias}`,
    `执行方式：分批建仓 / 条件触发 / 风险护栏绑定`,
    `节奏建议：先小仓位前哨，确认后再推进`,
    `关键约束：风险等级 ${risk}，24h 振幅 ${fmt(((snapshot.high24h - snapshot.low24h) / Math.max(snapshot.low24h || 1, 1)) * 100)}%`
  ];

  const conclusionHtml = `
    <strong>【任务结论】</strong><br>
    1. <strong>市场状态：</strong>${asset} 当前现价 <strong>${fmt(snapshot.last)}</strong>，24h 涨跌 <strong>${fmt(snapshot.change24hPct)}%</strong>，波动率代理 <strong>${fmt(snapshot.volatilityPct)}%</strong>，说明当前环境属于 <strong>${bias}</strong>。<br><br>
    2. <strong>信号理解：</strong>情报层将本轮任务的主信号压缩为 <strong>${tones[0]} / ${tones[1]} / ${tones[2]}</strong>，表明当前最值得关注的是「方向强化」而不是单点噪音。<br><br>
    3. <strong>资金/流量代理：</strong>${flow}<br><br>
    4. <strong>策略建议：</strong>${strategy}<br><br>
    5. <strong>风控结论：</strong>${riskText}<br><br>
    6. <strong>执行建议：</strong>以 <strong>OKX Agent Trade Kit</strong> 作为执行中枢，优先组织“前哨仓位 + 条件确认 + 风险护栏”三层执行路径，而不是一次性满仓推进。<br><br>
    7. <strong>下一步重点：</strong>持续跟踪 24h 方向是否延续、盘口流量代理是否继续改善，以及波动水平是否仍在可控区间。若三项同时强化，再提升执行等级。`;

  return {
    mission,
    mode,
    asset,
    tones,
    snapshot,
    intel,
    flow,
    strategy,
    riskText,
    execution,
    conclusionHtml
  };
}
