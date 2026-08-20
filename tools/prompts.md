# 그림 프롬프트 모음 (직접 만들 때)

제미나이 이미지 생성은 **결제 등록을 해야 API 로 부를 수 있습니다.**
결제 없이 하려면 [제미나이 웹앱](https://gemini.google.com) 에서 아래 문구를 붙여넣어
직접 만들고, 받은 파일을 다음 명령으로 제자리에 넣으면 됩니다.

```bash
bash tools/put-art.sh <이름> ~/Downloads/받은파일.png
```

예: `bash tools/put-art.sh ch-cat ~/Downloads/Gemini_Generated_Image_abc.png`

크기 조정과 jpg 변환은 알아서 처리합니다.

---

## 공통 화풍 (모든 문구 앞에 붙습니다)

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements
```

---

## `bg-main` → shared/art/bg-main.jpg

비율 9:16

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A soft mint green background for a children's game menu screen. Scattered pale translucent leaf shapes and gentle light blobs, very low contrast so bright cards placed on top stay readable. Empty in the center, decoration only near the edges. Flat, calm, no characters.
```

```bash
bash tools/put-art.sh bg-main ~/Downloads/받은파일.png
```

---

## `bg-sky` → shared/art/bg-sky.jpg

비율 9:16

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A dreamy pastel cotton candy sky. Soft fluffy clouds in pink, lavender, mint and peach, blending smoothly from light blue at the top to warm peach at the bottom. Sparkling stars scattered softly. Empty in the middle so buttons can sit on top. No characters, no objects.
```

```bash
bash tools/put-art.sh bg-sky ~/Downloads/받은파일.png
```

---

## `bg-paper` → shared/art/bg-paper.jpg

비율 9:16

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A clean warm cream paper background with a very subtle soft grain texture and a faint vignette at the edges. Almost plain, extremely low contrast, so colorful ladder lines drawn on top stand out clearly. No pattern, no objects.
```

```bash
bash tools/put-art.sh bg-paper ~/Downloads/받은파일.png
```

---

## `ch-bear` → shared/art/ch-bear.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute brown teddy bear face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft warm beige pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-bear ~/Downloads/받은파일.png
```

---

## `ch-frog` → shared/art/ch-frog.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute green frog face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft fresh green pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-frog ~/Downloads/받은파일.png
```

---

## `ch-chick` → shared/art/ch-chick.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute yellow baby chick face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft soft yellow pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-chick ~/Downloads/받은파일.png
```

---

## `ch-octopus` → shared/art/ch-octopus.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute blue baby octopus face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft sky blue pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-octopus ~/Downloads/받은파일.png
```

---

## `ch-rabbit` → shared/art/ch-rabbit.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute white rabbit with pink ears face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft blush pink pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-rabbit ~/Downloads/받은파일.png
```

---

## `ch-cat` → shared/art/ch-cat.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute grey striped kitten face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft pale blue pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-cat ~/Downloads/받은파일.png
```

---

## `ch-panda` → shared/art/ch-panda.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute panda face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft light grey pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-panda ~/Downloads/받은파일.png
```

---

## `ch-fox` → shared/art/ch-fox.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute orange fox face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft warm apricot pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-fox ~/Downloads/받은파일.png
```

---

## `ch-tiger` → shared/art/ch-tiger.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute baby tiger face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft soft orange pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-tiger ~/Downloads/받은파일.png
```

---

## `ch-koala` → shared/art/ch-koala.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute koala face icon, front facing, big sparkling eyes, gentle smile, centered inside a perfect circle with a soft dusty lavender pastel background, chibi style, thick white circular border, subtle glossy highlight on top. The circle fills the entire square frame edge to edge.
```

```bash
bash tools/put-art.sh ch-koala ~/Downloads/받은파일.png
```

---

## `ic-trophy` → shared/art/ic-trophy.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A shiny golden trophy cup with a star on the front, glowing warm light behind it, sparkles around. Centered on a plain soft cream circle that fills the square frame, thick white circular border.
```

```bash
bash tools/put-art.sh ic-trophy ~/Downloads/받은파일.png
```

---

## `ic-rock` → shared/art/ic-rock.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cute grey pebble with a small sad face, simple and round. Centered on a plain soft grey circle that fills the square frame, thick white circular border.
```

```bash
bash tools/put-art.sh ic-rock ~/Downloads/받은파일.png
```

---

## `ic-dino` → shared/art/ic-dino.jpg

비율 1:1

```
cute kawaii children's mobile game art, soft rounded shapes, glossy 3D jelly rendering, thick clean white outline around every shape, pastel color palette, gentle soft shadows, bright, friendly, high quality, polished, no text, no letters, no watermark, no UI elements. A cheerful cartoon dinosaur head with a big open mouth showing white teeth, green scales, friendly eyes. Centered on a pale sky blue circle that fills the square frame, thick white circular border.
```

```bash
bash tools/put-art.sh ic-dino ~/Downloads/받은파일.png
```

---

