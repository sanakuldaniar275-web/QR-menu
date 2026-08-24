(()=>{
  if(typeof form==='undefined'||!form) return;
  form.querySelectorAll('.onboarding-access-box,.business-type-box').forEach(el=>el.remove());

  const business=document.createElement('div');
  business.className='business-type-box';
  business.innerHTML=`
    <div class="muted" style="margin-bottom:8px">ТИП QR-КАТАЛОГА</div>
    <label><span class="muted">Что создаём?</span>
      <select id="createBusinessType" name="business_type">
        <option value="food">Ресторан / кафе / бар</option>
        <option value="products">Магазин / товары</option>
        <option value="flowers">Цветочный магазин</option>
        <option value="auto">Автосалон</option>
        <option value="services">Услуги</option>
        <option value="other">Другое</option>
      </select>
    </label>
    <p id="businessTypeHint" class="muted" style="margin:8px 0 0">Категории и блюда, цены, фото и варианты.</p>`;
  form.insertBefore(business,form.firstChild);
  const businessType=business.querySelector('#createBusinessType'),hint=business.querySelector('#businessTypeHint');
  const hints={food:'Категории и блюда, цены, фото и варианты.',products:'Категории и товары, цены, фото, описание и варианты.',flowers:'Категории и товары: букеты, цветы, композиции и подарки.',auto:'Категории и автомобили: фото, цена, описание и комплектации.',services:'Категории и услуги: описание, цена и фотографии.',other:'Универсальный QR-каталог с категориями и позициями.'};
  function syncBusiness(){hint.textContent=hints[businessType.value]||hints.other;const service=form.elements.service;const holder=service?.closest('label');if(holder)holder.hidden=businessType.value!=='food';}
  businessType.addEventListener('change',syncBusiness);syncBusiness();

  const panel=document.createElement('div');
  panel.className='onboarding-access-box';
  panel.innerHTML=`
    <div class="muted" style="margin-bottom:8px">ДОСТУП КЛИЕНТА</div>
    <div class="tariff-choice onboarding-access-choice">
      <label class="tariff-card"><input type="radio" name="create_access_mode" value="managed" checked><span><strong>Без личного кабинета</strong><small>Каталог создаётся, но управлять им будете только вы через главную админку.</small></span></label>
      <label class="tariff-card"><input type="radio" name="create_access_mode" value="cabinet"><span><strong>Создать личный кабинет</strong><small>Клиент получит отдельный вход и сможет сам менять каталог, цены, фотографии и данные компании.</small></span></label>
    </div>
    <div id="createCabinetFields" class="form-grid cols" hidden>
      <label><span class="muted">Логин клиента</span><input id="createClientUsername" autocomplete="off" placeholder="например: kaskelenfilter"></label>
      <label><span class="muted">Пароль клиента</span><div class="password-inline"><input id="createClientPassword" type="text" autocomplete="off" placeholder="минимум 8 символов"><button id="createPasswordGenerate" class="secondary" type="button">Сгенерировать</button></div></label>
    </div>`;
  const actions=form.querySelector('.edit-actions');form.insertBefore(panel,actions);
  const modes=[...panel.querySelectorAll('input[name="create_access_mode"]')],fields=panel.querySelector('#createCabinetFields'),username=panel.querySelector('#createClientUsername'),password=panel.querySelector('#createClientPassword'),generate=panel.querySelector('#createPasswordGenerate');
  const randomPassword=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';const bytes=new Uint32Array(14);crypto.getRandomValues(bytes);return [...bytes].map(n=>alphabet[n%alphabet.length]).join('')};
  const cabinetSelected=()=>panel.querySelector('input[name="create_access_mode"]:checked')?.value==='cabinet';
  function sync(){fields.hidden=!cabinetSelected();if(cabinetSelected()){if(!username.value)username.value=slugify(nameInput.value).replace(/-/g,'').slice(0,32);if(!password.value)password.value=randomPassword()}}
  modes.forEach(r=>r.addEventListener('change',sync));generate.addEventListener('click',()=>password.value=randomPassword());nameInput.addEventListener('input',()=>{if(cabinetSelected()&&!username.dataset.manual)username.value=slugify(nameInput.value).replace(/-/g,'').slice(0,32)});username.addEventListener('input',()=>username.dataset.manual='1');sync();

  form.addEventListener('submit',()=>{sessionStorage.setItem('pending-business-type',businessType.value)},true);
  form.addEventListener('submit',async e=>{
    if(!cabinetSelected()) return;
    e.preventDefault();e.stopImmediatePropagation();statusEl.textContent='Создаём клиента и личный кабинет…';
    const body=Object.fromEntries(new FormData(form).entries());delete body.create_access_mode;delete body.business_type;body.slug=slugify(body.slug||body.name);
    const u=username.value.trim().toLowerCase(),p=password.value;if(!/^[a-z0-9._-]{3,40}$/.test(u)){statusEl.textContent='Логин: 3–40 символов, латиница/цифры.';return}if(p.length<8){statusEl.textContent='Пароль должен быть минимум 8 символов.';return}
    try{const created=await api('/api/admin/restaurants',{method:'POST',body:JSON.stringify(body)});localStorage.setItem(`qr-business-type:${created.slug}`,businessType.value);await api(`/api/admin/restaurants/${created.id}/client-access`,{method:'POST',body:JSON.stringify({enabled:true,username:u,password:p})});const handoff=`QR Menu — ${created.name}\nВход: ${location.origin}/client\nЛогин: ${u}\nПароль: ${p}\nКаталог: ${location.origin}/r/${created.slug}`;sessionStorage.setItem(`new-client-handoff:${created.id}`,handoff);form.reset();slugInput.dataset.manual='';username.dataset.manual='';fields.hidden=true;setCreateOpen(false);statusEl.textContent='Клиент и личный кабинет созданы.';await loadRestaurants();resetDishEdit();await openEditor(created.id);editorEl.scrollIntoView({behavior:'smooth',block:'start'});const loginCode=document.querySelector('#credentialLogin'),passwordCode=document.querySelector('#credentialPassword');if(loginCode)loginCode.textContent=u;if(passwordCode)passwordCode.textContent=p;if(clientAccessForm?.elements?.username)clientAccessForm.elements.username.value=u;if(clientAccessForm?.elements?.password)clientAccessForm.elements.password.value=p;}catch(err){statusEl.textContent=err.message}
  },true);
})();