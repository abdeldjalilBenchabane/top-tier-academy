/**
 * Runs `task` every `intervalMs`, but only while the tab is actually being
 * looked at, and once immediately whenever it becomes visible again.
 *
 * The admin dashboard used plain setInterval, so a browser left open on it kept
 * asking for pending counts all day whether or not anyone was there. Between
 * the four counters that was a request every couple of seconds, for numbers
 * nobody was reading. Polling only a visible tab costs nothing while it is in
 * the background, and refreshing the moment it comes back means the counts are
 * still up to date the instant they are looked at.
 *
 * @returns a cleanup function for the caller's useEffect.
 */
export function pollWhileVisible(task: () => void, intervalMs: number): () => void {
  let timer: number | undefined;

  const stop = () => {
    if (timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };

  const start = () => {
    stop();
    timer = window.setInterval(task, intervalMs);
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      task();
      start();
    } else {
      stop();
    }
  };

  if (document.visibilityState === 'visible') start();
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    stop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}

/**
 * How often the dashboard counters refresh. These are badge numbers on a
 * sidebar — a pending course that shows up half a minute later costs nobody
 * anything, and each of these contexts has its own refresh function for the
 * places that need the number updated at once.
 */
export const COUNTER_POLL_MS = 30_000;
