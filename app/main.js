import { createUI } from './ui.js';

const hud = createUI();
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080911);
scene.fog = new THREE.Fog(0x080911, 18, 45);

const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 8.2, 15.5);
camera.lookAt(0, 2.2, 0);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xbfd7ff, 0x15101a, 1.8));
const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(-7,12,8); key.castShadow=true;
key.shadow.mapSize.set(2048,2048); key.shadow.camera.left=-12; key.shadow.camera.right=12; key.shadow.camera.top=12; key.shadow.camera.bottom=-12;
scene.add(key);

const ring = new THREE.Group(); scene.add(ring);
const mat = new THREE.MeshStandardMaterial({color:0xd9d2bd, roughness:.8});
const ringFloor = new THREE.Mesh(new THREE.BoxGeometry(11,.55,11),mat); ringFloor.position.y=.7; ringFloor.receiveShadow=true; ringFloor.castShadow=true; ring.add(ringFloor);
const apronMat = new THREE.MeshStandardMaterial({color:0x15171f,roughness:.7});
for(let i=-1;i<=1;i+=2){
  const side=new THREE.Mesh(new THREE.BoxGeometry(11.7,.85,.22),apronMat); side.position.set(0,.15,i*5.65); ring.add(side);
  const side2=new THREE.Mesh(new THREE.BoxGeometry(.22,.85,11.7),apronMat); side2.position.set(i*5.65,.15,0); ring.add(side2);
}
const postMat=new THREE.MeshStandardMaterial({color:0x2a2d35,metalness:.75,roughness:.3});
for(const x of [-5.25,5.25])for(const z of [-5.25,5.25]){
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,4,10),postMat);post.position.set(x,2.65,z);post.castShadow=true;ring.add(post);
}
const ropeMats=[0xff3151,0xf7f8ff,0x4e85ff].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.45}));
for(let y=1.65;y<=3.45;y+=.9){
  const idx=Math.round((y-1.65)/.9);
  for(let z of [-5.25,5.25]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,10.5,8),ropeMats[idx]);r.rotation.z=Math.PI/2;r.position.set(0,y,z);ring.add(r)}
  for(let x of [-5.25,5.25]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,10.5,8),ropeMats[idx]);r.rotation.x=Math.PI/2;r.position.set(x,y,0);ring.add(r)}
}

// arena floor and crowd
const floor=new THREE.Mesh(new THREE.CircleGeometry(24,48),new THREE.MeshStandardMaterial({color:0x10111a,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.position.y=-.15;floor.receiveShadow=true;scene.add(floor);
const crowdColors=[0x5269a3,0x9d3d69,0x50a0a0,0xc6a86b,0x777777];
for(let i=0;i<150;i++){
  const angle=i/150*Math.PI*2, radius=12.5+(i%5)*.35;
  const c=new THREE.Mesh(new THREE.SphereGeometry(.18,7,5),new THREE.MeshStandardMaterial({color:crowdColors[i%crowdColors.length]}));
  c.position.set(Math.cos(angle)*radius,.45+((i*7)%3)*.12,Math.sin(angle)*radius);c.scale.y=.9+(i%4)*.12;scene.add(c);
}

function makeWrestler(primary,accent,skin){
 const g=new THREE.Group();
 const suit=new THREE.MeshStandardMaterial({color:primary,roughness:.5,metalness:.1});
 const accentMat=new THREE.MeshStandardMaterial({color:accent,roughness:.45});
 const skinMat=new THREE.MeshStandardMaterial({color:skin,roughness:.65});
 const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.72,1.15,6,12),suit);torso.position.y=2.35;torso.scale.set(1.08,1,.82);torso.castShadow=true;g.add(torso);
 const belt=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.18,12),accentMat);belt.position.y=1.72;g.add(belt);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.48,20,16),skinMat);head.position.y=3.55;head.castShadow=true;g.add(head);
 const face=new THREE.Mesh(new THREE.BoxGeometry(.58,.035,.025),new THREE.MeshStandardMaterial({color:0x241518}));face.position.set(0,3.56,.47);g.add(face);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.49,12,6,0,Math.PI*2,0,Math.PI*.48),new THREE.MeshStandardMaterial({color:0x171318,roughness:.9}));hair.position.y=3.68;g.add(hair);
 for(const side of [-1,1]){
  const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.22,.95,5,8),skinMat);arm.position.set(side*.91,2.35,0);arm.rotation.z=side*.18;arm.castShadow=true;g.add(arm);
  const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.28,1.25,5,8),suit);leg.position.set(side*.38,.85,0);leg.castShadow=true;g.add(leg);
  const boot=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.38,5,8),accentMat);boot.position.set(side*.38,.2,.12);boot.scale.z=1.25;g.add(boot);
 }
 g.userData.torso=torso; return g;
}
const p1=makeWrestler(0x1d55d8,0xf2d53b,0x8f4d32);p1.position.set(-2.15,1,0.2);p1.rotation.y=.18;scene.add(p1);
const p2=makeWrestler(0xb51d38,0xd9dbe2,0xc18a65);p2.position.set(2.15,1,-.2);p2.rotation.y=-3.0;scene.add(p2);

// dramatic arena back wall
for(let i=0;i<8;i++){
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(5.5,2),new THREE.MeshBasicMaterial({color:i%2?0x11162b:0x0d1020}));panel.position.set((i-3.5)*5.5,5,-12);scene.add(panel);
}

let health1=100,health2=100,round=1,lastHit=0,timer=90,start=performance.now(),paused=false,action=null;
const keys={};
addEventListener('keydown',e=>{keys[e.key.toLower.toLowerCase()]=true;if(e.key===' ')e.preventDefault();if(e.key.toLower==='p')paused=!paused;if(e.key.toLower==='r')reset();});
addEventListener('keyup',e=>keys[e.key.toLower.toLowerCase()]=false);

function reset(){health1=health2=100;round++;timer=90;start=performance.now();p1.position.set(-2.15,1,0.2);p2.position.set(2.15,1,-.2);action=null;hud.update(health1,health2,timer,round);}
function hit(attacker,victim,amount){
 const now=performance.now();if(now-lastHit<430)return;lastHit=now;
 victim===p1?(health1-=amount):(health2-=amount);health1=Math.max(0,health1);health2=Math.max(0,health2);
 const dir=victim.position.clone().sub(attacker.position).normalize();victim.position.add(dir.multiplyScalar(.55));
 victim.rotation.z=(victim===p1?.18:-.18);
 setTimeout(()=>victim&&(victim.rotation.z=0),180);
 action={t:0,type:attacker===p1?'left':'right'};
 hud.hit(victim===p1?'KING':'FURY',amount);hud.update(health1,health2,timer,round);
 if(health1<=0||health2<=0){paused=true;hud.win(health1>health2?'KING':'FURY');}
}

hud.onAction(type=>{
 if(type==='kick') hit(p1,p2,12);if(type==='power') hit(p1,p2,18);
});

function animate(now){
 requestAnimationFrame(animate);if(!paused){
  const t=(now-start)/1000;timer=Math.max(0,90-Math.floor(t));
  const sp=.075;
  if(keys['a'])p1.position.x-=sp;if(keys['d'])p1.position.x+=sp;if(keys['w'])p1.position.z-=sp;if(keys['s'])p1.position.z+=sp;
  if(keys['arrowleft'])p2.position.x-=sp;if(keys['arrowright'])p2.position.x+=sp;if(keys['arrowup'])p2.position.z-=sp;if(keys['arrowdown'])p2.position.z+=sp;
  if(keys['j'])hit(p1,p2,9);if(keys['k'])hit(p1,p2,15);
  if(keys['1'])hit(p2,p1,9);if(keys['2'])hit(p2,p1,15);
  p1.position.x=THREE.MathUtils.clamp(p1.position.x,-4.7,4.7);p1.position.z=THREE.MathUtils.clamp(p1.position.z,-4.7,4.7);
  p2.position.x=THREE.MathUtils.clamp(p2.position.x,-4.7,4.7);p2.position.z=THREE.MathUtils.clamp(p2.position.z,-4.7,4.7);
  p1.lookAt(p2.position.x,p1.position.y,p2.position.z);p2.lookAt(p1.position.x,p2.position.y,p1.position.z);
  p1.position.y=1+Math.sin(now*.004)*.035;p2.position.y=1+Math.sin(now*.004+1)*.035;
  hud.update(health1,health2,timer,round);
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
