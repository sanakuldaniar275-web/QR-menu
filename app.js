let dishes = [];
let categories = ['Все'];
let active = 'Все';
let restaurant = {};
let selection = {};

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
const escapeHtml = value => String(value ?? '').replace(/[&<>'\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[ch]));
const escapeAttr = escapeHtml;
const storageKey = () => `qr-menu-selection:${getSlug()}`;

function normalizePhone(value) { const digits = String(value || '').replace(/\D/g, ''); return digits.length >= 10 ? digits : ''; }
function pickEmoji(category) { return ({'Завтраки':'🍳','Салаты':'🥗','Супы':'🍜','Горячее':'🥩','Пицца':'🍕','Десерты':'🍰','Напитки':'🥤'})[category] || '🍽️'; }
function visual(x, cls='') { return x.image_url ? `<img class="${cls}" src="${escapeAttr(x.image_url)}" alt="${escapeAttr(x.name)}" loading="lazy">` : `<span class="dish-emoji ${cls}">${escapeHtml(x.emoji || pickEmoji(x.category))}</span>`; }
function showToast(text){ toast.textContent=text; toast.hidden=false; clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.hidden=true,2200); }

function loadSelection(){ try{ selection=JSON.parse(localStorage.getItem(storageKey())||'{}')||{}; }catch{ selection={}; } }
function saveSelection(){ localStorage.setItem(storageKey(),JSON.stringify(selection)); }
function qty(id){ return Math.max(0,Number(selection[String(id)]||0)); }
function totalCount(){ return Object.values(selection).reduce((s,n)=>s+Math.max(0,Number(n||0)),0); }
function totalPrice(){ return dishes.reduce((sum,d)=>sum+(qty(d.id)*Number(d.price||0)),0); }
function selectedDishes(){ return dishes.filter(d=>qty(d.id)>0); }

function ensureCalculatorUi(){
  if(!document.querySelector('#totalBar')){
    document.body.insertAdjacentHTML('beforeend',`<button id="totalBar" class="total-bar" type="button" hidden><span><b id="totalCount">0</b> выбрано</span><strong id="totalPrice">0 ₸</strong><i>⌃</i></button><div id="calcSheet" class="sheet-backdrop" hidden><section class="sheet calc-sheet" role="dialog" aria-modal="true" aria-labelledby="calcTitle"><button id="closeCalc" class="sheet-close" type="button" aria-label="Закрыть">×</button><div class="calc-head"><span class="detail-category">РАСЧЁТ СУММЫ</span><h2 id="calcTitle">Ваш выбор</h2><p>Это ориентировочная сумма выбранных блюд. Заказ не отправляется.</p></div><div id="calcItems"></div><div class="calc-total"><span>Итого</span><strong id="calcTotal">0 ₸</strong></div><button id="clearCalc" class="clear-calc" type="button">Очистить выбор</button></section></div>`);
    document.querySelector('#totalBar').addEventListener('click',openCalculator);
    document.querySelector('#closeCalc').addEventListener('click',()=>closeSheet(document.querySelector('#calcSheet')));
    document.querySelector('#calcSheet').addEventListener('click',e=>{if(e.target===e.currentTarget)closeSheet(e.currentTarget);});
    document.querySelector('#clearCalc').addEventListener('click',()=>{selection={};saveSelection();render();renderCalculator();closeSheet(document.querySelector('#calcSheet'));});
    document.querySelector('#calcItems').addEventListener('click',e=>{const control=e.target.closest('[data-calc-action]');if(!control)return;changeQty(control.dataset.id,control.dataset.calcAction==='plus'?1:-1);});
  }
}
function renderCalculator(){ensureCalculatorUi();const bar=document.querySelector('#totalBar'),count=totalCount(),total=totalPrice();bar.hidden=count===0;document.body.classList.toggle('has-total-bar',count>0);document.querySelector('#totalCount').textContent=count;document.querySelector('#totalPrice').textContent=money(total);document.querySelector('#calcTotal').textContent=money(total);const items=selectedDishes();document.querySelector('#calcItems').innerHTML=items.length?items.map(d=>`<div class="calc-item"><div class="calc-item-info"><strong>${escapeHtml(d.name)}</strong><span>${money(d.price)} × ${qty(d.id)}</span></div><div class="qty-control compact"><button type="button" data-calc-action="minus" data-id="${d.id}">−</button><b>${qty(d.id)}</b><button type="button" data-calc-action="plus" data-id="${d.id}">+</button></div><strong>${money(qty(d.id)*d.price)}</strong></div>`).join(''):'<div class="empty-state small"><b>Ничего не выбрано</b></div>';}
function openCalculator(){renderCalculator();document.querySelector('#calcSheet').hidden=false;document.body.classList.add('no-scroll');}
function changeQty(id,delta){const next=Math.max(0,qty(id)+delta);if(next)selection[String(id)]=next;else delete selection[String(id)];saveSelection();render();renderCalculator();}

function renderCategories(){categoryEl.innerHTML=categories.map(c=>`<button class="category ${c===active?'active':''}" data-category="${escapeAttr(c)}" type="button">${escapeHtml(c)}</button>`).join('');}
function card(x){const badge=x.badge?`<span class="dish-badge">${escapeHtml(x.badge)}</span>`:'';const count=qty(x.id);const control=count>0?`<span class="qty-control" aria-label="Количество ${escapeAttr(x.name)}"><span class="qty-btn" data-action="minus" data-id="${x.id}">−</span><b>${count}</b><span class="qty-btn" data-action="plus" data-id="${x.id}">+</span></span>`:`<span class="mini-plus" data-action="plus" data-id="${x.id}" aria-label="Добавить ${escapeAttr(x.name)}">＋</span>`;return `<button class="dish-card" type="button" data-dish="${x.id}"><div class="dish-photo">${visual(x)}${badge}</div><div class="dish-body"><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.description||'')}</p><div class="dish-bottom"><strong>${money(x.price)}</strong>${control}</div></div></button>`;}
function render(){const q=searchEl.value.trim().toLowerCase();const list=dishes.filter(x=>(active==='Все'||x.category===active)&&(`${x.name} ${x.description||''} ${x.category||''}`.toLowerCase().includes(q)));const heading=q?`Результаты: ${list.length}`:(active==='Все'?'Все блюда':active);menuEl.innerHTML=list.length?`<div class="section-head"><h2>${escapeHtml(heading)}</h2><span>${list.length} поз.</span></div><div class="dish-grid">${list.map(card).join('')}</div>`:'<div class="empty-state"><div>⌕</div><b>Ничего не найдено</b><span>Попробуйте изменить запрос или категорию</span></div>';renderCalculator();}
function openDish(id){const x=dishes.find(d=>String(d.id)===String(id));if(!x)return;const count=qty(x.id);dishDetail.innerHTML=`<div class="dish-detail-visual">${visual(x,'dish-detail-img')}${x.badge?`<span class="dish-badge">${escapeHtml(x.badge)}</span>`:''}</div><div class="dish-detail-body"><span class="detail-category">${escapeHtml(x.category||'Блюдо')}</span><h2 id="dishTitle">${escapeHtml(x.name)}</h2><p>${escapeHtml(x.description||'')}</p><div class="detail-buy"><strong class="detail-price">${money(x.price)}</strong><div class="detail-qty">${count?`<span class="qty-control"><span class="qty-btn" data-detail-action="minus" data-id="${x.id}">−</span><b>${count}</b><span class="qty-btn" data-detail-action="plus" data-id="${x.id}">+</span></span>`:`<button class="detail-add" type="button" data-detail-action="plus" data-id="${x.id}">Добавить</button>`}</div></div></div>`;dishSheet.hidden=false;document.body.classList.add('no-scroll');}
function closeSheet(sheet){sheet.hidden=true;document.body.classList.remove('no-scroll');}

function applyBranding(data){const hero=document.querySelector('.restaurant-hero');const color=/^#[0-9a-f]{6}$/i.test(data.accent_color||'')?data.accent_color:'#f3d21b';document.documentElement.style.setProperty('--accent',color);document.body.dataset.theme=['light','dark','warm'].includes(data.theme)?data.theme:'light';hero.classList.toggle('has-cover',Boolean(data.hero_image_url));hero.style.backgroundImage=data.hero_image_url?`linear-gradient(90deg,#0009,#0004),url("${String(data.hero_image_url).replace(/"/g,'')}")`:'';let logo=document.querySelector('.restaurant-logo');if(data.logo_url){if(!logo){logo=document.createElement('img');logo.className='restaurant-logo';document.querySelector('.hero-content').prepend(logo);}logo.src=data.logo_url;logo.alt=`Логотип ${data.name||'заведения'}`;logo.hidden=false;}else if(logo)logo.hidden=true;}
function applyRestaurant(data){restaurant=data||{};applyBranding(restaurant);restaurantNameEl.textContent=restaurant.name||'QR Menu';restaurantSubtitleEl.textContent=restaurant.subtitle||'Меню заведения';document.title=`${restaurantNameEl.textContent} — меню`;restaurantMetaEl.innerHTML=[restaurant.service,restaurant.address].filter(Boolean).map(x=>`<span>${escapeHtml(x)}</span>`).join('');const phone=normalizePhone(restaurant.phone);if(phone){whatsappLink.hidden=false;whatsappLink.href=`https://wa.me/${phone}?text=${encodeURIComponent('Здравствуйте! Пишу из QR-меню '+restaurantNameEl.textContent)}`;}else whatsappLink.hidden=true;qrLink.href=`/api/restaurants/${encodeURIComponent(getSlug())}/qr`;infoContent.innerHTML=`<p><strong>${escapeHtml(restaurant.name||'Заведение')}</strong></p>${restaurant.subtitle?`<p>${escapeHtml(restaurant.subtitle)}</p>`:''}${restaurant.address?`<p>📍 ${escapeHtml(restaurant.address)}</p>`:''}${restaurant.service?`<p>ℹ️ ${escapeHtml(restaurant.service)}</p>`:''}${phone?`<p>📞 ${escapeHtml(restaurant.phone)}</p>`:''}`;}

async function loadMenu(){menuEl.innerHTML='<div class="empty-state"><div class="loader"></div><b>Загружаем меню</b></div>';loadSelection();try{const response=await fetch(`/api/menu/${encodeURIComponent(getSlug())}`);if(!response.ok)throw new Error();const data=await response.json();dishes=data.dishes||[];categories=['Все',...(data.categories||[])];applyRestaurant(data.restaurant||{});renderCategories();render();}catch(_err){const fallback=window.QR_MENU_DEMO;if(getSlug()==='demo'&&fallback){dishes=fallback.dishes;categories=['Все',...fallback.categories];applyRestaurant(fallback.restaurant);renderCategories();render();return;}restaurantSubtitleEl.textContent='Меню временно недоступно';menuEl.innerHTML='<div class="empty-state"><div>⚠️</div><b>Не удалось загрузить меню</b></div>';}}

categoryEl.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;active=b.dataset.category;renderCategories();render();});
menuEl.addEventListener('click',e=>{const action=e.target.closest('[data-action]');if(action){e.preventDefault();e.stopPropagation();changeQty(action.dataset.id,action.dataset.action==='plus'?1:-1);return;}const card=e.target.closest('[data-dish]');if(card)openDish(card.dataset.dish);});
dishDetail.addEventListener('click',e=>{const action=e.target.closest('[data-detail-action]');if(!action)return;e.preventDefault();changeQty(action.dataset.id,action.dataset.detailAction==='plus'?1:-1);openDish(action.dataset.id);});
searchEl.addEventListener('input',render);
infoButton.addEventListener('click',()=>{infoSheet.hidden=false;document.body.classList.add('no-scroll');});
closeInfo.addEventListener('click',()=>closeSheet(infoSheet));closeDish.addEventListener('click',()=>closeSheet(dishSheet));[infoSheet,dishSheet].forEach(s=>s.addEventListener('click',e=>{if(e.target===s)closeSheet(s);}));
shareButton.addEventListener('click',async()=>{const data={title:document.title,text:`Меню ${restaurantNameEl.textContent}`,url:location.href};try{if(navigator.share){await navigator.share(data);}else{await navigator.clipboard.writeText(location.href);showToast('Ссылка на меню скопирована');}}catch(e){if(e.name!=='AbortError')showToast('Не удалось поделиться');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const calc=document.querySelector('#calcSheet');if(calc&&!calc.hidden)closeSheet(calc);else if(!dishSheet.hidden)closeSheet(dishSheet);else if(!infoSheet.hidden)closeSheet(infoSheet);}});loadMenu();