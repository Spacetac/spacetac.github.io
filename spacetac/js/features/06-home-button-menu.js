/* ===== v3.8: Heimat-Button, Kampfbericht-Schalter, Kopf-Menü ===== */
(function(){
 window.goHome=function(){try{const p=planets[S.capital];if(!p)return;sel={type:'planet',id:p.id};jumpTo(p.x,p.y);renderTarget(true)}catch(e){}};
 function updRep(){const on=S.rep!==false,b=document.getElementById('repBtn');if(b){b.classList.toggle('off',!on);b.innerHTML='<i class="fa-solid '+(on?'fa-file-lines':'fa-file-circle-xmark')+'"></i>'}
  const t=document.getElementById('mRepT'),i=document.getElementById('mRepI');if(t)t.textContent=on?'Berichte: an':'Berichte: aus';if(i)i.className='fa-solid '+(on?'fa-file-lines':'fa-file-circle-xmark')+' text-rose-300'}
 window.toggleReports=function(){S.rep=S.rep===false;updRep();toast(S.rep===false?'Kampfberichte aus – Ergebnis nur als Meldung und im Log':'Kampfberichte an');try{playSound('click')}catch(e){}};
 const menu=()=>document.getElementById('hdrMenu');
 window.toggleHdrMenu=function(e){if(e)e.stopPropagation();menu().classList.toggle('hidden')};
 window.hdrAct=function(a){menu().classList.add('hidden');
  if(a==='audio'){toggleAudio();const m=document.getElementById('mAud');if(m)m.className='fa-solid '+(audioOn?'fa-volume-high':'fa-volume-xmark')+' text-slate-300'}
  else if(a==='rep')toggleReports();else openModal(a)};
 document.addEventListener('pointerdown',e=>{const m=menu();if(m&&!m.classList.contains('hidden')&&!m.contains(e.target)&&e.target.closest('#menuBtn')==null)m.classList.add('hidden')});
 setInterval(()=>{const d=document.getElementById('dailyDot'),on=d&&!d.classList.contains('hidden');['mDot','menuDot'].forEach(i=>{const e=document.getElementById(i);if(e)e.classList.toggle('hidden',!on)})},1000);
 setTimeout(()=>{updRep();try{layoutVars()}catch(e){}},300);
 setTimeout(()=>{try{layoutVars()}catch(e){}},1200);
})();
