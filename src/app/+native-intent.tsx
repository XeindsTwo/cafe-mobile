// The system browser delivers this link to the in-flight auth session.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (path === 'cafe-mobile://auth-return' || path.startsWith('cafe-mobile://auth-return?')) {
    return initial ? '/' : null;
  }
  return path;
}
