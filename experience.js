export function initializeExperience({form,calculate,current,getSettings,formatMoney}){
 const controls=Object.fromEntries([...form.elements].filter(e=>e.name).map(e=>[e.name,e]));
 const $=s=>document.querySelector(s),field=n=>controls[n],label=n=>field(n).closest('label');
 const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e;};
 const oldSteps=$('.steps');oldSteps.remove();
 const head=$('.panel-head');head.classList.add('wizard-heading');
 const nav=make('nav','wizard-nav');nav.setAttribute('aria-label','Pasos del registro');
 const titles=['Datos del trabajador','Deducciones y controles','Revisar y agregar'];
 titles.forEach((text,i)=>{const b=make('button','wizard-tab',`<span>${i+1}</span><strong>${text}</strong>`);b.type='button';b.dataset.step=i;b.addEventListener('click',()=>go(i,true));nav.append(b);});
 head.after(nav);
 const panes=titles.map((text,i)=>{const section=make('section','wizard-pane');section.id='step-'+i;section.setAttribute('aria-label',text);return section;});
 const grid=()=>make('div','fields');
 const first=grid();for(const n of ['name','role','gross','type'])first.append(label(n));
 label('gross').firstChild.textContent='Salario bruto mensual ($)';
 label('gross').append(make('small','','Importe antes de descuentos. No vuelvas a incluir aquí los bonos adicionales.'));
 panes[0].append(first);
 const relation=$('.relationship-box');panes[0].append(relation);relation.style.marginTop='22px';
 const minimum=grid();minimum.append(label('category'),label('minimum'));panes[0].append(minimum);
 const extras=make('details','optional-block','<summary>Bonos y comisiones <span>Opcional</span></summary><p>Solo agrega ingresos que no estén incluidos en el salario bruto anterior.</p>');const extraGrid=grid();extraGrid.append(label('bonus'),label('commission'));extras.append(extraGrid);panes[0].append(extras);
 const autoHelp=$('.auto-help'),contributions=$('.contributions');panes[1].append(autoHelp,contributions);
 const food=make('details','optional-block','<summary>Pensión alimenticia <span>Cuando corresponda</span></summary>');const foodGrid=grid();foodGrid.append(label('foodOrder'),label('food'));food.append(foodGrid);panes[1].append(food);
 const debt=make('details','optional-block','<summary>Deudas y otros descuentos <span>Cuando corresponda</span></summary><p>Registra el importe solicitado y confirma el fundamento que permite descontarlo.</p>');const debtGrid=grid();for(const n of ['debt','debtType','authorization'])debtGrid.append(label(n));debt.append(debtGrid,make('div','debt-preview'));panes[1].append(debt);
 const tax=make('details','optional-block','<summary>ISR <span>Ingreso manual</span></summary><p>El ISR se registra aparte. Valida el importe del mes con la tabla o régimen correspondiente.</p>');const taxGrid=grid();taxGrid.append(label('tax'),label('taxStatus'));tax.append(taxGrid);panes[1].append(tax);
 const payment=grid();payment.append(label('frequency'),label('method'));panes[2].append(make('div','review-summary'),payment,make('div','review-decision'));
 const actions=$('.form-actions'),error=$('#form-error'),micro=$('.micro');
 // All original controls have moved into the new panels; remove only empty layout wrappers.
 form.replaceChildren(...panes,error,actions,micro);
 const back=make('button','secondary','Anterior');back.type='button';back.addEventListener('click',()=>go(active-1,false));
 const next=make('button','primary','Continuar →');next.type='button';next.addEventListener('click',()=>go(active+1,true));
 actions.prepend(back);actions.append(next);
 const submit=$('#submit-button');let active=0;
 function reveal(element){const pane=element.closest('.wizard-pane');if(pane){active=panes.indexOf(pane);show();}for(let p=element.parentElement;p&&p!==form;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;}element.focus();element.reportValidity();}
 function check(scope){for(const e of scope.querySelectorAll('input,select')){if(['name','role'].includes(e.name))e.setCustomValidity(e.value.trim()?'':'Completa este dato.');if(!e.disabled&&e.willValidate&&!e.checkValidity()){reveal(e);return false;}}return true;}
 function go(index,validate){index=Math.max(0,Math.min(2,index));if(index>active&&validate){for(let i=0;i<index;i++)if(!check(panes[i]))return;}active=index;show();nav.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}
 function show(){panes.forEach((p,i)=>p.hidden=i!==active);nav.querySelectorAll('button').forEach((b,i)=>{b.classList.toggle('selected',i===active);if(i===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});back.hidden=active===0;next.hidden=active===2;submit.hidden=active!==2;$('#reset').textContent=active===0?'Limpiar':'Cancelar';update();}
 function update(){
  const d=current(),r=calculate(d,getSettings()),ready=field('gross').value!==''&&['gross','bonus','commission','food','debt','tax','minimum'].every(n=>Number.isFinite(d[n])&&d[n]>=0);
  // Use text nodes for all user values.
  const summary=$('.review-summary');summary.replaceChildren();
  const title=make('h3','');title.textContent=d.name.trim()||'Trabajador por completar';summary.append(title);
  const subtitle=make('p','');subtitle.textContent=(d.role||'Cargo por completar')+' · '+(d.relationship==='labor'?'Contrato individual':'Prestación de servicios');summary.append(subtitle);
  for(const [name,value] of [['Ingreso bruto',r.gross],['Deducciones aplicadas',r.deductions],['Líquido calculado',r.net]]){const line=make('div','summary-line');const caption=make('span','');caption.textContent=name;const amount=make('strong','');amount.textContent=ready?formatMoney(value):'—';line.append(caption,amount);summary.append(line);}
  const outstanding=r.alerts.length;$('.review-decision').textContent=!ready?'Completa importes válidos antes de agregar.':outstanding?`${outstanding} avisos para revisar. Puedes agregar este registro a la planilla del ejercicio; no se realizará ningún pago.`:'Registro listo para agregar al ejercicio. No se realiza ningún pago.';
  $('.debt-preview').textContent=d.debt>0?`Solicitado: ${formatMoney(d.debt)} · Aplicado: ${formatMoney(r.appliedDebt)} · Pendiente de aplicar: ${formatMoney(d.debt-r.appliedDebt)}`:'Sin otros descuentos registrados.';
  label('gross').firstChild.textContent=d.relationship==='labor'?'Salario bruto mensual ($)':'Honorarios del mes ($)';
  for(const n of ['minimum','category','type'])label(n).hidden=d.relationship!=='labor';
  // The contract questionnaire remains optional; show only intentional unresolved answers.
 }
 form.noValidate=true;
 form.addEventListener('submit',e=>{if(!check(form)){e.preventDefault();e.stopImmediatePropagation();}},true);
 form.addEventListener('input',e=>{if(['name','role'].includes(e.target.name))e.target.setCustomValidity('');update();});form.addEventListener('change',update);
 form.addEventListener('reset',()=>queueMicrotask(()=>{active=0;food.open=false;debt.open=false;tax.open=false;extras.open=false;show();}));
 $('#rows').addEventListener('click',e=>{if(e.target.closest('[data-edit]')){active=0;show();queueMicrotask(update);}},true);
 $('#settings-form').addEventListener('submit',()=>queueMicrotask(update));
 $('#example').addEventListener('click',()=>{active=0;show();});
 $('#worker-form').addEventListener('submit',()=>queueMicrotask(update));
 show();
 return{update};
}
