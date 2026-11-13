/* ===== v3.9.3: Kampfsequenz abwarten – Angreifer UND Verteidiger bleiben während der Schusssequenz stehen (auch bei Flotte-gegen-Flotte) ===== */
{const _sbh=spawnBattle;spawnBattle=function(f,tx,ty,defOwner,r,myth){const d=_sbh.apply(this,arguments);
 try{if(d&&f){const until=performance.now()+d;f.hold=Math.max(f.hold||0,until);
  for(const e of nearby(tx,ty,700,e=>!e.dead&&e!==f&&e.owner===defOwner&&(e.owner>0||e.placed)))e.hold=Math.max(e.hold||0,until)}}catch(e){console.warn('hold',e)}
 return d}}
