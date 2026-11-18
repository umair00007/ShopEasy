import { useEffect, useState } from 'react';

// Returns a number that increases whenever the browser tab becomes visible again.
// Put it in a data-fetching effect's dependency list to refetch (e.g. after editing stock in another tab).
export default function useRefreshOnFocus() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && setTick((t) => t + 1);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);
  return tick;
}
