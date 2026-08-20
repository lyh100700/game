/* ===== 화면 효과 =====
   당첨 순간의 색종이와 배경 반짝임. 라이브러리 없이 DOM 으로 처리합니다. */
(function (global) {
  "use strict";

  var COLORS = ["#f6a9a9", "#f9cf8e", "#f4e58c", "#b5e3a0", "#9fd8e0",
                "#a9b8ef", "#cfb0ec", "#f3b0d6", "#ffffff"];
  var SHAPES = ["50%", "3px", "50% 50% 50% 0"];

  function reduced() {
    return global.matchMedia &&
           global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  global.Fx = {
    /** 색종이가 한 점에서 터져 나옵니다. x, y 는 컨테이너 기준 백분율 */
    confetti: function (host, opt) {
      if (!host || reduced()) return;
      opt = opt || {};
      var n = opt.count || 46;
      var x = opt.x == null ? 50 : opt.x;
      var y = opt.y == null ? 42 : opt.y;

      var layer = document.createElement("div");
      layer.className = "fxLayer";
      host.appendChild(layer);

      for (var i = 0; i < n; i++) {
        var bit = document.createElement("i");
        var ang = Math.random() * Math.PI * 2;
        var dist = 90 + Math.random() * 190;
        var size = 7 + Math.random() * 9;

        bit.className = "fxBit";
        bit.style.left = x + "%";
        bit.style.top = y + "%";
        bit.style.width = size + "px";
        bit.style.height = size * (0.5 + Math.random()) + "px";
        bit.style.background = COLORS[(Math.random() * COLORS.length) | 0];
        bit.style.borderRadius = SHAPES[(Math.random() * SHAPES.length) | 0];
        bit.style.setProperty("--dx", Math.cos(ang) * dist + "px");
        /* 위로 솟았다가 중력에 끌려 내려오도록 도착점을 아래쪽으로 */
        bit.style.setProperty("--dy", (Math.sin(ang) * dist + 220) + "px");
        bit.style.setProperty("--rot", (Math.random() * 900 - 450) + "deg");
        bit.style.animationDelay = (Math.random() * 0.12) + "s";
        bit.style.animationDuration = (1.1 + Math.random() * 0.7) + "s";
        layer.appendChild(bit);
      }

      setTimeout(function () { layer.remove(); }, 2200);
    },

    /** 배경에 은은한 반짝임을 흩뿌립니다 */
    sparkles: function (host, count, chars) {
      if (!host) return;
      chars = chars || ["✨", "⭐", "💫"];
      var frag = document.createDocumentFragment();
      for (var i = 0; i < (count || 6); i++) {
        var s = document.createElement("span");
        s.className = "twinkle";
        s.textContent = chars[i % chars.length];
        s.style.left = (6 + Math.random() * 88) + "%";
        s.style.top = (8 + Math.random() * 80) + "%";
        s.style.fontSize = (11 + Math.random() * 13) + "px";
        s.style.animationDelay = (Math.random() * 2.6) + "s";
        frag.appendChild(s);
      }
      host.appendChild(frag);
    },
  };
})(window);
