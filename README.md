<div align="center">

<img src="img/icone-192.png" alt="" width="96" height="96">

# Breve História da Igreja

**Dois mil anos de fé, em 125 momentos.**

Uma linha do tempo interativa da história da Igreja, do ano 0 ao ano 2000,<br>
feita para o celular e pronta para a sala de aula.

[**Acessar o site**](https://sergioribeirosilva.github.io/LinhaTempoIgreja/) ·
[Como usar](#como-usar) ·
[Editar o conteúdo](#editar-o-conteúdo) ·
[Créditos](#créditos)

</div>

---

<table align="center">
  <tr>
    <td align="center"><b>125</b><br><sub>eventos</sub></td>
    <td align="center"><b>4</b><br><sub>épocas</sub></td>
    <td align="center"><b>9</b><br><sub>categorias</sub></td>
    <td align="center"><b>7</b><br><sub>roteiros de aula</sub></td>
    <td align="center"><b>22</b><br><sub>obras de arte</sub></td>
  </tr>
</table>

## Sobre

Este site transforma o material *Linha do Tempo – História da Igreja* (jan/2025), do **Pr. Sérgio Ribeiro**, numa experiência que se percorre com o dedo. Cada época tem cor e atmosfera próprias, os marcos principais são ilustrados com pinturas históricas, e cada evento traz um texto curto com fonte de referência.

O tom é **protestante e respeitoso**: os desenvolvimentos doutrinários são apresentados com seu contexto histórico, seguidos da **posição da Reforma** sobre cada um.

## Recursos

| | |
|---|---|
| **Linha do tempo horizontal** | Deslize no celular, use as setas do teclado ou a roda do mouse. Cada época (Antiga, Média, Moderna e Contemporânea) muda as cores e o fundo. |
| **Painel de detalhes** | Toque num cartão para ler o texto completo, a fonte, a posição da Reforma e o crédito da imagem. |
| **Explorar** | Busca por evento, pessoa ou ano (sem se preocupar com acentos), filtros por categoria e roteiros de aula. |
| **Modo apresentação** | Tela cheia com letras grandes para projetor ou TV, compatível com passador de slides. |
| **Funciona sem internet** | Depois da primeira visita, o site abre mesmo offline e pode ser instalado no celular como aplicativo. |
| **Links diretos** | Cada evento, roteiro e filtro tem endereço próprio, ideal para QR Codes. |
| **Modo escuro** | Acompanha automaticamente a configuração do aparelho. |

## Como usar

**No celular:** deslize para os lados para avançar no tempo e toque num cartão para ler. A barra no topo leva direto a cada época. Para instalar, abra o menu **Explorar** e toque em *Instalar no aparelho* (no iPhone: *Compartilhar → Adicionar à Tela de Início*).

**Na sala de aula:** abra **Explorar**, escolha um roteiro e toque em **Apresentar**. A aula está pronta.

<details>
<summary><b>Atalhos de teclado</b></summary>

| Tecla | Ação |
|---|---|
| `→` `←` ou `PageDown` `PageUp` | Próximo / anterior (também funciona com passador de slides) |
| `Home` `End` | Primeiro / último evento |
| `P` | Liga ou desliga o modo apresentação |
| `/` | Abre a busca |
| `Esc` | Fecha o painel ou sai da apresentação |

</details>

### Roteiros de aula

| Roteiro | Eventos | Link |
|---|:---:|---|
| A Igreja Primitiva (51–313) | 19 | `?roteiro=igreja-primitiva` |
| Os Concílios | 24 | `?roteiro=concilios` |
| Doutrinas: Roma e a Reforma | 18 | `?roteiro=doutrinas` |
| A Reforma Protestante | 19 | `?roteiro=reforma` |
| A Bíblia através dos séculos | 13 | `?roteiro=biblia` |
| Avivamentos e Missões | 17 | `?roteiro=avivamentos` |
| O Protestantismo no Brasil | 7 | `?roteiro=brasil` |

### Links diretos

Acrescente ao endereço do site:

- `?roteiro=reforma` abre um roteiro;
- `?cat=concilios,biblia` mostra só as categorias escolhidas;
- `#reforma-protestante` abre direto o painel de um evento (o nome vem do campo `id` em `data/eventos.json`).

Exemplo: `https://sergioribeirosilva.github.io/LinhaTempoIgreja/?roteiro=reforma`

### QR Codes

A pasta [`qrcodes/`](qrcodes/) tem um QR Code para o site e um para cada roteiro, em **PNG** (para impressão comum) e **SVG** (para banners, sem perder qualidade). A folha [`qrcodes/imprimir.html`](qrcodes/imprimir.html) reúne tudo em duas páginas A4, um cartaz para o mural e um quadro com os roteiros, prontas para imprimir.

A versão on-line da folha fica em `https://sergioribeirosilva.github.io/LinhaTempoIgreja/qrcodes/imprimir.html`.

## Editar o conteúdo

Todo o conteúdo fica em **`data/eventos.json`**, que pode ser editado com qualquer editor de texto simples. Cuidado com as aspas `"` e as vírgulas: elas são necessárias.

<details>
<summary><b>Corrigir ou acrescentar eventos</b></summary>

<br>

Cada evento tem esta forma:

```json
{
  "id": "reforma-protestante",
  "ano": 1517,
  "titulo": "Reforma Protestante",
  "categoria": "reforma",
  "resumo": "Texto que aparece no cartão e no painel.",
  "fonte": "De onde veio a informação",
  "destaque": true,
  "imagem": "img/reforma-protestante.webp",
  "imagemCredito": { "titulo": "...", "autor": "...", "licenca": "...", "pagina": "..." }
}
```

| Campo | O que é |
|---|---|
| `id` | Nome curto, sem acentos nem espaços. **Não pode se repetir.** Também é usado no link direto. |
| `ano` | Ano do evento (número). |
| `aprox` | `true` se a data for aproximada (mostra "c." antes do ano). |
| `anoFim` | Ano final, quando o evento durou vários anos. |
| `titulo` | Título do cartão. |
| `categoria` | `concilios`, `doutrina`, `movimentos`, `avivamento`, `biblia`, `perseguicao`, `reforma`, `teologos` ou `historia`. |
| `resumo` | Texto principal. |
| `reforma` | Opcional: a posição da Reforma sobre o tema. |
| `brasil` | `true` marca o evento com "· Brasil". |
| `destaque` | `true` exibe o evento em cartão grande, com imagem. |
| `fonte` | Referência bibliográfica. |
| `nota` | Observação interna (não aparece no site), como correções de data. |

- Mantenha os eventos **em ordem de ano**.
- Para **acrescentar**, copie um bloco existente, altere os campos e cole no lugar certo, separado por vírgula.
- Para **apagar**, remova o bloco inteiro, incluindo as chaves `{ }` e a vírgula.
- Uma nova categoria precisa ser cadastrada também na seção `"categorias"`, com nome e cor.

</details>

<details>
<summary><b>Criar ou alterar roteiros de aula</b></summary>

<br>

Os roteiros ficam na seção `"roteiros"`. Cada um é uma lista de `id`s de eventos:

```json
{
  "id": "reforma",
  "nome": "A Reforma Protestante",
  "descricao": "Precursores, a Reforma e seus desdobramentos (1328-1611).",
  "eventos": ["wycliffe", "joao-huss", "reforma-protestante", "biblia-lutero"]
}
```

Se um `id` estiver escrito errado, aquele evento simplesmente não aparece; o site continua funcionando.

</details>

<details>
<summary><b>Trocar ou acrescentar imagens</b></summary>

<br>

- As imagens ficam em `img/`, em formato **WebP**, sempre em duas versões: `nome.webp` (cerca de 1200 px de largura) e `nome-640.webp` (cerca de 640 px).
- O campo `imagem` do evento aponta para a versão grande; o evento precisa ter `"destaque": true`.
- **Sempre inclua o crédito** em `imagemCredito`. Use apenas imagens de domínio público, CC0 ou Creative Commons com atribuição.
- Para ajustar o enquadramento, use `imagemPosicao` (por exemplo, `"center 20%"` mostra mais a parte de cima).
- Para converter imagens em WebP, o [Squoosh](https://squoosh.app) funciona bem e é gratuito.

</details>

<details>
<summary><b>Depois de uma mudança importante: atualizar a versão</b></summary>

<br>

O arquivo `sw.js` guarda uma cópia do site nos aparelhos, para o uso offline. Ao fazer mudanças importantes (muitos textos, estilos, scripts ou imagens novas), aumente o número da versão no início do arquivo:

```js
const VERSAO = 'hdi-v3';   // mude para 'hdi-v4', depois 'hdi-v5'...
```

Assim, quem já visitou o site recebe a versão nova por completo.

</details>

### Testar no computador

O site precisa ser aberto por um servidor local (um duplo clique no `index.html` não carrega os eventos). Com o Python instalado, na pasta do projeto:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`. Para encerrar, pressione `Ctrl + C` no terminal.

## Publicação

O site é publicado gratuitamente pelo **GitHub Pages**, em `https://sergioribeirosilva.github.io/LinhaTempoIgreja/`.

1. No repositório, abra **Settings → Pages**.
2. Em *Build and deployment*, escolha **Deploy from a branch**, branch **`main`**, pasta **`/ (root)`**, e salve.
3. Em um ou dois minutos o site fica no ar. Cada novo `git push` atualiza o site automaticamente.

## Estrutura

```
├── index.html             estrutura da página
├── css/estilo.css         cores, temas das épocas, modo escuro e apresentação
├── js/app.js              navegação, painel, busca, roteiros e apresentação
├── data/eventos.json      conteúdo: eventos, categorias, épocas e roteiros
├── img/                   imagens dos marcos e ícones do aplicativo
├── qrcodes/               QR Codes do site e dos roteiros, e folha para impressão
├── sw.js                  funcionamento offline
└── manifest.webmanifest   dados para instalar como aplicativo
```

Feito com HTML, CSS e JavaScript puros, sem bibliotecas nem etapa de compilação.

## Créditos

**Conteúdo:** Pr. Sérgio Ribeiro, a partir do material *Linha do Tempo – História da Igreja* (jan/2025).

**Principais referências**

- Justo L. González, *História Ilustrada do Cristianismo*
- Earle E. Cairns, *O Cristianismo Através dos Séculos*
- Émile G. Léonard, *O Protestantismo Brasileiro*
- Alderi S. de Matos, *Os Pioneiros Presbiterianos do Brasil*
- Vinson Synan, *O Século do Espírito Santo*
- Isael de Araujo, *Dicionário do Movimento Pentecostal*

A fonte de cada evento aparece no painel de detalhes.

<details>
<summary><b>Imagens</b> (Wikimedia Commons)</summary>

<br>

| Ano | Evento | Obra | Licença |
|---|---|---|---|
| 51 | Concílio de Jerusalém | São Pedro e São Paulo · El Greco | [Domínio público](https://commons.wikimedia.org/wiki/File:El_Greco_-_Saint_Peter_and_Saint_Paul_-_Google_Art_Project.jpg) |
| 64 | Nero inicia a perseguição | As Tochas de Nero (1876) · Henryk Siemiradzki | [Domínio público](https://commons.wikimedia.org/wiki/File:Henryk_Siemiradzki_-_Pochodnie_Nerona.jpg) |
| 67 | Martírio de Paulo | São Paulo escrevendo suas cartas · Valentin de Boulogne | [Domínio público](https://commons.wikimedia.org/wiki/File:Valentin_de_Boulogne_-_Saint_Paul_Writing_His_Epistles_-_BF.1991.4_-_Museum_of_Fine_Arts.jpg) |
| 70 | Destruição de Jerusalém e do Templo | O Cerco e a Destruição de Jerusalém (1850) · David Roberts | [Domínio público](https://commons.wikimedia.org/wiki/File:David_Roberts_-_The_Siege_and_Destruction_of_Jerusalem_by_the_Romans_Under_the_Command_of_Titus,_A.D._70.jpg) |
| 312 | Conversão de Constantino | A Visão da Cruz · Escola de Rafael | [Domínio público](https://commons.wikimedia.org/wiki/File:School_of_Raphael_-_Vision_of_the_Cross.jpg) |
| 313 | Édito de Milão | Cabeça colossal de Constantino (Museus Capitolinos) · autor desconhecido | [Domínio público](https://commons.wikimedia.org/wiki/File:Head_Constantine_Musei_Capitolini_MC1072_(cropped).jpg) |
| 325 | Concílio de Niceia | Ícone do Primeiro Concílio de Niceia · autor desconhecido | [Domínio público](https://commons.wikimedia.org/wiki/File:Nicaea_icon.jpg) |
| 400 | Vulgata de Jerônimo | São Jerônimo · Caravaggio | [Domínio público](https://commons.wikimedia.org/wiki/File:Caravaggio_-_Saint_Jerome_-_Galleria_Borghese.jpg) |
| 476 | Queda do Império Romano do Ocidente | O Curso do Império: Destruição (1836) · Thomas Cole | [Domínio público](https://commons.wikimedia.org/wiki/File:Cole_Thomas_The_Course_of_Empire_Destruction_1836.jpg) |
| 622 | Início do Islã (Hégira de Maomé) | Mapa da expansão do califado · HistorianOfMuslimHistoryFromLithuania | [CC0](https://commons.wikimedia.org/wiki/File:Map_of_expansion_of_the_Caliphate.png) |
| 768 | Carlos Magno | Coroação de Carlos Magno · Friedrich Kaulbach | [Domínio público](https://commons.wikimedia.org/wiki/File:Friedrich_Kaulbach_-_Kr%C3%B6nung_Karls_des_Gro%C3%9Fen.jpg) |
| 1054 | Grande Cisma do Oriente | Cristo Pantocrator, mosaico da Déesis (Santa Sofia) · foto: Myrabella | [Domínio público](https://commons.wikimedia.org/wiki/File:Christ_Pantocrator_Deesis_mosaic_Hagia_Sophia.jpg) |
| 1099 | Primeira Cruzada toma Jerusalém | Tomada de Jerusalém pelos Cruzados (1847) · Émile Signol | [Domínio público](https://commons.wikimedia.org/wiki/File:Taking_of_Jerusalem_by_the_Crusaders,_15th_July_1099.jpg) |
| 1328 | João Wycliffe | Retrato de João Wycliffe · Thomas Kirkby | [Domínio público](https://commons.wikimedia.org/wiki/File:Wycliffe_by_Kirby.jpg) |
| 1415 | Martírio de João Huss | Huss no Concílio de Constança (1883) · Václav Brožík | [Domínio público](https://commons.wikimedia.org/wiki/File:Vaclav_Brozik_-_Hus.jpg) |
| 1440 | Prensa de Gutenberg | Bíblia de Gutenberg, livro de Gênesis · Johannes Gutenberg (impressor) | [Domínio público](https://commons.wikimedia.org/wiki/File:Gutenberg_Bible_B42_Genesis.JPG) |
| 1453 | Queda de Constantinopla | A Conquista de Constantinopla · Fausto Zonaro | [Domínio público](https://commons.wikimedia.org/wiki/File:Conquest_of_Constantinople,_Zonaro.jpg) |
| 1517 | Reforma Protestante | Lutero fixa as 95 teses (1872) · Ferdinand Pauwels | [Domínio público](https://commons.wikimedia.org/wiki/File:Ferdinand_Pauwels_-_Luther_hammers_his_95_theses_to_the_door.jpg) |
| 1611 | Versão King James | Folha de rosto da versão King James (1611) | [Domínio público](https://commons.wikimedia.org/wiki/File:KJV-King-James-Version-Bible-first-edition-title-page-1611.jpg) |
| 1739 | Início do movimento metodista | John Wesley pregando ao ar livre (gravura) · Wellcome Collection | [CC BY 4.0](https://commons.wikimedia.org/wiki/File:John_Wesley_preaching_outside_a_church._Engraving._Wellcome_V0006868.jpg) |
| 1906 | Avivamento da Rua Azusa | Missão da Fé Apostólica, Rua Azusa (1907) · Flower Pentecostal Heritage Center | [Domínio público](https://commons.wikimedia.org/wiki/File:Apostolic_Faith_Gospel_Mission_1907.jpg) |
| 1911 | Assembleia de Deus no Brasil | Gunnar Vingren · autor desconhecido | [Domínio público](https://commons.wikimedia.org/wiki/File:Gunnar_Vingren.jpg) |

</details>

**Fontes tipográficas:** [Cinzel](https://fonts.google.com/specimen/Cinzel) e [Inter](https://fonts.google.com/specimen/Inter), via Google Fonts.

---

<div align="center">
<sub>Os textos são de autoria do Pr. Sérgio Ribeiro. As imagens seguem as licenças indicadas acima.</sub>
</div>
