# 개발 계획 (Development Plan)

기준 문서: `docs/01_PRD/PRD_v2.md`
관련 문서: `docs/02_Development/DevSetup.md`(환경 세팅), `docs/02_Development/GitConvention.md`(브랜치/커밋 규칙)

이 문서는 PRD v2를 처음부터 끝까지 구현하기 위한 **페이즈 기반 실행 계획**이다. 각 페이즈는 그 자체로 로컬에서 동작을 확인하고 PR을 올릴 수 있는 단위로 쪼갠다. 페이즈 순서는 기능 간 의존성(인증 → 데이터 → 조회 → 참여 기능 → 관리자 → 배포)을 따른다.

## 0. 현재 진행 상황 (2026-07-11 기준)

완료됨 (커밋 이력 기준):

- [x] Next.js(App Router) + TypeScript + Tailwind + shadcn/ui 프로젝트 초기 세팅
- [x] `prisma/schema.prisma` 작성 (PRD 11번 ERD + `Favorite` 모델 추가) 및 초기 마이그레이션(`20260710162427_init`) 적용
- [x] 라우트 스캐폴딩 (빈 페이지): `/`, `/login`, `/signup`, `/mypage`, `/admin`, `/restaurants`, `/restaurants/[id]`
- [x] Kakao API 키, `AUTH_SECRET` 환경변수 설정

미착수 (이 문서가 다루는 범위):

- [ ] 인증 로직, API Route Handler 전체, 실 데이터 시딩, 지도 연동, 검색/필터/정렬, 리뷰, 즐겨찾기, 식당 제보, 제휴이벤트 관리, 관리자 대시보드, 배포 파이프라인 검증

## 개발 시 유의사항

- **이 저장소의 Next.js는 학습 데이터에 있는 버전과 다르다 (breaking changes 존재).** 코드를 작성하기 전 `node_modules/next/dist/docs/`에서 관련 가이드(라우트 핸들러, 데이터 페칭 등)를 확인한다. (`AGENTS.md`)
- 각 개발자는 독립된 Neon 프로젝트(브랜치)에서 작업한다 (PRD 6.2, DevSetup.md).
- 브랜치명은 `feature/기능이름` · `fix/버그이름`, 커밋은 `태그: 설명` 형식을 따른다 (GitConvention.md).
- 필터/정렬 로직은 PRD 12번에 제시된 쿼리 예시를 그대로 따른다 — 개발자 간 구현 차이를 막기 위함.
- MVP 범위에서 명시적으로 제외: AI 추천, 리뷰 사진, 인원수 기반 필터 (PRD 5번 Won't, 16번 향후 확장 계획).

## 페이즈 로드맵 개요

| Phase | 이름 | 선행 조건 | 예상 소요 |
|---|---|---|---|
| 1 | 인증 (회원가입/로그인) | Phase 0 | 1일 |
| 2 | 식당 데이터 기반 (시딩 + 조회 API + 지도) | Phase 0 | 1.5일 |
| 3 | 검색 · 필터 · 정렬 | Phase 2 | 1.5일 |
| 4 | 리뷰 (조회/작성/수정/삭제) | Phase 1, 2 | 1일 |
| 5 | 즐겨찾기 | Phase 1, 2 | 0.5일 |
| 6 | 식당 제보 | Phase 1 | 1일 |
| 7 | 제휴이벤트 관리 (등록/수정) | Phase 2 | 1일 |
| 8 | 관리자 대시보드 (회원/식당/리뷰/제보/제휴이벤트 통합 관리) | Phase 1, 2, 4, 6, 7 | 1.5일 |
| 9 | 반응형 UI 및 배포 검증 | Phase 1~8 | 1일 |
| 10 | 마무리 (버그 수정, 시연 준비) | Phase 1~9 | 남은 기간 |

총 ~10일 (PRD 15번 "2주차: 개발" 기간에 대응), 이후 "발표 전" 기간에 Phase 10 수행.

---

## Phase 1 — 인증 (회원가입/로그인)

**목표**: Neon(PostgreSQL) 기반 커스텀 인증으로 회원가입 → 로그인 → 로그아웃 흐름이 실제 DB로 동작한다.

작업 항목:
- [ ] 비밀번호 해시 유틸 (`password_hash` 컬럼에 저장, 평문 저장 금지)
- [ ] `POST /api/auth/signup` — 이메일 중복 체크(PRD 8번 예외: 중복 이메일), 닉네임, 해시 저장
- [ ] `POST /api/auth/login` — 이메일/비밀번호 조회 인증(PRD 8번 예외: 계정 불일치), `AUTH_SECRET` 기반 세션/쿠키 발급
- [ ] 로그아웃, 로그인 상태를 서버에서 읽는 방법(세션 쿠키 검증 헬퍼) 마련
- [ ] `src/app/signup/page.tsx`, `src/app/login/page.tsx` 폼 UI + API 연동
- [ ] 인증 필요 액션(리뷰 작성, 즐겨찾기, 식당 제보, 관리자 페이지)에서 사용할 인증 가드 헬퍼

참조: PRD 5번(회원가입/로그인), 6.2(커스텀 인증 방식), 8번(기능 명세), 10번(권한 표)

완료 기준: 신규 계정 생성 → 로그인 → 보호된 페이지 접근이 실제 Neon DB 데이터로 동작. 미로그인 사용자는 리뷰 작성/즐겨찾기/제보/관리자 액션에서 차단됨.

---

## Phase 2 — 식당 데이터 기반 구축 (시딩 + 조회 API + 지도)

**목표**: 실제 식당/메뉴 데이터가 존재하고, 목록·상세 조회 및 메인 지도가 동작한다.

작업 항목:
- [ ] Kakao 로컬 API(장소 검색)로 학교 주변 식당 수집 스크립트 (`scripts/` 또는 Prisma seed) — `category_name`에 "술집/호프/포차" 등 주점 키워드 포함 시 제외 (PRD 6.2)
- [ ] 수집 데이터 정제 후 `Restaurant` / `Menu` 시딩 (zone은 좌표/주소 기준으로 5개 구역에 분류, `min_price`는 메뉴 최저가로 계산)
- [ ] `GET /api/restaurants` — 목록 조회 Route Handler
- [ ] `GET /api/restaurants/{id}` — 상세 조회 (존재하지 않는 식당 예외 처리, PRD 8번)
- [ ] 식당 목록 페이지 UI: 카드(이름/카테고리/zone/최저가/제휴 배지)
- [ ] 식당 상세 페이지 UI: 메뉴/가격/위치/제휴이벤트 표시 틀(리뷰는 Phase 4에서 채움)
- [ ] 메인 화면(`/`) Kakao Map 연동 + `navigator.geolocation`으로 내 위치 표시

참조: PRD 6.2(지도/데이터 수집 규칙), 8·9번(기능/화면 명세), 11번(ERD)

완료 기준: 시딩된 실제 식당이 목록/상세에 표시되고, 메인 지도에 내 위치 마커가 표시됨.

---

## Phase 3 — 검색 · 필터 · 정렬

**목표**: PRD 6.1의 검색/필터/정렬 규칙이 정확히 동작한다.

작업 항목:
- [ ] 검색: 식당명/메뉴명 대상(Menu 테이블 전체), 버튼 클릭·Enter 트리거(실시간 자동완성 없음), 결과 없을 시 "검색 결과가 없어요. 새로운 식당을 제보해보세요!" 문구
- [ ] 구역 필터 (정문/상대/예대/후문/공대쪽문)
- [ ] 카테고리 필터 (한식/중식/일식/양식/분식/카페)
- [ ] 가격대 필터 (`min_price` 기준 4구간: ~5천/~1만/~2만/2만~)
- [ ] 제휴이벤트 체크박스 필터 (오늘 날짜가 `partnership_start_date`~`partnership_end_date` 사이인 식당만)
- [ ] 네 필터의 독립 AND 조합 (선택 안 한 필터는 "전체"로 조건 제외) — PRD 12번 쿼리 예시 그대로 구현
- [ ] 정렬: 평점순(기본, 평균 별점 내림차순) / 거리순(하버사인 공식, GPS 거부 시 학교 정문 고정 좌표 대체) / 가격순(최저가 오름차순)

참조: PRD 6.1(검색/필터/정렬), 12번(쿼리 로직 예시), 13번(API 개요)

완료 기준: 필터 조합과 3가지 정렬이 PRD 규칙대로 정확히 동작.

---

## Phase 4 — 리뷰 (조회/작성/수정/삭제)

**목표**: 로그인 사용자가 리뷰를 다중 작성할 수 있고, 본인 리뷰만 수정/삭제 가능하다.

작업 항목:
- [ ] `GET /api/restaurants/{id}/reviews`
- [ ] `POST /api/reviews` — 별점(1~5 정수), 한줄평, 로그인 필요(PRD 8번 예외)
- [ ] `PUT /api/reviews/{id}` / `DELETE /api/reviews/{id}` — 작성자 본인만 허용(PRD 8번 예외: 본인 아님)
- [ ] 식당 상세 페이지에 리뷰 목록 + 작성/수정/삭제 UI
- [ ] 평균 평점 계산 로직이 Phase 3의 평점순 정렬과 일치하는지 확인

참조: PRD 6.1(리뷰), 8번, 10번(권한 표)

완료 기준: 리뷰 CRUD가 권한 규칙대로 동작하고, 평점순 정렬에 즉시 반영됨.

---

## Phase 5 — 즐겨찾기

**목표**: 로그인 사용자가 식당을 즐겨찾기에 추가/삭제하고 마이페이지에서 확인할 수 있다.

작업 항목:
- [ ] 즐겨찾기 추가/삭제 API (개수 제한 없음)
- [ ] 식당 목록/상세에 즐겨찾기 토글 UI
- [ ] 마이페이지 즐겨찾기 목록 — 식당명 클릭 시 상세 페이지 이동

참조: PRD 6.1(즐겨찾기), `schema.prisma`의 `Favorite` 모델(PRD ERD에는 없으나 Must-have 구현을 위해 추가된 모델)

완료 기준: 즐겨찾기 추가/삭제/목록/상세 이동이 정상 동작.

---

## Phase 6 — 식당 제보

**목표**: 사용자가 신규 식당 등록을 요청하고, 마이페이지에서 처리 상태를 확인할 수 있다.

작업 항목:
- [ ] `POST /api/restaurant-requests` — 필수(식당명/위치/카테고리), 선택(메뉴/가격), 필수 누락 시 예외(PRD 8번)
- [ ] 식당 제보 폼 UI (로그인 필요)
- [ ] 마이페이지 "내 제보" — 상태(대기/승인/반려) 조회

참조: PRD 6.1(식당 제보), 7.1(User Flow - 식당 제보), 8·9번

완료 기준: 제보 등록 후 마이페이지에서 상태(초기값 "대기")가 조회됨. (승인/반려 처리는 Phase 8에서 관리자 기능으로 완성)

---

## Phase 7 — 제휴이벤트 관리 (등록/수정)

**목표**: 관리자가 식당별 제휴이벤트(시작일/종료일/내용)를 등록·수정할 수 있다. 자동 노출 판별은 Phase 3에서 이미 구현된 로직을 그대로 재사용한다.

작업 항목:
- [ ] `PATCH /api/admin/restaurants/{id}/partnership` — 시작일/종료일/내용, 종료일이 시작일보다 빠른 경우 예외(PRD 8번)
- [ ] 관리자 UI에서 제휴이벤트 입력 폼 (Phase 8 관리자 대시보드에 편입)
- [ ] 식당 상세 페이지의 제휴 배지/상세 영역이 새 데이터로 정확히 갱신되는지 확인 (별도 on/off 스위치 없이 날짜 기준 자동 판별, PRD 6.1)

참조: PRD 6.1(제휴이벤트), 8·13번

완료 기준: 시작일 이전=미노출, 기간 중=배지+상세 노출, 종료 후=자동 미노출(데이터는 보존)이 모두 확인됨.

---

## Phase 8 — 관리자 대시보드

**목표**: 관리자가 회원/식당/리뷰/제보/제휴이벤트를 한 대시보드에서 관리한다.

작업 항목:
- [ ] 관리자 권한 가드 (`role !== 'admin'` 접근 차단 — role은 DB에서 수동 부여, PRD 6.1)
- [ ] 회원 관리: 조회 (역할 변경은 PRD상 DB 직접 수정이 원칙이므로 조회 위주)
- [ ] 식당 관리: `POST/PUT/DELETE /api/admin/restaurants` (등록/수정/삭제)
- [ ] 리뷰 관리: 조회/삭제
- [ ] 제보 관리: `GET /api/admin/requests`, `PATCH /api/admin/requests/{id}` — 승인 시 내용 수정(카테고리 포함) 후 `Restaurant`/`Menu` 레코드 생성, 반려 처리
- [ ] 제휴이벤트 관리 UI 통합 (Phase 7 API 연결)
- [ ] `src/app/admin/page.tsx`를 섹션별 대시보드로 구현

참조: PRD 6.1(관리자), 7.2(Admin Flow), 8·9·10·13번

완료 기준: 관리자 계정으로 5개 관리 영역 CRUD가 모두 동작하고, 일반 회원 계정으로는 접근이 차단됨. 제보 승인 시 실제로 식당 목록에 반영됨.

---

## Phase 9 — 반응형 UI 및 배포 검증

**목표**: 모바일 최적화 UI를 확인하고, Vercel + Neon 프로덕션 배포가 정상 동작한다.

작업 항목:
- [ ] 전 페이지 모바일 뷰포트 QA (PRD 6.2: 모바일 최적화 반응형 UI)
- [ ] Vercel 프로젝트에 Neon Integration 연결, `DATABASE_URL`/`DIRECT_URL`/`AUTH_SECRET`/Kakao 키 환경변수 등록 (DevSetup.md 4번)
- [ ] `package.json`의 `build` 스크립트에 `prisma migrate deploy` 포함 확인
- [ ] main 브랜치 배포 후 프로덕션 스모크 테스트 (회원가입/로그인/검색/필터/리뷰/제보/관리자 핵심 플로우 1회씩)

참조: PRD 6.2, 14번(배포), DevSetup.md 4번

완료 기준: 프로덕션 URL에서 핵심 User/Admin Flow가 모두 정상 동작.

---

## Phase 10 — 마무리

**목표**: 발표 전 최종 안정화.

작업 항목:
- [ ] 남은 버그 수정 및 엣지 케이스 보완 (빈 상태, 예외 메시지 등)
- [ ] 시연 시나리오 점검 (User Flow + Admin Flow 순서대로 리허설)
- [ ] 발표 자료 준비 (팀 공통 산출물, PRD 15번)

참조: PRD 15번(개발 일정 - 마무리 단계)

---

## 부록 A — PRD 기능 명세(8번) ↔ 페이즈 매핑

| PRD 8번 기능 | 담당 Phase |
|---|---|
| 회원가입 / 로그인 | 1 |
| 식당 검색 | 3 |
| 구역/카테고리/가격대 필터 | 3 |
| 제휴이벤트 필터 | 3 (판별 로직) / 7 (데이터 등록) |
| 정렬 | 3 |
| 식당 상세 | 2 |
| 리뷰 작성/수정/삭제 | 4 |
| 식당 제보 | 6 |
| 제휴이벤트 등록 | 7 |
| 관리자 기능 | 8 |

## 부록 B — PRD API 개요(13번) ↔ 페이즈 매핑

| Endpoint | Phase |
|---|---|
| `POST /auth/signup`, `POST /auth/login` | 1 |
| `GET /restaurants`, `GET /restaurants/{id}` | 2, 3 |
| `GET /restaurants/{id}/reviews`, `POST/PUT/DELETE /reviews` | 4 |
| `POST /restaurant-requests` | 6 |
| `GET /admin/requests`, `PATCH /admin/requests/{id}` | 6, 8 |
| `POST/PUT/DELETE /admin/restaurants` | 8 |
| `PATCH /admin/restaurants/{id}/partnership` | 7 |
| 즐겨찾기 API (PRD 13번에는 없으나 5번 Must-have 구현에 필요) | 5 |

## 부록 C — 브랜치 네이밍 제안 (GitConvention.md 기준)

`feature/auth`, `feature/restaurant-list`, `feature/search-filter`, `feature/review`, `feature/favorite`, `feature/restaurant-request`, `feature/partnership`, `feature/admin-dashboard`, `chore/deploy`
