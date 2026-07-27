import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import { prisma } from "../src/lib/prisma";

// 카카오맵 장소 상세페이지(place.map.kakao.com)의 "영업정보" 섹션을 1회성으로 수집해
// data/business_hours_raw.csv에 원본 텍스트로 저장하는 스크립트.
// 파싱은 여기서 하지 않는다 — parse-business-hours.ts가 이 CSV를 읽어 구조화한다
// (수집/파싱을 분리해두면, 파싱 로직만 고칠 때 재수집이 필요 없다).
//
// 사용법: npx tsx prisma/collect-business-hours.ts
// 중간에 중단되어도 이미 쓴 행은 CSV에 남아있고, 재실행 시 이어서 수집한다(kakaoId 기준 스킵).

const OUT_PATH = path.join(__dirname, "..", "data", "business_hours_raw.csv");
const CONCURRENCY = 4;
const DELAY_MS = 800; // 탭 하나당 요청 사이 지연 — 서버 부담을 줄이기 위함

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function loadAlreadyCollected(): Set<string> {
  if (!fs.existsSync(OUT_PATH)) return new Set();
  const content = fs.readFileSync(OUT_PATH, "utf-8");
  const lines = content.split("\n").slice(1); // skip header
  const ids = new Set<string>();
  for (const line of lines) {
    const match = line.match(/^"((?:[^"]|"")*)"/);
    if (match) ids.add(match[1].replace(/""/g, '"'));
  }
  return ids;
}

async function extractBusinessInfoText(page: import("playwright").Page): Promise<string | null> {
  const expanded = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("body *"));
    const header = all.find((el) => el.textContent?.trim() === "영업정보" && el.children.length === 0);
    if (!header) return false;
    let container: Element | null = header.parentElement;
    for (let i = 0; i < 5 && container; i++) {
      const btn = Array.from(container.querySelectorAll("button, a, span")).find(
        (el) => el.textContent?.trim() === "펼치기"
      );
      if (btn instanceof HTMLElement) {
        btn.click();
        return true;
      }
      container = container.parentElement;
    }
    return false;
  });

  if (expanded) await page.waitForTimeout(400);

  return page.evaluate(() => {
    const bodyText = document.body.innerText;
    const startIdx = bodyText.indexOf("영업정보");
    if (startIdx === -1) return null;
    // "영업정보" 다음 섹션(URL/수정제안 등) 시작 전까지만 잘라낸다.
    const endMarkers = ["URL", "수정제안\nURL", "인증 매장"];
    let endIdx = bodyText.length;
    for (const marker of endMarkers) {
      const idx = bodyText.indexOf(marker, startIdx + 4);
      if (idx !== -1) endIdx = Math.min(endIdx, idx);
    }
    return bodyText.slice(startIdx, endIdx).trim();
  });
}

async function main() {
  const restaurants = await prisma.restaurant.findMany({
    where: { kakaoId: { not: null } },
    select: { kakaoId: true, name: true },
  });
  console.log(`대상 식당: ${restaurants.length}건 (kakaoId 보유)`);

  const alreadyDone = loadAlreadyCollected();
  const targets = restaurants.filter((r) => r.kakaoId && !alreadyDone.has(r.kakaoId));
  console.log(`이미 수집됨: ${alreadyDone.size}건 → 이번에 수집할 대상: ${targets.length}건`);

  if (targets.length === 0) {
    console.log("수집할 대상이 없습니다.");
    return;
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  const isNewFile = !fs.existsSync(OUT_PATH);
  const out = fs.createWriteStream(OUT_PATH, { flags: "a" });
  if (isNewFile) out.write("kakaoId,name,rawText\n");

  const browser = await chromium.launch();
  let done = 0;
  let failed = 0;

  async function worker(queue: typeof targets) {
    for (const r of queue) {
      const kakaoId = r.kakaoId!;
      const page = await browser.newPage();
      try {
        await page.goto(`https://place.map.kakao.com/${kakaoId}`, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        await page.waitForTimeout(600);
        const rawText = (await extractBusinessInfoText(page)) ?? "";
        out.write(`${csvEscape(kakaoId)},${csvEscape(r.name)},${csvEscape(rawText)}\n`);
        done++;
        if (done % 25 === 0) console.log(`진행: ${done}/${targets.length}`);
      } catch (err) {
        failed++;
        console.error(`실패: ${r.name} (${kakaoId}) — ${err instanceof Error ? err.message : err}`);
        out.write(`${csvEscape(kakaoId)},${csvEscape(r.name)},${csvEscape("")}\n`);
      } finally {
        await page.close();
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
  }

  // targets를 CONCURRENCY개 큐로 나눠 병렬 처리.
  const lanes: (typeof targets)[] = Array.from({ length: CONCURRENCY }, () => []);
  targets.forEach((r, i) => lanes[i % CONCURRENCY].push(r));
  await Promise.all(lanes.map(worker));

  await browser.close();
  out.end();

  console.log(`\n=== 수집 완료 === 성공/시도: ${done}건, 실패: ${failed}건`);
  console.log(`결과 파일: ${OUT_PATH}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
