document.addEventListener('error', event => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement)) return;
  const holder = img.closest('.dish-photo, .dish-detail-visual');
  if (!holder) return;
  const fallback = document.createElement('span');
  fallback.className = 'dish-emoji';
  fallback.textContent = '🍽️';
  img.replaceWith(fallback);
}, true);
