(()=>{
  if(typeof form==='undefined'||!form) return;
  // Prevent duplicate onboarding controls if this script is loaded more than once.
  form.querySelectorAll('.onboarding-access-box').forEach(el=>el.remove());

  const panel=document.createElement('div');
  panel.className='onboarding-access-box';
  panel.innerHTML=`
    <div class="muted" style="margin-bottom:8px">ДОСТУП КЛИЕНТА</div>
    <div class="tariff-choice onboarding-access-choice">
      <label class="tariff-card">
        <input type="radio" name="create_access_mode" value="managed" checked>
        <span><strong>Без личного кабинета</strong><small>Меню создаётся, но управлять им будете только вы через главную админку.</small></span>
      </label>
      <label class="tariff-card">
        <input type="radio" name="create_access_mode" value="cabinet">
        <span><strong>Создать личный кабинет</strong><small>Клиент получит отдельный вход и сможет сам менять меню, цены, фотографии и данные заведения.</small></span>
      </label>
    </div>
    <div id="createCabinetFields" class="form-grid cols" hidden>
      <label><span class="muted">Логин клиента</span><input id="createClientUsername" autocomplete="off" placeholder="например: greenbar"></label>
      <label><span class="muted">Пароль клиента</span><div class="password-inline"><input id="createClientPassword" type="text" autocomplete="off" placeholder="минимум 8 символов"><button id="createPasswordGenerate" class="secondary" type="button">Сгенерировать</button></div></label>
    </div>`;
  const actions=form.querySelector('.edit-actions');
  form.insertBefore(panel,actions);

  const modes=[...panel.querySelectorAll('input[name="create_access_mode"]')];
  const fields=panel.querySelector('#createCabinetFields');
  const username=panel.querySelector('#createClientUsername');
  const password=panel.querySelector('#createClientPassword');
  const generate=panel.querySelector('#createPasswordGenerate');
  const randomPassword=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';const bytes=new Uint32Array(14);crypto.getRandomValues(bytes);return [...bytes].map(n=>alphabet[n%alphabet.length]).join('')};
  const cabinetSelected=()=>panel.querySelector('input[name="create_access_mode"]:checked')?.value==='cabinet';

  function sync(){
    fields.hidden=!cabinetSelected();
    if(cabinetSelected()){
      if(!username.value)username.value=slugify(nameInput.value).replace(/-/g,'').slice(0,32);
      if(!password.value)password.value=randomPassword();
    }
  }
  modes.forEach(r=>r.addEventListener('change',sync));
  generate.addEventListener('click',()=>password.value=randomPassword());
  nameInput.addEventListener('input',()=>{if(cabinetSelected()&&!username.dataset.manual)username.value=slugify(nameInput.value).replace(/-/g,'').slice(0,32)});
  username.addEventListener('input',()=>username.dataset.manual='1');
  sync();

  form.addEventListener('submit',async e=>{
    if(!cabinetSelected()) return;
    e.preventDefault();e.stopImmediatePropagation();
    statusEl.textContent='Создаём клиента и личный кабинет…';
    const body=Object.fromEntries(new FormData(form).entries());
    delete body.create_access_mode;
    body.slug=slugify(body.slug||body.name);
    const u=username.value.trim().toLowerCase(),p=password.value;
    if(!/^[a-z0-9._-]{3,40}$/.test(u)){statusEl.textContent='Логин: 3–40 символов, латиница/цифры.';return}
    if(p.length<8){statusEl.textContent='Пароль должен быть минимум 8 символов.';return}
    try{
      const created=await api('/api/admin/restaurants',{method:'POST',body:JSON.stringify(body)});
      await api(`/api/admin/restaurants/${created.id}/client-access`,{method:'POST',body:JSON.stringify({enabled:true,username:u,password:p})});
      const handoff=`QR Menu — ${created.name}\nВход: ${location.origin}/client\nЛогин: ${u}\nПароль: ${p}\nМеню: ${location.origin}/r/${created.slug}`;
      sessionStorage.setItem(`new-client-handoff:${created.id}`,handoff);
      form.reset();slugInput.dataset.manual='';username.dataset.manual='';fields.hidden=true;setCreateOpen(false);
      statusEl.textContent='Клиент и личный кабинет созданы. Данные для передачи готовы ниже.';
      await loadRestaurants();resetDishEdit();await openEditor(created.id);editorEl.scrollIntoView({behavior:'smooth',block:'start'});
      const loginCode=document.querySelector('#credentialLogin'),passwordCode=document.querySelector('#credentialPassword');
      if(loginCode)loginCode.textContent=u;if(passwordCode)passwordCode.textContent=p;
      if(clientAccessForm?.elements?.username)clientAccessForm.elements.username.value=u;
      if(clientAccessForm?.elements?.password)clientAccessForm.elements.password.value=p;
      const copyButton=document.querySelector('#copyClientAccess');if(copyButton)copyButton.focus();
    }catch(err){statusEl.textContent=err.message}
  },true);
})();