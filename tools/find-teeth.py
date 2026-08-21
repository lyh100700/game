#!/usr/bin/env python3
"""이빨화면.jpg 에서 이빨 20개를 찾아 좌표·조각 그림·잇몸색을 뽑습니다.

  python3 tools/find-teeth.py

  - 이빨/teeth/t01.png ...   이빨 한 개씩 오려낸 그림 (배경 투명)
  - 콘솔에 game.js 의 TEETH 배열에 넣을 값이 찍힙니다.
"""
import os, sys
from collections import deque
from PIL import Image, ImageFilter, ImageDraw, ImageStat

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "이빨", "이빨화면.jpg")
OUT = os.path.join(ROOT, "이빨", "teeth")


def is_tooth(r, g, b):
    """이빨색 — 밝고 누런 상아색. 잇몸(빨강)·혀(분홍)·피부(파랑)는 걸러집니다."""
    return g > 100 and b > 80 and r > 130 and 12 < (r - b) < 110 and (r - g) < 62


def blobs(im, scale=4, floor=0.12, mincells=300):
    W, H = im.size
    sm = im.resize((W // scale, H // scale), Image.BILINEAR)
    w, h = sm.size
    px = sm.load()
    mask = bytearray(w * h)
    for y in range(int(h * floor), h):
        for x in range(w):
            if is_tooth(*px[x, y]):
                mask[y * w + x] = 1
    seen = bytearray(w * h)
    found = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not mask[i] or seen[i]:
                continue
            q = deque([(x, y)])
            seen[i] = 1
            cells = []
            while q:
                cx, cy = q.popleft()
                cells.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and mask[ny * w + nx] and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        q.append((nx, ny))
            if len(cells) < mincells:
                continue
            xs = [c[0] * scale for c in cells]
            ys = [c[1] * scale for c in cells]
            found.append(dict(x0=min(xs), y0=min(ys), x1=max(xs) + scale, y1=max(ys) + scale,
                              cx=sum(xs) / len(xs), cy=sum(ys) / len(ys)))
    return found


def not_tooth(r, g, b):
    """확실히 이빨이 아닌 곳 — 잇몸(붉음)·입안(어두움)·피부(푸름)."""
    return (r - g) > 72 or max(r, g, b) < 72 or b > r


def cut(im, box, pad):
    """이빨 한 개를 오려내고 둘레를 부드럽게 지웁니다."""
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    part = im.crop((x0, y0, x1, y1))
    w, h = part.size
    a = Image.new("L", (w, h), 0)
    ImageDraw.Draw(a).ellipse([2, 2, w - 3, h - 3], fill=255)

    # 타원 안에서도 잇몸·입안·피부는 지웁니다.
    # (그늘진 이빨까지 살리려고 "이빨색" 이 아니라 "확실히 아닌 색" 으로 거릅니다)
    px = part.load()
    ap = a.load()
    for y in range(h):
        for x in range(w):
            if ap[x, y] and not_tooth(*px[x, y]):
                ap[x, y] = 0
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    a = a.filter(ImageFilter.GaussianBlur(2.2))
    part = part.convert("RGBA")
    part.putalpha(a)
    return part, (x0, y0, x1, y1)


def gum_color(im, box, pad=26):
    """이빨 둘레(잇몸)의 색 — 이빨이 빠진 자리를 칠할 때 씁니다."""
    x0, y0, x1, y1 = box
    n, rs, gs, bs = 0, 0, 0, 0
    for x in range(x0, x1, 4):
        for y in (max(0, y0 - pad), min(im.height - 1, y1 + pad - 1)):
            r, g, b = im.getpixel((x, y))
            if not is_tooth(r, g, b):
                rs, gs, bs, n = rs + r, gs + g, bs + b, n + 1
    for y in range(y0, y1, 4):
        for x in (max(0, x0 - pad), min(im.width - 1, x1 + pad - 1)):
            r, g, b = im.getpixel((x, y))
            if not is_tooth(r, g, b):
                rs, gs, bs, n = rs + r, gs + g, bs + b, n + 1
    if not n:
        return (150, 40, 34)
    return (rs // n, gs // n, bs // n)


def band_mean(im, x0, y0, x1, y1, fallback):
    """띠 안의 잇몸·입안 색만 평균 냅니다.
       이빨(밝은 상아색)과 피부(푸른색)는 빼야 지운 자리가 얼룩지지 않습니다."""
    n = rs = gs = bs = 0
    for x in range(max(0, x0), min(im.width, x1)):
        for y in range(max(0, y0), min(im.height, y1)):
            r, g, b = im.getpixel((x, y))
            if b > r or is_tooth(r, g, b):
                continue
            rs, gs, bs, n = rs + r, gs + g, bs + b, n + 1
    if not n:
        return fallback
    return (rs / n, gs / n, bs / n)


def erase_tooth(im, box, vertical, gum, pad=18):
    """이빨을 지우고 그 자리를 잇몸~입안 색으로 이어 줍니다.
       바깥쪽(잇몸)에서 안쪽(입안)으로 색을 이어 칠하므로 자연스러운 빈자리가 됩니다."""
    from PIL import ImageStat, ImageFilter
    x0, y0, x1, y1 = box
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    w, h = x1 - x0, y1 - y0
    band = 12
    patch = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(patch)
    if vertical:
        for x in range(w):
            T = band_mean(im, x0 + x, y0 - band, x0 + x + 1, y0, gum)
            B = band_mean(im, x0 + x, y1, x0 + x + 1, y1 + band, gum)
            for y in range(h):
                t = y / max(1, h - 1)
                d.point((x, y), fill=tuple(round(T[c] + (B[c] - T[c]) * t) for c in range(3)))
    else:
        for y in range(h):
            L = band_mean(im, x0 - band, y0 + y, x0, y0 + y + 1, gum)
            R = band_mean(im, x1, y0 + y, x1 + band, y0 + y + 1, gum)
            for x in range(w):
                t = x / max(1, w - 1)
                d.point((x, y), fill=tuple(round(L[c] + (R[c] - L[c]) * t) for c in range(3)))
    patch = patch.filter(ImageFilter.GaussianBlur(4))

    feather = 14
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse([feather * .4, feather * .4, w - feather * .4, h - feather * .4], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather))
    im.paste(patch, (x0, y0), mask)


def main():
    im = Image.open(SRC).convert("RGB")
    W, H = im.size
    found = blobs(im)
    # 위·아래 두 무리로 나눈 뒤, 입을 따라 도는 순서로 정렬합니다
    found.sort(key=lambda b: (round(b["cy"] / 70), b["cx"]))
    print("찾은 이빨:", len(found))
    if len(found) != 20:
        print("!! 20개가 아닙니다. is_tooth 조건을 손봐야 합니다.", file=sys.stderr)

    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        os.remove(os.path.join(OUT, f))

    # 그늘져서 작게 잡힌 이빨은 이웃과 같은 크기로 넓혀 줍니다
    med_w = sorted(b["x1"] - b["x0"] for b in found)[len(found) // 2]
    med_h = sorted(b["y1"] - b["y0"] for b in found)[len(found) // 2]
    for b in found:
        cx, cy = (b["x0"] + b["x1"]) / 2, (b["y0"] + b["y1"]) / 2
        bw = max(b["x1"] - b["x0"], med_w)
        bh = max(b["y1"] - b["y0"], med_h)
        b["x0"], b["x1"] = round(cx - bw / 2), round(cx + bw / 2)
        b["y0"], b["y1"] = round(cy - bh / 2), round(cy + bh / 2)

    rows = []
    for i, b in enumerate(found):
        box = (b["x0"], b["y0"], b["x1"], b["y1"])
        part, real = cut(im, box, 10)
        name = "t%02d.png" % (i + 1)
        half = part.resize((part.width // 2, part.height // 2), Image.LANCZOS)
        half.quantize(colors=192, method=Image.FASTOCTREE).save(
            os.path.join(OUT, name), optimize=True)
        rows.append(dict(
            name=name,
            x=(real[0] + real[2]) / 2 / W * 100,
            y=(real[1] + real[3]) / 2 / H * 100,
            w=(real[2] - real[0]) / W * 100,
            h=(real[3] - real[1]) / H * 100,
            gum=gum_color(im, box),
            up=b["cy"] / H < 0.5,
        ))

    # 이빨을 모두 지운 "잇몸만" 배경. 게임에서는 이 위에 이빨 조각 20개를 얹습니다.
    gums = im.copy()
    for b, r in zip(found, rows):
        cy = (b["y0"] + b["y1"]) / 2 / H * 100
        erase_tooth(gums, (b["x0"], b["y0"], b["x1"], b["y1"]),
                    vertical=abs(cy - 52) > 25, gum=r["gum"])
    gums.save(os.path.join(ROOT, "이빨", "이빨화면-잇몸.jpg"), quality=88, optimize=True)
    print("잇몸 배경 저장 완료")

    print("\n/* tools/find-teeth.py 가 뽑은 값입니다. 손으로 고치지 마세요. */")
    print("  var TEETH = [")
    for r in rows:
        print('    { x: %.2f, y: %.2f, w: %.2f, h: %.2f, up: %s, gum: "#%02x%02x%02x" },' %
              (r["x"], r["y"], r["w"], r["h"], "true " if r["up"] else "false", *r["gum"]))
    print("  ];")


if __name__ == "__main__":
    main()
