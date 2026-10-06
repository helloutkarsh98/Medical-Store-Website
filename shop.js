// =============================================
// MedQuick — Shop (shop.js)
// =============================================

function renderShopProducts() {
  filterProducts();
}

function filterProducts() {
  const searchVal  = (document.getElementById('search-input')?.value || '').toLowerCase();
  const catVal     = document.getElementById('category-filter')?.value || '';
  const sortVal    = document.getElementById('sort-filter')?.value || 'default';
  const clearBtn   = document.getElementById('search-clear');
  if (clearBtn) clearBtn.style.display = searchVal ? 'block' : 'none';

  let meds = getStoredMedicines();

  // Filter
  if (searchVal) meds = meds.filter(m => m.name.toLowerCase().includes(searchVal) || m.brand.toLowerCase().includes(searchVal) || m.category.toLowerCase().includes(searchVal));
  if (catVal)    meds = meds.filter(m => m.category === catVal);

  // Sort
  if (sortVal === 'price-asc')  meds.sort((a,b) => a.price - b.price);
  if (sortVal === 'price-desc') meds.sort((a,b) => b.price - a.price);
  if (sortVal === 'name-asc')   meds.sort((a,b) => a.name.localeCompare(b.name));
  if (sortVal === 'name-desc')  meds.sort((a,b) => b.name.localeCompare(a.name));

  // Render
  const grid    = document.getElementById('shop-products-grid');
  const noRes   = document.getElementById('no-results');
  const count   = document.getElementById('products-count');

  if (grid) {
    if (meds.length === 0) {
      grid.innerHTML = '';
      if (noRes) noRes.classList.remove('hidden');
    } else {
      if (noRes) noRes.classList.add('hidden');
      grid.innerHTML = meds.map(m => renderProductCard(m)).join('');
    }
  }

  if (count) {
    count.textContent = meds.length > 0 ? `Showing ${meds.length} medicine${meds.length !== 1 ? 's' : ''}` : '';
  }

  renderActiveFilters(searchVal, catVal, sortVal);
}

function renderActiveFilters(search, cat, sort) {
  const container = document.getElementById('active-filters');
  if (!container) return;
  const chips = [];
  if (search) chips.push(`<span class="filter-chip">🔍 "${search}" <button onclick="clearSearch()">✕</button></span>`);
  if (cat)    chips.push(`<span class="filter-chip">📂 ${cat} <button onclick="clearCategory()">✕</button></span>`);
  if (sort !== 'default') chips.push(`<span class="filter-chip">⬆️ ${sort.replace('-', ' ')} <button onclick="clearSort()">✕</button></span>`);
  if (chips.length > 0) chips.push(`<button class="btn btn-ghost btn-sm" onclick="clearFilters()">Clear All</button>`);
  container.innerHTML = chips.join('');
}

function clearSearch()   { document.getElementById('search-input').value = ''; filterProducts(); }
function clearCategory() { document.getElementById('category-filter').value = ''; filterProducts(); }
function clearSort()     { document.getElementById('sort-filter').value = 'default'; filterProducts(); }
function clearFilters()  { clearSearch(); clearCategory(); clearSort(); }
