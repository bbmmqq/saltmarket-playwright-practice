document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.hidden = true;

  const form = e.target;
  const { ok, data } = await api.post('/api/auth/login', {
    email: form.email.value.trim(),
    password: form.password.value,
  });

  if (!ok) {
    errorEl.textContent = data.error;
    errorEl.hidden = false;
    return;
  }

  window.location.href = '/index.html';
});
