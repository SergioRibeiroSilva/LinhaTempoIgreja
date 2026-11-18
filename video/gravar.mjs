// Grava o vídeo tutorial: abre o site num celular simulado (1080x1920), executa as cenas
// do roteiro com legendas e marcas de toque, e salva os quadros e a lista de sons.
//
// Uso (na pasta video/):  node gravar.mjs [endereço]
//   padrão: https://sergioribeirosilva.github.io/LinhaTempoIgreja/
// Saída: saida/quadros/*.jpg, saida/quadros.json (tempo de cada quadro) e saida/eventos.json (sons)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const SITE = process.argv[2] || 'https://sergioribeirosilva.github.io/LinhaTempoIgreja/';
const SAIDA = path.join(aqui, 'saida');
const QUADROS = path.join(SAIDA, 'quadros');
fs.rmSync(QUADROS, { recursive: true, force: true });
fs.mkdirSync(QUADROS, { recursive: true });

// Celular de 360x640 pontos com densidade 3 = quadros de 1080x1920
// --force-device-scale-factor=3 faz a gravação contínua sair em 1080x1920 (sem ele, sai em 360x640)
const navegador = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-device-scale-factor=3'] });
const contexto = await navegador.newContext({
  viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  locale: 'pt-BR', colorScheme: 'light',
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
});
const page = await contexto.newPage();
await page.goto(SITE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// pré-carrega todas as imagens dos cartões, para não aparecerem em branco durante as viagens pela trilha
await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
await page.waitForFunction(() => [...document.querySelectorAll('.arte img')].every((i) => i.complete), null, { timeout: 30000 });

// ---------- camada do vídeo (legendas, toques e tela final), por cima do site ----------
await page.addStyleTag({ content: `
  #video-camada { position: fixed; inset: 0; z-index: 9999; pointer-events: none; font-family: Inter, system-ui, sans-serif; }
  #video-legenda {
    position: absolute; left: 50%; top: 112px; width: max-content; max-width: 316px;
    transform: translate(-50%, -8px); opacity: 0; transition: opacity .35s ease, transform .35s ease;
    padding: 11px 18px; border-radius: 16px; text-align: center;
    /* verde-floresta escuro com filete dourado: destaca a legenda das cores do app */
    background: #16463a; color: #fff; font-size: 16.5px; font-weight: 600; line-height: 1.35;
    border: 1.5px solid #d9b05a; box-shadow: 0 10px 28px rgba(0, 0, 0, .3);
  }
  #video-legenda.visivel { opacity: 1; transform: translate(-50%, 0); }
  #video-legenda.alto { top: 24px; }
  .video-toque {
    position: absolute; width: 50px; height: 50px; margin: -25px 0 0 -25px; border-radius: 50%;
    background: rgba(255, 255, 255, .45); border: 3px solid rgba(43, 38, 32, .55);
    box-shadow: 0 0 0 6px rgba(255, 255, 255, .35), 0 6px 18px rgba(0, 0, 0, .25);
    animation: video-toque .65s ease-out forwards;
  }
  @keyframes video-toque { 0% { transform: scale(.55); opacity: 1; } 70% { opacity: .9; } 100% { transform: scale(1.35); opacity: 0; } }
  .video-dedo {
    position: absolute; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
    background: rgba(255, 255, 255, .5); border: 3px solid rgba(43, 38, 32, .5); box-shadow: 0 6px 18px rgba(0, 0, 0, .25);
    transition: left .45s cubic-bezier(.3, .7, .3, 1), opacity .2s ease;
  }
  #video-inicio {
    position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
    text-align: center; color: #f4ecdc; transition: opacity .7s ease;
    background: radial-gradient(ellipse 90% 55% at 50% 45%, #4a3a22, #211d18 72%);
  }
  #video-inicio.saindo { opacity: 0; }
  #video-inicio > * { animation: video-surge .9s cubic-bezier(.2, .8, .2, 1) both; }
  #video-inicio > :nth-child(2) { animation-delay: .15s; }
  #video-inicio > :nth-child(3) { animation-delay: .3s; }
  #video-inicio > :nth-child(4) { animation-delay: .45s; }
  #video-inicio > :nth-child(5) { animation-delay: .7s; }
  @keyframes video-surge { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  #video-inicio img { width: 76px; height: 76px; border-radius: 18px; box-shadow: 0 0 0 1.5px rgba(217, 176, 90, .5), 0 10px 28px rgba(0, 0, 0, .4); }
  #video-inicio .sobre { font-family: Cinzel, serif; color: #d9b05a; letter-spacing: .38em; font-size: 13px; margin-top: 6px; }
  #video-inicio h1 { font-family: Cinzel, serif; font-size: 31px; line-height: 1.12; margin: 0; padding: 0 24px; }
  #video-inicio .ornamento { display: flex; align-items: center; gap: 12px; width: 190px; color: #d9b05a; font-size: 12px; }
  #video-inicio .ornamento::before, #video-inicio .ornamento::after { content: ""; flex: 1; height: 1px; background: rgba(217, 176, 90, .6); }
  #video-inicio .como { font-size: 21px; font-weight: 600; letter-spacing: .02em; color: #f4ecdc; }
  #video-final {
    position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    text-align: center; color: #2b2620; opacity: 0; transition: opacity .7s ease;
    background: radial-gradient(ellipse 90% 60% at 50% 40%, #f6ecd6, #f4ecdc 70%);
  }
  #video-final.visivel { opacity: 1; }
  #video-final img.icone { width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 6px 18px rgba(0,0,0,.2); }
  #video-final .sobre { font-family: Cinzel, serif; color: #a87b22; letter-spacing: .4em; font-size: 13px; }
  #video-final h2 { font-family: Cinzel, serif; font-size: 30px; line-height: 1.1; margin: 2px 0 0; }
  #video-final .qr { width: 170px; height: 170px; padding: 6px; background: #fff; border-radius: 12px; box-shadow: 0 0 0 1.5px #d6c7a6; }
  #video-final .frase { font-size: 19px; font-weight: 600; }
  #video-final .url { font-size: 12.5px; color: #6b6156; }
` });
await page.evaluate(() => {
  const c = document.createElement('div');
  c.id = 'video-camada';
  c.innerHTML = `<div id="video-legenda"></div>
    <div id="video-inicio">
      <img src="img/icone-192.png" alt="">
      <div class="sobre">APLICATIVO</div>
      <h1>Breve História da Igreja</h1>
      <div class="ornamento">✦</div>
      <div class="como">Como utilizar</div>
    </div>
    <div id="video-final">
      <img class="icone" src="img/icone-192.png" alt="">
      <div><div class="sobre">BREVE</div><h2>História da Igreja</h2></div>
      <img class="qr" src="qrcodes/site.svg" alt="">
      <div class="frase">Acesse, instale e compartilhe!</div>
      <div class="url">sergioribeirosilva.github.io/LinhaTempoIgreja</div>
    </div>`;
  document.body.appendChild(c);
});
await page.waitForFunction(() => [...document.querySelectorAll('#video-final img')].every((i) => i.complete && i.naturalWidth));

// ---------- gravação dos quadros ----------
const cdp = await contexto.newCDPSession(page);
const quadros = [];
let n = 0;
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const nome = `q${String(++n).padStart(5, '0')}.jpg`;
  fs.writeFileSync(path.join(QUADROS, nome), Buffer.from(data, 'base64'));
  quadros.push({ nome, t: metadata.timestamp });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* gravação encerrada */ }
});
// recria a tela inicial para que as animações dela comecem junto com a gravação
await page.evaluate(() => { const i = document.getElementById('video-inicio'); i.replaceWith(i.cloneNode(true)); });
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });

const t0 = Date.now() / 1000;
const agora = () => Date.now() / 1000 - t0;
// As cenas usam os tempos do roteiro (0 = primeira cena do app); a tela inicial vem antes e empurra tudo
const INICIO = 3.2;             // duração da tela inicial "Como utilizar"
const FIM = 36.8 + INICIO;      // fim do vídeo
const ate = async (t) => { const falta = t + INICIO - agora(); if (falta > 0) await page.waitForTimeout(falta * 1000); };
const eventos = [];
const som = (tipo) => eventos.push({ tipo, t: Date.now() / 1000 });

async function legenda(texto, alto = false) {
  await page.evaluate(([tx, a]) => {
    const l = document.getElementById('video-legenda');
    l.classList.remove('visivel');
    setTimeout(() => { l.textContent = tx; l.classList.toggle('alto', a); if (tx) l.classList.add('visivel'); }, tx ? 180 : 0);
  }, [texto, alto]);
}

async function centro(seletor) {
  const caixa = await page.locator(seletor).first().boundingBox();
  if (!caixa) throw new Error('elemento não encontrado: ' + seletor);
  return { x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 };
}

async function tocar(seletor, ajuste = {}) {
  const c = await centro(seletor);
  const x = c.x + (ajuste.dx || 0);
  const y = c.y + (ajuste.dy || 0);
  await page.evaluate(([px, py]) => {
    const r = document.createElement('div');
    r.className = 'video-toque';
    r.style.left = px + 'px';
    r.style.top = py + 'px';
    document.getElementById('video-camada').appendChild(r);
    setTimeout(() => r.remove(), 700);
  }, [x, y]);
  som('clique');
  await page.waitForTimeout(90);
  await page.touchscreen.tap(x, y);
}

// "Deslizar": um dedo atravessa a tela da direita para a esquerda e a linha do tempo avança
async function deslizar() {
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.className = 'video-dedo';
    d.style.left = '285px';
    d.style.top = '400px';
    document.getElementById('video-camada').appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { d.style.left = '75px'; }));
    setTimeout(() => { d.style.opacity = '0'; }, 430);
    setTimeout(() => d.remove(), 700);
  });
  som('deslizar');
  await page.waitForTimeout(120);
  await page.evaluate(() => document.getElementById('btnProximo').click());
}

// ---------- cenas (tempos em segundos, conforme video/roteiro.md) ----------
// 0. tela inicial: "Aplicativo Breve História da Igreja · Como utilizar"
await page.waitForTimeout(150);
som('entrada');
await page.waitForTimeout((INICIO - 0.75) * 1000);
await page.evaluate(() => {
  document.getElementById('video-inicio').classList.add('saindo');
  document.getElementById('btnInicio').click();   // reinicia as animações da abertura do app por baixo
});
som('transicao');

await ate(0.1);
await legenda('Breve História da Igreja: dois mil anos de fé no seu celular.', true);   // 1. abertura

await ate(3.5);
await legenda('Toque em Começar a jornada.', true);                                       // 2. começar
await ate(4.4);
await tocar('#btnComecar');

await ate(6.5);
await legenda('Deslize para viajar no tempo.');                                           // 3. deslizar
for (const t of [7.3, 8.8, 10.3]) { await ate(t); await deslizar(); }

await ate(11.6);
await legenda('Toque numa época para ir direto a ela.');                                  // 4. épocas
await ate(12.3);
await tocar('.epoca-btn[data-epoca="moderna"]');

await ate(14.6);
await legenda('Toque num cartão para ler a história completa.');                          // 5. painel
await page.evaluate(() => {   // a trilha corre até a Reforma Protestante
  const p = [...document.querySelectorAll('.parada')].find((x) => x.querySelector('.titulo')?.textContent === 'Reforma Protestante');
  const t = document.getElementById('trilha');
  t.scrollTo({ left: p.offsetLeft + p.offsetWidth / 2 - t.clientWidth / 2, behavior: 'smooth' });
});
som('deslizar');
await ate(16.1);
await tocar('.parada.ativa .cartao', { dy: -40 });
await ate(17.4);
await page.evaluate(() => document.getElementById('painelConteudo').scrollTo({ top: 260, behavior: 'smooth' }));

await ate(19.4);
await legenda('Busque eventos, pessoas ou anos.', true);                                  // 6. busca
await tocar('#painelFechar');
await ate(20.3);
await tocar('#btnRoteiros');
await ate(21.0);
await tocar('#campoBusca');
await ate(21.4);
for (const letra of 'Lutero') { som('tecla'); await page.keyboard.type(letra); await page.waitForTimeout(115); }

await ate(24.4);
await legenda('Ou siga um roteiro de aula pronto.', true);                                // 7. roteiro
for (let i = 0; i < 6; i++) { som('tecla'); await page.keyboard.press('Backspace'); await page.waitForTimeout(45); }
await page.waitForTimeout(250);
await page.evaluate(() => document.querySelector('.rot-btn[data-roteiro="reforma"]').scrollIntoView({ behavior: 'smooth', block: 'center' }));
await ate(26.4);
await tocar('.rot-btn[data-roteiro="reforma"]');

await ate(28.5);
await legenda('Na sala de aula, toque em Apresentar.', true);                             // 8. apresentar
await ate(29.2);
await tocar('#btnApresentar');
await ate(30.8);
await tocar('#btnProximo');

await ate(32.6);
await legenda('');                                                                        // 9. final
som('final');
await page.evaluate(() => document.getElementById('video-final').classList.add('visivel'));
await ate(36.8);   // = FIM no relógio do vídeo

await cdp.send('Page.stopScreencast');
await page.waitForTimeout(300);
await navegador.close();

// ---------- grava os tempos ----------
const inicio = quadros[0].t;
fs.writeFileSync(path.join(SAIDA, 'quadros.json'), JSON.stringify({
  duracao: +((t0 + FIM) - inicio).toFixed(3),
  quadros: quadros.map((q) => ({ nome: q.nome, t: +(q.t - inicio).toFixed(3) })),
}, null, 1));
fs.writeFileSync(path.join(SAIDA, 'eventos.json'), JSON.stringify(eventos.map((e) => ({ tipo: e.tipo, t: +(e.t - inicio).toFixed(3) })), null, 1));
console.log(`quadros: ${quadros.length} · duração: ${((t0 + FIM) - inicio).toFixed(1)} s · sons: ${eventos.length}`);
