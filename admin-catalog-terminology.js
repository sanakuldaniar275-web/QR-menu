(()=>{
  const labels={
    food:{add:'Добавить блюдо',photo:'Фотография блюда',new:'Новое блюдо — фото ещё не загружено',variant:'Объёмы / варианты',hint:'Необязательно. Например: 0,5 л — 1 090 ₸ и 1 л — 2 090 ₸.'},
    products:{add:'Добавить товар',photo:'Фотография товара',new:'Новый товар — фото ещё не загружено',variant:'Варианты товара',hint:'Необязательно. Например: модель, комплект, объём или размер с отдельной ценой.'},
    flowers:{add:'Добавить товар',photo:'Фотография товара',new:'Новый товар — фото ещё не загружено',variant:'Варианты товара',hint:'Необязательно. Например: размер букета или количество цветов.'},
    auto:{add:'Добавить автомобиль',photo:'Фотография автомобиля',new:'Новый автомобиль — фото ещё не загружено',variant:'Комплектации / варианты',hint:'Необязательно. Например: комплектация, двигатель или год выпуска.'},
    services:{add:'Добавить услугу',photo:'Фотография услуги',new:'Новая услуга — фото ещё не загружено',variant:'Варианты услуги',hint:'Необязательно. Например: базовый, стандартный и премиум.'},
    other:{add:'Добавить позицию',photo:'Фотография',new:'Новая позиция — фото ещё не загружено',variant:'Варианты',hint:'Добавьте варианты, если у позиции несколько цен.'}
  };
  function apply(){
    const key=document.body.dataset.businessType||'products',c=labels[key]||labels.other;
    const add=document.querySelector('#dishSubmitButton');if(add&&!window.editingDishId)add.textContent=c.add;
    const title=document.querySelector('#dishFormTitle');if(title&&!window.editingDishId)title.textContent=c.add;
    const photoHelp=document.querySelector('.dish-photo-help strong');if(photoHelp)photoHelp.textContent=c.photo;
    const empty=document.querySelector('#dishCurrentPhoto span');if(empty&&/блюдо|товар|автомобиль|услуг|позици|фото ещё/.test(empty.textContent))empty.textContent=c.new;
    const variant=document.querySelector('#dishForm .variant-editor');if(variant){const strong=variant.querySelector('.variant-editor-head strong'),hint=variant.querySelector('.variant-editor-head .muted');if(strong)strong.textContent=c.variant;if(hint)hint.textContent=c.hint;}
  }
  document.addEventListener('DOMContentLoaded',apply);
  const o=new MutationObserver(()=>{clearTimeout(o.t);o.t=setTimeout(apply,80)});o.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-business-type']});
  setTimeout(apply,300);setTimeout(apply,1000);
})();