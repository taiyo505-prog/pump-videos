const C='pump-v4';
const A=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// 画面（HTML）はネット優先にして更新がすぐ届くようにする。それ以外はキャッシュ優先。
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const put=res=>{const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));return res};
if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(put).catch(()=>caches.match(e.request).then(r=>r||caches.match('index.html'))));return}
e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(put).catch(()=>caches.match('index.html'))))});
