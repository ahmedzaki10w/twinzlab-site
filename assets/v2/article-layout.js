/* Lab article layout.
   - Contents rail (after elevenlabs.io/blog, made continuous): the reader's exact position in the article is mapped onto
     the rail; every tick's length/brightness is a smooth falloff from that point, driven by a spring each frame.
     Hovering the rail or the titles swells the ticks under the cursor like a magnifier; clicking the rail jumps
     to that exact point of the article. Reduced motion: no spring, no swell, position snaps.
   - Sub-bar reading progress, copy link, phone Contents drop-down. */
(function(){
var links=[].slice.call(document.querySelectorAll('.toc a[data-for]'));
var heads=links.map(function(a){return document.getElementById(a.dataset.for)});
var prose=document.querySelector('.prose'),bar=document.querySelector('.sb-progress i');
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
var cur=-1,tick=false;
function update(){tick=false;
  var line=innerHeight*0.35,idx=0;
  for(var i=0;i<heads.length;i++){if(heads[i]&&heads[i].getBoundingClientRect().top<=line)idx=i}
  if(idx!==cur){links.forEach(function(a,i){a.classList.toggle('on',i===idx);if(i===idx)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});cur=idx}
  if(prose&&bar){var r=prose.getBoundingClientRect(),p=(innerHeight*0.5-r.top)/r.height;bar.style.setProperty('--p',Math.max(0,Math.min(1,p)).toFixed(4))}
}
addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(update)}},{passive:true});
addEventListener('resize',update);update();

/* ---------- rail ---------- */
(function(){
 var rail=document.querySelector('.rail'),box=document.querySelector('.railbox');if(!rail||!box)return;
 var mq=matchMedia('(min-width:701px)'),ticks=[],ty=[],PITCH=6,N=0,listH=0,linkY=[],linkB=[];
 var pos=0,vel=0,hy=0,hAmt=0,hTarget=0,hoverY=0,raf=0,last=0,vals=[],lastW=[];
 function measure(){
  var br=box.getBoundingClientRect();listH=br.height;
  linkY=links.map(function(l){return l.getBoundingClientRect().top-br.top});
  linkB=links.map(function(l){return l.getBoundingClientRect().bottom-br.top});
  var n=Math.max(8,Math.floor((listH+8)/PITCH)+1);
  if(n!==N){N=n;rail.innerHTML='';ticks=[];for(var i=0;i<N;i++){var t=document.createElement('i');rail.appendChild(t);ticks.push(t);ty[i]=8+i*PITCH+.5;vals[i]=-1}}
 }
 /* reader position in article -> y on the rail (piecewise: each section spans from its title to the next title) */
 function readY(){
  var line=innerHeight*0.35,pr=prose.getBoundingClientRect();
  if(line<=pr.top)return linkY[0]+5;
  for(var i=0;i<heads.length;i++){
   var a=i===0?pr.top:heads[i].getBoundingClientRect().top,
       b=i+1<heads.length?heads[i+1].getBoundingClientRect().top:pr.bottom;
   if(line<b||i===heads.length-1){var f=Math.max(0,Math.min(1,(line-a)/(b-a)));
     var y0=linkY[i]+5,y1=i+1<links.length?linkY[i+1]+5:listH-2;return y0+f*(y1-y0)}
  }
  return listH-2;
 }
 /* y on the rail -> exact point in the article (inverse of readY), for click-to-jump */
 function articleTop(y){
  var pr=prose.getBoundingClientRect();
  for(var i=0;i<links.length;i++){
   var y0=linkY[i]+5,y1=i+1<links.length?linkY[i+1]+5:listH;
   if(y<y1||i===links.length-1){var f=Math.max(0,Math.min(1,(y-y0)/(y1-y0)));
    var a=(i===0?heads[0].getBoundingClientRect().top:heads[i].getBoundingClientRect().top)+scrollY,
        b=(i+1<heads.length?heads[i+1].getBoundingClientRect().top:pr.bottom)+scrollY;
    return a+f*(b-a)}}
 }
 function frame(t){raf=0;if(!mq.matches)return;
  var dt=Math.min(.05,last?(t-last)/1000:.016);last=t;
  var target=readY();
  if(reduce){pos=target;vel=0;hAmt=0}else{
   /* critically-damped-ish spring toward the reading point */
   var k=170,c=24;vel+=((target-pos)*k-vel*c)*dt;pos+=vel*dt;
   hAmt+=(hTarget-hAmt)*Math.min(1,dt*12);hy+=(hoverY-hy)*Math.min(1,dt*22);
  }
  var settled=Math.abs(target-pos)<.05&&Math.abs(vel)<.05&&Math.abs(hTarget-hAmt)<.005&&Math.abs(hoverY-hy)<.05;
  var S=14,H=9;  /* falloff widths in px: reading point, hover magnifier */
  for(var i=0;i<N;i++){
   var d=(ty[i]-pos)/S,v=Math.exp(-d*d);
   if(hAmt>.001){var e=(ty[i]-hy)/H;v=Math.max(v,hAmt*Math.exp(-e*e))}
   v=Math.round(v*400)/400;
   if(v!==vals[i]){vals[i]=v;var s=ticks[i].style;
    s.transform=v>.003?'scaleX('+(1+1.7*v).toFixed(3)+')':'';
    s.opacity=(.14+.82*v).toFixed(3);
    s.background='rgb('+Math.round(243-9*v)+','+Math.round(230-59*v)+','+Math.round(216-96*v)+')'}
  }
  /* titles brighten with closeness to the reading point (distance to their own line range) */
  links.forEach(function(l,j){var y0=linkY[j],y1=linkB[j],dd=pos<y0?y0-pos:pos>y1?pos-y1:0,w=Math.exp(-(dd/22)*(dd/22));
   w=Math.round(w*100)/100;if(w!==lastW[j]){lastW[j]=w;l.style.setProperty('--c',[Math.round(154+101*w),Math.round(143+112*w),Math.round(134+121*w)].join(','))}});
  if(!settled)raf=requestAnimationFrame(frame);else last=0;
 }
 function kick(){if(mq.matches&&!raf)raf=requestAnimationFrame(frame)}
 function init(){measure();pos=readY();kick()}
 var toc=document.querySelector('.toc');
 toc.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse'||reduce)return;var br=box.getBoundingClientRect();hoverY=e.clientY-br.top;if(!hTarget)hy=hoverY;hTarget=1;kick()});
 toc.addEventListener('pointerleave',function(){hTarget=0;kick()});
 rail.parentNode.addEventListener('click',function(e){if(e.target.closest('a'))return;var br=box.getBoundingClientRect(),y=articleTop(e.clientY-br.top);
  scrollTo({top:y-innerHeight*0.35+2,behavior:reduce?'auto':'smooth'})});
 addEventListener('scroll',kick,{passive:true});
 addEventListener('resize',function(){measure();kick()});
 if(document.fonts)document.fonts.ready.then(init);init();
})();

/* ---------- links, drop-down, copy ---------- */
var toc=document.querySelector('.toc'),tg=document.querySelector('.sb-toggle');
function closeDrop(){toc.classList.remove('drop');tg.setAttribute('aria-expanded','false')}
links.forEach(function(a){a.addEventListener('click',function(e){var t=document.getElementById(a.dataset.for);if(!t)return;e.preventDefault();
  t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});history.replaceState(null,'','#'+a.dataset.for);closeDrop()})});
if(tg)tg.addEventListener('click',function(){var o=!toc.classList.contains('drop');toc.classList.toggle('drop',o);tg.setAttribute('aria-expanded',String(o))});
addEventListener('keydown',function(e){if(e.key==='Escape')closeDrop()});
var cp=document.querySelector('.copy'),st=cp&&cp.nextElementSibling;
if(cp)cp.addEventListener('click',function(){var u=cp.dataset.url,done=function(){cp.textContent='Link copied';st.textContent='Link copied';setTimeout(function(){cp.textContent='Copy link'},1800)};
  if(navigator.clipboard)navigator.clipboard.writeText(u).then(done,done);else done()});
})();
