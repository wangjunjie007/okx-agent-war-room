export function runRiskAgent(context) {
  const { risk, snapshot } = context;
  let text = '波动等级较低，可考虑更稳定的分批执行，但仍需保持风险护栏。';
  if (risk === 'HIGH') {
    text = '波动等级偏高，风控要求降低节奏、收紧仓位、先保留退出缓冲，并限制在确认不足时追加仓位。';
  } else if (risk === 'MED') {
    text = '波动等级中等，允许低风险试探，但必须绑定止损与阶段性退出条件。';
  }
  if (Math.abs(Number(snapshot.fundingRate || 0)) > 0.0008) {
    text += ' 资金费率处于偏激进区间，需防止拥挤交易反向挤压。';
  }
  return {
    key: 'risk',
    text,
    note: '审查执行阈值、仓位节奏、退出条件与拥挤度。'
  };
}
