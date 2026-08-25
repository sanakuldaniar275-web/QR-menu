(()=>{
  const form=document.querySelector('#categoryForm');
  if(!form)return;

  const shell=document.createElement('div');
  shell.className='category-manager';
  shell.innerHTML='<div class="category-manager-head"><div><strong>Созданные категории</strong><span class="muted">Новая категория сразу появится здесь и в списке выбора товара.</span></div><span id="categoryManagerCount" class="category-count">0</span></div><div id="categoryManagerList" class="category-chip-list"><span class="muted">Категорий пока нет</span></div><div id="categoryManagerStatus" class="category-manager-status" role="status"></div>';
  form.insertAdjacentElement('afterend',shell);

  const list=shell.querySelector('#categoryManagerList');
  const count=shell.querySelector('#categoryManagerCount');
  const localStatus=shell.querySelector('#categoryManagerStatus');

  function currentId(){
    try{return typeof selectedRestaurantId!=='undefined'?selectedRestaurantId:null}catch{return null}
  }

  function render(categories=[]){
    count.textContent=String(categories.length);
    list.innerHTML=categories.length
      ? categories.map(c=>`<span class="category-chip">${escapeHtml(c.name)}</span>`).join('')
      : '<span class="muted">Категорий пока нет</span>';
    const select=document.querySelector('#dishCategory');
    if(select){
      const keep=select.value;
      select.innerHTML=categories.length?categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(''):'<option value="">Сначала добавьте категорию</option>';
      if(categories.some(c=>String(c.id)===String(keep)))select.value=keep;
    }
  }

  async function refresh(){
    const id=currentId();if(!id)return;
    try{
      const data=await api(`/api/admin/restaurants/${id}/menu`);
      render(data.categories||[]);
    }catch(err){localStatus.textContent=err.message||'Не удалось загрузить категории.'}
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    e.stopImmediatePropagation();
    const id=currentId();if(!id)return;
    const input=form.elements.name;
    const name=String(input?.value||'').trim();
    if(!name){localStatus.textContent='Введите название категории.';input?.focus();return;}
    const button=form.querySelector('button[type="submit"]');
    const old=button?.textContent;
    try{
      if(button){button.disabled=true;button.textContent='Добавляем…'}
      localStatus.textContent='Добавляем категорию…';
      await api(`/api/admin/restaurants/${id}/categories`,{method:'POST',body:JSON.stringify({name})});
      form.reset();
      await refresh();
      localStatus.textContent=`Категория «${name}» добавлена ✓`;
      if(typeof statusEl!=='undefined')statusEl.textContent=`Категория «${name}» добавлена.`;
    }catch(err){
      localStatus.textContent=err.message||'Не удалось добавить категорию.';
    }finally{
      if(button){button.disabled=false;button.textContent=old||'+ Добавить категорию'}
    }
  },true);

  const title=document.querySelector('#editorTitle');
  if(title)new MutationObserver(()=>setTimeout(refresh,30)).observe(title,{childList:true,subtree:true});
  document.querySelector('[data-workspace-tab="catalog"]')?.addEventListener('click',()=>setTimeout(refresh,30));
  setTimeout(refresh,500);
})();