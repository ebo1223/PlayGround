import * as THREE from 'three';

const el = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b12);
scene.fog = new THREE.FogExp2(0x080b12,.018);
const camera = new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,300);
camera.position.set(0,5.8,15); camera.lookAt(0,1.7,0);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.shadowMap.enabled=true;
el('game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0x91baff,0x151927,2));
const key=new THREE.DirectionalLight(0xbaffff,3.2);key.position.set(-7,12,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
const rim=new THREE.PointLight(0xff365a,18,25);rim.position.set(7,5,-5);scene.add(rim);

// Arena
const floor=new THREE.Mesh(new THREE.CircleGeometry(9,64),new THREE.MeshStandardMaterial({color:0x252d3a,roughness:.55,metalness:.2}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(8.55,8.65,64),new THREE.MeshBasicMaterial({color:0x65dff4,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.015;scene.add(ring);
for(let i=0;i<32;i++){const a=i/32*Math.PI*2;const t=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.25,6),new THREE.MeshStandardMaterial({color:i%4===0?0x66ddeb:0x647080}));t.position.set(Math.cos(a)*8.9,.62,Math.sin(a)*8.9);scene.add(t)}
for(let i=-3;i<=3;i++){const l=new THREE.Mesh(new THREE.BoxGeometry(.025,.025,17),new THREE.MeshBasicMaterial({color:0x3d4d60}));l.position.set(i*.5,.012,0);l.rotation.y=i*.03;scene.add(l)}
// crowd backdrop
const crowd=new THREE.Group();scene.add(crowd);
for(let i=0;i<150;i++){const a=(i/150)*Math.PI*2,r=11+Math.random()*4;const h=.35+Math.random()*.8;const c=new THREE.Mesh(new THREE.BoxGeometry(.25,h,.25),new THREE.MeshStandardMaterial({color:Math.random()>.72?0x50a4b7:0x151a25,emissive:Math.random()>.9?0x223344:0}));c.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);crowd.add(c)}

function makeFighter(red=false){
 const g=new THREE.Group();
 const skin=new THREE.MeshStandardMaterial({color:red?0xb66e61:0xd09a72,roughness:.7});
 const shorts=new THREE.MeshStandardMaterial({color:red?0x7a1830:0x155c75,roughness:.5,metalness:.15});
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.55,.9,5,10),skin);torso.position.y=2.15;torso.scale.set(1.05,.85,.65);torso.castShadow=true;g.add(torso);
 const shortsMesh=new THREE.Mesh(new THREE.BoxGeometry(.95,.75,.72),shorts);shortsMesh.position.y=.95;shortsMesh.castShadow=true;g.add(shortsMesh);
 const head=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.25,5,10),skin);head.position.y=3.25;head.castShadow=true;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.43,12,8,0,Math.PI*2,0,.72),new THREE.MeshStandardMaterial({color:red?0x160e12:0x241810}));hair.position.y=3.43;g.add(hair);
 const limbs=[];for(const sx of [-1,1]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.72,5,8),skin);arm.position.set(sx*.78,2.12,0);arm.rotation.z=sx*-0.18;arm.castShadow=true;g.add(arm);limbs.push(arm);const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.95,5,8),skin);leg.position.set(sx*.29,.25,0);leg.castShadow=true;g.add(leg)}
 g.userData.limbs=limbs;g.rotation.y=red?-Math.PI/2:Math.PI/2;return g;
}
const player=makeFighter(false),enemy=makeFighter(true);player.position.set(-2.7,.2,0);enemy.position.set(2.7,.2,0);scene.add(player,enemy);

let pHp=100,eHp=100,active=false,ended=false,timer=60,timerAcc=0,round=1,stage=0,attackCd=0;
const keys={}, rivals=['TITAN','VIPER','IRON KONG'];
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.repeat)return;if(e.key.toLowerCase()==='j')attack(false);if(e.key.toLowerCase()==='k')attack(true)});addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

function updateBracket(){el('pairs').innerHTML=rivals.map((n,i)=>`<div class="pair ${i<stage?'done':''} ${i===stage?'live':''}"><b>${i===stage?'NOW':i<stage?'WON':'VS'}</b><span>${n}</span></div>`).join('')}
function setupFight(){active=false;ended=false;pHp=eHp=100;timer=60;timerAcc=0;attackCd=0;el('eName').textContent=rivals[stage];el('roundLabel').textContent=['QUARTER-FINAL','SEMI-FINAL','CHAMPIONSHIP'][stage];el('difficulty').textContent=['HARD','EXTREME','LEGEND'][stage];updateBracket();updateBars();player.position.set(-2.7,.2,0);enemy.position.set(2.7,.2,0);showToast('ROUND '+round,'FIGHT');setTimeout(()=>{active=true},1200)}
function updateBars(){el('pBar').style.width=pHp+'%';el('eBar').style.width=eHp+'%'}
function showToast(a,b){const t=el('toast');t.queryContent=1;t.querySelector('b').textContent=a;t.querySelector('span').textContent=b;t.classList.remove('show');void t.offsetWidth;t.classList.add('show')}

function attack(heavy){if(!active||attackCd>0)return;attackCd=heavy?38:20;const dmg=heavy?16:9;const dist=Math.abs(player.position.x-enemy.position.x);if(dist<3.7){eHp=Math.max(0,eHp-dmg);updateBars();enemy.position.x+=.35;setTimeout(()=>enemy.position.x-=.35,120);if(eHp<=0)endFight(true)} }
function aiAttack(){if(!active||ended)return;const dist=Math.abs(player.position.x-enemy.position.x);if(dist<3.6&&!keys[' ']){const dmg=stage===2?11:stage===1?9:7;pHp=Math.max(0,pHp-dmg);updateBars();player.position.x-=.28;setTimeout(()=>player.position.x+=.28,100);if(pHp<=0)endFight(false)}}
let aiClock=0;
function endFight(won){if(ended)return;ended=true;active=false;if(won){stage++;if(stage>=3){el('panelSmall').textContent='TOURNAMENT COMPLETE';el('panelTitle').innerHTML='YOU ARE THE<br/><i>CHAMPION</i>';el('panelText').textContent='Three rivals. Three victories.';el('mainBtn').textContent='FIGHT AGAIN';el('overlay').classList.remove('hidden')}else{showToast('VICTORY','NEXT');setTimeout(()=>{round=1;setupFight()},2200)}}else{el('panelSmall').textContent='TOURNAMENT OVER';el('panelTitle').innerHTML='BACK FOR<br/><i>REDemption</i>'.replace('REDemption','REVENGE');el('panelText').textContent='Your title run ended here.';el('mainBtn').textContent='TRY AGAIN';el('overlay').classList.remove('hidden')}}

el('mainBtn').onclick=()=>{if(stage>=3||(!active&&ended)){stage=0;round=1}el('overlay').classList.add('hidden');setupFight()};
el('sound').onclick=()=>el('sound').style.opacity=el('sound').style.opacity==='0.4'?'1':'0.4';
updateBracket();

const clock=new THREE.Clock(), aiVec=new THREE.Vector3();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);const t=clock.elapsedTime;
 if(active&&!ended){
  const speed=4*dt;if(keys.w)player.position.z=Math.max(-3.8,player.position.z-speed);if(keys.s)player.position.z=Math.min(3.8,player.position.z+speed);if(keys.a)player.position.x=Math.max(-7.2,player.position.x-speed);if(keys.d)player.position.x=Math.min(7.2,player.position.x+speed);
  aiVec.set(player.position.x-enemy.position.x,0,player.position.z-enemy.position.z);const dist=aiVec.length();if(dist>2.7){aiVec.normalize();enemy.position.x+=aiVec.x*dt*(1.4+stage*.25);enemy.position.z+=aiVec.z*dt*(1.4+stage*.25)}
  aiClock+=dt;if(aiClock>Math.max(.7,1.7-stage*.25)){aiClock=0;aiAttack()}
  timerAcc+=dt;if(timerAcc>=1){timerAcc=0;timer--;el('timer').textContent=timer;if(timer<=0){active=false;endFight(pHp>=eHp)}}
 }
 player.userData.limbs[0].rotation.z= -0.18+(keys.j?0.7:0)+(keys.k?0.95:0);player.userData.limbs[1].rotation.z=.18;
 enemy.userData.limbs[0].rotation.z=-.18+(Math.sin(t*2)>-.2&&active?0.35:0);enemy.userData.limbs[1].rotation.z=.18;
 player.position.y=.2+Math.abs(Math.sin(t*3))*Math.min(.06,attackCd*.002);enemy.position.y=.2+Math.abs(Math.sin(t*3+1))*Math.min(.06,attackCd*.002);if(attackCd>0)attackCd--;
 player.rotation.y=Math.PI/2;enemy.rotation.y=-Math.PI/2;
 camera.lookAt(0,1.8,0);renderer.render(scene,camera)
}
animate();
setupFight();active=false;
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
