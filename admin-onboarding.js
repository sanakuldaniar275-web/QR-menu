(()=>{
  if(typeof form==='undefined'||!form) return;
  const panel=document.createElement('div');
  panel.className='onboarding-access-box';
  panel.innerHTML=`
    <label class="onboarding-check"><input id="createCabinetNow" type="checkbox"><span><strong>Сразу создать личный кабинет</strong><small>После создания вы получите ссылку, логин и пароль для передачи клиенту.</small></span></label>
    <div id="createCabinetFields" class="form-grid cols" hidden>
      <label><span class="muted">Логин клиента</span><input id="createClientUsername" autocomplete="off" placeholder="например: greenbar"></label>
      <label><span class="muted">Пароль клиента</span><div class="password-inline"><input id="createClientPassword" type="text" autocomplete="off" placeholder="минимум 8 символов"><button id="createPasswordGenerate" class="secondary" type="button">Сгенерировать</button></div></label>
    </div>`;
  const actions=form.querySelector('.edit-actions');
  form.insertBefore(panel,actions);
  const enabled=panel.querySelector('#createCabinetNow'),fields=panel.querySelector('#createCabinetFields'),username=panel.querySelector('#createClientUsername'),password=panel.querySelector('#createClientPassword'),generate=panel.querySelector('#createPasswordGenerate');
  const randomPassword=()=>{const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';const bytes=new Uint32Array(14);crypto.getRandomValues(bytes);return [...bytes].map(n=>alphabet[n%alphabet.length]).join('')};
  function sync(){fields.hidden=!enabled.checked;if(enabled.checked){if(!username.value)username.value=slugify(nameInput.value).replace(/-/g,'').slice(0,32);if(!password.value)password.value=randomPassword()}}
  enabled.addEventListener('change',sync);generate.addEventListener('click',()=>password.value=randomPassword());nameInput.addEventListener('input',()=>{if(enabled.checked&&!username.dataset.manual)username.value=slugify(nameInput.value).replace(/-/g,'').slice(0,32)});username.addEventListener('input',()=>username.dataset.manual='1');
  form.addEventListener('submit',async e=>{
    if(!enabled.checked)return;
    e.preventDefault();e.stopImmediatePropagation();
    statusEl.textContent='Создаём клиента и личный кабинет…';
    const body=Object.fromEntries(new FormData(form).entries());body.slug=slugify(body.slug||body.name);
    const u=username.value.trim().toLowerCase(),p=password.value;
    if(!/^[a-z0-9._-]{3,40}$/.test(u)){statusEl.textContent='Логин: 3–40 символов, латиница/цифры.';return}
    if(p.length<8){statusEl.textContent='Пароль должен быть минимум 8 символов.';return}
    try{
      const created=await api('/api/admin/restaurants',{method:'POST',body:JSON.stringify(body)});
      await api(`/api/admin/restaurants/${created.id}/client-access`,{method:'POST',body:JSON.stringify({enabled:true,username:u,password:p})});
      const handoff=`QR Menu — ${created.name}\nВход: ${location.origin}/client\nЛогин: ${u}\nПароль: ${p}\nМеню: ${location.origin}/r/${created.slug}`;
      sessionStorage.setItem(`new-client-handoff:${created.id}`,handoff);
      form.reset();slugInput.dataset.manual='';username.dataset.manual='';enabled.checked=false;fields.hidden=true;setCreateOpen(false);
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