# Breve História da Igreja: guia para o Claude

Site estático com uma linha do tempo interativa da história da Igreja (ano 0 a 2000), feito para o celular e para projeção em aulas. Autor do conteúdo: **Pr. Sérgio Ribeiro**, a partir do PDF *Linha do Tempo – História da Igreja* (jan/2025).

- Site publicado: https://sergioribeirosilva.github.io/LinhaTempoIgreja/ (GitHub Pages, branch `main`, pasta raiz)
- Repositório: https://github.com/SergioRibeiroSilva/LinhaTempoIgreja

## Como trabalhar com o autor

- **Responda sempre em português do Brasil.** O autor é pastor, não programador: explique em linguagem simples, sem jargão, dizendo o que mudou e como conferir.
- Faça `git commit`/`git push` **só quando ele pedir**. Mensagens de commit em português, descrevendo a mudança.
- Antes de baixar arquivos, instalar bibliotecas ou publicar algo, peça permissão.

## Decisões de conteúdo (não desfazer sem perguntar)

- **Tom: protestante, mas neutro e respeitoso.** Fatos com contexto histórico, sem linguagem polêmica. Os itens da categoria `doutrina` ("Desenvolvimentos doutrinários e práticas") têm o campo `reforma`, com a posição da Reforma e uma referência bíblica.
- **Período fixo:** ano 0 a 2000.
- Datas corrigidas em relação ao PDF ficam registradas no campo `nota` de cada evento (ex.: Tyndale 1536, primeiro culto protestante no Brasil 1557, Cartago 397). O campo `nota` não aparece no site.
- Datas tradicionais difíceis de comprovar (papado 304, orações pelos mortos 310, velas 320, veneração dos santos 375, missa 394) estão com `"aprox": true`, por decisão do autor.
- O terço continua em 1214 por decisão do autor (ele pode pesquisar e revisar). A "Igreja de Deus" é a de Cleveland (1886).
- Pessoas aparecem com o período de vida (`ano` e `anoFim`), não só com o ano de nascimento.
- Fontes bibliográficas principais: Justo L. González, Earle E. Cairns, Émile G. Léonard, Alderi S. de Matos, Vinson Synan, Isael de Araujo.
- Imagens: só domínio público, CC0 ou CC BY (Wikimedia Commons), sempre com `imagemCredito` (título em português, autor, licença, página). A gravura de Wesley (CC BY 4.0) exige o crédito "Wellcome Collection".

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `data/eventos.json` | **Todo o conteúdo**: `meta`, `categorias` (com `nomeCurto` e `cor`), `epocas`, `faixas`, `roteiros` e os 125 `eventos` (ordenados por ano) |
| `index.html` | Estrutura: abertura, topo (ano e barra de épocas), trilha, rodapé (setas, Explorar, Apresentar), painel de detalhes, menu Explorar, ícones SVG e etiquetas Open Graph |
| `css/estilo.css` | Tokens de cor em `:root`; cor de cada época em `--ep-*` (aplicada como `--ce` via `[data-epoca]`); modo escuro; modo apresentação (`body.apresentacao`) |
| `js/app.js` | Toda a lógica, sem bibliotecas |
| `sw.js` / `manifest.webmanifest` | Funcionamento offline e instalação como aplicativo |
| `img/` | `<id>.webp` (1200 px) e `<id>-640.webp`, ícones, `compartilhar.jpg` (prévia 1200×630) |
| `qrcodes/` | QR Codes (PNG/SVG), `qrcodes.json` e a folha `imprimir.html` |
| `ferramentas/` | Scripts de manutenção: validador, imagens, capa, ícones e QR Codes (ver `ferramentas/README.md`) |
| `video/` | Gerador do vídeo tutorial de 40 s (ver `video/README.md` e `video/roteiro.md`) |
| `README.md` | Página do repositório no GitHub, para o leitor (recursos, como usar, como editar, créditos) |

**O site não tem etapa de compilação nem dependências:** HTML, CSS e JavaScript puros. Não introduza frameworks, bundlers ou bibliotecas externas (o site precisa funcionar offline). As únicas coisas externas são as fontes Cinzel e Inter, do Google Fonts.

As **ferramentas e o vídeo** ficam fora do site e têm dependências próprias, já instaladas neste computador: Node.js, Python com `pillow`, `segno`, `numpy` e `imageio-ffmpeg` (que traz o FFmpeg), e o pacote `playwright-core` dentro de `video/` (usa o Google Chrome instalado). O `.gitignore` deixa de fora `.claude/`, `ferramentas/imagens/originais/` e `video/saida/` (quadros, áudio e MP4 gerados).

### Como o `app.js` funciona

- A trilha é uma rolagem horizontal com `scroll-snap`. As "paradas" são os cartões de época e de evento; os marcadores de século não são paradas.
- `roteiro` guarda a seleção atual: um roteiro (`tipo: 'roteiro'`), um filtro por categorias (`tipo: 'filtro'`) ou `null` (linha completa). `montar()` reconstrói a trilha a partir de `visiveis`.
- Endereços: `?roteiro=<id>`, `?cat=a,b` e `#<id-do-evento>` (abre o painel). Quem chega por link direto não vê a abertura.
- `irPara()` usa `alvo` para que as posições intermediárias da rolagem suave não mudem a parada ativa.
- A altura da página vem de `--altura` (medida com `innerHeight`), para que as barras do navegador ou do sistema não cubram o rodapé no celular.
- Modo apresentação: tecla `P` ou botão Apresentar; tela cheia; o texto completo e a posição da Reforma aparecem no próprio cartão; em telas com até 520 px de altura (celular deitado), o topo some e a imagem vai para o lado do texto.

## Regras de manutenção

1. **Versão dos arquivos.** Ao mudar `css/estilo.css` ou `js/app.js`, aumente **o mesmo número** em: `?v=` no `index.html` (CSS e JS) e, no `sw.js`, `VERSAO = 'hdi-vN'` e os `?v=` da lista `NUCLEO`. Sem isso, navegadores e o service worker continuam usando a versão antiga. Mudanças só no `data/eventos.json` aparecem sozinhas.
2. **Antes de publicar,** rode `node ferramentas/validar.js` (confere dados, imagens, roteiros e versões).
3. Mudou roteiros? Rode `python ferramentas/gerar_qrcodes.py`. Os links de roteiro já impressos dependem dos `id`s: não renomeie roteiros existentes.
4. Mantenha o contraste do texto em pelo menos 4,5:1 nos modos claro e escuro (as etiquetas de categoria usam `color-mix` com preto no claro e com branco no escuro).
5. Mudou a capa ou o texto de compartilhamento? Rode `python ferramentas/gerar_capa.py`. As etiquetas Open Graph do `index.html` usam endereços absolutos do site publicado. O WhatsApp guarda as prévias por um tempo.

## Vídeo tutorial (`video/`)

- Gerar: na pasta `video/`, `node gravar.mjs`, depois `python sons.py` e `python montar.py`. Resultado: `video/saida/tutorial.mp4` (1080×1920, cerca de 40 s, menos de 16 MB para o WhatsApp).
- `gravar.mjs` grava o **site publicado** no Chrome invisível, com `--force-device-scale-factor=3` (sem isso, a gravação sai em 360×640). Ele tem uma tela inicial ("Aplicativo · Breve História da Igreja · Como utilizar"), as legendas (verde `#16463A`, filete dourado, letras brancas, escolha do autor), as marcas de toque e a tela final com QR Code.
- **O script depende dos seletores do site:** `#btnComecar`, `#btnInicio`, `.epoca-btn[data-epoca]`, `.parada`, `.titulo`, `#painelFechar`, `#painelConteudo`, `#btnRoteiros`, `#campoBusca`, `.rot-btn[data-roteiro="reforma"]`, `#btnApresentar`, `#btnProximo`, e do evento "Reforma Protestante". Ao renomear algo assim no site, atualize o `gravar.mjs` e gere o vídeo de novo.
- Os sons e a música são sintetizados em `sons.py`, sem direitos autorais. Uma `musica.wav` própria e uma futura `narracao.wav` (44,1 kHz) colocadas em `video/` são misturadas automaticamente. Ainda não há narração; o texto para gravar está em `video/roteiro.md`.

## Testes

- Servidor local: `python -m http.server 8080` na pasta do projeto (ou o servidor "site" de `.claude/launch.json`) e acesse `http://localhost:8080`. Abrir o `index.html` direto do disco não funciona (o site lê o JSON).
- Teste no celular (375×812), no celular deitado (812×375), no desktop, no projetor no modo apresentação (1280×720 e 1024×768) e no modo escuro. Confira se as setas do rodapé ficam visíveis.
- No navegador interno do app, com o painel escondido, as animações e os temporizadores ficam pausados: as capturas de tela podem mostrar estados intermediários. Confira por JavaScript antes de concluir que é defeito.
- O service worker e o cache de memória do navegador podem servir arquivos antigos durante os testes: recarregue ou aumente a versão.
- Tarefas agendadas rodam sem ninguém para aprovar permissões. Uma tentativa anterior não conseguiu ligar o servidor local por isso. Não agende tarefas que dependam de aprovação (servidor, instalação, publicação).
