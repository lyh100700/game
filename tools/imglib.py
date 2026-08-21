"""그림 손질 도구 — 검은 배경 지우기·비율 맞추기.
   외부 라이브러리 없이 Pillow 만 씁니다."""
from PIL import Image, ImageChops, ImageFilter, ImageOps
from collections import deque


def _outer_mask(lum, thresh, small=320):
    """가장자리와 이어진 '검은 배경' 영역을 찾습니다.
       작게 줄여서 채우기 탐색을 한 뒤 다시 키웁니다 (numpy 없이 빠르게)."""
    w, h = lum.size
    sw = small
    sh = max(1, round(h * small / w))
    tiny = lum.resize((sw, sh), Image.BILINEAR).point(lambda v: 255 if v < thresh else 0)
    px = tiny.load()

    seen = bytearray(sw * sh)
    q = deque()
    for x in range(sw):
        for y in (0, sh - 1):
            if px[x, y] and not seen[y * sw + x]:
                seen[y * sw + x] = 1
                q.append((x, y))
    for y in range(sh):
        for x in (0, sw - 1):
            if px[x, y] and not seen[y * sw + x]:
                seen[y * sw + x] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < sw and 0 <= ny < sh and not seen[ny * sw + nx] and px[nx, ny]:
                seen[ny * sw + nx] = 1
                q.append((nx, ny))

    out = Image.frombytes("L", (sw, sh), bytes(255 if b else 0 for b in seen))
    out = out.filter(ImageFilter.MaxFilter(5))          # 경계까지 넉넉히 덮고
    return out.resize((w, h), Image.BILINEAR)


def cutout(path, thresh=52, erode=3, blur=1.1):
    """검은 배경을 지운 RGBA 를 돌려줍니다."""
    im = Image.open(path).convert("RGB")
    lum = im.convert("L")
    outer = _outer_mask(lum, thresh)
    near_black = lum.point(lambda v: 255 if v < thresh else 0)

    # 바깥쪽이면서 검은 픽셀 = 지울 배경.
    # 글자 안쪽처럼 둘러싸여 갇힌 새까만 자리도 함께 지웁니다.
    bg = Image.composite(near_black, Image.new("L", im.size, 0),
                         outer.point(lambda v: 255 if v > 110 else 0))
    bg = ImageChops.lighter(bg, lum.point(lambda v: 255 if v < 20 else 0))

    alpha = ImageOps.invert(bg)
    if erode:
        alpha = alpha.filter(ImageFilter.MinFilter(erode))   # 검은 테두리 잔상 제거
    if blur:
        alpha = alpha.filter(ImageFilter.GaussianBlur(blur))
    alpha = alpha.point(lambda v: 0 if v < 24 else (255 if v > 232 else v))

    im.putalpha(alpha)
    return im.crop(alpha.getbbox() or im.getbbox())


def pad_to_ratio(im, ratio):
    """가장자리 픽셀을 늘려서 원하는 가로/세로 비율로 맞춥니다 (잘라내지 않음)."""
    w, h = im.size
    cur = w / h
    if abs(cur - ratio) < 0.004:
        return im
    if cur < ratio:                                  # 가로가 모자람
        nw = round(h * ratio)
        pad = (nw - w) // 2
        out = Image.new(im.mode, (nw, h))
        out.paste(im.crop((0, 0, 1, h)).resize((pad, h)), (0, 0))
        out.paste(im.crop((w - 1, 0, w, h)).resize((nw - w - pad, h)), (pad + w, 0))
        out.paste(im, (pad, 0))
    else:                                            # 세로가 모자람
        nh = round(w / ratio)
        pad = (nh - h) // 2
        out = Image.new(im.mode, (w, nh))
        out.paste(im.crop((0, 0, w, 1)).resize((w, pad)), (0, 0))
        out.paste(im.crop((0, h - 1, w, h)).resize((w, nh - h - pad)), (0, pad + h))
        out.paste(im, (0, pad))
    return out


def trim_black(path, thresh=40, inset=0.0):
    """검은 여백을 잘라낸 RGB 를 돌려줍니다. inset 은 잘라낸 뒤 안쪽으로 더 파고드는 비율."""
    im = Image.open(path).convert("RGB")
    box = im.convert("L").point(lambda v: 255 if v > thresh else 0).getbbox()
    im = im.crop(box)
    if inset:
        w, h = im.size
        dx, dy = round(w * inset), round(h * inset)
        im = im.crop((dx, dy, w - dx, h - dy))
    return im
