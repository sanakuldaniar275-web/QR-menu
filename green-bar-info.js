(()=>{
  if(location.pathname!=='/r/green-bar') return;

  const phone='77053623265';
  const displayPhone='+7 705 362 32 65';
  const address='проспект Кунаева, 17/7';
  const instagramUrl='https://www.instagram.com/greenbar_17?igsi=ZGVzZ3lqZzE1NnN5';
  const instagramLabel='@greenbar_17';
  const whatsappUrl=`https://wa.me/${phone}?text=${encodeURIComponent('Здравствуйте! Пишу из QR-меню GREEN LOUNGE-BAR')}`;

  function patch(){
    const meta=document.querySelector('#restaurantMeta');
    if(meta){
      const service=[...meta.querySelectorAll('span')].find(x=>/Обслуживание/i.test(x.textContent||''));
      meta.innerHTML='';
      if(service) meta.append(service);
      const addressChip=document.createElement('span');
      addressChip.textContent=address;
      meta.append(addressChip);
    }

    const wa=document.querySelector('#whatsappLink');
    if(wa){
      wa.hidden=false;
      wa.href=whatsappUrl;
      wa.target='_blank';
      wa.rel='noopener';
    }

    const info=document.querySelector('#infoContent');
    if(info){
      info.innerHTML=`
        <p><strong>GREEN LOUNGE-BAR</strong></p>
        <p>@greenbar_17 • 16:00–04:00</p>
        <p>📍 ${address}</p>
        <p>ℹ️ Обслуживание 15%</p>
        <p>💬 <a href="${whatsappUrl}" target="_blank" rel="noopener">${displayPhone} — WhatsApp</a></p>
        <p>📷 <a href="${instagramUrl}" target="_blank" rel="noopener">${instagramLabel}</a></p>`;
    }
  }

  patch();
  let attempts=0;
  const timer=setInterval(()=>{
    patch();
    if(++attempts>=15) clearInterval(timer);
  },300);
})();
