async function request(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.error || `Request failed: ${url}`);
  return data;
}

export async function createMissionRun(mission, mode) {
  const data = await request('/api/mission/runs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mission, mode })
  });
  return data.run;
}

export async function fetchRun(runId) {
  const data = await request(`/api/mission/runs/${runId}`);
  return data.run;
}

export async function fetchRuns(limit = 10) {
  const data = await request(`/api/mission/runs?limit=${limit}`);
  return data.runs || [];
}

export async function fetchReplay(runId) {
  const data = await request(`/api/mission/runs/${runId}/replay`);
  return data.replay;
}

export async function fetchAnalytics(runId) {
  const data = await request(`/api/mission/runs/${runId}/analytics`);
  return data.analytics;
}

export async function fetchWatchlist(assets = ['BTC', 'ETH', 'SOL', 'OKB']) {
  const data = await request(`/api/market/watchlist?assets=${encodeURIComponent(assets.join(','))}`);
  return data.assets || [];
}

export async function fetchLeaderboard(limit = 8) {
  const data = await request(`/api/analytics/leaderboard?limit=${limit}`);
  return data.leaderboard || [];
}
