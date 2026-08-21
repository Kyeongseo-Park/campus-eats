# 네이티브 앱 전환 (Capacitor) — 작업 기록

> 이 문서는 "기존 웹앱을 Capacitor로 감싸서 iOS/Android 네이티브 앱으로 출시" 작업을
> Claude가 세션 간에 잊지 않도록 남겨두는 진행 기록 문서입니다.

---

## 1. 배경 및 목적

- 현재 "학식 말고 뭐 먹지?"는 Next.js(App Router) 기반 웹앱으로 Vercel에 배포되어 있음
  (임시 주소: https://campus-eats-lime.vercel.app)
- Capacitor로 기존 웹앱을 감싸서 iOS/Android 스토어에 네이티브 앱 형태로 출시하는 것이 목표
- 웹 코드베이스(Next.js)는 그대로 유지하면서, 앱 스토어 배포용 래퍼(wrapper)만 추가하는
  접근 (풀 리라이트 아님)

## 2. 현재 상태 (2026-08-21 기준)

- **Capacitor 셋업 + 소셜로그인 웹뷰 우회 코드 구현 완료.** 아래는 됨/안됨 구분:
  - [x] `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`,
        `@capacitor/browser`, `@capacitor/app` 설치
  - [x] `capacitor.config.ts` 생성 (앱 ID `kr.co.campuseats.app`, 앱 이름
        "학식 말고 뭐 먹지?", `server.url`로 배포된 사이트를 그대로 로드하는 방식)
  - [x] `ios/`, `android/` 네이티브 프로젝트 스캐폴딩 완료
  - [x] 카카오/구글 로그인의 웹뷰 우회 + 세션 브리징 코드 구현 (5번 항목 참고)
  - [x] `npx tsc --noEmit`, `eslint` 통과 / `npm run dev`로 `/login`,
        `/mobile-auth-bridge` 렌더링 확인
  - [ ] **실기기/에뮬레이터에서 실제 로그인 흐름 테스트는 아직 안 함** (Windows
        환경이라 iOS는 Xcode 빌드 자체가 불가 — 아래 6-3 참고)
  - [ ] 카카오맵 API가 웹뷰 안에서 정상 동작하는지 (GPS 권한 등)
  - [ ] iOS/Android 앱 아이콘, 스플래시 등 스토어 등록용 리소스
- 브랜치: `hg-branch`

## 5. 소셜로그인(카카오/구글) 웹뷰 이슈 및 해결 방향

### 5-1. 문제

앱은 배포된 웹사이트를 앱 내장 웹뷰(iOS `WKWebView` / Android `android.webkit.WebView`)로
그대로 로드하는 구조. 이 환경에서 OAuth 로그인 시:

- **구글**: 임베디드 웹뷰에서의 OAuth 요청을 정책으로 차단 (`disallowed_useragent`) →
  로그인 100% 실패
- **카카오**: 정책상 완전 차단은 아니지만, 웹뷰 환경에서 세션/쿠키 유지가 불안정해서
  로그인 후 세션이 끊기는 문제가 흔함

### 5-2. 현재 코드 구조 (해결 방향 설계의 전제)

- `src/lib/next-auth.ts`: NextAuth v5(beta), `session: { strategy: "jwt" }`,
  카카오는 `profile.id`만, 구글은 `scope: "openid"`로 `profile.sub`만 사용 (이메일/프로필
  비수집 원칙 유지 중 — 해결 방향도 이 원칙을 깨지 않아야 함)
- `src/app/login/page.tsx`: 서버 컴포넌트. 로그인 버튼이 **서버 액션**(`"use server"`)
  안에서 `signIn("kakao"/"google", { redirectTo: callbackUrl })`를 직접 호출하는 구조 →
  즉, 지금은 로그인 시작~콜백까지 전 과정이 "웹뷰가 보고 있는 그 origin" 안에서 일어난다는
  전제로 짜여 있음. 시스템 브라우저로 분기하려면 이 부분부터 클라이언트 컴포넌트로 바꿔야 함
- 콜백 라우트: `/api/auth/[...nextauth]` (`src/app/api/auth/[...nextauth]/route.ts`)
- 환경변수: `AUTH_KAKAO_ID`, `AUTH_KAKAO_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

### 5-3. 해결 방향 (사용자 제안, 채택)

로그인 버튼을 눌렀을 때만 예외적으로 앱 내장 웹뷰가 아니라 **`@capacitor/browser`**
플러그인으로 시스템 브라우저(iOS `SFSafariViewController` / Android `Custom Tabs`)를
열어서 그 안에서 OAuth를 진행하고, 로그인 완료 후 **커스텀 URL 스킴**으로 앱에 복귀시킨다.
나머지 화면은 지금처럼 웹뷰로 그대로 로드.

### 5-4. 리스크와 실제 구현 방식 (구현 완료, 2026-08-21 갱신)

> 이 섹션은 원래 "구현 착수 전 검증 필요한 리스크" 목록으로 작성됐으나, 이후 세션에서
> 실제로 구현이 진행되어 현재는 완료된 상태입니다. 각 항목을 실제로 어떻게 처리했는지
> 아래에 남깁니다 (다음에 이어서 볼 사람이 "아직 안 된 것"으로 착각하지 않도록).

1. **세션 쿠키 브리징 문제 (가장 큰 리스크)** → **(a)안으로 구현 완료.**
   - `src/lib/next-auth.ts`: `mobile-exchange`라는 별도 Credentials provider 추가. 세션
     쿠키(`session-token`)와 별도 salt(`MOBILE_EXCHANGE_SALT`)로 서명된 60초짜리 일회용
     교환 코드를 검증. 서버 인스턴스 생존 기간 한정이지만 재사용 방지 로직도 있음.
   - `src/app/mobile-auth-bridge/page.tsx`: 시스템 브라우저에서 OAuth 콜백이 최종
     도착하는 신규 페이지. 로그인된 세션에서 교환 코드를 발급해 커스텀 스킴
     (`campuseats://auth-callback?code=...`)으로 앱에 돌려보냄.
   - `src/components/capacitor-auth-bridge.tsx`: `RootLayout`에 전역 마운트. 딥링크
     수신(`@capacitor/app`의 `appUrlOpen`) 시 그 코드를 `signIn("mobile-exchange", ...)`로
     교환해 웹뷰 쪽에도 세션 쿠키를 심음.
   - (b)안(JWT를 딥링크에 직접 실어 보내는 방식)은 채택하지 않음.
2. **OAuth `redirect_uri`는 `https://` 도메인 유지** → 구현대로 유지됨. 시스템 브라우저
   안에서의 OAuth 흐름은 그대로 `https://campus-eats-lime.vercel.app/api/auth/callback/...`
   로 끝나고, 그 이후 `/mobile-auth-bridge` 페이지에서만 커스텀 스킴으로 전환.
3. **카카오/구글 콘솔에 등록된 Redirect URI 유효성** → **미확인 (남은 작업).** 플랫폼이
   여전히 웹이라 문제없을 것으로 예상되지만, 실기기 로그인 테스트 전에 재확인 필요.
4. `src/app/login/page.tsx` 클라이언트 컴포넌트 분기 → 구현 완료.
   `src/components/social-login-buttons.tsx`가 `Capacitor.isNativePlatform()`으로 감지해
   네이티브면 `Browser.open()`, 웹이면 기존 `next-auth/react`의 `signIn()`을 그대로 사용.
5. 신규 패키지 설치 (`@capacitor/browser`, `@capacitor/app` 등) → **완료** (package.json에
   반영됨, 이 세션에서 새로 설치한 것 없음).
6. iOS `Info.plist` / Android `AndroidManifest.xml` 커스텀 URL 스킴 등록 → **완료.**
   `ios/App/App/Info.plist`에 `CFBundleURLSchemes: ["campuseats"]`, Android
   `AndroidManifest.xml`에 `android:scheme="campuseats" android:host="auth-callback"`
   intent-filter 등록 확인됨.

### 5-5. Android 에뮬레이터 딥링크/로그인 흐름 실측 테스트 결과 (2026-08-21)

`Small_Phone` AVD + 디버그 빌드로 실제 테스트 진행함 (빌드용 JDK가 없어 Temurin JDK 21
설치함, `JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.8-hotspot"` 로 빌드).

**1) 매니페스트 딥링크 라우팅 — 확인됨.** 앱을 완전히 종료한 상태에서
`adb shell am start -a android.intent.action.VIEW -d "campuseats://auth-callback?..."`로
콜드 스타트 딥링크 실행 → `kr.co.campuseats.app/.MainActivity`가 정상적으로 열림.

**2) 로컬 dev 서버(10.0.2.2:3000)로 전체 로그인 흐름 테스트 — 확인됨, 막히는 지점까지.**
`capacitor.config.ts`의 `server.url`을 임시로 `http://10.0.2.2:3000`(+`cleartext:true`)
로 바꾸고 재빌드해서 테스트 (테스트 후 프로덕션 URL로 원복함).
- 로그인 버튼(카카오/구글) 탭 → `Browser.open()` → 시스템 브라우저(Chrome Custom Tabs)가
  정상적으로 열려 로컬 서버의 `/api/auth/signin/kakao`로 이동 → 카카오 시크릿이 없어
  `/api/auth/error?error=Configuration`로 리다이렉트됨 (예상된 막히는 지점, 정상 동작)
- **중요 이슈 발견 및 수정: `adb shell input tap`으로는 이 WebView 안에서 React
  이벤트 핸들러가 전혀 안 붙는 현상 발견.** 원인은 코드 버그가 아니라 로컬 dev 환경
  설정: Next.js 개발 서버가 `10.0.2.2` origin에서 온 HMR 웹소켓 요청을 cross-origin으로
  차단(`ERR_INVALID_HTTP_RESPONSE`) → 재연결 루프가 하이드레이션 자체를 막아버림
  (Chrome DevTools Protocol로 `__reactProps$...`가 DOM에 안 붙는 것 확인해서 특정함).
  **`next.config.ts`에 `allowedDevOrigins: ['10.0.2.2']` 추가**로 해결, 이후 하이드레이션
  정상 작동 확인함. 이 설정은 dev에만 영향(프로덕션 빌드/배포 무관)이라 그대로 유지하기로
  함 (커밋 여부는 사용자 판단, 아직 커밋 안 함).
- `adb shell input tap`은 이 WebView에서 터치를 잘 못 받는 것으로 보임(에뮬레이터 특성으로
  추정) — `adb shell input swipe X Y X Y 100`(같은 좌표로 짧게)이 탭 대용으로 안정적으로
  동작함. 다음에 같은 방식으로 테스트할 때 참고.
- 리다이렉트 대상이 `10.0.2.2:3000`이 아니라 `localhost:3000`으로 나가서
  `ERR_CONNECTION_REFUSED`가 뜨는 것도 확인됨 — 이건 NextAuth의 `trustHost` 기본 보안
  정책 때문(임의 Host 헤더를 신뢰하지 않고 기본값으로 폴백)으로, **실제 배포 도메인에서는
  발생하지 않는 로컬 테스트 한정 현상**이라 코드 수정 불필요로 판단함.

### 5-6. 카카오맵 웹뷰 동작 + GPS 권한 테스트 결과 (2026-08-21)

프로덕션(`https://campus-eats-lime.vercel.app`) 설정 그대로 에뮬레이터 실기기 테스트함.

- **지도 렌더링 — 정상.** 타일(`mts.daumcdn.net`) 로드 성공, 마커 클러스터(551개 표시)
  등 전부 정상 렌더링됨. 최초 로드 후 몇 초 정도는 흰 화면일 수 있음(타일 로딩 시간,
  버그 아님).
- **GPS "내 위치" — 문제 발견 후 수정 완료.** `android/app/src/main/AndroidManifest.xml`에
  `ACCESS_FINE_LOCATION`/`ACCESS_COARSE_LOCATION` 권한 선언이 아예 없어서
  `navigator.geolocation.getCurrentPosition()`이 `PERMISSION_DENIED`로 즉시 실패하고
  있었음(권한 다이얼로그 자체가 안 뜸). **매니페스트에 두 권한을 추가해서 해결** — 새
  패키지 설치 없이 `MainActivity`가 이미 상속하는 Capacitor `BridgeActivity`가 알아서
  런타임 권한 다이얼로그를 띄워줌. 재빌드 후 실제로 "Allow this device's location?"
  다이얼로그가 뜨고, "While using the app" 선택 시 `granted=true`로 정상 부여되는 것까지
  확인함. (그 이후 `getCurrentPosition`이 `Timeout`으로 실패하는 건 이 AVD에 시뮬레이션
  GPS 좌표가 설정되지 않아서 — 실기기에서는 발생하지 않는 순수 에뮬레이터 환경 문제라
  코드 수정 불필요.)
- **주의:** 이 매니페스트 수정은 `android/` 폴더 안에 있는데, `android/`·`ios/`는 현재
  git에 커밋되지 않은 미추적(untracked) 상태(`git status` 기준). 나중에 네이티브
  프로젝트를 git에 추가할지(보통 Capacitor 프로젝트는 `ios/`, `android/`를 커밋하는 것이
  관례) 사용자 판단 필요.

**남은 작업:**

1. 실제 카카오/구글 OAuth 시크릿을 넣은 **완전한 로그인 성공까지의 실기기 테스트**
   (iOS는 Windows라 Xcode 빌드 자체가 불가 — Mac 있는 팀원/환경 필요) — 시크릿
   준비되면 진행
2. 카카오 디벨로퍼스 콘솔 / Google Cloud Console에 등록된 Redirect URI가 지금 그대로
   유효한지 확인 — 사용자가 콘솔에서 직접 확인 필요 (외부 서비스, Claude 접근 불가)
3. ~~카카오맵 API가 웹뷰 안에서 정상 동작하는지~~ — 완료 (위 5-6 참고)
4. iOS/Android 앱 아이콘, 스플래시 등 스토어 등록용 리소스 — 로고/파비콘 등 디자인
   자산 준비되면 진행
5. **[NEW, Mac 테스트 시 처리하기로 함] iOS `Info.plist`에
   `NSLocationWhenInUseUsageDescription` 키가 없음** — Android에서 발견한
   위치 권한 누락(5-6 참고)과 같은 종류의 문제인데, iOS는 이 키 없이 위치 API를
   호출하면 권한 거부 정도가 아니라 **앱이 크래시할 수 있어 더 심각함**. 코드
   자체는 이미 공용(Next.js)이라 iOS 전용으로 새로 개발할 건 없고, Mac에서 빌드·
   서명·실행 테스트할 때 이 키를 `ios/App/App/Info.plist`에 추가하면서 같이
   검증할 것.

## 6. 참고

- 프로젝트 스택/구조: `docs/02_Development/DevSetup.md`
- 제품 요구사항: `docs/01_PRD/PRD_v3.md`
- AI 작업 공통 규칙(패키지 설치, 승인 원칙 등): 저장소 루트 `AGENTS.md` / `CLAUDE.md`

---

작업 착수 시, AGENTS.md의 "새 기능이나 새 작업을 시작하기 전 인터랙션 체크리스트 +
Acceptance Criteria를 먼저 질문 형태로 제시" 원칙에 따라 위 3번·5번 항목들을 바탕으로
별도 체크리스트를 다시 정리해서 확인받은 후 구현을 시작합니다.
