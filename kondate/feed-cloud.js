// みんなのごはん（サーバー版）: config.js に Supabase の URL とキーが入っているときだけ、window.FEED をサーバー版に差し替える
(function () {
'use strict';
var cfg = window.KONDATE_CONFIG || {}, L = window.FEED_LOCAL;
if (!cfg.url || !cfg.key || !window.supabase || !L) return;
var sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kd-auth' } });
var uid = null;
// 名前もメアドもいらない「ゲスト」としてサーバーに入る（端末ごとにIDができる）
var ready = sb.auth.getSession().then(function (r) {
  var s = r.data && r.data.session;
  if (s) return s;
  return sb.auth.signInAnonymously().then(function (x) { if (x.error) throw x.error; return x.data.session; });
}).then(function (s) { uid = s.user.id; return uid; });
ready.catch(function () {});
function need() { return ready.catch(function () { throw new Error('サーバーにつながらなかった。通信を確認してね'); }); }
function chk(r) { if (r.error) { var m = r.error.message || ''; throw new Error(/[ぁ-んァ-ン]/.test(m) ? m.replace(/^.*?ERROR:\s*/, '') : '通信がうまくいかなかった。もう一回ためしてね'); } return r.data; }
function url(path) { return sb.storage.from('photos').getPublicUrl(path).data.publicUrl; }

window.FEED = {
  cloud: true,
  list: function (o) {
    return ready.catch(function () {}).then(function () {
      var q = sb.from('posts').select('id,user_id,name,avatar,recipe_id,caption,photo_path,likes,comments,created_at');
      if (o.recipe) q = q.eq('recipe_id', o.recipe);
      if (o.sort === 'hot') q = q.gte('created_at', new Date(Date.now() - 7 * 864e5).toISOString()).order('likes', { ascending: false }).order('created_at', { ascending: false });
      else q = q.order('created_at', { ascending: false });
      return q.limit(60);
    }).then(chk).then(function (rows) {
      var bl = L.blocked();
      rows = rows.filter(function (p) { return bl.indexOf(p.user_id) < 0; });
      var ps = rows.map(function (p) { return { id: p.id, user_id: p.user_id, name: p.name, avatar: p.avatar, recipe_id: p.recipe_id, caption: p.caption, photo: url(p.photo_path), t: Date.parse(p.created_at), likes: p.likes, comments: p.comments, liked: false }; });
      if (!uid || !ps.length) return ps;
      return sb.from('likes').select('post_id').eq('user_id', uid).in('post_id', ps.map(function (p) { return p.id; })).then(function (r) {
        var on = {}; (r.data || []).forEach(function (x) { on[x.post_id] = 1; });
        ps.forEach(function (p) { p.liked = !!on[p.id]; });
        return ps;
      });
    });
  },
  post: function (p) {
    var m = L.me(), path;
    return need().then(function () {
      path = uid + '/' + Date.now() + '.jpg';
      return sb.storage.from('photos').upload(path, p.image, { contentType: 'image/jpeg', upsert: false });
    }).then(chk).then(function () {
      return sb.from('posts').insert({ name: m.name, avatar: m.avatar, recipe_id: p.recipe_id, caption: (p.caption || '').slice(0, 200), photo_path: path });
    }).then(function (r) {
      if (r.error) { sb.storage.from('photos').remove([path]); }
      return chk(r);
    });
  },
  like: function (id, on) {
    return need().then(function () {
      return on ? sb.from('likes').insert({ post_id: id }) : sb.from('likes').delete().eq('post_id', id).eq('user_id', uid);
    }).then(function (r) { if (r.error && r.error.code !== '23505') chk(r); });
  },
  comments: function (id) {
    return sb.from('comments').select('user_id,name,text,created_at').eq('post_id', id).order('created_at', { ascending: true }).limit(200).then(chk).then(function (cs) {
      var bl = L.blocked(); return cs.filter(function (c) { return bl.indexOf(c.user_id) < 0; });
    });
  },
  comment: function (id, text) {
    if (L.ng(text)) return Promise.reject(new Error('その言葉は送れないよ'));
    var m = L.me();
    return need().then(function () { return sb.from('comments').insert({ post_id: id, name: m.name, text: String(text).slice(0, 200) }); }).then(chk);
  },
  report: function (id, why) {
    return need().then(function () { return sb.from('reports').insert({ post_id: id, reason: String(why || '').slice(0, 200) }); }).then(function (r) { if (r.error && r.error.code !== '23505') chk(r); });
  },
  block: L.block,
  unblockAll: L.unblockAll,
  remove: function (id) {
    var path;
    return need().then(function () { return sb.from('posts').select('photo_path').eq('id', id).single(); }).then(function (r) {
      path = r.data && r.data.photo_path;
      return sb.from('posts').delete().eq('id', id).eq('user_id', uid);
    }).then(chk).then(function () { if (path) return sb.storage.from('photos').remove([path]); });
  },
  me: function () { return uid; }
};
})();
