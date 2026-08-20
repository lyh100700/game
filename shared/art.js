/* ===== 생성된 그림 붙이기 =====
   shared/art/ 에 그림이 있으면 쓰고, 없으면 이모지로 돌아갑니다.
   그래서 그림을 만들기 전에도 게임은 그대로 동작합니다. */
(function (global) {
  "use strict";

  /* 게임 폴더에서 부르면 "../", 메인에서 부르면 "" 이 됩니다 */
  var base = document.currentScript && document.currentScript.src.indexOf("/shared/") > -1
    ? document.currentScript.src.replace(/shared\/art\.js.*$/, "")
    : "";

  global.Art = {
    url: function (id, ext) {
      return base + "shared/art/" + id + "." + (ext || "png");
    },

    /** 이모지 위에 덮어씌울 <img> 태그. 파일이 없으면 스스로 사라집니다. */
    tag: function (id, cls) {
      if (!id) return "";
      return '<img class="artImg ' + (cls || "") + '" alt="" ' +
             'src="' + this.url(id) + '" onerror="this.remove()">';
    },
  };
})(window);
