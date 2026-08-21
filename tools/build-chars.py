#!/usr/bin/env python3
"""캐릭터/ 의 원본 그림에서 검은 바탕을 지워 앱에서 쓸 그림을 만듭니다.

  python3 tools/build-chars.py
  -> shared/art/char/<이름>.png   (정사각형, 배경 투명)

세 게임(룰렛·사다리·스톱워치)이 이 그림들을 함께 씁니다.
목록은 shared/chars.js 에 있습니다.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from imglib import cutout
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "캐릭터")
OUT = os.path.join(ROOT, "shared", "art", "char")

SIZE = 240
FILL = 0.96          # 정사각형 안에서 캐릭터가 차지하는 비율

# 파일 이름(한글) -> 코드에서 쓸 이름
IDS = {
    "강아지": "dog", "개구리": "frog", "고양이": "cat", "곰": "bear",
    "공룡": "dino", "나무늘보": "sloth", "여우": "fox", "우파루파": "axolotl",
    "유니콘": "unicorn", "코알라": "koala", "토끼": "rabbit",
    "판다": "panda", "펭귄": "penguin",
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))

    for ko, en in sorted(IDS.items()):
        path = os.path.join(SRC, ko + ".jpg")
        if not os.path.exists(path):
            print("!! 원본 없음:", path, file=sys.stderr)
            continue
        art = cutout(path, thresh=46)

        # 정사각형 가운데에 비율 그대로 앉힙니다 (잘리지 않게)
        box = round(SIZE * FILL)
        w, h = art.size
        k = box / max(w, h)
        art = art.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        canvas.alpha_composite(art, ((SIZE - art.size[0]) // 2, (SIZE - art.size[1]) // 2))

        dst = os.path.join(OUT, en + ".png")
        canvas.quantize(colors=224, method=Image.FASTOCTREE).save(dst, optimize=True)
        print("%-8s %-9s %5.0fKB" % (ko, en, os.path.getsize(dst) / 1024))


if __name__ == "__main__":
    main()
