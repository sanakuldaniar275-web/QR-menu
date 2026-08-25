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
  if(profile&&editForm){overview.append(profile,editForm)}

  const catalog=document.createElement('section');catalog.dataset.workspacePanel='catalog';catalog.className='workspace-panel';
  if(menu)catalog.append(menu);

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

  function sync(){
    if(!window.selectedRestaurant && typeof selectedRestaurant==='undefined')return;
    const r=typeof selectedRestaurant!=='undefined'?selectedRestaurant:window.selectedRestaurant;
    if(!r)return;
    const url=`${location.origin}/r/${r.slug}`,published=r.active!==false;
    const urlEl=document.querySelector('#workspacePublicUrl');if(urlEl)urlEl.textContent=url;
    const open=document.querySelector('#workspaceOpenSite');if(open){open.href=`/r/${encodeURIComponent(r.slug)}`;open.textContent=published?'Открыть сайт':'Сайт скрыт'}
    const qr=document.querySelector('#workspaceQr');if(qr)qr.href=`/api/restaurants/${encodeURIComponent(r.slug)}/qr`;
    const cards=document.querySelector('#workspaceOverviewCards');if(cards)cards.innerHTML=`<div><span class="muted">Статус</span><strong>${published?'Опубликован ✓':'Скрыт'}</strong></div><div><span class="muted">Сайт</span><strong>/r/${r.slug}</strong></div><div><span class="muted">Следующий шаг</span><strong>${published?'Проверьте каталог и передайте ссылку / QR':'Опубликуйте сайт, когда он будет готов'}</strong></div>`;
  }
  document.querySelector('#workspaceCopySite')?.addEventListener('click',async()=>{const text=document.querySelector('#workspacePublicUrl')?.textContent;if(!text||text==='—')return;try{await navigator.clipboard.writeText(text);if(typeof statusEl!=='undefined')statusEl.textContent='Ссылка сайта скопирована.'}catch{prompt('Скопируйте ссылку:',text)}});
  const observer=new MutationObserver(sync);observer.observe(document.querySelector('#editorTitle'),{childList:true,subtree:true});
  sync();
})();