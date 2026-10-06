// =============================================
// MedQuick — Admin (admin.js)
// =============================================

function renderAdminDashboard() {
  updateAdminStats();
  renderAdminOrders();
  renderAdminMedicines();
  renderAdminCustomers();
}

function updateAdminStats() {
  const orders  = getOrders();
  const users   = getUsers().filter(u => u.role !== 'admin');
  const revenue = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0);
  const pending = orders.filter(o => o.status === 'pending').length;

  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('stat-total-orders', orders.length);
  el('stat-pending-orders', pending);
  el('stat-customers', users.length);
  el('stat-revenue', `₹${revenue.toLocaleString('en-IN')}`);
}

function switchAdminTab(tab) {
  ['orders','medicines','customers'].forEach(t => {
    const panel = document.getElementById(`admin-panel-${t}`);
    const btn   = document.getElementById(`admin-tab-${t}`);
    if (panel) panel.classList.add('hidden');
    if (btn)   btn.classList.remove('active');
  });
  const active = document.getElementById(`admin-panel-${tab}`);
  const activeBtn = document.getElementById(`admin-tab-${tab}`);
  if (active) active.classList.remove('hidden');
  if (activeBtn) activeBtn.classList.add('active');
}

// ---- Orders Management ----
function filterAdminOrders() {
  renderAdminOrders();
}

function renderAdminOrders() {
  const statusFilter = document.getElementById('order-status-filter')?.value || '';
  let orders = getOrders().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (statusFilter) orders = orders.filter(o => o.status === statusFilter);

  const container = document.getElementById('admin-orders-list');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><h3>No orders found</h3></div>`;
    return;
  }

  const statusColors  = { pending: 'warning', confirmed: 'info', out_for_delivery: 'primary', delivered: 'success', cancelled: 'danger' };
  const statusOptions = ['pending','confirmed','out_for_delivery','delivered','cancelled'];
  const statusLabels  = { pending: 'Pending', confirmed: 'Confirmed', out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled' };

  container.innerHTML = orders.map(order => `
    <div class="card order-card admin-order-card" style="margin-bottom:1rem">
      <div class="order-card-header">
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Order ID</div>
          <div style="font-family:monospace;color:var(--primary-light);font-weight:600;font-size:0.88rem">${order.id}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Customer</div>
          <div style="font-size:0.88rem;font-weight:500">${order.userName || order.userEmail}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${order.userPhone || ''}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Total</div>
          <div style="font-weight:700;color:var(--primary-light)">₹${order.total}</div>
        </div>
        <div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Payment</div>
          <div style="font-size:0.82rem">${order.payment?.toUpperCase()}</div>
        </div>
        <span class="badge badge-${statusColors[order.status] || 'info'}">${statusLabels[order.status] || order.status}</span>
      </div>
      <div style="margin:0.75rem 0;padding:0.75rem;background:var(--bg-glass);border-radius:var(--radius-md);font-size:0.85rem">
        <strong>📍 Address:</strong> ${order.address?.flat || ''}, ${order.address?.full || 'N/A'} ${order.address?.landmark ? `(Near: ${order.address.landmark})` : ''}
        ${order.distance !== null && order.distance !== undefined ? `<span class="badge badge-info" style="margin-left:0.5rem">${order.distance.toFixed(1)} km away</span>` : ''}
      </div>
      <div style="margin-bottom:0.75rem">
        ${order.items.map(item => `<div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:0.2rem 0"><span>${item.name} ${item.prescription ? '🩺' : ''} ×${item.qty}</span><span>₹${item.price * item.qty}</span></div>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
        <label style="font-size:0.85rem;color:var(--text-secondary)">Update Status:</label>
        <select class="form-control" style="max-width:200px" onchange="updateOrderStatus('${order.id}', this.value)">
          ${statusOptions.map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}
        </select>
        <div style="font-size:0.78rem;color:var(--text-muted)">Placed: ${new Date(order.createdAt).toLocaleString('en-IN')}</div>
      </div>
    </div>
  `).join('');
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0) {
    orders[idx].status = newStatus;
    saveOrders(orders);
    updateAdminStats();
    showToast(`Order ${orderId} status updated to: ${newStatus}`, 'success');
  }
}

// ---- Medicine Management ----
function renderAdminMedicines() {
  const meds = getStoredMedicines();
  const container = document.getElementById('admin-medicines-list');
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="overflow:hidden">
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Rx</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${meds.map(med => `
              <tr>
                <td>
                  <div style="font-weight:600">${med.name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">${med.brand} · ${med.form}</div>
                </td>
                <td><span class="badge badge-primary" style="font-size:0.7rem">${med.category}</span></td>
                <td>₹${med.price}</td>
                <td>
                  <span class="${med.stock < 20 ? 'badge badge-warning' : 'badge badge-success'}" style="font-size:0.7rem">${med.stock}</span>
                </td>
                <td>${med.prescription ? '✅' : '—'}</td>
                <td>${med.featured ? '⭐' : '—'}</td>
                <td>
                  <div style="display:flex;gap:0.4rem">
                    <button class="btn btn-outline btn-sm" onclick="editMedicine(${med.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMedicine(${med.id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddMedicineModal() {
  document.getElementById('add-med-modal-title').textContent = 'Add Medicine';
  document.getElementById('edit-med-id').value = '';
  ['med-name','med-brand','med-description'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['med-category','med-form'].forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
  ['med-price','med-stock'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('med-prescription').checked = false;
  document.getElementById('med-featured').checked = false;
  openModal('add-medicine-modal');
}

function editMedicine(id) {
  const meds = getStoredMedicines();
  const med = meds.find(m => m.id === id);
  if (!med) return;
  document.getElementById('add-med-modal-title').textContent = 'Edit Medicine';
  document.getElementById('edit-med-id').value = med.id;
  document.getElementById('med-name').value = med.name;
  document.getElementById('med-brand').value = med.brand;
  document.getElementById('med-category').value = med.category;
  document.getElementById('med-price').value = med.price;
  document.getElementById('med-stock').value = med.stock;
  document.getElementById('med-form').value = med.form;
  document.getElementById('med-description').value = med.description || '';
  document.getElementById('med-prescription').checked = med.prescription;
  document.getElementById('med-featured').checked = med.featured;
  openModal('add-medicine-modal');
}

function saveMedicine(e) {
  e.preventDefault();
  const meds = getStoredMedicines();
  const editId = document.getElementById('edit-med-id').value;

  const medData = {
    name: document.getElementById('med-name').value.trim(),
    brand: document.getElementById('med-brand').value.trim(),
    category: document.getElementById('med-category').value,
    price: parseInt(document.getElementById('med-price').value),
    stock: parseInt(document.getElementById('med-stock').value),
    form: document.getElementById('med-form').value,
    description: document.getElementById('med-description').value.trim(),
    prescription: document.getElementById('med-prescription').checked,
    featured: document.getElementById('med-featured').checked
  };

  if (editId) {
    const idx = meds.findIndex(m => m.id === parseInt(editId));
    if (idx >= 0) { meds[idx] = { ...meds[idx], ...medData }; }
  } else {
    const newId = Math.max(...meds.map(m => m.id), 0) + 1;
    meds.push({ id: newId, ...medData });
  }

  saveStoredMedicines(meds);
  closeModal('add-medicine-modal');
  renderAdminMedicines();
  renderFeaturedProducts();
  showToast(editId ? 'Medicine updated!' : 'Medicine added!', 'success');
}

function deleteMedicine(id) {
  if (!confirm('Delete this medicine?')) return;
  let meds = getStoredMedicines();
  meds = meds.filter(m => m.id !== id);
  saveStoredMedicines(meds);
  renderAdminMedicines();
  showToast('Medicine deleted', 'info');
}

// ---- Customer Management ----
function renderAdminCustomers() {
  const users = getUsers().filter(u => u.role !== 'admin');
  const container = document.getElementById('admin-customers-list');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No customers yet</h3></div>`;
    return;
  }

  const orders = getOrders();
  container.innerHTML = `
    <div class="card" style="overflow:hidden">
      <div style="overflow-x:auto">
        <table class="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Joined</th></tr>
          </thead>
          <tbody>
            ${users.map(u => {
              const userOrders = orders.filter(o => o.userId === u.id);
              return `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:0.75rem">
                      <div style="width:36px;height:36px;background:var(--gradient-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem">${(u.firstName || u.email)[0].toUpperCase()}</div>
                      <div>
                        <div style="font-weight:600">${u.firstName || ''} ${u.lastName || ''}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted)">${u.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style="font-size:0.88rem">${u.email}</td>
                  <td style="font-size:0.88rem">${u.phone || '—'}</td>
                  <td><span class="badge badge-info">${userOrders.length} orders</span></td>
                  <td style="font-size:0.8rem;color:var(--text-muted)">${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
