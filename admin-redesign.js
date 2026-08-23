(()=>{
  const editor=document.querySelector('#editor');
  const menuEditor=document.querySelector('#menuEditor');
  const dishForm=document.querySelector('#dishForm');
  if(!editor||!menuEditor||!dishForm) return;

  const tools=document.createElement('div');
  tools.className='dish-manager-tools';
  tools.innerHTML=`<div class="dish-manager-head"><div><strong>Список блюд</strong><span id="dishCountLabel" class="muted"></span></div><div class="dish-manager-filters"><input id="dishAdminSearch" type="search" placeholder="Поиск блюда…"><select id="dishAdminCategory"><option value="">Все категории</option></select></div></div>`;
  menuEditor.parentNode.insertBefore(tools,menuEditor);
  const search=tools.querySelector('#dishAdminSearch');
  const categoryFilter=tools.querySelector('#dishAdminCategory');
  const countLabel=tools.querySelector('#dishCountLabel');

  const photoLabel=[...dishForm.querySelectorAll('label')].find(l=>l.querySelector('#dishPhoto'));
  const photoPanel=document.createElement('div');
  photoPanel.className='dish-photo-admin-panel';
  photoPanel.innerHTML=`<div class="dish-photo-current"><span class="muted">Текущее фото</span><div id="dishCurrentPhoto" class="dish-current-photo"><span>Нет фото</span></div></div><div class="dish-photo-help"><strong>Фотография блюда</strong><span>Загрузите новое фото, чтобы заменить текущее. Для удаления используйте кнопку ниже.</span></div>`;
  if(photoLabel) photoLabel.parentNode.insertBefore(photoPanel,photoLabel);
  const currentPhoto=photoPanel.querySelector('#dishCurrentPhoto');

  const accessBox=document.querySelector('#access')?.nextElementSibling;
  const credentialCard=document.createElement('div');
  credentialCard.className='credential-card';
  credentialCard.innerHTML=`<div class="credential-head"><div><span class="muted">ДАННЫЕ ДЛЯ ПЕРЕДАЧИ КЛИЕНТУ</span><strong>Личный кабинет</strong></div><span id="credentialState" class="credential-state">Не настроен</span></div><div class="credential-grid"><label><span>Ссылка для входа</span><div class="credential-value"><code id="credentialUrl"></code><button type="button" class="secondary" data-copy="url">Копировать</button></div></label><label><span>Логин</span><div class="credential-value"><code id="credentialLogin">—</code><button type="button" class="secondary" data-copy="login">Копировать</button></div></label><label><span>Пароль</span><div class="credential-value"><code id="credentialPassword">Задайте новый пароль</code><button id="generateClientPassword" type="button" class="secondary">Сгенерировать</button></div></label></div><p class="muted credential-note">Текущий пароль нельзя посмотреть после сохранения. Если клиент его потеряет, задайте новый пароль здесь.</p><div class="credential-actions"><button id="copyClientAccess" class="primary" type="button">Скопировать всё для клиента</button><a class="secondary" href="/client" target="_blank">Открыть кабинет клиента</a></div>`;
  if(accessBox) accessBox.appendChild(credentialCard);
  const credUrl=credentialCard.querySelector('#credentialUrl'),credLogin=credentialCard.querySelector('#credentialLogin'),credPassword=credentialCard.querySelector('#credentialPassword'),credState=credentialCard.querySelector('#credentialState');
  credUrl.textContent=`${location.origin}/client`;

  function categoryName(id){const opt=[...document.querySelector('#dishCategory').options].find(o=>String(o.value)===String(id));return opt?.textContent||'Без категории'}
  function imageMarkup(d){if(d.image_url)return `<img src="${String(d.image_url).replace(/"/g,'&quot;')}" alt="${String(d.name||'').replace(/"/g,'&quot;')}">`;return `<div class="dish-admin-placeholder">🍽️</div>`}
  function renderEnhanced(){if(typeof currentDishes==='undefined')return;const q=search.value.trim().toLowerCase(),cat=categoryFilter.value;const list=currentDishes.filter(d=>{const name=String(d.name||'').toLowerCase(),cname=categoryName(d.category_id);return(!q||name.includes(q)||cname.toLowerCase().includes(q))&&(!cat||String(d.category_id)===cat)});countLabel.textContent=`${list.length} из ${currentDishes.length}`;menuEditor.innerHTML=list.length?list.map(d=>`<div class="dish-admin-row"><div class="dish-admin-photo">${imageMarkup(d)}</div><div class="dish-admin-main"><strong>${escapeHtml(d.name)}</strong><span>${escapeHtml(categoryName(d.category_id))}</span></div><div class="dish-admin-price">${Number(d.price||0).toLocaleString('ru-RU')} ₸</div><div class="dish-admin-photo-state ${d.image_url?'has':'none'}">${d.image_url?'✓ есть':'нет'}</div><div class="restaurant-actions"><button class="secondary" type="button" data-edit-dish="${d.id}">Изменить</button><button class="secondary" type="button" data-toggle-dish="${d.id}" data-active="${d.active}">${d.active?'Скрыть':'Показать'}</button><button class="secondary danger" type="button" data-delete-dish="${d.id}">Удалить</button></div></div>`).join(''):'<div class="empty-clients"><strong>Ничего не найдено</strong><span>Измените поиск или категорию.</span></div>'}
  function syncCategories(){const select=document.querySelector('#dishCategory'),old=categoryFilter.value;categoryFilter.innerHTML='<option value="">Все категории</option>'+[...select.options].filter(o=>o.value).map(o=>`<option value="${o.value}">${escapeHtml(o.textContent)}</option>`).join('');if([...categoryFilter.options].some(o=>o.value===old))categoryFilter.value=old}
  function showPhotoForDish(id){const d=typeof currentDishes!=='undefined'?currentDishes.find(x=>String(x.id)===String(id)):null;if(d?.image_url)currentPhoto.innerHTML=`<img src="${String(d.image_url).replace(/"/g,'&quot;')}" alt="${String(d.name||'Фото блюда').replace(/"/g,'&quot;')}">`;else currentPhoto.innerHTML='<span>Нет фото — в меню будет заглушка</span>'}
  function resetPhoto(){currentPhoto.innerHTML='<span>Новое блюдо — фото ещё не загружено</span>'}
  function syncCredentials(data){const a=data?.clientAccess||{},enabled=Boolean(a.enabled);credLogin.textContent=a.username||'—';credState.textContent=enabled?'Активен':'Не настроен';credState.classList.toggle('active',enabled);if(!clientAccessForm.elements.password.value)credPassword.textContent=enabled?'Скрыт — при необходимости задайте новый':'Задайте новый пароль'}
  function randomPassword(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';const bytes=new Uint32Array(14);crypto.getRandomValues(bytes);return [...bytes].map(n=>chars[n%chars.length]).join('')}
  async function copyText(text){try{await navigator.clipboard.writeText(text);statusEl.textContent='Скопировано.'}catch{prompt('Скопируйте:',text)}}

  const originalOpenEditor=openEditor;
  openEditor=async function(id){const result=await originalOpenEditor(id);syncCategories();renderEnhanced();try{const fresh=await api(`/api/admin/restaurants/${id}/menu`);syncCredentials(fresh)}catch{}return result};
  const originalBeginDishEdit=beginDishEdit;beginDishEdit=function(id){originalBeginDishEdit(id);showPhotoForDish(id)};
  const originalResetDishEdit=resetDishEdit;resetDishEdit=function(){originalResetDishEdit();resetPhoto()};

  search.addEventListener('input',renderEnhanced);categoryFilter.addEventListener('change',renderEnhanced);
  document.querySelector('#dishPhoto')?.addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;currentPhoto.innerHTML=`<img src="${URL.createObjectURL(file)}" alt="Новое фото">`});
  document.querySelector('#removeDishPhoto')?.addEventListener('change',e=>{if(e.target.checked)currentPhoto.innerHTML='<span>Фото будет удалено после сохранения</span>';else if(editingDishId)showPhotoForDish(editingDishId)});
  credentialCard.querySelector('#generateClientPassword').addEventListener('click',()=>{const p=randomPassword();clientAccessForm.elements.password.value=p;credPassword.textContent=p;clientAccessForm.elements.access_mode.value='cabinet';syncTariffUi()});
  credentialCard.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(!b)return;if(b.dataset.copy==='url')copyText(credUrl.textContent);if(b.dataset.copy==='login')copyText(credLogin.textContent)});
  credentialCard.querySelector('#copyClientAccess').addEventListener('click',()=>{const login=clientAccessForm.elements.username.value.trim()||credLogin.textContent,password=clientAccessForm.elements.password.value||credPassword.textContent;if(!login||login==='—')return statusEl.textContent='Сначала задайте логин клиента.';if(!password||password.startsWith('Скрыт')||password.startsWith('Задайте'))return statusEl.textContent='Чтобы передать пароль клиенту, задайте или сгенерируйте новый.';copyText(`QR Menu — ${selectedRestaurant?.name||'заведение'}\nВход: ${credUrl.textContent}\nЛогин: ${login}\nПароль: ${password}\nМеню: ${location.origin}/r/${selectedRestaurant?.slug||''}`)});
  clientAccessForm.elements.username.addEventListener('input',()=>credLogin.textContent=clientAccessForm.elements.username.value.trim()||'—');
  resetPhoto();
  const onboardingScript=document.createElement('script');onboardingScript.src='/admin-onboarding.js?v=1';document.body.appendChild(onboardingScript);
})();

(()=>{
  const demo=document.querySelector('.demo-panel');
  const clients=document.querySelector('#clients');
  const editor=document.querySelector('#editor');
  const sidebar=[...document.querySelectorAll('.admin-sidebar a')];
  const dashboardLink=sidebar.find(a=>a.textContent.trim()==='Панель управления');
  const clientsLink=sidebar.find(a=>a.textContent.trim()==='Мои клиенты');
  if(!demo||!clients||!dashboardLink||!clientsLink) return;

  dashboardLink.setAttribute('href','#dashboard');
  clientsLink.setAttribute('href','#clients');

  function show(view){
    const clientsView=view==='clients';
    demo.hidden=clientsView;
    clients.hidden=!clientsView;
    if(editor) editor.hidden=true;
    dashboardLink.classList.toggle('active',!clientsView);
    clientsLink.classList.toggle('active',clientsView);
  }
  function route(){show(location.hash==='#clients'?'clients':'dashboard')}
  window.addEventListener('hashchange',route);
  route();
})();