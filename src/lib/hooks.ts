import { useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import { fetchWeather } from './weather';
import { getPosition } from './native';
import { loanReadiness } from './score';

/** Keeps the cached forecast fresh when online. */
export function useWeather(online: boolean, auto = true) {
  const weather = useStore((s) => s.weather);
  const profile = useStore((s) => s.profile);
  const set = useStore((s) => s.set);
  const updateProfile = useStore((s) => s.updateProfile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async (relocate = false) => {
    setLoading(true); setError('');
    try {
      let loc = profile?.location;
      if (!loc || relocate) {
        const p = await getPosition(false);
        loc = { lat: p.lat, lng: p.lng };
        updateProfile({ location: loc });
      }
      const w = await fetchWeather(loc);
      set({ weather: w });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load weather');
    } finally {
      setLoading(false);
    }
  }, [profile?.location, set, updateProfile]);

  useEffect(() => {
    if (!auto || !online) return;
    const stale = !weather || Date.now() - weather.fetchedAt > 3 * 3600 * 1000;
    if (stale && profile?.location) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, auto]);

  return { weather, loading, error, refresh };
}

export function useScore() {
  const profile = useStore((s) => s.profile);
  const activities = useStore((s) => s.activities);
  const plots = useStore((s) => s.plots);
  const tracePlots = useStore((s) => s.tracePlots);
  const lessons = useStore((s) => s.lessons);
  const scans = useStore((s) => s.scans);
  const loans = useStore((s) => s.loans);
  return useMemo(
    () => loanReadiness({ profile, activities, plots, tracePlots, lessons, scans, loans }),
    [profile, activities, plots, tracePlots, lessons, scans, loans],
  );
}
