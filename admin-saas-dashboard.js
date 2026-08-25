(()=>{
  const workspace=document.querySelector('.admin-workspace');
  const demo=document.querySelector('.demo-panel');
  const clientsPanel=document.querySelector('#clients');
  const clientsList=document.querySelector('#restaurants');
  const createButton=document.querySelector('#toggleCreateClient');
  if(!workspace||!demo||!clientsPanel||!clientsList) return;

  const typeLabels={food:'Ресторан / кафе',products:'Магазин / товары',flowers:'Цветочный магазин',auto:'Автосалон',services:'Услуги',other:'Другое'};
  const inferType=r=>{
    if(r.business_type&&typeLabels[r.business_type])return r.business_type;
    const saved=localStorage.getItem(`qr-business-type:${r.slug}`);if(saved)return saved;
    const s=`${r.name||''} ${r.subtitle||''}`.toLowerCase();
    if(/кафе|бар|restaurant|cafe|lounge|кухн|еда|ресторан/.test(s))return'food';
    if(/цвет|букет|flower|flor/.test(s))return'flowers';
    if(/авто|car|motor|машин|автосалон/.test(s))return'auto';
    if(/услуг|service|сервис/.test(s))return'services';
    return'products';
  };
  const normName=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const baseSlug=v=>String(v||'').replace(/-\d+$/,'');

  const overview=document.createElement('section');
  overview.id='saasDashboardOverview';
  overview.className='panel saas-overview';
  overview.innerHTML=`<div class="saas-overview-head"><div><div class="muted">ПАНЕЛЬ УПРАВЛЕНИЯ</div><h1>QR-каталоги клиентов</h1><p class="muted">Создавайте клиентов, управляйте их каталогами и сразу открывайте готовый сайт или QR-код.</p></div><div class="saas-overview-actions"><button id="saasCreateClient" class="primary" type="button">+ Создать клиента</button></div></div><div class="saas-stats"><div class="saas-stat"><strong id="saasClientsCount">—</strong><span>Всего клиентов</span></div><div class="saas-stat"><strong id="saasCabinetCount">—</strong><span>С личным кабинетом</span></div><div class="saas-stat"><strong id="saasManagedCount">—</strong><span>Под ключ</span></div></div>`;
  workspace.insertBefore(overview,demo);

  overview.querySelector('#saasCreateClient').addEventListener('click',()=>{createButton?.click();setTimeout(()=>document.querySelector('#createClientWrap')?.scrollIntoView({behavior:'smooth',block:'start'}),50)});

  function renderClients(rows){
    let clients=rows.filter(r=>r.slug!=='demo'&&r.slug!=='shokantre-kafe'&&r.name!=='NurislamBar');
    const counts=new Map();clients.forEach(r=>counts.set(normName(r.name),(counts.get(normName(r.name))||0)+1));
    clients=[...clients].sort((a,b)=>{
      const same=normName(a.name)===normName(b.name);
      if(same){const ac=baseSlug(a.slug)===a.slug?0:1,bc=baseSlug(b.slug)===b.slug?0:1;if(ac!==bc)return ac-bc;return String(a.slug).localeCompare(String(b.slug),'ru')}
      return Number(a.id)-Number(b.id);
    });
    overview.querySelector('#saasClientsCount').textContent=clients.length;
    overview.querySelector('#saasCabinetCount').textContent=clients.filter(r=>r.client_enabled).length;
    overview.querySelector('#saasManagedCount').textContent=clients.filter(r=>!r.client_enabled).length;
    clientsList.innerHTML=clients.length?clients.map(r=>{
      const type=inferType(r),typeLabel=typeLabels[type]||typeLabels.other,published=r.active!==false,duplicate=(counts.get(normName(r.name))||0)>1,canonical=baseSlug(r.slug)===r.slug;
      return `<article class="saas-client-card${duplicate?' possible-duplicate':''}"><div class="saas-client-meta"><div class="saas-client-title"><strong>${escapeHtml(r.name)}</strong><span class="saas-type-pill">${escapeHtml(typeLabel)}</span><span class="saas-status-pill ${r.client_enabled?'cabinet':'managed'}">${r.client_enabled?'Личный кабинет':'Под ключ'}</span><span class="saas-status-pill ${published?'published':'hidden'}">${published?'Опубликован':'Скрыт'}</span>${duplicate?`<span class="saas-status-pill duplicate">${canonical?'Основной':'Возможный дубль'}</span>`:''}</div><div class="muted">${escapeHtml(r.subtitle||'Без подзаголовка')}</div><div class="saas-client-url">${location.origin}/r/${escapeHtml(r.slug)}</div>${r.client_enabled&&r.client_username?`<div class="muted">Логин клиента: ${escapeHtml(r.client_username)}</div>`:''}${duplicate&&!canonical?`<div class="saas-duplicate-note">Проверьте этот клиент. Похожее название уже существует — возможно, это тестовый дубль.</div>`:''}</div><div class="saas-client-actions"><button class="primary" type="button" data-edit="${r.id}">Управлять</button><a class="secondary" href="/r/${encodeURIComponent(r.slug)}" target="_blank">Открыть сайт</a><a class="secondary" href="/api/restaurants/${encodeURIComponent(r.slug)}/qr" target="_blank">QR-код</a></div></article>`;
    }).join(''):`<div class="saas-empty"><strong>Клиентов пока нет</strong><span>Создайте первого клиента — после этого здесь появятся управление, ссылка на сайт и QR-код.</span></div>`;
  }

  async function refresh(){
    try{const rows=await api('/api/admin/restaurants');renderClients(rows)}catch(err){clientsList.innerHTML=`<div class="muted">${escapeHtml(err.message)}</div>`}
  }

  const oldLoad=typeof loadRestaurants==='function'?loadRestaurants:null;
  if(oldLoad){window.loadRestaurants=async function(){await oldLoad();await refresh()}}
  refresh();

  const dashLink=[...document.querySelectorAll('.admin-sidebar a')].find(a=>a.textContent.trim()==='Панель управления');
  const clientsLink=[...document.querySelectorAll('.admin-sidebar a')].find(a=>a.textContent.trim()==='Мои клиенты');
  function route(){
    const isClients=location.hash==='#clients';
    overview.hidden=isClients;
    demo.hidden=isClients;
    clientsPanel.hidden=!isClients;
    document.querySelector('#dashboardCreateClient')?.toggleAttribute('hidden',isClients);
    dashLink?.classList.toggle('active',!isClients);clientsLink?.classList.toggle('active',isClients);
  }
  window.addEventListener('hashchange',route);route();
})();