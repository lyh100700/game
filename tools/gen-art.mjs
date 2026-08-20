#!/usr/bin/env node
/* ===== 제미나이로 게임 그림 만들기 =====
 *
 *   node tools/gen-art.mjs              없는 그림만 만듭니다
 *   node tools/gen-art.mjs --force      전부 다시 만듭니다
 *   node tools/gen-art.mjs --only ch-cat,bg-sky   골라서 만듭니다
 *   node tools/gen-art.mjs --list       목록만 보여줍니다
 *
 * API 키는 다음 중 하나에서 읽습니다.
 *   1) 환경변수 GEMINI_API_KEY
 *   2) 프로젝트 루트의 .gemini-key 파일 (git 에 올라가지 않습니다)
 *
 * 키 발급: https://aistudio.google.com/apikey
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ART, STYLE } from "./art-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

/* ---------- 준비 ---------- */

function readKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const f = path.join(ROOT, ".gemini-key");
  if (fs.existsSync(f)) return fs.readFileSync(f, "utf8").trim();
  return null;
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const listOnly = args.includes("--list");
const onlyArg = args[args.indexOf("--only") + 1];
const only = args.includes("--only") && onlyArg
  ? new Set(onlyArg.split(",").map((s) => s.trim()))
  : null;

if (listOnly) {
  for (const a of ART) {
    const exists = fs.existsSync(path.join(ROOT, a.out));
    console.log(`${exists ? "✓" : " "} ${a.id.padEnd(12)} ${a.out}`);
  }
  process.exit(0);
}

const KEY = readKey();
if (!KEY) {
  console.error(`
API 키가 없습니다.

  1. https://aistudio.google.com/apikey 에서 키를 만드세요 (구글 계정이면 됩니다)
  2. 아래처럼 파일로 저장하세요. git 에는 올라가지 않습니다.

     echo "여기에_키_붙여넣기" > .gemini-key

  3. 다시 실행하세요:  node tools/gen-art.mjs
`);
  process.exit(1);
}

/* ---------- 응답에서 이미지 꺼내기 ----------
   API 응답 구조가 바뀌어도 견디도록, 트리를 훑어 base64 이미지를 찾습니다. */

function findImage(node, depth = 0) {
  if (!node || depth > 12) return null;

  if (typeof node === "object" && !Array.isArray(node)) {
    const mime = node.mime_type || node.mimeType;
    const data = node.data || node.base64 || node.bytes;
    if (typeof data === "string" && data.length > 1024 &&
        (!mime || String(mime).startsWith("image/"))) {
      return { data, mime: mime || "image/png" };
    }
    for (const v of Object.values(node)) {
      const hit = findImage(v, depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  if (Array.isArray(node)) {
    for (const v of node) {
      const hit = findImage(v, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

/* ---------- 한 장 만들기 ---------- */

async function generate(item) {
  /* API 가 지원하는 형식은 JPEG 뿐입니다 (PNG 는 거부됩니다) */
  const body = {
    model: MODEL,
    input: [{ type: "text", text: `${STYLE}. ${item.prompt}` }],
    response_format: {
      type: "image",
      mime_type: "image/jpeg",
      aspect_ratio: item.aspect,
      image_size: item.size,
    },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} — ${text.slice(0, 400)}`);
  }

  const json = await res.json();
  const img = findImage(json);
  if (!img) {
    throw new Error(`응답에 이미지가 없습니다: ${JSON.stringify(json).slice(0, 400)}`);
  }

  const dest = path.join(ROOT, item.out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(img.data, "base64"));
  return fs.statSync(dest).size;
}

/* ---------- 실행 ---------- */

const targets = ART.filter((a) => {
  if (only) return only.has(a.id);
  if (force) return true;
  return !fs.existsSync(path.join(ROOT, a.out));
});

if (!targets.length) {
  console.log("만들 그림이 없습니다. 다시 만들려면 --force 를 붙이세요.");
  process.exit(0);
}

console.log(`모델: ${MODEL}`);
console.log(`${targets.length}장을 만듭니다.\n`);

let ok = 0;
const failed = [];

for (const item of targets) {
  process.stdout.write(`  ${item.id.padEnd(12)} `);
  try {
    const size = await generate(item);
    console.log(`✓ ${(size / 1024).toFixed(0)}KB → ${item.out}`);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message.split("\n")[0]}`);
    failed.push(item.id);
  }
  /* 연속 호출 사이에 잠깐 쉽니다 — 속도 제한에 걸리지 않도록 */
  await new Promise((r) => setTimeout(r, 900));
}

console.log(`\n완료: ${ok}장 성공, ${failed.length}장 실패`);
if (failed.length) {
  console.log(`실패한 것만 다시:  node tools/gen-art.mjs --only ${failed.join(",")}`);
}
console.log(`
그림은 shared/art/ 에 저장됐습니다.
게임 화면은 그림이 있으면 자동으로 쓰고, 없으면 이모지로 돌아갑니다.
결과가 마음에 안 들면 tools/art-manifest.mjs 의 문구를 고치고
  node tools/gen-art.mjs --only <이름> --force
로 그 장만 다시 만들면 됩니다.`);
