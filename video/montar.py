"""Monta o vídeo final a partir dos quadros gravados e do áudio.

Uso (na pasta video/):  python montar.py
  Lê    saida/quadros/*.jpg, saida/quadros.json e saida/audio.wav
  Grava saida/tutorial.mp4 (1080x1920, 30 quadros/s, H.264 + AAC), pronto para WhatsApp, Reels e Shorts

Requer: imageio-ffmpeg (traz o programa FFmpeg)
"""
import json
import subprocess
from pathlib import Path

import imageio_ffmpeg

AQUI = Path(__file__).resolve().parent
SAIDA = AQUI / "saida"
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

info = json.loads((SAIDA / "quadros.json").read_text())
quadros, duracao = info["quadros"], info["duracao"]

# Lista com a duração de cada quadro (a gravação só gera quadros quando a tela muda)
linhas = []
for atual, prox in zip(quadros, quadros[1:] + [{"t": duracao}]):
    linhas.append(f"file 'quadros/{atual['nome']}'")
    linhas.append(f"duration {max(prox['t'] - atual['t'], 0.001):.4f}")
linhas.append(f"file 'quadros/{quadros[-1]['nome']}'")  # o FFmpeg exige repetir o último quadro
(SAIDA / "lista.txt").write_text("\n".join(linhas), encoding="utf-8")

saida = SAIDA / "tutorial.mp4"
cmd = [
    ffmpeg, "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", str(SAIDA / "lista.txt"),
    "-i", str(SAIDA / "audio.wav"),
    "-vf", "fps=30,scale=1080:1920:flags=lanczos,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-profile:v", "high",
    # volume no padrão de redes sociais (-16 LUFS), com picos limitados
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100",
    "-c:a", "aac", "-b:a", "160k",
    "-t", f"{duracao:.3f}", "-movflags", "+faststart",
    str(saida),
]
subprocess.run(cmd, check=True, cwd=SAIDA)
print(f"{saida.name}: {saida.stat().st_size / 1024 / 1024:.1f} MB, {duracao:.1f} s")
