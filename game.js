const fighters=[
 {name:'Atlas',color:'#71848a',style:'Balanced',power:12},
 {name:'Viper',color:'#8a594f',style:'Fast',power:10},
 {name:'Titan',color:'#74715f',style:'Heavy',power:15},
 {name:'Knox',color:'#947b62',style:'Counter',power:11},
 {name:'Reign',color:'#665a78',style:'Technical',power:12},
 {name:'Ghost',color:'#5f7272',style:'Elusive',power:9},
 {name:'Rex',color:'#9a7957',style:'Brawler',power:14},
 {name:'Blaze',color:'#b06a45',style:'Aggressive',power:13}
];
let selected=0, bracket=[], round=0, fightIndex=0, pHP=100,eHP=100, playerWins=0, kos=0, locked=false, timer=30, timerID;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function show(id){ $$('.screen').forEach(x=>x.classList.remove('active')); $(id).classList.add('active') }
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1500)}
function init(){
 $('#fighters').innerHTML=fighters.map((f,i)=>`<button class="fighter-chip ${i===selected?'active':''}" data-i="${i}" style="--chip:${f.color}"><i></i><b>${f.name}</b></button>`).join('');
 $$('.fighter-chip').forEach(b=>b.onclick=()=>{selected=+b.dataset.i;$$('.fighter-chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');updateHero()});
 updateHero();
}
function updateHero(){const f=fighters[selected];$('#selectedName').textContent=f.name;$('#heroSilhouette').style.setProperty('--hero',f.color)}
$('#startBtn').onclick=()=>{startTournament();show('#bracket')};
function startTournament(){round=0;fightIndex=0;playerWins=0;kos=0;bracket=[[...fighters.map((_,i)=>i)]];renderBracket();nextMatch()}
function names(ids){return ids.map(i=>fighters[i].name)}
function roundName(r){return ['QUARTER FINALS','SEMI FINALS','FINAL'][r]||'FINAL'}
function renderBracket(){
 $('#roundTitle').textContent=roundName(round);
 $('#roundDots').innerHTML=['Quarter','Semi','Final'].map((n,i)=>`<div class="round-dot ${i<round?'done':i===round?'current':''}"></div>`).join('');
 const rounds=[bracket[0],bracket[0]?.length?chunk(bracket[0],2).map(p=>p[0]):[],[],[]];
 // Display actual tournament progress: fixed 4-round columns where spaces are seeded matches
 const cols=[];
 cols[0]=chunk(bracket[0],2);
 cols[1]=(bracket[1]||[null,null,null,null]).length?[bracket[1]]:[[]];
 cols[2]=(bracket[2]||[]).length?[bracket[2]]:[[]];
 cols[3]=(bracket[3]||[]).length?[bracket[3]]:[[]];
 $('#bracketGrid').innerHTML=['QUARTER','SEMI','FINAL','CHAMPION'].map((title,c)=>{
   let col=[];
   if(c===0) col=chunk(bracket[0],2).map((m,i)=>({m,active:i===fightIndex&&round===0}));
   if(c===1) col=[0,1].map(i=>({m:bracket[1]?.slice(i*2,i*2+2)||[null,null],active:false}));
   if(c===2) col=[{m:bracket[2]||[null,null],active:false}];
   if(c===3) col=[{m:[bracket[3]?.[0]??null,null],active:false}];
   return `<div class="round-col"><h3>${title}</h3>${col.map(({m,active})=>`<div class="match ${active?'active':''} ${c===2?'final-match':''}">${m.map((id,j)=>`<div class="slot ${id!=null&&bracket[c+1]?.includes(id)?'winner':''}"><i></i>${id!=null?fighters[id].name:'TBD'}${j===0?'': ''}</div>`).join('')}</div>`).join('')}</div>`
 }).join('');
}
function chunk(a,n){let out=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out}
function nextMatch(){
 if(round===0){
   if(fightIndex>=4){advanceRound([advanceWinner(round,fightIndex-1)]);return}
   const pair=chunk(bracket[0],2)[fightIndex]; startVs(pair);
 }else if(round===1){
   if(!bracket[1]||bracket[1].length<4){/* filled when advancing */}
 }
}
let quarterWinners=[], semiWinners=[], userAlive=true;
function advanceRound(){ }
function startVs(pair){
 show('#bracket');renderBracket();
 setTimeout(()=>{
   const hasUser=pair.includes(selected);
   if(!hasUser){
     const winner=Math.random()<.5?pair[0]:pair[1];
     quarterWinners[ fightIndex ]=winner;
     toast(`${fighters[pair[0]].name} defeated ${fighters[pair[1]].name}`);
     fightIndex++; if(fightIndex===4){round=1;bracket[1]=quarterWinners.slice();renderBracket();setTimeout(()=>runSemis(),900)}else setTimeout(()=>nextMatch(),900);
   }else{
     const enemy=pair.find(i=>i!==selected); startFight(selected,enemy);
   }
 },700);
}
function runSemis(){
 if(!semiWinners.length){semiWinners=[]}
 const pair=[quarterWinners[0],quarterWinners[1]];
 if(pair.includes(selected)){startVsSemi(pair)}else{const w=Math.random()<.5?pair[0]:pair[1];semiWinners.push(w);runSemisNext()}
}
function runSemisNext(){
 if(semiWinners.length===1){
   const pair=[quarterWinners[2],quarterWinners[3]]; if(pair.includes(selected))startVsSemi(pair);else{semiWinners.push(Math.random()<.5?pair[0]:pair[1]);runFinal()}
 }else runFinal()
}
function startVsSemi(pair){round=1;fightIndex=0;bracket[1]=pair.concat(semiWinners.filter(x=>pair.indexOf(x)<0));renderBracket();startFight(selected,pair.find(i=>i!==selected),true)}
function runFinal(){round=2;if(semiWinners.includes(selected)){bracket[2]=semiWinners.slice();renderBracket();setTimeout(()=>startFight(selected,semiWinners.find(i=>i!==selected)),700)}else{renderBracket();setTimeout(()=>finish(false),700)}}
function startFight(p,e,semi=false){show('#fight');pHP=eHP=100;locked=false;timer=30;$('#pName').textContent=fighters[p].name;$('#eName').textContent=fighters[e].name;$('#pHealth').style.width='100%';$('#eHealth').style.width='100%';$('#player').style.setProperty('--pColor',fighters[p].color);$('#enemy').style.setProperty('--eColor',fighters[e].color);clearInterval(timerID);timerID=setInterval(()=>{timer--;$('#timer').textContent=timer;if(timer<=0){clearInterval(timerID);resolveFight(pHP>=eHP)}},1000);updateRoundLabel(semi)}
function updateRoundLabel(semi){$('#fightRound').textContent=round===0?'QUARTER FINAL':round===1?'SEMI FINAL':'FINAL'}
function resolveFight(win){clearInterval(timerID);locked=true;if(win){toast('VICTORY');playerWins++;setTimeout(()=>afterUserWin(),900)}else{toast('KNOCKOUT DEFEAT');setTimeout(()=>finish(false),900)}}
function afterUserWin(){quarterWinners=quarterWinners.filter(Boolean);if(round===0){quarterWinners.push(selected);fightIndex++;if(fightIndex===4){round=1;bracket[1]=quarterWinners.slice();renderBracket();show('#bracket');setTimeout(runSemisForReal,900)}else nextMatch()}else if(round===1){round=2;bracket[2]=[selected];renderBracket();show('#bracket');setTimeout(runFinalForReal,900)}else finish(true)}
function runSemisForReal(){const p=quarterWinners.filter(x=>x!==selected).slice(0,1)[0];const pair=[selected,p]; // first semi with user guaranteed? bracket logic
 startFight(selected,p,true)}
function runFinalForReal(){const opponent= fighters.map((_,i)=>i).find(i=>i!==selected && bracket[1].includes(i));startFight(selected,opponent||semiWinners.find(i=>i!==selected)||1)}
$$('.move').forEach(b=>b.onclick=()=>{if(!locked)playMove(b.dataset.move)});
window.addEventListener('keydown',e=>{if(e.key==='1')playMove('jab');if(e.key==='2')playMove('cross');if(e.key==='3')playMove('block')});
function playMove(move){
 locked=true;const pf=fighters[selected],enemyId= fighters.findIndex(f=>f.name===$('#eName').textContent),ef=fighters[enemyId];
 const player=$('#player'),enemy=$('#enemy'),impact=$('#impact');
 if(move==='block'){pHP=Math.min(100,pHP+4);$('#pHealth').style.width=pHP+'%';toast('GUARD');setTimeout(()=>locked=false,600);return}
 let dmg=(move==='jab'?7:13)+Math.floor(pf.power/5)+Math.floor(Math.random()*5);
 player.classList.add('attack');enemy.classList.add('hit');impact.textContent=['NICE!','SOLID!','PERFECT!'][Math.floor(Math.random()*3)];impact.classList.add('show');
 eHP=Math.max(0,eHP-dmg);$('#eHealth').style.width=eHP+'%';setTimeout(()=>{player.classList.remove('attack');enemy.classList.remove('hit');impact.classList.remove('show')},260);
 if(eHP<=0){kos++;resolveFight(true);return}
 setTimeout(()=>{if(!locked)return;let edmg=move==='block'?0:(Math.floor(Math.random()*10)+ef.power/2)|0;if(edmg){enemy.classList.add('attack');player.classList.add('hit');pHP=Math.max(0,pHP-edmg);$('#pHealth').style.width=pHP+'%';setTimeout(()=>{enemy.classList.remove('attack');player.classList.remove('hit')},260)}if(pHP<=0)resolveFight(false);else locked=false},650);
}
function finish(win){clearInterval(timerID);show('#result');$('#resultEyebrow').textContent=win?'KINGS CUP · CHAMPION':'TOURNAMENT OVER';$('#resultTitle').textContent=win?'CHAMPION!':'DEFEATED';$('#resultText').textContent=win?'Undefeated in the ring. Your name is legend.':'The crown slips away. Return stronger.';$('#winsStat').textContent=playerWins;$('#koStat').textContent=kos}
$('#againBtn').onclick=()=>{show('#setup')};$('#soundBtn').onclick=()=>toast($('#soundBtn').textContent==='♪'?'Sound on':'Sound off');
init();