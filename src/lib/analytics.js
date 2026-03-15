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
  let trades = 0;

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
    if (ret >= 0) wins += 1;
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

export function buildExecutionSimulator({ snapshot, bias, risk, signalScore, backtest }) {
  const last = Number(snapshot.last || 0);
  const volPct = Math.max(Number(snapshot.volatilityPct || 0), 0.4);
  const side = bias === '偏多' ? 1 : bias === '偏空' ? -1 : 0;
  const entryBufferPct = clamp(volPct * 0.18, 0.12, 0.75) / 100;
  const stopPct = clamp(volPct * (risk === 'HIGH' ? 0.9 : risk === 'MED' ? 0.75 : 0.6), 0.45, 2.2) / 100;
  const target1Pct = stopPct * (signalScore.total >= 68 ? 1.8 : 1.35);
  const target2Pct = stopPct * (signalScore.total >= 68 ? 2.8 : 2.1);
  const notionalPct = clamp(signalScore.total * 0.55 - (risk === 'HIGH' ? 18 : risk === 'MED' ? 10 : 4), 8, 55);

  const entryLow = side >= 0 ? last * (1 - entryBufferPct) : last * (1 + entryBufferPct * 0.25);
  const entryHigh = side >= 0 ? last * (1 + entryBufferPct * 0.2) : last * (1 + entryBufferPct);
  const stop = side >= 0 ? last * (1 - stopPct) : last * (1 + stopPct);
  const target1 = side >= 0 ? last * (1 + target1Pct) : last * (1 - target1Pct);
  const target2 = side >= 0 ? last * (1 + target2Pct) : last * (1 - target2Pct);
  const rr = stopPct ? target1Pct / stopPct : 0;

  return {
    side: side > 0 ? 'Long Ladder' : side < 0 ? 'Short Ladder' : 'Neutral Watch',
    notionalPct: Number(notionalPct.toFixed(1)),
    entryLow: Number(entryLow.toFixed(2)),
    entryHigh: Number(entryHigh.toFixed(2)),
    stop: Number(stop.toFixed(2)),
    target1: Number(target1.toFixed(2)),
    target2: Number(target2.toFixed(2)),
    rewardRisk: Number(rr.toFixed(2)),
    summary: side === 0
      ? '当前更适合维持观察态，不建议激活完整模拟执行路径。'
      : `模拟执行建议：${side > 0 ? '分批做多' : '分批做空'}，名义仓位上限 ${notionalPct.toFixed(1)}%，RR 约 ${rr.toFixed(2)}，并参考回测边际 ${fmtSigned(backtest.pnlPct, 2, '%')} 调整节奏。`
  };
}

export function summarizeRunForLeaderboard(run) {
  return {
    id: run.id,
    mission: run.mission,
    asset: run.plan?.asset || run.summary?.asset || 'N/A',
    status: run.status,
    signalScore: Number(run.plan?.signalScore?.total || 0),
    confidence: run.plan?.signalScore?.confidence || 'N/A',
    pnlPct: Number(run.plan?.backtest?.pnlPct || 0),
    winRate: Number(run.plan?.backtest?.winRate || 0),
    bias: run.plan?.bias || 'N/A',
    updatedAt: run.updatedAt || run.createdAt
  };
}
