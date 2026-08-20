/* ===== DINO CHOMP =====
   공룡 이빨을 하나씩 누르다가 '꽝' 이빨을 누르면 입이 닫히는 복불복 게임. */
(function () {
  "use strict";

  /* 이빨 위치 — 이빨화면.jpg(1080×2316) 기준 백분율입니다.
     화면에서 실제 이빨과 어긋나면 D 키를 눌러 조정 모드를 켜세요.
     조정 모드에서 이미지를 클릭하면 그 지점의 좌표가 콘솔에 찍힙니다. */
  var TEETH = [
    /* 윗니 (위쪽 활) */
    { x: 18.0, y: 20.0 }, { x: 38.0, y: 19.3 }, { x: 61.1, y: 19.3 }, { x: 81.7, y: 20.3 },
    /* 윗니 (왼쪽 옆줄) */
    { x: 11.8, y: 27.8 }, { x: 11.8, y: 36.3 }, { x: 13.7, y: 44.5 },
    /* 윗니 (오른쪽 옆줄) */
    { x: 88.7, y: 27.8 }, { x: 88.7, y: 36.3 }, { x: 87.0, y: 44.5 },
    /* 아랫니 (왼쪽 옆줄) */
    { x: 15.0, y: 57.5 }, { x: 14.5, y: 65.5 }, { x: 15.0, y: 73.5 }, { x: 16.6, y: 81.0 },
    /* 아랫니 (오른쪽 옆줄) */
    { x: 85.7, y: 57.5 }, { x: 86.3, y: 65.5 }, { x: 85.7, y: 73.5 }, { x: 84.5, y: 81.0 },
    /* 아랫니 (아래쪽 활) */
    { x: 37.5, y: 83.5 }, { x: 51.5, y: 84.8 }, { x: 61.5, y: 83.5 },
  ];

  var IMG_OPEN = "이빨화면.jpg";
  var IMG_SHUT = "이빨화면2.jpg";

  var stage = document.getElementById("stage");
  var teethBox = document.getElementById("teeth");
  var mouth = document.getElementById("mouth");
  var countEl = document.getElementById("count");
  var popup = document.getElementById("popup");
  var popEmoji = document.getElementById("popEmoji");
  var popTitle = document.getElementById("popTitle");
  var popText = document.getElementById("popText");

  var flash = document.createElement("div");
  flash.className = "flash";
  stage.appendChild(flash);

  /* 이빨을 누를수록 화면 가장자리가 붉어지며 긴장감을 만듭니다 */
  var vignette = document.createElement("div");
  vignette.className = "vignette";
  stage.appendChild(vignette);

  /* 입 닫힘 이미지를 미리 받아둡니다 — 결정적인 순간에 깜빡이면 안 되니까 */
  new Image().src = IMG_SHUT;

  var chompIndex = 0;
  var pressed = 0;
  var over = false;

  function buildTeeth() {
    teethBox.innerHTML = TEETH.map(function (t, i) {
      return (
        '<button class="tooth" type="button" data-i="' + i + '"' +
        ' style="left:' + t.x + "%;top:" + t.y + '%"' +
        ' aria-label="' + (i + 1) + '번 이빨"></button>'
      );
    }).join("");
  }

  function reset() {
    over = false;
    pressed = 0;
    chompIndex = Math.floor(Math.random() * TEETH.length);
    mouth.src = IMG_OPEN;
    stage.classList.remove("is-chomped");
    teethBox.classList.remove("is-quiet");
    countEl.textContent = "0";
    vignette.style.setProperty("--tension", 0);
    vignette.classList.remove("is-beating");
    popup.classList.remove("is-open");
    buildTeeth();
  }

  function bumpCount() {
    countEl.textContent = String(pressed);
    countEl.classList.remove("is-bump");
    void countEl.offsetWidth; /* 애니메이션 재시작 */
    countEl.classList.add("is-bump");
  }

  function chomp(tooth) {
    over = true;

    var rect = tooth.getBoundingClientRect();
    var box = stage.getBoundingClientRect();
    flash.style.setProperty("--fx", ((rect.left + rect.width / 2 - box.left) / box.width) * 100 + "%");
    flash.style.setProperty("--fy", ((rect.top + rect.height / 2 - box.top) / box.height) * 100 + "%");
    flash.classList.remove("is-on");
    void flash.offsetWidth;
    flash.classList.add("is-on");

    Sfx.play("chomp");
    teethBox.innerHTML = "";

    /* 섬광이 걷힌 뒤 입이 닫힌 화면으로 */
    setTimeout(function () {
      mouth.src = IMG_SHUT;
      stage.classList.add("is-chomped");
      Sfx.play("growl");
    }, 160);

    Progress.bump("dino");

    setTimeout(function () {
      popEmoji.textContent = "😱";
      popTitle.textContent = "CHOMP!";
      popText.textContent = "이빨 " + pressed + "개를 무사히 넘겼어요. " + safetyComment(pressed);
      popup.classList.add("is-open");
      Sfx.play("lose");
    }, 1200);
  }

  function safetyComment(n) {
    if (n === 0) return "첫 판부터 아쉽네요!";
    if (n < 5) return "조금만 더 버텨봐요.";
    if (n < 10) return "제법인데요?";
    if (n < TEETH.length - 3) return "거의 다 왔었어요!";
    return "역대급 운입니다!";
  }

  /** 남은 이빨이 적을수록 붉은 기운이 짙어집니다 */
  function updateTension() {
    var ratio = pressed / (TEETH.length - 1);
    vignette.style.setProperty("--tension", (ratio * 0.85).toFixed(2));
    vignette.classList.toggle("is-beating", ratio > 0.55);
  }

  /** 이빨이 들어갈 때 작은 조각이 튑니다 */
  function crumbs(tooth) {
    var box = stage.getBoundingClientRect();
    var r = tooth.getBoundingClientRect();
    var cx = ((r.left + r.width / 2 - box.left) / box.width) * 100;
    var cy = ((r.top + r.height / 2 - box.top) / box.height) * 100;
    for (var i = 0; i < 5; i++) {
      var c = document.createElement("span");
      c.className = "crumb";
      c.style.left = cx + "%";
      c.style.top = cy + "%";
      c.style.setProperty("--cx", (Math.random() * 60 - 30) + "px");
      c.style.setProperty("--cy", (-20 - Math.random() * 40) + "px");
      c.style.animationDelay = (Math.random() * 0.06) + "s";
      stage.appendChild(c);
      setTimeout(function (n) { return function () { n.remove(); }; }(c), 700);
    }
  }

  function clear(tooth) {
    pressed++;
    tooth.classList.add("is-down");
    teethBox.classList.add("is-quiet");
    Sfx.play("tooth");
    crumbs(tooth);
    bumpCount();
    updateTension();

    /* 꽝 하나만 남으면 마지막까지 버틴 것 — 승리로 쳐줍니다 */
    if (pressed === TEETH.length - 1) {
      over = true;
      Progress.bump("dino");
      setTimeout(function () {
        popEmoji.textContent = "🏆";
        popTitle.textContent = "PERFECT!";
        popText.textContent = "꽝 하나만 남기고 전부 눌렀어요. 대단한 운이에요!";
        popup.classList.add("is-open");
        Sfx.play("win");
        Fx.confetti(document.getElementById("screen"), { x: 50, y: 40, count: 60 });
      }, 400);
    }
  }

  teethBox.addEventListener("click", function (e) {
    var tooth = e.target.closest(".tooth");
    if (!tooth || over || tooth.classList.contains("is-down")) return;
    if (Number(tooth.dataset.i) === chompIndex) chomp(tooth);
    else clear(tooth);
  });

  document.getElementById("retry").addEventListener("click", function () {
    Sfx.play("tap");
    reset();
  });
  document.getElementById("popRetry").addEventListener("click", function () {
    Sfx.play("tap");
    reset();
  });

  /* ---- 좌표 조정 모드 (D 키) ---- */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "d" && e.key !== "D") return;
    var on = teethBox.classList.toggle("is-debug");
    console.log(on
      ? "좌표 조정 모드 켜짐 — 이미지를 클릭하면 좌표가 찍힙니다."
      : "좌표 조정 모드 꺼짐");
  });
  stage.addEventListener("click", function (e) {
    if (!teethBox.classList.contains("is-debug")) return;
    var box = stage.getBoundingClientRect();
    var x = ((e.clientX - box.left) / box.width) * 100;
    var y = ((e.clientY - box.top) / box.height) * 100;
    console.log("{ x: " + x.toFixed(1) + ", y: " + y.toFixed(1) + " },");
  });

  Sfx.mountToggle(document.getElementById("screen"));
  reset();
})();
