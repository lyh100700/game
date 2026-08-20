/* ===== 효과음 엔진 =====
   오디오 파일 없이 Web Audio API로 즉석 합성합니다.
   - 용량 0, 오프라인 동작, 로딩 지연 없음
   - 브라우저 자동재생 정책에 맞춰 첫 사용자 입력 때 잠금 해제
   사용법: Sfx.play("tap")  /  Sfx.toggle()  */
(function (global) {
  "use strict";

  var MUTE_KEY = "cutegames.muted.v1";
  var ctx = null;
  var master = null;
  var muted = false;

  try {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  } catch (e) {}

  function ensure() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
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

  /* ---------- 기본 재료 ---------- */

  /** 한 음. freq→to 로 미끄러지며 사라집니다. */
  function tone(o) {
    var c = ensure();
    if (!c || muted) return;
    var t0 = c.currentTime + (o.delay || 0);
    var dur = o.dur || 0.15;

    var osc = c.createOscillator();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(o.to, 1), t0 + dur);

    var g = c.createGain();
    var peak = o.gain == null ? 0.3 : o.gain;
    var atk = o.attack == null ? 0.008 : o.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    var node = osc;
    if (o.cutoff) {
      var f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = o.cutoff;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);

    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** 잡음 한 덩어리. 타격음·바람소리 재료입니다. */
  function noise(o) {
    var c = ensure();
    if (!c || muted) return;
    var t0 = c.currentTime + (o.delay || 0);
    var dur = o.dur || 0.15;

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
    var peak = o.gain == null ? 0.25 : o.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
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
        delay: i * (opt.step || 0.09),
      });
    });
  }

  /* ---------- 효과음 목록 ---------- */
  var SOUNDS = {
    /* 공통 */
    tap: function () {
      tone({ freq: 660, to: 880, dur: 0.07, gain: 0.18, type: "sine" });
    },
    pop: function () {
      tone({ freq: 420, to: 1400, dur: 0.09, gain: 0.24, type: "sine" });
      noise({ freq: 2600, dur: 0.04, gain: 0.08 });
    },
    back: function () {
      tone({ freq: 620, to: 380, dur: 0.12, gain: 0.18, type: "sine" });
    },
    win: function () {
      melody([523, 659, 784, 1047], { step: 0.1, dur: 0.34, gain: 0.26 });
      tone({ freq: 1568, dur: 0.5, gain: 0.12, type: "sine", delay: 0.38 });
    },
    lose: function () {
      melody([392, 349, 294, 233], { step: 0.11, dur: 0.3, gain: 0.22, type: "sawtooth" });
    },
    coin: function () {
      tone({ freq: 988, dur: 0.07, gain: 0.2, type: "square" });
      tone({ freq: 1319, dur: 0.24, gain: 0.18, type: "square", delay: 0.06 });
    },

    /* 공룡 이빨 */
    tooth: function () {
      /* 이빨이 잇몸으로 쑥 들어가는 소리 */
      tone({ freq: 300, to: 120, dur: 0.13, gain: 0.24, type: "sine" });
      noise({ freq: 900, to: 300, dur: 0.1, gain: 0.1, q: 2 });
    },
    chomp: function () {
      /* 입이 콱 닫히는 소리: 바람 + 뼈 부딪힘 + 낮은 울림 */
      noise({ freq: 1800, to: 400, dur: 0.16, gain: 0.3, q: 0.8 });
      tone({ freq: 180, to: 55, dur: 0.3, gain: 0.4, type: "sawtooth", cutoff: 900, delay: 0.05 });
      noise({ freq: 3200, dur: 0.05, gain: 0.22, filter: "highpass", delay: 0.08 });
      tone({ freq: 90, to: 40, dur: 0.55, gain: 0.3, type: "sine", delay: 0.1 });
    },
    growl: function () {
      tone({ freq: 110, to: 70, dur: 0.7, gain: 0.18, type: "sawtooth", cutoff: 400 });
    },

    /* 사다리 */
    walk: function () {
      tone({ freq: 520, to: 620, dur: 0.05, gain: 0.1, type: "triangle" });
    },
    turn: function () {
      /* 가로줄을 만나 옆으로 꺾일 때 */
      tone({ freq: 700, to: 500, dur: 0.08, gain: 0.13, type: "sine" });
    },
    drop: function () {
      tone({ freq: 700, to: 240, dur: 0.3, gain: 0.2, type: "sine" });
    },

    /* 스톱워치 */
    start: function () {
      tone({ freq: 880, dur: 0.1, gain: 0.22, type: "square" });
    },
    stop: function () {
      tone({ freq: 660, dur: 0.09, gain: 0.22, type: "square" });
      tone({ freq: 440, dur: 0.16, gain: 0.18, type: "square", delay: 0.07 });
    },
    tick: function () {
      tone({ freq: 1500, dur: 0.025, gain: 0.05, type: "square" });
    },
    calc: function () {
      melody([659, 784, 988], { step: 0.07, dur: 0.2, gain: 0.2 });
    },

    /* 룰렛 */
    spin: function () {
      noise({ freq: 300, to: 2400, dur: 0.5, gain: 0.12, q: 0.7 });
    },
    click: function () {
      /* 룰렛 핀이 칸을 넘어갈 때. 회전 속도에 따라 촘촘해집니다 */
      tone({ freq: 1800, to: 1200, dur: 0.03, gain: 0.11, type: "square" });
    },
    fanfare: function () {
      melody([523, 659, 784, 1047, 1319], { step: 0.08, dur: 0.4, gain: 0.24 });
      [0.42, 0.5, 0.58].forEach(function (d, i) {
        tone({ freq: 1568 + i * 200, dur: 0.35, gain: 0.14, type: "sine", delay: d });
      });
    },
  };

  /* ---------- 외부 인터페이스 ---------- */
  global.Sfx = {
    play: function (name) {
      var fn = SOUNDS[name];
      if (!fn) return;
      unlock();
      try {
        fn();
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
      if (master) master.gain.value = muted ? 0 : 0.9;
      if (!muted) this.play("tap");
      return muted;
    },

    /** 화면 우상단 음소거 버튼을 붙입니다. */
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
