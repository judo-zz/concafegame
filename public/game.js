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
  }
};

const BOTTLE_POOL = {
  松: [
    { emoji: '👼🍾', name: 'エンジェル', price: '100,000円+' },
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
const RANK_SCORE = { 松: 10000, 竹: 3000, 梅: 1000 };

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
};

// ===== ゲーム状態 =====
let playerName = '';
let selectedCharacterId = null;
let typewriterTimer = null;
let naikinGiftClaimed = false;
let gameState = {
  characterId: null, affection: 0, mp: 100, turns: 0, phase: 0,
  messages: [], firedEvents: [], mpShieldTurns: 0, affBoostTurns: 0, isLoading: false
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
    messages: [], firedEvents: [], mpShieldTurns: 0, affBoostTurns: 0, isLoading: false
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
  if (id === 'masao') { if (aff >= 95) return '松'; if (aff >= 85) return '竹'; if (aff >= 75) return '梅'; }
  else if (id === 'takashi') { if (aff >= 80) return '梅'; }
  else if (id === 'reiji') { if (aff >= 80) return '松'; if (aff >= 65) return '竹'; }
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

const RANK_POINTS = { '松': 1000, '竹': 500, '梅': 200 };
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
  document.getElementById('textbox-name-tag').textContent = `${char.name}（${char.age}）`;
  showLoading(true);

  try {
    const d = getDiff();
    const res = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: gameState.characterId, messages: gameState.messages,
        affection: gameState.affection, mp: gameState.mp, turns: gameState.turns,
        playerName, phase: gameState.phase,
        timeRemaining: (d.maxTurns - gameState.turns) * d.minutesPerTurn })
    });
    const data = await res.json();
    showLoading(false);
    displayCharText(data.message);
    gameState.messages.push({ role: 'assistant', content: data.message });
    gameState.turns++;

    if (gameState.mpShieldTurns > 0) gameState.mpShieldTurns--;
    if (gameState.affBoostTurns > 0) gameState.affBoostTurns--;

    let affDelta = data.affection_delta || 0;
    let mpDelta = data.mp_delta || 0;
    if (affDelta > 0 && gameState.affBoostTurns > 0) affDelta *= 2;
    if (mpDelta < 0) mpDelta = Math.round(mpDelta * d.mpMult);
    if (mpDelta < 0 && gameState.mpShieldTurns > 0) mpDelta = Math.round(mpDelta / 2);

    gameState.affection = Math.max(0, Math.min(100, gameState.affection + affDelta));
    gameState.mp = Math.max(0, Math.min(100, gameState.mp + mpDelta));
    updateGauges(affDelta, mpDelta); updateCharPortrait(); updateTimeDisplay();

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
  const ev = checkScriptedEvent();
  if (ev) setTimeout(() => fireScriptedEvent(ev), 1500);
  else input.focus();
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
  const h = loadClearHistory(), ro = { '梅': 1, '竹': 2, '松': 3 };
  if (!h[cid] || ro[rank] > ro[h[cid]]) h[cid] = rank;
  saveClearHistory(h);
}
function updateClearBadges() {
  const h = loadClearHistory();
  Object.keys(CHARACTERS).forEach(id => {
    const b = document.getElementById(`clear-badge-${id}`); if (!b) return;
    if (h[id]) { b.textContent = `攻略済 ${{ '梅': '🥂', '竹': '🍾', '松': '👑' }[h[id]] || '✓'}`; b.className = 'clear-badge badge-cleared'; }
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
  if (rank === '松') { icon = '👑'; title = 'PERFECT END ✨'; message = `${char.name}が${bottle.name}を開けた！\n${playerName}ちゃんの完全勝利です🎊`; }
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
