import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { prisma } from "../src/lib/prisma";
import { DAY_KEYS, type BusinessHours, type DayKey } from "../src/lib/business-hours";

// collect-business-hours.ts가 만든 data/business_hours_raw.csv를 파싱해 DB(restaurants.business_hours)에
// 반영하는 1회성 임포트 스크립트. import-restaurants-final.ts와 동일하게 dry-run이 기본이다.
//
// 사용법:
//   npx tsx prisma/import-business-hours.ts            → dry-run (DB 미기록, 미리보기+경고만)
//   npx tsx prisma/import-business-hours.ts --commit    → 실제 DB에 반영

const CSV_PATH = path.join(__dirname, "..", "data", "business_hours_raw.csv");

type CsvRow = Record<string, string>;

// ---------- CSV 파싱 (RFC4180: 따옴표로 감싼 필드 안의 콤마/개행 처리) ----------
// import-restaurants-final.ts와 동일한 파서 — 원본 텍스트가 콤마/개행을 포함하므로 필요하다.

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

// ---------- "영업정보" 원본 텍스트 파싱 ----------

const DAY_CHAR_TO_KEY: Record<string, DayKey> = {
  월: "mon",
  화: "tue",
  수: "wed",
  목: "thu",
  금: "fri",
  토: "sat",
  일: "sun",
};

const DAY_HEADER_RE = /^(월|화|수|목|금|토|일)\(\d{1,2}\/\d{1,2}\)$/;
const CLOSED_RE = /^휴무일$/;
const RANGE_RE = /^(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})$/;
const BREAK_RE = /^(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})\s*브레이크타임$/;
const IGNORE_RE = /라스트오더|요기요|배달의민족|쿠팡이츠|영업정보 전체보기/;

type ParsedHours = { hours: BusinessHours | null; warnings: string[] };

function parseBusinessHoursText(rawText: string): ParsedHours {
  if (!rawText.trim() || rawText.includes("영업시간을 알려주세요")) {
    return { hours: null, warnings: [] };
  }

  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const result: Partial<Record<DayKey, BusinessHours[DayKey]>> = {};
  const warnings: string[] = [];
  let currentDay: DayKey | null = null;

  for (const line of lines) {
    const headerMatch = line.match(DAY_HEADER_RE);
    if (headerMatch) {
      currentDay = DAY_CHAR_TO_KEY[headerMatch[1]];
      continue;
    }
    if (!currentDay) continue; // "영업정보"/"접기"/"영업 전 09:00 오픈" 같은 전제 텍스트

    if (CLOSED_RE.test(line)) {
      result[currentDay] = null;
      continue;
    }
    const breakMatch = line.match(BREAK_RE);
    if (breakMatch) {
      const existing = result[currentDay];
      if (existing) {
        existing.breakStart = breakMatch[1];
        existing.breakEnd = breakMatch[2];
      } else {
        warnings.push(`${currentDay}: 브레이크타임 줄이 영업시간 줄보다 먼저 나옴 — "${line}"`);
      }
      continue;
    }
    const rangeMatch = line.match(RANGE_RE);
    if (rangeMatch) {
      result[currentDay] = { open: rangeMatch[1], close: rangeMatch[2] };
      continue;
    }
    if (IGNORE_RE.test(line)) continue;

    warnings.push(`인식 못한 줄(${currentDay}): "${line}"`);
  }

  const collectedDays = Object.keys(result) as DayKey[];
  if (collectedDays.length === 0) {
    return { hours: null, warnings };
  }
  if (collectedDays.length < 7) {
    const missing = DAY_KEYS.filter((d) => !collectedDays.includes(d));
    warnings.push(`7개 요일 중 ${collectedDays.length}개만 수집됨 (누락: ${missing.join(", ")})`);
  }

  return { hours: result as BusinessHours, warnings };
}

// ---------- 실행 ----------

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`파일이 없습니다: ${CSV_PATH}\n먼저 npx tsx prisma/collect-business-hours.ts 를 실행하세요.`);
    process.exit(1);
  }

  const commit = process.argv.includes("--commit");
  const rows = readCsvRows(CSV_PATH);

  let noData = 0;
  let parsedOk = 0;
  let withWarnings = 0;
  const toCommit: { kakaoId: string; name: string; hours: BusinessHours; rawText: string }[] = [];
  const warningReport: { name: string; warnings: string[] }[] = [];

  for (const row of rows) {
    const { hours, warnings } = parseBusinessHoursText(row.rawText ?? "");
    if (warnings.length > 0) {
      withWarnings++;
      warningReport.push({ name: row.name, warnings });
    }
    if (!hours) {
      noData++;
      continue;
    }
    parsedOk++;
    toCommit.push({ kakaoId: row.kakaoId, name: row.name, hours, rawText: row.rawText });
  }

  console.log(`CSV 총 ${rows.length}행`);
  console.log(`  - 파싱 성공: ${parsedOk}건`);
  console.log(`  - 데이터 없음("영업시간을 알려주세요" 등): ${noData}건`);
  console.log(`  - 경고 있음: ${withWarnings}건`);

  if (warningReport.length > 0) {
    console.log(`\n--- 경고 상세 (최대 20건) ---`);
    for (const w of warningReport.slice(0, 20)) {
      console.log(`  - ${w.name}: ${w.warnings.join(" / ")}`);
    }
    if (warningReport.length > 20) console.log(`  ... 외 ${warningReport.length - 20}건`);
  }

  console.log(`\n--- 샘플 미리보기 (처음 3건) ---`);
  for (const r of toCommit.slice(0, 3)) {
    console.log(`- ${r.name}: ${JSON.stringify(r.hours)}`);
  }

  if (!commit) {
    console.log(`\n(dry-run) DB에는 아무것도 쓰지 않았습니다. 실제 반영하려면 --commit 옵션을 추가해 다시 실행하세요.`);
    return;
  }

  console.log(`\n--commit 지정됨 — ${toCommit.length}건을 DB에 반영합니다...`);
  let updated = 0;
  let failed = 0;
  for (const r of toCommit) {
    try {
      await prisma.restaurant.update({
        where: { kakaoId: r.kakaoId },
        data: { businessHours: r.hours, businessHoursRaw: r.rawText },
      });
      updated++;
    } catch (err) {
      failed++;
      console.error(`  실패: ${r.name} (${r.kakaoId}) — ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`\n=== 반영 완료 === 갱신: ${updated}건 / 실패: ${failed}건`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
