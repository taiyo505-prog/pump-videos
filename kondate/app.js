// くるくるごはん: 食材を選ぶ → ルーレットでレシピを決める → 作って写真を投稿
(function () {
'use strict';
var D = window.KONDATE_DATA, FOODS = D.foods, RECIPES = D.recipes;
var byId = {}; RECIPES.forEach(function (r) { byId[r.id] = r; });
var K = { picked: 'kd-picked', fav: 'kd-fav', made: 'kd-made', shop: 'kd-shop', srv: 'kd-srv', week: 'kd-week', flt: 'kd-filter', must: 'kd-must' };
function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(t) { var d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.classList.add('on'); }, 10); setTimeout(function () { d.classList.remove('on'); setTimeout(function () { d.remove(); }, 300); }, 2000); }
function confetti() { var c = ['#FF7F50', '#FFD166', '#5DBB7A', '#FF8FAB', '#7BC8F6']; for (var i = 0; i < 40; i++) { var d = document.createElement('div'); d.className = 'cf'; d.style.left = Math.random() * 100 + 'vw'; d.style.background = c[i % c.length]; d.style.animationDelay = Math.random() * .4 + 's'; d.style.borderRadius = i % 3 ? '2px' : '50%'; document.body.appendChild(d); setTimeout(function (x) { return function () { x.remove(); }; }(d), 2200); } }
function buzz() { try { var H = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics; if (H) H.impact({ style: 'LIGHT' }); } catch (e) {} }
function md(t) { var d = new Date(t); return (d.getMonth() + 1) + '/' + d.getDate(); }
function dkey(t) { var d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

var st = {
  tab: 'home', cat: '肉',
  picked: get(K.picked, []),            // 選んだ食材
  must: get(K.must, []),                // その中で「ぜったい使う」食材
  fav: get(K.fav, []),                  // お気に入りのレシピID
  made: get(K.made, []),                // 作った記録 [{id, t}]
  shop: get(K.shop, []),                // 買い物リスト [{n, from, done}]
  srv: get(K.srv, 2),                   // 何人分
  week: get(K.week, null),              // 1週間の献立 {t, ids[]}
  flt: get(K.flt, { cat: 'all', min: 0, genre: 'all' })
};
function saveAll() { syncSoon(); st.must = st.must.filter(function (m) { return st.picked.indexOf(m) >= 0; }); put(K.must, st.must); put(K.picked, st.picked); put(K.fav, st.fav); put(K.made, st.made); put(K.shop, st.shop); put(K.srv, st.srv); put(K.week, st.week); put(K.flt, st.flt); shopBadge(); }

// ---- 候補のレシピ: 選んだ食材を1つ以上使うもの（たくさん使うほど上）。何も選んでなければ全部 ----
function passFilter(r) {
  var f = st.flt;
  if (f.cat !== 'all' && r.cat !== f.cat) return false;
  if (f.min && r.min > f.min) return false;
  if (f.genre !== 'all' && r.genre !== f.genre) return false;
  return true;
}
// 食材の一致: 一覧にある食材はそのまま一致。自分で入力した食材は「ゆるく」一致（ひらがな/カタカナ・部分一致・豚肉→豚こま肉 など）
var FOODSET = {}; FOODS.forEach(function (f) { FOODSET[f[0]] = f; });
var ALIAS = { '豚肉': '豚', 'ぶた肉': '豚', '鶏肉': '鶏', 'とり肉': '鶏', 'チキン': '鶏', '牛肉': '牛', 'ビーフ': '牛', 'ポーク': '豚', 'たまご': '卵', '玉子': '卵', 'ご飯': 'ごはん', '米': 'ごはん', 'お米': 'ごはん', 'ねぎ': 'ねぎ', 'ネギ': 'ねぎ', 'きのこ類': 'きのこ', 'しめじ': 'きのこ', 'まいたけ': 'きのこ', 'エリンギ': 'きのこ', 'マッシュルーム': 'きのこ', 'ソーセージ': 'ソーセージ', 'じゃこ': 'しらす', 'ちりめん': 'しらす', 'スパゲッティ': 'パスタ', 'スパゲティ': 'パスタ', 'ラーメン': '中華麺', 'やきそば': '中華麺', '焼きそば': '中華麺', 'パン': 'パン', 'シャケ': '鮭', 'さけ': '鮭', 'サケ': '鮭', 'えび': 'エビ', 'いか': 'イカ', 'たこ': 'タコ', 'ほたて': 'ホタテ', 'さば': 'サバ', 'あじ': 'アジ', 'ツナ': 'ツナ', 'とうふ': '豆腐', 'トウフ': '豆腐', 'みかん': 'みかん', 'オレンジ': 'みかん', 'いも': 'いも', 'ポテト': 'じゃがいも', 'トマト': 'トマト', 'たまねぎ': '玉ねぎ', 'タマネギ': '玉ねぎ', 'ニンジン': 'にんじん', '人参': 'にんじん', 'キャベツ': 'キャベツ', 'ナス': 'なす', '茄子': 'なす', '大根': '大根', 'だいこん': '大根', 'ほうれんそう': 'ほうれん草', 'ピーマン': 'ピーマン', 'チョコ': 'チョコ', 'ヨーグルト': 'ヨーグルト' };
function kana(s) { return String(s || '').trim().replace(/[\u30a1-\u30f6]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); }); }
function loose(term, name) {
  var t = kana(ALIAS[term] || term), n = kana(name), t0 = kana(term);
  if (!t) return false;
  return n.indexOf(t) >= 0 || n.indexOf(t0) >= 0 || (n.length >= 2 && t0.indexOf(n) >= 0);
}
function has(name) { for (var k = 0; k < st.picked.length; k++) { var p = st.picked[k]; if (p === name || (!FOODSET[p] && loose(p, name))) return true; } return false; }
function score(r) { var n = 0; r.ing.forEach(function (i) { if (i.food && has(i.n)) n++; }); st.picked.forEach(function (p) { if (!FOODSET[p] && loose(p, r.name) && !r.ing.some(function (i) { return loose(p, i.n); })) n++; }); return n; }
function needCount(r) { var n = 0; r.ing.forEach(function (i) { if (i.food && !has(i.n)) n++; }); return n; }
function foodHits(q) { var k = kana(q); if (!k) return []; return FOODS.filter(function (f) { return kana(f[0]).indexOf(k) >= 0 || loose(q, f[0]); }); }
function customHits(q) { return RECIPES.filter(function (r) { return loose(q, r.name) || r.ing.some(function (i) { return loose(q, i.n); }); }).length; }
function ficon(f) { return (window.FOOD_ICON && window.FOOD_ICON[f[0]]) || f[1]; }
function fdCls(n) { return st.picked.indexOf(n) < 0 ? '' : st.must.indexOf(n) >= 0 ? ' on must' : ' on'; }
function searchHtml(q) {
  if (!q) return '';
  var l = foodHits(q).slice(0, 24), h = '';
  if (l.length) h += "<div class='foods'>" + l.map(function (f) { return "<button class='fd" + fdCls(f[0]) + "' data-food='" + esc(f[0]) + "'><i>" + ficon(f) + '</i>' + esc(f[0]) + '</button>'; }).join('') + '</div>';
  if (!FOODSET[q]) { var n = customHits(q); h += "<button class='sub2' data-add='" + esc(q) + "' style='margin-top:8px'>＋「" + esc(q) + "」を食材に追加" + (n ? '（' + n + '品で使える）' : '') + '</button>'; }
  return h;
}
// そのレシピでその食材を使うか
function uses(r, p) { var cu = !FOODSET[p]; return r.ing.some(function (i) { return i.food && (i.n === p || (cu && loose(p, i.n))); }) || (cu && loose(p, r.name)); }
// ★ぜったい使う食材は「全部」入っているものだけ。✓使いたい食材は「どれか」入っていればOK（多いほど上）
function candidates() {
  var l = RECIPES.filter(passFilter), must = st.must.filter(function (m) { return st.picked.indexOf(m) >= 0; });
  if (must.length) l = l.filter(function (r) { return must.every(function (m) { return uses(r, m); }); });
  else if (st.picked.length) l = l.filter(function (r) { return score(r) > 0; });
  return l.sort(function (a, b) { return (score(b) - score(a)) || (needCount(a) - needCount(b)); });
}

// ---- 画面 ----
function render() {
  document.querySelectorAll('.nav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tab') === st.tab); });
  var a = $('app');
  if (st.tab === 'home') a.innerHTML = homeHtml();
  else if (st.tab === 'feed') { a.innerHTML = feedShell(); loadFeed(); }
  else if (st.tab === 'shop') a.innerHTML = shopHtml();
  else a.innerHTML = meHtml();
  window.scrollTo(0, 0);
}
function header(t, s) { return "<div class='hd'><div class='logo'>🍳</div><div><h1>" + t + '</h1><small>' + s + '</small></div></div>'; }

function homeHtml() {
  var cats = ['肉', '魚', '卵・大豆', '野菜', '主食', '果物', 'その他'];
  var h = header('くるくるごはん', '今日の献立ルーレット｜冷蔵庫にあるもので決めよう');
  h += "<div class='card'><div class='ct'><span class='no'>1</span>使いたい食材をえらぶ<span class='rt'>" + (st.picked.length ? "<button class='mini' data-act='clear'>リセット</button>" : '') + '</span></div>';
  h += "<p class='hint'><span class='hl'>1回タップ <b class='h1'>✓ 使いたい</b>（どれか使えればOK）</span><span class='hl'>2回タップ <b class='h2'>★ ぜったい使う</b>（全部使う）</span></p>";
  h += "<input id='fq' class='fq' type='search' autocomplete='off' placeholder='🔍 食材をさがす（なければ追加OK）'><div id='fqr'></div>";
  h += "<div class='tabs'>" + cats.map(function (c) { var n = FOODS.filter(function (f) { return f[2] === c && st.picked.indexOf(f[0]) >= 0; }).length; return "<button data-cat='" + c + "' class='" + (st.cat === c ? 'on' : '') + "'>" + c + (n ? ' ' + n : '') + '</button>'; }).join('') + '</div>';
  h += "<div class='foods'>" + FOODS.filter(function (f) { return f[2] === st.cat; }).map(function (f) { return "<button class='fd" + fdCls(f[0]) + "' data-food='" + esc(f[0]) + "'><i>" + ficon(f) + '</i>' + esc(f[0]) + '</button>'; }).join('') + '</div>';
  h += "<div class='picked'>" + (st.picked.length ? st.picked.map(function (p) { var mu = st.must.indexOf(p) >= 0; return "<span data-food='" + esc(p) + "' class='" + (mu ? 'mu' : FOODSET[p] ? '' : 'cu') + "'>" + (mu ? '★' : FOODSET[p] ? '' : '✏️') + esc(p) + "<b data-unpick='" + esc(p) + "'>×</b></span>"; }).join('') : "<span style='background:none;color:var(--sub);padding:4px 0'>えらばないと、全部のレシピから決めるよ</span>") + '</div></div>';
  h += "<div class='card'><div class='ct'><span class='no'>2</span>しぼりこみ（なくてもOK）</div>";
  h += "<div class='fll'>しゅるい</div><div class='fl'>" + [['all', 'ぜんぶ'], ['主菜', '🍖 主菜'], ['丼・麺', '🍚 丼・麺'], ['副菜', '🥗 副菜'], ['汁物', '🥣 汁物'], ['デザート', '🍮 デザート']].map(function (x) { return "<button data-fc='" + x[0] + "' class='" + (st.flt.cat === x[0] ? 'on' : '') + "'>" + x[1] + '</button>'; }).join('') + '</div>';
  h += "<div class='fll'>じかん</div><div class='fl'>" + [[0, 'ぜんぶ'], [10, '⚡ 10分以内'], [20, '20分以内'], [30, '30分以内']].map(function (x) { return "<button data-fm='" + x[0] + "' class='" + (st.flt.min === x[0] ? 'on' : '') + "'>" + x[1] + '</button>'; }).join('') + '</div>';
  h += "<div class='fll'>ジャンル</div><div class='fl'>" + [['all', 'ぜんぶ'], ['和', '和食'], ['洋', '洋食'], ['中', '中華'], ['韓', '韓国'], ['エスニック', 'エスニック']].map(function (x) { return "<button data-fg='" + x[0] + "' class='" + (st.flt.genre === x[0] ? 'on' : '') + "'>" + x[1] + '</button>'; }).join('') + '</div></div>';
  var c = candidates();
  h += "<div class='cnt'>候補のレシピ <b>" + c.length + '</b> 品</div>';
  h += "<button class='big' data-act='spin'" + (c.length ? '' : ' disabled style="opacity:.5"') + '>🎰 ルーレットを回す<small>' + (c.length ? 'どれになるかはお楽しみ' : st.must.length ? '★の食材を全部使うレシピがないよ。★を減らしてね' : '条件に合うレシピがないよ。しぼりこみをゆるめてね') + '</small></button>';
  h += "<button class='sub2' data-act='week'>🗓 1週間ぶんの献立をまとめて決める</button>";
  return h;
}

// ---- ルーレット ----
var wheel = null;
function openSpin() {
  var c = candidates(); if (!c.length) return;
  // 回る盤に並べるのは最大8品（よく合うものを多めに、残りはランダム）
  var top = c.slice(0, 12); for (var i = top.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = top[i]; top[i] = top[j]; top[j] = t; }
  var items = top.slice(0, Math.min(8, top.length));
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'spinOv';
  ov.innerHTML = "<div class='sheet'><h2>🎰 ルーレット！</h2><div class='wheelbox'><canvas id='wh' width='720' height='720'></canvas><div class='pin'></div><div class='hub'>🍳</div></div><button class='big' id='spinGo'>スタート！</button><button class='sub2' id='spinNo'>とじる</button></div>";
  document.body.appendChild(ov);
  wheel = { items: items, ang: 0 };
  drawWheel();
  $('spinNo').onclick = function () { ov.remove(); };
  ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
  $('spinGo').onclick = function () { spin(); };
}
var WC = ['#FFB6A3', '#FFE08A', '#A8E0B5', '#B8DFF7', '#FFC4D6', '#FFD3A8', '#D4C8F5', '#C9EBA0'];
function drawWheel() {
  var cv = $('wh'); if (!cv) return; var g = cv.getContext('2d'), n = wheel.items.length, R = 350, cx = 360, cy = 360, seg = Math.PI * 2 / n;
  g.clearRect(0, 0, 720, 720);
  g.save(); g.translate(cx, cy); g.rotate(wheel.ang);
  for (var i = 0; i < n; i++) {
    g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -Math.PI / 2 + i * seg, -Math.PI / 2 + (i + 1) * seg); g.closePath();
    g.fillStyle = WC[i % WC.length]; g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff'; g.stroke();
    g.save(); g.rotate(-Math.PI / 2 + (i + .5) * seg);
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#4A3428';
    g.font = '52px "Noto Color Emoji",sans-serif'; g.fillText(wheel.items[i].emoji, R - 18, 0);
    var nm = wheel.items[i].name; if (nm.length > 9) nm = nm.slice(0, 8) + '…';
    g.font = '900 30px "Zen Maru Gothic","Hiragino Maru Gothic ProN",sans-serif'; g.fillText(nm, R - 86, 2);
    g.restore();
  }
  g.restore();
  g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = '#4A3428'; g.stroke();
}
function spin() {
  var btn = $('spinGo'); if (!btn || btn.disabled) return; btn.disabled = true; btn.textContent = 'まわってる…';
  var n = wheel.items.length, seg = Math.PI * 2 / n, win = Math.floor(Math.random() * n);
  // 当たりの真ん中が上（針）にくる角度まで、5〜6回転してから止める
  var target = -(win + .5) * seg + (Math.random() - .5) * seg * .6;
  var start = wheel.ang, total = Math.PI * 2 * (5 + Math.floor(Math.random() * 2)) + (target - start % (Math.PI * 2));
  var t0 = performance.now(), dur = 4200, last = -1;
  function f(now) {
    var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
    wheel.ang = start + total * e; drawWheel();
    var cur = Math.floor((((-wheel.ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)) / seg);
    if (cur !== last) { last = cur; tick(); }
    if (p < 1) requestAnimationFrame(f); else setTimeout(function () { var ov = $('spinOv'); if (ov) ov.remove(); confetti(); buzz(); bump('spins'); openRecipe(wheel.items[win].id, true); }, 350);
  }
  requestAnimationFrame(f);
}
var actx = null;
function tick() { try { var A = window.AudioContext || window.webkitAudioContext; if (!A) return; if (!actx) actx = new A(); var o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 1200; g.gain.value = .04; o.connect(g); g.connect(actx.destination); o.start(); g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + .05); o.stop(actx.currentTime + .06); } catch (e) {} }

// ---- 分量を人数に合わせる（2人分が基準） ----
function scaleQ(q, n) {
  if (n === 2) return q;
  return q.replace(/(\d+)\/(\d+)|\d+(\.\d+)?/, function (m, a, b) {
    var v = b ? (+a / +b) : parseFloat(m); v = v * n / 2;
    var w = Math.round(v * 4) / 4, s = Math.floor(w), fr = w - s, ft = fr === .25 ? '1/4' : fr === .5 ? '1/2' : fr === .75 ? '3/4' : '';
    if (/g|ml|cm/.test(q) && v >= 10) return String(Math.round(v / 5) * 5);
    return s ? (ft ? s + 'と' + ft : String(s)) : (ft || String(Math.round(v * 10) / 10));
  });
}

// ---- レシピ ----
// レシピのイメージ: お皿に料理と主な食材をのせたイラスト
var PLATE = { '和': ['#F6E7D2', '#C9A27E'], '洋': ['#FCE3DC', '#E59A86'], '中': ['#FBE4C9', '#E0A05E'], '韓': ['#FADADA', '#D9706B'], 'エスニック': ['#E5F2D9', '#8DB870'] };
function plateHtml(r) {
  if (window.dishSVG) return "<div class='dill'>" + window.dishSVG(r) + '</div>';
  var c = PLATE[r.genre] || PLATE['和'], seen = {}, side = [];
  r.ing.forEach(function (i) { var f = FOODSET[i.n]; if (f && !seen[f[1]] && f[1] !== r.emoji && side.length < 5) { seen[f[1]] = 1; side.push(f[1]); } });
  var pos = [[50, 9], [88, 36], [76, 80], [24, 80], [12, 36]];
  return "<div class='plate' style='--p1:" + c[0] + ';--p2:' + c[1] + "'><div class='dish'><i>" + r.emoji + '</i></div>' +
    side.map(function (e, k) { return "<span style='left:" + pos[k][0] + '%;top:' + pos[k][1] + "%'>" + e + '</span>'; }).join('') + '</div>';
}
// 作り方の文に、調味料・液体の量を書きこむ（例: 醤油 → 醤油（大さじ2））
var LIQ = { '牛乳': 1, '生クリーム': 1, '豆乳': 1, 'ヨーグルト': 1 };
var ALIAS_Q = { '鶏ガラスープの素': ['鶏ガラスープの素', '鶏ガラ'], 'オイスターソース': ['オイスターソース', 'オイスター'], 'マヨネーズ': ['マヨネーズ', 'マヨ'], '顆粒だし': ['顆粒だし', 'だし'], '白だし': ['白だし'], 'コンソメ': ['コンソメ'], '焼肉のタレ': ['焼肉のタレ'], 'レモン汁': ['レモン汁'], 'ケチャップ': ['ケチャップ'] };
function annot(text, r) {
  var items = r.ing.filter(function (i) { return (i.pantry || LIQ[i.n]) && i.q && !/^(少々|適量|少し|たっぷり)$/.test(i.q); });
  var keys = [];
  items.forEach(function (i) { (ALIAS_Q[i.n] || [i.n]).forEach(function (a) { keys.push([a, i]); }); });
  keys.sort(function (a, b) { return b[0].length - a[0].length; });
  var marks = [], used = {}, t = text;
  keys.forEach(function (k) {
    if (used[k[1].n]) return;
    var idx = t.indexOf(k[0]);
    if (idx < 0) return;
    // 「塩こしょう」の中の「塩」など、もっと長い名前の一部ならとばす
    if (k[0] === '塩' && /^塩(こしょう|もみ|ゆで|昆布|少々|をふ)/.test(t.slice(idx))) return;
    if (k[0] === '酢' && /黒酢|甘酢|酢の物|酢水/.test(t.slice(Math.max(0, idx - 1), idx + 2))) return;
    if (k[0] === '水' && /(水気|水に|水で|冷水|水溶き|水煮|水分|水切り|流水|塩水|酢水)/.test(t.slice(Math.max(0, idx - 1), idx + 3))) return;
    if (k[0] === 'だし' && /白だし/.test(t.slice(Math.max(0, idx - 1), idx + 2))) return;
    if (k[0] === '油' && /(ごま油|オリーブオイル|油揚げ|油抜き|ラー油|油を(きる|ふ))/.test(t.slice(Math.max(0, idx - 3), idx + 3))) return;
    used[k[1].n] = 1;
    var tag = '\u0001' + marks.length + '\u0002';
    marks.push(k[0] + "<small class='qq'>（" + esc(scaleQ(k[1].q, st.srv)) + '）</small>');
    t = t.slice(0, idx) + tag + t.slice(idx + k[0].length);
  });
  var gi = t.indexOf('調味料');
  if (gi >= 0 && !/調味料（|合わせた調味料|合わせ調味料/.test(t)) {
    var rest = items.filter(function (i) { return !used[i.n] && !/^(水|油|ごま油|オリーブオイル)$/.test(i.n); });
    if (rest.length) { var tg = '\u0001' + marks.length + '\u0002'; marks.push('調味料' + "<small class='qq'>（" + rest.map(function (i) { return esc(i.n) + ' ' + esc(scaleQ(i.q, st.srv)); }).join('・') + '）</small>'); t = t.slice(0, gi) + tg + t.slice(gi + 3); }
  }
  t = esc(t);
  return t.replace(/\u0001(\d+)\u0002/g, function (m, n) { return marks[+n]; });
}
// ---- 投稿の特典（ランク・バッジ・連続投稿・ごはん日記） ----
var RANKS = [[0, '見習いさん', '🥚'], [1, 'はじめの一皿', '🍳'], [3, 'ごはん係', '🥄'], [7, '台所の星', '⭐'], [15, 'おうちシェフ', '👩‍🍳'], [30, 'くるくるマスター', '👑'], [60, '伝説のごはん屋', '🏆']];
function myPosts() { return get('kd-posts', []); }
function streakOf(ps) { var days = {}; ps.forEach(function (p) { days[dkey(p.t)] = 1; }); var best = 0, cur = 0, now = 0; var keys = Object.keys(days).map(function (k) { var a = k.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]).getTime(); }).sort(function (a, b) { return a - b; });
  keys.forEach(function (d, i) { cur = i && d - keys[i - 1] < 864e5 * 1.5 ? cur + 1 : 1; if (cur > best) best = cur; });
  var today = new Date(); today.setHours(0, 0, 0, 0); var last = keys[keys.length - 1]; now = last != null && today.getTime() - last < 864e5 * 1.5 ? cur : 0; return { best: best, now: now }; }
// アプリの中の行動の回数（いいねした数・コメントした数・ルーレット回数…）
function stat() { return get('kd-stat', {}); }
function bump(k, n) { var x = stat(); x[k] = (x[k] || 0) + (n == null ? 1 : n); put('kd-stat', x); setTimeout(checkBadges, 50); syncSoon(); }
function flag(k) { var x = stat(); if (!x[k]) { x[k] = 1; put('kd-stat', x); setTimeout(checkBadges, 50); } }
// バッジ: [キー, 名前, 絵, 今の数, 目標, 取り方, グループ]
function badgesOf(ps) {
  var g = {}, cats = {}, ids = {}, morning = 0, night = 0, wkend = 0;
  ps.forEach(function (p) { var r = byId[p.id], d = new Date(p.t), h = d.getHours(); if (h >= 5 && h < 9) morning++; if (h >= 22 || h < 3) night++; if (d.getDay() === 0 || d.getDay() === 6) wkend++; if (!r) return; g[r.genre] = (g[r.genre] || 0) + 1; cats[r.cat] = (cats[r.cat] || 0) + 1; ids[p.id] = 1; });
  var s2 = streakOf(ps), n = ps.length, x = stat(), lk = get('kd-likes-recv', 0), cr = get('kd-cmt-recv', 0), nid = Object.keys(ids).length;
  var gen = ['和', '洋', '中', '韓', 'エスニック'].filter(function (k) { return g[k]; }).length, cat = ['主菜', '丼・麺', '副菜', '汁物', 'デザート'].filter(function (k) { return cats[k]; }).length;
  var L = [
    ['p1', 'はじめての投稿', '📷', n, 1, '1回投稿する', '投稿'], ['p10', '10皿達成', '🍽', n, 10, '10回投稿', '投稿'], ['p30', '30皿達成', '🏅', n, 30, '30回投稿', '投稿'], ['p60', '60皿達成', '🎖', n, 60, '60回投稿', '投稿'], ['p100', '100皿の伝説', '💯', n, 100, '100回投稿', '投稿'],
    ['s3', '3日連続', '🔥', s2.best, 3, '3日続けて投稿', '連続'], ['s7', '1週間連続', '☄️', s2.best, 7, '7日続けて投稿', '連続'], ['s14', '2週間連続', '🌋', s2.best, 14, '14日続けて投稿', '連続'], ['s30', '30日連続', '👑', s2.best, 30, '30日続けて投稿', '連続'],
    ['l10', 'いいね10こ', '❤️', lk, 10, 'いいねを合計10こもらう', 'いいね'], ['l50', '人気者', '💖', lk, 50, 'いいねを合計50こもらう', 'いいね'], ['l100', 'ごはんアイドル', '💘', lk, 100, 'いいねを合計100こもらう', 'いいね'], ['l300', 'ごはんスター', '🌟', lk, 300, 'いいねを合計300こもらう', 'いいね'], ['l1000', 'レジェンド', '🏆', lk, 1000, 'いいねを合計1000こもらう', 'いいね'],
    ['c5', 'はじめてのコメント', '💬', cr, 1, 'コメントを1件もらう', 'コメント'], ['c10', '話題のごはん', '🗨️', cr, 10, 'コメントを合計10件もらう', 'コメント'], ['c50', 'みんなの注目', '🗣️', cr, 50, 'コメントを合計50件もらう', 'コメント'], ['c100', 'うわさの台所', '📣', cr, 100, 'コメントを合計100件もらう', 'コメント'],
    ['g1', 'はじめてのいいね', '👍', x.likesGiven || 0, 1, 'だれかの写真にいいね', '応援'], ['g30', '応援団', '🙌', x.likesGiven || 0, 30, 'いいねを30回する', '応援'], ['g100', '応援団長', '🎌', x.likesGiven || 0, 100, 'いいねを100回する', '応援'],
    ['m1', 'はじめての感想', '✉️', x.cmtGiven || 0, 1, 'コメントを1回書く', '応援'], ['m20', 'コメント上手', '💌', x.cmtGiven || 0, 20, 'コメントを20回書く', '応援'], ['m50', 'やさしい常連さん', '🫶', x.cmtGiven || 0, 50, 'コメントを50回書く', '応援'],
    ['v10', 'レパートリー10', '🎨', nid, 10, '10種類のレシピを投稿', '料理'], ['v30', 'レパートリー30', '🌈', nid, 30, '30種類のレシピを投稿', '料理'], ['v100', 'レシピ博士', '📚', nid, 100, '100種類のレシピを投稿', '料理'],
    ['wa', '和食名人', '🍙', g['和'] || 0, 5, '和食を5回投稿', '料理'], ['yo', '洋食名人', '🍝', g['洋'] || 0, 5, '洋食を5回投稿', '料理'], ['chu', '中華名人', '🥟', g['中'] || 0, 5, '中華を5回投稿', '料理'], ['kan', '韓国名人', '🌶️', g['韓'] || 0, 3, '韓国料理を3回投稿', '料理'], ['eth', 'エスニック名人', '🌮', g['エスニック'] || 0, 3, 'エスニックを3回投稿', '料理'],
    ['sw', 'デザート職人', '🍰', cats['デザート'] || 0, 3, 'デザートを3回投稿', '料理'], ['soup', '汁物マスター', '🥣', cats['汁物'] || 0, 5, '汁物を5回投稿', '料理'], ['side', '副菜の達人', '🥗', cats['副菜'] || 0, 5, '副菜を5回投稿', '料理'],
    ['allg', '世界のごはん', '🌏', gen, 5, '和・洋・中・韓・エスニックを全部投稿', '料理'], ['allc', '全カテゴリ制覇', '🏁', cat, 5, '主菜・丼麺・副菜・汁物・デザートを全部投稿', '料理'],
    ['am', '朝ごはん派', '🌅', morning, 3, '朝5〜9時に3回投稿', '時間'], ['pm', '夜食の達人', '🌙', night, 3, '夜22時すぎに3回投稿', '時間'], ['we', '週末シェフ', '🎉', wkend, 5, '土日に5回投稿', '時間'],
    ['r10', 'ルーレット好き', '🎰', x.spins || 0, 10, 'ルーレットを10回まわす', 'アプリ'], ['r100', 'ルーレット中毒', '🎡', x.spins || 0, 100, 'ルーレットを100回まわす', 'アプリ'],
    ['ck1', '調理モード完走', '👩‍🍳', x.cookDone || 0, 1, '調理モードで最後まで作る', 'アプリ'], ['ck10', '台所の住人', '🧑‍🍳', x.cookDone || 0, 10, '調理モードで10回完走', 'アプリ'],
    ['tm', 'タイマー上手', '⏱', x.timers || 0, 10, 'タイマーを10回使う', 'アプリ'], ['sh', '買い物上手', '🛒', x.shopDone || 0, 20, '買い物リストを20個チェック', 'アプリ'], ['wk', '献立プランナー', '🗓', x.weeks || 0, 1, '1週間の献立を作る', 'アプリ'], ['fv', 'お気に入り10', '⭐', st.fav.length, 10, 'お気に入りを10品', 'アプリ'],
    ['best', '今日のベストごはん', '👑', x.best || 0, 1, '今日のベストごはんに選ばれる', 'とくべつ'], ['face', 'レシピの顔', '🖼️', x.face || 0, 1, 'どれかのレシピの顔になる', 'とくべつ']
  ];
  return L.map(function (b) { return [b[0], b[1], b[2], b[3] >= b[4], b[5], Math.min(b[3], b[4]), b[4], b[6]]; });
}
// 新しく取ったバッジがあればお知らせ（投稿以外の行動でも）
function checkBadges(quiet) {
  var got = get('kd-badges', null), now = badgesOf(myPosts()).filter(function (b) { return b[3]; }), keys = now.map(function (b) { return b[0]; });
  if (got === null) { put('kd-badges', keys); return []; }
  var nw = now.filter(function (b) { return got.indexOf(b[0]) < 0; }); put('kd-badges', keys);
  if (!quiet) nw.forEach(function (b, i) { setTimeout(function () { toast('🎖 バッジゲット！ ' + b[2] + ' ' + b[1]); confetti(); }, i * 1600); });
  return nw;
}
var badgeAll = false;
function badgeHtml(bd) {
  var got = bd.filter(function (b) { return b[3]; }).length, groups = [];
  bd.forEach(function (b) { if (groups.indexOf(b[7]) < 0) groups.push(b[7]); });
  var h = "<div class='bdh'><b>🎖 バッジ</b><span>" + got + ' / ' + bd.length + ' ゲット</span></div>';
  var show = badgeAll ? bd : bd.filter(function (b) { return b[3]; }).concat(bd.filter(function (b) { return !b[3]; }).sort(function (a, c) { return c[5] / c[6] - a[5] / a[6]; }).slice(0, 6));
  if (!badgeAll) h += "<div class='bdg'>" + show.map(badgeCell).join('') + "</div><button class='sub2' data-act='badgeAll'>ぜんぶのバッジを見る（" + bd.length + "種類）</button>";
  else groups.forEach(function (gname) { h += "<div class='bdgt'>" + gname + "</div><div class='bdg'>" + bd.filter(function (b) { return b[7] === gname; }).map(badgeCell).join('') + '</div>'; });
  if (badgeAll) h += "<button class='sub2' data-act='badgeAll'>とじる</button>";
  return h;
}
function badgeCell(b) { return "<span class='" + (b[3] ? 'on' : '') + "'><i>" + (b[3] ? b[2] : '🔒') + '</i>' + esc(b[1]) + '<small>' + (b[3] ? 'ゲット！' : esc(b[4])) + '</small>' + (b[3] ? '' : "<em><u style='width:" + Math.round(b[5] / b[6] * 100) + "%'></u></em><small class='bn'>" + b[5] + ' / ' + b[6] + '</small>') + '</span>'; }
function rankOf(n) { var r = RANKS[0], nx = null; RANKS.forEach(function (x, i) { if (n >= x[0]) { r = x; nx = RANKS[i + 1] || null; } }); return { r: r, next: nx }; }
function rankHtml(ps) { var n = ps.length, k = rankOf(n), s2 = streakOf(ps), pct = k.next ? Math.max(5, Math.round((n - k.r[0]) / (k.next[0] - k.r[0]) * 100)) : 100;
  return "<div class='rank'><div class='rk1'><span class='rki'>" + k.r[2] + "</span><div><small>ごはんランク</small><b>" + k.r[1] + "</b></div><div class='rks'>🔥<b>" + s2.now + '</b><small>日連続</small></div></div><div class=\'rkbar\'><i style=\'width:' + pct + "%'></i></div><small class='rkn'>" + (k.next ? 'あと' + (k.next[0] - n) + '回投稿で「' + k.next[2] + ' ' + k.next[1] + '」' : '最高ランク達成！') + '</small></div>'; }
// ---- ストアのレビュー依頼（Apple 純正の星をタップする画面） ----
// 気分のいい時だけ: 投稿のごほうび画面を閉じた時か、「作った」を記録した時。
// 3回以上作った（または2回以上投稿した）人だけ、60日に1回まで。OS 側でも年3回まで。TestFlight 版では Apple の仕様で出ない
function askReview() {
  var RV = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.InAppReview; if (!RV) return;
  var made = (get(K.made, []) || []).length, posts = myPosts().length; if (made < 3 && posts < 2) return;
  var last = +get('kd-review-at', 0) || 0; if (Date.now() - last < 60 * 864e5) return;
  setTimeout(function () { if (document.getElementById('rwOv')) return; put('kd-review-at', Date.now()); RV.requestReview().catch(function () {}); }, 1200);
}
// 投稿のあとの「ごほうび」画面
function rewardAfterPost(r, before, thumb) {
  var ps = myPosts(), n = ps.length, kb = rankOf(before.length), ka = rankOf(n), nb = checkBadges(true);
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'rwOv';
  var h = "<div class='sheet rw'><h2>🎉 投稿ありがとう！</h2>" + (thumb ? "<img class='rwimg' alt='' src='" + thumb + "'>" : '');
  if (ka.r[0] !== kb.r[0]) h += "<div class='rwup'><small>ランクアップ！</small><b>" + ka.r[2] + ' ' + ka.r[1] + '</b></div>';
  if (nb.length) h += "<div class='rwb'><small>新しいバッジをゲット</small>" + nb.map(function (b) { return "<span><i>" + b[2] + '</i>' + b[1] + '</span>'; }).join('') + '</div>';
  h += rankHtml(ps) + "<p class='note' style='text-align:center'>👑 いいねがいちばん多い写真は、「" + esc(r.name) + "」のレシピの顔になって、みんなのレシピ画面に表示されるよ</p><button class='big' data-rw='feed'>みんなのごはんを見る</button><button class='sub2' data-rw='me'>📔 ごはん日記を見る</button></div>";
  ov.innerHTML = h; document.body.appendChild(ov); confetti();
  ov.addEventListener('click', function (e) { var b = e.target.closest('[data-rw]'); if (e.target === ov || b) { ov.remove(); if (b) { st.tab = b.getAttribute('data-rw'); render(); } askReview(); } });
}
// ---- 作り方の1ステップ（イラスト・火加減・量・タイマー・ヒント） ----
function stepHtml(s, k, r, big) {
  var sec = window.stepTime ? window.stepTime(s.t) : 0;
  return "<li class='" + (big ? 'big1' : '') + "'><div class='sill'>" + (window.stepSVG ? window.stepSVG(s.t, r, s.heat, k) : '') + "</div><div class='stx'>" + (s.heat ? "<span class='heat'>🔥 " + esc(s.heat) + '</span>' : '') + (s.noq ? esc(s.t) : annot(s.t, r)) +
    (sec ? "<button class='tmb' data-tm='" + sec + "' data-tl='" + esc((k + 1) + '. ' + r.name) + "'>⏱ " + fmtT(sec) + ' タイマー</button>' : '') +
    (s.hint.length ? "<div class='hint2'>" + s.hint.map(function (x) { return '💡 ' + esc(x); }).join('<br>') + '</div>' : '') + '</div></li>';
}
function fmtT(sec) { var m = Math.floor(sec / 60), s2 = sec % 60; return m ? m + '分' + (s2 ? s2 + '秒' : '') : s2 + '秒'; }
// ---- キッチンタイマー（複数OK・画面上に出る） ----
var timers = [];
function startTimer(sec, label) { bump('timers'); timers.push({ end: Date.now() + sec * 1000, label: label, id: Math.random() }); toast('⏱ ' + fmtT(sec) + ' のタイマーをスタート'); buzz(); tickTimers(); }
function beep() { try { var A = window.AudioContext || window.webkitAudioContext; if (!A) return; if (!actx) actx = new A(); [0, .35, .7].forEach(function (d) { var o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; g.gain.setValueAtTime(.25, actx.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + d + .3); o.connect(g); g.connect(actx.destination); o.start(actx.currentTime + d); o.stop(actx.currentTime + d + .32); }); } catch (e) {} }
var tmLoop = null;
function tickTimers() {
  var bar = $('tmBar'); if (!bar) { bar = document.createElement('div'); bar.id = 'tmBar'; document.body.appendChild(bar); }
  var now = Date.now(), done = timers.filter(function (x) { return x.end <= now; });
  done.forEach(function (x) { beep(); try { var H = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Haptics; if (H) H.vibrate(); } catch (e) {} toast('⏰ 時間だよ！（' + x.label + '）'); });
  timers = timers.filter(function (x) { return x.end > now; });
  bar.innerHTML = timers.map(function (x) { var r = Math.ceil((x.end - now) / 1000); return "<button data-tmx='" + x.id + "'>⏱ " + Math.floor(r / 60) + ':' + ('0' + r % 60).slice(-2) + ' <small>' + esc(x.label) + '</small> ✕</button>'; }).join('');
  bar.hidden = !timers.length;
  clearTimeout(tmLoop); if (timers.length) tmLoop = setTimeout(tickTimers, 500);
}
// ---- 調理モード（1ステップずつ大きく・画面を消さない） ----
var wakeLock = null;
function keepOn(on) { try { if (on && navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wakeLock = w; }).catch(function () {}); else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {} }
function openCook(r) {
  var dt = window.recipeDetail(r), idx = 0, ov = document.createElement('div'); ov.className = 'ov cook'; ov.id = 'cookOv';
  function html() {
    var n = dt.steps.length, h = "<div class='sheet ck'><div class='ckh'><button data-c='x'>✕ とじる</button><b>" + esc(r.name) + '</b><span>' + st.srv + '人分</span></div>';
    h += "<div class='ckp'>" + dt.steps.map(function (_, k) { return "<i class='" + (k < idx ? 'd' : k === idx ? 'on' : '') + "'></i>"; }).join('') + "<i class='" + (idx >= n ? 'on' : '') + "'></i></div>";
    if (idx < n) { h += "<div class='ckn'>ステップ " + (idx + 1) + ' / ' + n + "</div><ol class='steps ill'>" + stepHtml(dt.steps[idx], idx, r, true) + '</ol>';
      if (idx === 0) h += "<details class='ckm'><summary>🧺 材料を見る</summary><ul>" + r.ing.map(function (i) { return '<li>' + esc(i.n) + '<span>' + esc(scaleQ(i.q, st.srv)) + '</span></li>'; }).join('') + '</ul></details>';
    } else h += "<div class='ckdone'><div class='dill'>" + (window.dishSVG ? window.dishSVG(r) : '') + "</div><h2>🎉 完成！おつかれさま</h2><p class='note'>写真を投稿すると、バッジやランクアップがもらえるよ</p><button class='big' data-c='post'>📷 写真を投稿する</button><button class='sub2' data-c='made'>🍽 作った（投稿しない）</button></div>";
    h += "<div class='ckb'><button data-c='prev'" + (idx ? '' : ' disabled') + ">← 前へ</button>" + (idx < n ? "<button class='on' data-c='next'>" + (idx === n - 1 ? 'できた！' : '次へ →') + '</button>' : '') + '</div></div>';
    return h;
  }
  ov.innerHTML = html(); document.body.appendChild(ov); keepOn(true);
  ov.addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]'); if (!b) return; var a = b.getAttribute('data-c');
    if (a === 'x') { ov.remove(); keepOn(false); return; }
    if (a === 'next') { idx++; buzz(); if (idx >= dt.steps.length) { confetti(); bump('cookDone'); } }
    if (a === 'prev' && idx > 0) idx--;
    if (a === 'post') { ov.remove(); keepOn(false); openPost(r); return; }
    if (a === 'made') { markMade(r); ov.remove(); keepOn(false); toast('作った記録に入れたよ 🍽'); askReview(); return; }
    ov.innerHTML = html(); ov.scrollTop = 0;
  });
}
function openRecipe(id, fromSpin) {
  var r = byId[id]; if (!r) return;
  var old = $('recOv'); if (old) old.remove();
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'recOv';
  var photos = [];
  function html() {
    var need = r.ing.filter(function (i) { return i.food && !has(i.n); });
    var fav = st.fav.indexOf(r.id) >= 0, cnt = st.made.filter(function (m) { return m.id === r.id; }).length;
    var h = "<div class='sheet'>";
    if (fromSpin) h += "<div style='text-align:center;font-weight:900;color:var(--acc)'>🎉 今日の献立はこれに決定！</div>";
    h += "<div class='rhero'>" + (photos.length ? "<div class='rph'><img alt='' src='" + esc(photos[0].photo) + "'><span>👑 このレシピの顔：" + esc(photos[0].name || 'ななしさん') + (photos[0].likes ? '（❤️' + photos[0].likes + '）' : '') + "</span></div>" + (photos.length > 1 ? "<div class='rths'>" + photos.slice(1, 6).map(function (p) { return "<img alt='' src='" + esc(p.photo) + "'>"; }).join('') + '</div>' : '') : plateHtml(r)) + '<h2>' + esc(r.name) + "</h2><div class='tags'><span>" + ({ '和': '和食', '洋': '洋食', '中': '中華', '韓': '韓国', 'エスニック': 'エスニック' }[r.genre]) + '</span><span>' + r.cat + '</span><span>⏱ ' + r.min + '分</span><span>約' + r.kcal + 'kcal</span>' + (cnt ? '<span>🍽 ' + cnt + '回作った</span>' : '') + '</div></div>';
    h += "<div class='card'><div class='ct'>🧺 材料<span class='rt'></span></div><div class='srv'><button data-srv='-1'>−</button><b>" + st.srv + "人分</b><button data-srv='1'>＋</button></div>";
    h += "<div class='legend'><span>✓ えらんだ食材</span><span>● 買い足しが必要</span><span>・ 調味料（家にある前提）</span></div><ul class='ing'>";
    r.ing.forEach(function (i) {
      var cls = i.pantry ? 'pan' : (has(i.n) ? 'have' : 'need');
      h += "<li class='" + cls + "'><span class='mk'>" + (cls === 'have' ? '✓' : cls === 'need' ? '●' : '・') + '</span>' + esc(i.n) + (cls === 'need' ? " <span class='tag'>買い足し</span>" : '') + "<span class='q'>" + esc(scaleQ(i.q, st.srv)) + '</span></li>';
    });
    h += '</ul>' + (need.length ? "<button class='sub2' data-r='shop'>🛒 買い足し " + need.length + ' 品を買い物リストへ</button>' : "<p class='note' style='text-align:center;margin:10px 0 0'>🎉 足りない食材なし！今すぐ作れるよ</p>") + '</div>';
    var dt = window.recipeDetail ? window.recipeDetail(r) : { prep: [], steps: r.steps.map(function (t) { return { t: t, hint: [] }; }), tips: [], keep: '' };
    if (dt.prep.length) h += "<div class='card'><div class='ct'>🔪 下ごしらえ</div><ul class='prep'>" + dt.prep.map(function (p) { return '<li><b>' + esc(p.n) + '</b>' + esc(p.t) + '</li>'; }).join('') + '</ul></div>';
    h += "<div class='card'><div class='ct'>👩‍🍳 作り方<span class='rt'>" + dt.steps.length + "ステップ</span></div><button class='cookgo' data-r='cook'>👩‍🍳 調理モードで作る<small>1ステップずつ大きく表示・画面が消えない</small></button><ol class='steps ill'>" + dt.steps.map(function (s, k) { return stepHtml(s, k, r); }).join('') + '</ol></div>';
    if (dt.tips.length) h += "<div class='card'><div class='ct'>✨ おいしく作るコツ</div><ul class='tips'>" + dt.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' + (dt.keep ? "<p class='keep'>🧊 保存のめやす：" + esc(dt.keep) + '</p>' : '') + '</div>';
    h += "<button class='big' data-r='made'>📷 作った！写真を投稿する<small>みんなのごはんに載るよ</small></button>";
    h += "<div class='acts'><button class='mini" + (fav ? ' on' : '') + "' data-r='fav'>" + (fav ? '❤️ お気に入り済み' : '🤍 お気に入り') + "</button><button class='mini' data-r='done'>🍽 作った（投稿しない）</button><button class='mini' data-r='again'>🎰 もう一回まわす</button><button class='mini' data-r='posts'>👀 みんなの" + esc(r.name.length > 6 ? 'ごはん' : r.name) + '</button></div>';
    h += "<button class='sub2' data-r='close' style='border-color:var(--line);color:var(--sub)'>とじる</button></div>";
    return h;
  }
  ov.innerHTML = html(); document.body.appendChild(ov);
  // みんなが投稿した写真があれば、イラストの代わりに写真を出す
  try { window.FEED.list({ sort: 'new', recipe: r.id }).then(function (ps) { if (ps && ps.length && document.body.contains(ov)) { photos = ps.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0) || b.t - a.t; }); try { if (window.FEED.me && photos[0].user_id === window.FEED.me()) flag('face'); } catch (er) {} var y = ov.scrollTop; ov.innerHTML = html(); ov.scrollTop = y; } }).catch(function () {}); } catch (e) {}
  ov.addEventListener('click', function (e) {
    if (e.target === ov) { ov.remove(); return; }
    var b = e.target.closest('[data-srv],[data-r]'); if (!b) return;
    var s = b.getAttribute('data-srv');
    if (s) { st.srv = Math.max(1, Math.min(6, st.srv + +s)); saveAll(); ov.innerHTML = html(); return; }
    var a = b.getAttribute('data-r');
    if (a === 'close') ov.remove();
    else if (a === 'fav') { var i = st.fav.indexOf(r.id); if (i >= 0) st.fav.splice(i, 1); else st.fav.unshift(r.id); saveAll(); ov.innerHTML = html(); toast(i >= 0 ? 'お気に入りから外したよ' : 'お気に入りに入れたよ ❤️'); }
    else if (a === 'shop') { addShop(r); ov.innerHTML = html(); }
    else if (a === 'done') { markMade(r); ov.innerHTML = html(); toast('作った記録に入れたよ 🍽'); askReview(); }
    else if (a === 'made') { ov.remove(); openPost(r); }
    else if (a === 'cook') { openCook(r); }
    else if (a === 'again') { ov.remove(); openSpin(); }
    else if (a === 'posts') { ov.remove(); feedRecipe = r.id; st.tab = 'feed'; render(); }
  });
}
function markMade(r) { st.made.unshift({ id: r.id, t: Date.now() }); st.made = st.made.slice(0, 500); saveAll(); }
function addShop(r) {
  var n = 0; r.ing.forEach(function (i) { if (!i.food || has(i.n)) return; var ex = st.shop.filter(function (x) { return x.n === i.n && !x.done; })[0]; if (ex) { if (ex.from.indexOf(r.name) < 0) ex.from.push(r.name); } else { st.shop.unshift({ n: i.n, from: [r.name], done: false }); n++; } });
  saveAll(); toast(n ? n + '品を買い物リストに入れたよ 🛒' : 'もう買い物リストに入ってるよ');
}
function shopBadge() { var n = st.shop.filter(function (x) { return !x.done; }).length, b = $('shopBd'); if (!b) return; b.hidden = !n; b.textContent = n; }

// ---- 1週間の献立 ----
function makeWeek() { bump('weeks');
  var pool = RECIPES.filter(function (r) { return (r.cat === '主菜' || r.cat === '丼・麺') && passFilter(Object.assign({}, r, { cat: st.flt.cat === 'all' ? r.cat : st.flt.cat })); });
  var good = pool.filter(function (r) { return score(r) > 0; }), rest = pool.filter(function (r) { return score(r) === 0; });
  function sh(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // 同じジャンルが続かないように並べる
  var l = sh(good).concat(sh(rest)), out = [];
  while (out.length < 7 && l.length) { var k = 0; for (var i = 0; i < l.length; i++) { if (!out.length || l[i].genre !== out[out.length - 1].genre) { k = i; break; } } out.push(l.splice(k, 1)[0]); }
  st.week = { t: Date.now(), ids: out.map(function (r) { return r.id; }) }; saveAll();
}
function openWeek() {
  if (!st.week || Date.now() - st.week.t > 7 * 864e5) makeWeek();
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'weekOv';
  function html() {
    var days = '日月火水木金土', d0 = new Date(st.week.t), h = "<div class='sheet'><h2>🗓 1週間の献立</h2><p class='note' style='text-align:center'>🔄 で1日ずつ回し直せるよ</p><div class='card'>";
    st.week.ids.forEach(function (id, i) { var r = byId[id], d = new Date(d0.getTime() + i * 864e5); h += "<div class='wk'><div class='d'>" + days.charAt(d.getDay()) + "</div><button class='rl' data-wo='" + id + "'><i>" + r.emoji + '</i><span><b>' + esc(r.name) + '</b><small>' + r.cat + '・' + r.min + '分</small></span></button><button class=\'re\' data-wr=\'' + i + "'>🔄</button></div>"; });
    h += "</div><button class='big' data-w='shop'>🛒 1週間ぶんの買い足しをリストへ</button><button class='sub2' data-w='new'>🎰 ぜんぶ回し直す</button><button class='sub2' data-w='close' style='border-color:var(--line);color:var(--sub)'>とじる</button></div>";
    return h;
  }
  ov.innerHTML = html(); document.body.appendChild(ov);
  ov.addEventListener('click', function (e) {
    if (e.target === ov) { ov.remove(); return; }
    var o = e.target.closest('[data-wo]'); if (o) { ov.remove(); openRecipe(o.getAttribute('data-wo')); return; }
    var rr = e.target.closest('[data-wr]'); if (rr) { var i = +rr.getAttribute('data-wr'), used = st.week.ids, pool = RECIPES.filter(function (r) { return (r.cat === '主菜' || r.cat === '丼・麺') && used.indexOf(r.id) < 0; }); var good = pool.filter(function (r) { return score(r) > 0; }); var l = good.length ? good : pool; st.week.ids[i] = l[Math.floor(Math.random() * l.length)].id; saveAll(); ov.innerHTML = html(); buzz(); return; }
    var w = e.target.closest('[data-w]'); if (!w) return; var a = w.getAttribute('data-w');
    if (a === 'close') ov.remove();
    else if (a === 'new') { makeWeek(); ov.innerHTML = html(); buzz(); }
    else if (a === 'shop') { var before = st.shop.length; st.week.ids.forEach(function (id) { addShopQuiet(byId[id]); }); saveAll(); toast((st.shop.length - before) + '品を買い物リストに入れたよ 🛒'); }
  });
}
function addShopQuiet(r) { r.ing.forEach(function (i) { if (!i.food || has(i.n)) return; var ex = st.shop.filter(function (x) { return x.n === i.n && !x.done; })[0]; if (ex) { if (ex.from.indexOf(r.name) < 0) ex.from.push(r.name); } else st.shop.unshift({ n: i.n, from: [r.name], done: false }); }); }

// ---- 買い物リスト ----
function shopHtml() {
  var h = header('買い物リスト', 'レシピの「買い足し」がここに入るよ'), todo = st.shop.filter(function (x) { return !x.done; }), done = st.shop.filter(function (x) { return x.done; });
  h += "<div class='card'>";
  if (!st.shop.length) h += "<div class='empty'><i>🛒</i>まだ何もないよ。<br>レシピの「買い足しを買い物リストへ」で入るよ</div>";
  else h += "<ul class='ing sl'>" + todo.concat(done).map(function (x) { var i = st.shop.indexOf(x); return "<li class='" + (x.done ? 'done' : '') + "'><input type='checkbox' data-sc='" + i + "'" + (x.done ? ' checked' : '') + '><span>' + esc(x.n) + '</span><small>' + esc((x.from || []).slice(0, 2).join('・')) + "</small><button class='x' data-sx='" + i + "'>×</button></li>"; }).join('') + '</ul>';
  h += "<div class='addrow'><input id='shopIn' placeholder='自分で追加（例: 牛乳）' maxlength='30'><button class='mini' data-act='shopAdd'>追加</button></div>";
  if (done.length) h += "<button class='sub2' data-act='shopClear' style='border-color:var(--line);color:var(--sub)'>チェックしたものを消す（" + done.length + '）</button>';
  h += '</div>';
  if (todo.length) h += "<button class='sub2' data-act='shopShare'>📤 リストを送る（LINEなど）</button>";
  return h;
}

// ---- マイページ ----
function meHtml() {
  var h = '';
  var ps = myPosts(), bd = badgesOf(ps);
  h += profileHead(ps, bd);
  h += "<div class='card'><div class='ct'>📔 ごはん日記<span class='rt'>" + ps.length + '枚</span></div>' + rankHtml(ps) +
    badgeHtml(bd) +
    (ps.length ? "<div class='diary'>" + ps.slice().reverse().slice(0, 30).map(function (p) { var r = byId[p.id]; return "<button data-open='" + p.id + "'>" + (p.th ? "<img alt='' src='" + p.th + "'>" : '<i>' + (r ? r.emoji : '🍽') + '</i>') + '<small>' + md(p.t) + '</small></button>'; }).join('') + '</div>' : "<p class='note'>作ったごはんの写真を投稿すると、ここに並んでいくよ</p>") + '</div>';
  // 今月のカレンダー
  var n = new Date(), y = n.getFullYear(), m = n.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), by = {};
  st.made.forEach(function (x) { var d = new Date(x.t); if (d.getFullYear() === y && d.getMonth() === m) (by[d.getDate()] = by[d.getDate()] || []).push(byId[x.id]); });
  var cnt = Object.keys(by).length;
  h += "<div class='card'><div class='ct'>📅 " + (m + 1) + "月の自炊カレンダー<span class='rt'>" + cnt + '日 作った</span></div><div class=\'cal\'>' + '日月火水木金土'.split('').map(function (d) { return "<div class='h'>" + d + '</div>'; }).join('');
  for (var i = 0; i < first; i++) h += '<div></div>';
  for (var d = 1; d <= days; d++) h += "<div class='" + (by[d] ? 'on' : '') + "'><em>" + (by[d] ? (by[d][0] && by[d][0].emoji || '🍽') : '') + '</em>' + d + '</div>';
  h += '</div></div>';
  h += "<div class='card'><div class='ct'>❤️ お気に入り<span class='rt'>" + st.fav.length + '品</span></div>' + (st.fav.length ? st.fav.map(function (id) { return recRow(byId[id]); }).join('') + "<button class='sub2' data-act='spinFav'>🎰 お気に入りの中からルーレット</button>" : "<p class='note'>レシピの 🤍 を押すとここに入るよ</p>") + '</div>';
  var recent = []; st.made.forEach(function (x) { if (recent.length < 10 && byId[x.id]) recent.push(x); });
  h += "<div class='card'><div class='ct'>🍽 最近作ったもの</div>" + (recent.length ? recent.map(function (x) { return recRow(byId[x.id], md(x.t)); }).join('') : "<p class='note'>「作った」を押すと記録されるよ</p>") + '</div>';
  h += "<div class='card'><div class='ct'>📚 ぜんぶのレシピ<span class='rt'>" + RECIPES.length + "品</span></div><input id='recQ' class='addrow' style='width:100%;border:2px solid var(--line);border-radius:14px;padding:10px 12px;font-size:16px' placeholder='レシピ名や食材で探す'><div id='recL'>" + RECIPES.slice(0, 8).map(function (r) { return recRow(r); }).join('') + '</div></div>';
  h += accountHtml();
  h += "<div class='card'><div class='ct'>⚙️ その他</div><button class='mini' data-act='terms'>利用規約・プライバシー</button> <button class='mini' data-act='blocks'>ブロックした人</button></div>";
  return h;
}
function recRow(r, right) { if (!r) return ''; return "<button class='rl' data-open='" + r.id + "'><i>" + r.emoji + '</i><span><b>' + esc(r.name) + '</b><small>' + r.cat + '・' + r.min + '分</small></span>' + (right ? "<span class='m'>" + right + '</span>' : '') + '</button>'; }

// ---- みんなのごはん（feed.js に読み書きをまかせる） ----
var feedSort = 'new', feedRecipe = null;
function feedShell() {
  var h = header('みんなのごはん', 'このアプリで作ったごはんが集まるよ');
  h += "<div class='feedh'><button class='mini" + (feedSort === 'new' ? ' on' : '') + "' data-fs='new' style='" + (feedSort === 'new' ? 'border-color:var(--acc);color:var(--acc)' : '') + "'>🆕 新着</button><button class='mini' data-fs='hot' style='" + (feedSort === 'hot' ? 'border-color:var(--acc);color:var(--acc)' : '') + "'>🏆 今週の人気</button>" + (feedRecipe && byId[feedRecipe] ? "<button class='mini' data-fs='all'>" + byId[feedRecipe].emoji + ' ' + esc(byId[feedRecipe].name) + ' ×</button>' : '') + '</div>';
  h += "<div id='feedL'><div class='empty'><i>⏳</i>読み込み中…</div></div>";
  return h;
}
function ago(t) { var s = (Date.now() - t) / 1000; if (s < 60) return 'たった今'; if (s < 3600) return Math.floor(s / 60) + '分前'; if (s < 86400) return Math.floor(s / 3600) + '時間前'; return md(t); }
function loadFeed() {
  var L = $('feedL'); if (!L) return;
  window.FEED.list({ sort: feedSort, recipe: feedRecipe }).then(function (ps) {
    if (!$('feedL')) return;
    if (!ps.length) { L.innerHTML = "<div class='empty'><i>🍳</i>まだ投稿がないよ。<br>ルーレットで決めたごはんを作って、1番目に投稿しよう！</div>"; return; }
    var me = window.FEED.me && window.FEED.me(); if (me) { var lk = ps.filter(function (p) { return p.user_id === me; }).reduce(function (a, p) { return a + (p.likes || 0); }, 0); if (lk > get('kd-likes-recv', 0)) put('kd-likes-recv', lk); var cm = ps.filter(function (p) { return p.user_id === me; }).reduce(function (a, p) { return a + (p.comments || 0); }, 0); if (cm > get('kd-cmt-recv', 0)) put('kd-cmt-recv', cm); setTimeout(checkBadges, 300); }
    var top = feedSort === 'new' && !feedRecipe ? ps.filter(function (p) { return Date.now() - p.t < 864e5 && p.likes > 0; }).sort(function (a, b) { return b.likes - a.likes; })[0] : null;
    if (top && me && top.user_id === me) flag('best');
    L.innerHTML = (top ? "<div class='best'><b>👑 今日のベストごはん</b><small>いいねがいちばん多い1枚</small>" + postHtml(top) + '</div>' : "<div class='best0'>👑 今日いちばんいいねを集めた写真は、ここにピックアップされるよ</div>") + ps.filter(function (p) { return p !== top; }).map(postHtml).join('');
  }).catch(function () { L.innerHTML = "<div class='empty'><i>📡</i>読み込めなかった。通信を確認してね</div>"; });
}
function postHtml(p) {
  var r = byId[p.recipe_id];
  return "<div class='post' data-pid='" + esc(p.id) + "'><div class='ph'><img loading='lazy' alt='' src='" + esc(p.photo) + "'>" + (r ? "<button class='rt' data-open='" + r.id + "' style='border:0'>" + r.emoji + ' ' + esc(r.name) + ' のレシピ ›</button>' : '') + "</div><div class='bd2'><div class='who' data-user='" + esc(p.user_id || '') + "'>" + avHtml(p) + esc(p.name || 'ななしさん') + pubHtml(p.pub) + '<small>' + ago(p.t) + '</small></div>' + (p.caption ? "<div class='cap'>" + esc(p.caption) + '</div>' : '') +
    "<div class='pb'><button data-like='" + esc(p.id) + "' class='" + (p.liked ? 'on' : '') + "'>" + (p.liked ? '❤️' : '🤍') + ' ' + (p.likes || 0) + "</button><button data-cmt='" + esc(p.id) + "'>💬 " + (p.comments || 0) + "</button><button class='mo' data-more='" + esc(p.id) + "' data-uid='" + esc(p.user_id || '') + "'>…</button></div><div class='cm' data-cbox='" + esc(p.id) + "' hidden></div></div></div>";
}
function openComments(id, box) {
  box.hidden = !box.hidden; if (box.hidden) return;
  box.innerHTML = '読み込み中…';
  window.FEED.comments(id).then(function (cs) {
    box.innerHTML = (cs.length ? cs.map(function (c) { return '<p><b>' + esc(c.name || 'ななしさん') + '</b>' + esc(c.text) + '</p>'; }).join('') : "<p class='note'>まだコメントはないよ</p>") +
      "<div class='addrow'><input maxlength='200' placeholder='やさしいコメントを書こう'><button class='mini' data-csend='" + esc(id) + "'>送る</button></div>";
  });
}
function moreMenu(id, uid) {
  var ov = document.createElement('div'); ov.className = 'ov';
  var mine = window.FEED.me && uid === window.FEED.me();
  ov.innerHTML = "<div class='sheet'>" + (mine ? "<button class='sub2' data-m='del'>🗑 この投稿を消す</button>" : "<button class='sub2' data-m='report'>🚩 この投稿を通報する</button><button class='sub2' data-m='block'>🚫 この人をブロックする</button>") + "<button class='sub2' data-m='x' style='border-color:var(--line);color:var(--sub)'>とじる</button></div>";
  document.body.appendChild(ov);
  ov.addEventListener('click', function (e) {
    if (e.target === ov) { ov.remove(); return; }
    var b = e.target.closest('[data-m]'); if (!b) return; var a = b.getAttribute('data-m'); ov.remove();
    if (a === 'report' && isGuest()) { openLogin(null, '通報するには、ログインが必要だよ'); return; }
    if (a === 'report') { var why = prompt('通報の理由を書いてね（例: 食べ物と関係ない写真、いやがらせ など）'); if (why === null) return; window.FEED.report(id, why).then(function () { toast('通報したよ。運営が24時間以内に確認するね'); }); }
    else if (a === 'block') { if (!confirm('この人をブロックする？この人の投稿とコメントが見えなくなるよ')) return; window.FEED.block(uid).then(function () { toast('ブロックしたよ'); loadFeed(); }); }
    else if (a === 'del') { if (!confirm('この投稿を消す？')) return; window.FEED.remove(id).then(function () { toast('消したよ'); loadFeed(); }); }
  });
}

// ---- 投稿 ----
var postFor = null, postImg = null, postThumb = null;
// ---- ログイン（投稿・いいね・コメントのときだけ。メールに届く6桁の番号） ----
function isGuest() { return !!(window.FEED.cloud && window.FEED.isGuest && window.FEED.isGuest()); }
function needLogin(then, why) { if (!isGuest()) { then(); return; } openLogin(then, why); }
function openLogin(then, why) {
  var old = $('loginOv'); if (old) old.remove();
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'loginOv'; var mode = null, mail = '';
  function step1() { return "<div class='sheet lg'><h2>🔑 ログイン</h2><p class='note' style='text-align:center'>" + esc(why || '投稿・いいね・コメントをするには、ログインが必要だよ') + "</p><div class='lgb'><b>パスワードはいらないよ</b>メールアドレスに届く<b>6桁の番号</b>を入れるだけ。<br>ログインすると、バッジやごはん日記が機種変しても消えないよ。</div><input id='lgm' type='email' inputmode='email' autocomplete='email' placeholder='メールアドレス'><button class='big' id='lgs'>番号を送る</button><button class='sub2' id='lgx'>あとで</button><p class='note'>ログインすると<a href='#' data-act='terms'>利用規約</a>に同意したことになります。</p></div>"; }
  function step2() { return "<div class='sheet lg'><h2>📩 番号を入れてね</h2><p class='note' style='text-align:center'>" + esc(mail) + " に6桁の番号を送ったよ。<br>届かないときは迷惑メールも見てね。</p><input id='lgc' inputmode='numeric' autocomplete='one-time-code' maxlength='6' placeholder='123456' style='text-align:center;font-size:28px;letter-spacing:8px'><button class='big' id='lgv'>ログイン</button><button class='sub2' id='lgb'>メールアドレスを入れ直す</button></div>"; }
  function bind() {
    var x = $('lgx'); if (x) x.onclick = function () { ov.remove(); };
    var s1 = $('lgs'); if (s1) s1.onclick = function () { mail = $('lgm').value.trim(); s1.disabled = true; s1.textContent = '送信中…'; window.FEED.sendCode(mail).then(function (m) { mode = m; ov.innerHTML = step2(); bind(); var c = $('lgc'); if (c) c.focus(); }).catch(function (e) { s1.disabled = false; s1.textContent = '番号を送る'; toast(e.message); }); };
    var bk = $('lgb'); if (bk) bk.onclick = function () { ov.innerHTML = step1(); bind(); };
    var v = $('lgv'); if (v) v.onclick = function () { v.disabled = true; v.textContent = '確認中…'; window.FEED.verify(mail, $('lgc').value, mode).then(function () { return syncPull(); }).then(function () { ov.remove(); toast('ログインしたよ！🎉'); render(); if (then) then(); }).catch(function (e) { v.disabled = false; v.textContent = 'ログイン'; toast(e.message); }); };
  }
  ov.innerHTML = step1(); document.body.appendChild(ov); bind();
  ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
}
// ---- 記録をアカウントに保存（バッジ・ごはん日記・お気に入り・作った記録） ----
var SYNC_KEYS = ['kd-posts', 'kd-stat', 'kd-likes-recv', 'kd-cmt-recv', 'kd-badges', 'kd-fav', 'kd-made', 'kd-agree'];
function syncData() { var d = {}; SYNC_KEYS.forEach(function (k) { var v = get(k, null); if (k === 'kd-posts' && v) v = v.map(function (p) { return { id: p.id, t: p.t }; }); if (v !== null) d[k] = v; }); return d; }
function mergeIn(d) {
  if (!d) return;
  var lp = get('kd-posts', []), seen = {}; lp.forEach(function (p) { seen[p.t] = 1; }); (d['kd-posts'] || []).forEach(function (p) { if (!seen[p.t]) lp.push(p); }); lp.sort(function (a, b) { return a.t - b.t; }); put('kd-posts', lp.slice(-300));
  var s1 = get('kd-stat', {}), s2 = d['kd-stat'] || {}; Object.keys(s2).forEach(function (k) { s1[k] = Math.max(s1[k] || 0, s2[k] || 0); }); put('kd-stat', s1);
  ['kd-likes-recv', 'kd-cmt-recv', 'kd-agree'].forEach(function (k) { put(k, Math.max(get(k, 0), d[k] || 0)); });
  ['kd-badges', 'kd-fav'].forEach(function (k) { var a = get(k, []); (d[k] || []).forEach(function (x) { if (a.indexOf(x) < 0) a.push(x); }); put(k, a); });
  var mm = get('kd-made', []), ms = {}; mm.forEach(function (x) { ms[x.t] = 1; }); (d['kd-made'] || []).forEach(function (x) { if (!ms[x.t]) mm.push(x); }); mm.sort(function (a, b) { return b.t - a.t; }); put('kd-made', mm.slice(0, 500));
  st.fav = get('kd-fav', []); st.made = get('kd-made', []);
}
function syncPull() { if (!window.FEED.pullProfile) return Promise.resolve(); return window.FEED.pullProfile().then(function (p) { if (p && p.data) mergeIn(p.data); checkBadges(true); return syncPush(); }).catch(function () {}); }
var syncT = null;
function syncPush() { if (isGuest() || !window.FEED.pushProfile) return Promise.resolve(); var m = window.FEED_LOCAL && window.FEED_LOCAL.me ? window.FEED_LOCAL.me() : {}, ps = myPosts(), k = rankOf(ps.length);
  return window.FEED.pushProfile({ name: m.name, avatar: m.avatar, data: syncData(), rank: k.r[2] + ' ' + k.r[1], badges: badgesOf(ps).filter(function (b) { return b[3]; }).map(function (b) { return b[0]; }), post_count: ps.length }).catch(function () {}); }
// ---- ほかの人に見えるバッジ ----
var BDEF = null;
function bdef() { if (!BDEF) { BDEF = {}; badgesOf([]).forEach(function (b) { BDEF[b[0]] = { icon: b[2], name: b[1], goal: b[6], how: b[4] }; }); } return BDEF; }
function topBadges(keys, n) { var d = bdef(); return (keys || []).filter(function (k) { return d[k]; }).sort(function (a, b) { return d[b].goal - d[a].goal; }).slice(0, n); }
function pubHtml(pub) {
  if (!pub) return '';
  var r = (pub.rank || '').split(' ')[0], tb = topBadges(pub.badges, 3), d = bdef();
  return "<span class='pubb'>" + (r ? "<i title='" + esc(pub.rank) + "'>" + esc(r) + '</i>' : '') + tb.map(function (k) { return "<i title='" + esc(d[k].name) + "'>" + d[k].icon + '</i>'; }).join('') + '</span>';
}
// 名前・アイコンを押すと、その人のプロフィール（バッジ全部・投稿）
function openUser(uid) {
  if (!uid || !window.FEED.publicProfile) return;
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'userOv';
  ov.innerHTML = "<div class='sheet up'><div class='empty'><i>⏳</i>読み込み中…</div></div>"; document.body.appendChild(ov);
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-ux]')) ov.remove(); });
  Promise.all([window.FEED.publicProfile(uid), window.FEED.list({ sort: 'new', user: uid })]).then(function (res) {
    var pr = res[0] || {}, posts = res[1] || [], d = bdef(), keys = topBadges(pr.badges, 80);
    var name = pr.name || (posts[0] && posts[0].name) || 'ななしさん', av = pr.avatar_url || pr.avatar ? pr : (posts[0] || {});
    var h = "<div class='sheet up'><div class='phr'>" + pavHtml(av, 'xl') + "<div class='phs'><div><b>" + (pr.post_count || posts.length) + '</b><small>投稿</small></div><div><b>' + posts.reduce(function (a, p) { return a + (p.likes || 0); }, 0) + '</b><small>いいね</small></div><div><b>' + keys.length + "</b><small>バッジ</small></div></div></div><div class='phn'>" + esc(name) + "</div><div class='phk'>" + esc(pr.rank || '') + '</div>';
    h += "<div class='bdh'><b>🎖 バッジ</b><span>" + keys.length + ' 個</span></div>' + (keys.length ? "<div class='bdg'>" + keys.map(function (k) { return "<span class='on'><i>" + d[k].icon + '</i>' + esc(d[k].name) + '</span>'; }).join('') + '</div>' : "<p class='note'>まだバッジはないみたい</p>");
    h += "<div class='bdh'><b>📷 投稿</b><span>" + posts.length + "</span></div><div class='diary'>" + posts.slice(0, 30).map(function (p) { var r = byId[p.recipe_id]; return "<button data-open='" + esc(p.recipe_id) + "' data-ux='1'><img alt='' src='" + esc(p.photo) + "'><small>" + (r ? r.emoji : '') + '</small></button>'; }).join('') + "</div><button class='sub2' data-ux='1'>とじる</button></div>";
    ov.innerHTML = h;
  }).catch(function () { ov.innerHTML = "<div class='sheet up'><div class='empty'><i>📡</i>読み込めなかった</div><button class='sub2' data-ux='1'>とじる</button></div>"; });
}
function syncSoon() { if (isGuest()) return; clearTimeout(syncT); syncT = setTimeout(syncPush, 3000); }
function avHtml(p, big) { return p && p.avatar_url ? "<span class='av" + (big ? ' big' : '') + "'><img alt='' src='" + esc(p.avatar_url) + "'></span>" : "<span class='av" + (big ? ' big' : '') + "'>" + esc((p && p.avatar) || '🍙') + '</span>'; }
var AVS = ['🍙', '🍳', '🥕', '🍅', '🧅', '🍓', '🥐', '🍮', '🐣', '🐱', '🐶', '🐻', '🍜', '🍰'];
function openProfileEdit() {
  var cur = window.FEED.myProfile(), img = null, imgUrl = null, emoji = cur.avatar || '🍙', remove = false;
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'profOv';
  function html() {
    var show = imgUrl ? { avatar_url: imgUrl } : remove ? { avatar: emoji } : { avatar: emoji, avatar_url: cur.avatar_url };
    return "<div class='sheet pf'><h2>✏️ プロフィールを編集</h2><div class='pfa'>" + pavHtml(show, 'xl') + "<button class='mini' id='pfp'>📷 写真をえらぶ</button>" + ((imgUrl || (cur.avatar_url && !remove)) ? "<button class='mini' id='pfr'>写真をはずす</button>" : '') + "</div>" +
      "<div class='pfe'>" + AVS.map(function (a) { return "<button data-av='" + a + "' class='" + (a === emoji && !imgUrl && (remove || !cur.avatar_url) ? 'on' : '') + "'>" + a + '</button>'; }).join('') + "</div><small class='note'>写真がないときは、えらんだ絵文字がアイコンになるよ</small>" +
      "<label class='pfl'>名前（1〜20文字）<input id='pfn' maxlength='20' value='" + esc(cur.name || '') + "'></label><p class='note'>名前とアイコンは、みんなのごはんに表示されるよ。本名や顔がわかる写真はやめてね。</p><button class='big' id='pfs'>保存する</button><button class='sub2' id='pfx'>やめる</button></div>";
  }
  function bind() {
    $('pfx').onclick = function () { ov.remove(); };
    $('pfp').onclick = function () { var c = $('camA'); c.value = ''; c.onchange = function () { var f = c.files && c.files[0]; if (!f) return; var u = URL.createObjectURL(f), im = new Image(); im.onload = function () { URL.revokeObjectURL(u); var s2 = Math.min(im.naturalWidth, im.naturalHeight), cv = document.createElement('canvas'); cv.width = cv.height = 320; cv.getContext('2d').drawImage(im, (im.naturalWidth - s2) / 2, (im.naturalHeight - s2) / 2, s2, s2, 0, 0, 320, 320); imgUrl = cv.toDataURL('image/jpeg', .85); cv.toBlob(function (bl) { img = bl; ov.innerHTML = html(); bind(); }, 'image/jpeg', .85); }; im.src = u; }; c.click(); };
    var rm = $('pfr'); if (rm) rm.onclick = function () { img = null; imgUrl = null; remove = true; ov.innerHTML = html(); bind(); };
    ov.querySelectorAll('[data-av]').forEach(function (b) { b.onclick = function () { emoji = b.getAttribute('data-av'); if (!imgUrl) remove = true; img = null; imgUrl = null; ov.innerHTML = html(); bind(); }; });
    $('pfs').onclick = function () {
      var n = $('pfn').value.trim(); if (!n) { toast('名前を入れてね'); return; }
      var b = $('pfs'); b.disabled = true; b.textContent = '保存中…';
      window.FEED.saveProfile({ name: n, avatar: emoji, image: img, removePhoto: remove && !img }).then(function () { ov.remove(); toast('プロフィールを保存したよ'); render(); }).catch(function (e) { b.disabled = false; b.textContent = '保存する'; toast(e && e.message ? e.message : '保存できなかった'); });
    };
  }
  ov.innerHTML = html(); document.body.appendChild(ov); bind();
  ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
}
function pavHtml(p, cls) { return "<div class='pav " + (cls || '') + "'>" + (p && p.avatar_url ? "<img alt='' src='" + esc(p.avatar_url) + "'>" : '<span>' + esc((p && p.avatar) || '🍙') + '</span>') + '</div>'; }
// マイページのいちばん上（インスタのプロフィールみたいに）
function profileHead(ps, bd) {
  var guest = isGuest(), pr = window.FEED.myProfile && !guest ? window.FEED.myProfile() : (window.FEED_LOCAL ? window.FEED_LOCAL.me() : {});
  var k = rankOf(ps.length), got = bd.filter(function (b) { return b[3]; }).length;
  var h = "<div class='phd'><div class='phr'>" + pavHtml(guest ? { avatar: '👤' } : pr, 'xl') + "<div class='phs'><div><b>" + ps.length + '</b><small>投稿</small></div><div><b>' + get('kd-likes-recv', 0) + '</b><small>いいね</small></div><div><b>' + got + '</b><small>バッジ</small></div></div></div>';
  h += "<div class='phn'>" + (guest ? 'ゲスト' : esc(pr.name || '')) + "</div><div class='phk'>" + k.r[2] + ' ' + k.r[1] + (streakOf(ps).now ? '　🔥 ' + streakOf(ps).now + '日連続' : '') + '</div>';
  h += guest ? "<button class='phb on' data-act='login'>🔑 ログインして投稿をはじめる</button>" : "<button class='phb' data-act='prof'>プロフィールを編集</button>";
  return h + '</div>';
}
function accountHtml() {
  if (!window.FEED.cloud) return '';
  if (isGuest()) return "<div class='card'><div class='ct'>👤 アカウント</div><p class='note'>いまはゲストで使っているよ。ログインすると、写真の投稿・いいね・コメントができて、バッジやごはん日記が機種変しても消えなくなるよ。</p><button class='big' data-act='login'>🔑 ログイン（メールの番号だけ）</button></div>";
  var pr = window.FEED.myProfile ? window.FEED.myProfile() : {};
  return "<div class='card'><div class='ct'>👤 アカウント</div><p class='note'>ログイン中：<b>" + esc(window.FEED.email() || '') + "</b><br>バッジ・ごはん日記・お気に入りはアカウントに保存されているよ。</p><button class='mini' data-act='logout'>ログアウト</button> <button class='mini' data-act='delacc' style='color:#E04848'>アカウントを削除</button></div>";
}
function openPost(r) {
  if (isGuest()) { openLogin(function () { openPost(r); }, '写真を投稿するには、ログインが必要だよ'); return; }
  postFor = r; postImg = null; postThumb = null;
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'postOv';
  ov.innerHTML = "<div class='sheet'><h2>📷 作ったごはんを投稿</h2><p class='note' style='text-align:center'>" + r.emoji + ' ' + esc(r.name) + "</p><button class='pv' id='pv'><i>📷</i>タップして写真をえらぶ</button><textarea class='tx' id='ptx' maxlength='200' placeholder='ひとこと（例: はじめて作ったけど大成功！）'></textarea>" +
    "<div class='perk'><b>📷 投稿するともらえるもの</b><span>🏅 ごはんランクが上がる</span><span>🔥 連続投稿の記録</span><span>🎖 バッジ（和食名人・デザート職人…）</span><span>👑 いいね1位で、このレシピの「顔」に</span><span>📔 マイページのごはん日記に残る</span></div>" + (get('kd-agree', 0) ? '' : "<label class='agree'><input type='checkbox' id='pagr'> <span><a href='#' data-act='terms'>利用規約</a>に同意して投稿する（人を傷つける投稿・料理と関係ない写真は禁止。違反した投稿は削除されます）</span></label>") + "<p class='note'>投稿すると、このアプリを使っている全員が見られるよ。顔や住所がわかる写真はやめてね。食べ物と関係ない写真・いやがらせは削除されるよ。</p><button class='big' id='pgo'>投稿する</button><button class='sub2' id='pno' style='border-color:var(--line);color:var(--sub)'>やめる</button></div>";
  document.body.appendChild(ov);
  $('pv').onclick = function () { var c = $('cam'); c.value = ''; c.click(); };
  $('pno').onclick = function () { ov.remove(); };
  $('pgo').onclick = function () {
    if (!postImg) { toast('写真をえらんでね'); return; }
    var ag = $('pagr'); if (ag && !ag.checked) { toast('利用規約への同意にチェックしてね'); return; } if (ag) put('kd-agree', 1);
    var b = $('pgo'); b.disabled = true; b.textContent = '投稿中…';
    window.FEED.post({ recipe_id: r.id, caption: $('ptx').value.trim(), image: postImg }).then(function () {
      var before = myPosts(), ps = before.concat([{ id: r.id, t: Date.now(), th: postThumb }]).slice(-120); put('kd-posts', ps);
      markMade(r); ov.remove(); feedSort = 'new'; feedRecipe = null; st.tab = 'feed'; render(); rewardAfterPost(r, before, postThumb);
    }).catch(function (e) { b.disabled = false; b.textContent = '投稿する'; toast(e && e.message ? e.message : '投稿できなかった。通信を確認してね'); });
  };
}
// 写真を正方形・最大1080pxにしてから使う
$('cam').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0]; if (!f) return;
  var u = URL.createObjectURL(f), im = new Image();
  im.onload = function () {
    URL.revokeObjectURL(u); var s = Math.min(im.naturalWidth, im.naturalHeight), z = Math.min(1080, s), c = document.createElement('canvas'); c.width = c.height = z;
    c.getContext('2d').drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, 0, 0, z, z);
    try { var tc = document.createElement('canvas'); tc.width = tc.height = 200; tc.getContext('2d').drawImage(c, 0, 0, 200, 200); postThumb = tc.toDataURL('image/jpeg', .7); } catch (er) {}
    c.toBlob(function (bl) { postImg = bl; var pv = $('pv'); if (pv) pv.innerHTML = "<img alt='' src='" + c.toDataURL('image/jpeg', .8) + "'>"; }, 'image/jpeg', .85);
  };
  im.src = u;
});

checkBadges(true);
try { if (window.FEED.whenReady) window.FEED.whenReady.then(function () { if (!isGuest()) syncPull().then(function () { if (st.tab === 'me' || st.tab === 'feed') render(); }); }); } catch (e) {}
// ---- タップの受け付け ----
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if ((b = t.closest('[data-tm]'))) { startTimer(+b.getAttribute('data-tm'), b.getAttribute('data-tl')); return; }
  if ((b = t.closest('[data-tmx]'))) { var tid = +b.getAttribute('data-tmx'); timers = timers.filter(function (x) { return x.id !== tid; }); tickTimers(); return; }
  if ((b = t.closest('.nav [data-tab]'))) { st.tab = b.getAttribute('data-tab'); if (st.tab !== 'feed') feedRecipe = null; render(); return; }
  if ((b = t.closest('[data-cat]'))) { st.cat = b.getAttribute('data-cat'); render(); return; }
  if ((b = t.closest('[data-unpick]'))) { var un = b.getAttribute('data-unpick'), ui = st.picked.indexOf(un); if (ui >= 0) st.picked.splice(ui, 1); saveAll(); var uy = window.scrollY; render(); window.scrollTo(0, uy); return; }
  if ((b = t.closest('[data-food]'))) { var n = b.getAttribute('data-food'), i = st.picked.indexOf(n), mi = st.must.indexOf(n);
    if (i < 0) st.picked.push(n); else if (mi < 0) st.must.push(n); else { st.picked.splice(i, 1); st.must.splice(mi, 1); } saveAll(); var y = window.scrollY; render(); window.scrollTo(0, y); buzz(); return; }
  if ((b = t.closest('[data-add]'))) { var q = b.getAttribute('data-add').trim().slice(0, 20); if (q && st.picked.indexOf(q) < 0) st.picked.push(q); saveAll(); var y2 = window.scrollY; render(); window.scrollTo(0, y2); buzz(); var hn = customHits(q); toast(hn ? '「' + q + '」を追加したよ（' + hn + '品）' : '「' + q + '」を追加したよ。使うレシピはまだ少ないかも'); return; }
  if ((b = t.closest('[data-fc]'))) { st.flt.cat = b.getAttribute('data-fc'); saveAll(); keep(); return; }
  if ((b = t.closest('[data-fm]'))) { st.flt.min = +b.getAttribute('data-fm'); saveAll(); keep(); return; }
  if ((b = t.closest('[data-fg]'))) { st.flt.genre = b.getAttribute('data-fg'); saveAll(); keep(); return; }
  if ((b = t.closest('[data-user]')) && b.getAttribute('data-user')) { openUser(b.getAttribute('data-user')); return; }
  if ((b = t.closest('[data-open]'))) { openRecipe(b.getAttribute('data-open')); return; }
  if ((b = t.closest('[data-fs]'))) { var v = b.getAttribute('data-fs'); if (v === 'all') feedRecipe = null; else feedSort = v; render(); return; }
  if (t.closest('[data-like],[data-csend]') && isGuest()) { openLogin(null, 'いいね・コメントするには、ログインが必要だよ'); return; }
  if ((b = t.closest('[data-like]'))) { var id = b.getAttribute('data-like'), on = b.classList.contains('on'), nn = parseInt(b.textContent.replace(/\D/g, ''), 10) || 0; b.classList.toggle('on', !on); b.textContent = (on ? '🤍 ' : '❤️ ') + Math.max(0, nn + (on ? -1 : 1)); buzz(); if (!on) bump('likesGiven'); window.FEED.like(id, !on).catch(function () { toast('いいねできなかった'); }); return; }
  if ((b = t.closest('[data-cmt]'))) { var box = document.querySelector("[data-cbox='" + b.getAttribute('data-cmt') + "']"); if (box) openComments(b.getAttribute('data-cmt'), box); return; }
  if ((b = t.closest('[data-csend]'))) { var inp = b.parentNode.querySelector('input'), tx = inp.value.trim(), pid = b.getAttribute('data-csend'); if (!tx) return; b.disabled = true; window.FEED.comment(pid, tx).then(function () { bump('cmtGiven'); var bx = document.querySelector("[data-cbox='" + pid + "']"); bx.hidden = true; openComments(pid, bx); var cb = document.querySelector("[data-cmt='" + pid + "']"); if (cb) cb.textContent = '💬 ' + ((parseInt(cb.textContent.replace(/\D/g, ''), 10) || 0) + 1); }).catch(function (er) { b.disabled = false; toast(er && er.message ? er.message : '送れなかった'); }); return; }
  if ((b = t.closest('[data-more]'))) { moreMenu(b.getAttribute('data-more'), b.getAttribute('data-uid')); return; }
  if ((b = t.closest('[data-sc]'))) { var x = st.shop[+b.getAttribute('data-sc')]; if (x) { if (b.checked && !x.done) bump('shopDone'); x.done = b.checked; saveAll(); render(); } return; }
  if ((b = t.closest('[data-sx]'))) { st.shop.splice(+b.getAttribute('data-sx'), 1); saveAll(); render(); return; }
  if ((b = t.closest('[data-act]'))) {
    var a = b.getAttribute('data-act');
    if (a === 'spin') openSpin();
    else if (a === 'week') openWeek();
    else if (a === 'prof') { openProfileEdit(); }
    else if (a === 'login') { openLogin(null, 'ログインすると、投稿・いいね・コメントができるよ'); }
    else if (a === 'logout') { if (confirm('ログアウトする？（記録はアカウントに残るよ）')) { syncPush().then(function () { return window.FEED.logout(); }).then(function () { toast('ログアウトしたよ'); render(); }); } }
    else if (a === 'delacc') { if (confirm('アカウントを削除する？投稿した写真・コメント・いいね・保存した記録が全部消えて、元に戻せないよ。') && confirm('本当に削除していい？')) { window.FEED.deleteAccount().then(function () { ['kd-posts', 'kd-stat', 'kd-likes-recv', 'kd-cmt-recv', 'kd-badges', 'kd-agree'].forEach(function (k) { try { localStorage.removeItem(k); } catch (er) {} }); toast('アカウントを削除したよ'); render(); }).catch(function (er) { toast(er.message); }); } }
    else if (a === 'badgeAll') { badgeAll = !badgeAll; keep(); }
    else if (a === 'clear') { st.picked = []; st.must = []; saveAll(); render(); }
    else if (a === 'shopAdd') { var v2 = ($('shopIn').value || '').trim(); if (v2) { st.shop.unshift({ n: v2, from: ['自分で追加'], done: false }); saveAll(); render(); } }
    else if (a === 'shopClear') { st.shop = st.shop.filter(function (x) { return !x.done; }); saveAll(); render(); }
    else if (a === 'shopShare') { var txt = '🛒 買い物リスト\n' + st.shop.filter(function (x) { return !x.done; }).map(function (x) { return '・' + x.n; }).join('\n'); if (navigator.share) navigator.share({ text: txt }).catch(function () {}); else { try { navigator.clipboard.writeText(txt); toast('コピーしたよ'); } catch (er) {} } }
    else if (a === 'spinFav') { var save = st.flt, pk = st.picked; openFavSpin(); }
    else if (a === 'terms') { var cfg = window.KONDATE_CONFIG || {}; if (cfg.termsUrl) window.open(cfg.termsUrl, '_blank'); }
    else if (a === 'blocks') { window.FEED.unblockAll && confirm('ブロックした人を全員もとに戻す？') && window.FEED.unblockAll().then(function () { toast('もとに戻したよ'); }); }
  }
});
function keep() { var y = window.scrollY; render(); window.scrollTo(0, y); }
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'fq') { var fv = e.target.value.trim(); if (fv) { var ex = FOODSET[fv] ? fv : null; if (ex) { if (st.picked.indexOf(ex) < 0) st.picked.push(ex); saveAll(); render(); } else { var ab = document.querySelector('[data-add]'); if (ab) ab.click(); } } return; } if (e.key === 'Enter' && e.target.id === 'shopIn') { var v = e.target.value.trim(); if (v) { st.shop.unshift({ n: v, from: ['自分で追加'], done: false }); saveAll(); render(); } } });
document.addEventListener('input', function (e) {
  if (e.target.id === 'fq') { $('fqr').innerHTML = searchHtml(e.target.value.trim()); return; }
  if (e.target.id !== 'recQ') return; var q = e.target.value.trim(), L = $('recL');
  var l = q ? RECIPES.filter(function (r) { return r.name.indexOf(q) >= 0 || r.ing.some(function (i) { return i.n.indexOf(q) >= 0; }); }) : RECIPES.slice(0, 8);
  L.innerHTML = l.slice(0, 30).map(function (r) { return recRow(r); }).join('') || "<p class='note'>見つからなかった</p>";
});
function openFavSpin() {
  var items = st.fav.map(function (id) { return byId[id]; }).filter(Boolean); if (!items.length) return;
  for (var i = items.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = items[i]; items[i] = items[j]; items[j] = t; }
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'spinOv';
  ov.innerHTML = "<div class='sheet'><h2>❤️ お気に入りルーレット</h2><div class='wheelbox'><canvas id='wh' width='720' height='720'></canvas><div class='pin'></div><div class='hub'>❤️</div></div><button class='big' id='spinGo'>スタート！</button><button class='sub2' id='spinNo'>とじる</button></div>";
  document.body.appendChild(ov); wheel = { items: items.slice(0, 8), ang: 0 }; drawWheel();
  $('spinNo').onclick = function () { ov.remove(); }; $('spinGo').onclick = spin;
}

window.KONDATE = { st: st, candidates: candidates, openRecipe: openRecipe, render: render, scaleQ: scaleQ };
shopBadge(); render();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (wheel) drawWheel(); });
})();
