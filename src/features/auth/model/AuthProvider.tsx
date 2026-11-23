import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Account, AuthError, authApi, TokenPair } from '../api/authApi';
import { signInThroughTelegram, telegramSupported } from './telegram';

const storageKey = 'cafe.refresh.v1';
const secureOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
type AuthState =
  | { status: 'loading' | 'guest' }
  | { status: 'ready'; account: Account }
  | { status: 'error'; message: string };
type AuthContextValue = {
  state: AuthState;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  const inFlight = useRef(false);
  const refreshToken = useRef<string | null>(null);
  const expiresAt = useRef(0);
  const pendingProfile = useRef<TokenPair | null>(null);

  const accept = useCallback(async (pair: TokenPair) => {
    // Write the rotation before reading the profile so a failed profile call can be retried.
    refreshToken.current = pair.refresh_token;
    pendingProfile.current = pair;
    expiresAt.current = Date.now() + pair.access_expires_in * 1000;
    await SecureStore.setItemAsync(storageKey, pair.refresh_token, secureOptions);
    const account = await authApi.me(pair.access_token);
    pendingProfile.current = null;
    setState({ status: 'ready', account });
  }, []);

  const restore = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      if (Platform.OS === 'web') {
        setState({ status: 'guest' });
        return;
      }
      const token = refreshToken.current ?? await SecureStore.getItemAsync(storageKey, secureOptions);
      if (!token) {
        setState({ status: 'guest' });
        return;
      }
      const pending = pendingProfile.current;
      const pair = pending && expiresAt.current > Date.now() + 5000 ? pending : await authApi.refresh(token);
      await accept(pair);
    } catch (error) {
      if (error instanceof AuthError && (error.status === 401 || error.status === 403)) {
        refreshToken.current = null;
        pendingProfile.current = null;
        expiresAt.current = 0;
        try {
          await SecureStore.deleteItemAsync(storageKey, secureOptions);
          setState({ status: 'guest' });
        } catch {
          setState({ status: 'error', message: 'Не удалось очистить сессию. Попробуйте снова.' });
        }
      } else {
        setState({ status: 'error', message: 'Не удалось восстановить вход. Проверьте интернет и попробуйте снова.' });
      }
    } finally {
      inFlight.current = false;
    }
  }, [accept]);

  useEffect(() => {
    // Start after mounting so SecureStore can resolve independently of the screen tree.
    const id = setTimeout(() => { void restore(); }, 0);
    const sub = AppState.addEventListener('change', value => {
      if (value === 'active' && refreshToken.current && Date.now() >= expiresAt.current - 5000) void restore();
    });
    return () => { clearTimeout(id); sub.remove(); };
  }, [restore]);

  const signIn = async () => {
    if (inFlight.current || !telegramSupported) return false;
    inFlight.current = true;
    try {
      const pair = await signInThroughTelegram();
      if (!pair) return false;
      await accept(pair);
      return true;
    } catch (error) {
      if (pendingProfile.current) setState({ status: 'error', message: 'Не удалось загрузить профиль. Попробуйте снова.' });
      throw error;
    } finally {
      inFlight.current = false;
    }
  };

  const signOut = async () => {
    if (Platform.OS === 'web') return;
    if (inFlight.current) throw new AuthError('Дождитесь завершения входа.');
    inFlight.current = true;
    try {
      const token = refreshToken.current ?? await SecureStore.getItemAsync(storageKey, secureOptions);
      await SecureStore.deleteItemAsync(storageKey, secureOptions);
      refreshToken.current = null;
      pendingProfile.current = null;
      expiresAt.current = 0;
      setState({ status: 'guest' });
      if (token) await authApi.logout(token).catch(() => undefined);
    } finally {
      inFlight.current = false;
    }
  };

  return <AuthContext.Provider value={{ state, signIn, signOut, restore }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
