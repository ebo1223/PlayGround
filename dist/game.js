const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,dpr,score=0,best=+(localStorage.whackBest||0),time=30,playing=false,last=0,spawnTimer=0,shake=0,holes=[],moles=[],particles=[],hammer={x:0,y:0,show:false,hit:false};
const $=id=>document.getElementById(id);
$('best').textContent=String(best).padStart(4,'0');
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);layout()}
function layout(){holes=[];const compact=W<700;const cx=W/2,cy=H*.58;const spacing=compact?Math.min(W*.24,130):Math.min(W*.17,210);const rowY=compact?70:90;[-1,0,1].forEach((r,ri)=>{for(let c=-1;c<=1;c++){if(compact&&ri===1&&c===0)continue;holes.push({x:cx+c*spacing,y:cy+(r)*rowY,s:compact?Math.min(1.05,W/390):1,phase:c+r*1.7})}})}
addEventListener('resize',resize);resize();
function roundRect(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r)}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function drawBackground(t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#78bea5');g.addColorStop(.62,'#91c8a1');g.addColorStop(1,'#65a878');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=.12;ctx.fillStyle='#176449';for(let i=-100;i<W+100;i+=42){for(let j=90;j<H;j+=46){ctx.beginPath();ctx.arc(i+(j%92),j,3,0,7);ctx.fill()}}ctx.globalAlpha=1;
  ctx.fillStyle='rgba(255,255,210,.18)';ellipse(W*.5,H*.51,W*.38,H*.33,'rgba(255,255,210,.12)');
}
function drawHole(h,t){const s=h.s,x=h.x,y=h.y;
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle='rgba(40,92,55,.22)';ellipse(0,34,95,28,'rgba(40,92,55,.22)');
  ellipse(0,0,78,37,'#6c5a3e');ellipse(0,-7,68,29,'#35291f');ellipse(0,-10,58,22,'#211a15');
  ctx.fillStyle='#8a7147';ellipse(0,20,82,20,'#8a7147');ctx.fillStyle='#4b3826';ellipse(0,-7,64,26,'#4b3826');ctx.fillStyle='#281f18';ellipse(0,-11,55,21,'#281f18');
  ctx.restore()
}
function drawMole(m,t){const h=holes[m.hole],s=h.s;const p=m.pop=Math.min(1,m.pop+(m.hit?-0.12:0.055));let y=h.y-p*78*m.scale;ctx.save();ctx.translate(h.x,y);ctx.scale(s,s);
  ctx.rotate(m.hit?(m.id%2?-.18:.18):Math.sin(t*.006+m.id)*.025);
  ctx.globalAlpha=m.hit?Math.max(.2,1-m.dead*.08):1;
  ellipse(0,21,58,24,'#9b5a3d');ellipse(0,-4,44,50,'#9b5a3d');ellipse(-29,-2,17,34,'#9b5a3d');ellipse(29,-2,17,34,'#9b5a3d');
  ellipse(-22,-17,7,10,'#fff2c9');ellipse(22,-17,7,10,'#fff2c9');ctx.fillStyle='#2a211b';ellipse(-22,-17,3.5,5,'#2a211b');ellipse(22,-17,3.5,5,'#2a211b');
  ellipse(0,10,25,18,'#c9895e');ellipse(0,2,8,6,'#edb092');ellipse(-8,3,3,3,'#171713');ellipse(8,3,3,3,'#171713');
  ellipse(-11,28,20,9,'#7f4936');ellipse(11,28,20,9,'#7f4936');ctx.fillStyle='#ef806a';ellipse(0,17,7,5,'#ef806a');
  if(m.hit){ctx.strokeStyle='#2e271f';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-30,-18);ctx.lineTo(-13,-13);ctx.moveTo(30,-18);ctx.lineTo(13,-13);ctx.stroke()}
  ctx.restore();
}
function drawBomb(m,t){const h=holes[m.hole],s=h.s,p=m.pop=Math.min(1,m.pop+(m.hit?-0.12:0.055));ctx.save();ctx.translate(h.x,h.y-p*68);ctx.scale(s,s);
  ellipse(0,12,48,44,'#303436');ellipse(-12,-12,11,15,'#464a49');ellipse(0,-5,30,28,'#252829');ellipse(0,0,22,20,'#171a1a');ellipse(-10,-12,7,7,'rgba(255,255,255,.18)');
  ctx.strokeStyle='#6d4b32';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(28,-29);ctx.quadraticCurveTo(45,-50,38,-62);ctx.stroke();ctx.fillStyle='#ffb52e';ellipse(38,-63,8,8,'#ffb52e');ctx.restore()
}
function pop(){if(!playing)return;if(moles.length<1||Math.random()<.16)moles.push({id:Date.now()+Math.random(),hole:Math.floor(Math.random()*holes.length),pop:0,hit:false,dead:0,scale:.75+Math.random()*0.35,bomb:Math.random()<.17})}
function spawnLoop(){spawnTimer+=1/60;if(spawnTimer>Math.max(.42,1.05-time*.018)){spawnTimer=0;pop();if(time<12&&Math.random()<.38)pop()}}
function update(){moles.forEach(m=>{if(m.hit)m.dead++;else if(m.pop>=.96)m.life=(m.life||0)+1;if((m.life||0)>75||m.dead>18)m.done=true});moles=moles.filter(m=>!m.done);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.28;p.life--});particles=particles.filter(p=>p.life>0);if(shake>0)shake--}
function render(t){drawBackground(t);holes.forEach(h=>drawHole(h,t));moles.slice().sort((a,b)=>holes[a.hole].y-holes[b.hole].y).forEach(m=>m.bomb?drawBomb(m,t):drawMole(m,t));particles.forEach(p=>{ctx.globalAlpha=Math.min(1,p.life/20);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size)});ctx.globalAlpha=1;if(hammer.show)drawHammer(hammer.x,hammer.y,hammer.hit);if(shake)ctx.translate((Math.random()-.5)*shake*.35,(Math.random()-.5)*shake*.35)}
function drawHammer(x,y,hit){ctx.save();ctx.translate(x,y);ctx.rotate(hit?-1:.7);ctx.translate(0,hit?14:0);ctx.fillStyle='#9b6038';roundRect(-9,-85,18,92,8);ctx.fill();ctx.fillStyle='#edb34f';roundRect(-50,-105,100,42,10);ctx.fill();ctx.fillStyle='#ffe09a';roundRect(-43,-98,86,10,5);ctx.fill();ctx.restore()}
function burst(x,y,color,n=12){for(let i=0;i<n;i++){let a=Math.random()*Math.PI*2,s=2+Math.random()*5;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-3,life:20+Math.random()*15,size:3+Math.random()*5,color})}}
function whack(px,py){if(!playing)return;let hit=false;for(let i=moles.length-1;i>=0;i--){const m=moles[i],h=holes[m.hole];if(m.pop>.18&&Math.abs(px-h.x)<75*h.s&&py>h.y-110*h.s&&py<h.y+30*h.s){hit=true;m.hit=true;if(m.bomb){score=Math.max(0,score-200);shake=12;burst(h.x,h.y-50,'#ff5a3d',18);combo('BOMB!',-200)}else{score+=100+(time<10?50:0);burst(h.x,h.y-45,'#ffd95a',14);burst(h.x,h.y-45,'#fff5c9',8);combo(time<10?'QUICK!':'NICE!',100+(time<10?50:0))}updateScore();break}}hammer={x:px,y:py,show:true,hit};setTimeout(()=>hammer.show=false,130)}
function combo(text,pts){const el=$('combo');el.innerHTML=text+' <span>'+ (pts<0?'':'+')+pts+'</span>';el.classList.remove('show');void el.offsetWidth;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),600)}
function updateScore(){$('score').textContent=String(score).padStart(4,'0');if(score>best){best=score;$('best').textContent=String(best).padStart(4,'0');localStorage.whackBest=best}}
function start(){score=0;time=30;moles=[];particles=[];playing=true;spawnTimer=0;$('score').textContent='0000';$('timer').textContent='30';$('startScreen').classList.add('hidden');$('endScreen').classList.add('hidden');last=performance.now();requestAnimationFrame(loop)}
function end(){playing=false;if(score>0)burst(W/2,H*.5,'#ffc83d',35);$('finalScore').textContent=score;$('resultText').textContent=score>=2000?'Master mole whacker!':score>=1000?'Great whacking!':'Keep practicing!';setTimeout(()=>$('endScreen').classList.remove('hidden'),350)}
function loop(now){if(!playing)return;const dt=now-last;last=now;if(dt>100){requestAnimationFrame(loop);return}update();spawnLoop();render(now);requestAnimationFrame(loop)}
let secondAcc=0;setInterval(()=>{if(!playing)return;secondAcc++;time--;$('timer').textContent=String(time).padStart(2,'0');if(time<=0)end()},1000);
canvas.addEventListener('pointerdown',e=>{const r=canvas.getBoundingRect();whack(e.clientX,e.clientY)});
$('startBtn').onclick=start;$('againBtn').onclick=start;
render(0);
