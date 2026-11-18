(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const trilha = $('#trilha');
  const elEpocas = $('#epocas');
  const elAno = $('#anoAtual');
  const btnAnterior = $('#btnAnterior');
  const btnProximo = $('#btnProximo');
  const dica = $('#dica');
  const painel = $('#painel');
  const fundo = $('#painelFundo');
  const conteudo = $('#painelConteudo');
  const alca = $('#painelAlca');
  const painelFechar = $('#painelFechar');
  const painelAnterior = $('#painelAnterior');
  const painelProximo = $('#painelProximo');
  const abertura = $('#abertura');
  const btnInicio = $('#btnInicio');
  const marcaDagua = $('#marcaDagua');
  const btnRoteiros = $('#btnRoteiros');
  const btnApresentar = $('#btnApresentar');
  const folha = $('#folhaRoteiros');
  const folhaFundo = $('#folhaFundo');
  const listaRoteiros = $('#listaRoteiros');
  const roteiroAtivo = $('#roteiroAtivo');
  const campoBusca = $('#campoBusca');
  const resultados = $('#resultados');
  const blocoExplorar = $('#blocoExplorar');
  const chipsFiltro = $('#chipsFiltro');
  const btnLimparFiltro = $('#btnLimparFiltro');
  const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let dados, eventos, cats, idxPorId;
  // seleção em uso: roteiro de aula ou filtro por categoria (null = linha completa)
  // { tipo: 'roteiro' | 'filtro', id, nome, rotulo, eventos: [ids], cats? }
  let roteiro = null;
  let indiceBusca = [];  // texto normalizado de cada evento
  let visiveis = [];     // índices dos eventos mostrados na trilha, em ordem
  let paradas = [];      // elementos onde a trilha "para" (épocas e eventos)
  let centros = [];      // centro horizontal de cada parada
  let atual = -1;        // índice da parada ativa
  let painelIdx = null;  // índice (em eventos) do evento aberto no painel
  let timerFechar = null;
  let ultimoFoco = null;

  // ---------- utilidades ----------
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const romano = (n) => {
    const t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
      [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let r = '';
    for (const [v, s] of t) while (n >= v) { r += s; n -= v; }
    return r;
  };
  const seculoDe = (ano) => Math.floor((ano - 1) / 100) + 1;
  const fmtData = (e) => (e.aprox ? 'c. ' : '') + e.ano + (e.anoFim ? '–' + e.anoFim : '');
  const epocaDe = (ano) => dados.epocas.find((ep) => ano <= ep.fim) || dados.epocas[dados.epocas.length - 1];
  const icone = (id) => `<svg class="ic" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const progresso = (ep, ano) => Math.max(0, Math.min(100, ((ano - ep.inicio) / (ep.fim - ep.inicio)) * 100));
  const emApresentacao = () => document.body.classList.contains('apresentacao');

  // Arte de um marco: imagem (quando houver) ou ícone da categoria
  function arte(e, cor, grande) {
    if (!e.imagem) return `<span class="arte" aria-hidden="true">${icone(e.categoria)}<span class="marca-ano">${e.ano}</span></span>`;
    const base = e.imagem.replace(/\.webp$/, '');
    const pos = e.imagemPosicao ? ` style="object-position:${esc(e.imagemPosicao)}"` : '';
    return `<span class="arte com-imagem"${grande ? ` style="--cor:${cor}"` : ''}>
      <img src="${esc(base)}-640.webp" srcset="${esc(base)}-640.webp 640w, ${esc(e.imagem)} 1200w"
        sizes="${grande ? '(min-width: 640px) 640px, 100vw' : '(min-width: 900px) 440px, 82vw'}"
        alt="${esc(e.imagemCredito?.titulo || '')}" loading="lazy" decoding="async"${pos}
        onload="this.classList.add('carregada')">
      <span class="marca-ano" aria-hidden="true">${e.ano}</span>
    </span>`;
  }

  // ---------- montagem da trilha ----------
  function itemEpoca(ep) {
    const n = visiveis.filter((i) => epocaDe(eventos[i].ano) === ep).length;
    const el = document.createElement('div');
    el.className = 'item parada epoca';
    el.dataset.epoca = ep.id;
    el.innerHTML = `
      <div class="cartao cartao-epoca">
        <span class="chip">${roteiro ? esc(roteiro.rotulo) : 'Época'}</span>
        <span class="ornamento">✦</span>
        <span class="epoca-nome">${esc(ep.nome)}</span>
        <span class="epoca-faixa">${ep.inicio === 0 ? 'Ano 0' : ep.inicio} – ${ep.fim}</span>
        <p class="epoca-info">${n} ${n === 1 ? 'evento' : 'eventos'}${ep.marcoFinal && !roteiro ? `<br>Termina com: ${esc(ep.marcoFinal)}` : ''}</p>
      </div>
      <div class="marco" aria-hidden="true"><span class="ponto"></span></div>`;
    return el;
  }

  function itemSeculo(sec) {
    const el = document.createElement('div');
    el.className = 'item seculo';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<div></div><div class="marco"><span class="rotulo">Séc. ${romano(sec)}</span></div>`;
    return el;
  }

  function itemEvento(e, i) {
    const cat = cats[e.categoria];
    const el = document.createElement('div');
    el.className = 'item parada evento' + (e.destaque ? ' destaque' : '');
    el.style.setProperty('--cor', cat.cor);
    el.dataset.evento = i;
    el.innerHTML = `
      <button class="cartao" type="button" aria-label="${esc(fmtData(e) + ': ' + e.titulo)}. Abrir detalhes.">
        ${e.destaque ? arte(e, cat.cor, false) : ''}
        <span class="corpo">
          <span class="chip">${icone(e.categoria)}${esc(cat.nome)}${e.brasil ? ' · Brasil' : ''}</span>
          <span class="data">${esc(fmtData(e))}</span>
          <span class="titulo">${esc(e.titulo)}</span>
          <span class="teaser">${esc(e.resumo)}</span>
          ${e.reforma ? `<span class="cartao-reforma"><b>Posição da Reforma</b>${esc(e.reforma)}</span>` : ''}
          <span class="ler">Ler mais</span>
        </span>
      </button>
      <div class="marco" aria-hidden="true"><span class="ponto"></span><span class="rotulo">${e.ano}</span></div>`;
    return el;
  }

  function montar() {
    visiveis = roteiro
      ? roteiro.eventos.map((id) => idxPorId.get(id)).filter((i) => i !== undefined).sort((a, b) => a - b)
      : eventos.map((_, i) => i);

    const frag = document.createDocumentFragment();
    let epAnterior = null;
    let secAnterior = null;
    for (const i of visiveis) {
      const e = eventos[i];
      const ep = epocaDe(e.ano);
      if (ep !== epAnterior) { frag.append(itemEpoca(ep)); epAnterior = ep; }
      const sec = seculoDe(e.ano);
      if (sec !== secAnterior) { frag.append(itemSeculo(sec)); secAnterior = sec; }
      frag.append(itemEvento(e, i));
    }
    trilha.replaceChildren(frag);
    paradas = [...trilha.querySelectorAll('.parada')];
    atual = -1;

    roteiroAtivo.hidden = !roteiro;
    if (roteiro) {
      $('#roteiroTexto').innerHTML = `${roteiro.tipo === 'filtro' ? 'Filtro' : 'Roteiro'}: <b>${esc(roteiro.nome)}</b>`;
      $('#btnSairRoteiro').setAttribute('aria-label', roteiro.tipo === 'filtro' ? 'Limpar filtro' : 'Sair do roteiro');
    }
  }

  function montarEpocas() {
    elEpocas.innerHTML = dados.epocas.map((ep) => `
      <button class="epoca-btn" type="button" data-epoca="${ep.id}">
        <span class="barra"><i></i></span>${esc(ep.nome.replace('Idade ', ''))}<span class="faixa">${ep.inicio}–${ep.fim}</span>
      </button>`).join('');
  }

  // ---------- navegação ----------
  function medir() {
    centros = paradas.map((p) => p.offsetLeft + p.offsetWidth / 2);
  }

  function paradaNoCentro() {
    const c = trilha.scrollLeft + trilha.clientWidth / 2;
    let melhor = 0;
    let dist = Infinity;
    for (let i = 0; i < centros.length; i++) {
      const d = Math.abs(centros[i] - c);
      if (d < dist) { dist = d; melhor = i; }
    }
    return melhor;
  }

  let anoMostrado = 0;
  let animAno = 0;
  function mostrarAno(alvoAno) {
    cancelAnimationFrame(animAno);
    if (reduzMovimento) { elAno.textContent = alvoAno; anoMostrado = alvoAno; return; }
    const de = anoMostrado;
    const t0 = performance.now();
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / 350);
      const v = Math.round(de + (alvoAno - de) * (1 - Math.pow(1 - k, 3)));
      elAno.textContent = v;
      anoMostrado = v;
      if (k < 1) animAno = requestAnimationFrame(passo);
    };
    animAno = requestAnimationFrame(passo);
    // garante o valor final mesmo se o navegador pausar as animações (aba em segundo plano)
    clearTimeout(timerAno);
    timerAno = setTimeout(() => { cancelAnimationFrame(animAno); elAno.textContent = alvoAno; anoMostrado = alvoAno; }, 450);
  }
  let timerAno = 0;

  // Tema da época: cor, fundo e marca-d'água que desliza conforme o avanço
  let timerMarca = 0;
  function trocarEpoca(ep, ano) {
    marcaDagua.style.setProperty('--deriva', (progresso(ep, ano) * 0.35).toFixed(1));
    if (document.body.dataset.epoca === ep.id && marcaDagua.textContent) return;
    document.body.dataset.epoca = ep.id;
    const nome = ep.nome.replace('Idade ', '');
    if (!marcaDagua.textContent || reduzMovimento) { marcaDagua.textContent = nome; return; }
    clearTimeout(timerMarca);
    marcaDagua.classList.add('troca');
    timerMarca = setTimeout(() => {
      marcaDagua.textContent = nome;
      marcaDagua.classList.remove('troca');
    }, 450);
  }

  function ativar(i) {
    if (i === atual || !paradas[i]) return;
    if (paradas[atual]) paradas[atual].classList.remove('ativa');
    atual = i;
    const p = paradas[i];
    p.classList.add('ativa');

    let ano, ep;
    if (p.dataset.evento !== undefined) {
      const e = eventos[+p.dataset.evento];
      ano = e.ano;
      ep = epocaDe(e.ano);
    } else {
      ep = dados.epocas.find((x) => x.id === p.dataset.epoca);
      ano = ep.inicio;
    }
    mostrarAno(ano);
    trocarEpoca(ep, ano);

    const iEp = dados.epocas.indexOf(ep);
    [...elEpocas.children].forEach((b, k) => {
      b.setAttribute('aria-current', String(k === iEp));
      const pct = k < iEp ? 100 : k > iEp ? 0 : progresso(ep, ano);
      b.querySelector('i').style.width = pct + '%';
    });

    btnAnterior.disabled = i === 0;
    btnProximo.disabled = i === paradas.length - 1;
  }

  // Durante uma rolagem disparada por botão/teclado, a parada de destino já está definida:
  // as posições intermediárias da animação não devem mudar a parada ativa.
  let alvo = null;
  let timerAlvo = 0;
  const liberarAlvo = () => { alvo = null; clearTimeout(timerAlvo); };

  function irPara(i, suave = true) {
    if (!paradas.length) return;
    i = Math.max(0, Math.min(paradas.length - 1, i));
    alvo = i;
    clearTimeout(timerAlvo);
    timerAlvo = setTimeout(liberarAlvo, 1000);
    trilha.scrollTo({
      left: centros[i] - trilha.clientWidth / 2,
      behavior: suave && !reduzMovimento ? 'smooth' : 'auto',
    });
    ativar(i);
  }

  const paradaDoEvento = (iEv) => paradas.findIndex((p) => p.dataset.evento === String(iEv));

  let rafScroll = 0;
  trilha.addEventListener('scroll', () => {
    cancelAnimationFrame(rafScroll);
    rafScroll = requestAnimationFrame(() => {
      if (alvo !== null) {
        const destino = centros[alvo] - trilha.clientWidth / 2;
        if (Math.abs(trilha.scrollLeft - destino) > 2) return;
        liberarAlvo();
      }
      ativar(paradaNoCentro());
    });
  }, { passive: true });
  // Se a pessoa tocar/arrastar durante a animação, ela assume o controle
  trilha.addEventListener('pointerdown', liberarAlvo, { passive: true });
  trilha.addEventListener('touchstart', liberarAlvo, { passive: true });

  // A dica some na primeira interação da pessoa
  const esconderDica = () => dica.classList.add('sumir');
  ['pointerdown', 'wheel', 'keydown'].forEach((t) =>
    document.querySelector('.palco').addEventListener(t, esconderDica, { once: true, passive: true }));
  [btnAnterior, btnProximo].forEach((b) => b.addEventListener('click', esconderDica, { once: true }));

  // Roda do mouse: rolagem vertical avança um evento por vez
  let travaRoda = 0;
  trilha.addEventListener('wheel', (ev) => {
    if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return; // trackpad horizontal: deixa nativo
    ev.preventDefault();
    const agora = performance.now();
    if (agora < travaRoda || Math.abs(ev.deltaY) < 4) return;
    travaRoda = agora + 380;
    irPara(atual + (ev.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  trilha.addEventListener('click', (ev) => {
    const p = ev.target.closest('.parada');
    if (!p) return;
    const i = paradas.indexOf(p);
    if (i !== atual) { irPara(i); return; }        // cartão lateral: primeiro centraliza
    if (emApresentacao()) { irPara(atual + 1); return; } // na projeção, o texto já está todo no cartão
    if (p.dataset.evento !== undefined) abrirPainel(+p.dataset.evento);
  });

  elEpocas.addEventListener('click', (ev) => {
    const b = ev.target.closest('.epoca-btn');
    if (!b) return;
    let i = paradas.findIndex((p) => p.dataset.epoca === b.dataset.epoca);
    if (i < 0) { // roteiro sem eventos nessa época: vai para a época seguinte mais próxima
      const k = dados.epocas.findIndex((ep) => ep.id === b.dataset.epoca);
      i = paradas.findIndex((p) => p.dataset.epoca && dados.epocas.findIndex((ep) => ep.id === p.dataset.epoca) > k);
      if (i < 0) i = paradas.length - 1;
    }
    irPara(i);
  });

  btnAnterior.addEventListener('click', () => irPara(atual - 1));
  btnProximo.addEventListener('click', () => irPara(atual + 1));

  document.addEventListener('keydown', (ev) => {
    if (!abertura.hidden) return; // na abertura, o teclado só aciona o botão
    if (!folha.hidden) { if (ev.key === 'Escape') fecharRoteiros(); return; }
    if (painelIdx !== null) {
      if (ev.key === 'Escape') fecharPainel();
      else if (ev.key === 'ArrowRight') navPainel(1);
      else if (ev.key === 'ArrowLeft') navPainel(-1);
      return;
    }
    // passadores de slides costumam enviar PageDown/PageUp ou as setas
    const mapa = { ArrowRight: 1, PageDown: 1, ArrowDown: 1, ArrowLeft: -1, PageUp: -1, ArrowUp: -1 };
    if (ev.key in mapa) { ev.preventDefault(); irPara(atual + mapa[ev.key]); }
    else if (ev.key === 'Home') { ev.preventDefault(); irPara(0); }
    else if (ev.key === 'End') { ev.preventDefault(); irPara(paradas.length - 1); }
    else if (ev.key === 'Escape' && emApresentacao()) alternarApresentacao(false);
    else if (ev.key === 'p' || ev.key === 'P') alternarApresentacao();
    else if (ev.key === '/') { ev.preventDefault(); abrirRoteiros(true); }
  });

  // ---------- painel de detalhes ----------
  function renderPainel() {
    const e = eventos[painelIdx];
    const cat = cats[e.categoria];
    painel.style.setProperty('--cor', cat.cor);
    conteudo.innerHTML = `
      ${e.destaque ? arte(e, cat.cor, true) : ''}
      <span class="chip">${icone(e.categoria)}${esc(cat.nome)}${e.brasil ? ' · Brasil' : ''}</span>
      <p class="painel-data">${esc(fmtData(e))}${e.aprox ? '<small>data aproximada</small>' : ''}</p>
      <h2 class="painel-titulo" id="painelTitulo">${esc(e.titulo)}</h2>
      <p class="painel-texto">${esc(e.resumo)}</p>
      ${e.reforma ? `<aside class="reforma"><h3>${icone('reforma')}Posição da Reforma</h3><p>${esc(e.reforma)}</p></aside>` : ''}
      ${e.fonte ? `<p class="fonte">Fonte: ${esc(e.fonte)}</p>` : ''}
      ${e.imagemCredito ? `<p class="credito">Imagem: ${esc(e.imagemCredito.titulo)}${e.imagemCredito.autor ? ', ' + esc(e.imagemCredito.autor) : ''} · ${esc(e.imagemCredito.licenca)} · <a href="${esc(e.imagemCredito.pagina)}" target="_blank" rel="noopener">Wikimedia Commons</a></p>` : ''}`;
    conteudo.scrollTop = 0;
    const pos = visiveis.indexOf(painelIdx);
    painelAnterior.disabled = pos <= 0;
    painelProximo.disabled = pos === visiveis.length - 1;
  }

  function abrirPainel(iEv) {
    const jaAberto = painelIdx !== null;
    painelIdx = iEv;
    renderPainel();
    history.replaceState(null, '', '#' + eventos[iEv].id);
    if (jaAberto) return;
    clearTimeout(timerFechar);
    ultimoFoco = document.activeElement;
    painel.hidden = false;
    fundo.hidden = false;
    void painel.offsetHeight; // força o navegador a aplicar o estado inicial antes da transição
    painel.classList.add('aberto');
    fundo.classList.add('aberto');
    painelFechar.focus({ preventScroll: true });
  }

  function fecharPainel() {
    if (painelIdx === null) return;
    painelIdx = null;
    painel.classList.remove('aberto');
    fundo.classList.remove('aberto');
    history.replaceState(null, '', location.pathname + location.search);
    timerFechar = setTimeout(() => { painel.hidden = true; fundo.hidden = true; }, 400);
    if (ultimoFoco) ultimoFoco.focus({ preventScroll: true });
  }

  function navPainel(d) {
    const novo = visiveis[visiveis.indexOf(painelIdx) + d];
    if (novo === undefined) return;
    abrirPainel(novo);
    irPara(paradaDoEvento(novo), false);
  }

  painelFechar.addEventListener('click', fecharPainel);
  fundo.addEventListener('click', fecharPainel);
  painelAnterior.addEventListener('click', () => navPainel(-1));
  painelProximo.addEventListener('click', () => navPainel(1));

  // Arrastar a alça para baixo fecha o painel
  let arrasto = null;
  alca.addEventListener('pointerdown', (ev) => {
    arrasto = { y: ev.clientY, dy: 0 };
    alca.setPointerCapture(ev.pointerId);
    painel.style.transition = 'none';
  });
  alca.addEventListener('pointermove', (ev) => {
    if (!arrasto) return;
    arrasto.dy = Math.max(0, ev.clientY - arrasto.y);
    painel.style.transform = `translateY(${arrasto.dy}px)`;
  });
  const soltar = () => {
    if (!arrasto) return;
    const fechar = arrasto.dy > 90;
    arrasto = null;
    painel.style.transition = '';
    painel.style.transform = '';
    if (fechar) fecharPainel();
  };
  alca.addEventListener('pointerup', soltar);
  alca.addEventListener('pointercancel', soltar);

  // ---------- explorar: busca, filtros e roteiros ----------
  const normalizar = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function montarIndiceBusca() {
    indiceBusca = eventos.map((e) => ({
      titulo: normalizar(e.titulo),
      tudo: normalizar([e.titulo, e.ano, e.anoFim, cats[e.categoria].nome, e.resumo, e.reforma].join(' ')),
    }));
  }

  // destaca os termos buscados no título, sem quebrar acentos
  function destacar(texto, termos) {
    const norm = normalizar(texto);
    const marcas = new Array(texto.length).fill(false);
    for (const t of termos) {
      let p = norm.indexOf(t);
      while (t && p >= 0) { for (let k = p; k < p + t.length; k++) marcas[k] = true; p = norm.indexOf(t, p + t.length); }
    }
    let html = '';
    let aberto = false;
    for (let k = 0; k < texto.length; k++) {
      if (marcas[k] && !aberto) { html += '<mark>'; aberto = true; }
      if (!marcas[k] && aberto) { html += '</mark>'; aberto = false; }
      html += esc(texto[k]);
    }
    return html + (aberto ? '</mark>' : '');
  }

  function buscar() {
    const q = normalizar(campoBusca.value).trim();
    const termos = q.split(/\s+/).filter(Boolean);
    resultados.hidden = !termos.length;
    blocoExplorar.hidden = termos.length > 0;
    if (!termos.length) { resultados.innerHTML = ''; return; }
    const achados = [];
    indiceBusca.forEach((ix, i) => {
      if (!termos.every((t) => ix.tudo.includes(t))) return;
      const pontos = termos.filter((t) => ix.titulo.includes(t)).length; // título pesa mais
      achados.push({ i, pontos });
    });
    achados.sort((a, b) => b.pontos - a.pontos || a.i - b.i);
    resultados.innerHTML = achados.length
      ? achados.slice(0, 40).map(({ i }) => {
        const e = eventos[i];
        const cat = cats[e.categoria];
        return `<li><button class="res-btn" type="button" data-evento="${i}" style="--cor:${cat.cor}">
          <span class="res-ano">${esc(fmtData(e))}</span>
          <span class="res-tit">${destacar(e.titulo, termos)}</span>
          <span class="res-cat">${esc(cat.nomeCurto || cat.nome)}</span>
        </button></li>`;
      }).join('') + (achados.length > 40 ? `<li class="res-vazio">e mais ${achados.length - 40}… refine a busca.</li>` : '')
      : `<li class="res-vazio">Nenhum evento encontrado para “${esc(campoBusca.value.trim())}”.</li>`;
  }

  campoBusca.addEventListener('input', buscar);
  resultados.addEventListener('click', (ev) => {
    const b = ev.target.closest('.res-btn');
    if (!b) return;
    const iEv = +b.dataset.evento;
    fecharRoteiros();
    if (!visiveis.includes(iEv)) aplicarRoteiro(null, false);
    irPara(paradaDoEvento(iEv), false);
    abrirPainel(iEv);
  });

  function filtroDe(catIds) {
    const sel = dados.categorias.filter((c) => catIds.includes(c.id));
    if (!sel.length) return null;
    return {
      tipo: 'filtro', id: null, cats: sel.map((c) => c.id), rotulo: 'Filtro',
      nome: sel.map((c) => c.nomeCurto || c.nome).join(', '),
      eventos: eventos.filter((e) => sel.some((c) => c.id === e.categoria)).map((e) => e.id),
    };
  }

  function renderFiltros() {
    const ativos = roteiro?.tipo === 'filtro' ? roteiro.cats : [];
    chipsFiltro.innerHTML = dados.categorias.map((c) => {
      const n = eventos.filter((e) => e.categoria === c.id).length;
      return `<button class="chip-filtro" type="button" data-cat="${c.id}" style="--cor:${c.cor}" aria-pressed="${ativos.includes(c.id)}">
        ${icone(c.id)}${esc(c.nomeCurto || c.nome)} <small>${n}</small></button>`;
    }).join('');
    btnLimparFiltro.hidden = !ativos.length;
  }

  chipsFiltro.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip-filtro');
    if (!b) return;
    const atuais = roteiro?.tipo === 'filtro' ? [...roteiro.cats] : [];
    const k = atuais.indexOf(b.dataset.cat);
    if (k >= 0) atuais.splice(k, 1); else atuais.push(b.dataset.cat);
    aplicarRoteiro(filtroDe(atuais));
    renderFiltros();
    renderRoteiros();
  });
  btnLimparFiltro.addEventListener('click', () => { aplicarRoteiro(null); renderFiltros(); renderRoteiros(); });

  function renderRoteiros() {
    const idAtual = roteiro ? (roteiro.tipo === 'roteiro' ? roteiro.id : null) : '';
    const item = (id, nome, desc, qtd) => `
      <li><button class="rot-btn" type="button" data-roteiro="${esc(id)}" aria-current="${idAtual === id}">
        <span class="rot-nome">${esc(nome)}</span><span class="rot-qtd">${qtd} eventos</span>
        <span class="rot-desc">${esc(desc)}</span>
      </button></li>`;
    listaRoteiros.innerHTML =
      item('', 'Linha do tempo completa', 'Todos os eventos, do ano 0 a 2000.', eventos.length) +
      (dados.roteiros || []).map((r) => item(r.id, r.nome, r.descricao, r.eventos.length)).join('');
  }

  let timerFolha = 0;
  function abrirRoteiros(focarBusca) {
    fecharPainel();
    renderFiltros();
    renderRoteiros();
    buscar();
    clearTimeout(timerFolha);
    folha.hidden = false;
    folhaFundo.hidden = false;
    void folha.offsetHeight;
    folha.classList.add('aberto');
    folhaFundo.classList.add('aberto');
    if (focarBusca === true) campoBusca.focus({ preventScroll: true });
    else $('#folhaFechar').focus({ preventScroll: true }); // no celular, não abre o teclado sem pedir
  }

  function fecharRoteiros() {
    if (folha.hidden) return;
    folha.classList.remove('aberto');
    folhaFundo.classList.remove('aberto');
    timerFolha = setTimeout(() => { folha.hidden = true; folhaFundo.hidden = true; }, 400);
    btnRoteiros.focus({ preventScroll: true });
  }

  const roteiroDe = (id) => {
    const r = id && (dados.roteiros || []).find((x) => x.id === id);
    return r ? { ...r, tipo: 'roteiro', rotulo: r.nome } : null;
  };

  // aceita o id de um roteiro, um objeto de filtro, ou vazio/null para a linha completa
  function aplicarRoteiro(sel, animar = true) {
    roteiro = sel && typeof sel === 'object' ? sel : roteiroDe(sel);
    const url = new URL(location.href);
    url.searchParams.delete('roteiro');
    url.searchParams.delete('cat');
    if (roteiro?.tipo === 'roteiro') url.searchParams.set('roteiro', roteiro.id);
    if (roteiro?.tipo === 'filtro') url.searchParams.set('cat', roteiro.cats.join(','));
    url.hash = '';
    history.replaceState(null, '', url);
    fecharPainel();
    montar();
    medir();
    irPara(0, false);
    if (animar) animarEntrada();
  }

  btnRoteiros.addEventListener('click', () => abrirRoteiros());
  $('#folhaFechar').addEventListener('click', fecharRoteiros);
  folhaFundo.addEventListener('click', fecharRoteiros);
  listaRoteiros.addEventListener('click', (ev) => {
    const b = ev.target.closest('.rot-btn');
    if (!b) return;
    fecharRoteiros();
    aplicarRoteiro(b.dataset.roteiro);
  });
  $('#btnSairRoteiro').addEventListener('click', () => aplicarRoteiro(null));

  // ---------- instalação e uso offline ----------
  let pedidoInstalacao = null;
  const btnInstalar = $('#btnInstalar');
  const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  window.addEventListener('beforeinstallprompt', (ev) => {
    ev.preventDefault();
    pedidoInstalacao = ev;
    $('#blocoInstalar').hidden = false;
    btnInstalar.hidden = false;
  });
  btnInstalar.addEventListener('click', async () => {
    if (!pedidoInstalacao) return;
    pedidoInstalacao.prompt();
    await pedidoInstalacao.userChoice.catch(() => {});
    pedidoInstalacao = null;
    btnInstalar.hidden = true;
  });
  window.addEventListener('appinstalled', () => { $('#blocoInstalar').hidden = true; });
  // iPhone/iPad não têm botão de instalar: mostra a instrução
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !instalado()) {
    $('#blocoInstalar').hidden = false;
    $('#textoInstalar').textContent = 'No iPhone ou iPad: toque em Compartilhar e depois em “Adicionar à Tela de Início”. O site abre como aplicativo, mesmo sem internet.';
  }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  // ---------- modo apresentação ----------
  function alternarApresentacao(forcar) {
    const ligar = typeof forcar === 'boolean' ? forcar : !emApresentacao();
    if (ligar === emApresentacao()) return;
    document.body.classList.toggle('apresentacao', ligar);
    btnApresentar.setAttribute('aria-pressed', String(ligar));
    if (ligar) {
      fecharPainel();
      fecharRoteiros();
      const raiz = document.documentElement;
      if (raiz.requestFullscreen && !document.fullscreenElement) raiz.requestFullscreen().catch(() => {});
    } else if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    // o tamanho dos cartões muda: recalcula e recentraliza
    requestAnimationFrame(() => { medir(); if (atual >= 0) irPara(atual, false); });
  }

  btnApresentar.addEventListener('click', () => alternarApresentacao());
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && emApresentacao()) alternarApresentacao(false);
  });

  // ---------- abertura ----------
  const CHAVE_ABERTURA = 'hdi-abertura-vista';
  const lerSessao = () => { try { return sessionStorage.getItem(CHAVE_ABERTURA); } catch { return null; } };
  const gravarSessao = () => { try { sessionStorage.setItem(CHAVE_ABERTURA, '1'); } catch { /* sem armazenamento */ } };

  function iniciarJornada() {
    if (abertura.classList.contains('saindo')) return;
    gravarSessao();
    abertura.classList.add('saindo');
    setTimeout(() => { abertura.hidden = true; }, reduzMovimento ? 0 : 700);
    animarEntrada();
    trilha.focus({ preventScroll: true });
  }

  function mostrarAbertura() {
    fecharPainel();
    fecharRoteiros();
    alternarApresentacao(false);
    // recria o conteúdo para que as animações recomecem
    const c = abertura.firstElementChild;
    c.replaceWith(c.cloneNode(true));
    abertura.hidden = false;
    void abertura.offsetHeight;
    abertura.classList.remove('saindo');
    abertura.querySelector('#btnComecar').focus({ preventScroll: true });
  }

  // Os itens visíveis entram em sequência, da esquerda para a direita
  function animarEntrada() {
    if (reduzMovimento) return;
    const vis = [...trilha.children].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > 0 && r.left < innerWidth;
    });
    vis.forEach((el, k) => el.style.setProperty('--i', k));
    trilha.classList.remove('entrada');
    void trilha.offsetHeight;
    trilha.classList.add('entrada');
    setTimeout(() => {
      trilha.classList.remove('entrada');
      vis.forEach((el) => el.style.removeProperty('--i'));
    }, 2200);
  }

  abertura.addEventListener('click', (ev) => { if (ev.target.closest('#btnComecar')) iniciarJornada(); });
  btnInicio.addEventListener('click', mostrarAbertura);

  // Link direto: site/#id-do-evento abre o evento (dentro do roteiro, se ele fizer parte)
  function abrirPorEndereco() {
    const id = decodeURIComponent(location.hash.slice(1));
    const iEv = id ? idxPorId.get(id) : undefined;
    if (iEv === undefined) return false;
    if (!visiveis.includes(iEv)) aplicarRoteiro(null, false);
    irPara(paradaDoEvento(iEv), false);
    abrirPainel(iEv);
    return true;
  }

  // ---------- início ----------
  // Altura visível real da tela. Em alguns celulares, "100% da altura" inclui a área coberta
  // pela barra do navegador ou do sistema, e o rodapé (com as setas) ficaria escondido.
  const ajustarAltura = () => document.documentElement.style.setProperty('--altura', window.innerHeight + 'px');
  ajustarAltura();
  const aoRedimensionar = () => {
    ajustarAltura();
    requestAnimationFrame(() => {
      medir();
      if (atual >= 0) trilha.scrollTo({ left: centros[atual] - trilha.clientWidth / 2 });
    });
  };
  window.addEventListener('resize', aoRedimensionar);
  window.addEventListener('orientationchange', () => setTimeout(aoRedimensionar, 300));
  document.addEventListener('fullscreenchange', () => setTimeout(aoRedimensionar, 150));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', ajustarAltura);

  fetch('data/eventos.json')
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((json) => {
      dados = json;
      eventos = json.eventos;
      cats = Object.fromEntries(json.categorias.map((c) => [c.id, c]));
      idxPorId = new Map(eventos.map((e, i) => [e.id, i]));
      $('#totalEventos').textContent = eventos.length;

      montarIndiceBusca();
      const params = new URLSearchParams(location.search);
      roteiro = roteiroDe(params.get('roteiro')) || filtroDe((params.get('cat') || '').split(','));
      montarEpocas();
      montar();
      medir();
      const porLink = abrirPorEndereco();
      if (!porLink) irPara(0, false);
      // Quem chega por link direto (evento ou roteiro), ou já viu a abertura nesta visita, vai direto à linha do tempo
      if (porLink || roteiro || lerSessao()) abertura.hidden = true;
      else abertura.querySelector('#btnComecar').focus({ preventScroll: true });
      window.addEventListener('hashchange', abrirPorEndereco);
    })
    .catch((err) => {
      const aviso = $('#aviso');
      aviso.hidden = false;
      aviso.textContent = 'Não foi possível carregar os eventos. Abra o site por um servidor (não direto do arquivo). Detalhe: ' + err.message;
    });
})();
