(()=>{
  const editor=document.querySelector('#editor');
  if(!editor) return;
  const nav=editor.querySelector('.editor-nav');
  const content=nav?.nextElementSibling;
  if(!nav||!content) return;

  nav.innerHTML=`
    <button type="button" data-workspace-tab="overview" class="active">Обзор</button>
    <button type="button" data-workspace-tab="catalog">Каталог</button>
    <button type="button" data-workspace-tab="branding">Оформление</button>
    <button type="button" data-workspace-tab="publish">QR и ссылка</button>
    <button type="button" data-workspace-tab="access">Доступ</button>`;

  const profile=document.querySelector('#venueData');
  const editForm=document.querySelector('#restaurantEditForm');
  const branding=document.querySelector('#branding');
  const brandingForm=document.querySelector('#brandingForm');
  const access=document.querySelector('#access');
  const accessBox=access?.nextElementSibling;
  const menu=document.querySelector('#menuManage');

  const overview=document.createElement('section');overview.dataset.workspacePanel='overview';overview.className='workspace-panel';
  overview.innerHTML=`<div class="workspace-section-head"><div><span class="muted">КЛИЕНТ</span><h3>Обзор</h3><p class="muted">Главные данные проекта и быстрые действия.</p></div></div><div id="workspaceOverviewCards" class="workspace-overview-cards"></div>`;
  if(profile&&editForm){
    const labels={name:'Название',subtitle:'Описание / подзаголовок',phone:'WhatsApp / телефон',address:'Адрес',service:'Обслуживание'};
    [...editForm.querySelectorAll('input')].forEach(input=>{
      if(input.closest('.workspace-field'))return;
      const wrap=document.createElement('label');wrap.className='workspace-field';
      const cap=document.createElement('span');cap.className='muted';cap.textContent=labels[input.name]||input.placeholder||'Поле';
      input.parentNode.insertBefore(wrap,input);wrap.append(cap,input);
    });
    overview.append(profile,editForm)
  }

  const catalog=document.createElement('section');catalog.dataset.workspacePanel='catalog';catalog.className='workspace-panel';
  catalog.innerHTML=`<div class="workspace-section-head"><div><span class="muted">КАТАЛОГ</span><h3>Каталог клиента</h3><p class="muted">Сначала создайте категории, затем добавляйте товары, блюда или услуги. Ниже находится полный список.</p></div><a id="workspaceCatalogPreview" class="secondary workspace-preview-action" target="_blank">Открыть сайт</a></div>`;
  if(menu){menu.classList.add('workspace-catalog-body');catalog.append(menu)}

  const brandPanel=document.createElement('section');brandPanel.dataset.workspacePanel='branding';brandPanel.className='workspace-panel';
  if(branding&&brandingForm)brandPanel.append(branding,brandingForm);

  const publish=document.createElement('section');publish.dataset.workspacePanel='publish';publish.className='workspace-panel';
  publish.innerHTML=`<div class="workspace-section-head"><div><span class="muted">ПУБЛИКАЦИЯ</span><h3>QR и ссылка</h3><p class="muted">Здесь всегда находится готовый сайт клиента.</p></div></div><div class="publish-card"><div><span class="muted">Публичная ссылка</span><strong id="workspacePublicUrl">—</strong></div><div class="publish-actions"><a id="workspaceOpenSite" class="primary" target="_blank">Открыть сайт</a><button id="workspaceCopySite" class="secondary" type="button">Копировать ссылку</button><a id="workspaceQr" class="secondary" target="_blank">QR-код</a></div></div>`;

  const accessPanel=document.createElement('section');accessPanel.dataset.workspacePanel='access';accessPanel.className='workspace-panel';
  if(access&&accessBox)accessPanel.append(access,accessBox);

  content.replaceChildren(overview,catalog,brandPanel,publish,accessPanel);
  const panels=[...content.querySelectorAll('[data-workspace-panel]')];
  const buttons=[...nav.querySelectorAll('[data-workspace-tab]')];
  function show(name){panels.forEach(p=>p.hidden=p.dataset.workspacePanel!==name);buttons.forEach(b=>b.classList.toggle('active',b.dataset.workspaceTab===name))}
  buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.workspaceTab)));
  show('overview');

  function inferType(r){const saved=localStorage.getItem(`qr-business-type:${r?.slug||''}`);if(saved)return saved;const s=`${r?.name||''} ${r?.subtitle||''}`.toLowerCase();if(/кафе|бар|restaurant|cafe|lounge|кухн|еда|ресторан/.test(s))return'food';if(/цвет|букет|flower|flor/.test(s))return'flowers';if(/авто|car|motor|машин|автосалон/.test(s))return'auto';if(/услуг|service|сервис/.test(s))return'services';return'products'}
  function sync(){
    if(!window.selectedRestaurant && typeof selectedRestaurant==='undefined')return;
    const r=typeof selectedRestaurant!=='undefined'?selectedRestaurant:window.selectedRestaurant;
    if(!r)return;
    const url=`${location.origin}/r/${r.slug}`,published=r.active!==false,type=inferType(r);
    document.body.dataset.businessType=type;
    const serviceWrap=document.querySelector('#restaurantEditForm [name="service"]')?.closest('.workspace-field');if(serviceWrap)serviceWrap.hidden=type!=='food';
    const urlEl=document.querySelector('#workspacePublicUrl');if(urlEl)urlEl.textContent=url;
    const open=document.querySelector('#workspaceOpenSite');if(open){open.href=`/r/${encodeURIComponent(r.slug)}`;open.textContent=published?'Открыть сайт':'Сайт скрыт'}
    const preview=document.querySelector('#workspaceCatalogPreview');if(preview)preview.href=`/r/${encodeURIComponent(r.slug)}`;
    const qr=document.querySelector('#workspaceQr');if(qr)qr.href=`/api/restaurants/${encodeURIComponent(r.slug)}/qr`;
    const cards=document.querySelector('#workspaceOverviewCards');if(cards)cards.innerHTML=`<div><span class="muted">Статус</span><strong>${published?'Опубликован ✓':'Скрыт'}</strong></div><div><span class="muted">Сайт</span><strong>/r/${r.slug}</strong></div><div><span class="muted">Следующий шаг</span><strong>${published?'Проверьте каталог и передайте ссылку / QR':'Опубликуйте сайт, когда он будет готов'}</strong></div>`;
  }
  document.querySelector('#workspaceCopySite')?.addEventListener('click',async()=>{const text=document.querySelector('#workspacePublicUrl')?.textContent;if(!text||text==='—')return;try{await navigator.clipboard.writeText(text);if(typeof statusEl!=='undefined')statusEl.textContent='Ссылка сайта скопирована.'}catch{prompt('Скопируйте ссылку:',text)}});
  const observer=new MutationObserver(sync);observer.observe(document.querySelector('#editorTitle'),{childList:true,subtree:true});
  sync();
})();