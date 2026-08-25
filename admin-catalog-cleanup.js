(()=>{
 const TYPES={food:{noun:'блюдо',title:'Меню',category:'Категории меню',add:'Добавить блюдо',photo:'Фотография блюда',name:'Название блюда',desc:'Описание блюда',list:'Блюда',stock:'',variant:'Объёмы / варианты',variantHint:'Необязательно. Например: 0,5 л — 1 090 ₸ и 1 л — 2 090 ₸.',emptyPhoto:'Новое блюдо — фото ещё не загружено'},products:{noun:'товар',title:'Каталог',category:'Категории товаров',add:'Добавить товар',photo:'Фотография товара',name:'Название товара',desc:'Описание товара',list:'Товары',stock:'В наличии',variant:'Варианты товара',variantHint:'Необязательно. Например: модель, комплект, объём или размер с отдельной ценой.',emptyPhoto:'Новый товар — фото ещё не загружено'},flowers:{noun:'товар',title:'Каталог',category:'Категории товаров',add:'Добавить товар',photo:'Фотография товара',name:'Название букета / товара',desc:'Описание товара',list:'Товары',stock:'В наличии',variant:'Варианты товара',variantHint:'Необязательно. Например: размер букета или комплектация с отдельной ценой.',emptyPhoto:'Новый товар — фото ещё не загружено'},auto:{noun:'автомобиль',title:'Каталог',category:'Категории автомобилей',add:'Добавить автомобиль',photo:'Фотография автомобиля',name:'Марка и модель',desc:'Описание автомобиля',list:'Автомобили',stock:'В наличии',variant:'Комплектации / варианты',variantHint:'Необязательно. Например: комплектация, двигатель или год с отдельной ценой.',emptyPhoto:'Новый автомобиль — фото ещё не загружено'},services:{noun:'услуга',title:'Услуги',category:'Категории услуг',add:'Добавить услугу',photo:'Фотография услуги',name:'Название услуги',desc:'Описание услуги',list:'Услуги',stock:'Доступна',variant:'Варианты услуги',variantHint:'Необязательно. Например: пакет или длительность с отдельной ценой.',emptyPhoto:'Новая услуга — фото ещё не загружено'},other:{noun:'позиция',title:'Каталог',category:'Категории',add:'Добавить позицию',photo:'Фотография',name:'Название',desc:'Описание',list:'Позиции',stock:'Активна',variant:'Варианты',variantHint:'Необязательно. Добавьте варианты с отдельной ценой.',emptyPhoto:'Новая позиция — фото ещё не загружено'}};
 const infer=()=>document.body.dataset.businessType||'products';
 const text=(el,v)=>{if(el)el.textContent=v};
 function apply(){
  const menu=document.querySelector('#menuManage'),form=document.querySelector('#dishForm');if(!menu||!form)return;
  const c=TYPES[infer()]||TYPES.products;
  const editing=typeof editingDishId!=='undefined'&&Boolean(editingDishId);
  const heads=[...menu.querySelectorAll(':scope > h3')];if(heads[0])text(heads[0],c.category);if(heads[1]&&!editing)text(heads[1],c.add);if(heads[2])text(heads[2],c.title);
  if(form.elements.name)form.elements.name.placeholder=c.name;if(form.elements.description)form.elements.description.placeholder=c.desc;
  const photoLabel=[...form.querySelectorAll('label')].find(l=>l.querySelector('#dishPhoto'));if(photoLabel){const s=photoLabel.querySelector('.muted');text(s,c.photo)}
  const emptyPhoto=[...form.querySelectorAll('*')].find(el=>el.children.length===0&&/Новое (блюдо|товар|автомобиль|услуга|позиция) — фото ещё не загружено/i.test(el.textContent.trim()));if(emptyPhoto)text(emptyPhoto,c.emptyPhoto);
  const variant=form.querySelector('.variant-editor');if(variant){const strong=variant.querySelector('.variant-editor-head strong');const hint=variant.querySelector('.variant-editor-head .muted');text(strong,c.variant);text(hint,c.variantHint)}
  const submit=document.querySelector('#dishSubmitButton');if(submit&&!editing)text(submit,c.add);
  const emoji=form.elements.emoji;if(emoji){emoji.closest('label')?.remove();if(emoji.isConnected)emoji.remove()}
  const duplicatePhotos=[...document.querySelectorAll('.dish-photo-admin-panel')];duplicatePhotos.slice(1).forEach(x=>x.remove());
  const duplicateTools=[...document.querySelectorAll('.dish-manager-tools')];duplicateTools.slice(1).forEach(x=>x.remove());
  text(document.querySelector('.dish-manager-head strong'),c.list);
  const search=document.querySelector('#dishAdminSearch');if(search)search.placeholder=`Поиск: ${c.noun}…`;
  document.querySelectorAll('.dish-admin-photo-state.has').forEach(el=>text(el,c.stock||'Фото есть'));
  document.querySelectorAll('.dish-admin-photo-state.none').forEach(el=>text(el,'Без фото'));
  const remove=document.querySelector('#removeDishPhotoWrap strong');if(remove)text(remove,'Удалить фотографию');
  const note=document.querySelector('#removeDishPhotoWrap small');if(note)text(note,'После сохранения будет показана стандартная заглушка');
 }
 document.addEventListener('DOMContentLoaded',apply);const obs=new MutationObserver(()=>{clearTimeout(obs.t);obs.t=setTimeout(apply,80)});obs.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['data-business-type']});setTimeout(apply,400);setTimeout(apply,1200);
})();