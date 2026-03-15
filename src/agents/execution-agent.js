import { buildExecutionBridge } from '../lib/execution-bridge.js';
import { fmt } from '../lib/mission-utils.js';

export function runExecutionAgent(context) {
  const { snapshot, bias, risk, mode, asset, strategy, riskAgent } = context;
  const execution = [
    `交易对象：${snapshot.instId}`,
    `方向判断：${bias}`,
    '执行方式：分批建仓 / 条件触发 / 风险护栏绑定',
    '节奏建议：先小仓位前哨，确认后再推进',
    `关键约束：风险等级 ${risk}，24h 振幅 ${fmt(((snapshot.high24h - snapshot.low24h) / Math.max(snapshot.low24h || 1, 1)) * 100)}%`
  ];

  const bridge = buildExecutionBridge({
    asset,
    snapshot,
    bias,
    risk,
    mode,
    strategyText: strategy.text,
    riskText: riskAgent.text
  });

  return {
    key: 'exec',
    text: `已接收共识，开始组织执行总线：${execution.join('；')}。${bridge.summary}`,
    execution,
    bridge,
    note: `建立 ${execution[0]} / ${execution[2]} / ${execution[3]} 的执行路径。`
  };
}
