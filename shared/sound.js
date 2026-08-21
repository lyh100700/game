/* ===== 효과음 엔진 =====
   오디오 파일 없이 Web Audio API 로 즉석 합성합니다.
   - 용량 0, 오프라인 동작, 로딩 지연 없음
   - 브라우저 자동재생 정책에 맞춰 첫 사용자 입력 때 잠금 해제

   소리를 만들 때 지킨 것들
   1) 클릭 잡음 없애기 — 음을 0 에서 시작하지 않고, 끝도 뚝 끊지 않습니다.
   2) 같은 소리 반복 금지 — tick·walk·click 처럼 자주 나는 소리는
      칠 때마다 높이와 세기를 조금씩 흔듭니다. 똑같이 반복되면 기계처럼 들립니다.
   3) 한 소리 = 여러 겹 — 톡 치는 순간(transient) · 몸통 · 꼬리를 따로 쌓습니다.
   4) 울림 — 멜로디 계열만 짧은 잔향으로 보내 공간감을 줍니다.
   5) 리미터 — 소리가 겹쳐도 찢어지지 않게 마지막에 눌러 줍니다.

   사용법: Sfx.play("tap")  /  Sfx.play("spin", { dur: 4.8 })  /  Sfx.toggle()  */
(function (global) {
  "use strict";

  var MUTE_KEY = "cutegames.muted.v1";
  var VOLUME = 0.85;
  var MAX_VOICES = 28;          /* 이보다 많이 겹치면 새 소리를 건너뜁니다 */

  var ctx = null;
  var master = null;            /* 모든 소리가 모이는 곳 */
  var wet = null;               /* 잔향으로 보내는 길 */
  var muted = false;
  var voices = 0;

  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch (e) {}

  /* ---------- 준비 ---------- */

  /** 잔향용 임펄스 — 짧은 방 하나를 잡음에서 만들어 냅니다. */
  function makeRoom(c, seconds, decay) {
    var len = Math.floor(c.sampleRate * seconds);
    var buf = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  /** 부드러운 리미터 곡선. knee 아래는 그대로, 위는 1.0 으로 눕습니다. */
  function softClip(knee) {
    var n = 4096;
    var curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;
      var a = Math.abs(x);
      var y = a <= knee ? a : knee + (1 - knee) * Math.tanh((a - knee) / (1 - knee));
      curve[i] = x < 0 ? -y : y;
    }
    return curve;
  }

  function ensure() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();

    /* 마지막에 붙는 리미터.
       DynamicsCompressor 는 문턱보다 한참 낮은 소리까지 10dB 넘게 눌러 버려서
       앱 전체가 먹먹해집니다. 그래서 파형을 직접 깎는 방식을 씁니다 —
       0.7 아래는 손대지 않고, 그 위만 1.0 을 넘지 않도록 부드럽게 눕힙니다. */
    var lim = ctx.createWaveShaper();
    lim.curve = softClip(0.7);
    lim.oversample = "2x";

    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(lim);
    lim.connect(ctx.destination);

    /* 잔향 — 멜로디 계열만 이쪽으로 조금 보냅니다 */
    try {
      var verb = ctx.createConvolver();
      verb.buffer = makeRoom(ctx, 1.1, 3.2);
      var damp = ctx.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 3600;
      wet = ctx.createGain();
      wet.gain.value = 0.32;
      wet.connect(damp);
      damp.connect(verb);
      verb.connect(master);
    } catch (e) {
      wet = null;
    }
    return ctx;
  }

  /* iOS·크롬은 사용자 입력 없이는 소리를 내지 않습니다. */
  function unlock() {
    var c = ensure();
    if (c && c.state === "suspended") c.resume();
  }
  ["pointerdown", "touchstart", "keydown"].forEach(function (ev) {
    global.addEventListener(ev, unlock, { passive: true });
  });

  /* ---------- 작은 도구 ---------- */

  function rnd(a, b) { return a + Math.random() * (b - a); }

  /** 반음 단위로 올린 주파수 */
  function semi(freq, n) { return freq * Math.pow(2, n / 12); }

  /** 목소리 하나를 등록합니다. 너무 많이 겹치면 false. */
  function claim(dur) {
    if (voices >= MAX_VOICES) return false;
    voices++;
    setTimeout(function () { voices--; }, (dur + 0.1) * 1000);
    return true;
  }

  /** 클릭 잡음 없는 봉투. 0 에서 시작하지 않고 끝도 부드럽게 놓습니다. */
  function env(g, t0, dur, peak, attack) {
    var atk = attack == null ? 0.006 : attack;
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(peak, t0 + atk);
    g.exponentialRampToValueAtTime(Math.max(peak * 0.28, 0.0002), t0 + atk + dur * 0.28);
    g.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  /* ---------- 기본 재료 ---------- */

  /** 한 음. freq -> to 로 미끄러지며 사라집니다. */
  function tone(o) {
    var c = ensure();
    if (!c || muted) return;
    var dur = o.dur || 0.15;
    if (!claim(dur)) return;
    var t0 = c.currentTime + (o.delay || 0);

    var osc = c.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(o.to, 1), t0 + dur * (o.bend || 1));
    if (o.detune) osc.detune.value = o.detune;

    var g = c.createGain();
    env(g.gain, t0, dur, o.gain == null ? 0.3 : o.gain, o.attack);

    var node = osc;
    if (o.cutoff) {
      var f = c.createBiquadFilter();
      f.type = o.filter || "lowpass";
      f.frequency.setValueAtTime(o.cutoff, t0);
      if (o.cutoffTo) f.frequency.exponentialRampToValueAtTime(Math.max(o.cutoffTo, 30), t0 + dur);
      f.Q.value = o.q == null ? 0.7 : o.q;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    if (o.room && wet) g.connect(wet);

    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /** 잡음 한 덩어리. 톡 치는 순간·바람·부스러기 재료입니다. */
  function noise(o) {
    var c = ensure();
    if (!c || muted) return;
    var dur = o.dur || 0.15;
    if (!claim(dur)) return;
    var t0 = c.currentTime + (o.delay || 0);

    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    var src = c.createBufferSource();
    src.buffer = buf;

    var f = c.createBiquadFilter();
    f.type = o.filter || "bandpass";
    f.frequency.setValueAtTime(o.freq || 1200, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(o.to, 20), t0 + dur);
    f.Q.value = o.q == null ? 1 : o.q;

    var g = c.createGain();
    env(g.gain, t0, dur, o.gain == null ? 0.25 : o.gain, o.attack == null ? 0.004 : o.attack);

    src.connect(f);
    f.connect(g);
    g.connect(master);
    if (o.room && wet) g.connect(wet);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  /** 음계 순서대로 연주 */
  function melody(notes, opt) {
    opt = opt || {};
    notes.forEach(function (n, i) {
      tone({
        freq: n,
        type: opt.type || "triangle",
        dur: opt.dur || 0.18,
        gain: opt.gain || 0.26,
        delay: (opt.delay || 0) + i * (opt.step || 0.09),
        room: opt.room !== false,
      });
      /* 한 옥타브 위를 아주 작게 겹쳐 종소리 결을 냅니다 */
      if (opt.shine) {
        tone({
          freq: n * 2, type: "sine", dur: (opt.dur || 0.18) * 1.6,
          gain: (opt.gain || 0.26) * 0.22,
          delay: (opt.delay || 0) + i * (opt.step || 0.09), room: true,
        });
      }
    });
  }

  /** 화음 한 번 — 여러 음을 동시에 */
  function chord(notes, opt) {
    opt = opt || {};
    notes.forEach(function (n) {
      tone({
        freq: n, type: opt.type || "triangle",
        dur: opt.dur || 0.5, gain: (opt.gain || 0.2) / Math.sqrt(notes.length),
        delay: opt.delay || 0, room: true,
      });
    });
  }

  /* 자주 나는 소리가 똑같이 반복되지 않도록 순서를 돌립니다 */
  var turnRobin = 0;

  /* ---------- 효과음 목록 ---------- */
  var SOUNDS = {
    /* ---- 공통 ---- */

    /** 가볍게 툭 — 나무 실로폰 한 대 */
    tap: function () {
      var f = rnd(760, 830);
      tone({ freq: f, to: f * 0.94, dur: 0.09, gain: 0.16, type: "sine" });
      tone({ freq: f * 3, dur: 0.05, gain: 0.05, type: "triangle" });
      noise({ freq: 5200, dur: 0.014, gain: 0.045, filter: "highpass" });
    },

    /** 방울이 톡 터지는 소리 */
    pop: function () {
      var f = rnd(360, 440);
      tone({ freq: f, to: f * 4.2, dur: 0.075, gain: 0.22, type: "sine", bend: 0.7 });
      noise({ freq: 2800, to: 5200, dur: 0.035, gain: 0.07, q: 0.8 });
    },

    /** 뒤로 가기 — 부드럽게 내려앉습니다 */
    back: function () {
      tone({ freq: 700, to: 400, dur: 0.15, gain: 0.16, type: "sine" });
      tone({ freq: 350, to: 200, dur: 0.18, gain: 0.07, type: "triangle" });
    },

    /** 이겼을 때 — 도미솔도 올라가고 종소리 꼬리 */
    win: function () {
      melody([523, 659, 784, 1047], { step: 0.095, dur: 0.34, gain: 0.24, shine: true });
      chord([1047, 1319, 1568], { dur: 0.9, gain: 0.16, delay: 0.4, type: "sine" });
    },

    /** 아쉬울 때 — 거칠지 않게, 힘 빠지듯 내려갑니다 */
    lose: function () {
      melody([440, 392, 330], { step: 0.13, dur: 0.3, gain: 0.18, type: "triangle" });
      tone({ freq: 294, to: 180, dur: 0.55, gain: 0.16, type: "sine", delay: 0.36, room: true });
      tone({ freq: 147, to: 96, dur: 0.6, gain: 0.09, type: "triangle", delay: 0.36 });
    },

    /** 동전 — 딩! 하고 밝게 */
    coin: function () {
      tone({ freq: 988, dur: 0.06, gain: 0.16, type: "square", cutoff: 3200 });
      tone({ freq: 1319, dur: 0.3, gain: 0.15, type: "square", cutoff: 3600, delay: 0.055, room: true });
      tone({ freq: 2637, dur: 0.35, gain: 0.05, type: "sine", delay: 0.055, room: true });
    },

    /* ---- 공룡 이빨 ---- */

    /** 이빨이 잇몸으로 쑥 들어가는 소리 */
    tooth: function () {
      var f = rnd(380, 460);
      tone({ freq: f, to: f * 0.3, dur: 0.14, gain: 0.22, type: "sine", bend: 0.6 });
      noise({ freq: rnd(900, 1300), to: 260, dur: 0.09, gain: 0.09, q: 1.6 });
      tone({ freq: 120, to: 70, dur: 0.2, gain: 0.12, type: "sine", delay: 0.03 });
    },

    /** 입이 콱 닫히는 소리 — 바람 · 뼈 부딪힘 · 낮은 울림 */
    chomp: function () {
      noise({ freq: 6000, dur: 0.012, gain: 0.17, filter: "highpass" });      /* 딱 하는 순간 */
      noise({ freq: 2200, to: 320, dur: 0.18, gain: 0.19, q: 0.9 });          /* 살점 뜯기 */
      tone({ freq: 200, to: 52, dur: 0.32, gain: 0.24, type: "square",
             cutoff: 1100, cutoffTo: 260, delay: 0.03 });                     /* 턱 닫힘 */
      noise({ freq: 3400, dur: 0.05, gain: 0.12, filter: "highpass", delay: 0.07 }); /* 뼈 조각 */
      tone({ freq: 88, to: 38, dur: 0.7, gain: 0.21, type: "sine", delay: 0.09 });    /* 배 속 울림 */
    },

    /** 낮게 그르렁 — 살짝 어긋난 두 음이 맥놀이를 만듭니다 */
    growl: function () {
      tone({ freq: 104, to: 68, dur: 0.85, gain: 0.16, type: "sawtooth", cutoff: 520, cutoffTo: 240 });
      tone({ freq: 104, to: 68, dur: 0.85, gain: 0.14, type: "sawtooth",
             cutoff: 440, detune: 14 });
      noise({ freq: 260, to: 150, dur: 0.8, gain: 0.06, q: 0.6 });
    },

    /* ---- 사다리 ---- */

    /** 발소리 — 왼발 오른발이 번갈아 나도록 높이를 바꿉니다 */
    walk: function () {
      turnRobin = (turnRobin + 1) % 2;
      var f = turnRobin ? rnd(500, 540) : rnd(430, 470);
      tone({ freq: f, to: f * 1.12, dur: 0.05, gain: 0.075, type: "triangle" });
      noise({ freq: 1500, to: 700, dur: 0.035, gain: 0.03, q: 1.2 });
    },

    /** 가로줄을 만나 옆으로 꺾일 때 — 나무 도막 두드리는 소리 */
    turn: function () {
      var f = rnd(720, 800);
      tone({ freq: f, to: f * 0.72, dur: 0.075, gain: 0.13, type: "sine" });
      tone({ freq: f * 2.7, dur: 0.03, gain: 0.035, type: "triangle" });
    },

    /** 바닥에 도착 — 내려앉고 한 번 튑니다 */
    drop: function () {
      tone({ freq: 620, to: 210, dur: 0.22, gain: 0.19, type: "sine", bend: 0.8 });
      tone({ freq: 150, to: 90, dur: 0.2, gain: 0.14, type: "triangle", delay: 0.02 });
      tone({ freq: 420, to: 300, dur: 0.08, gain: 0.06, type: "sine", delay: 0.2 });
    },

    /* ---- 스톱워치 ---- */

    /** 재기 시작 — 두 음이 위로 */
    start: function () {
      tone({ freq: 660, dur: 0.07, gain: 0.16, type: "square", cutoff: 2600 });
      tone({ freq: 990, dur: 0.16, gain: 0.16, type: "square", cutoff: 3000, delay: 0.06, room: true });
    },

    /** 멈춤 — 단호하게 내려찍습니다 */
    stop: function () {
      noise({ freq: 4200, dur: 0.018, gain: 0.13, filter: "highpass" });
      tone({ freq: 880, dur: 0.06, gain: 0.2, type: "square", cutoff: 2800 });
      tone({ freq: 587, dur: 0.24, gain: 0.17, type: "square", cutoff: 2200, delay: 0.06, room: true });
    },

    /** 초침 — 아주 작게, 매번 조금씩 다르게 */
    tick: function () {
      noise({ freq: rnd(2600, 3400), dur: 0.012, gain: 0.035, filter: "highpass" });
      tone({ freq: rnd(1450, 1650), dur: 0.02, gain: 0.03, type: "square" });
    },

    /** 곱하기 결과가 나올 때 */
    calc: function () {
      melody([659, 784, 988], { step: 0.075, dur: 0.22, gain: 0.18, shine: true });
      tone({ freq: 1319, dur: 0.6, gain: 0.1, type: "sine", delay: 0.24, room: true });
    },

    /* ---- 룰렛 ---- */

    /** 돌리기 시작할 때 한 번 스치는 바람소리.
        회전 내내 이어지게도 해 봤지만 4초 넘게 깔리니 과했습니다.
        딸깍 소리가 주인공이라 여기서는 짧게 지나가는 편이 낫습니다. */
    spin: function () {
      noise({ freq: 300, to: 2400, dur: 0.5, gain: 0.12, q: 0.7 });
    },

    /** 핀이 칸을 넘어갈 때. 매번 조금씩 달라야 기계처럼 들리지 않습니다. */
    click: function () {
      var f = rnd(1500, 1950);
      tone({ freq: f, to: f * 0.62, dur: 0.028, gain: rnd(0.08, 0.12), type: "square", cutoff: 4200 });
      noise({ freq: rnd(3600, 4600), dur: 0.01, gain: 0.05, filter: "highpass" });
    },

    /** 당첨 — 화음을 쌓고 반짝이는 꼬리를 답니다 */
    fanfare: function () {
      chord([523, 659, 784], { dur: 0.28, gain: 0.2 });
      chord([587, 740, 880], { dur: 0.26, gain: 0.2, delay: 0.16 });
      melody([784, 988, 1175, 1568], { step: 0.085, dur: 0.42, gain: 0.22, delay: 0.32, shine: true });
      chord([1047, 1319, 1568, 2093], { dur: 1.1, gain: 0.15, delay: 0.66, type: "sine" });
      [0.7, 0.82, 0.95].forEach(function (t, i) {
        tone({ freq: 2093 * Math.pow(2, i / 12), dur: 0.5, gain: 0.045, type: "sine", delay: t, room: true });
      });
    },
  };

  /* ---------- 외부 인터페이스 ---------- */
  global.Sfx = {
    /** Sfx.play("tap") 또는 Sfx.play("spin", { dur: 4.8 }) */
    play: function (name, opts) {
      var fn = SOUNDS[name];
      if (!fn) return;
      unlock();
      try {
        fn(opts);
      } catch (e) {
        /* 소리는 있으면 좋은 것이지 게임을 멈출 이유는 아닙니다 */
      }
    },

    isMuted: function () {
      return muted;
    },

    toggle: function () {
      muted = !muted;
      try {
        localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
      } catch (e) {}
      if (master) master.gain.value = muted ? 0 : VOLUME;
      if (!muted) this.play("tap");
      return muted;
    },

    /** 화면 구석에 음소거 버튼을 붙입니다. */
    mountToggle: function (parent) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sfxBtn";
      btn.setAttribute("aria-label", "효과음 켜기 · 끄기");
      var paint = function () {
        btn.textContent = muted ? "🔇" : "🔊";
        btn.setAttribute("aria-pressed", String(!muted));
      };
      btn.addEventListener("click", function () {
        Sfx.toggle();
        paint();
      });
      paint();
      (parent || document.body).appendChild(btn);
      return btn;
    },
  };
})(window);
