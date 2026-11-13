/* ===== v4.4.3: Einstellungen-Menü, Bot-Schwierigkeit, kompakte Werft ===== */
(function(){
const LV=[{n:'Sehr leicht',v:.5,d:'Bots wirtschaften und rüsten sehr langsam – zum Entspannen.'},
 {n:'Leicht',v:.75,d:'Bots sind schwächer und haben weniger Flotten.'},
 {n:'Normal',v:1,d:'Standard-Balance.'},
 {n:'Schwer',v:1.3,d:'Bots haben mehr Einkommen und größere Flotten.'},
 {n:'Extrem',v:1.7,d:'Bots wachsen deutlich schneller – du musst zügig expandieren.'},
 {n:'Albtraum',v:2.2,d:'Bots rüsten extrem schnell auf. Nur für Profis.'}];
const curLv=()=>{const d=S.diff||1;let b=0,bd=9;LV.forEach((l,i)=>{const x=Math.abs(l.v-d);if(x<bd){bd=x;b=i}});return b};
window.setDiff=function(i){S.diff=LV[i].v;try{save()}catch(e){}toast('Bot-Schwierigkeit: '+LV[i].n);try{playSound('click')}catch(e){}renderModal()};
TITLES.settings='EINSTELLUNGEN';
const row=(ic,label,sub,ctl)=>'<div class="flex items-center justify-between gap-3 py-2 border-t border-slate-800 first:border-0" style="min-height:44px"><div class="min-w-0"><div class="text-slate-100 text-[13px]"><i class="fa-solid '+ic+' w-5 text-center text-cyan-300"></i> '+label+'</div>'+(sub?'<div class="text-[11px] text-slate-400 ml-5">'+sub+'</div>':'')+'</div>'+ctl+'</div>';
const sw=(on,fn)=>'<button onclick="'+fn+'" class="shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-orbitron '+(on?'bg-cyan-900/70 border-cyan-400 text-white':'bg-slate-900 border-slate-600 text-slate-400')+'" style="min-width:64px;min-height:36px">'+(on?'AN':'AUS')+'</button>';
const sec=(t,ic,inner)=>card('<h4 class="font-orbitron text-xs text-amber-300 mb-1"><i class="fa-solid '+ic+'"></i> '+t+'</h4>'+inner,'mb-3');
RENDER.settings=function(){
 const c=curLv();
 let h=sec('BOT-SCHWIERIGKEIT','fa-robot','<div class="grid grid-cols-3 gap-1.5 mt-2">'+LV.map((l,i)=>'<button onclick="setDiff('+i+')" class="py-2 rounded border text-[11px] font-orbitron '+(i===c?'bg-amber-900/60 border-amber-400 text-white':'bg-slate-900 border-slate-700 text-slate-300')+'" style="min-height:40px">'+l.n+'</button>').join('')+'</div><div class="text-[11px] text-slate-400 mt-2">'+LV[c].d+'</div>');
 h+=sec('SPIEL','fa-gamepad',row('fa-file-lines','Kampfberichte','Aus: nur Meldung und Log',sw(S.rep!==false,"toggleReports();renderModal()")));
 h+=sec('TON','fa-volume-high',row('fa-volume-high','Ton','Effekte an/aus',sw(audioOn,"toggleAudio();renderModal()"))
  +row('fa-sliders','Lautstärke','',btn(Math.round(AU.vol*100)+'%',"cycleVol();renderModal()"))
  +row('fa-music','Ambient-Musik','',sw(AU.amb,"toggleAmb();renderModal()")));
 h+=sec('ANZEIGE','fa-display',row('fa-burst','Screen-Effekte','Kamera-Shake &amp; Blitz',sw(FXCFG.on,"toggleFx()"))
  +row('fa-border-all','Ländergrenzen','Gebiete &amp; Bot-Namen auf der Karte',sw(BORD.on,"toggleBord()")));
 h+=sec('SPIELSTAND','fa-floppy-disk','<div class="flex flex-wrap gap-2 py-1">'+btn('Jetzt speichern',"save();toast('Gespeichert.')")+btn('Profil &amp; Spielstand',"openModal('profile')",'slate')+btn('Neues Spiel','newGame()','rose')+'</div>');
 setBody(h)};

/* --- Werft: Tabs + einklappbare Zeilen --- */
let YT='ships';const YO={};
window.setYT=function(t){YT=t;renderModal();$('modalBody').scrollTop=0};
window.togY=function(id){YO[id]=!YO[id];renderModal()};
function shipRow(s){const c=shipCost(s),ok=canPay(c),o=YO[s.id];
 return '<div class="mb-1.5 rounded-lg border border-slate-800 bg-slate-950/80"><div class="flex items-center gap-2 p-2"><div onclick="togY(\''+s.id+'\')" class="flex-1 min-w-0 cursor-pointer"><div class="flex items-center gap-1.5"><i class="fa-solid '+s.icon+' text-cyan-400"></i><b class="font-orbitron text-white text-[12px]">'+s.name+'</b><i class="fa-solid fa-chevron-'+(o?'up':'down')+' text-slate-500 text-[10px] ml-auto"></i></div><div class="text-[11px] text-slate-400">Stärke '+fmt(s.power)+' • Tempo '+s.spd+' • Energie '+s.pw+'</div></div>'+btn('×1',"buildShip('"+s.id+"',1)",'cyan',!ok)+'</div>'
 +(o?'<div class="px-2 pb-2"><div class="mb-1 text-[11px]">'+costHtml(c)+'</div><div class="flex gap-1">'+btn('Bauen ×1',"buildShip('"+s.id+"',1)")+btn('×5',"buildShip('"+s.id+"',5)")+btn('×25',"buildShip('"+s.id+"',25)")+'</div></div>':'')+'</div>'}
RENDER.yard=function(){
 const cap=powerCap(),used=powerUsed();
 const tabs=[['ships','Schiffe','fa-jet-fighter'],['def','Verteidigung','fa-shield-halved'],['rk','Raketen','fa-rocket']];
 let h='<div class="flex gap-1 mb-2 sticky top-0 z-[1] py-1" style="background:rgba(2,6,23,.96)">'+tabs.map(t=>'<button onclick="setYT(\''+t[0]+'\')" class="flex-1 px-1 py-2 rounded border text-[11px] font-orbitron '+(YT===t[0]?'bg-cyan-900/60 border-cyan-400 text-white':'bg-slate-900 border-slate-700 text-slate-300')+'"><i class="fa-solid '+t[2]+'"></i> '+t[1]+'</button>').join('')+'</div>';
 h+='<div class="mb-2 text-slate-300 text-[12px]">Energie: <b class="'+(used>cap?'text-rose-400':'text-yellow-300')+'">'+Math.floor(used)+'/'+Math.floor(cap)+'</b> • Hangar: <b class="text-amber-300">'+hangarCount()+'</b> Schiffe • Rabatt: <b class="text-emerald-300">'+pct(Math.min(.5,tb('cost')+.02*bsum('yard')))+'</b></div>';
 if(YT==='ships'){
  const av=SHIPS.filter(s=>!s.g&&unlocked(s)),lk=SHIPS.filter(s=>!s.g&&!unlocked(s));
  h+=av.map(shipRow).join('');
  if(lk.length){h+='<div onclick="togY(\'_lk\')" class="mt-2 p-2 rounded-lg border border-slate-800 text-slate-400 text-[12px] cursor-pointer flex justify-between"><span><i class="fa-solid fa-lock"></i> Gesperrt ('+lk.length+')</span><i class="fa-solid fa-chevron-'+(YO._lk?'up':'down')+'"></i></div>';
   if(YO._lk)h+=lk.map(s=>'<div onclick="gotoTechFromYard(\''+s.req+'\')" class="mt-1 p-2 rounded-lg border border-slate-800 opacity-70 text-[11px] cursor-pointer"><i class="fa-solid '+s.icon+' text-slate-500"></i> <b class="text-slate-300">'+s.name+'</b> • Stärke '+fmt(s.power)+'<div class="text-rose-400">Benötigt: '+TECHS.find(t=>t.id===s.req).name+' (Klick)</div></div>').join('')}
 }else if(YT==='def'){
  ensureB();const defs=[['mine','Weltraummine','fa-bomb',MINE_COST,'mine_tech','Schaden '+fmt(Math.round(MINE_D*(1+tb('mdmg'))))+' • Radius '+Math.round(MINE_R*(1+tb('mrad')))+' • einmalig • Platziert: <b>'+S.mines.length+'/'+mineCap()+'</b>'],['aa','Stationäre Flak','fa-satellite-dish',AA_COST,'flak_tech','Dauerfeuer '+fmt(Math.round(AA_DPS*(1+tb('fdmg'))))+'/s • Reichweite '+Math.round(AA_R*(1+tb('frng')))+' • max. '+aaSlots()+' je Planet • Platziert: <b>'+S.aa.length+'</b>']];
  h+='<div class="grid sm:grid-cols-2 gap-2">'+defs.map(d=>{const k=d[0],ok=(S.lv[d[4]]||0)>0,c=shipCost({cost:d[3]});
   return card('<div class="flex items-center gap-2 mb-1"><i class="fa-solid '+d[2]+' text-amber-400"></i><b class="font-orbitron text-white">'+d[1]+'</b></div><div class="text-slate-400 text-[12px]">'+d[5]+'</div><div class="my-1 text-[11px]">'+costHtml(c)+'</div><div class="text-slate-300 mb-1">Im Vorrat: <b class="text-amber-300">'+S.stock[k]+'</b></div>'
   +(ok?'<div class="flex gap-1 flex-wrap">'+btn('Bauen ×1',"buildDef('"+k+"',1)")+btn('×5',"buildDef('"+k+"',5)")+btn(k==='mine'?'Mit Flotte legen':'Platzieren',"armBuild('"+k+"')",'amber',!S.stock[k])+'</div>':'<div class="text-rose-400 cursor-pointer" onclick="gotoTechFromYard(\''+d[4]+'\')"><i class="fa-solid fa-lock"></i> Benötigt: '+TECHS.find(t=>t.id===d[4]).name+' (Klick)</div>'),ok?'':'opacity-70')}).join('')+'</div>';
  h+=xShieldHtml();
 }else h+=xRkYard();
 setBody(h)};
})();
