/* ===== SIMULATION ===== */
let thinkPtr=0,hashT=0;
function update(dt){
 const g=dt*S.gs;S.T+=g;tickAddon(g);
 // Wirtschaft
 const sup=supplyInfo(),sb=1+sup.bonus;
 for(const i of PS){const p=planets[i],b=p.b,rk=BIOMES[p.biome].res;
  if(b.mine)S.res[rk]+=mineRate(b.mine,p)*g*((rk==='food'||rk==='water')?1:sb);
  S.res.credits+=(.25+b.hub*1.5*(1+tb('cred')))*g*sb}
 S.res.food=Math.max(0,S.res.food-sup.dem*g);S.res.water=Math.max(0,S.res.water-sup.dem*g);
 // Markt
 if(S.T-(S.mT||0)>8){S.mT=S.T;for(const r of RES){S.prev[r.k]=S.prices[r.k];const p=S.prices[r.k];S.prices[r.k]=clamp(p+(r.p-p)*.15+r.p*(Math.random()-.5)*.14,r.p*.5,r.p*2)}if(curModal==='trade')refreshUI()}
 // Flotten
 for(const f of fleets){if(f.dead||(f.owner===0&&!f.placed))continue;
  if(f.cool>0)f.cool-=g;if(f.hold>performance.now())continue;
  let tx,ty,mul=1,o=f.order;
  if(o){if(o.type==='move'||o.type==='mine'){tx=o.x;ty=o.y}else{const t=targetPos(o);if(!t){f.order=null;continue}tx=t.x;ty=t.y}}
  else if(f.owner>0){if(f.wp){tx=f.wp.x;ty=f.wp.y;mul=.2}else{f.wait-=g;if(f.wait<=0){const a=Math.random()*6.283,r=200+Math.random()*1400;f.wp={x:clamp(f.ax+Math.cos(a)*r,-HALF+300,HALF-300),y:clamp(f.ay+Math.sin(a)*r,-HALF+300,HALF-300)}}continue}}
  else continue;
  const dx=tx-f.x,dy=ty-f.y,d=Math.hypot(dx,dy),step=fleetSpeed(f)*mul*g;
  if(d>1)f.h=Math.atan2(dy,dx);
  const arrive=o&&o.type==='atk'?atkRange(f):6;
  if(d<=Math.max(arrive,step)){if(o&&o.type==='mine'){f.x=tx;f.y=ty;deployMine(f)}else if(!o||o.type==='move'){f.x=tx;f.y=ty;if(o){f.order=null;f.retreat=false}else{f.wp=null;f.wait=2+Math.random()*5}}
   else resolveAttack(f)}
  else{f.x+=dx/d*step;f.y+=dy/d*step}}
 // KI
 hashT+=dt;if(hashT>.5){hashT=0;rebuildHash()}
 const K=Math.min(40,Math.ceil(8*S.gs));
 for(let k=0;k<K&&fleets.length;k++){thinkPtr=(thinkPtr+1)%fleets.length;think(fleets[thinkPtr])}
 for(const ai of AIS)if(!ai.dead&&S.T>=ai.growT){ai.growT=S.T+((8+Math.random()*10)+(1-RUSH())*(27+Math.random()*15))*.85;aiGrow(ai)}
 for(const ai of AIS)if(!ai.dead&&S.T>=(ai.defAt||0))aiDefend(ai);
}

/* ===== ALARME / LOG ===== */
function addLog(text,x,y){S.logs.unshift({t:new Date().toLocaleTimeString('de-DE'),text,x,y});if(S.logs.length>60)S.logs.pop();renderLog()}
function renderLog(){const el=$('logPanel');if(el.classList.contains('hidden'))return;
 setHtml(el,S.logs.map(l=>`<div class="p-1 border-b border-slate-800/60 ${l.x!==undefined?'cursor-pointer hover:bg-slate-800/60':''}" ${l.x!==undefined?`onclick="jumpTo(${Math.round(l.x)},${Math.round(l.y)})"`:''}>${l.t} ${l.text}${l.x!==undefined?' <i class="fa-solid fa-location-crosshairs text-cyan-400"></i>':''}</div>`).join('')||'<div class="text-slate-500">Keine Einträge</div>')}
function toggleLog(){$('logPanel').classList.toggle('hidden');renderLog()}
function pushAlert(text,x,y){lastAlert={text,x,y};$('alertText').textContent=text;$('alertBanner').classList.remove('hidden');playSound('alert');addLog('[ALARM] '+text,x,y);
 clearTimeout(alertTimer);alertTimer=setTimeout(hideAlert,20000)}
function hideAlert(){$('alertBanner').classList.add('hidden')}
function alertJump(){if(lastAlert)jumpTo(lastAlert.x,lastAlert.y);hideAlert()}
function jumpTo(x,y){cam.x=x;cam.y=y;cam.zoom=clamp(Math.max(cam.zoom,W<700?.3:.4),MINZ,MAXZ);playSound('click')}
let toastT=null;function toast(msg){const t=$('toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.add('hidden'),3200)}
function cycleSpeed(){S.gs=S.gs===1?2:S.gs===2?4:S.gs===4?10:1;$('speedBtn').textContent=S.gs+'x'}
