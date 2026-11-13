/* ===== ZUSTAND ===== */
let S={res:{steel:600,coal:300,copper:250,food:400,water:400,crystals:80,diamonds:10,credits:400},hangar:{},lv:{},logs:[],nextF:1,T:0,gs:1,prices:{},prev:{},manage:null,tq:100,tab:'weapons',capital:0,gems:30,pity:{u:0,r:0,e:0,l:0,m:0},gh:[],owned:{},name:'Kommandant',daily:{last:'',streak:0,total:0},lastSeen:0,rq:null,tapMove:null,banner:'std',dev:false};
let BON={};function recalcBonus(){BON={};for(const t of TECHS){const l=S.lv[t.id]||0;for(const k in t.fx)BON[k]=(BON[k]||0)+l*t.fx[k]}}
const tb=k=>BON[k]||0;
let planets=[],AIS=[],fleets=[],fleetById=new Map(),PS=new Set(),FH=new Map(),activeFleet=null,sel=null,lastAlert=null,alertTimer=null;
const PRE=['Alpha','Zeta','Astra','Kepler','Nova','Cyber','Xenon','Kronos','Omega','Vortex','Orion','Helios','Titan','Apex','Solaria'];
const SUF=['Prime','Major','Reach','IX','Valhalla','Outpost','Haven','Garrison','Nexus','Terminus','Corridor','Forge'];
const ADJ=['Eiserne','Stille','Rote','Dunkle','Goldene','Ferne','Wilde','Frostige','Glühende','Ewige','Blinde','Kalte'];
const NOUN=['Legion','Allianz','Horde','Dynastie','Flotte','Union','Kabale','Republik','Garde','Syndikat','Imperium','Bund','Armada','Konklave','Front','Meute','Orden'];
const AI0=['Bananenkopf','Player123','CyberLord','AstraImperial','VortexSovereign','VoidWalker','StarRuler','NebulaKing','NexusAI','ShadowEmpire'];

function genShips(power,maxTier,rnd){const d={};let rem=power,g=0;
 while(rem>=10&&g++<40){const c=[];for(let i=0;i<=maxTier;i++)if(SHIPS[i].power<=rem)c.push(i);if(!c.length)break;
  const i=rnd()<.55?c[c.length-1]:c[Math.floor(rnd()*c.length)];const n=Math.max(1,Math.floor(rem*(.25+rnd()*.5)/SHIPS[i].power));
  d[SHIPS[i].id]=(d[SHIPS[i].id]||0)+n;rem-=n*SHIPS[i].power}
 return d}
const basePower=d=>{let b=0;for(const t in d)b+=SHIP[t].power*d[t];return b};
const countShips=d=>{let b=0;for(const t in d)b+=d[t];return b};
const cellX=x=>clamp(Math.floor((x+HALF)/CELL),0,N-1),cellY=y=>clamp(Math.floor((y+HALF)/CELL),0,N-1);
const planetAt=(cx,cy)=>(cx<0||cy<0||cx>=N||cy>=N)?null:planets[cy*N+cx];
const ownerName=o=>o===0?(S.name||'Kommandant')+' (Du)':o>0?AIS[o-1].name+((S.elites&&S.elites[o])===2?' ★★':(S.elites&&S.elites[o])===1?' ★':(S.meds&&S.meds[o])?' ◆':''):'Unbesetzt';
const ownerColor=o=>o===0?'#22d3ee':o>0?'#ef4444':'#64748b';

/* ===== WELT ===== */
function generateWorld(){
 const rng=mulberry32(SEED);planets=new Array(N*N);AIS=[];
 for(let cy=0;cy<N;cy++)for(let cx=0;cx<N;cx++){const id=cy*N+cx;
  planets[id]={id,x:Math.round(-HALF+(cx+.5)*CELL+(rng()-.5)*1500),y:Math.round(-HALF+(cy+.5)*CELL+(rng()-.5)*1500),r:12+rng()*14,biome:Math.floor(rng()*6),rich:.7+rng()*.8,
   name:`${PRE[Math.floor(rng()*PRE.length)]} ${SUF[Math.floor(rng()*SUF.length)]} #${id+1}`,owner:-1,garrison:{},b:{mine:0,power:0,turret:0,lab:0,hub:0,yard:0},dirty:false}}
 let homes=new Set(),homeArr=[];
 {let sh=null,legacy=false;try{const raw=localStorage.getItem(KEY);if(raw){const d0=JSON.parse(raw);if(d0&&d0.v===5&&d0.S){if(Array.isArray(d0.S.homes)&&d0.S.homes.length)sh=d0.S.homes;else legacy=true}}}catch(e){}
  if(sh)homeArr=sh.slice();
  else if(legacy){while(homes.size<399)homes.add(Math.floor(rng()*N*N));homeArr=[...homes]}
  else{const NB=520+Math.floor(Math.random()*61);let tr=0;while(homeArr.length<NB&&tr<80000){tr++;const cx=Math.floor(Math.random()*N),cy=Math.floor(Math.random()*N),lim=tr<40000?3:2;let ok=true;for(const h of homeArr){if(Math.max(Math.abs(h%N-cx),Math.abs(Math.floor(h/N)-cy))<lim){ok=false;break}}if(ok)homeArr.push(cy*N+cx)}}
  homes=new Set(homeArr);S.homes=homeArr}
 let ph=null,bestD=-1;
 for(let t=0;t<800;t++){const p=planets[cellY(rng()*HALF-HALF/2)*N+cellX(rng()*HALF-HALF/2)];let md=1e9;for(const h of homeArr){const q=planets[h];md=Math.min(md,Math.hypot(p.x-q.x,p.y-q.y))}
  if(md>bestD){bestD=md;ph=p}if(md>=12000)break}
 /* Spawn: neues Spiel -> zufälliger Startplatz (weit genug von Gegnern); bestehender Spielstand behält seine Hauptwelt */
 {let capOv=-1;try{const raw=localStorage.getItem(KEY);if(raw){const d0=JSON.parse(raw);if(d0&&d0.v===5&&d0.S&&Number.isInteger(d0.S.capital)&&planets[d0.S.capital])capOv=d0.S.capital}}catch(e){}
  if(capOv>=0)ph=planets[capOv];
  else{let bp=null,bd2=-1;for(let t=0;t<1500;t++){const p=planets[cellY((Math.random()*2-1)*HALF*.9)*N+cellX((Math.random()*2-1)*HALF*.9)];if(homes.has(p.id))continue;let md=1e9;for(const h of homeArr){const q=planets[h];md=Math.min(md,Math.hypot(p.x-q.x,p.y-q.y))}
   if(md>bd2){bd2=md;bp=p}if(md>=16000)break}
   if(bp)ph=bp}}
 S.capital=ph.id;
 homeArr.forEach((hid,i)=>{const nm=i<10?AI0[i]:`${ADJ[i%ADJ.length]} ${NOUN[Math.floor(i/ADJ.length)%NOUN.length]}${i>=ADJ.length*NOUN.length?' '+['','II','III','IV'][Math.min(3,Math.floor(i/(ADJ.length*NOUN.length)))]:''}`;
  AIS.push({id:i+1,name:nm,hue:Math.round((i*137.5)%360),col:`hsl(${Math.round((i*137.5)%360)},70%,58%)`,tech:0,aggr:1.25+rng()*.55,skill:rng(),growT:4+rng()*12,expAt:3+rng()*10,capAt:2+rng()*6,style:(((i+1)*2654435761)>>>0)%100<45?'def':'off',planets:0,home:hid,dead:false})});
 for(const p of planets){if(homes.has(p.id)||p.id===ph.id)continue;
  const d=Math.hypot(p.x-ph.x,p.y-ph.y),r=rng();let pw,mt,tu;
  if(d<12000||r<.62){pw=15+rng()*75;mt=pw>50?2:1;tu=0}else if(r<.9){pw=120+rng()*380;mt=3;tu=Math.floor(rng()*2)}else if(r<.98){pw=600+rng()*1900;mt=5;tu=1+Math.floor(rng()*3)}else{pw=3000+rng()*6000;mt=7;tu=3+Math.floor(rng()*4)}
  p.garrison=genShips(pw,mt,rng);p.b.turret=tu}
 AIS.forEach(ai=>{const hp=planets[ai.home];hp.owner=ai.id;hp.garrison=genShips(200+rng()*200,2,rng);hp.b.turret=1;
  let got=0;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,-1]]){if(got>=2)break;const q=planetAt(cellX(hp.x)+dx,cellY(hp.y)+dy);if(q&&q.owner===-1){q.owner=ai.id;q.garrison=genShips(70+rng()*110,2,rng);q.b.turret=1;got++}}
  for(let k=0;k<2;k++){const f={id:S.nextF++,owner:ai.id,name:ai.name+' Flotte',x:hp.x+(rng()-.5)*300,y:hp.y+(rng()-.5)*300,ships:genShips(45+rng()*85,2,rng),placed:true,order:null,cool:0,h:0,wait:rng()*5};
   f.ax=f.x;f.ay=f.y;fleets.push(f);fleetById.set(f.id,f)}
  });
 ph.owner=0;ph.garrison={};ph.b={mine:1,power:1,turret:0,lab:0,hub:0,yard:0};
 recount();
}
function recount(){PS.clear();AIS.forEach(a=>a.planets=0);for(const p of planets){if(p.owner===0)PS.add(p.id);else if(p.owner>0)AIS[p.owner-1].planets++}}
function setOwner(p,o){if(p.owner===0)PS.delete(p.id);if(p.owner>0)AIS[p.owner-1].planets--;p.owner=o;p.dirty=true;if(o===0)PS.add(p.id);if(o>0)AIS[o-1].planets++}
