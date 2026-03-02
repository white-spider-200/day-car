export type AuthRole = 'ADMIN' | 'DOCTOR' | 'USER';

type AuthSessionInput = {
  role: AuthRole;
  token?: string | null;
  email?: string | null;
};

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_ROLE_KEY = 'auth_role';
const AUTH_EMAIL_KEY = 'auth_email';

function isAuthRole(value: string | null): value is AuthRole {
  return value === 'ADMIN' || value === 'DOCTOR' || value === 'USER';
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = window.atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function emitAuthChanged() {
  window.dispatchEvent(new Event('auth-changed'));
}

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredAuthRole(): AuthRole | null {
  const value = localStorage.getItem(AUTH_ROLE_KEY);
  if (isAuthRole(value)) {
    return value;
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  const payload = decodeJwtPayload(token);
  const role = typeof payload?.role === 'string' ? payload.role : null;
  if (!isAuthRole(role)) {
    return null;
  }

  localStorage.setItem(AUTH_ROLE_KEY, role);
  return role;
}

export function getStoredAuthEmail(): string | null {
  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function roleHomePath(role: AuthRole): string {
  if (role === 'ADMIN') {
    return '/admin';
  }
  if (role === 'DOCTOR') {
    return '/doctor-dashboard';
  }
  return '/dashboard';
}

export function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function saveAuthSession(input: AuthSessionInput) {
  localStorage.setItem(AUTH_ROLE_KEY, input.role);

  if (input.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, input.token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  const normalizedEmail = input.email?.trim();
  if (normalizedEmail) {
    localStorage.setItem(AUTH_EMAIL_KEY, normalizedEmail);
  } else {
    localStorage.removeItem(AUTH_EMAIL_KEY);
  }

  emitAuthChanged();
}

export function redirectToRoleHome(role: AuthRole) {
  navigateTo(roleHomePath(role));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  emitAuthChanged();
}

export function logout(redirectPath = '/login') {
  clearAuthSession();
  navigateTo(redirectPath);
}
