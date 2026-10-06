// =============================================
// MedQuick — Core App (app.js)
// =============================================

// ---- State ----
let currentPage = 'home';
let cart = JSON.parse(localStorage.getItem('mq_cart') || '[]');
let appliedPromo = null;
let deliveryLocation = null;
let deliveryDistance = null;

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  initNavbarScroll();
  updateCartBadge();
  renderHomeCategories();
  renderFeaturedProducts();
  populateCategoryFilter();
  renderShopProducts();
  updateAuthUI();

  // Seed default admin & demo user if not exists
  initDefaultUsers();

  // Load current page from hash
  const hash = window.location.hash.replace('#', '') || 'home';
  showPage(hash, false);
});

function initDefaultUsers() {
  const users = JSON.parse(localStorage.getItem('mq_users') || '[]');
  const adminExists = users.find(u => u.email === ADMIN_CREDENTIALS.email);
  if (!adminExists) {
    users.push({ ...ADMIN_CREDENTIALS, id: 'admin_1', createdAt: new Date().toISOString() });
  }
  const demoExists = users.find(u => u.email === DEMO_USER.email);
  if (!demoExists) {
    users.push({ ...DEMO_USER, id: 'demo_1', createdAt: new Date().toISOString() });
  }
  localStorage.setItem('mq_users', JSON.stringify(users));

  // Seed medicines into localStorage if not already done
  if (!localStorage.getItem('mq_medicines_seeded')) {
    localStorage.setItem('mq_medicines', JSON.stringify(MEDICINES));
    localStorage.setItem('mq_medicines_seeded', '1');
  }
}

// ---- Page Navigation ----
function showPage(page, updateHash = true) {
  const pages = ['home', 'shop', 'cart', 'orders', 'profile', 'admin'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(`page-${page}`);
  if (target) {
    target.classList.remove('hidden');
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (updateHash) window.location.hash = page;
  }

  // Update active nav link
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const activeLink = document.getElementById(`nav-${page}`);
  if (activeLink) activeLink.classList.add('active');

  // Auth gates
  const session = getCurrentSession();
  if (['orders', 'profile'].includes(page) && !session) {
    showPage('home');
    showToast('Please sign in to access this page', 'warning');
    openModal('login-modal');
    return;
  }
  if (page === 'admin') {
    if (!session || session.role !== 'admin') {
      showPage('home');
      showToast('Admin access only', 'error');
      return;
    }
    renderAdminDashboard();
  }
  if (page === 'orders') renderOrdersPage();
  if (page === 'profile') loadProfileData();
  if (page === 'cart') renderCartPage();
  if (page === 'shop') renderShopProducts();

  // Close mobile menu
  document.getElementById('nav-links').classList.remove('open');
}

function shopByCategory(cat) {
  showPage('shop');
  document.getElementById('category-filter').value = cat;
  filterProducts();
}

// ---- Auth UI ----
function updateAuthUI() {
  const session = getCurrentSession();
  const authHiddens = document.querySelectorAll('.auth-hidden');
  const authOnlys = document.querySelectorAll('.auth-only');
  const adminOnlys = document.querySelectorAll('.admin-only');

  if (session) {
    authHiddens.forEach(el => el.classList.add('hidden'));
    authOnlys.forEach(el => el.classList.remove('hidden'));
    if (session.role === 'admin') {
      adminOnlys.forEach(el => el.classList.remove('hidden'));
    }
    // Set avatar initials
    const initials = ((session.firstName || session.name || 'U')[0]).toUpperCase();
    const navAvatar = document.getElementById('nav-avatar-circle');
    if (navAvatar) navAvatar.textContent = initials;
  } else {
    authHiddens.forEach(el => el.classList.remove('hidden'));
    authOnlys.forEach(el => el.classList.add('hidden'));
    adminOnlys.forEach(el => el.classList.add('hidden'));
  }
}

// ---- Navbar ----
function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });
}

function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
}

// ---- Particles ----
function createParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${Math.random() * 15 + 10}s;
      animation-delay:${Math.random() * 10}s;
      opacity:0;
      background: ${Math.random() > 0.5 ? '#14b8a6' : '#3b82f6'};
    `;
    container.appendChild(p);
  }
}

// ---- Toast ----
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastSlideIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- Modal ----
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.add('open');
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) overlay.classList.remove('open');
}

function switchModal(from, to) {
  closeModal(from);
  setTimeout(() => openModal(to), 200);
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }
});

// ---- Loading ----
function showLoading() { document.getElementById('loading-overlay').classList.add('active'); }
function hideLoading() { document.getElementById('loading-overlay').classList.remove('active'); }

// ---- Cart Badge ----
function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const count = cart.reduce((s, i) => s + i.qty, 0);
  if (count > 0) {
    badge.textContent = count;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ---- Home: Categories Grid ----
function renderHomeCategories() {
  const grid = document.getElementById('home-categories-grid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="category-card" onclick="shopByCategory('${cat.name}')" style="--cat-color:${cat.color}">
      <div class="category-emoji">${cat.emoji}</div>
      <div class="category-name">${cat.name}</div>
    </div>
  `).join('');
}

// ---- Home: Featured Products ----
function renderFeaturedProducts() {
  const grid = document.getElementById('featured-products-grid');
  if (!grid) return;
  const meds = getStoredMedicines().filter(m => m.featured).slice(0, 8);
  grid.innerHTML = meds.map(m => renderProductCard(m)).join('');
}

// ---- Shop: Category Filter ----
function populateCategoryFilter() {
  const select = document.getElementById('category-filter');
  if (!select) return;
  const existing = Array.from(select.options).map(o => o.value);
  CATEGORIES.forEach(cat => {
    if (!existing.includes(cat.name)) {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.emoji} ${cat.name}`;
      select.appendChild(opt);
    }
  });
}

// ---- Product Card ----
function renderProductCard(med) {
  const inStock = med.stock > 0;
  const stockBadge = med.stock < 20 && med.stock > 0
    ? `<span class="badge badge-warning" style="font-size:0.65rem">Low Stock</span>` : '';
  const rxBadge = med.prescription
    ? `<span class="badge badge-danger" style="font-size:0.65rem">Rx</span>` : '';
  const catData = CATEGORIES.find(c => c.name === med.category) || { emoji: '💊', color: '#0d9488' };

  return `
    <div class="product-card card" onclick="viewProduct(${med.id})">
      <div class="product-card-header" style="background:linear-gradient(135deg, ${catData.color}22, ${catData.color}11)">
        <div class="product-emoji">${catData.emoji}</div>
        <div class="product-badges">${rxBadge}${stockBadge}</div>
      </div>
      <div class="product-card-body">
        <div class="product-category" style="color:${catData.color}">${med.category}</div>
        <h3 class="product-name">${med.name}</h3>
        <div class="product-brand">${med.brand} · ${med.form}</div>
        <div class="product-footer">
          <div class="product-price">₹${med.price}</div>
          ${inStock
            ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();addToCart(${med.id})">+ Add</button>`
            : `<span class="badge badge-danger">Out of Stock</span>`
          }
        </div>
      </div>
    </div>
  `;
}

// ---- View Product Detail ----
function viewProduct(id) {
  const meds = getStoredMedicines();
  const med = meds.find(m => m.id === id);
  if (!med) return;
  const catData = CATEGORIES.find(c => c.name === med.category) || { emoji: '💊', color: '#0d9488' };
  const inStock = med.stock > 0;

  document.getElementById('product-modal-title').textContent = med.name;
  document.getElementById('product-modal-content').innerHTML = `
    <div class="product-detail-header" style="background:linear-gradient(135deg, ${catData.color}22, ${catData.color}11);border-radius:var(--radius-md);padding:2rem;margin-bottom:1.5rem;text-align:center">
      <div style="font-size:4rem;margin-bottom:0.5rem">${catData.emoji}</div>
      <div style="color:${catData.color};font-size:0.85rem;font-weight:600;margin-bottom:0.25rem">${med.category}</div>
      <h2 style="font-size:1.4rem;margin-bottom:0.25rem">${med.name}</h2>
      <div style="color:var(--text-secondary);font-size:0.88rem">${med.brand} · ${med.form}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem">
      <div class="card" style="padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:var(--primary)">₹${med.price}</div>
        <div style="font-size:0.78rem;color:var(--text-secondary)">Per Unit</div>
      </div>
      <div class="card" style="padding:1rem;text-align:center">
        <div style="font-size:1.6rem;font-weight:800;color:${med.stock > 0 ? 'var(--success)' : 'var(--danger)'}">${med.stock > 0 ? med.stock : 'N/A'}</div>
        <div style="font-size:0.78rem;color:var(--text-secondary)">${med.stock > 0 ? 'In Stock' : 'Out of Stock'}</div>
      </div>
    </div>
    ${med.prescription ? `<div class="distance-result" style="display:flex;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);padding:0.75rem 1rem;margin-bottom:1.25rem;gap:0.75rem;align-items:center"><span>🩺</span><div><strong style="color:#f87171">Prescription Required</strong><div style="font-size:0.8rem;color:var(--text-secondary)">Please upload a valid doctor's prescription for this medicine</div></div></div>` : ''}
    <div style="margin-bottom:1.5rem">
      <div class="form-label">Description</div>
      <p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7">${med.description}</p>
    </div>
    <div style="display:flex;gap:0.75rem">
      ${inStock
        ? `
          <div style="display:flex;align-items:center;gap:0.5rem;background:var(--bg-glass);border:1px solid var(--bg-glass-border);border-radius:var(--radius-full);padding:0.25rem">
            <button class="btn btn-ghost btn-sm" onclick="changeQtyModal(${med.id},-1)" style="width:32px;height:32px;padding:0;border-radius:50%">−</button>
            <span id="modal-qty-${med.id}" style="min-width:24px;text-align:center;font-weight:600">${getCartQty(med.id) || 1}</span>
            <button class="btn btn-ghost btn-sm" onclick="changeQtyModal(${med.id},1)" style="width:32px;height:32px;padding:0;border-radius:50%">+</button>
          </div>
          <button class="btn btn-primary btn-lg" style="flex:1" onclick="addToCartFromModal(${med.id})">🛒 Add to Cart</button>
        `
        : `<button class="btn btn-ghost btn-lg" style="flex:1;opacity:0.5" disabled>Out of Stock</button>`
      }
    </div>
  `;
  openModal('product-modal');
}

let modalQty = 1;
function changeQtyModal(id, delta) {
  const el = document.getElementById(`modal-qty-${id}`);
  if (!el) return;
  let val = parseInt(el.textContent) + delta;
  if (val < 1) val = 1;
  if (val > 99) val = 99;
  el.textContent = val;
  modalQty = val;
}

function addToCartFromModal(id) {
  const el = document.getElementById(`modal-qty-${id}`);
  const qty = el ? parseInt(el.textContent) : 1;
  addToCart(id, qty);
  closeModal('product-modal');
}

function getCartQty(id) {
  const item = cart.find(i => i.id === id);
  return item ? item.qty : 0;
}

// ---- Storage Helpers ----
function getStoredMedicines() {
  return JSON.parse(localStorage.getItem('mq_medicines') || JSON.stringify(MEDICINES));
}

function saveStoredMedicines(meds) {
  localStorage.setItem('mq_medicines', JSON.stringify(meds));
}

function getOrders() {
  return JSON.parse(localStorage.getItem('mq_orders') || '[]');
}

function saveOrders(orders) {
  localStorage.setItem('mq_orders', JSON.stringify(orders));
}

function getUsers() {
  return JSON.parse(localStorage.getItem('mq_users') || '[]');
}

function saveUsers(users) {
  localStorage.setItem('mq_users', JSON.stringify(users));
}

// ---- Orders Page ----
function renderOrdersPage() {
  const session = getCurrentSession();
  if (!session) return;
  const allOrders = getOrders();
  const myOrders = allOrders.filter(o => o.userId === session.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');

  if (myOrders.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = myOrders.map(order => renderOrderCard(order)).join('');
}

function renderOrderCard(order) {
  const statusColors = { pending: 'warning', confirmed: 'info', out_for_delivery: 'primary', delivered: 'success', cancelled: 'danger' };
  const statusLabels = { pending: '⏳ Pending', confirmed: '✅ Confirmed', out_for_delivery: '🚴 Out for Delivery', delivered: '✅ Delivered', cancelled: '❌ Cancelled' };
  const badgeClass = `badge-${statusColors[order.status] || 'info'}`;
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `
    <div class="card order-card" style="margin-bottom:1.25rem">
      <div class="order-card-header">
        <div>
          <div style="font-size:0.8rem;color:var(--text-muted)">Order ID</div>
          <div style="font-family:monospace;color:var(--primary-light);font-weight:600">${order.id}</div>
        </div>
        <div>
          <div style="font-size:0.8rem;color:var(--text-muted)">Placed On</div>
          <div style="font-size:0.85rem">${date}</div>
        </div>
        <span class="badge ${badgeClass}">${statusLabels[order.status] || order.status}</span>
      </div>
      <div class="order-items-preview">
        ${order.items.map(item => `<div class="order-item-row"><span>${item.name}</span><span style="color:var(--text-secondary)">×${item.qty}</span><span style="color:var(--primary-light)">₹${item.price * item.qty}</span></div>`).join('')}
      </div>
      
      <!-- Visual Tracking Timeline -->
      ${order.status !== 'cancelled' ? `
      <div class="order-timeline" style="margin: 1rem 0; padding: 1rem 0; border-top: 1px solid var(--bg-glass-border); border-bottom: 1px solid var(--bg-glass-border); display: flex; justify-content: space-between; position: relative;">
         <div style="position: absolute; top: 1.5rem; left: 12%; right: 12%; height: 2px; background: var(--bg-glass-border); z-index: 1;"></div>
         ${['pending', 'confirmed', 'out_for_delivery', 'delivered'].map((step, i) => {
           const statuses = ['pending', 'confirmed', 'out_for_delivery', 'delivered'];
           const currentIdx = statuses.indexOf(order.status);
           let state = 'future';
           if (i < currentIdx) state = 'completed';
           else if (i === currentIdx) state = 'current';
           
           const color = state === 'completed' ? 'var(--success)' : state === 'current' ? 'var(--primary)' : 'var(--text-muted)';
           const bg = state === 'completed' ? 'var(--success)' : 'var(--bg-card)';
           
           return `<div style="z-index: 2; text-align: center; width: 25%;">
             <div style="width: 1.2rem; height: 1.2rem; border-radius: 50%; background: ${bg}; border: 2px solid ${color}; margin: 0 auto 0.5rem;"></div>
             <div style="font-size: 0.75rem; color: ${color}; font-weight: ${state === 'current' ? '600' : 'normal'}">${statusLabels[step].replace(/[^\w\s]/gi, '').trim()}</div>
           </div>`;
         }).join('')}
      </div>` : ''}

      <div class="order-card-footer">
        <div>
          <span style="font-size:0.85rem;color:var(--text-secondary)">📍 ${order.address?.flat || ''} ${order.address?.full || 'N/A'}</span>
        </div>
        <div style="font-weight:700;font-size:1.1rem">Total: ₹${order.total}</div>
      </div>
      ${order.status === 'pending' ? `<button class="btn btn-danger btn-sm" style="margin-top:1rem" onclick="cancelOrder('${order.id}')">Cancel Order</button>` : ''}
    </div>
  `;
}

function cancelOrder(orderId) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx >= 0 && orders[idx].status === 'pending') {
    orders[idx].status = 'cancelled';
    saveOrders(orders);
    showToast('Order cancelled successfully', 'success');
    renderOrdersPage();
  }
}

// ---- Profile ----
function loadProfileData() {
  const session = getCurrentSession();
  if (!session) return;
  document.getElementById('profile-fname').value = session.firstName || '';
  document.getElementById('profile-lname').value = session.lastName || '';
  document.getElementById('profile-email').value = session.email || '';
  document.getElementById('profile-phone').value = session.phone || '';
  document.getElementById('profile-dob').value = session.dob || '';
  document.getElementById('profile-gender').value = session.gender || '';
  document.getElementById('profile-name-display').textContent = `${session.firstName || ''} ${session.lastName || ''}`.trim() || session.name || 'User';
  document.getElementById('profile-email-display').textContent = session.email || '';
  const initials = ((session.firstName || session.name || 'U')[0]).toUpperCase();
  document.getElementById('profile-avatar-circle').textContent = initials;
  renderSavedAddresses();
}

function switchProfileTab(tab) {
  ['info', 'addresses', 'prescriptions', 'security'].forEach(t => {
    const el = document.getElementById(`profile-tab-${t}`);
    if (el) el.classList.add('hidden');
  });
  const active = document.getElementById(`profile-tab-${tab}`);
  if (active) active.classList.remove('hidden');
  document.querySelectorAll('.profile-nav-btn').forEach((btn, i) => {
    btn.classList.remove('active');
  });
  const btns = document.querySelectorAll('.profile-nav-btn');
  const tabMap = { info: 0, addresses: 1, prescriptions: 2, security: 3 };
  if (btns[tabMap[tab]]) btns[tabMap[tab]].classList.add('active');
}

function saveProfile() {
  const session = getCurrentSession();
  if (!session) return;
  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx < 0) return;
  users[idx].firstName = document.getElementById('profile-fname').value;
  users[idx].lastName  = document.getElementById('profile-lname').value;
  users[idx].phone     = document.getElementById('profile-phone').value;
  users[idx].dob       = document.getElementById('profile-dob').value;
  users[idx].gender    = document.getElementById('profile-gender').value;
  saveUsers(users);
  localStorage.setItem('mq_session', JSON.stringify(users[idx]));
  showToast('Profile updated successfully!', 'success');
  loadProfileData();
}

function changePassword() {
  const current = document.getElementById('current-password').value;
  const newPw   = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-new-password').value;
  const session = getCurrentSession();
  if (!session) return;
  const users = getUsers();
  const user = users.find(u => u.id === session.id);
  if (!user || user.password !== current) { showToast('Current password is incorrect', 'error'); return; }
  if (newPw.length < 8) { showToast('New password must be at least 8 characters', 'error'); return; }
  if (newPw !== confirm) { showToast('Passwords do not match', 'error'); return; }
  const idx = users.findIndex(u => u.id === session.id);
  users[idx].password = newPw;
  saveUsers(users);
  showToast('Password updated successfully!', 'success');
  document.getElementById('current-password').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-new-password').value = '';
}

function renderSavedAddresses() {
  const session = getCurrentSession();
  if (!session) return;
  const addresses = session.addresses || [];
  const container = document.getElementById('saved-addresses-list');
  if (!container) return;
  if (addresses.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:2rem"><div class="empty-state-icon" style="font-size:2.5rem">📍</div><h3>No addresses saved</h3><p>Add a delivery address to speed up checkout</p></div>`;
    return;
  }
  container.innerHTML = addresses.map((addr, i) => `
    <div class="address-item card-glass" style="padding:1rem;margin-bottom:0.75rem;border-radius:var(--radius-md);border:1px solid var(--bg-glass-border);display:flex;justify-content:space-between;align-items:center">
      <div>
        <span class="badge badge-primary" style="margin-bottom:0.35rem">${addr.label}</span>
        <div style="font-weight:600;margin-bottom:0.2rem">${addr.flat}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary)">${addr.full}</div>
        ${addr.landmark ? `<div style="font-size:0.8rem;color:var(--text-muted)">Near: ${addr.landmark}</div>` : ''}
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteAddress(${i})">Delete</button>
    </div>
  `).join('');
}

function deleteAddress(index) {
  const session = getCurrentSession();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx < 0) return;
  users[idx].addresses = users[idx].addresses || [];
  users[idx].addresses.splice(index, 1);
  saveUsers(users);
  localStorage.setItem('mq_session', JSON.stringify(users[idx]));
  renderSavedAddresses();
  showToast('Address removed', 'info');
}

function selectAddrLabel(btn) {
  document.querySelectorAll('.addr-label').forEach(b => b.classList.remove('active', 'btn-primary'));
  document.querySelectorAll('.addr-label').forEach(b => { b.classList.add('btn-ghost'); b.classList.remove('btn-primary'); });
  btn.classList.add('active', 'btn-primary');
  btn.classList.remove('btn-ghost');
  document.getElementById('addr-label').value = btn.dataset.label;
}

function saveAddress(e) {
  e.preventDefault();
  const session = getCurrentSession();
  if (!session) { showToast('Please sign in first', 'warning'); return; }
  const full = document.getElementById('addr-full').value.trim();
  const flat = document.getElementById('addr-flat').value.trim();
  const landmark = document.getElementById('addr-landmark').value.trim();
  const label = document.getElementById('addr-label').value || 'Home';
  if (!full || !flat) { showToast('Please fill all required fields', 'error'); return; }
  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx < 0) return;
  users[idx].addresses = users[idx].addresses || [];
  users[idx].addresses.push({ label, full, flat, landmark });
  saveUsers(users);
  localStorage.setItem('mq_session', JSON.stringify(users[idx]));
  closeModal('add-address-modal');
  renderSavedAddresses();
  showToast('Address saved!', 'success');
}

function uploadPrescription(event) {
  const file = event.target.files[0];
  if (!file) return;
  const session = getCurrentSession();
  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx < 0) return;
  users[idx].prescriptions = users[idx].prescriptions || [];
  users[idx].prescriptions.push({ name: file.name, date: new Date().toISOString(), size: file.size });
  saveUsers(users);
  localStorage.setItem('mq_session', JSON.stringify(users[idx]));
  renderPrescriptions();
  showToast('Prescription uploaded!', 'success');
}

function renderPrescriptions() {
  const session = getCurrentSession();
  const rxs = session?.prescriptions || [];
  const container = document.getElementById('prescriptions-list');
  if (!container) return;
  if (rxs.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:2rem"><div class="empty-state-icon" style="font-size:2.5rem">📋</div><h3>No prescriptions uploaded</h3><p>Upload your doctor's prescription for prescription medicines</p></div>`;
    return;
  }
  container.innerHTML = rxs.map((rx, i) => `
    <div class="card-glass" style="padding:1rem;margin-bottom:0.75rem;border-radius:var(--radius-md);border:1px solid var(--bg-glass-border);display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-weight:600">📋 ${rx.name}</div><div style="font-size:0.78rem;color:var(--text-muted)">${new Date(rx.date).toLocaleDateString()}</div></div>
      <span class="badge badge-success">Uploaded</span>
    </div>
  `).join('');
}

function forgotPassword() {
  showToast('Password reset link sent to your email (demo)', 'info');
}

// =============================================
// Theme Toggle Logic
// =============================================
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.textContent = isLight ? '🌞' : '🌙';
  localStorage.setItem('mq_theme', isLight ? 'light' : 'dark');
}

// Init theme on load
if (localStorage.getItem('mq_theme') === 'light') {
  document.body.classList.add('light-mode');
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.textContent = '🌞';
}

// =============================================
// AI Chatbot Logic
// =============================================
function toggleChat() {
  const widget = document.getElementById('ai-chat-widget');
  const icon = document.getElementById('chat-toggle-icon');
  widget.classList.toggle('closed');
  icon.textContent = widget.classList.contains('closed') ? '▲' : '▼';
}

function handleChat(e) {
  if (e.key === 'Enter') {
    sendChatMessage();
  }
}

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  const chatBody = document.getElementById('chat-body');
  
  // Add user message
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-message user-msg';
  userDiv.textContent = msg;
  chatBody.appendChild(userDiv);
  
  input.value = '';
  chatBody.scrollTop = chatBody.scrollHeight;

  // Simulate AI Response
  setTimeout(() => {
    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-message bot-msg';
    
    // Simple mock responses
    let response = "I'm sorry, I'm just a demo AI. Please consult our pharmacist for medical advice.";
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes('fever') || lowerMsg.includes('headache')) {
      response = "For mild fever or headache, you might consider Paracetamol. However, if symptoms persist, please consult a doctor.";
    } else if (lowerMsg.includes('order') || lowerMsg.includes('delivery')) {
      response = "We deliver within a 5 km radius in about 30 minutes. You can track your orders in the 'My Orders' section.";
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      response = "Hello there! How can I assist you with your medicines today?";
    }

    aiDiv.textContent = response;
    chatBody.appendChild(aiDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 1000);
}
