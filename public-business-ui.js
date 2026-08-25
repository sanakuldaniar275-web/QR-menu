(()=>{
  const TERMS={
    food:{kicker:'ЦИФРОВОЕ МЕНЮ',search:'Найти блюдо…',all:'Все блюда',titleSuffix:'меню',footer:'Меню всегда актуально — без скачивания приложений',info:'О заведении',item:'Блюдо',share:'Меню',calc:'Это ориентировочная сумма выбранных блюд. Заказ не отправляется.'},
    products:{kicker:'ЦИФРОВОЙ КАТАЛОГ',search:'Найти товар…',all:'Все товары',titleSuffix:'каталог',footer:'Каталог всегда актуален — без скачивания приложений',info:'О компании',item:'Товар',share:'Каталог',calc:'Это ориентировочная сумма выбранных товаров. Заказ не отправляется.'},
    flowers:{kicker:'ЦИФРОВОЙ КАТАЛОГ',search:'Найти букет или товар…',all:'Все товары',titleSuffix:'каталог',footer:'Каталог всегда актуален — без скачивания приложений',info:'О магазине',item:'Товар',share:'Каталог',calc:'Это ориентировочная сумма выбранных товаров. Заказ не отправляется.'},
    auto:{kicker:'ЦИФРОВОЙ КАТАЛОГ',search:'Найти автомобиль…',all:'Все автомобили',titleSuffix:'каталог',footer:'Каталог всегда актуален — без скачивания приложений',info:'Об автосалоне',item:'Автомобиль',share:'Каталог',calc:'Это ориентировочная сумма выбранных автомобилей. Заказ не отправляется.'},
    services:{kicker:'ЦИФРОВОЙ КАТАЛОГ',search:'Найти услугу…',all:'Все услуги',titleSuffix:'услуги',footer:'Список услуг всегда актуален — без скачивания приложений',info:'О компании',item:'Услуга',share:'Услуги',calc:'Это ориентировочная сумма выбранных услуг. Заказ не отправляется.'},
    other:{kicker:'ЦИФРОВОЙ КАТАЛОГ',search:'Найти…',all:'Все позиции',titleSuffix:'каталог',footer:'Каталог всегда актуален — без скачивания приложений',info:'О компании',item:'Позиция',share:'Каталог',calc:'Это ориентировочная сумма выбранных позиций. Заказ не отправляется.'}
  };
  function infer(r={}){
    if(r.business_type&&TERMS[r.business_type])return r.business_type;
    const s=`${r.name||''} ${r.subtitle||''}`.toLowerCase();
    if(/кафе|бар|restaurant|cafe|lounge|кухн|еда|ресторан/.test(s))return'food';
    if(/цвет|букет|flower|flor/.test(s))return'flowers';
    if(/авто|car|motor|машин|автосалон/.test(s))return'auto';
    if(/услуг|service|сервис/.test(s))return'services';
    if(/фильтр|товар|магазин|shop|store|water|вода/.test(s))return'products';
    return'products';
  }
  function contrast(hex){
    if(!/^#[0-9a-f]{6}$/i.test(hex||''))return'#111111';
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    const y=(r*299+g*587+b*114)/1000;
    return y>=150?'#111111':'#ffffff';
  }
  function currentRestaurant(){
    try{return typeof restaurant!=='undefined'&&restaurant?restaurant:{}}catch{return{}}
  }
  function apply(){
    const r=currentRestaurant();
    if(!r||!r.name)return;
    const key=infer(r),t=TERMS[key]||TERMS.other;
    document.body.dataset.publicBusinessType=key;
    const kicker=document.querySelector('.hero-kicker');if(kicker)kicker.textContent=t.kicker;
    const search=document.querySelector('#search');if(search){search.placeholder=t.search;search.setAttribute('aria-label',`Поиск: ${t.search.replace('…','').toLowerCase()}`)}
    const name=document.querySelector('#restaurantName')?.textContent||r.name||'QR';
    document.title=`${name} — ${t.titleSuffix}`;
    const footer=document.querySelector('.public-footer span');if(footer)footer.textContent=t.footer;
    const infoTitle=document.querySelector('#infoTitle');if(infoTitle)infoTitle.textContent=t.info;
    document.querySelectorAll('#restaurantMeta span').forEach(el=>{if(el.textContent.trim()==='0')el.remove()});
    const heading=document.querySelector('#menu .section-head h2');if(heading&&/^(Все блюда|Все товары|Все автомобили|Все услуги|Все позиции)$/.test(heading.textContent.trim()))heading.textContent=t.all;
    const calcP=document.querySelector('.calc-head p');if(calcP)calcP.textContent=t.calc;
    const detail=document.querySelector('#dishDetail .detail-category');if(detail&&detail.textContent.trim()==='Блюдо')detail.textContent=t.item;
    const color=/^#[0-9a-f]{6}$/i.test(r.accent_color||'')?r.accent_color:'#f3d21b';
    document.documentElement.style.setProperty('--accent',color);
    document.documentElement.style.setProperty('--accent-contrast',contrast(color));
  }
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(apply,0);setTimeout(apply,250);setTimeout(apply,900)});
  const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(apply,40)});
  obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
})();