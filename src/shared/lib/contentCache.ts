const loadedContent = new Set<string>();

export function hasLoadedContent(key: string) {
  return loadedContent.has(key);
}

export function markContentLoaded(key: string) {
  loadedContent.add(key);
}
