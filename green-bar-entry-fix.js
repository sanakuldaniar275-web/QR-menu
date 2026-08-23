(()=>{
  if(location.pathname.replace(/\/+$/,'')!=='/r/green-bar') return;

  const params=new URLSearchParams(location.search);
  const showMenu=params.get('menu')==='1';

  function revealMenu(){
    document.querySelectorAll('.gb-welcome').forEach(el=>el.remove());
    document.body.classList.remove('gb-welcome-open');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
    const shell=document.querySelector('.menu-shell');
    if(shell){
      shell.hidden=false;
      shell.style.removeProperty('display');
      shell.style.removeProperty('visibility');
      shell.style.removeProperty('opacity');
    }
  }

  function makeEntryLink(){
    const btn=document.querySelector('.gb-enter-menu');
    if(!btn || btn.tagName==='A') return;
    const link=document.createElement('a');
    link.className=btn.className;
    link.href='/r/green-bar?menu=1';
    link.textContent='Смотреть меню';
    link.setAttribute('role','button');
    btn.replaceWith(link);
  }

  if(showMenu){
    revealMenu();
    // final.js can mutate the DOM shortly after load; remove any late welcome too.
    const observer=new MutationObserver(()=>{
      if(document.querySelector('.gb-welcome')) revealMenu();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),5000);
  }else{
    makeEntryLink();
    const observer=new MutationObserver(makeEntryLink);
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),5000);
  }
})();