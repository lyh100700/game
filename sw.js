/* ===== 서비스 워커 =====
   앱을 한 번 열면 파일을 폰에 저장해 두고, 다음부터는 인터넷 없이도 실행됩니다.
   내용을 고친 뒤에는 아래 VERSION 숫자를 반드시 올리세요. 그래야 갱신됩니다. */

const VERSION = 15;
const CACHE = "cutegames-v" + VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./main.css",
  "./main.js",
  "./games.js",
  "./manifest.webmanifest",
  "./앱아이콘.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",

  "./shared/theme.css",
  "./shared/progress.js",
  "./shared/sound.js",
  "./shared/fx.js",
  "./shared/art.js",
  "./shared/chars.js",
  "./shared/art/char/axolotl.png",
  "./shared/art/char/bear.png",
  "./shared/art/char/cat.png",
  "./shared/art/char/dino.png",
  "./shared/art/char/dog.png",
  "./shared/art/char/fox.png",
  "./shared/art/char/frog.png",
  "./shared/art/char/koala.png",
  "./shared/art/char/panda.png",
  "./shared/art/char/penguin.png",
  "./shared/art/char/rabbit.png",
  "./shared/art/char/sloth.png",
  "./shared/art/char/unicorn.png",
  "./shared/art/bg-forest.svg",
  "./shared/art/thumb-dino.jpg",
  "./shared/art/thumb-ladder.jpg",
  "./shared/art/thumb-watch.jpg",
  "./shared/art/thumb-wheel.jpg",
  "./shared/art/watch-board.png",
  "./shared/art/watch-star.png",
  "./shared/art/watch-star-stop.png",
  "./shared/art/watch-cloud.png",
  "./shared/art/bg-clouds.svg",

  "./이빨/index.html",
  "./이빨/style.css",
  "./이빨/game.js",
  "./이빨/이빨화면.jpg",
  "./이빨/이빨화면-잇몸.jpg",
  "./이빨/이빨화면2.jpg",
  "./이빨/teeth/t01.png",
  "./이빨/teeth/t02.png",
  "./이빨/teeth/t03.png",
  "./이빨/teeth/t04.png",
  "./이빨/teeth/t05.png",
  "./이빨/teeth/t06.png",
  "./이빨/teeth/t07.png",
  "./이빨/teeth/t08.png",
  "./이빨/teeth/t09.png",
  "./이빨/teeth/t10.png",
  "./이빨/teeth/t11.png",
  "./이빨/teeth/t12.png",
  "./이빨/teeth/t13.png",
  "./이빨/teeth/t14.png",
  "./이빨/teeth/t15.png",
  "./이빨/teeth/t16.png",
  "./이빨/teeth/t17.png",
  "./이빨/teeth/t18.png",
  "./이빨/teeth/t19.png",
  "./이빨/teeth/t20.png",

  "./사다리/index.html",
  "./사다리/style.css",
  "./사다리/game.js",

  "./스톱워치/index.html",
  "./스톱워치/style.css",
  "./스톱워치/game.js",

  "./룰렛/index.html",
  "./룰렛/style.css",
  "./룰렛/game.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      /* 파일 하나가 없어도 설치 전체가 실패하지 않도록 하나씩 담습니다 */
      Promise.all(
        ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn("캐시 실패:", url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* HTML 은 네트워크 우선 — 새 버전이 있으면 바로 반영되도록.
     나머지(이미지·CSS·JS)는 캐시 우선 — 빠르고 오프라인에서도 확실하게. */
  const isPage = req.mode === "navigate" ||
                 (req.headers.get("accept") || "").includes("text/html");

  if (isPage) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
