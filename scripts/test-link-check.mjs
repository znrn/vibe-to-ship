import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSourceLink } from './lib/check-source-link.mjs';

function fixture(statuses) {
  const methods = [];
  return {
    methods,
    fetchImpl: async (_url, { method }) => {
      methods.push(method);
      const status = statuses.shift();
      if (status instanceof Error) throw status;
      return new Response(null, { status });
    },
  };
}

test('HEAD 404 falls back to a successful GET', async () => {
  const f = fixture([404, 200]);
  assert.deepEqual(await checkSourceLink('https://example.com', f), { ok: true, status: 200 });
  assert.deepEqual(f.methods, ['HEAD', 'GET']);
});
test('a genuinely missing page still fails after GET', async () => {
  for (const status of [404, 410]) {
    const f = fixture([404, status]);
    assert.deepEqual(await checkSourceLink('https://example.com', f), { ok: false, status, dead: true });
  }
});
test('a successful HEAD needs no GET', async () => {
  const f = fixture([200]);
  assert.deepEqual(await checkSourceLink('https://example.com', f), { ok: true, status: 200 });
  assert.deepEqual(f.methods, ['HEAD']);
});
test('a failed HEAD can recover through GET', async () => {
  const f = fixture([new Error('HEAD unsupported'), 200]);
  assert.equal((await checkSourceLink('https://example.com', f)).ok, true);
});
test('GET access restrictions stay distinct from dead links', async () => {
  const f = fixture([404, 521]);
  assert.deepEqual(await checkSourceLink('https://example.com', f), { ok: false, status: 521, dead: false });
});
