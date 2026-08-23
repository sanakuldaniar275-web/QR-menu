(()=>{
  if(location.pathname!=='/r/green-bar') return;

  function findMenuButton(){
    return [...document.querySelectorAll('button,a')].find(el=>
      (el.textContent||'').trim().toLowerCase()==='смотреть меню'
    );
  }

  function closeWelcome(btn){
    // Find the full-screen Green Bar welcome container without relying on
    // implementation-specific class names.
    let node=btn;
    let welcome=null;
    while(node && node!==document.body){
      const cs=getComputedStyle(node);
      const r=node.getBoundingClientRect();
      if((cs.position==='fixed' || cs.position==='absolute') &&
         r.width>=innerWidth*0.85 && r.height>=innerHeight*0.75){
        welcome=node;
      }
      node=node.parentElement;
    }
    if(!welcome){
      node=btn.parentElement;
      while(node && node.parentElement!==document.body) node=node.parentElement;
      welcome=node;
    }
    if(welcome){
      welcome.style.setProperty('display','none','important');
      welcome.hidden=true;
      welcome.setAttribute('aria-hidden','true');
    }
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
    document.body.style.position='';
    document.body.style.height='';
    window.scrollTo({top:0,behavior:'instant'});

    const shell=document.querySelector('.menu-shell');
    if(shell){
      shell.hidden=false;
      shell.style.removeProperty('display');
      shell.style.removeProperty('visibility');
      shell.style.removeProperty('opacity');
    }
  }

  // Capture phase makes the fix work even if an older handler throws or stops propagation.
  document.addEventListener('click',e=>{
    const btn=e.target.closest && e.target.closest('button,a');
    if(!btn || (btn.textContent||'').trim().toLowerCase()!=='смотреть меню') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    closeWelcome(btn);
  },true);

  // Also wire keyboard/accessibility activation when the welcome screen appears later.
  const wire=()=>{
    const btn=findMenuButton();
    if(!btn || btn.dataset.gbWelcomeFixed) return;
    btn.dataset.gbWelcomeFixed='1';
    btn.addEventListener('keydown',e=>{
      if(e.key==='Enter' || e.key===' '){ e.preventDefault(); closeWelcome(btn); }
    });
  };
  wire();
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
})();