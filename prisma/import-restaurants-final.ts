import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "../src/lib/prisma";

// data/restaurants_final.csv를 읽어 Restaurant(+Menu)로 반영하는 1회성 임포트 스크립트.
// prisma/seed.ts(개발용 더미 픽스처, deleteMany 후 전체 재생성)와는 목적이 달라 별도 파일로 분리했다.
// 이 스크립트는 카카오 place id(kakaoId) 기준 upsert라 여러 번 실행해도 안전하다.
//
// 사용법:
//   npx tsx prisma/import-restaurants-final.ts            → dry-run (DB 미기록, 콘솔 미리보기만)
//   npx tsx prisma/import-restaurants-final.ts --commit    → 실제 DB에 반영

const CSV_PATH = path.join(__dirname, "..", "data", "restaurants_final.csv");

type CsvRow = Record<string, string>;
type MenuItem = { name: string; price: number };
type ParsedRestaurant = {
  kakaoId: string;
  name: string;
  category: string;
  zone: string;
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  menus: MenuItem[];
  minPrice: number | null;
  menuWarnings: string[];
};

// 프로모션/이벤트성 단일 메뉴(예: "리뷰이벤트 500원")가 min_price를 비정상적으로
// 끌어내리는 걸 막기 위해, min_price 계산에서만 이 가격 미만 메뉴를 제외한다.
// 메뉴 자체(Menu 레코드)는 그대로 저장된다.
const MIN_PRICE_FLOOR = 1000;

// ---------- CSV 파싱 (RFC4180: 따옴표로 감싼 필드 안의 콤마/개행 처리) ----------

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

// ---------- "대표메뉴_가격" 파싱 ----------
//
// 예: "이베리코황금살(180G) 18,000원, 이베리코악어살(180G) 18,000원"
// 단순히 콤마로 쪼개면 가격 안의 콤마("18,000")나 메뉴 설명 안의 콤마
// ("공기밥x, 반찬x)", "국화, 얼그레이")까지 끊어버린다. 그래서 "원," 뒤에서만
// 항목을 나누고(lookbehind), 각 항목 끝에서 "숫자,000원" 패턴을 추출한다.
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

function parseRow(row: CsvRow): ParsedRestaurant {
  const { items: menus, warnings: menuWarnings } = parseMenuItems(row["대표메뉴_가격"] ?? "");
  return {
    kakaoId: row.id,
    name: row.name,
    category: row.category_final,
    zone: row.zone,
    address: row.address,
    phone: row.phone || null,
    latitude: Number(row.lat),
    longitude: Number(row.lng),
    menus,
    // 메뉴가 없거나(88건), 있어도 전부 1,000원 미만 프로모션 메뉴뿐이면 null
    // ("가격 정보 없음"). 프론트에서 표시하고, 가격대 필터에서는 자동 제외된다.
    minPrice: calculateMinPrice(menus),
    menuWarnings,
  };
}

// 같은 이름 + 같은 구역인데 카카오 id만 다른 행(동일 매장의 중복 수집 가능성) 중
// 먼저 나온 것만 남기고 나머지는 제외한다.
function dedupeByNameAndZone(parsed: ParsedRestaurant[]): { kept: ParsedRestaurant[]; dropped: ParsedRestaurant[] } {
  const seen = new Set<string>();
  const kept: ParsedRestaurant[] = [];
  const dropped: ParsedRestaurant[] = [];
  for (const r of parsed) {
    const key = `${r.name}::${r.zone}`;
    if (seen.has(key)) {
      dropped.push(r);
      continue;
    }
    seen.add(key);
    kept.push(r);
  }
  return { kept, dropped };
}

// ---------- 미리보기/이상치 리포트 ----------

function printPreview(rows: CsvRow[], parsed: ParsedRestaurant[], dropped: ParsedRestaurant[]) {
  const excludedCount = rows.length - parsed.length - dropped.length;
  console.log(
    `CSV 총 ${rows.length}행 중 채택여부=O ${parsed.length + dropped.length}건 (X ${excludedCount}건 제외) → ` +
      `같은 이름+구역 중복 ${dropped.length}건 추가 제외 → 최종 처리 대상 ${parsed.length}건\n`
  );

  console.log("--- 샘플 미리보기 (처음 3건) ---");
  for (const r of parsed.slice(0, 3)) {
    console.log(
      `- ${r.name} [${r.category}/${r.zone}] kakaoId=${r.kakaoId} minPrice=${r.minPrice ?? "null"} 메뉴 ${r.menus.length}개`
    );
    for (const m of r.menus) console.log(`    · ${m.name} — ${m.price.toLocaleString()}원`);
  }

  if (dropped.length > 0) {
    console.log(`\n--- 같은 이름+같은 구역 중복이라 제외한 행: ${dropped.length}건 ---`);
    for (const r of dropped) console.log(`  - ${r.name} [${r.zone}] kakaoId=${r.kakaoId} (제외됨)`);
  }

  const emptyMenu = parsed.filter((r) => r.menus.length === 0);
  console.log(`\n--- 메뉴 없는 식당 (minPrice=null, "가격 정보 없음"으로 표시): ${emptyMenu.length}건 ---`);
  for (const r of emptyMenu.slice(0, 10)) console.log(`  - ${r.name} [${r.zone}]`);
  if (emptyMenu.length > 10) console.log(`  ... 외 ${emptyMenu.length - 10}건`);

  const withWarnings = parsed.filter((r) => r.menuWarnings.length > 0);
  console.log(`\n--- 메뉴 파싱 경고: ${withWarnings.length}건 ---`);
  for (const r of withWarnings) {
    console.log(`  - ${r.name}: ${r.menuWarnings.join(" / ")}`);
  }

  const lowOutliers = parsed.filter((r) => r.menus.some((m) => m.price < MIN_PRICE_FLOOR));
  console.log(
    `\n--- ${MIN_PRICE_FLOOR.toLocaleString()}원 미만 메뉴가 있는 식당 (해당 메뉴는 저장되지만 min_price 계산에서는 제외): ${lowOutliers.length}건 ---`
  );
  for (const r of lowOutliers) {
    const cheap = r.menus.filter((m) => m.price < MIN_PRICE_FLOOR);
    console.log(
      `  - ${r.name}: ${cheap.map((m) => `${m.name} ${m.price}원`).join(", ")} (계산된 minPrice=${r.minPrice ?? "null"})`
    );
  }

  const kakaoIdCount = new Map<string, number>();
  for (const r of parsed) kakaoIdCount.set(r.kakaoId, (kakaoIdCount.get(r.kakaoId) ?? 0) + 1);
  const dupKakaoIds = [...kakaoIdCount.entries()].filter(([, c]) => c > 1);
  console.log(`\n--- CSV 내 kakaoId 중복: ${dupKakaoIds.length}건 ---`);
  for (const [id, c] of dupKakaoIds) console.log(`  - id=${id} (${c}회)`);

  const unknownCategories = new Set(
    parsed.map((r) => r.category).filter((c) => !["한식", "양식", "중식", "일식", "분식", "카페", "패스트푸드", "기타"].includes(c))
  );
  if (unknownCategories.size > 0) {
    console.log(`\n--- 예상치 못한 category_final 값: ${[...unknownCategories].join(", ")} ---`);
  }

  const totalMenus = parsed.reduce((sum, r) => sum + r.menus.length, 0);
  console.log(`\n총 메뉴 항목 ${totalMenus}개 생성 예정`);
}

// ---------- 실제 DB 반영 ----------

async function commitToDb(parsed: ParsedRestaurant[]) {
  let created = 0;
  let updated = 0;
  let failed = 0;
  let menusWritten = 0;
  const failures: { name: string; error: string }[] = [];

  for (const r of parsed) {
    try {
      const existing = await prisma.restaurant.findUnique({ where: { kakaoId: r.kakaoId } });

      await prisma.$transaction(async (tx) => {
        const restaurant = await tx.restaurant.upsert({
          where: { kakaoId: r.kakaoId },
          create: {
            kakaoId: r.kakaoId,
            name: r.name,
            category: r.category,
            zone: r.zone,
            address: r.address,
            phone: r.phone,
            latitude: r.latitude,
            longitude: r.longitude,
            minPrice: r.minPrice,
          },
          update: {
            name: r.name,
            category: r.category,
            zone: r.zone,
            address: r.address,
            phone: r.phone,
            latitude: r.latitude,
            longitude: r.longitude,
            minPrice: r.minPrice,
          },
        });

        // 메뉴는 별도 안정적 식별자가 없으므로, 재실행 시 중복이 쌓이지 않도록
        // 전체 삭제 후 다시 생성하는 방식으로 멱등성을 보장한다.
        await tx.menu.deleteMany({ where: { restaurantId: restaurant.id } });
        if (r.menus.length > 0) {
          await tx.menu.createMany({
            data: r.menus.map((m) => ({ restaurantId: restaurant.id, name: m.name, price: m.price })),
          });
        }
      });

      menusWritten += r.menus.length;
      if (existing) updated++;
      else created++;
    } catch (err) {
      failed++;
      failures.push({ name: r.name, error: err instanceof Error ? err.message : String(err) });
    }
  }

  console.log(`\n=== 반영 완료 ===`);
  console.log(`생성: ${created}건 / 갱신: ${updated}건 / 실패: ${failed}건`);
  console.log(`메뉴 총 ${menusWritten}개 반영`);
  if (failures.length > 0) {
    console.log(`\n실패 상세:`);
    for (const f of failures) console.log(`  - ${f.name}: ${f.error}`);
  }
}

async function main() {
  const commit = process.argv.includes("--commit");

  const rows = readCsvRows(CSV_PATH).filter((r) => r["채택여부"] === "O");
  const allRows = readCsvRows(CSV_PATH);
  const { kept: parsed, dropped } = dedupeByNameAndZone(rows.map(parseRow));

  printPreview(allRows, parsed, dropped);

  if (!commit) {
    console.log(`\n(dry-run) DB에는 아무것도 쓰지 않았습니다. 실제 반영하려면 --commit 옵션을 추가해 다시 실행하세요.`);
    return;
  }

  console.log(`\n--commit 지정됨 — 위 ${parsed.length}건을 DB에 반영합니다...`);
  await commitToDb(parsed);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
