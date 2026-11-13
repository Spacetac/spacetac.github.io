/* ===== v3.7: Fadenkreuz in der echten Welt, Reichweiten-Detonation, Raketen gegen Schilde/Flaks, Bot-Beschuss bewegter Ziele ===== */
(function(){
const FLAK_HP=3000;let RK2=null,_sl=-99,_al=-99;
const findSh=id=>{let s=(S.sh||[]).find(x=>x.id===id);if(s)return{s,o:0};s=(S.xs||[]).find(x=>x.id===id);return s?{s,o:s.o}:null};
const findFk=id=>{let a=(S.aa||[]).find(x=>x.id===id);if(a)return{a,o:0,L:S.aa};a=(S.xa||[]).find(x=>x.id===id);return a?{a,o:a.o,L:S.xa}:null};
const _tp9=targetPos;
targetPos=function(o){if(o){
 if(o.kind==='pos'){const [x,y]=String(o.id).split(',').map(Number);return{x,y,owner:-1,name:'Zielpunkt'}}
 if(o.kind==='shield'){const q=findSh(o.id);return q?{x:q.s.x,y:q.s.y,owner:q.o,name:q.o?'Gegnerisches Schutzschild':'Eigenes Schutzschild'}:null}
 if(o.kind==='flak'){const q=findFk(o.id);if(!q||!planets[q.a.pid])return null;const p=aaPos(q.a);return{x:p.x,y:p.y,owner:q.o,name:q.o?'Gegnerische Flak-Plattform':'Eigene Flak-Plattform'}}}
 return _tp9(o)};
function hitSh(q,d){const ai=q.o?AIS[q.o-1]:null,mx=ai?SH_HP*(1+ai.tech*.05):shHP();q.s.q=Math.max(0,q.s.q-d/mx);q.s.fl=performance.now();
 if(!q.o&&S.T-_al>10){_al=S.T;pushAlert('Raketenangriff auf dein Schutzschild!',q.s.x,q.s.y)}}
function hitFk(q,d){const ai=q.o?AIS[q.o-1]:null,a=q.a;a.hp=(a.hp===undefined?FLAK_HP*(ai?1+ai.tech*.03:1):a.hp)-d;
 if(!q.o&&S.T-_al>10){_al=S.T;const p=aaPos(a);pushAlert('Raketenangriff auf deine Flak-Plattform!',p.x,p.y)}
 if(a.hp<=0){const i=q.L.indexOf(a);if(i>=0)q.L.splice(i,1);const p=planets[a.pid]?aaPos(a):{x:0,y:0};FX.push({k:'boom',t0:performance.now(),dur:700,x1:p.x,y1:p.y,s:40,c:'#e879f9'});addLog('[FLAK] Eine Flak-Plattform wurde durch Raketen zerstört!',p.x,p.y);refreshUI()}}
function flaksOf(pid,d){const L=[...(S.aa||[]).filter(a=>a.pid===pid).map(a=>({a,o:0,L:S.aa})),...(S.xa||[]).filter(a=>a.pid===pid).map(a=>({a,o:a.o,L:S.xa}))];for(const q of L)hitFk(q,d)}
function domeHit(r){if(r.o!==0)for(const s of S.sh||[])if(S.T>=s.t0&&Math.hypot(r.x-s.x,r.y-s.y)<=shR())return{s,o:0};
 for(const s of S.xs||[]){if(s.o===r.o||S.T<s.t0)continue;const ai=AIS[s.o-1];if(ai&&Math.hypot(r.x-s.x,r.y-s.y)<=SH_R*(1+ai.tech*.02))return{s,o:s.o}}return null}
function aoe(r){const R=250,nw=performance.now(),o=r.o;FX.push({k:'boom',t0:nw,dur:650,x1:r.x,y1:r.y,s:40,c:'#fb923c'});FX.push({k:'wave',t0:nw,dur:700,x1:r.x,y1:r.y,s:R*1.3,c:'#fb923c'});
 for(const f of nearby(r.x,r.y,R,e=>e.owner!==o&&!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>0))hitFleet(f,r.d,1);
 const cx=cellX(r.x),cy=cellY(r.y);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const p=planetAt(cx+dx,cy+dy);if(p&&p.owner!==o&&Math.hypot(p.x-r.x,p.y-r.y)<=R+p.r){planetHit(p,r.d*.6);flaksOf(p.id,r.d*.3)}}
 for(const s of [...(S.sh||[]).map(s=>({s,o:0})),...(S.xs||[]).map(s=>({s,o:s.o}))])if(s.o!==o&&Math.hypot(s.s.x-r.x,s.s.y-r.y)<=R+60)hitSh(s,r.d*(r.sz==='S'?.5:1));
 for(const a of [...(S.aa||[]).map(a=>({a,o:0,L:S.aa})),...(S.xa||[]).map(a=>({a,o:a.o,L:S.xa}))]){if(a.o===o||!planets[a.a.pid])continue;const p=aaPos(a.a);if(Math.hypot(p.x-r.x,p.y-r.y)<=R)hitFk(a,r.d*(r.sz==='S'?.5:1))}
 playSound('boom');refreshUI()}
const _ri9=rkImpact;
rkImpact=function(r,t){const k=r.t.kind;
 if(k==='shield'){const q=findSh(r.t.id);FX.push({k:'boom',t0:performance.now(),dur:600,x1:r.x,y1:r.y,s:26,c:'#38bdf8'});if(q)hitSh(q,r.d*(r.sz==='S'?.5:1));playSound('boom');return}
 if(k==='flak'){const q=findFk(r.t.id);FX.push({k:'boom',t0:performance.now(),dur:600,x1:r.x,y1:r.y,s:26,c:'#e879f9'});if(q)hitFk(q,r.d*(r.sz==='S'?.5:1));playSound('boom');return}
 if(k==='pos'){aoe(r);return}
 if(k==='fleet'){const res=_ri9(r,t);for(const f of nearby(r.x,r.y,140,e=>e.owner!==r.o&&!e.dead&&e.id!==r.t.id&&(e.owner>0||e.placed)&&basePower(e.ships)>0))hitFleet(f,r.d*.5,1);return res}
 if(k==='planet'){const res=_ri9(r,t);flaksOf(r.t.id,r.d*.5);refreshUI();return res}
 return _ri9(r,t)};
/* Reichweite: Ziel entkommt -> Rakete detoniert im Raum */
const _rt1=rkTick;
rkTick=function(g){try{for(let i=RKT.length-1;i>=0;i--){const r=RKT[i];if(r.dl>0)continue;
 if(r.ox===undefined){r.ox=r.x;r.oy=r.y;r.px=r.x;r.py=r.y;r.tv=0;r.R=r.o===0?RK_R*(1+tb('rrng')):RK_BOT_R}else{r.tv+=Math.hypot(r.x-r.px,r.y-r.py);r.px=r.x;r.py=r.y}
 const bl=domeHit(r);if(bl){const nw=performance.now();FX.push({k:'boom',t0:nw,dur:650,x1:r.x,y1:r.y,s:30,c:'#38bdf8'});FX.push({k:'wave',t0:nw,dur:600,x1:r.x,y1:r.y,s:120,c:'#38bdf8'});hitSh(bl,r.d);playSound('boom');RKT.splice(i,1);continue}
 const t=targetPos(r.t);if(!t)continue;
 if(Math.hypot(t.x-r.ox,t.y-r.oy)>r.R*1.2||r.tv>r.R*1.9){const nw=performance.now();FX.push({k:'boom',t0:nw,dur:600,x1:r.x,y1:r.y,s:20,c:'#fbbf24'});FX.push({k:'wave',t0:nw,dur:500,x1:r.x,y1:r.y,s:90,c:'#fbbf24'});
  if(r.o===0&&S.T-_sl>4){_sl=S.T;addLog('[RAKETE] Ziel außer Reichweite – Raketen im Raum detoniert.',r.x,r.y)}RKT.splice(i,1)}}}catch(e){console.warn(e)}
 _rt1(g)};
/* Bots: bewegte Ziele, Schilde, Flaks */
let _bq=0;const _bt1=botTick;
botTick=function(g){_bt1(g);try{_bq+=g;if(_bq<4)return;_bq=0;
 for(const f of fleets){if(f.owner<=0||f.dead||!f.rk||!f.rk.length||S.T<(f.fq||0))continue;const ai=AIS[f.owner-1];if(!ai||ai.dead)continue;f.fq=S.T+7+Math.random()*9;const Rb=RK_BOT_R*.9;
  const mv=nearby(f.x,f.y,Rb,e=>e.owner!==f.owner&&!e.dead&&(e.owner>0||e.placed)&&e.order&&e.order.type!=='mine'&&basePower(e.ships)>0).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y)-Math.hypot(b.x-f.x,b.y-f.y));
  if(mv.length&&Math.random()<.35+(ai.skill||0)*.4){let pi=0;f.rk.forEach((p,i)=>{if(p.n>f.rk[pi].n)pi=i});fireRk(f,pi,{kind:'fleet',id:mv[0].id});continue}
  if(Math.random()>.3)continue;let best=null,bd=Rb;
  const chk=(kind,id,x,y,o)=>{if(o===f.owner)return;const d=Math.hypot(x-f.x,y-f.y);if(d<bd){bd=d;best={kind,id}}};
  for(const s of S.sh||[])chk('shield',s.id,s.x,s.y,0);for(const s of S.xs||[])chk('shield',s.id,s.x,s.y,s.o);
  for(const a of S.aa||[])if(planets[a.pid]){const p=aaPos(a);chk('flak',a.id,p.x,p.y,0)}for(const a of S.xa||[])if(planets[a.pid]){const p=aaPos(a);chk('flak',a.id,p.x,p.y,a.o)}
  if(best){let pi=0;f.rk.forEach((p,i)=>{if(p.d>f.rk[pi].d)pi=i});fireRk(f,pi,best)}}}catch(e){console.warn(e)}};
/* ===== Fadenkreuz-Zielsystem in der echten Spielwelt ===== */
function cands(x,y,rad){const out=[];
 for(const e of nearby(x,y,rad,e=>e.owner!==0&&!e.dead&&fleetVis(e)>.5))out.push({kind:'fleet',id:e.id,x:e.x,y:e.y,name:e.name,owner:e.owner});
 const k=Math.max(1,Math.ceil(rad/CELL)),cx=cellX(x),cy=cellY(y);
 for(let dy=-k;dy<=k;dy++)for(let dx=-k;dx<=k;dx++){const p=planetAt(cx+dx,cy+dy);if(p&&p.owner!==0&&Math.hypot(p.x-x,p.y-y)<=rad+p.r)out.push({kind:'planet',id:p.id,x:p.x,y:p.y,name:p.name,owner:p.owner})}
 const nr=(a,b)=>Math.hypot(a-x,b-y)<=rad;
 for(const m of S.xm||[])if(nr(m.x,m.y))out.push({kind:'mine',id:m.id,x:m.x,y:m.y,name:'Gegnerische Mine',owner:m.o});
 for(const s of S.xs||[])if(nr(s.x,s.y))out.push({kind:'shield',id:s.id,x:s.x,y:s.y,name:'Gegnerisches Schutzschild ('+Math.round(s.q*100)+'%)',owner:s.o});
 for(const a of S.xa||[]){if(!planets[a.pid])continue;const q=aaPos(a);if(nr(q.x,q.y))out.push({kind:'flak',id:a.id,x:q.x,y:q.y,name:'Gegnerische Flak-Plattform',owner:a.o})}
 try{for(const [pe,r] of NET.rem){for(const a of r.fl)if(nr(a[1],a[2]))out.push({kind:'rf',id:pe+':'+a[0],x:a[1],y:a[2],name:r.n+' (Freund)',owner:-9});for(const i of r.pl){const p=planets[i];if(p&&nr(p.x,p.y))out.push({kind:'rp',id:pe+':'+i,x:p.x,y:p.y,name:r.n+': '+p.name,owner:-9})}}}catch(e){}
 return out}
const coarse=()=>matchMedia('(pointer:coarse)').matches;
openRocket=function(fid,pre){const f=fleetById.get(fid);if(!f||f.owner!==0||!f.placed||!f.rk||!f.rk.length){toast('Keine Raketen oder Flotte nicht platziert.');return}
 closeModal();closeModal2();closeRk();closeTarget();$('hintBar').classList.add('hidden');
 RK2={fid,pk:0,x:f.x,y:f.y,lock:null,fix:pre?{kind:pre.kind,id:pre.id}:null};
 if(pre){const tp=targetPos(pre);if(tp){RK2.x=tp.x;RK2.y=tp.y;cam.x=(f.x+tp.x)/2;cam.y=(f.y+tp.y)/2}}else{RK2.x=f.x+400;RK2.y=f.y}
 const d=document.createElement('div');d.id='rk2Hud';d.className='glass-panel rounded-xl p-2 text-xs';
 d.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(var(--hh,60px) + 6px);z-index:45;width:min(94vw,500px)';
 d.innerHTML=`<div class="flex justify-between items-center"><b class="font-orbitron text-rose-300"><i class="fa-solid fa-crosshairs"></i> ${f.name}</b><button class="nb" onclick="closeRk()" title="Zielmodus beenden">✕</button></div><div id="rk2Info" class="text-slate-300 my-1"></div><div id="rk2Btns"></div>`;
 document.body.appendChild(d);RK2.iv=setInterval(rk2Ui,150);rk2Ui();playSound('click')};
function rk2Close(){if(RK2){clearInterval(RK2.iv);RK2=null}const d=document.getElementById('rk2Hud');if(d)d.remove()}
const _cr=closeRk;closeRk=function(){_cr();rk2Close()};
window.rk2Pick=i=>{if(RK2)RK2.pk=i;rk2Ui()};
window.rk2Fix=()=>{if(!RK2)return;if(RK2.fix){RK2.fix=null;toast('Fixierung gelöst.')}else if(RK2.lock){RK2.fix={kind:RK2.lock.kind,id:RK2.lock.id};toast('Ziel fixiert – Raketen verfolgen es.')}rk2Ui()};
window.rk2Fire=()=>{const R=RK2;if(!R)return;const f=fleetById.get(R.fid);if(!f)return closeRk();
 const tg=R.lock?{kind:R.lock.kind,id:R.lock.id}:{kind:'pos',id:Math.round(R.x)+','+Math.round(R.y)};
 if(fireRk(f,R.pk,tg)){toast('Raketen gestartet auf '+(R.lock?R.lock.name:'Zielpunkt')+'!');R.pk=0;if(!f.rk.length)closeRk();else rk2Ui();refreshUI()}else toast('Außer Reichweite (max. '+fmt(rkRange())+').')};
function rk2Ui(){const R=RK2;if(!R)return;const f=fleetById.get(R.fid);if(!f||f.dead||!f.rk||!f.rk.length){closeRk();return}
 const L=R.lock,px=L?L.x:R.x,py=L?L.y:R.y,rg=rkRange(),d=Math.hypot(px-f.x,py-f.y),far=d>rg,mul=1+tb('rdmg');
 $('rk2Info').innerHTML=(L?`Ziel: <b class="text-rose-300">${L.name}</b>${R.fix?' 🔒':''}`:'Freier Zielpunkt (Flächenschaden)')+` • ${fmt(d)} / ${fmt(rg)}${far?' <b class="text-amber-300">außer Reichweite</b>':''} • Flug ca. ${Math.round(d/RK_V*1.15)} s<br><span class="text-slate-400">${coarse()?'Tippen: Ziel fixieren (Leere = Punkt setzen) • Fadenkreuz ziehen • Karte wischen':'Maus: zielen • Klick: Punkt setzen • Doppelklick: Ziel fixieren • Enter: Abschuss • F: fixieren'} • Flieht das Ziel aus der Reichweite, detonieren die Raketen im Raum.</span>`;
 setHtml($('rk2Btns'),`<div class="flex flex-wrap gap-1 mb-1">${f.rk.map((p,i)=>btn(`${RKD[p.t].nm} ×${p.n} • ${fmt(p.d*mul)}`,`rk2Pick(${i})`,i===R.pk?'amber':'slate')).join('')}</div><div class="flex justify-end gap-2">${btn(R.fix?'Fixierung lösen':'Fixieren','rk2Fix()','amber',!L&&!R.fix)}${btn('<i class="fa-solid fa-bullseye"></i> Abschuss','rk2Fire()','rose',far)}</div>`)}
/* Eingabe: Tippen/Klicken setzt Ziel, Fadenkreuz ziehbar, Maus zielt */
const _ot=onTap;
onTap=function(x,y){if(!RK2)return _ot(x,y);const R=RK2,touch=R.pt==='touch'||R.pt==='pen',z=cam.zoom,rad=(coarse()?44:30)/z,[wx,wy]=s2w(x,y);
 const n=performance.now(),dbl=n-(R.tt||0)<400&&Math.hypot(x-(R.tx||0),y-(R.ty||0))<24;R.tt=n;R.tx=x;R.ty=y;
 let best=null,bd=1e9;for(const o of cands(wx,wy,rad)){const d=Math.hypot(o.x-wx,o.y-wy);if(d<bd){bd=d;best=o}}
 if(touch||dbl){if(best){R.fix={kind:best.kind,id:best.id};R.x=best.x;R.y=best.y;R.hold=true;playSound('click');toast('Ziel fixiert – Raketen verfolgen es.')}else if(touch){R.fix=null;R.x=clamp(wx,-HALF,HALF);R.y=clamp(wy,-HALF,HALF);R.hold=true}}
 else{R.fix=null;R.hold=true;R.x=clamp(wx,-HALF,HALF);R.y=clamp(wy,-HALF,HALF)}rk2Ui()};
let dragId=null;const chPos=()=>{const R=RK2,L=R.lock;return w2s(L?L.x:R.x,L?L.y:R.y)};
cv.addEventListener('pointerdown',e=>{if(!RK2)return;RK2.pt=e.pointerType;if(RK2.fix)return;const [sx,sy]=chPos();if(Math.hypot(e.clientX-sx,e.clientY-sy)<(e.pointerType==='touch'?52:30)){dragId=e.pointerId;try{cv.setPointerCapture(e.pointerId)}catch(_){}e.stopImmediatePropagation();e.preventDefault()}},true);
cv.addEventListener('pointermove',e=>{if(!RK2)return;if(dragId===e.pointerId){const [wx,wy]=s2w(e.clientX,e.clientY);RK2.x=clamp(wx,-HALF,HALF);RK2.y=clamp(wy,-HALF,HALF);RK2.hold=true;e.stopImmediatePropagation();return}
 if(!RK2.fix&&!RK2.hold&&e.pointerType==='mouse'&&!e.buttons){const [wx,wy]=s2w(e.clientX,e.clientY);RK2.x=clamp(wx,-HALF,HALF);RK2.y=clamp(wy,-HALF,HALF)}},true);
['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,e=>{if(dragId===e.pointerId){dragId=null;e.stopImmediatePropagation()}},true));
document.addEventListener('keydown',e=>{if(!RK2)return;if(e.key==='Escape')closeRk();else if(e.key==='Enter'){e.preventDefault();rk2Fire()}else if(e.key==='f'||e.key==='F')rk2Fix()});
/* Zeichnen über der echten Karte */
const _r9=render;
render=function(){_r9();try{if(!RK2)return;const R=RK2,f=fleetById.get(R.fid);if(!f||f.dead||!f.rk||!f.rk.length){closeRk();return}
 const z=cam.zoom,rg=rkRange(),now=performance.now();
 if(R.fix){const tp=targetPos(R.fix);if(!tp){R.fix=null;R.lock=null;toast('Ziel verloren – Fixierung gelöst.')}else{R.lock={kind:R.fix.kind,id:R.fix.id,x:tp.x,y:tp.y,name:tp.name,owner:tp.owner};R.x=tp.x;R.y=tp.y}}
 if(!R.fix){const rad=(coarse()?44:30)/z;let best=null,bd=1e9;for(const o of cands(R.x,R.y,rad)){const d=Math.hypot(o.x-R.x,o.y-R.y);if(d<bd){bd=d;best=o}}R.lock=best}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.save();
 const [fx,fy]=w2s(f.x,f.y),L=R.lock,tx=L?L.x:R.x,ty=L?L.y:R.y,[qx,qy]=w2s(tx,ty),far=Math.hypot(tx-f.x,ty-f.y)>rg;
 ctx.lineWidth=1.5;ctx.strokeStyle='rgba(251,191,36,.55)';ctx.setLineDash([10,8]);ctx.lineDashOffset=-now/50;ctx.beginPath();ctx.arc(fx,fy,rg*z,0,6.283);ctx.stroke();
 ctx.strokeStyle=far?'rgba(148,163,184,.7)':'rgba(244,63,94,.7)';ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(qx,qy);ctx.stroke();ctx.setLineDash([]);
 const col=far?'#94a3b8':L?(R.fix?'#ff2d55':'#f43f5e'):'#fbbf24',rr=(L?22:18)+(L?2*Math.sin(now/120):0);
 ctx.strokeStyle=col;ctx.fillStyle=col;ctx.lineWidth=2;ctx.shadowColor=col;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(qx,qy,rr,0,6.283);ctx.stroke();
 for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ctx.beginPath();ctx.moveTo(qx+a*(rr-7),qy+b*(rr-7));ctx.lineTo(qx+a*(rr+12),qy+b*(rr+12));ctx.stroke()}
 ctx.beginPath();ctx.arc(qx,qy,2.5,0,6.283);ctx.fill();ctx.shadowBlur=0;
 if(R.fix){ctx.beginPath();ctx.arc(qx,qy,rr+6,now/300,now/300+1.2);ctx.stroke();ctx.beginPath();ctx.arc(qx,qy,rr+6,now/300+3.14,now/300+4.34);ctx.stroke()}
 ctx.font='12px Rajdhani,sans-serif';ctx.fillStyle='#fecdd3';ctx.textAlign='center';ctx.fillText((R.fix?'🔒 ':'')+(L?L.name:'Zielpunkt'),qx,qy-rr-10);ctx.textAlign='start';
 ctx.restore()}catch(e){console.warn(e)}};
})();
