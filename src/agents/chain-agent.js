import { fmt, fmtSigned, formatBillions } from '../lib/mission-utils.js';

export function runChainAgent(context) {
  const { snapshot } = context;
  const bidHeavy = snapshot.flowImbalance > 0.08;
  const tradeBias = snapshot.tradeBuyRatio > 0.53 ? '主动买盘略占优' : snapshot.tradeBuyRatio < 0.47 ? '主动卖盘略占优' : '主动成交接近平衡';
  const oiText = snapshot.openInterest ? `未平仓量约 ${formatBillions(snapshot.openInterest)}，` : '';
  const fundingText = snapshot.fundingRate === null || snapshot.fundingRate === undefined
    ? '资金费率暂不可用'
    : `资金费率 ${fmtSigned(snapshot.fundingRate * 100, 4, '%')}`;
  const text = bidHeavy
    ? `盘口买盘强度占优，流量代理呈现净流入倾向（imbalance ${fmtSigned(snapshot.flowImbalance * 100, 2, '%')}）。${tradeBias}；${oiText}${fundingText}。更适合观察顺势推进窗口。`
    : `盘口优势不明显或卖压偏高（imbalance ${fmtSigned(snapshot.flowImbalance * 100, 2, '%')}）。${tradeBias}；${oiText}${fundingText}。更适合先做确认，再谈推进。`;
  return {
    key: 'chain',
    text,
    note: '跟踪盘口流量、主动成交、未平仓量与资金费率。'
  };
}
