// ===== DOM 引用 =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const score2El = document.getElementById('score2');
const score2Stat = document.getElementById('score2Stat');
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
const obsModeBtn = document.getElementById('obsModeBtn');
const guideBtn = document.getElementById('guideBtn');
const guideModal = document.getElementById('guideModal');
const guideNavEl = document.getElementById('guideNav');
const guideContentEl = document.getElementById('guideContent');
const dualSkinModal = document.getElementById('dualSkinModal');
const dualSkinTitle = document.getElementById('dualSkinTitle');
const dualPageBoard = document.getElementById('dualPageBoard');
const dualPageSnake = document.getElementById('dualPageSnake');
const dualBoardGrid = document.getElementById('dualBoardGrid');
const dualP1Grid = document.getElementById('dualP1Grid');
const dualP2Grid = document.getElementById('dualP2Grid');
const dualNextBtn = document.getElementById('dualNextBtn');
const closeDualSkinBtn = document.getElementById('closeDualSkin');

const LOGICAL_SIZE = 600, GRID = 20, COLS = 30, ROWS = 30;
const dpr = window.devicePixelRatio || 1;
canvas.width = LOGICAL_SIZE * dpr;
canvas.height = LOGICAL_SIZE * dpr;
ctx.scale(dpr, dpr);

// ===== 全局状态 =====
let gameMode = 'single';
let snakes = [];
let food = { x: 0, y: 0 };
let score = 0, highScore = 0;
let maxLengthReached = 3;
let foodsEaten = 0;
let survivalTime = 0;
let fastEats = 0;
let cornerEaten = new Set();
let totalScoreAccum = 0;

let rafId = null, loopActive = false, lastFrameTs = 0, accumulator = 0;
let isPaused = false, isGameOver = false, isDying = false, speed = 160;
let particles = [], foodPulse = 0;
let shakeAmount = 0;
let musicEnabled = true, currentBgmKey = '', bgmRetryTimer = null;
let cheatSkins = new Set(JSON.parse(localStorage.getItem('snakeCheatSkins') || '[]'));
let specialFood = null, specialFoodTimer = 0;
const SPECIAL_FOOD_DURATION = 8000;
let specialFoodCooldown = 0;
let cat = null, catActive = false;
const CAT_ACTIVATE_SCORE = 250;
let catTrail = [], catBiteLosses = 0;
const CAT_BITE_LOSS_LIMIT = 20;
let catModeEnabled = localStorage.getItem('snakeCatMode') !== '0';
let obstacles = [];
let portals = [];
let portalPairCounter = 0;
let obstacleModeEnabled = localStorage.getItem('snakeObstacleMode') !== '0';
const OBSTACLE_SCORE = 150, OBSTACLE_MAX = 25;
const PORTAL_SCORE = 400, PORTAL_MAX_PAIRS = 2;
const PORTAL_DURATION = 15000;
const PORTAL_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a06cd5'];
const WIN_SCORE = 300;

// ★ 棋盘皮肤（全局）+ 双人选择缓存
let boardSkinId = localStorage.getItem('snakeBoardSkin') || localStorage.getItem('snakeCurrentSkin') || 'default';
if (!SKINS[boardSkinId]) boardSkinId = 'default';
let currentSkinId = boardSkinId;
let p1SkinId = 'default';
let p2SkinId = 'default';
let dualSelectedBoardId = boardSkinId;
let dualSelectedP1 = 'default';
let dualSelectedP2 = 'default';
let dualPage = 'board';

let snake = null, direction = {x:1,y:0}, nextDirection = {x:1,y:0};
let currentPlayer = null;

// ===== 资源 =====
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

// ===== 吃食物音效（MP3 版本） =====
const eatSound1 = new Audio('./eat1.mp3');
eatSound1.preload = 'auto';
eatSound1.volume = 0.5;
const eatSound2 = new Audio('./eat2.mp3');
eatSound2.preload = 'auto';
eatSound2.volume = 0.5;

function playEatSound(playerId, isSpecial) {
try {
const base = isSpecial ? eatSound2 : eatSound1;
const snd = base.cloneNode();
snd.volume = base.volume;
snd.playbackRate = playerId === 'p2' ? 1.15 : 1.0;
const p = snd.play();
if (p) p.catch(() => {});
} catch (e) {}
}
document.addEventListener('touchstart', () => { try { if (navigator.vibrate) navigator.vibrate(1); } catch(e) {} }, { once: true });

function drawImageHelper(img, cx, cy, dpx) {
if (!img || !img.complete || !img.naturalWidth) return false;
const s = dpx / img.naturalWidth;
const w = img.naturalWidth * s, h = img.naturalHeight * s;
ctx.drawImage(img, cx - w/2, cy - h/2, w, h);
return true;
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function isWarmSkin(skinId) { return ['shu','niu','hu','tu','long','she','ma','yang'].includes(skinId); }

function createPlayer(id, headColors, bodyHue, startX, startY, startDir, skinId) {
const body = [{x:startX, y:startY}];
for (let i = 1; i <= 2; i++) {
  body.push({ x: startX - startDir.x * i, y: startY - startDir.y * i });
}
return {
  id: id, body: body,
  dir: {...startDir}, nextDir: {...startDir},
  alive: true, score: 0,
  headColors: headColors, bodyHue: bodyHue,
  shield: false, speedBoost: 0,
  ghostTrail: [],
  foodsEaten: 0, maxLen: 3, survivalTime: 0, fastEats: 0,
  cornerEaten: new Set(),
  skinId: skinId || 'default'
};
}

function startLoop() { stopLoop(); lastFrameTs=0; accumulator=0; loopActive=true; rafId=requestAnimationFrame(frame); }
function stopLoop() { loopActive=false; if (rafId) { cancelAnimationFrame(rafId); rafId=null; } }
function frame(timestamp) {
if (!loopActive) return;
if (!lastFrameTs) lastFrameTs = timestamp;
let delta = timestamp - lastFrameTs;
lastFrameTs = timestamp;
if (delta > 100) delta = 100;
snakes.forEach(p => { if (p.speedBoost > 0) p.speedBoost -= delta; });
if (!isPaused && !isGameOver) {
accumulator += delta;
const curSpeed = speed;
let steps = 0;
while (accumulator >= curSpeed && steps < 5) { update(); accumulator -= curSpeed; steps++; if (isGameOver) break; }
if (steps >= 5) accumulator = 0;
}
updateParticles(); draw();
if (loopActive && (!isGameOver || isDying)) { rafId = requestAnimationFrame(frame); } else { stopLoop(); }
}

function initGame() {
snakes = [];
if (gameMode === 'single') {
const skinObj = SKINS[boardSkinId] || SKINS.default;
snakes.push(createPlayer('p1', skinObj.headColors || ['#5efce8','#00f5d4','#00bbf9'], skinObj.bodyHue || {r:0,g:235,b:220}, 12, 15, {x:1,y:0}, boardSkinId));
if (scoreEl.parentElement) { const lbl = scoreEl.parentElement.querySelector('.label'); if (lbl) lbl.textContent = '积分'; }
score2Stat.style.display = 'none';
} else {
const s1 = SKINS[p1SkinId] || SKINS.default;
const s2 = SKINS[p2SkinId] || SKINS.default;
snakes.push(createPlayer('p1', s1.headColors || ['#5efce8','#00f5d4','#00bbf9'], s1.bodyHue || {r:0,g:235,b:220}, 5, 5, {x:1,y:0}, p1SkinId));
snakes.push(createPlayer('p2', s2.headColors || P2_HEAD_COLORS, s2.bodyHue || P2_BODY_HUE, 24, 24, {x:-1,y:0}, p2SkinId));
if (scoreEl.parentElement) { const lbl = scoreEl.parentElement.querySelector('.label'); if (lbl) lbl.textContent = 'P1 积分'; }
score2Stat.style.display = 'flex';
score2El.textContent = '0';
}
score = 0; speed = BASE_SPEED;
isPaused = false; isGameOver = false; isDying = false; particles = [];
foodPulse = 0; shakeAmount = 0;
accumulator = 0;
cat = null; catActive = false; catTrail = []; catBiteLosses = 0;
specialFood = null; specialFoodTimer = 0; specialFoodCooldown = 0;
obstacles = []; portals = []; portalPairCounter = 0;
maxLengthReached = 3; foodsEaten = 0; survivalTime = 0; fastEats = 0; cornerEaten = new Set();
scoreEl.textContent = '0'; lengthEl.textContent = '3';
placeFood(); overlay.classList.add('hidden');
updateGameBgm(); renderAchievements();
}

function placeFood() {
let valid = false, attempts = 0;
while (!valid && attempts < 500) {
attempts++;
food = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS) };
valid = !snakes.some(p => p.body && p.body.some(s => s.x === food.x && s.y === food.y));
if (valid && specialFood) valid = !(specialFood.x === food.x && specialFood.y === food.y);
if (valid && obstacles.some(o => o.x === food.x && o.y === food.y)) valid = false;
if (valid && portals.some(p => p.x === food.x && p.y === food.y)) valid = false;
}
}
function spawnSpecialFood() {
if (specialFood || specialFoodCooldown > 0) return;
let valid = false, sf, attempts = 0;
while (!valid && attempts < 200) {
attempts++;
sf = { x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS), type:'gold' };
const r = Math.random();
if (r < 0.30) sf.type = 'gold';
else if (r < 0.55) sf.type = 'speed';
else if (r < 0.85) sf.type = 'shield';
else sf.type = 'shrink';
valid = !snakes.some(p => p.body && p.body.some(s => s.x === sf.x && s.y === sf.y));
if (valid && food) valid = !(food.x === sf.x && food.y === sf.y);
if (valid && obstacles.some(o => o.x === sf.x && o.y === sf.y)) valid = false;
if (valid && portals.some(p => p.x === sf.x && p.y === sf.y)) valid = false;
}
if (valid) { specialFood = sf; specialFoodTimer = SPECIAL_FOOD_DURATION; }
}
function trySpawnObstacle() {
if (!obstacleModeEnabled || score < OBSTACLE_SCORE || obstacles.length >= OBSTACLE_MAX) return;
if (!snakes[0] || !snakes[0].body || !snakes[0].body[0]) return;
const head = snakes[0].body[0];
let attempts = 0;
while (attempts < 100) {
attempts++;
const x = Math.floor(Math.random()*COLS);
const y = Math.floor(Math.random()*ROWS);
if (Math.abs(x-head.x)+Math.abs(y-head.y) < 5) continue;
if (snakes.some(p => p.body && p.body.some(s => s.x===x && s.y===y))) continue;
if (food.x===x && food.y===y) continue;
if (specialFood && specialFood.x===x && specialFood.y===y) continue;
if (obstacles.some(o=>o.x===x&&o.y===y)) continue;
if (portals.some(p=>p.x===x&&p.y===y)) continue;
if (cat && cat.x===x && cat.y===y) continue;
obstacles.push({x,y}); break;
}
}
function trySpawnPortal() {
if (!obstacleModeEnabled || score < PORTAL_SCORE || portals.length >= PORTAL_MAX_PAIRS*2) return;
if (Math.random() > 0.3) return;
if (!snakes[0] || !snakes[0].body || !snakes[0].body[0]) return;
const positions = []; let attempts = 0;
const head = snakes[0].body[0];
while (positions.length < 2 && attempts < 300) {
attempts++;
const x = Math.floor(Math.random()*COLS);
const y = Math.floor(Math.random()*ROWS);
if (Math.abs(x-head.x)+Math.abs(y-head.y) < 4) continue;
if (snakes.some(p=>p.body&&p.body.some(s=>s.x===x&&s.y===y))) continue;
if (food.x===x&&food.y===y) continue;
if (specialFood && specialFood.x===x&&specialFood.y===y) continue;
if (obstacles.some(o=>o.x===x&&o.y===y)) continue;
if (portals.some(p=>p.x===x&&p.y===y)) continue;
if (cat && cat.x===x&&cat.y===y) continue;
if (positions.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<8)) continue;
positions.push({x,y});
}
if (positions.length < 2) return;
portalPairCounter++;
const color = PORTAL_COLORS[(portalPairCounter-1)%PORTAL_COLORS.length];
positions.forEach(pos => portals.push({x:pos.x, y:pos.y, pairId:portalPairCounter, color:color, timer:PORTAL_DURATION}));
showCheatToast('🌀 传送门出现！');
}
function spawnParticles(x, y, color) { for (let i=0;i<14;i++) { const a=(Math.PI*2*i)/14+Math.random()*0.5; const s=1.8+Math.random()*2.8; particles.push({x:x*GRID+GRID/2,y:y*GRID+GRID/2,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,decay:0.022+Math.random()*0.02,size:2.5+Math.random()*3.5,color}); } }
function updateParticles() { for (let i=particles.length-1;i>=0;i--) { const p=particles[i]; p.x+=p.vx; p.y+=p.vy; p.vx*=0.95; p.vy*=0.95; p.life-=p.decay; if (p.life<=0) particles.splice(i,1); } }

function spawnCat() {
let valid = false, catX = 5, catY = 5, attempts = 0;
while (!valid && attempts < 200) {
attempts++;
catX = Math.floor(Math.random()*COLS);
catY = Math.floor(Math.random()*ROWS);
if (snakes.some(p=>p.body&&p.body.some(s=>Math.abs(s.x-catX)+Math.abs(s.y-catY)<5))) continue;
if (Math.abs(food.x-catX)+Math.abs(food.y-catY) < 3) continue;
if (specialFood && Math.abs(specialFood.x-catX)+Math.abs(specialFood.y-catY)<3) continue;
if (obstacles.some(o=>o.x===catX&&o.y===catY)) continue;
if (portals.some(p=>p.x===catX&&p.y===catY)) continue;
valid = true;
}
cat = { x:catX, y:catY, dir:{x:0,y:0}, moveTimer:0 };
catActive = true; catBiteLosses = 0;
showCheatToast('🐱 野猫出现！小心尾巴！');
}

function updateCat() {
if (!catActive || !cat || isPaused || isGameOver) return;
if (gameMode === 'double') { catActive = false; cat = null; return; }
cat.moveTimer++;
if (cat.moveTimer < 2) return;
cat.moveTimer = 0;
const player = snakes[0];
if (!player || !player.alive || !player.body || player.body.length === 0) return;
const head = player.body[0];
if (!head) return;
if (head.x === cat.x && head.y === cat.y) {
if (player.shield) { player.shield = false; showCheatToast('🛡️ 护盾抵挡了野猫！'); catActive=false; cat=null; catTrail=[]; return; }
else { killPlayer(player, '被野猫正面抓住'); return; }
}
const dx = head.x-cat.x, dy = head.y-cat.y;
let moveX=0, moveY=0;
if (Math.abs(dx) >= Math.abs(dy)) moveX = dx>0?1:(dx<0?-1:0);
else moveY = dy>0?1:(dy<0?-1:0);
const newX = cat.x+moveX, newY = cat.y+moveY;
if (newX>=0 && newX<COLS && newY>=0 && newY<ROWS) {
if (!player.body.some(s=>s.x===newX&&s.y===newY) && !obstacles.some(o=>o.x===newX&&o.y===newY)) {
cat.x=newX; cat.y=newY; cat.dir={x:moveX,y:moveY};
}
}
catTrail.push({x:cat.x,y:cat.y});
if (catTrail.length > 6) catTrail.shift();
if (head.x===cat.x && head.y===cat.y) {
if (player.shield) { player.shield=false; showCheatToast('🛡️ 护盾抵挡了野猫！'); catActive=false; cat=null; catTrail=[]; return; }
else { killPlayer(player, '被野猫正面抓住'); return; }
}
if (player.body.length > 3) {
for (let i=player.body.length-1; i>=3; i--) {
if (player.body[i] && player.body[i].x === cat.x && player.body[i].y === cat.y) {
const biteIndex = i;
const removedCount = player.body.length - biteIndex;
player.body = player.body.slice(0, biteIndex);
catBiteLosses += removedCount;
vibrate([120,60,120,60,120]); shakeAmount = 28;
spawnParticles(cat.x, cat.y, '#ff4444'); spawnParticles(cat.x, cat.y, '#ffaa00');
lengthEl.textContent = player.body.length;
if (catBiteLosses >= CAT_BITE_LOSS_LIMIT) { showCheatToast('🐱 尾巴被咬断！累计损失 '+catBiteLosses+' 节，力竭而亡！'); killPlayer(player, '被野猫咬断尾巴'); }
else { showCheatToast('🐱 尾巴被咬断！失去 '+removedCount+' 节（累计 '+catBiteLosses+'/'+CAT_BITE_LOSS_LIMIT+'）'); }
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
const player = snakes[0];
if (!player || !player.body) return false;
while (queue.length > 0) {
const { x, y } = queue.shift();
if (x===0 || x===COLS-1 || y===0 || y===ROWS-1) return false;
for (const d of dirs) {
const nx = x+d.x, ny = y+d.y;
if (nx<0 || nx>=COLS || ny<0 || ny>=ROWS) continue;
const key = nx+','+ny;
if (visited.has(key)) continue;
if (player.body.some(s => s.x===nx && s.y===ny)) continue;
if (obstacles.some(o => o.x===nx && o.y===ny)) continue;
visited.add(key); queue.push({x:nx,y:ny});
}
}
return true;
}

function killPlayer(player, reason) {
if (!player || !player.alive) return;
player.alive = false;
vibrate([500, 150, 500, 150, 500]);
shakeAmount = 35;
if (player.body && player.body.length) {
player.body.forEach((s,i) => { if (s && i%2===0) spawnParticles(s.x, s.y, player.id === 'p1' ? '#00f5d4' : '#f15bb5'); });
}
if (gameMode === 'single') { gameOver(reason); return; }
const alive = snakes.filter(p => p.alive);
if (alive.length <= 1) {
const winner = alive[0];
if (winner) gameOver(reason + ' · ' + winner.id.toUpperCase() + ' 获胜！');
else gameOver(reason + ' · 平局！');
}
}

function gameOver(reason) {
if (isGameOver) return;
isGameOver = true; isDying = true;
if (gameMode === 'single') { totalScoreAccum += score; }
else { snakes.forEach(p => totalScoreAccum += (p.score || 0)); }
saveAchievements(); checkAchievements();
setTimeout(() => {
isDying = false;
stopLoop();
overlayTitle.textContent = '修炼失败';
overlayMsg.textContent = (reason || '本局结束') + (gameMode === 'single' && snakes[0] && snakes[0].body ? (' · 积分 '+score+' · 体长 '+snakes[0].body.length) : '');
startBtn.textContent = '再次入世';
overlay.classList.remove('hidden');
playBgm('menu');
setTimeout(() => {
const el = document.getElementById('aiComment');
if (el && typeof generateAIComment === 'function') {
generateAIComment(buildAIPrompt(), el);
}
}, 200);
}, 1200);
}

function update() {
if (isPaused || isGameOver) return;
if (specialFood) { specialFoodTimer -= speed; if (specialFoodTimer <= 0) { specialFood = null; specialFoodTimer = 0; specialFoodCooldown = 2000; } }
if (specialFoodCooldown > 0) { specialFoodCooldown -= speed; if (specialFoodCooldown < 0) specialFoodCooldown = 0; }
if (portals.length > 0) {
const pairsToRemove = new Set();
portals.forEach(p => { p.timer -= speed; if (p.timer <= 0) pairsToRemove.add(p.pairId); });
if (pairsToRemove.size > 0) portals = portals.filter(p => !pairsToRemove.has(p.pairId));
}
if (!catActive && catModeEnabled && gameMode === 'single' && score >= CAT_ACTIVATE_SCORE) spawnCat();
const alivePlayers = snakes.filter(p => p.alive);
if (alivePlayers.length === 0) return;
for (let idx = 0; idx < snakes.length; idx++) {
const p = snakes[idx];
if (!p.alive) continue;
if (!p.body || p.body.length === 0) continue;
snake = p.body; direction = p.dir; nextDirection = p.nextDir; currentPlayer = p;
let curSpeed = speed;
if (p.speedBoost > 0) curSpeed = speed * 0.6;
p.survivalTime += curSpeed / 1000;
direction = { ...nextDirection };
if (!snake[0]) continue;
const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
if (p.shield) { p.shield = false; showCheatToast('🛡️ 护盾抵挡了墙壁！'); p.dir = direction; p.nextDir = nextDirection; continue; }
else { killPlayer(p, '撞墙了'); continue; }
}
const enteredPortal = portals.find(pt => pt.x === head.x && pt.y === head.y);
if (enteredPortal) {
const pair = portals.find(pt => pt.pairId === enteredPortal.pairId && (pt.x !== enteredPortal.x || pt.y !== enteredPortal.y));
if (pair) {
head.x = pair.x; head.y = pair.y;
vibrate([60,30,60]); shakeAmount = 15;
spawnParticles(enteredPortal.x, enteredPortal.y, enteredPortal.color);
spawnParticles(pair.x, pair.y, pair.color);
showCheatToast('🌀 传送门穿越！');
}
}
if (obstacles.some(o => o.x === head.x && o.y === head.y)) {
if (p.shield) {
p.shield = false;
obstacles = obstacles.filter(o => !(o.x === head.x && o.y === head.y));
showCheatToast('🛡️ 护盾撞碎了石头！');
p.dir = direction; p.nextDir = nextDirection; continue;
} else { killPlayer(p, '撞到石头了'); continue; }
}
if (snake.some(s => s.x === head.x && s.y === head.y)) {
if (p.shield) { p.shield = false; showCheatToast('🛡️ 护盾抵挡了自咬！'); p.dir = direction; p.nextDir = nextDirection; continue; }
else { killPlayer(p, '咬到自己了'); continue; }
}
let hitOther = false;
for (let j = 0; j < snakes.length; j++) {
if (j === idx) continue;
const other = snakes[j];
if (!other.alive || !other.body) continue;
if (other.body.some(s => s.x === head.x && s.y === head.y)) { hitOther = true; break; }
}
if (hitOther) {
if (p.shield) { p.shield = false; showCheatToast('🛡️ 护盾抵挡了对方！'); p.dir = direction; p.nextDir = nextDirection; continue; }
else { killPlayer(p, '撞到对方了'); continue; }
}
snake.unshift(head);
let ateSomething = false;
if (head.x === food.x && head.y === food.y) {
ateSomething = true; p.foodsEaten++;
vibrate([100,40,100]); shakeAmount = 18;
playEatSound(p.id, false);
let baseScore = 10;
if (p.speedBoost > 0) baseScore *= 2;
p.score += baseScore;
if (gameMode === 'single') score = p.score;
if (p.id === 'p1') scoreEl.textContent = p.score; else score2El.textContent = p.score;
p.maxLen = Math.max(p.maxLen, snake.length);
const isCorner = (food.x===0||food.x===COLS-1) && (food.y===0||food.y===ROWS-1);
if (isCorner) p.cornerEaten.add(food.x+','+food.y);
if (curSpeed <= MIN_SPEED+5) p.fastEats++;
showScorePop(food.x, food.y, p.id);
spawnParticles(food.x, food.y, '#ff6b6b'); spawnParticles(food.x, food.y, '#00f5d4');
placeFood();
if (!specialFood && Math.random() < 0.35) spawnSpecialFood();
if (p.foodsEaten % 3 === 0) trySpawnObstacle();
if (p.foodsEaten % 15 === 0) trySpawnPortal();
if (gameMode === 'single' && p.score > highScore) { highScore = p.score; highScoreEl.textContent = highScore; localStorage.setItem(HIGH_KEY, highScore); }
if (gameMode === 'double' && p.score >= WIN_SCORE) { const other = snakes.find(x=>x.id!==p.id); if (other) killPlayer(other, p.id.toUpperCase() + ' 率先到达 300 分'); }
lengthEl.textContent = p.body.length;
} else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
ateSomething = true; p.foodsEaten++;
vibrate([100,50,100]); shakeAmount = 22;
playEatSound(p.id, true);
let baseScore = 10;
if (p.speedBoost > 0) baseScore *= 2;
if (specialFood.type === 'gold') { baseScore = 20; showCheatToast('💰 金元宝！积分双倍！'); }
else if (specialFood.type === 'speed') { p.speedBoost = 5000; showCheatToast('⚡ 加速药水！速度提升，分数翻倍！'); }
else if (specialFood.type === 'shield') { p.shield = true; showCheatToast('🛡️ 护盾铃铛！免疫一次死亡！'); }
else if (specialFood.type === 'shrink') { const newLen = Math.max(3, Math.floor(snake.length/2)); p.body = snake.slice(0, newLen); snake = p.body; lengthEl.textContent = p.body.length; showCheatToast('🧪 缩小药水！身体缩短一半！'); }
p.score += baseScore;
if (gameMode === 'single') score = p.score;
if (p.id === 'p1') scoreEl.textContent = p.score; else score2El.textContent = p.score;
p.maxLen = Math.max(p.maxLen, p.body.length);
showScorePop(specialFood.x, specialFood.y, p.id);
spawnParticles(specialFood.x, specialFood.y, '#ffaa00'); spawnParticles(specialFood.x, specialFood.y, '#ffffff');
if (gameMode === 'single' && p.score > highScore) { highScore = p.score; highScoreEl.textContent = highScore; localStorage.setItem(HIGH_KEY, highScore); }
if (gameMode === 'double' && p.score >= WIN_SCORE) { const other = snakes.find(x=>x.id!==p.id); if (other) killPlayer(other, p.id.toUpperCase() + ' 率先到达 300 分'); }
specialFood = null; specialFoodTimer = 0; specialFoodCooldown = 3000;
}
if (!ateSomething && snake.length > 0) snake.pop();
p.body = snake; p.dir = direction; p.nextDir = nextDirection;
if (snake.length > 0) {
p.ghostTrail.push(snake.map(s => ({x:s.x, y:s.y})));
if (p.ghostTrail.length > 22) p.ghostTrail.shift();
}
}
if (snakes[0]) {
maxLengthReached = snakes[0].maxLen;
foodsEaten = snakes[0].foodsEaten;
fastEats = snakes[0].fastEats;
survivalTime = Math.floor(snakes[0].survivalTime);
cornerEaten = snakes[0].cornerEaten;
}
updateCat();
if (catActive && cat && isCatTrapped()) {
const cx = cat.x, cy = cat.y;
catActive = false; cat = null; catTrail = []; catBiteLosses = 0;
vibrate([200,100,200]); shakeAmount = 25;
const p = snakes[0];
if (p) {
p.score += 50;
if (gameMode === 'single') score = p.score;
scoreEl.textContent = p.score;
if (gameMode === 'single' && p.score > highScore) { highScore = p.score; highScoreEl.textContent = highScore; localStorage.setItem(HIGH_KEY, highScore); }
}
showCheatToast('🎉 你围死了野猫！奖励 50 分！');
spawnParticles(cx, cy, '#ffaa00'); spawnParticles(cx, cy, '#ff4444');
}
const aliveNow = snakes.filter(p => p.alive);
if (gameMode === 'double' && aliveNow.length <= 1) {
if (aliveNow.length === 1) gameOver('对手已阵亡 · ' + aliveNow[0].id.toUpperCase() + ' 获胜！');
else gameOver('双方阵亡 · 平局！');
}
}

function showScorePop(gx, gy, playerId) {
const pop = document.createElement('div');
pop.className = 'score-pop'; pop.textContent = '+10';
pop.style.left = ((gx+0.5)/COLS*100)+'%';
pop.style.top = ((gy+0.5)/ROWS*100)+'%';
if (playerId === 'p2') pop.style.color = '#f15bb5';
const inner = document.querySelector('.canvas-inner');
if (inner) inner.appendChild(pop);
setTimeout(()=>pop.remove(), 850);
}

function draw() {
ctx.save();
let shakeX=0, shakeY=0;
if (shakeAmount > 0.1) { shakeX = (Math.random()-0.5)*shakeAmount; shakeY = (Math.random()-0.5)*shakeAmount; shakeAmount *= 0.90; } else { shakeAmount = 0; }
ctx.translate(shakeX, shakeY);
const boardSkin = SKINS[boardSkinId] || SKINS.default;
if (isWarmSkin(boardSkinId)) {
drawWarmBoard(boardSkinId);
} else {
ctx.fillStyle = boardSkin.boardBg; ctx.fillRect(0,0,LOGICAL_SIZE,LOGICAL_SIZE);
ctx.strokeStyle = boardSkin.gridColor; ctx.lineWidth = 1.2;
for (let i=0; i<=COLS; i++) { ctx.beginPath(); ctx.moveTo(i*GRID,0); ctx.lineTo(i*GRID,LOGICAL_SIZE); ctx.stroke(); }
for (let i=0; i<=ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*GRID); ctx.lineTo(LOGICAL_SIZE,i*GRID); ctx.stroke(); }
}
obstacles.forEach(o => drawObstacle(o));
portals.forEach(p => drawPortal(p));
foodPulse += 0.09;
drawFood(food, boardSkin);
if (specialFood) drawSpecialFood(specialFood);
snakes.forEach((p, idx) => {
if (!p.alive || !p.body || p.body.length === 0) return;
snake = p.body;
drawPlayer(p, idx);
});
snakes.forEach(p => { if (p.alive && p.shield && p.body && p.body[0]) drawShield(p); });
if (catActive && cat) drawCat();
particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill(); });
ctx.globalAlpha = 1;
ctx.restore();
}

function drawWarmBoard(skinId) {
const light = skinId==='niu'?'#faf0dc':(skinId==='hu'?'#fff4e6':(skinId==='tu'?'#fff5f5':(skinId==='long'?'#f0faf5':(skinId==='she'?'#f2fbf0':(skinId==='ma'?'#fff8f0':(skinId==='yang'?'#f5f0ff':'#f8edd8'))))));
const dark = skinId==='niu'?'#f0e0c0':(skinId==='hu'?'#ffe4cc':(skinId==='tu'?'#ffe4e8':(skinId==='long'?'#d4f0e5':(skinId==='she'?'#d9f0d4':(skinId==='ma'?'#f5e8d8':(skinId==='yang'?'#e8ddf5':'#f0e0c0'))))));
for (let gy=0; gy<ROWS; gy++) for (let gx=0; gx<COLS; gx++) { ctx.fillStyle = (gx+gy)%2===0 ? light : dark; ctx.fillRect(gx*GRID, gy*GRID, GRID, GRID); }
ctx.strokeStyle = skinId==='hu'?'rgba(230,160,100,0.35)':(skinId==='tu'?'rgba(255,150,170,0.35)':(skinId==='long'?'rgba(100,200,180,0.35)':(skinId==='she'?'rgba(130,200,120,0.35)':(skinId==='ma'?'rgba(210,170,130,0.35)':(skinId==='yang'?'rgba(180,140,200,0.35)':'rgba(200,170,120,0.35)')))));
ctx.lineWidth = 0.8;
for (let i=0; i<=COLS; i++) { ctx.beginPath(); ctx.moveTo(i*GRID,0); ctx.lineTo(i*GRID,LOGICAL_SIZE); ctx.stroke(); }
for (let i=0; i<=ROWS; i++) { ctx.beginPath(); ctx.moveTo(0,i*GRID); ctx.lineTo(LOGICAL_SIZE,i*GRID); ctx.stroke(); }
if (skinId === 'shu') {
ctx.fillStyle = 'rgba(180,140,90,0.28)';
const paws = [[2,3],[6,10],[11,5],[17,14],[8,20],[23,8],[4,25],[20,22],[14,11],[26,17],[9,7],[18,26]];
paws.forEach(([gx,gy]) => { const cx=gx*GRID+GRID/2, cy=gy*GRID+GRID/2; ctx.beginPath(); ctx.arc(cx,cy,3.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx-3.8,cy-2.8,1.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+3.8,cy-2.8,1.8,0,Math.PI*2); ctx.fill(); });
ctx.fillStyle = 'rgba(255,190,60,0.4)';
[[5,6],[12,18],[19,4],[25,12],[3,16],[15,25],[22,20]].forEach(([gx,gy]) => { const cx=gx*GRID+GRID/2, cy=gy*GRID+GRID/2; ctx.beginPath(); for (let s=0;s<5;s++){const a=(s*4*Math.PI/5)-Math.PI/2; const r=s%2===0?3.5:1.5; ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);} ctx.closePath(); ctx.fill(); });
} else if (skinId === 'niu') {
const grassSpots = [[3,4],[8,12],[15,6],[21,18],[5,22],[24,9],[10,25],[18,3],[26,15],[12,16],[1,10],[28,5]];
const leafPath = (w,h) => { ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-w/2,-h*0.22,-w/2,-h*0.74,0,-h); ctx.bezierCurveTo(w/2,-h*0.74,w/2,-h*0.22,0,0); ctx.closePath(); };
const bladeSet = [{x:-5.5,h:7.5,w:4.2,rot:-0.78,c1:'#b9dd7b',c2:'#79ad3c'},{x:5.5,h:7.5,w:4.2,rot:0.78,c1:'#b9dd7b',c2:'#79ad3c'},{x:-3,h:10.5,w:4.8,rot:-0.40,c1:'#c2e385',c2:'#84b945'},{x:3,h:10.5,w:4.8,rot:0.40,c1:'#c2e385',c2:'#84b945'},{x:0,h:14,w:5.4,rot:0,c1:'#cbe894',c2:'#8fc44e'}];
grassSpots.forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2+6; ctx.save(); ctx.translate(bx,by); ctx.scale(0.9,0.9); ctx.lineJoin='round'; ctx.fillStyle='rgba(150,120,60,0.20)'; ctx.beginPath(); ctx.ellipse(2,1,8.5,2.6,0,0,Math.PI*2); ctx.fill(); bladeSet.forEach(b => { ctx.save(); ctx.translate(b.x,0); ctx.rotate(b.rot); leafPath(b.w,b.h); ctx.fillStyle='#fffdf5'; ctx.strokeStyle='#fffdf5'; ctx.lineWidth=3.4; ctx.fill(); ctx.stroke(); ctx.restore(); }); bladeSet.forEach(b => { ctx.save(); ctx.translate(b.x,0); ctx.rotate(b.rot); leafPath(b.w,b.h); ctx.strokeStyle='#fffdf5'; ctx.lineWidth=2.2; ctx.stroke(); const lg=ctx.createLinearGradient(-b.w/2,0,b.w/2,0); lg.addColorStop(0,b.c1); lg.addColorStop(1,b.c2); leafPath(b.w,b.h); ctx.fillStyle=lg; ctx.fill(); ctx.restore(); }); ctx.restore(); });
} else if (skinId === 'hu') {
[[2,5],[7,14],[14,3],[20,18],[24,7],[10,25],[18,10],[5,21]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(TIGER_ASSETS.leaf,bx,by,GRID*1.6)) { ctx.fillStyle='rgba(255,140,0,0.5)'; ctx.beginPath(); ctx.arc(bx,by,8,0,Math.PI*2); ctx.fill(); } });
} else if (skinId === 'tu') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(RABBIT_ASSETS.paw,bx,by,GRID*1.4)) { ctx.fillStyle='rgba(255,182,193,0.6)'; ctx.beginPath(); ctx.arc(bx,by,7,0,Math.PI*2); ctx.fill(); } });
} else if (skinId === 'long') {
[[3,5],[8,15],[15,4],[22,17],[5,23],[25,8],[11,26],[19,4],[27,14],[12,18],[2,11],[28,7]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(DRAGON_ASSETS.decor,bx,by,GRID*1.5)) { ctx.fillStyle='rgba(200,240,220,0.6)'; ctx.beginPath(); ctx.arc(bx-6,by,5,0,Math.PI*2); ctx.arc(bx,by-4,6,0,Math.PI*2); ctx.arc(bx+6,by,5,0,Math.PI*2); ctx.arc(bx,by+3,5,0,Math.PI*2); ctx.fill(); } });
} else if (skinId === 'she') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy], idx) => {
const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2;
if (idx%2===0) { if (!drawImageHelper(SNAKE_ASSETS.drop,bx,by,GRID*1.3)) { ctx.fillStyle='rgba(180,230,255,0.6)'; ctx.beginPath(); ctx.ellipse(bx,by,5,7,0,0,Math.PI*2); ctx.fill(); } }
else { if (!drawImageHelper(SNAKE_ASSETS.leaf,bx,by,GRID*1.3)) { ctx.fillStyle='rgba(150,220,130,0.6)'; ctx.beginPath(); ctx.ellipse(bx,by,5,8,0.5,0,Math.PI*2); ctx.fill(); } }
});
} else if (skinId === 'ma') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(HORSE_ASSETS.decor,bx,by,GRID*1.4)) { ctx.fillStyle='#ffb347'; ctx.beginPath(); ctx.arc(bx,by,6,0,Math.PI*2); ctx.fill(); } });
} else if (skinId === 'yang') {
[[3,4],[9,12],[16,5],[22,18],[6,22],[25,9],[11,25],[19,3],[27,15],[13,16],[2,10],[29,6]].forEach(([gx,gy]) => { const bx=gx*GRID+GRID/2; const by=gy*GRID+GRID/2; if (!drawImageHelper(SHEEP_ASSETS.decor,bx,by,GRID*1.4)) { ctx.fillStyle='#c8a8e8'; ctx.beginPath(); ctx.moveTo(bx-5,by+3); ctx.quadraticCurveTo(bx-6,by-5,bx,by-6); ctx.quadraticCurveTo(bx+6,by-5,bx+5,by+3); ctx.closePath(); ctx.fill(); } });
}
}

function drawObstacle(o) {
const bx = o.x * GRID + GRID/2, by = o.y * GRID + GRID/2;
ctx.fillStyle = 'rgba(0,0,0,0.4)';
ctx.beginPath(); ctx.ellipse(bx, by + GRID*0.38, GRID*0.42, GRID*0.15, 0, 0, Math.PI*2); ctx.fill();
const stoneGrad = ctx.createRadialGradient(bx - GRID*0.2, by - GRID*0.25, 2, bx, by, GRID*0.6);
stoneGrad.addColorStop(0, '#9a9aa6'); stoneGrad.addColorStop(0.55, '#5a5a66'); stoneGrad.addColorStop(1, '#33333d');
ctx.fillStyle = stoneGrad;
const pts = [[-0.45,-0.15],[-0.30,-0.42],[0.05,-0.45],[0.35,-0.30],[0.45,0.05],[0.30,0.40],[-0.05,0.45],[-0.35,0.30],[-0.45,0.10]];
ctx.beginPath();
pts.forEach((p, i) => { if (i===0) ctx.moveTo(bx+p[0]*GRID, by+p[1]*GRID); else ctx.lineTo(bx+p[0]*GRID, by+p[1]*GRID); });
ctx.closePath(); ctx.fill();
ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
ctx.fillStyle = 'rgba(255,255,255,0.28)';
ctx.beginPath(); ctx.arc(bx - GRID*0.15, by - GRID*0.18, GRID*0.1, 0, Math.PI*2); ctx.fill();
}

function drawPortal(p) {
const px = p.x * GRID + GRID/2, py = p.y * GRID + GRID/2;
const rotation = performance.now()/1000 * 2;
const pulse = 0.9 + Math.sin(performance.now()/1000 * 4) * 0.1;
const glow = ctx.createRadialGradient(px, py, GRID*0.1, px, py, GRID*0.95);
glow.addColorStop(0, p.color + 'ff'); glow.addColorStop(0.5, p.color + '88'); glow.addColorStop(1, p.color + '00');
ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(px, py, GRID*0.95, 0, Math.PI*2); ctx.fill();
ctx.save(); ctx.translate(px, py); ctx.rotate(rotation);
ctx.strokeStyle = p.color; ctx.lineWidth = 2.5;
ctx.beginPath(); ctx.arc(0, 0, GRID*0.42*pulse, 0, Math.PI*1.5); ctx.stroke();
ctx.rotate(-rotation*1.7);
ctx.beginPath(); ctx.arc(0, 0, GRID*0.28*pulse, 0, Math.PI*1.2); ctx.stroke();
ctx.restore();
ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, GRID*0.1, 0, Math.PI*2); ctx.fill();
const timerRatio = Math.max(0, p.timer/PORTAL_DURATION);
ctx.beginPath(); ctx.arc(px, py, GRID*0.62, -Math.PI/2, -Math.PI/2 + Math.PI*2*timerRatio);
ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
}

function drawFood(fd, boardSkin) {
if (!fd) return;
const pulse = 0.82 + Math.sin(foodPulse)*0.18;
const fx = fd.x*GRID + GRID/2, fy = fd.y*GRID + GRID/2, fc = boardSkin.foodColors || ['#ff9a9a','#ff6b6b','#e03131'];
const glow = ctx.createRadialGradient(fx,fy,2,fx,fy,GRID*1.3);
glow.addColorStop(0, 'rgba(255,200,50,'+(0.4*pulse)+')'); glow.addColorStop(1, 'rgba(255,200,50,0)');
ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(fx,fy,GRID*1.3,0,Math.PI*2); ctx.fill();
if (boardSkinId === 'shu') {
ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.15,pulse*1.15);
ctx.fillStyle='#ffd54a'; ctx.beginPath(); ctx.moveTo(-2,-9); ctx.lineTo(10,6); ctx.lineTo(-10,6); ctx.closePath(); ctx.fill();
ctx.fillStyle='#e6b800'; ctx.beginPath(); ctx.moveTo(-2,-9); ctx.lineTo(-10,6); ctx.lineTo(-8,8); ctx.lineTo(0,-7); ctx.closePath(); ctx.fill();
ctx.fillStyle='#ffe9a0'; ctx.beginPath(); ctx.arc(-1,0,2.4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(3.5,3,1.8,0,Math.PI*2); ctx.fill();
ctx.restore();
} else if (boardSkinId === 'niu') {
ctx.save(); ctx.translate(fx,fy); ctx.rotate(Math.sin(foodPulse*1.3)*0.10-0.18); ctx.scale(pulse*1.08,pulse*1.08); ctx.lineJoin='round';
const BELL_LINE='#7a4a1a';
const bellPath = () => { ctx.beginPath(); ctx.moveTo(-7,3.5); ctx.bezierCurveTo(-7.6,-5,-4,-9,0,-9); ctx.bezierCurveTo(4,-9,7.6,-5,7,3.5); ctx.quadraticCurveTo(0,6.6,-7,3.5); ctx.closePath(); };
ctx.fillStyle='#fffdf5'; ctx.strokeStyle='#fffdf5'; ctx.lineWidth=3.2;
ctx.beginPath(); ctx.arc(0,-11,3.1,0,Math.PI*2); ctx.fill(); ctx.stroke(); bellPath(); ctx.fill(); ctx.stroke();
const bellFill = ctx.createLinearGradient(-5,-9,5,6); bellFill.addColorStop(0,'#ffefb0'); bellFill.addColorStop(0.42,'#ffce3d'); bellFill.addColorStop(1,'#ef9c05');
bellPath(); ctx.fillStyle=bellFill; ctx.fill(); bellPath(); ctx.strokeStyle=BELL_LINE; ctx.lineWidth=1.5; ctx.stroke();
ctx.beginPath(); ctx.arc(0,5.6,2.5,0,Math.PI*2); ctx.fillStyle='#ffd75e'; ctx.fill(); ctx.strokeStyle=BELL_LINE; ctx.lineWidth=1.3; ctx.stroke();
ctx.restore();
} else if (boardSkinId === 'hu') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(TIGER_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ff9b7a'; ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (boardSkinId === 'tu') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(RABBIT_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ff8c00'; ctx.beginPath(); ctx.moveTo(0,-10); ctx.quadraticCurveTo(8,-2,0,12); ctx.quadraticCurveTo(-8,-2,0,-10); ctx.fill(); } ctx.restore(); }
else if (boardSkinId === 'long') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(DRAGON_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (boardSkinId === 'she') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(SNAKE_ASSETS.food,0,0,GRID*1.9)) { ctx.fillStyle='#8b5a2b'; ctx.beginPath(); ctx.ellipse(0,2,9,10,0,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (boardSkinId === 'ma') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(HORSE_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#8b5a2b'; ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (boardSkinId === 'yang') { ctx.save(); ctx.translate(fx,fy); ctx.scale(pulse*1.1,pulse*1.1); if (!drawImageHelper(SHEEP_ASSETS.food,0,0,GRID*1.8)) { ctx.fillStyle='#ffb6c1'; ctx.fillRect(-8,-8,16,16); ctx.fillStyle='#ffe4a0'; ctx.fillRect(-8,-5,16,4); ctx.fillStyle='#b8e6b8'; ctx.fillRect(-8,-1,16,4); } ctx.restore(); }
else {
const foodGrad = ctx.createRadialGradient(fx-4,fy-4,1,fx,fy,GRID/2-1);
foodGrad.addColorStop(0, fc[0]); foodGrad.addColorStop(0.55, fc[1]); foodGrad.addColorStop(1, fc[2]);
ctx.fillStyle = foodGrad; ctx.beginPath(); ctx.arc(fx,fy,(GRID/2-2.5)*pulse,0,Math.PI*2); ctx.fill();
}
}

function drawSpecialFood(sf) {
const sfx = sf.x*GRID + GRID/2, sfy = sf.y*GRID + GRID/2;
const sPulse = 0.9 + Math.sin(foodPulse*1.6)*0.15;
const sGlow = ctx.createRadialGradient(sfx,sfy,2,sfx,sfy,GRID*1.6);
sGlow.addColorStop(0,'rgba(255,255,255,0.6)'); sGlow.addColorStop(1,'rgba(255,255,255,0)');
ctx.fillStyle = sGlow; ctx.beginPath(); ctx.arc(sfx,sfy,GRID*1.6,0,Math.PI*2); ctx.fill();
const timerRatio = Math.max(0, specialFoodTimer / SPECIAL_FOOD_DURATION);
let rR, rG, rB;
if (timerRatio > 0.5) { const t = (timerRatio-0.5)/0.5; rR = Math.floor(255*(1-t)); rG = 255; rB = 0; }
else { const t = timerRatio/0.5; rR = 255; rG = Math.floor(255*t); rB = 0; }
ctx.beginPath(); ctx.arc(sfx, sfy, GRID*0.85, -Math.PI/2, -Math.PI/2 + Math.PI*2*timerRatio);
ctx.strokeStyle = 'rgba('+rR+','+rG+','+rB+',0.95)'; ctx.lineWidth = 3.5; ctx.stroke();
ctx.save(); ctx.translate(sfx,sfy); ctx.scale(sPulse,sPulse);
if (sf.type === 'gold') {
ctx.fillStyle='#ffd700'; ctx.beginPath(); ctx.ellipse(0,0,10,7,0,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#ffaa00'; ctx.beginPath(); ctx.ellipse(0,2,8,4,0,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#ffef99'; ctx.beginPath(); ctx.ellipse(-2,-2,4,2.5,0,0,Math.PI*2); ctx.fill();
} else if (sf.type === 'speed') {
ctx.fillStyle='#ffe14d'; ctx.strokeStyle='#b37b00'; ctx.lineWidth=1;
ctx.beginPath(); ctx.moveTo(2,-10); ctx.lineTo(-5,1); ctx.lineTo(-1,1); ctx.lineTo(-3,10); ctx.lineTo(5,-1); ctx.lineTo(1,-1); ctx.closePath(); ctx.fill(); ctx.stroke();
} else if (sf.type === 'shield') {
ctx.fillStyle='#5bc0ff'; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5;
ctx.beginPath(); ctx.moveTo(0,-10); ctx.lineTo(9,-6); ctx.lineTo(9,2); ctx.quadraticCurveTo(9,9,0,11); ctx.quadraticCurveTo(-9,9,-9,2); ctx.lineTo(-9,-6); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.strokeStyle='#ffffff'; ctx.lineWidth=2;
ctx.beginPath(); ctx.moveTo(0,-6); ctx.lineTo(0,6); ctx.stroke();
ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(5,0); ctx.stroke();
} else if (sf.type === 'shrink') {
ctx.fillStyle='#9b5de5'; ctx.strokeStyle='#4a1d80'; ctx.lineWidth=1;
ctx.beginPath(); ctx.moveTo(-4,-10); ctx.lineTo(4,-10); ctx.lineTo(4,-5); ctx.lineTo(6,-2); ctx.lineTo(6,9); ctx.quadraticCurveTo(6,11,4,11); ctx.lineTo(-4,11); ctx.quadraticCurveTo(-6,11,-6,9); ctx.lineTo(-6,-2); ctx.lineTo(-4,-5); ctx.closePath(); ctx.fill(); ctx.stroke();
ctx.fillStyle='#d0a0ff';
ctx.beginPath(); ctx.moveTo(-5,-1); ctx.lineTo(5,-1); ctx.lineTo(5,9); ctx.quadraticCurveTo(5,10,4,10); ctx.lineTo(-4,10); ctx.quadraticCurveTo(-5,10,-5,9); ctx.closePath(); ctx.fill();
}
ctx.restore();
}

// ★★★ 绘制玩家：鼠头鼠身牛身已还原 ★★★
function drawPlayer(p, idx) {
if (!p || !p.body || p.body.length === 0) return;
const pSkinId = p.skinId || 'default';
const pSkin = SKINS[pSkinId] || SKINS.default;
const bodyHue = p.bodyHue;
const headColors = p.headColors;
const ghostColor = p.id === 'p1' ? getGhostColorP1(p.score) : getGhostColorP2(p.score);

p.ghostTrail.forEach((gs, index) => {
if (!gs || gs.length === 0) return;
const t = (index+1)/p.ghostTrail.length;
const alpha = t*0.35; const scale = t;
ctx.globalAlpha = alpha;
ctx.globalCompositeOperation = 'lighter';
ctx.strokeStyle = 'rgba('+ghostColor.r+','+ghostColor.g+','+ghostColor.b+',1)';
ctx.lineWidth = GRID*(0.18 + 0.32*scale);
ctx.lineCap = 'round'; ctx.lineJoin = 'round';
ctx.beginPath();
gs.forEach((seg, i) => {
if (!seg) return;
const gx = seg.x*GRID+GRID/2; const gy = seg.y*GRID+GRID/2;
if (i===0) ctx.moveTo(gx,gy);
else { const prev = gs[i-1]; if (!prev) return; const px = prev.x*GRID+GRID/2; const py = prev.y*GRID+GRID/2; const midX = (px+gx)/2; const midY = (py+gy)/2; ctx.quadraticCurveTo(px,py,midX,midY); }
});
ctx.stroke();
ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
});

p.body.forEach((seg, i) => {
if (!seg) return;
const x = seg.x*GRID, y = seg.y*GRID, isHead = i===0;
const cx = x+GRID/2, cy = y+GRID/2;
if (isHead) {
if (pSkinId === 'shu') {
// 耳朵
ctx.fillStyle='#e8c9a0'; ctx.beginPath(); ctx.ellipse(cx-9,cy-8,7,8,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+9,cy-8,7,8,0.3,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#f5d5b5'; ctx.beginPath(); ctx.ellipse(cx-9,cy-8,4,5,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+9,cy-8,4,5,0.3,0,Math.PI*2); ctx.fill();
// 头部
const hg = ctx.createRadialGradient(cx-3,cy-3,2,cx,cy,12); hg.addColorStop(0,'#f0e0c8'); hg.addColorStop(1,'#d4b896');
ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(cx,cy,11,0,Math.PI*2); ctx.fill();
// 腮红
ctx.fillStyle='rgba(255,160,140,0.45)'; ctx.beginPath(); ctx.ellipse(cx-7,cy+3,3.5,2.5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+7,cy+3,3.5,2.5,0,0,Math.PI*2); ctx.fill();
// 眼睛
ctx.fillStyle='#4a3020'; ctx.beginPath(); ctx.arc(cx-4,cy-1,2.8,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4,cy-1,2.8,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-3.2,cy-1.8,1.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.8,cy-1.8,1.1,0,Math.PI*2); ctx.fill();
// 鼻子
ctx.fillStyle='#e89a8a'; ctx.beginPath(); ctx.ellipse(cx,cy+4,2.2,1.6,0,0,Math.PI*2); ctx.fill();
// 胡须
ctx.strokeStyle='rgba(80,50,30,0.55)'; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(cx-3,cy+3); ctx.lineTo(cx-12,cy+1); ctx.moveTo(cx-3,cy+5); ctx.lineTo(cx-11,cy+6); ctx.moveTo(cx+3,cy+3); ctx.lineTo(cx+12,cy+1); ctx.moveTo(cx+3,cy+5); ctx.lineTo(cx+11,cy+6); ctx.stroke();
} else if (pSkinId === 'niu') {
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
} else if (pSkinId === 'hu') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(TIGER_ASSETS.head,0,0,GRID*1.9)) { ctx.fillStyle='#f5b06c'; ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (pSkinId === 'tu') { if (!drawImageHelper(RABBIT_ASSETS.head,cx,cy,GRID*1.9)) { ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (pSkinId === 'long') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(DRAGON_ASSETS.head,0,0,GRID*2.0)) { ctx.fillStyle='#e0f5ec'; ctx.beginPath(); ctx.arc(0,0,13,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (pSkinId === 'she') { if (!drawImageHelper(SNAKE_ASSETS.head,cx,cy,GRID*1.9)) { ctx.fillStyle='#c5e8b8'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (pSkinId === 'ma') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(HORSE_ASSETS.head,0,0,GRID*1.9)) { ctx.fillStyle='#fdf0e0'; ctx.beginPath(); ctx.arc(0,0,11,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (pSkinId === 'yang') { ctx.save(); ctx.translate(cx,cy); if (direction.x===1) { ctx.scale(-1,1); } else if (direction.x===-1) {} else if (direction.y===-1) { ctx.rotate(Math.PI/2); } else if (direction.y===1) { ctx.rotate(-Math.PI/2); } if (!drawImageHelper(SHEEP_ASSETS.head,0,0,GRID*2.0)) { ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else { const headGlow = ctx.createRadialGradient(cx,cy,2,cx,cy,GRID*1.1); const glowCol = p.id === 'p2' ? 'rgba(241,91,181,' : 'rgba(0,245,212,'; headGlow.addColorStop(0, glowCol + '0.4)'); headGlow.addColorStop(1, glowCol + '0)'); ctx.fillStyle=headGlow; ctx.fillRect(x-5,y-5,GRID+10,GRID+10); const headGrad = ctx.createLinearGradient(x,y,x+GRID,y+GRID); headGrad.addColorStop(0, headColors[0]); headGrad.addColorStop(0.5, headColors[1]); headGrad.addColorStop(1, headColors[2]); ctx.fillStyle=headGrad; roundRect(ctx,x+1.5,y+1.5,GRID-3,GRID-3,7); ctx.fill(); }
} else {
if (pSkinId === 'shu') {
// 老鼠身体：完整版（圆身 + 耳朵 + 眼睛 + 腮红）
const scx=x+GRID/2, scy=y+GRID/2;
ctx.fillStyle='#f0e0c8'; ctx.beginPath(); ctx.arc(scx,scy,8.5,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#e8c9a0'; ctx.beginPath(); ctx.ellipse(scx-6,scy-5,3.5,4,-0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(scx+6,scy-5,3.5,4,0.2,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#5a4030'; ctx.beginPath(); ctx.arc(scx-3,scy-1,1.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(scx+3,scy-1,1.6,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(scx-2.5,scy-1.5,0.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(scx+3.5,scy-1.5,0.6,0,Math.PI*2); ctx.fill();
ctx.fillStyle='#e89a8a'; ctx.beginPath(); ctx.arc(scx,scy+2.5,1.3,0,Math.PI*2); ctx.fill();
} else if (pSkinId === 'niu') {
// 牛身体：完整奶瓶（瓶身 + 奶嘴盖 + 奶嘴头 + 奶液渐变）
const scx=x+GRID/2, scy=y+GRID/2;
let angle = -Math.PI/2;
if (i>0 && p.body[i-1]) { const prev = p.body[i-1]; angle = Math.atan2(prev.y-seg.y, prev.x-seg.x); }
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
} else if (pSkinId === 'hu') { if (!drawImageHelper(TIGER_ASSETS.body,cx,cy,GRID*1.8)) { ctx.fillStyle='#f5b06c'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (pSkinId === 'tu') { if (!drawImageHelper(RABBIT_ASSETS.body,cx,cy,GRID*1.9)) { ctx.fillStyle='#ffe4e8'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else if (pSkinId === 'long') { const head = p.body[0]; if (!head) return; const a2h = Math.atan2(head.y-seg.y, head.x-seg.x); ctx.save(); ctx.translate(cx,cy); ctx.rotate(a2h+Math.PI/2); if (!drawImageHelper(DRAGON_ASSETS.tail,0,0,GRID*1.9)) { ctx.fillStyle='#a8e6cf'; ctx.beginPath(); ctx.ellipse(0,0,12,9,0,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (pSkinId === 'she') { const head = p.body[0]; if (!head) return; const a2h = Math.atan2(head.y-seg.y, head.x-seg.x); ctx.save(); ctx.translate(cx,cy); ctx.rotate(a2h); if (Math.abs(a2h)>Math.PI/2) ctx.scale(1,-1); if (!drawImageHelper(SNAKE_ASSETS.tail,0,0,GRID*1.2)) { ctx.fillStyle='#c5e8b8'; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (pSkinId === 'ma') { const head = p.body[0]; if (!head) return; const a2h = Math.atan2(head.y-seg.y, head.x-seg.x); ctx.save(); ctx.translate(cx,cy); ctx.rotate(a2h+Math.PI/2); if (!drawImageHelper(HORSE_ASSETS.tail,0,0,GRID*1.9)) { ctx.fillStyle='#fdf0e0'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); } ctx.restore(); }
else if (pSkinId === 'yang') { if (!drawImageHelper(SHEEP_ASSETS.tail,cx,cy,GRID*1.9)) { ctx.fillStyle='#ffffff'; ctx.beginPath(); ctx.arc(cx,cy,12,0,Math.PI*2); ctx.fill(); } }
else {
const hue = p.bodyHue;
const t = i/Math.max(p.body.length-1,1);
ctx.fillStyle = 'rgb('+Math.floor(hue.r+t*40)+','+Math.floor(hue.g-t*60)+','+Math.floor(hue.b-t*40)+')';
const inset = 2.5+t*1.8; roundRect(ctx, x+inset, y+inset, GRID-inset*2, GRID-inset*2, 5.5); ctx.fill();
}
}
});
}

function getGhostColorP1(s) {
if (s < 80) return { r:0, g:245, b:212 };
if (s < 200) { const t = (s-80)/120; return { r:Math.floor(0+t*255), g:Math.floor(245-t*100), b:Math.floor(212-t*150) }; }
if (s < 400) { const t = (s-200)/200; return { r:255, g:Math.floor(145-t*100), b:Math.floor(62+t*50) }; }
if (s < 700) { const t = (s-400)/300; return { r:Math.floor(255-t*100), g:Math.floor(45-t*45), b:Math.floor(112+t*143) }; }
return { r:155, g:0, b:255 };
}
function getGhostColorP2(s) {
if (s < 80) return { r:255, g:158, b:199 };
if (s < 200) { const t = (s-80)/120; return { r:255, g:Math.floor(158-t*67), b:Math.floor(199+t*56) }; }
return { r:155, g:0, b:255 };
}

function drawShield(p) {
if (!p || !p.body || !p.body[0]) return;
const hx = p.body[0].x * GRID + GRID/2;
const hy = p.body[0].y * GRID + GRID/2;
const shieldPulse = 0.85 + Math.sin(foodPulse * 2.5) * 0.15;
const shieldRadius = GRID * 1.1 * shieldPulse;
ctx.save();
ctx.globalAlpha = 0.75;
const shGlow = ctx.createRadialGradient(hx, hy, GRID*0.3, hx, hy, shieldRadius*1.7);
shGlow.addColorStop(0, 'rgba(0,255,200,0.55)'); shGlow.addColorStop(0.6, 'rgba(0,200,255,0.25)'); shGlow.addColorStop(1, 'rgba(0,200,255,0)');
ctx.fillStyle = shGlow; ctx.beginPath(); ctx.arc(hx, hy, shieldRadius*1.7, 0, Math.PI*2); ctx.fill();
ctx.strokeStyle = 'rgba(100,255,220,0.95)'; ctx.lineWidth = 2.5;
ctx.beginPath(); ctx.arc(hx, hy, shieldRadius, 0, Math.PI*2); ctx.stroke();
ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.3;
ctx.beginPath(); ctx.arc(hx, hy, shieldRadius*0.78, 0, Math.PI*2); ctx.stroke();
ctx.restore();
}

function drawCat() {
if (!cat) return;
const catCX = cat.x*GRID+GRID/2, catCY = cat.y*GRID+GRID/2;
ctx.save(); ctx.globalAlpha = 0.35;
const catGlow = ctx.createRadialGradient(catCX,catCY,4,catCX,catCY,GRID*1.8);
catGlow.addColorStop(0,'rgba(255,80,80,0.7)'); catGlow.addColorStop(1,'rgba(255,80,80,0)');
ctx.fillStyle = catGlow; ctx.beginPath(); ctx.arc(catCX,catCY,GRID*1.8,0,Math.PI*2); ctx.fill();
ctx.restore();
catTrail.forEach((ct, ci) => {
if (!ct) return;
const ctAlpha = (ci+1)/catTrail.length*0.2;
ctx.globalAlpha = ctAlpha; ctx.fillStyle = 'rgba(255,60,60,0.5)';
ctx.beginPath(); ctx.arc(ct.x*GRID+GRID/2, ct.y*GRID+GRID/2, GRID*0.4, 0, Math.PI*2); ctx.fill();
});
ctx.globalAlpha = 1;
ctx.save(); ctx.translate(catCX, catCY);
if (cat.dir.x === 1) ctx.scale(-1,1);
else if (cat.dir.x === -1) {}
else if (cat.dir.y === -1) ctx.rotate(Math.PI/2);
else if (cat.dir.y === 1) ctx.rotate(-Math.PI/2);
if (!drawImageHelper(CAT_ASSET,0,0,GRID*1.9)) {
ctx.fillStyle='#ff5555'; ctx.beginPath(); ctx.arc(0,0,GRID*0.45,0,Math.PI*2); ctx.fill();
}
ctx.restore();
}

function togglePause() {
if (isGameOver) { startGame(); return; }
if (!loopActive && !isPaused) { startGame(); return; }
isPaused = !isPaused;
if (isPaused) { stopLoop(); playBgm('menu'); overlay.classList.add('paused'); overlayTitle.textContent='暂时闭关'; overlayMsg.textContent='按空格继续修炼'; startBtn.style.display='none'; overlay.classList.remove('hidden'); }
else { overlay.classList.add('hidden'); overlay.classList.remove('paused'); startBtn.style.display='block'; updateGameBgm(); startLoop(); }
}

function setDirection(playerIdx, dir) {
if (isPaused || isGameOver) return;
if (!snakes[playerIdx] || !snakes[playerIdx].alive) return;
const p = snakes[playerIdx];
if (dir==='up' && p.dir.y===0) p.nextDir={x:0,y:-1};
else if (dir==='down' && p.dir.y===0) p.nextDir={x:0,y:1};
else if (dir==='left' && p.dir.x===0) p.nextDir={x:-1,y:0};
else if (dir==='right' && p.dir.x===0) p.nextDir={x:1,y:0};
}

function startGame() { startBtn.style.display='block'; overlay.classList.remove('paused'); stopLoop(); initGame(); startLoop(); }
