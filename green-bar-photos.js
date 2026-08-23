(()=>{
  if(location.pathname!=='/r/green-bar') return;

  // Photos uploaded through admin/client cabinet always have priority.
  // Keep this helper intentionally lightweight: on mobile we must not scan the
  // whole DOM on every mutation, especially when many dishes have base64 photos.
  function cleanObsoleteFallbacks(){
    if(typeof dishes==='undefined' || !Array.isArray(dishes) || !dishes.length) return false;
    let changed=false;
    for(const d of dishes){
      if(d.image_url && /loremflickr\.com/i.test(d.image_url)){
        d.image_url='';
        changed=true;
      }
    }
    if(changed && typeof render==='function') render();
    return true;
  }

  // Images are styled by CSS. Poll only until menu data arrives, then stop.
  let tries=0;
  const timer=setInterval(()=>{
    if(cleanObsoleteFallbacks() || ++tries>40) clearInterval(timer);
  },250);
})();