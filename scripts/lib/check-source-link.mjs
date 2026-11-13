// HEAD failures are provisional: some documentation servers return 404 for
// HEAD while serving the same URL normally via GET.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

export async function checkSourceLink(url, { fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetchImpl(url, {
        method, redirect: 'follow', headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (method === 'GET') await res.body?.cancel();
      if (res.ok) return { ok: true, status: res.status };
      if (method === 'HEAD') continue;
      return { ok: false, status: res.status, dead: [404, 410].includes(res.status) };
    } catch (e) {
      if (method === 'HEAD') continue;
      return { ok: false, status: e.name === 'TimeoutError' ? '超时' : e.cause?.code ?? e.message, dead: true };
    }
  }
  return { ok: false, status: '未知', dead: false };
}
