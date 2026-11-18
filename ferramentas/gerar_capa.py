"""Gera a imagem de compartilhamento (1200x630) usada na prévia do WhatsApp e redes sociais.

Uso (na pasta do projeto):  python ferramentas/gerar_capa.py
  Lê    img/<id>-640.webp (mosaico de pinturas) e img/icone-192.png
  Grava img/compartilhar.jpg
Usa fontes do Windows (Garamond, Georgia e Segoe UI). Depois de mudar a capa, o WhatsApp
pode demorar a mostrar a nova prévia (ele guarda as prévias por um tempo).

Requer: Pillow (pip install pillow)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
pasta_img = RAIZ / "img"
saida = Path(sys.argv[1]) if len(sys.argv) > 1 else pasta_img / "compartilhar.jpg"  # opcional: outro destino
W, H = 1200, 630
FUNDO = (33, 29, 24)
CREME = (244, 236, 220)
OURO = (217, 176, 90)
SUAVE = (190, 176, 152)
F = Path("C:/Windows/Fonts")
serif_bold = lambda s: ImageFont.truetype(str(F / "GARABD.TTF"), s)
serif = lambda s: ImageFont.truetype(str(F / "georgia.ttf"), s)
sans = lambda s: ImageFont.truetype(str(F / "segoeui.ttf"), s)
sans_b = lambda s: ImageFont.truetype(str(F / "segoeuib.ttf"), s)

# Pinturas do mosaico (ids de eventos com imagem), na ordem: coluna esquerda (2), direita (3)
TILES = ["reforma-protestante", "concilio-niceia", "joao-huss", "queda-constantinopla", "vulgata"]

im = Image.new("RGB", (W, H), FUNDO)


def sepia(img):
    cinza = ImageOps.grayscale(img)
    tom = ImageOps.colorize(cinza, (40, 28, 16), (250, 232, 196))
    return Image.blend(img.convert("RGB"), tom, 0.45)


# --- mosaico de pinturas à direita ---
x0, gap = 640, 8
cols = [(x0, 280), (x0 + 280 + gap, W - (x0 + 280 + gap))]
alturas = [[300, H - 300 - gap], [210, 200, H - 410 - 2 * gap]]
k = 0
for (cx, cw), hs in zip(cols, alturas):
    y = 0
    for h in hs:
        src = Image.open(pasta_img / f"{TILES[k]}-640.webp").convert("RGB")
        k += 1
        src = ImageOps.fit(src, (cw, h), Image.LANCZOS, centering=(0.5, 0.3))
        im.paste(ImageEnhance.Contrast(sepia(src)).enhance(1.05), (cx, y))
        y += h + gap

# leve escurecimento do mosaico e brilho dourado atrás do título
sombra = Image.new("L", (W, H), 0)
ImageDraw.Draw(sombra).rectangle((x0, 0, W, H), fill=70)
im.paste(Image.new("RGB", (W, H), (20, 16, 12)), (0, 0), sombra.filter(ImageFilter.GaussianBlur(2)))
brilho = Image.new("L", (W, H), 0)
ImageDraw.Draw(brilho).ellipse((-120, 60, 620, 560), fill=40)
im.paste(Image.new("RGB", (W, H), (92, 70, 34)), (0, 0), brilho.filter(ImageFilter.GaussianBlur(90)))
d = ImageDraw.Draw(im)

# --- ícone ---
icone = Image.open(pasta_img / "icone-192.png").convert("RGB").resize((76, 76), Image.LANCZOS)
masc = Image.new("L", (76, 76), 0)
ImageDraw.Draw(masc).rounded_rectangle((0, 0, 75, 75), radius=18, fill=255)
im.paste(icone, (72, 70), masc)
d.rounded_rectangle((72, 70, 147, 145), radius=18, outline=(120, 96, 52), width=2)


def espacado(xy, texto, fonte, cor, espaco):
    x, y = xy
    for ch in texto:
        d.text((x, y), ch, font=fonte, fill=cor)
        x += d.textlength(ch, font=fonte) + espaco


# --- textos ---
espacado((74, 182), "BREVE", serif(26), OURO, 14)
d.text((70, 214), "História", font=serif_bold(92), fill=CREME)
d.text((70, 306), "da Igreja", font=serif_bold(92), fill=CREME)
d.text((74, 420), "Dois mil anos de fé, em 125 momentos", font=serif(29), fill=SUAVE)

# --- linha do tempo ---
y, x1, x2 = 505, 78, 560
d.rounded_rectangle((x1, y - 2, x2, y + 2), radius=2, fill=(150, 116, 52))
for ano in (0, 476, 1453, 1789, 2000):
    x = x1 + (x2 - x1) * ano / 2000
    d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=FUNDO, outline=OURO, width=3)
    rot = str(ano)
    tw = d.textlength(rot, font=sans_b(17))
    d.text((x - tw / 2, y + 18 if ano != 1789 else y - 40), rot, font=sans_b(17), fill=SUAVE)

d.text((76, 575), "Linha do tempo interativa  ·  Pr. Sérgio Ribeiro", font=sans(19), fill=(150, 138, 118))
d.rectangle((0, 0, W - 1, H - 1), outline=(70, 56, 34), width=2)

im.save(saida, "JPEG", quality=86, optimize=True, progressive=True)
print(saida, im.size, round(saida.stat().st_size / 1024), "KB")
