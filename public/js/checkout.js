async function loadSummary() {
  const { data: cart } = await api.get('/api/cart');
  const summaryEl = document.getElementById('order-summary');

  if (cart.items.length === 0) {
    summaryEl.innerHTML = `<p data-testid="empty-cart-warning">Your cart is empty. <a href="/index.html">Go shopping</a>.</p>`;
    document.getElementById('place-order-btn').disabled = true;
    return cart;
  }

  summaryEl.innerHTML = `
    <h2>Order summary</h2>
    ${cart.items.map((i) => `<div class="summary-row"><span>${escapeHtml(i.name)} x${i.quantity}</span><span>${money(i.lineTotal)}</span></div>`).join('')}
    <div class="summary-row"><span>Subtotal</span><span data-testid="checkout-subtotal">${money(cart.subtotal)}</span></div>
    ${cart.discount > 0 ? `<div class="summary-row"><span>Discount</span><span>-${money(cart.discount)}</span></div>` : ''}
    <div class="summary-row"><span>Shipping</span><span>${cart.shipping === 0 ? 'Free' : money(cart.shipping)}</span></div>
    <div class="summary-row"><span>Tax</span><span>${money(cart.tax)}</span></div>
    <div class="summary-row total"><span>Total</span><span data-testid="checkout-total">${money(cart.total)}</span></div>
  `;
  return cart;
}

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('checkout-error');
  errorEl.hidden = true;

  const form = e.target;
  const shipping = {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    address: form.address.value.trim(),
    city: form.city.value.trim(),
    postalCode: form.postalCode.value.trim(),
    country: form.country.value.trim(),
  };
  const payment = {
    cardNumber: form.cardNumber.value.trim(),
    expiry: form.expiry.value.trim(),
    cvc: form.cvc.value.trim(),
  };

  const { ok, data } = await api.post('/api/checkout', { shipping, payment });
  if (!ok) {
    errorEl.textContent = data.error;
    errorEl.hidden = false;
    return;
  }

  window.location.href = `/confirmation.html?orderId=${data.id}`;
});

loadSummary();
