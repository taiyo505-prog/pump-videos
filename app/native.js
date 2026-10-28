// アプリ版（Capacitor）でだけ動く機能。ブラウザでは何もしない。
// index.html からは document の CustomEvent（wk:record / wk:rest / wk:reststop / wk:restend）で呼ばれる。
(function(){
'use strict';
var C=window.Capacitor;
if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
var P=C.Plugins||{},cfg=window.WK_CONFIG||{},ios=C.getPlatform()==='ios';
document.documentElement.classList.add('native');

// ---- 触覚フィードバック ----
var H=P.Haptics;
function hap(style){try{H&&H.impact({style:style||'MEDIUM'})}catch(e){}}
document.addEventListener('wk:record',function(e){hap(e.detail&&e.detail.pr?'HEAVY':'MEDIUM')});
document.addEventListener('wk:restend',function(){try{H&&H.notification({type:'SUCCESS'})}catch(e){}});
document.addEventListener('wk:tick',function(e){hap(e.detail&&e.detail.go?'HEAVY':'LIGHT')});

// ---- 休憩終了のローカル通知（画面を閉じていても届く） ----
var LN=P.LocalNotifications,REST_ID=1001,asked=false;
function ensurePerm(){if(!LN||asked)return Promise.resolve();asked=true;return LN.checkPermissions().then(function(p){if(p.display!=='granted')return LN.requestPermissions()}).catch(function(){})}
function cancelRest(){if(LN)LN.cancel({notifications:[{id:REST_ID}]}).catch(function(){})}
document.addEventListener('wk:rest',function(e){if(!LN)return;var at=new Date(e.detail.end);ensurePerm().then(function(){cancelRest();return LN.schedule({notifications:[{id:REST_ID,title:'休憩おわり 💪',body:'次のセットにいこう。',schedule:{at:at,allowWhileIdle:true}}]})}).catch(function(){})});
document.addEventListener('wk:reststop',cancelRest);
document.addEventListener('wk:restend',cancelRest);

// ---- 広告（画面下のバナーのみ） ----
// 記録中のチャット画面（入力欄・記録ボタン・タイマーがある画面）では出さない。
// ホーム・履歴・統計・友達など、全画面ページが前に出ているときだけ表示する。
var A=P.AdMob,adReady=false,adShown=false,adLoaded=false,adH=0;
function setAdH(h){document.documentElement.style.setProperty('--ad-h',(h||0)+'px')}
function wantAd(){var q=function(s){return document.querySelector(s)};if(window.WK_PRO&&window.WK_PRO.active)return false;if(q('#ov.on')||q('#sv.on')||q('#dr.on'))return false;return !!(q('#st.on')||q('.pg.on'))}
function syncAd(){if(!adReady)return;var w=wantAd();if(w===adShown)return;adShown=w;
if(w){if(adLoaded)setAdH(adH);(adLoaded?A.resumeBanner():A.showBanner({adId:ios?cfg.admob.bannerIos:cfg.admob.bannerAndroid,adSize:'ADAPTIVE_BANNER',position:'BOTTOM_CENTER',margin:0,isTesting:!!cfg.admob.testing})).then(function(){adLoaded=true}).catch(function(){adShown=false})}
else{setAdH(0);A.hideBanner().catch(function(){})}}
function initAds(){if(!A||!cfg.admob)return;
A.addListener('bannerAdSizeChanged',function(s){adH=s.height||0;setAdH(adShown?adH:0)});
A.addListener('bannerAdFailedToLoad',function(){setAdH(0)});
// iOS: 先に追跡許可（ATT）を確認 → 同意管理（UMP）→ 初期化
var att=ios?A.trackingAuthorizationStatus().then(function(s){if(s.status==='notDetermined')return A.requestTrackingAuthorization()}).catch(function(){}):Promise.resolve();
att.then(function(){return A.requestConsentInfo()}).then(function(info){if(info.isConsentFormAvailable&&info.status==='REQUIRED')return A.showConsentForm();return info}).catch(function(){})
.then(function(){return A.initialize({initializeForTesting:!!cfg.admob.testing})})
.then(function(){adReady=true;syncAd()}).catch(function(){});
document.addEventListener('wk:pro',syncAd);
new MutationObserver(syncAd).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']})}
// 設定画面から「広告の同意を変更」を開けるようにする（EU などで必要）
// ---- 画像・動画の共有（いったん端末の一時フォルダに書いてから、共有シートを開く） ----
function shareFile(blob,name,text){var FS=P.Filesystem,SH=P.Share;if(!FS||!SH||!blob)return Promise.resolve(false);
 return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1])};r.onerror=rej;r.readAsDataURL(blob)})
 .then(function(b64){return FS.writeFile({path:name,data:b64,directory:'CACHE'})})
 .then(function(w){return SH.share({text:text||'',files:[w.uri]})}).then(function(){return true})
 .catch(function(e){return !/cancel/i.test(String(e&&e.message||e))?false:true})}
// ---- インスタのストーリー・Xの投稿画面に直接とばす、写真アプリに保存（ios/App/App/PumpShare.swift） ----
function b64(blob){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1])};r.onerror=rej;r.readAsDataURL(blob)})}
function isVid(blob){return /^video/.test(blob&&blob.type||'')}
function igStory(blob){var PS=P.PumpShare;if(!PS||!blob||!cfg.instagramAppId)return Promise.resolve(false);
 return b64(blob).then(function(d){return PS.instagramStory({data:d,video:isVid(blob),appId:cfg.instagramAppId})}).then(function(r){return !!(r&&r.ok)}).catch(function(){return false})}
function xPost(blob,text){var PS=P.PumpShare;if(!PS)return Promise.resolve(null);
 return (blob&&!isVid(blob)?b64(blob):Promise.resolve('')).then(function(d){return PS.xPost({data:d||undefined,text:text||''})}).catch(function(){return null})}
function saveMedia(blob){var PS=P.PumpShare;if(!PS||!blob)return Promise.resolve(null);
 return b64(blob).then(function(d){return PS.saveMedia({data:d,video:isVid(blob)})}).catch(function(){return null})}
function musicState(ask,have){var PS=P.PumpShare;if(!PS||!ios)return Promise.resolve(null);return PS.musicState({ask:!!ask,have:have||''}).catch(function(){return null})}
window.WK_NATIVE={privacyOptions:function(){return A?A.showPrivacyOptionsForm():Promise.resolve()},
pushRegister:function(save){pushRegister(save)},
takeInvite:function(){var c=pendingInvite;pendingInvite=null;return c},
shareFile:shareFile,igStory:igStory,xPost:xPost,saveMedia:saveMedia,musicState:musicState};

// ---- ストアのレビュー依頼 ----
// 自己ベストを更新した気分のいい時に出す。5日以上トレーニングした人だけ、120日に1回まで（OS 側でも年3回までに制限される）
var RV=P.InAppReview,REVIEW_AT='pump-review-at';
document.addEventListener('wk:record',function(e){if(!RV||!(e.detail&&e.detail.pr)||!window.WK)return;var W=window.WK,days={};
(W.data||[]).forEach(function(x){days[W.dkey(x.t)]=1});if(Object.keys(days).length<5)return;
var last=0;try{last=+localStorage.getItem(REVIEW_AT)||0}catch(_){}if(Date.now()-last<120*864e5)return;
try{localStorage.setItem(REVIEW_AT,String(Date.now()))}catch(_){}setTimeout(function(){RV.requestReview().catch(function(){})},1500)});

// ---- プッシュ通知（いいね・コメント・友達申請） ----
// ログインしたら cloud.js が WK_NATIVE.pushRegister(保存する関数) を呼ぶ。通知を押したら、その画面（お知らせ・友達）を開く
var PN=P.PushNotifications,pushSave=null,pushAsked=false;
if(PN){
PN.addListener('registration',function(t){if(pushSave&&t&&t.value)pushSave(t.value,ios?'ios':'android')});
PN.addListener('pushNotificationActionPerformed',function(a){var d=(a&&a.notification&&a.notification.data)||{};
if(window.WK)window.WK.go('friends');if(window.WK_CLOUD&&window.WK_CLOUD.open)setTimeout(function(){window.WK_CLOUD.open(d.type==='friend'?'friends':'news')},300)});
}
function pushRegister(save){pushSave=save;if(!PN||pushAsked||!(cfg.push&&cfg.push[ios?'ios':'android']))return;pushAsked=true;
PN.checkPermissions().then(function(p){return p.receive==='prompt'||p.receive==='prompt-with-rationale'?PN.requestPermissions():p})
.then(function(p){if(p.receive==='granted')return PN.register()}).catch(function(){})}

// ---- 招待リンク（pump://invite?c=フレンドコード）でアプリが開いたとき ----
var pendingInvite=null;
function handleUrl(u){var m=/[?&]c=([A-Za-z0-9]{4,16})/.exec(u||'');if(!m||!/^pump:\/\/invite/i.test(u))return;
pendingInvite=m[1].toUpperCase();if(window.WK_CLOUD&&window.WK_CLOUD.invite){window.WK_CLOUD.invite(pendingInvite);pendingInvite=null}}

// ---- Android の戻るボタン ----
var App=P.App;
if(App){App.addListener('appUrlOpen',function(e){handleUrl(e&&e.url)});App.getLaunchUrl().then(function(r){if(r&&r.url)handleUrl(r.url)}).catch(function(){})}
if(App)App.addListener('backButton',function(){var b=document.querySelector('#dr.on #drb')||document.querySelector('#sv.on #shc')||document.querySelector('#ov.on #fx:not([hidden])')||document.querySelector('.pg.on .bk');if(b)b.click();else App.minimizeApp()});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initAds);else initAds();
})();
