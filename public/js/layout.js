function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  el.outerHTML = `
    <div class="announcement-bar" data-testid="announcement-bar">
      🚚 Free shipping on orders over $50 &middot; Use code <strong>SALT10</strong> for 10% off
    </div>
    <header class="site-header">
      <a class="logo" href="/index.html">🧂 SaltMarket</a>
      <form id="search-form">
        <input id="search-input" name="q" type="text" placeholder="Search salts..." data-testid="search-input" />
        <button type="submit">Search</button>
      </form>
      <nav class="site-nav">
        <a href="/index.html">Shop</a>
        <a class="cart-link" href="/cart.html" data-testid="cart-link">
          Cart<span class="cart-badge" data-testid="cart-badge" id="cart-badge">0</span>
        </a>
        <span id="auth-area"></span>
      </nav>
    </header>
  `;

  const form = document.getElementById('search-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('search-input').value.trim();
    window.location.href = `/index.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  });

  const initialQ = qs('q');
  if (initialQ) document.getElementById('search-input').value = initialQ;

  refreshCartBadge();
  refreshAuthArea();
}

async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const { data } = await api.get('/api/cart');
  badge.textContent = data.itemCount;
}

async function refreshAuthArea() {
  const area = document.getElementById('auth-area');
  if (!area) return;
  const { data: user } = await api.get('/api/auth/me');
  if (user) {
    const adminLink = user.isAdmin
      ? `<a href="/admin.html" data-testid="admin-link">Admin</a>`
      : '';
    area.innerHTML = `
      ${adminLink}
      <span data-testid="account-name">Hi, ${escapeHtml(user.name)}</span>
      <button id="logout-btn" data-testid="logout-btn" class="secondary">Logout</button>
    `;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await api.post('/api/auth/logout');
      window.location.href = '/index.html';
    });
  } else {
    area.innerHTML = `<a href="/login.html" data-testid="login-link">Login</a>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.outerHTML = `
    <footer class="site-footer">
      SaltMarket — a demo store for Playwright test practice. Not a real store.
    </footer>
  `;
}

renderHeader();
renderFooter();
