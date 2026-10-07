import type { LatLng, WeatherCache } from './types';

// Open-Meteo: free, no API key, global forecast models. UNMA feeds can be added
// on the server side later and merged into the same shape.
export async function fetchWeather(loc: LatLng): Promise<WeatherCache> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', loc.lat.toFixed(4));
  url.searchParams.set('longitude', loc.lng.toFixed(4));
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code');
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');
  url.searchParams.set('forecast_days', '14');
  url.searchParams.set('timezone', 'Africa/Kampala');
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error('Weather service unavailable');
  const j = await r.json();
  const d = j.daily;
  return {
    fetchedAt: Date.now(),
    location: loc,
    daily: d.time.map((date: string, i: number) => ({
      date,
      tMax: d.temperature_2m_max[i],
      tMin: d.temperature_2m_min[i],
      rain: d.precipitation_sum[i] ?? 0,
      rainProb: d.precipitation_probability_max?.[i] ?? 0,
      wind: d.wind_speed_10m_max[i] ?? 0,
      code: d.weather_code[i] ?? 0,
    })),
    current: j.current ? {
      temp: j.current.temperature_2m, humidity: j.current.relative_humidity_2m,
      code: j.current.weather_code, wind: j.current.wind_speed_10m,
    } : undefined,
  };
}

export function weatherIcon(code: number) {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 82) return '🌧️';
  if (code <= 99) return '⛈️';
  return '🌡️';
}

export function weatherWord(code: number) {
  if (code === 0) return 'Sunny';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 82) return 'Showers';
  return 'Thunderstorms';
}

export interface FarmAlert { level: 'info' | 'warn' | 'urgent'; icon: string; title: string; text: string }

/** Turn the forecast into farm actions for the farmer's crops and animals. */
export function farmAlerts(w: WeatherCache | undefined, crops: string[], animals: string[]): FarmAlert[] {
  if (!w || !w.daily.length) return [];
  const out: FarmAlert[] = [];
  const next2 = w.daily.slice(0, 2);
  const next10 = w.daily.slice(0, 10);
  const heavySoon = next2.find((d) => d.rain >= 10 || (d.rainProb >= 70 && d.rain >= 5));
  if (heavySoon) {
    out.push({ level: 'warn', icon: '🌧️', title: 'Rain in the next 48 hours', text: 'Do not spray fungicide or insecticide today — rain will wash it off. Spray after the rain when leaves are dry.' });
  }
  const dryRun = (() => { let run = 0, best = 0; for (const d of next10) { run = d.rain < 1 ? run + 1 : 0; best = Math.max(best, run); } return best; })();
  if (dryRun >= 6) {
    const veg = crops.some((c) => ['tomato', 'cabbage', 'onion'].includes(c));
    out.push({ level: 'warn', icon: '☀️', title: `${dryRun} dry days ahead`, text: veg ? 'Water your vegetables early morning or evening and mulch to keep moisture.' : 'Mulch to keep moisture. Delay planting until rains return.' });
  }
  const humid = (w.current?.humidity ?? 0) >= 85 || next2.filter((d) => d.rain > 2).length === 2;
  if (humid && crops.includes('banana')) out.push({ level: 'info', icon: '🍌', title: 'Banana wilt risk is up', text: 'Wet, humid days help BXW spread. Remove male buds with a forked stick and clean tools.' });
  if (humid && crops.includes('tomato')) out.push({ level: 'warn', icon: '🍅', title: 'Tomato blight weather', text: 'Cool, wet days favour late blight. Check leaves today and protect healthy plants.' });
  if (humid && crops.includes('coffee')) out.push({ level: 'info', icon: '☕', title: 'Coffee rust weather', text: 'Look under leaves for orange powder this week.' });
  const cold = next2.find((d) => d.tMin <= 12);
  if (cold) out.push({ level: 'info', icon: '🥶', title: 'Cold night coming', text: animals.includes('poultry') ? 'Keep chicks warm — close curtains in the poultry house.' : 'Protect young seedlings from cold.' });
  const windy = next2.find((d) => d.wind >= 35);
  if (windy) out.push({ level: 'warn', icon: '💨', title: 'Strong winds', text: 'Prop up heavy banana bunches and avoid spraying (drift).' });
  const hot = next2.find((d) => d.tMax >= 32);
  if (hot && animals.length) out.push({ level: 'info', icon: '🌡️', title: 'Hot days', text: 'Give animals shade and plenty of clean water.' });
  if (!out.length) out.push({ level: 'info', icon: '✅', title: 'Good farming weather', text: 'No weather risks for your farm in the next two days.' });
  return out;
}

/** Simple seasonal summary from the 14-day outlook. */
export function outlook(w?: WeatherCache) {
  if (!w) return undefined;
  const total = w.daily.reduce((a, d) => a + d.rain, 0);
  const rainy = w.daily.filter((d) => d.rain >= 2).length;
  let word = 'Mostly dry';
  if (total > 60 || rainy >= 8) word = 'Wet';
  else if (total > 25 || rainy >= 4) word = 'Some rain';
  return { total: Math.round(total), rainyDays: rainy, word };
}
