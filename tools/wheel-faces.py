#!/usr/bin/env python3
"""룰렛 참가자 캐릭터 10종을 "룰렛 플레이어화면.png" 에서 오려냅니다.

  python3 tools/wheel-faces.py
  -> 룰렛/faces/p01.png ... p10.png   (참가자 1번부터 10번까지)

이 그림들이 룰렛 칸과 참가자 목록에 함께 쓰입니다.
원본이 작아서(배지 한 개가 48px) 키운 뒤 살짝 또렷하게 다듬습니다.
"""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "룰렛", "룰렛 플레이어화면.png")
OUT = os.path.join(ROOT, "룰렛", "faces")

# 배지 자리 — 그림에서 잰 값입니다. 그림을 바꾸면 다시 재야 합니다.
X0, X1 = 32, 76          # 배지 좌우
Y_FIRST = 94.5           # 1번 배지 세로 가운데
PITCH = 50.67            # 줄 간격
HALF = 22                # 배지 세로 반지름

NAMES = ["곰", "고양이", "판다", "토끼", "여우",
         "호랑이", "강아지", "코알라", "너구리", "부엉이"]

SIZE = 144               # 내보낼 크기
CORNER = 0.26            # 모서리 둥근 정도 (변 길이 대비)


def main():
    im = Image.open(SRC).convert("RGB")
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))

    mask = Image.new("L", (SIZE * 4, SIZE * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, SIZE * 4 - 1, SIZE * 4 - 1], radius=round(SIZE * 4 * CORNER), fill=255)
    mask = mask.resize((SIZE, SIZE), Image.LANCZOS)      # 계단 없는 둥근 모서리

    for i in range(10):
        cy = Y_FIRST + i * PITCH
        chip = im.crop((X0, round(cy - HALF), X1, round(cy + HALF)))
        chip = chip.resize((SIZE, SIZE), Image.LANCZOS)
        chip = chip.filter(ImageFilter.UnsharpMask(radius=2.2, percent=95, threshold=2))
        chip = chip.convert("RGBA")
        chip.putalpha(mask)
        chip.quantize(colors=192, method=Image.FASTOCTREE).save(
            os.path.join(OUT, "p%02d.png" % (i + 1)), optimize=True)
        print("p%02d %s" % (i + 1, NAMES[i]))


if __name__ == "__main__":
    main()
