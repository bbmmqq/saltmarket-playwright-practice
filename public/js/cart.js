async function loadCart() {
  const { data: cart } = await api.get('/api/cart');
  const emptyEl = document.getElementById('empty-cart');
  const table = document.getElementById('cart-table');
  const summaryArea = document.getElementById('cart-summary-area');

  if (cart.items.length === 0) {
    emptyEl.hidden = false;
    table.hidden = true;
    summaryArea.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  table.hidden = false;
  summaryArea.hidden = false;

  document.getElementById('cart-items').innerHTML = cart.items
    .map(
      (item) => `
      <tr data-testid="cart-item" data-id="${item.productId}">
        <td>${item.emoji}</td>
        <td data-testid="cart-item-name">${escapeHtml(item.name)}</td>
        <td data-testid="cart-item-price">${money(item.price)}</td>
        <td>
          <input class="qty-input" data-testid="qty-input" data-id="${item.productId}" type="number" min="0" max="${item.stock}" value="${item.quantity}" />
        </td>
        <td data-testid="cart-item-line-total">${money(item.lineTotal)}</td>
        <td><button class="remove-btn" data-testid="remove-btn" data-id="${item.productId}">Remove</button></td>
      </tr>
    `
    )
    .join('');

  document.getElementById('subtotal').textContent = money(cart.subtotal);
  document.getElementById('shipping').textContent = cart.shipping === 0 ? 'Free' : money(cart.shipping);
  document.getElementById('tax').textContent = money(cart.tax);
  document.getElementById('cart-total').textContent = money(cart.total);

  const discountRow = document.getElementById('discount-row');
  if (cart.discount > 0) {
    discountRow.hidden = false;
    document.getElementById('discount').textContent = `-${money(cart.discount)}`;
  } else {
    discountRow.hidden = true;
  }

  const couponApplied = document.getElementById('coupon-applied');
  if (cart.coupon) {
    couponApplied.hidden = false;
    couponApplied.textContent = `Coupon "${cart.coupon}" applied.`;
  } else {
    couponApplied.hidden = true;
  }

  document.querySelectorAll('.qty-input').forEach((input) => {
    input.addEventListener('change', async () => {
      const id = Number(input.dataset.id);
      const quantity = Number(input.value);
      const { ok, data } = await api.patch(`/api/cart/${id}`, { quantity });
      if (!ok) {
        alert(data.error);
      }
      loadCart();
      refreshCartBadge();
    });
  });

  document.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api.del(`/api/cart/${btn.dataset.id}`);
      loadCart();
      refreshCartBadge();
    });
  });
}

document.getElementById('apply-coupon-btn').addEventListener('click', async () => {
  const code = document.getElementById('coupon-input').value.trim();
  const errorEl = document.getElementById('coupon-error');
  errorEl.hidden = true;

  const { ok, data } = await api.post('/api/cart/coupon', { code });
  if (!ok) {
    errorEl.textContent = data.error;
    errorEl.hidden = false;
    return;
  }
  loadCart();
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  window.location.href = '/checkout.html';
});

loadCart();
