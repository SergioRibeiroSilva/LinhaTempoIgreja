# Ferramentas

Scripts usados para montar o site. **O site não depende deles**: servem só para manutenção (trocar imagens, refazer a capa, gerar QR Codes, conferir os dados). Rode sempre **na pasta do projeto**.

| Script | Para que serve | Comando |
|---|---|---|
| `validar.js` | Confere o `data/eventos.json` e as versões antes de publicar | `node ferramentas/validar.js` |
| `baixar_imagens.mjs` | Baixa imagens do Wikimedia Commons e registra os créditos | `node ferramentas/baixar_imagens.mjs` |
| `converter_imagens.py` | Converte para WebP nos tamanhos 1200 e 640 px | `python ferramentas/converter_imagens.py` |
| `gerar_qrcodes.py` | QR Codes do site e dos roteiros, e a lista da folha de impressão | `python ferramentas/gerar_qrcodes.py` |
| `gerar_capa.py` | Imagem de prévia do WhatsApp (`img/compartilhar.jpg`) | `python ferramentas/gerar_capa.py` |
| `gerar_icones.py` | Ícones do aplicativo (`img/icone-*.png`) | `python ferramentas/gerar_icones.py` |

**Requisitos:** Node.js (para os `.js`/`.mjs`) e Python com as bibliotecas `pillow` e `segno`:

```bash
python -m pip install --user pillow segno
```

## Trocar ou acrescentar uma imagem

1. Encontre a obra no [Wikimedia Commons](https://commons.wikimedia.org) e confira a licença (domínio público, CC0 ou CC BY).
2. Em `ferramentas/imagens/selecao.json`, acrescente o id do evento e o nome exato do arquivo, por exemplo `"reforma-protestante": "File:Ferdinand Pauwels - Luther hammers his 95 theses to the door.jpg"`.
3. Rode `node ferramentas/baixar_imagens.mjs`. O arquivo vai para `ferramentas/imagens/originais/` (fora do Git) e o crédito para `ferramentas/imagens/creditos.json`. Para baixar de novo uma imagem já registrada, apague a entrada dela em `creditos.json`.
4. Rode `python ferramentas/converter_imagens.py`. Para ajustar o recorte de imagens verticais, use `ferramentas/imagens/posicoes.json` (0 = topo, 1 = base).
5. No evento em `data/eventos.json`, preencha `imagem`, `imagemCredito` (título em português, autor, licença e página do Commons) e `"destaque": true`.
6. Rode `node ferramentas/validar.js` e atualize a versão (veja abaixo).

Também dá para usar uma imagem própria: coloque o arquivo em `ferramentas/imagens/originais/` com o nome `<id-do-evento>.jpg` e siga a partir do passo 4.

## Antes de publicar

- `node ferramentas/validar.js` deve terminar com **Tudo certo**.
- Se mudou `css/estilo.css` ou `js/app.js`, aumente a versão **no mesmo número** em três lugares: `?v=` no `index.html`, `?v=` e `VERSAO = 'hdi-v…'` no `sw.js`. O `validar.js` avisa se ficarem diferentes.
- Se mudou os roteiros, rode `python ferramentas/gerar_qrcodes.py`.
