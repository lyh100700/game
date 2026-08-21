/* ===== MULTIPLY TIME =====
   스톱워치를 두 번 멈춰서, 각 기록의 소수점 마지막 자리(1/100초)를 곱합니다.
   예: 00:09.17 → 7,  00:08.23 → 3,  7 × 3 = 21 */
(function () {
  "use strict";

  var TONES = ["#f6a9c0", "#f7c8a0", "#f2dd8c", "#9fd8e0", "#a9b8ef", "#cfb0ec", "#f3b0d6", "#b5e3a0"];

  var timeEl = document.getElementById("time");
  var guide = document.getElementById("guide");
  var action = document.getElementById("action");
  var actionLabel = document.getElementById("actionLabel");
  var resetBtn = document.getElementById("reset");
  var popup = document.getElementById("popup");
  var screen = document.getElementById("screen");

  /* idle → run1 → gap → run2 → done */
  var phase = "idle";
  var startAt = 0;
  var raf = 0;
  var lastTick = 0;
  var records = [];

  /* ---------- 시간 표시 ---------- */

  function format(ms) {
    var cs = Math.floor(ms / 10);          /* 1/100초 단위 */
    var s = Math.floor(cs / 100);
    var m = Math.floor(s / 60);
    return (
      String(m % 100).padStart(2, "0") + ":" +
      String(s % 60).padStart(2, "0") + "." +
      String(cs % 100).padStart(2, "0")
    );
  }

  /** 소수점 마지막 자리 = 1/100초의 일의 자리 */
  function keyDigit(ms) {
    return Math.floor(ms / 10) % 10;
  }

  function paint(ms, highlight) {
    var text = format(ms);
    var html = "";
    var t = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === ":" || ch === ".") {
        html += '<i style="--tone:#c9b6d8">' + ch + "</i>";
      } else {
        var isLast = i === text.length - 1;
        html +=
          '<i class="' + (isLast && highlight ? "is-key" : "") + '"' +
          ' style="--tone:' + TONES[t % TONES.length] + '">' + ch + "</i>";
        t++;
      }
    }
    timeEl.innerHTML = html;
  }

  /* ---------- 진행 ---------- */

  function loop(now) {
    var ms = performance.now() - startAt;
    paint(ms, false);
    if (now - lastTick > 240) {
      Sfx.play("tick");
      lastTick = now;
    }
    raf = requestAnimationFrame(loop);
  }

  function startRun(n) {
    phase = n === 1 ? "run1" : "run2";
    startAt = performance.now();
    lastTick = 0;
    guide.textContent = n === 1 ? "첫 번째 시간 — 별을 눌러 멈추세요" : "두 번째 시간 — 다시 멈추세요!";
    guide.classList.add("is-live");
    screen.classList.add("is-live");
    action.classList.add("is-stop", "is-live");
    action.disabled = false;
    actionLabel.textContent = "멈춤";
    Sfx.play("start");
    raf = requestAnimationFrame(loop);
  }

  function stopRun() {
    cancelAnimationFrame(raf);
    var ms = performance.now() - startAt;
    var d = keyDigit(ms);
    records.push({ ms: ms, digit: d });

    paint(ms, true);
    Sfx.play("stop");
    action.classList.remove("is-stop", "is-live");
    guide.classList.remove("is-live");
    screen.classList.remove("is-live");

    var n = records.length;
    document.getElementById("t" + n).textContent = format(ms);
    var dEl = document.getElementById("d" + n);
    dEl.textContent = d;
    dEl.classList.add("is-set");
    document.getElementById("slot" + n).classList.add("is-done");

    if (n === 1) {
      /* 명세대로 두 번째 스톱워치는 자동으로 시작됩니다 */
      phase = "gap";
      action.disabled = true;
      actionLabel.textContent = "준비";
      var left = 3;
      guide.textContent = "두 번째 스톱워치가 곧 시작돼요… " + left;
      var iv = setInterval(function () {
        left--;
        Sfx.play("tick");
        if (left > 0) {
          guide.textContent = "두 번째 스톱워치가 곧 시작돼요… " + left;
        } else {
          clearInterval(iv);
          startRun(2);
        }
      }, 700);
    } else {
      finish();
    }
  }

  function finish() {
    phase = "done";
    var a = records[0].digit;
    var b = records[1].digit;
    var total = a * b;

    var totalEl = document.getElementById("total");
    totalEl.textContent = total;
    totalEl.classList.add("is-set");

    guide.textContent = a + " × " + b + " = " + total;
    action.disabled = true;
    actionLabel.textContent = "완료";
    Sfx.play("calc");

    Progress.bump("watch");

    setTimeout(function () {
      document.getElementById("popEmoji").textContent = grade(total).emoji;
      document.getElementById("popTitle").textContent = total + " 점";
      document.getElementById("popText").textContent =
        format(records[0].ms) + " 의 " + a + " × " +
        format(records[1].ms) + " 의 " + b + " → " + total + ". " + grade(total).text;
      popup.classList.add("is-open");
      Sfx.play(total >= 40 ? "fanfare" : total === 0 ? "lose" : "win");
      if (total >= 30) Fx.confetti(document.getElementById("screen"), { x: 50, y: 40, count: 50 });
    }, 800);
  }

  function grade(n) {
    if (n === 0) return { emoji: "😅", text: "0이 하나 끼면 결과도 0이에요!" };
    if (n >= 56) return { emoji: "🏆", text: "최고 기록급이에요!" };
    if (n >= 30) return { emoji: "🎉", text: "훌륭해요!" };
    if (n >= 12) return { emoji: "😊", text: "무난한 점수예요." };
    return { emoji: "🍀", text: "다음 판을 노려봐요." };
  }

  function reset() {
    cancelAnimationFrame(raf);
    phase = "idle";
    records = [];
    paint(0, false);
    guide.textContent = "별을 눌러 시작하세요";
    guide.classList.remove("is-live");
    screen.classList.remove("is-live");
    action.disabled = false;
    action.classList.remove("is-stop", "is-live");
    actionLabel.textContent = "시작";
    [1, 2].forEach(function (n) {
      document.getElementById("t" + n).textContent = "--:--.--";
      var d = document.getElementById("d" + n);
      d.textContent = "?";
      d.classList.remove("is-set");
      document.getElementById("slot" + n).classList.remove("is-done");
    });
    var totalEl = document.getElementById("total");
    totalEl.textContent = "?";
    totalEl.classList.remove("is-set");
    popup.classList.remove("is-open");
  }

  /* ---------- 입력 ---------- */

  action.addEventListener("click", function () {
    if (phase === "idle") startRun(1);
    else if (phase === "run1" || phase === "run2") stopRun();
  });

  resetBtn.addEventListener("click", function () {
    Sfx.play("back");
    reset();
  });
  document.getElementById("popAgain").addEventListener("click", function () {
    Sfx.play("tap");
    reset();
  });

  /* 스페이스바로도 조작 — 손맛이 중요한 게임이라 */
  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space") return;
    e.preventDefault();
    if (!action.disabled) action.click();
  });

  /* 마스코트에 생성 그림이 있으면 얹습니다 (없으면 이모지 그대로) */
  if (window.Art) {
    var buddyArt = { "buddy--a": "ch-cat", "buddy--b": "ch-bear" };
    Object.keys(buddyArt).forEach(function (cls) {
      var el = document.querySelector("." + cls);
      if (el) el.insertAdjacentHTML("beforeend", Art.tag(buddyArt[cls]));
    });
  }

  Sfx.mountToggle(document.getElementById("screen"));
  Fx.sparkles(document.querySelector(".sky"), 6, ["✨", "💫", "⭐"]);
  reset();
})();
