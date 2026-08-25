(()=>{
  const link=document.querySelector('#whatsappLink');
  if(!link)return;

  function normalizeKazakhstanWhatsapp(){
    const href=link.getAttribute('href')||'';
    if(!href.includes('wa.me/'))return;
    try{
      const url=new URL(href,location.origin);
      let digits=url.pathname.replace(/\D/g,'');
      // Kazakhstan numbers are often entered locally as 8XXXXXXXXXX.
      // wa.me requires the international country code, so 8 -> 7.
      if(/^8\d{10}$/.test(digits)) digits='7'+digits.slice(1);
      if(!/^\d{10,15}$/.test(digits))return;
      const next=`https://wa.me/${digits}${url.search||''}`;
      if(link.href!==next)link.href=next;
    }catch{}
  }

  normalizeKazakhstanWhatsapp();
  new MutationObserver(normalizeKazakhstanWhatsapp).observe(link,{attributes:true,attributeFilter:['href']});
  setTimeout(normalizeKazakhstanWhatsapp,300);
  setTimeout(normalizeKazakhstanWhatsapp,1200);
})();