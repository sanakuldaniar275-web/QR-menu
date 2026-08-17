let dishes = [];
let categories = ['Все'];
let active = 'Все';

const categoryEl = document.querySelector('#categories');
const menuEl = document.querySelector('#menu');
const searchEl = document.querySelector('#search');
const restaurantNameEl = document.querySelector('#restaurantName');
const restaurantSubtitleEl = document.querySelector('#restaurantSubtitle');
const money = n => new Intl.NumberFormat('ru-RU').format(Number(n)) + ' ₸';

function getSlug() {
  const parts = location.pathname.split('/').filter(Boolean);
  return parts[0] === 'r' && parts[1] ? parts[1] : 'demo';
}

function renderCategories() {
  categoryEl.innerHTML = categories.map(c => `<button class="category ${c === active ? 'active' : ''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const list = dishes.filter(x => (active === 'Все' || x.category === active) && (`${x.name} ${x.description || ''}`.toLowerCase().includes(q)));
  menuEl.innerHTML = list.length ? `<h2 class="section-title">${escapeHtml(active === 'Все' ? 'Меню' : active)}</h2><div class="grid">${list.map(card).join('')}</div>` : '<div class="empty">Ничего не найдено</div>';
}

function card(x) {
  const photo = x.image_url ? `<img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.name)}" loading="lazy">` : '<span class="photo-placeholder">🍽️</span>';
  return `<article class="card"><div class="photo">${photo}</div><div class="card-body"><h3>${escapeHtml(x.name)}</h3><p class="description">${escapeHtml(x.description || '')}</p><div class="price">${money(x.price)}</div></div></article>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function escapeAttr(value) { return escapeHtml(value); }

async function loadMenu() {
  menuEl.innerHTML = '<div class="empty">Загружаем меню…</div>';
  try {
    const response = await fetch(`/api/menu/${encodeURIComponent(getSlug())}`);
    if (!response.ok) throw new Error('Menu not found');
    const data = await response.json();
    dishes = data.dishes || [];
    categories = ['Все', ...(data.categories || [])];
    restaurantNameEl.textContent = data.restaurant?.name || 'QR Menu';
    restaurantSubtitleEl.textContent = data.restaurant?.subtitle || 'Меню заведения';
    document.title = `${restaurantNameEl.textContent} — меню`;
    renderCategories();
    render();
  } catch (_err) {
    restaurantSubtitleEl.textContent = 'Меню недоступно';
    menuEl.innerHTML = '<div class="empty">Не удалось загрузить меню. Попробуйте обновить страницу.</div>';
  }
}

categoryEl.addEventListener('click', e => {
  const b = e.target.closest('[data-category]');
  if (!b) return;
  active = b.dataset.category;
  renderCategories();
  render();
});
searchEl.addEventListener('input', render);
loadMenu();
