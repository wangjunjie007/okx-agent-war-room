import { clamp, fmtSigned } from './mission-utils.js';

function normalize(value, min, max) {
  if (max === min) return 50;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

export function buildSignalScore({ snapshot, bias, risk, mode }) {
  const trend = normalize(Number(snapshot.change24hPct || 0), -4, 4);
  const flow = normalize(Number(snapshot.flowImbalance || 0), -0.25, 0.25);
  const participation = normalize((Number(snapshot.tradeBuyRatio || 0.5) - 0.5) * 2, -1, 1);
  const basis = normalize(Number(snapshot.basisPct || 0), -0.4, 0.4);
  const volatilityPenalty = normalize(Number(snapshot.volatilityPct || 0), 0.4, 4.5);
  const riskPenalty = risk === 'HIGH' ? 18 : risk === 'MED' ? 9 : 3;
  const modeBoost = mode === 'alpha' ? 4 : mode === 'swing' ? 2 : 0;

  let conviction = trend * 0.28 + flow * 0.24 + participation * 0.18 + basis * 0.12 + (100 - volatilityPenalty) * 0.18;
  conviction = clamp(conviction - riskPenalty + modeBoost, 0, 100);

  const direction = bias === '偏多' ? 'LONG' : bias === '偏空' ? 'SHORT' : 'WAIT';
  const confidence = conviction >= 72 ? 'HIGH' : conviction >= 54 ? 'MED' : 'LOW';
  const action = direction === 'WAIT'
    ? '观察等待'
    : conviction >= 70
      ? direction === 'LONG' ? '条件做多' : '条件做空'
      : conviction >= 52
        ? '轻仓试探'
        : '保持防守';

  return {
    total: Math.round(conviction),
    confidence,
    direction,
    action,
    components: {
      trend: Math.round(trend),
      flow: Math.round(flow),
      participation: Math.round(participation),
      basis: Math.round(basis),
      stability: Math.round(100 - volatilityPenalty)
    },
    summary: `信号评分 ${Math.round(conviction)}/100，方向 ${direction}，置信等级 ${confidence}，建议 ${action}。`
  };
}

export function buildBacktestPreview({ snapshot, bias }) {
  const closes = Array.isArray(snapshot.candles) ? snapshot.candles.filter(Boolean).map(Number) : [];
  if (closes.length < 8) {
    return {
      horizonHours: closes.length || 0,
      trades: 0,
      winRate: 0,
      pnlPct: 0,
      maxDrawdownPct: 0,
      summary: '历史样本不足，暂无法生成回测预览。'
    };
  }

  const direction = bias === '偏多' ? 1 : bias === '偏空' ? -1 : 0;
  let equity = 1;
  let peak = 1;
  let wins = 0;
  let losses = 0;
  let trades = 0;
  let active = 0;

  for (let i = 6; i < closes.length - 1; i += 1) {
    const window = closes.slice(i - 6, i);
    const sma = window.reduce((sum, value) => sum + value, 0) / window.length;
    const current = closes[i];
    const next = closes[i + 1];

    let signal = 0;
    if (direction > 0 && current > sma) signal = 1;
    if (direction < 0 && current < sma) signal = -1;
    if (direction === 0) signal = Math.abs((current - sma) / sma) > 0.01 ? (current > sma ? 1 : -1) : 0;
    if (!signal) continue;

    const ret = signal === 1 ? (next - current) / current : (current - next) / current;
    equity *= 1 + ret;
    peak = Math.max(peak, equity);
    trades += 1;
    active += signal;
    if (ret >= 0) wins += 1;
    else losses += 1;
  }

  const drawdown = peak ? ((peak - equity) / peak) * 100 : 0;
  const pnlPct = (equity - 1) * 100;
  const winRate = trades ? (wins / trades) * 100 : 0;

  return {
    horizonHours: closes.length,
    trades,
    winRate: Number(winRate.toFixed(1)),
    pnlPct: Number(pnlPct.toFixed(2)),
    maxDrawdownPct: Number(drawdown.toFixed(2)),
    bias,
    summary: trades
      ? `过去 ${closes.length} 小时的简化回测中，共触发 ${trades} 次信号，收益 ${fmtSigned(pnlPct, 2, '%')}，胜率 ${winRate.toFixed(1)}%，最大回撤 ${drawdown.toFixed(2)}%。`
      : '当前参数下未形成足够交易信号，回测更偏向等待。'
  };
}
