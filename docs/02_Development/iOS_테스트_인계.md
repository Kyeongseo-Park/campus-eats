iOS 네이티브 앱 테스트 인계 (Mac 담당자용)
==========================================

작성: 2026-09-09
대상: Mac + Xcode 있는 팀원

--------------------------------------------------------------------
0. 지금 상황 요약
--------------------------------------------------------------------

- 이 앱은 Capacitor로 감싼 네이티브 앱이고, 웹뷰가 배포 사이트
  (https://campus-eats-lime.vercel.app)를 그대로 로드하는 구조다.
- 카카오/구글 소셜로그인은 웹뷰가 아니라 시스템 브라우저를 열어
  진행하고 campuseats:// 딥링크로 앱에 복귀시킨다.
- Android(에뮬레이터)에서는 로그인 왕복까지 검증 완료(2026-09-09).
  "첫 탭이 안 먹던" 버그도 고쳐서 main 배포됨(커밋 c252f65).
- iOS는 아직 이 플러그인 구성으로 빌드된 적이 없다. 아래 1번을
  먼저 처리해야 빌드가 된다.

--------------------------------------------------------------------
1. 먼저 할 일 — Package.swift 동기화 (필수, 이게 안 되면 빌드 불가)
--------------------------------------------------------------------

문제:
  ios/App/CapApp-SPM/Package.swift 에 @capacitor/app, @capacitor/browser
  플러그인 의존성이 빠져 있다. (초기 셋업 커밋 0c04b16 이후 갱신 안 됨)
  Windows에서는 cap sync를 돌리면 경로가 역슬래시로 깨져서 못 고친다.
  → Mac에서 해줘야 한다.

순서:
  git switch main && git pull
  npm ci
  npx cap sync ios

  # 결과 확인: ios/App/CapApp-SPM/Package.swift 에 아래 비슷한 게 생겨야 정상
  #  - dependencies 에 .package(name: "CapacitorApp", path: "../../../node_modules/@capacitor/app")
  #    그리고 CapacitorBrowser 도 동일하게
  #  - target dependencies 에 .product(name: "CapacitorApp", package: "CapacitorApp") 등

  git status
  #  ios/App/CapApp-SPM/Package.swift 만 바뀌었는지 확인.
  #  android/*.gradle 에 CRLF 변경만 잔뜩 뜨면 그건 커밋하지 말 것 (git checkout 으로 되돌리기).

  git add ios/App/CapApp-SPM/Package.swift
  git commit -m "fix: iOS Package.swift에 누락된 capacitor 플러그인 동기화"
  git push

  ※ 마이그레이션 파일 같은 게 아니라도, 이 Package.swift 는 먼저
    커밋/푸시해두는 게 좋다 (다른 사람도 iOS 빌드하려면 필요).

--------------------------------------------------------------------
2. Xcode 열고 서명 설정
--------------------------------------------------------------------

선행: Apple Developer 계정이 승인돼 있어야 실기기 코드 서명이 된다.
      계정 상태는 PM에게 먼저 확인. (시뮬레이터만 돌릴 거면 계정 없어도 됨)

  npx cap open ios
  # Xcode 에서 App 타겟 > Signing & Capabilities > Team 지정
  # 빌드 대상: 시뮬레이터 or 연결된 실기기
  # ▶ 실행

--------------------------------------------------------------------
3. iOS 로그인 테스트 체크리스트
--------------------------------------------------------------------

로그아웃 상태에서 마이페이지 탭 → "로그인" 화면:

  [ ] "카카오로 시작하기" 딱 한 번 탭
  [ ] SFSafariViewController(사파리 뷰)가 앱 위로 열림
  [ ] 우리 /login 페이지가 중간에 안 보이고 바로 카카오 로그인 화면으로 감
      (여기가 이번에 고친 부분 — 예전엔 우리 로그인 화면이 한 번 떴었음)
  [ ] 카카오 로그인 완료 → "로그인 완료! 앱으로 돌아가는 중..." → 앱 복귀
  [ ] ★ 복귀하면서 사파리 뷰가 자동으로 닫힌다
      (커밋 70005c6 의 Browser.close() 목적. iOS는 딥링크만으로는
       사파리 뷰가 안 닫혀서 넣은 코드 — iOS에서만 실제 효과 확인 가능)
  [ ] 마이페이지가 로그인된 상태로 보임 (활기찬새내기_xxxx님)
  [ ] "구글로 시작하기" 도 위와 동일하게 한 번에
      (구글은 웹뷰였다면 여기서 차단됐을 것 — 시스템 브라우저라 통과해야 정상)
  [ ] 앱 완전 종료 후 재실행 → 로그인 유지
  [ ] 마이페이지에서 로그아웃 → 로그인 화면 복귀, 다시 로그인 가능

문제 생기면 기록해서 공유할 것:
  - 어느 단계에서 멈췄는지
  - Xcode 콘솔 로그 (Capacitor/Console, 에러 메시지)
  - 사파리 뷰가 안 닫히면: 딥링크 복귀 후 화면 스크린샷

--------------------------------------------------------------------
4. 하지 말 것
--------------------------------------------------------------------

- Windows에서 돌린 cap sync 결과를 커밋하지 말 것 (경로 깨짐 / CRLF 노이즈)
- schema.prisma 는 이 작업과 무관 — 건드리지 말 것
- capacitor.config.ts 의 server.url 을 바꾸지 말 것 (배포본을 봐야 함)

--------------------------------------------------------------------
5. 참고 파일
--------------------------------------------------------------------

  src/components/social-login-buttons.tsx    로그인 버튼 (웹/네이티브 분기)
  src/app/mobile-login/page.tsx              네이티브: signIn() 시작 페이지 (신규)
  src/components/mobile-login-redirect.tsx   위 페이지의 클라이언트 로직 (신규)
  src/app/mobile-auth-bridge/page.tsx        교환 코드 발급 + 딥링크
  src/components/capacitor-auth-bridge.tsx   딥링크 수신 → 세션 교환 (+ Browser.close)
  ios/App/App/Info.plist                     CFBundleURLSchemes = campuseats
  docs/02_Development/네이티브앱_로그인_남은작업.md   전체 배경 문서
