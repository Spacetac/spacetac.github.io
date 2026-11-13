/* ===== v4.4.4: Platzier-Popup (Beenden-Button), Flak per Einzeltipp ===== */
(function(){
const pop=document.createElement('div');pop.id='placePopup';
pop.style.cssText='position:fixed;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);z-index:100000;display:none;align-items:center;gap:10px;max-width:calc(100vw - 16px);width:max-content;padding:8px 12px;border-radius:10px;background:rgba(2,6,23,.97);border:1px solid #22d3ee;box-shadow:0 4px 24px rgba(0,0,0,.6);color:#a5f3fc;font-size:12px;line-height:1.3';
pop.innerHTML='<i class="fa-solid fa-satellite-dish" style="color:#22d3ee"></i><span id="placeTxt" style="min-width:0"></span><button id="placeEnd" style="flex:none;min-height:40px;padding:4px 12px;border-radius:8px;border:1px solid #fb7185;background:#4c0519;color:#fff;font-weight:700;white-space:nowrap">Beenden</button>';
document.body.appendChild(pop);
window.endPlacing=function(){placing=null;try{setActive(null)}catch(e){}pop.style.display='none';try{toast('Platzierung beendet.')}catch(e){}try{refreshUI()}catch(e){}};
$('placeEnd').addEventListener('click',e=>{e.stopPropagation();endPlacing()});
const names={aa:'Flak',mine:'Mine',shield:'Schild'};
function upd(){
 if(!placing){pop.style.display='none';return}
 let t;
 if(placing==='aa')t='Flak platzieren: Tippe auf einen eigenen Planeten (Vorrat: '+(S.stock.aa||0)+')';
 else{try{t=placeHint()}catch(e){t=(names[placing]||'Objekt')+' platzieren'}}
 $('placeTxt').textContent=t;pop.style.display='flex';$('hintBar').classList.add('hidden')}
setInterval(upd,200);
/* Flak: ein Tipp auf einen eigenen Planeten platziert; kein Doppeltippen/Bewegen im Platziermodus */
const _ot=onTap;
onTap=function(x,y){
 if(placing==='aa'){
  const [wx,wy]=s2w(x,y);let hit=false;
  for(const i of PS){const p=planets[i];if(p&&Math.hypot(p.x-wx,p.y-wy)<=Math.max(p.r*1.5,28/cam.zoom)){hit=true;break}}
  if(hit){placeDef(x,y);upd();return}
  return onClick(x,y)}
 return _ot(x,y)};
const _odb=onDouble;onDouble=function(x,y){if(placing==='aa')return;return _odb(x,y)};
})();

/* ===== v4.4.5: 0,5x-Tempo, Bot-Flak-Cluster + Flak-Schild-Kombis, aktivere Bot-Kriege ===== */
(function(){
/* --- 1) Geschwindigkeit: 0,5x / 1x / 2x / 4x / 10x --- */
const SPD=[.5,1,2,4,10],spdLbl=v=>(v===.5?'0,5':String(v))+'x';
function syncSpd(){const b=$('speedBtn');if(!b)return;const t=spdLbl(S.gs);if(b.textContent!==t)b.textContent=t;
 b.title='Spielgeschwindigkeit 0,5x / 1x / 2x / 4x / 10x – wirkt auf Produktion, Forschung und Flotten (Klick = wechseln)'}
cycleSpeed=function(){const i=SPD.indexOf(S.gs);S.gs=SPD[i<0?1:(i+1)%SPD.length];syncSpd()};
setInterval(syncSpd,500);syncSpd();

/* --- 2) Bots: mehrere Flaks je Planet (gleichmäßig verteilt) + Flak-Schild-Kombis --- */
const TAU=6.2832;
function angFree(pid,cap){const ex=S.xa.filter(a=>a.pid===pid).map(a=>a.ang),base=(pid%9)*.35;
 for(let k=0;k<cap;k++){const a=base+k*TAU/cap;
  if(!ex.some(e=>Math.abs((((e-a+Math.PI)%TAU)+TAU)%TAU-Math.PI)<.9*Math.PI/cap))return a}
 return null}
const threatened=p=>nearby(p.x,p.y,6000,e=>e.owner!==p.owner&&!e.dead&&(e.owner>0||e.placed)&&basePower(e.ships)>600).length>0;
function fortify(ai){
 ensureAD();ensureX();if(ai.dead||ai.planets<1)return;
 const lv=ELV(ai),def=ai.style==='def',u=unl(ai,'flak');if(u<=0||(ai.dbank||0)<300)return;
 const cap=Math.max(1,Math.min(8,Math.ceil((def?3+Math.floor(ai.tech/3)+lv:2+Math.floor(ai.tech/4)+lv)*u)));
 const own=planets.filter(p=>p.owner===ai.id);if(!own.length)return;
 const cnt={};for(const a of S.xa)if(a.o===ai.id)cnt[a.pid]=(cnt[a.pid]||0)+1;
 const totF=Object.values(cnt).reduce((s,x)=>s+x,0),maxF=Math.ceil(ai.planets*(def?1.3:.8)*u)+2;if(totF>=maxF)return;
 const hp=planets[ai.home];
 const sc=p=>(threatened(p)?-100:0)+(hp&&p.id===hp.id?-20:0)+(cnt[p.id]||0)*3+Math.random()*2;
 const cand=own.filter(p=>(cnt[p.id]||0)<cap).sort((a,b)=>sc(a)-sc(b));if(!cand.length)return;
 const p=cand[0],c=cnt[p.id]||0;let n=Math.min(cap-c,threatened(p)?3:2,Math.floor(ai.dbank/300),maxF-totF);
 if(!c&&n<2&&def)n=Math.min(n,1);
 for(let k=0;k<n;k++){const a=angFree(p.id,cap);if(a===null)break;
  S.xa.push({id:S.nextB=(S.nextB||0)+1,pid:p.id,ang:a,o:ai.id});ai.dbank-=300}
 /* Kombi: Planet mit >=2 Flaks bekommt ein Schild über dem Flak-Ring */
 const su=unl(ai,'shield');if(su<=0||ai.tech<2||ai.planets<2||Math.max(ai.bank||0,ai.dbank||0)<700)return;
 const myS=S.xs.filter(s=>s.o===ai.id),sCap=Math.max(1,Math.floor(Math.min(3+lv*3,2+Math.floor(ai.planets/2))*su));if(myS.length>=sCap)return;
 const cn2={};for(const a of S.xa)if(a.o===ai.id)cn2[a.pid]=(cn2[a.pid]||0)+1;
 const tgt=own.filter(q=>(cn2[q.id]||0)>=2&&!myS.some(s=>Math.hypot(s.x-q.x,s.y-q.y)<SH_R*.8)).sort((x,y)=>(cn2[y.id]||0)+(threatened(y)?5:0)-(cn2[x.id]||0)-(threatened(x)?5:0))[0];
 if(!tgt)return;const a=Math.random()*TAU,x=tgt.x+Math.cos(a)*60,y=tgt.y+Math.sin(a)*60;
 if(aiStartDrop(ai,'s',x,y)){if((ai.dbank||0)>=600)ai.dbank-=600;else ai.bank-=600}}
let _ft=0,_fp=0;
function fortTick(g){_ft+=g;if(_ft<4)return;_ft=0;if(!AIS.length)return;
 for(let n=0;n<6;n++){const ai=AIS[_fp=(_fp+1)%AIS.length];if(!ai||ai.dead||S.T<(ai.fortAt||0))continue;
  ai.fortAt=S.T+(ai.style==='def'?12:22)+Math.random()*14;try{fortify(ai)}catch(e){console.warn(e)}}}

/* --- 3) Bot-Kriege: Kriegserklärungen, Gegenschläge, Ausnutzen schwacher Nachbarn --- */
let _wt=0,_wl=-99;
function minDist(A,B){let d=1e18;const sa=Math.max(1,Math.floor(A.length/8)),sb=Math.max(1,Math.floor(B.length/8));
 for(let i=0;i<A.length;i+=sa)for(let j=0;j<B.length;j+=sb){const e=Math.hypot(A[i].x-B[j].x,A[i].y-B[j].y);if(e<d)d=e}return d}
function warTick(g){_wt+=g;if(_wt<8)return;_wt=0;if(S.T<500)return;
 const grp={};for(const p of planets)if(p&&p.owner>0)(grp[p.owner]||(grp[p.owner]=[])).push(p);
 const alive=AIS.filter(a=>!a.dead&&grp[a.id]&&grp[a.id].length);if(alive.length<2)return;
 const pw={};for(const f of fleets)if(f.owner>0&&!f.dead)pw[f.owner]=(pw[f.owner]||0)+fleetPower(f);
 for(const ai of alive){
  const foe=ai.wFoe?AIS[ai.wFoe-1]:null;
  if(foe&&!foe.dead&&S.T<(ai.wUntil||0)){
   if(grudgeVal(ai,foe.id)<3)grudgeAdd(ai,foe.id,.6);
   if((ai.revAt||0)>S.T+20)ai.revAt=S.T+8+Math.random()*10;
   if((ai.huntAt||0)>S.T+25)ai.huntAt=S.T+8+Math.random()*12;
   continue}
  if(ai.wFoe){ai.wFoe=0;ai.wRest=S.T+300+Math.random()*400}
  if(S.T<(ai.wRest||0))continue;
  const pers=ai.pers==='rusher'?1.6:ai.pers==='turtle'?.35:1;
  if(Math.random()>.04*(ai.style==='def'?.5:1)*pers)continue;
  let best=null,bs=1e18;
  for(let k=0;k<6;k++){const o=alive[Math.floor(Math.random()*alive.length)];if(o===ai)continue;
   const d=minDist(grp[ai.id],grp[o.id]);if(d>16*CELL)continue;
   const s=d*(.6+Math.min(2.5,(pw[o.id]||1)/Math.max(1,pw[ai.id]||1)));if(s<bs){bs=s;best=o}}
  if(!best)continue;
  ai.wFoe=best.id;ai.wUntil=S.T+240+Math.random()*240;
  grudgeAdd(ai,best.id,2.2);grudgeAdd(best,ai.id,1.6);
  if(S.T-_wl>20){_wl=S.T;const hp=planets[ai.home]||grp[ai.id][0];addLog('[KRIEG] '+ai.name+' erklärt '+best.name+' den Krieg!',hp.x,hp.y)}}}

const _xt=xTick;xTick=function(g){_xt(g);try{fortTick(g);warTick(g)}catch(e){console.warn(e)}};
})();

/* ===== v4.4.6: Flottenkämpfe zwischen Bots, Verstärkung, Schutz vor zu starken Nachbarn ===== */
(function(){
const gP=f=>fleetPower(f),botF=f=>f&&!f.dead&&f.owner>0&&basePower(f.ships)>0,
 canMove=f=>botF(f)&&!f.order&&!f.xdrop&&!isStealthFleet(f);
let _rl=-99,_bl=-99,_lg=-99;

/* --- 1) Gnadenfrist: starke Elite-Bots greifen den Spieler erst später an (Gegenwehr/Rache ausgenommen) --- */
const graceT=ai=>{const e=ELV(ai);return e===2?1800:e===1?1200:(S.meds&&S.meds[ai.id])?600:0};
{const _sa=setAttack;setAttack=function(f,kind,id){
 if(f&&f.owner>0&&(kind==='planet'||kind==='fleet')){const ai=AIS[f.owner-1],t=ai&&targetPos({kind,id});
  if(t&&t.owner===0&&S.T<graceT(ai)&&grudgeVal(ai,0)<1)return}
 return _sa(f,kind,id)}}

/* --- 2) Einmalige Korrektur: zu nahe am Spieler gestartete Elite-Bots werden herabgestuft --- */
function nearFix(){
 if(!S.elites||S.nearFix)return;S.nearFix=1;
 const cap=planets[S.capital];if(!cap)return;if(!S.meds)S.meds={};
 const pl=[...PS].map(i=>planets[i]);pl.push(cap);
 const MIN={2:40000,1:25000,3:14000},NEXT={2:1,1:3,3:0},CF={1:9000,3:2500,0:1200},CG={1:700,3:250,0:200},CB={1:4000,3:600,0:400},CT={1:2,3:1,0:1};
 const scale=(d,capP)=>{const p=basePower(d);if(p<=capP||p<=0)return;const k=capP/p;for(const t of Object.keys(d)){const n=Math.floor(d[t]*k);if(n>0)d[t]=n;else delete d[t]}};
 for(const ai of AIS){if(ai.dead)continue;const hp=planets[ai.home];if(!hp)continue;
  const orig=S.elites[ai.id]||(S.meds[ai.id]?3:0);if(!orig)continue;
  let d=1e18;for(const p of pl)d=Math.min(d,Math.hypot(p.x-hp.x,p.y-hp.y));
  let lvl=orig;while(lvl&&d<MIN[lvl])lvl=NEXT[lvl];if(lvl===orig)continue;
  delete S.elites[ai.id];delete S.meds[ai.id];if(lvl===3)S.meds[ai.id]=1;else if(lvl)S.elites[ai.id]=lvl;
  const mine=fleets.filter(f=>f.owner===ai.id&&!f.dead);let tot=0;for(const f of mine)tot+=basePower(f.ships);
  if(tot>CF[lvl]){const k=CF[lvl]/tot;for(const f of mine){for(const t of Object.keys(f.ships)){const n=Math.floor(f.ships[t]*k);if(n>0)f.ships[t]=n;else delete f.ships[t]}}}
  for(const f of mine)if(!basePower(f.ships))removeFleet(f);
  for(const p of planets)if(p.owner===ai.id){scale(p.garrison,CG[lvl]);p.b.turret=Math.min(p.b.turret,CT[lvl]);p.dirty=true}
  ai.bank=Math.min(ai.bank||0,CB[lvl]);ai.dbank=Math.min(ai.dbank||0,CB[lvl])}}

/* --- 3) Verstärkung: angegriffene Bots rufen eigene Flotten und befreundete Nachbarn zu Hilfe --- */
function rally(h,att,obj,kind){
 if(Math.hypot(att.x-obj.x,att.y-obj.y)<4500)h.order={type:'atk',kind:'fleet',id:att.id};
 else{const dx=att.x-obj.x,dy=att.y-obj.y,l=Math.hypot(dx,dy)||1,off=kind==='planet'?320:140;
  h.order={type:'move',x:clamp(obj.x+dx/l*off+(Math.random()-.5)*160,-HALF+100,HALF-100),y:clamp(obj.y+dy/l*off+(Math.random()-.5)*160,-HALF+100,HALF-100)};h.wp=null}
 h.rein={a:att.id,until:S.T+360};h.retreat=false}
let _rt=0;
function reinfTick(g){_rt+=g;if(_rt<4)return;_rt=0;
 /* Notaufgebot-Truppen treffen verzögert auf dem Planeten ein */
 if(S.lev&&S.lev.length)for(let i=S.lev.length-1;i>=0;i--){const l=S.lev[i];if(S.T<l.at)continue;S.lev.splice(i,1);
  const p=planets[l.pid],ai=AIS[l.o-1];if(!p||!ai||ai.dead||p.owner!==l.o)continue;
  const gr=genShips(l.amt,Math.min(TIERMAX,2+Math.floor(ai.tech/3)),Math.random);for(const t in gr)p.garrison[t]=(p.garrison[t]||0)+gr[t];p.dirty=true;
  if(S.T-_lg>10){_lg=S.T;addLog('[VERSTÄRKUNG] '+ai.name+' mobilisiert Truppen auf '+p.name+'.',p.x,p.y)}}
 /* Anflug laufender Verstärkungen */
 for(const f of fleets){if(!f.rein||f.dead)continue;const a=fleetById.get(f.rein.a);
  if(!a||a.dead||S.T>f.rein.until){f.rein=null;continue}
  if(!f.order){if(Math.hypot(a.x-f.x,a.y-f.y)<4500)f.order={type:'atk',kind:'fleet',id:a.id};else f.rein=null}}
 /* neue Bedrohungen sammeln: Flotten (Bots oder Spieler), die einen Bot-Planeten/-Flotte angreifen */
 const m={};
 for(const f of fleets){const o=f.order;if(f.dead||!o||o.type!=='atk'||(f.owner===0&&!f.placed)||(o.kind!=='planet'&&o.kind!=='fleet'))continue;
  const obj=o.kind==='planet'?planets[o.id]:fleetById.get(o.id);if(!obj||obj.dead||obj.owner<=0||obj.owner===f.owner)continue;
  if(Math.hypot(obj.x-f.x,obj.y-f.y)>12000)continue;(m[obj.owner]||(m[obj.owner]=[])).push({att:f,kind:o.kind,id:o.id,obj})}
 let budget=10;
 for(const k in m){const v=+k,ai=AIS[v-1];if(!ai||ai.dead)continue;
  for(const th of m[k].sort((a,b)=>gP(b.att)-gP(a.att)).slice(0,2)){if(budget<=0)return;
   const key=th.att.id+':'+th.id;if(!ai.rk||ai.rkN>60){ai.rk={};ai.rkN=0}if((ai.rk[key]||0)>S.T)continue;ai.rk[key]=S.T+60;ai.rkN++;budget--;
   const e=estimate(th.att.ships,th.att.owner,defendersOf(th.kind,th.obj));if(e.aE<e.dE*.9)continue;
   const need=e.aE*1.15-e.dE,att=th.att,obj=th.obj;let sum=0,n=0;
   /* eigene Flotten */
   for(const h of nearby(obj.x,obj.y,10*CELL,x=>x.owner===v&&canMove(x)&&x!==obj).sort((a,b)=>Math.hypot(a.x-obj.x,a.y-obj.y)-Math.hypot(b.x-obj.x,b.y-obj.y))){
    if(sum>=need||n>=4)break;rally(h,att,obj,th.kind);sum+=gP(h);n++}
   /* Nachbarn mit Groll gegen den Angreifer (oder Kriegsgegner) helfen mit */
   if(sum<need&&Math.random()<.4){let m2=0;
    for(const h of nearby(obj.x,obj.y,9*CELL,x=>x.owner>0&&x.owner!==v&&x.owner!==att.owner&&canMove(x))){
     const a2=AIS[h.owner-1];if(!a2||a2.dead||!(grudgeVal(a2,att.owner)>.8||a2.wFoe===att.owner))continue;
     rally(h,att,obj,th.kind);sum+=gP(h);n++;if(++m2>=2||sum>=need)break}}
   /* Notaufgebot: zusätzliche Garnison, trifft nach kurzer Zeit ein */
   if(th.kind==='planet'&&sum<need&&(ai.bank||0)>=300&&S.T>=(ai.levyAt||0)){const amt=Math.min(ai.bank*.3,(need-sum)*.7);
    if(amt>=100){ai.bank-=amt;ai.levyAt=S.T+80;(S.lev=S.lev||[]).push({pid:th.id,o:v,at:S.T+20+Math.random()*25,amt});if(S.lev.length>200)S.lev.shift()}}
   if(n>0&&S.T-_rl>8){_rl=S.T;addLog('[VERSTÄRKUNG] '+ai.name+' schickt '+n+' Flotte(n) zur Hilfe'+(th.kind==='planet'?' nach '+obj.name:'')+'!',obj.x,obj.y)}}}}

/* --- 4) Flottengefechte: Bots suchen aktiv Kämpfe gegen fremde Bot-Flotten (auch im Rudel) --- */
let _st=0;
function skirmishTick(g){_st+=g;if(_st<6)return;_st=0;if(S.T<300)return;let started=0;
 for(const f of fleets)if(f.skUntil&&S.T>f.skUntil){f.skUntil=0;if(f.order&&f.order.type==='atk'&&f.order.kind==='fleet')f.order=null}
 for(const f of fleets){if(started>=6)break;
  if(!canMove(f)||(f.cool||0)>0||S.T<(f.skT||0))continue;
  const ai=AIS[f.owner-1];if(!ai||ai.dead)continue;f.skT=S.T+18+Math.random()*24;
  const fp=gP(f);if(fp<300)continue;
  const foe=ai.wFoe||0,cand=nearby(f.x,f.y,foe?9000:5500,x=>x.owner>0&&x.owner!==f.owner&&basePower(x.ships)>0&&!isStealthFleet(x));if(!cand.length)continue;
  const mates=nearby(f.x,f.y,2500,x=>x!==f&&x.owner===f.owner&&canMove(x)&&(x.cool||0)<=0).slice(0,2);
  let cp=fp;for(const x of mates)cp+=gP(x);
  let best=null,bs=1e18;
  for(const x of cand){const hate=x.owner===foe?1:Math.min(1,grudgeVal(ai,x.owner)/2);
   if(Math.random()>(x.owner===foe?.8:.12+.5*hate))continue;
   const e=estimate(f.ships,f.owner,defendersOf('fleet',x)),aE=e.aE*(cp/fp);if(aE<e.dE*aggrOf(ai)*(x.owner===foe?.8:.95))continue;
   const sc=Math.hypot(x.x-f.x,x.y-f.y)+e.dE*.5;if(sc<bs){bs=sc;best=x}}
  if(!best)continue;
  f.order={type:'atk',kind:'fleet',id:best.id};f.skUntil=S.T+240;started++;
  for(const x of mates){x.order={type:'atk',kind:'fleet',id:best.id};x.skUntil=S.T+240}}}

/* --- 5) Gefechtsmeldungen für Bot-gegen-Bot-Kämpfe --- */
{const _ra=resolveAttack;resolveAttack=function(f){const o=f.order,a=f.owner;let dO=-9,dn='',tx=f.x,ty=f.y;
 try{if(o&&o.type==='atk'&&(o.kind==='planet'||o.kind==='fleet')){const t=targetPos(o);if(t){dO=t.owner;dn=t.name;tx=t.x;ty=t.y}}}catch(e){}
 const r=_ra(f);
 try{if(a>0&&dO>0&&dO!==a&&S.T-_bl>5){_bl=S.T;const cap=o.kind==='planet'&&planets[o.id]&&planets[o.id].owner===a;
  addLog('[GEFECHT] '+ownerName(a)+' ⚔ '+ownerName(dO)+' ('+dn+'): '+(cap?'Planet erobert':f.dead?'Angreifer vernichtet':'Kampf'),tx,ty)}}catch(e){}
 return r}}

const _xt=xTick;xTick=function(g){_xt(g);try{nearFix();reinfTick(g);skirmishTick(g)}catch(e){console.warn(e)}};
})();

/* ===== v4.4.7: Raketen-Rebalancing – bestehende Pakete auf neue Werte umstellen ===== */
{const _xt=xTick;xTick=function(g){_xt(g);try{if(S.rkFix!==2){S.rkFix=2;for(const f of fleets)for(const q of f.rk||[]){if(RKD[q.t]){q.n=RKD[q.t].n;q.d=RKD[q.t].d}}}}catch(e){console.warn(e)}}}
