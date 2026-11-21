/* Closing CTA — a faint warm dot grid; around the edges small pixel glyphs (spark, door, dune line, arrow,
   loop, twin rings, play, a dotted path) draw themselves dot by dot on the same grid, hold, and fade.
   The centre stays clear for the copy. Desktop cursor warms the grid it passes over. */
(function(){
var cv=document.getElementById('cta-cv'); if(!cv) return;
var G=12;
var GL={
 spark:['....x....','....x....','....x....','...x.x...','xxx...xxx','...x.x...','....x....','....x....','....x....'],
 door:['.xxxx.','x....x','x....x','x....x','x....x','x....x','x...xx','x....x','x....x','xxxxxx'],
 dune:['....xxx.........','..xx...xx.......','.x.......xx..xxx','x..........xx...'],
 arrow:['...xxxxx','......xx','.....x.x','....x..x','...x...x','..x.....','.x......','x.......'],
 loop:['...xxx...','.xx...xx.','.x.....x.','x.......x','x.......x','x.......x','.x.....x.','.xx...xx.','...xxx...'],
 twins:['..xxx...xxx..','.x...x.x...x.','x.....x.....x','x....x.x....x','x.....x.....x','.x...x.x...x.','..xxx...xxx..'],
 play:['x.....','xxx...','x..xx.','x....x','x..xx.','xxx...','x.....'],
 plus:['..x..','..x..','xxxxx','..x..','..x..'],
 grid3:['x.x.x','.....','x.x.x','.....','x.x.x']
};
// a dotted path, every other cell along a gentle S
function path(w,h){var rows=[];for(var y=0;y<h;y++)rows.push(Array(w+1).join('.').split(''));
  for(var i=0;i<=w*1.4;i+=1){var t=i/(w*1.4),x=Math.round(t*(w-1)),y=Math.round((h-1)*(.5-.5*Math.cos(t*Math.PI*1.0))*(1-.25*Math.sin(t*6)));y=Math.max(0,Math.min(h-1,y));if(i%2===0)rows[y][x]="x"}
  return rows.map(function(r){return r.join('')})}
GL.path=path(18,6);
// greedy nearest-neighbour order, so a glyph "draws" like a pen
function cells(rows){var pts=[];rows.forEach(function(r,y){for(var x=0;x<r.length;x++)if(r[x]==='x')pts.push([x,y])});
  var out=[],cur=pts.reduce(function(a,b){return (b[0]+b[1]*.3)<(a[0]+a[1]*.3)?b:a});
  while(pts.length){var bi=0,bd=1e9;for(var i=0;i<pts.length;i++){var dx=pts[i][0]-cur[0],dy=pts[i][1]-cur[1],d=dx*dx+dy*dy;if(d<bd){bd=d;bi=i}}cur=pts.splice(bi,1)[0];out.push(cur)}
  return out}
var PAL=[['#EAAB78','#F3C9A6'],['#F6E7D6','#EAAB78'],['#F3C9A6','#E39A84'],['#EAAB78','#F6E7D6']];
// placements: fractions of the section; m:1 = also shown on narrow screens
var PLACE=[
 {g:'spark',x:.075,y:.16,p:0,o:0,m:1},{g:'path',x:.02,y:.44,p:1,o:2.2},{g:'door',x:.19,y:.34,p:1,o:5.5},
 {g:'dune',x:.09,y:.74,p:3,o:1.2,m:1},{g:'plus',x:.33,y:.86,p:2,o:7.4},{g:'arrow',x:.86,y:.13,p:0,o:3.1,m:1},
 {g:'grid3',x:.66,y:.07,p:1,o:9.0},{g:'play',x:.79,y:.40,p:3,o:6.3},{g:'loop',x:.90,y:.60,p:2,o:.6},
 {g:'twins',x:.72,y:.80,p:0,o:4.2,m:1},{g:'path',x:.40,y:.04,p:3,o:8.2,flip:1}
];
PLACE.forEach(function(P){var rows=GL[P.g];if(P.flip)rows=rows.slice().reverse();P.c=cells(rows);P.w=rows[0].length;P.h=rows.length;P.L=12500+(P.o%3)*900});
var A,B,S,nx,ny,tw=[],seed=7;function R(){seed=(seed*16807)%2147483647;return seed/2147483647}
TZ.stage(cv,function(c,W,H,t,m){
  var cx=Math.ceil(W/G)+1,cy=Math.ceil(H/G)+1,narrow=W<800;
  if(nx!==cx||ny!==cy){nx=cx;ny=cy;A=new Float32Array(nx*ny);B=new Int8Array(nx*ny);S=new Float32Array(nx*ny)}
  A.fill(0);B.fill(-1);S.fill(0);
  var ox=(W-(nx-1)*G)/2+G/2-G/2, oy=G/2;
  // glyph life: draw (pen), hold, fade, rest — each on its own clock
  for(var k=0;k<PLACE.length;k++){var P=PLACE[k];if(narrow&&!P.m)continue;
    var gx=Math.round(P.x*W/G),gy=Math.round(P.y*H/G);
    if(narrow){gx=Math.round((P.x<.5?.04:.96)*W/G)-(P.x<.5?0:P.w);gy=Math.round((P.y<.5?.05:.86)*H/G)}
    var lt=TZ.RM?2600:(t+P.o*1000)%P.L, n=P.c.length, draw=1800+n*25, hold=draw+7000, fade=hold+1600;
    for(var i=0;i<n;i++){var v;
      if(TZ.RM)v=1;
      else if(lt<draw)v=Math.max(0,Math.min(1,(lt/draw*(n+3)-i)/3));
      else if(lt<hold)v=1;
      else if(lt<fade){var f=(lt-hold)/1600;v=Math.max(0,Math.min(1,1-(f*(n+3)-i)/3))}   // fades out in the same order
      else v=0;
      if(v<=0)continue;
      var X=gx+P.c[i][0],Y=gy+P.c[i][1];if(X<0||Y<0||X>=nx||Y>=ny)continue;
      var id=Y*nx+X;if(v>A[id]){A[id]=v;B[id]=P.p*2+((i*7)%5===0?1:0)}
      for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;var X2=X+dx,Y2=Y+dy;if(X2<0||Y2<0||X2>=nx||Y2>=ny)continue;var j=Y2*nx+X2,w=v*(dx&&dy?.22:.34);if(w>S[j])S[j]=w}}   // a soft tint around each stroke
  }
  // occasional single-dot twinkles in the grid
  if(!TZ.RM&&R()<.06&&tw.length<14)tw.push({x:Math.floor(R()*nx),y:Math.floor(R()*ny),l:0,L:1600+R()*1800});
  var ex=W/2,ey=H/2,rx=W*.30,ry=H*.36;
  for(var Y=0;Y<ny;Y++){var py=oy+Y*G,edgeY=Math.min(1,Math.min(py,H-py)/(H*.14));
    for(var X=0;X<nx;X++){var px=ox+X*G,id=Y*nx+X,v=A[id];
      if(v>0){var pal=PAL[B[id]>>1],col=pal[B[id]&1],s=1.8+1.6*v;
        c.globalAlpha=(.35+.65*v)*Math.max(.4,edgeY);c.fillStyle=col;c.fillRect(px-s/2,py-s/2,s,s);continue}
      var dx=(px-ex)/rx,dy=(py-ey)/ry,cen=Math.min(1,Math.sqrt(dx*dx+dy*dy));
      var a=.24*(.5+.5*cen)*edgeY,warm=S[id];
      if(m.a>.01){var mx=px-m.x,my=py-m.y,d2=mx*mx+my*my;if(d2<170*170){var q=1-Math.sqrt(d2)/170;warm=q*q*m.a;warm+=q*q*m.a;a+=q*q*m.a*.4}}
      if(S[id]>0)a+=S[id]*.45*edgeY;
      c.globalAlpha=Math.min(1,a);c.fillStyle=warm>.2?'#EAAB78':'#7A6B5F';var ss=1.5+warm*.8;c.fillRect(px-ss/2,py-ss/2,ss,ss)}}
  for(var i=tw.length-1;i>=0;i--){var p=tw[i];p.l+=16;if(p.l>p.L){tw.splice(i,1);continue}
    var px=ox+p.x*G,py=oy+p.y*G,dx=(px-ex)/rx,dy=(py-ey)/ry;if(dx*dx+dy*dy<1)continue;
    c.globalAlpha=Math.sin(p.l/p.L*Math.PI)*.55;c.fillStyle='#F3C9A6';c.fillRect(px-1.1,py-1.1,2.2,2.2)}
  c.globalAlpha=1;
},{still:8000,host:cv.closest('.close')});
})();
