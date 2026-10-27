// クラウド機能: ログイン・友達・フィード（いいね・コメント）・ランキング・お知らせ・スポンサー枠・投稿・バックアップ。
// 通信は api に集めている。Supabase の設定があれば本物、試用版では demo.js の見本データ（WK_DEMO_API）を使う。
(function(){
'use strict';
var cfg=window.WK_CONFIG||{},W=window.WK;
if(!W){window.WK_CLOUD={enabled:false};return}
var api=null,demo=false;
if(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase)api=supabaseApi();
else if(window.WK_DEMO_API){api=window.WK_DEMO_API;demo=true}
if(!api){window.WK_CLOUD={enabled:false};return}

var esc=W.esc,user=null,me=null,tab='feed',rankBy='count',SEEN='pump-seen-v1',sponsorsCache=null;
function $(id){return document.getElementById(id)}
function h(tag,attrs,html){var e=document.createElement(tag);for(var k in attrs||{})e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e}
function btn(text,cls,fn){var b=h('button',{class:cls||'hb2',type:'button'});b.textContent=text;b.addEventListener('click',fn);return b}
function card(title){var c=h('div',{class:'day gc'});if(title)c.appendChild(h('h2',null,esc(title)));return c}
function note(el,t){el.textContent=t||''}
function ago(t){var s=(Date.now()-new Date(t).getTime())/1000;if(s<60)return 'たった今';if(s<3600)return Math.floor(s/60)+'分前';if(s<86400)return Math.floor(s/3600)+'時間前';if(s<7*86400)return Math.floor(s/86400)+'日前';return W.md(new Date(t).getTime())}
var COLORS=['#ff5a1f','#3d8bff','#2fd27a','#ff4fa3','#f5b83d','#a970ff'];
// トプ画。写真があれば写真、なければ名前の1文字目を色つきの丸で
var AV={};
function learn(id,url){if(id&&url)AV[id]=url}
function avatar(id,name,size){var sz=size?'width:'+size+'px;height:'+size+'px;font-size:'+Math.round(size*.45)+'px':'';
if(AV[id])return "<img class='av' alt='' src='"+esc(AV[id])+"' style='"+sz+"'>";
var n=0;for(var i=0;i<String(id).length;i++)n=(n*31+String(id).charCodeAt(i))>>>0;return "<span class='av' style='background:"+COLORS[n%COLORS.length]+';'+sz+"'>"+esc((name||'?').charAt(0))+'</span>'}
function squareJpeg(file,px){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){URL.revokeObjectURL(u);var s=Math.min(im.naturalWidth,im.naturalHeight),c=document.createElement('canvas');c.width=c.height=px;
c.getContext('2d').drawImage(im,(im.naturalWidth-s)/2,(im.naturalHeight-s)/2,s,s,0,0,px,px);c.toBlob(function(b){b?res(b):rej()},'image/jpeg',.85)};im.onerror=rej;im.src=u})}
function seen(){try{return +localStorage.getItem(SEEN)||0}catch(e){return 0}}
function markSeen(){try{localStorage.setItem(SEEN,String(Date.now()))}catch(e){}}
function weekStart(){var d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d.getTime()}

// ---- 画面内の確認ダイアログ（alert/confirm/prompt の代わり） ----
function sheet(o){return new Promise(function(res){var ov=h('div',{class:'sh'}),bx=h('div',{class:'shb'},(o.title?'<b>'+esc(o.title)+'</b>':'')+(o.body?"<p class='fn'>"+esc(o.body)+'</p>':'')),inp=null;
if(o.input){inp=h('textarea',{class:'gs',rows:'3',maxlength:'500',placeholder:o.input});bx.appendChild(inp)}
var acts=o.actions||[[o.ok||'OK',true,o.danger]],row=h('div',{class:'shr'});
function close(v){ov.remove();res(v)}
row.appendChild(btn(o.cancel||'やめる','hb2 sec',function(){close(false)}));
acts.forEach(function(a){var b=btn(a[0],'hb2'+(a[2]?' dng':''),function(){if(inp){if(!inp.value.trim())return inp.focus();return close(inp.value.trim())}close(a[1])});row.appendChild(b)});
bx.appendChild(row);ov.appendChild(bx);ov.addEventListener('click',function(e){if(e.target===ov)close(false)});document.body.appendChild(ov);if(inp)inp.focus()})}
function toast(t){var d=h('div',{class:'toast'});d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.classList.add('on')},10);setTimeout(function(){d.classList.remove('on');setTimeout(function(){d.remove()},300)},2200)}

// ---- ログイン状態 ----
var authOk,authReady=new Promise(function(r){authOk=r});
api.onAuth(function(u){var was=user&&user.id;user=u;authOk();if(user&&user.id!==was){api.me().then(function(m){me=m;learn(m.id,m.avatar_url);refresh();afterLogin()}).catch(function(){})}if(!user){me=null;setBadge(0);homeLine('')}});

function legalLinks(){var l=cfg.legal||{},a=[];if(l.termsUrl)a.push("<a href='"+esc(l.termsUrl)+"' target='_blank' rel='noopener'>利用規約</a>");if(l.privacyUrl)a.push("<a href='"+esc(l.privacyUrl)+"' target='_blank' rel='noopener'>プライバシーポリシー</a>");return a.length?a.join('と'):'利用規約とプライバシーポリシー'}
function signIn(el,done){var c=card('ログイン');
c.appendChild(h('p',{class:'fn'},'メールアドレスに届く6桁のコードでログイン。パスワードはいらないよ。'));
var em=h('input',{type:'email',class:'gs',placeholder:'mail@example.com',autocomplete:'email',inputmode:'email'});
var ok=h('label',{class:'fn',style:'display:flex;gap:8px;align-items:flex-start'},"<input type='checkbox' style='margin-top:4px'><span>13歳以上（18歳未満は保護者の同意を得ている）で、"+legalLinks()+'に同意する。不快な投稿やいやがらせは禁止。</span>');
var pw=false,msg=h('div',{class:'fn'}),code=h('input',{class:'gs',inputmode:'numeric',autocomplete:'one-time-code',placeholder:'6桁のコード',maxlength:'10'}),step2=h('div');step2.hidden=true;
var send=btn('コードを送る','hb2',function(){var e=em.value.trim();if(!/^\S+@\S+\.\S+$/.test(e))return note(msg,'メールアドレスを確認してね。');if(!ok.querySelector('input').checked)return note(msg,'同意のチェックを入れてね。');// App Store の審査用アカウントだけは、メールのコードの代わりにパスワードで入る（審査員はこちらのメールを見られないため）
if(cfg.reviewEmail&&e.toLowerCase()===cfg.reviewEmail.toLowerCase()){pw=true;code.type='password';code.removeAttribute('inputmode');code.removeAttribute('maxlength');code.autocomplete='current-password';code.placeholder='パスワード';step2.hidden=false;note(msg,'審査用アカウントのパスワードを入れてね。');code.focus();return}
pw=false;send.disabled=true;note(msg,'送信中…');
api.sendCode(e).then(function(){send.disabled=false;step2.hidden=false;note(msg,e+' にコードを送ったよ。届かないときは迷惑メールも見てね。');code.focus()}).catch(function(err){send.disabled=false;note(msg,'送れなかった: '+(err&&err.message||''))})});
step2.appendChild(code);step2.appendChild(btn('ログイン','hb2',function(){var t=pw?code.value:code.value.replace(/\D/g,'');if(pw?!t:t.length<6)return note(msg,pw?'パスワードを入れてね。':'コードを入れてね。');note(msg,'確認中…');
(pw?api.passwordLogin(em.value.trim(),t):api.verify(em.value.trim(),t)).then(function(u){user=u;return api.me()}).then(function(m){me=m;done&&done()}).catch(function(){note(msg,pw?'パスワードが違うよ。':'コードが違うか、期限切れ。もう一度送ってね。')})}));
[em,ok,send,step2,msg].forEach(function(x){c.appendChild(x)});el.appendChild(c)}

// ---- 友達ページ（タブ: フィード / ランキング / お知らせ / 友達） ----
var root=null;
async function friends(el,t){root=el;if(t)tab=t;el.innerHTML='';
if(demo)el.appendChild(h('div',{class:'demo'},'デモ: 見本の友達とデータで動いてるよ。アプリ版では本物の友達とつながる。'));
if(!user){var intro=card();intro.innerHTML="<b>友達と記録を見せ合おう</b><p class='fn'>トレーニング後に写真つきで投稿すると、友達のフィードに載るよ。いいね・コメントで応援し合えて、毎週のランキングもある。見られるのは承認した友達だけ。</p>";el.appendChild(intro);signIn(el,function(){friends(el)});return}
if(!me)me=await api.me();learn(me.id,me.avatar_url);
var tabs=h('div',{class:'tabs ft'});[['feed','フィード'],['rank','ランキング'],['news','お知らせ'],['friends','友達']].forEach(function(x){var b=btn(x[1],x[0]===tab?'on':'',function(){friends(el,x[0])});b.setAttribute('data-tab',x[0]);if(x[0]==='news')b.appendChild(h('span',{class:'badge',id:'nb',hidden:''}));tabs.appendChild(b)});el.appendChild(tabs);
var body=h('div');el.appendChild(body);body.textContent='読み込み中…';
try{if(tab==='feed')await feedTab(body);else if(tab==='rank')await rankTab(body);else if(tab==='news')await newsTab(body);else await friendsTab(body)}catch(e){body.textContent='読み込めなかった。通信を確認してね。'}
refresh()}

function sponsors(place){if(!sponsorsCache)sponsorsCache=api.sponsors().catch(function(){return[]});return sponsorsCache.then(function(a){return a.filter(function(s){return s.placement===place})})}
function sponsorCard(s){var c=h('div',{class:'day gc spn'});c.innerHTML="<div class='spl'><span>PR</span>"+esc(s.name)+'</div>'+(s.image_url?"<img alt='' src='"+esc(s.image_url)+"'>":'')+'<b>'+esc(s.title)+'</b>'+(s.body?"<p class='fn'>"+esc(s.body)+'</p>':'')+(s.link_url?"<a class='hb2' href='"+esc(s.link_url)+"' target='_blank' rel='noopener sponsored'>詳しく見る</a>":'');return c}

async function feedTab(body,uid){var ps=await api.feed(uid?{user:uid}:{}),sp=uid?[]:await sponsors('feed'),lv=uid||!api.liveFriends?[]:await api.liveFriends().catch(function(){return []}),
ach=api.achievements?await api.achievements({user:uid,since:Date.now()-7*864e5}).catch(function(){return []}):[];body.innerHTML='';ps.forEach(function(p){learn(p.user_id,p.avatar)});
if(lv.length)body.appendChild(liveStrip(lv));
if(!ps.length){body.appendChild(h('p',{class:'fn'},uid?'まだ投稿はないよ。':'まだ投稿はないよ。トレーニング後に「📷 写真を撮って友達にシェア」で投稿しよう。友達を追加すると、ここに友達の投稿が流れてくる。'));if(!uid)body.appendChild(btn('友達を追加する','hb2',function(){friends(root,'friends')}));return}
// 投稿と自己ベストのお知らせを新しい順にまぜる
var items=ps.map(function(p){return{t:new Date(p.performed_at).getTime(),p:p}}).concat(ach.map(function(a){return{t:new Date(a.created_at).getTime(),a:a}})).sort(function(x,y){return y.t-x.t}),np=0;
items.forEach(function(it){if(it.a){body.appendChild(achCard(it.a));return}body.appendChild(postCard(it.p));if(np++===Math.min(1,ps.length-1)&&sp[0])body.appendChild(sponsorCard(sp[0]))})}
// 今トレーニング中の友達（20分以内に動きがあった人）
function liveStrip(lv){var c=h('div',{class:'live'},"<div class='lvh'><span class='lvd'></span>今トレーニング中</div>"),row=h('div',{class:'lvr'});
lv.forEach(function(x){learn(x.user_id,x.avatar);var m=Math.max(1,Math.round((Date.now()-new Date(x.started_at).getTime())/6e4)),b=h('button',{type:'button',class:'lvp'},avatar(x.user_id,x.name,40)+'<b>'+esc(x.name)+"</b><span class='lvt'>🔥 "+(m<60?m+'分':Math.floor(m/60)+'時間')+'</span>');
b.addEventListener('click',function(){profile(x.user_id,x.name)});row.appendChild(b)});c.appendChild(row);return c}
// 自己ベストのお知らせ（友達が祝える）
function achCard(a){learn(a.user_id,a.avatar);var mine=a.user_id===me.id,on=a.cheers.indexOf(me.id)>=0,n=a.cheers.length,c=h('div',{class:'day ach'});
c.innerHTML="<div class='ach1'>"+avatar(a.user_id,a.name,40)+"<div><div class='ach2'>🏆 <b>"+esc(a.name)+'</b> が自己ベスト更新！</div><div class=\'ach3\'>'+esc(a.exercise)+' <b>'+esc(a.value)+"</b></div><div class='fn'>"+ago(a.created_at)+'</div></div></div>';
var b=btn('','pl2 chr',async function(){if(mine)return;on=!on;n+=on?1:-1;paint();try{await api.cheer(a.id,on)}catch(e){on=!on;n+=on?1:-1;paint()}});
function paint(){b.innerHTML='🎉 '+(on?'祝った！':'おめでとう')+(n?' <b>'+n+'</b>':'');b.classList.toggle('on',on)}paint();
// 自分の自己ベストには、祝ってくれた人数だけ出す
if(mine){if(n)c.appendChild(h('div',{class:'fn chn'},'🎉 '+n+'人が祝ってくれたよ'))}else c.appendChild(b);return c}

var QUICK=['ナイス💪','えぐい🔥','おつかれ👏','参考にする📝'];
// PUMP オリジナルのスタンプ（SVG）。キーはコメントの本文 :stamp:キー: で送る
var SO='#ff5a1f',SY='#ffd84d',SK='#1b1b20',SW='#fff';
function lab(t,c){return "<text x='50' y='93' text-anchor='middle' font-size='17' font-weight='900' font-family=\"'Zen Kaku Gothic New','Hiragino Sans',sans-serif\" fill='"+(c||SW)+"' stroke='"+SK+"' stroke-width='5' paint-order='stroke'>"+t+'</text>'}
var STAMPS={
arm:{t:'ナイス💪',s:"<g fill='"+SW+"' stroke='"+SW+"' stroke-width='10' stroke-linejoin='round'><rect x='10' y='54' width='56' height='22' rx='11'/><circle cx='38' cy='54' r='15'/><rect x='50' y='22' width='20' height='50' rx='10'/><circle cx='60' cy='20' r='13'/></g><g fill='"+SO+"'><rect x='10' y='54' width='56' height='22' rx='11'/><circle cx='38' cy='54' r='15'/><rect x='50' y='22' width='20' height='50' rx='10'/><circle cx='60' cy='20' r='13'/></g><path d='M28 50 C32 44 42 43 46 49' fill='none' stroke='"+SK+"' stroke-width='3' stroke-linecap='round'/><path d='M52 14 C56 12 62 12 66 15' fill='none' stroke='"+SK+"' stroke-width='2.5' stroke-linecap='round'/><path d='M82 26 l8 -4 M84 38 l9 1 M80 14 l5 -6' stroke='"+SY+"' stroke-width='4' stroke-linecap='round'/>"+lab('ナイス！')},
fire:{t:'えぐい🔥',s:"<path d='M50 8 C58 24 76 30 74 54 C72 70 62 78 50 78 C36 78 26 68 26 54 C26 42 34 36 36 26 C42 34 44 38 44 44 C50 34 52 22 50 8 Z' fill='"+SO+"' stroke='"+SW+"' stroke-width='5' stroke-linejoin='round'/><path d='M50 46 C56 54 62 58 60 66 C58 72 54 74 50 74 C44 74 40 70 40 64 C40 58 46 56 50 46 Z' fill='"+SY+"'/>"+lab('えぐい')},
db:{t:'もう1セット',s:"<g transform='rotate(-20 50 45)'><rect x='16' y='26' width='12' height='38' rx='4' fill='"+SK+"' stroke='"+SW+"' stroke-width='3'/><rect x='28' y='32' width='8' height='26' rx='3' fill='"+SK+"' stroke='"+SW+"' stroke-width='3'/><rect x='36' y='41' width='28' height='8' rx='3' fill='"+SW+"' stroke='"+SK+"' stroke-width='3'/><rect x='64' y='32' width='8' height='26' rx='3' fill='"+SK+"' stroke='"+SW+"' stroke-width='3'/><rect x='72' y='26' width='12' height='38' rx='4' fill='"+SK+"' stroke='"+SW+"' stroke-width='3'/></g><circle cx='78' cy='14' r='10' fill='"+SO+"' stroke='"+SK+"' stroke-width='3'/><text x='78' y='19' text-anchor='middle' font-size='14' font-weight='900' fill='"+SW+"' font-family='sans-serif'>+1</text>"+lab('もう1セット',SY)},
pr:{t:'PR🏆',s:"<path d='M30 14 H70 V30 C70 44 62 52 50 52 C38 52 30 44 30 30 Z' fill='"+SY+"' stroke='"+SW+"' stroke-width='4' stroke-linejoin='round'/><path d='M30 20 H18 C18 34 26 38 32 38 M70 20 H82 C82 34 74 38 68 38' fill='none' stroke='"+SW+"' stroke-width='4'/><rect x='44' y='52' width='12' height='12' fill='"+SY+"' stroke='"+SW+"' stroke-width='4'/><rect x='34' y='64' width='32' height='10' rx='3' fill='"+SO+"' stroke='"+SW+"' stroke-width='4'/><text x='50' y='38' text-anchor='middle' font-size='15' font-weight='900' font-style='italic' fill='"+SK+"' font-family=\"'Barlow Condensed',sans-serif\">PR</text>"+lab('自己ベスト！',SY)},
shake:{t:'プロテイン',s:"<path d='M34 26 H66 L62 76 C62 79 59 80 56 80 H44 C41 80 38 79 38 76 Z' fill='"+SW+"' stroke='"+SW+"' stroke-width='4' stroke-linejoin='round'/><path d='M36 46 H64 L62 76 C62 79 59 80 56 80 H44 C41 80 38 79 38 76 Z' fill='#c98a5a'/><rect x='32' y='16' width='36' height='12' rx='4' fill='"+SO+"' stroke='"+SW+"' stroke-width='4'/><rect x='46' y='6' width='8' height='12' rx='3' fill='"+SO+"' stroke='"+SK+"' stroke-width='3'/><text x='50' y='64' text-anchor='middle' font-size='11' font-weight='900' fill='"+SW+"' font-family='sans-serif'>PUMP</text>"+lab('プロテイン！',SW)},
zzz:{t:'おつかれ',s:"<circle cx='50' cy='46' r='28' fill='"+SY+"' stroke='"+SW+"' stroke-width='5'/><path d='M36 44 q6 5 12 0 M54 44 q6 5 12 0' fill='none' stroke='"+SK+"' stroke-width='3.5' stroke-linecap='round'/><path d='M44 58 q6 5 12 0' fill='none' stroke='"+SK+"' stroke-width='3.5' stroke-linecap='round'/><circle cx='34' cy='53' r='4' fill='#ff9a7a' opacity='.8'/><circle cx='66' cy='53' r='4' fill='#ff9a7a' opacity='.8'/><text x='80' y='22' font-size='16' font-weight='900' fill='"+SO+"' stroke='"+SK+"' stroke-width='3' paint-order='stroke' font-family='sans-serif'>Z</text><text x='88' y='12' font-size='11' font-weight='900' fill='"+SO+"' stroke='"+SK+"' stroke-width='3' paint-order='stroke' font-family='sans-serif'>z</text>"+lab('おつかれ')}};
function stampSvg(k,size){var s=STAMPS[k];return s?"<svg class='stp' viewBox='0 0 100 100' width='"+(size||72)+"' height='"+(size||72)+"' role='img' aria-label='"+s.t+"'>"+s.s+'</svg>':''}
function stampOf(body){var m=/^:stamp:([a-z0-9_]+):$/.exec(body||'');return m&&STAMPS[m[1]]?m[1]:null}
// 写真の上に重ねる表示: 上にメニュー名、下に「時間・セット数・種目数」と全種目のメニュー（タップで消して写真だけ見られる）
function dur2(ms){var t=Math.floor(ms/1000),m=Math.floor(t/60),hh=Math.floor(m/60);return hh?hh+':'+('0'+m%60).slice(-2)+':'+('0'+t%60).slice(-2):m+':'+('0'+t%60).slice(-2)}
function kgOf(t){var m=String(t).match(/([\d.]+)\s*kg/);return m?+m[1]:0}
// その種目でいちばん重いセットの番号（オレンジで目立たせる）
function topIdx(sets){var bi=-1,bw=0;(sets||[]).forEach(function(t,i){var w=kgOf(t);if(w>bw){bw=w;bi=i}});return bi}
function dateTag(iso){var d=new Date(iso);return (d.getMonth()+1)+'/'+d.getDate()+' '+'SUN MON TUE WED THU FRI SAT'.split(' ')[d.getDay()]}
function overlay(p){var ex=p.exercises||[],o=h('div',{class:'pov'}),n=ex.reduce(function(a,x){return a+(x.sets||[]).length},0);
var st=(p.duration_ms?[['TIME',dur2(p.duration_ms)]]:[]).concat([['SETS',String(p.sets)],['EXERCISES',String(ex.length)]]);
o.innerHTML="<div class='pvt'><div><div class='pdt'>"+dateTag(p.performed_at)+"</div><div class='pot'>"+esc(p.title)+"</div><div class='pos'>"+esc(p.title_ja||'')+"</div></div><div class='pwm'>PUMP</div></div>"+
"<div class='pvb"+(n>14?' sm':'')+"'><div class='pvs'>"+st.map(function(x){return '<div><b>'+esc(x[1])+'</b><span>'+x[0]+'</span></div>'}).join('')+'</div>'+
ex.map(function(x,k){var ti=topIdx(x.sets);return "<div class='pox'><b><small>"+('0'+(k+1)).slice(-2)+'</small>'+esc(x.name)+(x.db?'<i>片手</i>':'')+'</b><span>'+(x.sets||[]).map(function(t,i){return '<em'+(i===ti&&(x.sets||[]).length>1?" class='tp'":'')+'>'+esc(t)+'</em>'}).join('')+'</span></div>'}).join('')+'</div>';return o}
// 投稿を1枚の画像（幅1080）にする。インスタに載せやすい 4:5 を優先し、メニューが多い日は縦に伸ばす
var CF="'Barlow Condensed','Hiragino Sans','Noto Sans JP',sans-serif",CJ="'Zen Kaku Gothic New','Hiragino Sans','Noto Sans JP',sans-serif";
function postImage(p,img){var W=1080,ex=p.exercises||[],O=getComputedStyle(document.documentElement).getPropertyValue('--acc').trim()||'#ff5a1f',mc=document.createElement('canvas').getContext('2d');
function rowsOf(s){return ex.map(function(x,k){mc.font='700 '+Math.round(38*s)+'px '+CJ;var nm=x.name+(x.db?'（片手）':''),nw=mc.measureText(nm).width+Math.round(58*s);
mc.font='600 '+Math.round(42*s)+'px '+CF;var room=1000-Math.min(nw,560)-30,lines=[[]],cw=0,gap=Math.round(26*s);
(x.sets||[]).forEach(function(t,i){var w=mc.measureText(t).width;if(lines[lines.length-1].length&&cw+gap+w>room){lines.push([]);cw=0}lines[lines.length-1].push(i);cw+=(lines[lines.length-1].length>1?gap:0)+w});
return{k:k,nm:nm,x:x,lines:lines,h:Math.max(1,lines.length)*Math.round(54*s)+Math.round(22*s)}})}
var H=1350,s=1,R,need;function tot(R,s){return R.reduce(function(a,r){return a+r.h},0)+Math.round(260*s)}
for(;;){R=rowsOf(s);need=tot(R,s);if(need<=H*.62||s<=.6)break;s-=.05}
if(need>H*.62)H=Math.min(1920,Math.ceil(need/.62));
var cv=document.createElement('canvas');cv.width=W;cv.height=H;var g=cv.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,W,H);
if(img){var iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,sc=Math.max(W/iw,H/ih);g.drawImage(img,(W-iw*sc)/2,(H-ih*sc)/2,iw*sc,ih*sc)}
var gt=g.createLinearGradient(0,0,0,340);gt.addColorStop(0,'rgba(0,0,0,.6)');gt.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gt;g.fillRect(0,0,W,340);
var y0=H-need-80,gb=g.createLinearGradient(0,y0,0,H);gb.addColorStop(0,'rgba(0,0,0,0)');gb.addColorStop(.25,'rgba(0,0,0,.6)');gb.addColorStop(1,'rgba(0,0,0,.88)');g.fillStyle=gb;g.fillRect(0,y0,W,H-y0);
g.shadowColor='rgba(0,0,0,.5)';g.shadowBlur=8;g.textBaseline='alphabetic';
g.fillStyle='rgba(255,255,255,.8)';g.font='700 30px '+CF;g.fillText(dateTag(p.performed_at),44,74);
g.fillStyle='#fff';g.font='italic 800 104px '+CF;g.fillText(p.title,40,170,820);g.shadowBlur=0;g.fillStyle=O;g.fillRect(44,188,72,8);
g.shadowBlur=8;g.fillStyle='rgba(255,255,255,.92)';g.font='700 34px '+CJ;g.fillText(p.title_ja||'',44,240);g.shadowBlur=0;
g.fillStyle='rgba(0,0,0,.4)';g.beginPath();g.roundRect?g.roundRect(W-212,40,172,62,12):g.rect(W-212,40,172,62);g.fill();g.fillStyle=O;g.font='italic 800 50px '+CF;g.textAlign='center';g.fillText('PUMP',W-126,88);g.textAlign='left';
var y=H-need+Math.round(20*s),st=(p.duration_ms?[['TIME',dur2(p.duration_ms)]]:[]).concat([['SETS',String(p.sets)],['EXERCISES',String(ex.length)]]),x=74;
g.fillStyle=O;g.fillRect(44,y-Math.round(4*s),Math.round(9*s),Math.round(150*s));
st.forEach(function(v){g.shadowBlur=8;g.fillStyle='#fff';g.font='700 '+Math.round(96*s)+'px '+CF;g.fillText(v[1],x,y+Math.round(84*s));var w=g.measureText(v[1]).width;g.shadowBlur=0;g.fillStyle=O;g.font='700 '+Math.round(26*s)+'px '+CF;g.fillText(v[0].split('').join(String.fromCharCode(8202)),x+2,y+Math.round(130*s));x+=Math.max(w,g.measureText(v[0]).width*1.3)+Math.round(60*s)});
y+=Math.round(190*s);
R.forEach(function(r){g.fillStyle='rgba(255,255,255,.16)';g.fillRect(44,y,W-88,2);var ly=y+Math.round(56*s),ti=topIdx(r.x.sets),many=(r.x.sets||[]).length>1;
g.shadowBlur=6;g.fillStyle=O;g.font='700 '+Math.round(28*s)+'px '+CF;g.fillText(('0'+(r.k+1)).slice(-2),44,ly);g.fillStyle='#fff';g.font='700 '+Math.round(38*s)+'px '+CJ;g.fillText(r.nm,44+Math.round(52*s),ly,560);
g.font='600 '+Math.round(42*s)+'px '+CF;g.textAlign='right';r.lines.forEach(function(L,li){var xr=W-44;for(var j=L.length-1;j>=0;j--){var i=L[j],t=r.x.sets[i];g.fillStyle=i===ti&&many?O:'#fff';g.font=(i===ti&&many?'800 ':'600 ')+Math.round(42*s)+'px '+CF;g.fillText(t,xr,ly+li*Math.round(54*s));xr-=g.measureText(t).width+Math.round(26*s)}});g.textAlign='left';g.shadowBlur=0;y+=r.h});
return cv}
function loadImg(u){return new Promise(function(res,rej){var im=new Image();im.crossOrigin='anonymous';im.onload=function(){res(im)};im.onerror=rej;im.src=u})}
async function savePost(p){try{var im=p.photo?await loadImg(p.photo):null,cv;
if(p.card&&im){cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;cv.getContext('2d').drawImage(im,0,0)}else cv=postImage(p,im);
W.showImage(cv,(p.title||'')+(p.title_ja?'（'+p.title_ja+'）':'')+'｜'+p.sets+'セット #筋トレ #筋トレ記録 #PUMPアプリ')}catch(e){toast('画像を作れなかった。もう一度ためしてね')}}
function postCard(p){var mine=p.user_id===me.id,liked=p.likes.indexOf(me.id)>=0,nl=p.likes.length,nc=p.comments,c=h('div',{class:'day post2'});
var hd=h('div',{class:'phd'},avatar(p.user_id,p.name)+"<button class='pn' type='button'>"+esc(p.name)+"</button><span class='fn'>"+ago(p.performed_at)+'</span>');
hd.querySelector('.pn').addEventListener('click',function(){profile(p.user_id,p.name)});
hd.appendChild(btn('…','pm',async function(){var v=await sheet({title:'この投稿',actions:mine?[['削除する','del',1]]:[['通報する','rep'],['ブロックする','blk',1]]});
if(v==='del'){await api.deletePost(p);c.remove();toast('削除したよ')}
else if(v==='rep'){var why=await sheet({title:'通報',body:'理由を書いてね。運営が24時間以内に確認するよ。',input:'理由',ok:'送る'});if(why){await api.report({post_id:p.id,target_user:p.user_id,reason:why.slice(0,500)});toast('通報したよ。ありがとう')}}
else if(v==='blk'){if(await sheet({title:p.name+' さんをブロック',body:'お互いの投稿が見えなくなり、友達も解除されるよ。',ok:'ブロック',danger:1})){await api.block(p.user_id);toast('ブロックしたよ');friends(root)}}}));
c.appendChild(hd);
if(p.caption)c.appendChild(h('div',{class:'pcap'},esc(p.caption)));
var ph=h('div',{class:'pph'});if(p.photo)ph.innerHTML="<img alt='' loading='lazy' src='"+esc(p.photo)+"'>";
// 写真の上にその日の記録を重ねる（タップで消して写真だけ見られる）。シェア画像そのものの投稿には重ねない
if(!p.card)ph.appendChild(overlay(p));
ph.appendChild(h('span',{class:'burst'},'♥'));c.appendChild(ph);
var acts=h('div',{class:'pact'}),lb=btn('','pl2',function(){toggleLike()}),cb=btn('','pl2',function(){openComments(true)});
function paint(){lb.innerHTML=(liked?"<b class='lk'>♥</b>":'♡')+' '+nl;lb.classList.toggle('on',liked);cb.innerHTML='💬 '+nc}
async function toggleLike(force){if(force&&liked)return;liked=!liked;nl+=liked?1:-1;paint();if(liked){lb.classList.remove('pop');void lb.offsetWidth;lb.classList.add('pop')}try{await api.like(p.id,liked)}catch(e){liked=!liked;nl+=liked?1:-1;paint()}}
// 1回タップ: メニューの表示/非表示、2回タップ: いいね
var lastTap=0,tapT=null;ph.addEventListener('click',function(){var n=Date.now();if(n-lastTap<350){clearTimeout(tapT);tapT=null;var b=ph.querySelector('.burst');b.classList.remove('go');void b.offsetWidth;b.classList.add('go');toggleLike(true);lastTap=0;return}
lastTap=n;tapT=setTimeout(function(){var o=ph.querySelector('.pov');if(o)o.classList.toggle('off')},360)});
paint();acts.appendChild(lb);acts.appendChild(cb);acts.appendChild(h('span',{class:'pst'},esc(p.title)+(p.duration_ms?' · ⏱'+W.hms(p.duration_ms):'')+' · '+p.sets+'セット'));acts.appendChild(btn('⤓ 保存','pl2 psv',function(){savePost(p)}));c.appendChild(acts);
var ex=h('details',{class:'pex'},"<summary>"+esc(p.title_ja||p.title)+'のメニュー（'+p.sets+'セット）</summary>'+(p.exercises||[]).map(function(x){return "<div class='ex'><div class='en'>"+esc(x.name)+(x.db?' <i>片手</i>':'')+"</div><div class='sets'>"+(x.sets||[]).map(function(s){return '<span>'+esc(s)+'</span>'}).join('')+'</div></div>'}).join(''));c.appendChild(ex);
var cm=h('div',{class:'pcm'}),list=h('div'),loaded=false;cm.appendChild(list);
var chips=h('div',{class:'qc'});QUICK.forEach(function(q){chips.appendChild(btn(q,'',function(){postComment(q)}))});cm.appendChild(chips);
var sts=h('div',{class:'qst'});Object.keys(STAMPS).forEach(function(k){var b=h('button',{type:'button','aria-label':STAMPS[k].t},stampSvg(k,44));b.addEventListener('click',function(){postComment(':stamp:'+k+':')});sts.appendChild(b)});cm.appendChild(sts);
var row=h('div',{class:'cin'}),ci=h('input',{class:'gs',placeholder:'コメントする…',maxlength:'300',enterkeyhint:'send'});row.appendChild(ci);row.appendChild(btn('送信','hb2',function(){postComment(ci.value)}));
ci.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.isComposing)postComment(ci.value)});cm.appendChild(row);c.appendChild(cm);
function line(x){learn(x.user_id,x.avatar);var sk=stampOf(x.body),d=h('div',{class:'cl'+(sk?' cls':'')},avatar(x.user_id,x.name,22)+"<b>"+esc(x.name)+'</b> '+(sk?stampSvg(sk,72):esc(x.body))+"<span class='fn'>"+ago(x.created_at)+'</span>');
if(x.user_id===me.id||mine)d.appendChild(btn('×','cx',async function(){if(await sheet({title:'コメントを消す？',ok:'消す',danger:1})){await api.deleteComment(x.id);d.remove();nc--;paint()}}));
else d.appendChild(btn('…','cx',async function(){var why=await sheet({title:'コメントを通報',body:'理由を書いてね。',input:'理由',ok:'送る'});if(why){await api.report({post_id:p.id,comment_id:x.id,target_user:x.user_id,reason:why.slice(0,500)});toast('通報したよ')}}));return d}
async function openComments(focus){if(!loaded){loaded=true;list.innerHTML='';(await api.comments(p.id)).forEach(function(x){list.appendChild(line(x))})}if(focus)ci.focus()}
async function postComment(t){t=(t||'').trim();if(!t)return;ci.value='';await openComments(false);var x={id:'tmp',user_id:me.id,name:me.display_name,body:t,created_at:new Date().toISOString()},d=line(x);list.appendChild(d);nc++;paint();
try{var r=await api.addComment(p.id,t);x.id=r.id}catch(e){d.remove();nc--;paint();toast('送れなかった')}}
if(nc)openComments(false);
return c}

async function profile(uid,name){var el=root;el.innerHTML='';var top=h('div',{class:'prof'});top.appendChild(btn('‹ もどる','hb2 sec',function(){friends(el)}));
top.appendChild(h('div',{class:'prh'},avatar(uid,name,64)+'<div><b>'+esc(name)+"</b><span class='fn' id='prs'>読み込み中…</span></div>"));el.appendChild(top);
var body=h('div');el.appendChild(body);await feedTab(body,uid);
var ws=weekStart(),mine=(await api.feed({user:uid,since:ws,noPhotos:true,limit:100})),all=body.querySelectorAll('.post2').length;
$('prs').textContent='投稿 '+all+'件 · 今週 '+mine.length+'回 · '+mine.reduce(function(a,p){return a+ +p.sets},0)+'セット'}

var rankPeriod='week';
function ymd(t){var d=new Date(t);return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
async function rankTab(body){if(rankPeriod==='month'&&api.monthDays)return monthTab(body);var ws=weekStart(),ps=await api.feed({since:ws,noPhotos:true,limit:500}),fr=await api.friendships(),by={};Object.keys(fr.avatars||{}).forEach(function(k){learn(k,fr.avatars[k])});ps.forEach(function(p){learn(p.user_id,p.avatar)});
function add(id,name){if(!by[id])by[id]={id:id,name:name,count:0,vol:0}}
add(me.id,me.display_name);fr.rows.filter(function(r){return r.status==='accepted'}).forEach(function(r){var o=r.requester===me.id?r.addressee:r.requester;add(o,fr.names[o]||'？')});
ps.forEach(function(p){add(p.user_id,p.name);by[p.user_id].count++;by[p.user_id].vol+=+p.volume_kg});
var list=Object.keys(by).map(function(k){return by[k]}).sort(function(a,b){return rankBy==='count'?(b.count-a.count||b.vol-a.vol):(b.vol-a.vol||b.count-a.count)});
var sp=await sponsors('ranking');body.innerHTML='';
var c=card('今週のランキング');c.appendChild(h('p',{class:'fn'},'月曜から今日までの、写真つき投稿の集計。'+(sp[0]?' presented by <b>'+esc(sp[0].name)+'</b>':'')));
var sw=h('div',{class:'tabs'});[['count','トレーニング回数'],['vol','総ボリューム']].forEach(function(x){sw.appendChild(btn(x[1],rankBy===x[0]?'on':'',function(){rankBy=x[0];rankTab(body)}))});c.appendChild(sw);c.insertBefore(periodTabs(body),c.firstChild.nextSibling);
list.forEach(function(r,i){var medal=['🥇','🥈','🥉'][i]||(i+1);c.appendChild(h('div',{class:'rk'+(r.id===me.id?' mine':'')},"<span class='rn2'>"+medal+'</span>'+avatar(r.id,r.name)+"<span class='rnm'>"+esc(r.name)+(r.id===me.id&&r.name!=='あなた'?'（あなた）':'')+"</span><b>"+(rankBy==='count'?r.count+'回':Math.round(r.vol).toLocaleString()+'kg')+'</b>'))});
if(list.length<2)c.appendChild(h('p',{class:'fn'},'友達を追加すると、ここで競い合えるよ。'));
body.appendChild(c)}

function periodTabs(body){var t=h('div',{class:'tabs rpt'});[['week','今週'],['month','今月のバトル👑']].forEach(function(x){if(x[0]==='month'&&!api.monthDays)return;t.appendChild(btn(x[1],rankPeriod===x[0]?'on':'',function(){rankPeriod=x[0];rankTab(body)}))});return t}
// 今月のバトル: 友達どうしで「今月トレーニングした日数」を競う。先月いちばん多かった人がチャンピオン👑
async function monthTab(body){var n=new Date(),a=new Date(n.getFullYear(),n.getMonth(),1),b=new Date(n.getFullYear(),n.getMonth()+1,1),pa=new Date(n.getFullYear(),n.getMonth()-1,1);
var r=await Promise.all([api.monthDays(ymd(pa),ymd(b)),api.friendships()]),rows=r[0],fr=r[1],by={},prev={};Object.keys(fr.avatars||{}).forEach(function(k){learn(k,fr.avatars[k])});
function add(id,name){if(!by[id])by[id]={id:id,name:name,days:0,sets:0}}
add(me.id,me.display_name);fr.rows.filter(function(x){return x.status==='accepted'}).forEach(function(x){var o=x.requester===me.id?x.addressee:x.requester;add(o,fr.names[o]||'？')});
rows.forEach(function(x){if(!by[x.user_id])return;if(x.day>=ymd(a)){by[x.user_id].days++;by[x.user_id].sets+=x.sets}else prev[x.user_id]=(prev[x.user_id]||0)+1});
var champ=Object.keys(prev).sort(function(p,q){return prev[q]-prev[p]})[0],list=Object.keys(by).map(function(k){return by[k]}).sort(function(p,q){return q.days-p.days||q.sets-p.sets});
var left=Math.round((b-new Date(n.getFullYear(),n.getMonth(),n.getDate()))/864e5);body.innerHTML='';
var c=card((n.getMonth()+1)+'月のバトル');c.appendChild(periodTabs(body));
c.appendChild(h('p',{class:'fn'},'今月トレーニングした日数で勝負（同じ日数ならセット数が多い方が上）。残り <b>'+left+'日</b>。月末にいちばん多かった人がチャンピオン👑'));
if(champ&&by[champ])c.appendChild(h('div',{class:'champ'},'👑 先月のチャンピオン: <b>'+esc(by[champ].name)+'</b>（'+prev[champ]+'日）'));
list.forEach(function(r,i){var medal=['🥇','🥈','🥉'][i]||(i+1);c.appendChild(h('div',{class:'rk'+(r.id===me.id?' mine':'')},"<span class='rn2'>"+medal+'</span>'+avatar(r.id,r.name)+"<span class='rnm'>"+esc(r.name)+(r.id===champ?' 👑':'')+(r.id===me.id&&r.name!=='あなた'?'（あなた）':'')+"</span><b>"+r.days+'日<small> '+r.sets+'セット</small></b>'))});
if(list.length<2)c.appendChild(h('p',{class:'fn'},'友達を追加すると、ここで競い合えるよ。'));body.appendChild(c)}

async function newsTab(body){var a=await api.activity(),fr=await api.friendships(),s=seen();body.innerHTML='';Object.keys(fr.avatars||{}).forEach(function(k){learn(k,fr.avatars[k])});
var inc=fr.rows.filter(function(r){return r.status==='pending'&&r.addressee===me.id});
if(inc.length){var ic=card('届いた友達申請');inc.forEach(function(r){var d=h('div',{class:'rk'},avatar(r.requester,fr.names[r.requester])+"<span class='rnm'>"+esc(fr.names[r.requester]||'？')+'</span>');d.appendChild(btn('承認','hb2',async function(){await api.accept(r);toast('友達になったよ');friends(root,'news')}));ic.appendChild(d)});body.appendChild(ic)}
var c=card('お知らせ');a.sort(function(x,y){return new Date(y.at)-new Date(x.at)});
if(!a.length)c.appendChild(h('p',{class:'fn'},'まだお知らせはないよ。投稿すると、いいねやコメントがここに届く。'));
a.forEach(function(x){learn(x.user_id,x.avatar);c.appendChild(h('div',{class:'nw'+(new Date(x.at).getTime()>s?' new':'')},avatar(x.user_id,x.name,30)+(x.type==='like'?"<i class='lk'>♥</i>":'<i>💬</i>')+'<span><b>'+esc(x.name||'')+'</b> が '+esc(x.title)+' の投稿に'+(x.type==='like'?'いいねしたよ':(stampOf(x.body)?'スタンプを送ったよ':'コメント:「'+esc(x.body)+'」'))+"<span class='fn'>"+ago(x.at)+'</span></span>'))});
body.appendChild(c);markSeen();refresh()}

async function friendsTab(body){var fr=await api.friendships(),rows=fr.rows,names=fr.names;body.innerHTML='';Object.keys(fr.avatars||{}).forEach(function(k){learn(k,fr.avatars[k])});
var mc=card('あなたのフレンドコード');mc.appendChild(h('div',{class:'fcode'},esc(me.friend_code)));
mc.appendChild(h('p',{class:'fn'},'このコードを友達に教えてね。表示名: <b>'+esc(me.display_name)+'</b>（アカウントで変更）'));
mc.appendChild(btn('招待リンクを送る','hb2',function(){var t='PUMPで友達になろう💪\n'+inviteUrl()+'\nフレンドコード: '+me.friend_code;if(navigator.share)navigator.share({text:t}).catch(function(){});else{try{navigator.clipboard.writeText(t).then(function(){toast('コピーしたよ')},function(){toast(t)})}catch(e){toast(t)}}}));body.appendChild(mc);
var ac=card('友達を追加'),ci=h('input',{class:'gs',placeholder:'フレンドコード（8文字）',autocapitalize:'characters',maxlength:'12'}),am=h('div',{class:'fn'});
ac.appendChild(ci);ac.appendChild(btn('申請する','hb2',async function(){var c=ci.value.trim();if(c.length<6)return note(am,'コードを入れてね。');var p=await api.findByCode(c);if(!p)return note(am,'見つからなかった。コードを確認してね。');
if(!await sheet({title:p.display_name+' さんに友達申請する？',ok:'申請する'}))return;try{await api.request(p.id);ci.value='';toast(p.display_name+' さんに申請したよ');friends(root,'friends')}catch(e){note(am,e&&e.code==='23505'?'もう申請済みか、友達だよ。':'申請できなかった。')}}));ac.appendChild(am);body.appendChild(ac);
function other(r){return r.requester===me.id?r.addressee:r.requester}
function row(r,actions){var d=h('div',{class:'rk'},avatar(other(r),names[other(r)])+"<span class='rnm'>"+esc(names[other(r)]||'？')+'</span>');actions.forEach(function(a){var b=btn(a[0],'hb2'+(a[2]?' sec':''),a[1]);d.appendChild(b)});return d}
var inc=rows.filter(function(r){return r.status==='pending'&&r.addressee===me.id}),out=rows.filter(function(r){return r.status==='pending'&&r.requester===me.id}),acc=rows.filter(function(r){return r.status==='accepted'});
if(inc.length){var ic=card('届いた申請');inc.forEach(function(r){ic.appendChild(row(r,[['承認',async function(){await api.accept(r);friends(root,'friends')}],['拒否',async function(){await api.unfriend(r);friends(root,'friends')},1]]))});body.appendChild(ic)}
if(out.length){var oc=card('承認待ち');out.forEach(function(r){oc.appendChild(row(r,[['取り消し',async function(){await api.unfriend(r);friends(root,'friends')},1]]))});body.appendChild(oc)}
var lc=card('友達（'+acc.length+'人）');if(!acc.length)lc.appendChild(h('p',{class:'fn'},'まだ友達はいないよ。フレンドコードを送ってみよう。'));
acc.forEach(function(r){var nm=names[other(r)]||'？';lc.appendChild(row(r,[['見る',function(){profile(other(r),nm)},1],['…',async function(){var v=await sheet({title:nm+' さん',actions:[['友達から外す','un'],['ブロックする','blk',1]]});
if(v==='un'){await api.unfriend(r);friends(root,'friends')}else if(v==='blk'){await api.block(other(r));toast('ブロックしたよ');friends(root,'friends')}},1]]))});body.appendChild(lc)}

// ---- バッジとホームの「友達の動き」 ----
function setBadge(n){var b=$('fb');if(b){b.hidden=!n;b.textContent=n}var nb=$('nb');if(nb){nb.hidden=!n;nb.textContent=n}}
function homeLine(html){var el=$('sf');if(!el)return;el.hidden=!html;el.innerHTML=html||''}
var refreshing=null;
function refresh(){if(!user||!me)return;if(refreshing)return;refreshing=Promise.all([api.activity(),api.pending(),api.feed({limit:8,noPhotos:true})]).then(function(r){var s=seen(),unread=r[0].filter(function(x){return new Date(x.at).getTime()>s}).length;setBadge(unread+r[1]);
var f=r[2].filter(function(p){return p.user_id!==me.id&&Date.now()-new Date(p.performed_at).getTime()<36*3600e3})[0];
homeLine(f?'🔥 <b>'+esc(f.name)+'</b> が '+esc(f.title)+' を投稿（'+ago(f.performed_at)+'）'+(unread?"<span class='badge'>"+unread+'</span>':''):(unread?'🔔 お知らせが '+unread+' 件あるよ':''))}).catch(function(){}).then(function(){refreshing=null})}
document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#sf')){tab='feed';W.go('friends')}});

// ---- 写真つき投稿（ひとことを添えて投稿） ----
function jpeg(img,max){var w=img.naturalWidth||img.width,hh=img.naturalHeight||img.height,s=Math.min(1,max/Math.max(w,hh)),c=document.createElement('canvas');c.width=Math.round(w*s);c.height=Math.round(hh*s);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return new Promise(function(res){c.toBlob(res,'image/jpeg',.8)})}
document.addEventListener('wk:photo',function(e){var d=e.detail,m=$('shm');if(!d||!d.id||!d.es||!d.es.length)return;var old=$('cmp');if(old)old.remove();
if(!user){if(m)m.textContent='ログインすると、この写真つきの記録を友達に共有できるよ（メニュー → 友達）。';return}
var box=h('div',{id:'cmp'}),cap=h('input',{class:'gs',maxlength:'200',placeholder:'ひとこと（例: ベンチ自己ベスト！）'}),b=btn('友達に投稿する','hb2',async function(){b.disabled=true;b.textContent='投稿中…';
try{var blob=await jpeg(d.img,1080),bn=W.byName(d.es),vol=0;d.es.forEach(function(x){vol+=W.vol(x)});var s=W.sessions.filter(function(x){return x.t0===d.id})[0];
await api.createPost({client_id:d.id,performed_at:new Date(d.id).toISOString(),title:W.titleOf(d.es),title_ja:W.titleJa(d.es),duration_ms:s?s.dur:W.sDur(d.es),sets:d.es.length,volume_kg:Math.round(vol),caption:cap.value.trim(),
exercises:bn.order.map(function(n){return{name:n,db:W.kind(n)==='db',sets:bn.by[n].map(W.setStr)}})},blob);
box.innerHTML="<p class='fn'>友達のフィードに投稿したよ ✅</p>";box.appendChild(btn('フィードを見る','hb2',function(){tab='feed';W.go('friends')}))}catch(err){b.disabled=false;b.textContent='友達に投稿する';if(m)m.textContent='投稿できなかった（通信を確認してね）。記録は端末に残ってるよ。'}});
box.appendChild(cap);box.appendChild(b);var sr=document.querySelector('#sc .sr');sr.parentNode.insertBefore(box,sr)});
document.addEventListener('click',function(e){if(e.target.id==='shc'){var c=$('cmp');if(c)c.remove()}});

// ---- クラウドバックアップ（トレーニング終了時に自動） ----
function backupNow(){if(!user||demo)return Promise.resolve();return api.backup(W.backupPayload())}
document.addEventListener('wk:done',function(){backupNow().catch(function(){})});

// ---- アカウントページ ----
async function account(el){el.innerHTML='';if(!user){signIn(el,function(){account(el)});return}if(!me)me=await api.me();
if(demo)el.appendChild(h('div',{class:'demo'},'デモ: アプリ版ではここでログイン・バックアップ・アカウント削除ができる。'));
learn(me.id,me.avatar_url);var pc=card('プロフィール'),nm=h('input',{class:'gs',maxlength:'30',value:me.display_name}),pm=h('div',{class:'fn'});
var ar=h('div',{class:'prh'},avatar(me.id,me.display_name,72)),fi=h('input',{type:'file',accept:'image/*',hidden:''});
ar.appendChild(btn('トプ画を変える','hb2',function(){fi.value='';fi.click()}));ar.appendChild(fi);pc.appendChild(ar);
fi.addEventListener('change',async function(){var f=fi.files&&fi.files[0];if(!f)return;note(pm,'アップロード中…');try{var url=await api.setAvatar(await squareJpeg(f,320));me.avatar_url=url;AV[me.id]=url;ar.firstChild.outerHTML=avatar(me.id,me.display_name,72);note(pm,'トプ画を変えたよ。');refresh()}catch(e){note(pm,'変えられなかった。別の写真で試してね。')}});
pc.appendChild(h('p',{class:'fn'},esc(user.email||'')));pc.appendChild(h('label',{class:'fn'},'表示名（友達に見える名前）'));pc.appendChild(nm);
pc.appendChild(btn('保存','hb2',async function(){var v=nm.value.trim();if(!v)return note(pm,'名前を入れてね。');try{await api.setName(v);me.display_name=v;note(pm,'保存したよ。')}catch(e){note(pm,'保存できなかった。')}}));pc.appendChild(pm);el.appendChild(pc);
if(demo)return;
var bc=card('クラウドバックアップ'),bm=h('div',{class:'fn'}),last=await api.backupInfo().catch(function(){return null});
bc.appendChild(h('p',{class:'fn'},'トレーニングを終えるたびに自動で保存。機種変更のときは、新しい端末でログインして「復元」。（写真は含まれない）<br>最終保存: '+(last?new Date(last.updated_at).toLocaleString('ja-JP'):'まだ')));
bc.appendChild(btn('今すぐ保存','hb2',function(){backupNow().then(function(){note(bm,'保存したよ。')},function(){note(bm,'保存できなかった。')})}));
bc.appendChild(btn('クラウドから復元','hb2',async function(){if(!await sheet({title:'クラウドの記録で、この端末の記録を置き換える？',ok:'置き換える',danger:1}))return;var r=await api.getBackup();if(!r)return note(bm,'クラウドに保存された記録がないよ。');note(bm,W.restore(r.payload)?'復元したよ。':'復元できなかった。')}));bc.appendChild(bm);el.appendChild(bc);
var oc=card('その他');
if(window.WK_NATIVE)oc.appendChild(btn('広告のプライバシー設定','hb2',function(){window.WK_NATIVE.privacyOptions().catch(function(){})}));
var l=cfg.legal||{};if(l.privacyUrl||l.termsUrl)oc.appendChild(h('p',{class:'fn'},legalLinks()));
oc.appendChild(btn('ログアウト','hb2',async function(){if(pushToken&&api.dropToken)await api.dropToken(pushToken).catch(function(){});await api.signOut();user=null;account(el)}));
oc.appendChild(btn('アカウントを削除','hb2 dng',async function(){if(!await sheet({title:'アカウントを削除する？',body:'投稿・コメント・友達・クラウド保存が全部消える。端末内の記録は残るよ。',ok:'削除する',danger:1}))return;
try{await api.deleteAccount();user=null;toast('アカウントを削除したよ');account(el)}catch(e){toast('削除できなかった。時間をおいてもう一度試してね')}}));el.appendChild(oc)}

// ---- Supabase との通信 ----
function supabaseApi(){var sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}),uid=null,urls={};
function pub(path){return path?sb.storage.from('avatars').getPublicUrl(path).data.publicUrl:''}
function who(x){return x.profiles||{}}
function must(r){if(r.error)throw r.error;return r.data}
function sign(paths){paths=paths.filter(function(p){return p&&!urls[p]});if(!paths.length)return Promise.resolve();return sb.storage.from('posts').createSignedUrls(paths,3600).then(function(r){(r.data||[]).forEach(function(x){if(x.signedUrl)urls[x.path]=x.signedUrl})})}
function post(p){return{id:p.id,user_id:p.user_id,name:p.profiles?p.profiles.display_name:'',avatar:pub(who(p).avatar_path),performed_at:p.performed_at,title:p.title,title_ja:p.title_ja,duration_ms:p.duration_ms,sets:p.sets,volume_kg:p.volume_kg,exercises:p.exercises||[],caption:p.caption||'',photo_path:p.photo_path,photo:urls[p.photo_path]||'',likes:(p.likes||[]).map(function(l){return l.user_id}),comments:p.comments&&p.comments[0]?p.comments[0].count:0}}
return{
onAuth:function(cb){sb.auth.onAuthStateChange(function(ev,s){uid=s?s.user.id:null;cb(s?s.user:null)})},
sendCode:function(e){return sb.auth.signInWithOtp({email:e,options:{shouldCreateUser:true}}).then(must)},
verify:function(e,t){return sb.auth.verifyOtp({email:e,token:t,type:'email'}).then(function(r){var d=must(r);uid=d.user.id;return d.user})},
passwordLogin:function(e,p){return sb.auth.signInWithPassword({email:e,password:p}).then(function(r){var d=must(r);uid=d.user.id;return d.user})},
signOut:function(){return sb.auth.signOut()},
saveToken:function(t,pf){return sb.rpc('save_device_token',{t:t,p:pf}).then(must)},
dropToken:function(t){return sb.from('device_tokens').delete().eq('token',t).then(must)},
logError:function(o){return sb.from('error_logs').insert(o).then(must)},
live:function(on,t0){if(!on)return sb.from('presence').delete().eq('user_id',uid).then(must);var r={user_id:uid,updated_at:new Date().toISOString()};if(t0)r.started_at=new Date(t0).toISOString();return sb.from('presence').upsert(r).then(must)},
liveFriends:function(){return sb.from('presence').select('user_id,started_at,profiles(display_name,avatar_path)').neq('user_id',uid).gte('updated_at',new Date(Date.now()-20*6e4).toISOString()).order('started_at',{ascending:false}).then(function(r){return must(r).map(function(x){return{user_id:x.user_id,started_at:x.started_at,name:who(x).display_name||'',avatar:pub(who(x).avatar_path)}})})},
saveDays:function(rows){return sb.from('workout_days').upsert(rows.map(function(x){return{user_id:uid,day:x.day,sets:Math.min(1000,x.sets),updated_at:new Date().toISOString()}})).then(must)},
monthDays:function(since,until){return sb.from('workout_days').select('user_id,day,sets').gte('day',since).lt('day',until).limit(5000).then(must)},
achieve:function(name,value,id){var q=id?sb.from('achievements').update({value:value,created_at:new Date().toISOString()}).eq('id',id):sb.from('achievements').insert({user_id:uid,exercise:String(name).slice(0,40),value:String(value).slice(0,30)});
return q.select('id').maybeSingle().then(function(r){var d=must(r);if(!d&&id)return api.achieve(name,value);return d&&d.id})},
achievements:function(o){var q=sb.from('achievements').select('id,user_id,exercise,value,created_at,profiles!achievements_user_id_fkey(display_name,avatar_path),cheers(user_id)').gte('created_at',new Date(o.since).toISOString()).order('created_at',{ascending:false}).limit(30);if(o.user)q=q.eq('user_id',o.user);
return q.then(function(r){return must(r).map(function(a){return{id:a.id,user_id:a.user_id,exercise:a.exercise,value:a.value,created_at:a.created_at,name:who(a).display_name||'',avatar:pub(who(a).avatar_path),cheers:(a.cheers||[]).map(function(c){return c.user_id})}})})},
cheer:function(id,on){return(on?sb.from('cheers').insert({achievement_id:id,user_id:uid}):sb.from('cheers').delete().eq('achievement_id',id).eq('user_id',uid)).then(function(r){if(r.error&&r.error.code!=='23505')throw r.error})},
me:function(){return sb.from('profiles').select('*').eq('id',uid).single().then(function(r){var m=must(r);m.avatar_url=pub(m.avatar_path);return m})},
setAvatar:async function(blob){var old=must(await sb.from('profiles').select('avatar_path').eq('id',uid).single()).avatar_path,path=uid+'/'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)+'.jpg';
var up=await sb.storage.from('avatars').upload(path,blob,{contentType:'image/jpeg'});if(up.error)throw up.error;must(await sb.from('profiles').update({avatar_path:path}).eq('id',uid));if(old)sb.storage.from('avatars').remove([old]);return pub(path)},
setName:function(n){return sb.from('profiles').update({display_name:n}).eq('id',uid).then(must)},
friendships:async function(){var rows=must(await sb.from('friendships').select('requester,addressee,status,created_at')),ids=rows.map(function(r){return r.requester===uid?r.addressee:r.requester}),names={},avatars={};
if(ids.length)must(await sb.from('profiles').select('id,display_name,avatar_path').in('id',ids)).forEach(function(p){names[p.id]=p.display_name;avatars[p.id]=pub(p.avatar_path)});return{rows:rows,names:names,avatars:avatars}},
findByCode:function(c){return sb.rpc('find_by_code',{code:c}).then(function(r){return must(r)[0]||null})},
request:function(id){return sb.from('friendships').insert({requester:uid,addressee:id}).then(must)},
accept:function(r){return sb.from('friendships').update({status:'accepted'}).eq('requester',r.requester).eq('addressee',r.addressee).then(must)},
unfriend:function(r){return sb.from('friendships').delete().eq('requester',r.requester).eq('addressee',r.addressee).then(must)},
block:function(id){return sb.rpc('block_user',{target:id}).then(must)},
feed:async function(o){o=o||{};var q=sb.from('posts').select('*, profiles!posts_user_id_fkey(display_name,avatar_path), likes(user_id), comments(count)').order('performed_at',{ascending:false}).limit(o.limit||30);
if(o.user)q=q.eq('user_id',o.user);if(o.since)q=q.gte('performed_at',new Date(o.since).toISOString());var ps=must(await q);if(!o.noPhotos)await sign(ps.map(function(p){return p.photo_path}));return ps.map(post)},
like:function(id,on){return(on?sb.from('likes').insert({post_id:id,user_id:uid}):sb.from('likes').delete().eq('post_id',id).eq('user_id',uid)).then(function(r){if(r.error&&r.error.code!=='23505')throw r.error})},
comments:function(id){return sb.from('comments').select('id,user_id,body,created_at,profiles(display_name,avatar_path)').eq('post_id',id).order('created_at').then(function(r){return must(r).map(function(c){return{id:c.id,user_id:c.user_id,name:who(c).display_name||'',avatar:pub(who(c).avatar_path),body:c.body,created_at:c.created_at}})})},
addComment:function(id,body){return sb.from('comments').insert({post_id:id,user_id:uid,body:body}).select('id').single().then(must)},
deleteComment:function(id){return sb.from('comments').delete().eq('id',id).then(must)},
createPost:async function(f,blob){var path=uid+'/'+f.client_id+'.jpg',up=await sb.storage.from('posts').upload(path,blob,{contentType:'image/jpeg',upsert:true});if(up.error)throw up.error;
var r=await sb.from('posts').insert(Object.assign({user_id:uid,photo_path:path},f));if(r.error&&r.error.code!=='23505')throw r.error},
deletePost:async function(p){await sb.storage.from('posts').remove([p.photo_path]);must(await sb.from('posts').delete().eq('id',p.id))},
report:function(o){return sb.from('reports').insert(Object.assign({reporter:uid},o)).then(must)},
activity:async function(){var lk=must(await sb.from('likes').select('user_id,created_at,posts!inner(title,user_id),profiles(display_name,avatar_path)').eq('posts.user_id',uid).neq('user_id',uid).order('created_at',{ascending:false}).limit(30)),
cm=must(await sb.from('comments').select('user_id,body,created_at,posts!inner(title,user_id),profiles(display_name,avatar_path)').eq('posts.user_id',uid).neq('user_id',uid).order('created_at',{ascending:false}).limit(30));
return lk.map(function(x){return{type:'like',user_id:x.user_id,name:who(x).display_name,avatar:pub(who(x).avatar_path),title:x.posts.title,at:x.created_at}}).concat(cm.map(function(x){return{type:'comment',user_id:x.user_id,name:who(x).display_name,avatar:pub(who(x).avatar_path),title:x.posts.title,body:x.body,at:x.created_at}}))},
pending:function(){return sb.from('friendships').select('requester',{count:'exact',head:true}).eq('addressee',uid).eq('status','pending').then(function(r){return r.count||0})},
sponsors:function(){return sb.from('sponsors').select('name,title,body,image_url,link_url,placement').then(function(r){return r.data||[]})},
backup:function(p){return sb.from('backups').upsert({user_id:uid,payload:p,updated_at:new Date().toISOString()}).then(must)},
backupInfo:function(){return sb.from('backups').select('updated_at').eq('user_id',uid).maybeSingle().then(must)},
getBackup:function(){return sb.from('backups').select('payload').eq('user_id',uid).maybeSingle().then(must)},
deleteAccount:async function(){for(var b of ['posts','avatars']){var ls=await sb.storage.from(b).list(uid,{limit:1000});if(ls.data&&ls.data.length)await sb.storage.from(b).remove(ls.data.map(function(f){return uid+'/'+f.name}))}must(await sb.rpc('delete_account'));await sb.auth.signOut()}
}}

setInterval(function(){if(document.visibilityState!=='hidden')refresh()},60000);
// ---- 今トレーニング中（始めたら入れ、記録や5分ごとに更新、終わったら消す） ----
var liveT=0;
function liveBeat(force){var se=W.session&&W.session();if(!user||!api.live||!se)return;var n=Date.now();if(!force&&n-liveT<120000)return;liveT=n;api.live(true,force?se.t0:0).catch(function(){})}
document.addEventListener('wk:start',function(){liveBeat(true)});
document.addEventListener('wk:end',function(){liveT=0;if(user&&api.live)api.live(false).catch(function(){})});
setInterval(function(){if(document.visibilityState!=='hidden')liveBeat()},300000);
// トレーニングした日とその日のセット数（月間バトル用）
function dayRows(since){var c={};(W.data||[]).forEach(function(e){if(e.t>=since){var k=ymd(e.t);c[k]=(c[k]||0)+1}});return Object.keys(c).map(function(k){return{day:k,sets:c[k]}})}
function syncDays(since){if(!user||!api.saveDays)return;var r=dayRows(since);if(r.length)api.saveDays(r).catch(function(){})}
// 自己ベストのお知らせ: 同じ日・同じ種目でまた更新したら書き換える
var ACH='pump-ach-v1';
document.addEventListener('wk:record',function(e){var d=e.detail||{};if(!user)return;liveBeat();var t0=new Date();t0.setHours(0,0,0,0);syncDays(t0.getTime());
if(!d.pr||!api.achieve)return;var map={},key=ymd(Date.now())+'|'+d.name;try{map=JSON.parse(localStorage.getItem(ACH)||'{}')}catch(_){}
api.achieve(d.name,d.value,map[key]).then(function(id){if(!id)return;Object.keys(map).forEach(function(k){if(k.slice(0,10)<ymd(Date.now()-7*864e5))delete map[k]});map[key]=id;try{localStorage.setItem(ACH,JSON.stringify(map))}catch(_){}}).catch(function(){})});

// ---- ログインしたあと: プッシュ通知の登録と、ログイン前に開いた招待リンク ----
var pushToken=null,INV='pump-invite';
function afterLogin(){var N=window.WK_NATIVE,n=new Date();liveBeat(true);syncDays(new Date(n.getFullYear(),n.getMonth()-1,1).getTime());
if(N&&N.pushRegister&&api.saveToken)N.pushRegister(function(t,pf){pushToken=t;api.saveToken(t,pf).catch(function(){})});
var c=null;try{c=localStorage.getItem(INV);localStorage.removeItem(INV)}catch(e){}if(!c&&N&&N.takeInvite)c=N.takeInvite();if(c)invite(c)}

// ---- 招待リンク ----
// 送る: 公開ページ（pump-videos の i.html）に名前とコードをつけたリンク。開くとアプリ（pump://invite?c=…）かストアに案内される
function inviteUrl(){return (cfg.inviteUrl||'https://taiyo505-prog.github.io/pump-videos/i.html')+'?c='+encodeURIComponent(me.friend_code)+'&n='+encodeURIComponent(me.display_name||'')}
// 受け取る: ログインしていなければ覚えておいて、ログインしたら申請する
async function invite(code){code=String(code||'').toUpperCase();if(!/^[A-Z0-9]{4,16}$/.test(code))return;
// アプリを開いた直前はログイン状態の読み込み中なので、終わるまで待つ（最大3秒）
await Promise.race([authReady,new Promise(function(r){setTimeout(r,3000)})]);
if(!user){try{localStorage.setItem(INV,code)}catch(e){}W.go('friends');toast('ログインすると、招待してくれた人に友達申請できるよ');return}
if(!me)me=await api.me();if(code===me.friend_code)return;var p=await api.findByCode(code).catch(function(){return null});
W.go('friends');if(!p){toast('招待のコードが見つからなかった');return}
if(await sheet({title:p.display_name+' さんから招待が届いてるよ',body:'友達申請する？承認されたら、お互いの投稿が見られるようになるよ。',ok:'申請する'})){
try{await api.request(p.id);toast(p.display_name+' さんに申請したよ')}catch(e){toast(e&&e.code==='23505'?'もう申請済みか、友達だよ':'申請できなかった')}}
friends($('fl'),'friends')}
// Web 版で ?invite=コード 付きで開いたとき
(function(){var m=/[?&]invite=([A-Za-z0-9]{4,16})/.exec(location.search);if(m)setTimeout(function(){invite(m[1])},800)})();

// ---- ログインのおすすめ: 3日トレーニングしてもログインしていない人に、トレーニング終わりに1回だけ ----
var NUDGE='pump-login-nudge';
document.addEventListener('wk:done',function(){if(user||demo)return;try{if(localStorage.getItem(NUDGE))return}catch(e){return}
var days={};(W.data||[]).forEach(function(x){days[W.dkey(x.t)]=1});if(Object.keys(days).length<3)return;try{localStorage.setItem(NUDGE,'1')}catch(e){}
setTimeout(async function(){if(await sheet({title:'記録を守ろう 🔒',body:'ログインしておくと、機種変更やアプリを消したときも記録が消えないよ。友達と記録を見せ合うこともできる。メールアドレスだけで、パスワードはいらないよ。',ok:'ログインする'}))W.go('account')},900)});

// ---- エラーの見張り ----
// 画面で起きたエラーの文と場所だけを Supabase の error_logs に送る（記録の中身は送らない）。1回の起動で5件まで、同じエラーは1回だけ
var errSent={},errN=0;
function reportError(msg,stack){if(demo||!api.logError||errN>=5||!msg||/^Script error\.?$/.test(msg))return;var key=String(msg).slice(0,300);if(errSent[key])return;errSent[key]=1;errN++;
var pg=document.querySelector('.pg.on'),C=window.Capacitor;
api.logError({message:key,stack:String(stack||'').slice(0,2000),page:pg?pg.id:'chat',platform:C&&C.getPlatform?C.getPlatform():'web',version:String(cfg.version||'').slice(0,20),user_id:user?user.id:null}).catch(function(){})}
window.addEventListener('error',function(e){reportError(e.message,e.error&&e.error.stack)});
window.addEventListener('unhandledrejection',function(e){var r=e.reason||{};reportError(r.message||String(r),r.stack)});

window.WK_CLOUD={enabled:true,demo:demo,loggedIn:function(){return !!user},friends:friends,account:account,backupNow:backupNow,refresh:refresh,invite:invite,
open:function(t){friends($('fl'),t)}};
})();
