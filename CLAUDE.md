# GAMES! — 미니게임 모음

네 가지 복불복 미니게임을 한 앱에 모은 프로젝트입니다.
메인 화면에서 게임을 고르고, 각 게임은 자기 폴더 안에서 완결됩니다.

## 구조

```
game/
├── index.html              메인 선택화면
├── main.css / main.js
├── games.js                게임 매니페스트
├── manifest.webmanifest    PWA 설정
├── sw.js                   서비스 워커 (오프라인)
├── 앱아이콘.png            메인 화면 마스코트 (배경을 지운 투명 PNG)
├── icons/                  앱 아이콘 (스타트 화면/앱아이콘.jpeg 에서 생성)
├── shared/
│   ├── theme.css           색·버튼·팝업 등 공통 토큰
│   ├── progress.js         플레이 횟수 기록 (localStorage)
│   ├── art.js              그림이 있으면 얹고 없으면 물러나는 헬퍼
│   ├── sound.js            효과음 엔진 (Web Audio 합성)
│   └── art/                생성한 그림 (배경·캐릭터·썸네일·스톱워치 부품)
├── tools/
│   ├── build-assets.py     첨부 사진 -> 앱에서 쓰는 파일 만들기
│   ├── find-teeth.py       이빨화면.jpg 에서 이빨 20개 오려내기
│   ├── wheel-faces.py      플레이어화면에서 캐릭터 10개 오려내기
│   └── imglib.py           검은 배경 지우기·비율 맞추기
├── 이빨/       DINO CHOMP    공룡 이빨 누르기
├── 사다리/     LADDER PATH   사다리 타기
├── 스톱워치/   MULTIPLY TIME 시간 곱하기
└── 룰렛/       PRIZE WHEEL   룰렛 돌리기
```

각 게임 폴더는 `index.html` · `style.css` · `game.js` 로 같은 구성입니다.

## 규칙

- **스택**: 순수 HTML/CSS/JS. 빌드 도구·프레임워크·외부 CDN 없음.
- **독립성**: 게임은 `shared/` 만 참조하고 다른 게임 파일은 건드리지 않는다.
- **전역 오염 금지**: `game.js` 는 IIFE 로 감싼다. 전역은 `Sfx`·`Progress`·`GAMES` 뿐.
- **CSS 스코프**: 게임 고유 클래스는 그 게임 `style.css` 에만 둔다.
  공통으로 쓸 것은 `shared/theme.css` 로 올린다.
- **세로 화면 기준**: 폰 세로 비율이 기본. `.screen` 이 최대 480px 로 가운데 정렬된다.
- **게임은 한 화면**: 네 게임 모두 스크롤 없이 한 화면에 들어가야 한다.
  높이는 `100vh` 가 아니라 **`100svh`** 를 쓴다. `vh` 는 주소창이 숨은 상태의 높이라
  폰에서 아래가 잘리거나 밀린다. 안에서는 `flex: 1 1 auto` + `min-height: 0` 으로 남는
  높이를 나눠 갖고, 고정 픽셀 높이 대신 `clamp(..., ..svh, ...)` 를 쓴다.
  (메인 선택화면은 목록이라 예외 — 스크롤해도 된다.)
- **효과음**: 오디오 파일을 쓰지 않는다. `shared/sound.js` 에서 Web Audio 로 합성한다.
  새 소리가 필요하면 그 파일의 `SOUNDS` 에 추가한다.
- **접근성**: `prefers-reduced-motion` 을 존중한다 (theme.css 에서 일괄 처리).

## 화면 자료

`games.txt` 에 각 게임의 기획이, 폴더마다 기준이 된 화면 이미지가 들어 있습니다.

- **이빨**: `이빨화면-잇몸.jpg`(이빨을 모두 지운 배경) 위에 `teeth/t01~t20.png`
  (진짜 이빨 조각)을 얹는 구조입니다. 그래서 이빨을 누르면 조각이 잇몸 속으로 빠지고
  빈 자리가 그대로 드러납니다.
  좌표·조각·잇몸색은 모두 `tools/find-teeth.py` 가 `이빨화면.jpg` 에서 뽑아 줍니다.
  **손으로 맞추지 말고 그 스크립트를 다시 돌리세요.**
  (`game.js` 의 D 키 조정 모드는 스크립트가 어긋났을 때 확인용으로 남겨 두었습니다.)
- **룰렛**: 참가자 캐릭터 10종(곰·고양이·판다·토끼·여우·호랑이·강아지·코알라·너구리·부엉이)은
  `tools/wheel-faces.py` 가 **`룰렛 플레이어화면.png`** 에서 오려낸
  `룰렛/faces/p01~p10.png` 입니다. **룰렛 칸과 참가자 목록이 같은 그림을 씁니다.**
  룰렛판 자체는 `KakaoTalk_Photo_2026-08-21-16-36-48.jpeg` 를 본떠 SVG 로 그렸습니다.
  그림을 그대로 쓰지 않은 이유는 둘입니다 — 원본에 찍힌 숫자가 뒤섞여 있고(5 두 개, 8 없음),
  참가자 수(2~10)에 따라 칸 수가 바뀌어야 하기 때문입니다.
- **나머지 둘**: 스크린샷에 UI 가 함께 찍혀 있어 배경으로 쓸 수 없습니다.
  같은 톤을 CSS 로 재현했습니다.

## 그림 자산

원본 사진은 `스타트 화면/` 과 `스톱워치/` 에 그대로 두고,
앱이 쓰는 파일은 아래 명령으로 **다시 만들 수 있게** 해 두었습니다.

```bash
python3 tools/build-assets.py     # Pillow 만 있으면 됩니다
```

- 앱 아이콘 (`icons/*.png`) 과 마스코트 (`앱아이콘.png`) — 검은 배경을 지워 투명하게
- 카드 썸네일 (`shared/art/thumb-*.jpg`) — 96:84 비율로 가장자리를 늘려 맞춤
- 스톱워치 부품 (`shared/art/watch-*.png|jpg`)
  - `watch-board.jpg` 는 원본에 **적혀 있던 숫자를 지운** 판입니다.
    실제 값은 `스톱워치/style.css` 에서 백분율 좌표로 그 자리에 얹습니다.
    좌표를 다시 뽑으려면 `build-assets.py` 출력의 "결과판 좌표(%)" 를 보세요.
  - `watch-star.png` 는 "계속" 글자를 지운 별입니다. 화면에서 시작·멈춤·완료를 얹습니다.
  - `watch-star-stop.png` 는 멈춤 상태용으로 보라색만 분홍으로 옮긴 별입니다.
  - `watch-cloud.png` 는 늘 "초기화" 라서 그려진 글자를 그대로 씁니다.
  - `watch-board.png` 는 투명 PNG 입니다. JPG 로 두면 검은 바탕이 화면 위에
    네모로 드러납니다.

이빨·룰렛 그림은 따로 만듭니다.

```bash
python3 tools/find-teeth.py    # 이빨/teeth/*.png + 이빨화면-잇몸.jpg
python3 tools/wheel-faces.py   # 룰렛/faces/*.png
```

## 게임 추가하기

1. 게임 이름으로 폴더를 만들고 `index.html` / `style.css` / `game.js` 를 만든다.
2. `games.js` 의 `GAMES` 배열에 한 줄 추가한다.
3. `main.js` 의 `THUMBS` 에 예비 SVG 를, `main.css` 에 `.thumb--<이름>` 배경색을 추가하고,
   `shared/art/thumb-<이름>.jpg` 그림을 넣는다 (그림이 있으면 SVG 를 덮습니다).
4. `sw.js` 의 `ASSETS` 에 새 파일 경로를 넣고 `VERSION` 을 올린다.

## 실행

빌드 없이 `index.html` 을 열면 되지만, **로컬 서버로 여는 것을 권합니다.**
`file://` 로 열면 서비스 워커가 동작하지 않고 한글 경로에서 문제가 생길 수 있습니다.

```bash
python3 -m http.server 8000
```

## 배포와 앱 설치

[ANDROID.md](ANDROID.md) 참고. GitHub Pages 로 배포하고 PWABuilder 로 APK 를 만듭니다.
**내용을 고친 뒤에는 `sw.js` 의 `VERSION` 을 반드시 올리세요.**

`.nojekyll` 은 GitHub Pages 가 파일을 임의로 가공하지 않도록 막는 빈 파일입니다. 지우지 마세요.
