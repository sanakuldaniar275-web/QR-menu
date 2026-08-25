(()=>{
  const slug=location.pathname.split('/').filter(Boolean)[1];
  if(!slug)return;
  function contrast(hex){
    const m=/^#([0-9a-f]{6})$/i.exec(hex||'');if(!m)return'#111111';
    const n=parseInt(m[1],16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;
    const y=(r*299+g*587+b*114)/1000;
    return y>=155?'#111111':'#ffffff';
  }
  async function apply(){
    try{
      const r=await fetch(`/api/menu/${encodeURIComponent(slug)}?accent=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      const c=data?.restaurant?.accent_color;
      if(!/^#[0-9a-f]{6}$/i.test(c||''))return;
      document.documentElement.style.setProperty('--accent',c);
      document.documentElement.style.setProperty('--accent-contrast',contrast(c));
      document.documentElement.dataset.accent=c.toLowerCase();
      const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',c);
    }catch(_e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  window.addEventListener('pageshow',e=>{if(e.persisted)apply()});
})();