# Vídeo tutorial

Gera automaticamente um vídeo vertical (1080×1920, cerca de 37 s) mostrando como usar o site, com legendas, marcas de toque, sons e música. O roteiro e o texto para uma futura narração estão em [`roteiro.md`](roteiro.md).

## Como gerar (na pasta `video/`)

```bash
npm install
```

```bash
node gravar.mjs
```

```bash
python sons.py
```

```bash
python montar.py
```

O vídeo fica em `saida/tutorial.mp4` (cerca de 9 MB, dentro do limite de 16 MB do WhatsApp).

| Etapa | O que faz |
|---|---|
| `gravar.mjs` | Abre o site publicado no Chrome (invisível), simula um celular, executa as cenas e grava os quadros |
| `sons.py` | Cria os cliques, deslizes, teclas e sinos, e a trilha musical, e mistura tudo em `saida/audio.wav` |
| `montar.py` | Junta quadros e áudio no MP4 final, com o volume ajustado |

**Requisitos:** Node.js, Google Chrome instalado e Python com `numpy`, `pillow` e `imageio-ffmpeg`.

## Personalizar

- **Frases e tempos:** edite as cenas no final de `gravar.mjs` (e mantenha o `roteiro.md` igual).
- **Música própria:** coloque um arquivo `musica.wav` (44,1 kHz) nesta pasta. Ele substitui a trilha gerada.
- **Narração:** grave as frases do `roteiro.md`, monte um único `narracao.wav` (44,1 kHz) sincronizado com o vídeo e coloque nesta pasta. O `sons.py` mistura a voz e abaixa a música automaticamente.
- Depois de qualquer mudança, rode de novo as etapas necessárias (para mudar só o áudio, basta `sons.py` e `montar.py`).
