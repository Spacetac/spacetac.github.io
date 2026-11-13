/* ===== KI ===== */
const RUSH=()=>Math.max(0,Math.min(1,1-(S.T-600)/1800));
const SNOW_START=60000,SNOW_RAMP=80000,SNOW_MAXPL=40;
let _snId=0,_snAt=-1;
function snowLeader(){if(S.T<_snAt)return _snId;_snAt=S.T+120;let b=0,id=0;for(const a of AIS)if(!a.dead&&a.planets>b){b=a.planets;id=a.id}_snId=id;return id}
const SNOWK=()=>S.T<SNOW_START?0:Math.min(1,(S.T-SNOW_START)/SNOW_RAMP)*Math.max(0,1-PS.size/SNOW_MAXPL);
const SNOW=ai=>{const k=SNOWK();return k>0&&ai.id===snowLeader()?k:0};
function aiGachaShip(ai){const T=S.T,sk=ai.skill,pool=[];
 if(T>1500&&sk>.35)pool.push('R');if(T>3600&&sk>.5)pool.push('E');if(T>7000&&sk>.7)pool.push('L');
 if(!pool.length)return null;const t=pool[Math.floor(Math.pow(Math.random(),1.2)*pool.length)],l=SHIPS.filter(s=>s.g&&s.r===t);return l[Math.floor(Math.random()*l.length)].id}
function aiGrow(ai){
 ai.tech=Math.min(24,Math.floor(S.T/330*(.5+ai.skill*.7)));{const el=ELV(ai);if(el===2)ai.tech=24;else if(el===1)ai.tech=Math.max(ai.tech,15);else if(S.meds&&S.meds[ai.id])ai.tech=Math.max(ai.tech,6)}
 const mine=fleets.filter(f=>f.owner===ai.id);
 if(!ai.planets&&!mine.length){ai.dead=true;return}
 const income=ai.planets?1.08*Math.min(1,.5+S.T/2400)*(15+6*ai.planets)*(1+S.T/3000)*(.8+ai.skill*.5)*EF(ai):0,maxTier=Math.min(TIERMAX,2+Math.floor(ai.tech/3));ai.bank=Math.min(60000*(1+SNOW(ai)*100),(ai.bank||0)+income);const budget=Math.min(ai.bank,income*3);
 let f;
 if(!mine.length){const hp=aiSpawnPlanet(ai);if(!hp)return;f=newFleet(ai.id,ai.name+' Flotte',{},true,hp.x+(Math.random()-.5)*200,hp.y+(Math.random()-.5)*200);f.ax=f.x;f.ay=f.y}
 else{const pool=mine.filter(x=>!isStealthFleet(x));if(pool.length)f=pool[Math.floor(Math.random()*pool.length)];else{const hp=aiSpawnPlanet(ai);if(!hp)return;f=newFleet(ai.id,ai.name+' Flotte',{},true,hp.x,hp.y);f.ax=f.x;f.ay=f.y}}
 if(fleetPower(f)<30000*EF(ai)&&budget>=30){const g=genShips(budget,maxTier,Math.random);for(const t in g)f.ships[t]=(f.ships[t]||0)+g[t];ai.bank-=Math.min(budget,basePower(g))}
 {let gc=0;for(const x of fleets)if(x.owner===ai.id)for(const t in x.ships)if(SHIP[t].g)gc+=x.ships[t];
  if(gc<2+Math.min(5,Math.floor(S.T/3200*(.45+ai.skill)))&&S.T>=(ai.gachaAt||700)){ai.gachaAt=S.T+450+Math.random()*700;const id=aiGachaShip(ai);if(id)f.ships[id]=(f.ships[id]||0)+1}}
 if(mine.length<(RUSH()>0?7:4)&&fleetPower(f)>(RUSH()>0?260:1200)&&Math.random()<.5){const g={};for(const t in f.ships){const h=Math.floor(f.ships[t]/2);if(h>0){g[t]=h;f.ships[t]-=h}}
  if(basePower(g)){const n=newFleet(ai.id,ai.name+' Flotte',g,true,f.x,f.y);n.ax=f.ax;n.ay=f.ay}}

 for(let k=0;k<(ai.planets>=8?2:1);k++){if(ai.bank>600&&mine.length+k<Math.min(8+ELV(ai)*4+Math.floor(SNOW(ai)*60),2+Math.floor(ai.planets*.6))+(ai.style==='def'?0:2)+Math.round(RUSH()*4)){const hp=aiSpawnPlanet(ai);if(hp){const g=genShips(Math.min(ai.bank,4000*(1+SNOW(ai)*20)),maxTier,Math.random),bp=basePower(g);if(bp){ai.bank-=bp;const n=newFleet(ai.id,ai.name+' Flotte',g,true,hp.x+(Math.random()-.5)*200,hp.y+(Math.random()-.5)*200);n.ax=n.x;n.ay=n.y}}}}
 aiStealth(ai)
}
function aiSpawnPlanet(ai){const own=[];for(const i of PS){const p=planets[i];if(p&&p.owner===ai.id)own.push(p)}if(!own.length)return aiHomePlanet(ai);const cp=planets[S.capital]||{x:0,y:0},pick=()=>own[Math.floor(Math.random()*own.length)],a=pick(),b=pick();return Math.hypot(b.x-cp.x,b.y-cp.y)<Math.hypot(a.x-cp.x,a.y-cp.y)?b:a}
function aiHomePlanet(ai){const h=planets[ai.home];return h&&h.owner===ai.id?h:planets.find(p=>p.owner===ai.id)}
const aiCap=ai=>Math.max(2,Math.round(((ai.style==='def'?6:8)+Math.floor(S.T/800*(.5+ai.skill))+Math.round(RUSH()*22)+Math.floor(SNOW(ai)*4000))*Math.pow(S.diff||1,.6)));
const aggrOf=ai=>ai.aggr*(ai.style==='def'?1.3:.8)*(1-.4*SNOW(ai));
function think(f){
 if(f.owner<=0||f.dead)return;const ai=AIS[f.owner-1];
 if(f.order){checkWarn(f);return}
 if(f.cool>0||S.T<12||!basePower(f.ships))return;
 {const rv=aiRevenge(f,ai);if(rv){setAttack(f,rv.kind,rv.id);checkWarn(f);return}}
 let best=null,bs=1e18;
 const cx=cellX(f.x),cy=cellY(f.y),mayTake=S.T>=ai.capAt&&ai.planets<aiCap(ai);
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const p=planetAt(cx+dx,cy+dy);if(!mayTake||!p||p.owner===f.owner||Math.hypot(p.x-f.x,p.y-f.y)>AGGRO)continue;
  const e=estimate(f.ships,f.owner,defendersOf('planet',p));if(e.aE>=e.dE*aggrOf(ai)&&e.dE<bs){bs=e.dE;best={kind:'planet',id:p.id}}}
 for(const g of nearby(f.x,f.y,ai.style==='def'?2200:AGGRO,g=>g.owner!==f.owner)){const e=estimate(f.ships,f.owner,defendersOf('fleet',g));if(e.aE>=e.dE*aggrOf(ai)&&e.dE<bs){bs=e.dE;best={kind:'fleet',id:g.id}}}
 if(!best&&mayTake&&S.T>=ai.expAt){ai.expAt=S.T+.75*((2+Math.random()*4+(1-RUSH())*(80+Math.random()*150))*(1-.9*SNOW(ai)));let bsc=1e18;const R=RUSH()>.3?5:6;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const p=planetAt(cx+dx,cy+dy);if(!p||p.owner===f.owner)continue;if(RUSH()>.3&&p.owner!==-1)continue;
   const e=estimate(f.ships,f.owner,defendersOf('planet',p));if(e.aE<e.dE*aggrOf(ai)*1.2)continue;const sc=(Math.hypot(p.x-f.x,p.y-f.y)+e.dE*2)*(p.owner===-1?1:(S.T<1200?3:1));if(sc<bsc){bsc=sc;best={kind:'planet',id:p.id}}}}
 if(!best)best=aiWar(f,ai);if(best){setAttack(f,best.kind,best.id);checkWarn(f)}
}
function checkWarn(f){const o=f.order;if(!o||o.type!=='atk'||fleetVis(f)<.5)return;const t=targetPos(o);if(!t||t.owner!==0)return;
 const key=o.kind+':'+o.id;if(f.alK===key)return;f.alK=key;f.alerted=S.T;
 pushAlert(`${ownerName(f.owner)} greift ${t.name} an! Stärke ${fmt(fleetPower(f))}, Ankunft in ca. ${Math.round(Math.hypot(t.x-f.x,t.y-f.y)/fleetSpeed(f)/S.gs)} s`,t.x,t.y,{kind:o.kind,id:o.id,aid:f.id})}
