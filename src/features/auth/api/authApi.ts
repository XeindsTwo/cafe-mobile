export type TokenPair = { access_token: string; refresh_token: string; token_type: 'bearer'; access_expires_in: number };
export type Account = { id: number; first_name: string; last_name: string | null; phone: string };

export class AuthError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
  }
}

function apiUrl() {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!value) throw new AuthError('Адрес сервера для входа ещё не настроен.');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new AuthError('Для входа нужен HTTPS-адрес сервера.');
  }
  return url.href.replace(/\/$/, '');
}

async function request<T>(path: string, body?: object, accessToken?: string): Promise<T> {
  const url = apiUrl() + path;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        Accept: 'application/json',
        ...(body && { 'Content-Type': 'application/json' }),
        ...(accessToken && { Authorization: 'Bearer ' + accessToken }),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const detail: unknown = body?.detail;
      const status = response.status;
      let message = 'Вход временно недоступен. Попробуйте ещё раз.';
      if (detail === 'Telegram phone access is required') message = 'Разрешите Telegram передать подтверждённый номер телефона.';
      else if (detail === 'Telegram profile name is required') message = 'Добавьте имя в профиле Telegram и попробуйте снова.';
      else if (status === 403) message = 'Вход в этот аккаунт недоступен.';
      else if (status === 409) message = 'Не удалось завершить вход. Начните заново. Если ошибка повторится, обратитесь в столовую.';
      else if (status === 401 || status === 410) message = 'Срок действия входа истёк. Начните заново.';
      else if (status === 429) message = 'Слишком много попыток. Попробуйте чуть позже.';
      throw new AuthError(message, status);
    }
    return (response.status === 204 ? undefined : await response.json()) as T;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.');
  } finally {
    clearTimeout(timeout);
  }
}

function checkedTokens(pair: TokenPair) {
  if (pair?.token_type !== 'bearer' || typeof pair.access_token !== 'string' || !pair.access_token ||
      typeof pair.refresh_token !== 'string' || !pair.refresh_token ||
      !Number.isFinite(pair.access_expires_in) || pair.access_expires_in <= 0) {
    throw new AuthError('Сервер вернул неполные данные для входа.');
  }
  return pair;
}

export const authApi = {
  start: (codeChallenge: string) => request<{ authorization_url: string; expires_in: number }>(
    '/auth/telegram/start', { code_challenge: codeChallenge, client: 'mobile' },
  ),
  complete: async (code: string, state: string, verifier: string) => checkedTokens(await request<TokenPair>(
    '/auth/telegram/complete', { code, state, code_verifier: verifier },
  )),
  refresh: async (token: string) => checkedTokens(await request<TokenPair>('/auth/refresh', { refresh_token: token })),
  logout: (token: string) => request<void>('/auth/logout', { refresh_token: token }),
  me: (token: string) => request<Account>('/users/me', undefined, token),
};
