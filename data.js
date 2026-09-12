// ===== 常量键 =====
const ACHIEVE_KEY = 'snakeAchievementsV5';
const HIGH_KEY = 'snakeHighScoreV5';
const TOTAL_KEY = 'snakeTotalScoreV5';

// ===== 皮肤 =====
const SKINS = {
default: { id:'default', name:'经典青蛇', emoji:'🐍', unlockId:null, boardBg:'#0d1117', gridColor:'rgba(0,200,220,0.45)', headColors:['#5efce8','#00f5d4','#00bbf9'], bodyHue:{r:0,g:235,b:220}, foodColors:['#ff9a9a','#ff6b6b','#e03131'] },
shu: { id:'shu', name:'鼠来宝', emoji:'🐭', unlockId:'skin_shu' },
niu: { id:'niu', name:'牛气冲天', emoji:'🐮', unlockId:'skin_niu' },
hu: { id:'hu', name:'虎虎生威', emoji:'🐯', unlockId:'skin_hu' },
tu: { id:'tu', name:'玉兔东升', emoji:'🐰', unlockId:'skin_tu' },
long: { id:'long', name:'龙腾四海', emoji:'🐲', unlockId:'skin_long' },
she: { id:'she', name:'灵蛇出洞', emoji:'🐍', unlockId:'skin_she' },
ma: { id:'ma', name:'一马当先', emoji:'🐴', unlockId:'skin_ma' },
yang: { id:'yang', name:'三羊开泰', emoji:'🐑', unlockId:'skin_yang' }
};

// ===== 双人模式 P2 的颜色 =====
const P2_HEAD_COLORS = ['#ff9ec7', '#f15bb5', '#9b5de5'];
const P2_BODY_HUE = { r: 241, g: 91, b: 181 };
const P2_FOOD_COLORS = ['#ffb6d9', '#f15bb5', '#9b5de5'];

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
{ id:'fun_total', name:'积少成多', desc:'累计历史总分达到 3000', icon:'💰', check:()=>totalScoreAccum>=3000, progress:()=>Math.min(totalScoreAccum/3000,1) }
];

// ===== 指南数据 =====
const GUIDE_DATA = [
{ id: 'basic', icon: '🎮', title: '基础操作', content: '<h4>🎮 基础操作</h4><p>使用键盘或屏幕虚拟按键控制蛇的方向。</p><ul><li>电脑端：<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> 或 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></li><li>手机端：点击屏幕下方方向键</li><li>暂停/继续：按 <kbd>空格</kbd> 或点击暂停按钮</li></ul><p>蛇不能掉头，也不能撞墙或咬到自己。</p>' },
{ id: 'double', icon: '👥', title: '双人模式', content: '<h4>👥 双人模式规则</h4><p>在开始界面左下角点击<span class="hl">👥 双人模式</span>即可开战。</p><h4>🎮 控制方式</h4><ul><li><span class="hl2">P1</span>：<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></li><li><span class="hl">P2</span>：<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></li><li>暂停：<kbd>空格</kbd></li></ul><h4>📖 术语说明</h4><div class="terms"><strong>头部</strong>：蛇最前面的一节，决定蛇的方向。</div><div class="terms"><strong>身体</strong>：除头部和尾部之外的所有节。</div><div class="terms"><strong>尾部</strong>：蛇的最后一节，是蛇身最短最末的位置。</div><h4>💥 碰撞规则</h4><ul><li>撞墙 → 死亡</li><li>撞到自己身体 → 死亡</li><li>撞到对方身体 → <span class="hl">撞的人死亡</span>（谁主动撞谁死）</li><li>两个头对撞 → 双方同时死亡（平局）</li><li>撞到石头 → 死亡（护盾可抵挡一次）</li></ul><h4>🏆 获胜条件</h4><ul><li>对方先死亡 → 你获胜</li><li>或者自己率先到达 <span class="hl3">300 分</span> → 你获胜</li><li>两个条件先满足哪个算哪个</li></ul><h4>⚠️ 双人模式特殊规则</h4><ul><li>双人模式下<span class="hl">猫鼠大战强制关闭</span>（太乱了）</li><li>食物共用，谁先吃到算谁的</li><li>特殊物品共用</li><li>石头和传送门共用（如果开启了障碍）</li><li>护盾只属于吃到的那个玩家</li><li>速度、缩小药水也是谁吃谁用</li></ul>' },
{ id: 'food', icon: '🍎', title: '食物与积分', content: '<h4>🍎 普通食物</h4><p>吃掉普通食物 <span class="hl2">+10 积分</span>，身体变长一节，移动速度随分数增加而加快。</p><h4>⭐ 特殊食物（独立刷新）</h4><p>普通食物和特殊食物是<span class="hl">独立存在</span>的，可以同时出现在棋盘上。特殊食物存在时间约 8 秒，超时会消失，需抓紧时间吃。</p><div class="card"><div class="title">💰 金元宝</div><div class="desc">吃掉后直接获得 <span class="hl3">20 积分</span>（双倍）。</div></div><div class="card"><div class="title">⚡ 加速药水</div><div class="desc">吃到后蛇会短暂加速，持续 <span class="hl3">5 秒</span>，期间分数翻倍。</div></div><div class="card"><div class="title">🛡️ 护盾铃铛</div><div class="desc">获得一次免死金牌，撞墙或撞自己可以免疫一次死亡。</div></div><div class="card"><div class="title">🧪 缩小药水</div><div class="desc">蛇身长度减少一半，但分数不变，适合新手救场。</div></div>' },
{ id: 'cat', icon: '🐱', title: '猫鼠大战', content: '<h4>🐱 猫鼠大战（单人模式）</h4><p>当单局分数达到 <span class="hl">250 分</span> 后，棋盘上会出现一只野猫，并且猫鼠大战按钮开启时才会出现。<span class="hl">双人模式下强制关闭。</span></p><div class="card"><div class="title">🐾 猫的追踪</div><div class="desc">猫会朝着蛇头的方向移动，每两步移动一次，速度比蛇稍慢。</div></div><div class="card"><div class="title">💀 猫碰蛇头</div><div class="desc">如果猫正面碰到蛇头，游戏<span class="hl">立即失败</span>！一定要小心走位。</div></div><div class="card"><div class="title">✂️ 猫咬尾巴</div><div class="desc">如果猫碰到蛇尾（从第 4 节开始算），尾巴会被咬断，失去被咬位置之后的所有身体。累计被咬 <span class="hl3">20 节</span> 后游戏失败。</div></div><div class="card"><div class="title">🏆 围死野猫</div><div class="desc">如果你用蛇身把猫围住，让它上下左右都无法移动到边界（没有缺口），猫就会被困死，你获得 <span class="hl3">+50 分</span> 奖励！</div></div><div class="card"><div class="title">🛡️ 护盾抵挡</div><div class="desc">如果身上有护盾，猫碰到蛇头时护盾会抵挡一次，猫会消失。</div></div>' },
{ id: 'obstacle', icon: '🚧', title: '障碍与传送门', content: '<h4>🚧 障碍与传送门</h4><p>当顶部 <span class="hl3">🚧 障碍</span> 按钮开启时，随着分数上升，地图上会随机出现石头和传送门。</p><div class="card"><div class="title">🪨 石头</div><div class="desc">单局分数达到 <span class="hl">150 分</span> 后开始出现。石头会<span class="hl">阻挡蛇和猫</span>的移动，食物和特殊物品也不会生成在石头上。撞到石头会死亡（护盾可以抵挡一次）。</div></div><div class="card"><div class="title">🌀 传送门</div><div class="desc">单局分数达到 <span class="hl">400 分</span> 后开始出现，出现频率比石头低。传送门<span class="hl">成对出现</span>，颜色相同。蛇头从<span class="hl">一个</span>传送门进入，会从<span class="hl">另一个</span>传送门出来。传送门存在时间约 15 秒。</div></div>' },
{ id: 'ai', icon: '🤖', title: '江湖 AI 评语', content: '<h4>🤖 江湖 AI 老板娘</h4><p>每局游戏结束时，客栈老板娘「小江湖」会根据你本局的积分、体长、吃掉的食物数量，给出一句<span class="hl2">专属评语</span>。</p><div class="card"><div class="title">✨ 每局都不一样</div><div class="desc">小江湖每次会用不同的语气点评：有时<span class="hl2">傲娇</span>，有时<span class="hl">毒舌</span>，有时<span class="hl3">装傻</span>，还有江湖旁白、吃货视角、惊叹、温柔、腹黑等多种风格。<span class="hl">同一局的评语不会重复使用之前的角度和梗。</span></div></div><div class="card"><div class="title">🏮 老板娘小档案</div><div class="desc">江湖客栈的老板娘，古灵精怪，爱叫你"宝宝"，点评时喜欢用武侠梗。她只点评你这一局的表现，说得对不对全凭心情～</div></div>' },
{ id: 'skin', icon: '🎨', title: '皮肤与成就', content: '<h4>🎨 皮肤系统</h4><p>通过达成特定成就，可以解锁十二生肖皮肤。点击顶部“皮肤”按钮查看已解锁的皮肤。</p><ul><li>鼠：积分达到 30</li><li>牛：积分达到 70</li><li>虎：积分达到 130</li><li>兔：积分达到 200</li><li>龙：积分达到 300</li><li>蛇：体长达到 12</li><li>马：积分达到 450</li><li>羊：积分达到 600</li><li>猴：单局吃掉 20 个食物</li><li>鸡：体长达到 18</li><li>狗：积分达到 900</li><li>猪：积分达到 1300</li></ul><h4>🏆 成就系统</h4><p>点击顶部“成就”按钮查看所有成就及进度。解锁成就会有弹窗提示。</p>' },
{ id: 'tips', icon: '💡', title: '小技巧', content: '<h4>💡 高手小技巧</h4><ul><li><span class="hl2">善用护盾</span>：留一个护盾在身上，被猫追上或撞石头时可以救命。</li><li><span class="hl2">围猫战术</span>：利用蛇身长的优势，绕一个大圈把猫围住，能拿 50 分。</li><li><span class="hl2">加速时机</span>：加速药水期间分数翻倍，尽量在这 5 秒内多吃几个食物。</li><li><span class="hl2">传送门逃生</span>：被猫或石头逼到角落时，钻进传送门，瞬间转移到地图另一头。</li><li><span class="hl2">双人对战技巧</span>：堵住对方去路，逼对方撞墙或咬到自己。</li><li><span class="hl3">尾流特效</span>：蛇身后的彩色尾流会随着分数变化颜色，分数越高颜色越红紫，也越粗。</li><li><span class="hl3">手机作弊</span>：2 秒内连点标题“🐍 十二生肖闯江湖”5 次，解锁全部皮肤 + 成就！</li></ul>' }
];