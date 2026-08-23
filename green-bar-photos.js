(()=>{
  if(location.pathname!=='/r/green-bar') return;

  // GREEN BAR: photos saved through admin/client cabinet always have priority.
  // Only remove obsolete random LoremFlickr fallbacks from older builds.
  function styleImages(){
    document.querySelectorAll('.dish-photo img,.dish-detail-img').forEach(img=>{
      img.style.width='100%';
      img.style.height='100%';
      img.style.display='block';
      img.style.objectFit='cover';
      img.style.objectPosition='50% 50%';
      img.style.imageRendering='auto';
    });
    document.querySelectorAll('.dish-photo').forEach(el=>{el.style.overflow='hidden'});
  }

  function apply(){
    if(typeof dishes==='undefined' || !Array.isArray(dishes) || !dishes.length) return false;
    let changed=false;
    for(const d of dishes){
      if(d.image_url && /loremflickr\.com/i.test(d.image_url)){
        d.image_url='';
        changed=true;
      }
    }
    if(changed && typeof render==='function') render();
    styleImages();
    return true;
  }

  const observer=new MutationObserver(styleImages);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  let tries=0;
  const timer=setInterval(()=>{ if(apply() || ++tries>40) clearInterval(timer); },250);
})();