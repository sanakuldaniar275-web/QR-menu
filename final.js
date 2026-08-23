document.addEventListener('error', event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const holder = img.closest('.dish-photo, .dish-detail-visual');
  if (!holder) return;
  const fallback = document.createElement('span');
  fallback.className = 'dish-emoji';
  fallback.textContent = '🍽️';
  img.replaceWith(fallback);
}, true);

(() => {
  const isGreenBar = location.pathname.replace(/\/+$/, '') === '/r/green-bar';
  if (!isGreenBar) return;
  document.body.classList.add('green-bar-ui');

  const MAIN_CATEGORIES = new Set([
    'Суши/роллы','Гарниры','Банкетные блюда','Салаты','Первые блюда','Закуски',
    'Ассорти','Вторые блюда','Паста','Пицца','Стейки','Фаст-фуд'
  ]);
  const BAR_CATEGORIES = new Set([
    'Чай','К чаю','Прохладительные напитки','Лимонады','Пиво разливное','Пиво бутылочное',
    'Закуски к пиву','Водка','Виски','Коньяк','Ром','Джин','Текила','Вермуты','Вино',
    'Шампанское','Настойки и биттеры','Ликеры','Алкогольные напитки','Спритц-коктейли','Шоты'
  ]);
  let menuGroup = 'main';

  // First screen shown immediately after scanning the QR code.
  const welcome = document.createElement('div');
  welcome.className = 'gb-welcome';
  welcome.innerHTML = `
    <div class="gb-welcome-card">
      <div class="gb-welcome-brand">
        <img src="/greenbar-logo.webp" alt="GREEN LOUNGE-BAR">
        <div>
          <span>LOUNGE • BAR • KITCHEN</span>
          <h1>GREEN BAR</h1>
          <p>Shymkent</p>
        </div>
      </div>
      <button class="gb-enter-menu" type="button">Смотреть меню</button>
      <div class="gb-welcome-links">
        <a href="https://2gis.kz/shymkent/geo/70000001063732278" target="_blank" rel="noopener"><b>Как добраться</b><span>Открыть маршрут в 2GIS</span></a>
        <div class="gb-address"><b>Адрес заведения</b><span>проспект Кунаева, 17/7</span></div>
        <a href="https://wa.me/77053623265" target="_blank" rel="noopener"><b>WhatsApp</b><span>+7 705 362 32 65</span></a>
        <a href="https://www.instagram.com/greenbar_17" target="_blank" rel="noopener"><b>Instagram</b><span>@greenbar_17</span></a>
      </div>
    </div>`;
  document.body.prepend(welcome);
  document.body.classList.add('gb-welcome-open');
  welcome.querySelector('.gb-enter-menu').addEventListener('click', () => {
    welcome.classList.add('leaving');
    document.body.classList.remove('gb-welcome-open');
    setTimeout(() => welcome.remove(), 260);
    window.scrollTo({top:0, behavior:'smooth'});
  });

  const categories = document.querySelector('#categories');
  const searchWrap = document.querySelector('.search-wrap');
  const quickActions = document.querySelector('.quick-actions');
  const menuRoot = document.querySelector('#menu');
  if (!categories || !searchWrap || !quickActions || !menuRoot) return;

  // Two top-level menu sections.
  const groupNav = document.createElement('div');
  groupNav.className = 'gb-menu-groups';
  groupNav.innerHTML = `
    <button type="button" class="active" data-gb-group="main"><span>🍽️</span><b>Основное меню</b></button>
    <button type="button" data-gb-group="bar"><span>🍸</span><b>Барное меню</b></button>`;
  quickActions.insertAdjacentElement('afterend', groupNav);

  function allowedSet(){ return menuGroup === 'bar' ? BAR_CATEGORIES : MAIN_CATEGORIES; }
  function categoryAllowed(label){ return label === 'Все' || allowedSet().has(label); }

  function syncGroupUi(){
    groupNav.querySelectorAll('[data-gb-group]').forEach(b => b.classList.toggle('active', b.dataset.gbGroup === menuGroup));
    categories.querySelectorAll('.category').forEach(button => {
      button.hidden = !categoryAllowed(button.textContent.trim());
    });
  }

  function filterRenderedCards(){
    const allowed = allowedSet();
    let shown = 0;
    menuRoot.querySelectorAll('.dish-card[data-dish]').forEach(card => {
      const d = typeof dishes !== 'undefined' ? dishes.find(x => String(x.id) === String(card.dataset.dish)) : null;
      const visible = !d || allowed.has(d.category);
      card.hidden = !visible;
      if (visible) shown++;
    });
    const sectionCount = menuRoot.querySelector('.section-head span');
    if (sectionCount) sectionCount.textContent = `${shown} поз.`;
    syncGroupUi();
  }

  groupNav.addEventListener('click', e => {
    const b = e.target.closest('[data-gb-group]');
    if (!b) return;
    menuGroup = b.dataset.gbGroup;
    syncGroupUi();
    const all = [...categories.querySelectorAll('.category')].find(x => x.textContent.trim() === 'Все');
    if (all) all.click();
    setTimeout(() => { filterRenderedCards(); sync(); }, 0);
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gb-category-toggle';
  toggle.innerHTML = '<span>Все категории</span><span>⌄</span>';
  searchWrap.insertAdjacentElement('afterend', toggle);

  const backdrop = document.createElement('div');
  backdrop.className = 'gb-category-backdrop';
  backdrop.innerHTML = '<section class="gb-category-sheet" role="dialog" aria-modal="true" aria-label="Категории меню"><div class="gb-category-head"><h2>Категории</h2><button class="gb-category-close" type="button" aria-label="Закрыть">×</button></div><div class="gb-category-list"></div></section>';
  document.body.appendChild(backdrop);

  const list = backdrop.querySelector('.gb-category-list');
  const close = () => {
    backdrop.classList.remove('open');
    document.body.classList.remove('no-scroll');
  };
  const open = () => {
    sync();
    backdrop.classList.add('open');
    document.body.classList.add('no-scroll');
  };

  function sync() {
    syncGroupUi();
    const originals = [...categories.querySelectorAll('.category')].filter(button => categoryAllowed(button.textContent.trim()));
    const activeButton = originals.find(button => button.classList.contains('active'));
    toggle.firstElementChild.textContent = activeButton?.textContent?.trim() || 'Все категории';
    list.innerHTML = originals.map(button => {
      const label = button.textContent.trim();
      const selected = button.classList.contains('active') ? ' active' : '';
      const allOriginals = [...categories.querySelectorAll('.category')];
      const index = allOriginals.indexOf(button);
      return `<button type="button" class="${selected.trim()}" data-gb-category-index="${index}">${label.replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}</button>`;
    }).join('');
  }

  toggle.addEventListener('click', open);
  backdrop.querySelector('.gb-category-close').addEventListener('click', close);
  backdrop.addEventListener('click', event => {
    if (event.target === backdrop) close();
    const choice = event.target.closest('[data-gb-category-index]');
    if (!choice) return;
    const originals = [...categories.querySelectorAll('.category')];
    originals[Number(choice.dataset.gbCategoryIndex)]?.click();
    close();
    setTimeout(() => { sync(); filterRenderedCards(); }, 0);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && backdrop.classList.contains('open')) close();
  });

  new MutationObserver(() => { sync(); filterRenderedCards(); }).observe(categories, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  new MutationObserver(filterRenderedCards).observe(menuRoot, {childList:true, subtree:true});
  sync();
  filterRenderedCards();
})();
