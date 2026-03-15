import { buildMarketDrivers, fmt, fmtSigned } from '../lib/mission-utils.js';

export function runIntelAgent(context) {
  const { asset, snapshot, tones } = context;
  const drivers = buildMarketDrivers(snapshot);
  const momentum = snapshot.change24hPct >= 0 ? '顺风' : '逆风';
  const text = `已解析 ${asset} 当前市场状态：现价 ${fmt(snapshot.last)}，24h 涨跌 ${fmtSigned(snapshot.change24hPct, 2, '%')}，波动率代理 ${fmt(snapshot.volatilityPct)}%。当前叙事偏向「${tones.join(' / ')}」，主导环境为 ${momentum}，核心驱动包括 ${drivers.join('、')}。`;
  return {
    key: 'intel',
    text,
    note: `识别任务关键词并抽取 ${tones.join(' / ')}。`
  };
}
