# CampusEats

학식 말고 뭐 먹지? — 대학생을 위한 학교 주변 식당 정보 통합 웹 서비스.

식당 검색, 구역/카테고리/가격대 필터, 메뉴·가격·리뷰 조회, 식당 제보 기능을 제공하는 반응형 웹 애플리케이션입니다. 자세한 요구사항은 PRD_v2 문서를 참고하세요.

## 기술 스택

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Neon (Serverless Postgres)
- **ORM**: Prisma
- **Auth**: 커스텀 인증 (User 테이블 이메일/비밀번호 기반)
- **Map**: Kakao Map API
- **Deployment**: Vercel (Neon 통합)

## 개발 환경 셋업

```bash
npm install
cp .env.example .env.local   # DATABASE_URL 등 값 채우기
npx prisma generate
npx prisma db push           # Neon DB에 스키마 반영
npm run dev
```

`.env.local`에는 Neon 콘솔에서 발급받은 pooled connection string을 `DATABASE_URL`에 넣습니다. Vercel에 배포 시에는 Vercel의 Neon 통합(Integration)을 사용해 동일한 환경변수를 프로젝트에 연결합니다.

## 스크립트

- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 검사
- `npx prisma studio` — DB 데이터 확인용 GUI
