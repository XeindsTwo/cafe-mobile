import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { AuthError, authApi } from '../api/authApi';

export const telegramReturnUrl = 'cafe-mobile://auth-return';
export const telegramSupported = Platform.OS !== 'web' && !isRunningInExpoGo();

export async function signInThroughTelegram() {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const verifier = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
    encoding: Crypto.CryptoEncoding.BASE64,
  });
  const challenge = digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const start = await authApi.start(challenge);
  if (typeof start?.authorization_url !== 'string' || !Number.isFinite(start.expires_in) || start.expires_in <= 0) {
    throw new AuthError('Сервер вернул неполные данные для входа.');
  }
  const url = new URL(start.authorization_url);
  const get = (key: string) => url.searchParams.getAll(key);
  const state = get('state')[0];
  if (url.origin !== 'https://oauth.telegram.org' || url.pathname !== '/auth' || url.username || url.password ||
      get('state').length !== 1 || !/^mobile\.[\w-]{43}$/.test(state) ||
      get('code_challenge').join() !== challenge || get('code_challenge_method').join() !== 'S256' ||
      get('response_type').join() !== 'code') {
    throw new AuthError('Не удалось открыть безопасную страницу Telegram.');
  }
  const expires = Date.now() + start.expires_in * 1000;
  const result = await WebBrowser.openAuthSessionAsync(url.href, telegramReturnUrl);
  if (result.type !== 'success') return null;
  if (Date.now() >= expires) throw new AuthError('Время входа истекло. Попробуйте ещё раз.');

  const [returnPath, query] = result.url.split('?', 2);
  if (returnPath !== telegramReturnUrl || !query || result.url.includes('#')) {
    throw new AuthError('Проверьте, что вход завершён в Telegram, и попробуйте снова.');
  }
  const params = new URLSearchParams(query);
  const states = params.getAll('state');
  if (states.length !== 1 || states[0] !== state) throw new AuthError('Не удалось подтвердить вход. Начните заново.');
  if (params.get('error') === 'cancelled') return null;
  const codes = params.getAll('code');
  if (params.has('error') || codes.length !== 1 || !codes[0] || codes[0].length > 4096) {
    throw new AuthError('Telegram не вернул код входа. Попробуйте ещё раз.');
  }
  return authApi.complete(codes[0], state, verifier);
}
