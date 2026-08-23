(()=>{
  if(location.pathname.replace(/\/+$/,'')!=='/r/green-bar') return;
  if(new URLSearchParams(location.search).get('menu')==='1') return;

  const card=document.querySelector('.gb-welcome-card');
  const brand=document.querySelector('.gb-welcome-brand');
  const cta=document.querySelector('.gb-enter-menu');
  if(!card||!brand||!cta) return;

  if(!document.querySelector('.gb-welcome-intro')){
    const intro=document.createElement('section');
    intro.className='gb-welcome-intro';
    intro.innerHTML='<h2>GREEN BAR — кухня, бар и атмосфера</h2><p>Место для вкусных встреч, спокойных ужинов и тёплых вечеров. Выбирайте любимые блюда и напитки — всё меню всегда под рукой.</p>';
    brand.insertAdjacentElement('afterend',intro);
  }

  if(!cta.closest('.gb-menu-cta-wrap')){
    const wrap=document.createElement('div');
    wrap.className='gb-menu-cta-wrap';
    cta.parentNode.insertBefore(wrap,cta);
    wrap.appendChild(cta);
  }

  cta.innerHTML='<span class="gb-cta-icon" aria-hidden="true">◉</span><span class="gb-cta-label">Смотреть меню</span><span class="gb-cta-arrow" aria-hidden="true">›</span>';
  cta.setAttribute('aria-label','Открыть меню Green Bar');
})();