(()=>{
  document.body.classList.add('admin-premium');
  const brand=document.querySelector('.admin-brand');
  if(brand&&!brand.querySelector('.admin-brand-copy')){
    const nodes=[...brand.childNodes],mark=brand.querySelector('.admin-brand-mark'),copy=document.createElement('span');copy.className='admin-brand-copy';copy.innerHTML='<strong>QR Menu</strong><small>Панель управления</small>';nodes.forEach(node=>{if(node!==mark)node.remove()});brand.append(copy);
  }
  const overview=document.querySelector('#saasDashboardOverview');
  overview?.querySelector('.saas-overview-head .muted')?.replaceChildren('ВАШ БИЗНЕС');
  const clientsHeading=document.querySelector('#clients .section-title-row h2');if(clientsHeading)clientsHeading.textContent='Клиенты и проекты';
  const navLabels={overview:['Обзор','Основные данные'],catalog:['Каталог','Категории и товары'],branding:['Оформление','Стиль и фотографии'],publish:['Публикация','QR и ссылка'],access:['Доступ','Кабинет клиента']};
  document.querySelectorAll('[data-workspace-tab]').forEach(button=>{const item=navLabels[button.dataset.workspaceTab];if(item)button.innerHTML=`<strong>${item[0]}</strong><small>${item[1]}</small>`});
  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.saas-client-card').forEach(card=>{if(card.querySelector('.premium-client-dot'))return;const title=card.querySelector('.saas-client-title');if(title)title.insertAdjacentHTML('afterbegin','<span class="premium-client-dot" aria-hidden="true"></span>')});
  });
  const clients=document.querySelector('#restaurants');if(clients)observer.observe(clients,{childList:true,subtree:true});
})();
