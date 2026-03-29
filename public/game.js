// ===== バージョン =====
const GAME_VERSION = '0.1.0';

// ===== 難易度設定 =====
let gameDifficulty = 'normal'; // 'easy' or 'normal'
const DIFFICULTY = {
  easy:   { maxTurns: 10, minutesPerTurn: 4, mpMult: 0.5, showHints: true },
  normal: { maxTurns: 8,  minutesPerTurn: 5, mpMult: 1.0, showHints: false },
};
function getDiff() { return DIFFICULTY[gameDifficulty]; }

// ===== サウンド（Web Audio API） =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let bgmGain = null;
let bgmOsc = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new AudioCtx();
  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = 0.06;
  bgmGain.connect(audioCtx.destination);
}

function playBGM() {
  initAudio();
  if (bgmOsc) return;
  // 簡易アンビエントBGM（低音パッド）
  bgmOsc = audioCtx.createOscillator();
  bgmOsc.type = 'sine';
  bgmOsc.frequency.value = 110;
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.3;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 5;
  lfo.connect(lfoGain);
  lfoGain.connect(bgmOsc.frequency);
  lfo.start();
  bgmOsc.connect(bgmGain);
  bgmOsc.start();
}

function stopBGM() {
  if (bgmOsc) { bgmOsc.stop(); bgmOsc = null; }
}

function playSE(type) {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  gain.gain.value = 0.15;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const t = audioCtx.currentTime;

  if (type === 'good') {
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
  } else if (type === 'bad') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.setValueAtTime(150, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.start(t); osc.stop(t + 0.25);
  } else if (type === 'bottle') {
    gain.gain.value = 0.2;
    osc.frequency.setValueAtTime(523, t);
    osc.frequency.setValueAtTime(659, t + 0.15);
    osc.frequency.setValueAtTime(784, t + 0.3);
    osc.frequency.setValueAtTime(1047, t + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
    osc.start(t); osc.stop(t + 0.8);
  } else if (type === 'gameover') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
    osc.start(t); osc.stop(t + 0.7);
  }
}

// ===== キャラ画像（好感度5段階） =====
function getCharImagePath(charId, affection) {
  const level = affection >= 80 ? 5 : affection >= 60 ? 4 : affection >= 40 ? 3 : affection >= 20 ? 2 : 1;
  return `images/${charId}/${level}.png`;
}

function updateCharPortrait() {
  const charId = gameState.characterId;
  const char = CHARACTERS[charId];
  const frame = document.getElementById('adv-char-frame');
  const avatarEl = document.getElementById('adv-char-avatar');
  const levelPath = getCharImagePath(charId, gameState.affection);
  const fallbackPath = `images/${charId}.png`;

  const img = new Image();
  img.onload = () => {
    avatarEl.innerHTML = '';
    const imgEl = document.createElement('img');
    imgEl.src = levelPath;
    imgEl.style.cssText = 'width:100%;height:100%;object-fit:contain;';
    avatarEl.appendChild(imgEl);
    frame.style.background = 'none';
  };
  img.onerror = () => {
    const fb = new Image();
    fb.onload = () => {
      avatarEl.innerHTML = '';
      const imgEl = document.createElement('img');
      imgEl.src = fallbackPath;
      imgEl.style.cssText = 'width:100%;height:100%;object-fit:contain;';
      avatarEl.appendChild(imgEl);
      frame.style.background = 'none';
    };
    fb.onerror = () => { avatarEl.innerHTML = ''; avatarEl.textContent = char.avatar; frame.style.background = char.avatarBg; };
    fb.src = fallbackPath;
  };
  img.src = levelPath;
}

const CHARACTERS = {
  masao: {
    name: 'マサオ', age: 52, avatar: '👔',
    avatarBg: 'linear-gradient(135deg, #d4e8ff, #b3d4ff)',
    type: '健全（自称）な下心おじさん',
    detail: `💰 報酬：梅〜松\n⚠️ 危険：セクハラで精神力が削れる\n✦ 攻略：承認欲求を満たして「紳士」扱いせよ`,
    situation: '課長気分で上機嫌 🍺',
    greeting: (name) => `いや〜、今日も疲れたよ。でも${name}ちゃんの顔見たら元気出るなぁ（デレデレ）`,
    hints: ['仕事の話を聞いてあげると喜ぶよ', 'セクハラは上手にかわそう', '褒めて褒めて褒めまくれ！'],
  },
  takashi: {
    name: 'タカシ', age: 42, avatar: '🎒',
    avatarBg: 'linear-gradient(135deg, #d4f5e0, #b3e8c8)',
    type: '粘着・細客おじさん',
    detail: `💰 報酬：梅のみ\n⚠️ 危険：毎ターン精神力が削れる\n✦ 攻略：知識を褒めて塵積み作戦`,
    situation: '来店5回目・常連気取り 👓',
    greeting: (name) => `やあ${name}ちゃん。今日も来ちゃった。ねえ聞いて？最近推しが新曲出してさ……`,
    hints: ['オタク知識を褒めると効く', 'お金の話は絶対NG！', '「すごい！もっと教えて」が黄金パターン'],
  },
  reiji: {
    name: 'レイジ', age: 35, avatar: '👁️',
    avatarBg: 'linear-gradient(135deg, #ffd4e8, #ffb3c6)',
    type: '激重メンヘラ泥沼おじさん',
    detail: `💰 報酬：竹〜松\n💀 危険：地雷ワードで即ゲームオーバー\n✦ 攻略：共依存ムーブを演じきれ`,
    situation: '今日の機嫌……不明 😶',
    greeting: (name) => `……来たよ。（静かにグラスを持つ）　……${name}、今日、他の客と話してたね`,
    hints: ['「あなただけ」が最強ワード', '他の客の話は絶対するな！', '束縛を肯定すると喜ぶ'],
  },
  merutaso: {
    name: 'めるたそ', age: 23, avatar: '🖤',
    avatarBg: 'linear-gradient(135deg, #2d1f3d, #1a1025)',
    type: '地雷系メンヘラ女子',
    detail: `💰 報酬：竹〜松（ハマれば太客化）\n💀 危険：興味を持たれないと即スマホ\n✦ 攻略：こだわりを理解して「特別」になれ`,
    situation: 'スマホいじりながら来店 📱🖤',
    greeting: (name) => `……（スマホをいじりながらチラッと見る）　……あ、${name}ちゃんか。……ん、別に。`,
    hints: ['最初は塩対応。めげるな', 'コンカフェやブランドの話題が刺さる', '共感が大事。否定は絶対NG'],
  }
};

const BOTTLE_POOL = {
  S: [
    { emoji: '👼✨🍾✨', name: 'エンジェル', price: '100,000円+' },
  ],
  松: [
    { emoji: '♠️🍾', name: 'アルマンド', price: '120,000円+' },
    { emoji: '🥂✨', name: 'ドンペリ', price: '80,000円+' },
    { emoji: '💎🍾', name: 'フィリコ（ノンアル）', price: '50,000円+' },
  ],
  竹: [
    { emoji: '🍾', name: 'XLV', price: '40,000円' },
    { emoji: '🥂', name: 'ヴーヴ・クリコ', price: '35,000円' },
    { emoji: '🍾', name: 'モエ', price: '30,000円' },
  ],
  梅: [
    { emoji: '🌈🥂', name: 'マバム', price: '10,000円' },
    { emoji: '🫧🥂', name: 'アスティ', price: '8,000円' },
  ],
};
const RANK_SCORE = { S: 30000, 松: 10000, 竹: 3000, 梅: 1000 };

function pickBottle(rank) {
  const pool = BOTTLE_POOL[rank];
  return { ...pool[Math.floor(Math.random() * pool.length)], score: RANK_SCORE[rank] };
}

// ===== アイテム =====
const ITEMS = {
  tequila:  { name: 'テキーラ', emoji: '🥃', desc: '好感度UP2倍（2ターン）', effect: { affBoost: 2 }, price: 300 },
  omamori:  { name: 'お守り',   emoji: '🔮', desc: 'MP+20回復',             effect: { mp: 20 },       price: 200 },
  lipgloss: { name: '勝負リップ', emoji: '💄', desc: '好感度+10',           effect: { affection: 10 }, price: 400 },
  champagne_call: { name: 'シャンパンコール券', emoji: '🎪', desc: '好感度+25', effect: { affection: 25 }, price: 800 },
  angel_wing: { name: '天使の羽', emoji: '👼', desc: 'MP全回復+シールド3T', effect: { mp: 100, mpShield: 3 }, price: 1000 },
};
const DEFAULT_INVENTORY = { tequila: 1, omamori: 1, lipgloss: 0, champagne_call: 0, angel_wing: 0 };

function loadPoints() { try { return parseInt(localStorage.getItem('concafe_points')) || 0; } catch { return 0; } }
function savePoints(p) { localStorage.setItem('concafe_points', JSON.stringify(p)); }
function loadInventory() { try { const s = JSON.parse(localStorage.getItem('concafe_inventory_v2')); return s ? { ...DEFAULT_INVENTORY, ...s } : { ...DEFAULT_INVENTORY }; } catch { return { ...DEFAULT_INVENTORY }; } }
function saveInventory(i) { localStorage.setItem('concafe_inventory_v2', JSON.stringify(i)); }

// ===== スクリプトイベント（各キャラ3つに増量） =====
const SCRIPTED_EVENTS = {
  masao: [
    { trigger: { afterTurn: 1 }, narration: '【マサオが手を伸ばしてきた】',
      text: 'ねぇねぇ、手見せて？手相見れるんだよ俺。……ほら……（手を握る）',
      choices: [
        { label: '「すごーい！見て見てっ♪」（乗せる）', affection: 12, mp: -8, flash: '💦 手を握られた！でも機嫌UP' },
        { label: '「マサオさんの手あったかい♡」（逆手に取る）', affection: 15, mp: -5, flash: '💕 神対応！' },
        { label: '「ドリンク取ってきますね！」（回避）', affection: -3, mp: 0, flash: '😅 逃げた' },
      ]},
    { trigger: { afterTurn: 3 }, narration: '【マサオの顔が赤い】',
      text: '${name}ちゃんさぁ……今度ふたりで飲みに行かない？',
      choices: [
        { label: '「ここで会えるのが特別なんですよ？」（店内に留める）', affection: 10, mp: -3, flash: '💕 プロのかわし！' },
        { label: '「二人きり……ドキドキしちゃう♡」（匂わせる）', affection: 18, mp: -10, flash: '💦💕 危険だが効果的！' },
        { label: '「それはちょっと……」（断る）', affection: -15, mp: 0, flash: '😤 傷つけた！' },
      ]},
    { trigger: { afterTurn: 6 }, narration: '【マサオが肩に手を回そうとしてきた】',
      text: '${name}ちゃんといると癒やされるよ。俺さ、嫁さんとはもうレスでさ……なんちゃって。',
      choices: [
        { label: '「モテるのにそんなこと言ってー」（褒めて流す）', affection: 10, mp: -5, flash: '💕 上手にかわした' },
        { label: '「今日は私がマサオさんのもの♡」（全力営業）', affection: 20, mp: -15, flash: '💦💕 魂を削る！' },
        { label: '「奥さん大事にしてください」（正論）', affection: -20, mp: 0, flash: '💔 空気読め！' },
      ]},
  ],
  takashi: [
    { trigger: { afterTurn: 1 }, narration: '【タカシがスマホを向けてきた】',
      text: '${name}ちゃんのインスタ全部保存してるよ。火曜と金曜がシフトでしょ？',
      choices: [
        { label: '「チェックしてくれてるの？嬉しい！」（喜ぶフリ）', affection: 12, mp: -8, flash: '😰 キモいけど好感度UP' },
        { label: '「さすが情報通だね〜」（オタク褒め）', affection: 10, mp: -5, flash: '💕 くすぐった' },
        { label: '「ちょっとそれ怖いかも」（本音）', affection: -12, mp: -3, flash: '😤 傷ついた！' },
      ]},
    { trigger: { afterTurn: 4 }, narration: '【タカシが声をひそめた】',
      text: 'ねえ${name}ちゃん……LINE教えてよ。俺、本気なんだよね……',
      choices: [
        { label: '「ルールで交換できないの……ごめんね」（丁寧に断る）', affection: -5, mp: -3, flash: '😔 しょんぼり' },
        { label: '「ここで会えるだけで嬉しいですよ♡」', affection: 8, mp: -5, flash: '💕 うまい返し！' },
        { label: '「お店のアカウント教えるね！」（誘導）', affection: 15, mp: -8, flash: '💕💰 営業スキル！' },
      ]},
    { trigger: { afterTurn: 6 }, narration: '【タカシが真剣な目つきになった】',
      text: '${name}ちゃんは俺のこと、どう思ってるの？本当のところ。',
      choices: [
        { label: '「タカシさんは私の一番の理解者だよ！」', affection: 15, mp: -10, flash: '💕 距離が縮まった' },
        { label: '「みんな大切なお客さんだよ〜」', affection: -10, mp: -3, flash: '😤 聞きたい答えじゃない！' },
        { label: '「推し愛には誰も勝てないよ！」（逸らす）', affection: 5, mp: -3, flash: '😊 微妙にかわした' },
      ]},
  ],
  reiji: [
    { trigger: { afterTurn: 1 }, narration: '【レイジの目つきが変わった】',
      text: '……${name}。さっき入口であの男と目が合ってたよね。……あれ、誰。',
      choices: [
        { label: '「気づかなかった。レイジさんしか見てないよ」（全否定）', affection: 15, mp: -5, flash: '💕 独占欲が満たされた' },
        { label: '「私のこと見てくれてるんだ？」（逆質問）', affection: 12, mp: -8, flash: '💕 駆け引き成功' },
        { label: '「知り合いだよ〜」（軽く流す）', affection: -25, mp: -5, flash: '💀 地雷！', gameOver: true, gameOverReason: '「知り合い」……そう。もういいよ。帰る。' },
      ]},
    { trigger: { afterTurn: 3 }, narration: '【レイジがプレゼントの小箱を差し出した】',
      text: '……これ。${name}が可愛いって言ってたやつ。……二人だけの秘密。',
      choices: [
        { label: '「二人だけの秘密、だね。大切にする」', affection: 20, mp: -8, flash: '💕💕 共依存レベルUP' },
        { label: '「分かってくれてるの、レイジさんだけだよ」', affection: 18, mp: -10, flash: '💕 感情が深まった' },
        { label: '「みんなに自慢しちゃお！」（軽いノリ）', affection: -30, mp: -5, flash: '💀 秘密を破った！', gameOver: true, gameOverReason: '秘密って言ったよね。……全部無駄だった。' },
      ]},
    { trigger: { afterTurn: 5 }, narration: '【レイジがまっすぐ見つめている】',
      text: '……${name}は、この店辞めたらどうするの。俺が養うって言ったら……どうする？',
      choices: [
        { label: '「レイジさんがいてくれたら……考えちゃうかも」', affection: 20, mp: -12, flash: '💕💕 完全に沼' },
        { label: '「今はここで会えるのが幸せだよ」', affection: 12, mp: -5, flash: '💕 うまくかわした' },
        { label: '「冗談ですよね？笑」（茶化す）', affection: -30, mp: -5, flash: '💀 本気だったのに……', gameOver: true, gameOverReason: '冗談……？ そういうことか。' },
      ]},
  ],
  merutaso: [
    { trigger: { afterTurn: 1 }, narration: '【めるたそがスマホから目を上げた】',
      text: '……ねえ、${name}ちゃんってさ、休みの日なにしてんの。……趣味とかある？',
      choices: [
        { label: '「めるたそは何が好きなの？聞きたい」（相手に興味を向ける）', affection: 15, mp: -3, flash: '💕 話が弾み始めた！' },
        { label: '「映画とか音楽とか色々かな〜」（普通に答える）', affection: 5, mp: -3, flash: '🖤 ふーん……まあ普通' },
        { label: '「私もコンカフェ通いが趣味！」（同業アピール）', affection: -5, mp: -5, flash: '🖤 ……それキャストが言う？' },
      ]},
    { trigger: { afterTurn: 3 }, narration: '【めるたそがスマホの画面を見せてきた】',
      text: '見てこれ。推しのキャストくんの生誕祭で30万使ったの。……引く？',
      choices: [
        { label: '「30万分の想いが詰まってるんだね。素敵だなぁ」（共感する）', affection: 18, mp: -3, flash: '💕💕 ちゃんと分かってくれた！' },
        { label: '「すごっ！推しへの愛じゃん。どんなイベントだったの？」（興味を持つ）', affection: 15, mp: -5, flash: '💕 聞いてくれるの嬉しい' },
        { label: '「30万は使いすぎじゃない？笑」（ツッコむ）', affection: -20, mp: -8, flash: '💀 こだわりを否定した！', gameOver: true, gameOverReason: 'は？ 人の推し事にケチつけるとか最悪なんだけど。帰る。' },
      ]},
    { trigger: { afterTurn: 5 }, narration: '【めるたそが急にスマホを置いた。真剣な目】',
      text: '……${name}ちゃんってさ、私のことどう思ってる？ ……営業でしょ、どうせ。みんなそう。',
      choices: [
        { label: '「営業じゃないよ。めるたそと話すの楽しい」（真剣に返す）', affection: 20, mp: -5, flash: '💕💕 心に刺さった……' },
        { label: '「そんなこと言わないで。今日来てくれて嬉しいよ」（寄り添う）', affection: 15, mp: -3, flash: '💕 少し心を開いた' },
        { label: '「まあ仕事だからね〜」（正直に言う）', affection: -25, mp: -8, flash: '💀 やっぱりね。', gameOver: true, gameOverReason: '……知ってた。もういい。全部嘘じゃん。' },
      ]},
  ],
};

// ===== キャラ固有メカニクス =====
const CHAR_MECHANICS = {
  masao: {
    name: '酔い', emoji: '🍺', max: 100, perTurn: 12, color: '#ff9944',
    levels: [
      { at: 0,  label: 'シラフ', effect: 'セクハラ控えめ' },
      { at: 30, label: 'ほろ酔い', effect: '距離が近くなる' },
      { at: 60, label: '酔っ払い', effect: 'セクハラ加速・財布が緩む' },
      { at: 85, label: '泥酔', effect: '暴走注意！介抱で好感度UP' },
    ],
  },
  takashi: {
    name: 'マウント', emoji: '📊', max: 10, perTurn: 0, color: '#66bb6a',
    levels: [
      { at: 0, label: '平常', effect: '普通の会話' },
      { at: 3, label: 'イキリ', effect: '知識自慢が加速' },
      { at: 6, label: 'フルマウント', effect: '勝つと逆に好感度DOWN' },
      { at: 9, label: '暴走', effect: '何を言っても聞かない' },
    ],
  },
  reiji: {
    name: '嫉妬', emoji: '💢', max: 100, perTurn: 5, color: '#e05080', hidden: true,
    levels: [
      { at: 0,  label: '平穏', effect: '静かに見つめている' },
      { at: 30, label: '疑念', effect: '確認の質問が増える' },
      { at: 60, label: '嫉妬', effect: '圧が強くなる' },
      { at: 85, label: '暴発寸前', effect: '一言で即ゲームオーバー' },
    ],
  },
  merutaso: {
    name: '興味', emoji: '📱', max: 4, perTurn: 0, color: '#9b59b6',
    levels: [
      { at: 0, label: 'スマホいじり', effect: '何を言っても「ふーん」' },
      { at: 1, label: 'チラ見', effect: '少し反応するように' },
      { at: 2, label: '顔上げた', effect: '会話が成立し始める' },
      { at: 3, label: 'のめり込み', effect: 'スマホを置いた！好感度UP加速' },
    ],
  },
};

// ===== 裏設定（本音フラグメント） =====
const BACKSTORY_FRAGMENTS = {
  masao: [
    { affectionMin: 40, keyword: '家族|嫁|奥さん|家庭', fragment: '……実はさ、家に帰っても誰も「おかえり」って言ってくれないんだよね。ここだけなんだ、俺の居場所。' },
    { affectionMin: 70, keyword: '本当|本音|寂しい', fragment: '……はは、${name}ちゃんにこんな話するの初めてだよ。会社でも家でも「マサオさん」って距離置かれてさ。……ここにいる時だけ、俺は俺でいられるんだ。' },
  ],
  takashi: [
    { affectionMin: 40, keyword: '推し|裏切|辞め', fragment: '……実はさ、前に推してた子がいきなり辞めちゃってさ。何も言わずに。3年通ったのに。……だから「本気」の関係がほしいんだよね。' },
    { affectionMin: 70, keyword: '本当|信じ|大切', fragment: '……${name}ちゃんは辞めないでよ。頼むから。俺、もう一回あんな思いしたくないんだ……。' },
  ],
  reiji: [
    { affectionMin: 40, keyword: '前|過去|金|使', fragment: '……前にいた店でさ。キャストに500万使った。「愛してる」って言われて信じた。……全部営業だった。' },
    { affectionMin: 70, keyword: '信じ|本当|嘘', fragment: '……だから怖いんだ。${name}の言葉も……嘘かもしれないって。でも信じたい。……信じさせてくれ。' },
  ],
  merutaso: [
    { affectionMin: 40, keyword: 'キャスト|仕事|なんで客', fragment: '……実はね、私も前はキャスト側だったの。でもさ、笑顔作るの疲れちゃって。……客の方が楽かなって。' },
    { affectionMin: 70, keyword: '本当|やめた理由|辛', fragment: '……あの頃さ、毎日泣いてた。お客さんに「お前の代わりなんていくらでもいる」って言われて。……だから${name}ちゃんみたいに優しい子見ると……なんか、泣きそうになる。' },
  ],
};

// ===== ゲーム状態 =====
let playerName = '';
let selectedCharacterId = null;
let typewriterTimer = null;
let naikinGiftClaimed = false;
let gameState = {
  characterId: null, affection: 0, mp: 100, turns: 0, phase: 0,
  messages: [], firedEvents: [], mpShieldTurns: 0, affBoostTurns: 0, isLoading: false,
  mechanic: 0, backstoryRevealed: [],
};

// ===== 時間表示 =====
function updateTimeDisplay() {
  const el = document.getElementById('time-display');
  if (!el) return;
  const d = getDiff();
  const elapsed = gameState.turns * d.minutesPerTurn;
  const total = d.maxTurns * d.minutesPerTurn;
  const remaining = total - elapsed;
  el.textContent = `⏰ ${elapsed}分 / ${total}分（${gameState.turns}/${d.maxTurns}ターン）`;
  if (remaining <= d.minutesPerTurn * 2) el.classList.add('time-danger');
  else el.classList.remove('time-danger');
}

// ===== チュートリアル =====
function showTutorial() {
  document.getElementById('tutorial-overlay').classList.remove('hidden');
}
function closeTutorial() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
}

// ===== バックログ =====
function openBacklog() {
  const list = document.getElementById('backlog-list');
  list.innerHTML = '';
  const char = CHARACTERS[gameState.characterId];
  gameState.messages.forEach(m => {
    const div = document.createElement('div');
    div.className = 'backlog-entry ' + (m.role === 'user' ? 'backlog-user' : 'backlog-char');
    const name = m.role === 'user' ? playerName : char.name;
    div.innerHTML = `<span class="backlog-name">${name}</span> ${m.content}`;
    list.appendChild(div);
  });
  document.getElementById('backlog-overlay').classList.remove('hidden');
  list.scrollTop = list.scrollHeight;
}
function closeBacklog() { document.getElementById('backlog-overlay').classList.add('hidden'); }

// エンディング/ゲームオーバーから全ログを見る（openBacklogと同じだがどの画面からでも呼べる）
function openFullLog() {
  openBacklog();
}

// ===== 結果画像保存 =====
function saveResultImage() {
  const char = CHARACTERS[gameState.characterId];
  const canvas = document.createElement('canvas');
  const w = 600, h = 800;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // 背景
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1a0f1e');
  grad.addColorStop(0.5, '#2d1528');
  grad.addColorStop(1, '#1a0f1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 枠線
  ctx.strokeStyle = 'rgba(200,150,180,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  // タイトル
  ctx.fillStyle = '#f2b8cb';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('コンカフェ★メンタルウォーズ', w / 2, 70);

  // ランク
  const rankText = document.getElementById('ending-title')?.textContent || '';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(rankText, w / 2, 120);

  // ボトル
  const bottleText = document.getElementById('ending-bottle-display')?.textContent || '';
  ctx.fillStyle = '#f0deb8';
  ctx.font = '18px sans-serif';
  ctx.fillText(bottleText, w / 2, 160);

  // キャラ名
  ctx.fillStyle = '#f2b8cb';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`vs ${char.name}（${char.age}）`, w / 2, 210);

  // スコア
  const scoreText = document.getElementById('ending-score')?.textContent || '';
  ctx.fillStyle = '#c9a86c';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(scoreText, w / 2, 250);

  // 区切り線
  ctx.strokeStyle = 'rgba(200,150,180,0.2)';
  ctx.beginPath();
  ctx.moveTo(40, 275);
  ctx.lineTo(w - 40, 275);
  ctx.stroke();

  // 会話ログ（最大15行）
  ctx.fillStyle = 'rgba(255,245,250,0.9)';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  let y = 305;
  const maxLines = 15;
  const msgs = gameState.messages.slice(-maxLines * 2);
  msgs.forEach(m => {
    if (y > h - 80) return;
    const name = m.role === 'user' ? `🎀 ${playerName}` : `${char.avatar} ${char.name}`;
    const line = `${name}: ${m.content.slice(0, 40)}${m.content.length > 40 ? '…' : ''}`;
    ctx.fillStyle = m.role === 'user' ? 'rgba(255,180,210,0.9)' : 'rgba(200,200,240,0.9)';
    ctx.fillText(line, 40, y);
    y += 22;
  });

  // フッター
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`v${GAME_VERSION} | concafe-mental-wars.fly.dev`, w / 2, h - 35);

  // 保存（スマホ対応: Web Share API → フォールバックでBlobダウンロード）
  canvas.toBlob(async (blob) => {
    if (!blob) { showFlash('❌ 画像生成に失敗しました'); return; }

    const fileName = `concafe_result_${char.name}_${Date.now()}.png`;

    // Web Share APIが使えればシェアシートを開く（スマホ向け）
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'コンカフェ★メンタルウォーズ 結果' });
          showFlash('📸 シェアしました！');
          return;
        }
      } catch (e) {
        if (e.name === 'AbortError') return; // ユーザーがキャンセル
      }
    }

    // フォールバック: Blobダウンロード
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFlash('📸 画像を保存しました！');
  }, 'image/png');
}

// ===== ヒント（低難易度のみ） =====
function showHint() {
  if (!getDiff().showHints) return;
  const char = CHARACTERS[gameState.characterId];
  const hints = char.hints || [];
  const hint = hints[Math.floor(Math.random() * hints.length)] || 'がんばって！';
  showFlash(`💡 ${hint}`);
}

// ===== 画面遷移 =====
function startGame() {
  const input = document.getElementById('player-name-input');
  playerName = input.value.trim() || 'ちゃん';
  showScreen('character-select');
}

function confirmCharacter(characterId) {
  selectedCharacterId = characterId;
  const char = CHARACTERS[characterId];
  const avatarEl = document.getElementById('confirm-avatar');
  avatarEl.textContent = char.avatar;
  avatarEl.style.background = char.avatarBg;
  avatarEl.style.fontSize = '3.5rem';
  document.getElementById('confirm-name').textContent = `${char.name}（${char.age}歳）`;
  document.getElementById('confirm-type').textContent = char.type;
  document.getElementById('confirm-detail').textContent = char.detail;
  showScreen('confirm');
}

function setDifficulty(diff) {
  gameDifficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('diff-active'));
  document.getElementById(`diff-${diff}`).classList.add('diff-active');
}

function startSelectedGame() {
  if (!selectedCharacterId) return;
  naikinGiftClaimed = false;
  gameState = {
    characterId: selectedCharacterId, affection: 0, mp: 100, turns: 0, phase: 0,
    messages: [], firedEvents: [], mpShieldTurns: 0, affBoostTurns: 0, isLoading: false,
    mechanic: 0, backstoryRevealed: [],
  };
  const char = CHARACTERS[selectedCharacterId];
  document.getElementById('adv-situation').textContent = char.situation;
  document.getElementById('textbox-name-tag').textContent = `${char.name}（${char.age}）`;
  document.getElementById('textbox-text').textContent = '……';

  // 背景画像
  const bgEl = document.getElementById('vn-bg');
  const bgPath = `images/bg_${selectedCharacterId}.png`;
  const bgImg = new Image();
  bgImg.onload = () => { bgEl.style.backgroundImage = `url(${bgPath})`; bgEl.style.backgroundSize = 'cover'; bgEl.style.backgroundPosition = 'center'; };
  bgImg.onerror = () => { bgEl.style.backgroundImage = 'none'; };
  bgImg.src = bgPath;

  // ヒントボタン表示/非表示
  const hintBtn = document.getElementById('btn-hint');
  if (hintBtn) hintBtn.style.display = getDiff().showHints ? 'block' : 'none';

  updateCharPortrait();
  hideChoices();
  showInput();
  updateGauges();
  updateMechanicUI();
  updateItemUI();
  updateTimeDisplay();
  showScreen('game');
  playBGM();

  setTimeout(() => { displayCharText(char.greeting(playerName)); }, 400);
}

// ===== テキスト表示 =====
function displayCharText(text) {
  if (typewriterTimer) { clearInterval(typewriterTimer); typewriterTimer = null; }
  const el = document.getElementById('textbox-text');
  el.textContent = '';
  if (!text) return;
  let i = 0;
  typewriterTimer = setInterval(() => {
    if (i >= text.length) { clearInterval(typewriterTimer); typewriterTimer = null; return; }
    el.textContent += text[i]; i++;
  }, 28);
}

// ===== チャンスイベント演出 =====
function showChanceEvent(event) {
  // チャンスイベント！のカットイン
  const callEl = document.getElementById('champagne-call');
  if (callEl) {
    callEl.innerHTML = '<div class="call-text chance-call">⚡ CHANCE EVENT ⚡</div>';
    callEl.classList.remove('hidden');
    playSE('good');
    setTimeout(() => {
      callEl.classList.add('hidden');
      fireScriptedEvent(event);
    }, 1500);
  } else {
    fireScriptedEvent(event);
  }
}

// ===== スクリプトイベント =====
function checkScriptedEvent() {
  const events = SCRIPTED_EVENTS[gameState.characterId] || [];
  for (let idx = 0; idx < events.length; idx++) {
    if (gameState.firedEvents.includes(idx)) continue;
    if (gameState.turns >= events[idx].trigger.afterTurn) {
      gameState.firedEvents.push(idx);
      return { ...events[idx], idx };
    }
  }
  return null;
}

function fireScriptedEvent(event) {
  document.getElementById('textbox-name-tag').textContent = 'EVENT';
  displayCharText(event.text.replace(/\$\{name\}/g, playerName));
  hideInput();
  showChoices(event.choices, event.narration);
}

function showChoices(choices, narration) {
  const container = document.getElementById('choice-container');
  document.getElementById('choice-narration').textContent = narration || '';
  const list = document.getElementById('choice-list');
  list.innerHTML = '';
  choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'choice-btn'; btn.textContent = choice.label;
    btn.onclick = () => handleChoice(choice);
    list.appendChild(btn);
  });
  container.classList.remove('hidden');
}

function hideChoices() { document.getElementById('choice-container').classList.add('hidden'); }
function showInput() { document.getElementById('adv-input-area').style.display = 'flex'; }
function hideInput() { document.getElementById('adv-input-area').style.display = 'none'; }

function handleChoice(choice) {
  hideChoices(); showInput();
  const char = CHARACTERS[gameState.characterId];
  document.getElementById('textbox-name-tag').textContent = `${char.name}（${char.age}）`;

  let affDelta = choice.affection || 0;
  let mpDelta = choice.mp || 0;
  if (affDelta > 0 && gameState.affBoostTurns > 0) affDelta *= 2;
  if (mpDelta < 0) mpDelta = Math.round(mpDelta * getDiff().mpMult);
  if (mpDelta < 0 && gameState.mpShieldTurns > 0) mpDelta = Math.round(mpDelta / 2);

  gameState.affection = Math.max(0, Math.min(100, gameState.affection + affDelta));
  gameState.mp = Math.max(0, Math.min(100, gameState.mp + mpDelta));
  updateGauges(affDelta, mpDelta); updateCharPortrait();

  if (affDelta > 0) playSE('good'); else if (affDelta < 0) playSE('bad');
  if (choice.flash) showFlash(choice.flash);
  gameState.messages.push({ role: 'user', content: `[選択: ${choice.label}]` });

  if (choice.gameOver) { playSE('gameover'); displayCharText(choice.gameOverReason); setTimeout(() => triggerGameOver(choice.gameOverReason), 2000); return; }
  if (gameState.mp <= 0) { playSE('gameover'); setTimeout(() => triggerGameOver('精神力が尽きてしまった……'), 1200); return; }
  const br = checkBottleThreshold();
  if (br) { playSE('bottle'); setTimeout(() => triggerEnding(br), 1500); return; }
  generateReaction();
}

function checkBottleThreshold() {
  const id = gameState.characterId, aff = gameState.affection;
  if (id === 'masao') { if (aff >= 100) return 'S'; if (aff >= 95) return '松'; if (aff >= 85) return '竹'; if (aff >= 75) return '梅'; }
  else if (id === 'takashi') { if (aff >= 100) return 'S'; if (aff >= 80) return '梅'; }
  else if (id === 'reiji') { if (aff >= 100) return 'S'; if (aff >= 80) return '松'; if (aff >= 65) return '竹'; }
  else if (id === 'merutaso') { if (aff >= 100) return 'S'; if (aff >= 90) return '松'; if (aff >= 75) return '竹'; if (aff >= 60) return '梅'; }
  return null;
}

async function generateReaction() {
  gameState.isLoading = true;
  showLoading(true);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: gameState.characterId, messages: gameState.messages,
        affection: gameState.affection, mp: gameState.mp, turns: gameState.turns,
        playerName, phase: gameState.phase, afterEvent: true,
        timeRemaining: (getDiff().maxTurns - gameState.turns) * getDiff().minutesPerTurn })
    });
    const data = await res.json();
    displayCharText(data.message);
    gameState.messages.push({ role: 'assistant', content: data.message });
  } catch { displayCharText('……ふぅん。'); }
  gameState.isLoading = false;
  showLoading(false);
  document.getElementById('chat-input').focus();
}

// ===== ローディング =====
function showLoading(on) {
  const el = document.getElementById('loading-indicator');
  if (el) el.style.display = on ? 'flex' : 'none';
}

// ===== アイテム =====
function useItem(itemId) {
  if (gameState.isLoading) return;
  const inv = loadInventory();
  if (!inv[itemId] || inv[itemId] <= 0) return;
  inv[itemId]--; saveInventory(inv);
  const item = ITEMS[itemId];
  if (item.effect.mp) gameState.mp = Math.min(100, gameState.mp + item.effect.mp);
  if (item.effect.affection) gameState.affection = Math.min(100, gameState.affection + item.effect.affection);
  if (item.effect.mpShield) gameState.mpShieldTurns = item.effect.mpShield;
  if (item.effect.affBoost) gameState.affBoostTurns = item.effect.affBoost;
  updateGauges(); updateCharPortrait(); updateItemUI();
  playSE('good');
  showFlash(`${item.emoji} ${item.name}を使った！`);
}

function showItemInfo(itemId) {
  const item = ITEMS[itemId];
  showFlash(`${item.emoji} ${item.name}: ${item.desc}`);
}

function updateItemUI() {
  const inv = loadInventory();
  const container = document.getElementById('item-bar');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(ITEMS).forEach(([id, item]) => {
    const count = inv[id] || 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'item-btn' + (count <= 0 ? ' item-empty' : '');
    btn.disabled = count <= 0;
    btn.innerHTML = `${item.emoji}<span class="item-count">${count}</span>`;
    // タップ: 使う、長押し: 説明
    btn.onclick = () => useItem(id);
    let pressTimer;
    btn.addEventListener('touchstart', (e) => { pressTimer = setTimeout(() => { e.preventDefault(); showItemInfo(id); }, 500); }, { passive: false });
    btn.addEventListener('touchend', () => clearTimeout(pressTimer));
    btn.addEventListener('touchmove', () => clearTimeout(pressTimer));
    container.appendChild(btn);
  });
}

const RANK_POINTS = { 'S': 3000, '松': 1000, '竹': 500, '梅': 200 };
function grantClearReward(rank) { const p = RANK_POINTS[rank] || 100; const c = loadPoints(); savePoints(c + p); return p; }

function getNaikinGift() {
  if (naikinGiftClaimed) { showFlash('📦 もう受け取り済みです！'); return; }
  naikinGiftClaimed = true;
  savePoints(loadPoints() + 100);
  const btn = document.getElementById('btn-naikin');
  if (btn) { btn.disabled = true; btn.textContent = '📦 受け取り済み'; }
  showFlash('📦 内勤さんからボーナス100ptもらった！');
}

// ===== ショップ =====
function openShop() {
  const pts = loadPoints(); const inv = loadInventory();
  document.getElementById('shop-points').textContent = `所持ポイント: ${pts}pt`;
  const list = document.getElementById('shop-list');
  list.innerHTML = '';
  Object.entries(ITEMS).forEach(([id, item]) => {
    const row = document.createElement('div'); row.className = 'shop-row';
    const canBuy = pts >= item.price;
    row.innerHTML = `<span class="shop-item-info">${item.emoji} ${item.name}<br><span class="shop-item-desc">${item.desc}</span></span>
      <span class="shop-item-stock">x${inv[id] || 0}</span>
      <button type="button" class="shop-buy-btn${canBuy ? '' : ' shop-buy-disabled'}" ${canBuy ? '' : 'disabled'} onclick="buyItem('${id}')">${item.price}pt</button>`;
    list.appendChild(row);
  });
  document.getElementById('shop-overlay').classList.remove('hidden');
}
function closeShop() { document.getElementById('shop-overlay').classList.add('hidden'); }
function buyItem(id) {
  const item = ITEMS[id]; let p = loadPoints(); if (p < item.price) return;
  savePoints(p - item.price);
  const inv = loadInventory(); inv[id] = (inv[id] || 0) + 1; saveInventory(inv);
  updateItemUI(); openShop(); playSE('good'); showFlash(`🛒 ${item.emoji}${item.name}を購入！`);
}

// ===== メッセージ送信 =====
async function sendMessage() {
  if (gameState.isLoading) return;
  const input = document.getElementById('chat-input');
  const text = input.value.trim(); if (!text) return;

  input.value = '';
  gameState.isLoading = true;
  const btn = document.getElementById('btn-send');
  btn.disabled = true; btn.innerHTML = '…';

  document.getElementById('textbox-name-tag').textContent = `${playerName}（あなた）`;
  document.getElementById('textbox-text').textContent = text;
  gameState.messages.push({ role: 'user', content: text });

  await new Promise(r => setTimeout(r, 600));
  const char = CHARACTERS[gameState.characterId];

  // スクリプトイベントがあればAI返答をスキップしてイベントへ
  const ev = checkScriptedEvent();
  if (ev) {
    gameState.turns++;
    if (gameState.turns >= 6) gameState.phase = 2;
    else if (gameState.turns >= 3) gameState.phase = 1;
    updateTimeDisplay();
    resetSendButton();
    showChanceEvent(ev);
    return;
  }

  document.getElementById('textbox-name-tag').textContent = `${char.name}（${char.age}）`;
  showLoading(true);

  try {
    const d = getDiff();
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: gameState.characterId, messages: gameState.messages,
        affection: gameState.affection, mp: gameState.mp, turns: gameState.turns,
        playerName, phase: gameState.phase,
        timeRemaining: (d.maxTurns - gameState.turns) * d.minutesPerTurn,
        mechanicText: getMechanicPromptText() })
    });
    const data = await res.json();
    showLoading(false);

    // 裏設定チェック（AIの返答の前に、プレイヤーの発言でトリガー）
    const backstory = checkBackstory(text);
    if (backstory) {
      // 裏設定が明かされる場合、AIの返答の後に追加表示
      displayCharText(data.message);
      gameState.messages.push({ role: 'assistant', content: data.message });
      await new Promise(r => setTimeout(r, 2000));
      displayCharText(backstory);
      gameState.messages.push({ role: 'assistant', content: `[本音] ${backstory}` });
      showFlash('💭 本音が漏れた……');
      playSE('good');
    } else {
      displayCharText(data.message);
      gameState.messages.push({ role: 'assistant', content: data.message });
    }

    gameState.turns++;
    tickMechanic(); // 固有メカニクス進行

    if (gameState.mpShieldTurns > 0) gameState.mpShieldTurns--;
    if (gameState.affBoostTurns > 0) gameState.affBoostTurns--;

    let affDelta = data.affection_delta || 0;
    let mpDelta = data.mp_delta || 0;

    // メカニクスによる補正
    const mechInfo = getMechanicInfo();
    if (mechInfo) {
      if (gameState.characterId === 'masao' && gameState.mechanic >= 60) affDelta = Math.round(affDelta * 1.3);
      if (gameState.characterId === 'merutaso' && gameState.mechanic >= 3) affDelta = Math.round(affDelta * 1.5);
    }

    if (affDelta > 0 && gameState.affBoostTurns > 0) affDelta *= 2;
    if (mpDelta < 0) mpDelta = Math.round(mpDelta * d.mpMult);
    if (mpDelta < 0 && gameState.mpShieldTurns > 0) mpDelta = Math.round(mpDelta / 2);

    gameState.affection = Math.max(0, Math.min(100, gameState.affection + affDelta));
    gameState.mp = Math.max(0, Math.min(100, gameState.mp + mpDelta));
    updateGauges(affDelta, mpDelta); updateCharPortrait(); updateTimeDisplay();
    updateMechanicUI();

    if (gameState.turns >= 6) gameState.phase = 2;
    else if (gameState.turns >= 3) gameState.phase = 1;

    if (affDelta > 0) playSE('good'); else if (affDelta < 0 || mpDelta < 0) playSE('bad');

    if (data.event_type === 'sekkara') showFlash(`💦 セクハラ！ MP${mpDelta}`);
    else if (data.event_type === 'angry') showFlash(`😤 地雷！ 好感度${affDelta}`);
    else if (affDelta > 0) showFlash(`💕 +${affDelta}`);
    else if (affDelta < 0) showFlash(`💔 ${affDelta}`);

    if (data.game_over) { playSE('gameover'); setTimeout(() => triggerGameOver(data.game_over_reason), 1200); resetSendButton(); return; }
    if (gameState.mp <= 0) { playSE('gameover'); setTimeout(() => triggerGameOver('精神力が尽きてしまった……'), 1200); resetSendButton(); return; }

    if (gameState.turns >= d.maxTurns) {
      const br = checkBottleThreshold();
      if (br) { playSE('bottle'); setTimeout(() => triggerEnding(br), 1500); }
      else { playSE('gameover'); setTimeout(() => triggerGameOver(`${d.maxTurns * d.minutesPerTurn}分のワンタイが終了……ボトルは開かなかった`), 1200); }
      resetSendButton(); return;
    }

    const br = checkBottleThreshold();
    if (br && gameState.turns >= 4) { playSE('bottle'); setTimeout(() => triggerEnding(br), 1500); resetSendButton(); return; }

  } catch { showLoading(false); document.getElementById('textbox-text').textContent = 'ん？……ちょっと待って。'; }

  resetSendButton();
  input.focus();
}

function resetSendButton() {
  gameState.isLoading = false;
  document.getElementById('btn-send').disabled = false;
  document.getElementById('btn-send').innerHTML = '送る<br>💬';
}

// ===== ゲージ =====
function updateGauges(affD = null, mpD = null) {
  const ab = document.getElementById('gauge-affection'), mb = document.getElementById('gauge-mp');
  ab.style.width = gameState.affection + '%'; mb.style.width = gameState.mp + '%';
  document.getElementById('gauge-affection-num').textContent = gameState.affection;
  document.getElementById('gauge-mp-num').textContent = gameState.mp;
  if (gameState.mp <= 20) mb.style.background = 'linear-gradient(90deg,#ff2d55,#ff6b6b)';
  else if (gameState.mp <= 50) mb.style.background = 'linear-gradient(90deg,#ff6600,#ffaa44)';
  else mb.style.background = '';
  if (affD && affD < 0) ab.classList.add('gauge-flash');
  if (mpD && mpD < 0) mb.classList.add('gauge-flash');
  setTimeout(() => { ab.classList.remove('gauge-flash'); mb.classList.remove('gauge-flash'); }, 1200);
}

// ===== 固有メカニクス =====
function getMechanicInfo() {
  const m = CHAR_MECHANICS[gameState.characterId];
  if (!m) return null;
  const val = gameState.mechanic;
  let currentLevel = m.levels[0];
  for (const lv of m.levels) { if (val >= lv.at) currentLevel = lv; }
  return { ...m, val, currentLevel };
}

function updateMechanicUI() {
  const el = document.getElementById('mechanic-display');
  if (!el) return;
  const info = getMechanicInfo();
  if (!info) { el.style.display = 'none'; return; }
  el.style.display = 'flex';

  if (info.hidden) {
    el.innerHTML = `<span class="mech-label">${info.emoji} ${info.name}</span><span class="mech-value">???</span>`;
  } else {
    const pct = Math.min(100, (info.val / info.max) * 100);
    el.innerHTML = `<span class="mech-label">${info.emoji} ${info.name}</span>
      <div class="mech-bar"><div class="mech-fill" style="width:${pct}%;background:${info.color}"></div></div>
      <span class="mech-value">${info.currentLevel.label}</span>`;
  }
}

function advanceMechanic(delta) {
  const m = CHAR_MECHANICS[gameState.characterId];
  if (!m) return;
  gameState.mechanic = Math.max(0, Math.min(m.max, gameState.mechanic + delta));
  updateMechanicUI();
}

function tickMechanic() {
  const m = CHAR_MECHANICS[gameState.characterId];
  if (!m || !m.perTurn) return;
  advanceMechanic(m.perTurn);
}

// メカニクスの状態をAI用テキストに変換
function getMechanicPromptText() {
  const info = getMechanicInfo();
  if (!info) return '';
  return `\n【固有状態】${info.name}レベル: ${info.currentLevel.label}（${info.currentLevel.effect}）。この状態に応じた言動をしろ。`;
}

// 裏設定チェック（プレイヤーの発言にキーワードが含まれるか）
function checkBackstory(playerMessage) {
  const fragments = BACKSTORY_FRAGMENTS[gameState.characterId] || [];
  for (let i = 0; i < fragments.length; i++) {
    if (gameState.backstoryRevealed.includes(i)) continue;
    const f = fragments[i];
    if (gameState.affection < f.affectionMin) continue;
    const re = new RegExp(f.keyword);
    if (re.test(playerMessage)) {
      gameState.backstoryRevealed.push(i);
      return f.fragment.replace(/\$\{name\}/g, playerName);
    }
  }
  return null;
}

function showFlash(text) {
  const el = document.getElementById('event-flash');
  document.getElementById('event-flash-text').textContent = text;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

// ===== 攻略履歴 =====
function loadClearHistory() { try { return JSON.parse(localStorage.getItem('concafe_clears')) || {}; } catch { return {}; } }
function saveClearHistory(h) { localStorage.setItem('concafe_clears', JSON.stringify(h)); }
function markCleared(cid, rank) {
  const h = loadClearHistory(), ro = { '梅': 1, '竹': 2, '松': 3, 'S': 4 };
  if (!h[cid] || (ro[rank] || 0) > (ro[h[cid]] || 0)) h[cid] = rank;
  saveClearHistory(h);
}
function updateClearBadges() {
  const h = loadClearHistory();
  Object.keys(CHARACTERS).forEach(id => {
    const b = document.getElementById(`clear-badge-${id}`); if (!b) return;
    if (h[id]) { b.textContent = `攻略済 ${{ '梅': '🥂', '竹': '🍾', '松': '👑', 'S': '👼' }[h[id]] || '✓'}`; b.className = 'clear-badge badge-cleared'; }
    else { b.textContent = '未攻略'; b.className = 'clear-badge badge-uncleared'; }
  });
}

// ===== エンディング（シャンパンコール演出） =====
function triggerEnding(rank) {
  stopBGM();
  const bottle = pickBottle(rank);
  const char = CHARACTERS[gameState.characterId];
  markCleared(gameState.characterId, rank);
  const earnedPts = grantClearReward(rank);
  const totalPts = loadPoints();

  let icon, title, message;
  if (rank === 'S') { icon = '👼✨'; title = '✦ ANGEL END ✦'; message = `${char.name}が伝説のエンジェルを開けた！！\n${playerName}ちゃん……あなたは神キャストです🪽✨`; }
  else if (rank === '松') { icon = '👑'; title = 'PERFECT END ✨'; message = `${char.name}が${bottle.name}を開けた！\n${playerName}ちゃんの完全勝利です🎊`; }
  else if (rank === '竹') { icon = '⭐'; title = 'GOOD END 🎉'; message = `${char.name}が${bottle.name}を開けてくれた！\n今夜のトーク力は見事でした。`; }
  else { icon = '🌸'; title = 'NORMAL END 🥂'; message = `${char.name}が${bottle.name}を開けてくれた！\n次はもっと上を目指して！`; }

  // シャンパンコール演出
  const callEl = document.getElementById('champagne-call');
  if (callEl) {
    callEl.classList.remove('hidden');
    callEl.innerHTML = `<div class="call-text">🍾 ${bottle.name} オープン！！ 🍾</div>`;
    setTimeout(() => callEl.classList.add('hidden'), 3000);
  }

  document.getElementById('ending-icon').textContent = icon;
  document.getElementById('ending-title').textContent = title;
  document.getElementById('ending-bottle-display').innerHTML = `${bottle.emoji} <strong>${bottle.name}</strong>（${bottle.price}）`;
  document.getElementById('ending-message').textContent = message;
  document.getElementById('ending-score').textContent = `SCORE: ${bottle.score.toLocaleString()} pts`;
  document.getElementById('ending-reward').textContent = `💰 +${earnedPts}pt 獲得！（合計: ${totalPts}pt）`;

  const naikinBtn = document.getElementById('btn-naikin');
  if (naikinBtn) { naikinBtn.disabled = false; naikinBtn.textContent = '📦 内勤さんからボーナスpt'; }

  document.getElementById('manager-feedback').textContent = '店長が会話をチェック中……';
  setTimeout(() => showScreen('ending'), rank === '松' ? 3000 : 1500);
  requestManagerFeedback(rank);
}

async function requestManagerFeedback(rank) {
  const el = document.getElementById('manager-feedback');
  try {
    const res = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: gameState.characterId, messages: gameState.messages,
        affection: gameState.affection, mp: gameState.mp, turns: gameState.turns, playerName, bottleRank: rank })
    });
    el.textContent = (await res.json()).feedback;
  } catch { el.textContent = '店長は忙しいみたいです……'; }
}

function triggerGameOver(reason) {
  stopBGM(); playSE('gameover');
  document.getElementById('gameover-reason').textContent = reason || 'ゲームオーバー';
  showScreen('gameover');
}

function confirmBack() { if (confirm('キャラ選択に戻りますか？')) { stopBGM(); showScreen('character-select'); } }

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + screenId).classList.add('active');
  if (screenId === 'character-select') updateClearBadges();
}

document.addEventListener('DOMContentLoaded', () => {
  const verEl = document.getElementById('version-display');
  if (verEl) verEl.textContent = `v${GAME_VERSION}`;
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendMessage(); }
  });
});
