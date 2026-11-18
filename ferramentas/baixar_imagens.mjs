// Baixa do Wikimedia Commons a versão reduzida de cada imagem escolhida e registra os créditos.
//
// Uso (na pasta do projeto):  node ferramentas/baixar_imagens.mjs
//   Lê   ferramentas/imagens/selecao.json   { "id-do-evento": "File:Nome do arquivo no Commons.jpg" }
//   Grava ferramentas/imagens/originais/     (arquivos baixados; fora do Git)
//   Atualiza ferramentas/imagens/creditos.json
// Imagens já baixadas (com crédito registrado) são puladas; apague a entrada do creditos.json para baixar de novo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arqSelecao = process.argv[2] || path.join(raiz, 'ferramentas/imagens/selecao.json');
const pasta = process.argv[3] || path.join(raiz, 'ferramentas/imagens/originais');
const arqCreditos = path.join(path.dirname(arqSelecao), 'creditos.json');

const selecao = JSON.parse(fs.readFileSync(arqSelecao, 'utf8'));
const UA = 'TimelineEducationalSite/0.1 (static church-history timeline)';
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const limpa = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#039;/g, "'").replace(/\s+/g, ' ').trim();

// O Wikimedia limita pedidos seguidos: espera entre um e outro e respeita os avisos de "aguarde".
async function obter(url, comoJson) {
  for (let t = 0; t < 6; t++) {
    await espera(comoJson ? 1500 : 5000);
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.status === 429) {
      const ra = Number(r.headers.get('retry-after')) || 0;
      console.log('  aguardando (limite do Wikimedia)', ra || 20 * (t + 1), 's');
      await espera(Math.max(ra * 1000, 20000 * (t + 1)));
      continue;
    }
    if (!r.ok) throw new Error(r.status + ' ' + url);
    return comoJson ? r.json() : Buffer.from(await r.arrayBuffer());
  }
  throw new Error('limite de pedidos excedido: ' + url);
}

fs.mkdirSync(pasta, { recursive: true });
const creditos = fs.existsSync(arqCreditos) ? JSON.parse(fs.readFileSync(arqCreditos, 'utf8')) : {};

for (const [id, titulo] of Object.entries(selecao)) {
  if (creditos[id] && fs.existsSync(path.join(pasta, creditos[id].arquivo))) continue;

  const consulta = async (largura) => {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    Object.entries({ format: 'json', action: 'query', titles: titulo, prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(largura) })
      .forEach(([k, v]) => u.searchParams.set(k, v));
    const j = await obter(u, true);
    const pg = Object.values(j.query.pages)[0];
    if (!pg.imageinfo) throw new Error('arquivo não encontrado no Commons: ' + titulo);
    return pg.imageinfo[0];
  };
  // Prefere miniaturas (servidor mais tolerante que o de arquivos originais)
  let ii = await consulta(1280);
  if (!ii.thumburl || (ii.thumburl.includes('upload.wikimedia.org/wikipedia/commons/') && !ii.thumburl.includes('/thumb/'))) {
    ii = await consulta([960, 500, 330].find((w) => w < ii.width) || 330);
  }
  const m = ii.extmetadata || {};
  const url = (ii.thumburl || ii.url).split('?')[0];
  if (!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(url)) throw new Error('origem inesperada: ' + url);

  const buf = await obter(url, false);
  const ext = path.extname(new URL(url).pathname).toLowerCase() || '.jpg';
  fs.writeFileSync(path.join(pasta, id + ext), buf);
  creditos[id] = {
    arquivo: id + ext,
    titulo: titulo.replace(/^File:/, ''),
    autor: limpa(m.Artist?.value).slice(0, 120),
    licenca: limpa(m.LicenseShortName?.value),
    licencaUrl: limpa(m.LicenseUrl?.value),
    pagina: ii.descriptionurl,
    bytes: buf.length,
  };
  fs.writeFileSync(arqCreditos, JSON.stringify(creditos, null, 1));
  console.log(id, Math.round(buf.length / 1024) + ' KB', creditos[id].licenca);
}
console.log('imagens com crédito registrado:', Object.keys(creditos).length);
