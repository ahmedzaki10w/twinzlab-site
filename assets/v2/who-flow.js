/* Who A — From many, a movement: scattered single dots drift in from the left, find each other,
   and lock into one precise matrix that climbs to the right. */
(function(){
var cv=document.getElementById('who-cv'); if(!cv) return;
var ROWS=11,COLS=Math.round(1280*1.3/9),COPIES=3,N=ROWS*COLS*COPIES,P=[],seed=5;function R(){seed=(seed*16807)%2147483647;return seed/2147483647}
function g(){var u=R()||1e-6,v=R();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v)}
for(var i=0;i<N;i++)P.push({s:(Math.floor(i/ROWS)%COLS)/COLS+(R()-.5)*.002,o:g()*.5,z:g()*.5,j:R()*100,row:i%ROWS,acc:R()<.07,px:0,py:0,vx:0,vy:0});
function sm(a,b,x){var t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)}
TZ.stage(cv,function(c,W,H,t,m){
  var T=t*.001, intro=TZ.ease(t/2600), G=9, speed=.016, shift=((T*speed*W*1.3)%G+G)%G;
  for(var i=0;i<N;i++){var p=P[i];
    var s=(p.s+T*speed)%1, X=s*1.3-.15;
    // loose: wandering, spread wide
    var cy=.55+.22*TZ.noise(X*1.4,T*.10,1)+.10*Math.sin(6.2832*(X*.7-T*.03));
    var w=.30*(1-sm(.1,.6,X))+.06;
    var lx=X*W+TZ.noise(p.j,T*.25,2)*40*(1-X), ly=(cy+p.o*w+TZ.noise(p.j,T*.25,7)*.08*(1-X))*H;
    // ordered: a dot-matrix band rising to the upper right
    var bx=Math.round((X*W-shift)/G)*G+shift, base=H*(.68-.62*(X-.45)), by=Math.round((base+(p.row-(ROWS-1)/2)*G-0)/G)*G;
    var b=sm(.38,.72,X);
    var x=lx+(bx-lx)*b, y=ly+(by-ly)*b;
    if(m.a>.01){var dx=x-m.x,dy=y-m.y,d2=dx*dx+dy*dy;if(d2<130*130){var d=Math.sqrt(d2)+.01,k=(1-d/130);p.vx+=dx/d*k*1.2*m.a;p.vy+=dy/d*k*1.2*m.a}}
    p.vx*=.88;p.vy*=.88;p.px=Math.max(-40,Math.min(40,(p.px+p.vx)*.93));p.py=Math.max(-40,Math.min(40,(p.py+p.vy)*.93));x+=p.px;y+=p.py;
    var edge=Math.min(1,Math.min(x,W-x)/(W*.08)); if(edge<=0||y<0||y>H)continue;
    var near=Math.max(0,Math.min(1,.5+p.z*.7));
    var sz=(1+1.6*near)*(1-b)+3.2*b;
    c.globalAlpha=((.22+.7*near)*(1-b)+.92*b)*edge*intro;
    c.fillStyle=p.acc?'#EAAB78':(b>.5||near>.7?'#F3EADF':'#A99A8B');
    c.fillRect(x-sz/2,y-sz/2,sz,sz);
  }
  c.globalAlpha=1;
},{still:20000,host:cv.closest('section')});
})();
