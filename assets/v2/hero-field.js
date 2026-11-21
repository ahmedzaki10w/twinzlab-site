/* Hero v2 — Horizon field with a door of light. The dunes are STILL (drawn once, then cached);
   the life is sand: grains lift off the crests and stream sideways on the wind (spindrift), gusts come
   and go, a faint dust haze hangs over the horizon. The cursor nudges the grains, never the dunes. */
(function(){
var cv=document.getElementById('hero-cv'); if(!cv) return;
var N=TZ.noise, T=0.72;                                        // frozen terrain time: the dunes never move
// dune profile: ridged noise gives sharp wind-cut crests and soft slopes (sand, not swell)
function h1(x,z){var r=N(x*.085+z*.02,z*.15-7.2,1.08);return (.42-Math.abs(r))*1.7+N(x*.05,z*.06-T*10,T*1.5)*.7}
function h(x,z){return h1(x,z)+N(x*.37,z*.37-T*14,5)*.35}
var seed=3;function R(){seed=(seed*16807)%2147483647;return seed/2147483647}
var RAMP=[];for(var i=0;i<=24;i++){var g=i/24;RAMP.push('rgb('+Math.round(96+140*g)+','+Math.round(86+110*g)+','+Math.round(78+80*g)+')')}
var GLOW=[];for(i=0;i<=12;i++){var k=i/12;GLOW.push('rgb('+Math.round(150+84*k)+','+Math.round(112+59*k)+','+Math.round(86+34*k)+')')}
var SAND=[];for(i=0;i<=10;i++){var q=i/10;SAND.push('rgb('+Math.round(150+100*q)+','+Math.round(122+106*q)+','+Math.round(100+110*q)+')')}  // warm grey -> cream
var buf=document.createElement('canvas'),bc=buf.getContext('2d'),key='',crests=[],plumes=[],lastPlume=-1e9;
var grains=[],haze=[],risers=[],lastT=null,lastDoorRise=0;
var stats=window.__heroStats={n:0,ms:0,f:0};

// ---- the still landscape --------------------------------------------------------------------------
function scene(c,W,H,on,intro,collect){
  var hy=H*0.46,F=W*0.55,cam=2.0,cx=W/2,ROWS=(W<800?56:86),drawn=0;
  var ZD=13,dW=.52/ZD*F,dH=3.1/ZD*F*.5,yb=h(0,ZD)-.35,bx=cx,by=hy+(cam-yb)/ZD*F*.5,doorDrawn=false;
  function door(){
    doorDrawn=true;if(on<=0)return;
    var sil=[],X0=bx-dW/2-8,X1=bx+dW/2+8;
    for(var px=X0;px<=X1;px+=2){var mn=1e9;for(var zz=ZD*.62;zz<ZD;zz+=ZD*.06){var wx=(px-cx)*zz/F,syy=hy+(cam-h(wx,zz))/zz*F*.5;if(syy<mn)mn=syy}sil.push(mn)}
    c.save();c.beginPath();c.moveTo(X0,0);c.lineTo(X1,0);for(var si=sil.length-1;si>=0;si--)c.lineTo(X0+si*2,sil[si]);c.closePath();c.clip();
    var x0=bx-dW/2,y0=by-dH,M=54,HG=3;
    for(var hy2=y0-M*.8;hy2<by+6;hy2+=HG)for(var hx=x0-M;hx<x0+dW+M;hx+=HG){
      var rr=dW*.45,ex=Math.max(0,x0+rr-hx,hx-(x0+dW-rr)),ey=Math.max(0,y0+rr-hy2);
      var e=Math.sqrt(ex*ex+ey*ey*1.5)-rr;if(e<1.5)continue;
      var f=Math.exp(-e/13)*.55+Math.exp(-e/4)*.45;
      var hs=Math.sin(hx*12.9898+hy2*78.233)*43758.5453;hs-=Math.floor(hs);if(hs>f*1.1)continue;
      c.globalAlpha=Math.min(1,.08+f*.7)*on*(.8+.2*Math.sin(hs*30));c.fillStyle=f>.7?'#FFF1E0':(f>.35?'#F6CFA8':'#EAAB78');
      var hz=.9+1.3*Math.min(1,f);c.fillRect(hx-hz/2,hy2-hz/2,hz,hz);drawn++}
    var top=y0+dH*(1-on);
    var gr=c.createLinearGradient(0,y0,0,by+8);gr.addColorStop(0,'#F9DDBF');gr.addColorStop(.35,'#FFF1E2');gr.addColorStop(1,'#FFFAF3');
    c.globalAlpha=on;c.fillStyle=gr;c.fillRect(x0,top,dW,by+8-top);
    for(var y=top+1;y<by+8;y+=1.8)for(var j=1;j<=3;j++){var sz=2.1-j*.4,o=j*1.8-.9;c.globalAlpha=on*(.95-j*.22);c.fillStyle=j===1?'#FFEBD6':'#F6CFA8';c.fillRect(x0-o-sz/2,y-sz/2,sz,sz);c.fillRect(x0+dW+o-sz/2,y-sz/2,sz,sz);drawn+=2}
    for(var x=x0-4;x<x0+dW+4;x+=1.8)for(var j=1;j<=3;j++){var sz=2.1-j*.4,o=j*1.8-.9;c.globalAlpha=on*(.95-j*.22);c.fillStyle=j===1?'#FFEBD6':'#F6CFA8';c.fillRect(x-sz/2,top-o-sz/2,sz,sz);drawn++}
    var hzY=y0+dH*.70;
    for(var y=Math.max(top,y0)+1.5;y<by-1;y+=2)for(var x=x0+1.5;x<x0+dW-1;x+=2){
      var below=y>hzY,n=N(x*.25,y*.25,1.3);
      if(Math.abs(y-hzY)<1.2){c.globalAlpha=on*.9;c.fillStyle='#EAAB78';c.fillRect(x-.8,y-.8,1.6,1.6);drawn++;continue}
      var k=below?.55+.25*n:.10+.12*n;if(k<.08)continue;
      c.globalAlpha=on*k;c.fillStyle=below?'#E9B88C':'#E8D3BC';c.fillRect(x-.5,y-.5,1,1);drawn++}
    c.restore();
  }
  for(var r=ROWS-1;r>=0;r--){
    var u=r/(ROWS-1),z=1.2+Math.pow(u,1.8)*34,far=1-Math.pow(u,1.6)*.75,near=Math.min(1,.35+u*2.2);
    if(!doorDrawn&&z<ZD)door();
    var sp=9-3.6*u,step=sp*z/F,half=(W/2+20)*z/F,off=((r*0.618)%1)*step,front=z<ZD;
    for(var x=-half+off;x<half;x+=step){
      var y1=h1(x,z),y=y1+N(x*.37,z*.37-T*14,5)*.35,behind=h1(x,z+.7),slope=y1-behind;
      var sx=cx+x/z*F,sy=hy+(cam-y)/z*F*.5;
      if(sy>H+6)continue;
      var edge=Math.min(1,Math.min(sx,W-sx)/(W*.14));if(edge<=0)continue;
      var toward=Math.exp(-Math.pow((sx-cx)/(W*.30),2));
      var rim=Math.max(0,slope*7)*(.45+.55*toward);
      var gx=(sx-bx)/(W*.17),gy=(sy-by)/(H*.10),gl=Math.exp(-gx*gx-gy*gy)*on;
      var face=front?Math.max(0,slope*7):Math.max(0,-slope*7);
      var glow=gl*(.35+1.1*face);
      if(front&&sy>by-4){var pw=dW*.75*Math.pow(ZD/z,.9),pxx=(sx-bx)/pw;glow+=Math.exp(-pxx*pxx)*(.5+.5*z/ZD)*on*(1.1+2.2*face)}
      var lit=Math.min(1,.2+.18*y+rim+glow);
      var s=Math.max(.9,(1.6+2.7*lit)*Math.pow(1.2/z,.35));
      // the field dissolves into the page: over its lowest ~35% dots thin out and fade toward the bottom edge
      var yEnd=Math.min(H*.90,hy+1.2*F*.5), bot=Math.max(0,Math.min(1,(H-sy)/(H*.16),(yEnd-sy)/(.40*(yEnd-hy))));
      if(bot<1){var hh=Math.sin(sx*12.9898+sy*78.233)*43758.5453;hh-=Math.floor(hh);if(hh>Math.pow(bot,.9))continue;bot=Math.pow(bot,1.5)}
      var a=(.14+.86*lit)*far*near*intro*edge*Math.max(0,bot);
      if(a<.1)continue;
      var g=Math.min(1,lit*1.25);
      c.fillStyle=glow>.22&&g>.45?GLOW[Math.min(12,Math.round(glow*12))]:(g>.62?(g>.92?'#F6E7D6':'#EAAB78'):RAMP[Math.round(g*24)]);
      c.globalAlpha=a;c.fillRect(sx-s/2,sy-s/2,s,s);drawn++;
      // a crest: higher than the ground just behind and just in front of it — wind lifts sand here
      if(collect&&u>.06&&u<.9&&slope>.018&&y1-h1(x,z-.5)>-.02&&sy<H*.92&&edge>.4)
        crests.push({x:sx,y:sy-s*.5,k:Math.max(.35,Math.pow(1.2/z,.45)*1.6),b:Math.min(1,lit*.9+toward*.25),z:z});
    }
  }
  if(!doorDrawn)door();
  c.globalAlpha=1;
  return {drawn:drawn,hy:hy,bx:bx,by:by,dW:dW,dH:dH};
}

// ---- the moving air ---------------------------------------------------------------------------------
function gustAt(t){var v=N(t*.00021,1.7,2.3)*1.7+.25;v=Math.max(0,Math.min(1,v));return .4+.6*v*v*(3-2*v)}
var cum=[];function buildCum(){cum=[];var acc=0;for(var i=0;i<crests.length;i++){acc+=crests[i].k*crests[i].k*(.3+crests[i].b);cum.push(acc)}}
function pickCrest(){var v=R()*cum[cum.length-1],lo=0,hi=cum.length-1;while(lo<hi){var mid=(lo+hi)>>1;if(cum[mid]<v)lo=mid+1;else hi=mid}return crests[lo]}
function spawnGrain(W,t,gust){
  if(!crests.length)return;
  var pl=R()<.8&&plumes.length, cr;
  if(pl){var j=plumes[Math.floor(R()*plumes.length)],j2=Math.max(0,Math.min(crests.length-1,j+Math.round((R()-.5)*16)));   // along the ridge, not one point
    cr=Math.abs(crests[j2].y-crests[j].y)<14&&Math.abs(crests[j2].x-crests[j].x)<90?crests[j2]:crests[j]}else cr=pickCrest();
  var k=cr.k;
  grains.push({x:cr.x+(R()-.5)*6*k,y:cr.y-R()*2*k,vx:(1+1.1*R())*k*gust,vy:-(pl?(.1+.38*R()):(.05+.18*R()))*k*gust,k:k,
    b:Math.min(1,cr.b*(.75+.3*R())+(pl?.2:0)),l:0,L:(pl?2600:1400)+R()*3200*(.6+gust*.5),s:Math.max(.8,Math.min(2.2,(.6+.8*R())*k))});
}
function initHaze(W,H,hy){
  haze=[];for(var i=0;i<(W<800?260:700);i++){var v=R(),y=hy-14+Math.pow(v,1.7)*H*.20;
    haze.push({x:R()*W,y:y,y0:y,v:.05+.16*R(),s:.7+.7*R(),a:.07+.2*R()*(1-v*.6),ph:R()*6.3})}
}
var pmx=null,pmy=null,mvx=0,mvy=0;
function step(W,H,t,dt,m,gust,L){
  if(pmx!==null){mvx=mvx*.8+Math.max(-30,Math.min(30,m.x-pmx))*.2;mvy=mvy*.8+Math.max(-30,Math.min(30,m.y-pmy))*.2}pmx=m.x;pmy=m.y;
  // move plume sources from time to time: wind tears sand off a few crests at once
  if(t-lastPlume>2600&&crests.length){lastPlume=t;plumes=[];var np=2+Math.round(gust*4);
    for(var i=0;i<np;i++){var cc=pickCrest();plumes.push(crests.indexOf(cc))}}
  var cap=W<800?800:2200, rate=(W<800?2.6:6.8)*gust*dt;
  for(var e=rate+(R()<rate%1?1:0);e>=1&&grains.length<cap;e--)spawnGrain(W,t,gust);
  var wind=1.7*gust;
  for(var i=grains.length-1;i>=0;i--){var p=grains[i];p.l+=16*dt;
    if(p.l>=p.L||p.x>W+20){grains.splice(i,1);continue}
    var tw=N(p.x*.006,p.y*.012,t*.0004+p.k);
    p.vx+=(wind*p.k*(1+.5*tw)-p.vx)*.03*dt;
    p.vy+=(.0028*p.k+tw*.008*p.k)*dt;            // grains settle back, with eddies
    if(p.vy>.35*p.k)p.vy=.35*p.k;
    if(m.a>.02){var dx=p.x-m.x,dy=p.y-m.y,d2=dx*dx+dy*dy;if(d2<130*130){var f=(1-Math.sqrt(d2)/130)*m.a*dt;p.vx+=mvx*.012*f;p.vy+=mvy*.005*f-.004*f}}   // the cursor is a breath of wind
    p.x+=p.vx*dt;p.y+=p.vy*dt}
  for(i=0;i<haze.length;i++){var q=haze[i];q.x+=q.v*(.5+gust)*dt;q.y=q.y0+Math.sin(t*.0004+q.ph)*2;
    if(m.a>.02){var dx=q.x-m.x,dy=q.y-m.y,d2=dx*dx+dy*dy;if(d2<110*110)q.x+=mvx*.05*(1-Math.sqrt(d2)/110)*m.a*dt}
    if(q.x>W+4)q.x-=W+8}
  for(i=risers.length-1;i>=0;i--){var p=risers[i];p.l+=16*dt;p.y-=p.v*dt;p.x+=(p.d+wind*.25*Math.min(1,p.l/1500))*dt;if(p.l>=p.L)risers.splice(i,1)}
  if(!TZ.RM&&t-lastDoorRise>560&&risers.length<50&&L){lastDoorRise=t;risers.push({x:L.bx-L.dW/2+R()*L.dW,y:L.by-L.dH*(.4+.5*R()),v:.15+R()*.25,d:(R()-.5)*.1,l:0,L:3500+R()*3000,s:1+R()*.8})}
}
function air(c,W,H,t){
  var n=0,bx=L?L.bx:W/2,by=L?L.by:H*.5,gw=W*.13,gh=H*.11;
  for(var i=0;i<haze.length;i++){var q=haze[i];var ex=(q.x-bx)/gw;c.globalAlpha=q.a*(.7+.3*Math.sin(t*.001+q.ph))*(1+1.2*Math.exp(-ex*ex));c.fillStyle=SAND[6];c.fillRect(q.x,q.y,q.s,q.s);n++}
  for(i=0;i<grains.length;i++){var p=grains[i],kq=p.l/p.L,fa=Math.min(1,kq*6)*(1-kq)*(1-kq*.3);
    var len=Math.min(9*p.k,Math.abs(p.vx)*3);           // fast grains smear into short wisps
    var ex=(p.x-bx)/gw,ey=(p.y-by)/gh,bb=Math.min(1,p.b+.6*Math.exp(-ex*ex-ey*ey));   // grains near the door catch its light
    c.globalAlpha=Math.min(.92,(.38+.58*bb)*fa);c.fillStyle=SAND[Math.round(bb*10)];
    c.fillRect(p.x-len,p.y-p.s/2,p.s+len,p.s);n++}
  for(i=0;i<risers.length;i++){var p=risers[i],kq=p.l/p.L;c.globalAlpha=Math.sin(kq*Math.PI)*.9;c.fillStyle=kq<.4?'#FFF4E6':'#F3D9BF';c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);n++}
  c.globalAlpha=1;return n;
}

var L=null;
TZ.stage(cv,function(c,W,H,t,m){
  var t0=performance.now(),intro=TZ.RM?1:TZ.ease(t/2400),on=TZ.RM?1:TZ.ease((t-2000)/1600),drawn=0;
  var dpr=c.canvas.width/W,k2=W+'x'+H+'x'+dpr,settled=intro>=1&&on>=1;
  if(settled&&key!==k2){                                       // draw the landscape once, keep it
    buf.width=c.canvas.width;buf.height=c.canvas.height;bc.setTransform(dpr,0,0,dpr,0,0);bc.clearRect(0,0,W,H);
    crests=[];plumes=[];L=scene(bc,W,H,1,1,true);buildCum();key=k2;grains=[];initHaze(W,H,L.hy);
    if(TZ.RM){var gs=gustAt(t);for(var s=0;s<260;s++)step(W,H,t-(260-s)*16,1,{a:0},gs,null)}
  }
  if(settled){c.drawImage(buf,0,0,W,H);drawn=L.drawn}
  else{var LL=scene(c,W,H,on,intro,false);drawn=LL.drawn;if(!haze.length)initHaze(W,H,LL.hy)}
  var gust=gustAt(t);
  if(!TZ.RM){var dt=lastT===null?1:Math.min(3,Math.max(.2,(t-lastT)/16.67));lastT=t;
    if(settled)step(W,H,t,dt,m,gust,L)}
  var fade=TZ.RM?1:intro; c.save();c.globalAlpha=fade;
  var na=air(c,W,H,t); c.restore();
  stats.f++;stats.n=drawn;stats.air=na;stats.cr=crests.length;stats.gr=grains.length;stats.gu=gust;stats.ms=stats.ms*.9+(performance.now()-t0)*.1;
},{still:9000,host:cv.closest('section')});
})();
