(()=>{
 let logoObjectUrl='',heroObjectUrl='';
 function revoke(kind){const v=kind==='logo'?logoObjectUrl:heroObjectUrl;if(v)URL.revokeObjectURL(v);if(kind==='logo')logoObjectUrl='';else heroObjectUrl=''}
 function mediaCard(kind,label,inputId,hiddenName){
   const wrap=document.createElement('div');wrap.className='branding-media-card';wrap.dataset.brandingMedia=kind;
   wrap.innerHTML=`<div class="branding-media-preview"><span>${label} ещё не загружен</span></div><div class="branding-media-copy"><strong>${label}</strong><span class="muted">Загрузите изображение с компьютера. Новое изображение заменит текущее после сохранения.</span><div class="branding-media-actions"><label class="secondary branding-upload-label" for="${inputId}">Выбрать файл</label><button type="button" class="secondary danger branding-remove">Удалить</button></div><div class="muted branding-file-name">Файл не выбран</div></div>`;
   const input=document.querySelector('#'+inputId),hidden=document.querySelector(`#brandingForm [name="${hiddenName}"]`),preview=wrap.querySelector('.branding-media-preview'),fileName=wrap.querySelector('.branding-file-name'),remove=wrap.querySelector('.branding-remove');
   const render=url=>{preview.innerHTML=url?`<img src="${String(url).replace(/"/g,'&quot;')}" alt="${label}">`:`<span>${label} ещё не загружен</span>`;remove.hidden=!url&&!input?.files?.length};
   if(input){input.closest('label')?.classList.add('branding-original-file');input.addEventListener('change',()=>{const f=input.files?.[0];revoke(kind);if(f){const u=URL.createObjectURL(f);if(kind==='logo')logoObjectUrl=u;else heroObjectUrl=u;render(u);fileName.textContent=f.name}else{render(hidden?.value||'');fileName.textContent='Файл не выбран'}})}
   remove.addEventListener('click',()=>{revoke(kind);if(input)input.value='';if(hidden)hidden.value='';fileName.textContent='Изображение будет удалено после сохранения';render('')});
   wrap.sync=()=>{if((kind==='logo'&&logoObjectUrl)||(kind==='hero'&&heroObjectUrl))return;render(hidden?.value||'');fileName.textContent='Файл не выбран'};
   return wrap;
 }
 function enhance(){
  const branding=document.querySelector('[data-workspace-panel="branding"]');
  if(branding&&!branding.querySelector('.workspace-help-card')){
   const h=document.createElement('div');h.className='workspace-help-card';h.innerHTML='<strong>Оформление сайта</strong><span>Настройте логотип, обложку, цвет и стиль. После сохранения откройте сайт и проверьте результат.</span>';
   branding.prepend(h);
  }
  const brandForm=document.querySelector('#brandingForm');
  if(brandForm&&!brandForm.querySelector('.branding-media-grid')){
   const grid=document.createElement('div');grid.className='branding-media-grid';
   grid.append(mediaCard('logo','Логотип','logoPhoto','logo_url'),mediaCard('hero','Обложка','heroPhoto','hero_image_url'));
   const firstOriginal=[...brandForm.querySelectorAll('.branding-original-file')][0];
   if(firstOriginal)brandForm.insertBefore(grid,firstOriginal);else brandForm.prepend(grid);
   const originals=[...brandForm.querySelectorAll('.branding-original-file')];originals.forEach(x=>x.hidden=true);
  }
  if(brandForm&&!brandForm.querySelector('.workspace-preview-action')){
   const a=document.createElement('a');a.className='secondary workspace-preview-action';a.target='_blank';a.textContent='Посмотреть сайт';a.addEventListener('click',()=>{const r=typeof selectedRestaurant!=='undefined'?selectedRestaurant:null;if(r)a.href=`/r/${encodeURIComponent(r.slug)}`});brandForm.append(a);
  }
  brandForm?.querySelectorAll('.branding-media-card').forEach(card=>card.sync?.());
  const access=document.querySelector('[data-workspace-panel="access"]');
  if(access&&!access.querySelector('.workspace-help-card')){
   const h=document.createElement('div');h.className='workspace-help-card';h.innerHTML='<strong>Доступ клиента</strong><span><b>Под ключ</b> — управляете только вы. <b>Личный кабинет</b> — клиент получает собственный логин и пароль.</span>';
   access.prepend(h);
  }
  const form=document.querySelector('#clientAccessForm');if(form&&!form.dataset.workspaceBound){
   form.dataset.workspaceBound='1';
   const cabinet=form.querySelector('input[value="cabinet"]'),managed=form.querySelector('input[value="managed"]'),creds=document.querySelector('#clientCredentials');
   const sync=()=>{if(creds)creds.hidden=!cabinet?.checked};cabinet?.addEventListener('change',sync);managed?.addEventListener('change',sync);sync();
  }
 }
 document.addEventListener('DOMContentLoaded',enhance);const o=new MutationObserver(()=>{clearTimeout(o.t);o.t=setTimeout(enhance,100)});o.observe(document.documentElement,{subtree:true,childList:true});setTimeout(enhance,500);setTimeout(enhance,1200);
})();