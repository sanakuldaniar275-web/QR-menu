(()=>{
  if(location.pathname!=='/r/green-bar') return;
  function apply(){
    const hero=document.querySelector('.hero-content');
    if(!hero) return;
    let logo=hero.querySelector('.greenbar-logo');
    if(!logo){
      logo=document.createElement('img');
      logo.className='greenbar-logo';
      logo.alt='GREEN LOUNGE-BAR';
      const kicker=hero.querySelector('.hero-kicker');
      hero.insertBefore(logo,kicker||hero.firstChild);
    }
    logo.src='/greenbar-logo.webp?v=1';
    logo.style.display='block';
    logo.style.width=innerWidth<=700?'78px':'104px';
    logo.style.height=innerWidth<=700?'78px':'104px';
    logo.style.objectFit='contain';
    logo.style.margin='0 0 12px 0';
    logo.style.filter='drop-shadow(0 8px 20px rgba(0,0,0,.2))';
  }
  apply();
  addEventListener('resize',apply);
  setTimeout(apply,300);
  setTimeout(apply,1000);
})();
