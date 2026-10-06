// =============================================
// MedQuick — Cart (cart.js)
// =============================================

function addToCart(id, qty = 1) {
  const meds = getStoredMedicines();
  const med  = meds.find(m => m.id === id);
  if (!med) return;
  if (med.stock <= 0) { showToast('This medicine is out of stock', 'error'); return; }

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, med.stock);
  } else {
    cart.push({ id: med.id, name: med.name, brand: med.brand, price: med.price, qty, prescription: med.prescription, category: med.category });
  }
  saveCart();
  updateCartBadge();
  showToast(`${med.name} added to cart 🛒`, 'success');
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartBadge();
  renderCartPage();
}

function updateQty(id, qty) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  if (qty <= 0) { removeFromCart(id); return; }
  const meds = getStoredMedicines();
  const med  = meds.find(m => m.id === id);
  item.qty = Math.min(qty, med ? med.stock : 99);
  saveCart();
  updateCartBadge();
  renderCartSummary();
  renderCartItems();
}

function saveCart() {
  localStorage.setItem('mq_cart', JSON.stringify(cart));
}

function renderCartPage() {
  renderCartItems();
  renderCartSummary();
}

function renderCartItems() {
  const listEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('cart-empty');
  if (!listEl) return;

  if (cart.length === 0) {
    listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    return;
  }
  if (emptyEl) emptyEl.classList.add('hidden');

  const hasPrescriptionItems = cart.some(i => i.prescription);
  const session = getCurrentSession();

  listEl.innerHTML = `
    ${hasPrescriptionItems ? `
      <div class="rx-warning card" style="margin-bottom:1.25rem;background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.25)">
        <div style="display:flex;gap:0.75rem;align-items:flex-start">
          <span style="font-size:1.5rem">🩺</span>
          <div>
            <div style="font-weight:600;color:#f87171;margin-bottom:0.25rem">Prescription Required</div>
            <div style="font-size:0.85rem;color:var(--text-secondary)">Your cart contains prescription medicines. Please upload a valid doctor's prescription. Our pharmacist will verify before dispatch.</div>
            ${session ? `<button class="btn btn-outline btn-sm" style="margin-top:0.75rem;border-color:rgba(239,68,68,0.5);color:#f87171" onclick="showPage('profile');switchProfileTab('prescriptions')">📤 Upload Prescription</button>` : ''}
          </div>
        </div>
      </div>
    ` : ''}
    <div class="cart-items-header card" style="margin-bottom:0.75rem;display:flex;justify-content:space-between;align-items:center">
      <h3 style="font-size:1rem">🛒 Cart Items (${cart.length})</h3>
      <button class="btn btn-ghost btn-sm" onclick="clearCart()">Clear All</button>
    </div>
    ${cart.map(item => `
      <div class="cart-item card" style="margin-bottom:0.75rem">
        <div class="cart-item-info">
          <div style="font-size:1.5rem;margin-right:1rem">${CATEGORIES.find(c=>c.name===item.category)?.emoji || '💊'}</div>
          <div style="flex:1">
            <div class="cart-item-name">${item.name} ${item.prescription ? '<span class="badge badge-danger" style="font-size:0.65rem">Rx</span>' : ''}</div>
            <div style="font-size:0.82rem;color:var(--text-secondary)">${item.brand}</div>
          </div>
        </div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQty(${item.id}, ${item.qty - 1})">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty(${item.id}, ${item.qty + 1})">+</button>
          </div>
          <div class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</div>
          <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">🗑️</button>
        </div>
      </div>
    `).join('')}
  `;
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartBadge();
  renderCartPage();
  appliedPromo = null;
}

function renderCartSummary() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (appliedPromo) {
    const promo = PROMO_CODES[appliedPromo];
    if (promo.type === 'percent') discount = Math.round(subtotal * promo.value / 100);
    else discount = promo.value;
  }
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total = Math.max(0, subtotal - discount + delivery);

  const fmt = v => `₹${v.toLocaleString('en-IN')}`;
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

  el('cart-subtotal', fmt(subtotal));
  el('cart-delivery-fee', delivery === 0 ? '🎁 FREE' : fmt(delivery));
  el('cart-total', fmt(total));

  const discountRow = document.getElementById('summary-discount-row');
  if (discountRow) {
    if (appliedPromo) { discountRow.classList.remove('hidden'); el('cart-discount', `-${fmt(discount)}`); }
    else discountRow.classList.add('hidden');
  }
}

function applyPromo() {
  const code = (document.getElementById('promo-input')?.value || '').trim().toUpperCase();
  if (!code) { showToast('Please enter a promo code', 'warning'); return; }
  if (PROMO_CODES[code]) {
    appliedPromo = code;
    renderCartSummary();
    showToast(`Promo applied: ${PROMO_CODES[code].desc} 🎁`, 'success');
  } else {
    showToast('Invalid promo code', 'error');
  }
}

function placeOrder() {
  const session = getCurrentSession();
  if (!session) { showToast('Please sign in to place an order', 'warning'); openModal('login-modal'); return; }
  if (cart.length === 0) { showToast('Your cart is empty', 'warning'); return; }

  const address = document.getElementById('delivery-address-input')?.value?.trim();
  const flat = document.getElementById('flat-no')?.value?.trim();
  if (!address) { showToast('Please enter a delivery address', 'error'); return; }
  if (!flat) { showToast('Please enter your flat/house number', 'error'); return; }

  // Check if delivery distance was verified
  if (deliveryDistance !== null && deliveryDistance > DELIVERY_RADIUS_KM) {
    showToast(`Sorry! We only deliver within ${DELIVERY_RADIUS_KM} km from our store. Your address is ${deliveryDistance.toFixed(1)} km away.`, 'error');
    return;
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (appliedPromo) {
    const promo = PROMO_CODES[appliedPromo];
    if (promo.type === 'percent') discount = Math.round(subtotal * promo.value / 100);
    else discount = promo.value;
  }
  const delivery = subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const total = Math.max(0, subtotal - discount + delivery);

  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const payment = paymentEl ? paymentEl.value : 'cod';
  const paymentLabels = { cod: 'Cash on Delivery', upi: 'UPI / QR Code', card: 'Card Payment' };

  const orderId = 'MQ-' + Date.now().toString().slice(-8);
  const order = {
    id: orderId,
    userId: session.id,
    userName: `${session.firstName || ''} ${session.lastName || ''}`.trim() || session.email,
    userEmail: session.email,
    userPhone: session.phone || '',
    items: cart.map(i => ({ ...i })),
    address: { full: address, flat, landmark: document.getElementById('landmark')?.value || '' },
    distance: deliveryDistance,
    subtotal,
    discount,
    deliveryFee: delivery,
    total,
    promo: appliedPromo,
    payment,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);

  // Clear cart
  cart = [];
  saveCart();
  updateCartBadge();
  appliedPromo = null;
  deliveryDistance = null;
  deliveryLocation = null;

  // Reset form
  if (document.getElementById('delivery-address-input')) document.getElementById('delivery-address-input').value = '';
  if (document.getElementById('flat-no')) document.getElementById('flat-no').value = '';
  if (document.getElementById('landmark')) document.getElementById('landmark').value = '';
  if (document.getElementById('distance-result')) { document.getElementById('distance-result').classList.add('hidden'); document.getElementById('distance-result').innerHTML = ''; }

  // Show confirm modal
  document.getElementById('confirm-order-id').textContent = orderId;
  document.getElementById('confirm-payment-method').textContent = paymentLabels[payment] || payment;
  document.getElementById('order-confirm-msg').textContent = `Your order for ₹${total} has been placed successfully. Our staff will deliver it soon!`;
  openModal('order-confirm-modal');
}

function togglePaymentDetails() {
  document.getElementById('payment-upi-details').classList.add('hidden');
  document.getElementById('payment-card-details').classList.add('hidden');
  const selected = document.querySelector('input[name="payment"]:checked');
  if (selected && selected.value === 'upi') document.getElementById('payment-upi-details').classList.remove('hidden');
  if (selected && selected.value === 'card') document.getElementById('payment-card-details').classList.remove('hidden');
}
