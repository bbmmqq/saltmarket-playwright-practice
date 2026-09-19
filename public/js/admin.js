let products = [];
let editingId = null;

async function init() {
  const { data: user } = await api.get('/api/auth/me');
  if (!user) {
    window.location.href = '/login.html';
    return;
  }
  if (!user.isAdmin) {
    const denied = document.getElementById('admin-denied');
    denied.querySelector('[data-testid="admin-denied-message"]').textContent =
      "You're logged in, but this account doesn't have admin access.";
    denied.hidden = false;
    return;
  }
  document.getElementById('admin-content').hidden = false;
  await loadProducts();
}

async function loadProducts() {
  const tableError = document.getElementById('admin-table-error');
  tableError.hidden = true;

  const { ok, data } = await api.get('/api/admin/products');
  if (!ok) {
    tableError.textContent = data.error || 'Failed to load products';
    tableError.hidden = false;
    return;
  }
  products = data;
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('admin-product-rows');
  tbody.innerHTML = products
    .map((p) => (editingId === p.id ? editRow(p) : viewRow(p)))
    .join('');

  tbody.querySelectorAll('[data-testid="admin-edit-btn"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingId = Number(btn.dataset.id);
      renderTable();
    });
  });

  tbody.querySelectorAll('[data-testid="admin-cancel-btn"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingId = null;
      renderTable();
    });
  });

  tbody.querySelectorAll('[data-testid="admin-save-btn"]').forEach((btn) => {
    btn.addEventListener('click', () => saveRow(Number(btn.dataset.id)));
  });

  tbody.querySelectorAll('[data-testid="admin-delete-btn"]').forEach((btn) => {
    btn.addEventListener('click', () => deleteRow(Number(btn.dataset.id)));
  });
}

function viewRow(p) {
  return `
    <tr data-testid="admin-product-row" data-id="${p.id}">
      <td>${p.emoji}</td>
      <td data-testid="admin-product-name">${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td data-testid="admin-product-price">${money(p.price)}</td>
      <td data-testid="admin-product-stock">${p.stock}</td>
      <td>${escapeHtml(p.unit)}</td>
      <td>
        <button class="secondary" data-testid="admin-edit-btn" data-id="${p.id}">Edit</button>
        <button class="remove-btn" data-testid="admin-delete-btn" data-id="${p.id}">Delete</button>
      </td>
    </tr>
  `;
}

function editRow(p) {
  return `
    <tr data-testid="admin-product-row" data-id="${p.id}">
      <td>${p.emoji}</td>
      <td><input data-testid="admin-edit-name" data-field="name" value="${escapeAttr(p.name)}" /></td>
      <td><input data-testid="admin-edit-category" data-field="category" value="${escapeAttr(p.category)}" /></td>
      <td><input data-testid="admin-edit-price" data-field="price" type="number" step="0.01" min="0" value="${p.price}" style="width:80px;" /></td>
      <td><input data-testid="admin-edit-stock" data-field="stock" type="number" step="1" min="0" value="${p.stock}" style="width:65px;" /></td>
      <td><input data-testid="admin-edit-unit" data-field="unit" value="${escapeAttr(p.unit)}" /></td>
      <td>
        <button data-testid="admin-save-btn" data-id="${p.id}">Save</button>
        <button class="secondary" data-testid="admin-cancel-btn" data-id="${p.id}">Cancel</button>
      </td>
    </tr>
  `;
}

async function saveRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const fields = {};
  row.querySelectorAll('[data-field]').forEach((input) => {
    fields[input.dataset.field] = input.value;
  });

  const tableError = document.getElementById('admin-table-error');
  const { ok, data } = await api.patch(`/api/admin/products/${id}`, fields);
  if (!ok) {
    tableError.textContent = data.error || 'Failed to save product';
    tableError.hidden = false;
    return;
  }
  editingId = null;
  await loadProducts();
}

async function deleteRow(id) {
  if (!window.confirm('Delete this product?')) return;
  const tableError = document.getElementById('admin-table-error');
  const { ok, data } = await api.del(`/api/admin/products/${id}`);
  if (!ok) {
    tableError.textContent = data.error || 'Failed to delete product';
    tableError.hidden = false;
    return;
  }
  await loadProducts();
}

document.getElementById('admin-add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('admin-add-error');
  const successEl = document.getElementById('admin-add-success');
  errorEl.hidden = true;
  successEl.hidden = true;

  const form = e.target;
  const payload = {
    name: form.name.value.trim(),
    category: form.category.value.trim(),
    price: form.price.value,
    stock: form.stock.value,
    unit: form.unit.value.trim(),
    emoji: form.emoji.value.trim(),
    description: form.description.value.trim(),
  };

  const { ok, data } = await api.post('/api/admin/products', payload);
  if (!ok) {
    errorEl.textContent = data.error;
    errorEl.hidden = false;
    return;
  }

  successEl.hidden = false;
  form.reset();
  await loadProducts();
});

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

init();
