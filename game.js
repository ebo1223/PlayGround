(() => {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  const W=720,H=780,C=60, COLS=12;
  const overlay=document.getElementById('overlay'), startBtn=document.getElementById('startBtn');
  const scoreEl=document.getElementById('score'), bestEl=document.getElementById('best'), levelEl=document.getElementById('level'), livesEl=document.getElementById('lives');
  let best=+(localStorage.froggerBest||0), score=0, lives=3, level=1, playing=false, won=false, frog;
  let particles=[], homes=[false,false,false,false,false];
  let last=0, shake=0, message='', messageTime=0;

  const lanes=[
    {type:'water', y:120, speed:70, dir:1, kind:'log', gap:1},
    {type:'water', y:180, speed:-95, dir:-1, kind:'turtle', gap:1},
    {type:'water', y:240, speed:55, dir:1, kind:'log', gap:1},
    {type:'water', y:300, speed:-120, dir:-1, kind:'log', gap:1},
    {type:'safe', y:360},
    {type:'road', y:420, speed:-150, dir:-1, kind:'car', gap:1},
    {type:'road', y:480, speed:105, dir:1, kind:'truck', gap:1},
    {type:'road', y:540, speed:-170, dir:-1, kind:'car', gap:1},
    {type:'road', y:600, speed:125, dir:1, kind:'car', gap:1},
    {type:'road', y:660, speed:-145, dir:-1, kind:'truck', gap:1},
  ];

  function resetFrog(){ frog={x:330,y:720,row:12,col:5,px:330,py:720,dir:'up',jump:0}; }
  function updateHUD(){ scoreEl.textContent=String(score).padStart(5,'0');bestEl.textContent=String(best).padStart(5,'0');levelEl.textContent=level;livesEl.textContent='♥'.repeat(lives)+'♡'.repeat(3-lives); }
  function startGame(){ score=0;lives=3;level=1;homes=[false,false,false,false,false];resetFrog();playing=true;won=false;overlay.classList.add('hidden');updateHUD(); }

  function roundRect(x,y,w,h,r){ ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill(); }
  function water(){ const g=ctx.createLinearGradient(0,120,0,360);g.addColorStop(0,'#3b91aa');g.addColorStop(1,'#246d86');ctx.fillStyle=g;ctx.fillRect(0,60,720,300);ctx.fillStyle='#69b9c5';for(let y=125;y<360;y+=60){ctx.globalAlpha=.22;ctx.fillRect(0,y-2,720,3);ctx.globalAlpha=1;} }
  function drawWorld(){
    ctx.fillStyle='#174436';ctx.fillRect(0,0,720,780);
    ctx.fillStyle='#91b95c';ctx.fillRect(0,0,720,60); ctx.fillRect(0,360,720,60); ctx.fillRect(0,720,720,60);
    for(let x=0;x<720;x+=12){ctx.fillStyle=(x/12)%2?'#86a94f':'#9ac267';ctx.fillRect(x,0,12,60);ctx.fillRect(x,360,12,60);ctx.fillRect(x,720,12,60)}
    water();
    // goal pads
    for(let i=0;i<5;i++){let x=42+i*144;ctx.fillStyle='#16392f';roundRect(x,0,72,52,12);ctx.fillStyle=homes[i]?'#83cc68':'#255e4a';roundRect(x+8,10,56,34,8);if(homes[i]) drawFrog(x+36,27,0.72,'up');}
    ctx.fillStyle='#17382f';ctx.fillRect(0,350,720,20);ctx.fillRect(0,710,720,10);
    // road base
    ctx.fillStyle='#303937';ctx.fillRect(0,420,720,300);
    ctx.fillStyle='#3b4642';ctx.fillRect(0,420,720,300);
    ctx.fillStyle='#d8c97b';ctx.globalAlpha=.7;
    for(let y=480;y<720;y+=60){ctx.fillRect(0,y-3,720,4)}
    ctx.globalAlpha=1;
  }

  function objPositions(l,phase){
    const arr=[];const sp=l.speed*(1+(level-1)*.11);let w=l.kind==='truck'?118:78;let stride=l.kind==='truck'?230:190;
    const offset=( (phase*sp/1000)%(720+stride) );
    for(let x=-stride;x<720+stride;x+=stride){let px=x+offset;if(sp<0)px=720-(x+offset);arr.push({x:((px+720+stride)%(720+stride))-stride,w});}
    return arr;
  }

  function drawWorldObjects(t){
    for(const l of lanes){
      if(l.type==='water'){
        const arr=objPositions(l,t);
        for(const o of arr){
          if(l.kind==='log'){
            ctx.fillStyle='#7a5035';roundRect(o.x,l.y-18,150,36,10);ctx.fillStyle='#9c7047';ctx.fillRect(o.x+12,l.y-14,126,8);ctx.fillStyle='#5a3a29';ctx.fillRect(o.x+34,l.y-18,8,36);ctx.fillRect(o.x+105,l.y-18,8,36);
          } else {
            ctx.fillStyle='#3b553d';roundRect(o.x,l.y-18,150,36,16);
            ctx.fillStyle='#83b05a';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(o.x+30+i*48,l.y,20,0,Math.PI*2);ctx.fill();ctx.fillStyle='#526b43'}
          }
        }
      } else if(l.type==='road'){
        const arr=objPositions(l,t);
        for(const o of arr) drawVehicle(o.x,l.y,o.w,l.kind,l.dir);
      }
    }
  }
  function drawVehicle(x,y,w,kind,dir){
    const color=kind==='truck'?'#e49a44':(Math.round(x/40)%3===0?'#df6552':Math.round(x/40)%3===1?'#5aa0a5':'#d6bc51');
    ctx.fillStyle='#202825';ctx.fillRect(x+12,y-24,18,48);ctx.fillRect(x+w-30,y-24,18,48);
    ctx.fillStyle=color;roundRect(x,y-20,w,40,9);ctx.fillStyle='#b8ddd4';roundRect(x+(dir>0?w*.12:w*.62),y-15,w*.28,26,5);
    ctx.fillStyle='#fff5ca';ctx.fillRect(dir>0?x+w-6:x,y-14,6,10);
  }

  function drawFrog(x,y,scale=1,dir='up'){ctx.save();ctx.translate(x,y);ctx.rotate(dir==='left'?-Math.PI/2:dir==='right'?Math.PI/2:dir==='down'?Math.PI:0);ctx.scale(scale,scale);
    ctx.fillStyle='#4e9a47';ctx.beginPath();ctx.ellipse(-19,2,10,15,0,0,7);ctx.ellipse(19,2,10,15,0,0,7);ctx.fill();
    ctx.fillStyle='#73c85d';ctx.beginPath();ctx.ellipse(0,0,23,20,0,0,7);ctx.fill();ctx.fillStyle='#99df73';ctx.beginPath();ctx.ellipse(0,-5,16,12,0,0,7);ctx.fill();
    ctx.fillStyle='#e9f4bf';ctx.beginPath();ctx.arc(-11,-12,8,0,7);ctx.arc(11,-12,8,0,7);ctx.fill();ctx.fillStyle='#26362e';ctx.beginPath();ctx.arc(-11,-12,3,0,7);ctx.arc(11,-12,3,0,7);ctx.fill();ctx.restore(); }

  function move(dx,dy){if(!playing||won)return;frog.dir=dx<0?'left':dx>0?'right':dy<0?'up':'down';let nx=frog.x+dx*60,ny=frog.y+dy*60;if(nx<15||nx>705||ny<0||ny>720)return;frog.x=nx;frog.y=ny;frog.jump=1;if(dy<0){score+=10;frog.row=Math.max(0,frog.row-1)}updateHUD(); }

  function death(){if(!playing||frog.dead)return;frog.dead=true;lives--;shake=10;burst(frog.x,frog.y);updateHUD();setTimeout(()=>{if(lives<=0){endGame('GAME OVER','Out of lives!');}else{resetFrog();} },650); }
  function burst(x,y){for(let i=0;i<18;i++)particles.push({x,y,vx:(Math.random()-0.5)*180,vy:(Math.random()-0.5)*180,a:1});}
  function endGame(title,text){playing=false;won=true;document.getElementById('overlayTitle').innerHTML=title.includes('OVER')?'FROGGER<br><em>ADVENTURE</em>':title;document.getElementById('overlayText').textContent=text+' Score: '+score;startBtn.innerHTML='PLAY AGAIN <span>→</span>';overlay.classList.remove('hidden');}

  function check(){if(!frog||frog.dead)return;
    const cy=frog.y;
    if(cy<360&&cy>=60){
      let on=false,carry=0;
      for(const l of lanes){if(l.type==='water'&&Math.abs(l.y-cy)<30){const arr=objPositions(l,performance.now());for(const o of arr){if(frog.x>=o.x-20&&frog.x<=o.x+(l.kind==='log'?150:150)+20){on=true;if(l.dir)carry=l.speed*(1+(level-1)*.11)*l.dir/1000}}}}
      if(!on)death();else{frog.x+=carry*16.67;if(frog.x<15||frog.x>705)death()}
    }
    if(cy<60){let hit=-1;for(let i=0;i<5;i++){let x=42+i*144;if(Math.abs(frog.x-(x+36))<38){hit=i}}
      if(hit>=0&&!homes[hit]){homes[hit]=true;score+=200;if(frog.x){frog.x=frog.x};burst(frog.x,28);resetFrog();updateHUD();if(homes.every(Boolean)){level++;homes=[false,false,false,false,false];score+=500;message='LEVEL '+level;messageTime=1800;updateHUD();}}
      else death();
    }
    if(cy>=420&&cy<720){for(const l of lanes){if(l.type==='road'&&Math.abs(l.y-cy)<25){const arr=objPositions(l,performance.now());for(const o of arr){let x=o.x,w=o.w;if(frog.x+18>x&&frog.x-18<x+w)death();}}}}
  }

  function loop(t){let dt=Math.min(32,t-last);last=t;drawWorld();drawWorldObjects(t);check();
    for(const p of particles){p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.a-=dt/900}particles=particles.filter(p=>p.a>0);for(const p of particles){ctx.globalAlpha=p.a;ctx.fillStyle='#d8ed78';ctx.beginPath();ctx.arc(p.x,p.y,5,0,7);ctx.fill()}ctx.globalAlpha=1;
    if(frog){drawFrog(frog.x,frog.jump>0?frog.y-Math.sin(frog.jump*Math.PI)*8:frog.y,1,frog.dir);frog.jump=Math.max(0,frog.jump-dt/180)}
    if(messageTime>0){messageTime-=dt;ctx.textAlign='center';ctx.font='900 42px Nunito';ctx.fillStyle='#f4ca63';ctx.strokeStyle='#17382f';ctx.lineWidth=8;ctx.strokeText(message,360,390);ctx.fillText(message,360,390)}
    requestAnimationFrame(loop);
  }

  document.addEventListener('keydown',e=>{const k=e.key.toLower; if(['arrowup','w','arrowdown','s','arrowleft','a','arrowright','d',' '].includes(k))e.preventDefault();if(k==='arrowup'||k==='w')move(0,-1);if(k==='arrowdown'||k==='s')move(0,1);if(k==='arrowleft'||k==='a')move(-1,0);if(k==='arrowright'||k==='d')move(1,0);if(k===' '&&!playing)startGame();});
  document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();const d=b.dataset.dir;move(d==='left'?-1:d==='right'?1:0,d==='up'?-1:d==='down'?1:0)}));
  startBtn.addEventListener('click',startGame);
  resetFrog();updateHUD();requestAnimationFrame(loop);
})();
