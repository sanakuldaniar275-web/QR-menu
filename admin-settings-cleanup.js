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
 async function copy(text,btn){if(!text)return;try{await navigator.clipboard.writeText(text);if(btn){const old=btn.textContent;btn.textContent='Скопировано ✓';setTimeout(()=>btn.textContent=old,1500)}}catch{prompt('Скопируйте:',text)}}
 function syncAccessSummary(){
   const form=document.querySelector('#clientAccessForm'),summary=document.querySelector('#accessHandoff');if(!form||!summary)return;
   const cabinet=form.elements.access_mode?.value==='cabinet',username=form.elements.username?.value?.trim()||'',url=`${location.origin}/client`;
   summary.hidden=!cabinet;
   summary.querySelector('[data-access-url]').textContent=url;
   summary.querySelector('[data-access-login]').textContent=username||'Логин ещё не задан';
   summary.querySelector('[data-copy-login]').disabled=!username;
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
   [...brandForm.querySelectorAll('.branding-original-file')].forEach(x=>x.hidden=true);
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
  const form=document.querySelector('#clientAccessForm');
  if(form&&!form.dataset.workspaceBound){
   form.dataset.workspaceBound='1';
   const cabinet=form.querySelector('input[value="cabinet"]'),managed=form.querySelector('input[value="managed"]'),creds=document.querySelector('#clientCredentials');
   const sync=()=>{if(creds)creds.hidden=!cabinet?.checked;syncAccessSummary()};
   cabinet?.addEventListener('change',sync);managed?.addEventListener('change',sync);form.elements.username?.addEventListener('input',sync);sync();
  }
  if(access&&!document.querySelector('#accessHandoff')){
   const card=document.createElement('div');card.id='accessHandoff';card.className='access-handoff';card.hidden=true;card.innerHTML=`<div><span class="muted">ДАННЫЕ ДЛЯ ПЕРЕДАЧИ КЛИЕНТУ</span><strong>Личный кабинет</strong></div><div class="access-handoff-row"><span class="muted">Ссылка для входа</span><code data-access-url></code><button class="secondary" type="button" data-copy-url>Копировать</button></div><div class="access-handoff-row"><span class="muted">Логин</span><code data-access-login></code><button class="secondary" type="button" data-copy-login>Копировать</button></div><div class="access-handoff-note muted">Пароль после сохранения не показывается. Если клиент его забудет, задайте новый пароль выше.</div><a class="secondary workspace-preview-action" href="/client" target="_blank">Открыть кабинет клиента</a>`;
   const danger=document.querySelector('#clientDangerZone');access.insertBefore(card,danger||null);
   card.querySelector('[data-copy-url]').addEventListener('click',e=>copy(card.querySelector('[data-access-url]').textContent,e.currentTarget));
   card.querySelector('[data-copy-login]').addEventListener('click',e=>copy(card.querySelector('[data-access-login]').textContent,e.currentTarget));
  }
  syncAccessSummary();
 }
 document.addEventListener('DOMContentLoaded',enhance);const o=new MutationObserver(()=>{clearTimeout(o.t);o.t=setTimeout(enhance,100)});o.observe(document.documentElement,{subtree:true,childList:true});setTimeout(enhance,500);setTimeout(enhance,1200);
})();