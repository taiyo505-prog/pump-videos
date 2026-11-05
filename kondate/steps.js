// 作り方の各手順のイラスト（SVG）。手順の文から「切る・炒める・煮る・揚げる・レンジ…」を読み取って描く。
// 火加減は炎の数（弱火1・中火2・強火3）、具は材料の色で描く
(function () {
'use strict';
var W = 160, H = 120;
function col(r, text) {
  var C = window.FOOD_COL || {}, l = [];
  r.ing.forEach(function (i) { if (C[i.n] && text.indexOf(i.n.replace(/（.*）/, '')) >= 0) l.push(C[i.n]); });
  if (!l.length) r.ing.forEach(function (i) { if (i.food && C[i.n] && l.length < 4) l.push(C[i.n]); });
  return l.length ? l : ['#E3B47E', '#B9DA8C', '#F08A2C'];
}
function rnd(seed) { var s = 7; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; }; }
function bits(R, cols, cx, cy, rx, ry, n, sz) { var h = ''; for (var k = 0; k < n; k++) { var a = R() * 6.28, d = Math.sqrt(R()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, c = cols[k % cols.length]; h += "<rect x='" + (x - sz / 2) + "' y='" + (y - sz / 3) + "' width='" + sz + "' height='" + (sz * .66) + "' rx='" + (sz * .25) + "' fill='" + c + "' stroke='rgba(0,0,0,.18)' stroke-width='.8' transform='rotate(" + Math.round(R() * 160) + ' ' + x + ' ' + y + ")'/>"; } return h; }
function flame(n, cx, y) {
  var h = "<rect x='" + (cx - 46) + "' y='" + (y + 4) + "' width='92' height='9' rx='4' fill='#5A5A66'/>";
  if (!n) return h;
  var xs = n === 1 ? [cx] : n === 2 ? [cx - 14, cx + 14] : [cx - 24, cx, cx + 24], s = n === 1 ? .8 : n === 2 ? 1 : 1.25;
  xs.forEach(function (x) { h += "<path d='M" + x + ' ' + (y + 4) + ' q' + (-7 * s) + ' ' + (-9 * s) + ' 0 ' + (-20 * s) + ' q' + (7 * s) + ' ' + (11 * s) + ' 0 ' + (20 * s) + "z' fill='#FF7A2F'/><path d='M" + x + ' ' + (y + 4) + ' q' + (-3.5 * s) + ' ' + (-5 * s) + ' 0 ' + (-11 * s) + ' q' + (3.5 * s) + ' ' + (6 * s) + ' 0 ' + (11 * s) + "z' fill='#FFD84A'/>"; });
  return h;
}
function heatN(heat, text) { var t = (heat || '') + text; if (/強火/.test(t)) return 3; if (/弱火/.test(t) && !/中火/.test(t)) return 1; if (/中火|弱火〜中火/.test(t)) return 2; return 2; }
function pan(R, cols, n, extra) { return flame(n, 80, 98) + "<ellipse cx='74' cy='78' rx='50' ry='16' fill='#3A3A44'/><ellipse cx='74' cy='74' rx='46' ry='13' fill='#5A5A66'/><rect x='118' y='68' width='38' height='8' rx='4' fill='#3A3A44' transform='rotate(-8 118 72)'/>" + bits(R, cols, 74, 72, 36, 8, 14, 11) + (extra || ''); }
function pot(R, liquid, cols, n, lid) {
  var h = flame(n, 80, 100) + "<rect x='30' y='46' width='100' height='54' rx='8' fill='#B8BEC8'/><rect x='22' y='50' width='12' height='7' rx='3' fill='#8A909A'/><rect x='126' y='50' width='12' height='7' rx='3' fill='#8A909A'/><ellipse cx='80' cy='46' rx='50' ry='11' fill='#D8DCE2'/><ellipse cx='80' cy='47' rx='45' ry='8' fill='" + liquid + "'/>";
  h += bits(R, cols, 80, 46, 34, 5, 8, 10);
  for (var k = 0; k < 4; k++) h += "<circle cx='" + (52 + k * 18) + "' cy='" + (44 + (k % 2) * 3) + "' r='3' fill='#fff' opacity='.7'/>";
  h += "<path d='M60 30 q-6 -8 0 -16 M80 28 q-6 -8 0 -16 M100 30 q-6 -8 0 -16' stroke='#C8D0DA' stroke-width='3' fill='none' stroke-linecap='round' opacity='.8'/>";
  if (lid) h += "<ellipse cx='80' cy='46' rx='30' ry='6' fill='#E8D2A8' stroke='#C8A870' stroke-width='2'/><circle cx='70' cy='45' r='1.6' fill='#C8A870'/><circle cx='90' cy='46' r='1.6' fill='#C8A870'/>";
  return h;
}
var D = {
  prepare: function (R) { var h = "<rect x='14' y='80' width='132' height='10' rx='4' fill='#E8D8C0'/>"; [['#8E5426', 34], ['#F2E8D8', 66], ['#C8402E', 98], ['#F7E8B0', 128]].forEach(function (b) { h += "<path d='M" + (b[1] - 15) + " 62 q15 26 30 0 z' fill='#fff' stroke='#D8CCB8' stroke-width='2'/><ellipse cx='" + b[1] + "' cy='62' rx='15' ry='4' fill='" + b[0] + "'/>"; }); return h + "<rect x='60' y='14' width='10' height='34' rx='4' fill='#C8C0B4' transform='rotate(25 65 31)'/><ellipse cx='54' cy='46' rx='9' ry='5' fill='#C8C0B4' transform='rotate(25 54 46)'/>"; },
  cut: function (R, c) { return "<rect x='14' y='56' width='132' height='42' rx='8' fill='#D8B07A'/><rect x='14' y='52' width='132' height='42' rx='8' fill='#F0CC94'/>" + bits(R, c, 56, 74, 28, 10, 12, 12) + "<rect x='92' y='40' width='54' height='14' rx='3' fill='#D8DDE4' transform='rotate(-24 92 47)'/><rect x='136' y='20' width='22' height='10' rx='4' fill='#5A3A2A' transform='rotate(-24 136 25)'/><path d='M96 46 l46 -20' stroke='#fff' stroke-width='1.5' opacity='.7'/>"; },
  mix: function (R, c) { return "<path d='M24 50 Q30 104 80 104 Q130 104 136 50 Z' fill='#FFFFFF' stroke='#D8CCB8' stroke-width='3'/><ellipse cx='80' cy='50' rx='56' ry='12' fill='#F7EED8' stroke='#D8CCB8' stroke-width='3'/>" + bits(R, c, 80, 50, 40, 7, 10, 10) + "<path d='M64 52 q16 -10 32 0 q-16 10 -32 0' stroke='#C8A870' stroke-width='2' fill='none'/><rect x='92' y='6' width='7' height='44' rx='3' fill='#A8B0BC' transform='rotate(28 96 28)'/><ellipse cx='84' cy='48' rx='10' ry='14' fill='none' stroke='#A8B0BC' stroke-width='3' transform='rotate(28 84 48)'/>"; },
  fry: function (R, c, n) { return pan(R, c, n, "<path d='M50 52 q-4 -8 0 -14 M72 50 q-4 -8 0 -14 M94 52 q-4 -8 0 -14' stroke='#E8D8C8' stroke-width='2.5' fill='none' stroke-linecap='round'/><rect x='64' y='26' width='8' height='36' rx='3' fill='#C89060' transform='rotate(-30 68 44)'/>"); },
  deepfry: function (R, c, n) { var h = flame(n, 80, 100) + "<path d='M22 52 Q26 98 80 98 Q134 98 138 52 Z' fill='#3A3A44'/><ellipse cx='80' cy='52' rx='58' ry='12' fill='#5A5A66'/><ellipse cx='80' cy='53' rx='52' ry='9' fill='#F2C850'/>"; for (var k = 0; k < 4; k++) { var x = 50 + k * 20; h += "<ellipse cx='" + x + "' cy='51' rx='9' ry='6' fill='#D8963E' stroke='#B87428'/>"; } for (var j = 0; j < 9; j++) h += "<circle cx='" + (40 + R() * 80) + "' cy='" + (48 + R() * 8) + "' r='" + (1.5 + R() * 2) + "' fill='#FFF6C8'/>"; return h + "<text x='120' y='30' font-size='13' font-weight='900' fill='#E0552A'>170℃</text>"; },
  boil: function (R, c, n) { return pot(R, '#D8EEF8', c, n || 3); },
  simmer: function (R, c, n, t, r) { var lq = /味噌/.test(t) ? '#D8B070' : /トマト|ケチャップ/.test(t + r.ing.map(function (i) { return i.n; }).join()) ? '#D8603A' : /牛乳|クリーム|豆乳/.test(t) ? '#F8F0DE' : '#C8904E'; return pot(R, lq, c, n || 2, /落としぶた/.test(t)); },
  soup: function (R, c, n) { return pot(R, '#E8C878', c, n || 1); },
  mic: function (R, c, n, t) { var m = t.match(/(\d+(?:\.\d+)?)\s*分/), s = t.match(/(\d+)\s*秒/); var lab = m ? m[1] + '分' : s ? s[1] + '秒' : ''; return "<rect x='14' y='22' width='132' height='80' rx='10' fill='#F2F0EA' stroke='#C8C4BA' stroke-width='3'/><rect x='24' y='32' width='84' height='60' rx='6' fill='#3A3A44'/><rect x='28' y='36' width='76' height='52' rx='4' fill='#FFE8A8' opacity='.85'/><ellipse cx='66' cy='76' rx='26' ry='7' fill='#fff'/>" + bits(R, c, 66, 70, 18, 5, 6, 9) + "<rect x='114' y='34' width='26' height='14' rx='3' fill='#2E3A2E'/><text x='127' y='45' font-size='9' text-anchor='middle' fill='#7CFF8A' font-weight='700'>600W</text><text x='127' y='64' font-size='12' text-anchor='middle' fill='#E0552A' font-weight='900'>" + lab + "</text><circle cx='127' cy='82' r='7' fill='#D8D4CA'/>"; },
  oven: function (R, c) { return "<rect x='16' y='24' width='128' height='78' rx='10' fill='#E8E4DA' stroke='#B8B0A0' stroke-width='3'/><rect x='26' y='34' width='90' height='58' rx='6' fill='#3A2A20'/><rect x='30' y='38' width='82' height='50' rx='4' fill='#FF9A4A' opacity='.55'/><path d='M34 44 h74 M34 82 h74' stroke='#FF5A2A' stroke-width='3'/><rect x='40' y='60' width='62' height='18' rx='4' fill='#F2D27A'/>" + bits(R, ['#C8873A', '#A8622A'], 71, 68, 26, 5, 8, 8) + "<circle cx='130' cy='46' r='7' fill='#C8C0B0'/><circle cx='130' cy='70' r='7' fill='#C8C0B0'/>"; },
  chill: function () { return "<rect x='46' y='8' width='68' height='104' rx='8' fill='#EAF4FA' stroke='#B8CCD8' stroke-width='3'/><path d='M46 46 h68' stroke='#B8CCD8' stroke-width='3'/><rect x='52' y='18' width='4' height='20' rx='2' fill='#9AB0C0'/><rect x='52' y='54' width='4' height='26' rx='2' fill='#9AB0C0'/><text x='88' y='34' font-size='16' text-anchor='middle'>❄️</text><text x='120' y='100' font-size='12' fill='#5A9AC8' font-weight='900'>冷やす</text>"; },
  soak: function (R, c) { return "<path d='M22 52 Q28 104 80 104 Q132 104 138 52 Z' fill='#E8F4FA' stroke='#B8D4E4' stroke-width='3'/><ellipse cx='80' cy='52' rx='58' ry='12' fill='#C8E8F8' stroke='#B8D4E4' stroke-width='3'/>" + bits(R, c, 80, 54, 40, 6, 10, 11) + "<path d='M40 46 q8 -4 16 0 M96 46 q8 -4 16 0' stroke='#fff' stroke-width='2' fill='none'/>"; },
  squeeze: function (R, c) { return "<path d='M30 60 Q34 100 80 100 Q126 100 130 60 Z' fill='#fff' stroke='#D8CCB8' stroke-width='3'/><ellipse cx='80' cy='60' rx='50' ry='10' fill='#F7F2E8' stroke='#D8CCB8' stroke-width='3'/>" + bits(R, c, 80, 60, 34, 5, 8, 10) + "<path d='M56 24 q24 -14 48 0 q6 16 -6 26 q-18 8 -36 0 q-12 -10 -6 -26z' fill='#F7D8C0' stroke='#D8A888' stroke-width='2'/><path d='M80 52 v10 M72 52 v8 M88 52 v8' stroke='#7AB8E8' stroke-width='2.5' stroke-linecap='round'/>"; },
  egg: function (R, c, n) { return pan(R, ['#F7D24A', '#FBE68A'], n, "<ellipse cx='118' cy='30' rx='12' ry='15' fill='#FBF3E2' stroke='#E0D2B8' stroke-width='2'/><path d='M106 32 l5 -4 l4 4 l5 -4 l4 4 l6 -3' stroke='#E0D2B8' stroke-width='2' fill='#fff'/><path d='M112 46 q-6 10 -18 18' stroke='#F7D24A' stroke-width='5' fill='none' stroke-linecap='round'/>"); },
  plate: function (R, c, n, t, r) { var svg = window.dishSVG ? window.dishSVG(r) : ''; var inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); return "<g transform='translate(8,6) scale(.6)'>" + inner + "</g><text x='132' y='26' font-size='18'>✨</text><text x='14' y='30' font-size='14'>✨</text>"; },
  rice: function () { return "<rect x='34' y='30' width='92' height='70' rx='22' fill='#F2F0EA' stroke='#C8C4BA' stroke-width='3'/><rect x='34' y='30' width='92' height='26' rx='13' fill='#E0DCD2'/><rect x='66' y='70' width='28' height='12' rx='3' fill='#2E3A2E'/><text x='80' y='80' font-size='8' text-anchor='middle' fill='#7CFF8A' font-weight='700'>炊飯</text><path d='M60 22 q-5 -8 0 -14 M80 20 q-5 -8 0 -14 M100 22 q-5 -8 0 -14' stroke='#C8D0DA' stroke-width='3' fill='none' stroke-linecap='round'/>"; },
  wrap: function (R, c) { return "<rect x='14' y='56' width='132' height='42' rx='8' fill='#F0CC94'/><rect x='30' y='60' width='60' height='30' rx='6' fill='" + c[0] + "' stroke='rgba(0,0,0,.2)'/><rect x='92' y='56' width='34' height='38' rx='17' fill='" + (c[1] || c[0]) + "' stroke='rgba(0,0,0,.25)'/><path d='M100 62 q8 14 0 28 M110 62 q8 14 0 28' stroke='rgba(0,0,0,.25)' fill='none'/><path d='M60 40 q20 -16 40 0' stroke='#E0552A' stroke-width='3' fill='none' marker-end=''/><path d='M96 34 l6 6 l-8 2' fill='#E0552A'/>"; },
  taste: function () { return "<ellipse cx='70' cy='86' rx='36' ry='10' fill='#fff' stroke='#D8CCB8' stroke-width='3'/><ellipse cx='70' cy='84' rx='26' ry='6' fill='#E8C878'/><rect x='96' y='24' width='8' height='54' rx='4' fill='#C89A60' transform='rotate(35 100 51)'/><ellipse cx='84' cy='72' rx='12' ry='8' fill='#D8AA70' transform='rotate(35 84 72)'/><text x='118' y='40' font-size='22'>👅</text>"; },
  grill: function (R, c, n) { return flame(n, 80, 100) + "<rect x='22' y='60' width='116' height='30' rx='6' fill='#3A3A44'/><path d='M30 66 h100 M30 74 h100 M30 82 h100' stroke='#6A6A76' stroke-width='2'/>" + bits(R, c, 80, 64, 40, 6, 6, 16); },
  pour: function (R, c, n) { return pan(R, c, n, "<g transform='rotate(-35 118 30)'><path d='M100 22 q18 22 36 0 z' fill='#fff' stroke='#D8CCB8' stroke-width='2'/><ellipse cx='118' cy='22' rx='18' ry='4' fill='#C89060'/></g><path d='M104 42 q-8 10 -14 22' stroke='#C89060' stroke-width='4' fill='none' stroke-linecap='round'/>"); },
  sprinkle: function (R, c, n, t, r) { return D.plate(R, c, n, t, r) + "<rect x='112' y='10' width='18' height='24' rx='4' fill='#E8E4DA' stroke='#B8B0A0' stroke-width='2' transform='rotate(30 121 22)'/><circle cx='110' cy='40' r='1.5' fill='#888'/><circle cx='104' cy='46' r='1.5' fill='#888'/><circle cx='112' cy='48' r='1.5' fill='#888'/>"; }
};
function action(t) {
  if (/^【先に準備】/.test(t)) return 'prepare';
  if (/味見/.test(t)) return 'taste';
  if (/レンジ/.test(t)) return 'mic';
  if (/トースター|オーブン/.test(t)) return 'oven';
  if (/冷蔵庫|冷やす|冷やし|冷凍庫/.test(t)) return 'chill';
  if (/揚げ焼き|揚げる|で揚げ|カラッと|揚げて/.test(t.replace(/油揚げ|厚揚げ|揚げびたし/g, ''))) return 'deepfry';
  if (/炊く|炊いて|炊飯/.test(t)) return 'rice';
  if (/(溶き卵|卵).*(回し入れ|流し|とじ)|卵焼き器|いり卵/.test(t)) return 'egg';
  if (/ゆでる|ゆで|ゆがく|沸騰したお湯/.test(t) && !/ゆで卵を|ゆでた/.test(t)) return 'boil';
  if (/煮る|煮て|煮込|煮立て|煮詰め|煮からめ|落としぶた/.test(t)) return 'simmer';
  if (/グリル|網で/.test(t)) return 'grill';
  if (/炒め|焼く|焼き|焼いて|ソテー|からめる|からめ|絡め/.test(t)) return 'fry';
  if (/温め|沸か/.test(t)) return 'soup';
  if (/さらす|さらして|もどす|もどして|つけて|漬け|浸/.test(t)) return 'soak';
  if (/しぼ|塩もみ|もみこ|もんで/.test(t)) return 'squeeze';
  if (/巻|包/.test(t)) return 'wrap';
  if (/切る|切り|刻|みじん|ちぎ|ほぐす|割る|むく|取る|筋をとる|種をとる/.test(t)) return 'cut';
  if (/混ぜ|あえ|和え|溶く|とく|練/.test(t)) return 'mix';
  if (/ふる|散らす/.test(t)) return 'sprinkle';
  if (/入れ|加え|注|回しかけ|かける/.test(t) && !/器|盛/.test(t)) return 'pour';
  return 'plate';
}
window.stepSVG = function (t, r, heat, idx) {
  var a = action(t), R = rnd(r.id + idx), c = col(r, t), n = /fry|deepfry|boil|simmer|soup|egg|grill|pour/.test(a) ? heatN(heat, t) : 0;
  var body; try { body = D[a](R, c, n, t, r); } catch (e) { body = D.plate(R, c, n, t, r); }
  return "<svg viewBox='0 0 " + W + ' ' + H + "' xmlns='http://www.w3.org/2000/svg'>" + body + '</svg>';
};
window.stepAction = action;
// 手順の文から時間（タイマー用）を取り出す。「10〜15分」なら短いほう
window.stepTime = function (t) {
  var m = t.match(/(\d+(?:\.\d+)?)\s*(?:〜|~|-)?\s*(?:\d+\s*)?分/), s = t.match(/(\d+)\s*秒/), h = t.match(/(\d+)\s*時間/);
  if (/ひと晩|半日/.test(t)) return 0;
  if (h && !m) return Math.min(+h[1], 3) * 3600;
  if (m) return Math.round(parseFloat(m[1]) * 60);
  if (s) return +s[1];
  return 0;
};
})();
