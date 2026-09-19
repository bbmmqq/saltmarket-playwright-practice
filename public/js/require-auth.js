(async function requireAuth() {
  const { data: user } = await api.get('/api/auth/me');
  if (!user) {
    const redirect = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login.html?redirect=${redirect}`;
    return;
  }
  document.documentElement.classList.remove('auth-checking');
})();
