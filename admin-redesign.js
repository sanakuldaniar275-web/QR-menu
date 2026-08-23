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

  function categoryName(id){
    const opt=[...document.querySelector('#dishCategory').options].find(o=>String(o.value)===String(id));
    return opt?.textContent||'Без категории';
  }
  function imageMarkup(d){
    if(d.image_url) return `<img src="${String(d.image_url).replace(/"/g,'&quot;')}" alt="${String(d.name||'').replace(/"/g,'&quot;')}">`;
    return `<div class="dish-admin-placeholder">🍽️</div>`;
  }
  function renderEnhanced(){
    if(typeof currentDishes==='undefined') return;
    const q=search.value.trim().toLowerCase();
    const cat=categoryFilter.value;
    const list=currentDishes.filter(d=>{
      const name=String(d.name||'').toLowerCase();
      const cname=categoryName(d.category_id);
      return (!q||name.includes(q)||cname.toLowerCase().includes(q))&&(!cat||String(d.category_id)===cat);
    });
    countLabel.textContent=`${list.length} из ${currentDishes.length}`;
    menuEditor.innerHTML=list.length?list.map(d=>`<div class="dish-admin-row"><div class="dish-admin-photo">${imageMarkup(d)}</div><div class="dish-admin-main"><strong>${escapeHtml(d.name)}</strong><span>${escapeHtml(categoryName(d.category_id))}</span></div><div class="dish-admin-price">${Number(d.price||0).toLocaleString('ru-RU')} ₸</div><div class="dish-admin-photo-state ${d.image_url?'has':'none'}">${d.image_url?'✓ есть':'нет'}</div><div class="restaurant-actions"><button class="secondary" type="button" data-edit-dish="${d.id}">Изменить</button><button class="secondary" type="button" data-toggle-dish="${d.id}" data-active="${d.active}">${d.active?'Скрыть':'Показать'}</button><button class="secondary danger" type="button" data-delete-dish="${d.id}">Удалить</button></div></div>`).join(''):'<div class="empty-clients"><strong>Ничего не найдено</strong><span>Измените поиск или категорию.</span></div>';
  }
  function syncCategories(){
    const select=document.querySelector('#dishCategory');
    const old=categoryFilter.value;
    categoryFilter.innerHTML='<option value="">Все категории</option>'+[...select.options].filter(o=>o.value).map(o=>`<option value="${o.value}">${escapeHtml(o.textContent)}</option>`).join('');
    if([...categoryFilter.options].some(o=>o.value===old)) categoryFilter.value=old;
  }
  function showPhotoForDish(id){
    const d=typeof currentDishes!=='undefined'?currentDishes.find(x=>String(x.id)===String(id)):null;
    if(d?.image_url){currentPhoto.innerHTML=`<img src="${String(d.image_url).replace(/"/g,'&quot;')}" alt="${String(d.name||'Фото блюда').replace(/"/g,'&quot;')}">`}
    else currentPhoto.innerHTML='<span>Нет фото — в меню будет заглушка</span>';
  }
  function resetPhoto(){currentPhoto.innerHTML='<span>Новое блюдо — фото ещё не загружено</span>'}

  const originalOpenEditor=openEditor;
  openEditor=async function(id){const result=await originalOpenEditor(id);syncCategories();renderEnhanced();return result};
  const originalBeginDishEdit=beginDishEdit;
  beginDishEdit=function(id){originalBeginDishEdit(id);showPhotoForDish(id)};
  const originalResetDishEdit=resetDishEdit;
  resetDishEdit=function(){originalResetDishEdit();resetPhoto()};

  search.addEventListener('input',renderEnhanced);
  categoryFilter.addEventListener('change',renderEnhanced);
  document.querySelector('#dishPhoto')?.addEventListener('change',e=>{
    const file=e.target.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file);currentPhoto.innerHTML=`<img src="${url}" alt="Новое фото">`;
  });
  document.querySelector('#removeDishPhoto')?.addEventListener('change',e=>{
    if(e.target.checked) currentPhoto.innerHTML='<span>Фото будет удалено после сохранения</span>';
    else if(editingDishId) showPhotoForDish(editingDishId);
  });
  resetPhoto();
})();