/* ===== ADD-ON: Gacha, Daily, Profil, Dev, Offline, Wache, Rückzug, Forschung ===== */
const DEVPW='Godmode';
const cleanTxt=s=>String(s||'').replace(/[<>&"'`]/g,'').trim();
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
TITLES.gacha='SCHIFFE ANHEUERN';TITLES.daily='TAGESBELOHNUNG';TITLES.profile='PROFIL & SPIELSTAND';

/* --- Start: Spieler beginnt etwa auf Rang 100 --- */
function startShips(){const ships={scout:4,corvette:2},hp=planets[S.capital];hp.b.power=4;hp.dirty=true;S.hangar=ships;
 const rank=()=>standings().findIndex(s=>s.id===0)+1;
 for(const id of ['frigate','corvette','scout']){for(let g=0;g<60&&rank()>100;g++){if(powerUsed()+SHIP[id].pw>powerCap()){if(hp.b.power<14)hp.b.power++;else break}ships[id]=(ships[id]||0)+1;if(rank()<93){ships[id]--;break}}}
 S.hangar={};return ships}

function layoutVars(){const h=document.querySelector('header');if(h)document.documentElement.style.setProperty('--hh',h.offsetHeight+'px')}
function toggleTapMove(){S.tapMove=!S.tapMove;updTapBtn()}
function updTapBtn(){const b=$('tapBtn');if(b){b.textContent=S.tapMove?'Tippen=Bewegen ✓':'Tippen=Bewegen';b.style.background=S.tapMove?'rgba(8,145,178,.5)':''}}

/* --- Forschung mit Laufzeit, Ebenen und Mehrfach-Voraussetzungen --- */
const reqOk=r=>{const [id,l]=r.split(':');return(S.lv[id]||0)>=(+l||1)};
const reqName=r=>{const [id,l]=r.split(':');return TECHS.find(x=>x.id===id).name+(l?' Lv'+l:'')};
const TM={flak_tech:.35,flak_dmg:.5,flak_rng:.5,shield_hp:.5,shield_rad:.5};
function techTime(t){let s=0;for(const k in t.cost)s+=t.cost[k];return Math.min(1500,6*Math.sqrt(s/8))*(TM[t.id]||1)*(1+.4*(S.lv[t.id]||0))/(1+.04*bsum('lab')+tb('rspd'))}
const fdur=s=>{s=Math.ceil(s);return s>=3600?Math.floor(s/3600)+'h '+Math.floor(s%3600/60)+'m':s>=60?Math.floor(s/60)+'m '+(s%60)+'s':s+'s'};
function techDepth(t,m={}){if(m[t.id])return m[t.id];let d=1;for(const r of t.req){const x=TECHS.find(q=>q.id===r.split(':')[0]);if(x)d=Math.max(d,1+techDepth(x,m))}return m[t.id]=d}
function doResearch(id){const t=TECHS.find(x=>x.id===id),l=S.lv[id]||0;if(l>=t.max||t.req.some(r=>!reqOk(r)))return;
 if(S.rq&&!S.dev){toast('Es läuft bereits eine Forschung.');return}const c=techCost(t);if(!canPay(c)){toast('Nicht genug Ressourcen.');return}
 pay(c);S.rq={id,lvl:l+1,start:S.T,end:S.T+(S.dev?0:techTime(t)),c};playSound('click');toast(t.name+' wird erforscht …');refreshUI()}
function finishResearch(){const q=S.rq;if(!q)return;S.rq=null;const t=TECHS.find(x=>x.id===q.id);S.lv[q.id]=q.lvl;recalcBonus();playSound('ok');addLog(`[FORSCHUNG] ${t.name} Stufe ${q.lvl} abgeschlossen.`);toast('Forschung abgeschlossen: '+t.name);refreshUI()}
function cancelResearch(){const q=S.rq;if(!q)return;for(const k in q.c)S.res[k]+=Math.floor(q.c[k]*.5);S.rq=null;toast('Forschung abgebrochen (50% erstattet).');refreshUI()}
function rResearch(){
 const tabs=Object.entries(TREES).map(([k,t])=>{const all=TECHS.filter(x=>x.tree===k),done=all.filter(x=>(S.lv[x.id]||0)>=x.max).length;
  return`<button onclick="S.tab='${k}';renderModal()" class="px-2.5 py-1.5 rounded border text-[11px] font-orbitron ${S.tab===k?'bg-cyan-900/60 border-cyan-400 text-white':'bg-slate-900 border-slate-700 text-slate-300'}"><i class="fa-solid ${t.i} ${t.c}"></i> ${t.n} <span class="text-slate-400">${done}/${all.length}</span></button>`}).join('');
 const sum=[['atk','Waffen'],['arm','Panzerung'],['spd','Tempo'],['eco','Ertrag'],['cred','Credits'],['pwr','Energie']].filter(([k])=>tb(k)>0).map(([k,n])=>`${n} +${pct(tb(k))}`).join(' • ');
 let h=`<div class="flex flex-wrap gap-1 mb-2">${tabs}</div><div class="text-slate-400 mb-2">Labor-Rabatt ${pct(Math.min(.55,.03*bsum('lab')+tb('tcost')))} • Forschungstempo +${pct(.04*bsum('lab')+tb('rspd'))}${sum?'<br>Aktive Boni: '+sum:''}</div>`;
 const q=S.rq;if(q){const t=TECHS.find(x=>x.id===q.id);h+=card(`<div class="flex justify-between items-center"><b class="font-orbitron text-cyan-300"><i class="fa-solid fa-flask fa-beat-fade"></i> ${t.name} → Stufe ${q.lvl}</b><span id="rqTime" class="text-amber-300"></span></div><div class="bar my-1.5"><div id="rqBar" style="background:#22d3ee;width:0%"></div></div>${btn('Abbrechen (50% zurück)','cancelResearch()','rose')}`,'mb-3')}
 const dm={},cols={};for(const t of TECHS.filter(t=>t.tree===S.tab)){const d=techDepth(t,dm);(cols[d]=cols[d]||[]).push(t)}
 h+='<div class="tt-wrap"><div class="tt-row">';
 for(const d of Object.keys(cols).map(Number).sort((a,b)=>a-b)){
  h+=`<div class="tt-col"><div class="tt-h">Ebene ${d}</div>`;
  for(const t of cols[d]){
   const l=S.lv[t.id]||0,maxed=l>=t.max,c=techCost(t),miss=t.req.filter(r=>!reqOk(r)),busy=!!S.rq&&S.rq.id===t.id,locked=miss.length&&!maxed;
   const st=maxed?'tt-done':locked?'tt-lock':'tt-open';
   const pips=Array.from({length:t.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('');
   h+=`<div id="tech_${t.id}" class="tt-card ${st}"${locked?` onclick="gotoTech('${miss[0].split(':')[0]}')"`:''}>`
   +`<div class="tt-top"><b class="font-orbitron">${t.name}</b><span class="tt-lv">${l}/${t.max}</span></div>`
   +(t.max<=8?`<div class="tt-pips">${pips}</div>`:'')
   +`<div class="tt-desc">${t.desc}</div>`
   +(t.req.length?`<div class="tt-req">${t.req.map(r=>`<span onclick="event.stopPropagation();gotoTech('${r.split(':')[0]}')" class="${reqOk(r)?'text-emerald-400':'text-rose-400'}">${reqOk(r)?'✓':'✗'} ${reqName(r)}</span>`).join('')}</div>`:'')
   +(maxed?'<div class="text-emerald-400 text-[11px]"><i class="fa-solid fa-circle-check"></i> Vollständig erforscht</div>'
     :`<div class="tt-cost">${costHtml(c)}<span class="text-slate-400"><i class="fa-regular fa-clock"></i> ${S.dev?'sofort':fdur(techTime(t))}</span></div>`
      +(locked?'<div class="text-rose-400 text-[10px]"><i class="fa-solid fa-lock"></i> Gesperrt – Klick springt zur Voraussetzung</div>'
        :busy?'<div class="text-amber-300 text-[11px]">wird erforscht …</div>'
        :btn(l?'Verbessern':'Erforschen',`doResearch('${t.id}')`,'cyan',!canPay(c)||(!!S.rq&&!S.dev))))
   +'</div>'}
  h+='</div>'}
 setBody(h+'</div></div>')}
function gotoTech(id){const t=TECHS.find(x=>x.id===id);if(!t)return;S.tab=t.tree;renderModal();setTimeout(()=>{const e=document.getElementById('tech_'+id);if(e){e.scrollIntoView({behavior:'smooth',block:'center'});e.style.outline='2px solid #22d3ee';e.style.borderRadius='8px';setTimeout(()=>{e.style.outline=''},2000)}},60)}
RENDER.research=rResearch;

/* --- Tick: Dev-Modus, Forschung, Wachflotten --- */
let _rtU=0;
const MINE_R=260,MINE_D=3500,MINE_COST={steel:450,copper:220,coal:120},AA_D=190,AA_R=900,AA_DPS=120,AA_COST={steel:300,copper:180},AA_BASE=3,MINE_BASE=15;
function ensureB(){if(!S.mines)S.mines=[];if(!S.aa)S.aa=[];if(!S.stock)S.stock={mine:0,aa:0}}
/* --- Ländergrenzen (Territorien) --- */
/* --- Versorgung: Nahrung & Wasser --- */
const SUP_BONUS=.2,SUP_RES=120;
function supplyInfo(){let dem=0;for(const i of PS)dem+=.03+.09*(planets[i].b.mine||0);
 const cF=dem>0?clamp(S.res.food/(dem*SUP_RES),0,1):1,cW=dem>0?clamp(S.res.water/(dem*SUP_RES),0,1):1;
 return{dem,cF,cW,bonus:SUP_BONUS*Math.min(cF,cW)}}
setInterval(()=>{try{const su=supplyInfo();for(const k of['food','water']){const el=$('r_'+k);if(!el)continue;const c=k==='food'?su.cF:su.cW;el.style.color=c<.25?'#fb7185':c<1?'#fbbf24':''}}catch(e){}},800);
const BORD={on:true};
try{if(localStorage.getItem('ge_bd')==='0')BORD.on=false}catch(e){}
function toggleBord(){BORD.on=!BORD.on;try{localStorage.setItem('ge_bd',BORD.on?'1':'0')}catch(e){}toast('Ländergrenzen '+(BORD.on?'an':'aus'));renderModal()}
const VOR=new Map();
function vorPoly(q){let P=VOR.get(q);if(P)return P;const p=planets[q],cx=q%N,cy=(q/N)|0,R=3600;
 let poly=[{x:Math.max(-HALF,p.x-R),y:Math.max(-HALF,p.y-R),l:-1},{x:Math.min(HALF,p.x+R),y:Math.max(-HALF,p.y-R),l:-1},{x:Math.min(HALF,p.x+R),y:Math.min(HALF,p.y+R),l:-1},{x:Math.max(-HALF,p.x-R),y:Math.min(HALF,p.y+R),l:-1}];
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dy)continue;const xx=cx+dx,yy=cy+dy;if(xx<0||yy<0||xx>=N||yy>=N)continue;const k=yy*N+xx,o=planets[k],nx=o.x-p.x,ny=o.y-p.y,mx=(o.x+p.x)/2,my=(o.y+p.y)/2,out=[];
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],sa=(a.x-mx)*nx+(a.y-my)*ny,sb=(b.x-mx)*nx+(b.y-my)*ny,ia=sa<=0,ib=sb<=0;
   if(ia&&ib)out.push(a);
   else if(ia){const t=sa/(sa-sb);out.push(a);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,l:k})}
   else if(ib){const t=sa/(sa-sb);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,l:a.l})}}
  poly=out;if(poly.length<3)break}
 VOR.set(q,poly);return poly}
function drawTerr(){const z=cam.zoom,[l,t]=s2w(0,0),[r,b]=s2w(W,H);
 const x0=Math.max(0,cellX(l)-1),x1=Math.min(N-1,cellX(r)+1),y0=Math.max(0,cellY(t)-1),y1=Math.min(N-1,cellY(b)+1);
 const pf=new Path2D,af=new Path2D,nf=new Path2D,pb=new Path2D,ab=new Path2D,sx=x=>(x-cam.x)*z+W/2,sy=y=>(y-cam.y)*z+H/2;
 for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const q=cy*N+cx,o=planets[q].owner,poly=vorPoly(q);if(poly.length<3)continue;const F=o===0?pf:o>0?af:nf;
  for(let i=0;i<poly.length;i++){const v=poly[i];if(i)F.lineTo(sx(v.x),sy(v.y));else F.moveTo(sx(v.x),sy(v.y))}F.closePath();
  for(let i=0;i<poly.length;i++){const a=poly[i],bb=poly[(i+1)%poly.length],lq=a.l;if(lq<0)continue;const oq=planets[lq].owner;if(oq===o)continue;
   let B=null;if(o===0)B=pb;else if(oq!==0&&o>0&&(oq===-1||q<lq))B=ab;
   if(B){B.moveTo(sx(a.x),sy(a.y));B.lineTo(sx(bb.x),sy(bb.y))}}}
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 ctx.fillStyle='rgba(148,163,184,.06)';ctx.fill(nf);
 ctx.fillStyle='rgba(239,68,68,.15)';ctx.fill(af);
 ctx.fillStyle='rgba(56,140,248,.13)';ctx.fill(pf);
 ctx.strokeStyle='rgba(239,68,68,.14)';ctx.lineWidth=6;ctx.stroke(ab);ctx.strokeStyle='rgba(248,113,113,.6)';ctx.lineWidth=1.8;ctx.stroke(ab);
 ctx.strokeStyle='rgba(96,165,250,.18)';ctx.lineWidth=8;ctx.stroke(pb);ctx.strokeStyle='rgba(125,190,255,.9)';ctx.lineWidth=2.2;ctx.stroke(pb);
 ctx.restore()}

/* --- Tarn-Jäger: nur nahe am Ziel sichtbar --- */
const STL_IDX=SHIPS.findIndex(s=>s.id==='stealth'),STL_R=2200,STL_NEAR=1000;
function isStealthFleet(f){let any=false;for(const t in f.ships){const n=f.ships[t];if(n>0){if(t!=='stealth')return false;any=true}}return any}
function fleetVis(f){if(f.owner===0||!isStealthFleet(f))return 1;let v=0;const o=f.order;
 if(o&&o.type==='atk'){const t=targetPos(o);if(t&&t.owner===0)v=Math.max(v,clamp((STL_R*1.25-Math.hypot(f.x-t.x,f.y-t.y))/(STL_R*.25),0,1))}
 const cx=cellX(f.x),cy=cellY(f.y);let dp=1e9;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const p=planetAt(cx+dx,cy+dy);if(p&&p.owner===0)dp=Math.min(dp,Math.hypot(p.x-f.x,p.y-f.y))}
 v=Math.max(v,clamp((STL_NEAR*1.3-dp)/(STL_NEAR*.3),0,1));
 if(v<1&&nearby(f.x,f.y,700,e=>e.owner===0&&e.placed&&!e.dead).length)v=1;
 return v}
function aiStealth(ai){if(ai.dead||!ai.planets||STL_IDX<0)return;const lv=ELV(ai);if(Math.min(TIERMAX,2+Math.floor(ai.tech/3))<STL_IDX)return;
 if(Math.random()>.3||fleets.filter(f=>f.owner===ai.id&&isStealthFleet(f)).length>=1+lv)return;
 const n=Math.floor(Math.min((ai.bank||0)*.5,500*EF(ai))/SHIP.stealth.power);if(n<2)return;const hp=aiSpawnPlanet(ai);if(!hp)return;
 ai.bank-=n*SHIP.stealth.power;const f=newFleet(ai.id,ai.name+' Schattenstaffel',{stealth:n},true,hp.x+(Math.random()-.5)*200,hp.y+(Math.random()-.5)*200);f.ax=f.x;f.ay=f.y}
/* --- Bot-Freischaltung (Spielzeit in s): Spieler bekommt Zeit zum Aufbau --- */
/* Menschenähnlich: jeder Bot hat Persönlichkeit, eigenes Forschungstempo und reagiert auf Bedrohung */
const NEED={flak:7,mine:10,rk:17,shield:15},MINT={flak:1100,mine:1800,rk:4800,shield:3400};
function unl(ai,k){if(!ai.pers){ai.pers=ai.style==='def'?(Math.random()<.6?'turtle':'balanced'):(Math.random()<.5?'rusher':'boomer');ai.lag=Math.floor(Math.random()*3)}
 if(S.T<(MINT[k]||600)||(ai.planets<2&&k!=='flak'))return 0;
 const need=Math.max(1,NEED[k]+ai.lag+(ai.pers==='turtle'?-2:ai.pers==='rusher'?2:0)-Math.round((ai.thr||0)*3));
 return Math.max(0,Math.min(1,(ai.tech+1-need)/4))}
/* --- KI-Minen & KI-Flak --- */
let _xrf=0;
function ensureAD(){if(!S.xm)S.xm=[];if(!S.xa)S.xa=[]}
function tickAD(dt,nw){const ep=f=>f.owner===0&&f.placed&&!f.dead&&basePower(f.ships)>0;let ch=false;
 for(let i=S.xm.length-1;i>=0;i--){const m=S.xm[i],ai=AIS[m.o-1];if(!ai||ai.dead){S.xm.splice(i,1);continue}
  if(m.t0&&S.T<m.t0)continue;const hit=nearby(m.x,m.y,MINE_R,ep);if(!hit.length)continue;S.xm.splice(i,1);const dmg=MINE_D*(1+ai.tech*.03),names=[];
  for(const f of hit){names.push(f.name);hitFleet(f,dmg,1)}
  FX.push({k:'boom',t0:nw,dur:700,x1:m.x,y1:m.y,s:55,c:'#f59e0b'});FX.push({k:'wave',t0:nw,dur:800,x1:m.x,y1:m.y,s:500,c:'#e879f9'});
  addLog('[MINE] Eine Mine von '+ai.name+' hat '+names.join(', ')+' getroffen!',m.x,m.y);playSound('boom');ch=true}
 for(let i=S.xa.length-1;i>=0;i--){const a=S.xa[i],p=planets[a.pid],ai=AIS[a.o-1];if(!p||!ai||ai.dead||p.owner!==a.o){S.xa.splice(i,1);continue}
  const pos=aaPos(a),tg=nearby(pos.x,pos.y,AA_R,ep);if(!tg.length)continue;
  let b=tg[0];for(const f of tg)if(Math.hypot(f.x-pos.x,f.y-pos.y)<Math.hypot(b.x-pos.x,b.y-pos.y))b=f;
  const bx=b.x,by=b.y,nm=b.name;hitFleet(b,AA_DPS*(1+ai.tech*.03)*dt,1);ch=true;
  if(nw>(a.fxT||0)&&FX.length<400){a.fxT=nw+420;FX.push({k:'shot',t0:nw,dur:200,x0:pos.x,y0:pos.y,x1:bx,y1:by,c:'#e879f9'});FX.push({k:'boom',t0:nw+200,dur:300,x1:bx,y1:by,s:10,c:'#fde047'})}
  if(nw>(a.logT||0)){a.logT=nw+10000;addLog('[FLAK] '+ai.name+' beschießt '+nm+'!',bx,by)}}
 if(ch&&nw-_xrf>600){_xrf=nw;refreshUI()}}
const ELV=ai=>(S.elites&&S.elites[ai.id])||0,EF=ai=>{const e=ELV(ai);return (e===2?2.2:e===1?1.5:(S.meds&&S.meds[ai.id])?1.2:1)*(1+SNOW(ai)*30)*(S.diff||1)};
function aiDefend(ai){ensureAD();if(ai.dead)return;const now=S.T,el=Math.min(60,now-(ai.dT||now)),lv=ELV(ai);ai.dT=now;ai.defAt=now+5+Math.random()*6;
 {const pts=[],hp=planets[ai.home];if(hp&&hp.owner===ai.id)pts.push(hp);const mf=fleets.filter(f=>f.owner===ai.id&&!f.dead);if(mf.length)pts.push(mf[Math.floor(Math.random()*mf.length)]);
  let th=0;for(const q of pts)if(nearby(q.x,q.y,6000,e=>e.owner===0&&e.placed&&!e.dead&&basePower(e.ships)>400).length)th=1;
  ai.thr=th?Math.min(1,(ai.thr||0)+.35):(ai.thr||0)*.9}
 {const inc=el*(2+ai.planets)*(1+now/3000)*(.8+(ai.skill||0)*.5)*(lv===2?2:lv===1?1.4:1),fs=ai.style==='def'?.3:.55;ai.dbank=Math.min(2500,(ai.dbank||0)+inc*(1-fs));ai.bank=Math.min(60000*(1+SNOW(ai)*100),(ai.bank||0)+inc*fs)}
 if(ai.dbank<300)return;
 /* Priorität: erst genug Flotten, dann Verteidigung */
 const fcap=Math.min(8+lv*4+Math.floor(SNOW(ai)*60),2+Math.floor(ai.planets/2)),myF=fleets.filter(f=>f.owner===ai.id&&!f.dead);
 const def=ai.style==='def',toFleet=()=>{ai.bank=Math.min(60000*(1+SNOW(ai)*100),(ai.bank||0)+ai.dbank*.7);ai.dbank*=.3};
 if(S.xa.length>3000||S.xm.length>1500){toFleet();return}
 if(myF.length<Math.ceil(fcap*(def?.6:.9))){toFleet();return}
 if(myF.reduce((s,f)=>s+fleetPower(f),0)<ai.planets*(def?240:380)*(1+ai.tech*.15)){toFleet();return}
 const own=planets.filter(p=>p.owner===ai.id);if(!own.length)return;
 const pp=[...PS].map(i=>planets[i]);
 const info=own.map(p=>{let d=1e9,q=null;for(const t of pp){const e=Math.hypot(t.x-p.x,t.y-p.y);if(e<d){d=e;q=t}}return{p,d,q}}).sort((x,y)=>x.d-y.d);
 const cnt=(arr,fn)=>arr.reduce((n,x)=>n+(fn(x)?1:0),0),per0=def?Math.min(8,2+Math.floor(ai.tech/3)+lv):Math.min(4,1+Math.floor(ai.tech/5)+lv),per=Math.ceil(per0*unl(ai,'flak'));
 /* Flak: Heimatplanet und Frontplaneten zuerst */
 const front=info.slice(0,Math.max(1,Math.ceil(info.length/3))),order=[info.find(x=>x.p.id===ai.home),...front,...info].filter(Boolean);
 let best=null;for(const x of order){const c=cnt(S.xa,a=>a.pid===x.p.id);if(c<per&&(!best||c<best.c))best={x,c}}
 const totF=cnt(S.xa,a=>a.o===ai.id),maxF=Math.ceil(ai.planets*(def?.45:.25)*unl(ai,'flak'));
 if(best&&totF<maxF){S.xa.push({id:S.nextB=(S.nextB||0)+1,pid:best.x.p.id,ang:.6+best.c*.8+Math.random()*.3,o:ai.id});ai.dbank-=300}
 /* Minen: gezielt zwischen Frontplanet und dem nächsten Spielerplaneten */
 if(unl(ai,'mine')>0&&ai.dbank>=400&&info[0]&&info[0].q&&info[0].d<30000){const mcap=Math.max(1,Math.floor(Math.min(8+lv*3,1+Math.floor(ai.planets/2)+Math.floor(ai.tech/6)+lv)*(def?1:.5)*unl(ai,'mine')));
  if(cnt(S.xm,m=>m.o===ai.id)+aiPendDrop(ai,'m')<mcap){const x=info[Math.floor(Math.random()*Math.min(3,info.length))];if(x.q){
   const ang=Math.atan2(x.q.y-x.p.y,x.q.x-x.p.x)+(Math.random()-.5)*.7,d=700+Math.random()*900,mx=clamp(x.p.x+Math.cos(ang)*d,-HALF,HALF),my=clamp(x.p.y+Math.sin(ang)*d,-HALF,HALF);
   if(!S.xm.some(m=>Math.hypot(m.x-mx,m.y-my)<450)&&aiStartDrop(ai,'m',mx,my))ai.dbank-=400}}}}
/* --- Elite-Bots: ca. 5 sehr starke (★★) und 15 starke (★) --- */
function seedElites(){S.elites={};S.meds={};const cap=planets[S.capital];if(!cap)return;
 const pl=[...PS].map(i=>planets[i]);pl.push(cap);
 const dmin=a=>{const h=planets[a.home];let m=1e9;for(const p of pl)m=Math.min(m,Math.hypot(p.x-h.x,p.y-h.y));return m};
 const all=AIS.filter(a=>!a.dead&&planets[a.home].owner===a.id).map(a=>({a,d:dmin(a)}));
 for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
 const picked=[],pick=(n,lvl,minD,sep)=>{for(const c of all){if(n<=0)break;const a=c.a;if(S.elites[a.id]||S.meds[a.id]||c.d<minD)continue;const h=planets[a.home];if(picked.every(q=>Math.hypot(planets[q.home].x-h.x,planets[q.home].y-h.y)>sep)){if(lvl===3)S.meds[a.id]=1;else S.elites[a.id]=lvl;picked.push(a);n--}}return n};
 /* sehr stark (★★): weit weg vom Spieler */
 let r=pick(8,2,48000,30000);if(r>0)pick(r,2,42000,15000);
 let r1=pick(28,1,30000,14000);if(r1>0)pick(r1,1,25000,7000);
 let r3=pick(70,3,20000,9000);if(r3>0)r3=pick(r3,3,16000,5000);if(r3>0)pick(r3,3,14000,0);
 for(const a of picked)eliteBuild(a,S.elites[a.id]||3)}
function eliteBuild(ai,lvl){const R=Math.random,hp=planets[ai.home],T=Math.min(TIERMAX,9),
 K={2:{mt:TIERMAX,np:26+Math.floor(R()*12),gar:700,tu:3,hg:9000,ht:5,tech:20,nf:9,fp:11000,fr:9000,fn:' Armada',bank:12000,far:20000},
    1:{mt:T,np:9+Math.floor(R()*7),gar:300,tu:2,hg:3000,ht:3,tech:12,nf:4,fp:3000,fr:3000,fn:' Kampfflotte',bank:4000,far:20000},
    3:{mt:Math.min(TIERMAX,6),np:4+Math.floor(R()*4),gar:120,tu:1,hg:700,ht:2,tech:6,nf:3,fp:500,fr:500,fn:' Flotte',bank:600,far:9000}}[lvl];
 const pl=[...PS].map(i=>planets[i]);
 const free=planets.filter(p=>p.owner===-1&&pl.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>K.far)).map(p=>({p,d:Math.hypot(p.x-hp.x,p.y-hp.y)})).sort((a,b)=>a.d-b.d).slice(0,K.np);
 for(const{p}of free){setOwner(p,ai.id);p.garrison=genShips(K.gar*(.6+R()),K.mt,R);p.b.turret=K.tu}
 hp.garrison=genShips(K.hg,K.mt,R);hp.b.turret=K.ht;hp.dirty=true;ai.tech=K.tech;
 for(let k=0;k<K.nf;k++){const f=newFleet(ai.id,ai.name+K.fn,genShips(K.fp+R()*K.fr,K.mt,R),true,hp.x+(R()-.5)*400,hp.y+(R()-.5)*400);f.ax=f.x;f.ay=f.y;f.wait=R()*5}
 ai.bank=(ai.bank||0)+K.bank;ai.expAt=Math.min(ai.expAt,S.T+120)}

const mineCap=()=>MINE_BASE+tb('mcap'),aaSlots=()=>AA_BASE+tb('fslot'),aaPos=a=>{const p=planets[a.pid];return{x:p.x+Math.cos(a.ang)*AA_D,y:p.y+Math.sin(a.ang)*AA_D}};
const placeHint=()=>placing==='shield'?window.xShHint():placing==='mine'?`Weltraummine (${S.stock.mine} im Vorrat): Eigene Flotte anklicken, dann Doppelklick auf den Zielort = Flotte fliegt hin und legt die Mine • Esc = beenden`:`Flak-Plattform (${S.stock.aa} im Vorrat): Tippe auf einen eigenen Planeten = platzieren • Esc = beenden`;
function buildDef(k,n){ensureB();const c=shipCost({cost:k==='mine'?MINE_COST:AA_COST}),tot={};for(const q in c)tot[q]=c[q]*n;if(!canPay(tot)){toast('Nicht genug Ressourcen.');return}pay(tot);S.stock[k]+=n;playSound('ok');refreshUI()}
function deployMine(f){ensureB();f.order=null;
 if(!S.stock.mine){toast('Keine Mine im Vorrat – Auftrag abgebrochen.');return}
 if(S.mines.length>=mineCap()){toast('Minen-Limit erreicht ('+mineCap()+') – Mine nicht abgelegt.');return}
 if(nearby(f.x,f.y,MINE_R*1.3,e=>e.owner>0&&!e.dead&&basePower(e.ships)>0).length){toast('Feindliche Flotte zu nah – Mine nicht abgelegt.');return}
 const id=S.nextB=(S.nextB||0)+1;S.mines.push({id,x:f.x,y:f.y,t0:S.T+6});S.stock.mine--;
 FX.push({k:'boom',t0:performance.now(),dur:400,x1:f.x,y1:f.y,s:14,c:'#fbbf24'});
 toast(f.name+' hat eine Mine abgelegt ('+S.mines.length+'/'+mineCap()+'). Scharf in wenigen Sekunden.');playSound('ok');refreshUI()}
function armBuild(k){ensureB();if(!S.stock[k]){toast('Kein Vorrat – zuerst bauen.');return}closeModal();placing=k;setActive(k==='mine'?activeFleet:null);toast(k==='mine'?'Klicke eine eigene Flotte an (sie transportiert die Mine), dann Doppelklick auf den Zielort.':'Tippe auf einen eigenen Planeten = Flak platzieren')}
function placeDef(sx,sy){ensureB();const k=placing;if(!S.stock[k]){placing=null;setActive(null);return}
 const [wx,wy]=s2w(sx,sy);
 if(k==='mine'){if(S.mines.length>=mineCap()){toast('Minen-Limit erreicht ('+mineCap()+').');return}
  const f=activeFleet?fleetById.get(activeFleet):null;if(!f||f.owner!==0||!f.placed||!basePower(f.ships)){toast('Wähle zuerst eine platzierte eigene Flotte (anklicken) – sie muss die Mine transportieren.');return}
  const tx=clamp(wx,-HALF+100,HALF-100),ty=clamp(wy,-HALF+100,HALF-100);f.guard=null;f.retreat=false;f.order={type:'mine',x:tx,y:ty};
  toast(f.name+' transportiert die Mine zum Zielort.');placing=null;setActive(f.id);playSound('ok');refreshUI();return}
 else{let pl=null,bd=1e9;for(const i of PS){const p=planets[i],d=Math.hypot(p.x-wx,p.y-wy);if(d<=Math.max(p.r*1.5,28/cam.zoom)&&d<bd){bd=d;pl=p}}
  if(!pl){toast('Flak nur auf eigenen Planeten – tippe direkt auf den Planeten.');return}
  const used=S.aa.filter(a=>a.pid===pl.id);if(used.length>=aaSlots()){toast('Alle '+aaSlots()+' Flak-Plätze dieses Planeten sind belegt.');return}
  const id=S.nextB=(S.nextB||0)+1;S.aa.push({id,pid:pl.id,ang:.6+used.length*.8});S.stock.aa--;toast('Flak-Plattform auf '+pl.name+' platziert.')}
 playSound('ok');if(!S.stock[k])placing=null;setActive(null);refreshUI()}
const GHP=.4; /* Lebenspunkte eines Superschiffs = Stärke x 0.4, voller Minen-/Flak-Schaden */
function hitFleet(f,dmg,gm){let np=0;const norm={},gts=[];for(const t in f.ships){const n=f.ships[t];if(n<=0)continue;if(SHIP[t].g)gts.push(t);else{np+=SHIP[t].power*n;norm[t]=n}}
 if(np>0){const ks=Object.keys(norm);applyLoss([norm],Math.min(.7,dmg/np));for(const t of ks){if(norm[t]>0)f.ships[t]=norm[t];else delete f.ships[t]}}
 if(gts.length){gts.sort((a,b)=>SHIP[a].power-SHIP[b].power);f.gw=(f.gw||0)+dmg*(gm||1);
  for(const t of gts){const hp=SHIP[t].power*GHP;while(f.ships[t]>0&&f.gw>=hp){f.gw-=hp;f.ships[t]--;addLog('[SUPERSCHIFF] '+SHIP[t].name+' wurde zerstört!',f.x,f.y)}if(f.ships[t]<=0)delete f.ships[t];else break}
  if(!gts.some(t=>f.ships[t]>0))f.gw=0}
 if(!basePower(f.ships))removeFleet(f)}
let _bt=0;
function tickDef(g){ensureB();ensureAD();if(!S.elites)seedElites();if(!S.mines.length&&!S.aa.length&&!S.xm.length&&!S.xa.length)return;_bt+=g;if(_bt<.2)return;const dt=_bt;_bt=0;const en=f=>f.owner>0&&!f.dead&&basePower(f.ships)>0,nw=performance.now();
 for(let i=S.mines.length-1;i>=0;i--){const m=S.mines[i];if(m.t0&&S.T<m.t0)continue;const hit=nearby(m.x,m.y,MINE_R*(1+tb('mrad')),en);if(!hit.length)continue;
  S.mines.splice(i,1);const dmg=MINE_D*(1+tb('mdmg')),names=new Set();for(const f of hit){names.add(ownerName(f.owner));hitFleet(f,dmg,1+tb('mgx'))}
  FX.push({k:'boom',t0:nw,dur:700,x1:m.x,y1:m.y,s:55,c:'#f59e0b'});FX.push({k:'wave',t0:nw,dur:800,x1:m.x,y1:m.y,s:500,c:'#f59e0b'});
  addLog('[MINE] Eine Mine hat '+[...names].join(', ')+' getroffen!',m.x,m.y);playSound('boom');refreshUI()}
 for(let i=S.aa.length-1;i>=0;i--){const a=S.aa[i],p=planets[a.pid];if(!p||p.owner!==0){S.aa.splice(i,1);continue}
  const pos=aaPos(a),tg=nearby(pos.x,pos.y,AA_R*(1+tb('frng')),en);if(!tg.length)continue;
  let b=tg[0];for(const f of tg)if(Math.hypot(f.x-pos.x,f.y-pos.y)<Math.hypot(b.x-pos.x,b.y-pos.y))b=f;
  const bx=b.x,by=b.y;hitFleet(b,AA_DPS*(1+tb('fdmg'))*dt,1);
  if(nw>(a.fxT||0)&&FX.length<400){a.fxT=nw+420;FX.push({k:'shot',t0:nw,dur:200,x0:pos.x,y0:pos.y,x1:bx,y1:by,c:'#38bdf8'});FX.push({k:'boom',t0:nw+200,dur:300,x1:bx,y1:by,s:10,c:'#fde047'})}}
 tickAD(dt,nw)}
function gotoTechFromYard(id){openModal('research');gotoTech(id)}
let _hudU=0;
function updRqHud(){let e=document.getElementById('rqHud');if(!e){e=document.createElement('div');e.id='rqHud';e.className='glass-panel rounded-lg px-2.5 py-1.5 text-[11px] text-cyan-200 cursor-pointer';e.style.cssText='position:fixed;left:8px;top:calc(var(--hh,60px) + 8px);z-index:25;min-width:150px';e.onclick=()=>{if(curModal!=='research')openModal('research')};document.body.appendChild(e)}
 const q=S.rq;if(!q){e.style.display='none';return}const t=TECHS.find(x=>x.id===q.id);if(!t){e.style.display='none';return}e.style.display='';
 e.innerHTML=`<div class="flex justify-between gap-2"><span><i class="fa-solid fa-flask"></i> ${t.name} → ${q.lvl}</span><b class="text-amber-300">${fdur(Math.max(0,(q.end-S.T)/S.gs))}</b></div><div class="bar mt-1"><div style="background:#22d3ee;width:${clamp((S.T-q.start)/Math.max(1,q.end-q.start)*100,0,100)}%"></div></div>`}
function tickAddon(g){
 {const n=performance.now();if(n-_hudU>400){_hudU=n;updRqHud()}}
 tickDef(g);
 S.res.steel+=STEEL_PM/60*g;
 if(S.dev){for(const r of RES)S.res[r.k]=1e9;S.res.credits=1e9;if(S.gems<1e6)S.gems=1e6}
 const q=S.rq;if(q&&S.T>=q.end)finishResearch();
 if(q&&S.rq){const now=performance.now();if(now-_rtU>400){_rtU=now;const b=$('rqBar'),t=$('rqTime');if(b){b.style.width=clamp((S.T-q.start)/Math.max(1,q.end-q.start)*100,0,100)+'%';t.textContent=fdur((q.end-S.T)/S.gs)}}}
 for(const f of fleets){if(f.owner!==0||f.guard==null||!f.placed||f.order||f.dead)continue;const p=planets[f.guard];if(!p||p.owner!==0){f.guard=null;continue}
  if(Math.hypot(f.x-p.x,f.y-p.y)>420)f.order={type:'move',x:p.x+(Math.random()-.5)*300,y:p.y+(Math.random()-.5)*300}}}

/* --- Verteidigung zuweisen --- */
let _gp=null;
function openGuard(pid){_gp=pid;renderGuard();$('modal2Root').classList.remove('hidden')}
function renderGuard(){const p=planets[_gp];if(!p)return;const mine=fleets.filter(f=>f.owner===0&&basePower(f.ships)>0);
 let h=`<div class="mb-2 text-slate-300">Flotten, die <b class="text-cyan-300">${p.name}</b> bewachen, fliegen dorthin, verteidigen automatisch (Radius ${Math.round(900*(1+tb('grad')))}) und kehren nach Gefechten zurück.</div><div class="space-y-1.5">`;
 h+=mine.map(f=>{const here=f.guard===p.id,other=f.guard!=null&&!here&&planets[f.guard];
  return card(`<div class="flex flex-wrap items-center justify-between gap-1"><div><b class="text-cyan-300">${f.name}</b> • Stärke ${fmt(fleetPower(f))}<div class="text-slate-400">${here?'<span class="text-emerald-400">bewacht diese Kolonie</span>':other?'bewacht '+other.name:f.placed?'frei':'nicht platziert'}</div></div>${here?btn('Abziehen',`unguard(${f.id})`,'amber'):btn('Entsenden',`assignGuard(${f.id},${p.id})`,'emerald')}</div>`)}).join('')||'<div class="text-slate-500">Keine Flotten mit Schiffen vorhanden.</div>';
 h+=`</div><div class="flex justify-between mt-3">${btn('Alle freien Flotten entsenden',`assignAll(${p.id})`,'emerald')}${btn('Schließen','closeModal2()','slate')}</div>`;
 $('modal2Title').textContent='VERTEIDIGUNG: '+p.name;setHtml($('modal2Body'),h)}
function assignGuard(fid,pid){const f=fleetById.get(fid),p=planets[pid];if(!f||!p)return;const x=p.x+(Math.random()-.5)*300,y=p.y+(Math.random()-.5)*300;
 if(!f.placed){f.placed=true;f.x=x;f.y=y;f.ax=x;f.ay=y;f.order=null}else f.order={type:'move',x,y};f.guard=pid;f.retreat=false;playSound('ok');refreshUI();renderGuard()}
function unguard(fid){const f=fleetById.get(fid);if(f)f.guard=null;refreshUI();renderGuard()}
function assignAll(pid){for(const f of fleets)if(f.owner===0&&basePower(f.ships)>0&&f.guard==null&&!(f.order&&f.order.type==='atk'))assignGuard(f.id,pid)}

/* --- Gegner-Angriffe: Raids auf den Spieler + Rückzug --- */
function aiWar(f,ai){if(S.T<240||S.T<ai.capAt||S.T<(ai.warAt||0)||ai.planets>=aiCap(ai)+8||fleetPower(f)<400)return null;
 if(ai.style==='def'&&Math.random()<.6){ai.warAt=S.T+90+Math.random()*120;return null}ai.warAt=S.T+(ai.style==='def'?90:30)+Math.random()*(ai.style==='def'?120:50);
 const cx=cellX(f.x),cy=cellY(f.y),R=6;let best=null,bsc=1e18;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const p=planetAt(cx+dx,cy+dy);if(!p||p.owner<0||p.owner===f.owner||(p.owner===0&&p.id===S.capital&&S.T<1800))continue;
  const e=estimate(f.ships,f.owner,defendersOf('planet',p));if(e.aE<e.dE*aggrOf(ai))continue;
  const sc=Math.hypot(p.x-f.x,p.y-f.y)+e.dE*2;if(sc<bsc){bsc=sc;best={kind:'planet',id:p.id}}}
 return best}
function aiRaid(f,ai){if(S.T<240||S.T<ai.capAt||Math.random()>.12)return null;let best=null,bd=1e18;
 for(const i of PS){if(i===S.capital)continue;const p=planets[i],d=Math.hypot(p.x-f.x,p.y-f.y);if(d>8*CELL||d>=bd)continue;
  const e=estimate(f.ships,f.owner,defendersOf('planet',p));if(e.aE>=e.dE*ai.aggr){bd=d;best={kind:'planet',id:p.id}}}return best}
function pushAlert(text,x,y,meta){lastAlert={text,x,y,meta};$('alertText').textContent=text;$('alertBanner').classList.remove('hidden');playSound('alert');addLog('[ALARM] '+text,x,y);
 clearTimeout(alertTimer);alertTimer=setTimeout(hideAlert,30000)}
function retreatPoint(f,ax,ay,a){let best=null,bs=1e18;
 for(const i of PS){if(a.kind==='planet'&&i===a.id)continue;const p=planets[i];if(Math.hypot(p.x-ax,p.y-ay)<3000)continue;const d=Math.hypot(p.x-f.x,p.y-f.y);if(d<bs){bs=d;best=p}}
 if(best)return{x:best.x+(Math.random()-.5)*300,y:best.y+(Math.random()-.5)*300};
 const dx=f.x-ax,dy=f.y-ay,l=Math.hypot(dx,dy)||1;return{x:clamp(f.x+dx/l*6000,-HALF+100,HALF-100),y:clamp(f.y+dy/l*6000,-HALF+100,HALF-100)}}
function doRetreat(){const a=lastAlert&&lastAlert.meta;if(!a){toast('Kein Angriffsziel bekannt.');return}
 const att=fleetById.get(a.aid),ax=att?att.x:0,ay=att?att.y:0,tp=a.kind==='planet'?planets[a.id]:fleetById.get(a.id);if(!tp)return;
 const R=900*(1+tb('grad'))+60,grp=a.kind==='planet'?fleets.filter(f=>f.owner===0&&f.placed&&!f.dead&&Math.hypot(f.x-tp.x,f.y-tp.y)<=R):[tp];
 if(!grp.length){toast('Keine Flotten im Gefahrenbereich.');return}
 for(const f of grp){const d=retreatPoint(f,ax,ay,a);f.guard=null;f.retreat=true;f.order={type:'move',x:d.x,y:d.y}}
 toast(`${grp.length} Flotte(n) ziehen sich zurück.`);hideAlert();refreshUI()}

/* --- Beute --- */
function lootHook(info,r,captured,fleetKill){const L={};
 if(fleetKill){const m=1+tb('loot'),b=Math.min(15000,r.dE*.12)*m,g={steel:b,coal:b*.8,copper:b*.7,food:b*.5,water:b*.5,crystals:b*.08,diamonds:r.dE>3000?Math.min(10,Math.floor(r.dE/3000)):0},parts=[];
  for(const k in g){const v=Math.round(g[k]);if(v>0){S.res[k]+=v;L[k]=(L[k]||0)+v;parts.push('+'+fmt(v)+' '+RN[k])}}
  addLog('[PLÜNDERUNG] Flotte zerstört: '+parts.join(', '));toast('Flotte geplündert: '+parts.slice(0,3).join(', ')+' …')}
const m=1+tb('loot'),cr=Math.round(Math.min(20000,r.dE*.2)*m),st=Math.round(Math.min(20000,r.dE*.15)*m);S.res.credits+=cr;S.res.steel+=st;L.credits=cr;L.steel=(L.steel||0)+st;
 const tk=captured?2:r.dE>4000?1:0;S.gems+=tk;L.tokens=tk;addLog(`[BEUTE] +${fmt(cr)} Credits, +${fmt(st)} Stahl${tk?', +'+tk+' Warp-Token':''}`);return L}

/* --- Offline-Fortschritt --- */
function offlineProgress(){const now=Date.now(),last=S.lastSeen||now;let dt=(now-last)/1000;if(dt<60)return;dt=Math.min(dt,8*3600*(1+tb('off')));
 const eff=.6*(1+tb('off')),gain={},sup=supplyInfo(),sb=1+sup.bonus;for(const i of PS){const p=planets[i],k=BIOMES[p.biome].res,a=mineRate(p.b.mine,p)*dt*eff*((k==='food'||k==='water')?1:sb),c=(.25+p.b.hub*1.5*(1+tb('cred')))*dt*eff*sb;S.res[k]+=a;S.res.credits+=c;gain[k]=(gain[k]||0)+a;gain.credits=(gain.credits||0)+c}S.res.food=Math.max(0,S.res.food-sup.dem*dt*eff);S.res.water=Math.max(0,S.res.water-sup.dem*dt*eff);
 {const sa=STEEL_PM/60*dt*eff;S.res.steel+=sa;gain.steel=(gain.steel||0)+sa}
 S.T+=dt*.5;const n=Math.min(20,Math.floor(dt/120));for(let k=0;k<n;k++)for(const ai of AIS)if(!ai.dead)aiGrow(ai);
 const rd=S.rq&&S.T>=S.rq.end;
 let h=`<div class="text-center mb-2 text-slate-300">Du warst <b class="text-cyan-300">${fdur(dt)}</b> weg. Deine Kolonien haben weitergearbeitet (${pct(eff)} Effizienz):</div><div class="flex flex-wrap gap-1 justify-center">${Object.entries(gain).map(([k,v])=>`<span class="bg-slate-800 border border-slate-700 rounded px-2 py-1">+${fmt(v)} ${RN[k]}</span>`).join('')}</div>${rd?'<div class="text-center text-emerald-300 mt-2">Deine laufende Forschung wurde abgeschlossen.</div>':''}<div class="text-center text-slate-500 mt-2">Die Gegner haben sich währenddessen weiterentwickelt. Offline wird niemand angegriffen.</div><div class="flex justify-center mt-3">${btn('Weiter','closeModal2()')}</div>`;
 $('modal2Title').textContent='WILLKOMMEN ZURÜCK';setHtml($('modal2Body'),h);$('modal2Root').classList.remove('hidden')}

/* --- Tagesbelohnung --- */
const DAILY=[{cr:2000,tk:10},{res:{steel:3000,copper:2000},tk:10},{cr:5000,tk:15},{res:{coal:3000,crystals:300},tk:15},{cr:10000,tk:20},{res:{crystals:800,diamonds:30},tk:25},{cr:25000,res:{diamonds:100},tk:50}];
function dailyState(){const d=S.daily,t=dstr(new Date());if(d.last===t)return{can:false,idx:((d.streak-1)%7+7)%7,streak:d.streak};
 const y=new Date();y.setDate(y.getDate()-1);const st=d.last===dstr(y)?d.streak:0;return{can:true,idx:st%7,streak:st}}
function dText(r){return[r.cr?fmt(r.cr)+' Cr':'',...Object.entries(r.res||{}).map(([k,v])=>fmt(v)+' '+RN[k]),(r.tk+(r.can?0:0))+' Tokens'].filter(Boolean).join(', ')}
function rDaily(){const st=dailyState();
 let h=`<div class="text-slate-400 mb-3">Logge dich täglich ein – eine verpasste Tagesserie setzt den Streak zurück. Bonus durch Forschung: <b class="text-fuchsia-300">+${tb('tok')} Tokens</b>.</div><div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">`;
 DAILY.forEach((r,i)=>{const claimed=st.can?i<st.idx:i<=st.idx,today=st.can&&i===st.idx;
  h+=card(`<div class="font-orbitron ${today?'text-amber-300':'text-slate-300'}">Tag ${i+1}${claimed?' ✓':''}</div><div class="text-slate-400 mt-1">${dText(r)}</div>`,today?'border-amber-400':claimed?'opacity-50':'')});
 h+=`</div><div class="mt-4 flex items-center gap-3">${st.can?btn('<i class="fa-solid fa-gift"></i> Belohnung abholen','claimDaily()','amber'):'<span class="text-emerald-300">Heute bereits abgeholt – komm morgen wieder!</span>'}<span class="text-slate-500">Streak: ${st.streak} • Abholungen gesamt: ${S.daily.total||0}</span></div>`;setBody(h)}
function claimDaily(){const st=dailyState();if(!st.can)return;const r=DAILY[st.idx];S.gems+=r.tk+tb('tok');if(r.cr)S.res.credits+=r.cr;for(const k in r.res||{})S.res[k]+=r.res[k];
 S.daily={last:dstr(new Date()),streak:st.streak+1,total:(S.daily.total||0)+1};playSound('ok');toast('Belohnung erhalten: '+dText(r));updDailyDot();refreshUI()}
function updDailyDot(){const d=$('dailyDot');if(d)d.classList.toggle('hidden',!dailyState().can)}
RENDER.daily=rDaily;

/* --- Gacha --- */
const featured=()=>{const L=SHIPS.filter(s=>s.r==='L');return L[Math.floor(Date.now()/6048e5)%L.length]};
const CBUN=[['Credits-Paket','credits',1500,'fa-coins'],['Stahlcontainer','steel',2500,'fa-cubes'],['Kupferbarren','copper',1800,'fa-microchip'],['Kohleladung','coal',2200,'fa-fire'],['Kristallsplitter','crystals',70,'fa-gem']];
const UPAK=[['Fregatten-Staffel',{frigate:4},'fa-shuttle-space'],['Zerstörer-Paar',{destroyer:2},'fa-shield-halved'],['Kreuzer-Verband',{cruiser:1,corvette:3},'fa-rocket'],['Kanonenboot-Schwarm',{gunship:5},'fa-burst'],['Diamantenfund',{_d:30},'fa-gem']];
const CRATE=[
 {n:'Gewöhnliche Kiste',c:10,col:'#94a3b8',ic:'fa-box',r:[.0006,.008,.035,.085,.26],fl:'',d:'Günstig. Meist Rohstoffe und Schiffspakete, mit Chance auf Superschiffe.'},
 {n:'Seltene Kiste',c:30,col:'#38bdf8',ic:'fa-box-open',r:[.0015,.022,.085,.32,.572],fl:'U',d:'Keine Rohstoff-Nieten. Mindestens ein Schiffspaket, oft ein Superschiff.'},
 {n:'Legendäre Kiste',c:100,col:'#fbbf24',ic:'fa-gem',r:[.005,.10,.34,.555,0],fl:'R',d:'Immer ein Superschiff (mind. Selten) mit hoher Chance auf Episch+.'}];
function crateRates(i){const o=1+tb('orc'),RT=CRATE[i].r,out={};let rem=1;'MLERU'.split('').forEach((k,j)=>{const v=Math.min(rem,j===4?RT[4]:RT[j]*o);out[k]=v;rem-=v});out.C=Math.max(0,rem);
 if(CRATE[i].fl==='U'){out.U+=out.C;out.C=0}else if(CRATE[i].fl==='R'){out.R+=out.C+out.U;out.C=out.U=0}return out}
function rollOne(tier){tier=tier||0;const p=S.pity;for(const k in p)p[k]++;const o=1+tb('orc');let t;
 if(p.m>=500)t='M';else if(p.l>=90)t='L';else{const x=Math.random(),RT=CRATE[tier].r,mr=RT[0]*o,lr=RT[1]*o+(p.l>=70?(p.l-69)*.05:0),er=RT[2]*o,rr=RT[3]*o,ur=RT[4];
  t=x<mr?'M':x<mr+lr?'L':x<mr+lr+er?'E':x<mr+lr+er+rr?'R':x<mr+lr+er+rr+ur?'U':'C';
  if(p.e>=50&&'CUR'.includes(t))t='E';else if(p.r>=20&&'CU'.includes(t))t='R';else if(p.u>=10&&t==='C')t='U'}
 {const fl=CRATE[tier].fl;if(fl==='U'&&t==='C')t='U';else if(fl==='R'&&'CU'.includes(t))t='R'}
 if(t==='M')for(const k in p)p[k]=0;else if(t==='L'){p.u=p.r=p.e=p.l=0}else if(t==='E'){p.u=p.r=p.e=0}else if(t==='R'){p.u=p.r=0}else if(t==='U')p.u=0;
 const res={t};
 if('RELM'.includes(t)){const pool=SHIPS.filter(s=>s.r===t);let s=pool[Math.floor(Math.random()*pool.length)];if(t==='L'&&S.banner==='up'&&Math.random()<.5)s=featured();
  res.id=s.id;res.name=s.name;res.icon=s.icon;S.hangar[s.id]=(S.hangar[s.id]||0)+1;res.isNew=!S.owned[s.id];S.owned[s.id]=(S.owned[s.id]||0)+1;res.sub='Stärke '+fmt(s.power)}
 else if(t==='U'){const u=UPAK[Math.floor(Math.random()*UPAK.length)];res.name=u[0];res.icon=u[2];for(const k in u[1]){if(k==='_d'){S.res.diamonds+=u[1][k];S.res.crystals+=200}else S.hangar[k]=(S.hangar[k]||0)+u[1][k]}res.sub='Im Hangar'}
 else{const c=CBUN[Math.floor(Math.random()*CBUN.length)],a=Math.round(c[2]*(.8+Math.random()*.4));S.res[c[1]]+=a;res.name=c[0];res.icon=c[3];res.sub='+'+fmt(a)+' '+RN[c[1]]}
 return res}
function gachaPull(n,tier){tier=tier||0;const cost=CRATE[tier].c*(n===10?9:n);if(!S.dev&&S.gems<cost){toast('Nicht genug Warp-Tokens.');return}if(!S.dev)S.gems-=cost;
 const out=[];for(let i=0;i<n;i++)out.push(rollOne(tier));for(const r of out){S.gh.unshift({t:r.t,n:r.name,ts:Date.now()})}S.gh=S.gh.slice(0,60);
 const best=out.some(r=>r.t==='M')?'M':out.some(r=>r.t==='L')?'L':'';playSound(best?'alert':'ok');showPulls(out);refreshUI()}
function showPulls(out){const order='MLERUC',top=[...out].sort((a,b)=>order.indexOf(a.t)-order.indexOf(b.t))[0];
 const h=`<div class="text-center mb-2 font-orbitron" style="color:${RAR[top.t].c}">${top.t==='M'?'★ MYTHISCHER FUND! ★':top.t==='L'?'LEGENDÄRER FUND!':'Ergebnis'}</div><div class="grid grid-cols-2 sm:grid-cols-5 gap-2">${out.map((r,i)=>`<div class="pullcard ${'LM'.includes(r.t)?'glowL':''}" style="color:${RAR[r.t].c};border-color:${RAR[r.t].c};animation-delay:${i*110}ms"><div class="text-[10px] font-orbitron">${RAR[r.t].n}${r.isNew?' • NEU!':''}</div><i class="fa-solid ${r.icon} text-3xl my-2"></i><div class="text-slate-100 text-[11px] font-bold">${r.name}</div><div class="text-slate-400 text-[10px]">${r.sub}</div></div>`).join('')}</div><div class="flex justify-center mt-3">${btn('Weiter','closeModal2()')}</div>`;
 $('modal2Title').textContent='ANGEHEUERT';setHtml($('modal2Body'),h);$('modal2Root').classList.remove('hidden')}
function buyTokens(n){const c=n*6000,td=dstr(new Date());if(!S.tkb||S.tkb.d!==td)S.tkb={d:td,n:0};if(!S.dev&&S.tkb.n+n>10){toast('Tageslimit: max. 10 gekaufte Tokens pro Tag.');return}if(!S.dev&&S.res.credits<c){toast('Nicht genug Credits.');return}if(!S.dev){S.res.credits-=c;S.tkb.n+=n}S.gems+=n;playSound('click');refreshUI()}
function rGacha(){const p=S.pity,tab=S.gtab||'pull',sh=SHIPS.filter(s=>s.g).sort((a,b)=>'MLER'.indexOf(a.r)-'MLER'.indexOf(b.r)||b.power-a.power),own=sh.filter(s=>S.owned[s.id]).length,ft=featured(),ord=SHIPS.filter(s=>!s.g).slice(-1)[0];
 const tabs=[['pull','Anheuern'],['col',`Sammlung ${own}/20`],['hist','Verlauf'],['rates','Raten']];
 let h=`<div class="flex flex-wrap items-center gap-1.5 mb-3"><span class="text-fuchsia-300 font-bold text-sm mr-2"><i class="fa-solid fa-circle-nodes"></i> ${fmt(S.gems)} Tokens</span>${tabs.map(([k,n])=>`<button onclick="S.gtab='${k}';renderModal()" class="px-3 py-1.5 rounded border text-[11px] font-orbitron ${tab===k?'bg-amber-900/50 border-amber-400 text-white':'bg-slate-900 border-slate-700 text-slate-300'}">${n}</button>`).join('')}</div>`;
 const bar=(l,v,m,c)=>`<div class="mb-1.5"><div class="flex justify-between text-[10px]"><span>${l}</span><span>${v}/${m}</span></div><div class="bar"><div style="width:${Math.min(100,v/m*100)}%;background:${c}"></div></div></div>`;
 if(tab==='pull'){
  h+=`<div class="grid md:grid-cols-2 gap-3">`+card(`<div class="flex gap-1 mb-2">${btn('Standard',`S.banner='std';renderModal()`,S.banner==='up'?'slate':'amber')}${btn('Rate-Up',`S.banner='up';renderModal()`,S.banner==='up'?'amber':'slate')}</div>${S.banner==='up'?`<div class="text-amber-300 font-orbitron"><i class="fa-solid ${ft.icon}"></i> ${ft.name}</div><div class="text-slate-400">Legendär-Treffer sind zu 50% dieses Schiff (Stärke ${fmt(ft.power)}). Rotiert wöchentlich.</div>`:'<div class="text-slate-300">Standard-Banner: 20 Superschiffe in 4 Seltenheitsstufen. Sie sind stärker als gleich teure normale Schiffe, aber die großen Werftschiffe (Titan-Flaggschiff: '+fmt(ord.power)+') halten gut mit.</div>'}<div class="mt-2 text-fuchsia-300">Mythisch: <b>Grim Reaper</b> – ${fmt(SHIPS.find(s=>s.r==='M').power)} Stärke (ca. 6× das stärkste Legendär-Schiff)</div>`)
  +card(`<h4 class="font-orbitron text-amber-300 mb-2">Garantien (Pity)</h4>${bar('Legendär+ (Soft-Pity ab 70)',p.l,90,RAR.L.c)}${bar('Episch+',p.e,50,RAR.E.c)}${bar('Selten+ (Superschiff)',p.r,20,RAR.R.c)}${bar('Mythisch',p.m,500,RAR.M.c)}`)+`</div>`;
  h+=`<div class="grid sm:grid-cols-3 gap-2 mt-3">${CRATE.map((c,k)=>{const r=crateRates(k),sup=r.R+r.E+r.L+r.M;return `<div class="rounded-lg p-2.5 border-2 text-center" style="border-color:${c.col};background:rgba(2,6,23,.9)"><i class="fa-solid ${c.ic} text-3xl" style="color:${c.col}"></i><div class="font-orbitron text-xs mt-1" style="color:${c.col}">${c.n}</div><div class="text-amber-300 font-bold">${c.c} Tokens</div><div class="text-[11px] text-slate-400 my-1">${c.d}</div><div class="text-[10px] text-slate-500 mb-2">Superschiff-Chance ${(sup*100).toFixed(0)}%</div><div class="flex gap-1.5 justify-center">${btn('×1 · '+c.c,`gachaPull(1,${k})`,'amber',!S.dev&&S.gems<c.c)}${btn('×10 · '+c.c*9,`gachaPull(10,${k})`,'amber',!S.dev&&S.gems<c.c*9)}</div></div>`}).join('')}</div>
  <div class="flex flex-wrap items-center gap-2 mt-3 text-slate-400">Tokens kaufen: ${btn('+1 (6.000 Cr)','buyTokens(1)','emerald',!S.dev&&S.res.credits<6000)}${btn('+5 (30.000 Cr)','buyTokens(5)','emerald',!S.dev&&S.res.credits<30000)}<span>Kauflimit 10/Tag (heute ${(S.tkb&&S.tkb.d===dstr(new Date())?S.tkb.n:0)}/10). Weitere Tokens: Tagesbelohnung, Eroberungen, Siege.</span></div>`}
 else if(tab==='col'){h+=`<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">${sh.map(s=>{const n=S.owned[s.id]||0,c=RAR[s.r].c;return n?`<div class="p-2 rounded-lg text-center border-2" style="border-color:${c};color:${c};background:rgba(2,6,23,.9)"><div class="text-[10px] font-orbitron">${RAR[s.r].n}</div><i class="fa-solid ${s.icon} text-2xl my-1"></i><div class="text-slate-100 font-bold text-[11px]">${s.name}</div><div class="text-slate-400 text-[10px]">Stärke ${fmt(s.power)} • ${(s.power/ord.power).toFixed(1)}× Flaggschiff<br>erhalten: ${n}</div></div>`:`<div class="p-2 rounded-lg text-center border border-slate-800 text-slate-600"><div class="text-[10px]">${RAR[s.r].n}</div><i class="fa-solid fa-question text-2xl my-1"></i><div>???</div></div>`}).join('')}</div>`}
 else if(tab==='hist'){h+=S.gh.length?`<div class="space-y-1">${S.gh.map(r=>`<div class="flex justify-between border-b border-slate-800 py-1" style="color:${RAR[r.t].c}"><span>${r.n}</span><span class="text-[10px]">${RAR[r.t].n} • ${new Date(r.ts).toLocaleString('de-DE')}</span></div>`).join('')}</div>`:'<div class="text-slate-500">Noch nichts angeheuert.</div>'}
 else{const inh={M:'1 Schiff (Grim Reaper)',L:'5 Superschiffe (26–32k Stärke)',E:'6 Superschiffe (16–20k)',R:'8 Superschiffe (9–12k)',U:'Schiffspakete / Diamantenfund',C:'Rohstoffpakete'};h+=CRATE.map((c,k)=>{const r=crateRates(k);return `<div class="font-orbitron text-xs mt-2 mb-1" style="color:${c.col}">${c.n} – ${c.c} Tokens</div><table class="w-full text-left"><tr class="text-slate-500"><th class="p-1">Stufe</th><th>Rate</th><th>Inhalt</th></tr>${'MLERUC'.split('').filter(q=>r[q]>0.00001).map(q=>`<tr class="border-t border-slate-800" style="color:${RAR[q].c}"><td class="p-1">${RAR[q].n}</td><td>${(r[q]*100).toFixed(2)}%</td><td class="text-slate-300">${inh[q]}</td></tr>`).join('')}</table>`}).join('')+`<div class="mt-2 text-slate-400 space-y-1"><div>• Garantien (jede geöffnete Kiste zählt): Ungewöhnlich+ alle 10, Selten+ nach 20, Episch+ nach 50, Legendär+ nach 90 (Soft-Pity ab 70), Mythisch nach 500.</div><div>• Superschiffe landen im Hangar, brauchen Energie und können wie normale Schiffe in Flotten eingeteilt werden.</div><div>• Forschung „Sternenorakel“ erhöht die Superschiff-Raten relativ.</div></div>`}
 setBody(h)}
RENDER.gacha=rGacha;

/* --- Profil, Export/Import, Developer-Modus --- */
function setName(){const n=cleanTxt($('pname').value).slice(0,18);if(!n){toast('Bitte einen Namen eingeben.');return}S.name=n;save();toast('Name gespeichert.');refreshUI()}
function exportSave(copy){save();const raw=localStorage.getItem(KEY);if(!raw){toast('Kein Spielstand vorhanden.');return}
 if(copy){(navigator.clipboard?navigator.clipboard.writeText(raw):Promise.reject()).then(()=>toast('Spielstand in die Zwischenablage kopiert.')).catch(()=>toast('Kopieren nicht möglich – bitte Datei-Export nutzen.'));return}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download=`spacetac-${cleanTxt(S.name)||'save'}-${dstr(new Date())}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Spielstand exportiert.')}
function importText(raw){try{const d=JSON.parse(raw);if(!d||d.v!==5||!d.S||!Array.isArray(d.fleets))throw 0;
 d.S.name=cleanTxt(d.S.name)||'Kommandant';d.S.dev=false;d.S.logs=[];for(const f of d.fleets)f.name=cleanTxt(f.name);
 if(!confirm('Aktuellen Spielstand durch den importierten ersetzen?'))return;localStorage.setItem(KEY,JSON.stringify(d));window.NOSAVE=true;location.reload()}catch(e){toast('Ungültiger Spielstand (falsche Version oder Datei).')}}
function importFile(inp){const f=inp.files[0];if(!f)return;const r=new FileReader();r.onload=()=>importText(String(r.result));r.readAsText(f)}
function unlockDev(){if($('devpw').value===DEVPW){S.dev=true;playSound('ok');toast('Developer-Modus aktiv: unendlich Ressourcen.');renderModal()}else{toast('Falsches Passwort.');playSound('boom')}}
function devMaxTech(){for(const t of TECHS)S.lv[t.id]=t.max;S.rq=null;recalcBonus();toast('Alle Technologien maximiert.');refreshUI()}
function devMythic(){const s=SHIPS.find(x=>x.r==='M');S.hangar[s.id]=(S.hangar[s.id]||0)+1;S.owned[s.id]=(S.owned[s.id]||0)+1;toast(s.name+' im Hangar.');refreshUI()}
function rProfile(){const L=standings(),rk=L.findIndex(s=>s.id===0)+1,me=L[rk-1]||{};
 let h=`<div class="grid md:grid-cols-2 gap-3">`+card(`<h4 class="font-orbitron text-cyan-300 mb-2"><i class="fa-solid fa-user-astronaut"></i> Kommandant</h4><div class="flex gap-2 mb-2"><input id="pname" value="${S.name}" maxlength="18" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-400">${btn('Speichern','setName()')}</div><div class="text-slate-300 space-y-0.5"><div>Rang: <b class="text-amber-300">#${rk}/${L.length}</b> • Punkte ${fmt(me.score||0)}</div><div>Kolonien: ${PS.size} • Flottenstärke ${fmt(me.power||0)}</div><div>Superschiffe gesammelt: ${SHIPS.filter(s=>s.g&&S.owned[s.id]).length}/20</div><div>Tagesbelohnungen: ${S.daily.total||0} (Streak ${S.daily.streak})</div></div>`)
 +card(`<h4 class="font-orbitron text-cyan-300 mb-2"><i class="fa-solid fa-floppy-disk"></i> Spielstand</h4><div class="flex flex-wrap gap-2 mb-2">${btn('Als Datei exportieren','exportSave(false)','emerald')}${btn('In Zwischenablage','exportSave(true)','slate')}</div><div class="mb-2"><input type="file" accept=".json,application/json" onchange="importFile(this)" class="text-slate-300 text-[11px] w-full"></div><textarea id="itxt" rows="2" placeholder="Spielstand-Text hier einfügen …" class="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white text-[10px] outline-none"></textarea><div class="mt-1">${btn('Eingefügten Text laden',"importText($('itxt').value)",'amber')} ${btn('Neues Spiel','newGame()','rose')}</div>`)+`</div>`;
 h+=card(S.dev?`<h4 class="font-orbitron text-rose-300 mb-2"><i class="fa-solid fa-terminal"></i> Developer-Modus AKTIV</h4><div class="text-slate-300 mb-2">Unendlich Ressourcen, Credits, Tokens und Energie; Forschung sofort.</div><div class="flex flex-wrap gap-2">${btn('Alle Techs maximieren','devMaxTech()','amber')}${btn('Grim Reaper erhalten','devMythic()','amber')}${btn('Deaktivieren','S.dev=false;renderModal()','slate')}</div>`:`<h4 class="font-orbitron text-slate-300 mb-2"><i class="fa-solid fa-lock"></i> Developer-Modus</h4><div class="flex gap-2"><input id="devpw" type="password" placeholder="Passwort" class="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-rose-400">${btn('Entsperren','unlockDev()','rose')}</div>`,'mt-3');
 setBody(h)}
RENDER.profile=rProfile;

/* --- Hilfe --- */
function rHelp(){setBody(`<div class="space-y-2 text-slate-300 text-[13px]"><p><b class="text-cyan-300">Ziel:</b> Du startest etwa auf <b>Rang 100</b> von 200. Baue Wirtschaft, Forschung und Flotten aus und werde die Nummer 1. <span class="text-red-400">Rot = Gegner.</span></p>
<p><b class="text-cyan-300">Flotten:</b> Im Flottenmenü zusammenstellen, aktiv setzen und auf der Karte innerhalb deines Gebietes platzieren (Doppelklick, oder auf dem Handy mit „Tippen=Bewegen“ einfach antippen).</p>
<p><b class="text-cyan-300">Verteidigung:</b> Kolonie antippen → <i>Flotte zuweisen</i>. Wachflotten verteidigen automatisch und kehren nach Gefechten zurück. Minen musst du mit einer Flotte zum Zielort bringen (Raumwerft → Mine → „Mit Flotte legen“); abgelegt werden sie erst nach einigen Sekunden scharf. Gegnerische Minen kannst du im Raketenstart anvisieren: kleine Raketen entschärfen sie, mittlere/große zünden sie (mit Kettenreaktion und Schaden an allen Flotten im Radius – Abstand halten!). Gegner-KIs greifen andere KIs und dich an, sobald in ihrer Nähe keine freien Planeten mehr zu holen sind, und beschießen Minen mit Raketen.</p>
<p><b class="text-cyan-300">Angriffswarnung:</b> Greift ein Gegner an, siehst du Ankunftszeit und einen <i>Rückzug</i>-Button, der alle Flotten im Gefahrenbereich zu einer sicheren Kolonie schickt. Offline wirst du nie angegriffen.</p>
<p><b class="text-cyan-300">Forschung:</b> Dauert Zeit (nur eine gleichzeitig), hat Ebenen und Mehrfach-Voraussetzungen. Labore und Wissenschafts-Techs beschleunigen.</p>
<p><b class="text-cyan-300">Schiffe anheuern &amp; Daily:</b> Warp-Tokens gibt es täglich, bei Siegen und per Credits. Superschiffe sind extrem stark.</p>
<p><b class="text-cyan-300">Ressourcen-Info:</b> Klicke oben in der Leiste auf eine Ressource – du siehst Produktion pro Minute, woher du sie bekommst und wofür du sie brauchst. Fahre mit der Maus über Buttons, Planeten und Flotten für Tooltips.</p>
<p><b class="text-cyan-300">Gegner-Verteidigung:</b> KI-Imperien bauen ebenfalls Minen und Flak-Plattformen (violett dargestellt – deine Minen sind gelb-orange, deine Flaks blau). Elite-Imperien (◆ mittel, ★ stark, ★★ sehr stark) haben sich weit ausgebreitet, besitzen mehr und größere Flotten und rüsten schneller auf – ideale Gegner für das späte Spiel. Ländergrenzen: dein Gebiet ist leicht blau mit markanterer Grenze, Gegner sind dezent rot, neutrale Gebiete grau (änderbar in den Einstellungen). Tarn-Jäger-Flotten sind für Gegner erst kurz vor ihrem Ziel sichtbar – deine eigenen erscheinen halbtransparent. Nahrung &amp; Wasser versorgen deine Kolonien: ein ausreichender Vorrat beider Güter steigert die Produktion aller anderen Planeten und deine Credits um bis zu +20 % (die Ressourcen-Leiste färbt sich bei knappem Vorrat gelb/rot). Pro Planet sind bis zu 8 Flak-Plattformen möglich (Forschung „Flak-Batterien“) rund um ihre Kolonien. Sie treffen nur deine Flotten – plane Angriffe also mit Abstand oder mit genug Reserve.</p></div><div class="flex gap-2 mt-4">${btn('Jetzt speichern',"save();toast('Gespeichert.')")}${btn('Profil & Spielstand',"openModal('profile')",'slate')}${btn('<i class="fa-solid fa-gear"></i> Einstellungen',"openModal('settings')",'slate')}</div>`)}
RENDER.help=rHelp;

/* --- Init --- */
function addonInit(loaded){S.name=cleanTxt(S.name).slice(0,18)||'Kommandant';if(S.tapMove===null||S.tapMove===undefined)S.tapMove=matchMedia('(pointer:coarse)').matches;
 updTapBtn();layoutVars();window.addEventListener('resize',layoutVars);setInterval(layoutVars,1500);setInterval(updDailyDot,30000);updDailyDot();
 if(loaded)offlineProgress();
 setTimeout(()=>{if(dailyState().can&&!curModal)openModal('daily')},1200)}

/* ===== ADDON 3.3.3: Ressourcen-Info, Tooltips, Grim-Reaper-FX ===== */
const FXCFG={on:true};try{if(localStorage.getItem('ge_fx')==='0')FXCFG.on=false}catch(e){}
function cycleDiff(){const d=S.diff||1;S.diff=d<1?1:d>1?.75:1.3;toast('Bot-Stärke: '+(S.diff<1?'Leicht':S.diff>1?'Schwer':'Normal'));renderModal()}
function toggleFx(){FXCFG.on=!FXCFG.on;try{localStorage.setItem('ge_fx',FXCFG.on?'1':'0')}catch(e){}toast('Screen-Effekte '+(FXCFG.on?'an':'aus'));renderModal()}

/* --- Kamera-Shake & Bildschirm-Blitz --- */
const SHAKES=[];
function shakeAdd(base,delay,dur,amp){if(FXCFG.on)SHAKES.push({t0:base+delay,dur,amp})}
function shakeOff(){if(!SHAKES.length)return[0,0];const n=performance.now();let a=0;
 for(let i=SHAKES.length-1;i>=0;i--){const s=SHAKES[i],k=(n-s.t0)/s.dur;if(k>=1){SHAKES.splice(i,1);continue}if(k<0)continue;a=Math.max(a,s.amp*(1-k)*(1-k))}
 return[Math.sin(n*.083)*a+Math.sin(n*.211)*a*.45,Math.cos(n*.097)*a+Math.cos(n*.17)*a*.45]}
function flashAdd(delay,peak,dur,mid,wx,wy){if(!FXCFG.on)return;setTimeout(()=>{const el=$('fxFlash');if(!el)return;const[sx,sy]=w2s(wx,wy),px=clamp(sx/W*100,0,100),py=clamp(sy/H*100,0,100);
 el.style.transition='none';el.style.background=`radial-gradient(circle at ${px}% ${py}%,rgba(255,255,255,.95) 0%,${mid} 22%,rgba(0,255,102,.32) 52%,rgba(0,255,102,0) 92%)`;el.style.opacity=peak;void el.offsetWidth;el.style.transition=`opacity ${dur}ms ease-out`;el.style.opacity=0},delay)}

/* --- Grim-Reaper-Schuss: Aufladen, Strahl, orange Standard-Explosionen, Shake, Blitz --- */
function mythFX(now,ax,ay,tx,ty){const G=RAR.M.c,O='#f59e0b',Y='#fde047',j=()=>(Math.random()-.5)*120;
 FX.push({k:'charge',t0:now,dur:600,x1:ax,y1:ay,s:75,c:G});
 FX.push({k:'boom',t0:now,dur:700,x1:ax,y1:ay,s:26,c:G});
 FX.push({k:'boom',t0:now+560,dur:520,x1:ax,y1:ay,s:38,c:O});               // orange Mündungsfeuer
 FX.push({k:'beam',t0:now+600,dur:750,x0:ax,y0:ay,x1:tx,y1:ty,c:G});
 for(let i=0;i<7;i++)FX.push({k:'boom',t0:now+720+i*85+Math.random()*40,dur:420,x1:tx+j()*.35,y1:ty+j()*.35,s:9+Math.random()*10,c:i%2?Y:O}); // Treffer entlang des Strahls
 FX.push({k:'boom',t0:now+1300,dur:1100,x1:tx,y1:ty,s:95,c:G});
 FX.push({k:'boom',t0:now+1300,dur:900,x1:tx,y1:ty,s:72,c:O});               // große orange Standard-Explosion
 for(let i=0;i<9;i++)FX.push({k:'boom',t0:now+1300+i*70+Math.random()*60,dur:600,x1:tx+j()*.5,y1:ty+j()*.5,s:18+Math.random()*16,c:i%3===0?Y:O});
 FX.push({k:'debris',t0:now+1300,dur:1300,x1:tx,y1:ty,s:240,c:O,p:Array.from({length:28},()=>[Math.random()*6.283,.35+Math.random()*.65,1+Math.random()*2.2])});
 for(let i=0;i<3;i++)FX.push({k:'wave',t0:now+1300+i*220,dur:1200,x1:tx,y1:ty,s:1400,c:G});
 shakeAdd(now,0,600,1.5);shakeAdd(now,600,900,3.5);shakeAdd(now,1300,1200,8);
 flashAdd(600,.2,360,'rgba(0,255,102,.55)',tx,ty);flashAdd(1300,.62,700,'rgba(251,146,60,.75)',tx,ty);
 setTimeout(()=>playSound('boom'),1300);
 return 3100}
function fxExtra(e,k){const[x,y]=w2s(e.x1,e.y1);ctx.save();
 if(e.k==='charge'){ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){const kk=(k*1.6+i/3)%1,R=(1-kk)*e.s;ctx.globalAlpha=Math.min(1,k*1.4)*kk*.9;ctx.strokeStyle=e.c;ctx.shadowColor=e.c;ctx.shadowBlur=12;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.stroke()}
  ctx.globalAlpha=.35+.65*k;ctx.fillStyle='#ecfccb';ctx.shadowColor=e.c;ctx.shadowBlur=24;ctx.beginPath();ctx.arc(x,y,2+k*9,0,6.283);ctx.fill()}
 else{ctx.fillStyle=e.c;ctx.shadowColor=e.c;ctx.shadowBlur=8;
  for(const p of e.p){const r=(1-Math.pow(1-k,2.2))*e.s*p[1];ctx.globalAlpha=(1-k)*.95;ctx.beginPath();ctx.arc(x+Math.cos(p[0])*r,y+Math.sin(p[0])*r,p[2]*(1-k*.6),0,6.283);ctx.fill()}}
 ctx.restore()}

/* --- Tooltips (schnell, auch für dynamisch erzeugte Elemente) --- */
(function(){
 const box=$('tipBox');let cur=null,tmr=null,tx=0,ty=0,cvOn=false;
 const place=(x,y)=>{const w=box.offsetWidth,h=box.offsetHeight;let px=x+14,py=y+18;if(px+w>innerWidth-6)px=x-w-10;if(py+h>innerHeight-6)py=y-h-12;box.style.left=Math.max(4,px)+'px';box.style.top=Math.max(4,py)+'px'};
 const show=(txt,x,y)=>{if(box.textContent!==txt)box.textContent=txt;box.classList.add('on');place(x,y)};
 const hide=()=>{clearTimeout(tmr);tmr=null;cur=null;cvOn=false;box.classList.remove('on')};
 window.hideTip=hide;
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;const el=e.target.closest&&e.target.closest('[title],[data-tip]');if(!el){return}
  if(el.hasAttribute('title')){const t=el.getAttribute('title');if(t){el.dataset.tip=t}el.removeAttribute('title')}
  if(!el.dataset.tip||el===cur)return;cur=el;clearTimeout(tmr);tmr=setTimeout(()=>{if(cur===el&&el.isConnected)show(el.dataset.tip,tx,ty)},220)});
 document.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;if(box.classList.contains('on'))place(tx,ty)});
 document.addEventListener('pointerout',e=>{if(cur&&!cur.contains(e.relatedTarget))hide()});
 document.addEventListener('pointerdown',()=>{if(cur)hide()});
 window.addEventListener('wheel',()=>{if(cur)hide()},{passive:true});
 setInterval(()=>{if(cur&&!cur.isConnected)hide()},250);
 /* Hover über Planeten & Flotten auf der Karte */
 const hoverText=o=>{if(o.type==='planet'){const p=planets[o.id],rk=BIOMES[p.biome].res;let t=`${p.name}\n${BIOMES[p.biome].name} • ${ownerName(p.owner)}`;
   if(p.owner===0)t+=`\nFörderanlage Lv ${p.b.mine} • +${fmtR(mineRate(p.b.mine,p)*60*S.gs)} ${RN[rk]}/Min`;else t+=`\nLiefert ${RN[rk]}`;return t+'\n(Klick für Details)'}
  const f=fleetById.get(o.id);if(!f)return'';let t=`${f.name}\n${ownerName(f.owner)} • Stärke ${fmt(fleetPower(f))}`;if(f.owner===0){t+=`\nTempo ${Math.round(fleetSpeed(f))}`;if(f.order)t+=f.order.type==='atk'?'\nBefehl: Angriff':'\nBefehl: Bewegung'}return t};
 let hT=0;
 cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;if(e.buttons){if(cvOn){cvOn=false;box.classList.remove('on')}return}
  const n=performance.now();if(n-hT<60)return;hT=n;const st=structAt(e.clientX,e.clientY);if(st){cvOn=true;show(st,e.clientX,e.clientY);return}const o=pickAt(e.clientX,e.clientY);
  if(!o){if(cvOn){cvOn=false;box.classList.remove('on')}return}cvOn=true;show(hoverText(o),e.clientX,e.clientY)});
 cv.addEventListener('pointerleave',()=>{if(cvOn){cvOn=false;box.classList.remove('on')}});
})();

/* --- Ressourcen-Infofenster (Klick auf Ressource in der oberen Leiste) --- */
function structAt(sx,sy){const near=(x,y)=>{const[a,b]=w2s(x,y);return Math.hypot(a-sx,b-sy)<11};
 for(const m of S.mines)if(near(m.x,m.y))return 'Eigene Mine'+(m.t0&&S.T<m.t0?'\n(noch nicht scharf)':'');
 for(const a of S.aa){const q=aaPos(a);if(near(q.x,q.y))return 'Eigene Flak-Plattform'}
 for(const m of (S.xm||[]))if(near(m.x,m.y)){const ai=AIS[m.o-1];return 'Gegnerische Mine'+(ai?' ('+ai.name+')':'')+(m.t0&&S.T<m.t0?'\n(noch nicht scharf)':'')}
 for(const a of (S.xa||[])){const q=aaPos(a);if(near(q.x,q.y)){const ai=AIS[a.o-1];return 'Gegnerische Flak-Plattform'+(ai?' ('+ai.name+')':'')}}
 return null}
const fmtR=n=>n>=1000?fmt(n):(Math.round(n*10)/10).toLocaleString('de-DE',{maximumFractionDigits:1});
const RMETA=k=>k==='credits'?{n:'Credits',i:'fa-coins',c:'text-amber-300'}:k==='power'?{n:'Energie',i:'fa-bolt',c:'text-yellow-400'}:k==='gems'?{n:'Warp-Tokens',i:'fa-circle-nodes',c:'text-fuchsia-300'}:RES.find(r=>r.k===k);
const ownPl=()=>[...PS].map(i=>planets[i]);
function resProd(k){const gs=S.gs,rows=[];let tot=0;
 if(k==='credits'){let hubL=0,hubV=0;for(const p of ownPl()){const h=p.b.hub*1.5*(1+tb('cred'));hubL+=p.b.hub;hubV+=h*60*gs}
  const base=PS.size*.25*60*gs;rows.push([`Kolonien (${PS.size} × ${fmtR(.25*60*gs)})`,base]);rows.push([`Handelszentren (Stufen gesamt: ${hubL})`,hubV]);tot=base+hubV;
  if(tb('cred')>0)rows.push([`Forschungsbonus Credits +${Math.round(tb('cred')*100)}%`,null])}
 else if(k!=='power'&&k!=='gems'){const bi=BIOMES.map((b,i)=>b.res===k?i:-1).filter(i=>i>=0);
  if(k==='steel'){const v=STEEL_PM*gs;rows.push(['Grundeinkommen (immer aktiv)',v]);tot+=v}
  const ps=ownPl().filter(p=>bi.includes(p.biome)&&p.b.mine>0).map(p=>({p,v:mineRate(p.b.mine,p)*60*gs})).sort((a,b)=>b.v-a.v);
  for(const x of ps.slice(0,6))rows.push([`${x.p.name} (Lv ${x.p.b.mine})`,x.v]);if(ps.length>6)rows.push([`+ ${ps.length-6} weitere Planeten`,ps.slice(6).reduce((a,x)=>a+x.v,0)]);
  tot+=ps.reduce((a,x)=>a+x.v,0);if(tb('eco')>0)rows.push([`Forschungsbonus Ertrag +${Math.round(tb('eco')*100)}%`,null]);
  const own=ownPl().filter(p=>bi.includes(p.biome)),idle=own.filter(p=>!p.b.mine);
  return{tot,rows,bi,own:own.length,idle:idle.length}}
 return{tot,rows,bi:[],own:0,idle:0}}
function resSources(k){const s=[],bn=BIOMES.filter(b=>b.res===k).map(b=>b.name);
 if(bn.length)s.push(`<b>Förderanlagen</b> auf Planeten vom Typ <b>${bn.join(', ')}</b> (Imperium-Menü: Stufen ausbauen, bis Lv ${BMAX})`);
 if(k==='steel')s.push(`<b>Grundeinkommen</b>: +${STEEL_PM}/Min ohne jeden Planeten`);
 if(k==='credits'){s.push('<b>Kolonien</b>: jede Kolonie bringt dauerhaft Credits');s.push('<b>Handelszentren</b> (Gebäude): bringen deutlich mehr Credits pro Stufe');s.push('<b>Handel</b>: Rohstoffe an der Börse verkaufen');s.push('<b>Beute</b> bei jedem Sieg über eine Kolonie oder Flotte')}
 else if(k==='power'){s.push('<b>Grundkapazität</b> 60 Energie');s.push('<b>Kraftwerke</b> (Gebäude): +35 Energie je Stufe');const t=TECHS.filter(t=>t.fx&&t.fx.pwr).map(t=>`${t.name} (+${Math.round(t.fx.pwr*100)}%/Stufe)`);if(t.length)s.push('<b>Forschung</b>: '+t.join(', '))}
 else if(k==='gems'){const dl=DAILY.map((d,i)=>d.tk?`${i+1}`:'').filter(Boolean);s.push(`<b>Tagesbelohnung</b>: ${Math.min(...DAILY.map(d=>d.tk))}–${Math.max(...DAILY.map(d=>d.tk))} Tokens je Abholung`+(tb('tok')?` (+${tb('tok')} durch Forschung)`:''));s.push('<b>Beute</b>: 1 Token bei Siegen über Gegner ab Stärke 4.000, 2 Tokens bei Eroberung einer Kolonie');s.push('<b>Kauf</b> im Anheuern-Menü: 6.000 Credits pro Token (max. 10/Tag)')}
 else{
  s.push(`<b>Handel</b>: kaufen gegen Credits (aktuell ca. ${fmtR(S.prices[k]||0)} Cr/Stück, Gebühr ${(tradeFee()*100).toFixed(1)}%)`);
  s.push(k==='diamonds'?'<b>Beute</b> aus zerstörten Gegnerflotten (nur ab Stärke 3.000, max. 10 je Sieg)':'<b>Beute</b> aus zerstörten Gegnerflotten');
  const d=DAILY.map((x,i)=>x.res&&x.res[k]?i+1:0).filter(Boolean);if(d.length)s.push(`<b>Tagesbelohnung</b> (Tag ${d.join(', ')})`);
  const cb=CBUN.filter(c=>c[1]===k).map(c=>c[0]);if(cb.length)s.push(`<b>Anheuern</b>: ${cb.join(', ')} (Rohstoffpaket)`);
  if(k==='diamonds')s.push('<b>Anheuern</b>: „Diamantenfund“ (Ungewöhnlich-Paket, +30 Diamanten)');
  if(k==='steel')s.push('<b>Beute</b> bei jedem Sieg')}
 return s}
function resUses(k){const u=[];
 if(k==='credits'){u.push('<b>Handel</b>: Rohstoffe kaufen');u.push('<b>Warp-Tokens</b> kaufen (6.000 Cr/Token, max. 10/Tag)');return u}
 if(k==='gems'){u.push('<b>Anheuern</b>: Gewöhnliche Kiste 10, Seltene Kiste 30, Legendäre Kiste 100 Tokens (×10 = 9× Preis; Garantien auf Selten, Episch, Legendär …)');return u}
 if(k==='power'){const ag={};for(const t in S.hangar)ag[t]=(ag[t]||0)+S.hangar[t];for(const f of fleets)if(f.owner===0)for(const t in f.ships)ag[t]=(ag[t]||0)+f.ships[t];
  const top=Object.entries(ag).filter(([t,n])=>n>0&&SHIP[t]).map(([t,n])=>[SHIP[t].name,SHIP[t].pw*n]).sort((a,b)=>b[1]-a[1]).slice(0,3);
  u.push('<b>Schiffe</b> verbrauchen Energie – ohne freie Energie keine weiteren Schiffe');if(top.length)u.push('Größte Verbraucher: '+top.map(([n,v])=>`${n} (${fmt(v)})`).join(', '));return u}
 if(k==='food'||k==='water'){u.push('<b>Kolonien-Versorgung</b>: Arbeiter auf jedem Planeten verbrauchen ständig Nahrung <i>und</i> Wasser (ca. 0,03 + 0,09 je Förderstufe pro Sekunde)');u.push('<b>Produktionsbonus</b>: reicht der Vorrat beider Güter für mindestens 2 Minuten, steigt die Produktion aller anderen Planeten und deine Credits um bis zu +20 %')}
 const sh=SHIPS.filter(s=>s.cost&&s.cost[k]).sort((a,b)=>a.cost[k]-b.cost[k]);if(sh.length)u.push(`<b>Schiffsbau</b>: ${sh.length} Schiffstypen (ab ${sh[0].name})`);
 const bl=Object.values(BLD).filter(b=>b.cost[k]).map(b=>b.n);if(bl.length)u.push(`<b>Gebäude</b>: ${bl.join(', ')}`);
 const df=[];if(MINE_COST[k])df.push('Weltraummine');if(AA_COST[k])df.push('Flak-Plattform');if(df.length)u.push(`<b>Verteidigung</b>: ${df.join(', ')}`);
 const te=TECHS.filter(t=>t.cost&&t.cost[k]).sort((a,b)=>a.cost[k]-b.cost[k]);if(te.length)u.push(`<b>Forschung</b>: ${te.length} Technologien (ab ${te[0].name})`);
 if(!u.length)u.push('Aktuell <b>kein Bedarf</b> in Bau, Forschung oder Schiffen – reine Handelsware');
 u.push('<b>Handel</b>: jederzeit gegen Credits verkaufbar');return u}
function resPopHtml(k){const m=RMETA(k),li=a=>a.map(x=>`<li class="mb-0.5">${x}</li>`).join('');let stock,head,body='',btns='';
 if(k==='power'){const used=powerUsed(),cap=powerCap(),dev=S.dev;stock=`${Math.floor(used)}/${dev?'∞':Math.floor(cap)}`;
  head=`<div class="text-lg font-orbitron ${used>cap?'text-rose-400':'text-yellow-300'}">${dev?'∞':Math.max(0,Math.floor(cap-used))} frei</div><div class="text-[11px] text-slate-400">Kapazität ${dev?'∞':Math.floor(cap)} • Verbrauch ${Math.floor(used)}</div>`;
  body=`<div class="text-slate-400 text-[11px]">Grundkapazität 60 • Kraftwerk-Stufen ${bsum('power')} × ${fmt(35*(1+tb('pwr')))}</div>`;btns=btn('Imperium öffnen',"goModal('empire')",'cyan')}
 else if(k==='gems'){stock=fmt(S.gems);head=`<div class="text-lg font-orbitron text-fuchsia-300">${fmt(S.gems)} Tokens</div><div class="text-[11px] text-slate-400">Keine laufende Produktion – Tokens kommen aus Belohnungen und Käufen.</div>`;btns=btn('Schiffe anheuern',"goModal('gacha')",'amber')+btn('Tagesbelohnung',"goModal('daily')",'emerald')}
 else{const r=resProd(k);stock=fmt(S.res[k]);let net=r.tot,sbox='';
  if(k==='food'||k==='water'){const su=supplyInfo(),dm=su.dem*60*S.gs;r.rows.push(['Verbrauch der Kolonien (Arbeiter)',-dm]);net=r.tot-dm;
   sbox=`<div class="mt-1.5 rounded border border-slate-700/70 p-1.5 ${su.bonus>0?'text-emerald-300':'text-slate-400'}">Versorgung: Nahrung ${Math.round(su.cF*100)}% • Wasser ${Math.round(su.cW*100)}%<br>Produktionsbonus aktuell <b>+${Math.round(su.bonus*100)}%</b> auf alle anderen Planeten &amp; Credits${net<0?`<br><span class="text-rose-300">Vorrat reicht noch ca. ${fmtR(Math.round(S.res[k]/Math.abs(net)*10)/10)} Min</span>`:''}</div>`}
  const sp=S.gs!==1?` (bei ${S.gs}x Tempo)`:'';
  head=(r.tot>0||net<0)?`<div class="text-lg font-orbitron ${net<0?'text-rose-400':m.c}">${net<0?'−':'+'}${fmtR(Math.abs(net))} / Min${net!==r.tot?' (netto)':''}</div><div class="text-[11px] text-slate-400">≈ ${fmt(Math.abs(net)*60)} pro Stunde${sp}</div>`:`<div class="text-lg font-orbitron text-slate-400">0 / Min</div><div class="text-[11px] text-slate-400">Keine laufende Produktion</div>`;
  body=r.rows.length?`<div class="mt-1.5 space-y-0.5">${r.rows.map(([t,v])=>`<div class="flex justify-between gap-2"><span class="text-slate-300">${t}</span><b class="${v===null?'hidden':v<0?'text-rose-400':m.c}">${v<0?'−':'+'}${fmtR(Math.abs(v||0))}</b></div>`).join('')}</div>`:'';
  if(r.bi.length&&!r.own)body+=`<div class="mt-1.5 text-amber-300">${k==='steel'?'Ein Eisenkern-Planet mit Förderanlage erhöht deine Stahlproduktion zusätzlich zum Grundeinkommen.':'Du besitzt noch keinen Planeten dieses Typs – erobere einen oder kaufe im Handel.'}</div>`;
  else if(r.idle)body+=`<div class="mt-1.5 text-amber-300">${r.idle} deiner Planeten dieses Typs ${r.idle===1?'hat':'haben'} noch keine Förderanlage.</div>`;
  body+=sbox;btns=(r.bi.length||k==='credits'?btn('Imperium',"goModal('empire')",'cyan'):'')+btn('Handel',"goModal('trade')",'emerald')}
 return `<div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><i class="fa-solid ${m.i} ${m.c} text-xl"></i><div><div class="font-orbitron text-sm text-white">${m.n}</div><div class="text-[11px] text-slate-400">Bestand: <b class="text-slate-200">${stock}</b></div></div></div><button onclick="hideResPop()" class="text-slate-400 hover:text-white px-1"><i class="fa-solid fa-xmark"></i></button></div>
 <div class="rounded-lg bg-slate-900/70 border border-slate-700/70 p-2">${head}${body}</div>
 <div class="mt-2.5 font-orbitron text-[10px] tracking-widest text-cyan-400">WO BEKOMMST DU ES?</div><ul class="list-disc pl-4 text-slate-300 mt-1">${li(resSources(k))}</ul>
 <div class="mt-2.5 font-orbitron text-[10px] tracking-widest text-rose-300">WOFÜR WIRD ES GEBRAUCHT?</div><ul class="list-disc pl-4 text-slate-300 mt-1">${li(resUses(k))}</ul>
 <div class="flex flex-wrap gap-2 mt-3">${btns}</div>`}
let resPopKey=null;
function placePop(el){const pop=$('resPop'),r=el.getBoundingClientRect();pop.style.left=clamp(r.left,8,Math.max(8,innerWidth-pop.offsetWidth-8))+'px';pop.style.top=Math.min(r.bottom+8,Math.max(8,innerHeight-120))+'px';pop.style.maxHeight=Math.max(160,innerHeight-r.bottom-20)+'px'}
function showResPop(k,el){const pop=$('resPop');resPopKey=k;if(window.hideTip)hideTip();pop._h=null;setHtml(pop,resPopHtml(k));pop.classList.remove('hidden');placePop(el);
 document.querySelectorAll('#resBar .act').forEach(x=>x.classList.remove('act'));el.classList.add('act');playSound('click')}
function hideResPop(){resPopKey=null;$('resPop').classList.add('hidden');document.querySelectorAll('#resBar .act').forEach(x=>x.classList.remove('act'))}
function goModal(m){hideResPop();if(curModal!==m)openModal(m)}
$('resBar').addEventListener('click',e=>{const el=e.target.closest('[data-res]');if(!el)return;const k=el.dataset.res;if(k==='rank'){openModal('rank');return}if(resPopKey===k)hideResPop();else showResPop(k,el)});
document.addEventListener('pointerdown',e=>{if(resPopKey&&!e.target.closest('#resPop')&&!e.target.closest('[data-res]'))hideResPop()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&resPopKey)hideResPop()});
setInterval(()=>{if(resPopKey){const pop=$('resPop');setHtml(pop,resPopHtml(resPopKey))}},700);
