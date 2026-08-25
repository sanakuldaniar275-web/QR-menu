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
  publish.innerHTML=`<div class="workspace-section-head"><div><span class="muted">ПУБЛИКАЦИЯ</span><h3>QR и ссылка</h3><p class="muted">Всё готовое для передачи клиенту: ссылка на сайт и QR-код.</p></div></div><div class="publish-layout"><div class="publish-card publish-link-card"><div><span class="muted">Публичная ссылка</span><strong id="workspacePublicUrl">—</strong><p class="muted">Эту ссылку можно отправить клиенту или разместить в соцсетях.</p></div><div class="publish-actions"><a id="workspaceOpenSite" class="primary" target="_blank">Открыть сайт</a><button id="workspaceCopySite" class="secondary" type="button">Копировать ссылку</button></div></div><div class="publish-qr-card"><div><span class="muted">QR-код клиента</span><strong>Готов к использованию</strong><p class="muted">Проверьте QR телефоном перед печатью.</p></div><div class="publish-qr-preview"><img id="workspaceQrImage" alt="QR-код клиента"></div><div class="publish-actions"><a id="workspaceQr" class="secondary" target="_blank">Открыть QR</a><a id="workspaceQrDownload" class="primary" download>Скачать QR</a></div></div></div>`;

  const accessPanel=document.createElement('section');accessPanel.dataset.workspacePanel='access';accessPanel.className='workspace-panel';
  if(access&&accessBox)accessPanel.append(access,accessBox);

  content.replaceChildren(overview,catalog,brandPanel,publish,accessPanel);
  const editorHead=editor.querySelector('.admin-head');
  if(editorHead&&!editorHead.querySelector('#workspaceBackToClients')){
    const back=document.createElement('button');back.id='workspaceBackToClients';back.className='workspace-back';back.type='button';back.innerHTML='<span aria-hidden="true">←</span><span>Все клиенты</span>';editorHead.insertBefore(back,editorHead.firstChild);
    back.addEventListener('click',()=>leaveClientWorkspace());
  }
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
    const url=`${location.origin}/r/${r.slug}`,published=r.active!==false,type=inferType(r),qrUrl=`/api/restaurants/${encodeURIComponent(r.slug)}/qr`;
    document.body.dataset.businessType=type;
    const serviceWrap=document.querySelector('#restaurantEditForm [name="service"]')?.closest('.workspace-field');if(serviceWrap)serviceWrap.hidden=type!=='food';
    const urlEl=document.querySelector('#workspacePublicUrl');if(urlEl)urlEl.textContent=url;
    const open=document.querySelector('#workspaceOpenSite');if(open){open.href=`/r/${encodeURIComponent(r.slug)}`;open.textContent=published?'Открыть сайт':'Сайт скрыт'}
    const preview=document.querySelector('#workspaceCatalogPreview');if(preview)preview.href=`/r/${encodeURIComponent(r.slug)}`;
    const qr=document.querySelector('#workspaceQr');if(qr)qr.href=qrUrl;
    const qrDownload=document.querySelector('#workspaceQrDownload');if(qrDownload){qrDownload.href=qrUrl;qrDownload.download=`qr-${r.slug}.png`}
    const qrImage=document.querySelector('#workspaceQrImage');if(qrImage){qrImage.src=`${qrUrl}?preview=1`;qrImage.alt=`QR-код ${r.name||r.slug}`}
    const cards=document.querySelector('#workspaceOverviewCards');if(cards)cards.innerHTML=`<div><span class="muted">Статус</span><strong>${published?'Опубликован ✓':'Скрыт'}</strong></div><div><span class="muted">Сайт</span><strong>/r/${r.slug}</strong></div><div><span class="muted">Следующий шаг</span><strong>${published?'Проверьте каталог и передайте ссылку / QR':'Опубликуйте сайт, когда он будет готов'}</strong></div>`;
  }
  document.querySelector('#workspaceCopySite')?.addEventListener('click',async()=>{const text=document.querySelector('#workspacePublicUrl')?.textContent;if(!text||text==='—')return;try{await navigator.clipboard.writeText(text);const btn=document.querySelector('#workspaceCopySite');if(btn){const old=btn.textContent;btn.textContent='Скопировано ✓';setTimeout(()=>btn.textContent=old,1600)}if(typeof statusEl!=='undefined')statusEl.textContent='Ссылка сайта скопирована.'}catch{prompt('Скопируйте ссылку:',text)}});
  function enterClientWorkspace(){
    document.body.classList.add('client-workspace-open');
    document.querySelector('#saasDashboardOverview')?.setAttribute('hidden','');
    document.querySelector('.demo-panel')?.setAttribute('hidden','');
    document.querySelector('#dashboardCreateClient')?.setAttribute('hidden','');
    document.querySelector('#clients')?.setAttribute('hidden','');
    editor.hidden=false;
    show('overview');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function leaveClientWorkspace(){
    document.body.classList.remove('client-workspace-open');
    editor.hidden=true;
    if(location.hash!=='#clients')location.hash='clients';
    else document.querySelector('#clients')?.removeAttribute('hidden');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  if(typeof openEditor==='function'){
    const workspaceOpenEditor=openEditor;
    openEditor=async function(id){const result=await workspaceOpenEditor(id);enterClientWorkspace();return result};
  }
  document.querySelectorAll('.admin-sidebar a').forEach(link=>link.addEventListener('click',()=>document.body.classList.remove('client-workspace-open')));
  const globalStatus=document.querySelector('#status');
  if(globalStatus){
    globalStatus.classList.add('admin-toast');
    new MutationObserver(()=>{const message=globalStatus.textContent.trim();globalStatus.classList.toggle('visible',Boolean(message));clearTimeout(globalStatus.hideTimer);if(message)globalStatus.hideTimer=setTimeout(()=>globalStatus.classList.remove('visible'),3600)}).observe(globalStatus,{childList:true,subtree:true,characterData:true});
  }
  const observer=new MutationObserver(sync);observer.observe(document.querySelector('#editorTitle'),{childList:true,subtree:true});
  sync();
})();
