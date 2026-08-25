(()=>{
  const form=document.querySelector('#brandingForm');
  if(!form)return;
  const submit=form.querySelector('button[type="submit"]');
  if(!submit)return;

  const inline=document.createElement('div');
  inline.className='branding-save-status muted';
  inline.setAttribute('aria-live','polite');
  submit.insertAdjacentElement('afterend',inline);

  // Use one explicit save path instead of relying on the older generic submit handler.
  submit.type='button';
  let saving=false;

  async function save(){
    if(saving||!selectedRestaurantId)return;
    saving=true;
    const old=submit.textContent;
    submit.disabled=true;
    submit.textContent='Сохраняем…';
    inline.textContent='Подготавливаем оформление…';
    try{
      const body=Object.fromEntries(new FormData(form).entries());
      if(logoPhoto?.files?.[0]){
        inline.textContent='Обрабатываем логотип…';
        body.logo_url=await compressImage(logoPhoto.files[0],700);
      }
      if(heroPhoto?.files?.[0]){
        inline.textContent='Обрабатываем обложку…';
        body.hero_image_url=await compressImage(heroPhoto.files[0],1600);
      }
      await api(`/api/admin/restaurants/${selectedRestaurantId}`,{method:'PATCH',body:JSON.stringify(body)});
      if(logoPhoto)logoPhoto.value='';
      if(heroPhoto)heroPhoto.value='';
      inline.textContent='Оформление сохранено ✓';
      if(typeof statusEl!=='undefined')statusEl.textContent='Оформление сохранено.';
      await openEditor(selectedRestaurantId);
      submit.textContent='Сохранено ✓';
      setTimeout(()=>{if(!saving)submit.textContent=old},1200);
    }catch(err){
      inline.textContent=`Ошибка: ${err.message}`;
      if(typeof statusEl!=='undefined')statusEl.textContent=err.message;
    }finally{
      saving=false;
      submit.disabled=false;
      if(submit.textContent==='Сохраняем…')submit.textContent=old;
    }
  }

  submit.addEventListener('click',save);
})();