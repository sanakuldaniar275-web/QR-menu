(()=>{
  function slug(){return location.pathname.split('/').filter(Boolean)[1]||'demo'}
  function normalizeKz(value){
    let d=String(value||'').replace(/\D/g,'');
    if(d.length===10)d='7'+d;
    if(d.length===11&&d.startsWith('8'))d='7'+d.slice(1);
    return /^7\d{10}$/.test(d)?d:'';
  }
  async function apply(){
    const link=document.querySelector('#whatsappLink');
    if(!link)return;
    try{
      const r=await fetch(`/api/menu/${encodeURIComponent(slug())}?wa=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw new Error('menu fetch failed');
      const data=await r.json();
      const phone=normalizeKz(data?.restaurant?.phone);
      if(!phone){link.hidden=true;link.removeAttribute('href');return;}
      const name=data?.restaurant?.name||document.querySelector('#restaurantName')?.textContent||'QR';
      link.href=`https://wa.me/${phone}?text=${encodeURIComponent('Здравствуйте! Пишу из QR-каталога '+name)}`;
      link.hidden=false;
      link.dataset.boundPhone=phone;
    }catch(_e){}
  }
  document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(apply,700)});
  window.addEventListener('pageshow',apply);
})();