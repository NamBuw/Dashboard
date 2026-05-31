type Entry<T> = { value: T; expiresAt: number };
const store = new Map<string, Entry<unknown>>();

export function cacheKey(parts: Record<string, unknown>): string {
  return JSON.stringify(parts, Object.keys(parts).sort());
}

export async function getOrCompute<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ value: T; cached: boolean; cachedAt: string }> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return { value: hit.value, cached: true, cachedAt: new Date(hit.expiresAt - ttlMs).toISOString() };
  }
  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlMs });
  // LRU cap 64
  if (store.size > 64) {
    const oldest = [...store.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0]?.[0];
    if (oldest) store.delete(oldest);
  }
  return { value, cached: false, cachedAt: new Date(now).toISOString() };
}
