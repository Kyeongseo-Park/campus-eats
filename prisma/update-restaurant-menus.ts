import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "../src/lib/prisma";
import type { Prisma } from "../src/generated/prisma/client";

// data/restaurants_with_menu.csv(전체메뉴_가격 컬럼 포함)를 읽어, 기존 식당 레코드를
// kakaoId(CSV의 "id" 컬럼) 기준으로 찾아 Menu(+minPrice)만 갱신하는 스크립트.
// import-restaurants-final.ts와 달리 name/category/zone/address 등 다른 필드는 절대
// 건드리지 않는다 — 새로 수집한 메뉴 데이터만 반영하는 용도.
//
// 사용법:
//   npx tsx prisma/update-restaurant-menus.ts            → dry-run (DB 미기록, "이렇게 바뀔 예정" 미리보기만)
//   npx tsx prisma/update-restaurant-menus.ts --commit    → 실제 DB에 반영

const CSV_PATH = path.join(__dirname, "..", "data", "restaurants_with_menu.csv");

type CsvRow = Record<string, string>;
type MenuItem = { name: string; price: number };
type ParsedRow = {
  kakaoId: string;
  name: string;
  menus: MenuItem[];
  minPrice: number | null;
  menuWarnings: string[];
  // 전체메뉴_가격 컬럼이 빈 칸이면 true — 아직 수집 안 된 식당이라는 뜻이므로
  // 메뉴를 지우는 게 아니라 아예 건드리지 않고 건너뛴다.
  menuFieldEmpty: boolean;
};

// 프로모션/이벤트성 단일 메뉴가 min_price를 비정상적으로 끌어내리는 걸 막기 위해,
// min_price 계산에서만 이 가격 미만 메뉴를 제외한다. import-restaurants-final.ts와 동일한 규칙.
const MIN_PRICE_FLOOR = 1000;

// ---------- CSV 파싱 (RFC4180: 따옴표로 감싼 필드 안의 콤마/개행 처리) ----------
// import-restaurants-final.ts / import-business-hours.ts와 동일한 파서.

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = content.length;

  while (i < len) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += ch;
    i++;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readCsvRows(filePath: string): CsvRow[] {
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^﻿/, "");
  const table = parseCsv(raw).filter((r) => !(r.length === 1 && r[0] === ""));
  const [header, ...dataRows] = table;
  return dataRows.map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] ?? "").trim()])));
}

// ---------- "전체메뉴_가격" 파싱 ----------
// import-restaurants-final.ts의 "대표메뉴_가격" 파서와 동일한 형식으로 가정한다:
// "메뉴명(옵션) 18,000원, 메뉴명2 9,000원" 형태. "원," 뒤에서만 항목을 나누어
// 가격/설명 안의 콤마를 안전하게 처리한다.
const ITEM_SPLIT_RE = /(?<=원),\s*/;
const ITEM_PRICE_RE = /^(.*?)\s+([\d,]+)원$/;

function parseMenuItems(raw: string): { items: MenuItem[]; warnings: string[] } {
  const trimmed = raw.trim();
  if (!trimmed) return { items: [], warnings: [] };

  const items: MenuItem[] = [];
  const warnings: string[] = [];

  for (const rawChunk of trimmed.split(ITEM_SPLIT_RE)) {
    const chunk = rawChunk.trim().replace(/,+$/, "").trim();
    if (!chunk) continue;

    const match = chunk.match(ITEM_PRICE_RE);
    if (!match) {
      warnings.push(`가격 패턴을 찾을 수 없음: "${chunk}"`);
      continue;
    }
    const name = match[1].trim();
    const price = Number(match[2].replace(/,/g, ""));
    if (!name || !Number.isFinite(price) || price <= 0) {
      warnings.push(`이름/가격이 비정상: "${chunk}"`);
      continue;
    }
    items.push({ name, price });
  }

  return { items, warnings };
}

function calculateMinPrice(menus: MenuItem[]): number | null {
  const eligible = menus.filter((m) => m.price >= MIN_PRICE_FLOOR);
  return eligible.length > 0 ? Math.min(...eligible.map((m) => m.price)) : null;
}

function parseRow(row: CsvRow): ParsedRow {
  const rawMenuField = row["전체메뉴_가격"] ?? "";
  const { items: menus, warnings: menuWarnings } = parseMenuItems(rawMenuField);
  return {
    kakaoId: row.id,
    name: row.name,
    menus,
    minPrice: calculateMinPrice(menus),
    menuWarnings,
    menuFieldEmpty: rawMenuField.trim() === "",
  };
}

// ---------- 실행 ----------

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`파일이 없습니다: ${CSV_PATH}\ndata/restaurants_with_menu.csv 를 먼저 준비하세요.`);
    process.exit(1);
  }

  const commit = process.argv.includes("--commit");
  const rows = readCsvRows(CSV_PATH);
  const parsed = rows.map(parseRow);

  console.log(`CSV 총 ${rows.length}행 읽음\n`);

  // kakaoId로 기존 식당 조회 (id 매칭). 매칭 안 되는 행은 건너뛰고 목록으로 보고한다.
  // 전체메뉴_가격이 빈 칸인 행(아직 수집 안 된 식당)도 건너뛰고 기존 DB 값을 그대로 둔다 —
  // 빈 값으로 덮어써서 기존 메뉴가 삭제되는 걸 방지한다.
  const matched: { row: ParsedRow; existing: Prisma.RestaurantGetPayload<{ include: { menus: true } }> }[] = [];
  const notFound: ParsedRow[] = [];
  const emptySkipped: ParsedRow[] = [];

  for (const r of parsed) {
    if (!r.kakaoId) {
      notFound.push(r);
      continue;
    }
    const existing = await prisma.restaurant.findUnique({
      where: { kakaoId: r.kakaoId },
      include: { menus: true },
    });
    if (!existing) {
      notFound.push(r);
      continue;
    }
    if (r.menuFieldEmpty) {
      emptySkipped.push(r);
      continue;
    }
    matched.push({ row: r, existing });
  }

  console.log(
    `매칭 성공(업데이트 예정): ${matched.length}건 / ` +
      `전체메뉴_가격 빈 칸(건너뜀, 기존 값 유지): ${emptySkipped.length}건 / ` +
      `id 매칭 실패(건너뜀): ${notFound.length}건\n`
  );

  if (emptySkipped.length > 0) {
    console.log(`--- 전체메뉴_가격 빈 칸이라 건너뛴 식당 (기존 DB 값 그대로 유지, ${emptySkipped.length}건) ---`);
    for (const r of emptySkipped) {
      console.log(`  - id=${r.kakaoId} name=${r.name}`);
    }
    console.log();
  }

  if (notFound.length > 0) {
    console.log(`--- id 매칭 실패한 목록 (${notFound.length}건) ---`);
    for (const r of notFound) {
      console.log(`  - id=${r.kakaoId || "(빈 값)"} name=${r.name || "(빈 값)"}`);
    }
    console.log();
  }

  const withWarnings = matched.filter((m) => m.row.menuWarnings.length > 0);
  if (withWarnings.length > 0) {
    console.log(`--- 메뉴 파싱 경고: ${withWarnings.length}건 ---`);
    for (const m of withWarnings) {
      console.log(`  - ${m.row.name}: ${m.row.menuWarnings.join(" / ")}`);
    }
    console.log();
  }

  console.log(`--- 미리보기 (변경 예정 내역, 최대 10건) ---`);
  for (const m of matched.slice(0, 10)) {
    const oldMinPrice = m.existing.minPrice ?? "null";
    const newMinPrice = m.row.minPrice ?? "null";
    console.log(
      `- ${m.row.name} (kakaoId=${m.row.kakaoId})\n` +
        `    메뉴 ${m.existing.menus.length}개 → ${m.row.menus.length}개, minPrice ${oldMinPrice} → ${newMinPrice}`
    );
    for (const item of m.row.menus) console.log(`      · ${item.name} — ${item.price.toLocaleString()}원`);
  }
  if (matched.length > 10) console.log(`  ... 외 ${matched.length - 10}건`);

  if (!commit) {
    console.log(
      `\n(dry-run) DB에는 아무것도 쓰지 않았습니다. 위 ${matched.length}건을 실제 반영하려면 --commit 옵션을 추가해 다시 실행하세요.`
    );
    return;
  }

  console.log(`\n--commit 지정됨 — 위 ${matched.length}건을 DB에 반영합니다...`);

  let updated = 0;
  let failed = 0;
  const failures: { name: string; error: string }[] = [];

  for (const m of matched) {
    try {
      await prisma.$transaction(async (tx) => {
        // 메뉴는 별도 안정적 식별자가 없으므로, 재실행 시 중복이 쌓이지 않도록
        // 전체 삭제 후 다시 생성한다 (import-restaurants-final.ts와 동일한 멱등성 보장 방식).
        await tx.menu.deleteMany({ where: { restaurantId: m.existing.id } });
        if (m.row.menus.length > 0) {
          await tx.menu.createMany({
            data: m.row.menus.map((item) => ({ restaurantId: m.existing.id, name: item.name, price: item.price })),
          });
        }
        await tx.restaurant.update({
          where: { id: m.existing.id },
          data: { minPrice: m.row.minPrice },
        });
      });
      updated++;
    } catch (err) {
      failed++;
      failures.push({ name: m.row.name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  console.log(`\n=== 반영 완료 === 갱신: ${updated}건 / 실패: ${failed}건`);
  if (failures.length > 0) {
    console.log(`\n실패 상세:`);
    for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
