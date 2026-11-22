/* TwinzLab text reveal (after unitedcarriers.com/about):
   text is split into lines; each line is painted with a moving gradient clipped to the text:
   final colour | peach leading edge | transparent. When the block reaches 85% of the viewport
   the edge sweeps left to right, 1.2 s per line (ease in-out), lines 0.1 s apart. Once done the split is removed. */
(function(){
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els=[].slice.call(document.querySelectorAll('[data-reveal]'));
  if(!els.length) return;
  if(reduce){ return; }
  var DUR=1200, STAG=100;
  function ease(t){ return t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }
  function split(el){
    if(el._words) return;
    var words=[], walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT), nodes=[], n;
    while(n=walker.nextNode()) if(n.nodeValue.trim()) nodes.push(n);
    nodes.forEach(function(t){
      var frag=document.createDocumentFragment(), parts=t.nodeValue.split(/(\s+)/);
      parts.forEach(function(p){
        if(!p) return;
        if(/^\s+$/.test(p)){ frag.appendChild(document.createTextNode(p)); return; }
        var s=document.createElement('span'); s.className='rw'; s.textContent=p; frag.appendChild(s); words.push(s);
      });
      t.parentNode.replaceChild(frag,t);
    });
    el._words=words; measure(el);
  }
  function measure(el){
    var lines=[], cur=null, top=null;
    el._words.forEach(function(w){
      var r=w.getBoundingClientRect(), y=Math.round(r.top);
      if(cur===null || Math.abs(y-top)>4){ cur={words:[],l:1e9,r:-1e9}; lines.push(cur); top=y; }
      cur.words.push(w); cur.l=Math.min(cur.l,r.left); cur.r=Math.max(cur.r,r.right);
      w._fc=getComputedStyle(w.parentNode).color;
    });
    lines.forEach(function(L){
      var W=L.r-L.l;
      L.words.forEach(function(w){
        var r=w.getBoundingClientRect();
        w.style.setProperty('--fc',w._fc);
        w.style.backgroundSize=(W*3.5)+'px 100%';
        w._wx=r.left-L.l; w._W=W;
      });
    });
    el._lines=lines;
  }
  function paint(el,t0,now){
    var done=true;
    el._lines.forEach(function(L,i){
      var t=Math.min(Math.max((now-t0-i*STAG)/DUR,0),1); if(t<1) done=false;
      var prog=30+70*ease(t), P=100-prog;
      L.words.forEach(function(w){ w.style.backgroundPositionX=(-2.5*w._W*P/100 - w._wx)+'px'; });
    });
    return done;
  }
  function revert(el){ el._words.forEach(function(w){ w.replaceWith(document.createTextNode(w.textContent)); }); el.normalize(); el.classList.add('rv-done'); }
  els.forEach(function(el){ el.classList.add('rv-on'); });
  function setup(){
    els.forEach(split); els.forEach(function(el){ paint(el,performance.now(),performance.now()); });
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){
      if(!e.isIntersecting) return; io.unobserve(e.target);
      var el=e.target, d=+(el.dataset.revealDelay||0), t0=performance.now()+d;
      (function f(now){ if(paint(el,t0,now)) revert(el); else requestAnimationFrame(f); })(t0);
    }); },{rootMargin:'0px 0px -15% 0px'});
    els.forEach(function(el){ io.observe(el); });
    addEventListener('resize',function(){ els.forEach(function(el){ if(el._words && !el.classList.contains('rv-done')) measure(el); }); });
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(setup);
})();
