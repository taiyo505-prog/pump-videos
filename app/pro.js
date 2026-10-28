// PUMP Pro（有料プラン）。アプリ版は RevenueCat 経由で App Store / Google Play の課金を使う。
// ブラウザ版では買えないので、試用のために端末内でオン・オフできるスイッチを出す。
// 状態が変わると document に 'wk:pro' を投げる。window.WK_PRO.active で今の状態がわかる。
(function(){
'use strict';
var C=window.Capacitor,cfg=window.WK_CONFIG||{},rc=cfg.revenuecat||{};
var native=!!(C&&C.isNativePlatform&&C.isNativePlatform()),ios=native&&C.getPlatform()==='ios';
var RC=native&&C.Plugins&&C.Plugins.Purchases,apiKey=ios?rc.iosKey:rc.androidKey,ENT='pro',TRIAL='pump-pro-trial-v1';
var active=false,ready=false,offering=null,W=window.WK||{},esc=W.esc||String;

var paid=false,grantUntil=0,gTimer=null;
function byGrant(){return grantUntil>Date.now()}
function set(p){paid=!!p;apply()}
function apply(){var on=paid||byGrant();if(on===active&&ready)return;active=on;ready=true;try{document.dispatchEvent(new CustomEvent('wk:pro',{detail:{active:on}}))}catch(e){}}
// 招待の特典の期限（ミリ秒）。期限が来たら自動でオフにする
function grant(u){grantUntil=+u||0;if(gTimer)clearTimeout(gTimer);var left=grantUntil-Date.now();if(left>0&&left<2147483647)gTimer=setTimeout(apply,left+500);apply()}
function untilText(){var d=new Date(grantUntil);return (d.getMonth()+1)+'月'+d.getDate()+'日'}
function fromInfo(info){return !!(info&&info.entitlements&&info.entitlements.active&&info.entitlements.active[ENT])}


var FEATURES=[
  ['📸','体の変化','ビフォーアフター写真から、日数・体重・体脂肪の変化入りのストーリー用画像を作れる。体重・体脂肪のグラフと、目標体重まであと何日かの予測も。写真はスマホの中だけに保存。'],
  ['🏅','PROバッジとトプ画の枠','友達の画面やランキングで、名前の横に PRO バッジ、トプ画に好きな色の枠が出る。'],
  ['🚫','広告なし','ホームや履歴の下の広告が消える。'],
  ['🎨','シェア画像の色を変えられる','ブルー・グリーン・ピンク・ゴールド・ホワイトの5色を追加。'],
  ['📊','詳しい分析','次回のおすすめ重量、自己ベストの到達予測（「ベンチ100kgまであと何週」）、部位のバランス診断、12週間の推移、月別のセット数、部位別セット数の30日・全期間。'],
  ['💪','開発の応援','PUMP の新機能づくりに使わせてもらうよ。']
];
function featuresHtml(){return "<div class='pf'>"+FEATURES.map(function(f){return '<div><i>'+f[0]+'</i><span><b>'+esc(f[1])+"</b><span class='fn'>"+esc(f[2])+'</span></span></div>'}).join('')+'</div>'}
function legalHtml(){var l=cfg.legal||{},a=[];if(l.termsUrl)a.push("<a href='"+esc(l.termsUrl)+"' target='_blank' rel='noopener'>利用規約</a>");if(l.privacyUrl)a.push("<a href='"+esc(l.privacyUrl)+"' target='_blank' rel='noopener'>プライバシーポリシー</a>");return a.join('・')}

function card(html){var d=document.createElement('div');d.className='day gc';d.innerHTML=html;return d}

function paywall(el){el.innerHTML='';
  el.appendChild(card("<h2 style='font-size:22px'>PUMP<span class='pb'>PRO</span></h2>"+(paid?"<p class='fn'>✅ PUMP Pro を使っているよ。ありがとう！</p>":byGrant()?"<p class='fn'>🎁 招待の特典で PUMP Pro が使えるよ（"+untilText()+"まで）。そのあとも続けたい人は、下から購入できるよ。</p>":"<p class='fn'>記録・グラフ・友達機能は、ずっと無料で使えるよ。もっと楽しみたい人向けのプラン。</p>")+featuresHtml()));
  if(active&&window.WK_CLOUD&&WK_CLOUD.proLookCard)WK_CLOUD.proLookCard(el);
  if(!native){ // ブラウザ版（試用）
    var t=card("<h2>試用版のスイッチ</h2><p class='fn'>ここではお金はかからない。Pro の機能を試すためのスイッチだよ。アプリ版では App Store / Google Play で購入する。</p>");
    var b=document.createElement('button');b.className='hb2';b.textContent=paid?'Pro をオフにする':'Pro をオンにして試す';
    b.addEventListener('click',function(){try{localStorage.setItem(TRIAL,paid?'0':'1')}catch(e){}set(!paid);paywall(el)});
    t.appendChild(b);el.appendChild(t);return}
  if(!RC||!apiKey){el.appendChild(card("<p class='fn'>購入の準備中だよ。もうしばらく待ってね。</p>"));return}
  if(paid){var m=card("<p class='fn'>プランの変更・解約は、"+(ios?'iPhone の「設定」→ 自分の名前 →「サブスクリプション」':'Google Play の「お支払いと定期購入」')+'から。</p>');el.appendChild(m);return}
  var box=card("<h2>プランを選ぶ</h2><div class='pk'><p class='fn'>読み込み中…</p></div>"),pk=box.querySelector('.pk'),msg=document.createElement('div');msg.className='fn';
  el.appendChild(box);
  (offering?Promise.resolve(offering):RC.getOfferings().then(function(o){return offering=o&&o.current})).then(function(of){
    pk.innerHTML='';var ps=of?of.availablePackages:[];
    if(!ps.length){pk.innerHTML="<p class='fn'>今は購入できない。時間をおいてもう一度開いてね。</p>";return}
    ps.forEach(function(p){var b=document.createElement('button'),label={MONTHLY:'月額',ANNUAL:'年額',LIFETIME:'買い切り'}[p.packageType]||p.product.title;
      b.className=p.packageType==='ANNUAL'?'best':'';
      b.innerHTML='<span>'+esc(label)+(p.packageType==='ANNUAL'?" <span class='pb'>おトク</span>":'')+'<small>'+(p.packageType==='LIFETIME'?'1回払うだけでずっと使える':'自動で更新。いつでも解約できる')+'</small></span><span>'+esc(p.product.priceString)+'</span>';
      b.addEventListener('click',function(){msg.textContent='購入画面を開いてるよ…';
        RC.purchasePackage({aPackage:p}).then(function(r){set(fromInfo(r.customerInfo));msg.textContent='';paywall(el)})
        .catch(function(e){msg.textContent=(e&&(e.code==='1'||e.userCancelled))?'':'購入できなかった。通信を確認して、もう一度試してね。'})});
      pk.appendChild(b)});
  }).catch(function(){pk.innerHTML="<p class='fn'>読み込めなかった。通信を確認してね。</p>"});
  var r=document.createElement('button');r.className='hb2';r.textContent='購入を復元';r.style.background='var(--bot)';r.style.color='var(--ink)';
  r.addEventListener('click',function(){msg.textContent='確認中…';RC.restorePurchases().then(function(x){var on=fromInfo(x.customerInfo);set(on);msg.textContent=on?'復元したよ。':'復元できる購入が見つからなかった。';if(on)paywall(el)}).catch(function(){msg.textContent='復元できなかった。'})});
  var note=card("<p class='fn'>月額・年額は、期間が終わる24時間前までに解約しない限り自動で更新され、"+(ios?'Apple ID':'Google アカウント')+'に請求されます。解約は'+(ios?'「設定」→ 自分の名前 →「サブスクリプション」':'Google Play の「お支払いと定期購入」')+'から。'+(legalHtml()?'<br>'+legalHtml():'')+'</p>');
  box.appendChild(msg);box.appendChild(r);el.appendChild(note)}

window.WK_PRO={get active(){return active},get ready(){return ready},get grantUntil(){return grantUntil},paywall:paywall,grant:grant};

// WK_PRO を用意してから状態を流す（受け取る側が WK_PRO.active を読むため）
if(RC&&apiKey){
  RC.configure({apiKey:apiKey}).then(function(){
    RC.addCustomerInfoUpdateListener(function(info){set(fromInfo(info))});
    return RC.getCustomerInfo()}).then(function(r){set(fromInfo(r.customerInfo))}).catch(function(){set(false)});
}else if(!native){
  try{set(localStorage.getItem(TRIAL)==='1')}catch(e){set(false)}
}else set(false);
})();
