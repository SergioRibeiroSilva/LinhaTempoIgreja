/* Service worker: permite usar o site sem internet.
   - Páginas, estilos, scripts e dados: busca na rede primeiro (para ver atualizações)
     e usa a cópia guardada quando estiver offline.
   - Imagens e fontes: usa a cópia guardada; se não houver, busca e guarda.
   Ao mudar arquivos de forma importante, aumente o número da VERSAO. */
const VERSAO = 'hdi-v3';
const NUCLEO = [
  './',
  'index.html',
  'css/estilo.css',
  'js/app.js',
  'data/eventos.json',
  'manifest.webmanifest',
  'img/icone-192.png',
  'img/icone-512.png',
  'img/icone-180.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil((async () => {
    const cache = await caches.open(VERSAO);
    await cache.addAll(NUCLEO.map((u) => new Request(u, { cache: 'no-cache' })));
    // guarda também as imagens dos cartões (versão de 640 px), lidas do próprio arquivo de dados
    try {
      const dados = await (await fetch('data/eventos.json', { cache: 'no-store' })).json();
      const imagens = dados.eventos.filter((e) => e.imagem).map((e) => e.imagem.replace(/\.webp$/, '-640.webp'));
      await cache.addAll(imagens);
    } catch { /* se falhar, as imagens são guardadas conforme forem vistas */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil((async () => {
    for (const nome of await caches.keys()) if (nome !== VERSAO) await caches.delete(nome);
    await self.clients.claim();
  })());
});

async function redePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  try {
    // 'no-cache' faz o navegador confirmar com o servidor se o arquivo mudou
    // (sem isso, ele pode reaproveitar uma cópia antiga e as correções demoram a aparecer)
    const novo = req.mode === 'navigate'
      ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      : new Request(req, { cache: 'no-cache' });
    const resp = await fetch(novo);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch {
    // offline: tenta a cópia exata e, para páginas, a página inicial (ignorando ?roteiro=...)
    return (await cache.match(req, { ignoreSearch: true }))
      || (req.mode === 'navigate' ? await cache.match('index.html') : undefined)
      || Response.error();
  }
}

async function cachePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  const guardada = await cache.match(req);
  if (guardada) return guardada;
  try {
    const resp = await fetch(req);
    if (resp.ok || resp.type === 'opaque') cache.put(req, resp.clone());
    return resp;
  } catch {
    // offline e sem a imagem grande guardada: usa a versão de 640 px, que é guardada na instalação
    const url = new URL(req.url);
    if (/\.webp$/.test(url.pathname) && !/-640\.webp$/.test(url.pathname)) {
      const pequena = await cache.match(url.pathname.replace(/\.webp$/, '-640.webp'));
      if (pequena) return pequena;
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonte = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonte) return;
  const imagem = req.destination === 'image' || /\.(webp|png|jpg|jpeg|svg)$/i.test(url.pathname);
  ev.respondWith(fonte || imagem ? cachePrimeiro(req) : redePrimeiro(req));
});
