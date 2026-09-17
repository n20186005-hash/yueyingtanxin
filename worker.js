// Cloudflare Worker：代理 Open-Meteo 天氣資料並於邊緣快取，其餘請求由靜態資源（ASSETS）提供。
// 座標為蘭潭月影潭心所在地（嘉義市東區）。

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const LAT = '23.4659';
const LON = '120.4807';

function weatherUrl() {
  const params = new URLSearchParams({
    latitude: LAT,
    longitude: LON,
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,uv_index',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max',
    timezone: 'Asia/Taipei',
    forecast_days: '7',
    wind_speed_unit: 'ms',
  });
  return `${ENDPOINT}?${params.toString()}`;
}

async function handleWeather(cache, ctx) {
  const url = weatherUrl();
  const cacheKey = new Request(url);
  try {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'yueyingtanxin-weather/1.0 (+https://yueyingtanxin.com)' },
    });
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: 'weather_unavailable' }), {
        status: 502,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }

    const response = new Response(upstream.body, upstream);
    response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
    response.headers.set('Access-Control-Allow-Origin', 'https://yueyingtanxin.com');
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (e) {
    return new Response(JSON.stringify({ error: 'weather_unavailable' }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/weather') {
      return handleWeather(caches.default, ctx);
    }

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && (request.headers.get('accept') || '').includes('text/html')) {
      response = await env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    }
    return response;
  },
};
