#!/usr/bin/env python3
"""첨부 그림 -> 앱에서 쓰는 파일 만들기.

  스타트 화면/앱아이콘.jpeg  -> 앱아이콘.png (투명) + icons/*.png
  스타트 화면/...003~006     -> shared/art/thumb-*.jpg (카드 썸네일)
  스톱워치/...001~004        -> shared/art/watch-*.png (스톱워치 화면 부품)

  python3 tools/build-assets.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from imglib import cutout, trim_black, pad_to_ratio
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START = os.path.join(ROOT, "스타트 화면")
WATCH = os.path.join(ROOT, "스톱워치")
ART = os.path.join(ROOT, "shared", "art")
ICONS = os.path.join(ROOT, "icons")

GREEN_IN = (36, 82, 64)      # 아이콘 배경 — 가운데
GREEN_OUT = (12, 40, 32)     # 아이콘 배경 — 바깥


def radial(size, inner, outer):
    """가운데가 밝은 원형 그라데이션. 동심원을 겹쳐 그립니다."""
    im = Image.new("RGB", (size, size), outer)
    d = ImageDraw.Draw(im)
    steps = 120
    for i in range(steps, 0, -1):
        t = i / steps
        r = size * 0.78 * t
        c = tuple(round(outer[j] + (inner[j] - outer[j]) * (1 - t) ** 1.4) for j in range(3))
        d.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r], fill=c)
    return im


def square(rgba, size, fill_ratio, bg):
    """정사각 아이콘 위에 그림을 비율대로 얹습니다."""
    out = bg.resize((size, size), Image.LANCZOS)
    box = round(size * fill_ratio)
    w, h = rgba.size
    s = box / max(w, h)
    art = rgba.resize((max(1, round(w * s)), max(1, round(h * s))), Image.LANCZOS)
    out = out.convert("RGBA")
    out.alpha_composite(art, ((size - art.size[0]) // 2, (size - art.size[1]) // 2))
    return out


def build_icon():
    src = cutout(os.path.join(START, "앱아이콘.jpeg"))
    save_png(src, os.path.join(ROOT, "앱아이콘.png"), 560)   # 메인 화면 마스코트 (투명)

    bg = radial(1024, GREEN_IN, GREEN_OUT)
    os.makedirs(ICONS, exist_ok=True)
    square(src, 512, 0.96, bg).convert("RGB").save(os.path.join(ICONS, "icon-512.png"))
    square(src, 192, 0.96, bg).convert("RGB").save(os.path.join(ICONS, "icon-192.png"))
    square(src, 180, 0.96, bg).convert("RGB").save(os.path.join(ICONS, "apple-touch-icon.png"))
    # 마스크 아이콘은 둥글게 잘려도 괜찮도록 안쪽 78% 안에만 그립니다
    square(src, 512, 0.72, bg).convert("RGB").save(os.path.join(ICONS, "icon-maskable-512.png"))
    print("아이콘 생성 완료", src.size)


THUMBS = {
    "dino":   "KakaoTalk_Photo_2026-08-21-15-47-23 003.jpeg",
    "ladder": "KakaoTalk_Photo_2026-08-21-15-47-23 004.jpeg",
    "watch":  "KakaoTalk_Photo_2026-08-21-15-47-23 005.jpeg",
    "wheel":  "KakaoTalk_Photo_2026-08-21-15-47-23 006.jpeg",
}


def build_thumbs():
    os.makedirs(ART, exist_ok=True)
    for key, name in THUMBS.items():
        im = trim_black(os.path.join(START, name), thresh=34, inset=0.022)
        im = pad_to_ratio(im, 96 / 84).resize((288, 252), Image.LANCZOS)
        im.save(os.path.join(ART, "thumb-%s.jpg" % key), quality=90, optimize=True)
        print("썸네일", key, im.size)




# ---------- 스톱워치 화면 부품 ----------

def dark_bbox(im, region, thresh=120, pad=0):
    """영역 안에서 어두운 픽셀(글자·테두리)이 차지하는 사각형을 찾습니다."""
    x0, y0, x1, y1 = region
    sub = im.crop(region).convert("L").point(lambda v: 255 if v < thresh else 0)
    b = sub.getbbox()
    if not b:
        return None
    return (x0 + b[0] - pad, y0 + b[1] - pad, x0 + b[2] + pad, y0 + b[3] + pad)


def erase_ink(im, box, span, feather=12, grain=None):
    """box 안의 어두운 글자를 지우고 종이결만 남깁니다.

    1) 밝은 색을 번지게 해서(MaxFilter) 글자를 덮고
    2) 지운 자리 바로 바깥의 밝기에 맞춰 되돌린 뒤
    3) 깨끗한 종이에서 뜬 결을 다시 얹습니다.
    span 은 지울 획의 최대 굵기(px)."""
    from PIL import ImageFilter, ImageDraw, ImageStat, ImageChops
    x0, y0, x1, y1 = [round(v) for v in box]
    w, h = x1 - x0, y1 - y0
    f = 4
    small = im.crop((x0, y0, x1, y1)).resize((max(1, w // f), max(1, h // f)), Image.BILINEAR)
    small = small.filter(ImageFilter.MaxFilter(max(3, int(span / f) | 1)))
    patch = small.resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(f * 1.6))

    # 지운 자리 바로 바깥(좌·우 띠)의 실제 밝기에 맞춥니다
    band = 14
    want = ImageStat.Stat(im.crop((x0 - band, y0, x0, y1))).mean[:3]
    want2 = ImageStat.Stat(im.crop((x1, y0, x1 + band, y1))).mean[:3]
    got = ImageStat.Stat(patch.crop((0, 0, band, h))).mean[:3]
    got2 = ImageStat.Stat(patch.crop((w - band, 0, w, h))).mean[:3]
    lut = []
    for c in range(3):
        top = (want[c] + want2[c]) or 1
        bot = (got[c] + got2[c]) or 1
        lut += [min(255, round(v * top / bot)) for v in range(256)]
    patch = patch.point(lut)

    if grain:                                   # 종이결 되살리기
        tile = Image.new("RGB", (w, h))
        g = im.crop(grain)
        for gy in range(0, h, g.height):
            for gx in range(0, w, g.width):
                tile.paste(g, (gx, gy))
        detail = ImageChops.subtract(tile, tile.filter(ImageFilter.GaussianBlur(9)),
                                     scale=1, offset=128)
        patch = ImageChops.add(patch, detail, scale=1, offset=-128)

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle(
        [feather, feather, w - feather - 1, h - feather - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather * 0.6))
    im.paste(patch, (x0, y0), mask)


def grain_detail(im, box, w, h, strength=0.5):
    """깨끗한 자리에서 종이·별 표면의 결만 떠서 box 크기로 이어 붙입니다.
       좌우·상하를 거울처럼 뒤집어 이어 붙이므로 이음매가 보이지 않습니다."""
    from PIL import ImageFilter, ImageChops
    g = im.crop(box)
    gw, gh = g.size
    unit = Image.new("RGB", (gw * 2, gh * 2))
    unit.paste(g, (0, 0))
    unit.paste(g.transpose(Image.FLIP_LEFT_RIGHT), (gw, 0))
    unit.paste(g.transpose(Image.FLIP_TOP_BOTTOM), (0, gh))
    unit.paste(g.transpose(Image.ROTATE_180), (gw, gh))
    tile = Image.new("RGB", (w, h))
    for y in range(0, h, gh * 2):
        for x in range(0, w, gw * 2):
            tile.paste(unit, (x, y))
    d = ImageChops.subtract(tile, tile.filter(ImageFilter.GaussianBlur(9)),
                            scale=1, offset=128)
    return Image.blend(Image.new("RGB", (w, h), (128, 128, 128)), d, strength)


def erase_grad(im, box, feather=26, band=30, grain=None):
    """box 를 좌·우 바깥 색을 가로로 이어 붙인 그라데이션으로 덮습니다.
       매끈한 면(별·구름) 위의 글자를 지울 때 씁니다."""
    from PIL import ImageFilter, ImageDraw, ImageStat, ImageChops
    x0, y0, x1, y1 = [round(v) for v in box]
    w, h = x1 - x0, y1 - y0
    patch = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(patch)
    for y in range(h):
        L = ImageStat.Stat(im.crop((x0 - band, y0 + y, x0, y0 + y + 1))).mean[:3]
        R = ImageStat.Stat(im.crop((x1, y0 + y, x1 + band, y0 + y + 1))).mean[:3]
        for x in range(0, w, 4):
            t = x / max(1, w - 1)
            d.rectangle([x, y, x + 3, y],
                        fill=tuple(round(L[c] + (R[c] - L[c]) * t) for c in range(3)))
    patch = patch.filter(ImageFilter.GaussianBlur(3))
    if grain:
        patch = ImageChops.add(patch, grain_detail(im, grain, w, h, 0.45),
                               scale=1, offset=-128)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle(
        [feather, feather, w - feather - 1, h - feather - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather * 0.6))
    im.paste(patch, (x0, y0), mask)


def erase_flat(im, box, feather=16, band=16, grain=None):
    """box 를 통째로 종이색으로 덮습니다.
       줄마다 좌·우 바깥 색을 평균 내서 칠하므로 위아래 그늘이 그대로 이어집니다."""
    from PIL import ImageFilter, ImageDraw, ImageStat, ImageChops
    x0, y0, x1, y1 = [round(v) for v in box]
    w, h = x1 - x0, y1 - y0
    patch = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(patch)
    for y in range(h):
        L = ImageStat.Stat(im.crop((x0 - band, y0 + y, x0, y0 + y + 1))).mean[:3]
        R = ImageStat.Stat(im.crop((x1, y0 + y, x1 + band, y0 + y + 1))).mean[:3]
        d.line([(0, y), (w, y)], fill=tuple(round((L[c] + R[c]) / 2) for c in range(3)))
    patch = patch.filter(ImageFilter.GaussianBlur(2))

    if grain:
        patch = ImageChops.add(patch, grain_detail(im, grain, w, h, 0.5),
                               scale=1, offset=-128)

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rectangle(
        [feather, feather, w - feather - 1, h - feather - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather * 0.6))
    im.paste(patch, (x0, y0), mask)


def save_png(im, path, longest):
    """화면에서 쓰는 크기에 맞춰 줄여서 저장합니다 (폰에 담을 파일이라 용량이 중요)."""
    w, h = im.size
    if max(w, h) > longest:
        k = longest / max(w, h)
        im = im.resize((round(w * k), round(h * k)), Image.LANCZOS)
    im.quantize(colors=224, method=Image.FASTOCTREE).save(path, optimize=True)
    print(os.path.basename(path), im.size, "%.0fKB" % (os.path.getsize(path) / 1024))


def build_watch():
    from imglib import cutout as _cut
    os.makedirs(ART, exist_ok=True)
    src = os.path.join(WATCH, "KakaoTalk_Photo_2026-08-21-15-48-39 %s.jpeg")

    # --- 결과판: 붙박이 숫자를 지우고 뼈대만 남깁니다 ---
    board = Image.open(src % "001").convert("RGB")
    W, H = board.size
    spots = {}

    GRAIN = (860, 430, 990, 555)          # ×표 아래 빈 종이 — 결을 뜨는 곳

    for key, region in (("t1", (95, 232, 400, 320)), ("t2", (498, 232, 800, 320))):
        b = dark_bbox(board, region)
        spots[key] = b
        erase_ink(board, (b[0] - 20, b[1] - 18, b[2] + 20, b[3] + 18), 26, 12, GRAIN)

    b = dark_bbox(board, (1080, 300, 1350, 510))
    spots["total"] = b
    erase_flat(board, (b[0] - 48, b[1] - 44, b[2] + 48, b[3] + 44), 22, 16, GRAIN)

    # 다이얼 안쪽 숫자는 화면에서 우리 원판이 덮으므로 지우지 않습니다
    for key, (cx, cy) in (("d1", (235, 406)), ("d2", (638, 406))):
        spots[key] = (cx - 30, cy - 40, cx + 30, cy + 40)

    erase_ink(board, (24, 524, 210, 574), 20, 10)   # 구석의 흐린 서명 지우기

    board.resize((980, round(980 * H / W)), Image.LANCZOS).save(
        os.path.join(ART, "watch-board.jpg"), quality=88, optimize=True)

    print("결과판 좌표(%):")
    for k, b in spots.items():
        print("  %-6s x %.2f%%  y %.2f%%  w %.2f%%  h %.2f%%" % (
            k, (b[0] + b[2]) / 2 / W * 100, (b[1] + b[3]) / 2 / H * 100,
            (b[2] - b[0]) / W * 100, (b[3] - b[1]) / H * 100))

    # --- 안내용 시간 그림, 별·구름 버튼 ---
    save_png(_cut(src % "002", thresh=46), os.path.join(ART, "watch-hint.png"), 760)

    # 구름은 늘 "초기화" 라서 그려진 글자를 그대로 씁니다.
    save_png(_cut(src % "004", thresh=46), os.path.join(ART, "watch-cloud.png"), 520)

    # 별은 시작·멈춤·완료로 글자가 바뀌므로, 그려진 "계속" 을 지우고
    # 화면에서 우리 글자를 얹습니다.
    art = _cut(src % "003", thresh=46)
    rgb, a = art.convert("RGB"), art.getchannel("A")
    erase_grad(rgb, (350, 546, 1082, 1000), feather=26, band=34,
               grain=(280, 990, 520, 1180))
    rgb.putalpha(a)
    save_png(rgb, os.path.join(ART, "watch-star.png"), 520)

    # 멈춤 상태용 분홍 별. 보라색 부분의 색상만 옮기고
    # 발바닥·테두리(주황·갈색)는 건드리지 않습니다.
    hsv = rgb.convert("HSV")
    hue, sat, val = hsv.split()
    lut = []
    for v in range(256):
        lut.append((v + 62) % 256 if 155 <= v <= 205 else v)   # 보라 -> 분홍
    hue = hue.point(lut)
    sat = sat.point(lambda v: min(255, round(v * 1.18)))
    pink = Image.merge("HSV", (hue, sat, val)).convert("RGB")
    pink.putalpha(a)
    save_png(pink, os.path.join(ART, "watch-star-stop.png"), 520)


if __name__ == "__main__":
    build_icon()
    build_thumbs()
    build_watch()
