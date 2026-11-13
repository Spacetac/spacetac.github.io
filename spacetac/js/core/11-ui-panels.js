/* ===== UI HELFER ===== */
const btn=(label,onclick,color='cyan',dis=false,extra='')=>{const col={cyan:'bg-slate-800 hover:bg-cyan-900 text-cyan-300 border-cyan-500/40',rose:'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-500/40',amber:'bg-amber-950/50 hover:bg-amber-900 text-amber-300 border-amber-500/40',emerald:'bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border-emerald-500/40',slate:'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600'}[color];
 return `<button onclick="${onclick}" class="px-2 py-1 rounded border text-[11px] font-orbitron transition ${col} ${dis?'dis':''} ${extra}">${label}</button>`};
const card=(inner,cls='')=>`<div class="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 ${cls}">${inner}</div>`;
const pct=v=>Math.round(v*100)+'%';

/* ===== ZIEL-PANEL ===== */
function closeTarget(){sel=null;$('targetPanel').classList.add('hidden')}
function renderTarget(force){
 const panel=$('targetPanel');if(!sel){panel.classList.add('hidden');return}
 let det='',act='',type='',title='';
 if(sel.type==='planet'){const p=planets[sel.id];if(!p){closeTarget();return}const bio=BIOMES[p.biome];
  type=p.owner===0?'EIGENE KOLONIE':p.owner>0?'FREMDE KOLONIE':'UNBESETZTER PLANET';title=p.name;
  const info=defendersOf('planet',p),e=estimate({},p.owner,info);
  det=`<div>Besitzer: <b style="color:${ownerColor(p.owner)}">${ownerName(p.owner)}</b></div><div>Typ: <b style="color:${bio.color}">${bio.name}</b> (${RN[bio.res]}, Reichtum ${pct(p.rich)})</div><div>Koordinaten: [${p.x}, ${p.y}]</div>`;
  if(p.owner===0)det+=`<div>Förderanlage Lv ${p.b.mine} • Turm Lv ${p.b.turret}</div><div>Stationiert: <b class="text-emerald-300">${info.fleets.length}</b> Flotte(n) • Verteidigung <b class="text-cyan-300">${fmt(e.dE)}</b></div>`;
  else det+=`<div class="pt-1 text-slate-400">Garnison:</div><div>${shipsHtml(p.garrison)}</div><div>Geschütztürme: Lv ${p.b.turret}</div><div>Gesamtverteidigung: <b class="text-rose-300">${fmt(e.dE)}</b></div>`;
  act=p.owner===0?btn('<i class="fa-solid fa-gear"></i> Kolonie verwalten',`manageFromMap(${p.id})`)+btn('<i class="fa-solid fa-shield-halved"></i> Flotte zuweisen',`openGuard(${p.id})`,'emerald')+(p.id===S.capital?'<div class="text-[10px] text-amber-300">Hauptwelt – kann nicht erobert werden</div>':''):btn('<i class="fa-solid fa-crosshairs"></i> '+(p.owner===-1?'Erobern':'Angreifen'),`openAttack('planet',${p.id})`,'rose')}
 else{const f=fleetById.get(sel.id);if(!f||f.dead){closeTarget();return}
  type=f.owner===0?'EIGENE FLOTTE':'FREMDE FLOTTE';title=f.name;
  det=`<div>Besitzer: <b style="color:${ownerColor(f.owner)}">${ownerName(f.owner)}</b></div><div>Position: [${Math.round(f.x)}, ${Math.round(f.y)}]</div><div>Stärke: <b style="color:${f.owner===0?'#67e8f9':ownerColor(f.owner)}">${fmt(fleetPower(f))}</b> • Tempo ${Math.round(fleetSpeed(f))}</div><div>${shipsHtml(f.ships)}</div>`;
  if(f.order)det+=`<div class="text-amber-300">Status: ${f.order.type==='atk'?'Angriffsflug':f.order.type==='mine'?'Minentransport':'Unterwegs'}</div>`;if(f.guard!=null&&planets[f.guard])det+=`<div class="text-emerald-300">Bewacht ${planets[f.guard].name}</div>`;
  act=f.owner===0?btn('<i class="fa-solid fa-jet-fighter"></i> Flottenmenü',`openModal('fleets')`)+(f.order?btn('Befehl abbrechen',`recallFleet(${f.id})`,'amber'):''):btn('<i class="fa-solid fa-crosshairs"></i> Angreifen',`openAttack('fleet',${f.id})`,'rose')}
 panel.classList.remove('hidden');$('targetType').textContent=type;$('targetTitle').textContent=title;setHtml($('targetDetails'),det);setHtml($('targetActions'),act)}
function manageFromMap(id){S.manage=id;openModal('empire')}

/* ===== ANGRIFFS-MENÜ ===== */
let atk=null;
function openAttack(kind,id){
 const placed=fleets.filter(f=>f.owner===0&&f.placed&&basePower(f.ships)>0);
 if(!placed.length){toast('Du hast keine platzierte Flotte! Erstelle und platziere zuerst eine Flotte im Flottenmenü.');return}
 const t=kind==='planet'?planets[id]:fleetById.get(id);
 let pre=activeFleet&&placed.find(f=>f.id===activeFleet)?activeFleet:null;
 if(!pre){let bd=1e18;for(const f of placed){const d=Math.hypot(f.x-t.x,f.y-t.y);if(d<bd){bd=d;pre=f.id}}}
 atk={kind,id,fid:pre};renderAttack();$('modal2Root').classList.remove('hidden');playSound('click')}
function renderAttack(){
 if(!atk)return;const t=atk.kind==='planet'?planets[atk.id]:fleetById.get(atk.id);if(!t||t.dead){closeModal2();return}
 const info=defendersOf(atk.kind,t),placed=fleets.filter(f=>f.owner===0&&f.placed&&basePower(f.ships)>0);
 const mine=fleetById.get(atk.fid),dm=mods(info.owner),am=mods(0);
 let dEnemy=0;for(const d of info.dicts)dEnemy+=basePower(d);
 const allShips={};for(const d of info.dicts)for(const k in d)allShips[k]=(allShips[k]||0)+d[k];
 let est=mine?estimate(mine.ships,0,info):{aE:0,dE:estimate({},0,info).dE};
 const ratio=est.dE>0?est.aE/est.dE:9,win=ratio>1;
 const lw=win?lossFrac(est.dE/est.aE):1,verdict=ratio>1.3?['Sieg sehr wahrscheinlich','text-emerald-400']:ratio>1.05?['Sieg wahrscheinlich, knapp','text-lime-400']:ratio>.9?['Ausgeglichen – riskant!','text-amber-400']:['Niederlage wahrscheinlich','text-rose-400'];
 const eta=mine?Math.hypot(mine.x-t.x,mine.y-t.y)/fleetSpeed(mine):0;
 let h=`<div class="grid md:grid-cols-2 gap-3">`+card(`<h4 class="font-orbitron text-rose-300 mb-1">Feindliche Streitkräfte</h4><div class="mb-1">Ziel: <b>${info.name}</b></div>${info.kind==='planet'?`<div class="text-slate-400">Garnison & stationierte Flotten (${info.fleets.length}):</div>`:`<div class="text-slate-400">Flotte & Begleiter (${info.fleets.length}):</div>`}<div class="my-1">${shipsHtml(allShips)}</div>${info.turret?`<div>Geschütztürme: <b>${fmt(info.turret*(1-am.tdis))}</b> Stärke</div>`:''}<div class="mt-1">Effektive Gesamtstärke: <b class="text-rose-300 text-sm">${fmt(est.dE)}</b></div><div class="text-[10px] text-slate-500">Basisstärke ${fmt(dEnemy)} • Bonus Waffen ${pct(dm.atk)} / Panzerung ${pct(dm.arm)}</div>`)
 +card(`<h4 class="font-orbitron text-cyan-300 mb-1">Deine Flotte wählen</h4><div class="max-h-40 overflow-y-auto space-y-1">${placed.map(f=>`<div onclick="atkSel(${f.id})" class="cursor-pointer p-1.5 rounded border ${f.id===atk.fid?'border-cyan-400 bg-cyan-950/50':'border-slate-700 hover:border-slate-500'}"><b>${f.name}</b> • Stärke ${fmt(fleetPower(f))} • ${Math.round(Math.hypot(f.x-t.x,f.y-t.y))} Einheiten<br>${shipsHtml(f.ships)}</div>`).join('')}</div>`)+`</div>`;
 h+=card(mine?`<div class="grid sm:grid-cols-3 gap-2 text-center"><div>Deine eff. Stärke<br><b class="text-cyan-300 text-sm">${fmt(est.aE)}</b></div><div>Prognose<br><b class="${verdict[1]} text-sm">${verdict[0]}</b></div><div>Erwartete Verluste (Sieg)<br><b class="text-amber-300 text-sm">${win?pct(lw*(1-am.rep)):'100% – alle Schiffe'}</b></div></div><div class="text-center mt-1 text-slate-400">Flugzeit ca. ${Math.round(eta)} s${win&&lw<.03?' • praktisch verlustfrei':''}</div>`:'<div class="text-rose-300">Keine Flotte gewählt.</div>','mt-3');
 h+=`<div class="flex justify-end gap-2 mt-3">${btn('<i class="fa-solid fa-ban"></i> Abbrechen','closeModal2()','slate')}${btn('<i class="fa-solid fa-crosshairs"></i> Angriff starten','launchAttack()','rose',!mine)}</div>`;
 $('modal2Title').textContent='ANGRIFFSPLANUNG';setHtml($('modal2Body'),h)}
function atkSel(id){atk.fid=id;renderAttack()}
function launchAttack(){const f=fleetById.get(atk.fid);if(!f||!f.placed){return}
 f.guard=null;f.retreat=false;setAttack(f,atk.kind,atk.id);setActive(f.id);toast(`${f.name} startet den Angriff!`);playSound('alert');closeModal2();closeTarget();refreshUI()}
function recallFleet(id){const f=fleetById.get(id);if(f){f.order=null;toast(f.name+': Befehl abgebrochen.');refreshUI()}}
function closeModal2(){atk=null;$('modal2Root').classList.add('hidden')}
function showReport(r){
 if(S.rep===false){const m=(r.win?(r.playerAtt?'Sieg':'Verteidigung erfolglos'):(r.playerAtt?'Niederlage':'Angriff abgewehrt'))+(r.captured?' – Planet erobert!':'');addLog('Kampfbericht: '+m);toast('⚔ '+m);return}
 const col=r.win?'text-emerald-400':'text-rose-400';
 const lk=r.loot?Object.entries(r.loot).filter(([k,v])=>v>0):[],lootCard=lk.length?card(`<h4 class="font-orbitron text-amber-300 mb-1"><i class="fa-solid fa-coins"></i> Erbeutet</h4><div class="flex flex-wrap gap-1">${lk.map(([k,v])=>`<span class="bg-slate-800 border border-amber-700/60 rounded px-2 py-1 text-amber-200">+${fmt(v)} ${k==='tokens'?'Warp-Token':RN[k]}</span>`).join('')}</div>`,'mt-3'):'';
 let h=`<div class="text-center mb-3"><div class="font-orbitron text-2xl ${col}">${r.win?(r.playerAtt?'SIEG':'VERTEIDIGUNG ERFOLGLOS'):(r.playerAtt?'NIEDERLAGE':'ANGRIFF ABGEWEHRT')}</div>${r.captured?'<div class="text-amber-300">Planet erobert!</div>':''}${r.held?'<div class="text-amber-300">Die Hauptwelt hat standgehalten.</div>':''}</div>`;
 h+=`<div class="grid md:grid-cols-2 gap-3">`+card(`<h4 class="font-orbitron text-cyan-300 mb-1">Angreifer: ${r.attName}</h4><div>Eff. Stärke: <b>${fmt(r.aE)}</b></div><div class="mt-1 text-slate-400">Verluste:</div>${shipsHtml(r.attLost)}<div class="mt-1 text-slate-400">Überlebende:</div>${shipsHtml(r.left)}`)
 +card(`<h4 class="font-orbitron text-rose-300 mb-1">Verteidiger: ${r.defName}</h4><div>Eff. Stärke: <b>${fmt(r.dE)}</b></div><div class="mt-1 text-slate-400">Verluste:</div>${shipsHtml(r.defLost)}`)+`</div>${lootCard}<div class="flex justify-end mt-3">${btn('Schließen','closeModal2()')}</div>`;
 atk=null;$('modal2Title').textContent='KAMPFBERICHT';setHtml($('modal2Body'),h);$('modal2Root').classList.remove('hidden')}
