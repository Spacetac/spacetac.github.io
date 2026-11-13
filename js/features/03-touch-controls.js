/* Mobile/Touch-Zusatz: Zoom-Tasten, Minikarten-Wischen, Rotation, iOS-Gesten */
(function(){
 const g=id=>document.getElementById(id);
 const lv=()=>{try{layoutVars()}catch(_){}};
 const rs=()=>{try{resize()}catch(_){}lv()};
 window.addEventListener('orientationchange',()=>{setTimeout(rs,150);setTimeout(rs,500)});
 if(window.visualViewport)window.visualViewport.addEventListener('resize',rs);
 window.addEventListener('resize',lv);setTimeout(lv,300);
 const zin=g('zoomIn'),zout=g('zoomOut');
 const zoom=f=>{try{zoomAt(W/2,H/2,f);playSound('click')}catch(_){}};
 let zt=null;const hold=(b,f)=>{
  b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();zoom(f);clearInterval(zt);zt=setInterval(()=>{try{zoomAt(W/2,H/2,f>1?1.06:.945)}catch(_){}},60)});
  ['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,()=>clearInterval(zt)))};
 if(zin&&zout){hold(zin,1.3);hold(zout,1/1.3)}
 const mm=g('minimap');let mmD=false;
 const mmMove=e=>{const r=mm.getBoundingClientRect();cam.x=clamp(((e.clientX-r.left)/r.width-.5)*WORLD,-HALF,HALF);cam.y=clamp(((e.clientY-r.top)/r.height-.5)*WORLD,-HALF,HALF)};
 mm.addEventListener('pointerdown',e=>{mmD=true;try{mm.setPointerCapture(e.pointerId)}catch(_){}});
 mm.addEventListener('pointermove',e=>{if(mmD){mmMove(e);e.preventDefault()}});
 ['pointerup','pointercancel'].forEach(t=>mm.addEventListener(t,()=>{mmD=false}));
 ['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>e.preventDefault()));
 cv.addEventListener('contextmenu',e=>e.preventDefault());
})();
