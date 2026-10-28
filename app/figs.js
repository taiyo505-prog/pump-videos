// 種目のイラスト（動く人の図）。種目名 → 動きの型（start と end の2つのポーズ）＋道具。
// 立体で考える: x=前後（人は +x を向く）, y=上下（下が +、床は y=92）, z=左右（手前が +）。少し斜め前・上から見て描く。
// 腕・脚の向きは [θ, φ]: θ は横から見た向き（0°=下, 90°=前, 180°=上, 270°=後ろ）、φ は体の外へ開く角度（横に開く動き）。
// 手首・足首の位置 [x, y, z] を決めて、肘・ひざを自然に曲げることもできる（w / k）。
window.PUMP_FIGS = (function () {
'use strict';
var L = { T: 26, U: 13, F: 12.5, H: 17, S: 17, N: 7.5, R: 5.4, SW: 7, HW: 4.5 }, FLOOR = 92, RAD = Math.PI / 180;
function dir(th, ph, side) { var a = th * RAD, b = (ph || 0) * RAD; return [Math.sin(a) * Math.cos(b), Math.cos(a) * Math.cos(b), side * Math.sin(b)]; }
function add(p, v, l) { return [p[0] + v[0] * l, p[1] + v[1] * l, p[2] + v[2] * l]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function len(a) { return Math.sqrt(dot(a, a)); }
function nrm(a) { var l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
// 2本の骨で root から target へ。hint の向きに関節を曲げる
function ik(r, t, l1, l2, hint) {
  var d = sub(t, r), dist = len(d), u = nrm(d);
  if (dist > l1 + l2 - 0.05) { dist = l1 + l2 - 0.05; t = add(r, u, dist); }
  if (dist < Math.abs(l1 - l2) + 0.05) { dist = Math.abs(l1 - l2) + 0.05; t = add(r, u, dist); }
  var a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  var n = sub(hint, [u[0] * dot(hint, u), u[1] * dot(hint, u), u[2] * dot(hint, u)]);
  if (len(n) < 1e-3) n = [0, 0, 1];
  return [add(add(r, u, a), nrm(n), h), t];
}
function ang(x) { return typeof x === 'number' ? [x, 0] : (x || [0, 0]); }
// ポーズ → 関節の位置（立体）
function fk(q) {
  var t = q.t == null ? 180 : q.t, tl = q.tl || 0, P = [q.p[0], q.p[1], q.p[2] || 0];
  var td = [Math.sin(t * RAD) * Math.cos(tl * RAD), Math.cos(t * RAD) * Math.cos(tl * RAD), Math.sin(tl * RAD)];
  var S = add(P, td, L.T - (q.sh ? -q.sh : 0)), hd = q.h == null ? td : dir(q.h, 0, 1), H = add(S, hd, L.N);
  var fr = dir((q.h == null ? t : q.h) - 90, 0, 1), o = { P: P, S: S, H: H, hd: hd, fr: fr };
  [[1, 'a', 'w', 'wh'], [-1, 'b', 'w2', 'wh2']].forEach(function (c) {
    var s = c[0], i = s > 0 ? '1' : '2', Sh = [S[0], S[1], S[2] + s * L.SW], spec = q[c[1]], tg = q[c[2]];
    if (s < 0 && spec == null && tg == null) { spec = q.a; tg = q.w ? [q.w[0], q.w[1], -(q.w[2] == null ? 8.5 : q.w[2])] : null; }
    var E, W;
    if (tg) { var hint = q[c[3]] || (s < 0 && q.wh ? [q.wh[0], q.wh[1], -q.wh[2]] : [-0.3, 1, s * 0.8]); var r = ik(Sh, [tg[0], tg[1], tg[2] == null ? s * 8.5 : tg[2]], L.U, L.F, hint); E = r[0]; W = r[1]; }
    else { var u = ang((spec || [0, 0])[0]), f = ang((spec || [0, 0])[1]), off = q.ar ? t - 180 : 0; E = add(Sh, dir(u[0] + off, u[1], s), L.U); W = add(E, dir(f[0] + off, f[1], s), L.F); }
    o['S' + i] = Sh; o['E' + i] = E; o['W' + i] = W;
  });
  [[1, 'l', 'k', 'kh'], [-1, 'm', 'k2', 'kh2']].forEach(function (c) {
    var s = c[0], i = s > 0 ? '1' : '2', Hp = [P[0], P[1], P[2] + s * L.HW], spec = q[c[1]], tg = q[c[2]];
    if (s < 0 && spec == null && tg == null) { spec = q.l; tg = q.k ? [q.k[0], q.k[1], -(q.k[2] == null ? 5 : q.k[2]), q.k[3]] : null; }
    var K, A, fa;
    if (tg) { var hint = q[c[3]] || (s < 0 && q.kh ? [q.kh[0], q.kh[1], -q.kh[2]] : [1, 0, s * 0.25]); var r = ik(Hp, [tg[0], tg[1], tg[2] == null ? s * 5 : tg[2]], L.H, L.S, hint); K = r[0]; A = r[1]; fa = tg[3]; }
    else { var th = ang((spec || [0, 0])[0]), sh = ang((spec || [0, 0])[1]); K = add(Hp, dir(th[0], th[1], s), L.H); A = add(K, dir(sh[0], sh[1], s), L.S); fa = spec && spec[2]; }
    o['P' + i] = Hp; o['K' + i] = K; o['A' + i] = A; o['T' + i] = add(A, dir(fa == null ? 90 : fa, 0, 1), 4.5);
  });
  return o;
}
function lerpJ(a, b, k) { var o = {}; for (var n in a) o[n] = [a[n][0] + (b[n][0] - a[n][0]) * k, a[n][1] + (b[n][1] - a[n][1]) * k, a[n][2] + (b[n][2] - a[n][2]) * k]; return o; }
// ポーズ同士を数字ごとに混ぜる（腕が弧を描いて動く）。形がちがうときは関節の位置を混ぜる
var DEF = { tl: 0, sh: 0, t: 180 };
function lerpQ(a, b, k) {
  var o = {}, ok = true;
  Object.keys(a).concat(Object.keys(b)).forEach(function (n) {
    if (n in o) return; var x = a[n], y = b[n];
    if (x === undefined && n in DEF) x = DEF[n]; if (y === undefined && n in DEF) y = DEF[n];
    if (x === undefined || y === undefined) { if (x !== undefined && typeof x !== 'number' || y !== undefined && typeof y !== 'number') ok = false; o[n] = x === undefined ? y : x; return; }
    o[n] = mix(x, y, k); if (o[n] === null) ok = false;
  });
  return ok ? o : null;
  function mix(x, y, k) {
    if (typeof x === 'number' && typeof y === 'number') return x + (y - x) * k;
    if (Array.isArray(x) && Array.isArray(y) && x.length === y.length) { var r = []; for (var i = 0; i < x.length; i++) { var v = (x[i] == null && y[i] == null) ? x[i] : (x[i] == null || y[i] == null) ? null : mix(typeof x[i] === 'number' && Array.isArray(y[i]) ? [x[i], 0] : x[i], typeof y[i] === 'number' && Array.isArray(x[i]) ? [y[i], 0] : y[i], k); if (v === null && !(x[i] == null && y[i] == null)) return null; r.push(v); } return r; }
    return null;
  }
}
function pose(m, k) {
  if (!m._a) { m._a = fk(m.a); m._b = fk(m.b); }
  var q = lerpQ(m.a, m.b, k);
  return q ? fk(q) : lerpJ(m._a, m._b, k);
}

// ---- 描く（立体 → 画面） ----
var YAW = 40 * RAD, EL = 22 * RAD, CY = Math.cos(YAW), SY = Math.sin(YAW), CE = Math.cos(EL), SE = Math.sin(EL), SC = 0.9;
function pj(p) { var X = p[0] - 50, z = p[2] || 0; return [50 + (X * CY - z * SY) * SC, 47 + ((p[1] - 50) * CE + (X * SY + z * CY) * SE) * SC]; }
function dep(p) { return (p[0] - 50) * SY + (p[2] || 0) * CY - p[1] * 0.02; }
var C = { near: '#f4f4f6', far: '#a3a4b0', torso: '#e8e8ee', hair: '#2f3038', eye: '#16161a', eq: '#ff5a1f', eqd: '#c2410c', pr: '#3a3d47', prT: '#545866', prS: '#2b2d35', fl: '#23252b', cab: '#9a9aa6', arw: 'rgba(255,140,80,.85)' };
function f1(n) { return Math.round(n * 10) / 10; }
function ln(a, b, w, c, extra) { return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"' + (extra || '') + '/>'; }
function poly(pts, c, extra) { return '<polygon points="' + pts.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="' + c + '"' + (extra || '') + '/>'; }
function circ(p, r, c) { return '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + f1(r) + '" fill="' + c + '"/>'; }
// 立体の円（板・プレート）: 中心・半径・面の向き（'z' は z に垂直な板 = 横から見たプレート）
function disc(c, r, axis, col, n) { var pts = []; n = n || 14; for (var i = 0; i < n; i++) { var a = i / n * 2 * Math.PI, q = axis === 'z' ? [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), c[2]] : axis === 'x' ? [c[0], c[1] + r * Math.sin(a), c[2] + r * Math.cos(a)] : [c[0] + r * Math.cos(a), c[1], c[2] + r * Math.sin(a)]; pts.push(pj(q)); } return poly(pts, col); }
function box(x0, y0, x1, y1, z0, z1) {
  var P = function (x, y, z) { return pj([x, y, z]); };
  return poly([P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], C.prS) + poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], C.pr) + poly([P(x0, y0, z0), P(x1, y0, z0), P(x1, y0, z1), P(x0, y0, z1)], C.prT);
}
function slab(x0, y0, x1, y1, zw, th) { // 斜めの板（ベンチの背もたれなど）
  var d = [x1 - x0, y1 - y0], l = Math.sqrt(d[0] * d[0] + d[1] * d[1]) || 1, n = [d[1] / l * (th || 3), -d[0] / l * (th || 3)];
  if (n[1] < 0) n = [-n[0], -n[1]];
  var P = function (x, y, z) { return pj([x, y, z]); };
  return poly([P(x0, y0, zw), P(x1, y1, zw), P(x1 + n[0], y1 + n[1], zw), P(x0 + n[0], y0 + n[1], zw)], C.pr) + poly([P(x0, y0, -zw), P(x1, y1, -zw), P(x1, y1, zw), P(x0, y0, zw)], C.prT);
}
// 置いてある物: ['b',x0,y0,x1,y1,zw] 箱 / ['s',x0,y0,x1,y1,zw] 斜めの板 / ['l',x0,y0,x1,y1,w,z] 棒 / ['L',x0,y0,z0,x1,y1,z1,w] 立体の棒 / ['t',x,z,top] ケーブルの柱 / ['d',x,y,z,r,axis] 円盤
function props(pr) {
  return (pr || []).map(function (x) {
    if (x[0] === 'b') return box(x[1], x[2], x[3], x[4], -(x[5] || 9), x[5] || 9);
    if (x[0] === 's') return slab(x[1], x[2], x[3], x[4], x[5] || 9, x[6]);
    if (x[0] === 'l') { var z = x[6] || 0; return ln(pj([x[1], x[2], z]), pj([x[3], x[4], z]), x[5] || 2, C.pr); }
    if (x[0] === 'L') return ln(pj([x[1], x[2], x[3]]), pj([x[4], x[5], x[6]]), x[7] || 2, C.prT);
    if (x[0] === 't') return box(x[1] - 2.5, x[3] || 4, x[1] + 2.5, FLOOR, x[2] - 2.5, x[2] + 2.5);
    if (x[0] === 'd') return disc([x[1], x[2], x[3]], x[4], x[5] || 'z', C.prT);
    return '';
  }).join('');
}
// 体と道具を、奥から順に描く
function scene(j, eq, m) {
  var L2 = [], put = function (d, s) { L2.push([d, s]); };
  var sideCol = function (s) { return s > 0 ? C.near : C.far; };
  [[1, '1'], [-1, '2']].forEach(function (c) {
    var s = c[0], i = c[1], col = sideCol(s);
    put(dep(j['K' + i]) - 0.5 * s * 0 - (s < 0 ? 3 : 0), ln(pj(j['P' + i]), pj(j['K' + i]), 5.2, col));
    put(dep(j['A' + i]) - (s < 0 ? 3 : 0), ln(pj(j['K' + i]), pj(j['A' + i]), 4.6, col) + ln(pj(j['A' + i]), pj(j['T' + i]), 3.6, col));
    put(dep(j['E' + i]) - (s < 0 ? 3 : 0) + 0.2, ln(pj(j['S' + i]), pj(j['E' + i]), 4.8, col));
    put(dep(j['W' + i]) - (s < 0 ? 3 : 0) + 0.3, ln(pj(j['E' + i]), pj(j['W' + i]), 4.2, col) + circ(pj(j['W' + i]), 2.4, col));
  });
  var tor = poly([pj(j.S1), pj(j.S2), pj(j.P2), pj(j.P1)], C.torso) + ln(pj(j.S1), pj(j.S2), 5, C.torso) + ln(pj(j.P1), pj(j.P2), 5, C.torso) + ln(pj(j.S), pj(add(j.S, j.hd, 3)), 3.4, C.torso);
  put(dep(j.P) * 0.5 + dep(j.S) * 0.5, tor);
  // 頭: 髪（後ろ）と顔（前）と目
  var H = j.H, fr = j.fr, up = j.hd, facing = dep(add(H, fr, 1)) - dep(H) > -0.15;
  var hair = circ(pj(add(add(H, fr, -1.2), up, 1.1)), L.R * 0.95 * SC, C.hair), face = circ(pj(add(H, fr, 0.5)), L.R * 0.9 * SC, C.near);
  var eyes = ''; [2.1, -2.1].forEach(function (z) { var e = add(add(H, fr, L.R * 0.75), up, 0.7); e = [e[0], e[1], e[2] + z]; if (dep(e) - dep(H) > -1.2) eyes += circ(pj(e), 0.85, C.eye); });
  put(dep(H) + 0.1, facing ? hair + face + eyes : face + hair);
  equip(eq, j, m, put);
  L2.sort(function (a, b) { return a[0] - b[0]; });
  return L2.map(function (x) { return x[1]; }).join('');
}
function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; }
function equip(eq, j, m, put) {
  if (!eq) return;
  var M2 = mid(j.W1, j.W2);
  function bar(c, half, pz, pr) {
    var a = [c[0], c[1], -half], b = [c[0], c[1], half];
    put(dep(a), ln(pj(a), pj(c), 2, C.eqd) + disc([c[0], c[1], -pz], pr, 'z', C.eqd) + disc([c[0], c[1], -pz - 2], pr * 0.8, 'z', C.eqd));
    put(dep(b) + 2, ln(pj(c), pj(b), 2, C.eq) + disc([c[0], c[1], pz], pr, 'z', C.eq) + disc([c[0], c[1], pz + 2], pr * 0.8, 'z', C.eq));
  }
  function db(w, col, d) { var a = [w[0], w[1], w[2] - 3.8], b = [w[0], w[1], w[2] + 3.8]; put(dep(w) + (d || 0.4), ln(pj(a), pj(b), 1.8, col) + disc(a, 2.7, 'z', col, 6) + disc(b, 2.7, 'z', col, 6)); }
  if (eq === 'bb' || eq === 'smith' || eq === 'trap') bar(M2, 25, 20, 6.8);
  if (eq === 'ez') bar(M2, 18, 14, 5.5);
  if (eq === 'db') { db(j.W1, C.eq); db(j.W2, C.eqd, -0.5); }
  if (eq === 'db1') db(j.W1, C.eq);
  if (eq === 'dbm') { var c0 = M2; put(dep(c0) + 1, ln(pj([c0[0], c0[1] - 4, c0[2]]), pj([c0[0], c0[1] + 4, c0[2]]), 2, C.eq) + disc([c0[0], c0[1] - 4, c0[2]], 3.2, 'y', C.eq, 8) + disc([c0[0], c0[1] + 4, c0[2]], 3.2, 'y', C.eq, 8)); }
  if (eq === 'kb' || eq === 'kb1') { var kc = eq === 'kb' ? [M2[0], M2[1] + 4, M2[2]] : [j.W1[0], j.W1[1] + 4, j.W1[2]]; put(dep(kc) + 1, circ(pj(kc), 4.2 * SC, C.eq) + '<circle cx="' + f1(pj([kc[0], kc[1] - 4, kc[2]])[0]) + '" cy="' + f1(pj([kc[0], kc[1] - 4, kc[2]])[1]) + '" r="2" fill="none" stroke="' + C.eq + '" stroke-width="1.6"/>'); }
  if (eq === 'mb') put(dep(M2) + 1, circ(pj(M2), 5 * SC, C.eq));
  if (eq === 'plate') put(dep(M2) + 1, disc(M2, 6.5, 'z', C.eq));
  if (eq === 'wheel') put(dep(M2) + 1, disc([M2[0], M2[1] + 1, M2[2]], 4.5, 'z', C.eq) + ln(pj([M2[0], M2[1] + 1, -6]), pj([M2[0], M2[1] + 1, 6]), 1.6, C.eq));
  if (eq === 'hd' || eq === 'vh') { put(dep(j.W1) + 0.5, circ(pj(j.W1), 2.3, C.eq)); put(dep(j.W2) + 0.5, circ(pj(j.W2), 2.3, C.eqd)); }
  if (eq === 'lm') { var pv = m.piv || [98, 91, 0], tip = add(M2, nrm(sub(M2, pv)), 4); put(dep(M2) - 0.5, ln(pj(pv), pj(tip), 2.4, C.eq) + disc(add(M2, nrm(sub(pv, M2)), 5), 6, 'z', C.eqd)); }
  if (eq === 'sled') { var fa = mid(j.A1, j.A2), lg = nrm(sub(fa, j.P)), pn = [-lg[1], lg[0], 0], c1 = add(fa, lg, 2.5); var q4 = [add(add(c1, pn, 10), [0, 0, 1], 10), add(add(c1, pn, -10), [0, 0, 1], 10), add(add(c1, pn, -10), [0, 0, 1], -10), add(add(c1, pn, 10), [0, 0, 1], -10)]; put(dep(fa) - 6, poly(q4.map(pj), C.prT)); }
  if (eq === 'belt') { var bc = [j.P[0] + 3, j.P[1] + 18, 0]; put(dep(bc), ln(pj(j.P1), pj(bc), 1.2, C.cab) + ln(pj(j.P2), pj(bc), 1.2, C.cab) + disc(bc, 5, 'z', C.eq)); }
  // ケーブル: 柱の滑車 → 手
  if (/^cable|^lb|^rope/.test(eq)) {
    var A = m.anc || [[90, 10, 0]];
    var hands = eq === 'cable1' ? [j.W1] : (eq === 'lb' || eq === 'cablef' || eq === 'rope') ? [M2] : [j.W1, j.W2];
    hands.forEach(function (h, i) { var a = A[Math.min(i, A.length - 1)]; put(Math.min(dep(a), dep(h)) - 0.2, ln(pj(a), pj(h), 1.1, C.cab) + circ(pj(a), 2.2, C.prT)); });
    if (eq === 'lb') put(dep(M2) + 1, ln(pj([M2[0], M2[1], -16]), pj([M2[0], M2[1], 16]), 2.4, C.eq));
    else if (eq === 'cablef') put(dep(M2) + 1, ln(pj(j.W1), pj(j.W2), 2.4, C.eq));
    else if (eq === 'rope') put(dep(M2) + 1, ln(pj(j.W1), pj(M2), 2.2, C.eq) + ln(pj(j.W2), pj(M2), 2.2, C.eqd));
    else hands.forEach(function (h) { put(dep(h) + 0.6, circ(pj(h), 2.2, C.eq)); });
  }
}
// 動く向きの矢印（手・足・腰などの通り道）
function arrow(m, eq) {
  var w = m.arw || (eq === 'db1' || eq === 'cable1' || eq === 'kb1' ? 'W1' : 'W'), pts = [];
  if (w === 'none') return '';
  for (var i = 0; i <= 10; i++) {
    var j = pose(m, i / 10), p = w === 'W' ? mid(j.W1, j.W2) : w === 'A' ? mid(j.A1, j.A2) : w === 'K' ? mid(j.K1, j.K2) : j[w];
    pts.push(pj(p));
  }
  var d0 = Math.hypot(pts[10][0] - pts[0][0], pts[10][1] - pts[0][1]); if (d0 < 3) return '';
  // 体から少し離して、両はしに矢じり
  var off = m.arwo || [6, 0], path = pts.map(function (p) { return [p[0] + off[0], p[1] + off[1]]; });
  function head(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; return poly([[b[0] + dx * 2.4, b[1] + dy * 2.4], [b[0] - dy * 2.2 - dx * 1.4, b[1] + dx * 2.2 - dy * 1.4], [b[0] + dy * 2.2 - dx * 1.4, b[1] - dx * 2.2 - dy * 1.4]], C.arw); }
  return '<polyline points="' + path.slice(1, 10).map(function (p) { return f1(p[0]) + ',' + f1(p[1]); }).join(' ') + '" fill="none" stroke="' + C.arw + '" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2.2 2"/>' + head(path[2], path[1]) + head(path[8], path[9]);
}

// ---- 動きの型 ----
function o(base, x) { var r = {}, n; for (n in base) r[n] = base[n]; for (n in x) r[n] = x[n]; return r; }
var ST = { p: [50, 57], t: 180, l: [0, 0] };                         // 立つ
var SIT = function (x) { return { p: [x, 75], t: 180, l: [90, 0] }; };    // 座る（太もも水平、足は床）
var SEAT = function (x, back) { return [['b', x - 9, 77, x + 11, 80, 9], ['l', x, 80, x, FLOOR, 2]].concat(back === false ? [] : [['s', x - 9, 78, x - 11, 42, 8, 3]]); };
var BENCH = [['b', 18, 69, 68, 73, 8], ['l', 24, 73, 24, FLOOR, 2, 5], ['l', 62, 73, 62, FLOOR, 2, 5]];
var LIE = { p: [60, 66], t: 270, k: [76, 91.5, 6, 90], kh: [0, -1, 0.3] };  // ベンチに仰向け（頭が左）
var FLOORL = { p: [56, 88], t: 270, k: [74, 91.5, 6, 90], kh: [0, -1, 0.3] }; // 床に仰向け・ひざ立て
var EOUT = [0, 1, 1.2], EBACK = [-1, 0.6, 0.4], EUP = [0, -1, 1];
var M = {};

// ---- 胸 ----
M.bench = { a: o(LIE, { w: [35, 40, 15], wh: EOUT }), b: o(LIE, { w: [37, 61, 16], wh: EOUT }), eq: 'bb', pr: BENCH };
var INC = { p: [62, 73], t: 238, h: 230, k: [80, 91.5, 6], kh: [1, -0.2, 0.3] }, INCP = [['s', 66, 76, 33, 54, 8, 3], ['b', 58, 76, 74, 80, 8], ['l', 62, 80, 62, FLOOR, 2]];
M.incl = { a: o(INC, { w: [42, 33, 15], wh: EOUT }), b: o(INC, { w: [45, 54, 16], wh: EOUT }), eq: 'bb', pr: INCP };
var DEC = { p: [60, 62], t: 298, h: 300, k: [82, 72, 6, 100], kh: [0, -1, 0.3] }, DECP = [['s', 70, 65, 28, 83, 8, 3], ['l', 50, 74, 50, FLOOR, 2], ['d', 84, 76, 0, 3, 'x']];
M.decl = { a: o(DEC, { w: [40, 49, 15], wh: EOUT }), b: o(DEC, { w: [40, 68, 16], wh: EOUT }), eq: 'bb', pr: DECP };
M.fly = { a: o(LIE, { a: [[180, 8], [180, 0]] }), b: o(LIE, { a: [[180, 88], [180, 70]] }), eq: 'db', pr: BENCH };
M.inclfly = { a: o(INC, { a: [[168, 8], [168, 0]] }), b: o(INC, { a: [[168, 86], [168, 68]] }), eq: 'db', pr: INCP };
M.declfly = { a: o(DEC, { a: [[190, 8], [190, 0]] }), b: o(DEC, { a: [[190, 88], [190, 70]] }), eq: 'db', pr: DECP };
// ケーブルフライ: 両わきの柱から、腕を大きく開いた所 → 体の前で手を合わせる
M.cfly = { a: o(ST, { a: [[85, 72], [90, 62]] }), b: o(ST, { a: [[60, 22], [55, -32]] }), eq: 'cable', anc: [[38, 12, 30], [38, 12, -30]], pr: [['t', 38, 30, 6], ['t', 38, -30, 6]] };
M.lowfly = { a: o(ST, { a: [[20, 60], [25, 50]] }), b: o(ST, { a: [[75, 22], [110, -30]] }), eq: 'cable', anc: [[38, 86, 30], [38, 86, -30]], pr: [['t', 38, 30, 6], ['t', 38, -30, 6]] };
var SITC = SIT(42);
M.pec = { a: o(SITC, { a: [[90, 82], [180, 0]] }), b: o(SITC, { a: [[90, 12], [180, 0]] }), eq: 'hd', pr: SEAT(42) };
M.cpress = { a: o(SITC, { w: [52, 52, 12], wh: [-1, 0.6, 0.5] }), b: o(SITC, { w: [74, 52, 12], wh: [-1, 0.6, 0.5] }), eq: 'hd', pr: SEAT(42) };
M.icpress = { a: o(SITC, { w: [52, 48, 12], wh: [-1, 0.6, 0.5] }), b: o(SITC, { w: [66, 28, 12], wh: [-1, 0.6, 0.5] }), eq: 'hd', pr: SEAT(42) };
var DIPP = [['L', 30, 46, 12, 74, 46, 12, 2.6], ['L', 30, 46, -12, 74, 46, -12, 2.6], ['l', 70, 46, 70, FLOOR, 2, 12], ['l', 70, 46, 70, FLOOR, 2, -12]];
M.dip = { a: { p: [49, 47], t: 172, h: 170, w: [52, 46, 12], wh: EBACK, l: [10, -45] }, b: { p: [48, 63], t: 160, h: 158, w: [52, 46, 12], wh: EBACK, l: [25, -40] }, pr: DIPP, arw: 'S' };
var PUA = { p: [43.3, 77.4], t: 113.5, l: [293.5, 293.5, 0], w: [68, 91, 11], wh: [-1, -0.3, 0.6] };
M.push = { a: PUA, b: { p: [45.7, 85.4], t: 98, l: [278, 278, 0], w: [68, 91, 11], wh: [-0.4, -1, 1] }, arw: 'S' };
M.dpush = { a: { p: [42, 66], t: 125, l: [288, 288, 0], w: [67, 91, 11], wh: [-1, -0.3, 0.6] }, b: { p: [44, 75], t: 110, l: [284, 284, 0], w: [67, 91, 11], wh: [-0.4, -1, 1] }, pr: [['b', 2, 60, 20, FLOOR, 9]], arw: 'S' };
M.pike = { a: { p: [46, 56], t: 138, h: 140, k: [28, 91.5, 5, 90], kh: [0, -1, 0], w: [66, 91, 10], wh: [-1, -0.3, 0.6] }, b: { p: [46, 60], t: 128, h: 120, k: [28, 91.5, 5, 90], kh: [0, -1, 0], w: [66, 91, 10], wh: [0, -1, 1] }, arw: 'H' };
M.hspu = { a: { p: [55, 40], t: 0, h: 0, l: [180, 180, 180], w: [55, 91, 10], wh: [0, -1, 1] }, b: { p: [55, 52], t: 0, h: 0, l: [180, 180, 180], w: [55, 91, 10], wh: [0, -1, 1.5] }, pr: [['b', 64, 2, 68, FLOOR, 16]], arw: 'H' };
M.pullover = { a: o(LIE, { a: [[180, 6], [175, 0]] }), b: o(LIE, { a: [[262, 6], [266, 0]] }), eq: 'dbm', pr: BENCH };
M.svend = { a: o(ST, { w: [57, 42, 2], wh: [-1, 0.5, 1] }), b: o(ST, { w: [76, 42, 2], wh: [-1, 0.5, 1] }), eq: 'plate' };
M.floor = { a: o(FLOORL, { w: [30, 63, 15], wh: EOUT }), b: o(FLOORL, { w: [31, 81, 17], wh: [0, 1, 1.5] }), eq: 'db' };
M.landmine = { a: o(ST, { w: [57, 30, 3], wh: [0, 1, 0.6] }), b: o(ST, { w: [70, 16, 3], wh: [0, 1, 0.6] }), eq: 'lm', piv: [98, 91, 0], arw: 'W' };

// ---- 背中 ----
var DLB = { p: [42, 70], t: 116, h: 105, k: [53, 91.5, 6], kh: [1, 0, 0.4], w: [62, 84, 10], wh: [0, 0, 1] };
M.dl = { a: DLB, b: o(ST, { k: [52, 91.5, 6], w: [52, 82, 10], wh: [0, 0, 1] }), eq: 'bb', arw: 'P' };
M.rdl = { a: { p: [42, 58], t: 104, h: 95, k: [50, 91.5, 6], kh: [1, 0, 0.3], a: [[0, 6], [0, 0]] }, b: o(ST, { k: [50, 91.5, 6], a: [[0, 6], [0, 0]] }), eq: 'bb', arw: 'P' };
M.rack = { a: { p: [45, 63], t: 140, h: 130, k: [52, 91.5, 6], kh: [1, 0, 0.3], a: [[0, 6], [0, 0]] }, b: o(ST, { k: [52, 91.5, 6], a: [[0, 6], [0, 0]] }), eq: 'bb', pr: [['L', 62, 72, 22, 62, FLOOR, 22, 2.4], ['L', 62, 72, -22, 62, FLOOR, -22, 2.4]], arw: 'P' };
var PBAR = [['L', 50, 9, -24, 50, 9, 24, 2.6], ['l', 50, 9, 50, FLOOR, 2, 24], ['l', 50, 9, 50, FLOOR, 2, -24]];
M.pull = { a: { p: [50, 62], t: 180, h: 175, w: [50, 10, 13], wh: [0, 1, 1], l: [8, -25] }, b: { p: [48, 47], t: 175, h: 170, w: [50, 10, 13], wh: [0.2, 1, 1], l: [12, -30] }, pr: PBAR, arw: 'H' };
M.apull = { a: o(M.pull.a, { l: [80, 0] }), b: o(M.pull.b, { l: [80, 0] }), pr: PBAR.concat([['b', 52, 63, 72, 66, 9]]), arw: 'H' };
var LAT = SIT(42), LATP = SEAT(42, false).concat([['b', 54, 66, 62, 70, 9], ['t', 30, 0, 2]]);
M.lat = { a: o(LAT, { w: [46, 14, 17], wh: [0, 0.3, 1] }), b: o(LAT, { w: [48, 41, 17], wh: [-0.4, 1, 1] }), eq: 'lb', anc: [[44, 4, 0]], pr: LATP };
M.slat = { a: o(ST, { p: [46, 57], t: 162, h: 160, k: [50, 91.5, 6], a: [[150, 8], [150, 4]] }), b: o(ST, { p: [46, 57], t: 162, h: 160, k: [50, 91.5, 6], a: [[8, 8], [8, 4]] }), eq: 'cablef', anc: [[86, 8, 0]], pr: [['t', 88, 0, 4]] };
var BO = { p: [44, 57], t: 112, h: 100, k: [51, 91.5, 6], kh: [1, 0, 0.3] };
M.bor = { a: o(BO, { a: [[0, 8], [0, 0]] }), b: o(BO, { w: [58, 63, 11], wh: [-1, -0.8, 0.4] }), eq: 'bb', piv: [8, 91, 0] };
M.pendlay = { a: o(BO, { p: [42, 62], t: 97, h: 92, a: [[0, 8], [0, 0]] }), b: o(BO, { p: [42, 62], t: 97, h: 92, w: [56, 65, 11], wh: [-1, -0.8, 0.4] }), eq: 'bb' };
var DBR = { p: [38, 57], t: 105, h: 95, k: [50, 91.5, 7], k2: [26, 91.5, -6], b: [[5, 0], [0, 0]] };
M.dbrow = { a: o(DBR, { a: [[0, 4], [0, 0]] }), b: o(DBR, { w: [48, 58, 9], wh: [-1, -0.8, 0.2] }), eq: 'db1', pr: [['b', 56, 68, 84, 72, 9], ['l', 62, 72, 62, FLOOR, 2, 5], ['l', 80, 72, 80, FLOOR, 2, 5]] };
M.srow = { a: { p: [34, 78], t: 150, h: 135, l: [[86, 4], [92, 0], 90], a: [[95, 8], [92, 4]] }, b: { p: [34, 78], t: 188, h: 182, l: [[86, 4], [92, 0], 90], w: [44, 64, 8], wh: [-1, 0.4, 0.5] }, eq: 'cablef', anc: [[94, 80, 0]], pr: [['b', 22, 80, 64, 84, 8], ['b', 70, 72, 74, 86, 10], ['t', 96, 0, 70]] };
M.mrow = { a: o(SITC, { t: 172, a: [[92, 8], [90, 4]] }), b: o(SITC, { w: [48, 56, 11], wh: [-1, 0.2, 0.5] }), eq: 'hd', pr: SEAT(42, false).concat([['s', 62, 66, 60, 44, 8, 3]]) };
var CSR = { p: [40, 66], t: 128, h: 120, k: [42, 91.5, 6], kh: [1, 0, 0.2] }, CSRP = [['s', 40, 69, 64, 50, 8, 3], ['l', 54, 60, 54, FLOOR, 2]];
M.csrow = { a: o(CSR, { a: [[0, 8], [0, 0]] }), b: o(CSR, { w: [52, 56, 11], wh: [-1, -0.8, 0.4] }), eq: 'db', pr: CSRP };
var INV = [['L', 70, 40, -22, 70, 40, 22, 2.6], ['l', 70, 40, 70, FLOOR, 2, 22], ['l', 70, 40, 70, FLOOR, 2, -22]];
M.invrow = { a: { p: [43, 74], t: 104, h: 100, l: [284, 284, 0], w: [70, 41, 13], wh: [0, 1, 1] }, b: { p: [46, 64], t: 98, h: 95, l: [279, 279, 0], w: [70, 41, 13], wh: [-1, 0.5, 1] }, pr: INV, arw: 'S' };
M.shrug = { a: o(ST, { a: [[0, 8], [0, 4]] }), b: o(ST, { sh: 4, a: [[0, 8], [0, 4]] }), eq: 'db', arw: 'S' };
M.bext = { a: { p: [50, 60], t: 20, h: 15, l: [300, 300, 30], a: [[80, 40], [200, -60]] }, b: { p: [50, 60], t: 125, h: 120, l: [300, 300, 30], a: [[220, 40], [340, -60]] }, pr: [['b', 44, 61, 56, 66, 8], ['l', 50, 66, 50, FLOOR, 2], ['L', 30, 82, -8, 30, 82, 8, 3]], arw: 'H' };
M.gm = { a: o(ST, { k: [52, 91.5, 6], w: [47, 32, 16], wh: [-0.3, 1, 1] }), b: o(ST, { t: 98, h: 92, p: [44, 57], k: [50, 91.5, 6], w: [69, 54, 16], wh: [-1, 0.3, 1] }), eq: 'bb', arw: 'H' };
M.face = { a: o(ST, { t: 174, a: [[95, 8], [90, 4]] }), b: o(ST, { t: 176, w: [56, 25, 12], wh: [-0.3, -0.2, 1] }), eq: 'rope', anc: [[90, 25, 0]], pr: [['t', 92, 0, 6]] };
M.rfly = { a: o(BO, { a: [[0, 10], [5, 6]] }), b: o(BO, { a: [[0, 82], [5, 72]] }), eq: 'db' };

// ---- 肩 ----
var SITB = SIT(44), SEATB = SEAT(44);
M.sp = { a: o(SITB, { w: [47, 48, 18], wh: [0, 1, 1] }), b: o(SITB, { w: [47, 22, 12], wh: [0, 1, 1] }), eq: 'db', pr: SEATB };
M.msp = { a: o(SITB, { w: [50, 48, 17], wh: [0, 1, 1] }), b: o(SITB, { w: [50, 23, 13], wh: [0, 1, 1] }), eq: 'hd', pr: SEATB };
M.ohp = { a: o(ST, { w: [55, 31, 14], wh: [0.6, 1, 0.6] }), b: o(ST, { w: [51, 7, 13], wh: [0.3, 1, 0.8] }), eq: 'bb' };
M.bnp = { a: o(ST, { w: [46, 31, 17], wh: [0, 1, 1] }), b: o(ST, { w: [49, 7, 14], wh: [0, 1, 1] }), eq: 'bb' };
M.lraise = { a: o(ST, { a: [[0, 10], [0, 8]] }), b: o(ST, { a: [[0, 86], [0, 80]] }), eq: 'db' };
M.clraise = { a: o(ST, { a: [[0, 10], [0, 8]], b: [[0, 6], [0, 4]] }), b: o(ST, { a: [[0, 86], [0, 80]], b: [[0, 6], [0, 4]] }), eq: 'cable1', anc: [[50, 88, -26]], pr: [['t', 50, -28, 40]] };
M.fraise = { a: o(ST, { a: [[8, 8], [8, 6]] }), b: o(ST, { a: [[95, 8], [95, 6]] }), eq: 'db' };
M.urow = { a: o(ST, { w: [53, 58, 5], wh: [0, -0.3, 1] }), b: o(ST, { w: [54, 32, 5], wh: [0, -1, 1.2] }), eq: 'bb', anc: [[66, 90, 0]], pr: [] };
M.yraise = { a: o(ST, { a: [[10, 12], [10, 10]] }), b: o(ST, { a: [[160, 32], [160, 30]] }), eq: 'db' };

// ---- 腕 ----
M.curl = { a: o(ST, { a: [[6, 10], [8, 8]] }), b: o(ST, { a: [[6, 10], [158, 4]] }), eq: 'db' };
M.bbcurl = { a: o(ST, { a: [[6, 8], [8, 6]] }), b: o(ST, { a: [[6, 8], [158, 4]] }), eq: 'ez' };
M.ccurl = { a: o(ST, { a: [[6, 8], [14, 6]] }), b: o(ST, { a: [[6, 8], [158, 4]] }), eq: 'cablef', anc: [[80, 88, 0]], pr: [['t', 84, 0, 60]] };
M.mcurl = { a: o(SITC, { a: [[60, 10], [70, 6]] }), b: o(SITC, { a: [[60, 10], [196, 4]] }), eq: 'hd', pr: SEAT(42, false).concat([['s', 50, 56, 64, 64, 9, 3]]) };
var ICU = { p: [62, 72], t: 222, h: 210, k: [80, 91.5, 6], kh: [1, -0.2, 0.3] };
M.icurl = { a: o(ICU, { a: [[0, 10], [0, 6]] }), b: o(ICU, { a: [[0, 10], [150, 4]] }), eq: 'db', pr: [['s', 66, 75, 40, 47, 8, 3], ['b', 58, 75, 74, 79, 8], ['l', 62, 79, 62, FLOOR, 2]] };
M.preacher = { a: o(SITC, { a: [[55, 8], [62, 4]] }), b: o(SITC, { a: [[55, 8], [190, 4]] }), eq: 'ez', pr: SEAT(42, false).concat([['s', 46, 50, 60, 62, 9, 3], ['l', 58, 62, 58, FLOOR, 2]]) };
M.conc = { a: { p: [40, 75], t: 145, h: 120, k: [58, 91.5, 10], kh: [1, -0.3, 0.6], a: [[12, -10], [12, -6]], b: [[60, 30], [40, 0]] }, b: { p: [40, 75], t: 145, h: 120, k: [58, 91.5, 10], kh: [1, -0.3, 0.6], a: [[12, -10], [168, -4]], b: [[60, 30], [40, 0]] }, eq: 'db1', pr: [['b', 26, 77, 50, 81, 9]] };
M.spider = { a: o(CSR, { a: [[0, 8], [0, 4]] }), b: o(CSR, { a: [[0, 8], [150, 4]] }), eq: 'ez', pr: CSRP };
M.drag = { a: o(ST, { a: [[6, 8], [8, 6]] }), b: o(ST, { a: [[-35, 10], [165, 4]] }), eq: 'ez' };
M.french = { a: o(SITB, { a: [[176, 10], [176, 8]] }), b: o(SITB, { a: [[176, 10], [-25, 4]] }), eq: 'dbm', pr: SEATB };
M.skull = { a: o(LIE, { a: [[192, 8], [190, 4]] }), b: o(LIE, { a: [[200, 8], [290, 4]] }), eq: 'ez', pr: BENCH };
M.pushdown = { a: o(ST, { t: 176, a: [[-6, 6], [112, 2]] }), b: o(ST, { t: 176, a: [[-6, 6], [4, 2]] }), eq: 'cablef', anc: [[64, 6, 0]], pr: [['t', 68, 0, 2]] };
M.kick = { a: o(BO, { a: [[-75, 6], [0, 2]] }), b: o(BO, { a: [[-75, 6], [-80, 2]] }), eq: 'db' };
M.ckick = { a: o(BO, { a: [[-75, 6], [0, 2]], b: [[10, 0], [5, 0]] }), b: o(BO, { a: [[-75, 6], [-80, 2]], b: [[10, 0], [5, 0]] }), eq: 'cable1', anc: [[86, 88, 8]], pr: [['t', 88, 8, 50]] };
M.cohe = { a: o(ST, { p: [50, 57], t: 155, h: 150, k: [60, 91.5, 6], k2: [40, 91.5, -6], a: [[150, 8], [-20, 4]] }), b: o(ST, { p: [50, 57], t: 155, h: 150, k: [60, 91.5, 6], k2: [40, 91.5, -6], a: [[150, 8], [150, 4]] }), eq: 'rope', anc: [[14, 70, 0]], pr: [['t', 12, 0, 40]] };
M.bdip = { a: { p: [36, 57], t: 180, h: 175, l: [[90, 4], [80, 0], 90], w: [32, 68, 10], wh: [-1, 0, 0.3] }, b: { p: [36, 70], t: 186, h: 178, l: [[78, 4], [60, 0], 90], w: [32, 68, 10], wh: [-1, -0.5, 0.3] }, pr: [['b', 18, 68, 36, 72, 10], ['l', 26, 72, 26, FLOOR, 2]], arw: 'P' };
M.dipm = { a: o(SITB, { w: [52, 52, 15], wh: [-1, -0.6, 0.6] }), b: o(SITB, { w: [50, 70, 15], wh: [-1, -0.2, 0.5] }), eq: 'hd', pr: SEATB };
M.wrist = { a: o(SITC, { t: 155, h: 140, a: [[45, 8], [90, 4]] }), b: o(SITC, { t: 155, h: 140, a: [[45, 8], [100, 4]] }), eq: 'ez', pr: SEAT(42, false), arw: 'none' };
M.farmer = { a: o(ST, { a: [[2, 10], [0, 8]], l: [[18, 0], [0, 0]], m: [[-14, 0], [-6, 0]] }), b: o(ST, { a: [[2, 10], [0, 8]], l: [[-14, 0], [-6, 0]], m: [[18, 0], [0, 0]] }), eq: 'db', arw: 'none' };

// ---- 脚 ----
var SQB = { p: [40, 74], t: 145, h: 125, k: [52, 91.5, 7], kh: [1, 0, 0.5] }, SQT = o(ST, { k: [52, 91.5, 7] });
M.squat = { a: o(SQT, { w: [46, 32, 16], wh: [-0.3, 1, 1] }), b: o(SQB, { w: [52, 55, 16], wh: [-0.3, 1, 1] }), eq: 'bb', arw: 'P' };
M.fsquat = { a: o(SQT, { w: [56, 33, 10], wh: [1, -0.2, 0.6] }), b: o(SQB, { t: 158, w: [60, 53, 10], wh: [1, -0.2, 0.6] }), eq: 'bb', arw: 'P' };
M.goblet = { a: o(SQT, { w: [57, 42, 3], wh: [0, 1, 1] }), b: o(SQB, { t: 158, w: [60, 62, 3], wh: [0, 1, 1] }), eq: 'kb', arw: 'P' };
M.bwsquat = { a: o(SQT, { a: [[90, 6], [90, 4]] }), b: o(SQB, { a: [[100, 6], [92, 4]] }), arw: 'P' };
M.jsquat = { a: o(SQB, { a: [[-30, 6], [-30, 4]] }), b: o(ST, { p: [50, 51], a: [[160, 12], [165, 8]], l: [[5, 0], [15, 0], 60] }), arw: 'P' };
M.hack = { a: { p: [42, 56], t: 162, h: 160, k: [58, 86, 7, 120], kh: [1, -0.2, 0.4], a: [[175, 20], [-60, 0]] }, b: { p: [38, 72], t: 162, h: 160, k: [58, 86, 7, 120], kh: [1, -0.2, 0.4], a: [[175, 20], [-60, 0]] }, pr: [['s', 28, 20, 48, 86, 9, 3], ['s', 50, 88, 72, 80, 10, 2]], arw: 'P' };
M.bss = { a: { p: [46, 56], t: 178, k: [57, 91.5, 6], k2: [22, 67, -5, 260], kh2: [1, 0.3, 0], a: [[0, 8], [0, 6]] }, b: { p: [42, 69], t: 168, k: [57, 91.5, 6], k2: [22, 67, -5, 260], kh2: [0, 1, 0], a: [[0, 8], [0, 6]] }, eq: 'db', pr: [['b', 6, 66, 26, 70, 9], ['l', 16, 70, 16, FLOOR, 2]], arw: 'P' };
M.split = { a: { p: [46, 57], t: 180, k: [60, 91.5, 6], k2: [32, 91.5, -6, 40], a: [[0, 8], [0, 6]] }, b: { p: [44, 70], t: 176, k: [60, 91.5, 6], k2: [32, 91.5, -6, 40], kh2: [0, 1, 0], a: [[0, 8], [0, 6]] }, eq: 'db', arw: 'P' };
M.lunge = { a: o(ST, { a: [[0, 8], [0, 6]] }), b: { p: [52, 70], t: 176, k: [66, 91.5, 6], k2: [36, 91.5, -6, 40], kh2: [0, 1, 0], a: [[0, 8], [0, 6]] }, eq: 'db', arw: 'P' };
M.rlunge = { a: o(ST, { a: [[0, 8], [0, 6]] }), b: { p: [48, 70], t: 176, k: [56, 91.5, 6], k2: [26, 91.5, -6, 40], kh2: [0, 1, 0], a: [[0, 8], [0, 6]] }, eq: 'db', arw: 'P' };
M.slunge = { a: o(ST, { a: [[0, 8], [0, 6]], k: [50, 91.5, 10], k2: [50, 91.5, -10] }), b: { p: [48, 70], t: 165, h: 160, k: [52, 91.5, 24], kh: [1, 0, 0.6], k2: [50, 91.5, -22], kh2: [0, 0, -1], a: [[20, 6], [10, 6]] }, arw: 'P' };
M.stepup = { a: { p: [44, 57], t: 180, k: [44, 91.5, -5], k2: [62, 71.5, 5], kh2: [1, 0, 0], a: [[0, 8], [0, 6]] }, b: { p: [58, 42], t: 180, k: [62, 71.5, 5], k2: [52, 66, -5, 0], kh2: [-1, 0.3, 0], a: [[0, 8], [0, 6]] }, eq: 'db', pr: [['b', 54, 72, 82, FLOOR, 12]], arw: 'P' };
M.sissy = { a: o(SQT, { a: [[90, 6], [90, 4]] }), b: { p: [58, 70], t: 205, h: 195, k: [52, 89, 7, 60], kh: [1, 0, 0.3], a: [[90, 6], [90, 4]] }, arw: 'K' };
M.pistol = { a: o(ST, { a: [[90, 6], [90, 4]], k: [50, 91.5, 5], m: [[40, 0], [60, 0]] }), b: { p: [40, 76], t: 148, h: 125, k: [52, 91.5, 5], kh: [1, 0, 0.3], m: [[92, 0], [90, 0]], a: [[100, 6], [92, 4]] }, arw: 'P' };
M.wide = { a: o(ST, { k: [52, 91.5, 16], w: [56, 60, 2], wh: [0, 1, 0.5] }), b: { p: [46, 73], t: 168, h: 160, k: [52, 91.5, 16], kh: [0.6, 0, 1], w: [52, 78, 2], wh: [0, 1, 0.5] }, eq: 'kb', arw: 'P' };
M.lpress = { a: { p: [34, 72], t: 225, h: 205, k: [62, 52, 8, 140], kh: [0, -1, 0.3], a: [[10, 10], [10, 6]] }, b: { p: [34, 72], t: 225, h: 205, k: [52, 60, 8, 140], kh: [0.2, -1, 0.4], a: [[10, 10], [10, 6]] }, eq: 'sled', pr: [['s', 38, 76, 16, 56, 9, 3], ['b', 30, 76, 44, 80, 9], ['l', 34, 80, 34, FLOOR, 2], ['L', 58, 74, 0, 84, 40, 0, 3]], arw: 'A' };
M.lext = { a: o(SITC, { l: [[90, 0], [5, 0]], a: [[0, 20], [0, 10]] }), b: o(SITC, { l: [[90, 0], [88, 0]], a: [[0, 20], [0, 10]] }), pr: SEAT(42), arw: 'A' };
var LCP = { p: [46, 66], t: 90, h: 90, a: [[10, 20], [60, 10]] };
M.lcurl = { a: o(LCP, { l: [[270, 0], [270, 0], 180] }), b: o(LCP, { l: [[270, 0], [175, 0], 120] }), pr: [['b', 26, 69, 80, 73, 8], ['l', 52, 73, 52, FLOOR, 2]], arw: 'A' };
M.slcurl = { a: o(ST, { t: 170, h: 175, a: [[60, 20], [60, 10]], l: [[0, 0], [0, 0]] }), b: o(ST, { t: 170, h: 175, a: [[60, 20], [60, 10]], l: [[0, 0], [-100, 0]] }), pr: [['b', 58, 30, 64, 70, 9]], arw: 'A1' };
M.nordic = { a: { p: [52, 75], t: 180, h: 178, l: [[0, 0], [270, 0], 180], a: [[90, 10], [90, 6]] }, b: { p: [65, 81], t: 130, h: 115, l: [[-50, 0], [270, 0], 180], a: [[90, 30], [80, 20]] }, pr: [['b', 26, 90, 46, 92, 9], ['L', 36, 86, -8, 36, 86, 8, 3]], arw: 'H' };
M.hthrust = { a: { p: [52, 82], t: 250, h: 240, k: [74, 91.5, 7], kh: [0, -1, 0.3], w: [52, 78, 14], wh: [0, -1, 1] }, b: { p: [55, 66], t: 268, h: 255, k: [74, 91.5, 7], kh: [0, -1, 0.3], w: [55, 62, 14], wh: [0, -1, 1] }, eq: 'bb', pr: [['b', 10, 68, 30, FLOOR, 10]], arw: 'P' };
M.bridge = { a: o(FLOORL, { p: [52, 88], a: [[-80, 25], [-85, 10]] }), b: o(FLOORL, { p: [54, 74], t: 245, a: [[-80, 25], [-85, 10]] }), arw: 'P' };
M.gkick = { a: { p: [40, 70], t: 98, h: 95, w: [66, 91, 9], wh: [-1, 0, 0.3], k: [38, 91.5, 5, 270], kh: [1, 0, 0], k2: [38, 91.5, -5, 270] }, b: { p: [40, 70], t: 98, h: 95, w: [66, 91, 9], wh: [-1, 0, 0.3], l: [[-95, 0], [-150, 0], 180], k2: [38, 91.5, -5, 270] }, arw: 'A1' };
M.abd = { a: o(SITC, { l: [[90, 8], [0, 0]], a: [[0, 20], [0, 10]] }), b: o(SITC, { l: [[90, 42], [0, 0]], a: [[0, 20], [0, 10]] }), pr: SEAT(42), arw: 'K' };
M.add = { a: M.abd.b, b: M.abd.a, pr: SEAT(42), arw: 'K' };
M.calf = { a: o(ST, { a: [[0, 8], [0, 6]], l: [0, 0, 90] }), b: o(ST, { p: [50, 53], a: [[0, 8], [0, 6]], l: [0, 0, 45] }), eq: 'db', pr: [['b', 44, 89, 64, FLOOR, 10]], arw: 'P' };
M.scalf = { a: o(SITC, { l: [[90, 0], [0, 0], 90], a: [[30, 10], [60, 6]] }), b: o(SITC, { p: [42, 72], l: [[85, 0], [0, 0], 45], a: [[30, 10], [60, 6]] }), pr: SEAT(42, false).concat([['b', 48, 70, 64, 73, 9]]), arw: 'K' };
M.dcalf = { a: o(BO, { p: [44, 57], t: 98, k: [50, 91.5, 6, 90], a: [[20, 6], [0, 4]] }), b: o(BO, { p: [44, 53], t: 98, k: [50, 87.5, 6, 45], a: [[20, 6], [0, 4]] }), pr: [['b', 62, 66, 72, FLOOR, 9]], arw: 'P' };
M.pullthru = { a: { p: [54, 58], t: 250, h: 240, k: [48, 91.5, 9, 270], kh: [-1, 0, 0.4], a: [[-10, 4], [-5, 0]] }, b: { p: [50, 57], t: 180, h: 175, k: [48, 91.5, 9, 270], kh: [-1, 0, 0.4], a: [[5, 4], [5, 0]] }, eq: 'rope', anc: [[88, 88, 0]], pr: [['t', 92, 0, 60]], arw: 'P' };
M.boxjump = { a: o(SQB, { a: [[-30, 6], [-30, 4]] }), b: { p: [64, 38], t: 172, k: [72, 61.5, 6], kh: [1, 0, 0.3], a: [[150, 8], [150, 6]] }, pr: [['b', 62, 62, 88, FLOOR, 12]], arw: 'P' };

// ---- 腹 ----
var HANDH = [[-150, 60], [60, -40]];   // 手を頭の後ろに
M.crunch = { a: o(FLOORL, { a: HANDH }), b: o(FLOORL, { t: 236, h: 222, a: HANDH, ar: 1 }), arw: 'H' };
M.crunch.a.ar = 1;
M.situp = { a: o(FLOORL, { a: HANDH, ar: 1 }), b: o(FLOORL, { t: 165, h: 158, a: HANDH, ar: 1 }), arw: 'H' };
var FLAT = { p: [54, 88], t: 270, a: [[-90, 20], [-90, 10]] };
M.legraise = { a: o(FLAT, { l: [[92, 0], [92, 0], 180] }), b: o(FLAT, { l: [[178, 0], [178, 0], 270] }), arw: 'A' };
M.rcrunch = { a: o(FLAT, { l: [[135, 0], [45, 0], 90] }), b: o(FLAT, { p: [54, 84], t: 282, l: [[205, 0], [120, 0], 180] }), arw: 'K' };
var HANG = { p: [50, 62], t: 180, h: 175, w: [50, 10, 13], wh: [0, 1, 1] };
M.hlr = { a: o(HANG, { l: [[2, 0], [2, 0]] }), b: o(HANG, { l: [[95, 0], [95, 0], 160] }), pr: PBAR, arw: 'A' };
M.hkr = { a: o(HANG, { l: [[2, 0], [2, 0]] }), b: o(HANG, { l: [[118, 0], [10, 0]] }), pr: PBAR, arw: 'K' };
M.roller = { a: { p: [42, 73], t: 140, h: 120, l: [[2, 0], [270, 0], 180], w: [60, 87, 6], wh: [-0.3, -1, 0.4] }, b: { p: [46, 80], t: 100, h: 95, l: [[-25, 0], [270, 0], 180], w: [80, 87, 6], wh: [0, -1, 0.4] }, eq: 'wheel', arw: 'W' };
M.ccrunch = { a: { p: [46, 75], t: 172, h: 168, l: [[2, 0], [270, 0], 180], w: [54, 34, 4], wh: [1, 0.2, 0.8] }, b: { p: [46, 75], t: 112, h: 100, l: [[2, 0], [270, 0], 180], w: [68, 58, 4], wh: [1, 0.2, 0.8] }, eq: 'rope', anc: [[68, 6, 0]], pr: [['t', 72, 0, 2]], arw: 'H' };
M.mcrunch = { a: o(SITC, { a: [[170, 30], [10, -40]], ar: 1 }), b: o(SITC, { t: 135, h: 120, a: [[170, 30], [10, -40]], ar: 1 }), pr: SEAT(42), arw: 'H' };
var TW = { p: [48, 80], t: 158, h: 150, k: [64, 76, 6, 120], kh: [0, -1, 0.3] };
M.twist = { a: o(TW, { w: [60, 66, 14], wh: [0, 1, 1], w2: [58, 66, 4], wh2: [0, 1, 1] }), b: o(TW, { w: [58, 66, -4], wh: [0, 1, -1], w2: [60, 66, -14], wh2: [0, 1, -1] }), eq: 'mb', arw: 'W' };
M.bicycle = { a: o(FLAT, { t: 245, h: 232, a: HANDH, ar: 1, l: [[150, 0], [60, 0], 90], m: [[100, 0], [96, 0], 180] }), b: o(FLAT, { t: 245, h: 232, a: HANDH, ar: 1, l: [[100, 0], [96, 0], 180], m: [[150, 0], [60, 0], 90] }), arw: 'none' };
M.vsit = { a: o(FLAT, { a: [[-90, 10], [-90, 6]], l: [[92, 0], [92, 0], 180] }), b: o(FLAT, { p: [54, 86], t: 220, h: 210, a: [[140, 10], [140, 6]], l: [[140, 0], [140, 0], 230] }), arw: 'H' };
M.dflag = { a: { p: [46, 64], t: 270, h: 270, l: [[90, 0], [90, 0], 180], a: [[250, 20], [200, 10]] }, b: { p: [46, 58], t: 250, h: 260, l: [[150, 0], [150, 0], 240], a: [[250, 20], [200, 10]] }, pr: [['b', 14, 68, 52, 72, 8], ['l', 22, 72, 22, FLOOR, 2]], arw: 'A' };
M.deadbug = { a: o(FLAT, { a: [[180, 8], [180, 6]], l: [[160, 0], [70, 0], 90], m: [[160, 0], [70, 0], 90] }), b: o(FLAT, { a: [[180, 8], [180, 6]], b: [[260, 8], [262, 6]], l: [[96, 0], [93, 0], 180], m: [[160, 0], [70, 0], 90] }), arw: 'A1' };
M.mclimb = { a: o(PUA, { l: [[293.5, 0], [293.5, 0], 0], m: [[293.5, 0], [293.5, 0], 0] }), b: o(PUA, { l: [[40, 0], [-60, 0], 0], m: [[293.5, 0], [293.5, 0], 0] }), arw: 'K1' };
M.sbend = { a: o(ST, { a: [[0, 8], [0, 6]], b: [[0, 8], [0, 6]] }), b: o(ST, { tl: 30, a: [[0, 8], [0, 6]], b: [[0, 8], [0, 6]] }), eq: 'db1', arw: 'H' };
M.chop = { a: o(ST, { k: [52, 91.5, 10], w: [58, 16, 24], wh: [0, 0, 1], w2: [56, 20, 16], wh2: [0, 0, 1] }), b: o(ST, { k: [52, 91.5, 10], tl: -10, w: [62, 72, -14], wh: [0, 0, 1], w2: [60, 70, -22], wh2: [0, 0, -1] }), eq: 'cablef', anc: [[48, 10, 34]], pr: [['t', 48, 36, 6]] };
M.pallof = { a: o(ST, { k: [52, 91.5, 9], w: [56, 42, 2], wh: [-1, 0.6, 0.8] }), b: o(ST, { k: [52, 91.5, 9], w: [74, 42, 2], wh: [-1, 0.6, 0.8] }), eq: 'cablef', anc: [[56, 42, -36]], pr: [['t', 56, -38, 20]] };
M.trot = { a: o(ST, { k: [52, 91.5, 10], w: [68, 44, 16], wh: [-0.5, 0.5, 1], w2: [66, 44, 8], wh2: [-0.5, 0.5, -1] }), b: o(ST, { k: [52, 91.5, 10], w: [66, 44, -8], wh: [-0.5, 0.5, 1], w2: [68, 44, -16], wh2: [-0.5, 0.5, -1] }), eq: 'cablef', anc: [[60, 44, 38]], pr: [['t', 60, 40, 20]] };

// ---- 全身 ----
M.clean = { a: DLB, b: o(SQT, { w: [56, 33, 10], wh: [1, -0.2, 0.6] }), eq: 'bb', arw: 'W' };
M.snatch = { a: o(DLB, { w: [62, 84, 18] }), b: o(SQT, { w: [50, 6, 20], wh: [0, 1, 1] }), eq: 'bb', arw: 'W' };
M.cj = { a: o(SQT, { w: [56, 33, 10], wh: [1, -0.2, 0.6] }), b: { p: [50, 60], t: 180, k: [64, 91.5, 6], k2: [34, 91.5, -6, 40], kh2: [0, 1, 0], w: [50, 8, 13], wh: [0, 1, 1] }, eq: 'bb', arw: 'W' };
M.thruster = { a: o(SQB, { t: 158, w: [60, 53, 10], wh: [1, -0.2, 0.6] }), b: o(SQT, { w: [51, 6, 13], wh: [0, 1, 1] }), eq: 'bb', arw: 'W' };
M.kbswing = { a: o(BO, { p: [42, 60], t: 115, h: 100, a: [[-25, 6], [-25, 4]] }), b: o(SQT, { a: [[92, 6], [92, 4]] }), eq: 'kb', arw: 'W' };
M.burpee = { a: o(PUA, {}), b: o(ST, { p: [50, 52], a: [[160, 14], [165, 10]], l: [[5, 0], [12, 0], 60] }), arw: 'P' };
M.tgu = { a: o(FLOORL, { a: [[180, 6], [180, 4]], b: [[-60, 30], [-70, 10]] }), b: { p: [48, 74], t: 182, h: 178, l: [[2, 0], [270, 0], 180], k2: [62, 91.5, -6], a: [[178, 6], [180, 4]], b: [[0, 20], [0, 10]] }, eq: 'kb1', arw: 'W1' };
M.slam = { a: o(SQT, { a: [[176, 8], [176, 6]] }), b: o(SQB, { p: [42, 72], t: 122, h: 110, w: [64, 84, 4], wh: [0, -1, 1] }), eq: 'mb', arw: 'W' };

// ---- 種目 → 型 ----
var EX = {
  'ベンチプレス': 'bench', 'インクラインベンチプレス': 'incl', 'デクラインベンチプレス': 'decl', 'ダンベルプレス': 'bench:db', 'インクラインダンベルプレス': 'incl:db', 'デクラインダンベルプレス': 'decl:db',
  'ダンベルフライ': 'fly', 'インクラインダンベルフライ': 'inclfly', 'デクラインダンベルフライ': 'declfly', 'ケーブルフライ': 'cfly', 'ロープーリーケーブルフライ': 'lowfly', 'ペックフライ': 'pec',
  'チェストプレス': 'cpress', 'インクラインチェストプレス': 'icpress', 'スミスマシンベンチプレス': 'bench:smith', 'スミスマシンインクラインプレス': 'incl:smith', 'ディップス': 'dip', '腕立て伏せ': 'push',
  'ワイドプッシュアップ': 'push', 'デクラインプッシュアップ': 'dpush', 'ダンベルプルオーバー': 'pullover', 'スベンドプレス': 'svend', 'フロアプレス': 'floor', 'ランドマインプレス': 'landmine',
  'デッドリフト': 'dl', 'ルーマニアンデッドリフト': 'rdl', 'スティッフレッグデッドリフト': 'rdl', '相撲デッドリフト': 'dl', 'ラックプル': 'rack', 'トラップバーデッドリフト': 'dl:trap',
  '懸垂': 'pull', 'チンアップ': 'pull', 'ワイドグリップ懸垂': 'pull', 'アシストチンニング': 'apull', 'ラットプルダウン': 'lat', 'ナローラットプルダウン': 'lat:vh', 'ビハインドネックラットプルダウン': 'lat',
  'ストレートアームプルダウン': 'slat', 'ベントオーバーロー': 'bor', 'ダンベルロー': 'dbrow', 'シーテッドロー': 'srow', 'Tバーロー': 'bor:lm', 'マシンロー': 'mrow', 'チェストサポーテッドロー': 'csrow',
  'ペンドレイロー': 'pendlay', 'インバーテッドロー': 'invrow', 'シュラッグ': 'shrug:db', 'バックエクステンション': 'bext', 'グッドモーニング': 'gm', 'フェイスプル': 'face', 'リバースフライ': 'rfly',
  'ショルダープレス': 'sp', 'オーバーヘッドプレス': 'ohp', 'マシンショルダープレス': 'msp', 'スミスショルダープレス': 'sp:smith', 'アーノルドプレス': 'sp', 'ビハインドネックプレス': 'bnp',
  'サイドレイズ': 'lraise', 'ケーブルサイドレイズ': 'clraise', 'マシンサイドレイズ': 'lraise:hd', 'フロントレイズ': 'fraise', 'リアレイズ': 'rfly', 'アップライトロー': 'urow', 'ケーブルアップライトロー': 'urow:cablef',
  'パイクプッシュアップ': 'pike', '逆立ち腕立て': 'hspu', 'ランドマインショルダープレス': 'landmine', 'Yレイズ': 'yraise',
  'アームカール': 'curl', 'バーベルカール': 'bbcurl', 'EZバーカール': 'bbcurl', 'ハンマーカール': 'curl', 'インクラインダンベルカール': 'icurl', 'プリーチャーカール': 'preacher', 'コンセントレーションカール': 'conc',
  'ケーブルカール': 'ccurl', 'マシンカール': 'mcurl', 'スパイダーカール': 'spider', 'ドラッグカール': 'drag', 'リバースカール': 'bbcurl', 'ゾットマンカール': 'curl',
  'ナロープレス': 'bench', 'フレンチプレス': 'french', 'ライイングトライセプスエクステンション': 'skull', 'プッシュダウン': 'pushdown', 'キックバック': 'kick', 'ケーブルキックバック': 'ckick',
  'リバースプッシュダウン': 'pushdown', 'ケーブルオーバーヘッドエクステンション': 'cohe', 'ベンチディップス': 'bdip', 'ナロープッシュアップ': 'push', 'ディップスマシン': 'dipm', 'リストカール': 'wrist', 'リバースリストカール': 'wrist',
  'ファーマーズウォーク': 'farmer',
  'スクワット': 'squat', 'フロントスクワット': 'fsquat', 'ゴブレットスクワット': 'goblet', 'スミススクワット': 'squat:smith', 'ハックスクワット': 'hack', 'ブルガリアンスクワット': 'bss', 'スプリットスクワット': 'split',
  'ランジ': 'lunge', 'ウォーキングランジ': 'lunge', 'リバースランジ': 'rlunge', 'サイドランジ': 'slunge', 'ステップアップ': 'stepup', 'ジャンプスクワット': 'jsquat', '自重スクワット': 'bwsquat',
  'シシースクワット': 'sissy', 'ピストルスクワット': 'pistol', 'ワイドスクワット': 'wide', 'ベルトスクワット': 'bwsquat:belt', 'ペンデュラムスクワット': 'hack', 'レッグプレス': 'lpress', 'シングルレッグプレス': 'lpress',
  'レッグエクステンション': 'lext', 'レッグカール': 'lcurl', 'スタンディングレッグカール': 'slcurl', 'ノルディックハムストリングカール': 'nordic', 'グルートハムレイズ': 'nordic', 'ヒップスラスト': 'hthrust',
  'グルートブリッジ': 'bridge', 'グルートキックバック': 'gkick', 'ヒップアブダクション': 'abd', 'ヒップアダクション': 'add', 'カーフレイズ': 'calf', 'シーテッドカーフレイズ': 'scalf', 'ドンキーカーフレイズ': 'dcalf',
  'ケーブルプルスルー': 'pullthru', 'ボックスジャンプ': 'boxjump',
  'クランチ': 'crunch', 'シットアップ': 'situp', 'レッグレイズ': 'legraise', 'ハンギングレッグレイズ': 'hlr', 'ハンギングニーレイズ': 'hkr', 'アブローラー': 'roller', 'ケーブルクランチ': 'ccrunch',
  'アブドミナルクランチ': 'mcrunch', 'ロシアンツイスト': 'twist', 'バイシクルクランチ': 'bicycle', 'リバースクランチ': 'rcrunch', 'Vシット': 'vsit', 'ドラゴンフラッグ': 'dflag', 'デッドバグ': 'deadbug',
  'マウンテンクライマー': 'mclimb', 'サイドベント': 'sbend', 'ウッドチョッパー': 'chop', 'パロフプレス': 'pallof', 'トーソローテーション': 'trot',
  'クリーン': 'clean', 'スナッチ': 'snatch', 'クリーン&ジャーク': 'cj', 'スラスター': 'thruster', 'ケトルベルスイング': 'kbswing', 'バーピー': 'burpee', 'トルコ式ゲットアップ': 'tgu', 'メディシンボールスラム': 'slam'
};
var BY_PART = { '胸': 'cpress', '背中': 'lat', '肩': 'msp', '腕': 'curl', '脚': 'lext', '腹': 'crunch', '全身': 'squat' };
function find(name, part) {
  var v = EX[name];
  if (!v) {
    if (/ダンベル/.test(name) && /プレス/.test(name)) v = 'bench:db';
    else if (/カール/.test(name)) v = 'curl';
    else if (/ロー/.test(name)) v = 'srow';
    else if (/プレス/.test(name) && /ショルダー|肩/.test(name)) v = 'msp';
    else if (/スクワット/.test(name)) v = 'squat';
    else v = BY_PART[part] || 'cpress';
  }
  var s = v.split(':'), m = M[s[0]];
  return m ? { m: m, eq: s[1] || m.eq } : null;
}
function frame(name, part, k) {
  var f = find(name, part); if (!f) return '';
  var j = pose(f.m, k), fl = [pj([2, FLOOR + 1, -26]), pj([98, FLOOR + 1, -26]), pj([98, FLOOR + 1, 26]), pj([2, FLOOR + 1, 26])];
  var shadow = '<ellipse cx="' + f1(pj([j.P[0], FLOOR + 1, 0])[0]) + '" cy="' + f1(pj([j.P[0], FLOOR + 1, 0])[1]) + '" rx="14" ry="3.6" fill="rgba(0,0,0,.35)"/>';
  var smith = f.eq === 'smith' ? ln(pj([j.W1[0] - 4, 2, -22]), pj([j.W1[0] - 4, FLOOR, -22]), 1.6, C.pr) + ln(pj([j.W1[0] - 4, 2, 22]), pj([j.W1[0] - 4, FLOOR, 22]), 1.6, C.pr) : '';
  if (!f.m._arw) f.m._arw = {};
  if (f.m._arw[f.eq] == null) f.m._arw[f.eq] = arrow(f.m, f.eq);
  return poly(fl, C.fl) + shadow + smith + props(f.m.pr) + scene(j, f.eq, f.m) + f.m._arw[f.eq];
}
function svg(name, part, k) { return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + frame(name, part, k == null ? 1 : k) + '</svg>'; }
// 動かす: el の中の svg を、行ったり来たり（2.8秒で1往復）
var live = [], raf = 0;
function tick(ts) {
  live = live.filter(function (x) { return x.el.isConnected; });
  if (!live.length) { raf = 0; return; }
  var k = (1 - Math.cos(ts / 2800 * 2 * Math.PI)) / 2;
  live.forEach(function (x) { var s = x.el.querySelector('svg'); if (s) s.innerHTML = frame(x.name, x.part, k); });
  raf = requestAnimationFrame(tick);
}
function animate(el, name, part) { el.innerHTML = svg(name, part, 0); live.push({ el: el, name: name, part: part }); if (!raf) raf = requestAnimationFrame(tick); }
return { svg: svg, animate: animate, has: function (n) { return !!EX[n]; }, types: M, map: EX };
})();
