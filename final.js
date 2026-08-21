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

  const categories = document.querySelector('#categories');
  const searchWrap = document.querySelector('.search-wrap');
  if (!categories || !searchWrap) return;

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
    const originals = [...categories.querySelectorAll('.category')];
    const active = originals.find(button => button.classList.contains('active'));
    toggle.firstElementChild.textContent = active?.textContent?.trim() || 'Все категории';
    list.innerHTML = originals.map((button, index) => {
      const label = button.textContent.trim();
      const selected = button.classList.contains('active') ? ' active' : '';
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
    setTimeout(sync, 0);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && backdrop.classList.contains('open')) close();
  });

  new MutationObserver(sync).observe(categories, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  sync();
})();
