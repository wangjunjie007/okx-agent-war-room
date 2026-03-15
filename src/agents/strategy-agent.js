export function runStrategyAgent(context) {
  const { bias, snapshot } = context;
  const basisSupportive = Number(snapshot.basisPct || 0) >= 0;
  let text = '策略层建议维持“观察态 + 触发式执行”，避免在中性区间过早扩大敞口。';
  if (bias === '偏多') {
    text = basisSupportive
      ? '策略层建议采用“轻仓试探 → 二次确认 → 条件加仓”的三段式推进，并优先在现货/合约基差未恶化时执行。'
      : '策略层建议偏向“轻仓试探 → 快速确认 → 严控追价”，因为方向偏多但基差未完全配合。';
  } else if (bias === '偏空') {
    text = '策略层建议采用“反弹观察 → 防守优先 → 条件反手”的保守路线，避免在弱势结构内主观抄底。';
  }
  return {
    key: 'strategy',
    text,
    note: '把情报层、流量层和基差结构压缩成执行路径。'
  };
}
