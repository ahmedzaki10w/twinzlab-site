/* TwinzLab founder photo hover (after craft.wild.as work carousel):
   on hover / focus / tap the photo's own colours crumble into chunky square pixels at the four corners.
   Grid of 14 px cells (13 px squares, 1 px gap) sampled from the cover-fitted photo; each cell's chance
   to show falls off with distance to the nearest corner (squared, reach = 62% of the short side);
   the random pattern re-rolls every 90 ms so the edges twinkle. Clears on leave.
   Touch: a tap toggles it, and the first time a photo scrolls into view it plays once, then clears.
   Reduced motion: the effect does not run. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) return;
  var BL=14, RAMP=220;
  function hsh(a){ var n=Math.sin(a)*43758.5453; return n-Math.floor(n); }
  [].slice.call(document.querySelectorAll('[data-pixhover]')).forEach(function(host,hi){
    var img=host.querySelector('img'); if(!img) return;
    var cv=document.createElement('canvas'); cv.className='pxh'; cv.setAttribute('aria-hidden','true'); host.appendChild(cv);
    var ctx=cv.getContext('2d'), off=document.createElement('canvas'), offc=off.getContext('2d',{willReadFrequently:true});
    var DPR=Math.min(devicePixelRatio||1,2), on=false, amt=0, last=0, running=false, data=null, cols=0, rows=0, W=0, H=0, hold=0;
    function sample(){
      var r=host.getBoundingClientRect(); W=r.width; H=r.height;
      cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
      cols=Math.floor(W/BL); rows=Math.floor(H/BL); off.width=cols; off.height=rows;
      var mw=img.naturalWidth, mh=img.naturalHeight; if(!mw) return;
      var cs=getComputedStyle(img).objectPosition.split(' '), ox=parseFloat(cs[0])/100, oy=parseFloat(cs[1]||'50%')/100;
      var sc=Math.max(W/mw,H/mh)/1.14, cw=Math.min(mw,W/sc), ch=Math.min(mh,H/sc);
      offc.drawImage(img,(mw-cw)*ox,(mh-ch)*oy,cw,ch,0,0,cols,rows);
      try{ data=offc.getImageData(0,0,cols,rows).data; }catch(e){ data=null; }
    }
    function draw(ts){
      ctx.clearRect(0,0,W,H); if(!data||amt<=0) return;
      var step=Math.floor(ts/90), reach=Math.min(cols,rows)*0.62*amt, s=BL-1;
      var gx=Math.floor((W-cols*BL)/2), gy=Math.floor((H-rows*BL)/2);
      for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){
        var dx=Math.min(i,cols-1-i), dy=Math.min(j,rows-1-j), p=1-Math.sqrt(dx*dx+dy*dy)/reach;
        if(p<=0) continue; p*=p;
        if(hsh(i*12.9+j*78.2+step*3.1+hi*7.7)>p) continue;
        var k=(j*cols+i)*4, f=0.82+0.30*hsh(i*3.7+j*9.1+step*1.3);
        ctx.fillStyle='rgba(23,16,11,.4)'; ctx.fillRect(gx+i*BL-1,gy+j*BL-1,BL+1,BL+1);
        ctx.fillStyle='rgb('+Math.min(255,data[k]*f|0)+','+Math.min(255,data[k+1]*f|0)+','+Math.min(255,data[k+2]*f|0)+')';
        ctx.fillRect(gx+i*BL,gy+j*BL,s,s);
      }
    }
    function loop(ts){
      var dt=last?ts-last:16; last=ts;
      amt=Math.max(0,Math.min(1,amt+(on?1:-1)*dt/RAMP));
      draw(ts);
      if(on||amt>0) requestAnimationFrame(loop); else { running=false; last=0; }
    }
    function set(v){ if(v===on) return; on=v; host.classList.toggle('px-on',v);
      if(v && !data) sample(); if(!running){ running=true; requestAnimationFrame(loop); } }
    if(img.complete) sample(); else img.addEventListener('load',sample);
    addEventListener('resize',function(){ data=null; if(on) sample(); });
    var fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
    host.addEventListener('pointerenter',function(e){ if(e.pointerType==='mouse'){ clearTimeout(hold); set(true); } });
    host.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse'){ clearTimeout(hold); set(false); } });
    host.addEventListener('focus',function(){ if(host.matches(':focus-visible')) set(true); }); host.addEventListener('blur',function(){ set(false); });
    host.addEventListener('click',function(e){ if(!fine||e.pointerType==='touch'){ clearTimeout(hold); set(!on); } });
    host.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); set(!on); } });
    if(!fine){
      var seen=false;
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){
        if(!e.isIntersecting||seen) return; seen=true; io.disconnect();
        set(true); hold=setTimeout(function(){ set(false); }, 2400);
      }); },{threshold:0.6});
      io.observe(host);
    }
  });
})();
