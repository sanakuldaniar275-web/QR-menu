let dishes = [];
let categories = ['Все'];
let active = 'Все';
let restaurant = {};

const categoryEl = document.querySelector('#categories');
const menuEl = document.querySelector('#menu');
const searchEl = document.querySelector('#search');
const restaurantNameEl = document.querySelector('#restaurantName');
const restaurantSubtitleEl = document.querySelector('#restaurantSubtitle');
const restaurantMetaEl = document.querySelector('#restaurantMeta');
const whatsappLink = document.querySelector('#whatsappLink');
const qrLink = document.querySelector('#qrLink');
const infoButton = document.querySelector('#infoButton');
const infoSheet = document.querySelector('#infoSheet');
const infoContent = document.querySelector('#infoContent');
const closeInfo = document.querySelector('#closeInfo');

const money = n => new Intl.NumberFormat('ru-RU').format(Number(n)) + ' ₸';

function getSlug() {
  const parts = location.pathname.split('/').filter(Boolean);
  return parts[0] === 'r' && parts[1] ? parts[1] : 'demo';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function escapeAttr(value) { return escapeHtml(value); }

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : '';
}

function renderCategories() {
  categoryEl.innerHTML = categories.map(c => `<button class="category ${c === active ? 'active' : ''}" data-category="${escapeAttr(c)}" type="button">${escapeHtml(c)}</button>`).join('');
}

function dishVisual(x) {
  if (x.image_url) return `<img src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.name)}" loading="lazy" onerror="this.parentElement.classList.add('image-error');this.remove()">`;
  const fallback = x.emoji || pickEmoji(x.category);
  return `<span class="dish-emoji" aria-hidden="true">${escapeHtml(fallback)}</span>`;
}

function pickEmoji(category) {
  const icons = { 'Завтраки':'🍳','Салаты':'🥗','Супы':'🍜','Горячее':'🥩','Пицца':'🍕','Десерты':'🍰','Напитки':'🥤' };
  return icons[category] || '🍽️';
}

function card(x) {
  const badge = x.badge ? `<span class="dish-badge">${escapeHtml(x.badge)}</span>` : '';
  return `<article class="dish-card">
    <div class="dish-photo">${dishVisual(x)}${badge}</div>
    <div class="dish-body">
      <h3>${escapeHtml(x.name)}</h3>
      <p>${escapeHtml(x.description || '')}</p>
      <div class="dish-bottom"><strong>${money(x.price)}</strong><span class="mini-plus" aria-hidden="true">＋</span></div>
    </div>
  </article>`;
}

function render() {
  const q = searchEl.value.trim().toLowerCase();
  const list = dishes.filter(x => (active === 'Все' || x.category === active) && (`${x.name} ${x.description || ''} ${x.category || ''}`.toLowerCase().includes(q)));
  const heading = q ? `Результаты: ${list.length}` : (active === 'Все' ? 'Все блюда' : active);
  menuEl.innerHTML = list.length
    ? `<div class="section-head"><h2>${escapeHtml(heading)}</h2><span>${list.length} поз.</span></div><div class="dish-grid">${list.map(card).join('')}</div>`
    : '<div class="empty-state"><div>⌕</div><b>Ничего не найдено</b><span>Попробуйте изменить запрос или категорию</span></div>';
}

function applyRestaurant(data) {
  restaurant = data || {};
  restaurantNameEl.textContent = restaurant.name || 'QR Menu';
  restaurantSubtitleEl.textContent = restaurant.subtitle || 'Меню заведения';
  document.title = `${restaurantNameEl.textContent} — меню`;

  const meta = [restaurant.service, restaurant.address].filter(Boolean);
  restaurantMetaEl.innerHTML = meta.map(x => `<span>${escapeHtml(x)}</span>`).join('');

  const phone = normalizePhone(restaurant.phone);
  if (phone) {
    whatsappLink.hidden = false;
    whatsappLink.href = `https://wa.me/${phone}?text=${encodeURIComponent('Здравствуйте! Пишу из QR-меню ' + restaurantNameEl.textContent)}`;
  } else {
    whatsappLink.hidden = true;
  }
  qrLink.href = `/api/restaurants/${encodeURIComponent(getSlug())}/qr`;
  infoContent.innerHTML = `
    <p><strong>${escapeHtml(restaurant.name || 'Заведение')}</strong></p>
    ${restaurant.subtitle ? `<p>${escapeHtml(restaurant.subtitle)}</p>` : ''}
    ${restaurant.address ? `<p>📍 ${escapeHtml(restaurant.address)}</p>` : ''}
    ${restaurant.service ? `<p>ℹ️ ${escapeHtml(restaurant.service)}</p>` : ''}
    ${phone ? `<p>📞 ${escapeHtml(restaurant.phone)}</p>` : ''}`;
}

async function loadMenu() {
  menuEl.innerHTML = '<div class="empty-state"><div class="loader"></div><b>Загружаем меню</b></div>';
  try {
    const response = await fetch(`/api/menu/${encodeURIComponent(getSlug())}`, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) throw new Error('Menu not found');
    const data = await response.json();
    dishes = data.dishes || [];
    categories = ['Все', ...(data.categories || [])];
    applyRestaurant(data.restaurant || {});
    renderCategories();
    render();
  } catch (_err) {
    const fallback = window.QR_MENU_DEMO;
    if (getSlug() === 'demo' && fallback) {
      dishes = fallback.dishes;
      categories = ['Все', ...fallback.categories];
      applyRestaurant(fallback.restaurant);
      renderCategories();
      render();
      return;
    }
    restaurantSubtitleEl.textContent = 'Меню временно недоступно';
    menuEl.innerHTML = '<div class="empty-state"><div>⚠️</div><b>Не удалось загрузить меню</b><span>Обновите страницу через несколько секунд</span></div>';
  }
}

categoryEl.addEventListener('click', e => {
  const b = e.target.closest('[data-category]');
  if (!b) return;
  active = b.dataset.category;
  renderCategories();
  render();
  window.scrollTo({ top: Math.max(0, menuEl.offsetTop - 150), behavior: 'smooth' });
});

searchEl.addEventListener('input', render);
infoButton.addEventListener('click', () => { infoSheet.hidden = false; document.body.classList.add('no-scroll'); });
closeInfo.addEventListener('click', () => { infoSheet.hidden = true; document.body.classList.remove('no-scroll'); });
infoSheet.addEventListener('click', e => { if (e.target === infoSheet) closeInfo.click(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !infoSheet.hidden) closeInfo.click(); });

loadMenu();
