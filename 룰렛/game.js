/* ===== PRIZE WHEEL =====
   참가자 수만큼 칸을 나눈 룰렛을 돌려 당첨자를 뽑습니다.
   회전은 CSS 전환이 아니라 rAF 로 직접 계산합니다 — 그래야 칸을 넘어갈 때마다
   딸깍 소리를 정확한 순간에 낼 수 있습니다. */
(function () {
  "use strict";

  var FACES = ["🐻", "🐱", "🐼", "🐰", "🦊", "🐯", "🐷", "🐸", "🐧", "🐶"];
  var ARTS = ["ch-bear", "ch-cat", "ch-panda", "ch-rabbit", "ch-fox",
              "ch-tiger", "ch-pig", "ch-frog", "ch-penguin", "ch-dog"];
  var TONES = ["#f7a8a8", "#fbcf86", "#f6e78a", "#b3e59c", "#9adae3",
               "#a6b6f2", "#d0aef0", "#f6adda", "#dcc6a8", "#b4c8dc"];

  var SPIN_MS = 4800;
  var MIN_TURNS = 5, MAX_TURNS = 8;
  var R = 84;          /* 룰렛 반지름 */
  var RIM = 95;        /* 바깥 테 반지름 */

  var svg = document.getElementById("svg");
  var spinBtn = document.getElementById("spin");
  var range = document.getElementById("range");
  var numEl = document.getElementById("num");
  var popup = document.getElementById("popup");
  var listPop = document.getElementById("listPop");
  var screen = document.getElementById("screen");

  var count = 10;
  var angle = 0;
  var spinning = false;
  var wheelGroup = null;
  var pointerG = null;

  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  /* 12시 방향이 0도, 시계방향으로 재는 좌표 */
  function pt(deg, r) {
    var rad = (deg - 90) * Math.PI / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)];
  }

  /** 칸 가운데에 캐릭터 그림을 원형으로 잘라 얹습니다.
      파일이 없으면 onerror 로 스스로 사라져 이모지가 남습니다. */
  function addFaceArt(parent, artId, cx, cy, r, i) {
    if (!artId || !global_Art) return;
    /* 흰 원보다 조금 작게 잘라 테두리가 남게 합니다.
       그래야 그림마다 다른 배경색이 칸 색과 직접 부딪히지 않습니다. */
    var ri = r - 1.6;
    var clipId = "faceClip" + i;
    var clip = el("clipPath", { id: clipId });
    clip.appendChild(el("circle", { cx: cx.toFixed(2), cy: cy.toFixed(2), r: ri }));
    parent.appendChild(clip);

    var img = el("image", {
      href: global_Art.url(artId),
      x: (cx - ri).toFixed(2), y: (cy - ri).toFixed(2),
      width: ri * 2, height: ri * 2,
      "clip-path": "url(#" + clipId + ")",
      preserveAspectRatio: "xMidYMid slice",
    });
    img.addEventListener("error", function () {
      img.remove();
      clip.remove();
    });
    parent.appendChild(img);
  }

  var global_Art = window.Art;

  /* ---------- 그리기 ---------- */

  function defs() {
    var d = el("defs");

    /* 가운데 보석 */
    var hub = el("radialGradient", { id: "hubGrad", cx: "35%", cy: "30%" });
    hub.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff" }));
    hub.appendChild(el("stop", { offset: "40%", "stop-color": "#cfe9fb" }));
    hub.appendChild(el("stop", { offset: "100%", "stop-color": "#8f7ad4" }));
    d.appendChild(hub);

    /* 바깥 테 — 위쪽이 밝은 금속 느낌 */
    var rim = el("linearGradient", { id: "rimGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
    rim.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff" }));
    rim.appendChild(el("stop", { offset: "45%", "stop-color": "#efe0f7" }));
    rim.appendChild(el("stop", { offset: "100%", "stop-color": "#c9aee4" }));
    d.appendChild(rim);

    /* 유리 광택 — 회전하지 않고 고정돼 있어야 빛이 한 방향에서 오는 것처럼 보입니다 */
    var gloss = el("radialGradient", { id: "glossGrad", cx: "32%", cy: "24%", r: "72%" });
    gloss.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": ".55" }));
    gloss.appendChild(el("stop", { offset: "42%", "stop-color": "#ffffff", "stop-opacity": ".16" }));
    gloss.appendChild(el("stop", { offset: "78%", "stop-color": "#ffffff", "stop-opacity": "0" }));
    d.appendChild(gloss);

    /* 포인터 */
    var pg = el("linearGradient", { id: "ptrGrad", x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
    pg.appendChild(el("stop", { offset: "0%", "stop-color": "#ffd9e6" }));
    pg.appendChild(el("stop", { offset: "55%", "stop-color": "#f58aae" }));
    pg.appendChild(el("stop", { offset: "100%", "stop-color": "#d95a86" }));
    d.appendChild(pg);

    var shadow = el("filter", { id: "soft", x: "-30%", y: "-30%", width: "160%", height: "160%" });
    shadow.appendChild(el("feDropShadow", {
      dx: 0, dy: 3, stdDeviation: 3, "flood-color": "#5a4690", "flood-opacity": ".35",
    }));
    d.appendChild(shadow);

    return d;
  }

  function draw() {
    svg.innerHTML = "";
    svg.appendChild(defs());

    /* 바깥 테와 전구 장식 */
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: RIM, fill: "url(#rimGrad)", filter: "url(#soft)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: RIM - 2, fill: "none", stroke: "#ffffff", "stroke-width": 2, opacity: ".9" }));

    var BULBS = 20;
    for (var b = 0; b < BULBS; b++) {
      var bp = pt((360 / BULBS) * b + 9, (R + RIM) / 2);
      svg.appendChild(el("circle", {
        class: "bulb", cx: bp[0].toFixed(2), cy: bp[1].toFixed(2), r: 2.6,
        fill: b % 2 ? "#ffffff" : "#f7c9e4",
        style: "animation-delay:" + (b * 0.09).toFixed(2) + "s",
      }));
    }

    /* 회전하는 부분 */
    wheelGroup = el("g", { id: "wheelGroup" });
    svg.appendChild(wheelGroup);

    var step = 360 / count;
    for (var i = 0; i < count; i++) {
      var a0 = i * step, a1 = (i + 1) * step;
      var p0 = pt(a0, R), p1 = pt(a1, R);
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
      var np = pt(mid, R * 0.86);
      var fp = pt(mid, R * 0.55);

      /* 숫자는 바깥쪽, 얼굴은 흰 동그라미 안에 */
      wheelGroup.appendChild(el("text", {
        class: "slice__num",
        x: np[0].toFixed(2), y: np[1].toFixed(2),
        "text-anchor": "middle", "dominant-baseline": "central",
        transform: "rotate(" + mid.toFixed(2) + " " + np[0].toFixed(2) + " " + np[1].toFixed(2) + ")",
      }, String(i + 1)));

      var rad = count > 8 ? 10 : 12;
      wheelGroup.appendChild(el("circle", {
        class: "slice__disc",
        cx: fp[0].toFixed(2), cy: fp[1].toFixed(2), r: rad,
      }));
      wheelGroup.appendChild(el("text", {
        class: "slice__face",
        x: fp[0].toFixed(2), y: fp[1].toFixed(2),
        "font-size": count > 8 ? 12 : 14,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, FACES[i % FACES.length]));

      /* 생성된 그림이 있으면 이모지 위에 원형으로 덮습니다 */
      addFaceArt(wheelGroup, ARTS[i % ARTS.length], fp[0], fp[1], rad, i);
    }

    /* 고정된 광택 — 회전 그룹 바깥에 둡니다 */
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: R, fill: "url(#glossGrad)", "pointer-events": "none" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: R, fill: "none", stroke: "#ffffff", "stroke-width": 3 }));

    /* 가운데 보석 */
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 17, fill: "#ffffff", filter: "url(#soft)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 13.5, fill: "url(#hubGrad)" }));
    svg.appendChild(el("ellipse", { cx: -4, cy: -5, rx: 4.2, ry: 2.8, fill: "#ffffff", opacity: ".75" }));

    /* 포인터 — 위에서 아래를 가리키는 물방울 */
    pointerG = el("g", { id: "pointerG", filter: "url(#soft)" });
    pointerG.appendChild(el("path", {
      d: "M -12 " + (-RIM - 9) + " Q 0 " + (-RIM - 20) + " 12 " + (-RIM - 9) +
         " Q 6 " + (-R + 6) + " 0 " + (-R + 12) +
         " Q -6 " + (-R + 6) + " -12 " + (-RIM - 9) + " Z",
      fill: "url(#ptrGrad)", stroke: "#ffffff", "stroke-width": 3, "stroke-linejoin": "round",
    }));
    pointerG.appendChild(el("circle", { cx: 0, cy: -RIM - 6, r: 3, fill: "#ffffff", opacity: ".8" }));
    svg.appendChild(pointerG);

    applyAngle();
  }

  function applyAngle() {
    if (wheelGroup) wheelGroup.setAttribute("transform", "rotate(" + angle.toFixed(2) + ")");
  }

  function buildList() {
    var box = document.getElementById("plist");
    var html = "";
    for (var i = 0; i < count; i++) {
      html +=
        '<div class="prow" style="--tone:' + TONES[i % TONES.length] + '">' +
          '<span class="prow__face">' + FACES[i % FACES.length] +
            Art.tag(ARTS[i % ARTS.length]) + "</span>" +
          '<span class="prow__name">Player ' + (i + 1) + "</span>" +
          '<span class="prow__no">' + (i + 1) + "</span>" +
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

    /* 당첨 칸 가운데가 포인터 아래로 오도록 목표 각도를 맞춥니다.
       칸 안에서 살짝 흔들리게 해 매번 같은 자리에 멈춘 티가 나지 않도록 합니다. */
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
        pointerG.classList.remove("is-knock");
        void pointerG.getBoundingClientRect();
        pointerG.classList.add("is-knock");
      }

      if (p < 1) requestAnimationFrame(frame);
      else {
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
    Fx.confetti(screen, { x: 50, y: 42, count: 54 });

    setTimeout(function () {
      document.getElementById("popEmoji").textContent = FACES[winner % FACES.length];
      document.getElementById("popTitle").textContent = "Player " + (winner + 1) + " 당첨!";
      document.getElementById("popText").textContent =
        count + "명 중 " + (winner + 1) + "번 칸이 뽑혔어요. 🎊";
      popup.classList.add("is-open");
      Sfx.play("coin");
    }, 600);
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

  Sfx.mountToggle(screen);
  Fx.sparkles(document.querySelector(".sky"), 7);
  draw();
  buildList();
})();
