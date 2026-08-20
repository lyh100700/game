#!/bin/bash
# 직접 만든 그림을 제자리에 넣습니다.
#   bash tools/put-art.sh ch-cat ~/Downloads/Gemini_Generated_Image_abc.png
#
# 크기를 줄이고 jpg 로 바꿔 shared/art/ 에 저장합니다.
set -e

ID="$1"
SRC="$2"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "$ID" ] || [ -z "$SRC" ]; then
  echo "사용법: bash tools/put-art.sh <이름> <받은파일>"
  echo
  echo "이름 목록:"
  node "$ROOT/tools/gen-art.mjs" --list | sed 's/^/  /'
  exit 1
fi

if [ ! -f "$SRC" ]; then
  echo "파일을 찾을 수 없습니다: $SRC"
  exit 1
fi

# 배경은 세로로 길게, 나머지는 정사각형 아이콘
case "$ID" in
  bg-*) MAX=1600 ;;
  *)    MAX=512  ;;
esac

DEST="$ROOT/shared/art/$ID.jpg"
mkdir -p "$ROOT/shared/art"

sips -s format jpeg -s formatOptions 82 -Z "$MAX" "$SRC" --out "$DEST" >/dev/null
echo "✓ $ID → shared/art/$ID.jpg  ($(du -h "$DEST" | cut -f1))"
echo
echo "브라우저를 새로고침하면 바로 보입니다."
echo "다 넣었으면 sw.js 의 VERSION 을 올리고 커밋하세요."
