const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,scale=1,playing=false,last=0,elapsed=0,goals=[0,0],gameOver=false;
const keys={};
const player={x:.31,y:.5,vx:0,vy:0,r:12};
const cpu={x:.69,y:.5,vx:0,vy:0,r:12};
const ball={x:.5,y:.5,vx:0,vy:0,r:8};
function resize(){const r=canvas.getBoundingClientRect();canvas.width=r.width*devicePixelRatio;canvas.height=r.height*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);W=r.width;H=r.height;}
addEventListener('resize',resize);resize();
function resetPositions(){player.x=.31;player.y=.5;cpu.x=.69;cpu.y=.5;ball.x=.5;ball.y=.5;ball.vx=ball.vy=0;}
function drawField(){ctx.fillStyle='#65ad58';ctx.fillRect(0,0,W,H);ctx.globalAlpha=.11;ctx.fillStyle='#b4d16a';for(let x=0;x<W;x+=W/12)ctx.fillRect(x,0,W/12,H);ctx.globalAlpha=1;
ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=2;ctx.strokeRect(W*.035,H*.08,W*.93,H*.84);ctx.beginPath();ctx.moveTo(W/2,H*.08);ctx.lineTo(W/2,H*.92);ctx.stroke();ctx.beginPath();ctx.arc(W/2,H/2,Math.min(W,H)*.14,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.8)';ctx.beginPath();ctx.arc(W/2,H/2,3,0,7);ctx.fill();
ctx.strokeRect(W*.035,H*.31,W*.13,H*.38);ctx.strokeRect(W*.835,H*.31,W*.13,H*.38);ctx.strokeRect(W*.035,H*.39,W*.055,H*.22);ctx.strokeRect(W*.91,H*.39,W*.055,H*.22);
}
function drawPlayer(p,color,number){ctx.beginPath();ctx.arc(p.x*W,p.y*H,p.r+3,0,7);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fill();ctx.beginPath();ctx.arc(p.x*W,p.y*H,p.r,0,7);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='white';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(number,p.x*W,p.y*H+.5)}
function drawBall(){const x=ball.x*W,y=ball.y*H;ctx.beginPath();ctx.arc(x,y,ball.r+2,0,7);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fill();ctx.beginPath();ctx.arc(x,y,ball.r,0,7);ctx.fillStyle='#f8f6ec';ctx.fill();ctx.strokeStyle='#1c2d37';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fillStyle='#263d48';ctx.fill()}
function collide(p){let dx=ball.x-p.x,dy=ball.y-p.y,d=Math.hypot(dx,dy),min=(p.r+ball.r)/Math.min(W,H);if(d<min){let nx=dx/d||0,ny=dy/d||0;ball.vx+=nx*.018+0.001;ball.vy+=ny*.018+0.001}}
function kick(){if(!playing)return;let dx=ball.x-player.x,dy=ball.y-player.y,d=Math.hypot(dx,dy);if(d<.12){let power=.028;ball.vx=dx/d*power+(dx>=0?0:.001);ball.vy=dy/d*power+.002*(Math.random()-.5);}}
function goal(side){goals[side]++;document.getElementById(side?'rightScore':'leftScore').textContent=goals[side];let f=document.getElementById('goalFlash');f.classList.add('show');setTimeout(()=>f.classList.remove('show'),900);resetPositions();}
function update(dt){if(!playing)return;elapsed+=dt;document.getElementById('clock').textContent=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(Math.floor(elapsed%60)).padStart(2,'0')}`;
let ax=(keys.ArrowRight||keys.d||0)-(keys.ArrowLeft||keys.a||0),ay=(keys.ArrowDown||keys.s||0)-(keys.ArrowUp||keys.w||0),m=Math.hypot(ax,ay)||1;player.vx=player.vx*.7+(ax/m*.004*dt);player.vy=player.vy*.7+(ay/m*.004*dt);
player.x=Math.max(.05,Math.min(.95,player.x+player.vx));player.y=Math.max(.1,Math.min(.9,player.y+player.vy));
let tx=ball.x+.045*(ball.vx>0?1:-1),ty=ball.y;let dx=tx-cpu.x,dy=ty-cpu.y,d=Math.hypot(dx,dy)||1;cpu.vx=dx/d*.0032*dt;cpu.vy=dy/d*.0032*dt;cpu.x=Math.max(.5,Math.min(.95,cpu.x+cpu.vx));cpu.y=Math.max(.1,Math.min(.9,cpu.y+cpu.vy));
ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;ball.vx*=.992;ball.vy*=.992;if(ball.y<.09||ball.y>.91)ball.vy*=-.82;if(ball.x<.035||ball.x>.965)ball.vx*=-.82;ball.x=Math.max(.035,Math.min(.965,ball.x));ball.y=Math.max(.09,Math.min(.91,ball.y));collide(player);collide(cpu);
if(ball.x<.03&&ball.y>.31&&ball.y<.69)goal(1);if(ball.x>.97&&ball.y>.31&&ball.y<.69)goal(0);
if(elapsed>=90){playing=false;gameOver=true;document.getElementById('roundLabel').textContent='FULL TIME';document.querySelector('.overlay-card small').textContent='MATCH COMPLETE';document.querySelector('.overlay-card h1').innerHTML=goals[0]>=goals[1]?'ARGENTINA<br><em>WINS</em>':'BRAZIL<br><em>WINS</em>';document.getElementById('startBtn').innerHTML='PLAY AGAIN <span>›</span>';document.getElementById('kickoff').classList.add('show');}}
function loop(t){let dt=Math.min(2,(t-last)/16.67||1);last=t;update(dt);drawField();drawPlayer(cpu,'#f1c94f','B');drawPlayer(player,'#df5a46','A');drawBall();requestAnimationFrame(loop)}requestAnimationFrame(loop);
document.getElementById('startBtn').onclick=()=>{elapsed=0;goals=[0,0];document.getElementById('leftScore').textContent='0';document.getElementById('rightScore').textContent='0';document.getElementById('roundLabel').textContent='1ST HALF';resetPositions();playing=true;document.getElementById('kickoff').classList.remove('show')};
addEventListener('keydown',e=>{keys[e.key]=1;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.code==='Space')kick()});addEventListener('keyup',e=>keys[e.key]=0);
document.getElementById('kickBtn').onclick=kick;document.querySelectorAll('#dpad button').forEach(b=>{const k=b.dataset.key;const on=e=>{e.prevent;keys[k]=1};b.onpointerdown=e=>{e.preventDefault();keys[k]=1};b.onpointerup=()=>keys[k]=0;b.onpointerleave=()=>keys[k]=0});
