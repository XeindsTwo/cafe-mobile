import { useEffect, useSyncExternalStore } from 'react';

const loadedContent = new Set<string>();
const listeners = new Set<() => void>();
const pending = new Map<string, ReturnType<typeof setTimeout>>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function clearContentCache() {
  pending.forEach(clearTimeout);
  pending.clear();
  loadedContent.clear();
  listeners.forEach(listener => listener());
}
// Mock menus arrive as a whole day: switching category never fetches it again.
export function useContentLoading(key: string) {
  const ready = useSyncExternalStore(subscribe, () => loadedContent.has(key), () => false);
  useEffect(() => {
    if (loadedContent.has(key) || pending.has(key)) return;
    pending.set(key, setTimeout(() => {
      loadedContent.add(key);
      pending.delete(key);
      listeners.forEach(listener => listener());
    }, 360));
  }, [key]);
  return !ready;
}
