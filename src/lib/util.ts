import type { LatLng } from './types';

export const ugx = (n?: number) =>
  n === undefined || Number.isNaN(n) ? '—' : 'UGX ' + Math.round(n).toLocaleString('en-UG');

export const num = (n?: number, d = 0) =>
  n === undefined || Number.isNaN(n) ? '—' : n.toLocaleString('en-UG', { maximumFractionDigits: d });

export const fmtDate = (d: string | number | Date) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDay = (d: string | number | Date) =>
  new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const ago = (t: number) => {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Area of a GPS polygon in square metres (equirectangular projection, fine for farm sizes). */
export function polygonAreaM2(pts: LatLng[]): number {
  if (pts.length < 3) return 0;
  const R = 6371008.8;
  const lat0 = (pts.reduce((a, p) => a + p.lat, 0) / pts.length) * (Math.PI / 180);
  const xy = pts.map((p) => ({
    x: R * (p.lng * Math.PI / 180) * Math.cos(lat0),
    y: R * (p.lat * Math.PI / 180),
  }));
  let s = 0;
  for (let i = 0; i < xy.length; i++) {
    const a = xy[i]; const b = xy[(i + 1) % xy.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

export const m2ToAcres = (m2: number) => m2 / 4046.8564;
export const m2ToHa = (m2: number) => m2 / 10000;

/** Distance in metres between two GPS points (haversine). */
export function distanceM(a: LatLng, b: LatLng) {
  const R = 6371008.8; const toR = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toR; const dLng = (b.lng - a.lng) * toR;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * toR) * Math.cos(b.lat * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

/** GeoJSON FeatureCollection for plots (EUDR-friendly: polygon, or point for small plots). */
export function toGeoJSON(items: { id: string; name: string; boundary: LatLng[]; props?: Record<string, unknown> }[]) {
  return JSON.stringify({
    type: 'FeatureCollection',
    features: items.filter((i) => i.boundary.length).map((i) => ({
      type: 'Feature',
      properties: { id: i.id, name: i.name, ...i.props },
      geometry: i.boundary.length >= 3
        ? { type: 'Polygon', coordinates: [[...i.boundary, i.boundary[0]].map((p) => [+p.lng.toFixed(6), +p.lat.toFixed(6)])] }
        : { type: 'Point', coordinates: [+i.boundary[0].lng.toFixed(6), +i.boundary[0].lat.toFixed(6)] },
    })),
  }, null, 2);
}

/** Shrink a photo to a small JPEG data URL so it fits in on-device storage. */
export async function compressImage(dataUrl: string, maxSide = 640, quality = 0.62): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
