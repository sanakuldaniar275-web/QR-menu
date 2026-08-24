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
  panel.innerHTML=`<div class="section-title-row"><div><div class="muted">НОВЫЙ КЛИЕНТ</div><h2>Создать QR-каталог</h2><p class="muted">Выберите тип бизнеса и создайте каталог: кафе, магазин, услуги, цветы, автосалон или другой проект.</p></div><div id="dashboardCreateAction"></div></div><div id="dashboardCreateForm"></div><div id="dashboardCreateStatus" class="status muted"></div>`;
  demo.insertAdjacentElement('afterend',panel);

  panel.querySelector('#dashboardCreateAction').appendChild(toggle);
  panel.querySelector('#dashboardCreateForm').appendChild(wrap);
  const mirror=panel.querySelector('#dashboardCreateStatus');

  const heading=wrap.querySelector('h3');if(heading)heading.textContent='Новый клиент / проект';
  const subtitle=form?.elements?.subtitle;if(subtitle)subtitle.placeholder='Например: Водяные фильтры • Каскелен';
  const address=form?.elements?.address;if(address)address.placeholder='Адрес компании / магазина';
  const slug=form?.elements?.slug;if(slug)slug.placeholder='kaskelen-filter';

  if(status){const syncStatus=()=>{mirror.textContent=status.textContent||''};new MutationObserver(syncStatus).observe(status,{childList:true,subtree:true,characterData:true});syncStatus();}

  function route(){const dashboard=location.hash!=='#clients';panel.hidden=!dashboard;if(!dashboard)wrap.hidden=true;}
  window.addEventListener('hashchange',route);route();

  if(!document.querySelector('script[data-business-types]')){const s=document.createElement('script');s.src='/business-types.js?v=1';s.dataset.businessTypes='1';document.body.appendChild(s)}
})();