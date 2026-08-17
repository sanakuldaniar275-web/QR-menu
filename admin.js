const listEl = document.querySelector('#restaurants');
const form = document.querySelector('#restaurantForm');
const statusEl = document.querySelector('#status');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function loadRestaurants() {
  try {
    const restaurants = await api('/api/admin/restaurants');
    listEl.innerHTML = restaurants.length ? restaurants.map(r => `
      <div class="restaurant-row">
        <div>
          <strong>${escapeHtml(r.name)}</strong>
          <div class="muted admin-link">/r/${escapeHtml(r.slug)}</div>
        </div>
        <div class="restaurant-actions">
          <a class="secondary" href="/r/${encodeURIComponent(r.slug)}" target="_blank">Меню</a>
          <a class="secondary" href="/api/restaurants/${encodeURIComponent(r.slug)}/qr" target="_blank">QR</a>
        </div>
      </div>`).join('') : '<div class="muted">Заведений пока нет.</div>';
  } catch (err) {
    listEl.innerHTML = `<div class="muted">${escapeHtml(err.message)}</div>`;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  statusEl.textContent = 'Создаём…';
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    await api('/api/admin/restaurants', { method: 'POST', body: JSON.stringify(body) });
    form.reset();
    statusEl.textContent = 'Заведение создано.';
    await loadRestaurants();
  } catch (err) {
    statusEl.textContent = err.message;
  }
});

loadRestaurants();
