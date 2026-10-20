// Persist request/response metadata only. Never retain auth headers, bodies,
// query strings (presigned storage signatures), or login requests.
export function summarizeNetwork(entries) {
  const requests = new Map();
  for (const entry of entries) {
    let event;
    try { event = JSON.parse(entry.message).message; } catch { continue; }
    const p = event?.params;
    if (!p) continue;
    if (event.method === 'Network.requestWillBeSent') {
      let url;
      try { url = new URL(p.request.url); } catch { continue; }
      const api = url.hostname === 'api-staging.hotung9108.me' && url.pathname.startsWith('/api/v1/');
      if (api && /\/auth\//.test(url.pathname)) continue;
      if (!api && p.request.method !== 'PUT') continue;
      requests.set(p.requestId, { source: 'browser', method: p.request.method, endpoint: api ? url.pathname : '[storage-upload]', at: p.wallTime ? new Date(p.wallTime * 1000).toISOString() : undefined });
    } else if (event.method === 'Network.responseReceived' && requests.has(p.requestId)) {
      Object.assign(requests.get(p.requestId), { status: p.response.status, mimeType: p.response.mimeType });
    } else if (event.method === 'Network.loadingFailed' && requests.has(p.requestId)) {
      requests.get(p.requestId).transportFailed = true;
    }
  }
  return [...requests.values()];
}
