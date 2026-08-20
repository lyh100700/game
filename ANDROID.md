# 안드로이드 앱으로 설치하기

이 게임 모음을 폰에 앱으로 깔기 위한 절차입니다.

## 지금 상태

| 항목 | 값 |
|---|---|
| 앱 이름 | GAMES! |
| 방식 | PWA → TWA (웹앱을 감싼 안드로이드 앱) |
| 저장소 | 공개 (`lyh100700/game`) |
| 배포 | GitHub Pages |
| 오프라인 | 지원 (한 번 열면 인터넷 없이 실행) |

> **왜 배포가 필요한가**
> TWA 는 앱이 웹 주소를 감싸는 구조라서 공개 HTTPS 주소가 반드시 있어야 합니다.
>
> 저장소를 공개로 두는 이유도 같습니다. 정적 웹사이트는 배포하는 순간
> HTML·CSS·JS 가 브라우저로 그대로 전달되므로, 저장소를 비공개로 해도
> 코드는 어차피 공개됩니다. 감춰지는 것은 커밋 이력 정도뿐이라
> 절차가 더 간단한 GitHub Pages 를 씁니다. (캘비캘린더와 같은 방식)

---

## 1. GitHub Pages 켜기 (처음 한 번만)

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
4. **`Other Android` 탭**을 고릅니다 ⭐
   - `Google Play` 탭은 서명 없는 파일이 나와 폰에 설치되지 않습니다
5. **Package ID** 를 정합니다

   ```
   io.github.lyh100700.games
   ```

   > 캘비캘린더(`io.github.lyh100700.twa`)와 **반드시 달라야** 합니다.
   > 같으면 기존 앱을 덮어써 버립니다.

6. **Download Package**

---

## 3. 서명하기

`~/Documents/캘비-릴리스/서명하기.command` 를 **더블클릭**하세요.

받은 `-unsigned.apk` 를 고르면 서명된 파일이 같은 폴더에 만들어집니다.
캘비와 같은 키로 서명해도 됩니다 — 패키지 이름이 다르면 별개의 앱으로 깔립니다.

**키를 잃어버리면 이 앱도 업데이트할 수 없습니다.** 백업해 두세요.

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

## 설치 없이 바로 써보기

앱으로 만들지 않아도, 폰 크롬에서 `https://lyh100700.github.io/game/` 를 열고
**메뉴 → 홈 화면에 추가** 하면 앱처럼 쓸 수 있습니다.
메인 화면 아래쪽 **"홈 화면에 앱으로 추가"** 버튼을 눌러도 됩니다.

---

## ⚠️ 알아둘 점 — 폴더 이름이 한글입니다

`이빨/`, `사다리/` 처럼 폴더 이름이 한글이라 주소에도 한글이 들어갑니다.
대부분의 호스팅에서 문제없이 동작하지만, 배포 후 **게임 화면만 404 가 뜬다면**
폴더 이름을 영문(`dino`, `ladder`, `stopwatch`, `wheel`)으로 바꾸면 해결됩니다.
그때는 `games.js`, `sw.js`, `manifest.webmanifest` 의 경로도 함께 고쳐야 합니다.
