// =============================================
// MedQuick — Maps Integration (maps.js)
// =============================================

let mapsLoaded = false;
let deliveryMapInstance = null;
let storeMarker = null;
let deliveryCircle = null;
let userMarker = null;
let miniMapInstance = null;

// Load Google Maps API dynamically
function loadGoogleMaps(callback) {
  if (window.google && window.google.maps) { mapsLoaded = true; callback && callback(); return; }
  const key = window.GOOGLE_MAPS_API_KEY || '';
  if (!key || key === 'YOUR_GOOGLE_MAPS_API_KEY') {
    console.warn('No Google Maps API key set. Using fallback distance calculation.');
    mapsLoaded = false;
    callback && callback();
    return;
  }
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=geometry,places`;
  script.async = true;
  script.defer = true;
  script.onload = () => { mapsLoaded = true; callback && callback(); };
  script.onerror = () => { mapsLoaded = false; callback && callback(); };
  document.head.appendChild(script);
}

// Initialize delivery zone map on homepage
function initDeliveryMap() {
  const mapEl = document.getElementById('delivery-map');
  if (!mapEl) return;

  if (window.google && window.google.maps) {
    const map = new google.maps.Map(mapEl, {
      center: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      zoom: 13,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Store marker
    new google.maps.Marker({
      position: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      map,
      title: 'MedQuick Pharmacy',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#0d9488',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      }
    });

    // Delivery radius circle
    new google.maps.Circle({
      map,
      center: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      radius: DELIVERY_RADIUS_KM * 1000,
      fillColor: '#0d9488',
      fillOpacity: 0.12,
      strokeColor: '#0d9488',
      strokeOpacity: 0.6,
      strokeWeight: 2
    });

    deliveryMapInstance = map;
  } else {
    // Fallback: show a styled placeholder
    mapEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;background:rgba(13,148,136,0.08);border-radius:var(--radius-lg);color:var(--text-secondary);padding:2rem;text-align:center">
        <div style="font-size:3rem;margin-bottom:1rem">🗺️</div>
        <div style="font-weight:600;margin-bottom:0.5rem">Delivery Zone Map</div>
        <div style="font-size:0.85rem">We deliver within 5 km of our store at</div>
        <div style="font-size:0.88rem;color:var(--primary-light);margin-top:0.5rem">${STORE_LOCATION.address}</div>
        <div style="margin-top:1rem;font-size:0.78rem;color:var(--text-muted)">Add a Google Maps API key to enable the interactive map</div>
      </div>
    `;
  }
}

// Setup delivery address autocomplete in cart
function setupCartAddressAutocomplete() {
  const input = document.getElementById('delivery-address-input');
  if (!input) return;

  if (window.google && window.google.maps && window.google.maps.places) {
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['geocode'],
      componentRestrictions: { country: 'IN' }
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      deliveryLocation = { lat, lng };
      checkDeliveryDistance(lat, lng, input.value);
      showMiniMap(lat, lng);
    });
  } else {
    // Without Maps API: show manual distance check button
    input.addEventListener('blur', () => {
      if (input.value.trim().length > 5) {
        showManualDistanceNote();
      }
    });
  }
}

function onDeliveryAddressInput() {
  // Called when user types in delivery address input
  const input = document.getElementById('delivery-address-input');
  if (!input || !input.value.trim()) {
    document.getElementById('distance-result').classList.add('hidden');
  }
}

function checkDeliveryDistance(lat, lng, address) {
  const resultEl = document.getElementById('distance-result');
  if (!resultEl) return;

  let distKm;
  if (window.google && window.google.maps && window.google.maps.geometry) {
    const storePt = new google.maps.LatLng(STORE_LOCATION.lat, STORE_LOCATION.lng);
    const userPt  = new google.maps.LatLng(lat, lng);
    distKm = google.maps.geometry.spherical.computeDistanceBetween(storePt, userPt) / 1000;
  } else {
    distKm = haversineDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, lat, lng);
  }

  deliveryDistance = distKm;
  resultEl.classList.remove('hidden');

  if (distKm <= DELIVERY_RADIUS_KM) {
    resultEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);border-radius:var(--radius-md);padding:0.85rem 1rem">
        <span style="font-size:1.5rem">✅</span>
        <div>
          <div style="font-weight:600;color:#34d399">Delivery Available!</div>
          <div style="font-size:0.82rem;color:var(--text-secondary)">Your address is <strong style="color:var(--text-primary)">${distKm.toFixed(1)} km</strong> from our store — within our 5 km delivery zone.</div>
        </div>
        <span class="badge badge-success">${distKm.toFixed(1)} km</span>
      </div>
    `;
  } else {
    resultEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:var(--radius-md);padding:0.85rem 1rem">
        <span style="font-size:1.5rem">❌</span>
        <div>
          <div style="font-weight:600;color:#f87171">Outside Delivery Zone</div>
          <div style="font-size:0.82rem;color:var(--text-secondary)">Your address is <strong style="color:#f87171">${distKm.toFixed(1)} km</strong> away. We only deliver within ${DELIVERY_RADIUS_KM} km of our store.</div>
        </div>
        <span class="badge badge-danger">${distKm.toFixed(1)} km</span>
      </div>
    `;
    showToast(`Your address is ${distKm.toFixed(1)} km away — outside our 5 km delivery zone.`, 'error');
  }
}

function showManualDistanceNote() {
  const resultEl = document.getElementById('distance-result');
  if (!resultEl) return;
  // No Maps API — inform user distance will be verified manually
  resultEl.classList.remove('hidden');
  resultEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-md);padding:0.85rem 1rem">
      <span style="font-size:1.5rem">📍</span>
      <div>
        <div style="font-weight:600;color:#fbbf24">Address Entered</div>
        <div style="font-size:0.82rem;color:var(--text-secondary)">Our team will verify your address is within the 5 km delivery zone before confirming your order. Add a Google Maps API key for real-time verification.</div>
      </div>
    </div>
  `;
  deliveryDistance = null; // Allow placing order, manual check by staff
}

function showMiniMap(lat, lng) {
  const mapEl = document.getElementById('map-preview');
  if (!mapEl) return;

  if (window.google && window.google.maps) {
    mapEl.style.height = '180px';
    mapEl.style.borderRadius = 'var(--radius-md)';
    mapEl.style.overflow = 'hidden';
    mapEl.style.marginTop = '1rem';

    const mini = new google.maps.Map(mapEl, {
      center: { lat, lng },
      zoom: 14,
      styles: DARK_MAP_STYLE,
      disableDefaultUI: true,
      zoomControl: true
    });

    if (userMarker) userMarker.setMap(null);
    userMarker = new google.maps.Marker({
      position: { lat, lng },
      map: mini,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      title: 'Delivery Address'
    });

    // Draw store marker
    new google.maps.Marker({
      position: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      map: mini,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#0d9488',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      title: 'MedQuick Pharmacy'
    });

    // Draw delivery circle
    new google.maps.Circle({
      map: mini,
      center: { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng },
      radius: DELIVERY_RADIUS_KM * 1000,
      fillColor: '#0d9488',
      fillOpacity: 0.1,
      strokeColor: '#0d9488',
      strokeOpacity: 0.5,
      strokeWeight: 1.5
    });

    miniMapInstance = mini;
  }
}

// Haversine fallback
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2
          + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Dark map style for Google Maps
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0c1a3a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0c1a3a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2a4a' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#243f5e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] }
];

// Initialize maps when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadGoogleMaps(() => {
    // Init delivery zone map on home page
    setTimeout(() => {
      initDeliveryMap();
      setupCartAddressAutocomplete();
    }, 500);
  });
});

// Re-init map when cart page is shown (address autocomplete)
const _origShowPage = window.showPage;
document.addEventListener('DOMContentLoaded', () => {
  // Observe when cart page becomes visible to re-init autocomplete
  const observer = new MutationObserver(() => {
    const cartPage = document.getElementById('page-cart');
    if (cartPage && !cartPage.classList.contains('hidden')) {
      setupCartAddressAutocomplete();
    }
    const homePage = document.getElementById('page-home');
    if (homePage && !homePage.classList.contains('hidden')) {
      setTimeout(initDeliveryMap, 100);
    }
  });
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
});

function locateUser() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', 'error');
    return;
  }
  showToast('Locating...', 'info', 2000);
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    deliveryLocation = { lat, lng };
    document.getElementById('delivery-address-input').value = 'Current Location';
    checkDeliveryDistance(lat, lng, 'Current Location');
    showMiniMap(lat, lng);
  }, () => {
    showToast('Unable to retrieve your location', 'error');
  });
}
