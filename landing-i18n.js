(()=>{
  const texts={
    ru:{
      title:'QR MENU — цифровое меню для бизнеса',desc:'QR-меню для кафе, ресторанов и бизнеса. Красивое цифровое меню, которое легко обновлять.',
      nav:['Как работает','Демо','Тарифы'],order:'Заказать',
      kicker:'ЦИФРОВОЕ РЕШЕНИЕ ДЛЯ БИЗНЕСА',hero:'Всё меню<br>в одном <em>QR-коде.</em>',heroP:'Современное QR-меню для кафе, ресторанов, баров, кофеен, гостиниц и других заведений. Без приложений и перепечатки бумажного меню.',heroBtns:['Посмотреть живое демо','Получить QR-меню'],trust:['✓ Работает на телефоне','✓ Цены всегда актуальны','✓ Быстрый запуск'],
      phoneSmall:'ЦИФРОВОЕ МЕНЮ',chips:['Все','Завтраки','Напитки'],phoneDishes:['Сырники','Цезарь','Капучино'],float:'Сканируй → смотри меню',strip:['КАФЕ','РЕСТОРАНЫ','БАРЫ','КОФЕЙНИ','ОТЕЛИ'],
      howEyebrow:'КАК ЭТО РАБОТАЕТ',howTitle:'Просто для гостя.<br>Удобно для владельца.',steps:[['Создаём меню','Добавляем категории, блюда, фотографии, описание и цены вашего заведения.'],['Получаете QR-код','Размещаете QR на столе, стойке, упаковке или в любом удобном месте.'],['Гость сканирует','Камера телефона открывает меню сразу в браузере. Ничего скачивать не нужно.'],['Меню обновляется','Блюда, фото и цены можно менять без новой печати QR-кода.']],
      demoEyebrow:'ЖИВОЕ ДЕМО',demoTitle:'Не просто картинка.<br>Попробуйте сами.',demoP:'Откройте демонстрационное SANAQ CAFE, переключайте категории, смотрите блюда и проверьте, как меню выглядит для гостя.',demoBtn:'Открыть SANAQ CAFE →',demoCats:['Завтраки','Салаты','Горячее','Десерты','Напитки'],demoStrong:'Меню доступно 24/7',
      benefitsEyebrow:'ПОЧЕМУ QR-МЕНЮ',benefitsTitle:'Меню, которое работает<br>на ваш бизнес.',benefits:[['Без перепечатки','Изменили цену или блюдо — информация обновляется онлайн.'],['Красиво на телефоне','Адаптивный интерфейс создан для просмотра с мобильного.'],['Ваш стиль','Название, фотографии, категории и информация вашего бизнеса.'],['Одна ссылка','QR можно разместить офлайн, а ссылку отправлять в Instagram и WhatsApp.']],
      pricingEyebrow:'ТАРИФЫ',pricingTitle:'Выберите подходящий вариант',pricingNote:'Стоимость согласовывается под объём меню и задачи бизнеса.',plans:[
        {small:'ПРОСТО',title:'Только QR-меню',p:'Готовое меню для ваших гостей.',items:['Персональная ссылка на меню','QR-код для печати','Категории и блюда','Мобильная версия','Быстрый запуск'],btn:'Узнать стоимость'},
        {popular:'САМЫЙ ПОПУЛЯРНЫЙ',small:'РЕКОМЕНДУЕМ',title:'QR-меню + личный кабинет',p:'Полный контроль и самостоятельное управление меню.',items:['Всё из тарифа «Только QR-меню»','Личный кабинет для управления','Изменение блюд и цен','Загрузка фото и логотипа','Статистика просмотров','Поддержка и обновления'],btn:'Узнать стоимость'},
        {small:'ДЛЯ БИЗНЕСА',title:'Бизнес-решение',p:'Максимум возможностей и индивидуальная поддержка.',items:['Всё из тарифа «QR-меню + личный кабинет»','Несколько меню или филиалов','Расширенная аналитика','Интеграции и API','Приоритетная поддержка','Индивидуальные настройки'],btn:'Обсудить проект'}
      ],
      contactEyebrow:'ГОТОВЫ ПОПРОБОВАТЬ?',contactTitle:'Сделаем QR-меню<br>для вашего бизнеса.',contactP:'Посмотрите демо и напишите нам. Обсудим ваше заведение и подходящий вариант.',contactBtns:['Смотреть демо','Написать в WhatsApp'],footer:'Цифровое меню для современного бизнеса'
    },
    kk:{
      title:'QR MENU — бизнеске арналған цифрлық мәзір',desc:'Кафе, мейрамхана және бизнеске арналған QR-мәзір. Әдемі цифрлық мәзірді оңай жаңартуға болады.',
      nav:['Қалай жұмыс істейді','Демо','Тарифтер'],order:'Тапсырыс беру',
      kicker:'БИЗНЕСКЕ АРНАЛҒАН ЦИФРЛЫҚ ШЕШІМ',hero:'Бүкіл мәзір<br>бір <em>QR-кодта.</em>',heroP:'Кафе, мейрамхана, бар, кофехана, қонақүй және басқа да орындарға арналған заманауи QR-мәзір. Қосымша жүктеудің және қағаз мәзірді қайта басып шығарудың қажеті жоқ.',heroBtns:['Демоны көру','QR-мәзір алу'],trust:['✓ Телефонда жұмыс істейді','✓ Бағалар әрдайым өзекті','✓ Жылдам іске қосу'],
      phoneSmall:'ЦИФРЛЫҚ МӘЗІР',chips:['Барлығы','Таңғы ас','Сусындар'],phoneDishes:['Сырниктер','Цезарь','Капучино'],float:'Сканерле → мәзірді аш',strip:['КАФЕ','МЕЙРАМХАНАЛАР','БАРЛАР','КОФЕХАНАЛАР','ҚОНАҚҮЙЛЕР'],
      howEyebrow:'ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ',howTitle:'Қонаққа оңай.<br>Иесіне ыңғайлы.',steps:[['Мәзірді жасаймыз','Мекемеңіздің санаттарын, тағамдарын, фотоларын, сипаттамаларын және бағаларын енгіземіз.'],['QR-код аласыз','QR-кодты үстелге, сөреге, қаптамаға немесе ыңғайлы жерге орналастырасыз.'],['Қонақ сканерлейді','Телефон камерасы мәзірді бірден браузерде ашады. Ештеңе жүктеудің қажеті жоқ.'],['Мәзір жаңартылады','Тағамдарды, фотоларды және бағаларды QR-кодты қайта баспай-ақ өзгертуге болады.']],
      demoEyebrow:'ЖАНДЫ ДЕМО',demoTitle:'Жай сурет емес.<br>Өзіңіз байқап көріңіз.',demoP:'SANAQ CAFE демосын ашып, санаттарды ауыстырып, тағамдарды қарап, мәзірдің қонаққа қалай көрінетінін тексеріңіз.',demoBtn:'SANAQ CAFE ашу →',demoCats:['Таңғы ас','Салаттар','Ыстық тағамдар','Десерттер','Сусындар'],demoStrong:'Мәзір 24/7 қолжетімді',
      benefitsEyebrow:'НЕГЕ QR-МӘЗІР',benefitsTitle:'Бизнесіңіз үшін жұмыс істейтін<br>мәзір.',benefits:[['Қайта басып шығарусыз','Бағаны немесе тағамды өзгертсеңіз — ақпарат онлайн жаңарады.'],['Телефонда әдемі','Интерфейс мобильді телефонда ыңғайлы көруге бейімделген.'],['Сіздің стиліңіз','Бизнесіңіздің атауы, фотолары, санаттары және ақпараты.'],['Бір сілтеме','QR-кодты офлайн орналастырып, сілтемені Instagram және WhatsApp арқылы жіберуге болады.']],
      pricingEyebrow:'ТАРИФТЕР',pricingTitle:'Сәйкес нұсқаны таңдаңыз',pricingNote:'Құны мәзір көлемі мен бизнес міндеттеріне қарай келісіледі.',plans:[
        {small:'ҚАРАПАЙЫМ',title:'Тек QR-мәзір',p:'Қонақтарыңызға дайын мәзір.',items:['Мәзірге жеке сілтеме','Басып шығаруға арналған QR-код','Санаттар мен тағамдар','Мобильді нұсқа','Жылдам іске қосу'],btn:'Бағасын білу'},
        {popular:'ЕҢ ТАНЫМАЛ',small:'ҰСЫНАМЫЗ',title:'QR-мәзір + жеке кабинет',p:'Толық бақылау және мәзірді өзіңіз басқару.',items:['«Тек QR-мәзір» тарифінің барлық мүмкіндігі','Басқаруға арналған жеке кабинет','Тағамдар мен бағаларды өзгерту','Фото және логотип жүктеу','Көру статистикасы','Қолдау және жаңартулар'],btn:'Бағасын білу'},
        {small:'БИЗНЕСКЕ',title:'Бизнес-шешім',p:'Барынша мүмкіндік және жеке қолдау.',items:['«QR-мәзір + жеке кабинет» тарифінің барлық мүмкіндігі','Бірнеше мәзір немесе филиал','Кеңейтілген аналитика','Интеграциялар және API','Басым қолдау','Жеке баптаулар'],btn:'Жобаны талқылау'}
      ],
      contactEyebrow:'БАЙҚАП КӨРУГЕ ДАЙЫНСЫЗ БА?',contactTitle:'Бизнесіңізге QR-мәзір<br>жасап береміз.',contactP:'Демоны қарап, бізге жазыңыз. Мекемеңізді және қолайлы нұсқаны талқылаймыз.',contactBtns:['Демоны көру','WhatsApp-қа жазу'],footer:'Заманауи бизнеске арналған цифрлық мәзір'
    }
  };
  const $=(s)=>document.querySelector(s), $$=(s)=>[...document.querySelectorAll(s)];
  let lang=new URLSearchParams(location.search).get('lang')||localStorage.getItem('qr-lang')||'ru';
  if(!['ru','kk'].includes(lang))lang='ru';
  function fill(nodes,values,html=false){nodes.forEach((el,i)=>{if(el&&values[i]!=null){if(html)el.innerHTML=values[i];else el.textContent=values[i];}})}
  function apply(){const t=texts[lang];document.documentElement.lang=lang;document.title=t.title;const md=$('meta[name="description"]');if(md)md.content=t.desc;
    fill($$('.nav nav a'),t.nav);$('.nav-cta').textContent=t.order;
    $('.hero-copy .eyebrow').textContent=t.kicker;$('.hero-copy h1').innerHTML=t.hero;$('.hero-copy>p').textContent=t.heroP;fill($$('.hero-buttons a'),t.heroBtns);fill($$('.trust span'),t.trust);
    $('.screen>small').textContent=t.phoneSmall;fill($$('.chips>*'),t.chips);fill($$('.screen .dish strong'),t.phoneDishes);$('.float-card').textContent=t.float;fill($$('.strip span'),t.strip);
    $('#how>.eyebrow').textContent=t.howEyebrow;$('#how>h2').innerHTML=t.howTitle;$$('#how .steps article').forEach((a,i)=>{a.querySelector('h3').textContent=t.steps[i][0];a.querySelector('p').textContent=t.steps[i][1];});
    $('#demo .eyebrow').textContent=t.demoEyebrow;$('#demo h2').innerHTML=t.demoTitle;$('#demo>div:first-child>p').textContent=t.demoP;$('#demo .btn').textContent=t.demoBtn;fill($$('#demo .demo-list span'),t.demoCats);$('#demo .demo-card>strong').textContent=t.demoStrong;
    $('.benefits>.eyebrow').textContent=t.benefitsEyebrow;$('.benefits>h2').innerHTML=t.benefitsTitle;$$('.benefit-grid article').forEach((a,i)=>{a.querySelector('h3').textContent=t.benefits[i][0];a.querySelector('p').textContent=t.benefits[i][1];});
    $('#pricing>.eyebrow').textContent=t.pricingEyebrow;$('#pricing>h2').textContent=t.pricingTitle;$('#pricing>.pricing-note').textContent=t.pricingNote;$$('#pricing .price-grid article').forEach((a,i)=>{const p=t.plans[i];const pop=a.querySelector('.popular');if(pop&&p.popular)pop.textContent=p.popular;a.querySelector('small').textContent=p.small;a.querySelector('h3').textContent=p.title;a.querySelector('p').textContent=p.p;fill([...a.querySelectorAll('li')],p.items);a.querySelector('a').textContent=p.btn;});
    $('#contact>.eyebrow').textContent=t.contactEyebrow;$('#contact>h2').innerHTML=t.contactTitle;$('#contact>p').textContent=t.contactP;fill($$('#contact .btn'),t.contactBtns);$('footer span').textContent=t.footer;
    $$('[data-lang]').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
    $$('a[href="/r/demo"]').forEach(a=>a.href=`/r/demo?lang=${lang}`);
  }
  const sw=document.createElement('div');sw.className='lang-switch';sw.setAttribute('aria-label','Language');sw.innerHTML='<button type="button" data-lang="ru">RU</button><button type="button" data-lang="kk">KZ</button>';sw.addEventListener('click',e=>{const b=e.target.closest('[data-lang]');if(!b)return;lang=b.dataset.lang;localStorage.setItem('qr-lang',lang);apply();});
  const nav=$('.nav');if(nav){const cta=$('.nav-cta');nav.insertBefore(sw,cta);}
  apply();
})();