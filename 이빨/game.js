/* ===== DINO CHOMP =====
   공룡 이빨을 하나씩 누르다가 '꽝' 이빨을 누르면 입이 닫히는 복불복 게임. */
(function () {
  "use strict";

  /* 이빨 20개. tools/find-teeth.py 가 이빨화면.jpg 에서 직접 찾아낸 값이라
     손으로 맞출 필요가 없습니다. 그림을 바꾸면 그 스크립트를 다시 돌리세요.
       x, y  이빨 가운데 (그림 기준 %)      w, h  이빨 크기 (%)
       up    윗니면 true                    gum   그 자리 잇몸색 */
  var TEETH = [
    { x: 18.89, y: 22.11, w: 15.93, h: 8.12, up: true , gum: "#903932" },
    { x: 39.07, y: 20.90, w: 15.56, h: 8.12, up: true , gum: "#833a33" },
    { x: 61.11, y: 20.90, w: 15.56, h: 8.12, up: true , gum: "#813a33" },
    { x: 81.30, y: 22.11, w: 15.56, h: 8.12, up: true , gum: "#903932" },
    { x: 11.11, y: 28.93, w: 15.93, h: 8.29, up: true , gum: "#743c3f" },
    { x: 88.89, y: 28.84, w: 15.93, h: 8.12, up: true , gum: "#75393b" },
    { x: 11.85, y: 36.87, w: 15.93, h: 8.29, up: true , gum: "#6e3a3a" },
    { x: 88.15, y: 36.87, w: 15.93, h: 8.29, up: true , gum: "#6e3938" },
    { x: 13.15, y: 45.42, w: 15.56, h: 8.12, up: true , gum: "#662625" },
    { x: 86.85, y: 45.42, w: 15.56, h: 8.12, up: true , gum: "#662524" },
    { x: 13.52, y: 57.69, w: 15.56, h: 8.12, up: false, gum: "#682422" },
    { x: 86.30, y: 57.69, w: 15.56, h: 8.12, up: false, gum: "#6a211d" },
    { x: 12.04, y: 66.49, w: 15.56, h: 8.12, up: false, gum: "#773839" },
    { x: 87.96, y: 66.49, w: 15.56, h: 8.12, up: false, gum: "#773637" },
    { x: 11.48, y: 74.44, w: 15.93, h: 8.12, up: false, gum: "#893b3a" },
    { x: 88.52, y: 74.44, w: 15.93, h: 8.12, up: false, gum: "#8a3735" },
    { x: 19.44, y: 81.00, w: 15.56, h: 8.12, up: false, gum: "#a8413e" },
    { x: 39.07, y: 82.73, w: 15.56, h: 8.12, up: false, gum: "#bc5352" },
    { x: 60.93, y: 82.73, w: 15.56, h: 8.12, up: false, gum: "#bc5352" },
    { x: 80.56, y: 81.00, w: 15.56, h: 8.12, up: false, gum: "#a9423e" },
  ];

  var IMG_OPEN = "이빨화면-잇몸.jpg";
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

  /** 이빨이 빠져 들어갈 방향. 입 가운데에서 바깥쪽(잇몸 쪽)으로 향합니다. */
  function sinkDir(t) {
    if (Math.abs(t.y - 52) > 25) return { dx: 0, dy: t.y > 52 ? 1 : -1 };  /* 위·아래 활 */
    return { dx: t.x > 50 ? 1 : -1, dy: 0 };                               /* 양옆 줄 */
  }

  function buildTeeth() {
    teethBox.innerHTML = TEETH.map(function (t, i) {
      var d = sinkDir(t);
      return (
        '<button class="tooth" type="button" data-i="' + i + '"' +
        ' style="left:' + t.x + "%;top:" + t.y + "%;width:" + t.w + "%;height:" + t.h + "%" +
        ";--dx:" + d.dx + ";--dy:" + d.dy + ";--gum:" + t.gum + '"' +
        ' aria-label="' + (i + 1) + '번 이빨">' +
        '<img class="tooth__img" src="teeth/t' + (i < 9 ? "0" : "") + (i + 1) + '.png" alt="">' +
        "</button>"
      );
    }).join("");
  }

  function reset() {
    over = false;
    pressed = 0;
    chompIndex = Math.floor(Math.random() * TEETH.length);
    mouth.src = IMG_OPEN;
    stage.classList.remove("is-chomped");
    teethBox.classList.remove("is-quiet", "is-locked");
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
    teethBox.classList.add("is-locked");
    tooth.classList.add("is-bitten");

    /* 섬광이 걷힌 뒤 입이 닫힌 화면으로 */
    setTimeout(function () {
      teethBox.innerHTML = "";
      mouth.src = IMG_SHUT;
      stage.classList.add("is-chomped");
      Sfx.play("growl");
    }, 200);

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
