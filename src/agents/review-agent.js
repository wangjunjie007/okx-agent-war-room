import { buildHeroSubtitle, fmt, fmtSigned } from '../lib/mission-utils.js';

export function runReviewAgent(context) {
  const { asset, snapshot, tones, bias, strategy, riskAgent, chain, executionAgent } = context;
  const conclusionHtml = `
    <strong>【任务结论】</strong><br>
    1. <strong>市场状态：</strong>${asset} 当前现价 <strong>${fmt(snapshot.last)}</strong>，24h 涨跌 <strong>${fmtSigned(snapshot.change24hPct, 2, '%')}</strong>，波动率代理 <strong>${fmt(snapshot.volatilityPct)}%</strong>，说明当前环境属于 <strong>${bias}</strong>。<br><br>
    2. <strong>信号理解：</strong>情报层将本轮任务的主信号压缩为 <strong>${tones.join(' / ')}</strong>，表明当前最值得关注的是「方向强化」而不是单点噪音。<br><br>
    3. <strong>资金/流量代理：</strong>${chain.text}<br><br>
    4. <strong>策略建议：</strong>${strategy.text}<br><br>
    5. <strong>风控结论：</strong>${riskAgent.text}<br><br>
    6. <strong>执行桥接：</strong>${executionAgent.bridge.summary}<br><br>
    7. <strong>下一步重点：</strong>持续跟踪 24h 方向是否延续、盘口流量代理是否继续改善，以及波动水平是否仍在可控区间。若三项同时强化，再提升执行等级。`;
  const conclusionText = conclusionHtml.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '');

  return {
    key: 'review',
    text: '正在把多 Agent 共识压缩为最终结果摘要，并写入任务 replay 档案。',
    conclusionHtml,
    conclusionText,
    heroSubtitle: buildHeroSubtitle({ asset, snapshot })
  };
}
