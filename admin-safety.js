(()=>{
  const form=document.querySelector('#restaurantForm');
  if(!form)return;
  const normalize=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  const slugifyLocal=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9а-яёқғңүұөһі]+/gi,'-').replace(/^-+|-+$/g,'');
  let bypass=false;
  form.addEventListener('submit',async e=>{
    if(bypass)return;
    e.preventDefault();e.stopImmediatePropagation();
    const data=Object.fromEntries(new FormData(form).entries()),name=normalize(data.name),slug=String(data.slug||'').trim();
    try{
      const rows=await api('/api/admin/restaurants');
      const sameName=rows.filter(r=>r.slug!=='demo'&&normalize(r.name)===name);
      const sameSlug=slug?rows.find(r=>r.slug===slug):null;
      if(sameSlug){
        statusEl.textContent=`Клиент с такой ссылкой уже существует: /r/${sameSlug.slug}. Откройте его в «Мои клиенты» или укажите другую ссылку.`;
        document.querySelector('#clients')?.scrollIntoView({behavior:'smooth',block:'start'});return;
      }
      if(sameName.length){
        const existing=sameName.map(r=>`/r/${r.slug}`).join(', ');
        if(!confirm(`Клиент «${data.name}» уже существует (${existing}).\n\nСоздать ещё одного клиента с таким же названием?`)){statusEl.textContent='Создание отменено — существующий клиент сохранён без изменений.';return}
      }
      bypass=true;
      form.requestSubmit();
      setTimeout(()=>{bypass=false},0);
    }catch(err){
      statusEl.textContent=err.message||'Не удалось проверить дубли.';
    }
  },true);
})();