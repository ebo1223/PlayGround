const suits=['♠','♥','♦','♣'];
const ranks=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const ranksVal={};ranks.forEach((r,i)=>ranksVal[r]=i+2);
const payouts=[
 ['Royal Flush',800],['Straight Flush',50],['Four of a Kind',25],['Full House',9],['Flush',6],['Straight',4],['Three of a Kind',3],['Two Pair',2],["Jacks or Better",1]
];
let credits=500,bet=1,phase='bet',cards=[],held=[false,false,false,false,false],win=0,sound=true;
const $=s=>document.querySelector(s);
function buildPaytable(){
  const el=$('#paytable');
  payouts.forEach(([name,unit])=>{
    const row=document.createElement('div'); row.className='pay-row'; row.dataset.hand=name;
    const vals=[1,2,3,4,5].map(n=>name==='Royal Flush'?n===5?'4000':unit*n:n===5?unit*n:unit*n);
    row.innerHTML=`<span class="hand-name">${name}</span><div class="pays">${vals.map(v=>`<strong>${v}</strong>`).join('')}</div>`;
    el.appendChild(row);
  });
}
function deck(){const d=[];for(const s of suits)for(const r of ranks)d.push({r,s});for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random*(i+1));[d[i],d[j]]=[d[j],d[i]]}return d}
function evaluate(cs){
  const vs=cs.map(c=>ranksVal[c.r]).sort((a,b)=>a-b), counts={};
  cs.forEach(c=>counts[c.r]=(counts[c.r]||0)+1);
  const suit=cs.every(c=>c.s===cs[0].s), unique=[...new Set(vs)], straight=unique.length===5&&unique[4]-unique[0]==4;
  const wheel=unique.join(',')==='2,3,4,5,14';
  const nums=Object.values(counts).sort((a,b)=>b-a);
  if(suit&&(unique.join(',')==='10,11,12,13,14'))return 'Royal Flush';
  if(suit&&(straight||wheel))return 'Straight Flush';
  if(nums[0]===4)return 'Four of a Kind';
  if(nums[0]===3&&nums[1]===2)return 'Full House';
  if(suit)return 'Flush';
  if(straight||wheel)return 'Straight';
  if(nums[0]===3)return 'Three of a Kind';
  if(nums.filter(n=>n===2).length===2)return 'Two Pair';
  if(nums[0]===2&&Object.keys(counts).some(r=>ranksVal[r]>=11))return 'Jacks or Better';
  return 'No Pair';
}
function payout(hand){const p=payouts.find(x=>x[0]===hand);if(!p)return 0;return hand==='Royal Flush'?bet===5?4000:p[1]*bet:p[1]*bet}
function renderCards(){
  const el=$('#cards');el.innerHTML='';
  cards.forEach((c,i)=>{const red=c.s==='♥'||c.s==='♦';const div=document.createElement('div');div.className='card'+(held[i]?' held':'')+(phase==='deal'?' deal-anim':'');div.dataset.i=i;
    div.innerHTML=`<div class="corner ${red?'red':'black'}">${c.r}<br>${c.s}</div><div class="suit ${red?'red':'black'}">${c.s}</div><div class="corner bottom ${red?'red':'black'}">${c.r}<br>${c.s}</div><div class="held-label">HELD</div>`;
    if(phase==='hold')div.onclick=()=>{held[i]=!held[i];renderCards()};el.appendChild(div)
  });
}
function renderBacks(){cards=[{},{},{},{},{}];$('#cards').innerHTML='';for(let i=0;i<5;i++){const d=document.createElement('div');d.className='card back deal-anim';d.style.animationDelay=(i*.05)+'s';$('#cards').appendChild(d)}}
function setBet(n){if(phase!=='bet'&&phase!=='hold')return;bet=Math.max(1,Math.min(5,n));$('#bet').textContent=bet}
function deal(){
  if(phase==='hold'){phase='deal';let d=deck();let idx=0;for(let i=0;i<5;i++)if(!held[i])cards[i]=d[idx++];
    renderCards();const hand=evaluate(cards),pay=payout(hand);win=pay;credits+=pay;
    document.querySelectorAll('.pay-row').forEach(r=>r.classList.toggle('active',r.dataset.hand===hand));
    $('#win').textContent=pay;$('#credits').textContent=credits;
    $('#message').textContent=hand==='No Pair'?'NO WIN':hand.toUpperMessage?.()||hand.toUpperCase();
    $('#dealText').textContent='DEAL';phase='bet';setTimeout(()=>{held=[false,false,false,false,false]},300);return;
  }
  if(phase==='bet'){if(credits<bet)return;credits-=bet;$('#credits').textContent=credits;$('#win').textContent='0';win=0;document.querySelectorAll('.pay-row').forEach(r=>r.classList.remove('active'));
    const d=deck();cards=d.slice(0,5);held=[false,false,false,false,false];phase='hold';$('#message').textContent='CHOOSE CARDS TO HOLD';$('#dealText').textContent='DRAW';renderCards();}
}
$('#dealBtn').onclick=deal;$('#betUp').onclick=()=>setBet(bet+1);$('#betDown').onclick=()=>setBet(bet-1);$('#betMax').onclick=()=>setBet(5);
$('#soundBtn').onclick=()=>{sound=!sound;$('#soundBtn').classList.toggle('off',!sound)};
document.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')deal();if(e.key==='ArrowUp')setBet(bet+1);if(e.key==='ArrowDown')setBet(bet-1);if(e.key>=1&&e.key<=5&&phase==='hold'){$('#cards').children[+e.key-1]?.click()}});
buildPaytable();renderBacks();$('#message').textContent='PLACE BET & DEAL';
