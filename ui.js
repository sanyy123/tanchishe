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

function showCheatToast(msg, duration) {
const t = document.createElement('div');
t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#00f5d4,#9b5de5);color:#0a0e17;padding:16px 32px;border-radius:16px;font-weight:800;font-size:1.1rem;z-index:200;box-shadow:0 15px 40px rgba(0,245,212,0.5);pointer-events:none;transition:opacity 0.5s;max-width:80%;text-align:center;';
t.textContent = msg;
document.body.appendChild(t);
const dur = duration || 1800;
setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 500); }, dur);
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
const AI_API_KEY  = '691e8784c6954ae9be22fe6a49bba291.FNecmlca4jQOQoH6';
const AI_BASE_URL = 'https://zhipu.wange5232.workers.dev/v4';
const AI_MODEL    = 'GLM-4-Flash';

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

let recentComments = [];

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

function buildAIPrompt() {
const p = (snakes && snakes[0]) || {};
const s = p.score || 0;
const l = (p.body && p.body.length) || 3;
const f = p.foodsEaten || 0;

const tone = TONE_POOL[Math.floor(Math.random() * TONE_POOL.length)];
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
if (isPaused || (loopActive && !isGameOver)) {
showCheatToast('⏸️ 游戏中无法换皮肤，请结束本局后再试', 1200);
return;
}
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

// ===== 数据统计面板 =====
function renderStats() {
const listEl = document.getElementById('statsList');
if (!listEl) return;
const fmtTime = (s) => {
s = Math.floor(s || 0);
if (s < 60) return s + ' 秒';
const m = Math.floor(s / 60), r = s % 60;
return m + ' 分 ' + r + ' 秒';
};
const deathTotal = Object.values(stats.deaths).reduce((a,b)=>a+b, 0) || 1;
const pct = (n) => deathTotal > 0 ? Math.round(n / deathTotal * 100) : 0;

let html = '';
html += '<div class="stats-section">';
html += '<div class="stats-section-title">📊 生涯总览</div>';
html += '<div class="stats-row"><span class="stats-label">🎮 总游玩局数</span><span class="stats-value">' + stats.totalGames + ' 局</span></div>';
html += '<div class="stats-row"><span class="stats-label">👤 单人局数</span><span class="stats-value">' + stats.singleGames + ' 局</span></div>';
html += '<div class="stats-row"><span class="stats-label">👥 双人局数</span><span class="stats-value">' + stats.doubleGames + ' 局</span></div>';
html += '<div class="stats-row"><span class="stats-label">⏱️ 累计游戏时长</span><span class="stats-value">' + fmtTime(stats.totalPlayTime) + '</span></div>';
html += '<div class="stats-row"><span class="stats-label">🍎 累计吃食物</span><span class="stats-value">' + stats.totalFoodsEaten + ' 个</span></div>';
html += '<div class="stats-row"><span class="stats-label">💰 累计总分</span><span class="stats-value">' + totalScoreAccum + ' 分</span></div>';
html += '</div>';

html += '<div class="stats-section">';
html += '<div class="stats-section-title">🏆 最高纪录</div>';
html += '<div class="stats-row"><span class="stats-label">🥇 最高分</span><span class="stats-value gold">' + highScore + ' 分</span></div>';
html += '<div class="stats-row"><span class="stats-label">📏 最长体长</span><span class="stats-value gold">' + stats.bestLength + ' 节</span></div>';
html += '<div class="stats-row"><span class="stats-label">⏳ 最长生存</span><span class="stats-value gold">' + fmtTime(stats.bestSurvivalTime) + '</span></div>';
html += '<div class="stats-row"><span class="stats-label">🔥 最高连击</span><span class="stats-value gold">' + stats.bestCombo + ' 连</span></div>';
html += '<div class="stats-row"><span class="stats-label">🍽️ 单局最多食物</span><span class="stats-value gold">' + stats.bestFoodsEaten + ' 个</span></div>';
html += '</div>';

html += '<div class="stats-section">';
html += '<div class="stats-section-title">💀 死因分布</div>';
html += '<div class="stats-row"><span class="stats-label">🧱 撞墙</span><span class="stats-value pink">' + stats.deaths.wall + ' 次 · ' + pct(stats.deaths.wall) + '%</span></div>';
html += '<div class="stats-row"><span class="stats-label">🐍 咬到自己</span><span class="stats-value pink">' + stats.deaths.self + ' 次 · ' + pct(stats.deaths.self) + '%</span></div>';
html += '<div class="stats-row"><span class="stats-label">💥 撞到对方</span><span class="stats-value pink">' + stats.deaths.other + ' 次 · ' + pct(stats.deaths.other) + '%</span></div>';
html += '<div class="stats-row"><span class="stats-label">🐱 被猫抓住</span><span class="stats-value pink">' + stats.deaths.cat + ' 次 · ' + pct(stats.deaths.cat) + '%</span></div>';
html += '<div class="stats-row"><span class="stats-label">✂️ 被猫咬断</span><span class="stats-value pink">' + stats.deaths.catBite + ' 次 · ' + pct(stats.deaths.catBite) + '%</span></div>';
html += '<div class="stats-row"><span class="stats-label">🪨 撞到石头</span><span class="stats-value pink">' + stats.deaths.obstacle + ' 次 · ' + pct(stats.deaths.obstacle) + '%</span></div>';
html += '</div>';

listEl.innerHTML = html;
}

// ===== 种子局 UI =====
function openSeedSelect() {
  renderSeedList();
  const m = document.getElementById('seedModal');
  if (m) m.classList.add('show');
}
function renderSeedList() {
  const list = document.getElementById('seedList');
  if (!list) return;
  list.innerHTML = '';
  SEED_LEVELS.forEach(level => {
    const key = SEED_HIGH_KEY_PREFIX + level.id;
    let best = 0;
    try { best = parseInt(localStorage.getItem(key) || '0'); } catch(e) { best = 0; }
    const card = document.createElement('div');
    card.className = 'seed-card';
    const tags = [];
    if (level.hasObstacle) tags.push('<span class="tag tag-obs">🚧 障碍</span>');
    if (level.hasCat) tags.push('<span class="tag tag-cat">🐱 猫</span>');
    card.innerHTML =
      '<div class="seed-num">' + level.id + '</div>' +
      '<div class="seed-info">' +
        '<div class="seed-name">' + level.emoji + ' ' + level.name + '</div>' +
        '<div class="seed-tags">' + tags.join('') + '</div>' +
        '<div class="seed-best">' + (best > 0 ? '最高分 <span class="best-score">' + best + '</span>' : '尚未挑战') + '</div>' +
      '</div>' +
      '<button class="seed-lb-icon" data-seed="' + level.id + '" title="查看本关排行榜">🏆</button>';
    // 点卡片本身 → 开始游戏
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('seed-lb-icon')) return; // 点图标不进入游戏
      const m = document.getElementById('seedModal');
      if (m) m.classList.remove('show');
      if (typeof window.__startSeedGame === 'function') {
        window.__startSeedGame(level.id);
      }
    });
    list.appendChild(card);
  });
  // 绑定每张卡片的 🏆 排行榜按钮
  list.querySelectorAll('.seed-lb-icon').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const seedId = parseInt(btn.dataset.seed, 10);
      const m = document.getElementById('seedModal');
      if (m) m.classList.remove('show');
      openLeaderboard(seedId);
    });
  });
}

// ===== 商城 UI =====
let currentShopTab = 'shop';

function openShop() {
  currentShopTab = 'shop';
  renderShop();
  shopModal.classList.add('show');
}

function renderShop() {
  const coinsEl = document.getElementById('shopCoins');
  if (coinsEl) coinsEl.textContent = coins;

  document.querySelectorAll('.shop-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentShopTab);
  });

  const contentEl = document.getElementById('shopContent');
  if (!contentEl) return;

  if (gameMode === 'double') {
    contentEl.innerHTML = currentShopTab === 'shop' ? renderShopItemsDouble() : renderInventoryItemsDouble();
  } else {
    contentEl.innerHTML = currentShopTab === 'shop' ? renderShopItemsSingle() : renderInventoryItemsSingle();
  }
  bindShopEvents();
}

function renderShopItemsSingle() {
  let html = '';
  SHOP_ITEMS.forEach(item => {
    const owned = inventory[item.id] || 0;
    const canAfford = coins >= item.price;
    html += '<div class="shop-item">';
    html += '<div class="shop-item-emoji">' + item.emoji + '</div>';
    html += '<div class="shop-item-info">';
    html += '<div class="shop-item-name">' + item.name + (owned > 0 ? ' <span class="shop-item-owned">拥有 ×' + owned + '</span>' : '') + '</div>';
    html += '<div class="shop-item-desc">' + item.desc + '</div>';
    html += '</div>';
    html += '<button class="shop-item-btn' + (canAfford ? '' : ' disabled') + '" data-buy="' + item.id + '">' + item.price + ' 🪙</button>';
    html += '</div>';
  });
  return html;
}

function renderShopItemsDouble() {
  let html = '';
  SHOP_ITEMS.forEach(item => {
    const ownedP1 = inventoryP1[item.id] || 0;
    const ownedP2 = inventoryP2[item.id] || 0;
    const canAfford = coins >= item.price;
    html += '<div class="shop-item double">';
    html += '<div class="shop-item-emoji">' + item.emoji + '</div>';
    html += '<div class="shop-item-info">';
    html += '<div class="shop-item-name">' + item.name + '</div>';
    html += '<div class="shop-item-desc">' + item.desc + '</div>';
    html += '</div>';
    html += '<div class="shop-item-actions">';
    html += '<button class="shop-item-btn p1' + (canAfford ? '' : ' disabled') + '" data-buy-p1="' + item.id + '">P1<br>' + item.price + '🪙' + (ownedP1 > 0 ? ' ×' + ownedP1 : '') + '</button>';
    html += '<button class="shop-item-btn p2' + (canAfford ? '' : ' disabled') + '" data-buy-p2="' + item.id + '">P2<br>' + item.price + '🪙' + (ownedP2 > 0 ? ' ×' + ownedP2 : '') + '</button>';
    html += '</div>';
    html += '</div>';
  });
  return html;
}

function renderInventoryItemsSingle() {
  const keys = Object.keys(inventory).filter(k => inventory[k] > 0);
  if (keys.length === 0) {
    return '<div class="shop-empty">🎒 背包空空如也<br>快去道具商店买点东西吧～</div>';
  }
  let html = '';
  keys.forEach(id => {
    const item = SHOP_ITEMS.find(x => x.id === id);
    if (!item) return;
    const count = inventory[id];
    const isEquipped = equippedItem === id;
    html += '<div class="shop-item' + (isEquipped ? ' equipped' : '') + '">';
    html += '<div class="shop-item-emoji">' + item.emoji + '</div>';
    html += '<div class="shop-item-info">';
    html += '<div class="shop-item-name">' + item.name + ' <span class="shop-item-owned">×' + count + '</span></div>';
    html += '<div class="shop-item-desc">' + item.desc + '</div>';
    html += '</div>';
    if (isEquipped) html += '<button class="shop-item-btn equipped" data-unequip="1">已装备</button>';
    else html += '<button class="shop-item-btn equip" data-equip="' + id + '">装备</button>';
    html += '</div>';
  });
  html += '<div class="shop-tip">💡 装备后下一局自动使用，一局只能装备一个道具。</div>';
  return html;
}

function renderInventoryItemsDouble() {
  let html = '';

  html += '<div class="inv-player-section"><div class="inv-player-title p1">P1 的背包</div>';
  const keys1 = Object.keys(inventoryP1).filter(k => inventoryP1[k] > 0);
  if (keys1.length === 0) {
    html += '<div class="shop-empty small">背包空空</div>';
  } else {
    keys1.forEach(id => {
      const item = SHOP_ITEMS.find(x => x.id === id);
      if (!item) return;
      const count = inventoryP1[id];
      const isEquipped = equippedItemP1 === id;
      html += '<div class="shop-item small' + (isEquipped ? ' equipped p1' : '') + '">';
      html += '<div class="shop-item-emoji">' + item.emoji + '</div>';
      html += '<div class="shop-item-info"><div class="shop-item-name">' + item.name + ' <span class="shop-item-owned">×' + count + '</span></div></div>';
      if (isEquipped) html += '<button class="shop-item-btn equipped" data-unequip-p1="1">已装备</button>';
      else html += '<button class="shop-item-btn equip" data-equip-p1="' + id + '">装备</button>';
      html += '</div>';
    });
  }
  html += '</div>';

  html += '<div class="inv-player-section"><div class="inv-player-title p2">P2 的背包</div>';
  const keys2 = Object.keys(inventoryP2).filter(k => inventoryP2[k] > 0);
  if (keys2.length === 0) {
    html += '<div class="shop-empty small">背包空空</div>';
  } else {
    keys2.forEach(id => {
      const item = SHOP_ITEMS.find(x => x.id === id);
      if (!item) return;
      const count = inventoryP2[id];
      const isEquipped = equippedItemP2 === id;
      html += '<div class="shop-item small' + (isEquipped ? ' equipped p2' : '') + '">';
      html += '<div class="shop-item-emoji">' + item.emoji + '</div>';
      html += '<div class="shop-item-info"><div class="shop-item-name">' + item.name + ' <span class="shop-item-owned">×' + count + '</span></div></div>';
      if (isEquipped) html += '<button class="shop-item-btn equipped" data-unequip-p2="1">已装备</button>';
      else html += '<button class="shop-item-btn equip" data-equip-p2="' + id + '">装备</button>';
      html += '</div>';
    });
  }
  html += '</div>';

  html += '<div class="shop-tip">💡 P1 和 P2 的背包独立，装备后下一局自动使用。铜钱是共用的。</div>';
  return html;
}

function bindShopEvents() {
  document.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.buy;
      const item = SHOP_ITEMS.find(x => x.id === id);
      if (!item) return;
      if (coins < item.price) { showCheatToast('🪙 铜钱不够啦', 700); return; }
      coins -= item.price;
      inventory[id] = (inventory[id] || 0) + 1;
      saveCoins(); saveInventory();
      renderShop();
      showCheatToast('✅ 购买成功「' + item.name + '」', 700);
    });
  });

  document.querySelectorAll('[data-buy-p1]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.buyP1;
      const item = SHOP_ITEMS.find(x => x.id === id);
      if (!item) return;
      if (coins < item.price) { showCheatToast('🪙 铜钱不够啦', 700); return; }
      coins -= item.price;
      inventoryP1[id] = (inventoryP1[id] || 0) + 1;
      saveCoins(); saveInventoryP1();
      renderShop();
      showCheatToast('✅ P1 购买「' + item.name + '」', 700);
    });
  });

  document.querySelectorAll('[data-buy-p2]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.buyP2;
      const item = SHOP_ITEMS.find(x => x.id === id);
      if (!item) return;
      if (coins < item.price) { showCheatToast('🪙 铜钱不够啦', 700); return; }
      coins -= item.price;
      inventoryP2[id] = (inventoryP2[id] || 0) + 1;
      saveCoins(); saveInventoryP2();
      renderShop();
      showCheatToast('✅ P2 购买「' + item.name + '」', 700);
    });
  });

  document.querySelectorAll('[data-equip]').forEach(btn => {
    btn.addEventListener('click', () => {
      equippedItem = btn.dataset.equip;
      localStorage.setItem(EQUIPPED_KEY, equippedItem);
      renderShop();
      const item = SHOP_ITEMS.find(x => x.id === equippedItem);
      showCheatToast('✨ 已装备「' + (item ? item.name : '') + '」', 700);
    });
  });
  document.querySelectorAll('[data-unequip]').forEach(btn => {
    btn.addEventListener('click', () => {
      equippedItem = '';
      localStorage.removeItem(EQUIPPED_KEY);
      renderShop();
    });
  });

  document.querySelectorAll('[data-equip-p1]').forEach(btn => {
    btn.addEventListener('click', () => {
      equippedItemP1 = btn.dataset.equipP1;
      localStorage.setItem(EQUIPPED_P1_KEY, equippedItemP1);
      renderShop();
      const item = SHOP_ITEMS.find(x => x.id === equippedItemP1);
      showCheatToast('✨ P1 装备「' + (item ? item.name : '') + '」', 700);
    });
  });
  document.querySelectorAll('[data-unequip-p1]').forEach(btn => {
    btn.addEventListener('click', () => {
      equippedItemP1 = '';
      localStorage.removeItem(EQUIPPED_P1_KEY);
      renderShop();
    });
  });

  document.querySelectorAll('[data-equip-p2]').forEach(btn => {
    btn.addEventListener('click', () => {
      equippedItemP2 = btn.dataset.equipP2;
      localStorage.setItem(EQUIPPED_P2_KEY, equippedItemP2);
      renderShop();
      const item = SHOP_ITEMS.find(x => x.id === equippedItemP2);
      showCheatToast('✨ P2 装备「' + (item ? item.name : '') + '」', 700);
    });
  });
  document.querySelectorAll('[data-unequip-p2]').forEach(btn => {
    btn.addEventListener('click', () => {
      equippedItemP2 = '';
      localStorage.removeItem(EQUIPPED_P2_KEY);
      renderShop();
    });
  });
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

const isMobileDevice = ('ontouchstart' in window) && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
if (isMobileDevice) {
  modeDoubleBtn.disabled = true;
  modeDoubleBtn.textContent = '👥 双人(手机不支持)';
  modeDoubleBtn.title = '手机端暂不支持双人模式';
}

function updateModeButtons() {
modeSingleBtn.classList.toggle('active', gameMode === 'single' && currentSeedId === null);
modeDoubleBtn.classList.toggle('active', gameMode === 'double');
}
modeSingleBtn.addEventListener('click', () => {
if (gameMode === 'single' && currentSeedId === null) return;
gameMode = 'single';
// ★ 清空种子模式
if (typeof window.__clearSeedMode === 'function') window.__clearSeedMode();
updateModeButtons();
updateCatModeBtn();
overlayTitle.textContent = '十二生肖闯江湖';
overlayMsg.textContent = '单人模式 · 准备好踏入江湖了吗？';
startBtn.textContent = '开始修炼';
});
modeDoubleBtn.addEventListener('click', () => {
if (gameMode === 'double') return;
if (isMobileDevice) return;
gameMode = 'double';
if (typeof window.__clearSeedMode === 'function') window.__clearSeedMode();
updateModeButtons();
updateCatModeBtn();
overlayTitle.textContent = '👥 双人对战';
overlayMsg.textContent = 'P1 = WASD  ·  P2 = 方向键  ·  先到 300 分或对方先死获胜';
startBtn.textContent = '开始对战';
});
// 🗺️ 迷宫模式入口（带跳转加载遮罩）
const modeMazeBtn = document.getElementById('modeMaze');
if (modeMazeBtn) {
  modeMazeBtn.addEventListener('click', () => {
    const el = document.getElementById('globalLoading');
    const txt = document.getElementById('globalLoadingText');
    const bar = document.getElementById('globalLoadingProgress');
    if (el && txt && bar) {
      txt.textContent = '🗺️ 正在进入迷宫...';
      el.classList.remove('hidden');
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        bar.style.width = '60%';
        setTimeout(() => { bar.style.width = '100%'; }, 250);
      });
      setTimeout(() => { window.location.href = 'maze.html'; }, 650);
    } else {
      window.location.href = 'maze.html';
    }
  });
}
// 🌱 种子局入口
const modeSeedBtn = document.getElementById('modeSeed');
if (modeSeedBtn) {
  modeSeedBtn.addEventListener('click', () => {
    openSeedSelect();
  });
}
// 种子弹窗关闭
const seedModalEl = document.getElementById('seedModal');
if (seedModalEl) {
  const closeSeedBtn = document.getElementById('closeSeed');
  if (closeSeedBtn) closeSeedBtn.addEventListener('click', () => seedModalEl.classList.remove('show'));
  seedModalEl.addEventListener('click', (e) => { if (e.target === seedModalEl) seedModalEl.classList.remove('show'); });
}
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
applyEquippedItem();
startLoop();
if (window.__updateSkillBtn) window.__updateSkillBtn();
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
if (['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d','e','p'].includes(key)) e.preventDefault();
if (key === ' ') { togglePause(); return; }
if (key === 'e') {
  if (typeof triggerActiveSkill === 'function') triggerActiveSkill(0);
}
if (key === 'p' && gameMode === 'double') {
  if (typeof triggerActiveSkill === 'function') triggerActiveSkill(1);
}
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

// ===== 数据统计按钮绑定 =====
const statsBtnEl = document.getElementById('statsBtn');
const statsModalEl = document.getElementById('statsModal');
if (statsBtnEl && statsModalEl) {
  statsBtnEl.addEventListener('click', () => { renderStats(); statsModalEl.classList.add('show'); });
  document.getElementById('closeStats').addEventListener('click', () => statsModalEl.classList.remove('show'));
  statsModalEl.addEventListener('click', (e) => { if (e.target === statsModalEl) statsModalEl.classList.remove('show'); });
}

// ===== 商城按钮绑定 =====
const shopBtnEl = document.getElementById('shopBtn');
if (shopBtnEl && shopModal) {
  shopBtnEl.addEventListener('click', openShop);
  document.getElementById('closeShop').addEventListener('click', () => shopModal.classList.remove('show'));
  shopModal.addEventListener('click', (e) => { if (e.target === shopModal) shopModal.classList.remove('show'); });
  document.querySelectorAll('.shop-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentShopTab = btn.dataset.tab;
      renderShop();
    });
  });
}

// ===== 技能按钮（手机端） =====
const skillBtnEl = document.getElementById('skillBtn');
const skillCountEl = document.getElementById('skillCount');

function updateSkillBtn() {
  if (!skillBtnEl) return;
  const p = snakes && snakes[0];
  if (!p || gameMode !== 'single' || isGameOver) {
    skillBtnEl.style.display = 'none';
    return;
  }
  const skin = p.skinId;
  let left = 0, emoji = '✨';
  if (skin === 'she') { left = p.ghostLeft || 0; emoji = '🐍'; }
  else if (skin === 'hu') { left = p.phantomLeft || 0; emoji = '🐯'; }
  else if (skin === 'long') { left = p.longLeft || 0; emoji = '🐲'; }
  else if (skin === 'yang') { left = p.yangLeft || 0; emoji = '🐑'; }
  else { skillBtnEl.style.display = 'none'; return; }
  skillBtnEl.firstChild.textContent = emoji;
  if (left <= 0) skillBtnEl.classList.add('disabled');
  else skillBtnEl.classList.remove('disabled');
  skillBtnEl.style.display = '';
  skillCountEl.textContent = left;
}

function triggerSkillFromButton() {
  if (typeof triggerActiveSkill === 'function') triggerActiveSkill(0);
}

if (skillBtnEl) {
  if (window.PointerEvent) {
    skillBtnEl.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); triggerSkillFromButton(); });
  } else {
    skillBtnEl.addEventListener('touchstart', (e) => { e.preventDefault(); triggerSkillFromButton(); }, { passive: false });
    skillBtnEl.addEventListener('mousedown', (e) => { e.preventDefault(); triggerSkillFromButton(); });
  }
}

setInterval(updateSkillBtn, 300);
window.__updateSkillBtn = updateSkillBtn;

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
const total = 1; // 只需要等 atlas.png（atlas.js 已通过 <script> 同步加载）
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
if (window.__updateSkillBtn) window.__updateSkillBtn();
}, 300);
}
let done = false;
const complete = () => { if (done) return; done = true; loadedCount++; updateProgress(); finish(); };
const timer = setTimeout(() => { console.warn('atlas.png 加载超时'); complete(); }, 8000);
atlasImg.onload = () => { clearTimeout(timer); complete(); };
atlasImg.onerror = () => { console.warn('atlas.png 加载失败'); clearTimeout(timer); complete(); };
atlasImg.src = ATLAS_IMAGE_URL;
}

Object.values(BGM).forEach(url => { const pre = new Audio(); pre.preload = 'auto'; pre.src = url; });
audio.src = BGM.menu;
startLoadingScreen();
// ==================== ★ 排行榜前端逻辑 ★ ====================
const LEADERBOARD_API = 'https://zhipu.wange5232.workers.dev/leaderboard';

let currentLbSeedId = null;

// 打开排行榜弹窗
function openLeaderboard(seedId) {
  if (!seedId) return;
  currentLbSeedId = seedId;
  const modal = document.getElementById('leaderboardModal');
  const content = document.getElementById('leaderboardContent');
  const title = document.getElementById('leaderboardTitle');
  
  const seedInfo = SEED_LEVELS.find(s => s.id === seedId);
  title.textContent = '🏆 ' + (seedInfo ? seedInfo.name : '种子局') + ' 排行榜';
  
  content.innerHTML = '<div class="leaderboard-loading">加载中...</div>';
  modal.classList.add('show');
  
  fetchLeaderboard(seedId);
}

// 拉取数据并渲染
async function fetchLeaderboard(seedId) {
  const content = document.getElementById('leaderboardContent');
  try {
    const res = await fetch(LEADERBOARD_API + '/list?seedId=' + seedId + '&limit=20');
    const data = await res.json();
    
    if (!data.leaderboard || data.leaderboard.length === 0) {
      content.innerHTML = '<div class="leaderboard-empty">🏜️ 暂无记录，快来抢第一！</div>';
      return;
    }
    
    let html = '<div class="leaderboard-list">';
    const myName = localStorage.getItem('snakePlayerName') || '';
    
    data.leaderboard.forEach(item => {
      const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '#' + item.rank;
      const isMe = item.playerName === myName ? ' is-me' : '';
      html += `<div class="leaderboard-row${isMe}">
        <span class="lb-rank">${medal}</span>
        <span class="lb-name">${item.playerName}</span>
        <span class="lb-score">${item.score}</span>
      </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
  } catch (e) {
    console.warn('排行榜拉取失败:', e);
    content.innerHTML = '<div class="leaderboard-empty">📡 加载失败，请检查网络后重试</div>';
  }
}

// 绑定排行榜弹窗事件
document.addEventListener('DOMContentLoaded', () => {
  const lbBtn = document.getElementById('openLeaderboardBtn');
  const lbModal = document.getElementById('leaderboardModal');
  const closeLbBtn = document.getElementById('closeLeaderboard');
  
  if (lbBtn) {
    lbBtn.addEventListener('click', () => {
      const seedModal = document.getElementById('seedModal');
      if (seedModal) seedModal.classList.remove('show');
      // 默认打开第一个种子局的排行榜，或者提示用户
      openLeaderboard(1); 
    });
  }
  if (closeLbBtn) closeLbBtn.addEventListener('click', () => lbModal.classList.remove('show'));
  if (lbModal) lbModal.addEventListener('click', (e) => { if (e.target === lbModal) lbModal.classList.remove('show'); });
});