/* ===== FLOTTEN ===== */
function addFleet(f){fleets.push(f);fleetById.set(f.id,f)}
function removeFleet(f){f.dead=true;fleetById.delete(f.id);const i=fleets.indexOf(f);if(i>=0)fleets.splice(i,1);if(activeFleet===f.id)setActive(null);if(sel&&sel.type==='fleet'&&sel.id===f.id)closeTarget()}
function newFleet(owner,name,ships,placed,x,y){const f={id:S.nextF++,owner,name,x:x||0,y:y||0,ships:ships||{},placed:!!placed,order:null,cool:0,h:0,wait:0,ax:x||0,ay:y||0};addFleet(f);return f}
function rebuildHash(){FH.clear();for(const f of fleets){if(f.dead||(f.owner===0&&!f.placed))continue;const k=cellY(f.y)*N+cellX(f.x);let a=FH.get(k);if(!a)FH.set(k,a=[]);a.push(f)}}
function nearby(x,y,r,pred){const out=[],cx=cellX(x),cy=cellY(y),k=Math.ceil(r/CELL);
 for(let dy=-k;dy<=k;dy++)for(let dx=-k;dx<=k;dx++){const x2=cx+dx,y2=cy+dy;if(x2<0||y2<0||x2>=N||y2>=N)continue;const a=FH.get(y2*N+x2);if(!a)continue;
  for(const f of a)if(!f.dead&&pred(f)&&Math.hypot(f.x-x,f.y-y)<=r)out.push(f)}return out}
function defendersOf(kind,obj){
 if(kind==='planet'){const dm=mods(obj.owner),fl=obj.owner===-1?[]:nearby(obj.x,obj.y,900*(1+(obj.owner===0?tb('grad'):0)),f=>f.owner===obj.owner);
  return{kind,obj,owner:obj.owner,dicts:[obj.garrison,...fl.map(f=>f.ships)],fleets:fl,turret:obj.b.turret*TURRET*(1+dm.pdef),name:obj.name}}
 const fl=[obj,...nearby(obj.x,obj.y,520,f=>f.owner===obj.owner&&f!==obj)];
 return{kind,obj,owner:obj.owner,dicts:fl.map(f=>f.ships),fleets:fl,turret:0,name:obj.name+' ('+ownerName(obj.owner)+')'}}
function estimate(ships,ao,info){const am=mods(ao),dm=mods(info.owner);
 const aE=basePower(ships)*(1+am.atk)*(1+am.arm)*(info.kind==='planet'?1+am.bomb:1);
 let dB=0;for(const d of info.dicts)dB+=basePower(d);
 return{aE,dE:dB*(1+dm.atk)*(1+dm.arm)+info.turret*(1-am.tdis)}}
function applyLoss(dicts,frac){const tally={};for(const d of dicts)for(const t of Object.keys(d)){const n=d[t];const lost=frac>=1?n:Math.min(n,Math.floor(n*frac+Math.random()));
 if(lost>0){tally[t]=(tally[t]||0)+lost;d[t]=n-lost;if(d[t]<=0)delete d[t]}}return tally}
function lossFrac(ratio){return Math.min(.95,.06+.82*Math.pow(clamp(ratio,0,1),1.25))}
function fight(f,info){const {aE,dE}=estimate(f.ships,f.owner,info);
 const a=aE*(.85+Math.random()*.30),d=dE*(.85+Math.random()*.30),win=a>d,am=mods(f.owner),dm=mods(info.owner);
 const L=win?lossFrac(d/a):lossFrac(a/d);
 const attFrac=win?L*(1-am.rep):1,defFrac=win?1:L*(1-dm.rep);
 return{win,aE,dE,attFrac,defFrac,attLost:applyLoss([f.ships],attFrac),defLost:applyLoss(info.dicts,defFrac)}}
function targetPos(o){if(o.kind==='planet'){const p=planets[o.id];return{x:p.x,y:p.y,owner:p.owner,name:p.name}}const t=fleetById.get(o.id);if(!t||t.dead)return null;return{x:t.x,y:t.y,owner:t.owner,name:t.name}}
let placing=null;
const FX=[],GH=[];let FXG=2860;
const atkRange=f=>{for(const t in f.ships)if(f.ships[t]>0&&SHIP[t].r==='M')return 800;return 260};
function spawnBattle(f,tx,ty,defOwner,r,myth){const [sx,sy]=w2s(tx,ty);if(sx<-W||sx>2*W||sy<-H||sy>2*H||FX.length>500)return 0;
 const now=performance.now(),dur=2600,ax=f.x,ay=f.y,
  ac=f.owner===0?'#38bdf8':'#ef4444',dc=defOwner===0?'#38bdf8':defOwner>0?'#ef4444':'#fbbf24',n=Math.round(clamp(8+Math.log10(1+r.aE+r.dE)*4.5,10,34)),j=()=>(Math.random()-.5)*120;
 if(myth){FXG=1350;return mythFX(now,ax,ay,tx,ty)}
 FXG=2860;
 const add=(x0,y0,x1,y1,c,t0)=>{FX.push({k:'shot',t0,dur:260,x0,y0,x1,y1,c});FX.push({k:'boom',t0:t0+260,dur:400,x1,y1,s:8+Math.random()*9,c:'#fde047'})};
 for(let i=0;i<n;i++){const t0=now+Math.random()*dur;add(ax+j()*.4,ay+j()*.4,tx+j()*.6,ty+j()*.6,ac,t0);if(i%2===0)add(tx+j()*.6,ty+j()*.6,ax+j()*.4,ay+j()*.4,dc,t0+Math.random()*200)}
 FX.push({k:'boom',t0:now+dur,dur:900,x1:tx,y1:ty,s:45,c:r.win?ac:dc});return dur+500}
function resolveAttack(f){
 const o=f.order;let tgt;
 if(o.kind==='planet'){tgt=planets[o.id];if(tgt.owner===f.owner){f.order=null;return}}
 else{tgt=fleetById.get(o.id);if(!tgt||tgt.dead||tgt.owner===f.owner||(tgt.owner===0&&!tgt.placed)){f.order=null;return}}
 const info=defendersOf(o.kind,tgt),defOwner=info.owner,attName=ownerName(f.owner),tname=tgt.name,tx=tgt.x,ty=tgt.y;
 const myth=Object.keys(f.ships).some(t=>f.ships[t]>0&&SHIP[t].r==='M'),snap=[f,...info.fleets].map(d=>({d,x:d.x,y:d.y,h:d.h,owner:d.owner,rc:fleetRarCol(d)}));const r=fight(f,info);const fxd=spawnBattle(f,tx,ty,defOwner,r,myth);
 if(fxd){const nw=performance.now();for(const sn of snap)if(!basePower(sn.d.ships))GH.push({x:sn.x,y:sn.y,h:sn.h,owner:sn.owner,rc:sn.rc,until:nw+(sn.d===f?fxd-200:FXG)})}
 f.order=null;f.cool=f.owner>0?Math.round(3+22*(1-RUSH())):25;let captured=false,held=false;
 for(const d of info.fleets)if(d!==f&&!basePower(d.ships))removeFleet(d);
 if(o.kind==='planet')tgt.dirty=true;
 if(r.win&&o.kind==='planet'){
  if(tgt.id===S.capital&&f.owner!==0)held=true;
  else{captured=true;const prev=tgt.owner;
   if(f.owner===0){tgt.garrison={};tgt.b={mine:1,power:0,turret:0,lab:0,hub:0,yard:0}}
   else{tgt.garrison=genShips(40+Math.random()*80,Math.min(TIERMAX,2+Math.floor(AIS[f.owner-1].tech/3)),Math.random);tgt.b={mine:0,power:0,turret:prev===0?1:Math.min(tgt.b.turret,2),lab:0,hub:0,yard:0}}
   setOwner(tgt,f.owner);{const off=(tgt.r||20)*1.4+22;let dx=f.x-tgt.x,dy=f.y-tgt.y,dd=Math.hypot(dx,dy);if(dd<1){const an=Math.random()*6.283;dx=Math.cos(an);dy=Math.sin(an);dd=1}f.ax=tgt.x+dx/dd*off;f.ay=tgt.y+dy/dd*off}if(f.owner===0&&basePower(f.ships))f.order={type:'move',x:f.ax,y:f.ay};if(f.owner>0)AIS[f.owner-1].capAt=S.T+.75*((prev===-1?(2+Math.random()*5+(1-RUSH())*(100+Math.random()*150)):150+Math.random()*250)*(1-.9*SNOW(AIS[f.owner-1])))}}
 const left=Object.assign({},f.ships),attDead=!basePower(f.ships);if(attDead)removeFleet(f);
 const win=r.win;
 if(f.owner===0||defOwner===0){
  const rep={win,aE:r.aE,dE:r.dE,attName,defName:info.name,attLost:r.attLost,defLost:r.defLost,left,captured,held,planet:o.kind==='planet',playerAtt:f.owner===0};
  const res=f.owner===0?(win?'SIEG':'NIEDERLAGE'):(win?'Verteidigung verloren':'Verteidigung erfolgreich');
  addLog(`[GEFECHT] ${attName} → ${tname}: ${res}${captured?(f.owner===0?' – Planet erobert!':' – Planet verloren!'):''}`,tx,ty);
  if(f.owner===0){if(win)rep.loot=lootHook(info,r,captured,o.kind==='fleet');if(fxd)setTimeout(()=>showReport(rep),fxd);else showReport(rep);playSound(win?'ok':'boom')}
  else{pushAlert(`${attName} hat ${tname} angegriffen – ${win?(captured?'Planet verloren!':'Verteidigung durchbrochen!'):'Angriff abgewehrt!'}`,tx,ty)}
  refreshUI()}
}
function setAttack(f,kind,id){f.order={type:'atk',kind,id}}
