(()=>{
  if(location.pathname!=='/r/green-bar') return;

  // Exact GREEN BAR supplied photos. Use the higher-quality source files;
  // browser cropping handles cards/modals without destroying image quality.
  const verified = {
    'Пивное ассорти':'/greenbar-photos/beer-assorti.webp',
    'Курица в сливочном соусе':'/greenbar-photos/chicken-cream-rice.webp',
    'Рамен с курицей':'/greenbar-photos/ramen-chicken.webp',
    'Куырдак из баранины':'/greenbar-photos/kuyrdak-lamb.webp',
    'Америка темпура':'/greenbar-photos/fried-rolls.webp',

    'Унаги темпура':'https://navasushi.ru/assets/images/products/176/1000049792.jpg',
    'Капа маки':'https://www.voskesbbq.nl/wp-content/uploads/2022/07/kappa.png',
    'Калифорния':'https://imgprod.beyondmenu.com/60699/Menu/215328/624.jpg',
    'Цезарь темпура':'https://dikiyroll.ru/__/images/menuProduct/6600371f45747_w900_png.webp',
    'Фри':'https://media.gettyimages.com/id/1413698567/photo/french-fries-on-white-plate-with-ketchup-on-wooden-table-at-a-restaurant.jpg?s=612x612&w=0&k=20&c=2ewU9pK4E8oK53k5cNKBK1L7q8uV-bUP5-Xpj4WJGgM=',
    'Дольки':'https://chowdeck.com/store/_next/image?q=75&url=https%3A%2F%2Ffiles.chowdeck.com%2Ffit-in%2F1200x675%2Fimages%2F2024%2F2024-05-01%2FdwHHLd3IoKvTaa1BANbCT.jpg&w=3840',
    'Овощи на гриле':'https://media.gettyimages.com/id/506626519/photo/grilled-vegetable.jpg?s=612x612&w=0&k=20&c=Zq9rOJSPJXj3VBSGwp-tk4cRZ4WLBg2GFl0L0z6D5LQ=',
    'Пюре':'https://popmenucloud.com/cdn-cgi/image/width%3D600%2Cheight%3D600%2Cfit%3Dscale-down%2Cformat%3Dauto%2Cquality%3D60/dbmchysf/9e75c093-395e-4b28-94ee-6cfc1f912554.jpg',
    'Греческий':'https://media.gettyimages.com/id/1169475486/photo/fresh-tasty-greek-salad-in-restaurant-in-athens-greece.jpg?s=612x612&w=0&k=20&c=vQbRccw6u56DLFWL7N7Lvvj91EwT8eXf1n3cA6PWZgw=',
    'Цезарь с курицей':'https://aws-tiqets-cdn.imgix.net/images/content/06aae47bc2e84dc380791aff33a5547a.jpeg?auto=format%2Ccompress&fit=crop&q=70&w=800',
    'Том – ям':'https://images.menufans.com/foods/019b4bdbe5bb715592ccd93bdb11f541/review/large/tom-yum-goong-review.jpg',
    'Бефстроганов':'https://popmenucloud.com/cdn-cgi/image/width%3D1200%2Cheight%3D630%2Cformat%3Dauto%2Cfit%3Dcover/wdimlvjf/107b97ef-e92e-4a0b-b129-a661b781bd7b.jpg'
  };

  const supplied = new Set([
    'Пивное ассорти','Курица в сливочном соусе','Рамен с курицей',
    'Куырдак из баранины','Америка темпура'
  ]);

  function styleImages(){
    document.querySelectorAll('.dish-photo img,.dish-detail-img').forEach(img=>{
      img.style.width='100%';
      img.style.height='100%';
      img.style.display='block';
      img.style.objectFit='cover';
      img.style.objectPosition='50% 50%';
      img.style.imageRendering='auto';
    });
    document.querySelectorAll('.dish-photo').forEach(el=>{
      el.style.overflow='hidden';
    });
  }

  function apply(){
    if(typeof dishes==='undefined' || !Array.isArray(dishes) || !dishes.length) return false;
    let changed=false;
    for(const d of dishes){
      if(verified[d.name]) {
        if(d.image_url!==verified[d.name]) { d.image_url=verified[d.name]; changed=true; }
      } else if(d.image_url && /loremflickr\.com/i.test(d.image_url)) {
        d.image_url=''; changed=true;
      }
    }
    if(changed && typeof render==='function') render();
    styleImages();
    return true;
  }

  const observer=new MutationObserver(styleImages);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  let tries=0;
  const timer=setInterval(()=>{ if(apply() || ++tries>40) clearInterval(timer); },250);
})();