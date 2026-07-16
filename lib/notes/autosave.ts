const DEBOUNCE_MS = 800;
const SNAPSHOT_MIN_CHARS = 20;
const SNAPSHOT_MIN_INTERVAL_MS = 60_000;

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  }) as T & { cancel: () => void };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

export function shouldSnapshot(
  lastSnapshot: number,
  charDelta: number,
): boolean {
  const now = Date.now();
  return (
    Math.abs(charDelta) >= SNAPSHOT_MIN_CHARS ||
    now - lastSnapshot >= SNAPSHOT_MIN_INTERVAL_MS
  );
}

export { DEBOUNCE_MS };
