(()=>{
  const link=document.querySelector('#whatsappLink');
  if(!link)return;

  const getSlug=()=>location.pathname.split('/').filter(Boolean)[1]||'demo';
  let correctHref='';

  function toWhatsappDigits(value){
    let digits=String(value||'').replace(/\D/g,'');
    // Kazakhstan local/mobile formats -> international WhatsApp format.
    if(/^8\d{10}$/.test(digits)) digits='7'+digits.slice(1);
    else if(/^\d{10}$/.test(digits)) digits='7'+digits;
    if(!/^\d{11,15}$/.test(digits)) return '';
    return digits;
  }

  function buildHref(phone,name){
    const digits=toWhatsappDigits(phone);
    if(!digits)return '';
    const text=encodeURIComponent(`Здравствуйте! Пишу из QR-каталога ${name||''}`.trim());
    return `https://wa.me/${digits}?text=${text}`;
  }

  async function refreshFromCurrentClient(){
    try{
      const response=await fetch(`/api/menu/${encodeURIComponent(getSlug())}`,{cache:'no-store'});
      if(!response.ok)return;
      const data=await response.json();
      const r=data?.restaurant||{};
      correctHref=buildHref(r.phone,r.name);
      if(correctHref){
        link.href=correctHref;
        link.hidden=false;
        link.dataset.phoneSource='current-client';
      }else{
        link.hidden=true;
      }
    }catch{}
  }

  // Even if another old script rewrites href later, clicking WhatsApp always uses
  // the phone fetched for the currently opened client.
  link.addEventListener('click',e=>{
    if(!correctHref)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.open(correctHref,'_blank','noopener');
  },true);

  refreshFromCurrentClient();
  setTimeout(refreshFromCurrentClient,500);
  setTimeout(refreshFromCurrentClient,1600);
})();