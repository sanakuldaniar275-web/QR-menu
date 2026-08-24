(()=>{
  const TYPES={
    food:{company:'заведения',profile:'Профиль заведения',menu:'Категории и блюда',item:'блюдо',itemCap:'Блюдо',items:'блюда',current:'Текущее меню',add:'Добавить блюдо',name:'Название блюда',desc:'Описание блюда',search:'Поиск блюда…',empty:'Блюд пока нет.',service:true},
    products:{company:'компании',profile:'Информация о компании',menu:'Категории и товары',item:'товар',itemCap:'Товар',items:'товары',current:'Текущий каталог',add:'Добавить товар',name:'Название товара',desc:'Описание товара',search:'Поиск товара…',empty:'Товаров пока нет.',service:false},
    flowers:{company:'магазина',profile:'Информация о магазине',menu:'Категории и товары',item:'товар',itemCap:'Товар',items:'товары',current:'Текущий каталог',add:'Добавить товар',name:'Название букета / товара',desc:'Описание товара',search:'Поиск товара…',empty:'Товаров пока нет.',service:false},
    auto:{company:'автосалона',profile:'Информация об автосалоне',menu:'Категории и автомобили',item:'автомобиль',itemCap:'Автомобиль',items:'автомобили',current:'Текущий каталог',add:'Добавить автомобиль',name:'Марка и модель',desc:'Описание автомобиля',search:'Поиск автомобиля…',empty:'Автомобилей пока нет.',service:false},
    services:{company:'компании',profile:'Информация о компании',menu:'Категории и услуги',item:'услугу',itemCap:'Услуга',items:'услуги',current:'Текущий каталог',add:'Добавить услугу',name:'Название услуги',desc:'Описание услуги',search:'Поиск услуги…',empty:'Услуг пока нет.',service:false},
    other:{company:'компании',profile:'Информация о компании',menu:'Категории и позиции',item:'позицию',itemCap:'Позиция',items:'позиции',current:'Текущий каталог',add:'Добавить позицию',name:'Название позиции',desc:'Описание',search:'Поиск…',empty:'Позиций пока нет.',service:false}
  };
  function infer(name='',subtitle=''){
    const s=`${name} ${subtitle}`.toLowerCase();
    if(/кафе|бар|restaurant|cafe|lounge|кухн|еда|ресторан/.test(s))return'food';
    if(/цвет|букет|flower|flor/.test(s))return'flowers';
    if(/авто|car|motor|машин|автосалон/.test(s))return'auto';
    if(/услуг|service|сервис/.test(s))return'services';
    if(/фильтр|товар|магазин|shop|store|water|вода/.test(s))return'products';
    return'products';
  }
  function typeFor(r){if(!r)return'products';return localStorage.getItem(`qr-business-type:${r.slug}`)||infer(r.name,r.subtitle)}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}
  function setPlaceholder(el,text){if(el&&el.placeholder!==text)el.placeholder=text}
  function dedupe(selector){const all=[...document.querySelectorAll(selector)];all.slice(1).forEach(x=>x.remove())}

  function applyAdmin(){
    if(!document.body.classList.contains('admin-redesign'))return;
    dedupe('.onboarding-access-box');dedupe('.business-type-box');dedupe('.credential-card');dedupe('.dish-manager-tools');
    const r=typeof selectedRestaurant!=='undefined'?selectedRestaurant:null;if(!r)return;
    const key=typeFor(r),c=TYPES[key]||TYPES.other;
    document.body.dataset.businessType=key;
    setText(document.querySelector('#editor .editor-nav a[href="#menuManage"]'),c.menu);
    setText(document.querySelector('#venueData'),c.profile);
    setText(document.querySelector('#menuManage h3'),c.menu);
    setText(document.querySelector('#dishFormTitle'),editingDishId?`${c.itemCap}: редактирование`:c.add);
    setText(document.querySelector('#dishSubmitButton'),editingDishId?'Сохранить изменения':c.add);
    setText(document.querySelector('#menuManage h3:last-of-type'),c.current);
    const df=document.querySelector('#dishForm');if(df){setPlaceholder(df.elements.name,c.name);setPlaceholder(df.elements.description,c.desc)}
    setPlaceholder(document.querySelector('#dishAdminSearch'),c.search);
    const service=document.querySelector('#restaurantEditForm [name="service"]');if(service)service.style.display=c.service?'':'none';
    if(typeof selectedRestaurant!=='undefined'&&selectedRestaurant?.slug){const pending=sessionStorage.getItem('pending-business-type');if(pending){localStorage.setItem(`qr-business-type:${selectedRestaurant.slug}`,pending);sessionStorage.removeItem('pending-business-type')}}
  }

  function applyClient(){
    if(!document.body.classList.contains('client-redesign'))return;
    const title=document.querySelector('#clientTitle')?.textContent||'';
    const subtitle=document.querySelector('#clientRestaurantForm [name="subtitle"]')?.value||'';
    const key=infer(title,subtitle),c=TYPES[key]||TYPES.other;
    document.body.dataset.businessType=key;
    const side=[...document.querySelectorAll('.client-sidebar a')].find(a=>a.getAttribute('href')==='#clientMenu');setText(side,c.menu);
    const hero=document.querySelector('#clientHome .muted');if(hero)setText(hero,key==='food'?'ВАШЕ ЗАВЕДЕНИЕ':'ВАША КОМПАНИЯ');
    const heroP=document.querySelector('#clientHome p');if(heroP)setText(heroP,`Здесь можно обновлять данные, оформление, категории, ${c.items}, цены и фотографии.`);
    const profileStrong=document.querySelector('#clientProfile .client-form-side strong');setText(profileStrong,c.profile);
    const service=document.querySelector('#clientRestaurantForm [name="service"]');if(service)service.style.display=c.service?'':'none';
    const dishTitle=document.querySelector('#clientDishTitle');if(dishTitle&&!String(dishTitle.textContent).startsWith('Изменить'))setText(dishTitle,c.add);
    const form=document.querySelector('#clientDishForm');if(form){setPlaceholder(form.elements.name,c.name);setPlaceholder(form.elements.description,c.desc)}
    setText(document.querySelector('.client-menu-tools h2'),c.current);setPlaceholder(document.querySelector('#clientDishSearch'),c.search);
  }

  const run=()=>{applyAdmin();applyClient()};
  document.addEventListener('DOMContentLoaded',run);window.addEventListener('hashchange',()=>setTimeout(run,0));
  const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(run,80)});obs.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['value','hidden']});
  setTimeout(run,250);setTimeout(run,900);
})();