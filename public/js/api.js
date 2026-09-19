const api = {
  async get(url) {
    const res = await fetch(url);
    return { ok: res.ok, status: res.status, data: await res.json() };
  },
  async send(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  },
  post(url, body) { return this.send('POST', url, body); },
  patch(url, body) { return this.send('PATCH', url, body); },
  del(url) { return this.send('DELETE', url); },
};

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
