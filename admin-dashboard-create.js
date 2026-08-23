(()=>{
  const demo=document.querySelector('.demo-panel');
  const clients=document.querySelector('#clients');
  const editor=document.querySelector('#editor');
  const toggle=document.querySelector('#toggleCreateClient');
  const wrap=document.querySelector('#createClientWrap');
  const status=document.querySelector('#status');
  if(!demo||!clients||!toggle||!wrap) return;

  const panel=document.createElement('section');
  panel.id='dashboardCreateClient';
  panel.className='panel';
  panel.innerHTML=`<div class="section-title-row"><div><div class="muted">НОВЫЙ КЛИЕНТ</div><h2>Создать QR-меню</h2><p class="muted">Добавьте новое заведение. После создания сможете настроить меню, QR-код и личный кабинет клиента.</p></div><div id="dashboardCreateAction"></div></div><div id="dashboardCreateForm"></div><div id="dashboardCreateStatus" class="status muted"></div>`;
  demo.insertAdjacentElement('afterend',panel);

  panel.querySelector('#dashboardCreateAction').appendChild(toggle);
  panel.querySelector('#dashboardCreateForm').appendChild(wrap);
  const mirror=panel.querySelector('#dashboardCreateStatus');

  if(status){
    const syncStatus=()=>{mirror.textContent=status.textContent||''};
    new MutationObserver(syncStatus).observe(status,{childList:true,subtree:true,characterData:true});
    syncStatus();
  }

  function route(){
    const dashboard=location.hash!=='#clients';
    panel.hidden=!dashboard;
    if(!dashboard) wrap.hidden=true;
  }
  window.addEventListener('hashchange',route);
  route();
})();