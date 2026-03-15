export function detectAsset(mission = '') {
  const upper = String(mission || '').toUpperCase();
  if (upper.includes('BTC')) return 'BTC';
  if (upper.includes('SOL')) return 'SOL';
  if (upper.includes('OKB')) return 'OKB';
  return 'ETH';
}

export function decideTone(mode, snapshot) {
  const up = Number(snapshot?.change24hPct || 0) >= 0;
  if (mode === 'risk') return up ? ['波动抑制', '回撤控制', '风险走廊'] : ['防守信号', '止损纪律', '收缩敞口'];
  if (mode === 'swing') return up ? ['区间突破', '波段延续', '择时强化'] : ['区间回撤', '节奏切换', '反弹确认'];
  if (mode === 'ops') return ['多市场联动', '任务编排', '执行切换'];
  return up ? ['热点追踪', '机会窗口', '高置信强化'] : ['弱转强观察', '反身性窗口', '防守优先'];
}

export function side(snapshot) {
  const change24hPct = Number(snapshot?.change24hPct || 0);
  const flowImbalance = Number(snapshot?.flowImbalance || 0);
  if (change24hPct > 1.5 || flowImbalance > 0.12) return '偏多';
  if (change24hPct < -1.5 || flowImbalance < -0.12) return '偏空';
  return '中性偏观察';
}

export function riskLevel(snapshot) {
  const volatilityPct = Number(snapshot?.volatilityPct || 0);
  const fundingRate = Math.abs(Number(snapshot?.fundingRate || 0) * 100);
  if (volatilityPct > 3.5 || fundingRate > 0.08) return 'HIGH';
  if (volatilityPct > 1.8 || fundingRate > 0.035) return 'MED';
  return 'LOW';
}

export function fmt(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

export function fmtSigned(value, digits = 2, suffix = '') {
  const n = Number(value || 0);
  return `${n > 0 ? '+' : ''}${n.toFixed(digits)}${suffix}`;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function formatBillions(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1e9) return `${fmt(n / 1e9, 2)}B`;
  if (Math.abs(n) >= 1e6) return `${fmt(n / 1e6, 2)}M`;
  if (Math.abs(n) >= 1e3) return `${fmt(n / 1e3, 2)}K`;
  return fmt(n, 2);
}

export function buildHeroSubtitle(plan) {
  return `以 OKX Agent Trade Kit 为执行中枢，当前聚焦 ${plan.asset} 实时任务：现价 ${fmt(plan.snapshot.last)}，24h ${fmtSigned(plan.snapshot.change24hPct, 2, '%')}，波动率代理 ${fmt(plan.snapshot.volatilityPct)}%。`;
}

export function buildMarketDrivers(snapshot = {}) {
  const drivers = [];
  drivers.push(`现货/合约基差 ${fmtSigned(snapshot.basisPct, 2, '%')}`);
  drivers.push(`资金费率 ${fmtSigned((snapshot.fundingRate || 0) * 100, 4, '%')}`);
  drivers.push(`盘口失衡 ${fmtSigned((snapshot.flowImbalance || 0) * 100, 2, '%')}`);
  drivers.push(`主动买入占比 ${fmt((snapshot.tradeBuyRatio || 0) * 100, 1)}%`);
  return drivers;
}
