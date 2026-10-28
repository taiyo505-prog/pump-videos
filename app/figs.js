// 種目のイラスト（動く棒人間）。種目名 → 動きの型（start と end の2つのポーズ）＋道具。
// ポーズは「腰の位置・胴体の向き・腕や脚の向き（または手首・足首の位置）」で決める。0°=下、90°=右、180°=上、270°=左。
// 2つのポーズの関節の位置を行き来させて動かす。画面は 100×100、床は y=92。人は右向き。
window.PUMP_FIGS = (function () {
'use strict';
var L = { T: 26, U: 13, F: 12, H: 17, S: 17, N: 8, R: 5.5 }, FLOOR = 92;
function dv(a) { a = a * Math.PI / 180; return [Math.sin(a), Math.cos(a)]; }
function mv(p, a, l) { var v = dv(a); return [p[0] + v[0] * l, p[1] + v[1] * l]; }
// 2本の骨で root から target に届く中間の関節（bend: 1 か -1 で曲がる向き）
function ik(r, t, l1, l2, bend) {
  var dx = t[0] - r[0], dy = t[1] - r[1], d = Math.sqrt(dx * dx + dy * dy) || 1e-6;
  if (d >= l1 + l2) { var k = l1 / d; return [[r[0] + dx * k, r[1] + dy * k], [r[0] + dx * (l1 + l2) / d, r[1] + dy * (l1 + l2) / d]]; }
  var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a)), mx = r[0] + dx * a / d, my = r[1] + dy * a / d;
  return [[mx - bend * h * dy / d, my + bend * h * dx / d], t];
}
// ポーズ → 関節の位置
function fk(q) {
  var P = q.p, t = q.t == null ? 180 : q.t, S = mv(P, t, L.T), H = mv(S, q.h == null ? t : q.h, L.N), fv = q.fv, sw = fv ? 7 : 0, hw = fv ? 4 : 0;
  var S1 = [S[0] + sw, S[1]], S2 = [S[0] - sw, S[1]], P1 = [P[0] + hw, P[1]], P2 = [P[0] - hw, P[1]];
  function arm(s, a, w) {
    if (w) return ik(s, w, L.U, L.F, w[2] == null ? 1 : w[2]);
    var aa = a || [0, 0]; if (q.ar) aa = [aa[0] + t - 180, aa[1] + t - 180];
    var E = mv(s, aa[0], L.U); return [E, mv(E, aa[1], L.F)];
  }
  function leg(p, l, k) {
    var r = k ? ik(p, k, L.H, L.S, k[2] == null ? -1 : k[2]) : (function () { var ll = l || [0, 0], K = mv(p, ll[0], L.H); return [K, mv(K, ll[1], L.S)]; })();
    var fa = (k && k[3] != null) ? k[3] : (l && l[2] != null) ? l[2] : (fv ? 0 : 90);
    return [r[0], r[1], mv(r[1], fa, fv ? 1.5 : 4)];
  }
  var a1 = arm(S1, q.a, q.w), a2 = arm(S2, q.b || (fv ? mir(q.a) : q.a), q.w2 || (fv && q.w ? mirP(q.w, S[0]) : q.w));
  var l1 = leg(P1, q.l, q.k), l2 = leg(P2, q.m || (fv ? mir(q.l) : q.l), q.k2 || (fv && q.k ? mirP(q.k, P[0]) : q.k));
  return { P: P, S: S, H: H, S1: S1, S2: S2, P1: P1, P2: P2, E1: a1[0], W1: a1[1], E2: a2[0], W2: a2[1], K1: l1[0], A1: l1[1], T1: l1[2], K2: l2[0], A2: l2[1], T2: l2[2] };
}
function mir(a) { return a ? a.map(function (x, i) { return i < 2 ? -x : x; }) : a; }
function mirP(w, cx) { return [2 * cx - w[0], w[1], w[2] == null ? -1 : -w[2], w[3] == null ? null : -w[3]]; }
function lerp(a, b, k) { var o = {}; for (var n in a) o[n] = [a[n][0] + (b[n][0] - a[n][0]) * k, a[n][1] + (b[n][1] - a[n][1]) * k]; return o; }

// ---- ポーズを作る道具 ----
var ST = { p: [50, 57], t: 180 };                        // 立つ
function o(base, x) { var r = {}, n; for (n in base) r[n] = base[n]; for (n in x) r[n] = x[n]; return r; }
function sit(x, y) { return { p: [x, y], t: 180, k: [x + 15, FLOOR, -1] }; }  // 座る（足は床）
var BENCH = [['r', 20, 69, 52, 4], ['l', 26, 73, 26, FLOOR], ['l', 66, 73, 66, FLOOR]];
var LIE = { p: [62, 66], t: 270, k: [80, FLOOR - 0.5, 1] };   // ベンチに仰向け（頭が左）
var SEAT = function (x, y) { return [['r', x - 9, y + 2, 20, 3], ['l', x - 7, y + 2, x - 9, y - 30], ['l', x + 1, y + 5, x + 1, FLOOR]]; };

// 動きの型: { a: ポーズ, b: ポーズ, eq: 道具, pr: 置いてある物, fv: 正面から }
var M = {};
// ---- 胸 ----
M.bench = { a: o(LIE, { a: [180, 180] }), b: o(LIE, { w: [33, 61, 1] }), eq: 'bb', pr: BENCH };
M.incl = { a: { p: [64, 72], t: 238, k: [82, FLOOR - 0.5, 1], a: [168, 168] }, b: { p: [64, 72], t: 238, k: [82, FLOOR - 0.5, 1], w: [46, 55, 1] }, eq: 'bb', pr: [['l', 70, 75, 34, 52, 5], ['l', 60, 77, 60, FLOOR]] };
M.decl = { a: { p: [62, 62], t: 298, k: [80, 70, 1, 0], a: [190, 190] }, b: { p: [62, 62], t: 298, k: [80, 70, 1, 0], w: [38, 70, 1] }, eq: 'bb', pr: [['l', 70, 66, 26, 82, 5], ['l', 48, 73, 48, FLOOR]] };
M.fly = { a: o(LIE, { a: [180, 180] }), b: o(LIE, { a: [300, 330] }), eq: 'db', pr: BENCH };
M.inclfly = { a: { p: [64, 72], t: 238, k: [82, FLOOR - 0.5, 1], a: [168, 168] }, b: { p: [64, 72], t: 238, k: [82, FLOOR - 0.5, 1], a: [285, 300] }, eq: 'db', pr: M.incl.pr };
M.declfly = { a: M.decl.a, b: o(M.decl.a, { a: [330, 350] }), eq: 'db', pr: M.decl.pr };
M.cfly = { fv: 1, a: o(ST, { fv: 1, a: [100, 95] }), b: o(ST, { fv: 1, w: [53, 48, -1] }), eq: 'cable', anc: [[94, 14], [6, 14]] };
M.lowfly = { fv: 1, a: o(ST, { fv: 1, a: [60, 50] }), b: o(ST, { fv: 1, w: [53, 30, 1] }), eq: 'cable', anc: [[94, 88], [6, 88]] };
var FS = { fv: 1, p: [50, 66], t: 180, l: [45, 0] };  // 正面から見て座る
M.pec = { fv: 1, a: o(FS, { a: [95, 180] }), b: o(FS, { a: [150, 185] }), eq: 'hd', pr: [['r', 40, 68, 20, 3]] };
M.cpress = { a: o(sit(40, 74), { w: [52, 56, -1] }), b: o(sit(40, 74), { a: [95, 92] }), eq: 'hd', pr: SEAT(40, 74) };
M.icpress = { a: o(sit(40, 74), { w: [50, 52, -1] }), b: o(sit(40, 74), { a: [140, 140] }), eq: 'hd', pr: SEAT(40, 74) };
M.dip = { a: { p: [48, 46], t: 172, h: 165, w: [52, 46], l: [15, 330] }, b: { p: [48, 64], t: 162, h: 150, w: [55, 47, -1], l: [25, 320] }, pr: [['c', 53, 47, 2.5], ['l', 53, 49, 53, FLOOR]] };
var PU = { p: [43.3, 77.4], t: 113.5, l: [293.5, 293.5, 0], a: [0, 0] };
M.push = { a: PU, b: { p: [45.7, 85.4], t: 98, l: [278, 278, 0], w: [67, 91, -1] } };
M.dpush = { a: { p: [43, 66], t: 125, l: [287, 287, 0], a: [0, 0] }, b: { p: [45, 74], t: 112, l: [285, 285, 0], w: [66, 91, -1] }, pr: [['r', 4, 64, 16, 28]] };
M.pike = { a: { p: [48, 60], t: 140, l: [215, 215, 0], a: [5, 5] }, b: { p: [48, 62], t: 125, l: [215, 215, 0], w: [64, 91, -1] } };
M.hspu = { a: { p: [55, 40], t: 0, h: 0, l: [180, 180, 180], a: [0, 0] }, b: { p: [55, 52], t: 0, h: 0, l: [180, 180, 180], w: [55, 91, 1] }, pr: [['l', 64, 2, 64, FLOOR, 3]] };
M.pullover = { a: o(LIE, { a: [180, 175] }), b: o(LIE, { a: [255, 262] }), eq: 'db', pr: BENCH };
M.svend = { a: o(ST, { w: [57, 40, -1] }), b: o(ST, { a: [95, 92] }), eq: 'plate' };
M.floor = { a: { p: [62, 86], t: 270, k: [78, FLOOR - 0.5, 1], a: [180, 180] }, b: { p: [62, 86], t: 270, k: [78, FLOOR - 0.5, 1], w: [32, 76, 1] }, eq: 'db' };
M.landmine = { a: o(ST, { w: [57, 33, -1] }), b: o(ST, { a: [140, 140] }), eq: 'lm' };
// ---- 背中 ----
var DLB = { p: [44, 67], t: 112, h: 100, k: [52, FLOOR - 1, -1], w: [68, 82] };
M.dl = { a: DLB, b: o(ST, { w: [51, 81] }), eq: 'bb' };
M.dl.b = o(ST, { a: [0, 0] });
M.rdl = { a: { p: [42, 58], t: 102, h: 95, k: [48, FLOOR - 1, -1], a: [0, 0] }, b: o(ST, { a: [0, 0] }), eq: 'bb' };
M.rack = { a: { p: [45, 62], t: 140, k: [52, FLOOR - 1, -1], a: [0, 0] }, b: o(ST, { a: [0, 0] }), eq: 'bb', pr: [['l', 70, 66, 70, FLOOR, 2]] };
var BAR = [['c', 50, 9, 2], ['l', 20, 9, 80, 9, 1.5]];
M.pull = { a: { p: [50, 61], t: 180, h: 170, w: [50, 10], l: [5, 330] }, b: { p: [47, 47], t: 175, h: 168, w: [50, 10, 1], l: [10, 320] }, pr: BAR };
M.apull = { a: o(M.pull.a, { l: [80, 0] }), b: o(M.pull.b, { l: [80, 0] }), pr: BAR.concat([['r', 55, 62, 18, 3]]) };
M.lat = { a: o(sit(42, 72), { w: [50, 12] }), b: o(sit(42, 72), { w: [50, 42, 1] }), eq: 'lb', anc: [[50, 4]], pr: SEAT(42, 72).concat([['r', 52, 66, 8, 3]]) };
M.slat = { a: o(ST, { p: [44, 57], t: 165, a: [150, 150] }), b: o(ST, { p: [44, 57], t: 165, a: [10, 10] }), eq: 'cable', anc: [[90, 10]] };
var BO = { p: [46, 56], t: 115, h: 105, k: [52, FLOOR - 1, -1] };
M.bor = { a: o(BO, { a: [0, 0] }), b: o(BO, { w: [60, 60, 1] }), eq: 'bb' };
M.pendlay = { a: o(BO, { p: [44, 60], t: 100, a: [0, 0] }), b: o(BO, { p: [44, 60], t: 100, w: [56, 66, 1] }), eq: 'bb' };
M.dbrow = { a: { p: [36, 58], t: 100, h: 92, k: [34, FLOOR - 1, -1], m: [90, 10], a: [0, 0], b: [10, 0] }, b: { p: [36, 58], t: 100, h: 92, k: [34, FLOOR - 1, -1], m: [90, 10], w: [52, 58, 1], b: [10, 0] }, eq: 'db1', pr: [['r', 34, 66, 40, 4], ['l', 40, 70, 40, FLOOR], ['l', 70, 70, 70, FLOOR]] };
M.srow = { a: { p: [36, 78], t: 160, l: [90, 90], a: [110, 100] }, b: { p: [36, 78], t: 180, l: [90, 90], w: [44, 66, 1] }, eq: 'cable', anc: [[92, 80]], pr: [['r', 26, 80, 44, 3], ['r', 72, 70, 4, 14]] };
M.mrow = { a: o(sit(40, 74), { t: 175, a: [95, 92] }), b: o(sit(40, 74), { w: [46, 58, 1] }), eq: 'hd', pr: SEAT(40, 74).concat([['r', 54, 44, 4, 16]]) };
M.csrow = { a: { p: [40, 64], t: 125, k: [40, FLOOR - 1, -1], a: [0, 0] }, b: { p: [40, 64], t: 125, k: [40, FLOOR - 1, -1], w: [60, 56, 1] }, eq: 'db', pr: [['l', 38, 66, 68, 46, 4], ['l', 54, 58, 54, FLOOR]] };
M.invrow = { a: { p: [42, 70], t: 105, l: [280, 280, 0], w: [70, 40] }, b: { p: [44, 62], t: 100, l: [283, 283, 0], w: [70, 40, -1] }, pr: [['c', 70, 40, 2], ['l', 70, 42, 70, FLOOR]] };
M.shrug = { a: o(ST, { a: [0, 0] }), b: o(ST, { p: [50, 55], a: [0, 0] }), eq: 'bb' };
M.bext = { a: { p: [50, 60], t: 20, h: 10, l: [300, 300, 30], w: [56, 74, 1] }, b: { p: [50, 60], t: 120, h: 115, l: [300, 300, 30], w: [60, 50, 1] }, pr: [['c', 50, 64, 4], ['l', 50, 68, 50, FLOOR]] };
M.gm = { a: o(ST, { w: [48, 30, 1] }), b: o(ST, { t: 100, h: 95, k: [48, FLOOR - 1, -1], w: [74, 54, 1] }), eq: 'bb' };
M.face = { a: o(ST, { t: 175, a: [110, 100] }), b: o(ST, { t: 175, w: [55, 22, 1] }), eq: 'cable', anc: [[92, 18]] };
M.rfly = { a: o(BO, { a: [5, 0] }), b: o(BO, { a: [300, 300] }), eq: 'db' };
// ---- 肩 ----
M.ohp = { a: o(ST, { w: [55, 30, -1] }), b: o(ST, { a: [175, 180] }), eq: 'bb' };
M.sp = { a: o(sit(44, 74), { w: [50, 46, -1] }), b: o(sit(44, 74), { a: [178, 180] }), eq: 'db', pr: SEAT(44, 74) };
M.msp = { a: o(sit(44, 74), { w: [50, 46, -1] }), b: o(sit(44, 74), { a: [178, 180] }), eq: 'hd', pr: SEAT(44, 74) };
M.bnp = { a: o(ST, { w: [46, 30, 1] }), b: o(ST, { a: [180, 180] }), eq: 'bb' };
M.lraise = { fv: 1, a: o(ST, { fv: 1, a: [10, 5] }), b: o(ST, { fv: 1, a: [90, 92] }), eq: 'db' };
M.clraise = { fv: 1, a: o(ST, { fv: 1, a: [10, 5], b: [0, 0] }), b: o(ST, { fv: 1, a: [90, 92], b: [0, 0] }), eq: 'cable1', anc: [[20, 90]] };
M.fraise = { a: o(ST, { a: [10, 10] }), b: o(ST, { a: [95, 95] }), eq: 'db' };
M.urow = { fv: 1, a: o(ST, { fv: 1, w: [53, 58, -1] }), b: o(ST, { fv: 1, w: [53, 30, -1] }), eq: 'bbf' };
M.yraise = { fv: 1, a: o(ST, { fv: 1, a: [15, 15] }), b: o(ST, { fv: 1, a: [150, 150] }), eq: 'db' };
// ---- 腕 ----
M.curl = { a: o(ST, { a: [12, 8] }), b: o(ST, { a: [12, 150] }), eq: 'db' };
M.bbcurl = { a: o(ST, { a: [12, 8] }), b: o(ST, { a: [12, 150] }), eq: 'bb' };
M.ccurl = { a: o(ST, { a: [0, 10] }), b: o(ST, { a: [5, 160] }), eq: 'cable', anc: [[70, 90]] };
M.mcurl = { a: o(sit(40, 74), { a: [80, 85] }), b: o(sit(40, 74), { a: [80, 200] }), eq: 'hd', pr: SEAT(40, 74).concat([['l', 44, 54, 60, 54, 4]]) };
M.icurl = { a: { p: [62, 72], t: 220, k: [80, FLOOR - 0.5, 1], a: [0, 0] }, b: { p: [62, 72], t: 220, k: [80, FLOOR - 0.5, 1], a: [0, 160] }, eq: 'db', pr: [['l', 68, 75, 40, 48, 5], ['l', 58, 77, 58, FLOOR]] };
M.preacher = { a: o(sit(40, 74), { a: [50, 70] }), b: o(sit(40, 74), { a: [50, 200] }), eq: 'bb', pr: SEAT(40, 74).concat([['l', 44, 48, 58, 62, 5]]) };
M.conc = { a: { p: [40, 70], t: 145, h: 125, k: [58, FLOOR, -1], a: [10, 10] }, b: { p: [40, 70], t: 145, h: 125, k: [58, FLOOR, -1], a: [10, 175] }, eq: 'db1', pr: [['r', 28, 72, 20, 4]] };
M.spider = { a: { p: [36, 62], t: 125, k: [36, FLOOR - 1, -1], a: [0, 0] }, b: { p: [36, 62], t: 125, k: [36, FLOOR - 1, -1], a: [0, 150] }, eq: 'bb', pr: M.csrow.pr };
M.drag = { a: o(ST, { a: [0, 0] }), b: o(ST, { a: [330, 170] }), eq: 'bb' };
M.french = { a: o(ST, { a: [180, 180] }), b: o(ST, { a: [180, 20] }), eq: 'db1' };
M.skull = { a: o(LIE, { a: [180, 180] }), b: o(LIE, { a: [200, 300] }), eq: 'bb', pr: BENCH };
M.pushdown = { a: o(ST, { t: 175, a: [355, 120] }), b: o(ST, { t: 175, a: [355, 0] }), eq: 'cable', anc: [[60, 4]] };
M.kick = { a: o(BO, { a: [300, 0] }), b: o(BO, { a: [300, 300] }), eq: 'db' };
M.ckick = { a: o(BO, { a: [300, 0] }), b: o(BO, { a: [300, 300] }), eq: 'cable1', anc: [[90, 88]] };
M.cohe = { a: o(ST, { t: 160, h: 150, k: [62, FLOOR, -1], a: [130, 330] }), b: o(ST, { t: 160, h: 150, k: [62, FLOOR, -1], a: [130, 130] }), eq: 'cable', anc: [[10, 80]] };
M.bdip = { a: { p: [36, 56], t: 180, l: [90, 30, 90], w: [32, 66, 1] }, b: { p: [36, 68], t: 185, l: [80, 20, 90], w: [32, 66, -1] }, pr: [['r', 22, 66, 16, 4], ['l', 28, 70, 28, FLOOR]] };
M.dipm = { a: o(sit(44, 74), { a: [300, 30] }), b: o(sit(44, 74), { a: [350, 0] }), eq: 'hd', pr: SEAT(44, 74) };
M.wrist = { a: o(sit(40, 74), { t: 155, w: [62, 76, -1] }), b: o(sit(40, 74), { t: 155, w: [63, 70, -1] }), eq: 'db', pr: [['r', 30, 76, 18, 3]] };
M.farmer = { a: o(ST, { a: [0, 0], k: [58, FLOOR, -1], k2: [44, FLOOR, -1] }), b: o(ST, { a: [0, 0], k: [44, FLOOR, -1], k2: [58, FLOOR, -1] }), eq: 'db' };
// ---- 脚 ----
var SQB = { p: [42, 72], t: 145, h: 125, k: [52, FLOOR - 1, -1] };
M.squat = { a: o(ST, { w: [46, 30, 1] }), b: o(SQB, { w: [53, 52, 1] }), eq: 'bb' };
M.fsquat = { a: o(ST, { w: [57, 32, -1] }), b: o(SQB, { t: 160, w: [61, 52, -1] }), eq: 'bb' };
M.goblet = { a: o(ST, { w: [56, 40, -1] }), b: o(SQB, { t: 160, w: [60, 60, -1] }), eq: 'kb' };
M.bwsquat = { a: o(ST, { a: [90, 90] }), b: o(SQB, { a: [100, 90] }) };
M.jsquat = { a: o(SQB, { a: [330, 330] }), b: o(ST, { p: [50, 45], a: [160, 160], k: [52, 82, -1, 60] }) };
M.hack = { a: { p: [42, 54], t: 160, k: [56, 86, -1, 120], a: [180, 300] }, b: { p: [40, 70], t: 160, k: [56, 86, -1, 120], a: [180, 300] }, pr: [['l', 26, 18, 52, 86, 3], ['l', 50, 88, 70, 80, 4]] };
M.bss = { a: { p: [46, 56], t: 178, k: [56, FLOOR - 1, -1], m: [340, 280, 300], a: [0, 0] }, b: { p: [44, 68], t: 172, k: [58, FLOOR - 1, -1], m: [330, 290, 300], a: [0, 0] }, eq: 'db', pr: [['r', 8, 66, 22, 4]] };
M.split = { a: { p: [48, 56], t: 180, k: [60, FLOOR - 1, -1], k2: [34, FLOOR - 1, 1, 80], a: [0, 0] }, b: { p: [46, 68], t: 178, k: [60, FLOOR - 1, -1], k2: [32, FLOOR - 1, 1, 80], a: [0, 0] }, eq: 'db' };
M.lunge = { a: o(ST, { a: [0, 0] }), b: M.split.b, eq: 'db' };
M.rlunge = { a: o(ST, { a: [0, 0] }), b: { p: [52, 68], t: 178, k: [62, FLOOR - 1, -1], k2: [32, FLOOR - 1, 1, 80], a: [0, 0] }, eq: 'db' };
M.slunge = { fv: 1, a: o(ST, { fv: 1, a: [0, 0], k: [58, FLOOR], k2: [42, FLOOR] }), b: { fv: 1, p: [60, 68], t: 185, a: [0, 0], k: [76, FLOOR, 1, 90], k2: [40, FLOOR, 1, 270] } };
M.stepup = { a: o(ST, { p: [44, 57], k: [44, FLOOR - 1], k2: [62, 72, -1] }), b: o(ST, { p: [58, 40], k: [62, 72 - 1], k2: [50, 66, -1] }), eq: 'db', pr: [['r', 52, 72, 26, 20]] };
M.sissy = { a: o(ST, { a: [0, 0] }), b: { p: [56, 68], t: 205, h: 200, k: [52, FLOOR - 1, 1, 90], a: [0, 0] } };
M.pistol = { a: o(ST, { a: [90, 90], m: [60, 70] }), b: { p: [42, 76], t: 150, h: 130, k: [50, FLOOR - 1, -1], m: [95, 92], a: [100, 95] } };
M.wide = { fv: 1, a: o(ST, { fv: 1, w: [53, 40, -1], k: [62, FLOOR], k2: [38, FLOOR] }), b: { fv: 1, p: [50, 72], t: 180, w: [53, 56, -1], k: [66, FLOOR, -1], k2: [34, FLOOR, 1] }, eq: 'kb' };
M.lpress = { a: { p: [34, 72], t: 220, h: 200, k: [64, 56, 1, 140], a: [10, 10] }, b: { p: [34, 72], t: 220, h: 200, k: [52, 64, 1, 140], a: [10, 10] }, pr: [['l', 40, 76, 14, 54, 4], ['l', 60, 46, 76, 72, 4], ['l', 30, 80, 30, FLOOR]] };
M.lext = { a: o(sit(42, 74), { k: null, l: [90, 0], a: [0, 0] }), b: o(sit(42, 74), { k: null, l: [90, 90], a: [0, 0] }), pr: SEAT(42, 74) };
M.lcurl = { a: { p: [44, 66], t: 270, h: 270, l: [90, 90, 0], a: [300, 330] }, b: { p: [44, 66], t: 270, h: 270, l: [90, 200, 0], a: [300, 330] }, pr: [['r', 14, 69, 52, 4], ['l', 40, 73, 40, FLOOR]] };
M.slcurl = { a: o(ST, { t: 168, a: [40, 40] }), b: o(ST, { t: 168, a: [40, 40], l: [0, 0], m: [0, 280] }), pr: [['r', 58, 26, 4, 30]] };
M.nordic = { a: { p: [52, 66], t: 180, l: [0, 270, 180], a: [90, 90] }, b: { p: [52, 66], t: 110, h: 100, l: [0, 270, 180], a: [90, 60] }, pr: [['r', 20, 80, 22, 4]] };
M.hthrust = { a: { p: [52, 84], t: 250, k: [72, FLOOR - 0.5, 1], w: [52, 80, 1] }, b: { p: [54, 66], t: 265, k: [72, FLOOR - 0.5, 1], w: [54, 62, 1] }, eq: 'bb', pr: [['r', 12, 70, 18, 22]] };
M.bridge = { a: { p: [50, 88], t: 270, k: [70, FLOOR - 0.5, 1], a: [300, 300] }, b: { p: [52, 72], t: 245, k: [70, FLOOR - 0.5, 1], a: [300, 300] } };
M.gkick = { a: { p: [40, 66], t: 90, h: 90, w: [64, 91], k: [40, 82, 1, 270], k2: [40, 82, 1, 270] }, b: { p: [40, 66], t: 90, h: 90, w: [64, 91], k: [22, 58, 1, 270], k2: [40, 82, 1, 270] } };
M.abd = { fv: 1, a: o(FS, { l: [20, 0], a: [10, 0] }), b: o(FS, { l: [70, 0], a: [10, 0] }), pr: [['r', 38, 68, 24, 3]] };
M.add = { fv: 1, a: M.abd.b, b: M.abd.a, pr: M.abd.pr };
M.calf = { a: o(ST, { a: [0, 0], l: [0, 0, 90] }), b: o(ST, { p: [50, 52], a: [0, 0], l: [0, 0, 135] }), eq: 'db', pr: [['r', 44, 90, 16, 2]] };
M.scalf = { a: o(sit(42, 74), { k: [58, FLOOR - 1, -1, 90], a: [60, 60] }), b: o(sit(42, 74), { k: [58, FLOOR - 5, -1, 140], a: [60, 60] }), pr: SEAT(42, 74).concat([['r', 50, 70, 16, 3]]) };
M.dcalf = { a: o(BO, { t: 100, k: [48, FLOOR - 1, -1, 90], a: [0, 0] }), b: o(BO, { p: [46, 52], t: 100, k: [48, FLOOR - 4, -1, 140], a: [0, 0] }) };
M.pullthru = { a: { p: [56, 58], t: 250, h: 240, k: [50, FLOOR - 1, 1, 270], a: [355, 0] }, b: o(ST, { p: [52, 57], t: 180, h: 175, k: [52, FLOOR - 1, 1, 270], a: [10, 10] }), eq: 'cable', anc: [[90, 88]] };
M.boxjump = { a: o(SQB, { a: [330, 330] }), b: { p: [62, 36], t: 175, k: [70, 60, -1], a: [150, 150] }, pr: [['r', 62, 62, 26, 30]] };
// ---- 腹 ----
var FL = { p: [52, 86], t: 270, k: [70, FLOOR - 0.5, 1] };
M.crunch = { a: o(FL, { a: [200, 200] }), b: o(FL, { t: 245, h: 235, a: [220, 220] }) };
M.situp = { a: o(FL, { a: [200, 200] }), b: o(FL, { t: 165, h: 160, a: [150, 120] }) };
M.legraise = { a: { p: [50, 88], t: 270, l: [92, 92], a: [270, 270] }, b: { p: [50, 88], t: 270, l: [170, 170], a: [270, 270] } };
M.rcrunch = { a: { p: [50, 88], t: 270, l: [130, 30, 90], a: [270, 270] }, b: { p: [50, 84], t: 280, l: [200, 120, 90], a: [270, 270] } };
M.hlr = { a: o(M.pull.a, { l: [0, 0] }), b: o(M.pull.a, { p: [50, 61], l: [95, 95] }), pr: BAR };
M.hkr = { a: o(M.pull.a, { l: [0, 0] }), b: o(M.pull.a, { p: [50, 61], l: [120, 10] }), pr: BAR };
M.roller = { a: { p: [42, 72], t: 145, h: 120, l: [355, 270, 270], w: [62, 88] }, b: { p: [44, 82], t: 100, h: 95, l: [345, 270, 270], w: [82, 88] }, eq: 'wheel' };
M.ccrunch = { a: { p: [46, 66], t: 165, h: 160, l: [0, 270, 270], w: [56, 28, -1] }, b: { p: [46, 66], t: 110, h: 100, l: [0, 270, 270], w: [70, 56, -1] }, eq: 'cable', anc: [[64, 4]] };
M.mcrunch = { a: o(sit(42, 74), { a: [180, 0] }), b: o(sit(42, 74), { t: 135, h: 125, ar: 1, a: [180, 0] }), pr: SEAT(42, 74) };
M.twist = { fv: 1, a: { fv: 1, p: [50, 80], t: 175, k: [60, 74, 1, 0], k2: [40, 74, -1, 0], w: [60, 62, -1], w2: [52, 62, -1] }, b: { fv: 1, p: [50, 80], t: 185, k: [60, 74, 1, 0], k2: [40, 74, -1, 0], w: [48, 62, 1], w2: [40, 62, 1] }, eq: 'mb' };
M.bicycle = { a: { p: [50, 86], t: 250, h: 240, l: [140, 60, 90], m: [95, 95], a: [200, 30] }, b: { p: [50, 86], t: 250, h: 240, l: [95, 95], m: [140, 60, 90], a: [200, 30] } };
M.vsit = { a: { p: [50, 88], t: 270, l: [90, 90], a: [270, 270] }, b: { p: [50, 86], t: 215, l: [140, 140], a: [140, 140] } };
M.dflag = { a: { p: [46, 64], t: 270, l: [90, 90, 0], a: [210, 210] }, b: { p: [46, 58], t: 250, l: [140, 140, 180], a: [210, 210] }, pr: [['r', 16, 68, 36, 4], ['l', 24, 72, 24, FLOOR]] };
M.deadbug = { a: { p: [56, 86], t: 270, l: [150, 60, 90], m: [150, 60, 90], a: [180, 180], b: [180, 180] }, b: { p: [56, 86], t: 270, l: [95, 92], m: [150, 60, 90], a: [180, 180], b: [260, 265] } };
M.mclimb = { a: o(PU, { m: [293.5, 293.5, 0] }), b: o(PU, { l: [60, 300, 0], m: [293.5, 293.5, 0] }) };
M.sbend = { fv: 1, a: o(ST, { fv: 1, a: [0, 0], b: [0, 0] }), b: o(ST, { fv: 1, t: 165, h: 160, a: [0, 0], b: [0, 0] }), eq: 'db1' };
M.chop = { fv: 1, a: o(ST, { fv: 1, k: [60, FLOOR], k2: [40, FLOOR], w: [78, 18, -1], w2: [70, 22, -1] }), b: o(ST, { fv: 1, t: 190, k: [60, FLOOR], k2: [40, FLOOR], w: [32, 70, 1], w2: [26, 66, 1] }), eq: 'cable', anc: [[92, 8]] };
M.pallof = { a: o(ST, { w: [56, 46, -1] }), b: o(ST, { a: [95, 92] }), eq: 'cable', anc: [[8, 46]] };
M.trot = { fv: 1, a: o(ST, { fv: 1, k: [60, FLOOR], k2: [40, FLOOR], w: [70, 44, -1], w2: [62, 44, -1] }), b: o(ST, { fv: 1, k: [60, FLOOR], k2: [40, FLOOR], w: [38, 44, 1], w2: [30, 44, 1] }), eq: 'cable', anc: [[94, 44]] };
// ---- 全身 ----
M.clean = { a: DLB, b: o(ST, { w: [58, 30, -1] }), eq: 'bb' };
M.snatch = { a: DLB, b: o(ST, { a: [170, 175] }), eq: 'bb' };
M.cj = { a: o(ST, { w: [58, 30, -1] }), b: o(ST, { a: [175, 180], k: [62, FLOOR, -1], k2: [38, FLOOR, 1, 80] }), eq: 'bb' };
M.thruster = { a: o(SQB, { t: 160, w: [61, 44, -1] }), b: o(ST, { a: [175, 178] }), eq: 'bb' };
M.kbswing = { a: o(BO, { p: [44, 60], t: 110, k: [50, FLOOR - 1, -1], a: [330, 330] }), b: o(ST, { a: [95, 95] }), eq: 'kb' };
M.burpee = { a: PU, b: o(ST, { p: [50, 50], a: [170, 170], k: [50, 86, -1, 70] }) };
M.tgu = { a: { p: [56, 86], t: 270, k: [74, FLOOR - 0.5, 1], a: [180, 180], b: [300, 300] }, b: { p: [50, 70], t: 190, l: [0, 270, 270], a: [180, 180], b: [0, 0] }, eq: 'kb1' };
M.slam = { a: o(ST, { a: [180, 180] }), b: o(SQB, { p: [44, 70], t: 125, a: [30, 20] }), eq: 'mb' };

// 種目 → 型（と道具の差し替え）
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
// 名前から型を探す（自作の種目は部位からそれっぽい型）
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

// ---- 描く ----
var C = { body: '#f2f2f4', back: '#7d7d88', eq: '#ff5a1f', pr: '#4a4d57', fl: '#2a2c33' };
function f1(n) { return Math.round(n * 10) / 10; }
function ln(a, b, w, c) { return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
function cir(p, r, c, fill) { return '<circle cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="' + r + '" ' + (fill ? 'fill="' + c + '"' : 'fill="none" stroke="' + c + '" stroke-width="2.4"') + '/>'; }
function props(pr) {
  return (pr || []).map(function (x) {
    if (x[0] === 'r') return '<rect x="' + x[1] + '" y="' + x[2] + '" width="' + x[3] + '" height="' + x[4] + '" rx="1.5" fill="' + C.pr + '"/>';
    if (x[0] === 'l') return ln([x[1], x[2]], [x[3], x[4]], x[5] || 2, C.pr);
    if (x[0] === 'c') return cir([x[1], x[2]], x[3], C.pr, 1);
    return '';
  }).join('');
}
function equip(eq, j, anc, fv) {
  var o = '', mid = [(j.W1[0] + j.W2[0]) / 2, (j.W1[1] + j.W2[1]) / 2];
  if (!eq) return '';
  if (eq === 'bb' || eq === 'smith' || eq === 'trap') { if (fv) o += ln([j.W1[0] + 14, j.W1[1]], [j.W2[0] - 14, j.W2[1]], 2.2, C.eq) + ln([j.W1[0] + 12, j.W1[1] - 6], [j.W1[0] + 12, j.W1[1] + 6], 4, C.eq) + ln([j.W2[0] - 12, j.W2[1] - 6], [j.W2[0] - 12, j.W2[1] + 6], 4, C.eq); else o += cir(mid, 7, C.eq) + cir(mid, 1.6, C.eq, 1); }
  if (eq === 'bbf') o += ln([j.W1[0] + 6, j.W1[1]], [j.W2[0] - 6, j.W2[1]], 2.2, C.eq);
  if (eq === 'db' || eq === 'db1') { [j.W1, eq === 'db' ? j.W2 : null].forEach(function (w) { if (w) o += '<rect x="' + f1(w[0] - 4.5) + '" y="' + f1(w[1] - 2.2) + '" width="9" height="4.4" rx="2" fill="' + C.eq + '"/>'; }); }
  if (eq === 'kb' || eq === 'kb1') o += cir([mid[0], mid[1] + 4], 4, C.eq, 1) + cir([mid[0], mid[1] + 0.5], 2.2, C.eq);
  if (eq === 'mb' || eq === 'plate') o += cir(eq === 'mb' ? mid : mid, eq === 'mb' ? 5 : 6, C.eq, eq === 'mb');
  if (eq === 'wheel') o += cir([mid[0], mid[1] - 1], 4, C.eq) + cir([mid[0], mid[1] - 1], 1.2, C.eq, 1);
  if (eq === 'hd' || eq === 'vh') o += cir(j.W1, 2.2, C.eq, 1) + cir(j.W2, 2.2, C.eq, 1);
  if (eq === 'lm') o += ln([10, 90], mid, 2.4, C.eq) + cir(mid, 2.2, C.eq, 1);
  if (eq === 'belt') o += ln(j.P, [j.P[0] + 2, j.P[1] + 14], 1.5, C.eq) + cir([j.P[0] + 2, j.P[1] + 17], 3.5, C.eq, 1);
  if (/^cable|^lb$/.test(eq)) {
    var A = anc || [[90, 10]];
    if (eq === 'lb') o += ln(A[0], mid, 1.2, C.back) + ln([mid[0] - 10, mid[1]], [mid[0] + 10, mid[1]], 2.4, C.eq);
    else if (eq === 'cable1') o += ln(A[0], j.W1, 1.2, C.back) + cir(j.W1, 2, C.eq, 1);
    else if (eq === 'cablef') o += ln([50, 90], mid, 1.2, C.back) + ln([j.W1[0] + 4, j.W1[1]], [j.W2[0] - 4, j.W2[1]], 2.2, C.eq);
    else { o += ln(A[0], j.W1, 1.2, C.back) + (A[1] ? ln(A[1], j.W2, 1.2, C.back) : ''); o += cir(j.W1, 2, C.eq, 1) + (A[1] ? cir(j.W2, 2, C.eq, 1) : ''); }
    A.forEach(function (a) { if (a) o += cir(a, 2.2, C.pr, 1); });
  }
  return o;
}
function body(j, fv) {
  var o = '', w = 4.6;
  // 奥の腕・脚（横から見たとき）は暗く
  var bc = fv ? C.body : C.back;
  o += ln(j.P2, j.K2, w, bc) + ln(j.K2, j.A2, w, bc) + ln(j.A2, j.T2, w * 0.8, bc);
  if (!fv) o += ln(j.S2, j.E2, w, bc) + ln(j.E2, j.W2, w, bc);
  o += ln(j.P, j.S, w + 1.6, C.body) + (fv ? ln(j.S1, j.S2, w, C.body) + ln(j.P1, j.P2, w, C.body) : '');
  o += ln(j.P1, j.K1, w, C.body) + ln(j.K1, j.A1, w, C.body) + ln(j.A1, j.T1, w * 0.8, C.body);
  if (fv) o += ln(j.S2, j.E2, w, C.body) + ln(j.E2, j.W2, w, C.body);
  o += ln(j.S1, j.E1, w, C.body) + ln(j.E1, j.W1, w, C.body);
  o += cir(j.H, L.R, C.body, 1);
  return o;
}
var cache = {};
function poses(f) { var k = f.m; if (!k._a) { k._a = fk(k.a); k._b = fk(k.b); } return [k._a, k._b]; }
function frame(name, part, k) {
  var f = find(name, part); if (!f) return '';
  var pp = poses(f), j = lerp(pp[0], pp[1], k), fv = f.m.fv;
  var smith = f.eq === 'smith' ? ln([j.W1[0] - 9, 2], [j.W1[0] - 9, FLOOR], 1.2, C.pr) : '';
  return '<line x1="2" y1="' + (FLOOR + 1.5) + '" x2="98" y2="' + (FLOOR + 1.5) + '" stroke="' + C.fl + '" stroke-width="1.5"/>' + props(f.m.pr) + smith + body(j, fv) + equip(f.eq, j, f.m.anc, fv);
}
function svg(name, part, k) { return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + frame(name, part, k == null ? 1 : k) + '</svg>'; }
// 動かす: el の中の svg を、行ったり来たり（2.6秒で1往復）
var live = [], raf = 0;
function tick(ts) {
  live = live.filter(function (x) { return x.el.isConnected; });
  if (!live.length) { raf = 0; return; }
  var k = (1 - Math.cos(ts / 2600 * 2 * Math.PI)) / 2;
  live.forEach(function (x) { var s = x.el.querySelector('svg'); if (s) s.innerHTML = frame(x.name, x.part, k); });
  raf = requestAnimationFrame(tick);
}
function animate(el, name, part) { el.innerHTML = svg(name, part, 0); live.push({ el: el, name: name, part: part }); if (!raf) raf = requestAnimationFrame(tick); }
return { svg: svg, animate: animate, has: function (n) { return !!EX[n]; }, types: M, map: EX };
})();
