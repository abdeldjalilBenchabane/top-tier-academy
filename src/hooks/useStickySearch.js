import { useEffect, useState } from 'react';

// Keeps a page's search text across navigation. Opening a course and coming
// back used to drop whatever the student had typed, sending them to an
// unfiltered list. sessionStorage (not localStorage) so it lasts for the
// browsing session only, and every access is guarded because private-mode
// browsers can throw on it.
export default function useStickySearch(key) {
  const storageKey = `tth:search:${key}`;

  const [searchTerm, setSearchTerm] = useState(() => {
    try { return sessionStorage.getItem(storageKey) || ''; } catch { return ''; }
  });

  useEffect(() => {
    try {
      if (searchTerm) sessionStorage.setItem(storageKey, searchTerm);
      else sessionStorage.removeItem(storageKey);
    } catch { /* storage unavailable — the search still works, just not sticky */ }
  }, [searchTerm, storageKey]);

  return [searchTerm, setSearchTerm];
}
