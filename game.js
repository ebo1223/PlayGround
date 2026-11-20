(() => {
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  const W=960,H=576,T=64, CW=15,CH=9;
  const map=[
    '###############',
    '#...#.....#...#',
    '#...#..K..#..##',
    '#.##....##....#',
    '#.#K...E......#',
    '#.#.#####.##.##',
    '#...#...K..E..#',
    '#...P..........#',
    '###############'
  ];
  let started=false,paused=false,won=false,keys=0,health=3,inv=0,dashCd=0,shake=0;
  let player={x:1.5*T,y:7.5*T,r:17,dir:{x:0,y:0}};
  let enemies=[], pickups=[], portal={x:4*T,y:7*T};
  const keysEl=document.getElementById('keys'), heartsEl=document.getElementById('hearts');

  function reset(){
    player={x:1.5*T,y:7.5*T,r:17,dir:{x:0,y:0}}; health=3;keys=0;won=false;paused=false;inv=0;dashCd=0;shake=0;
    enemies=[];pickups=[];
    for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
      if(map[y][x]=='K')pickups.push({x:x*T+32,y:y*T+32,taken:false});
      if(map[y][x]=='E')enemies.push({x:x*T+32,y:y*T+32,r:14,baseX:x*T+32,baseY:y*T+32,phase:Math.random()*6,speed:.018+Math.random()*.009,dir:1});
    }
    updateHud();document.getElementById('pauseBadge').classList.remove('show');
  }
  function updateHud(){
    heartsEl.innerHTML='';for(let i=0;i<3;i++)heartsEl.innerHTML+=`<span class="heart ${i>=health?'empty':''}">♥</span>`;
    keysEl.innerHTML='';for(let i=0;i<3;i++)keysEl.innerHTML+=`<span class="key-icon ${i<keys?'have':''}"></span>`;
    document.getElementById('objective').textContent=keys<3?`Recover the ${3-keys} lost key${3-keys===1?'':'s'}`:'Reach the exit portal';
  }
  function toast(text){const m=document.getElementById('message');m.textContent=text;m.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>m.classList.remove('show'),1500)}

  const keysDown={};addEventListener('keydown',e=>{keysDown[e.key.toLowerCase()]=1;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift'].includes(e.key))e.preventDefault();});
  addEventListener('keyup',e=>keysDown[e.key.toLowerCase()]=0);
  document.querySelectorAll('.dpad button').forEach(b=>{const d=b.dataset.dir;const set=v=>keysDown[d]=v;b.addEventListener('pointerdown',e=>{e.preventDefault();set(1)});b.addEventListener('pointerup',()=>set(0));b.addEventListener('pointerleave',()=>set(0));});

  function tile(x,y){let tx=Math.floor(x/T),ty=Math.floor(y/T);return tx<0||ty<0||tx>=CW||ty>=CH||map[ty][tx]=='#';}
  function moveCircle(o,dx,dy){
    if(!tile(o.x+dx+(dx>0?o.r:-o.r),o.y))o.x+=dx;
    if(!tile(o.x,o.y+dy+(dy>0?o.r:-o.r)))o.y+=dy;
  }
  function loop(){
    if(started&&!paused&&!won)update();draw();requestAnimationFrame(loop);
  }
  function update(){
    inv=Math.max(0,inv-1);dashCd=Math.max(0,dashCd-1);shake*=.88;
    let dx=0,dy=0;if(keysDown.w||keysDown.arrowup||keysDown.up)dy--;if(keysDown.s||keysDown.arrowdown||keysDown.down)dy++;if(keysDown.a||keysDown.arrowleft||keysDown.left)dx--;if(keysDown.d||keysDown.arrowright||keysDown.right)dx++;
    if(dx||dy){let l=Math.hypot(dx,dy);dx/=l;dy/=l;player.dir={x:dx,y:dy}}
    let speed=keysDown.shift&&dashCd===0?5.2:2.35;if(keysDown.shift&&dashCd===0&&(dx||dy)){dashCd=180}
    moveCircle(player,dx*speed,dy*speed);
    for(const p of pickups)if(!p.taken&&Math.hypot(player.x-p.x,player.y-p.y)<27){p.taken=true;keys++;updateHud();toast(keys===3?'All keys recovered — find the portal!':'Key recovered');shake=4}
    for(const e of enemies){
      e.phase+=e.speed;let chase=Math.hypot(player.x-e.x,player.y-e.y)<190;if(chase){let a=Math.atan2(player.y-e.y,player.x-e.x);moveCircle(e,Math.cos(a)*1.25,Math.sin(a)*1.25)}else{moveCircle(e,Math.cos(e.phase)*.65,Math.sin(e.phase*.7)*.65)}
      if(Math.hypot(player.x-e.x,player.y-e.y)<31&&inv===0){health--;inv=130;shake=10;toast('You were struck!');updateHud();if(health<=0){toast('The dungeon claimed you');setTimeout(()=>{reset();document.getElementById('startScreen').classList.add('visible');started=false},700)}}
    }
    if(keys===3&&Math.hypot(player.x-portal.x-player.r*.3,player.y-portal.y-player.r*.3)<38){won=true;toast('YOU ESCAPED');setTimeout(()=>showWin(),500)}
  }
  function showWin(){ctx.save();ctx.fillStyle='#17151bcc';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#e5b74d';ctx.font='bold 18px Georgia';ctx.fillText('THE LOWER KEEP',W/2,230);ctx.fillStyle='#eee7d5';ctx.font='bold 54px Georgia';ctx.fillText('YOU ESCAPED',W/2,290);ctx.fillStyle='#aaa3a9';ctx.font='14px Trebuchet MS';ctx.fillText('The portal seals behind you.',W/2,330);ctx.restore();}

  function draw(){ctx.save();ctx.clearRect(0,0,W,H);ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
    for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
      let px=x*T,py=y*T;if(map[y][x]=='#')drawWall(px,py,x,y);else drawFloor(px,py,x,y);
    }
    drawPortal();for(const p of pickups)if(!p.taken)drawKey(p.x,p.y);
    for(const e of enemies)drawEnemy(e);drawPlayer();ctx.restore();
  }
  function drawFloor(x,y,i,j){ctx.fillStyle=(i+j)%2?'#38343b':'#35313a';ctx.fillRect(x,y,T,T);ctx.strokeStyle='#403b43';ctx.strokeRect(x+.5,y+.5,T-1,T-1);ctx.fillStyle='#29272e';if((i*7+j*3)%5===0)ctx.fillRect(x+12,y+14,3,3)}
  function drawWall(x,y,i,j){ctx.fillStyle='#242129';ctx.fillRect(x,y,T,T);ctx.fillStyle=(i+j)%2?'#45404a':'#413d46';ctx.fillRect(x+3,y+3,T-6,19);ctx.fillStyle='#19181f';ctx.fillRect(x,y+46,T,18);ctx.strokeStyle='#514c55';ctx.strokeRect(x+3,y+3,T-6,61)}
  function drawKey(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(performance.now()/700%6);ctx.fillStyle='#dcb24f';ctx.strokeStyle='#8d6d2d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-7,0,7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#38343b';ctx.beginPath();ctx.arc(-7,0,3,0,Math.PI*2);ctx.fill();ctx.fillRect(0,-3,15,6);ctx.fillRect(9,0,4,8);ctx.restore();}
  function drawPortal(){ctx.save();ctx.translate(portal.x,portal.y);let active=keys===3;ctx.shadowBlur=active?24:8;ctx.shadowColor=active?'#e9c75f':'#504a54';ctx.fillStyle=active?'#dac160':'#302d35';ctx.beginPath();ctx.ellipse(0,0,27,39,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17151c';ctx.beginPath();ctx.ellipse(0,0,16,29,0,0,Math.PI*2);ctx.fill();if(active){ctx.strokeStyle='#f5df8b';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,20+i*3,32+i*3,(performance.now()/1000+i)%6,0,Math.PI*2);ctx.stroke()}}ctx.restore();}
  function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle='#651f24';ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#9c3631';ctx.beginPath();ctx.arc(-5,-6,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d6a844';ctx.fillRect(-7,-2,4,4);ctx.fillRect(4,-2,4,4);ctx.fillStyle='#c6b9a0';ctx.beginPath();ctx.moveTo(-12,-10);ctx.lineTo(-16,-22);ctx.lineTo(-5,-15);ctx.moveTo(12,-10);ctx.lineTo(16,-22);ctx.lineTo(5,-15);ctx.fill();ctx.restore();}
  function drawPlayer(){ctx.save();ctx.translate(player.x,player.y);if(inv>0&&Math.floor(inv/8)%2)ctx.globalAlpha=.35;ctx.fillStyle='#17151c';ctx.beginPath();ctx.ellipse(0,14,16,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#b6aa92';ctx.beginPath();ctx.arc(0,-5,13,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d8cbb1';ctx.beginPath();ctx.arc(0,-9,10,Math.PI,Math.PI*2);ctx.fill();ctx.fillStyle='#6d2e2d';ctx.fillRect(-15,-2,30,19);ctx.fillStyle='#9a8b75';ctx.fillRect(-11,17,7,12);ctx.fillRect(5,17,7,12);ctx.fillStyle='#17151c';ctx.fillRect(-5,-7,3,3);ctx.fillRect(4,-7,3,3);ctx.restore();}

  document.getElementById('startBtn').addEventListener('click',()=>{reset();started=true;document.getElementById('startScreen').classList.remove('visible');toast('Find 3 keys and escape')});
  document.getElementById('restartBtn').addEventListener('click',()=>{reset();started=true;document.getElementById('startScreen').classList.remove('visible')});
  document.getElementById('pauseBtn').addEventListener('click',()=>{if(!started)return;paused=!paused;document.getElementById('pauseBadge').classList.toggle('show',paused)});
  reset();loop();
})();
