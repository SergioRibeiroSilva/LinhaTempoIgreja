// Confere o arquivo de dados antes de publicar.
//
// Uso (na pasta do projeto):  node ferramentas/validar.js
// Verifica: JSON válido, ids únicos, categorias existentes, ordem por ano, textos e fontes,
// "Posição da Reforma" nas doutrinas, imagens e créditos dos destaques, ids dos roteiros
// e se a versão em index.html e sw.js está igual.
const fs = require('fs');
const path = require('path');

const raiz = path.resolve(__dirname, '..');
const erros = [];
const avisos = [];

let d;
try {
  d = JSON.parse(fs.readFileSync(path.join(raiz, 'data/eventos.json'), 'utf8'));
} catch (e) {
  console.error('ERRO: data/eventos.json não é um JSON válido:', e.message);
  process.exit(1);
}

const cats = new Set(d.categorias.map((c) => c.id));
const ids = new Set();
d.eventos.forEach((e, i) => {
  const onde = `evento "${e.id || '#' + i}"`;
  if (!e.id) erros.push(`${onde}: sem id`);
  else if (ids.has(e.id)) erros.push(`${onde}: id repetido`);
  ids.add(e.id);
  if (typeof e.ano !== 'number') erros.push(`${onde}: "ano" precisa ser um número`);
  if (!cats.has(e.categoria)) erros.push(`${onde}: categoria inexistente "${e.categoria}"`);
  if (!e.titulo) erros.push(`${onde}: sem título`);
  if (!e.resumo) avisos.push(`${onde}: sem resumo`);
  if (!e.fonte) avisos.push(`${onde}: sem fonte`);
  if (e.categoria === 'doutrina' && !e.reforma) avisos.push(`${onde}: doutrina sem "Posição da Reforma"`);
  if (i > 0 && e.ano < d.eventos[i - 1].ano) avisos.push(`${onde}: fora da ordem de ano`);
  if (e.imagem) {
    for (const f of [e.imagem, e.imagem.replace(/\.webp$/, '-640.webp')]) {
      if (!fs.existsSync(path.join(raiz, f))) erros.push(`${onde}: imagem não encontrada (${f})`);
    }
    const c = e.imagemCredito;
    if (!c || !c.titulo || !c.licenca || !c.pagina) erros.push(`${onde}: crédito da imagem incompleto`);
  } else if (e.destaque) {
    avisos.push(`${onde}: destaque sem imagem (aparece com o ícone da categoria)`);
  }
});

for (const r of d.roteiros || []) {
  const ruins = r.eventos.filter((id) => !ids.has(id));
  if (ruins.length) erros.push(`roteiro "${r.id}": ids inexistentes: ${ruins.join(', ')}`);
}

// versão dos arquivos (cache): index.html e sw.js devem usar o mesmo número
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
const vHtml = [...html.matchAll(/(estilo\.css|app\.js)\?v=(\d+)/g)].map((m) => m[2]);
const vSw = [...sw.matchAll(/(estilo\.css|app\.js)\?v=(\d+)/g)].map((m) => m[2]);
const vCache = (sw.match(/VERSAO = 'hdi-v(\d+)'/) || [])[1];
if (new Set([...vHtml, ...vSw, vCache]).size !== 1) {
  erros.push(`versões diferentes: index.html ?v=${vHtml.join('/')}, sw.js ?v=${vSw.join('/')}, cache hdi-v${vCache}`);
}

console.log(`${d.eventos.length} eventos · ${d.categorias.length} categorias · ${(d.roteiros || []).length} roteiros · ` +
  `${d.eventos.filter((e) => e.imagem).length} imagens · versão ${vCache}`);
avisos.forEach((a) => console.log('aviso:', a));
erros.forEach((e) => console.log('ERRO:', e));
console.log(erros.length ? `\n${erros.length} erro(s) encontrado(s).` : '\nTudo certo.');
process.exit(erros.length ? 1 : 0);
