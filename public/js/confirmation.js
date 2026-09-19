async function loadOrder() {
  const orderId = qs('orderId');
  const el = document.getElementById('confirmation-content');
  const { ok, data: order } = await api.get(`/api/orders/${orderId}`);

  if (!ok) {
    el.innerHTML = `<p data-testid="order-not-found">Order not found.</p>`;
    return;
  }

  el.innerHTML = `
    <h1 data-testid="confirmation-title">Thank you, ${escapeHtml(order.shipping.fullName)}!</h1>
    <p>Your order has been placed successfully.</p>
    <p>Order number: <strong data-testid="order-id">#${order.id}</strong></p>
    <div class="order-summary">
      ${order.items.map((i) => `<div class="summary-row"><span>${escapeHtml(i.name)} x${i.quantity}</span><span>${money(i.lineTotal)}</span></div>`).join('')}
      <div class="summary-row total"><span>Total paid</span><span data-testid="order-total">${money(order.total)}</span></div>
    </div>
    <p><a href="/index.html" data-testid="continue-shopping-link">Continue shopping</a></p>
  `;
}

loadOrder();
