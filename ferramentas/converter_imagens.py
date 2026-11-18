"""Converte imagens para WebP nos dois tamanhos usados pelo site.

Uso (na pasta do projeto):  python ferramentas/converter_imagens.py [origem] [destino]
  origem   padrão: ferramentas/imagens/originais  (o nome do arquivo deve ser o id do evento)
  destino  padrão: img
Gera <id>.webp (até 1200 px de largura) e <id>-640.webp (640 px).
Imagens mais altas que 3/4 da largura são recortadas; a posição vertical do recorte
(0 = topo, 1 = base, padrão 0.25) pode ser ajustada em ferramentas/imagens/posicoes.json.
Só os arquivos presentes na origem são (re)gerados; as demais imagens do site não são tocadas.

Requer: Pillow (pip install pillow)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
origem = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / "ferramentas/imagens/originais"
destino = Path(sys.argv[2]) if len(sys.argv) > 2 else RAIZ / "img"
arq_pos = RAIZ / "ferramentas/imagens/posicoes.json"
posicoes = json.loads(arq_pos.read_text(encoding="utf-8")) if arq_pos.exists() else {}

PROPORCAO_MAX = 0.75  # o site exibe as imagens em 16:10
Image.MAX_IMAGE_PIXELS = 60_000_000
destino.mkdir(parents=True, exist_ok=True)

total = 0
for arq in sorted(origem.iterdir()):
    if arq.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"}:
        continue
    ident = arq.stem
    with Image.open(arq) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "L"):
            fundo = Image.new("RGB", im.size, (251, 247, 238))
            im = im.convert("RGBA")
            fundo.paste(im, mask=im.split()[-1])
            im = fundo
        im = im.convert("RGB")
        altura_max = round(im.width * PROPORCAO_MAX)
        if im.height > altura_max:
            topo = round((im.height - altura_max) * posicoes.get(ident, 0.25))
            im = im.crop((0, topo, im.width, topo + altura_max))
        for largura, sufixo, qualidade in ((1200, "", 78), (640, "-640", 74)):
            copia = im.copy()
            if copia.width > largura:
                copia = copia.resize((largura, round(copia.height * largura / copia.width)), Image.LANCZOS)
            saida = destino / f"{ident}{sufixo}.webp"
            copia.save(saida, "WEBP", quality=qualidade, method=6)
            total += saida.stat().st_size
        print(f"{ident}: {im.width}x{im.height}")
print(f"total gerado: {total // 1024} KB")
