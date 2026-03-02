import { getStoredAuthToken } from './auth';

function uniqueNonEmpty(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
}

function normalizeBase(base: string): string {
  if (base === '/api') {
    return base;
  }
  return base.replace(/\/+$/, '');
}

function buildApiCandidates(): string[] {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const envBase = typeof env.VITE_API_BASE_URL === 'string' ? env.VITE_API_BASE_URL : '';

  const browserHostBase =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:8000`
      : '';

  return uniqueNonEmpty([
    envBase,
    '/api',
    browserHostBase,
    'http://127.0.0.1:8000',
    'http://localhost:8000',
  ]).map(normalizeBase);
}

function toUrl(base: string, path: string): string {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with '/': ${path}`);
  }
  return `${base}${path}`;
}

export async function fetchFirstReachable(path: string, init?: RequestInit): Promise<Response> {
  const candidates = buildApiCandidates();
  const errors: string[] = [];

  for (const base of candidates) {
    const url = toUrl(base, path);
    try {
      const response = await fetch(url, init);

      if (response.status === 404 || response.status === 502 || response.status === 503 || response.status === 504) {
        errors.push(`${url} -> ${response.status}`);
        continue;
      }

      return response;
    } catch {
      errors.push(`${url} -> network_error`);
    }
  }

  throw new Error(`Failed to reach API for ${path}. Tried: ${errors.join(', ')}`);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function buildErrorMessage(defaultMessage: string, responseBody: unknown): string {
  if (
    typeof responseBody === 'object' &&
    responseBody !== null &&
    'detail' in responseBody &&
    typeof (responseBody as { detail?: unknown }).detail === 'string'
  ) {
    return (responseBody as { detail: string }).detail;
  }

  if (
    typeof responseBody === 'object' &&
    responseBody !== null &&
    'detail' in responseBody &&
    Array.isArray((responseBody as { detail?: unknown }).detail)
  ) {
    const detailItems = (responseBody as { detail: Array<{ msg?: string; loc?: Array<string | number> }> }).detail;
    const parsed = detailItems
      .map((item) => {
        if (!item?.msg) {
          return null;
        }
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : null;
        return typeof field === 'string' ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join('; ');
    if (parsed) {
      return parsed;
    }
  }

  return defaultMessage;
}

export async function apiRequest(path: string, init?: RequestInit, requiresAuth = false): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined);

  if (requiresAuth) {
    const token = getStoredAuthToken();
    if (!token) {
      throw new ApiError('You are not logged in.', 401);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetchFirstReachable(path, {
    ...init,
    headers,
  });
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
  requiresAuth = false,
  defaultErrorMessage = 'Request failed'
): Promise<T> {
  const response = await apiRequest(path, init, requiresAuth);

  if (!response.ok) {
    const responseBody = await response.json().catch(() => null);
    const message = buildErrorMessage(`${defaultErrorMessage} (${response.status})`, responseBody);
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
