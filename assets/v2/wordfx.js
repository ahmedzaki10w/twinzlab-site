/* TwinzLab footer wordmark: the cursor turns the letters into a dot matrix that settles back.
   Original implementation for TwinzLab. Only runs for a real mouse and never under reduced motion. */
(function(){
 var box=document.querySelector('.wordbox');if(!box||!box.getContext&&!box.querySelector('canvas'))return;
 var fine=matchMedia('(hover: hover) and (pointer: fine)'),still=matchMedia('(prefers-reduced-motion: reduce)');
 if(!fine.matches||still.matches)return;
 var cv=box.querySelector('canvas'),ctx=cv.getContext('2d'),word=box.querySelector('.word'),foot=box.closest('footer')||box;
 var C=10,R=70,LIFE=750,cells=[],trail=[],W=0,H=0,raf=0,last=null;
 function build(){
  var b=box.getBoundingClientRect(),r=word.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  W=Math.round(b.width);H=Math.round(b.height);cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  var o=document.createElement('canvas');o.width=W;o.height=H;var x=o.getContext('2d'),cs=getComputedStyle(word);
  x.font=cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;if('letterSpacing' in x)x.letterSpacing=cs.letterSpacing;
  x.textAlign='center';x.textBaseline='alphabetic';
  var t=word.textContent,m=x.measureText(t),lh=parseFloat(cs.lineHeight)||r.height;
  var base=(r.top-b.top)+(lh-(m.fontBoundingBoxAscent+m.fontBoundingBoxDescent))/2+m.fontBoundingBoxAscent;
  var ls=parseFloat(cs.letterSpacing)||0;
  x.fillStyle='#000';x.fillText(t,(r.left-b.left)+r.width/2-ls/2,base);
  var px=x.getImageData(0,0,W,H).data;cells=[];
  for(var y=0;y+C<=H;y+=C)for(var xx=0;xx+C<=W;xx+=C){var s=0,n=0;
   for(var j=1;j<C;j+=3)for(var i=1;i<C;i+=3){s+=px[((y+j)*W+xx+i)*4+3];n++}
   if(s/n>80)cells.push({x:xx,y:y,h:0,ph:((xx*7+y*13)%11)/11})}
  ctx.clearRect(0,0,W,H);
 }
 function frame(now){
  raf=0;trail=trail.filter(function(p){return now-p.t<LIFE});
  ctx.clearRect(0,0,W,H);var live=trail.length>0;
  for(var k=0;k<cells.length;k++){var c=cells[k],tg=0,cx=c.x+C/2,cy=c.y+C/2,vx=0,vy=0;
   for(var q=0;q<trail.length;q++){var p=trail[q],dx=cx-p.x,dy=cy-p.y,d2=dx*dx+dy*dy;if(d2>R*R*4)continue;
    var v=Math.exp(-d2/(2*R*R))*(1-(now-p.t)/LIFE);if(v>tg){tg=v;vx=p.vx;vy=p.vy}}
   c.h=Math.max(tg,c.h*0.9);if(c.h<0.03){c.h=0;continue}live=true;
   var h=c.h,sz=C*(0.82-0.5*h)*(0.85+0.3*c.ph),sp=Math.hypot(vx,vy)||1,off=Math.min(4,sp*0.15)*h;
   ctx.globalAlpha=0.35+0.65*h;ctx.fillStyle=h>0.62?'#EAAB78':h>0.3?'#efe6dc':'#8f847b';
   var px=cx+vx/sp*off-sz/2,py=cy+vy/sp*off-sz/2;
   if(ctx.roundRect){ctx.beginPath();ctx.roundRect(px,py,sz,sz,sz*0.28);ctx.fill()}else ctx.fillRect(px,py,sz,sz);
   ctx.globalAlpha=1}
  if(live)raf=requestAnimationFrame(frame);
 }
 function move(e){if(e.pointerType!=='mouse')return;var b=cv.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top;
  if(y<-R||y>H+R){last=null;return}
  var vx=last?x-last.x:0,vy=last?y-last.y:0;last={x:x,y:y};trail.push({x:x,y:y,vx:vx,vy:vy,t:performance.now()});
  if(trail.length>80)trail.shift();if(!raf)raf=requestAnimationFrame(frame)}
 (document.fonts?document.fonts.ready:Promise.resolve()).then(function(){build();
  new ResizeObserver(function(){build()}).observe(box);
  foot.addEventListener('pointermove',move);foot.addEventListener('pointerleave',function(){last=null});
  still.addEventListener&&still.addEventListener('change',function(){if(still.matches){foot.removeEventListener('pointermove',move);ctx.clearRect(0,0,W,H)}});
 });
})();
