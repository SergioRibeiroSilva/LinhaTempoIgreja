"""Gera os QR Codes do site e de cada roteiro (PNG e SVG) e a lista usada pela folha de impressão.

Uso (na pasta do projeto):  python ferramentas/gerar_qrcodes.py
  Lê    data/eventos.json (roteiros)
  Grava qrcodes/site.*, qrcodes/roteiro-<id>.* e qrcodes/qrcodes.json
Rode de novo sempre que criar, renomear ou apagar um roteiro; a folha qrcodes/imprimir.html se atualiza sozinha.

Requer: segno (pip install segno)
"""
import json
from pathlib import Path

import segno

RAIZ = Path(__file__).resolve().parent.parent
BASE = "https://sergioribeirosilva.github.io/LinhaTempoIgreja/"
COR = "#2b2620"

dados = json.loads((RAIZ / "data/eventos.json").read_text(encoding="utf-8"))
destino = RAIZ / "qrcodes"
destino.mkdir(exist_ok=True)

itens = [{"arquivo": "site", "nome": "Linha do tempo completa", "url": BASE,
          "descricao": "Todos os eventos, do ano 0 a 2000.", "qtd": len(dados["eventos"])}]
for r in dados["roteiros"]:
    itens.append({"arquivo": f"roteiro-{r['id']}", "nome": r["nome"], "url": f"{BASE}?roteiro={r['id']}",
                  "descricao": r["descricao"], "qtd": len(r["eventos"])})

for it in itens:
    # nível Q de correção de erros: continua legível com o papel um pouco amassado ou manchado
    qr = segno.make(it["url"], error="q", boost_error=False)
    qr.save(destino / f"{it['arquivo']}.png", scale=20, border=4, dark=COR, light="white")
    qr.save(destino / f"{it['arquivo']}.svg", scale=10, border=4, dark=COR, light="white", xmldecl=False, svgns=True)
    it["versao"] = qr.designator
    print(f"{it['arquivo']:28} {qr.designator:5} {it['url']}")

(destino / "qrcodes.json").write_text(json.dumps(itens, ensure_ascii=False, indent=2), encoding="utf-8")
