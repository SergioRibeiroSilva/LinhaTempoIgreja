"""Gera os efeitos sonoros e a trilha musical do vídeo, e mistura tudo num único áudio.

Uso (na pasta video/):  python sons.py
  Lê    saida/eventos.json (momento de cada clique, deslize, tecla...) e saida/quadros.json (duração)
  Grava saida/audio.wav
Todos os sons são sintetizados aqui (sem arquivos de terceiros), então não há questões de direitos autorais.
Para usar uma música própria, coloque um arquivo musica.wav (44,1 kHz) nesta pasta: ele substitui a trilha gerada.
Narração futura: coloque narracao.wav nesta pasta (já sincronizada com o vídeo) e ela será misturada, com a música mais baixa.

Requer: numpy
"""
import json
import wave
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
SAIDA = AQUI / "saida"
SR = 44100
rng = np.random.default_rng(7)


def t_(seg):
    return np.arange(int(seg * SR)) / SR


def env(n, ataque, decaimento):
    """Envelope com ataque linear e decaimento exponencial (em segundos)."""
    t = np.arange(n) / SR
    a = np.clip(t / max(ataque, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - ataque, 0) / decaimento)


def passa_baixa(x, corte):
    """Filtro passa-baixa simples de um polo."""
    a = np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


# ---------- efeitos ----------
def clique():
    t = t_(0.06)
    corpo = np.sin(2 * np.pi * 1850 * t) * env(len(t), 0.001, 0.012)
    estalo = rng.normal(0, 1, len(t)) * env(len(t), 0.0005, 0.003)
    grave = np.sin(2 * np.pi * 420 * t) * env(len(t), 0.001, 0.02)
    return 0.5 * corpo + 0.25 * estalo + 0.35 * grave


def tecla():
    t = t_(0.04)
    f = rng.uniform(2600, 3400)
    return 0.35 * np.sin(2 * np.pi * f * t) * env(len(t), 0.0005, 0.006) + 0.15 * rng.normal(0, 1, len(t)) * env(len(t), 0.0003, 0.002)


def deslizar():
    n = int(0.42 * SR)
    ruido = rng.normal(0, 1, n)
    # varredura: o ruído filtrado sobe e desce de brilho
    cortes = np.concatenate([np.linspace(600, 3800, n // 2), np.linspace(3800, 900, n - n // 2)])
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        a = np.exp(-2 * np.pi * cortes[i] / SR)
        acc = (1 - a) * ruido[i] + a * acc
        y[i] = acc
    forma = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return 0.9 * y * forma


def sino(freqs, dur=2.4, vol=0.32):
    t = t_(dur)
    y = np.zeros(len(t))
    for k, f in enumerate(freqs):
        for h, (mult, amp) in enumerate(((1, 1.0), (2.76, 0.25), (5.4, 0.08))):
            y += amp * np.sin(2 * np.pi * f * mult * t) * env(len(t), 0.004, dur / (2.2 + h * 1.5)) * (0.85 ** k)
    return vol * y / len(freqs)


EFEITOS = {
    "clique": (clique, 0.55),
    "tecla": (tecla, 0.35),
    "deslizar": (deslizar, 0.32),
    "entrada": (lambda: sino([659.25, 987.77, 1318.5]), 0.6),   # mi, si, mi
    "transicao": (lambda: sino([440.0, 659.25], dur=1.8, vol=0.25), 0.5),  # passagem da tela inicial para o app
    "final": (lambda: sino([523.25, 783.99, 1046.5, 1318.5], dur=3.2), 0.7),  # dó maior
}


# ---------- trilha musical: acordes suaves (pad) com arpejo leve ----------
def musica(duracao):
    acordes = [  # progressão calma em Ré maior: D, Bm, G, A
        [146.83, 220.00, 293.66, 369.99],
        [123.47, 185.00, 246.94, 293.66],
        [98.00, 196.00, 246.94, 293.66],
        [110.00, 220.00, 277.18, 329.63],
    ]
    compasso = 4.6
    t = t_(duracao)
    pad = np.zeros(len(t))
    arp = np.zeros(len(t))
    for i in range(int(duracao / compasso) + 1):
        notas = acordes[i % 4]
        ini = int(i * compasso * SR)
        n = int((compasso + 1.2) * SR)  # sobreposição para transição suave
        tt = np.arange(n) / SR
        forma = np.clip(tt / 1.0, 0, 1) * np.clip((compasso + 1.2 - tt) / 1.2, 0, 1)
        bloco = np.zeros(n)
        for f in notas:
            for det in (-0.6, 0.6):  # leve desafinação = som mais encorpado
                bloco += np.sin(2 * np.pi * (f + det) * tt) + 0.3 * np.sin(2 * np.pi * 2 * (f + det) * tt)
        fim = min(ini + n, len(t))
        pad[ini:fim] += (bloco * forma)[: fim - ini]
        # arpejo de sino, bem suave, uma nota por tempo
        for k in range(8):
            f = notas[(k % 3) + 1] * 2
            p = ini + int(k * compasso / 8 * SR)
            m = int(1.4 * SR)
            if p >= len(t):
                break
            ttt = np.arange(m) / SR
            nota = np.sin(2 * np.pi * f * ttt) * env(m, 0.005, 0.45)
            e = min(p + m, len(t))
            arp[p:e] += nota[: e - p]
    pad = passa_baixa(pad / np.max(np.abs(pad)), 1400)
    y = 0.75 * pad / np.max(np.abs(pad)) + 0.18 * arp / max(np.max(np.abs(arp)), 1e-9)
    # entrada e saída graduais
    entrada = np.clip(t / 1.2, 0, 1)
    saida = np.clip((duracao - t) / 2.5, 0, 1)
    return y * entrada * saida


def ler_wav(caminho):
    with wave.open(str(caminho)) as w:
        dados = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
        if w.getnchannels() == 2:
            dados = dados.reshape(-1, 2).mean(axis=1)
        if w.getframerate() != SR:
            raise SystemExit(f"{caminho.name}: use 44100 Hz")
    return dados


# ---------- mistura ----------
duracao = json.loads((SAIDA / "quadros.json").read_text())["duracao"]
eventos = json.loads((SAIDA / "eventos.json").read_text())
total = int((duracao + 0.5) * SR)
mix = np.zeros(total)

narracao = AQUI / "narracao.wav"
tem_narracao = narracao.exists()
musica_propria = AQUI / "musica.wav"
fundo = ler_wav(musica_propria)[:total] if musica_propria.exists() else musica(duracao)
mix[: len(fundo)] += fundo * (0.16 if tem_narracao else 0.30)
if tem_narracao:
    voz = ler_wav(narracao)[:total]
    mix[: len(voz)] += voz * 0.95

cache = {}
for ev in eventos:
    gerar, vol = EFEITOS[ev["tipo"]]
    som = gerar() if ev["tipo"] in ("tecla",) else cache.setdefault(ev["tipo"], gerar())
    ini = int(ev["t"] * SR)
    fim = min(ini + len(som), total)
    if ini < total:
        mix[ini:fim] += vol * som[: fim - ini]

pico = np.max(np.abs(mix))
mix = mix / pico * 0.89 if pico > 0.89 else mix
estereo = np.repeat((mix * 32767).astype(np.int16)[:, None], 2, axis=1)
with wave.open(str(SAIDA / "audio.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(estereo.tobytes())
print(f"audio.wav: {duracao:.1f} s, {len(eventos)} efeitos, música {'própria' if musica_propria.exists() else 'gerada'}"
      f"{', com narração' if tem_narracao else ''}")
