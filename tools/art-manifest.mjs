/* 제미나이로 만들 그림 목록.
   style 은 모든 프롬프트 앞에 공통으로 붙는 화풍 지시문입니다.
   참고 이미지(메인 선택화면·앱아이콘·사다리)의 화풍을 말로 옮긴 것입니다. */

/* "glossy 3D jelly" 같은 질감 지시를 넣으면 동물의 특징이 뭉개져
   무엇인지 알아볼 수 없게 됩니다. 형태를 또렷하게 유지하는 쪽으로 씁니다. */
export const STYLE = [
  "cute children's mobile game illustration",
  "clean flat vector art with bold clear shapes",
  "soft pastel color palette, simple and readable",
  "bright, friendly, high quality",
  "no text, no letters, no numbers, no watermark, no UI elements",
].join(", ");

/* 배경에 위 화풍을 쓰면 "귀여운 게임 일러스트"라는 말 때문에
   한가운데에 캐릭터를 그려 버립니다. 배경은 무늬·질감으로만 설명합니다. */
export const STYLE_BG = [
  "seamless repeating wallpaper pattern",
  "flat 2D texture, top-down, evenly distributed across the whole image",
  "soft pastel colors, very low contrast, calm",
  "no characters, no faces, no creatures, no eyes",
  "no central subject, no single large shape, no vignette",
  "no text, no watermark",
].join(", ");

/* 그림 안에 원이나 테두리를 그리게 하면 그릇처럼 일그러집니다.
   얼굴만 화면 가득 그리게 하고, 동그랗게 자르는 일은 CSS 에 맡깁니다.
   동물의 생김새를 구체적으로 적어야 무엇인지 알아볼 수 있습니다. */
/* tone(배경색)은 동물 색과 반드시 대비되어야 합니다.
   분홍 돼지를 분홍 배경에, 회색 코알라를 회색 배경에 그리면
   이목구비가 배경에 묻혀 눈이 사라진 덩어리가 나옵니다. */
function character(id, animal, tone) {
  return {
    id,
    out: `shared/art/${id}.jpg`,
    aspect: "1:1",
    size: "1K",
    /* 실패 사례에서 배운 것:
         - "한 마리만"을 안 쓰면 두 마리가 나옵니다 (토끼)
         - "정면"을 안 쓰면 옆모습이 나옵니다 (토끼)
         - "눈이 또렷하게"를 안 쓰면 눈이 사라집니다 (코알라)
         - "가운데"를 안 쓰면 아래로 치우칩니다 (개구리) */
    prompt:
      `Exactly one single ${animal}, alone. ` +
      `Facing the viewer straight on, perfectly centered in the middle of the frame, ` +
      `large and filling most of the square. ` +
      `Two big clearly visible round eyes with bright highlights, gentle smile. ` +
      `Bold clear shapes, strong saturated colors, crisp details, ` +
      `soft painted children's book illustration. ` +
      `Plain flat ${tone} background. ` +
      `Only one animal. No second animal, no group, no side view, no back view, ` +
      `no circle, no frame, no border, no ring, no plate, no bowl, no shadow, no text.`,
  };
}

/* skip: true 는 기본 생성에서 제외됩니다.
   배경과 아이콘은 여러 번 시도했지만 직접 만든 CSS 그라데이션·이모지보다
   결과가 못해 쓰지 않기로 했습니다. 다시 시도하려면
     node tools/gen-free.mjs --only bg-sky --force
   처럼 이름을 직접 지정하세요. */
export const ART = [
  /* ---- 배경 ---- */
  {
    id: "bg-main",
    skip: true,
    out: "shared/art/bg-main.jpg",
    aspect: "9:16",
    size: "2K",
    /* "가운데를 비워라" 같은 지시는 커다란 도형으로 그려져 버립니다.
       배경은 '고르게 반복되는 무늬'로 설명해야 원하는 결과가 나옵니다. */
    style: STYLE_BG,
    prompt:
      "Tiny pale leaves and small light dots scattered evenly over a soft mint " +
      "green surface. Sparse, delicate, barely visible.",
  },
  {
    id: "bg-sky",
    skip: true,
    out: "shared/art/bg-sky.jpg",
    aspect: "9:16",
    size: "2K",
    style: STYLE_BG,
    prompt:
      "Soft pastel clouds in pink, lavender, mint and peach spread evenly across " +
      "the whole surface, with tiny sparkles throughout. Airy, light, dreamy.",
  },
  {
    id: "bg-paper",
    skip: true,
    out: "shared/art/bg-paper.jpg",
    aspect: "9:16",
    size: "2K",
    style: STYLE_BG,
    prompt:
      "Plain warm cream paper with very fine even grain. " +
      "Almost a solid color, barely any variation.",
  },

  /* ---- 캐릭터 (사다리 · 룰렛 공용) ---- */
  character("ch-bear", "brown bear with round ears and a tan muzzle", "warm beige"),
  character("ch-frog", "green frog with wide mouth and big round eyes on top of its head", "fresh green"),
  character("ch-penguin", "black and white baby penguin with an orange beak and white belly", "soft sky blue"),
  character("ch-dog", "golden retriever puppy with floppy ears and a black nose", "warm cream"),
  character("ch-rabbit", "white rabbit with two long upright ears with pink inner ears", "blush pink"),
  character("ch-cat", "grey tabby kitten with pointed triangular ears and whiskers", "pale blue"),
  character("ch-panda", "giant panda with a white face, black round ears and black patches around both eyes", "light grey"),
  character("ch-fox", "orange fox with pointed ears and white cheeks and a pointed snout", "warm apricot"),
  character("ch-tiger", "orange tiger cub with bold black stripes and white muzzle", "soft orange"),
  character("ch-pig", "pink piglet with a round snout and small floppy ears", "soft mint green"),

  /* ---- 결과 아이콘 ---- */
  {
    id: "ic-trophy",
    skip: true,
    out: "shared/art/ic-trophy.jpg",
    aspect: "1:1",
    size: "1K",
    prompt:
      "A shiny golden trophy cup with a star on the front, small sparkles around it. " +
      "Centered and large, filling most of the square frame. " +
      "Plain flat cream background. No circle, no frame, no border, no ring, " +
      "no shadow, no table, no pedestal.",
  },
  {
    id: "ic-rock",
    skip: true,
    out: "shared/art/ic-rock.jpg",
    aspect: "1:1",
    size: "1K",
    prompt:
      "A cute round grey pebble with two small dot eyes and a tiny sad mouth. " +
      "Centered and large, filling most of the square frame. " +
      "Plain flat light grey background. No circle, no frame, no border, no ring, " +
      "no shadow, no table, no ground.",
  },
  {
    id: "ic-dino",
    skip: true,
    out: "shared/art/ic-dino.jpg",
    aspect: "1:1",
    size: "1K",
    prompt:
      "A cheerful green cartoon dinosaur head with a big open mouth showing white teeth, " +
      "friendly round eyes. Front view, filling the entire square frame. " +
      "Plain flat pale sky blue background. No circle, no frame, no border, no ring, " +
      "no shadow, no body.",
  },
];
