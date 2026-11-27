import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

test('unknown HTML routes retain the asset 404 instead of fetching home', async () => {
  const paths = [];
  const response = await worker.fetch(new Request('https://yueyingtanxin.com/missing/', {headers: {accept: 'text/html'}}), {ASSETS: {fetch: async (request) => {
    paths.push(new URL(request.url).pathname);
    return new Response('missing', {status: 404});
  }}}, {});
  assert.equal(response.status, 404);
  assert.deepEqual(paths, ['/missing/']);
});

test('weather is dispatched to JSON handler and preserves upstream failure', async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  globalThis.caches = {default: {match: async () => undefined}};
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).hostname, 'api.open-meteo.com');
    return new Response('unavailable', {status: 503});
  };
  try {
    const response = await worker.fetch(new Request('https://yueyingtanxin.com/api/weather'), {ASSETS: {fetch: () => assert.fail('weather must not use static assets')}}, {});
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {error: 'weather_unavailable'});
  } finally {globalThis.fetch = originalFetch; globalThis.caches = originalCaches;}
});
