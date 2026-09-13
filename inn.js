// ==========================================================================
// 🏮 江湖客栈 · 页面逻辑
// --------------------------------------------------------------------------
// 职责：
//   1. 读取好感度 & 金币，动态渲染三个（未来更多）房间
//   2. 点击房间 → 弹出详情弹窗（好感度条 + 三档解锁内容）
//   3. 点击「让他说一句」→ 调 AI 生成方言气泡
//   4. 点击「回主菜单」→ 带加载遮罩跳转
// ==========================================================================

const SM = window.SaveManager;
if (!SM) console.error('[客栈] SaveManager 未加载');

// ---------- 状态 ----------
let currentChar = null;
let aiSpeaking = false;

// ---------- 元素引用 ----------
const roomsEl        = document.getElementById('innRooms');
const coinsEl        = document.getElementById('innCoins');
const dialogEl       = document.getElementById('hostessDialog');
const backBtn        = document.getElementById('innBackBtn');

const roomModal      = document.getElementById('roomModal');
const roomModalClose = document.getElementById('roomModalClose');
const rmAvatar       = document.getElementById('rmAvatar');
const rmName         = document.getElementById('rmName');
const rmTitle        = document.getElementById('rmTitle');
const rmAffTier      = document.getElementById('rmAffTier');
const rmAffNum       = document.getElementById('rmAffNum');
const rmAffFill      = document.getElementById('rmAffFill');
const rmUnlocks      = document.getElementById('rmUnlocks');
const rmDialog       = document.getElementById('rmDialog');
const rmSpeakBtn     = document.getElementById('rmSpeakBtn');

const loadingEl      = document.getElementById('innLoading');
const loadingText    = document.getElementById('innLoadingText');
const loadingBar     = document.getElementById('innLoadingProgress');

// ---------- AI 配置（从 data.js 统一读取，不再本地声明）----------

// ---------- 工具函数 ----------
function readAffinity() {
  const raw = SM.getJSON(INN_AFFINITY_KEY, {});
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const clean = {};
  Object.keys(raw).forEach(k => {
    const n = parseInt(raw[k], 10);
    if (Number.isFinite(n) && n >= 0) clean[k] = Math.min(n, INN_MAX_AFFINITY);
  });
  return clean;
}

function readUnlockedSkins() {
  // 成就解锁 + 作弊解锁，两类都算
  const ach = SM.getStringArray('snakeAchievementsV5', null);
  const cheat = SM.getStringArray('snakeCheatSkins', null);
  return new Set([...ach, ...cheat]);
}

function isSkinUnlockedForChar(char) {
  if (!char.skinId) return true;
  const skin = (window.SKINS || {})[char.skinId];
  if (!skin || !skin.unlockId) return true;
  return readUnlockedSkins().has(skin.unlockId);
}

// ---------- 渲染房间 ----------
function renderRooms() {
  const affinity = readAffinity();
  const unlocked = readUnlockedSkins();
  roomsEl.innerHTML = '';

  Object.values(INN_CHARACTERS).forEach(char => {
    const aff = affinity[char.id] || 0;
    const tier = getInnTier(aff);
    const isUnlocked = isSkinUnlockedForChar(char);

    const room = document.createElement('div');
    room.className = 'inn-room' + (isUnlocked ? '' : ' locked');
    room.dataset.char = char.id;
    room.style.left = char.roomPos.x + '%';
    room.style.top  = char.roomPos.y + '%';

    const pct = Math.min(100, aff / INN_MAX_AFFINITY * 100);
    room.innerHTML =
      // 可点击区 A：点木屋+名字 → 头顶气泡（对白）
      '<div class="room-talk" data-action="talk">' +
        '<div class="room-house">' +
          '<span class="room-emoji">' + char.emoji + '</span>' +
          '<div class="room-body"></div>' +
          (aff >= INN_MAX_AFFINITY ? '<span class="room-badge">🏅</span>' : '') +
        '</div>' +
        '<div class="room-name">' + char.name + '</div>' +
        '<div class="room-title">' + (isUnlocked ? char.title : '🔒 未解锁') + '</div>' +
      '</div>' +
      // 可点击区 B：点好感条 → 弹详情窗
      '<div class="room-aff" data-action="detail" title="点击查看好感详情">' +
        '<div class="room-aff-bar">' +
          '<div class="room-aff-fill" style="width:' + pct + '%;"></div>' +
          '<span class="room-aff-mark" style="left:33.3%"></span>' +
          '<span class="room-aff-mark" style="left:66.6%"></span>' +
          '<span class="room-aff-mark" style="left:100%"></span>' +
        '</div>' +
        '<div class="room-aff-num">' +
          '<span class="room-aff-heart">💗</span>' +
          '<span>' + aff + ' / ' + INN_MAX_AFFINITY + '</span>' +
        '</div>' +
      '</div>' +
      // 头顶气泡容器
      '<div class="room-bubble" id="bubble-' + char.id + '"></div>';

    if (isUnlocked) {
      const talkArea = room.querySelector('[data-action="talk"]');
      const detailArea = room.querySelector('[data-action="detail"]');
      talkArea.addEventListener('click', (e) => {
        e.stopPropagation();
        speakFromRoom(char, room);
      });
      detailArea.addEventListener('click', (e) => {
        e.stopPropagation();
        openRoomModal(char);
      });
    }
    roomsEl.appendChild(room);
  });
}

// ---------- 打开详情弹窗 ----------
function openRoomModal(char) {
  currentChar = char;
  const affinity = readAffinity();
  const aff = affinity[char.id] || 0;
  const tier = getInnTier(aff);

  rmAvatar.textContent = char.emoji;
  rmName.textContent = char.name;
  rmTitle.textContent = char.title;
  rmAffTier.textContent = INN_TIER_NAMES[tier];
  rmAffNum.textContent = aff + ' / ' + INN_MAX_AFFINITY;
  rmAffFill.style.width = '0%';
  // 下一帧再设置宽度触发过渡动画
  requestAnimationFrame(() => {
    rmAffFill.style.width = (aff / INN_MAX_AFFINITY * 100) + '%';
  });

  // 三档解锁内容
  const unlocks = [
    { need: 100, icon: '🗣️', title: '方言台词', body: char.dialogs[0] || '' },
    { need: 200, icon: '📖', title: '小故事',   body: char.story },
    { need: 300, icon: '🏅', title: '客栈徽章', body: char.name + ' · 挚友徽章（专属称号）' }
  ];

  // ★ 觉醒预览（暂未实装，仅作设计展示）
  if (char.awakening) {
    unlocks.push({
      need: 300,
      icon: '🌟',
      title: '皮肤觉醒 · ' + char.awakening.name,
      body: char.awakening.desc
    });
  }
  let html = '';
  unlocks.forEach(u => {
    const unlocked = aff >= u.need;
    html +=
      '<div class="rm-unlock' + (unlocked ? ' unlocked' : ' locked') + '">' +
        '<div class="rm-unlock-head">' +
          '<span>' + u.icon + ' ' + u.title + '</span>' +
          '<span class="rm-unlock-tag">' + (unlocked ? '✅ 已解锁' : '还需 ' + (u.need - aff)) + '</span>' +
        '</div>' +
        '<div class="rm-unlock-body">' + (unlocked ? u.body : '好感度达到 ' + u.need + ' 后解锁') + '</div>' +
      '</div>';
  });
  rmUnlocks.innerHTML = html;

  // 重置对话气泡
  rmDialog.classList.remove('show');
  rmDialog.textContent = '';

  // ★ 好感度 < 100 时不能对话（对应第一档「方言台词」解锁）
  if (aff >= 100) {
    rmSpeakBtn.disabled = false;
    rmSpeakBtn.textContent = '💬 让他说一句';
  } else {
    rmSpeakBtn.disabled = true;
    rmSpeakBtn.textContent = '🔒 好感度 100 解锁对话';
  }

  roomModal.classList.add('show');
}

function closeRoomModal() {
  roomModal.classList.remove('show');
  currentChar = null;
  aiSpeaking = false;
}

// ---------- 头顶气泡：点木屋 → 在人物旁边弹一句话 ----------
const roomBubbleBusy = {};   // 每个角色一个忙闲锁，避免连点重复调用

async function speakFromRoom(char, roomEl) {
  if (roomBubbleBusy[char.id]) return;

  const affinity = readAffinity();
  const aff = affinity[char.id] || 0;
  const bubble = roomEl.querySelector('.room-bubble');
  if (!bubble) return;

  // 关闭其他已开的气泡
  document.querySelectorAll('.room-bubble.show').forEach(b => {
    if (b !== bubble) b.classList.remove('show');
  });

  // 好感度 < 100：还不能对话，弹一句"我们不熟"
  if (aff < 100) {
    bubble.textContent = '咱们还不熟，等你多来几趟再说～';
    bubble.classList.add('show', 'locked');
    setTimeout(() => {
      bubble.classList.remove('show');
      setTimeout(() => bubble.classList.remove('locked'), 400);
    }, 2400);
    return;
  }

  roomBubbleBusy[char.id] = true;
  bubble.classList.remove('locked');
  bubble.classList.add('show', 'thinking');
  bubble.textContent = '💭 正在想…';

  await fetchDialectText(char, (text, isFallback) => {
    bubble.textContent = text || '💭 正在想…';
    if (!isFallback) bubble.classList.remove('thinking');
  });
  bubble.classList.remove('thinking');

  // 8 秒后自动收起
  clearTimeout(bubble.__hideTimer);
  bubble.__hideTimer = setTimeout(() => {
    bubble.classList.remove('show');
    setTimeout(() => { roomBubbleBusy[char.id] = false; }, 400);
  }, 8000);

  roomBubbleBusy[char.id] = false;
}

// ---------- 通用：调 AI 取一句方言（通过 onDelta 回调逐字返回）----------
async function fetchDialectText(char, onDelta) {
  const affinity = readAffinity();
  const aff = affinity[char.id] || 0;
  const tier = getInnTier(aff);
  const tierName = INN_TIER_NAMES[tier];

  const sysPrompt = [
    '你是《十二生肖闯江湖》客栈中的一位生肖角色，请你完全入戏。',
    '',
    '【角色档案】',
    '名字：' + char.name,
    '身份：' + char.title,
    '人设：' + char.personality,
    '方言：' + char.dialect,
    '方言特点：' + char.dialectNote,
    '背景故事：' + char.story,
    '',
    '【当前关系】',
    '客栈客人和你的好感度等级：' + tierName + '（0=初识，1=熟络，2=知己，3=挚友）',
    '· 初识：客气、疏离、礼貌打招呼',
    '· 熟络：热情、自然、带点小调侃',
    '· 知己：亲昵、掏心窝、把客人当自己人',
    '· 挚友：无话不谈、开熟客玩笑、关心客人近况',
    '',
    '【输出要求】',
    '1. 用你的第一人称，用你的方言口吻，对客栈的客人说一句话',
    '2. 不超过 40 字',
    '3. 必须体现你的性格和方言特点',
    '4. 必须符合当前好感度等级的语气',
    '5. 直接输出这句话，不要加引号、不要加"他说："、不要加表情符号以外的任何前缀'
  ].join('\n');

  const userPrompt = '客人刚走进来，跟我说句话吧。';
  const fallback = char.dialogs[tier] || char.dialogs[0];

  if (typeof AI_API_KEY === 'undefined' || !AI_API_KEY || AI_API_KEY.length < 20) {
    if (onDelta) onDelta(fallback, true);
    return fallback;
  }

  try {
    const resp = await fetch(AI_BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_API_KEY
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: 0.95,
        max_tokens: 80
      })
    });

    if (!resp.ok) throw new Error('API ' + resp.status);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    if (onDelta) onDelta('', false);   // 先清空

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
          if (delta) {
            fullText += delta;
            if (onDelta) onDelta(fullText, false);
          }
        } catch (e) {}
      }
    }

    if (!fullText.trim()) {
      if (onDelta) onDelta(fallback, true);
      return fallback;
    }
    return fullText;
  } catch (e) {
    console.warn('[客栈 AI] 失败:', e);
    if (onDelta) onDelta(fallback, true);
    return fallback;
  }
}


// ---------- 事件绑定 ----------
rmSpeakBtn.addEventListener('click', async () => {
  if (aiSpeaking || !currentChar) return;
  const affinity = readAffinity();
  const aff = affinity[currentChar.id] || 0;
  if (aff < 100) return;

  aiSpeaking = true;
  rmSpeakBtn.disabled = true;
  rmSpeakBtn.textContent = '💭 正在酝酿...';
  rmDialog.classList.add('show', 'thinking');
  rmDialog.textContent = '🤖 AI 正在思考...';

  await fetchDialectText(currentChar, (text, isFallback) => {
    rmDialog.textContent = text || '🤖 AI 正在思考...';
    if (!isFallback) rmDialog.classList.remove('thinking');
  });
  rmDialog.classList.remove('thinking');

  rmSpeakBtn.disabled = false;
  rmSpeakBtn.textContent = '💬 再说一句';
  aiSpeaking = false;
});

roomModalClose.addEventListener('click', closeRoomModal);
roomModal.addEventListener('click', (e) => {
  if (e.target === roomModal) closeRoomModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && roomModal.classList.contains('show')) closeRoomModal();
});

// ---------- 返回主菜单 ----------
backBtn.addEventListener('click', () => {
  if (loadingEl) {
    loadingText.textContent = '🏠 返回主菜单...';
    loadingEl.classList.remove('hidden');
    loadingBar.style.width = '0%';
    requestAnimationFrame(() => {
      loadingBar.style.width = '60%';
      setTimeout(() => { loadingBar.style.width = '100%'; }, 250);
    });
    setTimeout(() => { window.location.href = 'index.html'; }, 650);
  } else {
    window.location.href = 'index.html';
  }
});

// ---------- 老板娘欢迎语（随机轮换）----------
const HOSTESS_GREETINGS = [
  '客官里边请～',
  '稀客稀客，快进来坐～',
  '哟，是宝宝来了呀～',
  '今晚有酒有肉，就差你了～',
  '推门就是江湖，进来歇歇脚～'
];
let greetIdx = 0;
setInterval(() => {
  if (roomModal.classList.contains('show')) return;
  greetIdx = (greetIdx + 1) % HOSTESS_GREETINGS.length;
  dialogEl.style.opacity = '0';
  setTimeout(() => {
    dialogEl.textContent = HOSTESS_GREETINGS[greetIdx];
    dialogEl.style.opacity = '1';
  }, 300);
}, 5000);

// ---------- 手机端作弊：连点老板娘 5 次，全部好感度拉满 ----------
let hostessTapCount = 0;
let hostessTapTimer = null;
const hostessEl = document.querySelector('.inn-hostess');
if (hostessEl) {
  hostessEl.addEventListener('click', () => {
    hostessTapCount++;
    clearTimeout(hostessTapTimer);
    if (hostessTapCount >= 5) {
      hostessTapCount = 0;
      // 全部好感度拉满
      const maxAff = {};
      Object.keys(INN_CHARACTERS).forEach(k => { maxAff[k] = INN_MAX_AFFINITY; });
      SM.setJSON(INN_AFFINITY_KEY, maxAff);
      // 提示 + 刷新房间
      const tip = document.createElement('div');
      tip.className = 'inn-cheat-toast';
      tip.textContent = '💗 老板娘悄悄告诉你：所有生肖的好感度都满啦～';
      document.body.appendChild(tip);
      requestAnimationFrame(() => tip.classList.add('show'));
      setTimeout(() => {
        tip.classList.remove('show');
        setTimeout(() => tip.remove(), 400);
      }, 2200);
      setTimeout(() => renderRooms(), 300);
      return;
    }
    hostessTapTimer = setTimeout(() => { hostessTapCount = 0; }, 2000);
  });
}

// ---------- 启动 ----------
(function init() {
  // 金币显示
  if (coinsEl) {
    const c = SM.getInt('snakeCoinsV1', 0, 0, 99999999);
    coinsEl.textContent = c;
  }
  renderRooms();
})();