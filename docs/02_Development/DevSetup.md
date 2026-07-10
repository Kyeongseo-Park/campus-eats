# 개발환경 셋업 가이드

PRD v2 (docs/01_PRD/PRD_v2.md) 14번 기술 스택 기준. Next.js(App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + Neon + Vercel.

## 1. 로컬 세팅

```bash
npm install
cp .env.example .env   # 값 채워넣기 (아래 3번 참고)
npx prisma generate
npm run dev
```

## 2. 프로젝트 구조

```
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
└── schema.prisma   # ERD(PRD 11번) 기반 모델 정의
prisma.config.ts    # Prisma CLI 설정 (마이그레이션용 DIRECT_URL)
```

## 3. Neon 프로젝트 연결

각 개발자는 독립된 Neon 프로젝트(브랜치)에서 작업한다 (PRD 6.2).

1. https://neon.tech 에서 프로젝트 생성 (리전은 서울에서 가까운 곳 권장)
2. Neon 대시보드 > Connect 에서 두 종류의 연결 문자열을 각각 복사:
   - **Pooled connection** → `.env`의 `DATABASE_URL` (앱 런타임에서 사용, `@prisma/adapter-neon` 경유)
   - **Direct connection** → `.env`의 `DIRECT_URL` (Prisma CLI 마이그레이션 전용, `prisma.config.ts`가 사용)
3. 스키마를 DB에 반영:
   ```bash
   npx prisma migrate dev --name init
   ```

> Prisma 7부터는 `schema.prisma`의 `datasource` 블록에 연결 문자열을 두지 않는다. CLI(마이그레이션 등)는 `prisma.config.ts`의 `DIRECT_URL`을, 앱 런타임은 `src/lib/prisma.ts`의 `@prisma/adapter-neon` + `DATABASE_URL`을 사용한다.

## 4. Vercel 배포 + Neon 연동

1. GitHub 저장소를 Vercel 프로젝트로 Import
2. Vercel 대시보드 > Storage 탭에서 **Neon** 통합(Integration) 추가
   - 통합을 연결하면 Vercel이 `DATABASE_URL`, `DATABASE_URL_UNPOOLED` 등 환경변수를 프로젝트에 자동 주입한다.
   - `DATABASE_URL_UNPOOLED` 값을 Vercel 프로젝트의 `DIRECT_URL` 환경변수로 별도 추가해야 마이그레이션(빌드 시 `prisma migrate deploy` 등)이 동작한다.
3. 그 외 환경변수(`AUTH_SECRET`, `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`, `KAKAO_REST_API_KEY`)를 Vercel 프로젝트 Settings > Environment Variables에 등록
4. 빌드 커맨드에 마이그레이션을 포함하려면 `package.json`의 `build` 스크립트를 다음과 같이 조정한다:
   ```json
   "build": "prisma migrate deploy && next build"
   ```
5. main 브랜치 push 시 Vercel이 자동 배포한다.

## 5. 참고

- Git 협업 규칙: `docs/02_Development/GitConvention.md`
- ERD 원본: `docs/01_PRD/PRD_v2.md` 11번
