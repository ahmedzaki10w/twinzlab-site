/* PREVIEW: closing CTA, "the colony". Adapted from the reference (koi drawn as a quantised grid of tiles that swim and
   make room for the UI). Here: scarab beetles and ants are drawn as small vector sprites offscreen, sampled onto the
   SAME 12px dot grid as the site, and each grid cell becomes a pixel tile (size + alpha follow coverage, so edges
   break up into loose dots like the reference). They crawl (legs animate), wander, steer around the copy, shy from
   the cursor, and leave a faint warm trail on the grid. */
(function(){
var cv=document.querySelector('.close.cdots canvas.cta-cv'); if(!cv) return;
var G=12, K=4;                        // grid pitch (px), supersample per cell
var off=document.createElement('canvas'), oc=off.getContext('2d',{willReadFrequently:true});
var seed=+(new URLSearchParams(location.search).get('seed')||18);function R(){seed=(seed*16807)%2147483647;return seed/2147483647}
function hash(x,y){var h=(x*374761393+y*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967295}
function sm(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)}

/* ---- sprites: local space, facing +x, units = grid cells ---- */
function el(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,6.2832);c.fillStyle=fill;c.fill()}
function ln(c,pts,w,col){c.beginPath();c.moveTo(pts[0],pts[1]);for(var i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);c.lineWidth=w;c.strokeStyle=col;c.lineCap='round';c.lineJoin='round';c.stroke()}
function cut(c,fn){c.save();c.globalCompositeOperation='destination-out';fn();c.restore()}
function scarab(c,ph){
  var LC='#B98456';
  // legs: three pairs, tripod gait; thick enough to survive the grid
  [[3.0,1,1.6],[0.3,0,0.2],[-3.0,1,-1.8]].forEach(function(L,i){[-1,1].forEach(function(s){
    var w=Math.sin(ph+(L[1]^(s>0?1:0))*Math.PI)*1.2, x=L[0], f=L[2];
    ln(c,[x,s*2.6,x+f*.6+w,s*4.6,x+f*1.7+w,s*6.4],1.15,LC)})});
  el(c,-1.4,0,5.3,4.5,'#E39A5F');                       // wing cases
  el(c,-1.9,0,3.9,3.3,'#EAAB78');
  el(c,-2.5,-2.0,1.6,.7,'rgba(193,217,255,.8)');        // cool sheen (site accent)
  cut(c,function(){ln(c,[-6.6,0,3,0],.9,'#000')});      // seam between the cases
  cut(c,function(){el(c,3.7,0,3.0,4.3,'#000')});        // gap before pronotum
  el(c,3.9,0,2.4,3.6,'#F3C9A6');                        // pronotum
  cut(c,function(){el(c,6.6,0,2.2,3.1,'#000')});
  el(c,6.9,0,1.5,2.5,'#D18552');                        // head shield
  [-1,1].forEach(function(s){ln(c,[7.8,s*1.1,9.4,s*2.3],1.0,'#F3C9A6');ln(c,[8.3,s*.4,10.0,s*.5],.9,'#F6E7D6')});
}
function ant(c,ph){
  var LC='#B3A69A';
  [[1.4,0,1.5],[-0.3,1,0],[-1.7,0,-1.6]].forEach(function(L,i){[-1,1].forEach(function(s){
    var w=Math.sin(ph+(L[1]^(s>0?1:0))*Math.PI)*1.1, x=L[0], f=L[2];
    ln(c,[x,s*.8,x+f*.7+w,s*3.0,x+f*1.7+w,s*5.0],.95,LC)})});
  el(c,-5.5,0,4.0,2.3,'#E8D5C2');                       // abdomen
  cut(c,function(){el(c,-1.9,0,1.5,2.2,'#000')});
  el(c,-.4,0,2.3,1.6,'#F6E7D6');                        // thorax
  cut(c,function(){el(c,2.2,0,1.7,2.0,'#000')});
  el(c,3.3,0,1.9,1.7,'#EAAB78');                        // head (peach)
  ln(c,[4.6,-.7,6.4,-1.2,7.6,-3.0],.8,'#CDBFB2');ln(c,[4.6,.7,6.4,1.2,7.6,3.0],.8,'#CDBFB2');
}

/* ---- the colony ---- */
// Behaviour: every bug is a little state machine: GO (walk at its own pace, heading drifts randomly, now and then a
// quick turn) and PAUSE (stands still, legs stop). Leg phase is driven by distance walked, so feet match the ground.
var MS=1;   // size/pace factor: 1 on desktop, smaller on phones (set in build)
var TAU=6.2832, DT=1000/60/1000;
function rr(a,b){return a+(b-a)*R()}
function Bug(kind,x,y,th,sz,o){this.k=kind;this.x=x;this.y=y;this.th=th;this.sz=sz;this.o=o;this.ph=R()*6;this.sp=0;this.hist=[];this.d=0;this.lead=null;this.slot=0;
  this.scale=sz*(kind==='s'?.92:.7)*MS*12/G;   // sprite units are grid cells; MS*12/G keeps the on-screen size at MS
  this.stride=2.4*(kind==='s'?1.2:1.1)*G*this.scale;      // px walked per leg cycle (so the feet don't slide)
  this.st='go';this.tl=rr(1,3);this.v=0;this.vmax=this.pickV();this.om=0;this.qt=0;this.qr=0;this.nq=rr(1.5,4);this._k=0}
Bug.prototype.pickV=function(){return MS*(this.k==='s'?rr(30,45):rr(60,90))};
var bugs=window.__bugs=[], inited=false, simT=0, STEP=1000/60, lastW=0, lastH=0;
function build(W,H){
  bugs.length=0;var narrow=W<800;MS=narrow?.6:1;
  function S(k,fx,fy,th,sz,o){var b=new Bug(k,fx*W,fy*H,th,sz,o);bugs.push(b);return b}
  // start spread over the whole section (not the copy)
  S('s',.14,.30,.5,1.0,1);S('s',.84,.66,-2.6,.9,2);
  var lead=S('a',.16,.80,-.35,1,4);                  // a small ant trail: leader + two followers
  for(var i=1;i<(narrow?2:3);i++){var f=new Bug('a',lead.x,lead.y,lead.th,1,4+i);f.lead=lead;f.slot=i;f.x=lead.x-Math.cos(lead.th)*i*150*MS;f.y=lead.y-Math.sin(lead.th)*i*150*MS;f.th=lead.th;bugs.push(f)}
  S('a',.88,.20,2.0,1,8);S('a',.55,.92,-1.2,1,9);
  if(narrow){bugs.length=0;S('s',.16,.16,.5,1.0,1);var l2=S('a',.8,.9,-2.5,1,4);var f2=new Bug('a',l2.x,l2.y,l2.th,1,5);f2.lead=l2;f2.slot=1;f2.x=l2.x-Math.cos(l2.th)*150*MS;f2.y=l2.y-Math.sin(l2.th)*150*MS;f2.th=l2.th;bugs.push(f2)}
  simT=0;bugsTime=0;for(var n=0;n<60*2;n++)step(W,H,0,{a:0,x:-1e4,y:-1e4});
}
function norm(a){return Math.atan2(Math.sin(a),Math.cos(a))}
function step(W,H,t,m){ if(window.__freeze)return;
  var cx=W/2,cy=H/2+8,rx=Math.min(W*.2,300),ry=H*.32;
  bugs.forEach(function(b){
    if(b.lead)return;
    var scar=b.k==='s';
    // --- GO / PAUSE
    b.tl-=DT;
    if(b.tl<=0){
      if(b.st==='go'){b.st='pause';b.tl=scar?rr(.4,1.6):rr(.15,.7)}
      else{b.st='go';b.tl=scar?rr(2,6):rr(.5,1.7);b.vmax=b.pickV();
        // set off in a slightly new direction
        b.qt=.25;b.qr=rr(-1,1)*(R()<.35?3.2:1.2)}
    }
    // --- heading: smooth random drift (Ornstein-Uhlenbeck) + occasional quick turn
    b.om+= (-b.om*1.4*DT)+(R()-.5)*(scar?5:9)*DT*Math.sqrt(1);
    b.nq-=DT;
    if(b.nq<=0&&b.st==='go'){b.qt=rr(.2,.4);b.qr=(R()<.5?-1:1)*rr(1.6,3.4);b.nq=scar?rr(3,8):rr(1.5,4.5)}
    var turn=b.om*(scar?.95:1.0);
    if(b.qt>0){turn+=b.qr;b.qt-=DT}
    // --- avoid the copy: slide round it, not through it
    var want=null,kk=0;
    // (v3: no steering round the copy; bugs walk freely behind the text)
    // --- edges: may wander a little way off, then turn back in
    var ex=0,ey=0,beyond=0;
    if(b.x<0){ex=1;beyond=Math.max(beyond,-b.x)}else if(b.x>W){ex=-1;beyond=Math.max(beyond,b.x-W)}
    if(b.y<0){ey=1;beyond=Math.max(beyond,-b.y)}else if(b.y>H){ey=-1;beyond=Math.max(beyond,b.y-H)}
    if(beyond>0&&kk<.6){want=Math.atan2(ey||Math.sin(b.th)*.3,ex||Math.cos(b.th)*.3);kk=Math.max(kk,sm(5,50,beyond))}
    // --- give each other room (no climbing over a neighbour)
    for(var j=0;j<bugs.length;j++){var o=bugs[j];if(o===b||o.lead===b||b.lead===o)continue;
      var ox_=b.x-o.x,oy_=b.y-o.y,od=Math.hypot(ox_,oy_),rad=((b.k==='s'||o.k==='s')?190:150)*MS;
      if(od<rad){var kq=sm(rad,rad*.55,od)*.85;if(kq>kk){want=Math.atan2(oy_,ox_)+Math.sin(b.th-Math.atan2(oy_,ox_))*.4;kk=kq}}}
    // --- cursor
    if(m.a>.05){var dx=b.x-m.x,dy=b.y-m.y,d=Math.hypot(dx,dy);if(d<150){want=Math.atan2(dy,dx);kk=Math.max(kk,sm(150,40,d))}}
    var rate=turn*(1-kk);
    if(want!==null){var e=norm(want-b.th);rate+=Math.max(-4,Math.min(4,e*5))*kk}
    // pausing bugs barely turn (a small antenna-check shuffle for ants)
    if(b.st==='pause')rate=0;        // a stopped bug does not slide or spin
    b.th+=rate*DT;
    // --- speed with acceleration; a bug that is shooed runs a bit faster
    var vt=b.st==='go'?b.vmax*(1+kk*.35):0, acc=(scar?160:420)*MS;
    if(vt<=0)b.v=0;else b.v+=Math.min(acc*DT,vt-b.v);          // speed up smoothly, stop instantly (no coasting)
    var step_=b.v*DT;
    b.x+=Math.cos(b.th)*step_;b.y+=Math.sin(b.th)*step_;b.d+=step_;b.sp=b.v;
    b.ph+=step_/b.stride*TAU;                         // legs follow distance walked
    if(step_>0||!b.hist.length)b.hist.push([b.x,b.y,b.d]);if(b.hist.length>1600)b.hist.shift();
  });
  // ant trail followers: real walkers that chase a point on the leader's path (pure pursuit).
  // They only ever move along their own heading; they turn first, then step. No sliding along the path.
  bugs.forEach(function(b){if(!b.lead)return;
    var L=b.lead,h=L.hist,tgtD=L.d-b.slot*150*MS,P=null;
    if(h.length>2&&tgtD>=h[0][2]){var i=h.length-1;while(i>0&&h[i][2]>tgtD)i--;var p=h[i],q=h[Math.min(h.length-1,i+1)],span=q[2]-p[2],u=span>1e-6?(tgtD-p[2])/span:0;P=[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u]}
    if(!P){ // leader hasn't walked far enough yet: wait in line behind it
      b.v=0;b.sp=0;return}
    var dx=P[0]-b.x,dy=P[1]-b.y,dist=Math.hypot(dx,dy);
    var e=norm(Math.atan2(dy,dx)-b.th);
    var moving=dist>5*MS;
    if(moving)b.th+=Math.max(-7*DT,Math.min(7*DT,e*8*DT));            // turn toward the target (ant-quick, rate-limited)
    var vt=moving?Math.min(125*MS,(dist-4*MS)*4)*Math.max(0,Math.cos(e)):0;   // walk only roughly towards where it is facing
    b.v=Math.max(0,vt);                                                  // stops dead: no coasting
    var step_=b.v*DT;b.x+=Math.cos(b.th)*step_;b.y+=Math.sin(b.th)*step_;b.sp=b.v;
    b.ph+=step_/b.stride*TAU;
  });
  bugsTime+=STEP;
}
var bugsTime=0;
window.__sim=function(m){step(lastW,lastH,0,m||{a:0,x:-1e4,y:-1e4})};

var nx,ny,WARM,tw=[],tseed=3;
TZ.stage(cv,function(c,W,H,t,m){
  var G0=G;G=W<800?8:12;   // phones: a finer grid so the smaller bugs keep their shape
  var cx=Math.ceil(W/G)+1,cy=Math.ceil(H/G)+1,ox=(W-(cx-1)*G)/2,oy=G/2;
  if(!inited||lastW!==W||lastH!==H||G0!==G){nx=cx;ny=cy;WARM=new Float32Array(nx*ny);off.width=nx*K;off.height=ny*K;build(W,H);inited=true;lastW=W;lastH=H;simT=0;simAcc=0}
  // fixed-step sim, driven by the stage clock
  if(TZ.RM){ /* still frame: one settled pose */ }
  else{simAcc=(window.simAcc||0);}
  var target=TZ.RM?0:t;
  while(simClock+STEP<=target){step(W,H,simClock,m);simClock+=STEP}
  // ---- draw bugs offscreen onto the grid resolution
  oc.setTransform(1,0,0,1,0,0);oc.clearRect(0,0,off.width,off.height);
  bugs.slice().sort(function(a,b){return a.k<b.k?1:-1}).forEach(function(b){
    var narrow=W<800;
    oc.setTransform(K,0,0,K,.5*K,.5*K);oc.translate((b.x-ox)/G,(b.y-oy)/G);oc.rotate(b.th);
    oc.scale(b.scale,b.scale);
    (b.k==='s'?scarab:ant)(oc,b.ph);
  });
  var img=oc.getImageData(0,0,off.width,off.height).data,W4=off.width;
  var ex=W/2,ey=H/2+8,rx=Math.min(W*.2,300),ry=H*.30;
  var lo=[],COPYX=270,COPYY=165,UNDER=W<800?.42:.72;
  if(W<800){ // phones: the copy block fills the width, so take its real box from the DOM
    var cr=cv.getBoundingClientRect(),mk=document.querySelector('.close .mark'),bt=document.querySelector('.close .btn'),hh=document.querySelector('.close h2'),ld=document.querySelector('.close .lead');
    if(mk&&bt&&hh&&ld){var t0=mk.getBoundingClientRect().top-cr.top,t1=bt.getBoundingClientRect().bottom-cr.top;ey=(t0+t1)/2;COPYY=(t1-t0)/2+6;
      COPYX=Math.max(hh.scrollWidth,ld.getBoundingClientRect().width)/2+6;COPYX=Math.min(COPYX,W/2-10)}}
  for(var Y=0;Y<ny;Y++){var py=oy+Y*G,edgeY=Math.min(1,Math.min(py,H-py)/(H*.14));
    for(var X=0;X<nx;X++){var px=ox+X*G,id=Y*nx+X;
      // average the K×K block
      var ra=0,ga=0,ba=0,aa=0;
      for(var j=0;j<K;j++){var row=((Y*K+j)*W4+X*K)*4;for(var i=0;i<K;i++){var a=img[row+i*4+3];if(a){ra+=img[row+i*4]*a;ga+=img[row+i*4+1]*a;ba+=img[row+i*4+2]*a;aa+=a}}}
      var cov=aa/(K*K*255);
      // keep out of the copy: tiles dissolve before they reach it
      var dx=(px-ex)/(rx*1.0),dy=(py-ey)/(ry*1.0),nd=Math.sqrt(dx*dx+dy*dy),room=1;
      var vis=cov*room;
      var qx=Math.abs(px-ex)-COPYX,qy=Math.abs(py-ey)-COPYY,sdf=Math.hypot(Math.max(qx,0),Math.max(qy,0))+Math.min(Math.max(qx,qy),0),under=1-UNDER*(1-sm(0,90,sdf));
      if(vis>.5)WARM[id]=Math.min(1,WARM[id]+.35);
      var wm=WARM[id];WARM[id]*=.975;
      if(vis>.1){
        var inv=1/(aa||1),r=ra*inv,g=ga*inv,b=ba*inv, jit=(hash(X,Y)-.5)*.14;     // tile texture
        // mute: pull toward warm grey and darken the brightest tones so copy always reads on top
        var lum=.3*r+.59*g+.11*b, f=.8-.22*sm(150,240,lum); r=(r+(lum-r)*.22)*f;g=(g+(lum-g)*.22)*f;b=(b+(lum-b)*.22)*f;
        r=Math.max(0,Math.min(255,r*(1+jit)));g=Math.max(0,Math.min(255,g*(1+jit)));b=Math.max(0,Math.min(255,b*(1+jit)));
        var q=sm(.12,.62,vis),s=(2.4+7.2*q)*G/12;
        // under the copy: dimmer still
        c.globalAlpha=Math.min(1,.2+.7*q)*.8*under*Math.max(.45,edgeY);c.fillStyle='rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
        var h=s/2;c.beginPath();if(c.roundRect)c.roundRect(px-h,py-h,s,s,s>6?1.6:s*.3);else c.rect(px-h,py-h,s,s);c.fill();continue}
      // plain dot of the grid (same as live), warmed by passing bugs and the cursor
      var ddx=(px-W/2)/(W*.30),ddy=(py-H/2)/(H*.36),cen=Math.min(1,Math.sqrt(ddx*ddx+ddy*ddy));
      var a2=.24*(.5+.5*cen)*edgeY,warm=wm*.8;
      if(vis>.02){warm=Math.max(warm,.5);a2+=.3*vis}
      if(m.a>.01){var mx=px-m.x,my=py-m.y,d2=mx*mx+my*my;if(d2<170*170){var qq=1-Math.sqrt(d2)/170;warm+=qq*qq*m.a*2;a2+=qq*qq*m.a*.4}}
      a2+=wm*.45*edgeY;
      c.globalAlpha=Math.min(1,a2)*(warm>.2?.8*under:1);c.fillStyle=warm>.2?'#A9795A':'#7A6B5F';var ss=(1.5+Math.min(1,warm)*.9)*(G<12?.85:1);c.fillRect(px-ss/2,py-ss/2,ss,ss)}}
  // single-dot twinkles (as live)
  if(!TZ.RM&&Math.random()<0&&0){}
  c.globalAlpha=1;
},{still:8000,host:cv.closest('.close')});
var simAcc=0,simClock=0;
})();
