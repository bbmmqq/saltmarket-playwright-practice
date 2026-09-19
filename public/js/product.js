async function loadProduct() {
  const id = qs('id');
  const { ok, data: p } = await api.get(`/api/products/${id}`);
  if (!ok) {
    document.getElementById('not-found').hidden = false;
    return;
  }

  const stockBadge =
    p.stock === 0
      ? '<span class="stock-badge out" data-testid="stock-badge">Out of stock</span>'
      : p.stock <= 5
      ? `<span class="stock-badge low" data-testid="stock-badge">Only ${p.stock} left</span>`
      : '<span class="stock-badge ok" data-testid="stock-badge">In stock</span>';

  document.getElementById('product-detail').innerHTML = `
    <div style="display:flex;gap:2rem;flex-wrap:wrap;">
      <div class="product-emoji" style="font-size:5rem;">${p.emoji}</div>
      <div style="flex:1;min-width:250px;">
        <h1 data-testid="product-detail-name">${escapeHtml(p.name)}</h1>
        <p class="product-category">${p.category} · ${p.unit}</p>
        <p class="product-price" data-testid="product-detail-price" style="font-size:1.4rem;">${money(p.price)}</p>
        ${stockBadge}
        <p data-testid="product-detail-description">${escapeHtml(p.description)}</p>
        <div style="display:flex;gap:0.6rem;align-items:center;margin-top:1rem;">
          <label for="qty-input">Qty</label>
          <input id="qty-input" data-testid="qty-input" type="number" min="1" max="${p.stock}" value="1" style="width:70px;padding:0.4rem;" ${p.stock === 0 ? 'disabled' : ''} />
          <button id="add-to-cart-btn" data-testid="add-to-cart-btn" ${p.stock === 0 ? 'disabled' : ''}>Add to cart</button>
        </div>
        <p class="error-text" id="add-error" data-testid="add-error" hidden></p>
        <p class="success-text" id="add-success" data-testid="add-success" hidden>Added to cart!</p>
      </div>
    </div>
  `;

  document.getElementById('add-to-cart-btn')?.addEventListener('click', async () => {
    const quantity = Number(document.getElementById('qty-input').value) || 1;
    const errorEl = document.getElementById('add-error');
    const successEl = document.getElementById('add-success');
    errorEl.hidden = true;
    successEl.hidden = true;

    const { ok: added, data } = await api.post('/api/cart', { productId: p.id, quantity });
    if (added) {
      successEl.hidden = false;
      refreshCartBadge();
    } else {
      errorEl.textContent = data.error;
      errorEl.hidden = false;
    }
  });
}

loadProduct();
