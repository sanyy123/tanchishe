// ===== DOM 引用 =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const lengthEl = document.getElementById('length');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg = document.getElementById('overlayMsg');
const startBtn = document.getElementById('startBtn');
const achieveListEl = document.getElementById('achieveList');
const achieveCountEl = document.getElementById('achieveCount');
const achieveToast = document.getElementById('achieveToast');
const toastIcon = document.getElementById('toastIcon');
const toastName = document.getElementById('toastName');
const achieveModal = document.getElementById('achieveModal');
const musicBtn = document.getElementById('musicBtn');
const skinBtn = document.getElementById('skinBtn');
const skinModal = document.getElementById('skinModal');
const skinListEl = document.getElementById('skinList');
const catModeBtn = document.getElementById('catModeBtn');
const guideBtn = document.getElementById('guideBtn');
const guideModal = document.getElementById('guideModal');
const guideNavEl = document.getElementById('guideNav');
const guideContentEl = document.getElementById('guideContent');

const LOGICAL_SIZE = 600, GRID = 20, COLS = 30, ROWS = 30;
const dpr = window.devicePixelRatio || 1;
canvas.width = LOGICAL_SIZE * dpr;
canvas.height = LOGICAL_SIZE * dpr;
ctx.scale(dpr, dpr);

let snake, direction, nextDirection, food, score, highScore;
let rafId = null, loopActive = false, lastFrameTs = 0, accumulator = 0, survivalAccumulator = 0;
let isPaused, isGameOver, isDying, speed;
let particles = [], foodPulse = 0, foodsEaten = 0, maxLengthReached = 3, totalScoreAccum = 0;
let shakeAmount = 0;
let ghostTrail = [];
const GHOST_LENGTH = 22;
let musicEnabled = true, currentBgmKey = '', bgmRetryTimer = null;
let cornerEaten = new Set(), survivalTime = 0, fastEats = 0;
let cheatSkins = new Set(JSON.parse(localStorage.getItem('snakeCheatSkins') || '[]'));
let speedFactor = 1, shieldActive = false, buffSpeedTimer = 0;
let specialFood = null, specialFoodTimer = 0;
const SPECIAL_FOOD_DURATION = 8000;
let specialFoodCooldown = 0;
let cat = null, catActive = false;
const CAT_ACTIVATE_SCORE = 250;
let catTrail = [], catBiteLosses = 0;
const CAT_BITE_LOSS_LIMIT = 20;
let catModeEnabled = localStorage.getItem('snakeCatMode') !== '0';
let currentSkinId = localStorage.getItem('snakeCurrentSkin') || 'default';
if (!SKINS[currentSkinId]) currentSkinId = 'default';

const CAT_ASSET = new Image();
const TIGER_ASSETS = { head: new Image(), body: new Image(), food: new Image(), leaf: new Image() };
const RABBIT_ASSETS = { head: new Image(), body: new Image(), food: new Image(), paw: new Image() };
const DRAGON_ASSETS = { head: new Image(), decor: new Image(), food: new Image(), tail: new Image() };
const SNAKE_ASSETS = { head: new Image(), tail: new Image(), food: new Image(), drop: new Image(), leaf: new Image() };
const HORSE_ASSETS = { head: new Image(), tail: new Image(), food: new Image(), decor: new Image() };
const SHEEP_ASSETS = { head: new Image(), tail: new Image(), food: new Image(), decor: new Image() };

const audio = new Audio(); audio.loop = true; audio.volume = 0.45; audio.preload = 'auto';
audio.addEventListener('ended', () => { if (musicEnabled && currentBgmKey) { audio.currentTime = 0; audio.play().catch(()=>{}); } });
audio.addEventListener('error', () => { if (musicEnabled && currentBgmKey) { clearTimeout(bgmRetryTimer); bgmRetryTimer = setTimeout(() => { const url = BGM[currentBgmKey]; if (url) { audio.src = url; audio.play().catch(()=>{}); } }, 1500); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && musicEnabled && currentBgmKey && audio.paused) audio.play().catch(()=>{}); });
function playBgm(key) { if (!musicEnabled || !BGM[key]) return; if (key === currentBgmKey && !audio.paused) return; currentBgmKey = key; audio.src = BGM[key]; audio.load(); const p = audio.play(); if (p) p.catch(()=>{}); }
function stopBgm() { audio.pause(); currentBgmKey = ''; }
function getGameStageKey() { return score >= 600 ? 'stage2' : (score >= 250 ? 'stage1' : 'stage0'); }
function updateGameBgm() { if (musicEnabled && !isGameOver && !isPaused) playBgm(getGameStageKey()); }

let unlocked = JSON.parse(localStorage.getItem(ACHIEVE_KEY) || '[]');
highScore = parseInt(localStorage.getItem(HIGH_KEY) || '0');
totalScoreAccum = parseInt(localStorage.getItem(TOTAL_KEY) || '0');
highScoreEl.textContent = highScore;
function saveAchievements() { localStorage.setItem(ACHIEVE_KEY, JSON.stringify(unlocked)); localStorage.setItem(TOTAL_KEY, totalScoreAccum); }

const BASE_SPEED = 160, MIN_SPEED = 70;
function calcSpeed() { const step = Math.floor(score/50); return Math.max(MIN_SPEED, BASE_SPEED - step*6); }
function vibrate(pattern) { if (!navigator.vibrate) return; try { navigator.vibrate(pattern); } catch(e) {} }
document.addEventListener('touchstart', () => { try { if (navigator.vibrate) navigator.vibrate(1); } catch(e) {} }, { once: true });

function drawImageHelper(img, cx, cy, dpx) {
if (!img || !img.complete || !img.naturalWidth) return false;
const s = dpx / img.naturalWidth;
const w = img.naturalWidth * s, h = img.naturalHeight * s;
ctx.drawImage(img, cx - w/2, cy - h/2, w, h);
return true;
}
function recordGhost() {
if (!snake) return;
ghostTrail.push(snake.map(seg => ({ x: seg.x, y: seg.y })));
if (ghostTrail.length > GHOST_LENGTH) ghostTrail.shift();
}
function getGhostColor() {
if (score < 80) return { r:0, g:245, b:212 };
if (score < 200) { const t = (score-80)/120; return { r:Math.floor(0+t*255), g:Math.floor(245-t*100), b:Math.floor(212-t*150) }; }
if (score < 400) { const t = (score-200)/200; return { r:255, g:Math.floor(145-t*100), b:Math.floor(62+t*50) }; }
if (score < 700) { const t = (score-400)/300; return { r:Math.floor(255-t*100), g:Math.floor(45-t*45), b:Math.floor(112+t*143) }; }
return { r:155, g:0, b:255 };
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

function startLoop() { stopLoop(); lastFrameTs=0; accumulator=0; loopActive=true; rafId=requestAnimationFrame(frame); }
function stopLoop() { loopActive=false; if (rafId) { cancelAnimationFrame(rafId); rafId=null; } }
function frame(timestamp) {
if (!loopActive) return;
if (!lastFrameTs) lastFrameTs = timestamp;
let delta = timestamp - lastFrameTs;
lastFrameTs = timestamp;
if (delta > 100) delta = 100;
if (buffSpeedTimer > 0) { buffSpeedTimer -= delta; if (buffSpeedTimer <= 0) { buffSpeedTimer=0; speedFactor=1; } }
if (!isPaused && !isGameOver) {
accumulator += delta;
const currentSpeed = speed * speedFactor;
let steps = 0;
while (accumulator >= currentSpeed && steps < 5) { update(); accumulator -= currentSpeed; steps++; if (isGameOver) break; }
if (steps >= 5) accumulator = 0;
}
updateParticles(); draw();
if (loopActive && (!isGameOver || isDying)) { rafId = requestAnimationFrame(frame); } else { stopLoop(); }
}

function initGame() {
snake = [{x:12,y:15},{x:11,y:15},{x:10,y:15}];
direction = {x:1,y:0}; nextDirection = {x:1,y:0};
score = 0; foodsEaten = 0; maxLengthReached = 3; speed = BASE_SPEED;
isPaused = false; isGameOver = false; isDying = false; particles = [];
cornerEaten = new Set(); survivalTime = 0; fastEats = 0;
ghostTrail = []; shakeAmount = 0;
accumulator = 0; survivalAccumulator = 0;
cat = null; catActive = false; catTrail = []; catBiteLosses = 0;
speedFactor = 1; buffSpeedTimer = 0; shieldActive = false;
specialFood = null; specialFoodTimer = 0; specialFoodCooldown = 0;
scoreEl.textContent = '0'; lengthEl.textContent = '3';
placeFood(); overlay.classList.add('hidden');
updateGameBgm(); renderAchievements();
}
function placeFood() {
let valid = false;
while (!valid) {
food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
valid = !snake.some(s => s.x === food.x && s.y === food.y);
if (valid && specialFood) valid = !(specialFood.x === food.x && specialFood.y === food.y);
}
}
function spawnSpecialFood() {
if (specialFood) return;
if (specialFoodCooldown > 0) return;
let valid = false, sf, attempts = 0;
while (!valid && attempts < 200) {
attempts++;
sf = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS), type:'gold' };
const r = Math.random();
if (r < 0.25) sf.type = 'gold';
else if (r < 0.5) sf.type = 'speed';
else if (r < 0.75) sf.type = 'shield';
else sf.type = 'shrink';
valid = !snake.some(s => s.x === sf.x && s.y === sf.y);
if (valid && food) valid = !(food.x === sf.x && food.y === sf.y);
}
if (valid) { specialFood = sf; specialFoodTimer = SPECIAL_FOOD_DURATION; }
}
function spawnParticles(x, y, color) { for (let i=0;i<14;i++) { const angle=(Math.PI*2*i)/14+Math.random()*0.5; const spd=1.8+Math.random()*2.8; particles.push({x:x*GRID+GRID/2,y:y*GRID+GRID/2,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,life:1,decay:0.022+Math.random()*0.02,size:2.5+Math.random()*3.5,color}); } }
function updateParticles() { for (let i=particles.length-1;i>=0;i--) { const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vx*=0.95; p.vy*=0.95; p.life-=p.decay; if (p.life<=0) particles.splice(i,1); } }

function spawnCat() {
let valid = false, catX, catY, attempts = 0;
while (!valid && attempts < 200) {
attempts++;
catX = Math.floor(Math.random()*COLS);
catY = Math.floor(Math.random()*ROWS);
const tooCloseToSnake = snake.some(s => Math.abs(s.x-catX)+Math.abs(s.y-catY) < 5);
const tooCloseToFood = Math.abs(food.x-catX)+Math.abs(food.y-catY) < 3;
const tooCloseToSpecial = specialFood && (Math.abs(specialFood.x-catX)+Math.abs(specialFood.y-catY) < 3);
if (!tooCloseToSnake && !tooCloseToFood && !tooCloseToSpecial) valid = true;
}
cat = { x:catX, y:catY, dir:{x:0,y:0}, moveTimer:0 };
catActive = true; catBiteLosses = 0;
showCheatToast('🐱 野猫出现！小心尾巴！');
}
function updateCat() {
if (!catActive || !cat || isPaused || isGameOver) return;
cat.moveTimer++;
if (cat.moveTimer < 2) return;
cat.moveTimer = 0;
if (snake[0].x === cat.x && snake[0].y === cat.y) {
if (shieldActive) { shieldActive=false; showCheatToast('🛡️ 护盾抵挡了野猫！'); catActive=false; cat=null; catTrail=[]; return; }
else { gameOver('被野猫正面抓住'); return; }
}
const head = snake[0];
const dx = head.x-cat.x, dy = head.y-cat.y;
let moveX=0, moveY=0;
if (Math.abs(dx) >= Math.abs(dy)) moveX = dx>0?1:(dx<0?-1:0);
else moveY = dy>0?1:(dy<0?-1:0);
const newX = cat.x+moveX, newY = cat.y+moveY;
if (newX>=0 && newX<COLS && newY>=0 && newY<ROWS) {
if (!snake.some(s => s.x===newX && s.y===newY)) { cat.x=newX; cat.y=newY; cat.dir={x:moveX,y:moveY}; }
}
catTrail.push({x:cat.x,y:cat.y});
if (catTrail.length > 6) catTrail.shift();
if (snake[0].x === cat.x && snake[0].y === cat.y) {
if (shieldActive) { shieldActive=false; showCheatToast('🛡️ 护盾抵挡了野猫！'); catActive=false; cat=null; catTrail=[]; return; }
else { gameOver('被野猫正面抓住'); return; }
}
if (snake.length > 3) {
for (let i=snake.length-1; i>=3; i--) {
if (snake[i].x === cat.x && snake[i].y === cat.y) {
const biteIndex = i;
const removedCount = snake.length - biteIndex;
snake = snake.slice(0, biteIndex);
catBiteLosses += removedCount;
vibrate([120,60,120,60,120]); shakeAmount = 28;
spawnParticles(cat.x, cat.y, '#ff4444'); spawnParticles(cat.x, cat.y, '#ffaa00');
lengthEl.textContent = snake.length;
if (catBiteLosses >= CAT_BITE_LOSS_LIMIT) { showCheatToast('🐱 尾巴被咬断！累计损失 ' + catBiteLosses + ' 节，力竭而亡！'); gameOver('被野猫咬断尾巴'); }
else { showCheatToast('🐱 尾巴被咬断！失去 ' + removedCount + ' 节（累计 ' + catBiteLosses + '/' + CAT_BITE_LOSS_LIMIT + '）'); }
break;
}
}
}
}
function isCatTrapped() {
if (!catActive || !cat) return false;
const startX = cat.x, startY = cat.y;
if (startX===0 || startX===COLS-1 || startY===0 || startY===ROWS-1) return false;
const visited = new Set(); const queue = [{x:startX,y:startY}];
visited.add(startX+','+startY);
const dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
while (queue.length > 0) {
const { x, y } = queue.shift();
if (x===0 || x===COLS-1 || y===0 || y===ROWS-1) return false;
for (const d of dirs) {
const nx = x+d.x, ny = y+d.y;
if (nx<0 || nx>=COLS || ny<0 || ny>=ROWS) continue;
const key = nx+','+ny;
if (visited.has(key)) continue;
if (snake.some(s => s.x===nx && s.y===ny)) continue;
visited.add(key); queue.push({x:nx,y:ny});
}
}
return true;
}

function draw() {
ctx.save();
let shakeX=0, shakeY=0;
if (shakeAmount > 0.1) { shakeX = (Math.random()-0.5)*shakeAmount; shakeY = (Math.random()-0.5)*shakeAmount; shakeAmount *= 0.90; } else { shakeAmount = 0; }
ctx.translate(shakeX, shakeY);
const skin = SKINS[currentSkinId] || SKINS.default;
const isWarm = ['shu','niu','hu','tu','long','she','ma','yang'].includes(currentSkinId);
if (isWarm) {
const light = currentSkinId==='niu'?'#faf0dc':(currentSkinId==='hu'?'#fff4e6':(currentSkinId==='tu'?'#fff5f5':(currentSkinId==='long'?'#f0faf5':(currentSkinId==='she'?'#f2fbf0':(currentSkinId==='ma'?'#fff8f0':(currentSkinId==='yang'?'#f5f0ff':'#f8edd8'))))));
const dark = currentSkinId==='niu'?'#f0e0c0':(currentSkinId==='hu'?'#ffe4cc':(currentSkinId==='tu'?'#ffe4e8':(currentSkinId==='long'?'#d4f0e5':(currentSkinId==='she'?'#d9f0d4':(currentSkinId==='ma'?'#f5e8d8':(currentSkinId==='yang'?'#e8ddf5':'#f0e0c0'))))));
for (let gy=0; gy<ROWS; gy++) for (let gx=0; gx<COLS; gx++) { ctx.fillStyle = (gx+gy)%2===0 ? light : dark; ctx.fillRect(gx*GRID, gy*GRID, GRID, GRID); }
ctx.strokeStyle = currentSkinId==='hu'?'rgba(230,160,100,0.35)':(currentSkinId==='tu'?'rgba(255,150,170,0.35)':(currentSkinId==='long'?'rgba(100,200,180,0.35)':(currentSkinId==='she'?'rgba(130,200,120,0.35)':(currentSkinId==='ma'?'rgba(210,170,130,0.35)':(currentSkinId==='yang'?'rgba(180,140,200,0.35)':'rgba(200,170,120,0.35)')))));
ctx.lineWidth = 0.8;
for (let i=0; i<=COLS; i++) { ctx.beginPath(); ctx.moveTo(i*GRID,0); ctx.lineTo(i*GRID,LOGICAL_SIZE); ctx.stroke(); }
for (let i=0; i<=ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*GRID); ctx.lineTo(LOGICAL_SIZE,i*GRID); ctx.stroke(); }
if (currentSkinId === 'shu') {
ctx.fillStyle = 'rgba(180,140,90,0.28)';
const paws = [[2,3],[6,10],[11,5],[17,14],[8,20],[23,8],[4,25],[20,22],[14,11],[26,17],[9,7],[18,26]];
paws.forEach(([gx,gy]) => { const cx=gx*GRID+GRID/2, cy=gy*GRID+GRID/2; ctx.beginPath(); ctx.arc(cx,cy,3.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx-3.8,cy-2.8,1.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+3.8,cy-2.8,1.8,0,Math.PI*2); ctx.fill(); });
ctx.fillStyle = 'rgba(255,190,60,0.4)';
[[5,6],[12,18],[19,4],[25,12],[3,16],[15,25],[22,20]].forEach(([gx,gy]) => { const cx=gx*GRID+GRID/2, cy=gy*GRID+GRID/2; ctx.beginPath(); for (let s=0;s<5;s++){const a=(s*4*Math.PI/5)-Math.PI/2; const r=s%2===0?3.5:1.5; ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);} ctx.closePath(); ctx.fill(); });
} else if (currentSkinId === 'niu') {
const grassSpots = [[3,4],[8,12],[15,6],[21,18],[5,22],[24,9],[10,25],[18,3],[26,15],[12,16],[1,10],[28,5]];
const leafPath = (w,h) => { ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-w/2,-h*0.22,-w/2,-h*0.74,0,-h); ctx.bezierCurveTo(w/2,-h*0.74,w/2,-h*0.22,0,0); ctx.closePath(); };
const bladeSet = [{x:-5.5,h:7.5,w:4.2,rot:-0.78,c1:'#b9dd7b',c2:'#79ad3c'},{x:5.5,h:7.5,w:4.2,rot:0.78,c1:'#b9dd7b',c2:'#79ad3c'},{x:-3,h:10.5,w:4.8,rot:-0.40,c1:'#c2e385',c2:'#84b945'},{x:3,h:10.5,w:4.8,rot:0.40,c1:'#c2e385',c2:'#84b945'},{x:0,h:14,w:5.4,rot:0,c1:'#cbe894',c2:'#8fc44e'}];
grassSpots.forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2+6; ctx.save(); ctx.translate(bx,by); ctx.scale(0.9,0.9); ctx.lineJoin='round'; ctx.fillStyle='rgba(150,120,60,0.20)'; ctx.beginPath(); ctx.ellipse(2,1,8.5,2.6,0,0,Math.PI*2); ctx.fill(); bladeSet.forEach(b => { ctx.save(); ctx.translate(b.x,0); ctx.rotate(b.rot); leafPath(b.w,b.h); ctx.fillStyle='#fffdf5'; ctx.strokeStyle='#fffdf5'; ctx.lineWidth=3.4; ctx.fill(); ctx.stroke(); ctx.restore(); }); bladeSet.forEach(b => { ctx.save(); ctx.translate(b.x,0); ctx.rotate(b.rot); leafPath(b.w,b.h); ctx.strokeStyle='#fffdf5'; ctx.lineWidth=2.2; ctx.stroke(); const lg=ctx.createLinearGradient(-b.w/2,0,b.w/2,0); lg.addColorStop(0,b.c1); lg.addColorStop(1,b.c2); leafPath(b.w,b.h); ctx.fillStyle=lg; ctx.fill(); ctx.restore(); }); ctx.restore(); });
} else if (currentSkinId === 'hu') {
[[2,5],[7,14],[14,3],[20,18],[24,7],[10,25],[18,10],[5,21]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(TIGER_ASSETS.leaf,bx,by,GRID*1.6)) { ctx.fillStyle='rgba(255,140,0,0.5)'; ctx.beginPath(); ctx.arc(bx,by,8,0,Math.PI*2); ctx.fill(); } });
} else if (currentSkinId === 'tu') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(RABBIT_ASSETS.paw,bx,by,GRID*1.4)) { ctx.fillStyle='rgba(255,182,193,0.6)'; ctx.beginPath(); ctx.arc(bx,by,7,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(bx-5,by-5,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(bx+5,by-5,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(bx-3,by+5,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(bx+3,by+5,2.5,0,Math.PI*2); ctx.fill(); } });
} else if (currentSkinId === 'long') {
[[3,5],[8,15],[15,4],[22,17],[5,23],[25,8],[11,26],[19,4],[27,14],[12,18],[2,11],[28,7]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(DRAGON_ASSETS.decor,bx,by,GRID*1.5)) { ctx.fillStyle='rgba(200,240,220,0.6)'; ctx.beginPath(); ctx.arc(bx-6,by,5,0,Math.PI*2); ctx.arc(bx,by-4,6,0,Math.PI*2); ctx.arc(bx+6,by,5,0,Math.PI*2); ctx.arc(bx,by+3,5,0,Math.PI*2); ctx.fill(); } });
} else if (currentSkinId === 'she') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy], idx) => {
const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2;
if (idx%2===0) { if (!drawImageHelper(SNAKE_ASSETS.drop,bx,by,GRID*1.3)) { ctx.fillStyle='rgba(180,230,255,0.6)'; ctx.beginPath(); ctx.ellipse(bx,by,5,7,0,0,Math.PI*2); ctx.fill(); } }
else { if (!drawImageHelper(SNAKE_ASSETS.leaf,bx,by,GRID*1.3)) { ctx.fillStyle='rgba(150,220,130,0.6)'; ctx.beginPath(); ctx.ellipse(bx,by,5,8,0.5,0,Math.PI*2); ctx.fill(); } }
});
} else if (currentSkinId === 'ma') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(HORSE_ASSETS.decor,bx,by,GRID*1.4)) { ctx.fillStyle='#ffb347'; ctx.beginPath(); ctx.arc(bx,by,6,0,Math.PI*2); ctx.fill(); } });
} else if (currentSkinId === 'yang') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(SHEEP_ASSETS.decor,bx,by,GRID*1.4)) { ctx.fillStyle='#c8a8e8'; ctx.beginPath(); ctx.moveTo(bx-5,by+3); ctx.quadraticCurveTo(bx-6,by-5,bx,by-6); ctx.quadraticCurveTo(bx+6,by-5,bx+5,by+3); ctx.closePath(); ctx.fill(); } });
}
} else {
ctx.fillStyle = skin.boardBg; ctx.fillRect(0,0,LOGICAL_SIZE,LOGICAL_SIZE);
ctx.strokeStyle = skin.gridColor; ctx.lineWidth = 1.2;
for (let i=0; i<=COLS; i++) { ctx.beginPath(); ctx.moveTo(i*GRID,0); ctx.lineTo(i*GRID,LOGICAL_SIZE); ctx.stroke(); }
for (let i=0; i<=ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*GRID); ctx.lineTo(LOGICAL_SIZE,i*GRID); ctx.stroke(); }
}
foodPulse += 0.09;
const pulse = 0.82 + Math.sin(foodPulse)*0.18;
const fx = food.x*GRID + GRID/2, fy = food.y*GRID + GRID/2, fc = skin.foodColors;
const glow = ctx.createRadialGradient(fx,fy,2,fx,fy,GRID*1.3);
glow.addColorStop(0, 'rgba(255,200,50,'+(0.4*pulse)+')'); glow.addColorStop(1, 'rgba(255,200,50,0)');
ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fx,fy,GRID*1.3,0,Math.PI*2); ctx.fill();
if (currentSkinId === 'shu') {
ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.15,pulse*1.15);
ctx.fillStyle='#ffd54a'; ctx.beginPath(); ctx.moveTo(-2,-9); ctx.lineTo(10,6); ctx.lineTo(-10,6); ctx.closePath(); ctx.fill();
ctx.fillStyle='#e6b800'; ctx.beginPath(); ctx.moveTo(-2,-9); ctx.lineTo(-10,6); ctx.lineTo(-8,8); ctx.lineTo(0,-7); ctx.closePath(); ctx.fill();
ctx.fillStyle='#ffe9a0'; ctx.beginPath(); ctx.arc(-1,0,2.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3.5,3,1.8,0,Math.PI*2); ctx.fill();
ctx.restore();
} else if (currentSkinId === 'niu') {
ctx.save(); ctx.translate(fx,fy); ctx.rotate(Math.sin(foodPulse*1.3)*0.10-0.18); ctx.scale(pulse*1.08,pulse*1.08); ctx.lineJoin='round';
const BELL_LINE='#7a4a1a';
const bellPath = () => { ctx.beginPath(); ctx.moveTo(-7,3.5); ctx.bezierCurveTo(-7.6,-5,-4,-9,0,-9); ctx.bezierCurveTo(4,-9,7.6,-5,7,3.5); ctx.quadraticCurveTo(0,6.6,-7,3.5); ctx.closePath(); };
ctx.fillStyle='#fffdf5'; ctx.strokeStyle='#fffdf5'; ctx.lineWidth=3.2;
ctx.beginPath(); ctx.arc(0,-11,3.1,0,Math.PI*2); ctx.fill(); ctx.stroke(); bellPath(); ctx.fill(); ctx.stroke();
const bellFill = ctx.createLinearGradient(-5,-9,5,6); bellFill.addColorStop(0,'#ffefb0'); bellFill.addColorStop(0.42,'#ffce3d'); bellFill.addColorStop(1,'#ef9c05');
bellPath(); ctx.fillStyle=bellFill; ctx.fill(); bellPath(); ctx.strokeStyle=BELL_LINE; ctx.lineWidth=1.5; ctx.stroke();
ctx.beginPath(); ctx.arc(0,5.6,2.5,0,Math.PI*2); ctx.fillStyle='#ffd75e'; ctx.fill(); ctx.strokeStyle=BELL_LINE; ctx.lineWidth=1.3; ctx.stroke();
ctx.restore();
} else if (currentSkinId === 'hu') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(TIGER_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ff9b7a'; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'tu') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(RABBIT_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ff8c00'; ctx.beginPath(); ctx.moveTo(0,-10); ctx.quadraticCurveTo(8,-2,0,12); ctx.quadraticCurveTo(-8,-2,0,-10); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'long') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(DRAGON_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'she') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(SNAKE_ASSETS.food,0,0,GRID*1.9)) { ctx.fillStyle='#8b5a2b'; ctx.beginPath(); ctx.ellipse(0,2,9,10,0,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'ma') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(HORSE_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#8b5a2b'; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'yang') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(SHEEP_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ffb6c1'; ctx.fillRect(-8,-8,16,16); ctx.fillStyle='#ffe4a0'; ctx.fillRect(-8,-5,16,4); ctx.fillStyle='#b8e6b8'; ctx.fillRect(-8,-1,16,4); } ctx.restore(); }
else {
const foodGrad = ctx.createRadialGradient(fx-4,fy-4,1,fx,fy,GRID/2-1);
foodGrad.addColorStop(0, fc[0]); foodGrad.addColorStop(0.55, fc[1]); foodGrad.addColorStop(1, fc[2]);
ctx.fillStyle = foodGrad; ctx.beginPath(); ctx.arc(fx,fy,(GRID/2-2.5)*pulse,0,Math.PI*2); ctx.fill();
}
if (specialFood) {
const sfx = specialFood.x*GRID + GRID/2;
const sfy = specialFood.y*GRID + GRID/2;
const sPulse = 0.9 + Math.sin(foodPulse*1.6)*0.15;
const sGlow = ctx.createRadialGradient(sfx,sfy,2,sfx,sfy,GRID*1.6);
sGlow.addColorStop(0,'rgba(255,255,255,0.6)'); sGlow.addColorStop(1,'rgba(255,255,255,0)');
ctx.fillStyle = sGlow; ctx.beginPath(); ctx.arc(sfx,sfy,GRID*1.6,0,Math.PI*2); ctx.fill();
const timerRatio = Math.max(0, specialFoodTimer / SPECIAL_FOOD_DURATION);
let ringR, ringG, ringB;
if (timerRatio > 0.5) { const t = (timerRatio - 0.5) / 0.5; ringR = Math.floor(255 * (1 - t)); ringG = 255; ringB = 0; }
else { const t = timerRatio / 0.5; ringR = 255; ringG = Math.floor(255 * t); ringB = 0; }
ctx.beginPath();
ctx.arc(sfx, sfy, GRID*0.85, -Math.PI/2, -Math.PI/2 + Math.PI*2*timerRatio);
ctx.strokeStyle = 'rgba('+ringR+','+ringG+','+ringB+',0.95)';
ctx.lineWidth = 3.5; ctx.stroke();
ctx.save(); ctx.translate(sfx,sfy); ctx.scale(sPulse,sPulse);
if (specialFood.type === 'gold') {
ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.ellipse(0,0,10,7,0,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.ellipse(0,2,8,4,0,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#ffef99'; ctx.beginPath(); ctx.ellipse(-2,-2,4,2.5,0,0,Math.PI*2); ctx.fill();
} else if (specialFood.type === 'speed') {
ctx.fillStyle='#ffe14d'; ctx.strokeStyle='#b37b00'; ctx.lineWidth=1;
ctx.beginPath(); ctx.moveTo(2,-10); ctx.lineTo(-5,1); ctx.lineTo(-1,1); ctx.lineTo(-3,10); ctx.lineTo(5,-1); ctx.lineTo(1,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
} else if (specialFood.type === 'shield') {
ctx.fillStyle='#5bc0ff'; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5;
ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(9,-6); ctx.lineTo(9,2); ctx.quadraticCurveTo(9,9,0,11); ctx.quadraticCurveTo(-9,9,-9,2); ctx.lineTo(-9,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.strokeStyle='#ffffff'; ctx.lineWidth=2;
ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(0,6); ctx.stroke();
ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(5,0); ctx.stroke();
} else if (specialFood.type === 'shrink') {
ctx.fillStyle='#9b5de5'; ctx.strokeStyle='#4a1d80'; ctx.lineWidth=1;
ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(4,-10); ctx.lineTo(4,-5); ctx.lineTo(6,-2); ctx.lineTo(6,9); ctx.quadraticCurveTo(6,11,4,11); ctx.lineTo(-4,11); ctx.quadraticCurveTo(-6,11,-6,9); ctx.lineTo(-6,-2); ctx.lineTo(-4,-5); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle='#d0a0ff';
ctx.beginPath(); ctx.moveTo(-5,-1); ctx.lineTo(5,-1); ctx.lineTo(5,9); ctx.quadraticCurveTo(5,10,4,10); ctx.lineTo(-4,10); ctx.quadraticCurveTo(-5,10,-5,9); ctx.closePath(); ctx.fill();
}
ctx.restore();
}
const ghostColor = getGhostColor();
ghostTrail.forEach((ghostSnake, index) => {
const t = (index+1)/ghostTrail.length;
const alpha = t*0.35;
const scale = t;
ctx.globalAlpha = alpha;
ctx.globalCompositeOperation = 'lighter';
ctx.strokeStyle = 'rgba('+ghostColor.r+','+ghostColor.g+','+ghostColor.b+',1)';
ctx.lineWidth = GRID*(0.18 + 0.32*scale);
ctx.lineCap = 'round'; ctx.lineJoin = 'round';
ctx.beginPath();
ghostSnake.forEach((seg, i) => {
const gx = seg.x*GRID+GRID/2; const gy = seg.y*GRID+GRID/2;
if (i===0) ctx.moveTo(gx,gy);
else { const prev = ghostSnake[i-1]; const px = prev.x*GRID+GRID/2; const py = prev.y*GRID+GRID/2; const midX = (px+gx)/2; const midY = (py+gy)/2; ctx.quadraticCurveTo(px,py,midX,midY); }
});
ctx.stroke();
ghostSnake.forEach((seg, i) => {
const gx = seg.x*GRID+GRID/2; const gy = seg.y*GRID+GRID/2;
const dotT = (i+1)/ghostSnake.length;
const dotAlpha = alpha*dotT*0.9;
const radius = GRID*(0.09 + 0.16*dotT*scale);
ctx.fillStyle = 'rgba('+ghostColor.r+','+ghostColor.g+','+ghostColor.b+','+(dotAlpha*0.4)+')'; ctx.beginPath(); ctx.arc(gx,gy,radius*3,0,Math.PI*2); ctx.fill();
ctx.fillStyle = 'rgba(255,255,255,'+(dotAlpha*0.7)+')'; ctx.beginPath(); ctx.arc(gx,gy,radius*0.6,0,Math.PI*2); ctx.fill();
ctx.fillStyle = 'rgba('+ghostColor.r+','+ghostColor.g+','+ghostColor.b+','+dotAlpha+')'; ctx.beginPath(); ctx.arc(gx,gy,radius,0,Math.PI*2); ctx.fill();
if (i >= ghostSnake.length-2 && i > 0) {
const prev = ghostSnake[i-1];
const dx = seg.x-prev.x, dy = seg.y-prev.y;
const len = Math.sqrt(dx*dx+dy*dy);
if (len > 0) {
const nx = -dy/len, ny = dx/len;
const offset = GRID*0.36*scale;
ctx.fillStyle = 'rgba('+ghostColor.r+','+ghostColor.g+','+ghostColor.b+','+(dotAlpha*0.5)+')';
ctx.beginPath(); ctx.arc(gx+nx*offset, gy+ny*offset, radius*0.9, 0, Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.arc(gx-nx*offset, gy-ny*offset, radius*0.9, 0, Math.PI*2); ctx.fill();
}
}
});
});
ctx.globalAlpha = 1;
ctx.globalCompositeOperation = 'source-over';
if (catActive && cat) {
const catCX = cat.x*GRID+GRID/2;
const catCY = cat.y*GRID+GRID/2;
ctx.save();
ctx.globalAlpha = 0.35;
const catGlow = ctx.createRadialGradient(catCX,catCY,4,catCX,catCY,GRID*1.8);
catGlow.addColorStop(0,'rgba(255,80,80,0.7)'); catGlow.addColorStop(1,'rgba(255,80,80,0)');
ctx.fillStyle = catGlow; ctx.beginPath(); ctx.arc(catCX,catCY,GRID*1.8,0,Math.PI*2); ctx.fill();
ctx.restore();
catTrail.forEach((ct, ci) => {
const ctAlpha = (ci+1)/catTrail.length*0.2;
ctx.globalAlpha = ctAlpha;
ctx.fillStyle = 'rgba(255,60,60,0.5)';
ctx.beginPath(); ctx.arc(ct.x*GRID+GRID/2, ct.y*GRID+GRID/2, GRID*0.4, 0, Math.PI*2); ctx.fill();
});
ctx.globalAlpha = 1;
ctx.save();
ctx.translate(catCX, catCY);
if (cat.dir.x === 1) { ctx.scale(-1,1); }
else if (cat.dir.x === -1) { }
else if (cat.dir.y === -1) { ctx.rotate(Math.PI/2); }
else if (cat.dir.y === 1) { ctx.rotate(-Math.PI/2); }
if (!drawImageHelper(CAT_ASSET,0,0,GRID*1.9)) {
ctx.fillStyle='#ff5555'; ctx.beginPath(); ctx.arc(0,0,GRID*0.45,0,Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.moveTo(-GRID*0.25,-GRID*0.3); ctx.lineTo(-GRID*0.1,-GRID*0.55); ctx.lineTo(0,-GRID*0.3); ctx.fill();
ctx.beginPath(); ctx.moveTo(GRID*0.25,-GRID*0.3); ctx.lineTo(GRID*0.1,-GRID*0.55); ctx.lineTo(0,-GRID*0.3); ctx.fill();
ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-GRID*0.12,-GRID*0.05,GRID*0.08,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(GRID*0.12,-GRID*0.05,GRID*0.08,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(-GRID*0.12,-GRID*0.05,GRID*0.04,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(GRID*0.12,-GRID*0.05,GRID*0.04,0,Math.PI*2); ctx.fill();
}
ctx.restore();
}
snake.forEach((seg, i) => {
const x = seg.x*GRID, y = seg.y*GRID, isHead = i===0;
const cx = x+GRID/2, cy = y+GRID/2;
if (isHead) {
const hc = skin.headColors || ['#5efce8','#00f5d4','#00bbf9'];
if (currentSkinId === 'shu') {
ctx.fillStyle='#e8c9a0'; ctx.beginPath(); ctx.ellipse(cx-9,cy-8,7,8,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+9,cy-8,7,8,0.3,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#f5d5b5'; ctx.beginPath(); ctx.ellipse(cx-9,cy-8,4,5,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+9,cy-8,4,5,0.3,0,Math.PI*2); ctx.fill();
const hg = ctx.createRadialGradient(cx-3,cy-3,2,cx,cy,12); hg.addColorStop(0,'#f0e0c8'); hg.addColorStop(1,'#d4b896');
ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(cx,cy,11,0,Math.PI*2); ctx.fill();
ctx.fillStyle='rgba(255,160,140,0.45)'; ctx.beginPath(); ctx.ellipse(cx-7,cy+3,3.5,2.5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+7,cy+3,3.5,2.5,0,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#4a3020'; ctx.beginPath(); ctx.arc(cx-4,cy-1,2.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4,cy-1,2.8,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-3.2,cy-1.8,1.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.8,cy-1.8,1.1,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#e89a8a'; ctx.beginPath(); ctx.ellipse(cx,cy+4,2.2,1.6,0,0,Math.PI*2); ctx.fill();
ctx.strokeStyle='rgba(80,50,30,0.55)'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(cx-3,cy+3); ctx.lineTo(cx-12,cy+1); ctx.moveTo(cx-3,cy+5); ctx.lineTo(cx-11,cy+6); ctx.moveTo(cx+3,cy+3); ctx.lineTo(cx+12,cy+1); ctx.moveTo(cx+3,cy+5); ctx.lineTo(cx+11,cy+6); ctx.stroke();
} else if (currentSkinId === 'niu') {
const STROKE='#6b3f22'; ctx.lineJoin='round';
const drawHorn = (dir) => { ctx.beginPath(); ctx.moveTo(cx+dir*3.6,cy-9.5); ctx.bezierCurveTo(cx+dir*6.2,cy-15.5,cx+dir*9.2,cy-17.6,cx+dir*11.4,cy-18.2); ctx.bezierCurveTo(cx+dir*13.4,cy-14.5,cx+dir*10.8,cy-10,cx+dir*8.0,cy-7); ctx.closePath(); const hg=ctx.createLinearGradient(cx+dir*4,cy-15,cx+dir*12,cy-9); hg.addColorStop(0,'#fbe49e'); hg.addColorStop(1,'#f1bf4c'); ctx.fillStyle=hg; ctx.fill(); ctx.strokeStyle=STROKE; ctx.lineWidth=1.3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+dir*5.6,cy-10.8); ctx.quadraticCurveTo(cx+dir*8.4,cy-12.6,cx+dir*9.8,cy-15.6); ctx.strokeStyle='rgba(122,74,34,0.45)'; ctx.lineWidth=0.9; ctx.stroke(); };
drawHorn(-1); drawHorn(1);
[[-1,-0.35],[1,0.35]].forEach(([dir,rot]) => { ctx.beginPath(); ctx.ellipse(cx+dir*11.6,cy-1.0,5.3,4.9,rot,0,Math.PI*2); ctx.fillStyle='#fff6e6'; ctx.fill(); ctx.strokeStyle=STROKE; ctx.lineWidth=1.4; ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx+dir*12.4,cy-0.2,3.0,2.3,rot,0,Math.PI*2); ctx.fillStyle='#ff9eb5'; ctx.fill(); });
const facePath = () => { ctx.beginPath(); ctx.ellipse(cx,cy+1.5,11.5,11,0,0,Math.PI*2); };
facePath(); ctx.fillStyle='#fffaf5'; ctx.fill();
ctx.save(); facePath(); ctx.clip(); ctx.beginPath(); ctx.ellipse(cx+5.5,cy-4.2,6.2,5.2,0.28,0,Math.PI*2); ctx.fillStyle='#e8903f'; ctx.fill(); ctx.restore();
facePath(); ctx.strokeStyle=STROKE; ctx.lineWidth=1.8; ctx.stroke();
[[-1],[1]].forEach(([dir]) => { ctx.beginPath(); ctx.arc(cx+dir*4.3,cy-0.6,3.6,0,Math.PI*2); ctx.fillStyle='#4a2c1a'; ctx.fill(); ctx.beginPath(); ctx.arc(cx+dir*3.2,cy-1.9,1.5,0,Math.PI*2); ctx.fillStyle='#ffffff'; ctx.fill(); });
ctx.beginPath(); ctx.ellipse(cx,cy+4.2,2.5,1.8,0,0,Math.PI*2); ctx.fillStyle='#ff9eb5'; ctx.fill();
ctx.beginPath(); ctx.arc(cx,cy+5.6,2.9,0.22,Math.PI-0.22); ctx.strokeStyle=STROKE; ctx.lineWidth=1.4; ctx.lineCap='round'; ctx.stroke();
} else if (currentSkinId === 'hu') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(TIGER_ASSETS.head,0,0,GRID*1.9)) { ctx.fillStyle='#f5b06c'; ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'tu') { if (!drawImageHelper(RABBIT_ASSETS.head,cx,cy,GRID*1.9)) { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (currentSkinId === 'long') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(DRAGON_ASSETS.head,0,0,GRID*2.0)) { ctx.fillStyle='#e0f5ec'; ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'she') { if (!drawImageHelper(SNAKE_ASSETS.head,cx,cy,GRID*1.9)) { ctx.fillStyle='#c5e8b8'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (currentSkinId === 'ma') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(HORSE_ASSETS.head,0,0,GRID*1.9)) { ctx.fillStyle='#fdf0e0'; ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'yang') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(SHEEP_ASSETS.head,0,0,GRID*2.0)) { ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else { const headGlow = ctx.createRadialGradient(cx,cy,2,cx,cy,GRID*1.1); headGlow.addColorStop(0,'rgba(0,245,212,0.4)'); headGlow.addColorStop(1,'rgba(0,245,212,0)'); ctx.fillStyle=headGlow; ctx.fillRect(x-5,y-5,GRID+10,GRID+10); const headGrad = ctx.createLinearGradient(x,y,x+GRID,y+GRID); headGrad.addColorStop(0,hc[0]); headGrad.addColorStop(0.5,hc[1]); headGrad.addColorStop(1,hc[2]); ctx.fillStyle=headGrad; roundRect(ctx,x+1.5,y+1.5,GRID-3,GRID-3,7); ctx.fill(); }
} else {
if (currentSkinId === 'shu') {
const scx=x+GRID/2, scy=y+GRID/2;
ctx.fillStyle='#f0e0c8'; ctx.beginPath(); ctx.arc(scx,scy,8.5,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#e8c9a0'; ctx.beginPath(); ctx.ellipse(scx-6,scy-5,3.5,4,-0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(scx+6,scy-5,3.5,4,0.2,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#5a4030'; ctx.beginPath(); ctx.arc(scx-3,scy-1,1.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(scx+3,scy-1,1.6,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(scx-2.5,scy-1.5,0.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(scx+3.5,scy-1.5,0.6,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#e89a8a'; ctx.beginPath(); ctx.arc(scx,scy+2.5,1.3,0,Math.PI*2); ctx.fill();
} else if (currentSkinId === 'niu') {
const scx=x+GRID/2, scy=y+GRID/2;
let angle = -Math.PI/2;
if (i>0) { const prev = snake[i-1]; angle = Math.atan2(prev.y-seg.y, prev.x-seg.x); }
ctx.save(); ctx.translate(scx,scy); ctx.rotate(angle+Math.PI/2);
const STROKE='#7a4a24'; ctx.lineJoin='round';
const bodyPath = () => { ctx.beginPath(); ctx.moveTo(-6.4,-2); ctx.lineTo(-6.4,6); ctx.quadraticCurveTo(-6.4,10.4,-2,10.4); ctx.lineTo(2,10.4); ctx.quadraticCurveTo(6.4,10.4,6.4,6); ctx.lineTo(6.4,-2); ctx.closePath(); };
const capPath = () => { ctx.beginPath(); ctx.moveTo(-5.4,-6.4); ctx.lineTo(-5.4,-2.4); ctx.lineTo(5.4,-2.4); ctx.lineTo(5.4,-6.4); ctx.quadraticCurveTo(0,-8.2,-5.4,-6.4); ctx.closePath(); };
const nipplePath = () => { ctx.beginPath(); ctx.moveTo(-2.5,-6.2); ctx.quadraticCurveTo(-2.3,-10.4,0,-11); ctx.quadraticCurveTo(2.3,-10.4,2.5,-6.2); ctx.closePath(); };
ctx.fillStyle='#fffdf5'; ctx.strokeStyle='#fffdf5'; ctx.lineWidth=3.2; bodyPath(); ctx.fill(); ctx.stroke(); capPath(); ctx.fill(); ctx.stroke(); nipplePath(); ctx.fill(); ctx.stroke();
bodyPath(); ctx.fillStyle='#ffffff'; ctx.fill();
ctx.save(); bodyPath(); ctx.clip(); const milkG=ctx.createLinearGradient(0,0,0,11); milkG.addColorStop(0,'#fffdf6'); milkG.addColorStop(1,'#ffeed2'); ctx.fillStyle=milkG; ctx.fillRect(-7,0.5,14,11); ctx.restore();
bodyPath(); ctx.strokeStyle=STROKE; ctx.lineWidth=1.2; ctx.stroke();
const capG=ctx.createLinearGradient(0,-7,0,-2); capG.addColorStop(0,'#fbe49e'); capG.addColorStop(1,'#efbb46'); capPath(); ctx.fillStyle=capG; ctx.fill(); ctx.strokeStyle=STROKE; ctx.lineWidth=1.2; ctx.stroke();
nipplePath(); ctx.fillStyle='#ffe0b0'; ctx.fill(); ctx.strokeStyle=STROKE; ctx.lineWidth=1.15; ctx.stroke();
ctx.restore();
} else if (currentSkinId === 'hu') { if (!drawImageHelper(TIGER_ASSETS.body,cx,cy,GRID*1.8)) { ctx.fillStyle='#f5b06c'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (currentSkinId === 'tu') { if (!drawImageHelper(RABBIT_ASSETS.body,cx,cy,GRID*1.9)) { ctx.fillStyle='#ffe4e8'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (currentSkinId === 'long') { const scx=x+GRID/2, scy=y+GRID/2; const head = snake[0]; const angleToHead = Math.atan2(head.y-seg.y, head.x-seg.x); ctx.save(); ctx.translate(scx,scy); ctx.rotate(angleToHead+Math.PI/2); if (!drawImageHelper(DRAGON_ASSETS.tail,0,0,GRID*1.9)) { ctx.fillStyle='#a8e6cf'; ctx.beginPath(); ctx.ellipse(0,0,12,9,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#6bc9a5'; ctx.lineWidth=1.2; ctx.stroke(); ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-3,-2,5,3,0.3,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'she') { const head = snake[0]; const angleToHead = Math.atan2(head.y-seg.y, head.x-seg.x); ctx.save(); ctx.translate(cx,cy); ctx.rotate(angleToHead); if (Math.abs(angleToHead)>Math.PI/2) { ctx.scale(1,-1); } if (!drawImageHelper(SNAKE_ASSETS.tail,0,0,GRID*1.2)) { ctx.fillStyle='#c5e8b8'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'ma') { const head = snake[0]; const angleToHead = Math.atan2(head.y-seg.y, head.x-seg.x); ctx.save(); ctx.translate(cx,cy); ctx.rotate(angleToHead+Math.PI/2); if (!drawImageHelper(HORSE_ASSETS.tail,0,0,GRID*1.9)) { ctx.fillStyle='#fdf0e0'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (currentSkinId === 'yang') { if (!drawImageHelper(SHEEP_ASSETS.tail,cx,cy,GRID*1.9)) { ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else { const hue = skin.bodyHue; const t = i/Math.max(snake.length-1,1); ctx.fillStyle = 'rgb('+Math.floor(hue.r+t*40)+','+Math.floor(hue.g-t*60)+','+Math.floor(hue.b-t*40)+')'; const inset = 2.5+t*1.8; roundRect(ctx,x+inset,y+inset,GRID-inset*2,GRID-inset*2,5.5); ctx.fill(); }
}
});
if (shieldActive && snake.length > 0) {
const hx = snake[0].x * GRID + GRID/2;
const hy = snake[0].y * GRID + GRID/2;
const shieldPulse = 0.85 + Math.sin(foodPulse * 2.5) * 0.15;
const shieldRadius = GRID * 1.1 * shieldPulse;
ctx.save();
ctx.globalAlpha = 0.75;
const shGlow = ctx.createRadialGradient(hx, hy, GRID * 0.3, hx, hy, shieldRadius * 1.7);
shGlow.addColorStop(0, 'rgba(0, 255, 200, 0.55)');
shGlow.addColorStop(0.6, 'rgba(0, 200, 255, 0.25)');
shGlow.addColorStop(1, 'rgba(0, 200, 255, 0)');
ctx.fillStyle = shGlow;
ctx.beginPath(); ctx.arc(hx, hy, shieldRadius * 1.7, 0, Math.PI * 2); ctx.fill();
ctx.strokeStyle = 'rgba(100, 255, 220, 0.95)';
ctx.lineWidth = 2.5;
ctx.beginPath(); ctx.arc(hx, hy, shieldRadius, 0, Math.PI * 2); ctx.stroke();
ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
ctx.lineWidth = 1.3;
ctx.beginPath(); ctx.arc(hx, hy, shieldRadius * 0.78, 0, Math.PI * 2); ctx.stroke();
ctx.restore();
}
particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill(); });
ctx.globalAlpha = 1;
ctx.restore();
}

function update() {
if (isPaused || isGameOver) return;
survivalAccumulator += speed;
while (survivalAccumulator >= 1000) { survivalAccumulator -= 1000; survivalTime++; }
if (specialFood) { specialFoodTimer -= speed; if (specialFoodTimer <= 0) { specialFood = null; specialFoodTimer = 0; specialFoodCooldown = 2000; } }
if (specialFoodCooldown > 0) { specialFoodCooldown -= speed; if (specialFoodCooldown < 0) specialFoodCooldown = 0; }
if (!catActive && catModeEnabled && score >= CAT_ACTIVATE_SCORE) spawnCat();
direction = { ...nextDirection };
const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
if (shieldActive) { shieldActive=false; showCheatToast('🛡️ 护盾抵挡了墙壁！'); return; }
else { gameOver('撞墙了'); return; }
}
if (snake.some(s => s.x === head.x && s.y === head.y)) {
if (shieldActive) { shieldActive=false; showCheatToast('🛡️ 护盾抵挡了自咬！'); return; }
else { gameOver('咬到自己了'); return; }
}
snake.unshift(head);
let ateSomething = false;
if (head.x === food.x && head.y === food.y) {
ateSomething = true;
foodsEaten++;
vibrate([100, 40, 100]); shakeAmount = 18;
let baseScore = 10;
if (buffSpeedTimer > 0) baseScore *= 2;
score += baseScore;
scoreEl.textContent = score; lengthEl.textContent = snake.length;
maxLengthReached = Math.max(maxLengthReached, snake.length);
const isCorner = (food.x===0 || food.x===COLS-1) && (food.y===0 || food.y===ROWS-1);
if (isCorner) cornerEaten.add(food.x+','+food.y);
if (speed <= MIN_SPEED+5) fastEats++;
showScorePop(food.x, food.y);
spawnParticles(food.x, food.y, '#ff6b6b'); spawnParticles(food.x, food.y, '#00f5d4');
if (score > highScore) { highScore = score; highScoreEl.textContent = highScore; localStorage.setItem(HIGH_KEY, highScore); }
placeFood();
if (!specialFood && Math.random() < 0.35) spawnSpecialFood();
checkAchievements(); updateGameBgm();
const newSpeed = calcSpeed();
if (newSpeed !== speed) { speed = newSpeed; accumulator = 0; }
} else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
ateSomething = true;
foodsEaten++;
vibrate([100,50,100]); shakeAmount = 22;
let baseScore = 10;
if (buffSpeedTimer > 0) baseScore *= 2;
if (specialFood.type === 'gold') { baseScore = 20; showCheatToast('💰 金元宝！积分双倍！'); }
else if (specialFood.type === 'speed') { buffSpeedTimer = 5000; speedFactor = 0.6; showCheatToast('⚡ 加速药水！速度提升，分数翻倍！'); }
else if (specialFood.type === 'shield') { shieldActive = true; showCheatToast('🛡️ 护盾铃铛！免疫一次死亡！'); }
else if (specialFood.type === 'shrink') { const newLen = Math.max(3, Math.floor(snake.length/2)); snake = snake.slice(0, newLen); lengthEl.textContent = snake.length; showCheatToast('🧪 缩小药水！身体缩短一半！'); }
score += baseScore;
scoreEl.textContent = score; lengthEl.textContent = snake.length;
maxLengthReached = Math.max(maxLengthReached, snake.length);
showScorePop(specialFood.x, specialFood.y);
spawnParticles(specialFood.x, specialFood.y, '#ffaa00'); spawnParticles(specialFood.x, specialFood.y, '#ffffff');
if (score > highScore) { highScore = score; highScoreEl.textContent = highScore; localStorage.setItem(HIGH_KEY, highScore); }
specialFood = null; specialFoodTimer = 0; specialFoodCooldown = 3000;
checkAchievements(); updateGameBgm();
const newSpeed = calcSpeed();
if (newSpeed !== speed) { speed = newSpeed; accumulator = 0; }
}
if (!ateSomething) snake.pop();
if (!isGameOver) {
recordGhost();
updateCat();
if (catActive && cat && isCatTrapped()) {
const cx = cat.x, cy = cat.y;
catActive = false; cat = null; catTrail = []; catBiteLosses = 0;
vibrate([200,100,200]); shakeAmount = 25;
score += 50; scoreEl.textContent = score;
if (score > highScore) { highScore = score; highScoreEl.textContent = highScore; localStorage.setItem(HIGH_KEY, highScore); }
showCheatToast('🎉 你围死了野猫！奖励 50 分！');
spawnParticles(cx, cy, '#ffaa00'); spawnParticles(cx, cy, '#ff4444');
}
}
}
function showScorePop(gx, gy) { const pop = document.createElement('div'); pop.className='score-pop'; pop.textContent='+10'; pop.style.left = ((gx+0.5)/COLS*100)+'%'; pop.style.top = ((gy+0.5)/ROWS*100)+'%'; document.querySelector('.canvas-inner').appendChild(pop); setTimeout(()=>pop.remove(),850); }
function tick() { update(); updateParticles(); draw(); }

function gameOver(reason) {
if (isGameOver) return;
isGameOver = true; isDying = true;
vibrate([500, 150, 500, 150, 500]); shakeAmount = 35;
totalScoreAccum += score; saveAchievements(); checkAchievements();
snake.forEach((s,i) => { if (i%2===0) spawnParticles(s.x, s.y, '#00f5d4'); });
setTimeout(() => {
isDying = false;
stopLoop();
overlayTitle.textContent = '修炼失败';
overlayMsg.textContent = (reason || '本局结束') + ' · 积分 ' + score + ' · 体长 ' + snake.length;
startBtn.textContent = '再次入世';
overlay.classList.remove('hidden');
playBgm('menu');
}, 1200);
}
function startGame() { startBtn.style.display='block'; stopLoop(); initGame(); startLoop(); }
function togglePause() {
if (isGameOver) { startGame(); return; }
if (!loopActive && !isPaused) { startGame(); return; }
isPaused = !isPaused;
if (isPaused) { stopLoop(); playBgm('menu'); overlayTitle.textContent='暂时闭关'; overlayMsg.textContent='按空格继续修炼'; startBtn.style.display='none'; overlay.classList.remove('hidden'); }
else { overlay.classList.add('hidden'); startBtn.style.display='block'; updateGameBgm(); startLoop(); }
}
function setDirection(dir) { if (isPaused || isGameOver) return; if (dir==='up' && direction.y===0) nextDirection={x:0,y:-1}; else if (dir==='down' && direction.y===0) nextDirection={x:0,y:1}; else if (dir==='left' && direction.x===0) nextDirection={x:-1,y:0}; else if (dir==='right' && direction.x===0) nextDirection={x:1,y:0}; }