/* ===== v3.9.2: Angriffswarnungen als überlappender Benachrichtigungs-Stapel (wie am Handy) ===== */
let AL_X=false;
function alRender(){const now=S.T;
 for(let i=ALS.length-1;i>=0;i--){const a=ALS[i],m=a.meta;
  if(m){const att=fleetById.get(m.aid);if(att&&!att.dead){const tg=m.kind==='fleet'?fleetById.get(m.id):planets[m.id];if(tg){const eta=Math.max(0,Math.round(Math.hypot(tg.x-att.x,tg.y-att.y)/fleetSpeed(att)/S.gs));a.text=a.text.replace(/Ankunft in ca\. \d+ s/,'Ankunft in ca. '+eta+' s')}}if(m.kind==='fleet'){const tp=fleetById.get(m.id);if(tp&&!tp.dead){a.x=tp.x;a.y=tp.y}}
   if(!att||att.dead||!att.order||att.order.type!=='atk'||att.order.id!==m.id||now-a.t>900)ALS.splice(i,1)}
  else if(now-a.t>(/abgewehrt/i.test(a.text)?6:25))ALS.splice(i,1)}
 const box=alBox(),list=ALS.slice(-6).reverse(),n=list.length;
 box.style.cssText='position:absolute;top:calc(var(--hh,90px) + 48px);left:50%;transform:translateX(-50%);width:min(92vw,28rem);z-index:30;pointer-events:none';
 if(n<2)AL_X=false;
 /* nicht mehr angezeigte Karten entfernen */
 for(const ch of Array.from(box.children)){if(ch.id==='alCollapse')continue;if(!ch._a||!list.includes(ch._a)){ch.remove()}}
 const cards=list.map(a=>{if(!a.el)a.el=alCard(a);const d=a.el;d._a=a;a.lbl.textContent=(a.meta?'⚠ ':'ℹ ')+a.text;
  if(!d.isConnected){d.style.opacity='0';d.style.transform='translateY(-18px) scale(.96)';box.appendChild(d);void d.offsetHeight}return d});
 for(const d of cards)d.style.height='auto';
 const hF=cards[0]?cards[0].offsetHeight:0;
 let ctl=document.getElementById('alCollapse');
 if(AL_X&&n>1){if(!ctl){ctl=document.createElement('div');ctl.id='alCollapse';ctl.style.cssText='position:absolute;left:0;right:0;text-align:center;font-size:11px;color:#fda4af;cursor:pointer;pointer-events:auto;padding:2px 0;transition:top .25s ease';ctl.onclick=()=>{AL_X=false;alRender()};box.appendChild(ctl)}
  ctl.textContent='▲ Einklappen'+(ALS.length>6?' • +'+(ALS.length-6)+' weitere':'')}
 else if(ctl)ctl.remove();
 let y=0;
 cards.forEach((d,i)=>{const a=d._a;a.bdg.textContent='+'+(n-1);a.bdg.style.display=(!AL_X&&i===0&&n>1)?'':'none';
  if(AL_X){const h=d.offsetHeight;d.style.top=y+'px';d.style.transform='none';d.style.opacity='1';d.style.zIndex=40-i;d.style.pointerEvents='auto';d.style.overflow='';
   for(const c of d.children)c.style.visibility='';y+=h+6}
  else if(i<4){d.style.height=hF+'px';d.style.top=i*9+'px';d.style.transform='scale('+(1-i*.045).toFixed(3)+')';d.style.opacity=String(Math.max(.3,1-i*.22));d.style.zIndex=40-i;d.style.pointerEvents='auto';d.style.overflow='hidden';
   for(const c of d.children)c.style.visibility=i?'hidden':''}
  else{d.style.top='27px';d.style.transform='scale(.86)';d.style.opacity='0';d.style.pointerEvents='none'}});
 if(AL_X){const ctl2=document.getElementById('alCollapse');if(ctl2){ctl2.style.top=y+'px';y+=20}box.style.height=Math.max(0,y-6)+'px'}
 else box.style.height=(hF+Math.min(3,Math.max(0,n-1))*9)+'px'}
function alCard(a){const d=document.createElement('div');
 d.className='glass-panel-rose rounded-lg border border-rose-500/60 px-3 py-1.5 flex items-center justify-between shadow-2xl cursor-pointer';
 d.style.cssText='position:absolute;left:0;right:0;top:0;transition:top .28s ease,transform .28s ease,opacity .28s ease;transform-origin:top center;pointer-events:auto';
 d.onclick=()=>{const front=ALS[ALS.length-1];if(!AL_X&&front!==a&&ALS.length>1){AL_X=true;alRender()}else jumpTo(a.x,a.y)};
 const l=document.createElement('div');l.className='text-xs text-slate-200';d.appendChild(l);a.lbl=l;
 const r=document.createElement('div');r.className='flex items-center';r.style.flex='none';
 const bd=document.createElement('button');bd.className='text-[10px] text-rose-200 border border-rose-500/60 rounded-full px-1.5 ml-2';bd.style.display='none';bd.title='Alle Warnungen anzeigen';
 bd.onclick=e=>{e.stopPropagation();AL_X=true;alRender()};a.bdg=bd;r.appendChild(bd);
 if(a.meta){const b=document.createElement('button');b.className='px-2 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-[11px] whitespace-nowrap ml-2';b.textContent='Rückzug';b.onclick=e=>{e.stopPropagation();lastAlert=a;doRetreat();alRemove(a)};r.appendChild(b)}
 const x=document.createElement('button');x.className='text-rose-400 text-sm ml-2';x.textContent='✕';x.onclick=e=>{e.stopPropagation();alRemove(a)};r.appendChild(x);
 d.appendChild(r);return d}
