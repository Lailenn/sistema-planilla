export const initialSettings={isssRate:3,isssCap:1000,afpRate:7.25,employerIsss:7.5,employerAfp:8.75,debtLimit:20};
export const moneyRound=n=>Math.round((n+Number.EPSILON)*100)/100;
export function identify(d){
 if(d.personal==='yes'&&d.subordinate==='yes'&&d.paid==='yes')return 'labor';
 if(['yes','no'].includes(d.personal)&&d.subordinate==='no'&&d.paid==='yes')return 'services';
 return 'review';
}
export function calculate(d,c=initialSettings){
 const gross=moneyRound(d.gross+d.bonus+d.commission),labor=d.relationship==='labor';
 const isss=labor?moneyRound(Math.min(gross,c.isssCap)*c.isssRate/100):0;
 const afp=labor?moneyRound(gross*c.afpRate/100):0;
 const employerIsss=labor?moneyRound(Math.min(gross,c.isssCap)*c.employerIsss/100):0;
 const employerAfp=labor?moneyRound(gross*c.employerAfp/100):0;
 const taxBase=moneyRound(Math.max(0,gross-isss-afp));
 const appliedDebt=d.authorization==='yes'&&['ordinary','authorized','other'].includes(d.debtType)?d.debt:0;
 const deductions=moneyRound(isss+afp+d.food+appliedDebt+d.tax),net=moneyRound(gross-deductions);
 const limit=moneyRound(Math.max(0,gross-d.minimum)*c.debtLimit/100),alerts=[];
 const alert=(text,level='warning')=>alerts.push({text,level});
 const amount=n=>'$'+n.toFixed(2);
 const share=(n,base=gross)=>base>0?(n/base*100).toFixed(2)+'%':'porcentaje no calculable (base $0.00)';
 if(labor&&gross<d.minimum)alert(`El salario bruto registrado (${amount(gross)}) está por debajo del mínimo aplicable (${amount(d.minimum)}). Faltan ${amount(d.minimum-gross)} (${share(d.minimum-gross,d.minimum)} del mínimo). Confirma categoría y jornada.`,'error');
 if(d.debt>0&&d.authorization!=='yes')alert(`Descuento solicitado: ${amount(d.debt)} (${share(d.debt)} del bruto). No aplicado: falta fundamento legal o autorización documentada.`,'error');
 if(d.debt>0&&d.debtType==='none')alert(`Descuento de ${amount(d.debt)} (${share(d.debt)} del bruto) no aplicado: selecciona el tipo de deuda.`,'error');
 if(d.foodOrder==='yes')alert(`Orden de alimentos registrada: ${amount(d.food)} (${share(d.food)} del bruto como referencia). Verifica que coincida con la orden; no existe un porcentaje fijo en este modelo.`);
 if(d.food>0&&d.foodOrder!=='yes')alert(`Pensión alimenticia de ${amount(d.food)} (${share(d.food)} del bruto) sin orden registrada. Verifica el título o fundamento; el cálculo sigue siendo una simulación.`,'error');
 if(d.foodOrder==='yes'&&d.food===0)alert('Orden de alimentos registrada sin monto de retención.','error');
 if(isss>0&&d.isssState!=='paid')alert(`ISSS ${c.isssRate}% sobre ${amount(Math.min(gross,c.isssCap))}: ${amount(isss)} descontados. ${d.isssState==='pending'?'Pendiente de pago al ISSS; no implica por sí solo mora.':'Falta confirmar el pago al ISSS.'}`);
 if(afp>0&&d.afpState!=='paid')alert(`AFP ${c.afpRate}% sobre ${amount(gross)}: ${amount(afp)} descontados. ${d.afpState==='pending'?'Pendiente de pago a AFP; no implica por sí solo mora.':'Falta confirmar el pago a AFP.'}`);
 if(d.debt>0&&d.debtType==='ordinary'){
  alert(labor?`Deuda ordinaria: referencia de clase ${c.debtLimit}% × excedente de ${amount(Math.max(0,gross-d.minimum))} = ${amount(limit)}. Solicitado ${amount(d.debt)} (${share(d.debt)} del bruto). Verifica orden y límite legal; no se aplica ese porcentaje automáticamente a cualquier deuda.`:`Deuda ordinaria sobre honorarios: solicitado ${amount(d.debt)} (${share(d.debt)} del bruto). La referencia salarial del ${c.debtLimit}% no se extrapola a servicios.`);
  if(labor&&d.debt>limit)alert(`Deuda solicitada ${amount(d.debt)}: supera ${amount(limit)}, referencia de clase del ${c.debtLimit}% del excedente. Revisa el límite legal antes de realizar pagos.`,'error');
 }
 if(d.taxStatus!=='yes')alert(`ISR ingresado: ${amount(d.tax)} (${share(d.tax,taxBase)} de la base orientativa ${amount(taxBase)}; tasa efectiva, no tasa legal). Pendiente de validar la tabla o régimen: líquido provisional.`);
 const identification=identify(d);
 if(identification==='review'&&[d.personal,d.subordinate,d.paid].some(x=>x==='yes'||x==='no'))alert('Completa el cuestionario contractual iniciado para obtener una orientación.');
 if(identification==='labor'&&!labor)alert('Hay indicios de relación laboral aunque se declaró prestación de servicios. Requiere revisión; no se reclasifica automáticamente.','error');
 if(identification==='services'&&labor)alert('La ausencia declarada de subordinación requiere revisar la clasificación laboral.');
 if(!labor)alert('Honorarios: ISSS y AFP laborales no se aplican en esta simulación. Verifica régimen previsional, tributario y retenciones; no es una exención general.');
 if(d.bonus>0||d.commission>0)alert('Bonos y comisiones se tratan como ingresos ordinarios cotizables en esta simulación. Verifica su naturaleza real.');
 if(net<0)alert(`Deducciones ${amount(deductions)} (${share(deductions)} del bruto): superan el ingreso. Revisa los importes.`,'error');
 return{gross,isss,afp,employerIsss,employerAfp,taxBase,deductions,net,limit,alerts,identification,appliedDebt};
}
