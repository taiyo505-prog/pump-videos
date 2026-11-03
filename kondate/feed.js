// みんなのごはん（投稿・いいね・コメント・通報・ブロック）の読み書き
// サーバー（Supabase）の設定が入っていればサーバーへ、なければ端末の中だけで動く「おためし版」になる
(function () {
'use strict';
var cfg = window.KONDATE_CONFIG || {};
var LS = 'kd-feed-local', BL = 'kd-blocked', ME = 'kd-me';
function get(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function put(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
var AV = ['🍙', '🍳', '🥕', '🍅', '🧅', '🍓', '🥐', '🍮', '🐣', '🐱'];
// 名前は自動（例: もぐもぐ#4821）。個人情報を出さないため
function me() { var m = get(ME, null); if (!m) { m = { id: 'local-' + Math.random().toString(36).slice(2), name: ['もぐもぐ', 'ぱくぱく', 'ことこと', 'じゅうじゅう', 'ほかほか'][Math.floor(Math.random() * 5)] + '#' + (1000 + Math.floor(Math.random() * 9000)), avatar: AV[Math.floor(Math.random() * AV.length)] }; put(ME, m); } return m; }
var blocked = get(BL, []);
function ng(t) { return /(死ね|しね|殺す|ころす|きもい|ブス|バカ|ばか|http|www\.)/i.test(t || ''); }

// ---- 端末の中だけで動く版（サーバーの設定がないとき） ----
var local = {
  list: function (o) {
    var l = get(LS, []).filter(function (p) { return blocked.indexOf(p.user_id) < 0; });
    if (o.recipe) l = l.filter(function (p) { return p.recipe_id === o.recipe; });
    if (o.sort === 'hot') { var wk = Date.now() - 7 * 864e5; l = l.filter(function (p) { return p.t > wk; }).sort(function (a, b) { return b.likes - a.likes; }); }
    else l.sort(function (a, b) { return b.t - a.t; });
    return Promise.resolve(l);
  },
  post: function (p) {
    var m = me();
    return new Promise(function (res) { var r = new FileReader(); r.onload = function () { var l = get(LS, []); l.unshift({ id: 'p' + Date.now(), user_id: m.id, name: m.name, avatar: m.avatar, recipe_id: p.recipe_id, caption: p.caption, photo: r.result, t: Date.now(), likes: 0, liked: false, comments: 0, cm: [] }); put(LS, l.slice(0, 30)); res(); }; r.readAsDataURL(p.image); });
  },
  like: function (id, on) { var l = get(LS, []); l.forEach(function (p) { if (p.id === id) { p.liked = on; p.likes = Math.max(0, (p.likes || 0) + (on ? 1 : -1)); } }); put(LS, l); return Promise.resolve(); },
  comments: function (id) { var p = get(LS, []).filter(function (x) { return x.id === id; })[0]; return Promise.resolve(p ? (p.cm || []) : []); },
  comment: function (id, text) { if (ng(text)) return Promise.reject(new Error('その言葉は送れないよ')); var m = me(), l = get(LS, []); l.forEach(function (p) { if (p.id === id) { (p.cm = p.cm || []).push({ name: m.name, text: text }); p.comments = p.cm.length; } }); put(LS, l); return Promise.resolve(); },
  report: function () { return Promise.resolve(); },
  block: function (uid) { if (uid && blocked.indexOf(uid) < 0) blocked.push(uid); put(BL, blocked); return Promise.resolve(); },
  unblockAll: function () { blocked = []; put(BL, blocked); return Promise.resolve(); },
  remove: function (id) { put(LS, get(LS, []).filter(function (p) { return p.id !== id; })); return Promise.resolve(); },
  me: function () { return me().id; }
};

window.FEED = local;
// サーバー版は supabase の設定が入ったら feed-cloud.js が window.FEED を差し替える
})();
