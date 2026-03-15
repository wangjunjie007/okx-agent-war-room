import axios from 'axios';

const client = axios.create({
  baseURL: 'https://www.okx.com',
  timeout: 15000,
  headers: { 'User-Agent': 'okx-agent-war-room/0.1.0' }
});

export function resolveInstId(asset = 'ETH') {
  return `${asset.toUpperCase()}-USDT`;
}

export async function getTicker(instId) {
  const { data } = await client.get('/api/v5/market/ticker', { params: { instId } });
  if (!data?.data?.[0]) throw new Error(`No ticker data for ${instId}`);
  return data.data[0];
}

export async function getCandles(instId, bar = '1H', limit = 24) {
  const { data } = await client.get('/api/v5/market/candles', { params: { instId, bar, limit } });
  return data?.data || [];
}

export async function getBooks(instId, sz = 5) {
  const { data } = await client.get('/api/v5/market/books', { params: { instId, sz } });
  return data?.data?.[0] || { asks: [], bids: [] };
}

export async function getMarketSnapshot(asset) {
  const instId = resolveInstId(asset);
  const [ticker, candles, books] = await Promise.all([
    getTicker(instId),
    getCandles(instId, '1H', 24),
    getBooks(instId, 5)
  ]);

  const last = Number(ticker.last || 0);
  const open24h = Number(ticker.open24h || last || 0);
  const high24h = Number(ticker.high24h || last || 0);
  const low24h = Number(ticker.low24h || last || 0);
  const change24hPct = open24h ? ((last - open24h) / open24h) * 100 : 0;
  const hourlyCloses = candles.map(c => Number(c[4] || 0)).filter(Boolean).reverse();
  const avgClose = hourlyCloses.length ? hourlyCloses.reduce((a,b)=>a+b,0) / hourlyCloses.length : last;
  const variance = hourlyCloses.length ? hourlyCloses.reduce((acc, v) => acc + Math.pow(v - avgClose, 2), 0) / hourlyCloses.length : 0;
  const volatilityPct = avgClose ? (Math.sqrt(variance) / avgClose) * 100 : 0;

  const bidVol = (books.bids || []).reduce((acc, row) => acc + Number(row?.[1] || 0), 0);
  const askVol = (books.asks || []).reduce((acc, row) => acc + Number(row?.[1] || 0), 0);
  const flowImbalance = bidVol + askVol ? (bidVol - askVol) / (bidVol + askVol) : 0;

  return {
    asset: asset.toUpperCase(),
    instId,
    last,
    high24h,
    low24h,
    open24h,
    volume24h: Number(ticker.vol24h || 0),
    change24hPct,
    volatilityPct,
    flowImbalance,
    candles: hourlyCloses
  };
}
