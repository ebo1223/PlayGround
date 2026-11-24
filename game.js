const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=21,H=23,T=32;
const map=[
'#####################',
'#.........#.........#',
'#.###.###.#.###.###.#',
'#o###.###.#.###.###o#',
'#...................#',
'#.###.#.#####.#.###.#',
'#.....#...#...#.....#',
'#####.### # ###.#####',
'    #.#       #.#    ',
'#####.# ##=## #.#####',
'     .  #   #  .     ',
'#####.# ##### #.#####',
'    #.#       #.#    ',
'#####.# ##### #.#####',
'#.........#.........#',
'#.###.###.#.###.###.#',
'#o..#..... .....#..o#',
'###.#.#.#####.#.#.###',
'#.....#...#...#.....#',
'#.#######.#.#######.#',
'#...................#',
'#o.................o#',
'#####################'
];
let pellets=new Set(),player,ghosts,score,lives,running=false,power=0,last=0,won=false;
const colors=['#ff2929','#ff9acb','#36d8e9','#ff9e25'];
function setup(){pellets=new Set();for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(map[y][x]==='.'||map[y][x]==='o')pellets.add(x+','+y);player={x:10.5,y:17.5,dx:-1,dy:0,nx:-1,ny:0,mouth:0};ghosts=[{x:9.5,y:9.5,c:0,dx:-1,dy:0},{x:10.5,y:9.5,c:1,dx:1,dy:0},{x:11.5,y:9.5,c:2,dx:-1,dy:0},{x:10.5,y:10.5,c:3,dx:1,dy:0}];score=0;lives=3;power=0;won=false;updateUI();}
function updateUI(){document.getElementById('score').textContent=String(score).padStart(5,'0');document.getElementById('lives').innerHTML='<i class="life"></i>'.repeat(lives)}
function tile(x,y){let ix=Math.floor(x),iy=Math.floor(y);if(iy<0||iy>=H)return '#';if(ix<0||ix>=W)return '.';return map[iy][ix]||'#'}
function passable(x,y){let c=tile(x,y);return c!== '#'&&c!=='='}
function near(v){return Math.abs(v-Math.round(v))<.18}
function keyDir(e){const k=e.key.toLower();let d={arrowleft:['x',-1,0],a:['x',-1,0],arrowright:['x',1,0],d:['x',1,0],arrowup:['y',0,-1],w:['y',0,-1],arrowdown:['y',0,1],s:['y',0,1]}[k];if(d)e.preventDefault(),player.nx=d[1],player.ny=d[2];}
addEventListener('keydown',keyDir);
let touchStart=null;canvas.addEventListener('touchstart',e=>touchStart=[e.touches[0].clientX,e.touches[0].clientY]);canvas.addEventListener('touchmove',e=>{if(!touchStart)return;let t=e.touches[0],dx=t.clientX-touchStart[0],dy=t.clientY-touchStart[1];if(Math.max(Math.abs(dx),Math.abs(dy))>18){player.nx=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0;player.ny=Math.abs(dy)>=Math.abs(dx)?Math.sign(dy):0;touchStart=[t.clientX,t.clientY]}});
function resetPositions(){player.x=10.5;player.y=17.5;player.dx=-1;player.dy=0;player.nx=-1;player.ny=0;ghosts.forEach((g,i)=>{g.x=[9.5,10.5,11.5,10.5][i];g.y=[9.5,9.5,9.5,10.5][i];g.dx=i%2?-1:1;g.dy=0})}
function endGame(title){running=false;document.getElementById('panelTitle').textContent=title;document.getElementById('startBtn').textContent='PLAY AGAIN';document.getElementById('overlay').classList.add('show')}
function start(){if(won||lives===0){setup()}else{resetPositions()}running=true;document.getElementById('overlay').classList.remove('show');last=performance.now();requestAnimationFrame(loop)}
document.getElementById('startBtn').onclick=start;
function moveEntity(o,speed,dt,playerControlled){o.x+=o.dx*speed*dt;o.y+=o.dy*speed*dt;if(o.x<-0.5)o.x=W-.5;if(o.x>W-.5)o.x=-.5;if(near(o.x)&&near(o.y)){let x=Math.round(o.x),y=Math.round(o.y);o.x=x;o.y=y;if(playerControlled){if(passable(x+o.nx,y+o.ny)){o.dx=o.nx;o.dy=o.ny}if(!passable(x+o.dx,y+o.dy)){o.dx=0;o.dy=0}}else{let opts=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>passable(x+d[0],y+d[1])&&!((d[0]===-o.dx&&d[1]===-o.dy)&&(x+d[0]>=0)));if(opts.length){let target=power?[player.x,player.y]:[10,10];opts.sort((a,b)=>{let da=(x+a[0]-target[0])**2+(y+a[1]-target[1])**2,db=(x+b[0]-target[1])**2+(y+b[1]-target[1])**2;return power?db-da:da-db});o.dx=opts[0][0];o.dy=opts[0][1]}}}}
function loop(now){if(!running)return;let dt=Math.min((now-last)/1000,.035);last=now;if(power>0)power-=dt;moveEntity(player,5.2,dt,true);let px=Math.round(player.x),py=Math.round(player.y),key=px+','+py;if(pellets.has(key)){if(map[py]&&map[py][px]==='o')power=8,score+=50;else score+=10;pellets.delete(key);updateUI();if(pellets.size===0){won=true;endGame('YOU WIN!')}}ghosts.forEach(g=>{moveEntity(g,power?2.4:3.2,dt,false);if(Math.hypot(g.x-player.x,g.y-player.y)<.55){if(power){score+=200;g.x=10.5;g.y=9.5;updateUI()}else{lives--;updateUI();if(lives<=0)endGame('GAME OVER');else resetPositions()}}});draw(now/1000);if(running)requestAnimationFrame(loop)}
function draw(t){ctx.fillStyle='#050507';ctx.fillRect(0,0,canvas.width,canvas.height);drawMaze();pellets.forEach(k=>{let [x,y]=k.split(',').map(Number),c=map[y][x]==='o';ctx.beginPath();ctx.fillStyle=c?'#fff4a8':'#ffd9a3';ctx.arc(x*T+T/2,y*T+T/2,c?7:3,0,Math.PI*2);ctx.fill()});ctx.save();ctx.translate(player.x*T,player.y*T);ctx.fillStyle='#ffe500';ctx.beginPath();let angle=Math.max(.08,.25+.18*Math.sin(t*12));ctx.moveTo(0,0);ctx.arc(0,0,13,angle*Math.PI,(2-angle)*Math.PI);ctx.closePath();ctx.fill();ctx.restore();ghosts.forEach(g=>{ctx.save();ctx.translate(g.x*T,g.y*T);ctx.fillStyle=power?(t*4%2>.5?'#1d35d1':'#eef'):colors[g.c];ctx.beginPath();ctx.arc(0,-2,13,Math.PI,0);ctx.lineTo(13,13);ctx.lineTo(8,9);ctx.lineTo(4,13);ctx.lineTo(0,9);ctx.lineTo(-4,13);ctx.lineTo(-8,9);ctx.lineTo(-13,13);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-5,-3,4,0,7);ctx.arc(5,-3,4,0,7);ctx.fill();ctx.fillStyle='#2050aa';ctx.beginPath();ctx.arc(-5+g.dx*1.5,-3+g.dy*1.5,2,0,7);ctx.arc(5+g.dx*1.5,-3+g.dy*1.5,2,0,7);ctx.fill();ctx.restore()})}
function drawMaze(){ctx.lineWidth=3;ctx.strokeStyle='#2458df';ctx.shadowColor='#1743bd';ctx.shadowBlur=4;for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(map[y][x]==='#'){ctx.fillStyle='#09091a';ctx.fillRect(x*T,y*T,T,T);ctx.strokeRect(x*T+2,y*T+2,T-4,T-4)}}ctx.shadowBlur=0}
setup();draw(0);
