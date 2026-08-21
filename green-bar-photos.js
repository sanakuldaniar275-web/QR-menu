(()=>{
  if(location.pathname!=='/r/green-bar') return;

  // Only verified images are rendered. Never use random search/fallback photos:
  // they can return people, animals or an unrelated dish.
  const verified = {
    'Пивное ассорти':'/greenbar-photos/beer-assorti.webp',
    'Курица в сливочном соусе':'/greenbar-photos/chicken-cream-rice.webp',
    'Рамен с курицей':'/greenbar-photos/ramen-chicken.webp',
    'Куырдак из баранины':'/greenbar-photos/kuyrdak-lamb.webp',
    'Унаги темпура':'https://navasushi.ru/assets/images/products/176/1000049792.jpg',
    'Капа маки':'https://www.voskesbbq.nl/wp-content/uploads/2022/07/kappa.png',
    'Калифорния':'https://imgprod.beyondmenu.com/60699/Menu/215328/624.jpg',
    'Цезарь темпура':'https://dikiyroll.ru/__/images/menuProduct/6600371f45747_w900_png.webp'
  };

  function apply(){
    if(typeof dishes==='undefined' || !Array.isArray(dishes) || !dishes.length) return false;
    let changed=false;
    for(const d of dishes){
      // The current database has no curated images; replace only with verified matches.
      if(verified[d.name]) {
        if(d.image_url!==verified[d.name]) { d.image_url=verified[d.name]; changed=true; }
      } else if(d.image_url && /loremflickr\.com/i.test(d.image_url)) {
        d.image_url=''; changed=true;
      }
    }
    if(changed && typeof render==='function') render();
    document.querySelectorAll('.dish-photo img,.dish-detail-img').forEach(img=>{
      img.style.objectFit='cover';
      img.style.width='100%';
      img.style.height='100%';
      img.style.display='block';
    });
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{ if(apply() || ++tries>40) clearInterval(timer); },250);
})();