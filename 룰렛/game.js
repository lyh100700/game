/* ===== PRIZE WHEEL =====
   참가자 수만큼 칸을 나눈 룰렛을 돌려 당첨자를 뽑습니다.
   회전은 CSS 전환이 아니라 rAF로 직접 계산합니다 — 그래야 칸을 넘어갈 때마다
   딸깍 소리를 정확한 순간에 낼 수 있습니다. */
(function () {
  "use strict";

  var FACES = ["🐻", "🐱", "🐼", "🐰", "🦊", "🐯", "🐶", "🐨", "🦝", "🐷"];
  var TONES = ["#f6a9a9", "#f9cf8e", "#f4e58c", "#b5e3a0", "#9fd8e0",
               "#a9b8ef", "#cfb0ec", "#f3b0d6", "#d6c3a8", "#b8c9d9"];

  var SPIN_MS = 4600;
  var MIN_TURNS = 5, MAX_TURNS = 8;
  var R = 88;              /* 룰렛 반지름 (SVG 좌표) */

  var svg = document.getElementById("svg");
  var spinBtn = document.getElementById("spin");
  var range = document.getElementById("range");
  var numEl = document.getElementById("num");
  var pointer = document.getElementById("pointer");
  var popup = document.getElementById("popup");
  var listPop = document.getElementById("listPop");

  var count = 10;
  var angle = 0;        /* 현재 회전각(도) */
  var spinning = false;
  var wheelGroup = null;

  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  /* 12시 방향을 0도로, 시계방향으로 재는 좌표 변환 */
  function pt(deg, r) {
    var rad = (deg - 90) * Math.PI / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)];
  }

  /* ---------- 룰렛 그리기 ---------- */

  function draw() {
    svg.innerHTML = "";

    var defs = el("defs");
    var grad = el("radialGradient", { id: "hubGrad" });
    grad.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff" }));
    grad.appendChild(el("stop", { offset: "55%", "stop-color": "#bfe0f5" }));
    grad.appendChild(el("stop", { offset: "100%", "stop-color": "#8f7ad4" }));
    defs.appendChild(grad);
    svg.appendChild(defs);

    /* 바깥 테두리 */
    svg.appendChild(el("circle", { class: "rim", cx: 0, cy: 0, r: R + 5 }));

    wheelGroup = el("g", { id: "wheelGroup" });
    svg.appendChild(wheelGroup);

    var step = 360 / count;
    for (var i = 0; i < count; i++) {
      var a0 = i * step;
      var a1 = (i + 1) * step;
      var p0 = pt(a0, R);
      var p1 = pt(a1, R);
      var large = step > 180 ? 1 : 0;

      wheelGroup.appendChild(el("path", {
        class: "sector",
        "data-i": i,
        d: "M 0 0 L " + p0[0].toFixed(2) + " " + p0[1].toFixed(2) +
           " A " + R + " " + R + " 0 " + large + " 1 " +
           p1[0].toFixed(2) + " " + p1[1].toFixed(2) + " Z",
        fill: TONES[i % TONES.length],
      }));

      var mid = a0 + step / 2;
      var np = pt(mid, R * 0.82);
      var fp = pt(mid, R * 0.55);

      var num = el("text", {
        class: "slice__num",
        x: np[0].toFixed(2), y: np[1].toFixed(2),
        "text-anchor": "middle", "dominant-baseline": "central",
        transform: "rotate(" + mid + " " + np[0].toFixed(2) + " " + np[1].toFixed(2) + ")",
      }, String(i + 1));
      wheelGroup.appendChild(num);

      wheelGroup.appendChild(el("text", {
        class: "slice__face",
        x: fp[0].toFixed(2), y: fp[1].toFixed(2),
        "text-anchor": "middle", "dominant-baseline": "central",
      }, FACES[i % FACES.length]));
    }

    /* 안쪽 장식선과 가운데 보석 */
    svg.appendChild(el("circle", { class: "rim2", cx: 0, cy: 0, r: R }));
    svg.appendChild(el("circle", { class: "hub", cx: 0, cy: 0, r: 15 }));

    applyAngle();
  }

  function applyAngle() {
    if (wheelGroup) wheelGroup.setAttribute("transform", "rotate(" + angle + ")");
  }

  function buildList() {
    var box = document.getElementById("plist");
    var html = "";
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="prow" style="--tone:' + TONES[i % TONES.length] + '">' +
          '<span class="prow__face">' + FACES[i % FACES.length] + "</span>" +
          '<span class="prow__name">Player ' + (i + 1) + "</span>" +
        "</div>";
    }
    box.innerHTML = html;
  }

  /* ---------- 회전 ---------- */

  function spin() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    range.disabled = true;
    svg.querySelectorAll(".sector").forEach(function (s) { s.classList.remove("is-win"); });
    Sfx.play("spin");

    var step = 360 / count;
    var winner = Math.floor(Math.random() * count);

    /* 당첨 칸의 한가운데가 12시 포인터 아래로 오도록 목표 각도를 맞춥니다.
       (칸 안에서 살짝 흔들리게 해 매번 똑같이 멈춘 티가 나지 않도록) */
    var jitter = (Math.random() - 0.5) * step * 0.55;
    var turns = MIN_TURNS + Math.floor(Math.random() * (MAX_TURNS - MIN_TURNS + 1));
    var center = winner * step + step / 2;
    var from = angle;
    var target = from + turns * 360 + (360 - ((from + center) % 360)) % 360 + jitter;

    var t0 = performance.now();
    var lastEdge = Math.floor(from / step);

    function frame(now) {
      var p = Math.min((now - t0) / SPIN_MS, 1);
      var eased = 1 - Math.pow(1 - p, 4);   /* 빠르게 시작해 부드럽게 멎습니다 */
      angle = from + (target - from) * eased;
      applyAngle();

      var edge = Math.floor(angle / step);
      if (edge !== lastEdge) {
        lastEdge = edge;
        Sfx.play("click");
        pointer.classList.remove("is-knock");
        void pointer.offsetWidth;
        pointer.classList.add("is-knock");
      }

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        angle = target % 360;
        applyAngle();
        land(winner);
      }
    }
    requestAnimationFrame(frame);
  }

  function land(winner) {
    spinning = false;
    spinBtn.disabled = false;
    range.disabled = false;

    var sector = svg.querySelector('.sector[data-i="' + winner + '"]');
    if (sector) sector.classList.add("is-win");

    Progress.bump("wheel");
    Sfx.play("fanfare");

    setTimeout(function () {
      document.getElementById("popEmoji").textContent = FACES[winner % FACES.length];
      document.getElementById("popTitle").textContent = "Player " + (winner + 1) + " 당첨!";
      document.getElementById("popText").textContent =
        count + "명 중 " + (winner + 1) + "번 칸이 뽑혔어요. 🎊";
      popup.classList.add("is-open");
      Sfx.play("coin");
    }, 500);
  }

  /* ---------- 입력 ---------- */

  spinBtn.addEventListener("click", spin);

  range.addEventListener("input", function () {
    count = Number(range.value);
    numEl.textContent = count;
    Sfx.play("tap");
    draw();
    buildList();
  });

  document.getElementById("openList").addEventListener("click", function () {
    Sfx.play("tap");
    listPop.classList.add("is-open");
  });
  document.getElementById("closeList").addEventListener("click", function () {
    Sfx.play("back");
    listPop.classList.remove("is-open");
  });
  document.getElementById("popAgain").addEventListener("click", function () {
    Sfx.play("tap");
    popup.classList.remove("is-open");
  });
  [listPop, popup].forEach(function (p) {
    p.addEventListener("click", function (e) {
      if (e.target === p) p.classList.remove("is-open");
    });
  });

  Sfx.mountToggle(document.getElementById("screen"));
  draw();
  buildList();
})();
