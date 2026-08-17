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
const shareButton = document.querySelector('#shareButton');
const infoSheet = document.querySelector('#infoSheet');
const infoContent = document.querySelector('#infoContent');
const closeInfo = document.querySelector('#closeInfo');
const dishSheet = document.querySelector('#dishSheet');
const dishDetail = document.querySelector('#dishDetail');
const closeDish = document.querySelector('#closeDish');
const toast = document.querySelector('#toast');

const money = n => new Intl.NumberFormat('ru-RU').format(Number(n)) + ' ₸';
const getSlug = () => location.pathname.split('/').filter(Boolean)[1] || 'demo';
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const escapeAttr = escapeHtml;

function normalizePhone(value) { const digits = String(value || '').replace(/\D/g, ''); return digits.length >= 10 ? digits : ''; }
function pickEmoji(category) { return ({'Завтраки':'🍳','Салаты':'🥗','Супы':'🍜','Горячее':'🥩','Пицца':'🍕','Десерты':'🍰','Напитки':'🥤'})[category] || '🍽️'; }
function visual(x, cls='') { return x.image_url ? `<img class="${cls}" src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.name)}" loading="lazy">` : `<span class="dish-emoji ${cls}">${escapeHtml(x.emoji || pickEmoji(x.category))}</span>`; }
function showToast(text){ toast.textContent=text; toast.hidden=false; clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.hidden=true,2200); }

function renderCategories(){ categoryEl.innerHTML=categories.map(c=>`<button class="category ${c===active?'active':''}" data-category="${escapeAttr(c)}" type="button">${escapeHtml(c)}</button>`).join(''); }
function card(x){ const badge=x.badge?`<span class="dish-badge">${escapeHtml(x.badge)}</span>`:''; return `<button class="dish-card" type="button" data-dish="${x.id}"><div class="dish-photo">${visual(x)}${badge}</div><div class="dish-body"><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.description||'')}</p><div class="dish-bottom"><strong>${money(x.price)}</strong><span class="mini-plus">＋</span></div></div></button>`; }
function render(){ const q=searchEl.value.trim().toLowerCase(); const list=dishes.filter(x=>(active==='Все'||x.category===active)&&(`${x.name} ${x.description||''} ${x.category||''}`.toLowerCase().includes(q))); const heading=q?`Результаты: ${list.length}`:(active==='Все'?'Все блюда':active); menuEl.innerHTML=list.length?`<div class="section-head"><h2>${escapeHtml(heading)}</h2><span>${list.length} поз.</span></div><div class="dish-grid">${list.map(card).join('')}</div>`:'<div class="empty-state"><div>⌕</div><b>Ничего не найдено</b><span>Попробуйте изменить запрос или категорию</span></div>'; }

function openDish(id){ const x=dishes.find(d=>String(d.id)===String(id)); if(!x)return; dishDetail.innerHTML=`<div class="dish-detail-visual">${visual(x,'dish-detail-img')}${x.badge?`<span class="dish-badge">${escapeHtml(x.badge)}</span>`:''}</div><div class="dish-detail-body"><span class="detail-category">${escapeHtml(x.category||'Блюдо')}</span><h2 id="dishTitle">${escapeHtml(x.name)}</h2><p>${escapeHtml(x.description||'')}</p><strong class="detail-price">${money(x.price)}</strong></div>`; dishSheet.hidden=false; document.body.classList.add('no-scroll'); }
function closeSheet(sheet){ sheet.hidden=true; document.body.classList.remove('no-scroll'); }

function applyRestaurant(data){ restaurant=data||{}; restaurantNameEl.textContent=restaurant.name||'QR Menu'; restaurantSubtitleEl.textContent=restaurant.subtitle||'Меню заведения'; document.title=`${restaurantNameEl.textContent} — меню`; restaurantMetaEl.innerHTML=[restaurant.service,restaurant.address].filter(Boolean).map(x=>`<span>${escapeHtml(x)}</span>`).join(''); const phone=normalizePhone(restaurant.phone); if(phone){whatsappLink.hidden=false;whatsappLink.href=`https://wa.me/${phone}?text=${encodeURIComponent('Здравствуйте! Пишу из QR-меню '+restaurantNameEl.textContent)}`;}else whatsappLink.hidden=true; qrLink.href=`/api/restaurants/${encodeURIComponent(getSlug())}/qr`; infoContent.innerHTML=`<p><strong>${escapeHtml(restaurant.name||'Заведение')}</strong></p>${restaurant.subtitle?`<p>${escapeHtml(restaurant.subtitle)}</p>`:''}${restaurant.address?`<p>📍 ${escapeHtml(restaurant.address)}</p>`:''}${restaurant.service?`<p>ℹ️ ${escapeHtml(restaurant.service)}</p>`:''}${phone?`<p>📞 ${escapeHtml(restaurant.phone)}</p>`:''}`; }

async function loadMenu(){ menuEl.innerHTML='<div class="empty-state"><div class="loader"></div><b>Загружаем меню</b></div>'; try{ const response=await fetch(`/api/menu/${encodeURIComponent(getSlug())}`); if(!response.ok)throw new Error(); const data=await response.json(); dishes=data.dishes||[]; categories=['Все',...(data.categories||[])]; applyRestaurant(data.restaurant||{}); renderCategories(); render(); }catch(_err){ const fallback=window.QR_MENU_DEMO; if(getSlug()==='demo'&&fallback){dishes=fallback.dishes;categories=['Все',...fallback.categories];applyRestaurant(fallback.restaurant);renderCategories();render();return;} restaurantSubtitleEl.textContent='Меню временно недоступно'; menuEl.innerHTML='<div class="empty-state"><div>⚠️</div><b>Не удалось загрузить меню</b></div>'; } }

categoryEl.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;active=b.dataset.category;renderCategories();render();});
menuEl.addEventListener('click',e=>{const card=e.target.closest('[data-dish]');if(card)openDish(card.dataset.dish);});
searchEl.addEventListener('input',render);
infoButton.addEventListener('click',()=>{infoSheet.hidden=false;document.body.classList.add('no-scroll');});
closeInfo.addEventListener('click',()=>closeSheet(infoSheet));
closeDish.addEventListener('click',()=>closeSheet(dishSheet));
[infoSheet,dishSheet].forEach(s=>s.addEventListener('click',e=>{if(e.target===s)closeSheet(s);}));
shareButton.addEventListener('click',async()=>{const data={title:document.title,text:`Меню ${restaurantNameEl.textContent}`,url:location.href};try{if(navigator.share){await navigator.share(data);}else{await navigator.clipboard.writeText(location.href);showToast('Ссылка на меню скопирована');}}catch(e){if(e.name!=='AbortError')showToast('Не удалось поделиться');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!dishSheet.hidden)closeSheet(dishSheet);else if(!infoSheet.hidden)closeSheet(infoSheet);}});
loadMenu();