/* 메인 선택화면 */
(function () {
  "use strict";

  var cards = document.getElementById("cards");

  /* 카드 썸네일. shared/art/thumb-*.jpg 그림이 있으면 그 그림이 덮이고,
     없으면 아래 SVG 가 그대로 보입니다. */
  var THUMBS = {
    dino:
      "<span class='thumb__tag'>CHOMPED!</span><svg viewBox='0 0 64 60' class='tsvg'> <ellipse cx='32' cy='54' rx='22' ry='4' fill='#9fd3e8' opacity='.45'/> <path d='M13 42 v-10 q0-16 19-16 q19 0 19 16 v10 Z' fill='#6cc06a' stroke='#fff' stroke-width='2.4' stroke-linejoin='round'/> <path d='M11 41 h42 q0 12-21 12 q-21 0-21-12 Z' fill='#b83c2e' stroke='#fff' stroke-width='2.4' stroke-linejoin='round'/> <path d='M18 50 q14 6 28 0 q-3 5-14 5 q-11 0-14-5 Z' fill='#f0819a'/> <g fill='#fffaf0' stroke='#dcc9ae' stroke-width='.7'>  <path d='M16 41 l3 6 3-6 Z'/><path d='M25 41 l3.4 7 3.4-7 Z'/>  <path d='M35 41 l3.4 7 3.4-7 Z'/><path d='M45 41 l3 6 3-6 Z'/> </g> <circle cx='24' cy='28' r='6' fill='#fff' stroke='#4e9a4c' stroke-width='1.2'/> <circle cx='41' cy='28' r='6' fill='#fff' stroke='#4e9a4c' stroke-width='1.2'/> <circle cx='25.4' cy='29' r='2.8' fill='#33261a'/><circle cx='42.4' cy='29' r='2.8' fill='#33261a'/> <circle cx='24.3' cy='27.6' r='1' fill='#fff'/><circle cx='41.3' cy='27.6' r='1' fill='#fff'/> <path d='M27 18 l4-6 4 6 4-5 4 5' fill='none' stroke='#4e9a4c' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/> <g transform='translate(53 30) rotate(28)'>  <path d='M0 0 l3.4 7.5 3.4-7.5 Z' fill='#fffaf0' stroke='#d9c6ab' stroke-width='.9'/> </g> <path d='M7 16 l1.8 3.6 3.6 1.8-3.6 1.8-1.8 3.6-1.8-3.6-3.6-1.8 3.6-1.8 Z' fill='#fff' opacity='.9'/></svg>",
    ladder:
      "<svg viewBox='0 0 64 60' class='tsvg'> <g stroke-linecap='round' stroke-width='5'>  <line x1='18' y1='8' x2='18' y2='52' stroke='#6fcf97'/>  <line x1='46' y1='8' x2='46' y2='52' stroke='#56ccf2'/>  <line x1='18' y1='18' x2='46' y2='18' stroke='#f2c94c'/>  <line x1='18' y1='30' x2='46' y2='30' stroke='#f28b82'/>  <line x1='18' y1='42' x2='46' y2='42' stroke='#bb6bd9'/> </g> <circle cx='18' cy='7' r='6' fill='#fff' stroke='#e0d3bd' stroke-width='1.4'/> <circle cx='46' cy='7' r='6' fill='#fff' stroke='#e0d3bd' stroke-width='1.4'/> <circle cx='18' cy='7' r='3.4' fill='#e8c9a8'/><circle cx='46' cy='7' r='3.4' fill='#bfe8b4'/> <path d='M40 50 h12 v4 q0 4-6 4 q-6 0-6-4 Z' fill='#ffd97a' stroke='#fff' stroke-width='1.4'/> <path d='M43 50 v-4 h6 v4' fill='none' stroke='#ffd97a' stroke-width='2.6' stroke-linecap='round'/> <circle cx='14' cy='54' r='4.4' fill='#b9b0a4' stroke='#fff' stroke-width='1.2'/></svg>",
    watch:
      "<svg viewBox='0 0 64 60' class='tsvg'> <g stroke='#fff' stroke-width='2.2'>  <circle cx='19' cy='26' r='13' fill='#ffd3e0'/>  <circle cx='45' cy='26' r='13' fill='#cfe3fb'/> </g> <g stroke='#fff' stroke-width='2.6' stroke-linecap='round'>  <line x1='19' y1='11' x2='19' y2='7'/><line x1='45' y1='11' x2='45' y2='7'/> </g> <g fill='#8a6c95'>  <circle cx='15' cy='24' r='1.6'/><circle cx='23' cy='24' r='1.6'/>  <circle cx='41' cy='24' r='1.6'/><circle cx='49' cy='24' r='1.6'/> </g> <g stroke='#8a6c95' stroke-width='1.8' stroke-linecap='round' fill='none'>  <path d='M16 30 q3 2.6 6 0'/><path d='M42 30 q3 2.6 6 0'/> </g> <text x='32' y='30' font-size='11' font-weight='900' fill='#d1517f' text-anchor='middle'>×</text> <text x='32' y='52' font-size='11' font-weight='900' fill='#8a6047' text-anchor='middle'    stroke='#fff' stroke-width='3' paint-order='stroke'>00×00</text></svg>",
    wheel:
      "<svg viewBox='0 0 64 60' class='tsvg'> <circle cx='32' cy='30' r='29' fill='#efe0f7' stroke='#fff' stroke-width='2'/> <path d='M32 30 L32.0 4.0 A26 26 0 0 1 50.4 11.6 Z' fill='#f7a8a8' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L50.4 11.6 A26 26 0 0 1 58.0 30.0 Z' fill='#fbcf86' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L58.0 30.0 A26 26 0 0 1 50.4 48.4 Z' fill='#f6e78a' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L50.4 48.4 A26 26 0 0 1 32.0 56.0 Z' fill='#b3e59c' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L32.0 56.0 A26 26 0 0 1 13.6 48.4 Z' fill='#9adae3' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L13.6 48.4 A26 26 0 0 1 6.0 30.0 Z' fill='#a6b6f2' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L6.0 30.0 A26 26 0 0 1 13.6 11.6 Z' fill='#d0aef0' stroke='#fff' stroke-width='1.6'/><path d='M32 30 L13.6 11.6 A26 26 0 0 1 32.0 4.0 Z' fill='#f6adda' stroke='#fff' stroke-width='1.6'/> <circle cx='32' cy='30' r='26' fill='none' stroke='#fff' stroke-width='2'/> <circle cx='32' cy='30' r='5.5' fill='#fff'/> <circle cx='32' cy='30' r='3.6' fill='#9d84e6'/> <path d='M32 2 l4.4 5 -8.8 0 Z' fill='#f58aae' stroke='#fff' stroke-width='1.4'/> <g fill='#fff'>  <circle cx='32' cy='2.5' r='1.4'/><circle cx='56' cy='16' r='1.4'/>  <circle cx='56' cy='44' r='1.4'/><circle cx='8' cy='16' r='1.4'/><circle cx='8' cy='44' r='1.4'/> </g></svg>",
  };

  function render() {
    cards.innerHTML = GAMES.map(function (g) {
      return (
        '<a class="card" href="' + encodeURIComponent(g.dir) + '/index.html">' +
          '<span class="thumb thumb--' + g.thumb + '">' +
            THUMBS[g.thumb] + Art.tag("thumb-" + g.thumb) + "</span>" +
          '<span class="card__body">' +
            '<span class="card__title">' + g.title + "</span>" +
            '<span class="card__ko">' + g.ko + "</span>" +
            '<span class="card__play">Play Now</span>' +
          "</span>" +
        "</a>"
      );
    }).join("");
  }

  cards.addEventListener("click", function (e) {
    if (e.target.closest(".card")) Sfx.play("pop");
  });

  render();
  Sfx.mountToggle(document.getElementById("screen"));
  Fx.sparkles(document.querySelector(".main__deco"), 5, ["✨", "🍃", "⭐"]);

  /* ---- 오프라인 지원 ---- */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.warn("서비스 워커 등록 실패:", err);
      });
    });
  }
})();
