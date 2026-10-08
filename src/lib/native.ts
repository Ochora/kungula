// Thin wrappers over Capacitor plugins, with browser fallbacks so the same
// code runs in a desktop browser during development.
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { LatLng } from './types';

export const isNative = () => Capacitor.isNativePlatform();

export class PhotoError extends Error {}

async function toDataUrl(path: string): Promise<string> {
  const r = await fetch(path);
  const b = await r.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new PhotoError('Could not read the photo.'));
    fr.readAsDataURL(b);
  });
}

const isCancel = (e: unknown) => /cancel|canceled|cancelled|no image|user denied/i.test(String((e as Error)?.message ?? e));

/**
 * Take or pick a photo. Returns a data URL, undefined if the farmer cancelled,
 * or throws PhotoError with a message the farmer can act on.
 */
export async function takePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<string | undefined> {
  if (isNative()) {
    // 1. Permission — explain clearly if refused
    try {
      const want = source === 'camera' ? 'camera' : 'photos';
      let perm = await Camera.checkPermissions();
      if (perm[want] !== 'granted' && perm[want] !== 'limited') perm = await Camera.requestPermissions({ permissions: [want] });
      if (perm[want] === 'denied') {
        throw new PhotoError(source === 'camera'
          ? 'Camera permission is off. Open phone Settings → Apps → Kungula → Permissions and allow Camera.'
          : 'Photo permission is off. Open phone Settings → Apps → Kungula → Permissions and allow Photos.');
      }
    } catch (e) {
      if (e instanceof PhotoError) throw e;
      // some devices don't need runtime permission for the photo picker — continue
    }
    // 2. New camera API (Capacitor camera 8.1+), with fallback to the older one
    try {
      if (source === 'camera') {
        const r = await Camera.takePhoto({ quality: 75, targetWidth: 1280, targetHeight: 1280, correctOrientation: true });
        const path = r.webPath ?? (r.uri ? Capacitor.convertFileSrc(r.uri) : undefined);
        if (path) return await toDataUrl(path);
        if (r.thumbnail) return r.thumbnail.startsWith('data:') ? r.thumbnail : `data:image/jpeg;base64,${r.thumbnail}`;
      } else {
        const r = await Camera.chooseFromGallery({ quality: 75, targetWidth: 1280, allowMultipleSelection: false, limit: 1 } as never);
        const m = r.results?.[0];
        if (!m) return undefined;
        const path = m.webPath ?? (m.uri ? Capacitor.convertFileSrc(m.uri) : undefined);
        if (path) return await toDataUrl(path);
        if (m.thumbnail) return m.thumbnail.startsWith('data:') ? m.thumbnail : `data:image/jpeg;base64,${m.thumbnail}`;
      }
    } catch (e) {
      if (isCancel(e)) return undefined;
      // fall through to the legacy API
    }
    try {
      const p = await Camera.getPhoto({
        quality: 70, width: 1280, resultType: CameraResultType.DataUrl, correctOrientation: true,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      });
      return p.dataUrl;
    } catch (e) {
      if (isCancel(e)) return undefined;
      throw new PhotoError('The camera could not open. Close other camera apps and try again, or choose a photo from the gallery.');
    }
  }
  // Browser fallback: file picker (uses phone camera on mobile browsers)
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return resolve(undefined);
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(f);
    };
    input.click();
  });
}

export async function getPosition(highAccuracy = true): Promise<LatLng & { accuracy?: number }> {
  if (isNative()) {
    try { await Geolocation.requestPermissions(); } catch { /* ignore */ }
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: highAccuracy, timeout: 20000, maximumAge: 5000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
  }
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location not available'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject(new Error(e.message)),
      { enableHighAccuracy: highAccuracy, timeout: 20000, maximumAge: 5000 },
    );
  });
}

/** Watch position while walking a boundary. Returns a stop function. */
export async function watchPosition(cb: (p: LatLng & { accuracy?: number }) => void, onErr?: (e: string) => void): Promise<() => void> {
  if (isNative()) {
    try { await Geolocation.requestPermissions(); } catch { /* ignore */ }
    const id = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }, (p, err) => {
      if (err) return onErr?.(err.message ?? String(err));
      if (p) cb({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
    });
    return () => { Geolocation.clearWatch({ id }); };
  }
  if (!navigator.geolocation) { onErr?.('Location not available'); return () => {}; }
  const id = navigator.geolocation.watchPosition(
    (p) => cb({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
    (e) => onErr?.(e.message), { enableHighAccuracy: true, maximumAge: 0 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

let notifReady = false;
export async function scheduleReminder(title: string, body: string, at: Date): Promise<number | undefined> {
  const id = Math.floor(Math.random() * 2_000_000_000);
  if (isNative()) {
    try {
      if (!notifReady) {
        const perm = await LocalNotifications.requestPermissions();
        notifReady = perm.display === 'granted';
      }
      if (!notifReady) return undefined;
      await LocalNotifications.schedule({
        notifications: [{ id, title, body, schedule: { at, allowWhileIdle: true }, smallIcon: 'ic_stat_kungula', iconColor: '#1F6B3A' }],
      });
      return id;
    } catch { return undefined; }
  }
  return id; // browser: reminders show inside the app only
}

export async function cancelReminder(id?: number) {
  if (id && isNative()) { try { await LocalNotifications.cancel({ notifications: [{ id }] }); } catch { /* ignore */ } }
}

export async function shareText(title: string, text: string) {
  try {
    if (isNative() || typeof navigator.share === 'function') { await Share.share({ title, text, dialogTitle: title }); return true; }
  } catch { /* user cancelled */ }
  try { await navigator.clipboard.writeText(text); alert('Copied to clipboard'); } catch { /* ignore */ }
  return false;
}

/** Save a text file (CSV, GeoJSON, backup) and open the share sheet so the farmer can send it. */
export async function saveAndShareFile(name: string, data: string, mime = 'text/plain') {
  if (isNative()) {
    const res = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try { await Share.share({ title: name, url: res.uri, dialogTitle: `Share ${name}` }); } catch { /* cancelled */ }
    return;
  }
  const blob = new Blob([data], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

const TTS_LANG: Record<string, string> = { en: 'en-GB', sw: 'sw-KE', lg: 'en-GB' };

export async function speak(text: string, lang = 'en') {
  const clean = text.replace(/[*_#>`]/g, '').replace(/\s+/g, ' ').slice(0, 3000);
  try {
    if (isNative()) {
      await TextToSpeech.stop();
      await TextToSpeech.speak({ text: clean, lang: TTS_LANG[lang] ?? 'en-GB', rate: 0.95, pitch: 1, volume: 1, category: 'playback' });
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = TTS_LANG[lang] ?? 'en-GB'; u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  } catch { /* voice not available */ }
}

export async function stopSpeaking() {
  try { if (isNative()) await TextToSpeech.stop(); else window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

export const callNumber = (phone: string) => { window.location.href = `tel:${phone}`; };
export const smsNumber = (phone: string, body = '') => { window.location.href = `sms:${phone}${body ? `?body=${encodeURIComponent(body)}` : ''}`; };
export const whatsapp = (phone: string, text = '') => {
  window.open(`https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`, '_blank');
};
