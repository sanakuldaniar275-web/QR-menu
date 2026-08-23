(()=>{
  if(location.pathname.replace(/\/+$/,'')!=='/r/green-bar') return;

  const prices={
    'Манго-Маракуйя':[1090,2090],
    'Киви-Лайм':[1090,2090],
    'Тропический':[1290,2490],
    'Ягодный':[1290,2490],
    'Апельсиновый':[1090,2090],
    'Мохито':[1090,2090],
    'Манго-ананас':[1190,2290]
  };

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(typeof dishes==='undefined'||!Array.isArray(dishes)||!dishes.length){
      if(tries>80) clearInterval(timer);
      return;
    }

    let changed=false;
    for(const dish of dishes){
      const pair=prices[dish.name];
      if(!pair) continue;
      const next=[
        {name:'0,5 л',price:pair[0]},
        {name:'1 л',price:pair[1]}
      ];
      const current=Array.isArray(dish.variants)?JSON.stringify(dish.variants):'';
      if(current!==JSON.stringify(next)){
        dish.variants=next;
        dish.price=pair[0];
        changed=true;
      }
    }

    if(changed&&typeof render==='function') render();
    clearInterval(timer);
  },150);
})();