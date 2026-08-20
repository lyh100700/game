/* 메인 선택화면 */
(function () {
  "use strict";

  var cards = document.getElementById("cards");

  /* 게임별 썸네일. 카드 왼쪽의 작은 그림입니다. */
  var THUMBS = {
    dino:
      '<span class="thumb__tag">CHOMPED!</span>' +
      "<span>🦖</span>" +
      '<span class="thumb__teeth"><i>🦷</i><i>🦷</i><i>🦷</i></span>',
    ladder:
      '<span class="miniLadder"><i></i><i></i><i></i><i></i><i></i></span>' +
      '<span class="thumb__pins"><i>🧍</i><i>🧍</i></span>',
    watch: "<span>⏱️⏰</span>" + '<span class="thumb__eq">00 × 00 = ???</span>',
    wheel: '<span class="miniWheel"></span>',
  };

  function render() {
    cards.innerHTML = GAMES.map(function (g) {
      var played = Progress.get(g.id);
      var pct = (played / Progress.MAX) * 100;
      return (
        '<a class="card" href="' + encodeURIComponent(g.dir) + '/index.html">' +
          '<span class="thumb thumb--' + g.thumb + '">' + THUMBS[g.thumb] + "</span>" +
          '<span class="card__body">' +
            '<span class="card__title">' + g.title + "</span>" +
            '<span class="card__ko">' + g.ko + "</span>" +
            '<span class="bar">' +
              '<span class="bar__fill" style="width:' + pct + '%"></span>' +
              '<span class="bar__label">' + played + "/" + Progress.MAX + "</span>" +
            "</span>" +
            '<span class="card__play">Play Now</span>' +
          "</span>" +
        "</a>"
      );
    }).join("");
  }

  cards.addEventListener("click", function (e) {
    if (e.target.closest(".card")) Sfx.play("pop");
  });

  document.getElementById("resetAll").addEventListener("click", function () {
    if (confirm("모든 게임의 플레이 기록을 지울까요?")) {
      Sfx.play("back");
      Progress.reset();
      render();
    }
  });

  render();
  Sfx.mountToggle(document.getElementById("screen"));
  Fx.sparkles(document.querySelector(".main__deco"), 5, ["✨", "🍃", "⭐"]);

  /* 게임에서 돌아왔을 때 진행바를 최신으로 (뒤로가기 캐시 대응) */
  window.addEventListener("pageshow", render);

  /* ---- 앱 설치 ---- */

  /* 안드로이드 크롬은 설치 가능해지면 이 이벤트를 줍니다.
     기본 배너를 막고, 우리 버튼으로 직접 띄웁니다. */
  var deferred = null;
  var installBtn = document.getElementById("install");

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener("click", function () {
    if (!deferred) return;
    Sfx.play("tap");
    deferred.prompt();
    deferred.userChoice.then(function () {
      deferred = null;
      installBtn.hidden = true;
    });
  });

  window.addEventListener("appinstalled", function () {
    installBtn.hidden = true;
  });

  /* ---- 오프라인 지원 ---- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.warn("서비스 워커 등록 실패:", err);
      });
    });
  }
})();
