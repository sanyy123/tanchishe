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

// ==================== ★ AI 评语配置（智谱 + 代理） ★ ====================
const AI_API_KEY  = '691e8784c6954ae9be22fe6a49bba291.FNecmlca4jQOQoH6'; // ★ 替换为你第一步拿到的 Key
const AI_BASE_URL = 'https://zhipu.wange5232.workers.dev/v4'; // ★ 替换为你的 Worker 地址，注意末尾要加上 /v4 
const AI_MODEL    = 'glm-4-flash';

// ★ 人设：小江湖，江湖客栈的老板娘
const AI_SYSTEM_PROMPT = [
'你是"小江湖"，是十二生肖闯江湖客栈的老板娘，性格古灵精怪、说话带江湖气。',
'',
'【身份设定】',
'- 你开着一家叫"江湖客栈"的酒馆，玩家是你的老熟客。',
'- 你爱叫他/她"宝宝"，语气亲切，但不会谄媚。',
'- 你会用武侠梗，比如"内力深厚"、"走位如风"、"差点走火入魔"、"江湖上又要传开了"。',
'',
'【点评规则 - 必须严格遵守】',
'1. 每次点评必须严格基于本次玩家数据（积分、体长、吃掉食物数），结合数据给出针对性的一句话。',
'2. 禁止使用之前用过的点评角度、句式或梗，每次都要换一个切入点。',
'3. 每次点评的语气必须按照【本次语气要求】来，不能自己乱换。',
'4. 如果系统提供了【最近几次评语】，必须避开那些表达方式，不许和它们相似。',
'5. 评语不超过30字，直接输出评语，不加引号、不加前缀、不加表情符号。'
].join('\n');

// ★ 语气池：每次随机挑一个
const TONE_POOL = [
{ id: '傲娇',   desc: '嘴上嫌弃，其实是在夸；用"哼"、"才不是"、"勉强"等词。' },
{ id: '毒舌',   desc: '犀利吐槽但不伤人；用夸张对比、反话正说。' },
{ id: '装傻',   desc: '假装看不懂，瞎猜玩家在干什么；用"咦"、"难道"、"所以是"。' },
{ id: '江湖',   desc: '武侠旁白腔；用"此子"、"果然"、"不出所料"、"江湖传闻"。' },
{ id: '吃货',   desc: '一切从吃的角度点评；用食物作比喻。' },
{ id: '惊叹',   desc: '夸张惊讶；用"天呐"、"不可能"、"绝了"、"这谁敢信"。' },
{ id: '温柔',   desc: '像大姐姐一样温柔鼓励；用"没关系"、"慢慢来"、"进步了"。' },
{ id: '腹黑',   desc: '表面夸奖，暗地埋梗；用"呵呵"、"果然如此"、"我早说过"。' }
];

// ★ 最近评语历史（内存里保留最近 5 条）
let recentComments = [];/**
 * 流式生成 AI 评语，逐字显示到 targetEl
 */
async function generateAIComment(prompt, targetEl) {
if (!targetEl) return;
if (!AI_API_KEY || AI_API_KEY === '你的Groq_Key') {
targetEl.textContent = getFallbackComment();
return;
}
targetEl.textContent = '🤖 AI 正在思考...';
targetEl.style.opacity = '0.7';

try {
const response = await fetch(AI_BASE_URL + '/chat/completions', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': 'Bearer ' + AI_API_KEY
},
body: JSON.stringify({
model: AI_MODEL,
messages: [
{ role: 'system', content: AI_SYSTEM_PROMPT },
{ role: 'user', content: prompt }
],stream: true,
temperature: 0.9,
max_tokens: 80
})
});

if (!response.ok) {
console.warn('Groq API 返回错误:', response.status);
throw new Error('API ' + response.status);
}

const reader = response.body.getReader();
const decoder = new TextDecoder('utf-8');
let buffer = '';
let fullText = '';
targetEl.textContent = '';
targetEl.style.opacity = '1';

while (true) {
const { done, value } = await reader.read();
if (done) break;
buffer += decoder.decode(value, { stream: true });
const lines = buffer.split('\n');
buffer = lines.pop() || '';
for (const line of lines) {
const trimmed = line.trim();
if (!trimmed || !trimmed.startsWith('data:')) continue;
const dataStr = trimmed.slice(5).trim();
if (dataStr === '[DONE]') continue;
try {
const json = JSON.parse(dataStr);
const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
if (delta) { fullText += delta; targetEl.textContent = fullText; }
} catch (e) {}
}
}
if (!fullText.trim()) {
const fb = getFallbackComment();
targetEl.textContent = fb;
recentComments.push(fb);
if (recentComments.length > 5) recentComments.shift();
} else {
// 记录 AI 生成的评语，用于下次避重复
recentComments.push(fullText);
if (recentComments.length > 5) recentComments.shift();
}
} catch (err) {
console.warn('AI 评语失败:', err);
const fb = getFallbackComment();
targetEl.textContent = fb;
recentComments.push(fb);
if (recentComments.length > 5) recentComments.shift();
}
}

// 本地兜底评语
function getFallbackComment() {
const list = [
'宝宝，这走位江湖上怕是要传开了！',
'差一点就破纪录，下次一定行！',
'这蛇走的，比隔壁老王家的猫还溜。',
'积分不错，离大侠就差那么一点点。',
'哎哟，这操作看得我眼花缭乱！'
];
return list[Math.floor(Math.random() * list.length)];
}

// 根据游戏数据构建提示词
function buildAIPrompt() {
const p = (snakes && snakes[0]) || {};
const s = p.score || 0;
const l = (p.body && p.body.length) || 3;
const f = p.foodsEaten || 0;

// 随机挑一个本次语气
const tone = TONE_POOL[Math.floor(Math.random() * TONE_POOL.length)];
// 把本次语气存起来，稍后展示 / 记录用
window.__currentTone = tone.id;

let prompt = '';
prompt += '【本次玩家数据】积分 ' + s + '，体长 ' + l + '，吃掉食物 ' + f + ' 个。\n';
prompt += '【本次语气要求】以"' + tone.id + '"的语气点评：' + tone.desc + '\n';

if (recentComments.length > 0) {
prompt += '【最近几次评语 - 必须避开，不许雷同】\n';
recentComments.slice(-3).forEach((c, i) => { prompt += (i+1) + '. ' + c + '\n'; });
prompt += '请用完全不同的角度、句式和梗，重新写一句评语。';
} else {
prompt += '请写一句评语。';
}

return prompt;
}
// ===== 皮肤解锁判断 =====
function isSkinUnlocked(skin) { return !skin.unlockId || unlocked.includes(skin.unlockId) || cheatSkins.has(skin.unlockId); }

// ===== 单人皮肤 UI =====
function renderSkins() {
skinListEl.innerHTML = '';
Object.values(SKINS).forEach(skin => {
const unlockedSkin = isSkinUnlocked(skin);
const card = document.createElement('div');
card.className = 'skin-card' + (currentSkinId === skin.id ? ' active' : '') + (!unlockedSkin ? ' locked' : '');
card.innerHTML = '<div class="skin-emoji">'+skin.emoji+'</div><div class="skin-name">'+skin.name+'</div>'+( !unlockedSkin ? '<div class="skin-lock">🔒 未解锁</div>' : (currentSkinId === skin.id ? '<div class="skin-lock" style="color:#00f5d4">使用中</div>' : '') );
if (unlockedSkin) card.addEventListener('click', () => {
currentSkinId = skin.id;
boardSkinId = skin.id;
localStorage.setItem('snakeCurrentSkin', currentSkinId);
localStorage.setItem('snakeBoardSkin', boardSkinId);
renderSkins();
if (!isGameOver && snakes[0]) {
const skinObj = SKINS[currentSkinId] || SKINS.default;
snakes[0].headColors = skinObj.headColors || ['#5efce8','#00f5d4','#00bbf9'];
snakes[0].bodyHue = skinObj.bodyHue || {r:0,g:235,b:220};
snakes[0].skinId = currentSkinId;
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

// ===== 双人皮肤选择弹窗 =====
let dualStep = 'board';

function openDualSkinModal() {
dualStep = 'board';
dualSelectedBoardId = boardSkinId;
dualSelectedP1 = p1SkinId || 'default';
dualSelectedP2 = p2SkinId || 'default';
dualPageBoard.style.display = 'block';
dualPageSnake.style.display = 'none';
dualSkinTitle.textContent = '🎨 第一步：选择棋盘皮肤';
dualNextBtn.textContent = '下一步 →';
renderDualBoard();
dualSkinModal.classList.add('show');
}

function renderDualBoard() {
dualBoardGrid.innerHTML = '';
Object.values(SKINS).forEach(skin => {
const unlocked = isSkinUnlocked(skin);
const card = document.createElement('div');
card.className = 'dual-skin-card' + (dualSelectedBoardId === skin.id ? ' active' : '') + (!unlocked ? ' locked' : '');
card.innerHTML = '<div class="ds-emoji">'+skin.emoji+'</div><div class="ds-name">'+skin.name+'</div>';
if (unlocked) card.addEventListener('click', () => { dualSelectedBoardId = skin.id; renderDualBoard(); });
dualBoardGrid.appendChild(card);
});
}

function renderDualSnakeGrid(which) {
const grid = which === 'p1' ? dualP1Grid : dualP2Grid;
const selected = which === 'p1' ? dualSelectedP1 : dualSelectedP2;
grid.innerHTML = '';
Object.values(SKINS).forEach(skin => {
const unlocked = isSkinUnlocked(skin);
const card = document.createElement('div');
card.className = 'dual-skin-card' + (selected === skin.id ? ' active' : '') + (!unlocked ? ' locked' : '');
card.innerHTML = '<div class="ds-emoji">'+skin.emoji+'</div><div class="ds-name">'+skin.name+'</div>';
if (unlocked) card.addEventListener('click', () => {
if (which === 'p1') dualSelectedP1 = skin.id; else dualSelectedP2 = skin.id;
renderDualSnakeGrid(which);
});
grid.appendChild(card);
});
}
function renderDualSnake() { renderDualSnakeGrid('p1'); renderDualSnakeGrid('p2'); }

dualNextBtn.addEventListener('click', () => {
if (dualStep === 'board') {
dualStep = 'snake';
dualPageBoard.style.display = 'none';
dualPageSnake.style.display = 'block';
dualSkinTitle.textContent = '🐍 第二步：选择各自的蛇皮肤';
dualNextBtn.textContent = '开始游戏';
renderDualSnake();
} else {
boardSkinId = dualSelectedBoardId;
currentSkinId = boardSkinId;
p1SkinId = dualSelectedP1;
p2SkinId = dualSelectedP2;
localStorage.setItem('snakeBoardSkin', boardSkinId);
localStorage.setItem('snakeCurrentSkin', boardSkinId);
localStorage.setItem('snakeP1Skin', p1SkinId);
localStorage.setItem('snakeP2Skin', p2SkinId);
dualSkinModal.classList.remove('show');
startBtn.style.display = 'block';
stopLoop();
initGame();
startLoop();
}
});

closeDualSkinBtn.addEventListener('click', () => { dualSkinModal.classList.remove('show'); });
dualSkinModal.addEventListener('click', (e) => { if (e.target === dualSkinModal) dualSkinModal.classList.remove('show'); });

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
let cheatBuffer = '';
document.addEventListener('keydown', (e) => {
const key = e.key.toLowerCase();
if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d'].includes(key)) e.preventDefault();
if (key === ' ') { togglePause(); return; }
if (key === 'w') setDirection(0, 'up');
else if (key === 's') setDirection(0, 'down');
else if (key === 'a') setDirection(0, 'left');
else if (key === 'd') setDirection(0, 'right');
if (gameMode === 'double') {
if (key === 'arrowup') setDirection(1, 'up');
else if (key === 'arrowdown') setDirection(1, 'down');
else if (key === 'arrowleft') setDirection(1, 'left');
else if (key === 'arrowright') setDirection(1, 'right');
}
if (e.key >= '0' && e.key <= '9') {
cheatBuffer += e.key;
if (cheatBuffer.length > 6) cheatBuffer = cheatBuffer.slice(-6);
if (cheatBuffer.endsWith('520')) { cheatUnlockSkins(); cheatBuffer=''; }
else if (cheatBuffer.endsWith('1314')) { cheatUnlockAll(); cheatBuffer=''; }
}
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

// ===== 方向键 =====
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
startBtn.addEventListener('click', () => {
if (gameMode === 'double') { openDualSkinModal(); }
else { startBtn.style.display='block'; startGame(); }
});
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
p1SkinId = localStorage.getItem('snakeP1Skin') || 'default';
p2SkinId = localStorage.getItem('snakeP2Skin') || 'default';
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