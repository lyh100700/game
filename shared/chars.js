/* ===== 캐릭터 13종 =====
   캐릭터/ 폴더의 원본에서 배경을 지워 만든 그림입니다 (tools/build-chars.py).
   룰렛·사다리·스톱워치가 이 목록을 함께 씁니다.
   그림 파일이 없으면 emoji 로 물러나도록 각 게임에서 처리합니다. */
(function (global) {
  "use strict";

  /* 게임 폴더에서 부르면 "../", 메인에서 부르면 "" 이 됩니다 */
  var base = document.currentScript && document.currentScript.src.indexOf("/shared/") > -1
    ? document.currentScript.src.replace(/shared\/chars\.js.*$/, "")
    : "";

  var LIST = [
    { id: "bear",    ko: "곰",       emoji: "🐻" },
    { id: "cat",     ko: "고양이",   emoji: "🐱" },
    { id: "rabbit",  ko: "토끼",     emoji: "🐰" },
    { id: "unicorn", ko: "유니콘",   emoji: "🦄" },
    { id: "penguin", ko: "펭귄",     emoji: "🐧" },
    { id: "frog",    ko: "개구리",   emoji: "🐸" },
    { id: "axolotl", ko: "우파루파", emoji: "🐟" },
    { id: "dog",     ko: "강아지",   emoji: "🐶" },
    { id: "koala",   ko: "코알라",   emoji: "🐨" },
    { id: "dino",    ko: "공룡",     emoji: "🦖" },
    { id: "fox",     ko: "여우",     emoji: "🦊" },
    { id: "panda",   ko: "판다",     emoji: "🐼" },
    { id: "sloth",   ko: "나무늘보", emoji: "🦥" },
  ];

  var BY_ID = {};
  LIST.forEach(function (c) { BY_ID[c.id] = c; });

  global.Chars = {
    list: LIST,

    get: function (id) { return BY_ID[id] || LIST[0]; },

    url: function (id) { return base + "shared/art/char/" + id + ".png"; },

    /** 겹치지 않게 n마리를 무작위로 고릅니다. */
    pick: function (n) {
      var pool = LIST.slice();
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      return pool.slice(0, n);
    },

    /** 이모지 위에 덮을 <img>. 파일이 없으면 스스로 사라집니다. */
    tag: function (id, cls) {
      return '<img class="charImg ' + (cls || "") + '" alt="" src="' +
             this.url(id) + '" onerror="this.remove()">';
    },

    /** 캐릭터 한 마리 = 예비 이모지 + 그림.
        그림이 붙으면 이모지는 CSS 가 숨깁니다 — 둘이 겹쳐 보이면 안 되니까요.
        그림을 못 불러오면 img 가 사라지면서 이모지가 도로 나타납니다. */
    face: function (id, cls) {
      return '<i class="charEmoji">' + this.get(id).emoji + "</i>" + this.tag(id, cls);
    },
  };
})(window);
