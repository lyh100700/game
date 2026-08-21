#!/usr/bin/env python3
"""룰렛 그림에서 칸마다 들어 있는 동물 얼굴 10개를 오려냅니다.

  python3 tools/wheel-faces.py
  -> 룰렛/faces/f01.png ... f10.png

얼굴 자리는 그림에서 눈으로 읽은 값입니다(그림 크기에 대한 %).
그림을 바꾸면 이 표를 다시 맞춰야 합니다 — 아래 CHECK 그림으로 확인하세요.
번호는 12시 방향부터 시계방향으로 1..10 입니다.
(원본 그림에 찍힌 숫자는 5·8이 뒤섞여 있어 쓰지 않습니다.)
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "룰렛", "KakaoTalk_Photo_2026-08-21-16-36-48.jpeg")
OUT = os.path.join(ROOT, "룰렛", "faces")

#        가로%,  세로%,  무엇
SPOTS = [(49.6, 27.4, "곰"),
         (64.6, 31.6, "고양이"),
         (72.3, 44.7, "판다"),
         (75.5, 59.6, "토끼"),
         (65.9, 71.4, "호랑이"),
         (49.4, 77.6, "강아지"),
         (34.7, 72.4, "여우"),
         (24.2, 61.5, "코알라"),
         (26.6, 44.4, "너구리"),
         (36.0, 33.0, "아기여우")]


def main():
    im = Image.open(SRC).convert("RGB")
    W, H = im.size
    rad = round(W * 0.067)
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))

    for i, (px, py, what) in enumerate(SPOTS):
        fx, fy = px / 100 * W, py / 100 * H
        crop = im.crop((round(fx - rad), round(fy - rad), round(fx + rad), round(fy + rad)))
        s = crop.size[0]
        a = Image.new("L", (s, s), 0)
        ImageDraw.Draw(a).ellipse([1, 1, s - 2, s - 2], fill=255)
        a = a.filter(ImageFilter.GaussianBlur(1.4))
        crop = crop.convert("RGBA")
        crop.putalpha(a)
        crop = crop.resize((168, 168), Image.LANCZOS)
        crop.quantize(colors=192, method=Image.FASTOCTREE).save(
            os.path.join(OUT, "f%02d.png" % (i + 1)), optimize=True)
        print("f%02d %s" % (i + 1, what))


if __name__ == "__main__":
    main()
