통합 프로젝트 명세 및 디자인 시스템: 학식 말고 뭐 먹지? (Campus Curation System)
본 문서는 대학 주변 식당 정보 서비스인 '학식 말고 뭐 먹지?'(사용자 웹 서비스)와 이를 관리하는 'Campus Curation System'(관리자 웹)의 기획, 기능 정의, 그리고 통합 디자인 시스템을 하나로 아우르는 마스터 명세서입니다.

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
사용자 웹 서비스의 캐주얼하고 활기찬 무드와 관리자 페이지의 효율적인 데이터 처리 목적을 모두 충족하도록 설계된 공통 디자인 토큰입니다.

2.1 핵심 원칙
직관성 (Intuitive): 상태 배지(Pending, Approved 등)와 포인트 컬러를 적극 활용하여 사용자와 관리자 모두 정보의 상태를 즉각 파악하도록 합니다.

일관성 (Consistent): 반응형 웹 화면과 관리자 웹 전반에 걸쳐 동일한 간격(Spacing)과 둥글기(Roundness 8px) 값을 적용하여 브랜드 경험을 통일합니다.

가독성 (Readable): Plus Jakarta Sans 서체를 사용하여 텍스트와 숫자가 포함된 데이터 리스트의 가독성을 극대화합니다.

2.2 컬러 팔레트 (Color Palette)
Brand & Primary

primary: #ff6b00 (서비스 메인 CTA, GNB 활성화, 관리자 중요 지표)

on-primary: #ffffff

primary-container: #ffdbca

on-primary-container: #331200

Surface & Background

surface: #f8f9ff (기본 배경)

surface-container-lowest: #ffffff (카드, 바텀 시트, 모달 배경)

surface-container: #f0f4f9

on-surface: #191c20 (기본 텍스트)

on-surface-variant: #43474e (보조 텍스트)

Status & Error

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

2.4 공간 및 형태 (Spacing & Roundness)
Spacing: xs(4px) / sm(8px) / md(16px) / lg(24px) / xl(32px) / xxl(48px)

Roundness: 서비스 전반의 부드러운 UI 지향을 위해 medium(8px)을 기본 라운드로 사용합니다.

none(0px) / small(4px) / medium(8px) / large(16px) / full(9999px)

3. 공통 컴포넌트 및 반응형 웹(Responsive Web) 명세
🚨 핵심: 반응형 규칙 (AI 구현 지시사항)
본 프로젝트는 모바일 우선(Mobile First)으로 구현하며, 화면 크기(Breakpoint)에 따라 반응형으로 레이아웃과 컴포넌트 위치를 변경합니다.

모바일 뷰 (≤768px): 하단 탭바(Bottom Tab Bar) 사용, 화면 폭에 맞춰 카드 1열 배치. (Stitch 디자인 그대로 적용)

태블릿/데스크톱 뷰 (>768px): 상단 네비게이션바(Header GNB)로 전환하고 하단 탭바 숨김 처리. 사이드 여백 확대, 카드 2~3열 그리드 배치.

3.1 화면 크기별 전용 컴포넌트
Global Navigation Bar (GNB):

모바일: 하단 고정 탭바. (홈, 검색, 찜, 마이 4개 탭). 활성화 시 오렌지 컬러(primary) 및 아이콘 굵기 변화.

데스크톱: 상단 고정 헤더 영역으로 이동. 로고를 좌측에 두고 탭 메뉴를 우측에 배치.

Top App Bar (모바일 전용): 브랜드 로고 또는 타이틀, 뒤로가기/알림 아이콘 배치.

Bottom Sheet & Modal: 마커 클릭 시 슬라이드 업되는 정보 시트 및 검색 탭의 전체 화면 덮는 필터 모달. (데스크톱 환경에서는 팝업 또는 사이드 패널 형태로 변형)

3.2 공통 사용 컴포넌트
Filter Chips: 구역(정문, 후문 등) 및 카테고리(한식, 중식 등) 필터. 선택 시 배경 primary, 텍스트 Bold 처리.

Restaurant Card: 썸네일, 식당명, 별점, 카테고리 배지, 위치 요약. (서비스에서는 찜 버튼 포함, 웹에서는 상태 수정 버튼 포함 가능). 라운드 8px 적용. 모바일에서는 1열, 데스크톱에서는 2~3열로 반응형 배치.

3.3 관리자 웹 전용 컴포넌트
Stat Cards (통계 카드): 지표 요약표. 테두리(outline-variant)와 좌측 컬러 인디케이터 포함.

Data List Item: 제보 검토용 리스트. 넉넉한 Spacing(md, lg)과 그림자로 명확한 행 구분.

Status Badge: Pending(노란색 계열), Approved(초록색 계열), Rejected(error 컬러)를 사용한 라벨(label-md).

4. 핵심 비즈니스 로직
위치 권한 제어: 사용자가 위치 정보 제공 거부 시, 대학 '정문'을 기본 좌표(Fallback)로 설정하여 거리순 정렬 및 지도 렌더링을 수행함을 안내 팝업으로 노출합니다.

로그인 분기 (사용자 액션):

단순 탐색 및 검색은 비로그인 허용.

리뷰 작성, 식당 제보, 찜하기 액션 발생 시 비로그인 유저의 경우 '로그인 유도 모달'을 띄워 전환을 유도합니다.

제보 및 검토 프로세스 (User ↔ Admin 연동):

사용자: 마이페이지에서 [식당/메뉴 제보] 폼 제출 (상태: 대기)

관리자: 관리자 웹의 '데이터 관리 리스트'에 신규 항목 생성 (상태: Pending)

관리자: 내용 확인 후 승인(Approved) 또는 반려(Rejected) 처리

사용자: 마이페이지 '내 제보 확인'에서 실시간 상태 업데이트 확인 (승인 시 지도에 마커 즉시 노출)
