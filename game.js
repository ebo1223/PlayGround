const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,DPR;
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();

const keys={};addEventListener('keydown',e=>{keys[e.key.toLower]=true;if(e.code==='Space')keys.boost=true});
addEventListener('keyup',e=>{keys[e.key.toLower]=false;if(e.code==='Space')keys.boost=false});

const ui={speed:document.getElementById('speed'),gear:document.getElementById('gear'),lap:document.getElementById('lap'),pos:document.getElementById('position'),ers:document.getElementById('ersBar'),fuel:document.getElementById('fuelBar'),message:document.getElementById('raceMessage'),overlay:document.getElementById('overlay'),title:document.getElementById('title'),subtitle:document.getElementById('subtitle')};

let state='menu',speed=0,playerX=0,distance=0,lap=1,ers=100,fuel=100,last=performance.now(),countdown=0,finishTime=0,shake=0;
const trackLength=2600;
const rivals=[.18,.31,.44,.57,.70].map((p,i)=>({p,lateral:[-1,-.45,.5,.8,-.72][i],color:['#ff4169','#00a8ff','#ffb400','#ea34ff','#45dfc5'][i],speed:.82+i*.015,offset:i*51}));

function mod(v,m){return ((v%m)+m)%m}
function centerAt(z){return Math.sin(z*.007)*W*.11+Math.sin(z*.0022+1.2)*W*.13}
function roadWidthAt(y){const t=(y-H*.34)/(H*.66);return 110+(t*t)*(W*.50)}

function reset(){speed=0;playerX=0;distance=0;lap=1;ers=100;fuel=100;state='count';countdown=3.8;ui.overlay.classList.add('hidden');ui.message.style.opacity=1;for(let i=0;i<rivals.length;i++){rivals[i].p=.055+i*.018;rivals[i].lateral=[-1,-.45,.5,.8,-.72][i]}}

document.getElementById('startBtn').onclick=reset;
document.getElementById('pause').onclick=()=>{if(state==='race')state='paused';else if(state==='paused')state='race'};
for(const id of ['left','right']){const el=document.getElementById(id);el.onpointerdown=e=>{e.preventDefault();keys[id]=true};el.onpointerup=()=>keys[id]=false;el.onpointercancel=()=>keys[id]=false}

function update(dt){
  if(state==='count'){countdown-=dt;if(countdown>3.0)ui.message.innerHTML='<strong>3</strong>';else if(countdown>2.0)ui.message.innerHTML='<strong>2</strong>';else if(countdown>1.0)ui.message.innerHTML='<strong>1</strong>';else if(countdown>0)ui.message.innerHTML='<strong>GO!</strong>';else{ui.message.style.opacity=0;state='race'}return}
  if(state!=='race')return;
  const throttle=keys.w||keys.arrowup;
  const gas=throttle||keys[' '];
  const boost=keys.boost&&ers>0;
  if(gas) speed+=dt*(boost?78:58);else speed-=dt*24;
  speed=Math.max(0,Math.min(boost?310:270,speed));
  ers=Math.max(0,ers-(boost?22:0)*dt);if(!boost)ers=Math.min(100,ers+9*dt);
  fuel=Math.max(0,fuel-dt*.55);
  const steer=(keys.a||keys.arrowleft||keys.left?-1:0)+(keys.d||keys.arrowright||keys.right?1:0);
  playerX+=steer*dt*(.75+speed/220);playerX*=1-dt*.08;
  playerX=Math.max(-1.22,Math.min(1.22,playerX));
  distance+=dt*(speed/3.6);
  const oldLap=lap;lap=Math.min(3,Math.floor(distance/trackLength)+1);
  if(lap!==oldLap){shake=18;ui.message.innerHTML='<strong>LAP '+lap+'</strong>';ui.message.style.opacity=1;setTimeout(()=>{if(ui.message.innerText.includes('LAP'))ui.message.style.opacity=0},900)}
  for(const r of rivals){r.p=(r.p+dt*(r.speed*(speed/260+.24)/trackLength*.9))%1}
  // collision / rank
  for(const r of rivals){const rd=mod(r.p*trackLength-distance,trackLength);if(rd<18&&rd>-4&&Math.abs(r.lateral-playerX)<.18&&speed>30){speed*=.92;shake=12}}
  if(distance>=trackLength*3){state='finish';finishTime=4;ui.overlay.classList.remove('hidden');ui.title.textContent='PODIUM';ui.subtitle.textContent='Race complete · 3 laps';document.querySelector('.panel button span').textContent='RACE AGAIN'}
}

function drawRoad(){
  const horizon=H*.34;
  ctx.fillStyle='#10151d';ctx.fillRect(0,0,W,horizon);
  // night sky / floodlights
  let sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,'#090d16');sky.addColorStop(1,'#28303a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,horizon);
  ctx.fillStyle='rgba(216,255,0,.09)';for(let i=-1;i<8;i++){const x=(i*W/7-distance*.18)%W;ctx.beginPath();ctx.arc(x,horizon*.66,8,0,7);ctx.fill()}
  const slices=75;
  for(let i=0;i<slices;i++){
    const y1=horizon+(i/slices)*(H-horizon),y2=horizon+((i+1)/slices)*(H-horizon);
    const depth1=i/slices,depth2=(i+1)/slices;
    const z1=distance+(1-depth1)*850,z2=distance+(1-depth2)*850;
    const c1=W/2+centerAt(z1)-playerX*roadWidthAt(y1)*.75,c2=W/2+centerAt(z2)-playerX*roadWidthAt(y2)*.75;
    const r1=roadWidthAt(y1),r2=roadWidthAt(y2);
    ctx.fillStyle=(Math.floor(z1/38)%2)?'#263b28':'#293f2b';ctx.fillRect(0,y1,W,y2-y1+.6);
    ctx.fillStyle=(Math.floor(z1/55)%2)?'#b8babe':'#d1d3d5';ctx.beginPath();ctx.moveTo(c1-r1,y1);ctx.lineTo(c1-r1-r1*.10,y1);ctx.lineTo(c2-r2-r2*.10,y2);ctx.lineTo(c2-r2,y2);ctx.fill();
    ctx.beginPath();ctx.moveTo(c1+r1,y1);ctx.lineTo(c1+r1+r1*.10,y1);ctx.lineTo(c2+r2+r2*.10,y2);ctx.lineTo(c2+r2,y2);ctx.fill();
    ctx.fillStyle=(Math.floor(z1/55)%2)?'#191d22':'#c8d2da';ctx.beginPath();ctx.moveTo(c1-r1,y1);ctx.lineTo(c1-r1-r1*.035,y1);ctx.lineTo(c2-r2-r2*.035,y2);ctx.lineTo(c2-r2,y2);ctx.fill();
    ctx.beginPath();ctx.moveTo(c1+r1,y1);ctx.lineTo(c1+r1+r1*.035,y1);ctx.lineTo(c2+r2+r2*.035,y2);ctx.lineTo(c2+r2,y2);ctx.fill();
    ctx.fillStyle=(Math.floor(z1/42)%2)?'#343c45':'#2c333b';ctx.beginPath();ctx.moveTo(c1-r1,y1);ctx.lineTo(c1+r1,y1);ctx.lineTo(c2+r2,y2);ctx.lineTo(c2-r2,y2);ctx.fill();
  }
}

function drawCar(x,y,scale,color,player=false){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(player?(keys.a||keys.arrowleft||keys.left?-.05:keys.d||keys.arrowright||keys.right?.05:0):0);
  ctx.fillStyle='#111';ctx.fillRect(-31,-7,10,20);ctx.fillRect(21,-7,10,20);ctx.fillRect(-29,31,11,21);ctx.fillRect(18,31,11,21);
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-30,-32);ctx.lineTo(30,-32);ctx.lineTo(22,40);ctx.lineTo(-22,40);ctx.closePath();ctx.fill();ctx.fillStyle='#111820';ctx.beginPath();ctx.moveTo(-16,-15);ctx.lineTo(16,-15);ctx.lineTo(13,12);ctx.lineTo(-13,12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e8f2f7';ctx.fillRect(-20,-36,40,5);ctx.fillStyle='#15191f';ctx.fillRect(-28,-30,56,5);ctx.fillStyle='#d8ff00';ctx.fillRect(-10,38,20,4);ctx.restore()
}

function render(){ctx.save();if(shake>0){ctx.translate((Math.random-.5)*shake,(Math.random-.5)*shake);shake*=.88}drawRoad();
  // rear rivals ordered by visible depth
  const rivalsAhead=rivals.map(r=>({r,delta:mod(r.p*trackLength-distance,trackLength)})).sort((a,b)=>b.delta-a.delta);
  for(const {r,delta} of rivalsAhead){if(delta>10&&delta<700){const t=1-delta/700;const y=H*.34+t*t*.56*H;const road=roadWidthAt(y);const c=W/2+centerAt(distance+delta)-playerX*road*.75+r.lateral*road*.58;const sc=.12+t*.72;drawCar(c,y,sc,r.color)}}
  drawCar(W/2,H*.86,1.18,'#d8ff00',true);ctx.restore();
  ui.speed.textContent=String(Math.round(speed)).padStart(3,'0');ui.gear.textContent=speed<5?'N':Math.min(7,Math.max(1,Math.ceil(speed/43)));ui.lap.textContent=lap+'/3';ui.ers.style.width=ers+'%';ui.fuel.style.width=fuel+'%';
  let ahead=rivals.filter(r=>mod(r.p*trackLength-distance,trackLength)<0).length;ui.pos.textContent=1+ahead;
}

function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;update(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
