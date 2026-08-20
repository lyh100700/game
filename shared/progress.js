/* 게임별 플레이 횟수 기록. 메인 화면 진행바(0/5)에 쓰입니다. */
(function (global) {
  "use strict";

  var KEY = "cutegames.progress.v1";
  var MAX = 5;

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function writeAll(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      /* 사생활 보호 모드 등 저장 불가 환경은 조용히 무시 */
    }
  }

  global.Progress = {
    MAX: MAX,

    /** 해당 게임의 플레이 횟수 (0~MAX) */
    get: function (id) {
      var n = readAll()[id];
      return typeof n === "number" ? Math.min(n, MAX) : 0;
    },

    /** 한 판 끝났을 때 호출. 늘어난 횟수를 반환 */
    bump: function (id) {
      var data = readAll();
      var next = Math.min((data[id] || 0) + 1, MAX);
      data[id] = next;
      writeAll(data);
      return next;
    },

    reset: function () {
      writeAll({});
    },
  };
})(window);
