// 即時天氣用戶端腳本：向本站 /api/weather 取得資料，並依天氣組合自動產生「給普通遊客的可執行建議」。
// 資料由 Cloudflare Worker 代理 Open-Meteo 並於邊緣快取。前端不出現任何關於資料來源 / 密鑰的說明文字。

type WeatherEntry = { text: string; emoji: string };

const WMO: Record<number, WeatherEntry> = {
  0: { text: '晴朗', emoji: '☀️' },
  1: { text: '多雲時晴', emoji: '🌤️' },
  2: { text: '多雲', emoji: '⛅' },
  3: { text: '陰天', emoji: '☁️' },
  45: { text: '有霧', emoji: '🌫️' },
  48: { text: '霧淞', emoji: '🌫️' },
  51: { text: '輕微毛毛雨', emoji: '🌦️' },
  53: { text: '毛毛雨', emoji: '🌦️' },
  55: { text: '明顯毛毛雨', emoji: '🌦️' },
  56: { text: '凍毛毛雨', emoji: '🌧️' },
  57: { text: '凍毛毛雨', emoji: '🌧️' },
  61: { text: '小雨', emoji: '🌧️' },
  63: { text: '雨', emoji: '🌧️' },
  65: { text: '大雨', emoji: '🌧️' },
  66: { text: '凍雨', emoji: '🌧️' },
  67: { text: '凍雨', emoji: '🌧️' },
  71: { text: '小雪', emoji: '🌨️' },
  73: { text: '雪', emoji: '🌨️' },
  75: { text: '大雪', emoji: '❄️' },
  77: { text: '雪粒', emoji: '🌨️' },
  80: { text: '陣雨', emoji: '🌦️' },
  81: { text: '陣雨', emoji: '🌦️' },
  82: { text: '強陣雨', emoji: '⛈️' },
  85: { text: '陣雪', emoji: '🌨️' },
  86: { text: '陣雪', emoji: '🌨️' },
  95: { text: '雷陣雨', emoji: '⛈️' },
  96: { text: '雷陣雨伴冰雹', emoji: '⛈️' },
  99: { text: '雷陣雨伴冰雹', emoji: '⛈️' },
};

function describe(code: number): WeatherEntry {
  return WMO[code] ?? { text: '多雲', emoji: '🌡️' };
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00+08:00`);
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((d.getTime() - base) / 86_400_000);
  const names = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  return names[d.getDay()];
}

// 蒲福風級（輸入 m/s）
function beaufort(ms: number): number {
  if (ms < 0.3) return 0;
  if (ms < 1.6) return 1;
  if (ms < 3.4) return 2;
  if (ms < 5.5) return 3;
  if (ms < 8.0) return 4;
  if (ms < 10.8) return 5;
  if (ms < 13.9) return 6;
  if (ms < 17.2) return 7;
  if (ms < 20.8) return 8;
  if (ms < 24.5) return 9;
  return 10;
}

function uvText(uv: number): string {
  if (uv < 3) return '弱';
  if (uv < 6) return '中等';
  if (uv < 8) return '強';
  if (uv < 11) return '很強';
  return '極強';
}

type RainSev = 'none' | 'light' | 'heavy' | 'storm';
const RAIN_RANK: Record<RainSev, number> = { none: 0, light: 1, heavy: 2, storm: 3 };
const RAIN_ORDER: RainSev[] = ['none', 'light', 'heavy', 'storm'];

function rainSeverity(code: number): RainSev {
  if (code === 95 || code === 96 || code === 99) return 'storm';
  if ([63, 65, 66, 67, 81, 82].includes(code)) return 'heavy';
  if ([51, 53, 55, 56, 57, 61, 80].includes(code)) return 'light';
  return 'none';
}

interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature?: number;
    weather_code: number;
    precipitation?: number;
    wind_speed_10m?: number;
    wind_gusts_10m?: number;
    uv_index?: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
    uv_index_max?: number[];
  };
}

interface Advice {
  outfit: string[];
  activity: string[];
  items: string[];
  risk: string[];
}

// 依天氣組合產生建議；不滿足條件的項目直接不加入陣列（前端隱藏）。
// 地理場景以「湖畔 / 戶外」為主（蘭潭為城市水庫，無海邊 / 爬山場景）。
function buildAdvice(data: WeatherData): Advice {
  const cur = data.current;
  const d = data.daily;
  const tmax = d.temperature_2m_max[0];
  const tmin = d.temperature_2m_min[0];
  const pop = d.precipitation_probability_max?.[0] ?? 0;
  const todayCode = d.weather_code[0];
  const uv = d.uv_index_max?.[0] ?? cur.uv_index;
  const windMs = cur.wind_speed_10m ?? 0;
  const gustMs = cur.wind_gusts_10m ?? 0;
  const isFog = cur.weather_code === 45 || cur.weather_code === 48 || todayCode === 45 || todayCode === 48;

  const outfit: string[] = [];
  const activity: string[] = [];
  const items: string[] = [];
  const risk: string[] = [];

  const sev: RainSev = RAIN_ORDER[Math.max(RAIN_RANK[rainSeverity(cur.weather_code)], RAIN_RANK[rainSeverity(todayCode)])];
  const windHigh = Math.max(beaufort(windMs), beaufort(gustMs));
  const clearish = sev === 'none' && !isFog;

  // 降水機率
  if (pop >= 60 && sev === 'none') {
    items.push('備雨具（今天降雨機率偏高，但未必會下）');
  }

  // 降水強度
  if (sev === 'light') {
    activity.push('有小雨，露天體驗較差，路面濕滑走路注意防滑');
    items.push('折疊傘、防滑鞋');
    outfit.push('防潑水外套或雨具');
  } else if (sev === 'heavy') {
    risk.push('降雨較強，避開低窪與臨水區域；遊船等水上設施可能停運');
    activity.push('不建議長時間戶外遊玩，可改市區室內景點');
    items.push('雨衣（風大不建議長柄傘）');
    outfit.push('防水外套');
  } else if (sev === 'storm') {
    risk.push('雷雨：請勿登山、湖邊戲水或於樹下避雨；水上與臨水活動易關閉');
    activity.push('不建議出門，改以室內行程為主');
    items.push('雨衣');
  }

  // 高溫 & 紫外線
  if (tmax >= 32) {
    outfit.push('輕薄透氣衣物');
    activity.push('氣溫偏高，盡量避開正午、縮短戶外停留並多補水');
    items.push('防曬用品、充足飲用水');
  }
  if (uv != null && uv >= 5) {
    outfit.push('防曬穿著（長袖或遮陽）');
    items.push('防曬霜、墨鏡、遮陽帽');
    if (tmax < 32) activity.push('紫外線較強，戶外注意防曬');
  }

  // 低溫
  if (tmax - tmin > 8) {
    outfit.push('晝夜溫差大，備一件外套方便增減');
  }
  if (tmax <= 10) {
    outfit.push('厚外套、圍巾等防寒衣物');
    activity.push('氣溫偏低，建議白天前往，夜間點燈注意保暖防風');
  }

  // 風力
  if (windHigh >= 7) {
    risk.push('大風天氣，遠離廣告牌、湖邊礁石與臨水護欄；戶外臨水項目大概率關閉');
    activity.push('湖邊風強，避免長時間臨水停留，點燈拍照注意防風');
  } else if (windHigh >= 5) {
    outfit.push('防風外套（帽子易被吹落，不建議寬鬆長裙）');
    activity.push('風力偏大，湖邊遊船可能停航，拍照注意穩定');
  }

  // 晴天 / 多雲
  if (clearish) {
    if (todayCode === 0 || todayCode === 1) {
      activity.push('天氣晴好，適合湖畔散步與賞景，傍晚可留至點燈看月影潭心');
    } else if (todayCode === 2 || todayCode === 3) {
      activity.push('光線柔和，很適合拍照與長時間戶外漫步');
    }
    activity.push('湖畔賞景即可，蘭潭為飲用水源，請勿戲水、垂釣');
  }

  // 霧
  if (isFog) {
    risk.push('能見度差，不適合遠眺觀景，注意行車與步行安全');
    activity.push('湖景被霧遮，可改市區室內行程');
    items.push('口罩');
  }

  // 預設
  if (activity.length === 0) {
    activity.push('天氣平穩，適合湖畔散步、賞景與拍照');
  }

  return { outfit, activity, items, risk };
}

function adviceBlock(title: string, list: string[], kind: 'outfit' | 'activity' | 'items'): string {
  if (!list.length) return '';
  const icon = kind === 'items' ? '🎒' : '✔';
  const lis = list.map((x) => `<li><span class="advice-icon" aria-hidden="true">${icon}</span><span>${x}</span></li>`).join('');
  return `<div class="advice-block"><h4 class="advice-title">${title}</h4><ul class="advice-list">${lis}</ul></div>`;
}

function riskBlock(list: string[]): string {
  if (list.length) {
    const lis = list.map((x) => `<li class="advice-risk-item">⚠ ${x}</li>`).join('');
    return `<div class="advice-risk"><h4 class="advice-title">風險提醒</h4><ul class="advice-list">${lis}</ul></div>`;
  }
  return `<div class="advice-risk advice-risk--ok"><h4 class="advice-title">風險提醒</h4><p class="advice-ok">目前無特殊天氣風險提醒</p></div>`;
}

function render(data: WeatherData, widget: HTMLElement): void {
  const cur = data.current;
  const d = data.daily;
  const cond = describe(cur.weather_code);
  const popToday = d.precipitation_probability_max?.[0] ?? 0;
  const feels = cur.apparent_temperature != null ? Math.round(cur.apparent_temperature) : null;
  const windLv = beaufort(cur.wind_speed_10m ?? 0);
  const uv = d.uv_index_max?.[0] ?? cur.uv_index;
  const advice = buildAdvice(data);

  const days = d.time
    .map((iso, i) => {
      const c = describe(d.weather_code[i]);
      const pop = d.precipitation_probability_max?.[i] ?? 0;
      const tmax = Math.round(d.temperature_2m_max[i]);
      const tmin = Math.round(d.temperature_2m_min[i]);
      return `<div class="forecast-day"><div class="fd-name">${dayLabel(iso)}</div><div class="fd-emoji" aria-hidden="true">${c.emoji}</div><div class="fd-temp">${tmax}° / ${tmin}°</div><div class="fd-pop">降雨 ${pop}%</div></div>`;
    })
    .join('');

  widget.innerHTML = `
    <div class="weather-grid">
      <div class="weather-current">
        <div class="weather-now-top">
          <span class="weather-emoji" aria-hidden="true">${cond.emoji}</span>
          <div>
            <div class="weather-temp">${Math.round(cur.temperature_2m)}°</div>
            <div class="weather-cond">${cond.text}</div>
          </div>
        </div>
        <div class="weather-stats">
          <div class="weather-stat"><span>體感溫度</span><strong>${feels != null ? `${feels}°` : '—'}</strong></div>
          <div class="weather-stat"><span>風力</span><strong>${windLv} 級</strong></div>
          <div class="weather-stat"><span>今日降雨機率</span><strong>${popToday}%</strong></div>
          <div class="weather-stat"><span>紫外線</span><strong>${uv != null ? `${uv}（${uvText(uv)}）` : '—'}</strong></div>
        </div>
      </div>
      <div class="weather-advice-wrap">
        ${riskBlock(advice.risk)}
        ${adviceBlock('出行穿搭', advice.outfit, 'outfit')}
        ${adviceBlock('遊玩安排', advice.activity, 'activity')}
        ${adviceBlock('随身物品', advice.items, 'items')}
      </div>
    </div>
    <div class="weather-forecast">
      <div class="forecast-row">${days}</div>
    </div>`;
}

function setupWeather(): void {
  const widget = document.getElementById('weatherWidget');
  if (!widget) return;
  fetch('/api/weather')
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error('bad status'))))
    .then((data: WeatherData) => {
      if (data && data.current && data.daily) render(data, widget);
      else widget.innerHTML = '<div class="weather-error">天氣資料暫時無法顯示，請稍後再試。</div>';
    })
    .catch(() => {
      widget.innerHTML = '<div class="weather-error">天氣資料暫時無法顯示，請稍後再試；出發前也可查看一般天氣預報。</div>';
    });
}

setupWeather();
