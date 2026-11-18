"""Gera os ícones do aplicativo: cruz sobre uma linha do tempo, em dourado sobre fundo escuro.

Uso (na pasta do projeto):  python ferramentas/gerar_icones.py
  Grava img/icone-512.png, img/icone-192.png e img/icone-180.png

Requer: Pillow (pip install pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

destino = Path(__file__).resolve().parent.parent / "img"
S = 1024  # desenha grande e reduz, para bordas suaves
FUNDO = (43, 38, 32)
OURO = (217, 176, 90)
OURO_ESCURO = (168, 123, 34)

im = Image.new("RGB", (S, S), FUNDO)
d = ImageDraw.Draw(im)
for r in range(420, 0, -6):  # brilho suave no centro
    a = int(18 * (1 - r / 420))
    d.ellipse((S / 2 - r, S * .45 - r, S / 2 + r, S * .45 + r), fill=tuple(min(255, c + a) for c in FUNDO))

# cruz (dentro da área segura dos ícones "maskable": círculo de 80% do lado)
cx, w = S / 2, 44
d.rounded_rectangle((cx - w / 2, 250, cx + w / 2, 600), radius=10, fill=OURO)
d.rounded_rectangle((cx - 130, 350 - w / 2, cx + 130, 350 + w / 2), radius=10, fill=OURO)

# linha do tempo com marcos
y = 700
d.rounded_rectangle((210, y - 10, S - 210, y + 10), radius=10, fill=OURO_ESCURO)
for x, r, cheio in ((290, 30, False), (cx, 44, True), (S - 290, 30, False)):
    if cheio:
        d.ellipse((x - r, y - r, x + r, y + r), fill=OURO)
    else:
        d.ellipse((x - r, y - r, x + r, y + r), fill=FUNDO, outline=OURO, width=14)

for tamanho in (512, 192, 180):
    im.resize((tamanho, tamanho), Image.LANCZOS).save(destino / f"icone-{tamanho}.png", optimize=True)
print("ícones gravados em", destino)
