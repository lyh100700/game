#!/usr/bin/env node
/* ===== 키 없이 그림 만들기 =====
 *
 * 제미나이 이미지 생성은 유료 등급 전용이라, 키가 없어도 쓸 수 있는
 * 무료 생성 서비스(pollinations.ai)로 같은 그림을 만듭니다.
 * 그림 목록과 문구는 tools/art-manifest.mjs 를 그대로 씁니다.
 *
 *   node tools/gen-free.mjs                 없는 것만 만듭니다
 *   node tools/gen-free.mjs --force         전부 다시
 *   node tools/gen-free.mjs --only ch-cat   골라서
 *   node tools/gen-free.mjs --only ch-cat --seed 7   같은 문구로 다른 그림
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ART, STYLE } from "./art-manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "https://image.pollinations.ai/prompt/";

/* 비율을 실제 픽셀로. 세로 배경은 폰 화면에 맞춰 길게 뽑습니다. */
const SIZES = {
  "1:1": [768, 768],
  "9:16": [768, 1344],
};

const args = process.argv.slice(2);
const force = args.includes("--force");
const onlyArg = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const seedBase = args.includes("--seed") ? Number(args[args.indexOf("--seed") + 1]) : 1;

/* 같은 이름은 늘 같은 그림이 나오도록 이름에서 씨앗값을 만듭니다 */
function seedOf(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 100000) + seedBase * 7919;
}

async function generate(item) {
  const [w, h] = SIZES[item.aspect] || SIZES["1:1"];
  const prompt = `${item.style || STYLE}. ${item.prompt}`;
  const url =
    HOST + encodeURIComponent(prompt) +
    `?width=${w}&height=${h}&seed=${seedOf(item.id)}&model=flux&nologo=true&enhance=false`;

  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const buf = Buffer.from(await res.arrayBuffer());
  /* 짧은 응답은 그림이 아니라 오류 안내일 때가 많습니다 */
  if (buf.length < 5000) throw new Error(`응답이 너무 작습니다 (${buf.length}B)`);

  const dest = path.join(ROOT, item.out);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  return buf.length;
}

const targets = ART.filter((a) => {
  if (only) return only.has(a.id);
  if (a.skip) return false;
  if (force) return true;
  return !fs.existsSync(path.join(ROOT, a.out));
});

if (!targets.length) {
  console.log("만들 그림이 없습니다. 다시 만들려면 --force 를 붙이세요.");
  process.exit(0);
}

console.log(`${targets.length}장을 만듭니다. 장당 20~40초 걸립니다.\n`);

let ok = 0;
const failed = [];

for (const item of targets) {
  process.stdout.write(`  ${item.id.padEnd(12)} `);
  let done = false;
  /* 무료 서비스라 가끔 실패합니다. 두 번까지 다시 시도합니다. */
  for (let attempt = 1; attempt <= 3 && !done; attempt++) {
    try {
      const size = await generate(item);
      console.log(`✓ ${(size / 1024).toFixed(0)}KB`);
      ok++;
      done = true;
    } catch (e) {
      if (attempt === 3) {
        console.log(`✗ ${e.message}`);
        failed.push(item.id);
      } else {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }
  await new Promise((r) => setTimeout(r, 1200));
}

console.log(`\n완료: ${ok}장 성공, ${failed.length}장 실패`);
if (failed.length) console.log(`다시:  node tools/gen-free.mjs --only ${failed.join(",")}`);
