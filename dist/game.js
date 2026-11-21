// Frostreach RTS — compact original 3D strategy demo
const c=document.createElement('canvas');document.body.prepend(c);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x93a89b);scene.fog=new THREE.Fog(0x93a89b,35,82);
const renderer=new THREE.WebGLRenderer({canvas:c,antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,200);camera.position.set(4,24,32);camera.lookAt(2,-1,-3);
scene.add(new THREE.HemisphereLight(0xdde9ff,0x4f5d37,2));const sun=new THREE.DirectionalLight(0xfff1ce,2.2);sun.position.set(-20,35,15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;scene.add(sun);
const mats={grass:new THREE.MeshStandardMaterial({color:0x66824a,roughness:1}),snow:new THREE.MeshStandardMaterial({color:0xd8dfd8,roughness:.9}),stone:new THREE.MeshStandardMaterial({color:0x777568}),wood:new THREE.MeshStandardMaterial({color:0x6b4227}),gold:new THREE.MeshStandardMaterial({color:0xe1ae32,metalness:.5,roughness:.35}),red:new THREE.MeshStandardMaterial({color:0x99352d}),blue:new THREE.MeshStandardMaterial({color:0x397eb5}),skin:new THREE.MeshStandardMaterial({color:0xe2c4a0})};
function mesh(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
// terrain
mesh(new THREE.PlaneGeometry(90,90),mats.grass,0,-.05,0).rotation.x=-Math.PI/2;
for(let i=0;i<90;i++){let x=(Math.random()-.5)*82,z=(Math.random()-.5)*82;let g=new THREE.Group();let t=new THREE.Mesh(new THREE.ConeGeometry(.5+Math.random(),2+Math.random()*2,5),new THREE.MeshStandardMaterial({color:0x263f28}));t.position.y=1;t.castShadow=true;g.position.set(x,0,z);g.add(t);scene.add(g)}
// resources
let golds=[],woods=[];
function goldMine(x,z){let g=new THREE.Group();for(let i=0;i<7;i++){let o=mesh(new THREE.DodecahedronGeometry(.7+Math.random()*.35,0),mats.gold,x+(Math.random()-.5)*2,.5,z+(Math.random()-.5)*2);g.add(o)}g.position.set(0,0,0);golds.push({x,z,group:g,amount:600});}
goldMine(-20,-12);goldMine(24,14);
for(let i=0;i<14;i++){let x=-28+(i%7)*8,z=-26+Math.floor(i/7)*44;let g=new THREE.Group();let trunk=mesh(new THREE.CylinderGeometry(.25,.35,3,7),mats.wood,x,1.5,z);let top=mesh(new THREE.ConeGeometry(1.5,3,7),new THREE.MeshStandardMaterial({color:0x315d32}),x,4,z);woods.push({x,z,amount:500});}
// buildings and units
let entities=[],selected=[],particles=[];
function makeBuilding(type,faction,x,z){let g=new THREE.Group();let base=mesh(new THREE.BoxGeometry(type==='hall'?7:5.5,type==='hall'?5:4,5.5),mats[faction],x,2.5,z);base.userData.entity=g;let roof=mesh(new THREE.ConeGeometry(type==='hall'?5.2:4.2,3,4),new THREE.MeshStandardMaterial({color:faction==='red'?0x4d1714:0x263e57}),x,6,z);roof.rotation.y=Math.PI/4;g.add(base,roof);g.x=x;g.z=z;g.type=type;g.faction=faction;g.hp=g.maxHp=type==='hall'?900:500;g.range=8;g.team=faction;g.cool=0;g.base=base;g.roof=roof;entities.push(g);return g}
const hall=makeBuilding('hall','blue',-12,-4), enemy=makeBuilding('hall','red',18,-14);makeBuilding('barracks','blue',-19,-10);makeBuilding('barracks','red',26,-4);
function makeUnit(type,faction,x,z){let g=new THREE.Group();let body=mesh(new THREE.BoxGeometry(.8,1.1,.65),mats[faction],x,1,z);let head=mesh(new THREE.SphereGeometry(.32,10,8),mats.skin,x,1.9,z);let weapon=mesh(new THREE.BoxGeometry(.12,.12,1.2),mats.stone,x+.55,1.15,z+.35);weapon.rotation.x=-.25;g.add(body,head,weapon);g.x=x;g.z=z;g.type=type;g.faction=faction;g.team=faction;g.hp=g.maxHp=type==='hero'?240:100;g.speed=type==='hero'?5:4;g.range=type==='archer'?10:3;g.damage=type==='hero'?28:type==='archer'?16:13;g.cool=0;g.target=null;g.body=body;g.head=head;g.building=false;entities.push(g);return g}
// starting armies
let hero=makeUnit('hero','blue',-8,-1);let units=[];for(let i=0;i<5;i++)units.push(makeUnit(i%2?'footman':'archer','blue',-14+i*1.5,-7));for(let i=0;i<6;i++)makeUnit(i%2?'footman':'archer','red',18+(i%3)*1.8,-9-Math.floor(i/3)*2);
let gold=500,wood=350,pop=0,over=null,buildMode=null;
function setPop(){pop=entities.filter(e=>e.team==='blue'&&!e.building&&e.type).length;document.getElementById('pop').textContent=pop+'/30'}setPop();
function flash(s){let b=document.getElementById('banner');b.textContent=s;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),1800)}flash('Protect the Great Hall');
// UI
let act=document.getElementById('actions'),info=document.getElementById('info'),portrait=document.getElementById('portrait'),portraitName=document.getElementById('portraitName');
function actionButton(name,cost,cb,small=''){let b=document.createElement('button');b.className='action';b.innerHTML=name+(cost?'<small>'+cost+'</small>':'');b.onclick=cb;act.appendChild(b);return b}
function refreshUI(){act.innerHTML='';if(selected.length===1){let e=selected[0];portraitName.textContent=e.type==='hall'?'Great Hall':e.type==='barracks'?'Barracks':e.type.toUpperText?.()||e.type;if(e.building){actionButton('Train Footman','☼ 100',()=>train(e,'footman'));actionButton('Train Archer','☼ 140',()=>train(e,'archer'))}else{actionButton('Hold','',()=>selected.forEach(u=>u.target=null));actionButton('Move','',()=>{buildMode='move'})}}else if(selected.length>1){portraitName.textContent=selected.length+' units selected';actionButton('Hold','',()=>selected.forEach(u=>u.target=null));}else{portraitName.textContent='No unit selected'}let h=entities.find(e=>e.team==='blue'&&e.type==='hall');let o=enemy.hp;document.getElementById('objective').innerHTML=`Enemy Hall: ${Math.max(0,Math.ceil(o/900*100))}%`;
}
function train(b,type){let cost=type==='footman'?100:140;if(gold<cost)return;if(pop>=30)return;gold-=cost;pop++;document.getElementById('gold').textContent=gold;setTimeout(()=>{makeUnit(type,'blue',b.x+(Math.random()-.5)*5,b.z+5);setPop()},900)}
// click / raycast
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null,dragRect=null;
function pointer(e){mouse.x=e.clientX/innerWidth*2-1;mouse.y=-(e.clientY/innerHeight)*2+1;ray.setFromCamera(mouse,camera);}
c.addEventListener('mousedown',e=>{down={x:e.clientX,y:e.clientY};pointer(e)});
c.addEventListener('mouseup',e=>{pointer(e);let hit=ray.intersectObjects(scene.children,true);if(dragRect&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>18){selectBox(dragRect[0],dragRect[1],e.clientX,e.clientY);dragRect=null;return}if(buildMode){let p=groundPoint(hit);if(p)placeBuilding(p.x,p.z);buildMode=null;refreshUI();return}let ent=hit.map(h=>h.object.userData.entity).find(Boolean)||hit.map(h=>h.object).find(o=>entities.includes(o));let target=null;if(ent)target=entities.find(e=>e.body===ent||e.base===ent||e.roof===ent||e.head===ent||e===ent);if(e.button===2||e.shiftKey){if(target&&target.team==='red')selected.forEach(u=>u.target=target);else{let p=groundPoint(hit);if(p)selected.forEach((u,i)=>u.target={x:p.x+(i%4)*1.1,z:p.z+Math.floor(i/4)*1.1,move:true})}}else{if(target&&target.team==='blue'&&!target.building){selected=[target]}else if(target&&target.team==='blue'&&target.building){selected=[target]}else selected=[]}refreshUI()});
c.addEventListener('contextmenu',e=>e.preventEventDefault?.() );
function groundPoint(hit){let h=hit.find(q=>q.object.geometry?.type==='PlaneGeometry');return h?h.point:null}
function selectBox(x1,y1,x2,y2){selected=[];for(let e of entities){if(e.team==='blue'&&!e.building){let v=new THREE.Vector3(e.x,1,e.z).project(camera);let sx=(v.x+1)*innerWidth/2,sy=(-v.y+1)*innerHeight/2;if(sx>=Math.min(x1,x2)&&sx<=Math.max(x1,x2)&&sy>=Math.min(y1,y2)&&sy<=Math.max(y1,y2)&&selected.length<12)selected.push(e)}}refreshUI()}
// keyboard pan
let keys={};addEventListener('keydown',e=>keys[e.key.toLowerCase()]=true);addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
// buildings via UI
function placeBuilding(x,z){if(gold<150||wood<100)return;gold-=150;wood-=100;document.getElementById('gold').textContent=gold;document.getElementById('wood').textContent=wood;makeBuilding('barracks','blue',x,z);refreshUI()}
function addBarracksUI(){let b=actionButton('Build Barracks','☼150 • ♣100',()=>{if(gold>=150&&wood>=100)buildMode='barracks';else flash('Not enough resources')});}
// hall gets build options
const oldRefresh=refreshUI;refreshUI=function(){act.innerHTML='';if(selected.length===1){let e=selected[0];portraitName.textContent=e.type==='hall'?'Great Hall':e.type==='barracks'?'Barracks':e.type;if(e.building){if(e.team==='blue'){if(e.type==='hall')addBarracksUI();actionButton('Train Footman','100 gold',()=>train(e,'footman'));actionButton('Train Archer','140 gold',()=>train(e,'archer'))}}else{actionButton('Hold','',()=>selected.forEach(u=>u.target=null));actionButton('Move','',()=>buildMode='move')}}else if(selected.length>1){portraitName.textContent=selected.length+' units selected';actionButton('Hold','',()=>selected.forEach(u=>u.target=null))}else portraitName.textContent='No unit selected';let percent=enemy?Math.max(0,Math.ceil(enemy.hp/enemy.maxHp*100)):0;document.getElementById('objective').innerHTML=`Enemy Hall: ${percent}%`};
// enemy AI
setInterval(()=>{for(let e of entities.filter(e=>e.team==='red'&&!e.building)){let foe=entities.find(q=>q.team==='blue'&&q.hp>0&&(e.x-q.x)**2+(e.z-q.z)**2<18**2);if(foe)e.target=foe;if(!e.target&&e.type)e.target={x:-12+(Math.random()-.5)*12,z:-4+(Math.random()-.5)*12,move:true}}},1800);
// main loop
let last=performance.now(),ended=false,moveMode=false;
function loop(now){let dt=Math.min(.05,(now-last)/1000);last=now;let pan=dt*10;if(keys.w)camera.position.z-=pan,camera.position.x-=pan*.2;if(keys.s)camera.position.z+=pan,camera.position.x+=pan*.2;if(keys.a)camera.position.x-=pan,camera.position.z-=pan*.2;if(keys.d)camera.position.x+=pan,camera.position.z+=pan*.2;
for(let e of entities){if(!e||e.hp<=0)continue;if(e.target){let tx=e.target.x,tz=e.target.z,dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz);if(e.target.team&&e.target.hp<=0)e.target=null;if(d>e.range){e.x+=dx/d*e.speed*dt;e.z+=dz/d*e.speed*dt;if(e.body){e.body.position.set(e.x,1,e.z);e.head.position.set(e.x,1.9,e.z);e.children.forEach((o,i)=>{if(o.geometry&&o!==e.body&&o!==e.head)o.position.set(e.x+(i===2?.55:0),i===2?1.15:1.9,e.z+(i===2?.35:0))})}}else{e.target=null;if(e.target?.team)e.target=null;e.cool-=dt;if(e.cool<=0){e.cool=1.1;let foes=entities.filter(q=>q.team!==e.team&&q.hp>0&&q!==e&&(q.x-e.x)**2+(q.z-e.z)**2<e.range**2);let foe=e.target&&e.target.team?e.target:foes[0];if(!foe&&e.team==='blue'){foe=enemy;if((enemy.x-e.x)**2+(enemy.z-e.z)**2<e.range**2){} }if(foe){foe.hp-=e.damage;hitEffect(foe);e.cool=1.2}}}}
}
// direct combat targeting/AI handled by proximity
for(let e of entities.filter(e=>!e.building&&e.hp>0)){e.cool-=dt;if(e.target&&e.target.team&&e.target.hp>0){let d=(e.target.x-e.x)**2+(e.target.z-e.z)**2;if(d<=e.range*e.range&&e.cool<=0){e.target.hp-=e.damage;hitEffect(e.target);e.cool=1.2}}else if(!e.target){let foes=entities.filter(q=>q.team!==e.team&&q.hp>0&&(q.x-e.x)**2+(q.z-e.z)**2<(e.team==='red'?22:12)**2);if(foes.length){e.target=foes[0]}}}
// resource movement gather (simple: right click mine)
for(let e of particles){}particles.forEach(p=>{p.life-=dt;if(p.life<=0){scene.remove(p.mesh)}});particles=particles.filter(p=>p.life>0);
for(let e of entities){if(e.hp<=0){scene.remove(e.body||e.base);scene.remove(e.head||e.roof);e.dead=true}}
entities=entities.filter(e=>e.hp>0);
if(!ended){if(enemy.hp<=0){ended=true;flash('VICTORY');setTimeout(()=>{},100)}else if(hall.hp<=0){ended=true;flash('DEFEAT')}}setPop();refreshUI();renderer.render(scene,camera);requestAnimationFrame(loop)}
function hitEffect(e){let s=new THREE.Mesh(new THREE.SphereGeometry(.18,6,6),new THREE.MeshBasicMaterial({color:e.team==='red'?0xffaa55:0xffdddd}));s.position.set(e.x,e.hp>0?2:e.z,e.z);scene.add(s);particles.push({mesh:s,life:.18})}
requestAnimationFrame(loop);refreshUI();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
