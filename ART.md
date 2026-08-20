# 그림 만들기 (제미나이 연동)

캐릭터와 배경을 제미나이로 만들어 게임에 적용하는 방법입니다.

## 1. API 키 발급 (처음 한 번만)

1. https://aistudio.google.com/apikey 접속 (구글 계정으로 로그인)
2. **Create API key** → 키 복사

## 2. 키 저장하기

프로젝트 폴더에서 아래 명령을 실행합니다. 따옴표 안에 키를 붙여넣으세요.

```bash
cd ~/Desktop/LYH/game
echo "여기에_복사한_키_붙여넣기" > .gemini-key
```

`.gemini-key` 는 `.gitignore` 에 등록되어 있어 **깃허브에 올라가지 않습니다.**
저장소가 공개라 이 부분이 특히 중요합니다.

## 3. 그림 만들기

```bash
node tools/gen-art.mjs
```

16장(배경 3 · 캐릭터 10 · 아이콘 3)이 `shared/art/` 에 저장됩니다.

| 명령 | 하는 일 |
|---|---|
| `node tools/gen-art.mjs` | 아직 없는 그림만 만듭니다 |
| `node tools/gen-art.mjs --list` | 무엇이 있고 없는지 봅니다 |
| `node tools/gen-art.mjs --only ch-cat --force` | 한 장만 다시 만듭니다 |
| `node tools/gen-art.mjs --force` | 전부 다시 만듭니다 |

## 4. 마음에 안 들면

[tools/art-manifest.mjs](tools/art-manifest.mjs) 의 문구를 고치고 그 장만 다시 만듭니다.

```bash
node tools/gen-art.mjs --only bg-sky --force
```

- `STYLE` 은 모든 그림에 공통으로 붙는 화풍 지시문입니다. 전체 분위기를 바꾸려면 여기를 고칩니다.
- 각 항목의 `prompt` 는 그 그림만의 내용입니다.

## 5. 올리기

```bash
# sw.js 의 VERSION 을 올린 뒤
git add -A
git commit -m "캐릭터·배경 그림 추가"
git push
```

---

## 그림이 없어도 게임은 돌아갑니다

**이게 이 구조의 핵심입니다.**

- **캐릭터·아이콘**: 이모지 위에 그림을 덮습니다. 파일이 없으면 `onerror` 로 스스로 사라져 이모지가 남습니다.
- **배경**: CSS 에서 그림을 그라데이션 위에 겹칩니다. 파일이 없으면 그라데이션이 그대로 보입니다.

그래서 16장 중 일부만 만들어도 되고, 마음에 드는 것만 남기고 나머지는 지워도 됩니다.

## 어디에 쓰이는지

| 그림 | 쓰이는 곳 |
|---|---|
| `bg-main.jpg` | 메인 선택화면 배경 |
| `bg-sky.jpg` | 스톱워치 · 룰렛 배경 |
| `bg-paper.jpg` | 사다리 배경 |
| `ch-*.png` | 사다리 캐릭터(8) · 룰렛 칸(10) · 참가자 목록 |
| `ic-trophy.png` / `ic-rock.png` | 사다리 당첨 · 꽝 |
| `ic-dino.png` | 예비 (메인 카드 썸네일용) |

## ⚠️ 비용

제미나이 이미지 생성은 무료 한도가 있지만 그 이상은 유료입니다.
16장을 한 번 만드는 정도는 부담이 크지 않지만, `--force` 로 반복해서 전부 다시
만들면 쌓입니다. 고칠 때는 `--only` 로 필요한 장만 만드세요.
현재 요금은 https://ai.google.dev/pricing 에서 확인하세요.
