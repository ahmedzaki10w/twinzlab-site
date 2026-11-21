/* TwinzLab option sketches: shared helpers (original code). */
window.TZ=(function(){
  // 3D value-gradient noise (compact Perlin)
  var p=new Uint8Array(512),perm=[];for(var i=0;i<256;i++)perm[i]=i;
  var seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
  for(i=255;i>0;i--){var j=Math.floor(rnd()*(i+1)),t=perm[i];perm[i]=perm[j];perm[j]=t}
  for(i=0;i<512;i++)p[i]=perm[i&255];
  function fade(t){return t*t*t*(t*(t*6-15)+10)}function lerp(a,b,t){return a+t*(b-a)}
  function grad(h,x,y,z){var u=(h&15)<8?x:y,v=(h&15)<4?y:((h&15)===12||(h&15)===14)?x:z;return((h&1)?-u:u)+((h&2)?-v:v)}
  function noise(x,y,z){var X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);
    var u=fade(x),v=fade(y),w=fade(z),A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z,B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;
    return lerp(lerp(lerp(grad(p[AA],x,y,z),grad(p[BA],x-1,y,z),u),lerp(grad(p[AB],x,y-1,z),grad(p[BB],x-1,y-1,z),u),v),
      lerp(lerp(grad(p[AA+1],x,y,z-1),grad(p[BA+1],x-1,y,z-1),u),lerp(grad(p[AB+1],x,y-1,z-1),grad(p[BB+1],x-1,y-1,z-1),u),v),w)}
  var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE=matchMedia('(hover: hover) and (pointer: fine)').matches;
  function stage(cv,draw,opts){
    opts=opts||{};var ctx=cv.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1),W,H,m={x:-1e4,y:-1e4,a:0,tx:-1e4,ty:-1e4},start=performance.now(),vis=true;
    function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr}
    size();var drawn=false;new ResizeObserver(function(){var w=W,h=H;size();if(RM&&drawn)frame(0)}).observe(cv);
    if(FINE&&!RM){(opts.host||cv.parentNode).addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var r=cv.getBoundingClientRect();m.tx=e.clientX-r.left;m.ty=e.clientY-r.top;if(m.a<0.01){m.x=m.tx;m.y=m.ty}m.a=1});}
    new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(cv);
    function frame(now){var t=RM?(opts.still||6000):now-start;
      m.x+=(m.tx-m.x)*.18;m.y+=(m.ty-m.y)*.18;if(m.a>0)m.a*=.985;
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);draw(ctx,W,H,t,m);drawn=true;
      if(!RM)requestAnimationFrame(function(n){vis?frame(n):setTimeout(function(){requestAnimationFrame(frame)},200)})}
    requestAnimationFrame(frame);
  }
  function dot(ctx,x,y,s){var h=s/2;ctx.fillRect(x-h,y-h,s,s)}
  function rdot(ctx,x,y,s){var h=s/2;if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x-h,y-h,s,s,s*.3);ctx.fill()}else ctx.fillRect(x-h,y-h,s,s)}
  return {noise:noise,stage:stage,dot:dot,rdot:rdot,RM:RM,ease:function(t){return 1-Math.pow(1-Math.min(1,Math.max(0,t)),3)}};
})();
