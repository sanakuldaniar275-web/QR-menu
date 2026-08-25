(()=>{
  function selected(){return typeof selectedRestaurant!=='undefined'?selectedRestaurant:null}
  function ensure(){
    const target=document.querySelector('[data-workspace-panel="access"]');
    if(!target)return;
    let box=document.querySelector('#clientDangerZone');
    if(box){if(box.parentElement!==target)target.append(box);sync();return}
    box=document.createElement('div');box.id='clientDangerZone';box.className='client-danger-zone';box.innerHTML=`<div><strong>Опасные действия</strong><span class="muted">Скрытие временно отключает публичный сайт. Удаление полностью удаляет клиента, его каталог и личный кабинет.</span></div><div class="client-danger-actions"><button id="clientToggleActive" class="secondary" type="button">Скрыть сайт</button><button id="clientDelete" class="secondary danger" type="button">Удалить клиента</button></div>`;target.append(box);
    box.querySelector('#clientToggleActive').addEventListener('click',async()=>{
      const r=selected();if(!r||r.slug==='demo')return;
      const next=!r.active;
      if(!next&&!confirm(`Скрыть сайт «${r.name}»? QR и ссылка временно перестанут открывать каталог.`))return;
      try{await api(`/api/admin/restaurants/${r.id}`,{method:'PATCH',body:JSON.stringify({active:next})});if(typeof statusEl!=='undefined')statusEl.textContent=next?'Сайт снова опубликован.':'Сайт скрыт.';await loadRestaurants();await openEditor(r.id);sync()}catch(e){if(typeof statusEl!=='undefined')statusEl.textContent=e.message}
    });
    box.querySelector('#clientDelete').addEventListener('click',async()=>{
      const r=selected();if(!r||r.slug==='demo')return;
      const first=confirm(`Удалить клиента «${r.name}»? Будут удалены его категории, позиции и личный кабинет.`);if(!first)return;
      const typed=prompt(`Для подтверждения введите название клиента:\n${r.name}`);if(typed!==r.name)return alert('Удаление отменено: название не совпало.');
      try{await api(`/api/admin/restaurants/${r.id}`,{method:'DELETE'});localStorage.removeItem(`qr-business-type:${r.slug}`);if(typeof statusEl!=='undefined')statusEl.textContent='Клиент удалён.';document.querySelector('#editor').hidden=true;await loadRestaurants();location.hash='#clients'}catch(e){if(typeof statusEl!=='undefined')statusEl.textContent=e.message}
    });
    sync();
  }
  function sync(){
    const r=selected(),toggle=document.querySelector('#clientToggleActive'),del=document.querySelector('#clientDelete');if(!r||!toggle||!del)return;
    const demo=r.slug==='demo';toggle.disabled=demo;del.disabled=demo;toggle.textContent=r.active?'Скрыть сайт':'Опубликовать сайт';
  }
  document.addEventListener('DOMContentLoaded',ensure);const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(()=>{ensure();sync()},80)});obs.observe(document.documentElement,{subtree:true,childList:true});setTimeout(()=>{ensure();sync()},500);
})();