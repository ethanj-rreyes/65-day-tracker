import { useEffect, useState } from 'react';

// Re-renders every `ms` milliseconds (pass 0/null to pause ticking).
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ms) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
