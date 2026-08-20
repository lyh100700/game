# 안드로이드 앱으로 설치하기

이 게임 모음을 폰에 앱으로 깔기 위한 절차입니다.

## 지금 상태

| 항목 | 값 |
|---|---|
| 앱 이름 | GAMES! |
| 방식 | PWA → TWA (웹앱을 감싼 안드로이드 앱) |
| 저장소 | 공개 (`lyh100700/game`) |
| 배포 | GitHub Pages — **배포 완료** (2026-08-20) |
| 주소 | https://lyh100700.github.io/game/ |
| 오프라인 | 지원 (한 번 열면 인터넷 없이 실행) |
| APK | PWABuilder 로 생성 (Package ID 확인 필요 — 2단계 참고) |

> **왜 배포가 필요한가**
> TWA 는 앱이 웹 주소를 감싸는 구조라서 공개 HTTPS 주소가 반드시 있어야 합니다.
>
> 저장소를 공개로 두는 이유도 같습니다. 정적 웹사이트는 배포하는 순간
> HTML·CSS·JS 가 브라우저로 그대로 전달되므로, 저장소를 비공개로 해도
> 코드는 어차피 공개됩니다. 감춰지는 것은 커밋 이력 정도뿐이라
> 절차가 더 간단한 GitHub Pages 를 씁니다. (캘비캘린더와 같은 방식)

---

## 1. GitHub Pages 켜기 ✅ 완료

> **이 단계는 이미 끝났습니다.** 아래는 나중에 다시 설정할 일이 생겼을 때를 위한 기록입니다.
> 지금 할 일은 [2단계](#2-앱-껍데기-만들기-pwabuilder)부터입니다.

1. https://github.com/lyh100700/game/settings 접속
2. 아래로 내려 **Danger Zone → Change repository visibility → Public** 으로 바꿉니다
3. 왼쪽 메뉴 **Pages** 클릭
4. **Source** 를 `Deploy from a branch` 로 두고

   | 항목 | 값 |
   |---|---|
   | Branch | `main` |
   | Folder | `/ (root)` |

5. **Save** → 1~2분 뒤 주소가 나옵니다

   ```
   https://lyh100700.github.io/game/
   ```

이후로는 `git push` 할 때마다 자동으로 다시 배포됩니다.

> **이메일 노출을 막으려면**
> 공개 저장소는 커밋 이력에 이메일 주소가 드러납니다.
> GitHub → Settings → Emails 에서 **Keep my email addresses private** 를 켜고,
> 앞으로의 커밋에 noreply 주소를 쓰도록 바꿀 수 있습니다.

---

## 2. 앱 껍데기 만들기 (PWABuilder)

1. https://www.pwabuilder.com 접속
2. 위에서 받은 주소 입력 → **Start**

   ```
   https://lyh100700.github.io/game/
   ```

3. **Package For Stores** → **Android** → **Generate Package**
4. ⚠️ **Package ID 를 반드시 확인하세요 — 가장 중요한 단계입니다**

   ```
   io.github.lyh100700.games
   ```

   PWABuilder 가 예전 값(`io.github.lyh100700.twa`)을 기억해 자동으로 채워 넣는 일이
   있습니다. 그 값은 **캘비캘린더의 패키지 이름**입니다. 그대로 두면:

   - 폰에 캘비가 깔려 있으면 → 서명 키가 달라 **설치 자체가 실패**합니다
   - 캘비를 지우고 깔면 → **캘비 일정 데이터가 모두 사라지고** 캘비를 되살릴 수 없습니다

5. `Google Play` 탭과 `Other Android` 탭 중 아무거나 써도 됩니다.
   요즘은 두 탭 모두 **서명이 끝난 `.apk`** 를 함께 넣어 줍니다.

6. **Download Package**

### 받은 zip 안에 무엇이 들었는지

| 파일 | 쓰임 |
|---|---|
| `GAMES.apk` | **폰에 설치할 파일.** 이미 서명되어 있습니다 |
| `GAMES.aab` | 구글 플레이 스토어 등록용. 폰에 직접 설치되지 않습니다 |
| `signing.keystore` | **서명 키. 잃어버리면 앱을 업데이트할 수 없습니다** |
| `signing-key-info.txt` | 위 키의 별칭과 비밀번호 |
| `assetlinks.json` | 주소창을 숨기기 위한 파일 (아래 5번 항목) |

**설치 전에 `Package ID` 를 다시 확인하세요.**

```bash
unzip -p "받은파일.zip" assetlinks.json | grep package_name
```

---

## 3. 서명 키 보관하기

**따로 서명할 필요가 없습니다.** PWABuilder 가 새 키를 만들어 이미 서명해 두었습니다.
(`서명하기.command` 는 서명 없는 파일이 나왔을 때만 쓰는 것입니다.)

대신 zip 안의 두 파일을 **반드시 안전한 곳에 옮겨 두세요.**

```
signing.keystore
signing-key-info.txt
```

권장 위치는 캘비 키 옆입니다.

```bash
mkdir -p ~/Documents/GAMES-릴리스
```

**이 키를 잃어버리면 앱을 업데이트할 수 없습니다.**
설치된 앱을 지우고 새로 깔아야 하며, 그때 플레이 기록도 함께 사라집니다.
저장소에는 절대 올리지 마세요 — 누구나 이 앱의 업데이트를 위조할 수 있게 됩니다.

---

## 4. 폰에 설치

서명된 `.apk` 를 폰으로 옮겨 실행합니다.
"출처를 알 수 없는 앱" 설치 허용을 한 번 물어보면 허용해 주세요.

---

## 앱을 다시 만들지 않아도 되는 경우

**게임 내용 수정은 앱을 다시 만들 필요가 없습니다.**

게임 로직, 디자인, 효과음은 전부 웹에 있습니다. 고쳐서 올리면 앱에도 반영됩니다.

```bash
# sw.js 의 VERSION 숫자를 올린 뒤
git add -A
git commit -m "무엇을 고쳤는지"
git push
```

1~2분 뒤 배포되고, 앱을 껐다 켜면 갱신됩니다.
**`sw.js` 의 `VERSION` 을 올리지 않으면 예전 화면이 그대로 남습니다.**

### 앱을 다시 만들어야 하는 경우

- 앱 이름이나 아이콘을 바꿀 때
- 배포 주소가 바뀔 때

---

## 5. 주소창 없애기 (선택)

설치한 앱을 열었을 때 위쪽에 **주소창이 보인다면** 이 설정이 빠진 것입니다.
앱이 "이 웹사이트는 내 것이 맞다"는 것을 증명하지 못한 상태입니다.

증명 파일은 **도메인 맨 위**에 있어야 합니다. 프로젝트 폴더 안이 아닙니다.

```
https://lyh100700.github.io/.well-known/assetlinks.json     ← 여기여야 함
https://lyh100700.github.io/game/assetlinks.json            ← 여기면 소용없음
```

`lyh100700.github.io` 라는 이름의 저장소를 따로 만들어야 그 위치에 파일을 둘 수 있습니다.

1. https://github.com/new 에서 저장소 이름을 정확히 `lyh100700.github.io` 로 만듭니다 (공개)
2. 그 안에 `.well-known/assetlinks.json` 을 만들고, PWABuilder zip 의
   `assetlinks.json` 내용을 넣습니다
3. 캘비캘린더 항목도 함께 넣으면 캘비의 주소창도 같이 사라집니다
   (배열이므로 `[{...}, {...}]` 형태로 두 개를 나란히 둡니다)
4. 그 저장소도 Pages 를 켭니다

**하지 않아도 앱은 정상 동작합니다.** 위쪽에 주소창이 보일 뿐입니다.

---

## 설치 없이 바로 써보기

앱으로 만들지 않아도, 폰 크롬에서 `https://lyh100700.github.io/game/` 를 열고
**메뉴 → 홈 화면에 추가** 하면 앱처럼 쓸 수 있습니다.
메인 화면 아래쪽 **"홈 화면에 앱으로 추가"** 버튼을 눌러도 됩니다.

---

## 한글 폴더 이름 — 확인 완료, 문제없음

`이빨/`, `사다리/` 처럼 폴더 이름이 한글이라 주소에도 한글이 들어갑니다.
호스팅에 따라 404 가 날 수 있어 걱정했지만, **GitHub Pages 에서 전부 정상 동작하는 것을
2026-08-20 배포 후 확인했습니다.** 폴더 이름을 영문으로 바꿀 필요가 없습니다.

만약 나중에 다른 호스팅으로 옮겨서 게임 화면만 404 가 뜬다면,
폴더 이름을 영문(`dino`, `ladder`, `stopwatch`, `wheel`)으로 바꾸면 해결됩니다.
그때는 `games.js`, `sw.js`, `manifest.webmanifest` 의 경로도 함께 고쳐야 합니다.

---

## 배포가 잘 됐는지 확인하는 법

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://lyh100700.github.io/game/
```

`200` 이 나오면 정상입니다. 푸시 후 반영까지는 1~3분 걸립니다.
