통합 프로젝트 명세 및 디자인 시스템: 학식 말고 뭐 먹지? (Campus Curation System)
본 문서는 대학 주변 식당 정보 서비스인 '학식 말고 뭐 먹지?'(사용자 앱)와 이를 관리하는 'Campus Curation System'(관리자 웹)의 기획, 기능 정의, 그리고 통합 디자인 시스템을 하나로 아우르는 마스터 명세서입니다.

1. 서비스 개요
서비스명: 학식 말고 뭐 먹지? (Admin: Campus Curation System)

타겟 고객:

사용자: 대학교 주변 식당 정보, 리얼한 리뷰, 가성비 맛집을 찾는 대학생

관리자: 서비스 데이터(식당 제보, 리뷰, 정보 수정)를 검토하고 관리하는 운영진

핵심 가치:

위치 기반 맞춤형 맛집 탐색

사용자 참여형 데이터 확장 (식당 및 메뉴 제보)

학생들의 리얼한 평가 데이터 (가성비, 맛, 친절도) 공유

관리자의 직관적이고 효율적인 데이터 검토 및 승인 프로세스

2. 통합 디자인 시스템 (Design System)
사용자 앱의 캐주얼하고 활기찬 무드와 관리자 페이지의 효율적인 데이터 처리 목적을 모두 충족하도록 설계된 공통 디자인 토큰입니다.

2.1 핵심 원칙
직관성 (Intuitive): 상태 배지(Pending, Approved 등)와 포인트 컬러를 적극 활용하여 사용자와 관리자 모두 정보의 상태를 즉각 파악하도록 합니다.

일관성 (Consistent): 모바일 앱과 관리자 웹 전반에 걸쳐 동일한 간격(Spacing)과 둥글기(Roundness 8px) 값을 적용하여 브랜드 경험을 통일합니다.

가독성 (Readable): Plus Jakarta Sans 서체를 사용하여 텍스트와 숫자가 포함된 데이터 리스트의 가독성을 극대화합니다.

2.2 컬러 팔레트 (Color Palette)
메인 컬러인 활기찬 오렌지를 중심으로, 정보의 위계와 상태를 나타내는 기능적 컬러로 구성됩니다.

Brand \& Primary

primary: #ff6b00 (앱 메인 CTA, GNB 활성화, 관리자 중요 지표)

on-primary: #ffffff

primary-container: #ffdbca

on-primary-container: #331200

Surface \& Background

surface: #f8f9ff (기본 배경)

surface-container-lowest: #ffffff (카드, 바텀 시트, 모달 배경)

surface-container: #f0f4f9

on-surface: #191c20 (기본 텍스트)

on-surface-variant: #43474e (보조 텍스트)

Status \& Error

error: #ba1a1a (권한 거부, 반려, 에러 메시지)

on-error: #ffffff

error-container: #ffdad6

2.3 타이포그래피 (Typography)
Font Family: Plus Jakarta Sans, sans-serif

Headings:

h1: Bold(700) 32px / Line-height 1.2

h2: Bold(700) 24px / Line-height 1.2

h3: SemiBold(600) 20px / Line-height 1.2

Body:

lg: Regular(400) 18px / Line-height 1.5

md: Regular(400) 16px / Line-height 1.5

sm: Regular(400) 14px / Line-height 1.5

2.4 공간 및 형태 (Spacing \& Roundness)
Spacing: xs(4px) / sm(8px) / md(16px) / lg(24px) / xl(32px) / xxl(48px)

Roundness: 서비스 전반의 부드러운 UI 지향을 위해 medium(8px)을 기본 라운드로 사용합니다.

none(0px) / small(4px) / medium(8px) / large(16px) / full(9999px)

3. 화면 구조 및 기능 정의 (Sitemap)
A. 사용자 앱 (User App)
홈 (인터랙티브 지도)

Kakao Map API 연동 지도 및 사용자 위치 표시

상단 퀵 필터 칩 (구역, 카테고리)

식당 마커 선택 시 하단 바텀 시트 노출

검색 및 탐색

식당명/메뉴명 통합 검색창

상세 필터 모달 (구역, 카테고리, 가격대)

결과 정렬 (평점순, 거리순, 가격순) 및 제보 유도 CTA

찜 (즐겨찾기)

사용자가 찜한 식당 카드형 리스트 (실시간 해제/이동)

마이페이지 및 활동

사용자 프로필 및 로그인/로그아웃

신규 식당 제보하기 폼 (식당명, 위치, 카테고리 필수 / 메뉴, 가격, 이미지 선택)

내 제보 상태(대기/승인/반려) 확인 및 리뷰 관리

식당 상세 페이지 (Tab 기반)

메뉴: 식당 기본 정보, 대표 메뉴 이미지 및 가격 리스트

리뷰: 평균 별점, 상세 평점(가성비/맛/친절도), 리뷰 리스트

위치: 텍스트 주소 및 지도 기반 상세 위치

B. 관리자 웹 (Admin Web: Campus Curation System)
대시보드 (Dashboard)

통계 카드: 총 등록 식당 수, 신규 가입자, 미처리 제보 건수 등 핵심 지표 요약 (좌측 컬러 바로 데이터 성격 구분)

데이터 관리 리스트 (Data Management)

사용자 제보(신규 식당, 메뉴 수정, 리뷰 등) 목록

그림자가 적용된 흰색 배경의 카드 형태로 구현하여 데이터 독립성 확보

상태 배지(Pending, Approved, Rejected)를 통한 직관적 현황 파악

글로벌 액션 (Global Actions)

플로팅 액션 버튼(FAB): 식당 강제 추가, 공지사항/이벤트 등록 등 핵심 액션을 화면 하단에 고정하여 접근성 향상

4. 공통 컴포넌트 명세
4.1 모바일 앱 전용 컴포넌트
Global Navigation Bar (GNB): 하단 고정. 홈, 검색, 찜, 마이 4개 탭. 활성화 시 오렌지 컬러(primary) 및 아이콘 굵기 변화.

Top App Bar: 브랜드 로고 또는 타이틀, 뒤로가기/알림 아이콘 배치.

Filter Chips: 구역(정문, 후문 등) 및 카테고리(한식, 중식 등) 필터. 선택 시 배경 primary, 텍스트 Bold 처리.

Bottom Sheet \& Modal: 마커 클릭 시 슬라이드 업되는 정보 시트 및 검색 탭의 전체 화면 덮는 필터 모달 (배경 surface-container-lowest).

4.2 관리자 웹 전용 컴포넌트
Stat Cards (통계 카드): 지표 요약표. 테두리(outline-variant)와 좌측 컬러 인디케이터 포함.

Data List Item: 제보 검토용 리스트. 넉넉한 Spacing(md, lg)과 그림자로 명확한 행 구분.

Status Badge: Pending(노란색 계열), Approved(초록색 계열), Rejected(error 컬러)를 사용한 라벨(label-md).

4.3 공통 사용 컴포넌트
Restaurant Card: 썸네일, 식당명, 별점, 카테고리 배지, 위치 요약. (앱에서는 찜 버튼 포함, 웹에서는 상태 수정 버튼 포함 가능). 라운드 8px 적용.

5. 핵심 비즈니스 로직
위치 권한 제어:

사용자가 위치 정보 제공 거부 시, 대학 '정문'을 기본 좌표(Fallback)로 설정하여 거리순 정렬 및 지도 렌더링을 수행함을 안내 팝업으로 노출합니다.

로그인 분기 (사용자 액션):

단순 탐색 및 검색은 비로그인 허용.

리뷰 작성, 식당 제보, 찜하기 액션 발생 시 비로그인 유저의 경우 '로그인 유도 모달'을 띄워 전환을 유도합니다.

제보 및 검토 프로세스 (User ↔ Admin 연동):

사용자: 마이페이지에서 \[식당/메뉴 제보] 폼 제출 (상태: 대기)

관리자: 관리자 웹의 '데이터 관리 리스트'에 신규 항목 생성 (상태: Pending)

관리자: 내용 확인 후 승인(Approved) 또는 반려(Rejected) 처리

사용자: 마이페이지 '내 제보 확인'에서 실시간 상태 업데이트 확인 (승인 시 지도에 마커 즉시 노출)

