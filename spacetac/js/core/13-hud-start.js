/* ===== HUD ===== */
function buildResBar(){const tip=(n,x)=>`${n} – Klicken für Produktion, Quellen & Verwendung${x||''}`;
 $('resBar').innerHTML=RES.map(r=>`<div class="resItem flex items-center gap-1" data-res="${r.k}" title="${tip(r.n,r.k==='steel'?'\n+'+STEEL_PM+'/Min Grundeinkommen':(r.k==='food'||r.k==='water')?'\nVersorgt deine Kolonien – genug Vorrat = bis zu +20% Produktion':'')}"><i class="fa-solid ${r.i} ${r.c}"></i><span id="r_${r.k}">0</span></div>`).join('')
 +`<div class="resItem flex items-center gap-1 text-amber-300" data-res="credits" title="${tip('Credits')}"><i class="fa-solid fa-coins"></i><span id="r_credits">0</span></div><div class="resItem flex items-center gap-1" data-res="power" title="${tip('Energie: benutzt / Kapazität')}"><i class="fa-solid fa-bolt text-yellow-400"></i><span id="r_power">0</span></div><div class="resItem flex items-center gap-1 text-fuchsia-300" data-res="gems" title="${tip('Warp-Tokens')}"><i class="fa-solid fa-circle-nodes"></i><span id="r_gems">0</span></div><div class="flex items-center gap-1 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded text-amber-300 cursor-pointer" data-res="rank" title="Rang / Punkte – Klicken für die Rangliste"><i class="fa-solid fa-trophy"></i><span id="r_rank">-</span></div>`}
let rankCache='-';
function updateHUD(){for(const r of RES)$('r_'+r.k).textContent=fmt(S.res[r.k]);$('r_credits').textContent=fmt(S.res.credits);
 const u=powerUsed(),c=powerCap(),pe=$('r_power');pe.textContent=`${Math.floor(u)}/${Math.floor(c)}`;pe.className=u>c?'text-rose-400':'';
 $('r_rank').textContent=rankCache;$('r_gems').textContent=fmt(S.gems);$('hudCol').textContent=PS.size;
 const mine=fleets.filter(f=>f.owner===0);$('hudFleets').textContent=`${mine.filter(f=>f.placed).length}/${mine.length}`}
function refreshUI(){updateHUD();renderTarget();renderModal();renderLog();if(curModal==='fleets'||!activeFleet)setActive(activeFleet)}

/* ===== START ===== */
window.onload=function(){
 resize();generateWorld();
 for(const r of RES)S.prices[r.k]=r.p;
 const loaded=load();recalcBonus();buildResBar();addonInit(loaded);
 if(!loaded){S.hangar={};const f=newFleet(0,'Flotte 1',startShips(),false);setActive(f.id);addLog('[BEFEHL ONLINE] Platziere deine Startflotte per Doppelklick auf die Karte.')}
 const home=planets[S.capital];cam.x=home.x;cam.y=home.y;cam.zoom=Math.max(MINZ,W<700?.22:.3);rebuildHash();
 if(!loaded)toast('Willkommen, Kommandant! Doppelklick in dein Gebiet um die Hauptwelt, um deine Flotte zu platzieren.');
 let last=performance.now(),uiT=0,saveT=0,rankT=0;
 function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;update(dt);render();
  uiT+=dt;if(uiT>.3){uiT=0;updateHUD();renderTarget();renderLog()}
  miniT+=dt;if(miniT>.6){miniT=0;renderMini()}
  rankT+=dt;if(rankT>4){rankT=0;const L=standings();rankCache='#'+(L.findIndex(s=>s.id===0)+1)+'/'+L.length}
  saveT+=dt;if(saveT>20){saveT=0;save()}
  requestAnimationFrame(frame)}
 requestAnimationFrame(frame);
 window.addEventListener('beforeunload',save);
};
