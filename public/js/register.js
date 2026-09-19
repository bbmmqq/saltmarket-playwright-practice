document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');
  errorEl.hidden = true;

  const form = e.target;
  const password = form.password.value;
  const confirm = form.confirm.value;

  if (password !== confirm) {
    errorEl.textContent = 'Passwords do not match';
    errorEl.hidden = false;
    return;
  }

  const { ok, data } = await api.post('/api/auth/register', {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    password,
  });

  if (!ok) {
    errorEl.textContent = data.error;
    errorEl.hidden = false;
    return;
  }

  window.location.href = '/index.html';
});
