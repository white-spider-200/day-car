export function logout(redirectPath = '/login') {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_role');
  localStorage.removeItem('auth_email');
  window.dispatchEvent(new Event('auth-changed'));
  window.history.pushState({}, '', redirectPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

