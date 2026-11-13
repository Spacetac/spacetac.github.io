/* ===== MODALE ===== */
let curModal=null;
const TITLES={fleets:'FLOTTENVERWALTUNG',yard:'RAUMWERFT',research:'FORSCHUNG & TECH-TREES',trade:'GALAKTISCHER HANDEL',empire:'IMPERIUM & KOLONIEN',rank:'GALAXIE-RANGLISTE',search:'SUCHE',help:'HILFE & SPIELSTAND'};
const RENDER={fleets:rFleets,yard:rYard,research:rResearch,trade:rTrade,empire:rEmpire,rank:rRank,search:rSearch,help:rHelp};
function openModal(n){playSound('click');if(curModal===n){closeModal();return}curModal=n;$('modalRoot').classList.remove('hidden');$('modalTitle').textContent=TITLES[n];$('modalBody')._h=null;$('modalBody').scrollTop=0;RENDER[n]()}
function closeModal(){curModal=null;$('modalRoot').classList.add('hidden')}
function renderModal(){if(curModal){const b=$('modalBody'),st=b.scrollTop;RENDER[curModal]();b.scrollTop=st}}
function setBody(h){setHtml($('modalBody'),h)}

/* --- Flotten --- */
function canEdit(f){return !f.placed||(!f.order&&nearOwn(f.x,f.y))}
const fleetCol={};
function toggleFleetCol(id){fleetCol[id]=!fleetCol[id];renderModal()}
function setAllFleetCol(v){fleetCol.hangar=v;for(const f of fleets)if(f.owner===0)fleetCol[f.id]=v;renderModal()}
function rFleets(){
 const mine=fleets.filter(f=>f.owner===0),hc=hangarCount();
 let h=`<div class="flex flex-wrap gap-2 items-center mb-3">${btn('<i class="fa-solid fa-plus"></i> Neue leere Flotte','newPlayerFleet(false)')}${btn('<i class="fa-solid fa-wand-magic-sparkles"></i> Neue Flotte aus allem im Hangar','newPlayerFleet(true)','emerald',!hc)}${btn('<i class="fa-solid fa-angles-up"></i> Alle einklappen','setAllFleetCol(true)','slate')}${btn('<i class="fa-solid fa-angles-down"></i> Alle ausklappen','setAllFleetCol(false)','slate')}<span class="text-slate-400">Energie ${Math.floor(powerUsed())}/${Math.floor(powerCap())}</span></div>`;
 h+=card(`<h4 onclick="toggleFleetCol('hangar')" class="font-orbitron text-amber-300 mb-1 cursor-pointer flex items-center justify-between"><span><i class="fa-solid fa-warehouse"></i> Hangar (nicht platziert, kämpft nicht!)</span><i class="fa-solid fa-chevron-${fleetCol.hangar?'down':'up'} text-slate-400 p-2"></i></h4>`+(fleetCol.hangar?'':`${hc?shipsHtml(S.hangar):'<span class="text-slate-500">leer – baue Schiffe in der Werft</span>'}${xRkStock()}`),'mb-3');
 h+=`<div class="grid md:grid-cols-2 gap-3">`;
 for(const f of mine){const ed=canEdit(f),col=fleetCol[f.id];
  const types=SHIPS.filter(s=>(f.ships[s.id]||0)>0||(S.hangar[s.id]||0)>0);
  h+=card(`<div onclick="toggleFleetCol(${f.id})" class="flex justify-between items-start mb-1 cursor-pointer"><div><b class="font-orbitron text-cyan-300">${f.name}</b> ${f.id===activeFleet?'<span class="text-yellow-300">★ aktiv</span>':''}<div class="text-slate-400">${f.placed?(f.order?(f.order.type==='atk'?'Angriffsflug':f.order.type==='mine'?'Minentransport':'Unterwegs'):'Im Orbit'):'<span class="text-amber-300">Nicht platziert</span>'} • Stärke ${fmt(fleetPower(f))} • ${countShips(f.ships)} Schiffe • Tempo ${Math.round(fleetSpeed(f))}</div></div><i class="fa-solid fa-chevron-${col?'down':'up'} text-cyan-300 text-base p-2"></i></div>`
  +(col?'':(''+(types.length?`<div class="space-y-0.5 mb-2">${types.map(s=>`<div class="flex items-center justify-between shiprow"><span${rarCol(s.id)?` style="color:${rarCol(s.id)}" title="${RAR[s.r].n}"`:''}><i class="fa-solid ${s.icon} ${rarCol(s.id)?'':'text-cyan-400'}"></i> ${s.name} <span class="text-slate-500">(Hangar ${S.hangar[s.id]||0})</span></span><span class="shipctl ${ed?'':'dis'}">${btn('-10',`moveShips(${f.id},'${s.id}',-10)`,'slate')} ${btn('-1',`moveShips(${f.id},'${s.id}',-1)`,'slate')} <b class="inline-block w-10 text-center">${f.ships[s.id]||0}</b> ${btn('+1',`moveShips(${f.id},'${s.id}',1)`,'slate')} ${btn('+10',`moveShips(${f.id},'${s.id}',10)`,'slate')}</span></div>`).join('')}</div>`:'<div class="text-slate-500 mb-2">Keine Schiffe verfügbar.</div>')
  +xRkRows(f,ed)+(ed?'':'<div class="text-[10px] text-amber-300 mb-1">Umbau nur im Orbit nahe einer eigenen Kolonie möglich.</div>')
  +`<div class="flex flex-wrap gap-1">${f.placed?btn('<i class="fa-solid fa-location-crosshairs"></i> Hinspringen',`gotoFleet(${f.id})`):btn('<i class="fa-solid fa-map-pin"></i> Platzieren',`armFleet(${f.id})`,'emerald',!basePower(f.ships))}${f.placed?btn('Aktiv setzen',`armFleet(${f.id},true)`):''}${f.order?btn('Abbrechen',`recallFleet(${f.id})`,'amber'):''}${(f.rk&&f.rk.length&&f.placed)?btn('<i class="fa-solid fa-crosshairs"></i> Feuern',`openRocket(${f.id})`,'rose'):''}${btn('Umbenennen',`renameFleet(${f.id})`,'slate')}${btn('Auflösen',`disbandFleet(${f.id})`,'rose',!ed)}</div>`)))}
 if(!mine.length)h+='<div class="text-slate-500">Noch keine Flotten.</div>';
 setBody(h+'</div>')}
function newPlayerFleet(all){const n=fleets.filter(f=>f.owner===0).length+1;const f=newFleet(0,'Flotte '+S.nextF,{},false);if(all){for(const t in S.hangar)f.ships[t]=S.hangar[t];S.hangar={}}refreshUI()}
function moveShips(fid,t,d){const f=fleetById.get(fid);if(!f||!canEdit(f))return;
 if(d>0){d=Math.min(d,S.hangar[t]||0);if(d<=0)return;S.hangar[t]-=d;f.ships[t]=(f.ships[t]||0)+d}
 else{d=Math.min(-d,f.ships[t]||0);if(d<=0)return;f.ships[t]-=d;if(!f.ships[t])delete f.ships[t];S.hangar[t]=(S.hangar[t]||0)+d}
 if(!(S.hangar[t]>0))delete S.hangar[t];refreshUI()}
function armFleet(id,keep){setActive(id);const f=fleetById.get(id);if(!keep&&f&&!f.placed){closeModal();toast('Doppelklick in dein Gebiet (blau umrandet), um die Flotte zu platzieren.')}else{toast(f.name+' ist jetzt aktiv.');refreshUI()}}
function gotoFleet(id){const f=fleetById.get(id);if(f){closeModal();jumpTo(f.x,f.y);sel={type:'fleet',id};setActive(id);renderTarget(true)}}
function renameFleet(id){const f=fleetById.get(id),n=prompt('Neuer Flottenname:',f.name);if(n&&n.trim()){f.name=n.trim().slice(0,24);refreshUI()}}
function disbandFleet(id){const f=fleetById.get(id);if(!f||!canEdit(f))return;for(const t in f.ships)S.hangar[t]=(S.hangar[t]||0)+f.ships[t];removeFleet(f);refreshUI()}

/* --- Werft --- */
function rYard(){const cap=powerCap(),used=powerUsed();
 let h=`<div class="mb-2 text-slate-300">Energie: <b class="${used>cap?'text-rose-400':'text-yellow-300'}">${Math.floor(used)}/${Math.floor(cap)}</b> • Neue Schiffe landen im <b class="text-amber-300">Hangar</b> (${hangarCount()} Schiffe) – im Flottenmenü zu Flotten zusammenstellen und auf der Karte platzieren. Kostenrabatt: <b class="text-emerald-300">${pct(Math.min(.5,tb('cost')+.02*bsum('yard')))}</b></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">`;
 for(const s of SHIPS){if(s.g)continue;const ok=unlocked(s),c=shipCost(s);
  h+=card(`<div class="flex items-center gap-2 mb-1"><i class="fa-solid ${s.icon} text-cyan-400"></i><b class="font-orbitron text-white">${s.name}</b></div><div class="text-slate-400">Stärke ${fmt(s.power)} • Tempo ${s.spd} • Energie ${s.pw}</div><div class="my-1">${costHtml(c)}</div>`
  +(ok?`<div class="flex gap-1">${btn('Bauen ×1',`buildShip('${s.id}',1)`)}${btn('×5',`buildShip('${s.id}',5)`)}${btn('×25',`buildShip('${s.id}',25)`)}</div>`:`<div class="text-rose-400"><i class="fa-solid fa-lock"></i> Benötigt: ${TECHS.find(t=>t.id===s.req).name}</div>`),ok?'':'opacity-70')}
 ensureB();const defs=[['mine','Weltraummine','fa-bomb',MINE_COST,'mine_tech',`Schaden ${fmt(Math.round(MINE_D*(1+tb('mdmg'))))} (Superschiffe halten mehrere Treffer aus) • Auslöse-Radius ${Math.round(MINE_R*(1+tb('mrad')))} • einmalig • Platziert: <b>${S.mines.length}/${mineCap()}</b>`],['aa','Stationäre Flak','fa-satellite-dish',AA_COST,'flak_tech',`Dauerfeuer ${fmt(Math.round(AA_DPS*(1+tb('fdmg'))))}/s • Reichweite ${Math.round(AA_R*(1+tb('frng')))} • nur auf Planeten, max. ${aaSlots()} je Planet • Platziert: <b>${S.aa.length}</b>`]];
 h+='</div><h3 class="font-orbitron text-amber-300 mt-4 mb-2">VERTEIDIGUNGSANLAGEN</h3><div class="grid sm:grid-cols-2 gap-2">';
 for(const [k,nm,ic,c0,req,desc] of defs){const ok=(S.lv[req]||0)>0,c=shipCost({cost:c0});
  h+=card(`<div class="flex items-center gap-2 mb-1"><i class="fa-solid ${ic} text-amber-400"></i><b class="font-orbitron text-white">${nm}</b></div><div class="text-slate-400">${desc}</div><div class="my-1">${costHtml(c)}</div><div class="text-slate-300 mb-1">Im Vorrat: <b class="text-amber-300">${S.stock[k]}</b></div>`
  +(ok?`<div class="flex gap-1 flex-wrap">${btn('Bauen ×1',`buildDef('${k}',1)`)}${btn('×5',`buildDef('${k}',5)`)}${btn(k==='mine'?'Mit Flotte legen':'Platzieren',`armBuild('${k}')`,'amber',!S.stock[k])}</div>`:`<div class="text-rose-400 cursor-pointer" onclick="gotoTechFromYard('${req}')"><i class="fa-solid fa-lock"></i> Benötigt: ${TECHS.find(t=>t.id===req).name} (Klick)</div>`),ok?'':'opacity-70')}
 setBody(h+'</div>')}
function buildShip(id,n){const s=SHIP[id],c=shipCost(s),tot={};for(const k in c)tot[k]=c[k]*n;
 if(powerUsed()+s.pw*n>powerCap()){toast('Nicht genug Energie! Baue Kraftwerke aus oder erforsche Energie-Techs.');return}
 if(!canPay(tot)){toast('Nicht genug Ressourcen.');return}
 pay(tot);S.hangar[id]=(S.hangar[id]||0)+n;playSound('ok');toast(`${n}× ${s.name} im Hangar.`);refreshUI()}

/* --- Forschung --- */
function rResearch(){
 let h=`<div class="flex flex-wrap gap-1 mb-3">${Object.entries(TREES).map(([k,t])=>`<button onclick="S.tab='${k}';renderModal()" class="px-3 py-1.5 rounded border text-[11px] font-orbitron ${S.tab===k?'bg-cyan-900/60 border-cyan-400 text-white':'bg-slate-900 border-slate-700 text-slate-300'}"><i class="fa-solid ${t.i} ${t.c}"></i> ${t.n}</button>`).join('')}</div><div class="text-slate-400 mb-2">Labor-Rabatt: ${pct(Math.min(.4,.03*bsum('lab')))}</div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">`;
 for(const t of TECHS.filter(t=>t.tree===S.tab)){const l=S.lv[t.id]||0,maxed=l>=t.max,miss=t.req.filter(r=>!(S.lv[r]>0)),c=techCost(t),ok=!maxed&&!miss.length;
  h+=card(`<div class="flex justify-between"><b class="font-orbitron text-white">${t.name}</b><span class="${maxed?'text-emerald-400':'text-cyan-300'}">${l}/${t.max}</span></div><div class="text-slate-400 my-1">${t.desc}</div>`
  +(maxed?'<div class="text-emerald-400">Vollständig erforscht</div>':`<div class="mb-1">${costHtml(c)}</div>`+(miss.length?`<div class="text-rose-400"><i class="fa-solid fa-lock"></i> Benötigt: ${miss.map(r=>TECHS.find(x=>x.id===r).name).join(', ')}</div>`:btn(l?'Verbessern':'Erforschen',`doResearch('${t.id}')`,'cyan',!canPay(c)))),ok?'':'opacity-80')}
 setBody(h+'</div>')}
function doResearch(id){const t=TECHS.find(x=>x.id===id),l=S.lv[id]||0;if(l>=t.max||t.req.some(r=>!(S.lv[r]>0)))return;const c=techCost(t);if(!canPay(c)){toast('Nicht genug Ressourcen.');return}
 pay(c);S.lv[id]=l+1;recalcBonus();playSound('ok');addLog(`[FORSCHUNG] ${t.name} Stufe ${l+1} abgeschlossen.`);refreshUI()}

/* --- Handel --- */
const tradeFee=()=>Math.max(.06,.15-Math.min(.06,.005*bsum('hub'))-tb('trade'));
function rTrade(){const fee=tradeFee();
 let h=`<div class="mb-2 flex flex-wrap items-center gap-2"><span class="text-amber-300 font-bold text-sm"><i class="fa-solid fa-coins"></i> ${fmt(S.res.credits)} Credits</span><span class="text-slate-400">Marktgebühr ${(fee*100).toFixed(1)}% (senkbar durch Handelszentren & Techs)</span></div>
 <div class="mb-3 flex items-center gap-1">Menge: ${[1,10,100,1000,10000].map(q=>`<button onclick="S.tq=${q};renderModal()" class="px-2 py-1 rounded border text-[11px] ${S.tq===q?'bg-cyan-900/60 border-cyan-400':'bg-slate-900 border-slate-700'}">${fmt(q)}</button>`).join('')}</div>
 <table class="w-full text-left"><tr class="text-slate-500"><th class="p-1">Ressource</th><th>Bestand</th><th>Marktpreis</th><th>Kaufen</th><th>Verkaufen</th></tr>`;
 for(const r of RES){const pr=S.prices[r.k],pv=S.prev[r.k]||pr,buy=pr*(1+fee),sell=pr*(1-fee),q=S.tq;
  h+=`<tr class="border-t border-slate-800"><td class="p-1"><i class="fa-solid ${r.i} ${r.c}"></i> ${r.n}</td><td>${fmt(S.res[r.k])}</td><td>${pr.toFixed(2)} <span class="${pr>=pv?'text-emerald-400':'text-rose-400'}">${pr>=pv?'▲':'▼'}</span></td>
  <td>${btn(`+${fmt(q)} (${fmt(buy*q)} Cr)`,`trade('${r.k}',${q},1)`,'emerald',S.res.credits<buy*q)}</td><td>${btn(`-${fmt(q)} (+${fmt(sell*q)} Cr)`,`trade('${r.k}',${q},-1)`,'amber',S.res[r.k]<q)}</td></tr>`}
 setBody(h+'</table><div class="mt-2 text-slate-500">Preise schwanken um einen Basiswert; große Orders verschieben den Kurs. Credits bekommst du auch passiv durch Kolonien und Handelszentren.</div>')}
function trade(k,q,dir){const r=RES.find(x=>x.k===k),fee=tradeFee(),pr=S.prices[k];
 if(dir>0){const cost=pr*(1+fee)*q;if(S.res.credits<cost){toast('Nicht genug Credits.');return}S.res.credits-=cost;S.res[k]+=q;S.prices[k]=Math.min(r.p*2,pr+r.p*q*.00004)}
 else{if(S.res[k]<q){toast('Nicht genug '+r.n+'.');return}S.res[k]-=q;S.res.credits+=pr*(1-fee)*q;S.prices[k]=Math.max(r.p*.5,pr-r.p*q*.00004)}
 playSound('click');refreshUI()}

/* --- Imperium --- */
function rEmpire(){const list=myPlanets();if(!list.length){setBody('<div>Keine Kolonien.</div>');return}
 if(S.manage===null||!PS.has(S.manage))S.manage=list.find(p=>p.id===S.capital)?S.capital:list[0].id;
 const p=planets[S.manage],bio=BIOMES[p.biome];
 let h=`<div class="grid md:grid-cols-3 gap-3"><div class="max-h-[60vh] overflow-y-auto space-y-1">${list.map(q=>`<div onclick="S.manage=${q.id};renderModal()" class="cursor-pointer p-2 rounded border ${q.id===S.manage?'border-cyan-400 bg-cyan-950/40':'border-slate-800 bg-slate-950/60 hover:border-slate-600'}"><b>${q.name}</b>${q.id===S.capital?' ★':''}<div class="text-[10px] text-slate-400">${BIOMES[q.biome].name} • Mine Lv ${q.b.mine} • ${fmt(mineRate(q.b.mine,q))}/s ${RN[BIOMES[q.biome].res]}</div></div>`).join('')}</div><div class="md:col-span-2"><div class="mb-2 font-orbitron text-white">${p.name} <span class="text-slate-400 text-xs">– ${bio.name}, Reichtum ${pct(p.rich)}</span> ${btn('Zeigen',`closeModal();jumpTo(${p.x},${p.y})`,'slate')}</div><div class="grid sm:grid-cols-2 gap-2">`;
 for(const k in BLD){const d=BLD[k],l=p.b[k],c=bldCost(k,l),max=l>=BMAX;
  const eff={mine:`+${fmt(mineRate(l,p))}/s ${RN[bio.res]}`,power:`+${Math.round(35*l*(1+tb('pwr')))} Energie`,turret:`Verteidigung ${fmt(l*TURRET*(1+tb('pdef')))}`,lab:`Forschung -${Math.min(30,l*3)}% Kosten`,hub:`+${(1.5*l*(1+tb('cred'))).toFixed(1)} Cr/s, bessere Handelsgebühr`,yard:`Schiffe -${Math.min(40,l*2)}% Kosten`}[k];
  h+=card(`<div class="flex items-center gap-2"><i class="fa-solid ${d.i} ${d.c}"></i><b class="font-orbitron text-white">${d.n}</b><span class="text-cyan-300 ml-auto">Lv ${l}</span></div><div class="text-slate-400 my-1">${eff}</div>${max?'<div class="text-emerald-400">Maximalstufe</div>':`<div class="mb-1">${costHtml(c)}</div>${btn('Ausbauen',`upgradeBuilding(${p.id},'${k}')`,'cyan',!canPay(c))}`}`)}
 setBody(h+'</div></div></div>')}
function upgradeBuilding(pid,k){const p=planets[pid];if(!p||p.owner!==0||p.b[k]>=BMAX)return;const c=bldCost(k,p.b[k]);if(!canPay(c)){toast('Nicht genug Ressourcen.');return}pay(c);p.b[k]++;p.dirty=true;playSound('ok');refreshUI()}

/* --- Rangliste --- */
function standings(){const pw=new Float64Array(AIS.length+1);for(const f of fleets)pw[f.owner]+=fleetPower(f);pw[0]+=basePower(S.hangar);
 const tl=Object.values(S.lv).reduce((a,b)=>a+b,0);
 const list=[{id:0,name:ownerName(0),planets:PS.size,power:pw[0],score:PS.size*60+pw[0]/4+tl*20}];
 for(const a of AIS)if(!a.dead)list.push({id:a.id,name:a.name,planets:a.planets,power:pw[a.id],score:a.planets*60+pw[a.id]/4+a.tech*20});
 return list.sort((a,b)=>b.score-a.score)}
function rRank(){const L=standings();
 setBody(`<div class="text-slate-400 mb-2">${L.length} aktive Spieler • Ziel: Platz 1!</div><table class="w-full text-left"><tr class="text-slate-500"><th class="p-1">#</th><th>Name</th><th>Planeten</th><th>Flottenstärke</th><th>Punkte</th></tr>${L.map((s,i)=>`<tr class="border-t border-slate-800 ${s.id===0?'bg-cyan-950/60 font-bold text-cyan-300':'hover:bg-slate-900/60 cursor-pointer'}" ${s.id>0?`onclick="jumpAI(${s.id})"`:''}><td class="p-1">${i+1}</td><td style="color:${ownerColor(s.id)}">${s.name}</td><td>${s.planets}</td><td>${fmt(s.power)}</td><td class="text-amber-400">${fmt(s.score)}</td></tr>`).join('')}</table>`)}
function jumpAI(id){const p=planets.find(q=>q.owner===id);if(p){closeModal();jumpTo(p.x,p.y);sel={type:'planet',id:p.id};renderTarget(true)}}

/* --- Suche --- */
function rSearch(){setBody(`<div class="flex flex-wrap gap-2 mb-2"><input id="sq" oninput="doSearch()" placeholder="Planetenname, Spielername oder 'x,y'" class="flex-1 min-w-[200px] bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white outline-none focus:border-cyan-400"></div><div id="sres" class="space-y-1"></div>`);setTimeout(()=>{const e=$('sq');if(e)e.focus()},50)}
function doSearch(){const q=$('sq').value.trim().toLowerCase(),out=[];if(!q){$('sres').innerHTML='';return}
 const m=q.match(/^(-?\d+)\s*[, ]\s*(-?\d+)$/);
 if(m){const x=+m[1],y=+m[2];let b=null,bd=1e18;for(const p of planets){const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;b=p}}if(b)out.push(b)}
 else{for(const a of AIS)if(a.name.toLowerCase().includes(q)){const p=planets.find(z=>z.owner===a.id);if(p)out.push(p)}
  for(const p of planets){if(out.length>=15)break;if(p.name.toLowerCase().includes(q)&&!out.includes(p))out.push(p)}}
 $('sres').innerHTML=out.slice(0,15).map(p=>`<div onclick="searchGo(${p.id})" class="cursor-pointer p-2 rounded border border-slate-800 bg-slate-950/70 hover:border-cyan-400"><b>${p.name}</b> <span class="text-slate-400">[${p.x}, ${p.y}] • <span style="color:${ownerColor(p.owner)}">${ownerName(p.owner)}</span></span></div>`).join('')||'<div class="text-slate-500">Nichts gefunden.</div>'}
function searchGo(id){const p=planets[id];closeModal();jumpTo(p.x,p.y);sel={type:'planet',id};renderTarget(true)}

/* --- Hilfe --- */
function rHelp(){setBody(`<div class="space-y-2 text-slate-300 text-[13px]"><p><b class="text-cyan-300">Ziel:</b> Starte schwach, baue Wirtschaft, Forschung und Flotten aus – und werde der stärkste von 400 Spielern in einer riesigen Galaxie mit über 14.000 Planeten.</p>
<p><b class="text-cyan-300">Start:</b> Deine Starflotte liegt im Hangar. Öffne <i>Flotten</i>, wähle <i>Platzieren</i> und mache einen <b>Doppelklick</b> auf die Karte nahe deiner Kolonie. Nur platzierte Flotten können kämpfen und verteidigen.</p>
<p><b class="text-cyan-300">Steuerung:</b> Ziehen = Karte verschieben • Mausrad / Pinch = Zoom • Klick = Auswählen • Doppelklick = aktive Flotte platzieren bzw. bewegen • Minimap unten links zum Springen.</p>
<p><b class="text-cyan-300">Angriff:</b> Planet oder fremde Flotte anklicken → <i>Angreifen</i> → Gegnerstärke ansehen, eigene Flotte wählen, Angriff starten oder abbrechen. Siege vernichten alle gegnerischen Schiffe; eigene Verluste hängen von der Stärke des Gegners ab (von keinen bis fast allen). Bei Niederlage ist die ganze Flotte verloren.</p>
<p><b class="text-cyan-300">Warnungen:</b> Greift ein Gegner dich an, erscheint ein Banner – anklicken springt zum Ort. Flotten in 450 Einheiten Umkreis eines Planeten verteidigen ihn automatisch.</p>
<p><b class="text-cyan-300">Wirtschaft:</b> Förderanlagen liefern die Ressource des Planetentyps. Fehlendes kaufst du im Handel. Energie begrenzt die Zahl deiner Schiffe (Kraftwerke, Fusion, Dyson).</p></div>
<div class="flex gap-2 mt-4">${btn('Jetzt speichern','save();toast(\'Gespeichert.\')')}${btn('Neues Spiel','newGame()','rose')}</div>`)}
