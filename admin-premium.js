(()=>{
  document.body.classList.add('admin-premium');
  const brand=document.querySelector('.admin-brand');
  if(brand&&!brand.querySelector('.admin-brand-copy')){const nodes=[...brand.childNodes],mark=brand.querySelector('.admin-brand-mark'),copy=document.createElement('span');copy.className='admin-brand-copy';copy.innerHTML='<strong>QR Menu</strong><small>Панель управления</small>';nodes.forEach(node=>{if(node!==mark)node.remove()});brand.append(copy)}

  const overview=document.querySelector('#saasDashboardOverview');overview?.querySelector('.saas-overview-head .muted')?.replaceChildren('ВАШ БИЗНЕС');
  const clientsHeading=document.querySelector('#clients .section-title-row h2');if(clientsHeading)clientsHeading.textContent='Клиенты и проекты';
  const navLabels={overview:['Обзор','Основные данные'],catalog:['Каталог','Категории и товары'],branding:['Дизайн','Стиль и фотографии'],publish:['Страницы','QR и ссылка'],access:['Доступ','Кабинет клиента']};
  document.querySelectorAll('[data-workspace-tab]').forEach(button=>{const item=navLabels[button.dataset.workspaceTab];if(item)button.innerHTML=`<strong>${item[0]}</strong><small>${item[1]}</small>`});

  const sidebar=document.querySelector('.admin-sidebar');
  const context=document.createElement('div');context.className='premium-context-nav';context.innerHTML=`<div class="side-label">КАТАЛОГ КЛИЕНТА</div><button type="button" data-premium-tab="catalog" data-premium-target="categories"><span>▦</span>Категории</button><button type="button" data-premium-tab="catalog" data-premium-target="items"><span>◉</span>Товары / блюда</button><div class="side-label">НАСТРОЙКИ</div><button type="button" data-premium-tab="overview"><span>⚙</span>Настройки заведения</button><button type="button" data-premium-tab="branding"><span>◈</span>Дизайн</button><button type="button" data-premium-tab="publish"><span>▤</span>Страницы и QR</button><button type="button" data-premium-tab="access"><span>♙</span>Пользователи</button><a id="premiumMenuPreview" class="premium-preview-link" target="_blank"><span>↗</span>Просмотр каталога</a>`;sidebar?.append(context);
  const contextControls=[...context.querySelectorAll('button,a')];
  function selected(){try{return typeof selectedRestaurant!=='undefined'?selectedRestaurant:null}catch{return null}}
  function syncContext(){const r=selected(),enabled=Boolean(r);context.classList.toggle('enabled',enabled);context.querySelectorAll('button').forEach(b=>b.disabled=!enabled);const preview=context.querySelector('#premiumMenuPreview');if(preview){preview.href=enabled?`/r/${encodeURIComponent(r.slug)}`:'#';preview.setAttribute('aria-disabled',String(!enabled))}}
  function openTab(name,target){const r=selected();if(!r){document.querySelector('#status').textContent='Сначала выберите клиента.';location.hash='clients';return}document.querySelector(`[data-workspace-tab="${name}"]`)?.click();contextControls.forEach(x=>x.classList.toggle('active',x.dataset.premiumTab===name));setTimeout(()=>{if(target==='categories')document.querySelector('#categoryForm')?.scrollIntoView({behavior:'smooth',block:'center'});if(target==='items')document.querySelector('.dish-manager-tools')?.scrollIntoView({behavior:'smooth',block:'start'})},60)}
  context.addEventListener('click',event=>{const button=event.target.closest('[data-premium-tab]');if(!button)return;openTab(button.dataset.premiumTab,button.dataset.premiumTarget)});

  if(typeof openEditor==='function'){const premiumOpenEditor=openEditor;openEditor=async function(id){const result=await premiumOpenEditor(id);syncContext();decorateCatalog();return result}}
  document.querySelectorAll('.admin-sidebar>a[href="#dashboard"],.admin-sidebar>a[href="#clients"]').forEach(link=>link.addEventListener('click',()=>{contextControls.forEach(x=>x.classList.remove('active'))}));

  function itemTerm(){return document.body.dataset.businessType==='food'?'блюдо':'товар'}
  function decorateCatalog(){
    const tools=document.querySelector('.dish-manager-tools'),editor=document.querySelector('#menuEditor'),form=document.querySelector('#dishForm');if(!tools||!editor||!form)return;
    let head=document.querySelector('#premiumCatalogActions');if(!head){head=document.createElement('div');head.id='premiumCatalogActions';head.className='premium-catalog-actions';tools.parentNode.insertBefore(head,tools)}
    const count=Array.isArray(currentDishes)?currentDishes.length:0,term=itemTerm();head.innerHTML=`<div><span class="muted">КАТАЛОГ</span><h3>${term==='блюдо'?'Блюда':'Товары'}</h3><strong>${count} ${term==='блюдо'?'блюд':'товаров'}</strong></div><div><button class="secondary" type="button" data-export-catalog>Экспорт CSV</button><button class="primary" type="button" data-add-catalog>+ Добавить ${term}</button></div>`;
    if(!document.querySelector('.premium-table-head'))editor.insertAdjacentHTML('beforebegin','<div class="premium-table-head"><span>Фото</span><span>Название / категория</span><span>Цена</span><span>Статус</span><span>Действия</span></div>');
    head.querySelector('[data-add-catalog]').addEventListener('click',()=>form.scrollIntoView({behavior:'smooth',block:'start'}));
    head.querySelector('[data-export-catalog]').addEventListener('click',exportCatalog);
  }
  function csvCell(value){return`"${String(value??'').replace(/"/g,'""')}"`}
  function exportCatalog(){if(!Array.isArray(currentDishes)||!currentDishes.length){statusEl.textContent='В каталоге пока нет позиций для экспорта.';return}const category=id=>document.querySelector(`#dishCategory option[value="${id}"]`)?.textContent||'Без категории',rows=[['Название','Категория','Цена','Статус','Описание'],...currentDishes.map(x=>[x.name,category(x.category_id),x.price,x.active?'Активно':'Скрыто',x.description||''])],blob=new Blob(['\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\n')],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`catalog-${selected()?.slug||'client'}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);statusEl.textContent='Каталог экспортирован в CSV.'}

  const observer=new MutationObserver(()=>{document.querySelectorAll('.saas-client-card').forEach(card=>{if(card.querySelector('.premium-client-dot'))return;const title=card.querySelector('.saas-client-title');if(title)title.insertAdjacentHTML('afterbegin','<span class="premium-client-dot" aria-hidden="true"></span>')})});
  const clients=document.querySelector('#restaurants');if(clients)observer.observe(clients,{childList:true,subtree:true});
  syncContext();decorateCatalog();
})();
