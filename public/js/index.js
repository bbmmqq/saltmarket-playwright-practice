let state = {
  search: qs('q') || '',
  category: '',
  sort: '',
  page: 1,
};

async function loadCategories() {
  const { data: categories } = await api.get('/api/categories');
  const el = document.getElementById('category-filters');
  const all = ['All', ...categories];
  el.innerHTML = all
    .map((c) => {
      const value = c === 'All' ? '' : c;
      const active = state.category === value ? 'active' : '';
      return `<button class="category-btn ${active}" data-category="${value}" data-testid="category-btn">${c}</button>`;
    })
    .join('');

  el.querySelectorAll('.category-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.category;
      state.page = 1;
      loadCategories();
      loadProducts();
    });
  });
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (state.search) params.set('search', state.search);
  if (state.category) params.set('category', state.category);
  if (state.sort) params.set('sort', state.sort);
  params.set('page', state.page);
  params.set('pageSize', 8);

  const { data } = await api.get(`/api/products?${params.toString()}`);
  const grid = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');

  emptyState.hidden = data.items.length > 0;
  document.getElementById('results-info').textContent = state.search
    ? `${data.total} result(s) for "${state.search}"`
    : `${data.total} product(s)`;

  grid.innerHTML = data.items
    .map((p) => {
      const stockBadge =
        p.stock === 0
          ? '<span class="stock-badge out" data-testid="stock-badge">Out of stock</span>'
          : p.stock <= 5
          ? `<span class="stock-badge low" data-testid="stock-badge">Only ${p.stock} left</span>`
          : '<span class="stock-badge ok" data-testid="stock-badge">In stock</span>';

      return `
        <div class="product-card" data-testid="product-card" data-id="${p.id}">
          <a href="/product.html?id=${p.id}" style="text-decoration:none;color:inherit;">
            <div class="product-emoji">${p.emoji}</div>
            <div class="product-name" data-testid="product-name">${escapeHtml(p.name)}</div>
            <div class="product-category">${p.category} · ${p.unit}</div>
            <div class="product-price" data-testid="product-price">${money(p.price)}</div>
          </a>
          ${stockBadge}
          <button data-testid="add-to-cart-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
            ${p.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      `;
    })
    .join('');

  grid.querySelectorAll('[data-testid="add-to-cart-btn"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.id);
      const { ok, data } = await api.post('/api/cart', { productId: id, quantity: 1 });
      if (ok) {
        refreshCartBadge();
        const original = btn.textContent;
        btn.textContent = 'Added ✓';
        setTimeout(() => { btn.textContent = original; }, 1000);
      } else {
        alert(data.error);
      }
    });
  });

  document.getElementById('page-indicator').textContent = `Page ${data.page} of ${data.totalPages}`;
  document.getElementById('prev-page').disabled = data.page <= 1;
  document.getElementById('next-page').disabled = data.page >= data.totalPages;
}

document.getElementById('sort-select').addEventListener('change', (e) => {
  state.sort = e.target.value;
  state.page = 1;
  loadProducts();
});

document.getElementById('prev-page').addEventListener('click', () => {
  state.page = Math.max(1, state.page - 1);
  loadProducts();
});

document.getElementById('next-page').addEventListener('click', () => {
  state.page += 1;
  loadProducts();
});

loadCategories();
loadProducts();
