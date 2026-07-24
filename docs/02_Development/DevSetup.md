개발환경 셋업 가이드

PRD v3 (docs/01_PRD/PRD_v3.md) 기준. Next.js(App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + Neon + Vercel.

코딩이 처음이라 단계별로 하나씩 따라 하고 싶다면 개발환경_통일_가이드.md(02_Development)를 먼저 참고하세요. 이 문서는 그보다 기술적으로 더 자세한 설명이 필요할 때 보는 문서입니다.

1. 로컬 세팅
bash
npm install
cp .env.example .env   # 값 채워넣기 (아래 3번 참고)
npx prisma generate
npm run dev
2. 프로젝트 구조
src/
├── app/            # App Router 페이지 (라우트별 폴더)
│   ├── restaurants/        # 식당 목록
│   │   └── [id]/            # 식당 상세
│   ├── login/, signup/
│   ├── mypage/
│   └── admin/               # 관리자 대시보드
├── components/ui/  # shadcn/ui 컴포넌트
├── lib/
│   ├── prisma.ts   # PrismaClient 싱글턴 (Neon 드라이버 어댑터 사용)
│   └── utils.ts
└── generated/prisma/  # `prisma generate` 산출물 (gitignore, 커밋하지 않음)

prisma/
└── schema.prisma   # 모델 정의 (스키마 변경 규칙은 AGENTS.md 참고 — 예고 없이 임의 변경 금지)
prisma.config.ts    # Prisma CLI 설정 (마이그레이션용 DIRECT_URL)
3. Neon 프로젝트 연결

변경 사항: 이전(PRD v2, 2주 프로젝트) 단계에서는 개발자마다 완전히 독립된 Neon 프로젝트에서 각자 서비스를 처음부터 만들었습니다. 지금은 하나의 코드베이스, 하나의 공유 DB(main 기준)를 팀 전체가 함께 사용하는 구조로 바뀌었습니다.

기본 원칙

DATABASE_URL/DIRECT_URL은 팀장이 관리하는 공유 Neon 프로젝트 값을 그대로 사용합니다. (전달 방법: 노션 비공개 페이지 또는 안전한 채널 — 카톡 캡처 금지)
스키마(schema.prisma) 변경이 필요하면, 공유 DB에 바로 migrate dev를 실행하지 않고 AGENTS.md의 "DB 스키마 변경 규칙"(카톡 예고 후 진행)을 따릅니다.

개인적으로 실험해보고 싶을 때 (선택 사항) Neon은 프로젝트 안에 DB 브랜치를 만드는 기능을 제공합니다. 스키마를 크게 바꿔서 미리 혼자 테스트해보고 싶다면:

Neon 대시보드에서 기존 프로젝트 안에 새 브랜치 생성 (운영 중인 데이터를 그대로 복사한 임시 브랜치)
그 브랜치의 연결 문자열을 로컬 .env에 임시로 넣고 실험
문제없이 확정되면, 실제 변경 사항만 공유 DB(main 브랜치)에 예고 후 반영하고 임시 브랜치는 삭제

이 방법은 필수는 아니며, 스키마 변경이 크고 실패 위험이 있다고 판단될 때만 사용합니다. 평소에는 3번 원칙(공유 DB 직접 사용 + 예고제)만 지키면 충분합니다.

4. Vercel 배포 + Neon 연동
GitHub 저장소를 Vercel 프로젝트로 Import
Vercel 대시보드 > Storage 탭에서 Neon 통합(Integration) 추가
통합을 연결하면 Vercel이 DATABASE_URL, DATABASE_URL_UNPOOLED 등 환경변수를 프로젝트에 자동 주입한다.
DATABASE_URL_UNPOOLED 값을 Vercel 프로젝트의 DIRECT_URL 환경변수로 별도 추가해야 마이그레이션(빌드 시 prisma migrate deploy 등)이 동작한다.
그 외 환경변수(AUTH_SECRET, NEXT_PUBLIC_KAKAO_MAP_APP_KEY, KAKAO_REST_API_KEY)를 Vercel 프로젝트 Settings > Environment Variables에 등록
빌드 커맨드에 마이그레이션을 포함하려면 package.json의 build 스크립트를 다음과 같이 조정한다:
json
   "build": "prisma migrate deploy && next build"
Vercel 프로젝트의 Production Branch가 main으로 설정되어 있는지 확인합니다 (Environments 메뉴). main push 시 Vercel이 자동 배포합니다.
5. 참고
Git 협업 규칙: docs/02_Development/GitConvention.md
제품 요구사항: docs/01_PRD/PRD_v3.md
AI 작업 공통 규칙: 저장소 루트 AGENTS.md / CLAUDE.md