/* ===== LADDER PATH =====
   인원수만큼 세로줄을 세우고 그 사이에 무작위 가로줄을 놓습니다.
   캐릭터는 아래로 내려가다 가로줄을 만나면 반드시 옆줄로 옮겨 갑니다. */
(function () {
  "use strict";

  var FACES = ["🐻", "🐸", "🐧", "🐶", "🐰", "🐱", "🐼", "🦊"];
  /* 같은 순서의 생성 그림. 파일이 없으면 위 이모지가 그대로 쓰입니다. */
  var ARTS = ["ch-bear", "ch-frog", "ch-penguin", "ch-dog",
              "ch-rabbit", "ch-cat", "ch-panda", "ch-fox"];
  var TONES = ["#e8c9a8", "#bfe8b4", "#e6efa8", "#b9d5f2", "#f7c8dd", "#bfe4ee", "#dcd6f2", "#f6cdaa"];
  var LINES = ["#8fd3a4", "#a9b8ef", "#f6a9c0", "#7fd6d1", "#c3e07a", "#f2c07a", "#c9a9e8", "#8fc7ee"];
  var LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];

  /* 🪨 이모지는 어두운 덩어리로 보여 밝은 화면에 어울리지 않습니다.
     참고 이미지처럼 표정 있는 조약돌을 직접 그립니다. */
  var PEBBLE =
    '<svg viewBox="0 0 40 40" class="pebble">' +
      '<path d="M6 26 q0-13 14-14 q14 1 14 14 q0 8-14 8 q-14 0-14-8 Z" ' +
        'fill="#cfc7bd" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M10 22 q3-7 10-8" stroke="#e6e0d8" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="15" cy="24" r="1.8" fill="#5c5148"/>' +
      '<circle cx="25" cy="24" r="1.8" fill="#5c5148"/>' +
      '<path d="M17 29 q3 2 6 0" stroke="#5c5148" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
    '</svg>';

  var ROWS = 9;          /* 가로줄이 놓일 수 있는 층 수 */
  var RUNG_CHANCE = 0.45;
  var RUN_MS = 2100;     /* 한 캐릭터가 끝까지 내려가는 시간 */
  var STAGGER = 170;     /* 전체 시작 시 출발 간격 */
  var MIN = 2, MAX = 8;

  var heads = document.getElementById("heads");
  var goals = document.getElementById("goals");
  var track = document.getElementById("track");
  var svg = document.getElementById("svg");
  var startAll = document.getElementById("startAll");
  var popup = document.getElementById("popup");
  var setup = document.getElementById("setup");
  var numLabel = document.getElementById("numLabel");

  var count = 6;        /* 인원수 */
  var draftCount = 6;   /* 설정 패널에서 조정 중인 값 */
  var winGoal = 0;      /* 당첨이 놓인 아래쪽 칸 */
  var rungs = [];       /* rungs[row][i] : i번과 i+1번 세로줄 사이 가로줄 */
  var running = 0;      /* 지금 내려가는 중인 캐릭터 수 */
  var finished = [];    /* 이미 도착한 캐릭터 */

  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- 사다리 만들기 ---------- */

  function genRungs() {
    rungs = [];
    for (var r = 0; r < ROWS; r++) {
      var row = [];
      for (var i = 0; i < count - 1; i++) {
        /* 바로 옆에 가로줄이 있으면 놓지 않습니다 — 갈림길이 애매해지니까 */
        row[i] = !row[i - 1] && Math.random() < RUNG_CHANCE;
      }
      rungs.push(row);
    }
    /* 세로줄마다 최소 한 번은 가로줄을 만나게 해 결과가 뻔해지지 않도록 */
    for (var c = 0; c < count; c++) {
      var touched = rungs.some(function (row) {
        return row[c - 1] || row[c];
      });
      if (!touched) {
        var r2 = Math.floor(Math.random() * ROWS);
        var i2 = c === count - 1 ? c - 1 : c;
        rungs[r2][i2] = true;
      }
    }
  }

  function geom() {
    var w = track.clientWidth || 320;
    var h = track.clientHeight || 260;
    var padX = w * 0.085;
    var gapX = count > 1 ? (w - padX * 2) / (count - 1) : 0;
    var padY = 12;
    var stepY = (h - padY * 2) / (ROWS + 1);
    return {
      w: w, h: h,
      x: function (i) { return padX + i * gapX; },
      y: function (r) { return padY + (r + 1) * stepY; },
      xPct: function (i) { return ((padX + i * gapX) / w) * 100; },
    };
  }

  /** 시작 줄 c 에서 출발했을 때 꺾이는 지점들과 도착 칸.
      직선 구간의 중간 점은 넣지 않습니다 — 모서리를 둥글게 다듬을 때
      길이가 0 인 구간이 있으면 계산이 깨지기 때문입니다. */
  function pathOf(c, g) {
    var pts = [[g.x(c), 0]];
    var horiz = [false];
    for (var r = 0; r < ROWS; r++) {
      var y = g.y(r);
      var to = null;
      if (rungs[r][c - 1]) to = c - 1;
      else if (rungs[r][c]) to = c + 1;
      if (to === null) continue;

      pts.push([g.x(c), y]);   /* 내려오다 멈춘 지점 */
      horiz.push(false);
      c = to;
      pts.push([g.x(c), y]);   /* 옆줄로 옮겨간 지점 */
      horiz.push(true);
    }
    pts.push([g.x(c), g.h]);
    horiz.push(false);
    return { pts: pts, horiz: horiz, end: c };
  }

  /** 꺾이는 모서리를 둥글게 이어 붙인 path 문자열.
      참고 이미지의 사다리처럼 각진 데 없이 부드럽게 흐르도록 합니다. */
  function roundedPath(pts, radius) {
    if (pts.length < 3) {
      return "M " + pts.map(function (p) { return p[0] + " " + p[1]; }).join(" L ");
    }
    var d = "M " + pts[0][0].toFixed(2) + " " + pts[0][1].toFixed(2);
    for (var i = 1; i < pts.length - 1; i++) {
      var prev = pts[i - 1], cur = pts[i], next = pts[i + 1];
      var v1x = prev[0] - cur[0], v1y = prev[1] - cur[1];
      var v2x = next[0] - cur[0], v2y = next[1] - cur[1];
      var l1 = Math.hypot(v1x, v1y) || 1;
      var l2 = Math.hypot(v2x, v2y) || 1;
      var rr = Math.min(radius, l1 / 2, l2 / 2);

      var ax = cur[0] + (v1x / l1) * rr, ay = cur[1] + (v1y / l1) * rr;
      var bx = cur[0] + (v2x / l2) * rr, by = cur[1] + (v2y / l2) * rr;

      d += " L " + ax.toFixed(2) + " " + ay.toFixed(2) +
           " Q " + cur[0].toFixed(2) + " " + cur[1].toFixed(2) +
           " " + bx.toFixed(2) + " " + by.toFixed(2);
    }
    var last = pts[pts.length - 1];
    d += " L " + last[0].toFixed(2) + " " + last[1].toFixed(2);
    return d;
  }

  /* ---------- 그리기 ---------- */

  function drawBoard() {
    var g = geom();
    svg.setAttribute("viewBox", "0 0 " + g.w + " " + g.h);
    svg.innerHTML = "";

    var defs = el("defs");
    var f = el("filter", { id: "railShadow", x: "-20%", y: "-20%", width: "140%", height: "140%" });
    f.appendChild(el("feDropShadow", {
      dx: 0, dy: 2, stdDeviation: 1.5, "flood-color": "#8a6a52", "flood-opacity": ".3",
    }));
    defs.appendChild(f);
    svg.appendChild(defs);

    var base = el("g", { filter: "url(#railShadow)" });
    svg.appendChild(base);

    /* 세로줄 */
    for (var i = 0; i < count; i++) {
      base.appendChild(el("line", {
        class: "rail", x1: g.x(i), y1: 0, x2: g.x(i), y2: g.h,
        stroke: LINES[i], "stroke-width": 11,
      }));
      /* 위쪽에 얹는 밝은 선 — 둥근 막대처럼 보이게 합니다 */
      base.appendChild(el("line", {
        class: "railHi", x1: g.x(i) - 2.4, y1: 4, x2: g.x(i) - 2.4, y2: g.h - 4,
        stroke: "#ffffff", "stroke-width": 2.4, opacity: ".4",
      }));
    }
    /* 가로줄 */
    for (var r = 0; r < ROWS; r++) {
      for (var j = 0; j < count - 1; j++) {
        if (!rungs[r][j]) continue;
        base.appendChild(el("line", {
          class: "rung", x1: g.x(j), y1: g.y(r), x2: g.x(j + 1), y2: g.y(r),
          stroke: LINES[j], "stroke-width": 11,
        }));
        base.appendChild(el("line", {
          class: "railHi", x1: g.x(j) + 4, y1: g.y(r) - 2.4, x2: g.x(j + 1) - 4, y2: g.y(r) - 2.4,
          stroke: "#ffffff", "stroke-width": 2.4, opacity: ".4",
        }));
      }
    }
  }

  function drawNodes() {
    var g = geom();
    heads.innerHTML = "";
    goals.innerHTML = "";

    for (var i = 0; i < count; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "node";
      b.dataset.i = i;
      b.style.left = g.xPct(i) + "%";
      b.style.setProperty("--tone", TONES[i]);
      b.innerHTML =
        '<span class="node__face">' + FACES[i] + Art.tag(ARTS[i]) + "</span>" +
        '<span class="node__label">' + LABELS[i] + "</span>";
      heads.appendChild(b);

      var win = i === winGoal;
      var d = document.createElement("div");
      d.className = "node goal" + (win ? " is-win" : "");
      d.dataset.i = i;
      d.style.left = g.xPct(i) + "%";
      d.innerHTML =
        '<span class="goal__icon">' + (win ? "🏆" : PEBBLE) + "</span>" +
        '<span class="goal__name">' + (win ? "당첨" : "꽝") + "</span>" +
        '<span class="goal__sub">' + (win ? "Win" : "Lose") + " · " + LABELS[i] + "</span>";
      goals.appendChild(d);
    }
  }

  /* ---------- 내려가기 ---------- */

  function run(i, onDone) {
    if (finished.indexOf(i) !== -1) return;
    finished.push(i);
    running++;
    startAll.disabled = true;

    var g = geom();
    var info = pathOf(i, g);
    var d = roundedPath(info.pts, 14);

    var trace = el("path", {
      class: "trace", d: d, stroke: LINES[i], "stroke-dasharray": 1, "stroke-dashoffset": 1,
    });
    svg.appendChild(trace);

    var tokenG = el("g", { class: "tokenG" });
    var disc = el("circle", { class: "token__disc", cx: info.pts[0][0], cy: info.pts[0][1], r: 15 });
    var token = el("text", {
      class: "token", x: info.pts[0][0], y: info.pts[0][1],
      "text-anchor": "middle", "dominant-baseline": "central", "font-size": 20,
    });
    token.textContent = FACES[i];
    tokenG.appendChild(disc);
    tokenG.appendChild(token);
    svg.appendChild(tokenG);

    var total = trace.getTotalLength();
    trace.setAttribute("stroke-dasharray", total);
    trace.setAttribute("stroke-dashoffset", total);

    /* 꼭짓점마다 누적 길이를 재둡니다 — 꺾이는 순간에 소리를 내기 위해.
       모서리를 둥글리면 실제 길이가 조금 줄어들므로 비율로 환산합니다. */
    var raw = [0];
    for (var k = 1; k < info.pts.length; k++) {
      var dx = info.pts[k][0] - info.pts[k - 1][0];
      var dy = info.pts[k][1] - info.pts[k - 1][1];
      raw[k] = raw[k - 1] + Math.hypot(dx, dy);
    }
    var rawTotal = raw[raw.length - 1] || 1;
    var marks = raw.map(function (v) { return (v / rawTotal) * total; });

    var node = heads.querySelector('.node[data-i="' + i + '"]');
    if (node) node.classList.add("is-running");

    var t0 = performance.now();
    var nextMark = 1;
    var lastWalk = 0;

    function frame(now) {
      var p = Math.min((now - t0) / RUN_MS, 1);
      var eased = p < 1 ? 1 - Math.pow(1 - p, 1.7) : 1;  /* 처음엔 빠르고 끝에서 느긋하게 */
      var len = total * eased;

      trace.setAttribute("stroke-dashoffset", total - len);
      var pt = trace.getPointAtLength(len);
      token.setAttribute("x", pt.x);
      token.setAttribute("y", pt.y);
      disc.setAttribute("cx", pt.x);
      disc.setAttribute("cy", pt.y);

      while (nextMark < marks.length && len >= marks[nextMark]) {
        if (info.horiz[nextMark]) Sfx.play("turn");
        nextMark++;
      }
      if (now - lastWalk > 190) {
        Sfx.play("walk");
        lastWalk = now;
      }

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        tokenG.remove();
        arrive(i, info.end);
        if (node) node.classList.remove("is-running");
        running--;
        if (running === 0) startAll.disabled = false;
        if (onDone) onDone(info.end);
      }
    }
    requestAnimationFrame(frame);
  }

  function arrive(i, end) {
    var goal = goals.querySelector('.goal[data-i="' + end + '"]');
    if (goal) goal.classList.add("is-hit");
    Sfx.play(end === winGoal ? "coin" : "drop");
  }

  /* ---------- 조작 ---------- */

  function newRound(keepCount) {
    if (!keepCount) count = draftCount;
    winGoal = Math.floor(Math.random() * count);
    finished = [];
    running = 0;
    startAll.disabled = false;
    genRungs();
    drawBoard();
    drawNodes();
    popup.classList.remove("is-open");
  }

  function showResult(winnerIdx) {
    var e = document.getElementById("popEmoji");
    var t = document.getElementById("popTitle");
    var x = document.getElementById("popText");
    if (winnerIdx === -1) {
      e.textContent = "🪨";
      t.textContent = "아무도 못 뽑았어요";
      x.textContent = "당첨은 " + LABELS[winGoal] + " 자리에 있었어요.";
      Sfx.play("lose");
    } else {
      e.textContent = FACES[winnerIdx];
      t.textContent = "당첨!";
      Fx.confetti(document.getElementById("screen"), { x: 50, y: 45, count: 52 });
      x.textContent = LABELS[winnerIdx] + " 캐릭터가 당첨됐어요! 🏆";
      Sfx.play("win");
    }
    popup.classList.add("is-open");
  }

  startAll.addEventListener("click", function () {
    if (running) return;
    Sfx.play("tap");
    finished = [];
    svg.querySelectorAll(".trace, .tokenG").forEach(function (n) { n.remove(); });
    goals.querySelectorAll(".goal").forEach(function (n) { n.classList.remove("is-hit"); });

    var done = 0;
    var winner = -1;
    for (var i = 0; i < count; i++) {
      (function (idx) {
        setTimeout(function () {
          run(idx, function (end) {
            if (end === winGoal) winner = idx;
            if (++done === count) {
              Progress.bump("ladder");
              setTimeout(function () { showResult(winner); }, 450);
            }
          });
        }, idx * STAGGER);
      })(i);
    }
  });

  heads.addEventListener("click", function (e) {
    var node = e.target.closest(".node");
    if (!node || running) return;
    Sfx.play("tap");
    run(Number(node.dataset.i));
  });

  document.getElementById("reset").addEventListener("click", function () {
    Sfx.play("back");
    newRound(true);
  });
  document.getElementById("popAgain").addEventListener("click", function () {
    Sfx.play("tap");
    newRound(true);
  });

  /* 설정 패널 */
  function paintSetup() {
    numLabel.textContent = draftCount;
    document.getElementById("minus").disabled = draftCount <= MIN;
    document.getElementById("plus").disabled = draftCount >= MAX;
  }
  document.getElementById("openSetup").addEventListener("click", function () {
    Sfx.play("tap");
    draftCount = count;
    paintSetup();
    setup.classList.add("is-open");
  });
  document.getElementById("minus").addEventListener("click", function () {
    if (draftCount > MIN) { draftCount--; Sfx.play("tap"); paintSetup(); }
  });
  document.getElementById("plus").addEventListener("click", function () {
    if (draftCount < MAX) { draftCount++; Sfx.play("pop"); paintSetup(); }
  });
  document.getElementById("applySetup").addEventListener("click", function () {
    Sfx.play("tap");
    setup.classList.remove("is-open");
    newRound(false);
  });
  setup.addEventListener("click", function (e) {
    if (e.target === setup) setup.classList.remove("is-open");
  });

  /* 화면 크기가 바뀌면 좌표를 다시 계산합니다 */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (running) return;
      drawBoard();
      drawNodes();
      finished = [];
    }, 160);
  });

  Sfx.mountToggle(document.getElementById("screen"));
  newRound(false);
})();
