import { fmt, fmtSigned } from './mission-utils.js';

export function buildExecutionBridge({ asset, snapshot, bias, risk, mode, strategyText, riskText }) {
  const guardrails = [
    `风险等级 ${risk}`,
    `波动率代理 ${fmt(snapshot.volatilityPct)}%`,
    `盘口失衡阈值 ${fmtSigned((snapshot.flowImbalance || 0) * 100, 2, '%')}`,
    '仅输出执行路径，不触发真实下单'
  ];

  const triggers = bias === '偏多'
    ? [
        `若 ${asset} 再次站稳近 24h 高位附近，允许提升前哨仓位等级`,
        '若主动买入占比继续提升，则保留二次推进窗口',
        '若资金费率突然跳升，优先降杠杆而非追击'
      ]
    : bias === '偏空'
      ? [
          `若 ${asset} 反抽失败且卖压延续，优先保持防守或等待反手确认`,
          '若订单簿卖压继续加重，缩小试探窗口',
          '若空头挤压触发，先减速再评估'
        ]
      : [
          `若 ${asset} 维持震荡，继续观察而不提前扩大敞口`,
          '等待方向、流量、波动三项重新同向强化',
          '以条件触发替代主观追单'
        ];

  const routes = [
    { lane: 'signal-intake', title: 'Signal Intake', detail: `接收 ${mode} 模式下的市场快照与任务意图` },
    { lane: 'risk-check', title: 'Risk Check', detail: riskText },
    { lane: 'execution-bus', title: 'Execution Bus', detail: strategyText },
    { lane: 'review-loop', title: 'Review Loop', detail: '写入 replay 帧、事件日志与最终纪要' }
  ];

  const status = risk === 'HIGH' ? 'Guarded' : bias === '偏多' ? 'Opportunity' : bias === '偏空' ? 'Defensive' : 'Watching';

  return {
    status,
    routes,
    guardrails,
    triggers,
    summary: `Execution Bridge 已建立：${asset} 当前偏向 ${bias}，以 ${risk} 风险护栏驱动 ${mode} 任务编排。`
  };
}
