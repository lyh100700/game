/* 제미나이로 만들 그림 목록.
   style 은 모든 프롬프트 앞에 공통으로 붙는 화풍 지시문입니다.
   참고 이미지(메인 선택화면·앱아이콘·사다리)의 화풍을 말로 옮긴 것입니다. */

export const STYLE = [
  "cute kawaii children's mobile game art",
  "soft rounded shapes, glossy 3D jelly rendering",
  "thick clean white outline around every shape",
  "pastel color palette, gentle soft shadows",
  "bright, friendly, high quality, polished",
  "no text, no letters, no watermark, no UI elements",
].join(", ");

/* 캐릭터는 둥근 파스텔 배지 형태로 만듭니다.
   투명 배경에 기대지 않아도 화면에 자연스럽게 얹히기 때문입니다. */
function character(id, animal, tone) {
  return {
    id,
    out: `shared/art/${id}.png`,
    aspect: "1:1",
    size: "1K",
    prompt:
      `A cute ${animal} face icon, front facing, big sparkling eyes, gentle smile, ` +
      `centered inside a perfect circle with a soft ${tone} pastel background, ` +
      `chibi style, thick white circular border, subtle glossy highlight on top. ` +
      `The circle fills the entire square frame edge to edge.`,
  };
}

export const ART = [
  /* ---- 배경 ---- */
  {
    id: "bg-main",
    out: "shared/art/bg-main.jpg",
    aspect: "9:16",
    size: "2K",
    prompt:
      "A soft mint green background for a children's game menu screen. " +
      "Scattered pale translucent leaf shapes and gentle light blobs, " +
      "very low contrast so bright cards placed on top stay readable. " +
      "Empty in the center, decoration only near the edges. Flat, calm, no characters.",
  },
  {
    id: "bg-sky",
    out: "shared/art/bg-sky.jpg",
    aspect: "9:16",
    size: "2K",
    prompt:
      "A dreamy pastel cotton candy sky. Soft fluffy clouds in pink, lavender, " +
      "mint and peach, blending smoothly from light blue at the top to warm peach at the bottom. " +
      "Sparkling stars scattered softly. Empty in the middle so buttons can sit on top. " +
      "No characters, no objects.",
  },
  {
    id: "bg-paper",
    out: "shared/art/bg-paper.jpg",
    aspect: "9:16",
    size: "2K",
    prompt:
      "A clean warm cream paper background with a very subtle soft grain texture " +
      "and a faint vignette at the edges. Almost plain, extremely low contrast, " +
      "so colorful ladder lines drawn on top stand out clearly. No pattern, no objects.",
  },

  /* ---- 캐릭터 (사다리 · 룰렛 공용) ---- */
  character("ch-bear", "brown teddy bear", "warm beige"),
  character("ch-frog", "green frog", "fresh green"),
  character("ch-chick", "yellow baby chick", "soft yellow"),
  character("ch-octopus", "blue baby octopus", "sky blue"),
  character("ch-rabbit", "white rabbit with pink ears", "blush pink"),
  character("ch-cat", "grey striped kitten", "pale blue"),
  character("ch-panda", "panda", "light grey"),
  character("ch-fox", "orange fox", "warm apricot"),
  character("ch-tiger", "baby tiger", "soft orange"),
  character("ch-koala", "koala", "dusty lavender"),

  /* ---- 결과 아이콘 ---- */
  {
    id: "ic-trophy",
    out: "shared/art/ic-trophy.png",
    aspect: "1:1",
    size: "1K",
    prompt:
      "A shiny golden trophy cup with a star on the front, glowing warm light behind it, " +
      "sparkles around. Centered on a plain soft cream circle that fills the square frame, " +
      "thick white circular border.",
  },
  {
    id: "ic-rock",
    out: "shared/art/ic-rock.png",
    aspect: "1:1",
    size: "1K",
    prompt:
      "A cute grey pebble with a small sad face, simple and round. " +
      "Centered on a plain soft grey circle that fills the square frame, " +
      "thick white circular border.",
  },
  {
    id: "ic-dino",
    out: "shared/art/ic-dino.png",
    aspect: "1:1",
    size: "1K",
    prompt:
      "A cheerful cartoon dinosaur head with a big open mouth showing white teeth, " +
      "green scales, friendly eyes. Centered on a pale sky blue circle that fills " +
      "the square frame, thick white circular border.",
  },
];
