/* ===== PRIZE WHEEL =====
   참가자 수만큼 칸을 나눈 룰렛을 돌려 당첨자를 뽑습니다.
   회전은 CSS 전환이 아니라 rAF 로 직접 계산합니다 — 그래야 칸을 넘어갈 때마다
   딸깍 소리를 정확한 순간에 낼 수 있습니다. */
(function () {
  "use strict";

  /* 참가자 캐릭터 10종. 캐릭터 13종(shared/chars.js) 중에서 고른 것으로,
     룰렛 칸과 참가자 목록에 똑같이 쓰입니다.
     칸 번호는 12시 방향부터 시계방향으로 1..10 입니다. */
  var CAST = ["rabbit", "cat", "penguin", "panda", "unicorn",
              "bear", "axolotl", "frog", "sloth", "koala"]
    .map(function (id) { return Chars.get(id); });

  /* 칸 색 — 원본 그림의 오로라빛 파스텔을 두 색 그라데이션으로 옮긴 값 */
  var TONES = [
    ["#c9d4f7", "#f3c7e3"], ["#f8b3ca", "#f59fb6"], ["#a9e4c7", "#cbeca2"],
    ["#fbda8c", "#f8be7e"], ["#b7e7a5", "#a6e3d7"], ["#ccb5ed", "#f3b4d9"],
    ["#fbd7a7", "#fdefcc"], ["#b9e9c7", "#eef0a9"], ["#f5a7c7", "#e990c3"],
    ["#c9a9eb", "#f5b9d3"],
  ];

  function who(i) { return CAST[i % CAST.length]; }

  var SPIN_MS = 4800;
  var MIN_TURNS = 5, MAX_TURNS = 8;
  var R = 76;          /* 칸이 그려지는 반지름 */
  var BAND_OUT = 93;   /* 룬 무늬 띠 바깥 */
  var BAND_IN = 82;    /* 룬 무늬 띠 안쪽 */
  var RIM = 99;        /* 로즈골드 테 바깥 */

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

  /** 칸 바깥쪽에 캐릭터를 얹습니다.
      숫자와 달리 캐릭터는 돌리지 않습니다 — 아래쪽 칸이 뒤집혀 보이기 때문입니다. */
  function addFace(parent, i, cx, cy, r) {
    var c = who(i);
    var g = el("g", { class: "slice__char" });
    var img = el("image", {
      href: Chars.url(c.id),
      x: (cx - r).toFixed(2), y: (cy - r).toFixed(2),
      width: (r * 2).toFixed(2), height: (r * 2).toFixed(2),
      preserveAspectRatio: "xMidYMid meet",
    });
    img.addEventListener("error", function () {
      img.remove();
      /* 그림이 없으면 이모지로 물러납니다 */
      g.appendChild(el("text", {
        class: "slice__face", x: cx.toFixed(2), y: cy.toFixed(2),
        "font-size": (r * 1.6).toFixed(1),
        "text-anchor": "middle", "dominant-baseline": "central",
      }, c.emoji));
    });
    g.appendChild(img);
    parent.appendChild(g);
  }

  /* ---------- 그리기 ---------- */

  function defs() {
    var d = el("defs");

    /* 칸마다 오로라빛 두 색 그라데이션 */
    for (var i = 0; i < TONES.length; i++) {
      var g = el("linearGradient", { id: "secG" + i, x1: "0%", y1: "0%", x2: "70%", y2: "100%" });
      g.appendChild(el("stop", { offset: "0%", "stop-color": TONES[i][0] }));
      g.appendChild(el("stop", { offset: "100%", "stop-color": TONES[i][1] }));
      d.appendChild(g);
    }

    /* 로즈골드 테 */
    var rim = el("linearGradient", { id: "rimGrad", x1: "10%", y1: "0%", x2: "60%", y2: "100%" });
    rim.appendChild(el("stop", { offset: "0%", "stop-color": "#fdf1ea" }));
    rim.appendChild(el("stop", { offset: "32%", "stop-color": "#f0cfc2" }));
    rim.appendChild(el("stop", { offset: "62%", "stop-color": "#e5b6a8" }));
    rim.appendChild(el("stop", { offset: "100%", "stop-color": "#cf9a8d" }));
    d.appendChild(rim);

    /* 무늬가 새겨진 라벤더 띠 */
    var band = el("linearGradient", { id: "bandGrad", x1: "0%", y1: "0%", x2: "40%", y2: "100%" });
    band.appendChild(el("stop", { offset: "0%", "stop-color": "#dfe0f6" }));
    band.appendChild(el("stop", { offset: "45%", "stop-color": "#cdd2ef" }));
    band.appendChild(el("stop", { offset: "100%", "stop-color": "#e7d6ea" }));
    d.appendChild(band);

    /* 가운데 오팔 보석 */
    var hub = el("radialGradient", { id: "hubGrad", cx: "36%", cy: "30%" });
    hub.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff" }));
    hub.appendChild(el("stop", { offset: "34%", "stop-color": "#d9f2ff" }));
    hub.appendChild(el("stop", { offset: "62%", "stop-color": "#f3d9f5" }));
    hub.appendChild(el("stop", { offset: "100%", "stop-color": "#b7a3e4" }));
    d.appendChild(hub);

    /* 유리 광택 — 회전하지 않고 고정돼 있어야 빛이 한 방향에서 오는 것처럼 보입니다 */
    var gloss = el("radialGradient", { id: "glossGrad", cx: "32%", cy: "22%", r: "74%" });
    gloss.appendChild(el("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": ".5" }));
    gloss.appendChild(el("stop", { offset: "40%", "stop-color": "#ffffff", "stop-opacity": ".14" }));
    gloss.appendChild(el("stop", { offset: "80%", "stop-color": "#ffffff", "stop-opacity": "0" }));
    d.appendChild(gloss);

    var shadow = el("filter", { id: "soft", x: "-30%", y: "-30%", width: "160%", height: "160%" });
    shadow.appendChild(el("feDropShadow", {
      dx: 0, dy: 3, stdDeviation: 3, "flood-color": "#7a5f9c", "flood-opacity": ".38",
    }));
    d.appendChild(shadow);

    return d;
  }

  /** 테 둘레의 작은 보석 장식 */
  function studs(parent) {
    var N = 16;
    for (var i = 0; i < N; i++) {
      var a = (360 / N) * i + 11;
      var pp = pt(a, (BAND_OUT + BAND_IN) / 2);
      var col = ["#f4b9cf", "#bcd3f2", "#f7ddaa", "#cbbaf0"][i % 4];
      parent.appendChild(el("path", {
        class: "stud",
        d: "M 0 -3.4 L 3 0 L 0 3.4 L -3 0 Z",
        transform: "translate(" + pp[0].toFixed(2) + " " + pp[1].toFixed(2) + ") rotate(" + a.toFixed(1) + ")",
        fill: col, stroke: "#fffaf6", "stroke-width": 1,
        style: "animation-delay:" + (i * 0.11).toFixed(2) + "s",
      }));
    }
  }

  function draw() {
    svg.innerHTML = "";
    svg.appendChild(defs());

    /* 바깥 로즈골드 테 → 무늬 띠 → 안쪽 테 */
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: RIM, fill: "url(#rimGrad)", filter: "url(#soft)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: RIM - 2.5, fill: "none",
                                   stroke: "#fffaf6", "stroke-width": 1.6, opacity: ".85" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: BAND_OUT, fill: "url(#bandGrad)" }));
    studs(svg);
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: BAND_IN, fill: "url(#rimGrad)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: BAND_IN - 3, fill: "none",
                                   stroke: "#fffaf6", "stroke-width": 1.4, opacity: ".8" }));

    /* 회전하는 부분 */
    wheelGroup = el("g", { id: "wheelGroup" });
    svg.appendChild(wheelGroup);

    var step = 360 / count;
    for (var i = 0; i < count; i++) {
      /* 반 칸 앞에서 시작해야 1번 칸이 12시 방향 한가운데에 옵니다 */
      var a0 = i * step - step / 2, a1 = a0 + step;
      var p0 = pt(a0, R), p1 = pt(a1, R);
      var large = step > 180 ? 1 : 0;

      wheelGroup.appendChild(el("path", {
        class: "sector",
        "data-i": i,
        d: "M 0 0 L " + p0[0].toFixed(2) + " " + p0[1].toFixed(2) +
           " A " + R + " " + R + " 0 " + large + " 1 " +
           p1[0].toFixed(2) + " " + p1[1].toFixed(2) + " Z",
        fill: "url(#secG" + (i % TONES.length) + ")",
      }));

      /* 참고 화면과 달리 숫자를 안쪽, 캐릭터를 바깥쪽에 둡니다.
         칸은 바깥으로 갈수록 넓어서, 큰 캐릭터가 바깥에 있어야 칸 안에 다 들어갑니다. */
      var mid = a0 + step / 2;
      var np = pt(mid, R * 0.45);
      var fp = pt(mid, R * 0.74);

      /* 숫자는 바깥쪽, 얼굴은 그 안쪽에 */
      wheelGroup.appendChild(el("text", {
        class: "slice__num",
        x: np[0].toFixed(2), y: np[1].toFixed(2),
        "font-size": count > 8 ? 15 : 19,
        "text-anchor": "middle", "dominant-baseline": "central",
        transform: "rotate(" + mid.toFixed(2) + " " + np[0].toFixed(2) + " " + np[1].toFixed(2) + ")",
      }, String(i + 1)));

      addFace(wheelGroup, i, fp[0], fp[1], count > 8 ? 13 : 16);
    }

    /* 고정된 광택 — 회전 그룹 바깥에 둡니다 */
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: R, fill: "url(#glossGrad)", "pointer-events": "none" }));

    /* 가운데 보석 받침 */
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 22, fill: "url(#rimGrad)", filter: "url(#soft)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 18, fill: "url(#bandGrad)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 18, fill: "none", stroke: "#fffaf6", "stroke-width": 1.2 }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 13, fill: "url(#rimGrad)" }));
    svg.appendChild(el("circle", { cx: 0, cy: 0, r: 10, fill: "url(#hubGrad)" }));
    svg.appendChild(el("ellipse", { cx: -3, cy: -3.6, rx: 3.2, ry: 2.1, fill: "#ffffff", opacity: ".8" }));

    /* 포인터 — 위에 얹힌 로즈골드 삼각 보석 */
    pointerG = el("g", { id: "pointerG", filter: "url(#soft)" });
    pointerG.appendChild(el("path", {
      d: "M -15 " + (-RIM - 4) + " Q -17 " + (-RIM - 15) + " -8 " + (-RIM - 16) +
         " L 8 " + (-RIM - 16) + " Q 17 " + (-RIM - 15) + " 15 " + (-RIM - 4) +
         " L 2 " + (-RIM + 17) + " Q 0 " + (-RIM + 20) + " -2 " + (-RIM + 17) + " Z",
      fill: "url(#rimGrad)", stroke: "#fffaf6", "stroke-width": 2.4, "stroke-linejoin": "round",
    }));
    pointerG.appendChild(el("path", {
      d: "M -8 " + (-RIM - 9) + " L 8 " + (-RIM - 9) + " L 0 " + (-RIM + 9) + " Z",
      fill: "url(#hubGrad)", stroke: "#fffaf6", "stroke-width": 1.2, "stroke-linejoin": "round",
    }));
    svg.appendChild(pointerG);

    applyAngle();
  }

  function applyAngle() {
    if (wheelGroup) wheelGroup.setAttribute("transform", "rotate(" + angle.toFixed(2) + ")");
  }

  /* 참가자 목록 — 룰렛 칸에 있는 캐릭터가 그대로 줄줄이 나옵니다.
     (룰렛 플레이어화면.png 을 본떴습니다) */
  function buildList() {
    var box = document.getElementById("plist");
    var html = "";
    for (var i = 0; i < count; i++) {
      var t = TONES[i % TONES.length];
      var c = who(i);
      html +=
        '<div class="prow" style="--t1:' + t[0] + ";--t2:" + t[1] + '">' +
          '<span class="prow__face">' + c.emoji + Chars.tag(c.id) + "</span>" +
          '<span class="prow__name">Player ' + (i + 1) + "</span>" +
          '<span class="prow__ko">' + c.ko + "</span>" +
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
    var center = winner * step;
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
      var c = who(winner);
      document.getElementById("popEmoji").innerHTML = c.emoji + Chars.tag(c.id);
      document.getElementById("popTitle").textContent = "Player " + (winner + 1) + " 당첨!";
      document.getElementById("popText").textContent =
        count + "명 중 " + (winner + 1) + "번(" + c.ko + ") 칸이 뽑혔어요. 🎊";
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
  Fx.sparkles(document.querySelector(".sky"), 6, ["✨", "⭐"]);
  draw();
  buildList();
})();
