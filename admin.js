const listEl = document.querySelector('#restaurants');
const form = document.querySelector('#restaurantForm');
const statusEl = document.querySelector('#status');
const editorEl = document.querySelector('#editor');
const editorTitleEl = document.querySelector('#editorTitle');
const menuLinkEl = document.querySelector('#menuLink');
const qrLinkEl = document.querySelector('#qrLink');
const categoryForm = document.querySelector('#categoryForm');
const dishForm = document.querySelector('#dishForm');
const dishCategoryEl = document.querySelector('#dishCategory');
const menuEditorEl = document.querySelector('#menuEditor');
let selectedRestaurantId = null;

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
          <button class="secondary" type="button" data-edit="${r.id}">Редактировать</button>
          <a class="secondary" href="/r/${encodeURIComponent(r.slug)}" target="_blank">Меню</a>
          <a class="secondary" href="/api/restaurants/${encodeURIComponent(r.slug)}/qr" target="_blank">QR</a>
        </div>
      </div>`).join('') : '<div class="muted">Заведений пока нет.</div>';
  } catch (err) {
    listEl.innerHTML = `<div class="muted">${escapeHtml(err.message)}</div>`;
  }
}

async function openEditor(id) {
  const data = await api(`/api/admin/restaurants/${id}/menu`);
  selectedRestaurantId = id;
  editorEl.hidden = false;
  editorTitleEl.textContent = data.restaurant.name;
  menuLinkEl.href = `/r/${encodeURIComponent(data.restaurant.slug)}`;
  qrLinkEl.href = `/api/restaurants/${encodeURIComponent(data.restaurant.slug)}/qr`;
  dishCategoryEl.innerHTML = data.categories.length ? data.categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('') : '<option value="">Сначала добавьте категорию</option>';
  const categoryById = new Map(data.categories.map(c => [c.id, c.name]));
  menuEditorEl.innerHTML = data.dishes.length ? data.dishes.map(d => `
    <div class="restaurant-row">
      <div>
        <strong>${escapeHtml(d.name)}</strong>
        <div class="muted">${escapeHtml(categoryById.get(d.category_id) || 'Без категории')} · ${Number(d.price).toLocaleString('ru-RU')} ₸ ${d.active ? '' : '· скрыто'}</div>
      </div>
      <button class="secondary" type="button" data-toggle-dish="${d.id}" data-active="${d.active}">${d.active ? 'Скрыть' : 'Показать'}</button>
    </div>`).join('') : '<div class="muted">Блюд пока нет.</div>';
  editorEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

listEl.addEventListener('click', async event => {
  const button = event.target.closest('[data-edit]');
  if (!button) return;
  try { await openEditor(button.dataset.edit); } catch (err) { statusEl.textContent = err.message; }
});

menuEditorEl.addEventListener('click', async event => {
  const button = event.target.closest('[data-toggle-dish]');
  if (!button || !selectedRestaurantId) return;
  try {
    await api(`/api/admin/dishes/${button.dataset.toggleDish}`, { method: 'PATCH', body: JSON.stringify({ active: button.dataset.active !== 'true' }) });
    await openEditor(selectedRestaurantId);
  } catch (err) { statusEl.textContent = err.message; }
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  statusEl.textContent = 'Создаём…';
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    const created = await api('/api/admin/restaurants', { method: 'POST', body: JSON.stringify(body) });
    form.reset();
    statusEl.textContent = 'Заведение создано.';
    await loadRestaurants();
    await openEditor(created.id);
  } catch (err) { statusEl.textContent = err.message; }
});

categoryForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedRestaurantId) return;
  const body = Object.fromEntries(new FormData(categoryForm).entries());
  try {
    await api(`/api/admin/restaurants/${selectedRestaurantId}/categories`, { method: 'POST', body: JSON.stringify(body) });
    categoryForm.reset();
    statusEl.textContent = 'Категория добавлена.';
    await openEditor(selectedRestaurantId);
  } catch (err) { statusEl.textContent = err.message; }
});

dishForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedRestaurantId) return;
  const body = Object.fromEntries(new FormData(dishForm).entries());
  body.category_id = Number(body.category_id);
  body.price = Number(body.price);
  try {
    await api(`/api/admin/restaurants/${selectedRestaurantId}/dishes`, { method: 'POST', body: JSON.stringify(body) });
    dishForm.reset();
    statusEl.textContent = 'Блюдо добавлено.';
    await openEditor(selectedRestaurantId);
  } catch (err) { statusEl.textContent = err.message; }
});

loadRestaurants();
