const dishes = [
  { id: 1, category: 'Салаты', name: 'Цезарь с курицей', description: 'Куриное филе, салат, томаты, сыр и фирменный соус.', price: 2890, emoji: '🥗' },
  { id: 2, category: 'Салаты', name: 'Греческий салат', description: 'Свежие овощи, маслины, сыр фета и оливковая заправка.', price: 2390, emoji: '🥒' },
  { id: 3, category: 'Горячее', name: 'Стейк с овощами', description: 'Сочное мясо на гриле с сезонными овощами.', price: 5490, emoji: '🥩' },
  { id: 4, category: 'Горячее', name: 'Паста Альфредо', description: 'Паста в сливочном соусе с курицей и пармезаном.', price: 3290, emoji: '🍝' },
  { id: 5, category: 'Пицца', name: 'Пепперони', description: 'Томатный соус, моцарелла и пепперони.', price: 3690, emoji: '🍕' },
  { id: 6, category: 'Десерты', name: 'Чизкейк', description: 'Нежный сливочный чизкейк с ягодным соусом.', price: 1990, emoji: '🍰' },
  { id: 7, category: 'Напитки', name: 'Лимонад Манго', description: 'Манго, цитрус, мята и газированная вода.', price: 1490, emoji: '🥭' },
  { id: 8, category: 'Напитки', name: 'Капучино', description: 'Эспрессо и молочная пена.', price: 1190, emoji: '☕' }
];

const categoriesEl = document.getElementById('categories');
const menuGrid = document.getElementById('menuGrid');
const searchInput = document.getElementById('searchInput');
const sectionTitle = document.getElementById('sectionTitle');
const itemsCount = document.getElementById('itemsCount');
const emptyState = document.getElementById('emptyState');

let activeCategory = 'Все';
let searchQuery = '';

const formatPrice = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₸';
const categories = ['Все', ...new Set(dishes.map(item => item.category))];

function renderCategories() {
  categoriesEl.innerHTML = categories.map(category => `
    <button class="category-btn ${category === activeCategory ? 'active' : ''}" data-category="${category}">
      ${category}
    </button>
  `).join('');

  categoriesEl.querySelectorAll('.category-btn').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function renderMenu() {
  const query = searchQuery.trim().toLowerCase();
  const filtered = dishes.filter(item => {
    const matchesCategory = activeCategory === 'Все' || item.category === activeCategory;
    const haystack = `${item.name} ${item.description} ${item.category}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });

  sectionTitle.textContent = activeCategory === 'Все' ? 'Все блюда' : activeCategory;
  itemsCount.textContent = `${filtered.length} поз.`;
  emptyState.hidden = filtered.length > 0;

  menuGrid.innerHTML = filtered.map(item => `
    <article class="dish-card">
      <div class="dish-image" aria-hidden="true">${item.emoji}</div>
      <div class="dish-body">
        <p class="dish-category">${item.category}</p>
        <h3 class="dish-title">${item.name}</h3>
        <p class="dish-desc">${item.description}</p>
        <div class="dish-price">${formatPrice(item.price)}</div>
      </div>
    </article>
  `).join('');
}

searchInput.addEventListener('input', event => {
  searchQuery = event.target.value;
  renderMenu();
});

renderCategories();
renderMenu();
