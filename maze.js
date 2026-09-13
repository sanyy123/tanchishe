// ===== DOM 引用 =====
const mazeCanvas = document.getElementById('mazeCanvas');
const mazeCtx = mazeCanvas.getContext('2d');
const hpBarEl = document.getElementById('hpBar');
const mazeScoreEl = document.getElementById('mazeScore');
const levelValueEl = document.getElementById('levelValue');
const timeValueEl = document.getElementById('timeValue');
const mazeOverlay = document.getElementById('mazeOverlay');
const mazeOverlayTitle = document.getElementById('mazeOverlayTitle');
const mazeOverlayMsg = document.getElementById('mazeOverlayMsg');
const mazeStartBtn = document.getElementById('mazeStartBtn');
const backBtn = document.getElementById('backBtn');
const selectLevelBtn = document.getElementById('selectLevelBtn');
const restartBtn = document.getElementById('restartBtn');
const levelSelectModal = document.getElementById('levelSelectModal');
const levelListEl = document.getElementById('levelList');
const closeLevelSelectBtn = document.getElementById('closeLevelSelect');
const resultModal = document.getElementById('resultModal');
const resultTitle = document.getElementById('resultTitle');
const resultSubtitle = document.getElementById('resultSubtitle');
const resultScore = document.getElementById('resultScore');
const resultMax = document.getElementById('resultMax');
const resultTime = document.getElementById('resultTime');
const resultHp = document.getElementById('resultHp');
const resultRecordRow = document.getElementById('resultRecordRow');
const resultBackBtn = document.getElementById('resultBackBtn');
const resultRetryBtn = document.getElementById('resultRetryBtn');
const resultNextBtn = document.getElementById('resultNextBtn');

// ===== 画布设置 =====
const MAZE_LOGICAL_SIZE = 600;
const dpr = window.devicePixelRatio || 1;
mazeCanvas.width = MAZE_LOGICAL_SIZE * dpr;
mazeCanvas.height = MAZE_LOGICAL_SIZE * dpr;
mazeCtx.scale(dpr, dpr);

// ===== 游戏状态 =====
let mazeState = null;
let currentLevelIndex = 0;
let rafId = null;
let lastFrameTs = 0;
let accumulator = 0;
let isPaused = false;
let mazeLoopActive = false;
let countdownTimer = null;
let shakeAmount = 0;
let particles = [];
let flashAlpha = 0;

// ===== 最高分存取 =====
function getHighScore(levelId) {
  const v = localStorage.getItem(MAZE_HIGHSCORE_PREFIX + levelId);
  return v ? parseInt(v) : 0;
}
function setHighScore(levelId, score) {
  const old = getHighScore(levelId);
  if (score > old) {
    localStorage.setItem(MAZE_HIGHSCORE_PREFIX + levelId, String(score));
    return true;
  }
  return false;
}
function getClearedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(MAZE_CLEARED_KEY) || '[]')); }
  catch (e) { return new Set(); }
}
function markCleared(levelId) {
  const s = getClearedSet();
  s.add(levelId);
  localStorage.setItem(MAZE_CLEARED_KEY, JSON.stringify([...s]));
}

// ===== 粒子系统 =====
function spawnBurst(px, py, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      x: px, y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.018 + Math.random() * 0.02,
      size: 2 + Math.random() * 3.5,
      color: color
    });
  }
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles() {
  particles.forEach(p => {
    mazeCtx.globalAlpha = p.life;
    mazeCtx.fillStyle = p.color;
    mazeCtx.beginPath();
    mazeCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    mazeCtx.fill();
  });
  mazeCtx.globalAlpha = 1;
}

// ===== 初始化关卡 =====
function loadLevel(levelIndex) {
  const level = MAZE_LEVELS[levelIndex];
  if (!level) return null;

  const CELL = MAZE_LOGICAL_SIZE / level.cols;
  const walls = [];
  const foods = [];
  let spawn = { x: 1, y: 1 };
  let exit = { x: 1, y: 1 };

  for (let y = 0; y < level.rows; y++) {
    const row = level.map[y];
    for (let x = 0; x < level.cols; x++) {
      const ch = row[x];
      if (ch === '#') walls.push({ x, y });
      else if (ch === 'S') spawn = { x, y };
      else if (ch === 'E') exit = { x, y };
      else if (ch === '1') foods.push({ x, y, type: 'normal', score: MAZE_CONFIG.FOOD_NORMAL, eaten: false });
      else if (ch === '2') foods.push({ x, y, type: 'gold', score: MAZE_CONFIG.FOOD_GOLD, eaten: false });
      else if (ch === '3') foods.push({ x, y, type: 'gem', score: MAZE_CONFIG.FOOD_GEM, eaten: false });
      else if (ch === '4') foods.push({ x, y, type: 'diamond', score: MAZE_CONFIG.FOOD_DIAMOND, eaten: false });
    }
  }

  const maxFoodScore = foods.reduce((sum, f) => sum + f.score, 0);
  const maxPossibleScore = maxFoodScore + MAZE_CONFIG.HP * MAZE_CONFIG.HP_REWARD_PER_LEFT;

  return {
    level,
    cellSize: CELL,
    walls,
    wallsSet: new Set(walls.map(w => w.x + ',' + w.y)),
    foods,
    spawn,
    exit,
    hp: MAZE_CONFIG.HP,
    maxHp: MAZE_CONFIG.HP,
    score: 0,
    maxPossibleScore,
    snake: {
      body: [
        { x: spawn.x, y: spawn.y },
        { x: spawn.x - 1, y: spawn.y },
        { x: spawn.x - 2, y: spawn.y }
      ],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      alive: true
    },
    invincibleUntil: 0,
    waitingDir: false,
    countdownActive: false,
    countdownValue: 3,
    startTime: 0,
    elapsed: 0,
    finished: false
  };
}

// ===== 加载关卡 =====
function loadAndPrepareLevel(levelIndex) {
  currentLevelIndex = levelIndex;
  stopMazeLoop();
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  mazeState = loadLevel(levelIndex);
  isPaused = false;
  shakeAmount = 0;
  particles = [];
  flashAlpha = 0;
  levelValueEl.textContent = mazeState.level.id;
  mazeOverlay.classList.remove('hidden');
  mazeOverlayTitle.textContent = '第 ' + mazeState.level.id + ' 关 · ' + mazeState.level.name;
  mazeOverlayMsg.textContent = '难度：' + mazeState.level.difficulty + '　·　按方向键或点「开始」按钮';
  mazeStartBtn.textContent = '开始';
  updateHUD();
  drawMaze();
}

function resetLevel() {
  if (!mazeState) return;
  loadAndPrepareLevel(currentLevelIndex);
}

// ===== HUD =====
let lastRenderedHp = -1;

function renderHpBar() {
  const s = mazeState;
  if (!s) return;
  if (lastRenderedHp === s.hp && hpBarEl.children.length === s.maxHp) return;
  lastRenderedHp = s.hp;
  if (hpBarEl.children.length !== s.maxHp) {
    hpBarEl.innerHTML = '';
    for (let i = 0; i < s.maxHp; i++) {
      const seg = document.createElement('div');
      seg.className = 'hp-seg';
      hpBarEl.appendChild(seg);
    }
  }
  for (let i = 0; i < s.maxHp; i++) {
    const seg = hpBarEl.children[i];
    const filled = i < s.hp;
    seg.className = 'hp-seg' + (filled ? ' filled' : '') + (filled && s.hp <= 2 ? ' low' : '');
  }
}

function updateHUD() {
  if (!mazeState) return;
  renderHpBar();
  mazeScoreEl.textContent = mazeState.score;
  levelValueEl.textContent = mazeState.level.id;
  timeValueEl.textContent = mazeState.elapsed.toFixed(1) + 's';
}

// ===== 开始游戏 =====
function startMaze() {
  if (!mazeState || mazeState.finished) return;
  mazeOverlay.classList.add('hidden');
  isPaused = false;
  mazeState.waitingDir = false;
  mazeState.countdownActive = true;
  mazeState.countdownValue = 3;
  mazeState.elapsed = 0;
  particles = [];
  shakeAmount = 0;
  flashAlpha = 0;

  if (!mazeLoopActive) startMazeLoop();

  if (countdownTimer) clearInterval(countdownTimer);
  let count = 3;
  countdownTimer = setInterval(() => {
    count--;
    mazeState.countdownValue = count;
    if (count <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      mazeState.countdownActive = false;
      mazeState.startTime = performance.now();
    }
  }, 1000);
}

// ===== 游戏循环 =====
function startMazeLoop() {
  stopMazeLoop();
  lastFrameTs = 0;
  accumulator = 0;
  mazeLoopActive = true;
  rafId = requestAnimationFrame(mazeFrame);
}
function stopMazeLoop() {
  mazeLoopActive = false;
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
function mazeFrame(timestamp) {
  if (!mazeLoopActive) return;
  if (!lastFrameTs) lastFrameTs = timestamp;
  let delta = timestamp - lastFrameTs;
  lastFrameTs = timestamp;
  if (delta > 100) delta = 100;

  if (!isPaused && mazeState && !mazeState.finished && !mazeState.countdownActive) {
    mazeState.elapsed = (timestamp - mazeState.startTime) / 1000;
    accumulator += delta;
    const step = mazeState.level.speed;
    let steps = 0;
    while (accumulator >= step && steps < 5) {
      mazeUpdate();
      accumulator -= step;
      steps++;
      if (mazeState.finished || mazeState.waitingDir) break;
    }
    if (steps >= 5) accumulator = 0;
  }

  updateParticles();
  drawMaze();
  updateHUD();

  if (mazeLoopActive && !mazeState.finished) {
    rafId = requestAnimationFrame(mazeFrame);
  } else {
    stopMazeLoop();
  }
}

// ===== 更新一帧 =====
function mazeUpdate() {
  const s = mazeState;
  if (!s || s.finished || !s.snake.alive) return;
  if (s.waitingDir) return;

  const snake = s.snake;

  if (!(snake.nextDir.x === -snake.dir.x && snake.nextDir.y === -snake.dir.y)) {
    snake.dir = { ...snake.nextDir };
  }

  const head = { x: snake.body[0].x + snake.dir.x, y: snake.body[0].y + snake.dir.y };
  const CELL = s.cellSize;

  const hitWall = s.wallsSet.has(head.x + ',' + head.y) ||
                  head.x < 0 || head.x >= s.level.cols ||
                  head.y < 0 || head.y >= s.level.rows;

  if (hitWall) {
    s.hp--;
    shakeAmount = 14;
    flashAlpha = 0.4;
    const hx = snake.body[0].x * CELL + CELL / 2;
    const hy = snake.body[0].y * CELL + CELL / 2;
    spawnBurst(hx, hy, '#ff5555', 14);

    if (s.hp <= 0) {
      s.hp = 0;
      s.finished = true;
      showResult(false);
      return;
    }
    s.waitingDir = true;
    s.invincibleUntil = performance.now() + 2000;
    return;
  }

  snake.body.unshift(head);

  const food = s.foods.find(f => !f.eaten && f.x === head.x && f.y === head.y);
  if (food) {
    food.eaten = true;
    s.score += food.score;
    const fx = head.x * CELL + CELL / 2;
    const fy = head.y * CELL + CELL / 2;
    let col = '#ff6b6b';
    if (food.type === 'gold') col = '#ffd700';
    else if (food.type === 'gem') col = '#9b5de5';
    else if (food.type === 'diamond') col = '#00e5ff';
    spawnBurst(fx, fy, col, 16);
    shakeAmount = 6;
  }

  while (snake.body.length > 3) snake.body.pop();

  if (head.x === s.exit.x && head.y === s.exit.y) {
    const hpBonus = s.hp * MAZE_CONFIG.HP_REWARD_PER_LEFT;
    s.score += hpBonus;
    s.finished = true;
    markCleared(s.level.id);
    const ex = s.exit.x * CELL + CELL / 2;
    const ey = s.exit.y * CELL + CELL / 2;
    spawnBurst(ex, ey, '#00f5d4', 30);
    spawnBurst(ex, ey, '#ffffff', 20);
    spawnBurst(ex, ey, '#ffcc00', 20);
    shakeAmount = 10;
    showResult(true, hpBonus);
    return;
  }
}

// ===== 结算 =====
function showResult(win, hpBonus) {
  if (!mazeState) return;
  const s = mazeState;
  const isNewRecord = setHighScore(s.level.id, s.score);

  resultScore.textContent = s.score;
  resultMax.textContent = s.maxPossibleScore;
  resultTime.textContent = s.elapsed.toFixed(1) + 's';
  resultHp.textContent = s.hp + ' / ' + s.maxHp;
  resultRecordRow.style.display = isNewRecord ? 'flex' : 'none';

  if (win) {
    resultTitle.textContent = '🎉 通关！';
    resultSubtitle.textContent = '恭喜你找到了出口' + (hpBonus ? '（血量奖励 +' + hpBonus + '）' : '');
    resultNextBtn.style.display = (currentLevelIndex < MAZE_LEVELS.length - 1) ? 'inline-block' : 'none';
  } else {
    resultTitle.textContent = '💀 失败';
    resultSubtitle.textContent = '血量耗尽，再来一次吧';
    resultNextBtn.style.display = 'none';
  }

  resultModal.classList.add('show');
}

// ===== 渲染 =====
function drawMaze() {
  const s = mazeState;
  if (!s) return;
  const CELL = s.cellSize;
  const ctx = mazeCtx;

  ctx.save();
  if (shakeAmount > 0.1) {
    const sx = (Math.random() - 0.5) * shakeAmount;
    const sy = (Math.random() - 0.5) * shakeAmount;
    ctx.translate(sx, sy);
    shakeAmount *= 0.85;
  } else {
    shakeAmount = 0;
  }

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(-20, -20, MAZE_LOGICAL_SIZE + 40, MAZE_LOGICAL_SIZE + 40);

  ctx.strokeStyle = 'rgba(0,200,220,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s.level.cols; i++) { ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, MAZE_LOGICAL_SIZE); ctx.stroke(); }
  for (let i = 0; i <= s.level.rows; i++) { ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(MAZE_LOGICAL_SIZE, i * CELL); ctx.stroke(); }

  drawExit(s.exit.x * CELL, s.exit.y * CELL, CELL);
  s.walls.forEach(w => drawWall3D(w.x * CELL, w.y * CELL, CELL));
  s.foods.forEach(f => { if (!f.eaten) drawFood(f.x * CELL, f.y * CELL, CELL, f.type); });
  drawParticles();
  drawMazeSnake(s);

  if (flashAlpha > 0.01) {
    ctx.fillStyle = 'rgba(255,50,50,' + flashAlpha + ')';
    ctx.fillRect(0, 0, MAZE_LOGICAL_SIZE, MAZE_LOGICAL_SIZE);
    flashAlpha *= 0.88;
  } else {
    flashAlpha = 0;
  }

  if (s.waitingDir) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px Nunito, sans-serif';
    ctx.globalAlpha = 0.8 + Math.sin(performance.now() / 150) * 0.2;
    ctx.fillStyle = '#ff5757';
    ctx.shadowColor = '#ff5757';
    ctx.shadowBlur = 24;
    ctx.fillText('⚠️ 请选新方向', MAZE_LOGICAL_SIZE / 2, MAZE_LOGICAL_SIZE / 2 - 30);
    ctx.font = 'bold 18px Nunito, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillText('任意方向都可（可掉头）', MAZE_LOGICAL_SIZE / 2, MAZE_LOGICAL_SIZE / 2 + 20);
    ctx.restore();
  }

  if (s.countdownActive) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, MAZE_LOGICAL_SIZE, MAZE_LOGICAL_SIZE);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 140px Nunito, sans-serif';
    const text = s.countdownValue > 0 ? String(s.countdownValue) : 'GO!';
    const color = s.countdownValue > 0 ? '#00f5d4' : '#ffcc00';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 40;
    const scale = 1 + Math.sin(performance.now() / 100) * 0.08;
    ctx.translate(MAZE_LOGICAL_SIZE / 2, MAZE_LOGICAL_SIZE / 2);
    ctx.scale(scale, scale);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  if (isPaused && !s.finished) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, MAZE_LOGICAL_SIZE, MAZE_LOGICAL_SIZE);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 60px Nunito, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('⏸ 暂停', MAZE_LOGICAL_SIZE / 2, MAZE_LOGICAL_SIZE / 2);
    ctx.font = 'bold 20px Nunito, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('按空格继续', MAZE_LOGICAL_SIZE / 2, MAZE_LOGICAL_SIZE / 2 + 50);
    ctx.restore();
  }

  ctx.restore();
}

// ===== 石块离屏缓存 =====
let wallCacheCanvas = null;
let wallCacheCellSize = 0;

function buildWallCache(size) {
  const c = document.createElement('canvas');
  c.width = size * dpr;
  c.height = size * dpr;
  const cx = c.getContext('2d');
  cx.scale(dpr, dpr);

  const pad = 0.5;
  const bx = pad, by = pad, bs = size - pad * 2;

  cx.fillStyle = 'rgba(0,0,0,0.35)';
  cx.fillRect(bx + 2, by + bs - 2, bs, 2);

  const grad = cx.createLinearGradient(bx, by, bx, by + bs);
  grad.addColorStop(0, '#7a8494');
  grad.addColorStop(0.35, '#525a68');
  grad.addColorStop(0.75, '#383e4a');
  grad.addColorStop(1, '#22262e');
  cx.fillStyle = grad;
  cx.fillRect(bx, by, bs, bs);

  const topGrad = cx.createLinearGradient(bx, by, bx, by + 4);
  topGrad.addColorStop(0, 'rgba(255,255,255,0.32)');
  topGrad.addColorStop(1, 'rgba(255,255,255,0)');
  cx.fillStyle = topGrad;
  cx.fillRect(bx, by, bs, 4);

  cx.fillStyle = 'rgba(255,255,255,0.15)';
  cx.fillRect(bx, by, 2, bs);

  cx.fillStyle = 'rgba(0,0,0,0.45)';
  cx.fillRect(bx + bs - 2, by, 2, bs);

  cx.fillStyle = 'rgba(0,0,0,0.55)';
  cx.fillRect(bx, by + bs - 3, bs, 3);

  cx.fillStyle = 'rgba(255,255,255,0.06)';
  cx.fillRect(bx + bs * 0.2, by + bs * 0.3, bs * 0.5, 1.5);

  cx.strokeStyle = 'rgba(0,0,0,0.25)';
  cx.lineWidth = 1;
  cx.strokeRect(bx + 0.5, by + 0.5, bs - 1, bs - 1);

  wallCacheCanvas = c;
  wallCacheCellSize = size;
}

function drawWall3D(x, y, size) {
  if (!wallCacheCanvas || wallCacheCellSize !== size) {
    buildWallCache(size);
  }
  mazeCtx.drawImage(wallCacheCanvas, x, y, size, size);
}

// ===== 出口 =====
function drawExit(x, y, size) {
  const ctx = mazeCtx;
  const cx = x + size / 2, cy = y + size / 2;
  const t = performance.now();
  const pulse = 0.85 + Math.sin(t / 300) * 0.15;
  const r = size * 0.45 * pulse;

  const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, size);
  glow.addColorStop(0, 'rgba(0,245,212,0.9)');
  glow.addColorStop(0.4, 'rgba(0,245,212,0.45)');
  glow.addColorStop(1, 'rgba(0,245,212,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t / 700);
  ctx.strokeStyle = '#00f5d4';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 1.4); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-t / 500);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, Math.PI * 1.1); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t / 400);
  ctx.strokeStyle = 'rgba(155,93,229,0.9)';
  ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 1.6); ctx.stroke();
  ctx.restore();

  const corePulse = 0.6 + Math.sin(t / 200) * 0.4;
  ctx.fillStyle = 'rgba(255,255,255,' + corePulse + ')';
  ctx.beginPath(); ctx.arc(cx, cy, 4 + corePulse * 2, 0, Math.PI * 2); ctx.fill();
}

// ===== 食物（4 种） =====
function drawFood(x, y, size, type) {
  const ctx = mazeCtx;
  const cx = x + size / 2, cy = y + size / 2;
  const pulse = 0.85 + Math.sin(performance.now() / 200) * 0.15;
  let color, glowColor, radius;
  if (type === 'gold') { color = '#ffd700'; glowColor = 'rgba(255,215,0,0.7)'; radius = size * 0.32; }
  else if (type === 'gem') { color = '#9b5de5'; glowColor = 'rgba(155,93,229,0.7)'; radius = size * 0.32; }
  else if (type === 'diamond') { color = '#00e5ff'; glowColor = 'rgba(0,229,255,0.8)'; radius = size * 0.34; }
  else { color = '#ff6b6b'; glowColor = 'rgba(255,107,107,0.7)'; radius = size * 0.28; }

  const glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, size * 0.9);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, size * 0.9, 0, Math.PI * 2); ctx.fill();

  if (type === 'diamond') {
    // 钻石：菱形 + 顶部切面 + 内部高光
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * pulse);
    ctx.lineTo(cx + radius * 0.7 * pulse, cy);
    ctx.lineTo(cx, cy + radius * pulse);
    ctx.lineTo(cx - radius * 0.7 * pulse, cy);
    ctx.closePath();
    ctx.fill();
    // 顶部切面
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * pulse);
    ctx.lineTo(cx + radius * 0.35 * pulse, cy - radius * 0.4 * pulse);
    ctx.lineTo(cx - radius * 0.35 * pulse, cy - radius * 0.4 * pulse);
    ctx.closePath();
    ctx.fill();
    // 中心高光
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * 0.5 * pulse);
    ctx.lineTo(cx + radius * 0.25 * pulse, cy);
    ctx.lineTo(cx, cy + radius * 0.5 * pulse);
    ctx.lineTo(cx - radius * 0.25 * pulse, cy);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'gem') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * pulse);
    ctx.lineTo(cx + radius * pulse, cy);
    ctx.lineTo(cx, cy + radius * pulse);
    ctx.lineTo(cx - radius * pulse, cy);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius * pulse * 0.5);
    ctx.lineTo(cx + radius * pulse * 0.3, cy);
    ctx.lineTo(cx, cy + radius * pulse * 0.2);
    ctx.lineTo(cx - radius * pulse * 0.3, cy);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.3, cy - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== 蛇 =====
function drawMazeSnake(s) {
  const ctx = mazeCtx;
  const CELL = s.cellSize;
  const snake = s.snake;
  const isInvincible = performance.now() < s.invincibleUntil && s.waitingDir;
  ctx.save();
  if (isInvincible) ctx.globalAlpha = 0.45 + Math.sin(performance.now() / 60) * 0.3;

  snake.body.forEach((seg, i) => {
    const x = seg.x * CELL, y = seg.y * CELL;
    const isHead = i === 0;
    const inset = isHead ? 2 : 4;
    if (isHead) {
      const cx = x + CELL / 2, cy = y + CELL / 2;
      const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, CELL);
      glow.addColorStop(0, 'rgba(0,245,212,0.55)');
      glow.addColorStop(1, 'rgba(0,245,212,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 8, y - 8, CELL + 16, CELL + 16);

      const grad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
      grad.addColorStop(0, '#5efce8');
      grad.addColorStop(0.5, '#00f5d4');
      grad.addColorStop(1, '#00bbf9');
      ctx.fillStyle = grad;
      roundRectPath(ctx, x + inset, y + inset, CELL - inset * 2, CELL - inset * 2, 8);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, x + inset + 1, y + inset + 1, CELL - inset * 2 - 2, CELL - inset * 2 - 2, 7);
      ctx.stroke();

      const eyeOff = CELL * 0.18;
      const dir = snake.dir;
      const ex1 = cx + (dir.x !== 0 ? dir.x * eyeOff : -eyeOff * 0.6);
      const ey1 = cy + (dir.y !== 0 ? dir.y * eyeOff : -eyeOff * 0.6);
      const ex2 = cx + (dir.x !== 0 ? dir.x * eyeOff : eyeOff * 0.6);
      const ey2 = cy + (dir.y !== 0 ? dir.y * eyeOff : eyeOff * 0.6);
      ctx.fillStyle = '#0a0e17';
      ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2); ctx.fill();
    } else {
      const grad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
      grad.addColorStop(0, '#00f5d4');
      grad.addColorStop(1, '#00bbf9');
      ctx.fillStyle = grad;
      roundRectPath(ctx, x + inset, y + inset, CELL - inset * 2, CELL - inset * 2, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, x + inset + 1, y + inset + 1, CELL - inset * 2 - 2, CELL - inset * 2 - 2, 5);
      ctx.stroke();
    }
  });
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ===== 输入 =====
function setMazeDir(dir) {
  if (!mazeState || mazeState.finished || mazeState.countdownActive) return;
  const s = mazeState.snake;
  const newDir =
    dir === 'up' ? { x: 0, y: -1 } :
    dir === 'down' ? { x: 0, y: 1 } :
    dir === 'left' ? { x: -1, y: 0 } :
    { x: 1, y: 0 };

  if (mazeState.waitingDir) {
    s.nextDir = newDir;
    const testHead = { x: s.body[0].x + newDir.x, y: s.body[0].y + newDir.y };
    const blocked = mazeState.wallsSet.has(testHead.x + ',' + testHead.y) ||
                    testHead.x < 0 || testHead.x >= mazeState.level.cols ||
                    testHead.y < 0 || testHead.y >= mazeState.level.rows;
    if (!blocked) {
      s.dir = newDir;
      mazeState.waitingDir = false;
      mazeState.invincibleUntil = 0;
    }
  } else {
    if (newDir.x === -s.dir.x && newDir.y === -s.dir.y) return;
    s.nextDir = newDir;
  }
}

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd', 'enter'].includes(key)) e.preventDefault();

  if (!mazeOverlay.classList.contains('hidden')) {
    if (key === ' ' || key === 'enter') mazeStartBtn.click();
    return;
  }
  if (resultModal.classList.contains('show') || levelSelectModal.classList.contains('show')) {
    if (key === 'escape') closeLevelSelectBtn.click();
    return;
  }
  if (key === ' ') {
    if (!mazeState.finished && !mazeState.countdownActive) isPaused = !isPaused;
    return;
  }
  if (key === 'w' || key === 'arrowup') setMazeDir('up');
  else if (key === 's' || key === 'arrowdown') setMazeDir('down');
  else if (key === 'a' || key === 'arrowleft') setMazeDir('left');
  else if (key === 'd' || key === 'arrowright') setMazeDir('right');
});

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());

// ===== 关卡选择 UI =====
function renderLevelList() {
  levelListEl.innerHTML = '';
  const cleared = getClearedSet();
  MAZE_LEVELS.forEach((level, idx) => {
    const isCleared = cleared.has(level.id);
    const isUnlocked = (idx === 0) || cleared.has(MAZE_LEVELS[idx - 1].id);
    const best = getHighScore(level.id);
    const max = getLevelMaxScore(level);

    const card = document.createElement('div');
    card.className = 'level-card' +
      (!isUnlocked ? ' locked' : '') +
      (isCleared ? ' cleared' : '');

    let diffClass = 'easy';
    if (level.difficulty === '中等') diffClass = 'medium';
    else if (level.difficulty === '困难') diffClass = 'hard';
    else if (level.difficulty === '极难') diffClass = 'extreme';

    const bestLine = best > 0
      ? '最高分 <span class="best-score">' + best + '</span> / 理论 <span class="max-score">' + max + '</span>'
      : '尚未通关 / 理论 <span class="max-score">' + max + '</span>';

    card.innerHTML =
      '<div class="level-num">' + level.id + '</div>' +
      '<div class="level-info">' +
        '<div class="level-name">' + level.name + '</div>' +
        '<span class="level-diff ' + diffClass + '">' + level.difficulty + '</span>' +
        '<div class="level-best">' + bestLine + '</div>' +
      '</div>' +
      (isCleared ? '<div class="level-clear-mark">✅</div>' : '');

    if (isUnlocked) {
      card.addEventListener('click', () => {
        levelSelectModal.classList.remove('show');
        loadAndPrepareLevel(idx);
      });
    }
    levelListEl.appendChild(card);
  });
}

function openLevelSelect() {
  renderLevelList();
  levelSelectModal.classList.add('show');
}

// ===== 按钮绑定 =====
backBtn.addEventListener('click', () => {
  stopMazeLoop();
  if (countdownTimer) clearInterval(countdownTimer);
  const el = document.getElementById('mazeLoading');
  if (el) {
    el.querySelector('h2').textContent = '🏠 返回主菜单...';
    el.classList.remove('hidden');
    const bar = document.getElementById('mazeLoadingProgress');
    if (bar) {
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        bar.style.width = '60%';
        setTimeout(() => { bar.style.width = '100%'; }, 250);
      });
    }
    setTimeout(() => { window.location.href = 'index.html'; }, 650);
  } else {
    window.location.href = 'index.html';
  }
});
selectLevelBtn.addEventListener('click', openLevelSelect);
closeLevelSelectBtn.addEventListener('click', () => levelSelectModal.classList.remove('show'));
levelSelectModal.addEventListener('click', (e) => { if (e.target === levelSelectModal) levelSelectModal.classList.remove('show'); });
restartBtn.addEventListener('click', resetLevel);

mazeStartBtn.addEventListener('click', () => {
  if (mazeState && mazeState.finished) {
    resetLevel();
    setTimeout(startMaze, 100);
  } else {
    startMaze();
  }
});

resultRetryBtn.addEventListener('click', () => {
  resultModal.classList.remove('show');
  resetLevel();
  setTimeout(startMaze, 200);
});
resultBackBtn.addEventListener('click', () => {
  resultModal.classList.remove('show');
  openLevelSelect();
});
resultNextBtn.addEventListener('click', () => {
  resultModal.classList.remove('show');
  if (currentLevelIndex < MAZE_LEVELS.length - 1) {
    loadAndPrepareLevel(currentLevelIndex + 1);
    setTimeout(startMaze, 200);
  }
});

// ===== 启动 =====
renderLevelList();
levelSelectModal.classList.add('show');

const mazeLoadingEl = document.getElementById('mazeLoading');
const mazeLoadingBar = document.getElementById('mazeLoadingProgress');
if (mazeLoadingBar) {
  requestAnimationFrame(() => { mazeLoadingBar.style.width = '100%'; });
}
setTimeout(() => {
  if (mazeLoadingEl) mazeLoadingEl.classList.add('hidden');
}, 600);
// ===== 选择关卡弹窗 · 返回主菜单 =====
document.addEventListener('DOMContentLoaded', () => {
  const levelBackBtn = document.getElementById('levelBackToMenuBtn');
  if (levelBackBtn) {
    levelBackBtn.addEventListener('click', () => {
      stopMazeLoop();
      if (countdownTimer) clearInterval(countdownTimer);
      const el = document.getElementById('mazeLoading');
      if (el) {
        const h2 = el.querySelector('h2');
        if (h2) h2.textContent = '🏠 返回主菜单...';
        el.classList.remove('hidden');
        const bar = document.getElementById('mazeLoadingProgress');
        if (bar) {
          bar.style.width = '0%';
          requestAnimationFrame(() => {
            bar.style.width = '60%';
            setTimeout(() => { bar.style.width = '100%'; }, 250);
          });
        }
        setTimeout(() => { window.location.href = 'index.html'; }, 650);
      } else {
        window.location.href = 'index.html';
      }
    });
  }
});