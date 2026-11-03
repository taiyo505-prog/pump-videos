// くるくるごはん: 食材を選ぶ → ルーレットでレシピを決める → 作って写真を投稿
(function () {
'use strict';
var D = window.KONDATE_DATA, FOODS = D.foods, RECIPES = D.recipes;
var byId = {}; RECIPES.forEach(function (r) { byId[r.id] = r; });
var K = { picked: 'kd-picked', fav: 'kd-fav', made: 'kd-made', shop: 'kd-shop', srv: 'kd-srv', week: 'kd-week', flt: 'kd-filter' };
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
  fav: get(K.fav, []),                  // お気に入りのレシピID
  made: get(K.made, []),                // 作った記録 [{id, t}]
  shop: get(K.shop, []),                // 買い物リスト [{n, from, done}]
  srv: get(K.srv, 2),                   // 何人分
  week: get(K.week, null),              // 1週間の献立 {t, ids[]}
  flt: get(K.flt, { cat: 'all', min: 0, genre: 'all' })
};
function saveAll() { put(K.picked, st.picked); put(K.fav, st.fav); put(K.made, st.made); put(K.shop, st.shop); put(K.srv, st.srv); put(K.week, st.week); put(K.flt, st.flt); shopBadge(); }

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
function searchHtml(q) {
  if (!q) return '';
  var l = foodHits(q).slice(0, 24), h = '';
  if (l.length) h += "<div class='foods'>" + l.map(function (f) { return "<button class='fd" + (st.picked.indexOf(f[0]) >= 0 ? ' on' : '') + "' data-food='" + esc(f[0]) + "'><i>" + f[1] + '</i>' + esc(f[0]) + '</button>'; }).join('') + '</div>';
  if (!FOODSET[q]) { var n = customHits(q); h += "<button class='sub2' data-add='" + esc(q) + "' style='margin-top:8px'>＋「" + esc(q) + "」を食材に追加" + (n ? '（' + n + '品で使える）' : '') + '</button>'; }
  return h;
}
function candidates() {
  var l = RECIPES.filter(passFilter);
  if (st.picked.length) l = l.filter(function (r) { return score(r) > 0; });
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
  h += "<input id='fq' class='fq' type='search' autocomplete='off' placeholder='🔍 食材をさがす（なければ追加OK）'><div id='fqr'></div>";
  h += "<div class='tabs'>" + cats.map(function (c) { var n = FOODS.filter(function (f) { return f[2] === c && st.picked.indexOf(f[0]) >= 0; }).length; return "<button data-cat='" + c + "' class='" + (st.cat === c ? 'on' : '') + "'>" + c + (n ? ' ' + n : '') + '</button>'; }).join('') + '</div>';
  h += "<div class='foods'>" + FOODS.filter(function (f) { return f[2] === st.cat; }).map(function (f) { return "<button class='fd" + (st.picked.indexOf(f[0]) >= 0 ? ' on' : '') + "' data-food='" + esc(f[0]) + "'><i>" + f[1] + '</i>' + esc(f[0]) + '</button>'; }).join('') + '</div>';
  h += "<div class='picked'>" + (st.picked.length ? st.picked.map(function (p) { return '<span' + (FOODSET[p] ? '' : " class='cu'") + '>' + (FOODSET[p] ? '' : '✏️') + esc(p) + "<b data-food='" + esc(p) + "'>×</b></span>"; }).join('') : "<span style='background:none;color:var(--sub);padding:4px 0'>えらばないと、全部のレシピから決めるよ</span>") + '</div></div>';
  h += "<div class='card'><div class='ct'><span class='no'>2</span>しぼりこみ（なくてもOK）</div>";
  h += "<div class='fll'>しゅるい</div><div class='fl'>" + [['all', 'ぜんぶ'], ['主菜', '🍖 主菜'], ['丼・麺', '🍚 丼・麺'], ['副菜', '🥗 副菜'], ['汁物', '🥣 汁物'], ['デザート', '🍮 デザート']].map(function (x) { return "<button data-fc='" + x[0] + "' class='" + (st.flt.cat === x[0] ? 'on' : '') + "'>" + x[1] + '</button>'; }).join('') + '</div>';
  h += "<div class='fll'>じかん</div><div class='fl'>" + [[0, 'ぜんぶ'], [10, '⚡ 10分以内'], [20, '20分以内'], [30, '30分以内']].map(function (x) { return "<button data-fm='" + x[0] + "' class='" + (st.flt.min === x[0] ? 'on' : '') + "'>" + x[1] + '</button>'; }).join('') + '</div>';
  h += "<div class='fll'>ジャンル</div><div class='fl'>" + [['all', 'ぜんぶ'], ['和', '和食'], ['洋', '洋食'], ['中', '中華'], ['韓', '韓国'], ['エスニック', 'エスニック']].map(function (x) { return "<button data-fg='" + x[0] + "' class='" + (st.flt.genre === x[0] ? 'on' : '') + "'>" + x[1] + '</button>'; }).join('') + '</div></div>';
  var c = candidates();
  h += "<div class='cnt'>候補のレシピ <b>" + c.length + '</b> 品</div>';
  h += "<button class='big' data-act='spin'" + (c.length ? '' : ' disabled style="opacity:.5"') + '>🎰 ルーレットを回す<small>' + (c.length ? 'どれになるかはお楽しみ' : '条件に合うレシピがないよ。しぼりこみをゆるめてね') + '</small></button>';
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
    if (p < 1) requestAnimationFrame(f); else setTimeout(function () { var ov = $('spinOv'); if (ov) ov.remove(); confetti(); buzz(); openRecipe(wheel.items[win].id, true); }, 350);
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
function openRecipe(id, fromSpin) {
  var r = byId[id]; if (!r) return;
  var old = $('recOv'); if (old) old.remove();
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'recOv';
  function html() {
    var need = r.ing.filter(function (i) { return i.food && !has(i.n); });
    var fav = st.fav.indexOf(r.id) >= 0, cnt = st.made.filter(function (m) { return m.id === r.id; }).length;
    var h = "<div class='sheet'>";
    if (fromSpin) h += "<div style='text-align:center;font-weight:900;color:var(--acc)'>🎉 今日の献立はこれに決定！</div>";
    h += "<div class='rhero'><div class='em'>" + r.emoji + '</div><h2>' + esc(r.name) + "</h2><div class='tags'><span>" + ({ '和': '和食', '洋': '洋食', '中': '中華', '韓': '韓国', 'エスニック': 'エスニック' }[r.genre]) + '</span><span>' + r.cat + '</span><span>⏱ ' + r.min + '分</span><span>約' + r.kcal + 'kcal</span>' + (cnt ? '<span>🍽 ' + cnt + '回作った</span>' : '') + '</div></div>';
    h += "<div class='card'><div class='ct'>🧺 材料<span class='rt'></span></div><div class='srv'><button data-srv='-1'>−</button><b>" + st.srv + "人分</b><button data-srv='1'>＋</button></div>";
    h += "<div class='legend'><span>✓ えらんだ食材</span><span>● 買い足しが必要</span><span>・ 調味料（家にある前提）</span></div><ul class='ing'>";
    r.ing.forEach(function (i) {
      var cls = i.pantry ? 'pan' : (has(i.n) ? 'have' : 'need');
      h += "<li class='" + cls + "'><span class='mk'>" + (cls === 'have' ? '✓' : cls === 'need' ? '●' : '・') + '</span>' + esc(i.n) + (cls === 'need' ? " <span class='tag'>買い足し</span>" : '') + "<span class='q'>" + esc(scaleQ(i.q, st.srv)) + '</span></li>';
    });
    h += '</ul>' + (need.length ? "<button class='sub2' data-r='shop'>🛒 買い足し " + need.length + ' 品を買い物リストへ</button>' : "<p class='note' style='text-align:center;margin:10px 0 0'>🎉 足りない食材なし！今すぐ作れるよ</p>") + '</div>';
    h += "<div class='card'><div class='ct'>👩‍🍳 作り方</div><ol class='steps'>" + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>';
    h += "<button class='big' data-r='made'>📷 作った！写真を投稿する<small>みんなのごはんに載るよ</small></button>";
    h += "<div class='acts'><button class='mini" + (fav ? ' on' : '') + "' data-r='fav'>" + (fav ? '❤️ お気に入り済み' : '🤍 お気に入り') + "</button><button class='mini' data-r='done'>🍽 作った（投稿しない）</button><button class='mini' data-r='again'>🎰 もう一回まわす</button><button class='mini' data-r='posts'>👀 みんなの" + esc(r.name.length > 6 ? 'ごはん' : r.name) + '</button></div>';
    h += "<button class='sub2' data-r='close' style='border-color:var(--line);color:var(--sub)'>とじる</button></div>";
    return h;
  }
  ov.innerHTML = html(); document.body.appendChild(ov);
  ov.addEventListener('click', function (e) {
    if (e.target === ov) { ov.remove(); return; }
    var b = e.target.closest('[data-srv],[data-r]'); if (!b) return;
    var s = b.getAttribute('data-srv');
    if (s) { st.srv = Math.max(1, Math.min(6, st.srv + +s)); saveAll(); ov.innerHTML = html(); return; }
    var a = b.getAttribute('data-r');
    if (a === 'close') ov.remove();
    else if (a === 'fav') { var i = st.fav.indexOf(r.id); if (i >= 0) st.fav.splice(i, 1); else st.fav.unshift(r.id); saveAll(); ov.innerHTML = html(); toast(i >= 0 ? 'お気に入りから外したよ' : 'お気に入りに入れたよ ❤️'); }
    else if (a === 'shop') { addShop(r); ov.innerHTML = html(); }
    else if (a === 'done') { markMade(r); ov.innerHTML = html(); toast('作った記録に入れたよ 🍽'); }
    else if (a === 'made') { ov.remove(); openPost(r); }
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
function makeWeek() {
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
  var h = header('マイページ', 'お気に入りと、作ったごはんの記録');
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
    L.innerHTML = ps.map(postHtml).join('');
  }).catch(function () { L.innerHTML = "<div class='empty'><i>📡</i>読み込めなかった。通信を確認してね</div>"; });
}
function postHtml(p) {
  var r = byId[p.recipe_id];
  return "<div class='post' data-pid='" + esc(p.id) + "'><div class='ph'><img loading='lazy' alt='' src='" + esc(p.photo) + "'>" + (r ? "<button class='rt' data-open='" + r.id + "' style='border:0'>" + r.emoji + ' ' + esc(r.name) + ' のレシピ ›</button>' : '') + "</div><div class='bd2'><div class='who'><span class='av'>" + esc(p.avatar || '🍙') + '</span>' + esc(p.name || 'ななしさん') + '<small>' + ago(p.t) + '</small></div>' + (p.caption ? "<div class='cap'>" + esc(p.caption) + '</div>' : '') +
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
    if (a === 'report') { var why = prompt('通報の理由を書いてね（例: 食べ物と関係ない写真、いやがらせ など）'); if (why === null) return; window.FEED.report(id, why).then(function () { toast('通報したよ。運営が24時間以内に確認するね'); }); }
    else if (a === 'block') { if (!confirm('この人をブロックする？この人の投稿とコメントが見えなくなるよ')) return; window.FEED.block(uid).then(function () { toast('ブロックしたよ'); loadFeed(); }); }
    else if (a === 'del') { if (!confirm('この投稿を消す？')) return; window.FEED.remove(id).then(function () { toast('消したよ'); loadFeed(); }); }
  });
}

// ---- 投稿 ----
var postFor = null, postImg = null;
function openPost(r) {
  postFor = r; postImg = null;
  var ov = document.createElement('div'); ov.className = 'ov'; ov.id = 'postOv';
  ov.innerHTML = "<div class='sheet'><h2>📷 作ったごはんを投稿</h2><p class='note' style='text-align:center'>" + r.emoji + ' ' + esc(r.name) + "</p><button class='pv' id='pv'><i>📷</i>タップして写真をえらぶ</button><textarea class='tx' id='ptx' maxlength='200' placeholder='ひとこと（例: はじめて作ったけど大成功！）'></textarea>" +
    "<p class='note'>投稿すると、このアプリを使っている全員が見られるよ。顔や住所がわかる写真はやめてね。食べ物と関係ない写真・いやがらせは削除されるよ。</p><button class='big' id='pgo'>投稿する</button><button class='sub2' id='pno' style='border-color:var(--line);color:var(--sub)'>やめる</button></div>";
  document.body.appendChild(ov);
  $('pv').onclick = function () { var c = $('cam'); c.value = ''; c.click(); };
  $('pno').onclick = function () { ov.remove(); };
  $('pgo').onclick = function () {
    if (!postImg) { toast('写真をえらんでね'); return; }
    var b = $('pgo'); b.disabled = true; b.textContent = '投稿中…';
    window.FEED.post({ recipe_id: r.id, caption: $('ptx').value.trim(), image: postImg }).then(function () {
      markMade(r); ov.remove(); confetti(); toast('投稿したよ！🎉'); feedSort = 'new'; feedRecipe = null; st.tab = 'feed'; render();
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
    c.toBlob(function (bl) { postImg = bl; var pv = $('pv'); if (pv) pv.innerHTML = "<img alt='' src='" + c.toDataURL('image/jpeg', .8) + "'>"; }, 'image/jpeg', .85);
  };
  im.src = u;
});

// ---- タップの受け付け ----
document.addEventListener('click', function (e) {
  var t = e.target, b;
  if ((b = t.closest('.nav [data-tab]'))) { st.tab = b.getAttribute('data-tab'); if (st.tab !== 'feed') feedRecipe = null; render(); return; }
  if ((b = t.closest('[data-cat]'))) { st.cat = b.getAttribute('data-cat'); render(); return; }
  if ((b = t.closest('[data-food]'))) { var n = b.getAttribute('data-food'), i = st.picked.indexOf(n); if (i >= 0) st.picked.splice(i, 1); else st.picked.push(n); saveAll(); var y = window.scrollY; render(); window.scrollTo(0, y); buzz(); return; }
  if ((b = t.closest('[data-add]'))) { var q = b.getAttribute('data-add').trim().slice(0, 20); if (q && st.picked.indexOf(q) < 0) st.picked.push(q); saveAll(); var y2 = window.scrollY; render(); window.scrollTo(0, y2); buzz(); var hn = customHits(q); toast(hn ? '「' + q + '」を追加したよ（' + hn + '品）' : '「' + q + '」を追加したよ。使うレシピはまだ少ないかも'); return; }
  if ((b = t.closest('[data-fc]'))) { st.flt.cat = b.getAttribute('data-fc'); saveAll(); keep(); return; }
  if ((b = t.closest('[data-fm]'))) { st.flt.min = +b.getAttribute('data-fm'); saveAll(); keep(); return; }
  if ((b = t.closest('[data-fg]'))) { st.flt.genre = b.getAttribute('data-fg'); saveAll(); keep(); return; }
  if ((b = t.closest('[data-open]'))) { openRecipe(b.getAttribute('data-open')); return; }
  if ((b = t.closest('[data-fs]'))) { var v = b.getAttribute('data-fs'); if (v === 'all') feedRecipe = null; else feedSort = v; render(); return; }
  if ((b = t.closest('[data-like]'))) { var id = b.getAttribute('data-like'), on = b.classList.contains('on'), nn = parseInt(b.textContent.replace(/\D/g, ''), 10) || 0; b.classList.toggle('on', !on); b.textContent = (on ? '🤍 ' : '❤️ ') + Math.max(0, nn + (on ? -1 : 1)); buzz(); window.FEED.like(id, !on).catch(function () { toast('いいねできなかった'); }); return; }
  if ((b = t.closest('[data-cmt]'))) { var box = document.querySelector("[data-cbox='" + b.getAttribute('data-cmt') + "']"); if (box) openComments(b.getAttribute('data-cmt'), box); return; }
  if ((b = t.closest('[data-csend]'))) { var inp = b.parentNode.querySelector('input'), tx = inp.value.trim(), pid = b.getAttribute('data-csend'); if (!tx) return; b.disabled = true; window.FEED.comment(pid, tx).then(function () { var bx = document.querySelector("[data-cbox='" + pid + "']"); bx.hidden = true; openComments(pid, bx); var cb = document.querySelector("[data-cmt='" + pid + "']"); if (cb) cb.textContent = '💬 ' + ((parseInt(cb.textContent.replace(/\D/g, ''), 10) || 0) + 1); }).catch(function (er) { b.disabled = false; toast(er && er.message ? er.message : '送れなかった'); }); return; }
  if ((b = t.closest('[data-more]'))) { moreMenu(b.getAttribute('data-more'), b.getAttribute('data-uid')); return; }
  if ((b = t.closest('[data-sc]'))) { var x = st.shop[+b.getAttribute('data-sc')]; if (x) { x.done = b.checked; saveAll(); render(); } return; }
  if ((b = t.closest('[data-sx]'))) { st.shop.splice(+b.getAttribute('data-sx'), 1); saveAll(); render(); return; }
  if ((b = t.closest('[data-act]'))) {
    var a = b.getAttribute('data-act');
    if (a === 'spin') openSpin();
    else if (a === 'week') openWeek();
    else if (a === 'clear') { st.picked = []; saveAll(); render(); }
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
