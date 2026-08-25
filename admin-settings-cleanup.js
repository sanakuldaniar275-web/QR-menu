(()=>{
 function enhance(){
  const branding=document.querySelector('[data-workspace-panel="branding"]');
  if(branding&&!branding.querySelector('.workspace-help-card')){
   const h=document.createElement('div');h.className='workspace-help-card';h.innerHTML='<strong>Оформление сайта</strong><span>Здесь меняются логотип, обложка, цвет и стиль. После сохранения откройте сайт и проверьте результат.</span>';
   branding.prepend(h);
  }
  const access=document.querySelector('[data-workspace-panel="access"]');
  if(access&&!access.querySelector('.workspace-help-card')){
   const h=document.createElement('div');h.className='workspace-help-card';h.innerHTML='<strong>Доступ клиента</strong><span><b>Под ключ</b> — управляете только вы. <b>Личный кабинет</b> — клиент получает собственный логин и пароль.</span>';
   access.prepend(h);
  }
  const form=document.querySelector('#clientAccessForm');if(form){
   const cabinet=form.querySelector('input[value="cabinet"]'),managed=form.querySelector('input[value="managed"]'),creds=document.querySelector('#clientCredentials');
   const sync=()=>{if(creds)creds.hidden=!cabinet?.checked};cabinet?.addEventListener('change',sync);managed?.addEventListener('change',sync);sync();
  }
  const brandForm=document.querySelector('#brandingForm');if(brandForm&&!brandForm.querySelector('.workspace-preview-action')){
   const a=document.createElement('a');a.className='secondary workspace-preview-action';a.target='_blank';a.textContent='Посмотреть сайт';a.addEventListener('click',()=>{const r=typeof selectedRestaurant!=='undefined'?selectedRestaurant:null;if(r)a.href=`/r/${encodeURIComponent(r.slug)}`});brandForm.append(a);
  }
 }
 document.addEventListener('DOMContentLoaded',enhance);const o=new MutationObserver(()=>{clearTimeout(o.t);o.t=setTimeout(enhance,100)});o.observe(document.documentElement,{subtree:true,childList:true});setTimeout(enhance,500);
})();