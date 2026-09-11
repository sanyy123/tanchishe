// ===== 成就 UI =====
function renderAchievements() {
achieveListEl.innerHTML = ''; let unlockedCount = 0;
ACHIEVEMENTS.forEach(a => {
const isUnlocked = unlocked.includes(a.id); if (isUnlocked) unlockedCount++;
const progress = a.progress(); const item = document.createElement('div');
item.className = 'achieve-item' + (isUnlocked ? ' unlocked' : '');
item.innerHTML = '<div class="achieve-icon">'+a.icon+'</div><div class="achieve-info"><div class="achieve-name">'+(isUnlocked ? a.name : '？？？')+'</div><div class="achieve-desc">'+a.desc+'</div>'+( !isUnlocked ? '<div class="achieve-progress"><div class="achieve-progress-bar" style="width:'+(progress*100)+'%"></div></div>' : '' )+'</div>';
achieveListEl.appendChild(item);
});
achieveCountEl.textContent = unlockedCount + '/' + ACHIEVEMENTS.length;
}
function checkAchievements() {
// 双人模式不检查成就（分数、体长等来自 P1，会误判）
if (gameMode === 'double') { renderAchievements(); return; }
let newly = [];
ACHIEVEMENTS.forEach(a => { if (!unlocked.includes(a.id) && a.check()) { unlocked.push(a.id); newly.push(a); } });
if (newly.length) { saveAchievements(); renderAchievements(); newly.forEach((a,i)=>setTimeout(()=>showAchieveToast(a), i*1800)); } else renderAchievements();
}
function showAchieveToast(a) { toastIcon.textContent = a.icon; toastName.textContent = a.name; achieveToast.classList.add('show'); setTimeout(()=>achieveToast.classList.remove('show'), 2800); }

function showCheatToast(msg) {
const t = document.createElement('div');
t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#00f5d4,#9b5de5);color:#0a0e17;padding:16px 32px;border-radius:16px;font-weight:800;font-size:1.1rem;z-index:200;box-shadow:0 15px 40px rgba(0,245,212,0.5);pointer-events:none;transition:opacity 0.5s;max-width:80%;text-align:center;';
t.textContent = msg;
document.body.appendChild(t);
setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 500); }, 1800);
}
function cheatUnlockSkins() {
Object.values(SKINS).forEach(s => { if (s.unlockId) cheatSkins.add(s.unlockId); });
localStorage.setItem('snakeCheatSkins', JSON.stringify([...cheatSkins]));
renderSkins(); draw();
showCheatToast('🐉 520 作弊成功 · 全部皮肤已解锁！');
}
function cheatUnlockAll() {
ACHIEVEMENTS.forEach(a => { if (!unlocked.includes(a.id)) unlocked.push(a.id); });
saveAchievements(); renderAchievements(); renderSkins(); draw();
showCheatToast('✨ 1314 作弊成功 · 全部皮肤 + 成就已解锁！');
}

// ===== 皮肤 UI =====
function isSkinUnlocked(skin) { return !skin.unlockId || unlocked.includes(skin.unlockId) || cheatSkins.has(skin.unlockId); }
function renderSkins() {
skinListEl.innerHTML = '';
Object.values(SKINS).forEach(skin => {
const unlockedSkin = isSkinUnlocked(skin);
const card = document.createElement('div');
card.className = 'skin-card' + (currentSkinId === skin.id ? ' active' : '') + (!unlockedSkin ? ' locked' : '');
card.innerHTML = '<div class="skin-emoji">'+skin.emoji+'</div><div class="skin-name">'+skin.name+'</div>'+( !unlockedSkin ? '<div class="skin-lock">🔒 未解锁</div>' : (currentSkinId === skin.id ? '<div class="skin-lock" style="color:#00f5d4">使用中</div>' : '') );
if (unlockedSkin) card.addEventListener('click', () => {
currentSkinId = skin.id;
localStorage.setItem('snakeCurrentSkin', currentSkinId);
renderSkins();
// 如果游戏正在进行且是单人模式，立即刷新当前蛇的皮肤数据
if (!isGameOver && snakes[0]) {
const skinObj = SKINS[currentSkinId] || SKINS.default;
snakes[0].headColors = skinObj.headColors || ['#5efce8','#00f5d4','#00bbf9'];
snakes[0].bodyHue = skinObj.bodyHue || {r:0,g:235,b:220};
}
draw();
});
skinListEl.appendChild(card);
});
}

// ===== 指南 UI =====
let currentGuideKey = 'basic';
function renderGuideNav() {
guideNavEl.innerHTML = '';
GUIDE_DATA.forEach(g => {
const btn = document.createElement('button');
btn.className = 'guide-nav-btn' + (currentGuideKey === g.id ? ' active' : '');
btn.innerHTML = g.icon + ' ' + g.title;
btn.addEventListener('click', () => { currentGuideKey = g.id; renderGuideNav(); renderGuideContent(); });
guideNavEl.appendChild(btn);
});
}
function renderGuideContent() {
const g = GUIDE_DATA.find(x => x.id === currentGuideKey) || GUIDE_DATA[0];
guideContentEl.innerHTML = g.content;
}

// ===== 猫模式按钮 =====
function updateCatModeBtn() {
if (gameMode === 'double') {
catModeEnabled = false;
localStorage.setItem('snakeCatMode', '0');
catModeBtn.textContent = '🐱 猫咪: 关(双人)';
catModeBtn.classList.remove('cat-on');
catModeBtn.classList.add('cat-off');
catModeBtn.disabled = true;
return;
}
catModeBtn.disabled = false;
if (catModeEnabled) { catModeBtn.textContent = '🐱 猫咪: 开'; catModeBtn.classList.remove('cat-off'); catModeBtn.classList.add('cat-on'); }
else { catModeBtn.textContent = '🐱 猫咪: 关'; catModeBtn.classList.remove('cat-on'); catModeBtn.classList.add('cat-off'); }
}
catModeBtn.addEventListener('click', () => {
if (gameMode === 'double') return;
catModeEnabled = !catModeEnabled;
localStorage.setItem('snakeCatMode', catModeEnabled ? '1' : '0');
updateCatModeBtn();
if (catModeEnabled && score >= CAT_ACTIVATE_SCORE && !catActive && !isGameOver) { spawnCat(); }
if (!catModeEnabled) { catActive = false; cat = null; catTrail = []; }
});

// ===== 障碍模式按钮 =====
function updateObsModeBtn() {
if (obstacleModeEnabled) { obsModeBtn.textContent = '🚧 障碍: 开'; obsModeBtn.classList.remove('obs-off'); obsModeBtn.classList.add('obs-on'); }
else { obsModeBtn.textContent = '🚧 障碍: 关'; obsModeBtn.classList.remove('obs-on'); obsModeBtn.classList.add('obs-off'); }
}
obsModeBtn.addEventListener('click', () => {
obstacleModeEnabled = !obstacleModeEnabled;
localStorage.setItem('snakeObstacleMode', obstacleModeEnabled ? '1' : '0');
updateObsModeBtn();
if (!obstacleModeEnabled) { obstacles = []; portals = []; }
});

// ===== 模式选择按钮 =====
const modeSingleBtn = document.getElementById('modeSingle');
const modeDoubleBtn = document.getElementById('modeDouble');
function updateModeButtons() {
modeSingleBtn.classList.toggle('active', gameMode === 'single');
modeDoubleBtn.classList.toggle('active', gameMode === 'double');
}
modeSingleBtn.addEventListener('click', () => {
if (gameMode === 'single') return;
gameMode = 'single';
updateModeButtons();
updateCatModeBtn();
overlayTitle.textContent = '十二生肖闯江湖';
overlayMsg.textContent = '单人模式 · 准备好踏入江湖了吗？';
startBtn.textContent = '开始修炼';
});
modeDoubleBtn.addEventListener('click', () => {
if (gameMode === 'double') return;
gameMode = 'double';
updateModeButtons();
updateCatModeBtn();
overlayTitle.textContent = '👥 双人对战';
overlayMsg.textContent = 'P1 = WASD  ·  P2 = 方向键  ·  先到 300 分或对方先死获胜';
startBtn.textContent = '开始对战';
});
updateModeButtons();
updateCatModeBtn();
updateObsModeBtn();

// ===== 手机端作弊：连点标题 5 次 =====
let titleTapCount = 0;
let titleTapTimer = null;
document.querySelector('h1').addEventListener('click', () => {
titleTapCount++;
clearTimeout(titleTapTimer);
if (titleTapCount >= 5) { titleTapCount = 0; cheatUnlockAll(); return; }
titleTapTimer = setTimeout(() => { titleTapCount = 0; }, 2000);
});

// ===== 键盘 =====
// P1: W A S D    P2: ↑ ↓ ← →
let cheatBuffer = '';
document.addEventListener('keydown', (e) => {
const key = e.key.toLowerCase();
if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d'].includes(key)) e.preventDefault();

if (key === ' ') { togglePause(); return; }

// P1 控制（WASD）
if (key === 'w') setDirection(0, 'up');
else if (key === 's') setDirection(0, 'down');
else if (key === 'a') setDirection(0, 'left');
else if (key === 'd') setDirection(0, 'right');

// P2 控制（方向键）- 仅双人模式
if (gameMode === 'double') {
if (key === 'arrowup') setDirection(1, 'up');
else if (key === 'arrowdown') setDirection(1, 'down');
else if (key === 'arrowleft') setDirection(1, 'left');
else if (key === 'arrowright') setDirection(1, 'right');
}

// 作弊码
if (e.key >= '0' && e.key <= '9') {
cheatBuffer += e.key;
if (cheatBuffer.length > 6) cheatBuffer = cheatBuffer.slice(-6);
if (cheatBuffer.endsWith('520')) { cheatUnlockSkins(); cheatBuffer=''; }
else if (cheatBuffer.endsWith('1314')) { cheatUnlockAll(); cheatBuffer=''; }
}
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

// ===== 方向键（手机端单人用） =====
const dpadButtons = document.querySelectorAll('.dpad button[data-dir]');
if (window.PointerEvent) {
dpadButtons.forEach(btn => {
btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); btn.classList.add('pressed'); setDirection(0, btn.dataset.dir); });
btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
btn.addEventListener('pointercancel', () => btn.classList.remove('pressed'));
});
} else {
dpadButtons.forEach(btn => {
btn.addEventListener('touchstart', e => { e.preventDefault(); btn.classList.add('pressed'); setDirection(0, btn.dataset.dir); }, { passive: false });
btn.addEventListener('touchend', () => btn.classList.remove('pressed'));
btn.addEventListener('touchcancel', () => btn.classList.remove('pressed'));
btn.addEventListener('mousedown', e => { e.preventDefault(); setDirection(0, btn.dataset.dir); });
});
}
document.getElementById('mobilePause').addEventListener('click', togglePause);

// ===== 按钮绑定 =====
startBtn.addEventListener('click', () => { startBtn.style.display='block'; startGame(); });
document.getElementById('achieveBtn').addEventListener('click', () => { renderAchievements(); achieveModal.classList.add('show'); });
document.getElementById('closeAchieve').addEventListener('click', () => achieveModal.classList.remove('show'));
achieveModal.addEventListener('click', (e) => { if (e.target === achieveModal) achieveModal.classList.remove('show'); });
skinBtn.addEventListener('click', () => { renderSkins(); skinModal.classList.add('show'); });
document.getElementById('closeSkin').addEventListener('click', () => skinModal.classList.remove('show'));
skinModal.addEventListener('click', (e) => { if (e.target === skinModal) skinModal.classList.remove('show'); });
guideBtn.addEventListener('click', () => { currentGuideKey = 'basic'; renderGuideNav(); renderGuideContent(); guideModal.classList.add('show'); });
document.getElementById('closeGuide').addEventListener('click', () => guideModal.classList.remove('show'));
guideModal.addEventListener('click', (e) => { if (e.target === guideModal) guideModal.classList.remove('show'); });
musicBtn.addEventListener('click', () => {
musicEnabled = !musicEnabled;
if (musicEnabled) { musicBtn.textContent = '🎵 音乐开'; musicBtn.classList.remove('active-music'); if (isGameOver || isPaused || !loopActive) playBgm('menu'); else updateGameBgm(); }
else { musicBtn.textContent = '🔇 音乐关'; musicBtn.classList.add('active-music'); stopBgm(); }
});

// ===== BGM 解锁 =====
let bgmUnlocked = false;
function unlockBgm() { if (bgmUnlocked) return; bgmUnlocked = true; if (musicEnabled) playBgm('menu'); }
document.addEventListener('click', unlockBgm, { once: true });
document.addEventListener('keydown', unlockBgm, { once: true });
document.addEventListener('touchstart', unlockBgm, { once: true });

// ===== 加载与启动 =====
function startLoadingScreen() {
const loadingScreen = document.getElementById('loadingScreen');
const progressBar = document.getElementById('loadingProgress');
const loadingText = document.getElementById('loadingText');
loadingScreen.style.display = 'flex';
document.getElementById('overlay').classList.add('hidden');
let loadedCount = 0;
const total = ASSET_KEYS.length;
let finished = false;
function updateProgress() { const pct = Math.floor(loadedCount / total * 100); progressBar.style.width = pct + '%'; loadingText.textContent = pct + '%'; }
function finish() {
if (finished) return;
finished = true;
progressBar.style.width = '100%';
loadingText.textContent = '100%';
setTimeout(() => {
loadingScreen.style.display = 'none';
initGame();
renderAchievements();
draw();
document.getElementById('overlay').classList.remove('hidden');
document.getElementById('overlayTitle').textContent = '十二生肖闯江湖';
document.getElementById('overlayMsg').textContent = '准备好踏入江湖了吗？';
document.getElementById('startBtn').textContent = '开始修炼';
document.getElementById('startBtn').style.display = 'block';
updateModeButtons();
updateCatModeBtn();
}, 300);
}
ASSET_KEYS.forEach(key => {
let img;
if (key === 'cat_head') img = CAT_ASSET;
else if (key.startsWith('rab_')) img = RABBIT_ASSETS[key.replace('rab_', '')];
else if (key.startsWith('dragon_')) img = DRAGON_ASSETS[key.replace('dragon_', '')];
else if (key.startsWith('snake_')) img = SNAKE_ASSETS[key.replace('snake_', '')];
else if (key.startsWith('horse_')) img = HORSE_ASSETS[key.replace('horse_', '')];
else if (key.startsWith('sheep_')) img = SHEEP_ASSETS[key.replace('sheep_', '')];
else img = TIGER_ASSETS[key];
let done = false;
const complete = () => { if (done) return; done = true; loadedCount++; updateProgress(); if (loadedCount === total) finish(); };
const timer = setTimeout(() => { console.warn('资源加载超时:', key); complete(); }, 5000);
img.onload = () => { clearTimeout(timer); complete(); };
img.onerror = () => { console.warn('资源加载失败:', key); clearTimeout(timer); complete(); };
img.src = ASSET_URLS[key];
});
}
Object.values(BGM).forEach(url => { const pre = new Audio(); pre.preload = 'auto'; pre.src = url; });
audio.src = BGM.menu;
startLoadingScreen();
