/* Mobile-Fixes: Passwortfeld (Developer-Modus), Header-Höhe, Hochformat-Tipp */
(function(){
 const g=id=>document.getElementById(id);
 const _rm=renderModal;
 renderModal=function(){const a=document.activeElement,b=g('modalBody');if(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&b&&b.contains(a))return;_rm()};
 document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='devpw'){e.preventDefault();try{unlockDev()}catch(_){}}});
 const h=document.querySelector('header');
 if(h&&window.ResizeObserver)new ResizeObserver(()=>{try{layoutVars()}catch(_){}}).observe(h);
 let tip=false;const chk=()=>{if(tip)return;if(matchMedia('(pointer:coarse)').matches&&innerWidth>innerHeight&&innerHeight<520){tip=true;try{toast('Tipp: Das Spiel ist für Hochformat optimiert.')}catch(_){}}};
 window.addEventListener('resize',chk);setTimeout(chk,2500);
})();
