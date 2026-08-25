(()=>{
  const form=document.querySelector('#brandingForm');
  if(!form)return;
  const submit=form.querySelector('button[type="submit"]');
  if(!submit)return;
  const colorInput=form.elements.accent_color;

  const inline=document.createElement('div');
  inline.className='branding-save-status muted';
  inline.setAttribute('aria-live','polite');
  submit.insertAdjacentElement('afterend',inline);

  if(colorInput&&!document.querySelector('#accentColorReadout')){
    const readout=document.createElement('div');
    readout.id='accentColorReadout';
    readout.className='accent-color-readout';
    readout.innerHTML='<span class="accent-color-swatch"></span><strong></strong>';
    colorInput.insertAdjacentElement('afterend',readout);
    const sync=()=>{
      const v=colorInput.value||'#f3d21b';
      readout.querySelector('.accent-color-swatch').style.background=v;
      readout.querySelector('strong').textContent=v.toUpperCase();
    };
    colorInput.addEventListener('input',sync);
    colorInput.addEventListener('change',sync);
    sync();
  }

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
      if(colorInput){
        const color=String(colorInput.value||'').trim();
        if(!/^#[0-9a-f]{6}$/i.test(color))throw new Error('Выберите корректный цвет');
        body.accent_color=color;
      }
      body.theme=form.elements.theme?.value||'light';

      if(logoPhoto?.files?.[0]){
        inline.textContent='Обрабатываем логотип…';
        body.logo_url=await compressImage(logoPhoto.files[0],700);
      }
      if(heroPhoto?.files?.[0]){
        inline.textContent='Обрабатываем обложку…';
        body.hero_image_url=await compressImage(heroPhoto.files[0],1600);
      }

      inline.textContent='Сохраняем цвет и оформление…';
      const saved=await api(`/api/admin/restaurants/${selectedRestaurantId}`,{method:'PATCH',body:JSON.stringify(body)});
      if(colorInput&&saved?.accent_color){
        colorInput.value=saved.accent_color;
        const readout=document.querySelector('#accentColorReadout');
        if(readout){
          readout.querySelector('.accent-color-swatch').style.background=saved.accent_color;
          readout.querySelector('strong').textContent=saved.accent_color.toUpperCase();
        }
      }
      if(typeof selectedRestaurant!=='undefined'&&selectedRestaurant&&saved)Object.assign(selectedRestaurant,saved);
      if(logoPhoto)logoPhoto.value='';
      if(heroPhoto)heroPhoto.value='';
      inline.textContent=`Оформление сохранено ✓${saved?.accent_color?` Цвет: ${saved.accent_color.toUpperCase()}`:''}`;
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