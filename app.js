const dishes=[
 {category:'Завтраки',name:'Сырники',description:'Со сметаной и ягодным соусом',price:2200,icon:'🥞'},
 {category:'Завтраки',name:'Омлет',description:'Яйца, томаты, зелень и сыр',price:1900,icon:'🍳'},
 {category:'Салаты',name:'Цезарь с курицей',description:'Курица, салат, томаты, соус',price:2900,icon:'🥗'},
 {category:'Горячее',name:'Стейк с овощами',description:'Говядина и сезонные овощи',price:5900,icon:'🥩'},
 {category:'Пицца',name:'Маргарита',description:'Томаты, моцарелла и базилик',price:3300,icon:'🍕'},
 {category:'Десерты',name:'Чизкейк',description:'Классический сливочный десерт',price:2100,icon:'🍰'},
 {category:'Напитки',name:'Лимонад',description:'Лимон, мята и газированная вода',price:1400,icon:'🍋'},
 {category:'Напитки',name:'Капучино',description:'Эспрессо и молочная пена',price:1200,icon:'☕'}
];
const categories=['Все',...new Set(dishes.map(x=>x.category))];
let active='Все';
const categoryEl=document.querySelector('#categories');
const menuEl=document.querySelector('#menu');
const searchEl=document.querySelector('#search');
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₸';
function renderCategories(){categoryEl.innerHTML=categories.map(c=>`<button class="category ${c===active?'active':''}" data-category="${c}">${c}</button>`).join('')}
function render(){const q=searchEl.value.trim().toLowerCase();const list=dishes.filter(x=>(active==='Все'||x.category===active)&&(`${x.name} ${x.description}`.toLowerCase().includes(q)));menuEl.innerHTML=list.length?`<h2 class="section-title">${active==='Все'?'Меню':active}</h2><div class="grid">${list.map(x=>`<article class="card"><div class="photo">${x.icon}</div><div class="card-body"><h3>${x.name}</h3><p class="description">${x.description}</p><div class="price">${money(x.price)}</div></div></article>`).join('')}</div>`:'<div class="empty">Ничего не найдено</div>'}
categoryEl.addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;active=b.dataset.category;renderCategories();render()});searchEl.addEventListener('input',render);renderCategories();render();