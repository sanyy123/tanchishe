// ===== 常量键 =====
const ACHIEVE_KEY = 'snakeAchievementsV5';
const HIGH_KEY = 'snakeHighScoreV5';
const TOTAL_KEY = 'snakeTotalScoreV5';
const STATS_KEY = 'snakeStatsV1';
const COINS_KEY = 'snakeCoinsV1';
const INVENTORY_KEY = 'snakeInventoryV1';
const EQUIPPED_KEY = 'snakeEquippedV1';
const INVENTORY_P1_KEY = 'snakeInventoryP1V1';
const INVENTORY_P2_KEY = 'snakeInventoryP2V1';
const EQUIPPED_P1_KEY = 'snakeEquippedP1V1';
const EQUIPPED_P2_KEY = 'snakeEquippedP2V1';

// ===== 种子局 =====
const SEED_HIGH_KEY_PREFIX = 'snakeSeedHigh_';
const SEED_LEVELS = [
  { id: 1,  emoji: '🌱', name: '新手道',   seed: 20260101, hasCat: false, hasObstacle: true,  desc: '轻松热身' },
  { id: 2,  emoji: '🪨', name: '落石谷',   seed: 20260102, hasCat: false, hasObstacle: true,  desc: '石头密集' },
  { id: 3,  emoji: '🌀', name: '传送阵',   seed: 20260103, hasCat: false, hasObstacle: true,  desc: '传送门频繁' },
  { id: 4,  emoji: '🌿', name: '迷宫小径', seed: 20260104, hasCat: false, hasObstacle: true,  desc: '综合难度' },
  { id: 5,  emoji: '⚡', name: '险象环生', seed: 20260105, hasCat: false, hasObstacle: true,  desc: '综合偏难' },
  { id: 6,  emoji: '🐱', name: '猫影初现', seed: 20260106, hasCat: true,  hasObstacle: true,  desc: '250 分出猫' },
  { id: 7,  emoji: '🐈', name: '双猫乱舞', seed: 20260107, hasCat: true,  hasObstacle: true,  desc: '猫 + 石头' },
  { id: 8,  emoji: '🐈‍⬛', name: '猫鼠追击', seed: 20260108, hasCat: true,  hasObstacle: true,  desc: '猫 + 传送门' },
  { id: 9,  emoji: '🕸️', name: '天罗地网', seed: 20260109, hasCat: true,  hasObstacle: true,  desc: '猫 + 石头 + 传送门' },
  { id: 10, emoji: '💀', name: '绝地求生', seed: 20260110, hasCat: true,  hasObstacle: true,  desc: '满配极限挑战' }
];

// ===== 皮肤 =====
const SKINS = {
default: { id:'default', name:'经典青蛇', emoji:'🐍', unlockId:null, boardBg:'#0d1117', gridColor:'rgba(0,200,220,0.45)', headColors:['#5efce8','#00f5d4','#00bbf9'], bodyHue:{r:0,g:235,b:220}, foodColors:['#ff9a9a','#ff6b6b','#e03131'] },
shu: { id:'shu', name:'鼠来宝', emoji:'🐭', unlockId:'skin_shu', skill:{ name:'鼠符咒 · 聚财', type:'passive', desc:'结算铜钱 +15%' } },
niu: { id:'niu', name:'牛气冲天', emoji:'🐮', unlockId:'skin_niu', skill:{ name:'牛符咒 · 铁壁', type:'passive', desc:'每局 3 次撞碎石头不死' } },
hu: { id:'hu', name:'虎虎生威', emoji:'🐯', unlockId:'skin_hu', skill:{ name:'虎符咒 · 分身', type:'active', desc:'按 E 生成幻影蛇 5 秒，猫优先追幻影，每局 2 次' } },
tu: { id:'tu', name:'玉兔东升', emoji:'🐰', unlockId:'skin_tu', skill:{ name:'兔符咒 · 疾风', type:'passive', desc:'初始速度 +10%，加速药水 8 秒，连击窗口 +0.5 秒' } },
long: { id:'long', name:'龙腾四海', emoji:'🐲', unlockId:'skin_long', skill:{ name:'龙符咒 · 炎爆', type:'active', desc:'按 E 喷火 5 格，清石头、击中猫停 1 次，两次全中猫死，每局 2 次（CD 5 秒）' } },
she: { id:'she', name:'灵蛇出洞', emoji:'🐍', unlockId:'skin_she', skill:{ name:'蛇符咒 · 隐踪', type:'active', desc:'按 E 幽灵模式 3 秒，穿石头/自己/对方，每局 3 次' } },
ma: { id:'ma', name:'一马当先', emoji:'🐴', unlockId:'skin_ma', skill:{ name:'马符咒 · 回春', type:'passive', desc:'死亡后原地复活一次，不扣分，带 1.5 秒无敌虚化' } },
yang: { id:'yang', name:'三羊开泰', emoji:'🐑', unlockId:'skin_yang', skill:{ name:'羊符咒 · 魂游', type:'active', desc:'有猫时眩晕猫 3 次移动，无猫时自身无敌 3 秒，每局 3 次' } }
};

// ===== 双人模式 P2 的颜色 =====
const P2_HEAD_COLORS = ['#ff9ec7', '#f15bb5', '#9b5de5'];
const P2_BODY_HUE = { r: 241, g: 91, b: 181 };
const P2_FOOD_COLORS = ['#ffb6d9', '#f15bb5', '#9b5de5'];

// ===== 商城道具 =====
const SHOP_ITEMS = [
  { id:'fu',      name:'护身符',  emoji:'🛡️', price:15, desc:'开局自带一个护盾，可免疫一次死亡' },
  { id:'zhaocai', name:'招财符',  emoji:'💰', price:10, desc:'开局直接 +30 分，相当于白吃 3 个食物' },
  { id:'jifeng',  name:'疾风符',  emoji:'⚡', price:12, desc:'开局获得 5 秒加速效果，期间分数翻倍' },
  { id:'luopan',  name:'寻宝罗盘', emoji:'🔮', price:20, desc:'本局特殊食物刷新率翻倍，更容易出金元宝' },
  { id:'xuming',  name:'续命丹',  emoji:'💖', price:50, desc:'本局死亡时原地复活一次，保留一半分数' }
];

// ===== 图片 URL =====
const ASSET_KEYS = ['head','body','food','leaf','rab_head','rab_body','rab_food','rab_paw','dragon_head','dragon_decor','dragon_food','dragon_tail','snake_head','snake_tail','snake_food','snake_drop','snake_leaf','horse_head','horse_tail','horse_food','horse_decor','sheep_head','sheep_tail','sheep_food','sheep_decor','cat_head'];
const ASSET_URLS = {
head:'https://image.arityflow.top/uploads/2026/09/6aa356deba88b8.21233887_b9e60b5e.png',
body:'https://image.arityflow.top/uploads/2026/09/6aa356deba26b9.46998108_9a8ed4b8.png',
food:'https://image.arityflow.top/uploads/2026/09/6aa356debb5252.38936418_fffabaa3.png',
leaf:'https://image.arityflow.top/uploads/2026/09/6aa356debc2132.60832467_95dd7a5b.png',
rab_head:'https://image.arityflow.top/uploads/2026/09/6aa36a3bd1f804.90329529_c3d1e874.png',
rab_body:'https://image.arityflow.top/uploads/2026/09/6aa36a3bd1d4c9.59552401_85683360.png',
rab_food:'https://image.arityflow.top/uploads/2026/09/6aa36a3bd21114.87064191_fd857620.png',
rab_paw:'https://image.arityflow.top/uploads/2026/09/6aa36a3bd19aa3.05231101_2d978cf0.png',
dragon_head:'https://image.arityflow.top/uploads/2026/09/6aa36e868f2b03.99926099_86ae4a99.png',
dragon_decor:'https://image.arityflow.top/uploads/2026/09/6aa36e868f5a99.30809262_383a272e.png',
dragon_food:'https://image.arityflow.top/uploads/2026/09/6aa36e868f7368.71202277_ca1778a4.png',
dragon_tail:'https://image.arityflow.top/uploads/2026/09/6aa3715b190fb8.56285996_d468575b.png',
snake_head:'https://image.arityflow.top/uploads/2026/09/6aa38251c00717.62308042_a820e398.png',
snake_tail:'https://image.arityflow.top/uploads/2026/09/6aa394d4d15705.11001502_ccf75684.png',
snake_food:'https://image.arityflow.top/uploads/2026/09/6aa38251c06cb4.00963954_9f53019a.png',
snake_drop:'https://image.arityflow.top/uploads/2026/09/6aa38251c07e54.72663869_80a125c7.png',
snake_leaf:'https://image.arityflow.top/uploads/2026/09/6aa38251c08d46.88761122_ec110538.png',
horse_head:'https://image.arityflow.top/uploads/2026/09/6aa387a99818a9.25005861_37dfc549.png',
horse_tail:'https://image.arityflow.top/uploads/2026/09/6aa387a9986397.35619771_dbf38f2c.png',
horse_food:'https://image.arityflow.top/uploads/2026/09/6aa394d4d17db0.72127420_62027464.png',
horse_decor:'https://image.arityflow.top/uploads/2026/09/6aa387a9985341.74896386_f8ee9470.png',
sheep_head:'https://image.arityflow.top/uploads/2026/09/6aa38bcd3f9b79.10883751_673cbd56.png',
sheep_tail:'https://image.arityflow.top/uploads/2026/09/6aa38bcd3ff2f0.01251712_a76b01ff.png',
sheep_food:'https://image.arityflow.top/uploads/2026/09/6aa38bcd3fc217.47547830_71182fd9.png',
sheep_decor:'https://image.arityflow.top/uploads/2026/09/6aa38bcd3fdeb6.82296885_966ccafb.png',
cat_head:'https://image.arityflow.top/uploads/2026/09/6aa3caa9164bd1.18514664_fd7e5de1.png'
};

// ===== BGM =====
const BGM = { menu:'https://soundimage.org/wp-content/uploads/2020/10/Arcade-Quirkiness.mp3', stage0:'https://soundimage.org/wp-content/uploads/2017/07/Arcade-Puzzler.mp3', stage1:'https://soundimage.org/wp-content/uploads/2021/05/More-Coin-Op-Chaos.mp3', stage2:'https://soundimage.org/wp-content/uploads/2022/01/Technocade.mp3' };

// ===== 成就 =====
const ACHIEVEMENTS = [
{ id:'skin_shu', name:'鼠来宝', desc:'积分达到 30 · 解锁【鼠】皮肤', icon:'🐭', check:()=>score>=30, progress:()=>Math.min(score/30,1) },
{ id:'skin_niu', name:'牛气冲天', desc:'积分达到 70 · 解锁【牛】皮肤', icon:'🐮', check:()=>score>=70, progress:()=>Math.min(score/70,1) },
{ id:'skin_hu', name:'虎虎生威', desc:'积分达到 130 · 解锁【虎】皮肤', icon:'🐯', check:()=>score>=130, progress:()=>Math.min(score/130,1) },
{ id:'skin_tu', name:'玉兔东升', desc:'积分达到 200 · 解锁【兔】皮肤', icon:'🐰', check:()=>score>=200, progress:()=>Math.min(score/200,1) },
{ id:'skin_long', name:'龙腾四海', desc:'积分达到 300 · 解锁【龙】皮肤', icon:'🐲', check:()=>score>=300, progress:()=>Math.min(score/300,1) },
{ id:'skin_she', name:'灵蛇出洞', desc:'体长达到 12 · 解锁【蛇】皮肤', icon:'🐍', check:()=>maxLengthReached>=12, progress:()=>Math.min(maxLengthReached/12,1) },
{ id:'skin_ma', name:'一马当先', desc:'积分达到 450 · 解锁【马】皮肤', icon:'🐴', check:()=>score>=450, progress:()=>Math.min(score/450,1) },
{ id:'skin_yang', name:'三羊开泰', desc:'积分达到 600 · 解锁【羊】皮肤', icon:'🐑', check:()=>score>=600, progress:()=>Math.min(score/600,1) },
{ id:'skin_hou', name:'灵猴献瑞', desc:'单局吃掉 20 个食物 · 解锁【猴】皮肤', icon:'🐵', check:()=>foodsEaten>=20, progress:()=>Math.min(foodsEaten/20,1) },
{ id:'skin_ji', name:'金鸡独立', desc:'体长达到 18 · 解锁【鸡】皮肤', icon:'🐔', check:()=>maxLengthReached>=18, progress:()=>Math.min(maxLengthReached/18,1) },
{ id:'skin_gou', name:'忠犬护主', desc:'积分达到 900 · 解锁【狗】皮肤', icon:'🐶', check:()=>score>=900, progress:()=>Math.min(score/900,1) },
{ id:'skin_zhu', name:'猪事顺利', desc:'积分达到 1300 · 解锁【猪】皮肤', icon:'🐷', check:()=>score>=1300, progress:()=>Math.min(score/1300,1) },
{ id:'fun_corner', name:'角落精灵', desc:'在地图四个角落各吃到一次食物', icon:'✨', check:()=>cornerEaten.size>=4, progress:()=>Math.min(cornerEaten.size/4,1) },
{ id:'fun_long', name:'细水长流', desc:'单局存活超过 90 秒', icon:'⏳', check:()=>survivalTime>=90, progress:()=>Math.min(survivalTime/90,1) },
{ id:'fun_fast', name:'疾如闪电', desc:'在速度达到最快时仍吃到 5 个食物', icon:'⚡', check:()=>fastEats>=5, progress:()=>Math.min(fastEats/5,1) },
{ id:'fun_total', name:'积少成多', desc:'累计历史总分达到 3000', icon:'💰', check:()=>totalScoreAccum>=3000, progress:()=>Math.min(totalScoreAccum/3000,1) },
{ id:'combo_5', name:'连击新星', desc:'单局最高连击达到 5', icon:'🔥', check:()=>maxComboReached>=5, progress:()=>Math.min(maxComboReached/5,1) },
{ id:'combo_10', name:'连击大师', desc:'单局最高连击达到 10', icon:'💥', check:()=>maxComboReached>=10, progress:()=>Math.min(maxComboReached/10,1) },
{ id:'combo_20', name:'连击之神', desc:'单局最高连击达到 20', icon:'⚡', check:()=>maxComboReached>=20, progress:()=>Math.min(maxComboReached/20,1) }
];

// ===== 指南数据 =====
const GUIDE_DATA = [
{ id: 'basic', icon: '🎮', title: '基础操作', content: '<h4>🎮 基础操作</h4><p>使用键盘或屏幕虚拟按键控制蛇的方向。</p><ul><li>电脑端：<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 或 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></li><li>手机端：点击屏幕下方方向键</li><li>暂停/继续：按 <kbd>空格</kbd> 或点击暂停按钮</li><li>皮肤技能：<kbd>E</kbd> 键（双人 P2 为 <kbd>P</kbd> 键，手机端点右下角技能按钮）</li></ul><p>蛇不能掉头，也不能撞墙或咬到自己。</p>' },
{ id: 'mode', icon: '🧭', title: '游戏模式', content: '<h4>🧭 四种游戏模式</h4><p>开始界面左下角可以切换模式：</p><div class="card"><div class="title">👤 单人模式</div><div class="desc">经典贪吃蛇玩法，一个人闯江湖，解锁成就、皮肤、铜钱。</div></div><div class="card"><div class="title">👥 双人模式</div><div class="desc">P1 用 WASD，P2 用方向键，先到 300 分或对方先死获胜。<span class="hl">手机端暂不支持</span>。</div></div><div class="card"><div class="title">🌱 江湖挑战（种子局）</div><div class="desc">10 张固定地图，公平竞争刷分，每张图有全球排行榜。不消耗道具、不解锁成就。</div></div><div class="card"><div class="title">🗺️ 迷宫闯关</div><div class="desc">全新玩法！在迷宫里躲避石墙、吃食物、找出口。共 8 关，逐关解锁。</div></div>' },
{ id: 'double', icon: '👥', title: '双人模式', content: '<h4>👥 双人模式规则</h4><p>在开始界面左下角点击<span class="hl">👥 双人模式</span>即可开战。</p><h4>🎮 控制方式</h4><ul><li><span class="hl2">P1</span>：<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>，技能 <kbd>E</kbd></li><li><span class="hl">P2</span>：<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd>，技能 <kbd>P</kbd></li><li>暂停：<kbd>空格</kbd></li></ul><h4>📖 术语说明</h4><div class="terms"><strong>头部</strong>：蛇最前面的一节，决定蛇的方向。</div><div class="terms"><strong>身体</strong>：除头部和尾部之外的所有节。</div><div class="terms"><strong>尾部</strong>：蛇的最后一节，是蛇身最短最末的位置。</div><h4>💥 碰撞规则</h4><ul><li>撞墙 → 死亡</li><li>撞到自己身体 → 死亡</li><li>撞到对方身体 → <span class="hl">撞的人死亡</span>（谁主动撞谁死）</li><li>两个头对撞 → 双方同时死亡（平局）</li><li>撞到石头 → 死亡（护盾可抵挡一次）</li></ul><h4>🏆 获胜条件</h4><ul><li>对方先死亡 → 你获胜</li><li>或者自己率先到达 <span class="hl3">300 分</span> → 你获胜</li><li>两个条件先满足哪个算哪个</li></ul><h4>⚠️ 双人模式特殊规则</h4><ul><li>双人模式下<span class="hl">猫鼠大战强制关闭</span></li><li>食物共用，谁先吃到算谁的</li><li>特殊物品共用</li><li>石头和传送门共用（如果开启了障碍）</li><li>护盾只属于吃到的那个玩家</li><li><span class="hl2">双人模式支持商城道具</span>，但 P1、P2 的背包互相独立，铜钱共用</li><li><span class="hl">手机端暂不支持双人模式</span></li></ul>' },
{ id: 'food', icon: '🍎', title: '食物与积分', content: '<h4>🍎 普通食物</h4><p>吃掉普通食物 <span class="hl2">+10 积分</span>，身体变长一节，移动速度随分数增加而加快。</p><h4>⭐ 特殊食物（独立刷新）</h4><p>普通食物和特殊食物是<span class="hl">独立存在</span>的，可以同时出现在棋盘上。特殊食物存在时间约 8 秒，超时会消失，需抓紧时间吃。</p><div class="card"><div class="title">💰 金元宝</div><div class="desc">吃掉后直接获得 <span class="hl3">20 积分</span>（双倍）。</div></div><div class="card"><div class="title">⚡ 加速药水</div><div class="desc">吃到后蛇会短暂加速，持续 <span class="hl3">5 秒</span>（兔皮肤 8 秒），期间分数翻倍。</div></div><div class="card"><div class="title">🛡️ 护盾铃铛</div><div class="desc">获得一次免死金牌，撞墙或撞自己可以免疫一次死亡。</div></div><div class="card"><div class="title">🧪 缩小药水</div><div class="desc">蛇身长度减少一半，但分数不变，适合新手救场。</div></div>' },
{ id: 'combo', icon: '🔥', title: '连击系统', content: '<h4>🔥 连击系统</h4><p>连续吃到食物可以累积<span class="hl2">连击数</span>，连击越高，每次得分越多，音调也越高。</p><div class="card"><div class="title">⏱️ 连击窗口</div><div class="desc">每吃到一个食物，连击窗口重置为 <span class="hl3">6 秒</span>游戏时间（兔皮肤 6.5 秒）。窗口内没吃到下一个食物，连击归零。</div></div><div class="card"><div class="title">💯 倍率阶梯</div><div class="desc">5 连 = <span class="hl2">×1.5</span>　·　10 连 = <span class="hl2">×2</span>　·　18 连 = <span class="hl3">×3</span>　·　28 连 = <span class="hl">×4</span>　·　40 连 = <span class="hl">×5</span></div></div><div class="card"><div class="title">🎨 视觉反馈</div><div class="desc">蛇头旁会显示「×连击数」，下方有倒计时条。连击越高颜色越炫：灰 → 青 → 蓝 → 紫 → 粉 → 金。</div></div><div class="card"><div class="title">🎵 音效反馈</div><div class="desc">连击越高，吃食物的音调越高，最高提升 50%。双人模式下 P1、P2 独立计算连击。</div></div>' },
{ id: 'seed', icon: '🌱', title: '江湖挑战', content: '<h4>🌱 江湖挑战（种子局）</h4><p>点击模式选择里的 <span class="hl2">🌱 挑战</span>，进入 10 张固定地图的挑战模式。</p><div class="card"><div class="title">🎯 固定随机序列</div><div class="desc">每张图用固定种子生成食物、石头、传送门、猫的位置。<span class="hl">每局都一样，公平竞争</span>。</div></div><div class="card"><div class="title">🏆 独立最高分</div><div class="desc">每张图独立记录你的最高分，互不影响。<span class="hl">种子局不计入普通统计、不消耗道具、不解锁成就。</span></div></div><div class="card"><div class="title">📋 10 张地图</div><div class="desc">1-5 无猫，6-10 有猫。障碍全开。挑战自己的极限，把每张图的分数刷到最高！</div></div><div class="card"><div class="title">🏆 全球排行榜</div><div class="desc">每张地图都有<span class="hl2">独立的全球排行榜</span>，每张卡片右边的 🏆 按钮可以打开该地图排行榜。结算时输入你的江湖名号，成绩就会上传！</div></div>' },
{ id: 'leaderboard', icon: '🏆', title: '全球排行榜', content: '<h4>🏆 全球排行榜</h4><p>种子局的每张地图都有自己的<span class="hl2">全球排行榜</span>，和其他玩家比拼分数。</p><div class="card"><div class="title">📤 如何上榜</div><div class="desc">玩完种子局，结算时会弹出输入框，输入你的<span class="hl">江湖名号</span>（最多 15 字），成绩就会自动上传。名字会记住，下次直接用。</div></div><div class="card"><div class="title">👀 如何查看</div><div class="desc">打开「🌱 挑战」界面，每张地图卡片右边的 <span class="hl3">🏆 按钮</span>，点一下就能看到这张图的全球排行榜。</div></div><div class="card"><div class="title">🥇 榜上显示</div><div class="desc">前 3 名有奖牌图标，之后的显示名次。你自己的名字会<span class="hl2">高亮显示</span>，一眼找到。</div></div><div class="card"><div class="title">🔒 数据安全</div><div class="desc">排行榜按玩家去重，同一个名字只显示你最高的那次成绩。分数异常（超过 1000）会被拒绝上传。</div></div>' },
{ id: 'maze', icon: '🗺️', title: '迷宫闯关', content: '<h4>🗺️ 迷宫闯关</h4><p>点击模式选择里的 <span class="hl2">🗺️ 迷宫</span>，进入全新的迷宫玩法。</p><div class="card"><div class="title">🎯 玩法规则</div><div class="desc">在迷宫里控制蛇移动，躲避 <span class="hl">石头墙</span>，吃掉 <span class="hl3">食物</span>，找到 <span class="hl2">发光出口</span> 即通关。</div></div><div class="card"><div class="title">❤️ 血量系统</div><div class="desc">初始 <span class="hl">5 点血</span>。撞墙扣 1 血，血量归零就失败。撞墙后会短暂无敌，此时可以选择新方向（可以掉头）。</div></div><div class="card"><div class="title">🍎 食物分数</div><div class="desc">普通食物 <span class="hl2">+10</span>　·　金币 <span class="hl3">+30</span>　·　宝石 <span class="hl3">+50</span>　·　钻石 <span class="hl2">+80</span>。血量每剩 1 点，通关时额外 <span class="hl3">+20 分</span>。</div></div><div class="card"><div class="title">📋 8 个关卡</div><div class="desc">共 8 关，难度从简单到极难递增。通关后解锁下一关，每关独立记录最高分。</div></div><div class="card"><div class="title">🏆 得分技巧</div><div class="desc">尽量<span class="hl2">不撞墙</span>保留血量，同时<span class="hl3">吃光高分食物</span>（钻石、宝石），再通关，这样分数最高。</div></div>' },
{ id: 'shop', icon: '🏪', title: '商城与道具', content: '<h4>🏪 江湖商城</h4><p>吃掉食物得分，结算时可以换取 <span class="hl3">铜钱</span>。铜钱可以在商城里购买各种道具，帮助你在下一局闯荡江湖。</p><h4>🪙 铜钱获取</h4><div class="card"><div class="title">💰 结算换算</div><div class="desc">每局结束时，按本局总分 <span class="hl">每 10 分 = 1 铜钱</span> 换算。双人模式按两人分数之和计算。</div></div><h4>🎁 道具一览</h4><div class="card"><div class="title">🛡️ 护身符 · 15 铜钱</div><div class="desc">开局自带一个护盾，可免疫一次死亡。</div></div><div class="card"><div class="title">💰 招财符 · 10 铜钱</div><div class="desc">开局直接 +30 分，相当于白吃 3 个食物。</div></div><div class="card"><div class="title">⚡ 疾风符 · 12 铜钱</div><div class="desc">开局获得 5 秒加速效果，期间分数翻倍。</div></div><div class="card"><div class="title">🔮 寻宝罗盘 · 20 铜钱</div><div class="desc">本局特殊食物刷新率翻倍，更容易出金元宝。</div></div><div class="card"><div class="title">💖 续命丹 · 50 铜钱</div><div class="desc">本局死亡时原地复活一次，保留一半分数。</div></div><h4>🎒 如何使用</h4><p>购买的道具会进入 <span class="hl2">背包</span>。在商城切到「我的背包」页，点击道具可以 <span class="hl">装备</span>，下一局开始时会自动使用并消耗。一局只能装备一个道具。</p><h4>👥 双人模式下的商城</h4><p>双人模式下打开商城，会显示 <span class="hl2">P1 的背包</span> 和 <span class="hl">P2 的背包</span> 两部分。<span class="hl3">铜钱是共用的</span>，但每个玩家只能装备和使用自己背包里的道具。</p>' },
{ id: 'stats', icon: '📊', title: '数据统计', content: '<h4>📊 数据统计面板</h4><p>点击顶部 <span class="hl3">📊 数据</span> 按钮，可以查看你所有的生涯数据。</p><div class="card"><div class="title">📊 生涯总览</div><div class="desc">总游玩局数、单人/双人局数、累计游戏时长、累计吃食物数、累计总分。</div></div><div class="card"><div class="title">🏆 最高纪录</div><div class="desc">历史最高分、最长体长、最长生存时间、最高连击、单局最多吃食物数。</div></div><div class="card"><div class="title">💀 死因分布</div><div class="desc">撞墙、咬到自己、撞到对方、被猫抓住、被猫咬断、撞到石头的次数和占比。</div></div>' },
{ id: 'cat', icon: '🐱', title: '猫鼠大战', content: '<h4>🐱 猫鼠大战（单人模式）</h4><p>当单局分数达到 <span class="hl">250 分</span> 后，棋盘上会出现一只野猫，并且猫鼠大战按钮开启时才会出现。<span class="hl">双人模式下强制关闭。</span></p><div class="card"><div class="title">🐾 猫的追踪</div><div class="desc">猫会朝着蛇头的方向移动，每两步移动一次，速度比蛇稍慢。</div></div><div class="card"><div class="title">💀 猫碰蛇头</div><div class="desc">如果猫正面碰到蛇头，游戏<span class="hl">立即失败</span>！一定要小心走位。</div></div><div class="card"><div class="title">✂️ 猫咬尾巴</div><div class="desc">如果猫碰到蛇尾（从第 4 节开始算），尾巴会被咬断，失去被咬位置之后的所有身体。累计被咬 <span class="hl3">20 节</span> 后游戏失败。</div></div><div class="card"><div class="title">🏆 围死野猫</div><div class="desc">如果你用蛇身把猫围住，让它上下左右都无法移动到边界（没有缺口），猫就会被困死，你获得 <span class="hl3">+50 分</span> 奖励！</div></div><div class="card"><div class="title">🛡️ 护盾抵挡</div><div class="desc">如果身上有护盾，猫碰到蛇头时护盾会抵挡一次，猫会消失。</div></div>' },
{ id: 'obstacle', icon: '🚧', title: '障碍与传送门', content: '<h4>🚧 障碍与传送门</h4><p>当顶部 <span class="hl3">🚧 障碍</span> 按钮开启时，随着分数上升，地图上会随机出现石头和传送门。</p><div class="card"><div class="title">🪨 石头</div><div class="desc">单局分数达到 <span class="hl">150 分</span> 后开始出现。石头会<span class="hl">阻挡蛇和猫</span>的移动，食物和特殊物品也不会生成在石头上。撞到石头会死亡（护盾可以抵挡一次）。</div></div><div class="card"><div class="title">🌀 传送门</div><div class="desc">单局分数达到 <span class="hl">400 分</span> 后开始出现，出现频率比石头低。传送门<span class="hl">成对出现</span>，颜色相同。蛇头从<span class="hl">一个</span>传送门进入，会从<span class="hl">另一个</span>传送门出来。传送门存在时间约 15 秒。</div></div>' },
{ id: 'ai', icon: '🤖', title: '江湖 AI 评语', content: '<h4>🤖 江湖 AI 老板娘</h4><p>每局游戏结束时，客栈老板娘「小江湖」会根据你本局的积分、体长、吃掉的食物数量，给出一句<span class="hl2">专属评语</span>。</p><div class="card"><div class="title">✨ 每局都不一样</div><div class="desc">小江湖每次会用不同的语气点评：有时<span class="hl2">傲娇</span>，有时<span class="hl">毒舌</span>，有时<span class="hl3">装傻</span>，还有江湖旁白、吃货视角、惊叹、温柔、腹黑等多种风格。</div></div><div class="card"><div class="title">🏮 老板娘小档案</div><div class="desc">江湖客栈的老板娘，古灵精怪，爱叫你"宝宝"，点评时喜欢用武侠梗。她只点评你这一局的表现，说得对不对全凭心情～</div></div>' },
{ id: 'skin', icon: '🎨', title: '皮肤与成就', content: '<h4>🎨 皮肤系统</h4><p>通过达成特定成就，可以解锁十二生肖皮肤。点击顶部“皮肤”按钮查看已解锁的皮肤。</p><ul><li>鼠：积分达到 30</li><li>牛：积分达到 70</li><li>虎：积分达到 130</li><li>兔：积分达到 200</li><li>龙：积分达到 300</li><li>蛇：体长达到 12</li><li>马：积分达到 450</li><li>羊：积分达到 600</li><li>猴：单局吃掉 20 个食物</li><li>鸡：体长达到 18</li><li>狗：积分达到 900</li><li>猪：积分达到 1300</li></ul><h4>🏆 成就系统</h4><p>点击顶部“成就”按钮查看所有成就及进度。解锁成就会有弹窗提示。</p><h4>✨ 皮肤技能</h4><p>每个十二生肖皮肤都有自己的专属技能，详情见「皮肤技能」页。</p>' },
{ id: 'skill', icon: '✨', title: '皮肤技能', content: '<h4>✨ 皮肤技能系统</h4><p>每个十二生肖皮肤都有自己<span class="hl2">独特的技能</span>，主动或被动。装备该皮肤后自动生效。</p><h4>🐭 鼠符咒 · 聚财（被动）</h4><div class="card"><div class="title">🐭 聚财</div><div class="desc">结算铜钱 <span class="hl3">+15%</span>。一局 300 分原本拿 30 铜钱，装备鼠皮肤后拿 34 铜钱。<br><span class="hl">双人模式</span>：只要 P1 或 P2 任意一人装备鼠皮肤，本局铜钱就 +15%（不叠加）。</div></div><h4>🐮 牛符咒 · 铁壁（被动）</h4><div class="card"><div class="title">🐮 铁壁</div><div class="desc">撞到石头时<span class="hl2">不会死</span>，反而把石头撞碎继续前进。每局 <span class="hl3">3 次</span>。</div></div><h4>🐯 虎符咒 · 分身（主动）</h4><div class="card"><div class="title">🐯 分身</div><div class="desc">按 <kbd>E</kbd> 键（双人 P2 <kbd>P</kbd> 键，手机端点右下角技能按钮）生成一个<span class="hl3">幻影蛇</span>，持续 5 秒。幻影存在期间，野猫会<span class="hl2">优先追幻影</span>，忽略真身。每局 <span class="hl3">2 次</span>。</div></div><h4>🐰 兔符咒 · 疾风（被动）</h4><div class="card"><div class="title">🐰 疾风</div><div class="desc">初始速度 <span class="hl2">+10%</span>；加速药水 5 秒延长到 <span class="hl3">8 秒</span>；连击窗口额外 <span class="hl3">+0.5 秒</span>（6 秒 → 6.5 秒）。</div></div><h4>🐲 龙符咒 · 炎爆（主动）</h4><div class="card"><div class="title">🐲 炎爆</div><div class="desc">按 <kbd>E</kbd> 键向蛇头前方喷火 <span class="hl3">5 格</span>：<br>· 清除路径上的石头<br>· 击中野猫：猫停止 1 次移动<br>· 本局两次炎爆<span class="hl2">全部击中野猫</span> → 猫直接死亡 +100 分<br>每局 <span class="hl3">2 次</span>，冷却 <span class="hl3">5 秒</span>。</div></div><h4>🐍 蛇符咒 · 隐踪（主动）</h4><div class="card"><div class="title">🐍 隐踪</div><div class="desc">按 <kbd>E</kbd> 键进入 <span class="hl3">3 秒幽灵模式</span>。幽灵模式中：<br>· 穿过石头不死<br>· 穿过自己身体不死<br>· 穿过对方身体不死<br>· <span class="hl">不能穿过墙壁</span><br>每局 <span class="hl3">3 次</span>。</div></div><h4>🐴 马符咒 · 回春（被动）</h4><div class="card"><div class="title">🐴 回春</div><div class="desc">死亡后<span class="hl2">原地复活一次</span>，<span class="hl3">不扣分</span>，带 <span class="hl3">1.5 秒</span> 无敌虚化时间。每局限 1 次。与续命丹可叠加（续命丹优先消耗）。</div></div><h4>🐑 羊符咒 · 魂游（主动）</h4><div class="card"><div class="title">🐑 魂游</div><div class="desc">按 <kbd>E</kbd> 键：<br>· <span class="hl2">有猫时</span>：眩晕野猫，让猫停止之后 <span class="hl3">3 次移动</span><br>· <span class="hl2">无猫时</span>：自身无敌 <span class="hl3">3 秒</span><br>每局 <span class="hl3">3 次</span>。</div></div><h4>🔮 后续皮肤技能</h4><p>猴、鸡、狗、猪等其他生肖皮肤的技能会陆续上线。</p>' },
{ id: 'tips', icon: '💡', title: '小技巧', content: '<h4>💡 高手小技巧</h4><ul><li><span class="hl2">善用护盾</span>：留一个护盾在身上，被猫追上或撞石头时可以救命。</li><li><span class="hl2">连击冲分</span>：看到食物密集的区域，一口气冲过去连吃 5 个以上，倍率立刻上来。</li><li><span class="hl2">围猫战术</span>：利用蛇身长的优势，绕一个大圈把猫围住，能拿 50 分。</li><li><span class="hl2">龙炎爆清路</span>：装备龙皮肤时，前方石头挡路可以用炎爆清掉；猫追得紧时也能用炎爆击退猫。</li><li><span class="hl2">虎分身骗猫</span>：装备虎皮肤时，被猫追得走投无路就按 E 放分身，猫会去追分身，趁机脱身。</li><li><span class="hl2">传送门逃生</span>：被猫或石头逼到角落时，钻进传送门，瞬间转移到地图另一头。</li><li><span class="hl2">皮肤技能</span>：牛可以撞碎石头、马可以复活、兔可以连击、蛇可以穿墙、虎可以分身、龙可以炎爆、羊可以眩晕猫。</li><li><span class="hl2">迷宫保血</span>：迷宫里血量就是分数，能不撞墙就不撞墙，最后剩的血越多，结算加的分越高。</li><li><span class="hl2">排行榜刷分</span>：种子局每张图都能重复挑战，多试几次找到最优路线，把分数刷到榜一。</li><li><span class="hl3">手机作弊</span>：2 秒内连点标题“🐍 十二生肖闯江湖”5 次，解锁全部皮肤 + 成就！</li></ul>' }
];

// ===== 连击系统 =====
const COMBO_WINDOW = 6000;
const COMBO_TIERS = [
  { count: 5,  multiplier: 1.5, color: '#00f5d4' },
  { count: 10, multiplier: 2,   color: '#00bbf9' },
  { count: 18, multiplier: 3,   color: '#9b5de5' },
  { count: 28, multiplier: 4,   color: '#f15bb5' },
  { count: 40, multiplier: 5,   color: '#ffcc00' }
];
function getComboMultiplier(count) {
  let m = 1;
  for (const t of COMBO_TIERS) { if (count >= t.count) m = t.multiplier; }
  return m;
}
function getComboColor(count) {
  let c = '#94a3b8';
  for (const t of COMBO_TIERS) { if (count >= t.count) c = t.color; }
  return c;
}