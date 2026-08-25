(()=>{
  const form=document.querySelector('#restaurantEditForm');
  if(!form||typeof api!=='function')return;
  if(form.dataset.profileSaveFix==='1')return;
  form.dataset.profileSaveFix='1';
  const submit=form.querySelector('button[type="submit"]');
  let note=document.querySelector('#profileSaveStatus');
  if(!note){note=document.createElement('div');note.id='profileSaveStatus';note.className='status muted';form.append(note)}
  const currentId=()=>typeof selectedRestaurantId!=='undefined'?selectedRestaurantId:window.selectedRestaurantId;
  form.addEventListener('submit',async e=>{
    e.preventDefault();e.stopImmediatePropagation();
    const id=currentId();
    if(!id){note.textContent='Сначала выберите клиента.';return}
    const body=Object.fromEntries(new FormData(form).entries());
    const old=submit?.textContent||'Сохранить данные';
    try{
      if(submit){submit.disabled=true;submit.textContent='Сохраняем…'}
      note.textContent='Сохраняем данные…';
      const saved=await api(`/api/admin/restaurants/${id}`,{method:'PATCH',body:JSON.stringify(body)});
      if(typeof selectedRestaurant!=='undefined')selectedRestaurant=saved;
      window.selectedRestaurant=saved;
      note.textContent='Данные сохранены ✓';
      if(typeof statusEl!=='undefined')statusEl.textContent='Данные сохранены.';
      if(typeof loadRestaurants==='function')await loadRestaurants();
      if(typeof openEditor==='function')await openEditor(id);
    }catch(err){note.textContent=err.message||'Не удалось сохранить данные.'}
    finally{if(submit){submit.disabled=false;submit.textContent=old}}
  },true);
})();