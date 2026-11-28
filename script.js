const colors=['#ef6d72','#ff9f43','#ffd85a','#78be55','#54a8d8','#6868c5','#ba78c9','#744b35'];
const palette=document.getElementById('palette');
let selected=colors[0], history=[], erasing=false;
const regions=[...document.querySelectorAll('.region')];
colors.forEach((color,i)=>{const b=document.createElement('button');b.className='color-btn'+(i===0?' selected':'');b.style.background=color;b.dataset.color=color;b.setAttribute('aria-label','Color '+color);palette.appendChild(b)});
palette.addEventListener('click',e=>{if(!e.target.matches('.color-btn'))return;document.querySelectorAll('.color-btn').forEach(x=>x.classList.remove('selected'));e.target.classList.add('selected');selected=e.target.dataset.color;erasing=false;document.getElementById('eraserBtn').style.background='#f2efe9'});
function paint(el){const old=el.getAttribute('fill')||'#ffffff';const next=erasing?'#ffffff':selected;if(old===next)return;history.push([el,old]);el.setAttribute('fill',next);updateProgress();}
regions.forEach(r=>r.addEventListener('pointerdown',e=>{e.preventDefault();paint(r)}));
function updateProgress(){const colored=regions.filter(r=>r.getAttribute('fill')&&!r.getAttribute('fill').includes('ffffff')).length;const pct=Math.round(colored/regions.length*100);document.getElementById('progressText').textContent=pct+'%';document.getElementById('progressFill').style.width=pct+'%';if(pct===100){const t=document.getElementById('toast');t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)}}
document.getElementById('eraserBtn').addEventListener('click',e=>{erasing=!erasing;e.currentTarget.style.background=erasing?'#dcefd2':'#f2efe9';document.querySelectorAll('.color-btn').forEach(x=>x.classList.remove('selected'))});
document.getElementById('undoBtn').addEventListener('click',()=>{const last=history.pop();if(last){last[0].setAttribute('fill',last[1]);updateProgress()}});
document.getElementById('clearBtn').addEventListener('click',()=>{regions.forEach(r=>{const old=r.getAttribute('fill')||'#ffffff';if(old!=='#ffffff')history.push([r,old]);r.setAttribute('fill','#ffffff')});updateProgress()});
document.getElementById('nextBtn').addEventListener('click',()=>document.getElementById('clearBtn').click());
document.getElementById('homeBtn').addEventListener('click',()=>document.getElementById('clearBtn').click());
document.getElementById('soundBtn').addEventListener('click',e=>{e.currentTarget.textContent=e.currentTarget.textContent==='♪'?'♩':'♪'});
