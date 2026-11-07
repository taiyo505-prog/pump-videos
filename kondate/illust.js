// 料理のイラスト（SVG）。料理の名前と材料から「丼・カレー・ラーメン・パスタ・汁物・揚げ物…」の形を選んで、
// 材料の色で具をのせる。ぱっと見で何の料理かわかるように描く
(function () {
'use strict';
var W = 240, H = 180;
// ---- 食材の色（加熱したときの色） ----
var C = {
  '豚こま肉': '#D9A27E', '豚バラ肉': '#E2B08F', '豚ロース肉': '#D9A27E', '鶏もも肉': '#E3B47E', '鶏むね肉': '#EED3A8', 'ささみ': '#F0DAB4', '手羽元': '#C98A4E', '手羽先': '#C98A4E',
  'ひき肉': '#9C6B4E', '鶏ひき肉': '#D9B48A', '牛ひき肉': '#8A5A3E', '牛こま肉': '#8E5B3E', '牛バラ肉': '#8E5B3E', '牛ステーキ肉': '#7A4630', 'ベーコン': '#C9715C', 'ウインナー': '#C2623F', 'ソーセージ': '#B85A3A', 'ハム': '#F2A9A0', 'サラダチキン': '#F0DAB4', '鶏レバー': '#6E3A2E',
  '鮭': '#F2906E', 'サーモン': '#F6896A', 'サバ': '#B9B2A6', 'サバ缶': '#A88F7A', 'ツナ缶': '#D8B58E', 'エビ': '#F4845F', 'しらす': '#F5EEDC', 'ちくわ': '#D9A45E', 'イカ': '#F6EEE2', 'タコ': '#C84E48', 'ホタテ': '#F3E3C8', 'あさり': '#CDB79E', 'しじみ': '#5E5448',
  'たら': '#F7F2E8', 'ぶり': '#C7A08A', 'さんま': '#8C9AA6', 'まぐろ': '#C2324A', 'かにかま': '#E8584A', 'はんぺん': '#FBF8F0', '明太子': '#E8604E', 'アジ': '#A9B2B8', 'いわし': '#8F9CA8', 'シーフードミックス': '#F2D2B8', 'かまぼこ': '#F59AAE',
  '卵': '#F7D24A', 'うずらの卵': '#FBF3DA', '豆腐': '#FBF8EE', '油揚げ': '#D9A050', '厚揚げ': '#C98A40', 'がんもどき': '#C08A48', '高野豆腐': '#EFE2C2', '納豆': '#B8863E', '大豆水煮': '#E8CF8E', 'チーズ': '#F7C843', 'クリームチーズ': '#FBF6EA', 'こんにゃく': '#8E8A86',
  'キャベツ': '#B9DA8C', '白菜': '#E9F1C9', '玉ねぎ': '#F3E1B0', 'にんじん': '#F08A2C', 'じゃがいも': '#F1D68E', 'さつまいも': '#F2C04E', '里芋': '#EDE3D2', '長いも': '#F6F0E2', 'もやし': '#F6F1DE',
  'ほうれん草': '#3F8E3C', '小松菜': '#3F8E3C', 'チンゲン菜': '#6BAE4A', '春菊': '#3F8E3C', '水菜': '#7BBE5A', 'ニラ': '#4E9A38', 'ピーマン': '#3FA34D', 'パプリカ': '#E8452C', 'なす': '#5C3A70', 'トマト': '#E5412D', 'ミニトマト': '#E5412D',
  'きのこ': '#C9A27E', 'しいたけ': '#8A6A4E', 'えのき': '#F2ECD8', 'ブロッコリー': '#4C9A3A', 'カリフラワー': '#F4EEDC', '長ねぎ': '#E0ECC0', 'ねぎ（小ねぎ）': '#5FAE45', '三つ葉': '#6FB850', '大葉': '#4E9A3A', 'きゅうり': '#6BAA4A', 'ゴーヤ': '#5E9E3A',
  'かぼちゃ': '#F2A93B', 'アボカド': '#A7C95C', 'レタス': '#A9D46F', 'ベビーリーフ': '#7FB85A', 'ごぼう': '#8A6A4A', 'れんこん': '#EEE2C8', '大根': '#F5F2E6', 'かぶ': '#F7F4EA', 'オクラ': '#5EA840', 'アスパラ': '#6FA848', 'いんげん': '#5EA840', 'スナップえんどう': '#7CC050', '枝豆': '#7CBF4A',
  'とうもろこし': '#F6D04A', 'コーン缶': '#F6D04A', 'ズッキーニ': '#5E9A40', 'セロリ': '#A8CF7A', '豆苗': '#7CC050', 'しょうが': '#E9C98A', 'にんにくの芽': '#5EA840', 'たけのこ': '#EBD49A', 'みょうが': '#E8A0B8', 'ミックスベジタブル': '#F2A23A',
  'りんご': '#F5E3B0', 'バナナ': '#F7E07A', 'いちご': '#E8384A', 'みかん': '#F59A2A', 'レモン': '#F7E04A', 'キウイ': '#8CBF3A', 'ぶどう': '#7A4A9A', 'もも': '#F7B9A0', 'パイナップル': '#F7D44A', '柿': '#F08A30', 'なし': '#F2E8C0', '洋なし': '#E8E0A0',
  'グレープフルーツ': '#F59080', 'マンゴー': '#F7B030', 'ブルーベリー': '#4A4A9A', 'メロン': '#B8DC8A', 'すいか': '#F0525A', 'さくらんぼ': '#C8203A', 'いちじく': '#9A4A6A', 'ゆず': '#F7D040',
  'キムチ': '#E0503A', '塩昆布': '#3E3A30', 'わかめ': '#3E6A3A', 'ひじき': '#2E2A26', 'トマト缶': '#D8402E', '梅干し': '#D8384A', '焼きのり': '#22302A', 'チョコレート': '#6A3E2A', 'ナッツ': '#C89A60', 'あんこ': '#5A2E2E', 'メンマ': '#C9A060', 'ザーサイ': '#9AB060', 'もずく': '#4A4A2A', '切り干し大根': '#EADBB8', 'たくあん': '#F7D850', 'ジャム': '#C8303A', 'コーンフレーク': '#E8B85A',
  'ヨーグルト': '#FBF8F2', '牛乳': '#FBF8F2', '生クリーム': '#FFFDF6', '豆乳': '#F5EFE0', 'もち': '#FBF8F0', 'マカロニ': '#F2D898', '春雨': '#F2F0EA', '餃子の皮': '#F2E2C0'
};
var BASE = { 'ごはん': 1, 'パスタ': 1, 'うどん': 1, '中華麺': 1, 'そば': 1, 'そうめん': 1, '食パン': 1, 'ロールパン': 1, 'バゲット': 1, 'トルティーヤ': 1, '冷凍ピザ生地': 1, 'ホットケーキミックス': 1, 'オートミール': 1 };
// ---- たね（同じレシピはいつも同じ絵） ----
function rnd(seed) { var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0; return function () { s = (s * 1103515245 + 12345) >>> 0; return (s >>> 8) / 16777216; }; }
function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); } return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1); }
function has(r, re) { return r.ing.some(function (i) { return re.test(i.n); }); }
function foodCols(r, skip) { var l = []; r.ing.forEach(function (i) { if (i.food && !BASE[i.n] && C[i.n] && (!skip || !skip.test(i.n))) l.push(C[i.n]); }); return l.length ? l : ['#D9A27E', '#B9DA8C']; }
// たれ・ソースの色
function sauce(r) {
  if (has(r, /カレー/)) return '#B5651D';
  if (has(r, /トマト缶|ケチャップ|ピザソース/)) return '#D2452E';
  if (has(r, /コチュジャン|キムチ|豆板醤/)) return '#C8402E';
  if (has(r, /生クリーム|シチュー/) || (has(r, /牛乳/) && has(r, /小麦粉|コンソメ/))) return '#FBF4E2';
  if (has(r, /味噌/)) return '#B98A4E';
  if (has(r, /オイスター|焼肉のタレ|甜麺醤/)) return '#6E3E22';
  if (has(r, /醤油|めんつゆ/) && has(r, /砂糖|みりん/)) return '#8E5426';
  return null;
}
// ---- 形のパーツ ----
var DEF = "<defs><radialGradient id='gl' cx='35%' cy='30%' r='70%'><stop offset='0' stop-color='#fff' stop-opacity='.55'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient>" +
  "<linearGradient id='bw' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.18'/></linearGradient></defs>";
function shadow(cx, cy, rx) { return "<ellipse cx='" + cx + "' cy='" + cy + "' rx='" + rx + "' ry='" + (rx * .16) + "' fill='#7A4A2A' opacity='.14'/>"; }
function plate(cx, cy, rx, ry, col) { col = col || '#FFFFFF'; return shadow(cx, cy + ry * .9, rx * .95) + "<ellipse cx='" + cx + "' cy='" + (cy + 4) + "' rx='" + rx + "' ry='" + ry + "' fill='" + shade(col, -.12) + "'/><ellipse cx='" + cx + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "' fill='" + col + "'/><ellipse cx='" + cx + "' cy='" + cy + "' rx='" + (rx * .78) + "' ry='" + (ry * .74) + "' fill='" + shade(col, -.05) + "'/>"; }
// 丼・お椀（前から見た形）。中身は top の楕円に描く
function bowl(cx, top, rx, depth, col, inner) {
  var ry = rx * .3, y = top;
  return shadow(cx, y + depth + 6, rx * .7) +
    "<path d='M" + (cx - rx) + ' ' + y + ' Q' + (cx - rx * .92) + ' ' + (y + depth) + ' ' + (cx - rx * .38) + ' ' + (y + depth) + ' L' + (cx + rx * .38) + ' ' + (y + depth) + ' Q' + (cx + rx * .92) + ' ' + (y + depth) + ' ' + (cx + rx) + ' ' + y + " Z' fill='" + col + "'/>" +
    "<path d='M" + (cx - rx) + ' ' + y + ' Q' + (cx - rx * .92) + ' ' + (y + depth) + ' ' + (cx - rx * .38) + ' ' + (y + depth) + ' L' + (cx + rx * .38) + ' ' + (y + depth) + ' Q' + (cx + rx * .92) + ' ' + (y + depth) + ' ' + (cx + rx) + ' ' + y + " Z' fill='url(#bw)'/>" +
    "<rect x='" + (cx - rx * .3) + "' y='" + (y + depth - 2) + "' width='" + (rx * .6) + "' height='8' rx='3' fill='" + shade(col, -.2) + "'/>" +
    "<ellipse cx='" + cx + "' cy='" + y + "' rx='" + rx + "' ry='" + ry + "' fill='" + shade(col, .25) + "'/>" +
    "<ellipse cx='" + cx + "' cy='" + (y + 1) + "' rx='" + (rx - 6) + "' ry='" + (ry - 4) + "' fill='" + (inner || '#fff') + "'/>";
}
// 具（小さいかたまり）を楕円の中に散らす
function chunks(R, cols, cx, cy, rx, ry, n, size, shape) {
  var h = '';
  for (var k = 0; k < n; k++) {
    var a = R() * Math.PI * 2, d = Math.sqrt(R()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, c = cols[k % cols.length], s = size * (.7 + R() * .6), rot = Math.round(R() * 180);
    if (shape === 'leaf') h += "<ellipse cx='" + x + "' cy='" + y + "' rx='" + s + "' ry='" + (s * .45) + "' fill='" + c + "' transform='rotate(" + rot + ' ' + x + ' ' + y + ")' stroke='" + shade(c, -.25) + "' stroke-width='.8'/>";
    else if (shape === 'dot') h += "<circle cx='" + x + "' cy='" + y + "' r='" + (s * .35) + "' fill='" + c + "'/>";
    else h += "<rect x='" + (x - s / 2) + "' y='" + (y - s * .35) + "' width='" + s + "' height='" + (s * .7) + "' rx='" + (s * .25) + "' fill='" + c + "' stroke='" + shade(c, -.22) + "' stroke-width='.8' transform='rotate(" + rot + ' ' + x + ' ' + y + ")'/>";
  }
  return h;
}
function rice(R, cx, cy, rx, ry) { var h = "<ellipse cx='" + cx + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "' fill='#FFFDF6'/>"; for (var k = 0; k < 26; k++) { var a = R() * 6.28, d = Math.sqrt(R()); h += "<ellipse cx='" + (cx + Math.cos(a) * rx * d * .9) + "' cy='" + (cy + Math.sin(a) * ry * d * .9) + "' rx='2.6' ry='1.3' fill='#EFE8D6' transform='rotate(" + Math.round(R() * 180) + ' ' + (cx + Math.cos(a) * rx * d * .9) + ' ' + (cy + Math.sin(a) * ry * d * .9) + ")'/>"; } return h; }
function greens(R, cx, cy, rx, ry, n) { return chunks(R, ['#5FAE45', '#4E9A38'], cx, cy, rx, ry, n || 8, 3.5, 'dot'); }
function noodles(R, cx, cy, rx, ry, col, thick) { var h = ''; for (var k = 0; k < 9; k++) { var y = cy - ry * .7 + k * ry * .17, x0 = cx - rx * .85, x1 = cx + rx * .85; h += "<path d='M" + x0 + ' ' + y + ' Q' + (cx - rx * .4) + ' ' + (y - 6 + R() * 12) + ' ' + cx + ' ' + y + ' T' + x1 + ' ' + (y + R() * 4 - 2) + "' stroke='" + col + "' stroke-width='" + thick + "' fill='none' stroke-linecap='round'/>"; } return h; }
function egg(cx, cy, s, half) { return half ? "<ellipse cx='" + cx + "' cy='" + cy + "' rx='" + s + "' ry='" + (s * .75) + "' fill='#FFFDF6' stroke='#EADFC8'/><circle cx='" + cx + "' cy='" + cy + "' r='" + (s * .45) + "' fill='#F7B731'/>" : "<path d='M" + (cx - s) + ' ' + cy + ' q' + (s * .2) + ' ' + (-s * .9) + ' ' + s + ' ' + (-s * .7) + ' q' + s + ' ' + (-s * .1) + ' ' + s + ' ' + (s * .6) + ' q' + (-s * .2) + ' ' + (s * .9) + ' ' + (-s) + ' ' + (s * .8) + ' q' + (-s * .8) + ' ' + (-s * .1) + ' ' + (-s) + ' ' + (-s * .7) + "z' fill='#FFFDF6' stroke='#EADFC8'/><circle cx='" + cx + "' cy='" + cy + "' r='" + (s * .42) + "' fill='#F7B731'/><circle cx='" + (cx - s * .14) + "' cy='" + (cy - s * .14) + "' r='" + (s * .12) + "' fill='#fff' opacity='.7'/>"; }
function lemon(x, y) { return "<path d='M" + x + ' ' + y + " a10 10 0 0 1 20 0 z' fill='#F7E04A' stroke='#E0C030'/><path d='M" + (x + 10) + ' ' + y + ' l-6 -7 M' + (x + 10) + ' ' + y + ' l0 -9 M' + (x + 10) + ' ' + y + " l6 -7' stroke='#FFF6B0' stroke-width='1.2'/>"; }
function cabbage(R, cx, cy, rx, ry) { var h = ''; for (var k = 0; k < 22; k++) { var x = cx - rx + R() * rx * 2, y = cy - ry + R() * ry * 2; h += "<path d='M" + x + ' ' + y + ' q6 ' + (R() * 6 - 3) + " 14 " + (R() * 6 - 3) + "' stroke='" + (k % 3 ? '#C8E39C' : '#A8D07A') + "' stroke-width='2' fill='none' stroke-linecap='round'/>"; } return h; }
function liquid(cx, cy, rx, ry, col) { return "<ellipse cx='" + cx + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "' fill='" + col + "'/><ellipse cx='" + (cx - rx * .3) + "' cy='" + (cy - ry * .35) + "' rx='" + (rx * .35) + "' ry='" + (ry * .2) + "' fill='#fff' opacity='.25'/>"; }
function glass(cx, top, w, h, fill, layers) {
  var x = cx - w / 2, l = '', y = top + h;
  (layers || [[fill, h * .85]]).forEach(function (L) { y -= L[1]; l += "<rect x='" + (x + 3) + "' y='" + y + "' width='" + (w - 6) + "' height='" + L[1] + "' fill='" + L[0] + "'/>"; });
  return shadow(cx, top + h + 4, w * .55) + "<rect x='" + x + "' y='" + top + "' width='" + w + "' height='" + h + "' rx='8' fill='#EAF6FB' opacity='.6' stroke='#C8E2EC' stroke-width='2'/>" + l + "<rect x='" + (x + 6) + "' y='" + (top + 6) + "' width='6' height='" + (h - 16) + "' rx='3' fill='#fff' opacity='.5'/>";
}

// ---- 料理の形を決める ----
function kind(r) {
  var n = r.name;
  if (/卵かけ/.test(n)) return 'don';
  if (/ホイル/.test(n)) return 'foil';
  if (r.cat === 'デザート') {
    if (/プリン/.test(n)) return 'pudding';
    if (/ゼリー|寒天|パンナコッタ|ムース|シャーベット/.test(n)) return 'jelly';
    if (/パフェ|ヨーグルト|ボウル/.test(n) && !/ケーキ|ムース/.test(n)) return 'parfait';
    if (/ジュース|スムージー|ラッシー|ミルク|シェイク|ドリンク|ホットチョコ|漬け$|ジャム$/.test(n)) return 'drink';
    if (/ケーキ|ブラウニー|タルト/.test(n)) return 'cake';
    if (/クッキー|クランチ/.test(n)) return 'cookie';
    if (/パンケーキ|ホットケーキ|どら焼き|クレープ/.test(n)) return 'pancake';
    if (/サンド/.test(n)) return 'sandwich';
    if (/トースト/.test(n)) return 'toast';
    if (/ドーナツ/.test(n)) return 'donut';
    if (/もち|ぜんざい|大福/.test(n)) return 'mochi';
    if (/大学いも|スイートポテト/.test(n)) return 'imo';
    return 'fruitbowl';
  }
  if (/カレー(?!炒め|煮|粉)|ハヤシ|キーマ/.test(n) && r.cat === '丼・麺' && !/うどん/.test(n)) return 'curry';
  if (/オムライス|天津飯/.test(n)) return 'omurice';
  if (/ドリア|グラタン|ラザニア|チーズ焼き/.test(n)) return 'gratin';
  if (/シチュー/.test(n) && r.cat !== '丼・麺') return 'soup';
  if (/卵とじ/.test(n)) return 'nimono';
  if (/^豆腐と.*(あんかけ|チャンプルー)/.test(n)) return 'tofu';
  if (/丼|ビビンバ|タコライス|ガパオ|ライス$|ごはん$|ご飯/.test(n) && !/チャーハン|炒飯|ピラフ|バターライス|炊き込み|混ぜ|ごはん（|たけのこごはん|さつまいもごはん|きのこの炊き込み/.test(n)) return 'don';
  if (/チャーハン|炒飯|ピラフ|バターライス|パエリア|トマトごはん/.test(n)) return 'friedrice';
  if (/炊き込み|混ぜごはん|たけのこごはん|さつまいもごはん|ちらし/.test(n)) return 'mixrice';
  if (/おにぎり|焼きおにぎり/.test(n)) return 'onigiri';
  if (/寿司|のり巻き|手巻き/.test(n)) return 'sushi';
  if (/雑炊|お茶漬け|リゾット/.test(n)) return 'zosui';
  if (/ラーメン|担々麺|冷やし中華|ジャージャー/.test(n)) return /冷やし|ジャージャー/.test(n) ? 'hiyashi' : 'ramen';
  if (/ざるそば|そうめん$|^そうめん/.test(n)) return 'zaru';
  if (/うどん|そば|にゅうめん|フォー/.test(n) && !/焼きうどん|焼きそば/.test(n)) return /冷やし|ぶっかけ/.test(n) ? 'hiyashi' : 'udon';
  if (/焼きそば|焼きうどん|チャンプルー.*そうめん|そうめんチャンプルー/.test(n)) return 'yakisoba';
  if (/パスタ|スパゲッティ|ナポリタン|カルボナーラ|ペペロンチーノ|ボンゴレ|マカロニ(?!サラダ)/.test(n) && r.cat !== '副菜') return 'pasta';
  if (/ピザ|マルゲリータ/.test(n)) return 'pizza';
  if (/サンド|ドッグ|ラップ|ブリトー/.test(n)) return 'sandwich';
  if (/トースト|ブルスケッタ/.test(n)) return 'toast';
  if (/お好み焼き|チヂミ|ガレット|ねぎ焼き|たこ焼き/.test(n)) return 'okonomi';
  if (/餃子|ぎょうざ/.test(n) && !/スープ|ピザ/.test(n)) return 'gyoza';
  if (/鍋(?!肉)|ポトフ|チゲ/.test(n)) return 'nabe';
  if (r.cat === '汁物') return 'soup';
  if (/ハンバーグ|つくね|肉詰め|ミートボール|はさみ焼き|ロールキャベツ/.test(n)) return 'hamburg';
  if (/唐揚げ|から揚げ|竜田|フライ|カツ|天ぷら|かき揚げ|揚げ|南蛮|フリット|リング|ナゲット|ポテト$|フライドポテト/.test(n) && !/揚げびたし|厚揚げ|油揚げ|揚げ出し/.test(n)) return 'fry';
  if (/卵焼き|だし巻き|オムレツ|しりしり|ピカタ|茶碗蒸し|かに玉|ニラ玉|卵炒め/.test(n)) return /茶碗蒸し/.test(n) ? 'chawan' : 'eggdish';
  if (/やっこ|揚げ出し|豆腐ステーキ|冷ややっこ/.test(n)) return 'tofu';
  if (!/缶/.test(n) && /(鮭|サバ|さんま|ぶり|アジ|いわし|たら|サーモン|まぐろ)/.test(n) && /焼|ムニエル|照り|煮|かば|ちゃんちゃん/.test(n) && r.cat === '主菜') return 'fish';
  if (/サラダ|カルパッチョ|カプレーゼ|コールスロー|マリネ|ラペ/.test(n)) return 'salad';
  if (/煮|肉じゃが|筑前|おでん|含め|ふろふき/.test(n)) return r.cat === '主菜' ? 'nimono' : 'kobachi';
  if (/ステーキ|ソテー|焼き$|照り焼き|塩焼き|ピカタ/.test(n) && r.cat === '主菜') return 'steak';
  if (r.cat === '副菜') return 'kobachi';
  return 'stirfry';
}

// ---- 形ごとの描き方 ----
var D = {};
D.don = function (R, r) {
  var h = bowl(120, 82, 92, 70, r.genre === '中' || r.genre === '韓' ? '#C8402E' : '#2E2A3A', null) + rice(R, 120, 82, 82, 22);
  var cols = foodCols(r, /卵|ねぎ|三つ葉|大葉|のり/), s = sauce(r);
  if (/まぐろ|サーモン|漬け|ユッケ/.test(r.name) || has(r, /まぐろ|サーモン/)) { var fc = has(r, /まぐろ/) ? '#C2324A' : '#F6896A'; for (var k = 0; k < 7; k++) { var x = 66 + k * 16, y = 80 + (k % 2) * 6; h += "<rect x='" + x + "' y='" + (y - 8) + "' width='22' height='15' rx='4' fill='" + fc + "' stroke='" + shade(fc, -.2) + "' transform='rotate(" + (k * 9 - 20) + ' ' + x + ' ' + y + ")'/><path d='M" + (x + 3) + ' ' + (y - 4) + ' l14 6' + "' stroke='#fff' stroke-width='1.5' opacity='.5'/>"; } }
  else {
    if (s) h += "<ellipse cx='120' cy='80' rx='64' ry='15' fill='" + s + "' opacity='.75'/>";
    if (has(r, /^卵$/) && /親子|卵とじ|カツ|天津|他人|玉/.test(r.name)) h += "<ellipse cx='120' cy='80' rx='66' ry='16' fill='#F7D24A' opacity='.85'/><ellipse cx='108' cy='78' rx='20' ry='5' fill='#FFF6C8' opacity='.8'/>";
    if (/カツ/.test(r.name)) { for (var j = 0; j < 5; j++) h += "<rect x='" + (70 + j * 20) + "' y='68' width='18' height='18' rx='3' fill='#C98A3E' stroke='#A86A2A'/><rect x='" + (72 + j * 20) + "' y='71' width='14' height='5' rx='2' fill='#F2E2C8'/>"; }
    else if (/天丼/.test(r.name)) h += chunks(R, ['#E8B35A', '#DDA040'], 120, 74, 55, 10, 5, 22);
    else h += chunks(R, cols, 120, 79, 60, 13, 16, 12);
  }
  if (has(r, /^卵$/) && /ビビンバ|ガパオ|タコ|ハム|丼/.test(r.name) && !/親子|卵とじ|カツ|天津/.test(r.name)) h += egg(150, 76, 15);
  if (has(r, /ねぎ|三つ葉|大葉|ニラ/)) h += greens(R, 120, 78, 55, 10, 10);
  if (has(r, /のり/)) h += chunks(R, ['#22302A'], 120, 78, 50, 10, 12, 6, 'leaf');
  if (has(r, /白ごま/)) h += chunks(R, ['#F4EAD0'], 120, 78, 55, 11, 14, 4, 'dot');
  return h;
};
D.curry = function (R, r) {
  var s = /ハヤシ/.test(r.name) ? '#6E3418' : '#B5651D', h = plate(120, 96, 104, 50) + rice(R, 92, 92, 52, 30);
  h += "<path d='M118 64 Q182 56 196 96 Q186 136 118 128 Q138 96 118 64 Z' fill='" + s + "'/>" + "<path d='M128 72 Q170 68 182 92' stroke='#fff' stroke-width='4' opacity='.2' fill='none' stroke-linecap='round'/>";
  if (/キーマ/.test(r.name)) h += chunks(R, ['#8A5A3E', '#F08A2C'], 158, 98, 26, 20, 20, 6, 'dot');
  else h += chunks(R, foodCols(r), 160, 98, 26, 22, 9, 13);
  if (has(r, /^卵$/)) h += egg(158, 92, 14);
  return h + "<circle cx='206' cy='70' r='5' fill='#E8452C'/><circle cx='214' cy='76' r='4' fill='#E8452C'/>";
};
D.omurice = function (R, r) {
  var h = plate(120, 98, 104, 50);
  h += "<path d='M42 104 Q48 52 120 50 Q192 52 198 104 Q190 118 120 120 Q50 118 42 104 Z' fill='#F7CF3E'/><path d='M60 84 Q90 58 128 58' stroke='#FFF2B0' stroke-width='9' fill='none' stroke-linecap='round' opacity='.8'/>";
  if (/天津/.test(r.name)) h += "<path d='M44 100 Q120 140 196 100 Q186 128 120 130 Q54 128 44 100' fill='#C8502E' opacity='.8'/>";
  else h += "<path d='M70 80 q10 -10 20 0 t20 0 t20 0 t20 0 t20 0' stroke='#D8302A' stroke-width='7' fill='none' stroke-linecap='round'/>";
  return h + "<ellipse cx='194' cy='70' rx='9' ry='5' fill='#4C9A3A'/>";
};
D.gratin = function (R, r) {
  var h = shadow(120, 140, 95) + "<ellipse cx='120' cy='100' rx='100' ry='46' fill='#F4EEE4' stroke='#D8CDBA' stroke-width='3'/><ellipse cx='120' cy='96' rx='86' ry='36' fill='#F2D27A'/>";
  for (var k = 0; k < 18; k++) { var a = R() * 6.28, d = Math.sqrt(R()); h += "<ellipse cx='" + (120 + Math.cos(a) * 76 * d) + "' cy='" + (96 + Math.sin(a) * 30 * d) + "' rx='" + (6 + R() * 8) + "' ry='" + (3 + R() * 4) + "' fill='" + (k % 2 ? '#C8873A' : '#A8622A') + "' opacity='.85'/>"; }
  return h + greens(R, 120, 96, 60, 22, 6);
};
D.friedrice = function (R, r) {
  var base = has(r, /ケチャップ|トマト/) ? '#E8743A' : has(r, /キムチ/) ? '#E0603A' : has(r, /醤油|オイスター/) ? '#E2C07A' : '#F2DC98', h = plate(120, 100, 104, 50);
  h += "<path d='M50 108 Q56 50 120 48 Q184 50 190 108 Q120 126 50 108 Z' fill='" + base + "'/>";
  for (var k = 0; k < 40; k++) { var x = 60 + R() * 120, y = 60 + R() * 45; h += "<ellipse cx='" + x + "' cy='" + y + "' rx='2.6' ry='1.3' fill='" + shade(base, .3) + "'/>"; }
  h += chunks(R, foodCols(r).concat(has(r, /^卵$/) ? ['#F7D24A', '#F7D24A'] : []), 120, 82, 55, 20, 22, 7);
  return h + greens(R, 120, 76, 48, 16, 8);
};
D.mixrice = function (R, r) { var h = bowl(120, 82, 74, 60, '#F2EEE6') + rice(R, 120, 82, 66, 18); if (has(r, /白だし|醤油|めんつゆ/)) h += "<ellipse cx='120' cy='82' rx='62' ry='16' fill='#E8CF98' opacity='.7'/>"; return h + chunks(R, foodCols(r), 120, 80, 52, 11, 16, 8) + greens(R, 120, 80, 40, 8, 5); };
D.onigiri = function (R, r) {
  var h = plate(120, 108, 100, 42, '#E8D6B8'), base = has(r, /鮭/) ? '#FDECE2' : has(r, /醤油/) && /焼き/.test(r.name) ? '#D8A050' : '#FFFDF6';
  [[80, 112], [160, 112], [120, 92]].forEach(function (p, i) { var x = p[0], y = p[1]; h += "<path d='M" + x + ' ' + (y - 42) + ' Q' + (x + 6) + ' ' + (y - 46) + ' ' + (x + 12) + ' ' + (y - 36) + ' L' + (x + 36) + ' ' + (y + 4) + ' Q' + (x + 40) + ' ' + (y + 14) + ' ' + (x + 28) + ' ' + (y + 14) + ' L' + (x - 28) + ' ' + (y + 14) + ' Q' + (x - 40) + ' ' + (y + 14) + ' ' + (x - 36) + ' ' + (y + 4) + ' L' + (x - 12) + ' ' + (y - 36) + ' Q' + (x - 6) + ' ' + (y - 46) + ' ' + x + ' ' + (y - 42) + " Z' fill='" + base + "' stroke='#E8E0CC'/>" + (has(r, /のり/) ? "<rect x='" + (x - 16) + "' y='" + (y - 6) + "' width='32' height='21' rx='3' fill='#22302A'/>" : '') + (has(r, /梅/) && i === 2 ? "<circle cx='" + x + "' cy='" + (y - 18) + "' r='6' fill='#D8384A'/>" : '') + (has(r, /白ごま|しらす|鮭/) ? chunks(R, [has(r, /鮭/) ? '#F2906E' : '#F4EAD0'], x, y - 12, 14, 10, 8, 4, 'dot') : ''); });
  return h;
};
D.sushi = function (R, r) {
  var h = shadow(120, 140, 100) + "<rect x='22' y='70' width='196' height='64' rx='8' fill='#C99A5E'/><rect x='22' y='64' width='196' height='64' rx='8' fill='#E2B97A'/>";
  if (/いなり/.test(r.name)) { for (var i = 0; i < 4; i++) h += "<rect x='" + (34 + i * 46) + "' y='74' width='40' height='42' rx='14' fill='#C98A40' stroke='#A86A2A'/><path d='M" + (38 + i * 46) + " 80 q16 -6 32 0' stroke='#E8B060' stroke-width='3' fill='none'/>"; return h; }
  if (/ちらし/.test(r.name)) return D.mixrice(R, r);
  var cols = foodCols(r, /のり/);
  for (var j = 0; j < 5; j++) { var x = 46 + j * 38; h += "<circle cx='" + x + "' cy='96' r='17' fill='#22302A'/><circle cx='" + x + "' cy='96' r='13' fill='#FFFDF6'/><circle cx='" + x + "' cy='96' r='6' fill='" + cols[j % cols.length] + "'/>"; }
  return h;
};
D.zosui = function (R, r) { var h = bowl(120, 82, 80, 62, '#E8DCC8', has(r, /牛乳|チーズ/) ? '#FBF0D8' : '#F2E2B8') + rice(R, 120, 84, 60, 14); if (has(r, /^卵$/)) h += chunks(R, ['#F7D24A', '#FBE68A'], 120, 82, 54, 12, 10, 12, 'leaf'); return h + chunks(R, foodCols(r, /卵|ごはん/), 120, 80, 50, 10, 8, 8) + greens(R, 120, 80, 48, 10, 10); };
D.ramen = function (R, r) {
  var broth = has(r, /味噌/) ? '#D8A050' : has(r, /牛乳|ごま/) ? '#E89A5A' : '#C8803A';
  var h = bowl(120, 72, 98, 78, '#C8302A', broth) + noodles(R, 120, 74, 80, 18, '#F6D878', 4);
  h += "<rect x='150' y='50' width='30' height='38' rx='3' fill='#22302A' transform='rotate(18 165 70)'/>";
  if (has(r, /^卵$/)) h += egg(96, 70, 13, true) + egg(118, 74, 13, true);
  if (has(r, /ハム|チャーシュー|豚/)) h += "<circle cx='142' cy='74' r='15' fill='#E8A898' stroke='#C87868' stroke-width='3'/>";
  if (has(r, /ひき肉/)) h += chunks(R, ['#9C6B4E'], 130, 72, 22, 6, 14, 6, 'dot');
  if (has(r, /コーン/)) h += chunks(R, ['#F6D04A'], 82, 76, 14, 5, 14, 4, 'dot');
  if (has(r, /もやし|チンゲン/)) h += chunks(R, has(r, /チンゲン/) ? ['#6BAE4A'] : ['#F6F1DE'], 80, 74, 14, 6, 8, 9, 'leaf');
  if (has(r, /ラー油/)) h += chunks(R, ['#E04A2A'], 120, 74, 70, 14, 10, 6, 'dot');
  return h + greens(R, 120, 72, 70, 14, 14);
};
D.udon = function (R, r) {
  var soba = /そば/.test(r.name), curry = /カレー/.test(r.name), kim = has(r, /キムチ/);
  var h = bowl(120, 72, 96, 72, '#2E2A3A', curry ? '#C8803A' : kim ? '#D8603A' : '#D8B070') + noodles(R, 120, 74, 80, 16, soba ? '#9A8470' : '#FBF6EA', soba ? 4 : 7);
  if (/きつね/.test(r.name) || has(r, /油揚げ/)) h += "<rect x='98' y='58' width='46' height='30' rx='6' fill='#D9A050' stroke='#B88030'/>";
  if (has(r, /牛|豚/)) h += chunks(R, foodCols(r, /ねぎ|卵/), 120, 70, 40, 8, 10, 12);
  if (has(r, /^卵$/)) h += egg(150, 72, 14);
  if (has(r, /かまぼこ/)) h += "<circle cx='88' cy='72' r='9' fill='#fff' stroke='#F59AAE' stroke-width='4'/>";
  if (has(r, /大根/)) h += "<ellipse cx='92' cy='72' rx='14' ry='7' fill='#FBFAF2'/>";
  return h + greens(R, 120, 72, 70, 12, 14);
};
D.hiyashi = function (R, r) {
  var h = plate(120, 100, 104, 48, '#DCEEF6') + "<ellipse cx='120' cy='96' rx='80' ry='34' fill='" + (/そば/.test(r.name) ? '#9A8470' : /うどん/.test(r.name) ? '#FBF6EA' : '#F6D878') + "'/>" + noodles(R, 120, 96, 72, 26, /そば/.test(r.name) ? '#86705C' : /うどん/.test(r.name) ? '#EFE8D6' : '#E8C860', 3);
  var cols = foodCols(r, /ねぎ/); for (var k = 0; k < cols.length && k < 5; k++) { var a = k / 5 * 6.28; h += chunks(R, [cols[k]], 120 + Math.cos(a) * 34, 92 + Math.sin(a) * 14, 12, 6, 5, 9); }
  if (/ジャージャー/.test(r.name)) h += "<ellipse cx='120' cy='88' rx='30' ry='12' fill='#6E3E22'/>";
  return h;
};
D.zaru = function (R, r) {
  var col = /そば/.test(r.name) ? '#8A7460' : '#FBF8F0', h = shadow(120, 142, 100) + "<rect x='24' y='64' width='192' height='70' rx='10' fill='#B8904E'/><rect x='30' y='68' width='180' height='60' rx='6' fill='#D8B474'/>";
  for (var k = 0; k < 10; k++) h += "<line x1='" + (36 + k * 18) + "' y1='70' x2='" + (36 + k * 18) + "' y2='126' stroke='#C8A060' stroke-width='2'/>";
  h += "<ellipse cx='120' cy='96' rx='72' ry='24' fill='" + col + "'/>" + noodles(R, 120, 96, 66, 18, shade(col, -.1), 2.5);
  if (has(r, /のり/)) h += chunks(R, ['#22302A'], 120, 88, 34, 8, 14, 7, 'leaf');
  if (has(r, /大葉/)) h += chunks(R, ['#4E9A3A'], 170, 90, 10, 6, 5, 6, 'leaf');
  return h;
};
D.yakisoba = function (R, r) { var col = has(r, /ソース/) ? '#9A5A2A' : has(r, /醤油|オイスター/) ? '#C08A50' : '#E8D090', h = plate(120, 98, 104, 50) + "<ellipse cx='120' cy='94' rx='82' ry='34' fill='" + col + "'/>" + noodles(R, 120, 94, 76, 26, shade(col, .15), 4) + chunks(R, foodCols(r), 120, 90, 60, 22, 20, 11); if (has(r, /かつお節/)) h += chunks(R, ['#D8A070', '#C08050'], 120, 84, 40, 10, 12, 7, 'leaf'); return h + greens(R, 120, 84, 40, 10, 6); };
D.pasta = function (R, r) {
  var s = has(r, /明太子/) ? '#F2B0A0' : has(r, /ケチャップ|トマト缶|ミート/) ? '#D8452E' : has(r, /生クリーム|牛乳/) ? '#FBEFD2' : has(r, /^卵$/) && /カルボ/.test(r.name) ? '#F7E08A' : has(r, /醤油|めんつゆ/) ? '#E2C07A' : '#F2DC98';
  var nood = s === '#D8452E' ? '#E8803E' : s === '#FBEFD2' ? '#F8E8C0' : '#F2D898';
  var h = plate(120, 100, 106, 52);
  h += "<ellipse cx='120' cy='94' rx='76' ry='34' fill='" + nood + "'/>";
  for (var k = 0; k < 6; k++) h += "<ellipse cx='120' cy='94' rx='" + (70 - k * 11) + "' ry='" + (30 - k * 4.6) + "' fill='none' stroke='" + shade(nood, -.12) + "' stroke-width='3'/>";
  if (s !== '#F2DC98') h += "<ellipse cx='120' cy='88' rx='46' ry='18' fill='" + s + "' opacity='.85'/>";
  if (/ミート/.test(r.name)) h += chunks(R, ['#8A3A22', '#A8482A'], 120, 88, 38, 13, 16, 6, 'dot');
  h += chunks(R, foodCols(r, /パスタ|卵|チーズ|大葉|のり/), 120, 92, 58, 22, 12, 10);
  if (has(r, /あさり/)) for (var j = 0; j < 6; j++) h += "<path d='M" + (70 + j * 18) + ' ' + (88 + (j % 2) * 12) + " a8 6 0 0 1 16 0 z' fill='#B8A08A' stroke='#8A7460'/>";
  if (has(r, /大葉|のり|バジル|小松菜/)) h += chunks(R, has(r, /のり/) ? ['#22302A'] : ['#4E9A3A'], 120, 84, 26, 8, 10, 6, 'leaf');
  if (has(r, /粉チーズ/)) h += chunks(R, ['#FFF6D8'], 120, 88, 40, 14, 20, 3, 'dot');
  return h;
};
D.pizza = function (R, r) {
  var h = shadow(120, 146, 96) + "<ellipse cx='120' cy='98' rx='100' ry='48' fill='#D8A060'/><ellipse cx='120' cy='96' rx='88' ry='40' fill='#D8452E'/><ellipse cx='120' cy='94' rx='82' ry='36' fill='#F7D46A'/>";
  for (var k = 0; k < 10; k++) { var a = R() * 6.28, d = Math.sqrt(R()); h += "<ellipse cx='" + (120 + Math.cos(a) * 70 * d) + "' cy='" + (94 + Math.sin(a) * 30 * d) + "' rx='8' ry='4' fill='#E8A84A' opacity='.7'/>"; }
  h += chunks(R, foodCols(r, /チーズ|生地|トルティーヤ|餃子の皮|もち|油揚げ/), 120, 94, 66, 28, 14, 10);
  for (var j = 0; j < 4; j++) h += "<line x1='120' y1='94' x2='" + (120 + Math.cos(j * .785 + .4) * 100) + "' y2='" + (94 + Math.sin(j * .785 + .4) * 48) + "' stroke='#C8903A' stroke-width='1.5' opacity='.5'/>";
  return h;
};
D.toast = function (R, r) {
  var h = plate(120, 108, 100, 42) + "<path d='M62 52 Q62 34 86 34 L154 34 Q178 34 178 52 L178 126 L62 126 Z' fill='#C8873A'/><path d='M70 54 Q70 42 88 42 L152 42 Q170 42 170 54 L170 118 L70 118 Z' fill='#F2D49A'/>";
  var top = has(r, /あんこ/) ? '#5A2E2E' : has(r, /チョコ/) ? '#6A3E2A' : has(r, /チーズ/) ? '#F7C843' : has(r, /ジャム|いちご/) ? '#C8303A' : has(r, /クリームチーズ/) ? '#FBF6EA' : null;
  if (top) h += "<path d='M76 60 Q120 50 164 60 L164 110 Q120 116 76 110 Z' fill='" + top + "' opacity='.9'/>";
  h += chunks(R, foodCols(r, /食パン|バゲット|チーズ|あんこ|チョコ|ジャム/), 120, 84, 36, 22, 10, 10);
  if (has(r, /バター/)) h += "<rect x='108' y='70' width='22' height='16' rx='3' fill='#FBE48A'/>";
  if (has(r, /はちみつ/)) h += "<path d='M84 66 Q120 90 158 70' stroke='#E8A830' stroke-width='5' fill='none' opacity='.8'/>";
  return h;
};
D.sandwich = function (R, r) {
  var h = plate(120, 110, 100, 40), cols = foodCols(r, /パン|トルティーヤ/);
  if (/ラップ|ブリトー/.test(r.name)) { for (var i = 0; i < 2; i++) { var x = 80 + i * 70; h += "<rect x='" + (x - 26) + "' y='60' width='52' height='56' rx='22' fill='#F2DCA8' stroke='#D8B878' stroke-width='2'/><ellipse cx='" + x + "' cy='64' rx='24' ry='10' fill='" + cols[0] + "'/>" + chunks(R, cols, x, 64, 18, 6, 8, 6); } return h; }
  if (/ドッグ/.test(r.name)) { for (var j = 0; j < 2; j++) { var y = 74 + j * 30; h += "<rect x='54' y='" + y + "' width='132' height='26' rx='13' fill='#E0A860'/><rect x='60' y='" + (y - 6) + "' width='120' height='12' rx='6' fill='#C2623F'/><path d='M66 " + (y - 2) + " q10 -6 20 0 t20 0 t20 0 t20 0 t20 0' stroke='#E8302A' stroke-width='3' fill='none'/>"; } return h; }
  [[78, 0], [162, 1]].forEach(function (p) { var x = p[0]; h += "<path d='M" + (x - 40) + " 120 L" + x + " 50 L" + (x + 40) + " 120 Z' fill='#F7E8C8' stroke='#E0C890' stroke-width='3'/>"; var fill = has(r, /^卵$/) && /たまご|卵/.test(r.name) ? '#F7E07A' : cols[0]; h += "<path d='M" + (x - 34) + " 118 L" + x + " 60 L" + (x + 34) + " 118 Z' fill='" + fill + "' opacity='.9'/>"; if (has(r, /レタス|キャベツ/)) h += "<path d='M" + (x - 36) + " 116 q9 -6 18 0 t18 0 t18 0 t18 0' stroke='#8CC45A' stroke-width='4' fill='none'/>"; });
  return h;
};
D.okonomi = function (R, r) {
  var h = plate(120, 100, 104, 50), base = /チヂミ/.test(r.name) ? '#E8C070' : /ガレット/.test(r.name) ? '#E8B850' : '#D8A060';
  h += "<ellipse cx='120' cy='96' rx='80' ry='36' fill='" + base + "'/>";
  if (has(r, /ソース/)) { h += "<ellipse cx='120' cy='94' rx='70' ry='30' fill='#6E3418'/>"; for (var k = 0; k < 7; k++) h += "<line x1='" + (70 + k * 15) + "' y1='70' x2='" + (60 + k * 15) + "' y2='118' stroke='#FFF8E0' stroke-width='2.5'/>"; h += chunks(R, ['#D8A070', '#C08050'], 120, 92, 50, 18, 16, 7, 'leaf'); }
  else h += chunks(R, foodCols(r), 120, 94, 64, 26, 22, 8);
  return h + greens(R, 120, 90, 40, 14, 8);
};
D.gyoza = function (R, r) {
  var h = plate(120, 104, 104, 46), wat = /水餃子/.test(r.name);
  if (wat) h = bowl(120, 76, 92, 64, '#F2EEE6', '#F2E8D0');
  for (var k = 0; k < 6; k++) { var x = 58 + (k % 3) * 52, y = (wat ? 70 : 84) + Math.floor(k / 3) * 22; h += "<path d='M" + (x - 26) + ' ' + y + ' Q' + x + ' ' + (y - 30) + ' ' + (x + 26) + ' ' + y + " Q" + x + ' ' + (y + 12) + ' ' + (x - 26) + ' ' + y + " Z' fill='#F7EED8' stroke='#E0D0B0' stroke-width='1.5'/>" + (wat ? '' : "<path d='M" + (x - 24) + ' ' + (y + 2) + ' Q' + x + ' ' + (y + 12) + ' ' + (x + 24) + ' ' + (y + 2) + "' stroke='#C8873A' stroke-width='5' fill='none'/>") + "<path d='M" + (x - 14) + ' ' + (y - 12) + ' l6 6 m4 -9 l4 8 m6 -7 l2 7' + "' stroke='#E0D0B0' stroke-width='1.5'/>"; }
  return h;
};
D.nabe = function (R, r) {
  var broth = has(r, /キムチ|コチュジャン/) ? '#D8503A' : has(r, /豆乳|牛乳/) ? '#F6F0E2' : has(r, /トマト/) ? '#D8452E' : has(r, /味噌/) ? '#D8B070' : '#EAD6A0';
  var h = shadow(120, 152, 104) + "<rect x='14' y='70' width='22' height='12' rx='6' fill='#5A3A2A'/><rect x='204' y='70' width='22' height='12' rx='6' fill='#5A3A2A'/>";
  h += "<path d='M26 74 Q30 146 120 146 Q210 146 214 74 Z' fill='#6E4A36'/><ellipse cx='120' cy='74' rx='94' ry='30' fill='#8A5E46'/><ellipse cx='120' cy='76' rx='86' ry='25' fill='" + broth + "'/>";
  h += chunks(R, foodCols(r), 120, 74, 70, 18, 22, 15);
  if (has(r, /豆腐/)) for (var k = 0; k < 3; k++) h += "<rect x='" + (70 + k * 34) + "' y='" + (66 + (k % 2) * 8) + "' width='22' height='16' rx='2' fill='#FBF8EE' stroke='#E8E0CC'/>";
  if (has(r, /しいたけ/)) h += "<circle cx='170' cy='70' r='11' fill='#8A6A4E'/><path d='M164 70 l12 0 M170 64 l0 12' stroke='#F2E0C8' stroke-width='2'/>";
  return h + greens(R, 120, 72, 60, 14, 8);
};
D.soup = function (R, r) {
  var n = r.name, col = has(r, /味噌/) ? '#CFA060' : has(r, /トマト|キムチ|コチュジャン/) ? '#D8503A' : has(r, /牛乳|生クリーム|豆乳/) ? (has(r, /かぼちゃ|コーン/) ? '#F7D070' : '#F8F0DE') : has(r, /カレー/) ? '#C8803A' : has(r, /鶏ガラ|中華/) ? '#E8C878' : '#EED8A0';
  var jp = has(r, /味噌|白だし|顆粒だし/) && r.genre === '和';
  var h = bowl(120, 74, jp ? 76 : 88, jp ? 66 : 54, jp ? '#7A2A22' : '#F2EEE6', col);
  if (/ポタージュ|コーンスープ/.test(n)) return h + "<path d='M100 72 q10 -6 20 0 t20 0' stroke='#fff' stroke-width='2' fill='none' opacity='.6'/>" + greens(R, 120, 72, 20, 4, 4);
  var cols = foodCols(r, /ねぎ|三つ葉/);
  if (has(r, /^卵$/)) h += chunks(R, ['#F7D24A', '#FBE68A'], 120, 74, 56, 12, 12, 12, 'leaf');
  if (has(r, /豆腐/)) for (var k = 0; k < 4; k++) h += "<rect x='" + (84 + k * 18) + "' y='" + (66 + (k % 2) * 6) + "' width='12' height='10' rx='1.5' fill='#FBF8EE' stroke='#E8E0CC'/>";
  if (has(r, /わかめ/)) h += chunks(R, ['#3E6A3A', '#4A7A40'], 120, 74, 52, 12, 10, 9, 'leaf');
  if (has(r, /しじみ|あさり/)) for (var j = 0; j < 7; j++) h += "<path d='M" + (78 + j * 13) + ' ' + (72 + (j % 2) * 6) + " a6 5 0 0 1 12 0 z' fill='" + (has(r, /しじみ/) ? '#4A4038' : '#B8A08A') + "'/>";
  h += chunks(R, cols.filter(function (c) { return c !== '#F7D24A' && c !== '#FBF8EE' && c !== '#3E6A3A'; }).concat(cols.length ? [] : ['#F08A2C']), 120, 72, 52, 11, 12, 10);
  return h + greens(R, 120, 72, 50, 10, 10);
};
D.hamburg = function (R, r) {
  var h = plate(120, 100, 104, 50), s = sauce(r) || '#6E3418', n = r.name, cols = foodCols(r, /ひき肉|玉ねぎ|卵/);
  if (/ロールキャベツ/.test(n)) { h = bowl(120, 76, 92, 60, '#F2EEE6', has(r, /トマト/) ? '#D8503A' : '#EED8A0'); for (var i = 0; i < 2; i++) h += "<ellipse cx='" + (92 + i * 56) + "' cy='72' rx='26' ry='16' fill='#C8E09C' stroke='#A0C070' stroke-width='2'/><path d='M" + (72 + i * 56) + ' 72 q20 -8 40 0' + "' stroke='#A0C070' stroke-width='2' fill='none'/>"; return h; }
  if (/肉詰め/.test(n)) { var vc = cols[0]; for (var k = 0; k < 4; k++) { var x = 70 + (k % 2) * 56, y = 82 + Math.floor(k / 2) * 26; h += "<ellipse cx='" + x + "' cy='" + y + "' rx='26' ry='14' fill='" + vc + "'/><ellipse cx='" + x + "' cy='" + (y - 2) + "' rx='20' ry='10' fill='#8A5A3E'/>"; } return h + "<path d='M60 78 q60 30 120 0' stroke='" + s + "' stroke-width='6' fill='none' opacity='.8'/>"; }
  if (/ミートボール|つくね/.test(n)) { for (var j = 0; j < 7; j++) { var x2 = 70 + (j % 4) * 32 + (j > 3 ? 16 : 0), y2 = 82 + (j > 3 ? 22 : 0); h += "<circle cx='" + x2 + "' cy='" + y2 + "' r='14' fill='" + (/つくね/.test(n) ? '#C8904E' : '#8A5A3E') + "'/><circle cx='" + (x2 - 4) + "' cy='" + (y2 - 5) + "' r='5' fill='#fff' opacity='.25'/>"; } h += "<ellipse cx='120' cy='92' rx='70' ry='24' fill='" + s + "' opacity='.5'/>"; if (has(r, /^卵$/)) h += "<circle cx='176' cy='70' r='10' fill='#F7B731'/>"; return h; }
  h += "<ellipse cx='108' cy='96' rx='52' ry='28' fill='#6E3E26'/><ellipse cx='108' cy='90' rx='50' ry='25' fill='#8A5236'/><ellipse cx='108' cy='86' rx='42' ry='17' fill='" + s + "'/><ellipse cx='96' cy='80' rx='16' ry='5' fill='#fff' opacity='.3'/>";
  return h + "<circle cx='176' cy='96' r='14' fill='#4C9A3A'/><circle cx='170' cy='90' r='8' fill='#5CAA48'/>" + "<rect x='160' y='106' width='30' height='10' rx='5' fill='#F08A2C'/>";
};
D.fry = function (R, r) {
  var n = r.name, h = plate(120, 100, 106, 50) + cabbage(R, 170, 86, 30, 18);
  if (/カツ|フライ|リング/.test(n) && !/ポテト/.test(n)) {
    if (/リング/.test(n)) { for (var i = 0; i < 6; i++) h += "<ellipse cx='" + (60 + (i % 3) * 32) + "' cy='" + (82 + Math.floor(i / 3) * 24) + "' rx='16' ry='10' fill='none' stroke='#E0A850' stroke-width='8'/>"; return h + lemon(178, 118); }
    var big = /カツ|とんかつ/.test(n);
    for (var j = 0; j < (big ? 5 : 3); j++) { var x = 54 + j * (big ? 20 : 34), y = 76; h += "<rect x='" + x + "' y='" + y + "' width='" + (big ? 18 : 30) + "' height='" + (big ? 40 : 26) + "' rx='" + (big ? 3 : 12) + "' fill='#D8963E' stroke='#B87428' stroke-width='1.5'/>"; for (var q = 0; q < 6; q++) h += "<circle cx='" + (x + 3 + R() * (big ? 12 : 24)) + "' cy='" + (y + 3 + R() * (big ? 34 : 20)) + "' r='1.6' fill='#F2C878'/>"; if (big) h += "<rect x='" + (x + 2) + "' y='" + (y + 3) + "' width='14' height='8' rx='2' fill='#F2E2C8'/>"; }
    if (has(r, /ソース/)) h += "<path d='M56 80 q40 10 80 0' stroke='#5A2A12' stroke-width='5' fill='none' opacity='.8'/>";
    if (/南蛮|タルタル/.test(n)) h += "<ellipse cx='96' cy='82' rx='34' ry='9' fill='#FBF4D8'/>";
    return h + lemon(178, 118);
  }
  if (/ポテト/.test(n)) { for (var p = 0; p < 18; p++) { var x2 = 54 + R() * 90, y2 = 70 + R() * 40; h += "<rect x='" + x2 + "' y='" + y2 + "' width='6' height='30' rx='2' fill='#F2C850' stroke='#D8A830' transform='rotate(" + Math.round(R() * 120 - 60) + ' ' + x2 + ' ' + y2 + ")'/>"; } return h + "<ellipse cx='176' cy='118' rx='14' ry='7' fill='#D8302A'/>"; }
  var col = /天ぷら|かき揚げ|磯辺/.test(n) ? '#F2D088' : '#C8803A';
  for (var k = 0; k < 7; k++) { var x3 = 64 + (k % 4) * 26 + (k > 3 ? 12 : 0), y3 = 82 + (k > 3 ? 22 : 0) + R() * 4, s = 15 + R() * 4; h += "<path d='M" + (x3 - s) + ' ' + y3 + ' q' + (s * .2) + ' ' + (-s) + ' ' + s + ' ' + (-s * .8) + ' q' + (s * .9) + ' ' + (-s * .1) + ' ' + s + ' ' + (s * .7) + ' q' + (-s * .1) + ' ' + (s * .9) + ' ' + (-s) + ' ' + (s * .8) + ' q' + (-s * .9) + ' 0 ' + (-s) + ' ' + (-s * .7) + "z' fill='" + col + "' stroke='" + shade(col, -.2) + "'/><circle cx='" + (x3 - 4) + "' cy='" + (y3 - 6) + "' r='3' fill='#fff' opacity='.25'/>"; }
  if (sauce(r) && /南蛮|甘酢|甘辛|チリ/.test(n)) h += "<ellipse cx='100' cy='92' rx='50' ry='18' fill='" + sauce(r) + "' opacity='.35'/>";
  return h + lemon(178, 118);
};
D.eggdish = function (R, r) {
  var h = plate(120, 102, 104, 46), n = r.name;
  if (/卵焼き|だし巻き/.test(n)) { for (var i = 0; i < 4; i++) { var x = 66 + i * 30; h += "<rect x='" + x + "' y='70' width='26' height='40' rx='5' fill='#F7D24A' stroke='#E8B830'/><path d='M" + (x + 5) + " 78 q8 6 16 0 M" + (x + 5) + " 90 q8 6 16 0 M" + (x + 5) + " 102 q8 6 16 0' stroke='#F2C030' fill='none'/>"; if (has(r, /明太子/)) h += "<circle cx='" + (x + 13) + "' cy='92' r='5' fill='#E8604E'/>"; if (has(r, /ねぎ/)) h += greens(R, x + 13, 90, 8, 14, 4); } return h + "<rect x='178' y='92' width='26' height='14' rx='4' fill='#F5F2E6'/>"; }
  if (/しりしり/.test(n)) return h + chunks(R, ['#F08A2C', '#F7D24A', '#F08A2C'], 120, 96, 66, 26, 40, 12, 'leaf');
  if (/トマト|卵炒め/.test(n) || /ニラ玉|かに玉/.test(n)) { h += chunks(R, ['#F7D24A', '#FBE68A'], 120, 96, 64, 26, 16, 22, 'leaf'); if (/かに玉/.test(n)) h += "<ellipse cx='120' cy='96' rx='60' ry='24' fill='#C8502E' opacity='.45'/>"; return h + chunks(R, foodCols(r, /卵/), 120, 96, 58, 22, 10, 10); }
  if (/ピカタ/.test(n)) { for (var j = 0; j < 4; j++) h += "<ellipse cx='" + (70 + j * 26) + "' cy='" + (92 + (j % 2) * 8) + "' rx='20' ry='14' fill='#F2D060' stroke='#D8B040'/>"; return h + "<ellipse cx='178' cy='96' rx='12' ry='8' fill='#D8302A'/>"; }
  h += "<path d='M50 104 Q60 60 120 60 Q180 60 190 104 Q120 122 50 104 Z' fill='#F7D24A'/><path d='M74 84 Q100 66 136 68' stroke='#FFF2B0' stroke-width='8' fill='none' stroke-linecap='round' opacity='.7'/>";
  if (has(r, /ケチャップ/)) h += "<path d='M90 80 q10 -8 20 0 t20 0 t20 0' stroke='#D8302A' stroke-width='6' fill='none' stroke-linecap='round'/>";
  if (has(r, /納豆/)) h += chunks(R, ['#B8863E'], 120, 100, 40, 6, 10, 6, 'dot');
  return h;
};
D.chawan = function (R, r) { return shadow(120, 150, 60) + "<path d='M70 60 L76 140 Q120 150 164 140 L170 60 Z' fill='#F2EEE6' stroke='#D8D0C0' stroke-width='2'/><ellipse cx='120' cy='60' rx='50' ry='14' fill='#FBF4D8' stroke='#D8D0C0' stroke-width='2'/><ellipse cx='120' cy='60' rx='42' ry='10' fill='#F7E08A'/>" + "<circle cx='108' cy='58' r='6' fill='#F59AAE'/><circle cx='130' cy='60' r='7' fill='#8A6A4E'/>" + greens(R, 120, 58, 24, 5, 5) + "<ellipse cx='120' cy='42' rx='46' ry='10' fill='#F2EEE6' opacity='.0'/>"; };
D.tofu = function (R, r) {
  var h = plate(120, 104, 100, 44, '#DCEEF6'), n = r.name;
  if (/揚げ出し/.test(n)) { h = bowl(120, 78, 84, 56, '#2E2A3A', '#C8904E'); for (var i = 0; i < 3; i++) h += "<rect x='" + (78 + i * 30) + "' y='" + (62 + (i % 2) * 6) + "' width='26' height='22' rx='4' fill='#E8C070' stroke='#C8A050'/>"; return h + "<ellipse cx='120' cy='66' rx='12' ry='6' fill='#FBFAF2'/>" + greens(R, 120, 66, 30, 6, 6); }
  if (/ステーキ/.test(n)) { for (var j = 0; j < 2; j++) h += "<rect x='" + (66 + j * 58) + "' y='74' width='50' height='38' rx='5' fill='#D8A050' stroke='#B88030'/><rect x='" + (70 + j * 58) + "' y='78' width='42' height='8' rx='3' fill='#F2D49A'/>"; return h + greens(R, 120, 84, 44, 10, 10); }
  var tops = has(r, /キムチ/) ? ['#E0503A'] : has(r, /ザーサイ/) ? ['#9AB060'] : has(r, /梅/) ? ['#D8384A'] : has(r, /しらす/) ? ['#F5EEDC'] : ['#5FAE45'];
  h += "<path d='M76 74 L120 62 L164 74 L164 112 L120 124 L76 112 Z' fill='#FBF8EE' stroke='#E8E0CC' stroke-width='2'/><path d='M76 74 L120 86 L164 74 M120 86 L120 124' stroke='#E8E0CC' stroke-width='2' fill='none'/>";
  h += chunks(R, tops, 120, 74, 28, 6, 12, 7, has(r, /キムチ/) ? '' : 'leaf');
  if (has(r, /かつお節/)) h += chunks(R, ['#D8A070'], 120, 72, 20, 5, 8, 6, 'leaf');
  return h + greens(R, 120, 72, 18, 4, 5);
};
D.fish = function (R, r) {
  var n = r.name, h = shadow(120, 140, 100) + "<rect x='20' y='72' width='200' height='64' rx='10' fill='#E8E4DA'/><rect x='20' y='66' width='200' height='64' rx='10' fill='#FBFAF4'/>";
  var whole = /さんま|アジ|いわし/.test(n) && /塩焼き|焼き|梅煮|煮/.test(n) && !/かば|フライ|南蛮/.test(n);
  var col = has(r, /鮭|サーモン/) ? '#F2906E' : has(r, /ぶり/) ? '#C7A08A' : has(r, /たら/) ? '#F7F2E8' : has(r, /サバ/) ? '#B9B2A6' : '#B8B8B0', glaze = sauce(r);
  if (whole) { h += "<path d='M40 98 Q70 76 140 84 Q170 88 186 98 Q170 108 140 112 Q70 120 40 98 Z' fill='#8C9AA6'/><path d='M186 98 L206 84 L204 112 Z' fill='#6E7A86'/><path d='M50 98 Q110 92 180 98' stroke='#C8D0D8' stroke-width='3' fill='none'/><circle cx='56' cy='94' r='4' fill='#222'/>"; if (glaze) h += "<path d='M60 90 Q120 82 176 94' stroke='" + glaze + "' stroke-width='10' opacity='.5' fill='none'/>"; for (var k = 0; k < 4; k++) h += "<path d='M" + (84 + k * 22) + " 88 l8 18' stroke='#5E6A76' stroke-width='3' opacity='.6'/>"; }
  else { h += "<path d='M50 106 Q46 78 90 74 L150 74 Q182 76 182 96 Q180 116 150 118 L90 118 Q54 118 50 106 Z' fill='" + col + "' stroke='" + shade(col, -.3) + "' stroke-width='3'/>" + "<path d='M70 86 Q120 80 166 88 M64 100 Q120 94 172 102' stroke='" + shade(col, -.15) + "' stroke-width='2' fill='none'/>"; if (has(r, /鮭|サーモン|サバ/)) h += "<path d='M60 100 Q100 86 170 96' stroke='" + (has(r, /サバ/) ? '#7A8090' : '#FBD0B8') + "' stroke-width='5' fill='none'/><path d='M150 76 Q180 80 180 98' stroke='" + (has(r, /サバ/) ? '#5A6070' : '#C8603A') + "' stroke-width='6' fill='none'/>"; if (glaze) h += "<path d='M56 104 Q50 82 90 78 L150 78 Q176 80 176 96' fill='none' stroke='" + glaze + "' stroke-width='12' opacity='.55'/>"; if (/ムニエル|ちゃんちゃん/.test(n)) h += chunks(R, ['#F7E08A', '#E8C060'], 116, 96, 40, 12, 6, 8); }
  if (/ちゃんちゃん/.test(n)) h += chunks(R, foodCols(r, /鮭/), 120, 100, 80, 18, 16, 12);
  h += has(r, /大根/) ? "<ellipse cx='196' cy='118' rx='14' ry='8' fill='#FBFAF2' stroke='#E8E4DA'/>" : '';
  return h + (has(r, /レモン/) || /ムニエル|塩焼き/.test(n) ? lemon(186, 122) : '') + "<ellipse cx='36' cy='118' rx='9' ry='5' fill='#4C9A3A'/>";
};
D.foil = function (R, r) {
  var h = plate(120, 104, 104, 46) + "<path d='M30 104 Q34 54 120 50 Q206 54 210 104 Q200 126 120 128 Q40 126 30 104 Z' fill='#D8DCE0' stroke='#B0B6BC' stroke-width='2'/><path d='M44 104 Q50 66 120 62 Q190 66 196 104 Q186 118 120 120 Q54 118 44 104 Z' fill='#EEF0F2'/>";
  var main = has(r, /鮭/) ? '#F2906E' : has(r, /たら/) ? '#FBF6EC' : foodCols(r)[0];
  h += "<path d='M70 98 Q68 78 100 76 L140 76 Q170 78 170 96 Q168 112 140 112 L100 112 Q72 112 70 98 Z' fill='" + main + "' stroke='" + shade(main, -.3) + "' stroke-width='2'/>";
  h += chunks(R, foodCols(r, /鮭|たら|バター/), 120, 92, 64, 20, 14, 10);
  if (has(r, /バター/)) h += "<rect x='110' y='84' width='20' height='12' rx='3' fill='#FBE48A'/>";
  return h + greens(R, 120, 90, 40, 10, 6);
};
D.salad = function (R, r) {
  var h = shadow(120, 146, 92) + "<path d='M24 80 Q30 142 120 142 Q210 142 216 80 Z' fill='#E8F4F8' opacity='.85'/><ellipse cx='120' cy='80' rx='96' ry='28' fill='#F4FAFC' stroke='#C8E2EC' stroke-width='2'/>";
  var leafy = has(r, /レタス|ベビーリーフ|水菜|キャベツ|春菊|大葉/), cols = foodCols(r);
  if (leafy) h += chunks(R, ['#8CC45A', '#6FAE45', '#A8D46F'], 120, 78, 76, 18, 24, 16, 'leaf');
  else if (/ポテト|マカロニ|かぼちゃ/.test(r.name)) h += "<ellipse cx='120' cy='76' rx='70' ry='20' fill='" + (has(r, /かぼちゃ/) ? '#F7C850' : has(r, /マカロニ/) ? '#F6E6B0' : '#F7EAC0') + "'/>";
  h += chunks(R, cols, 120, 76, 70, 17, 22, 10);
  if (has(r, /マヨネーズ|ごまだれ/)) h += "<path d='M80 72 q10 -6 20 0 t20 0 t20 0 t20 0' stroke='#FBF4D8' stroke-width='4' fill='none'/>";
  return h;
};
D.kobachi = function (R, r) {
  var dark = r.genre === '和' || r.genre === '韓' || r.genre === '中', col = dark ? '#3A3A48' : '#F2EEE6';
  var h = bowl(120, 82, 78, 56, col, '#FBF8F0');
  var s = sauce(r), cols = foodCols(r), n = r.name;
  if (s && /煮|きんぴら|炒め|照り|甘辛/.test(n)) h += "<ellipse cx='120' cy='82' rx='64' ry='16' fill='" + s + "' opacity='.45'/>";
  if (/おひたし|ごまあえ|ごま和え|胡麻|ナムル|白和え/.test(n) || has(r, /ほうれん草|小松菜|春菊/)) h += chunks(R, cols, 120, 78, 54, 12, 22, 14, 'leaf');
  else if (/きんぴら|千切り|細切り|しりしり|切り干し|ラペ|なます|ひじき/.test(n)) h += chunks(R, cols, 120, 78, 56, 12, 40, 12, 'leaf');
  else h += chunks(R, cols, 120, 78, 56, 13, 20, 13);
  if (has(r, /白ごま/)) h += chunks(R, ['#F4EAD0'], 120, 76, 50, 10, 14, 4, 'dot');
  if (has(r, /かつお節/)) h += chunks(R, ['#D8A070', '#C89060'], 120, 74, 30, 7, 8, 6, 'leaf');
  return h + (has(r, /ねぎ|三つ葉/) ? greens(R, 120, 76, 40, 8, 8) : '');
};
D.nimono = function (R, r) { var h = bowl(120, 80, 92, 62, '#3A3A48', '#FBF8F0'), s = sauce(r) || '#A86A30'; h += "<ellipse cx='120' cy='80' rx='78' ry='19' fill='" + s + "' opacity='.6'/>" + chunks(R, foodCols(r), 120, 74, 64, 14, 18, 17); if (has(r, /^卵$/)) h += egg(150, 74, 12, true); return h + "<ellipse cx='100' cy='70' rx='16' ry='4' fill='#fff' opacity='.3'/>" + (has(r, /ねぎ|三つ葉|いんげん|絹さや/) ? greens(R, 120, 72, 40, 8, 6) : ''); };
D.steak = function (R, r) {
  var h = plate(120, 100, 104, 50), main = foodCols(r)[0], s = sauce(r), n = r.name;
  if (/大根|豆腐/.test(n) && /ステーキ/.test(n)) { for (var i = 0; i < 3; i++) h += "<ellipse cx='" + (76 + i * 44) + "' cy='94' rx='20' ry='14' fill='" + (has(r, /大根/) ? '#E8C890' : '#D8A050') + "' stroke='#B88030'/>"; return h + greens(R, 120, 90, 50, 10, 8); }
  h += "<path d='M50 100 Q46 70 100 66 L140 66 Q184 70 180 98 Q176 122 130 122 L94 122 Q54 122 50 100 Z' fill='" + shade(main, -.15) + "'/><path d='M56 96 Q54 74 100 72 L140 72 Q176 74 174 94 Q170 114 130 114 L94 114 Q58 114 56 96 Z' fill='" + main + "'/>";
  for (var k = 0; k < 4; k++) h += "<line x1='" + (78 + k * 22) + "' y1='76' x2='" + (66 + k * 22) + "' y2='112' stroke='" + shade(main, -.35) + "' stroke-width='3' opacity='.55'/>";
  if (s) h += "<path d='M70 88 Q120 70 166 88' stroke='" + s + "' stroke-width='10' fill='none' opacity='.6' stroke-linecap='round'/>";
  return h + "<circle cx='190' cy='92' r='12' fill='#4C9A3A'/><circle cx='188' cy='112' r='8' fill='#F08A2C'/>" + (has(r, /にんにく/) ? chunks(R, ['#F2E2B8'], 120, 84, 30, 8, 6, 6, 'dot') : '');
};
D.stirfry = function (R, r) {
  var h = plate(120, 100, 106, 52), s = sauce(r), cols = foodCols(r);
  if (s) h += "<ellipse cx='120' cy='96' rx='76' ry='30' fill='" + s + "' opacity='.35'/>";
  h += chunks(R, cols, 120, 92, 70, 26, 34, 15);
  if (has(r, /もやし/)) h += chunks(R, ['#F6F1DE'], 120, 92, 64, 24, 14, 12, 'leaf');
  if (s) h += "<ellipse cx='100' cy='80' rx='30' ry='6' fill='#fff' opacity='.25'/>";
  if (has(r, /白ごま/)) h += chunks(R, ['#F4EAD0'], 120, 88, 60, 20, 16, 4, 'dot');
  return h;
};
// ---- デザート ----
function fruitCols(r) { var l = []; r.ing.forEach(function (i) { if (i.food && C[i.n] && /果物|その他/.test('') === false) l.push(C[i.n]); }); return l.length ? l : ['#E8384A']; }
D.pudding = function (R, r) { var col = has(r, /かぼちゃ/) ? '#F2B040' : has(r, /マンゴー/) ? '#F7B030' : has(r, /豆乳|牛乳/) && !has(r, /^卵$/) ? '#FBF6EA' : '#F7D878'; return plate(120, 128, 70, 22) + "<path d='M84 70 L74 124 Q120 136 166 124 L156 70 Z' fill='" + col + "'/><ellipse cx='120' cy='70' rx='36' ry='10' fill='" + (has(r, /^卵$/) ? '#8A4A1E' : shade(col, -.1)) + "'/><path d='M84 72 Q86 92 80 108' stroke='" + (has(r, /^卵$/) ? '#8A4A1E' : col) + "' stroke-width='5' fill='none'/><ellipse cx='104' cy='92' rx='5' ry='16' fill='#fff' opacity='.35'/>" + (has(r, /はちみつ/) ? "<ellipse cx='120' cy='70' rx='26' ry='6' fill='#E8A830'/>" : ''); };
D.jelly = function (R, r) {
  var fc = foodCols(r, /ゼラチン|牛乳|生クリーム|ヨーグルト|豆乳/), col = /パンナコッタ|ムース|プリン/.test(r.name) ? (has(r, /チョコ/) ? '#7A4A30' : '#FBF6EA') : shade(fc[0], .35);
  var h = glass(120, 54, 76, 84, col, [[col, 70]]);
  h += chunks(R, fc, 120, 104, 26, 26, 8, 12);
  if (/パンナコッタ/.test(r.name)) h += "<rect x='86' y='66' width='68' height='10' fill='#E8384A'/>";
  return h;
};
D.parfait = function (R, r) { var fc = foodCols(r, /ヨーグルト|コーンフレーク|牛乳/), h = glass(120, 46, 74, 96, '#fff', [['#E8B85A', 20], ['#FBF8F2', 24], [shade(fc[0], .2), 12], ['#FBF8F2', 22]]); return h + chunks(R, fc, 120, 52, 30, 8, 9, 13) + (has(r, /はちみつ/) ? "<path d='M92 50 Q120 62 148 50' stroke='#E8A830' stroke-width='4' fill='none'/>" : ''); };
D.drink = function (R, r) { var fc = foodCols(r, /牛乳|ヨーグルト|はちみつ|練乳/), col = has(r, /チョコ/) ? '#7A4A30' : has(r, /牛乳|ヨーグルト/) ? shade(fc[0], .45) : fc[0]; var h = glass(120, 46, 64, 100, col, [[col, 88]]) + "<rect x='126' y='26' width='7' height='70' rx='3' fill='#FF7F50' transform='rotate(12 129 60)'/>"; if (/漬け/.test(r.name)) h = shadow(120, 146, 60) + "<rect x='80' y='52' width='80' height='92' rx='14' fill='#FBEFD0' stroke='#E8D8A8' stroke-width='3'/><rect x='88' y='40' width='64' height='16' rx='4' fill='#C8A060'/>" + chunks(R, fc, 120, 100, 30, 34, 12, 16); return h + (has(r, /いちご|キウイ|みかん|レモン|メロン|すいか/) ? "<circle cx='96' cy='48' r='12' fill='" + fc[0] + "' stroke='" + shade(fc[0], -.2) + "'/>" : ''); };
D.cake = function (R, r) { var h = plate(120, 120, 86, 30), base = has(r, /チョコ|ココア/) ? '#6A3E2A' : has(r, /チーズ|ヨーグルト/) ? '#F2D890' : has(r, /バナナ/) ? '#D8A050' : '#F7E2B0'; h += "<path d='M60 112 L120 60 L180 112 Z' fill='" + base + "'/><path d='M60 112 L180 112 L180 126 L60 126 Z' fill='" + shade(base, -.15) + "'/>"; if (/ショート/.test(r.name)) h += "<path d='M64 104 L176 104' stroke='#FFFDF6' stroke-width='8'/><path d='M84 84 L156 84' stroke='#FFFDF6' stroke-width='6'/><circle cx='120' cy='60' r='12' fill='#E8384A'/>"; if (has(r, /ナッツ/)) h += chunks(R, ['#C89A60'], 120, 96, 30, 10, 8, 6); return h; };
D.cookie = function (R, r) { var h = plate(120, 106, 96, 40); for (var i = 0; i < 6; i++) { var x = 70 + (i % 3) * 50, y = 90 + Math.floor(i / 3) * 24; h += "<ellipse cx='" + x + "' cy='" + y + "' rx='22' ry='13' fill='" + (has(r, /チョコ/) && /クランチ/.test(r.name) ? '#6A3E2A' : '#D8A060') + "' stroke='#B88040'/>" + chunks(R, has(r, /チョコ/) ? ['#E8B85A', '#5A2E1E'] : ['#B8803A'], x, y, 14, 7, 5, 5, 'dot'); } return h; };
D.pancake = function (R, r) {
  var h = plate(120, 118, 96, 34);
  if (/どら焼き/.test(r.name)) { for (var i = 0; i < 2; i++) h += "<ellipse cx='" + (88 + i * 64) + "' cy='100' rx='34' ry='22' fill='#C8803A'/><ellipse cx='" + (88 + i * 64) + "' cy='96' rx='30' ry='18' fill='#A8602A'/><rect x='" + (58 + i * 64) + "' y='98' width='60' height='8' fill='#5A2E2E'/>"; return h; }
  if (/クレープ/.test(r.name)) return h + "<path d='M60 110 L120 54 L180 110 Z' fill='#F7E2B0' stroke='#E8C880' stroke-width='3'/><path d='M80 96 L160 96' stroke='#FBF8F2' stroke-width='10'/><path d='M84 104 L156 104' stroke='#C8303A' stroke-width='6'/>";
  for (var j = 0; j < 3; j++) h += "<ellipse cx='120' cy='" + (112 - j * 16) + "' rx='70' ry='20' fill='#C8803A'/><ellipse cx='120' cy='" + (108 - j * 16) + "' rx='70' ry='19' fill='#E8B060'/>";
  h += "<rect x='106' y='64' width='28' height='16' rx='3' fill='#FBE48A'/><path d='M70 78 Q120 100 170 76 L172 92' stroke='#C88020' stroke-width='5' fill='none' opacity='.75'/>";
  return h + (has(r, /ブルーベリー/) ? chunks(R, ['#4A4A9A'], 120, 74, 44, 8, 10, 7, 'dot') : '') + (has(r, /いちご/) ? "<circle cx='150' cy='70' r='9' fill='#E8384A'/>" : '');
};
D.donut = function (R, r) { var h = plate(120, 110, 96, 38); for (var i = 0; i < 3; i++) { var x = 74 + i * 46; h += "<ellipse cx='" + x + "' cy='96' rx='26' ry='18' fill='#D8963E'/><ellipse cx='" + x + "' cy='94' rx='8' ry='5' fill='#FBFAF4'/>" + chunks(R, ['#FFFFFF'], x, 92, 20, 12, 10, 4, 'dot'); } return h; };
D.mochi = function (R, r) { var h = bowl(120, 84, 80, 56, '#7A2A22', has(r, /あんこ/) ? '#6A3030' : '#FBF8F0'); for (var i = 0; i < 3; i++) h += "<ellipse cx='" + (92 + i * 28) + "' cy='" + (80 + (i % 2) * 4) + "' rx='15' ry='10' fill='#FBF8F0' stroke='#E8E0CC'/>" + (has(r, /のり/) ? "<rect x='" + (84 + i * 28) + "' y='76' width='16' height='10' fill='#22302A'/>" : ''); return h; };
D.imo = function (R, r) { var h = plate(120, 104, 96, 40); for (var i = 0; i < 7; i++) { var x = 70 + (i % 4) * 30 + (i > 3 ? 15 : 0), y = 86 + (i > 3 ? 22 : 0); h += "<path d='M" + (x - 16) + ' ' + y + ' q4 -16 18 -12 q14 4 12 16 q-4 12 -16 10 q-14 -2 -14 -14z' + "' fill='#F2C04E' stroke='#8A2A4A' stroke-width='3'/>"; } return h + chunks(R, ['#1E1A16'], 120, 92, 50, 18, 16, 3, 'dot') + "<ellipse cx='120' cy='94' rx='60' ry='20' fill='#E8A830' opacity='.3'/>"; };
D.fruitbowl = function (R, r) { var fc = foodCols(r, /砂糖|水|ゼラチン/); return bowl(120, 82, 84, 58, '#F2EEE6', '#FBF8F2') + chunks(R, fc, 120, 78, 64, 15, 22, 16) + (has(r, /シナモン/) ? chunks(R, ['#8A4A20'], 120, 76, 40, 8, 14, 3, 'dot') : ''); };

// ---- 出口 ----
var cache = {};
window.dishSVG = function (r) {
  if (cache[r.id]) return cache[r.id];
  var R = rnd(r.id + r.name), k = kind(r), body;
  try { body = (D[k] || D.stirfry)(R, r); } catch (e) { body = D.stirfry(R, r); }
  var svg = "<svg viewBox='0 0 " + W + ' ' + H + "' xmlns='http://www.w3.org/2000/svg' role='img' aria-label='" + r.name + "'>" + DEF + body + '</svg>';
  cache[r.id] = svg;
  return svg;
};
window.dishKind = kind;
window.FOOD_COL = C;
})();
