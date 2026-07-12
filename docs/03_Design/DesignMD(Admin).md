name: Campus Curation System 

colors: 

  surface: '#f8f9ff' 

  surface-dim: '#cbdbf5' 

  surface-bright: '#f8f9ff' 

  surface-container-lowest: '#ffffff' 

  surface-container-low: '#eff4ff' 

  surface-container: '#f0f4f9' 

  surface-container-high: '#e9eef6' 

  surface-container-highest: '#e3e8ef' 

  on-surface: '#191c20' 

  on-surface-variant: '#43474e' 

  outline: '#73777f' 

  outline-variant: '#c3c7cf' 

  primary: '#ff6b00' 

  on-primary: '#ffffff' 

  primary-container: '#ffdbca' 

  on-primary-container: '#331200' 

  secondary: '#765848' 

  on-secondary: '#ffffff' 

  secondary-container: '#ffdbca' 

  on-secondary-container: '#2b160a' 

  tertiary: '#656032' 

  on-tertiary: '#ffffff' 

  tertiary-container: '#ece4aa' 

  on-tertiary-container: '#1f1c00' 

  error: '#ba1a1a' 

  on-error: '#ffffff' 

  error-container: '#ffdad6' 

  on-error-container: '#410002' 

typography: 

  font-family: Plus Jakarta Sans, sans-serif 

  headings: 

    h1: 700 32px/1.2 Plus Jakarta Sans 

    h2: 700 24px/1.2 Plus Jakarta Sans 

    h3: 600 20px/1.2 Plus Jakarta Sans 

  body: 

    lg: 400 18px/1.5 Plus Jakarta Sans 

    md: 400 16px/1.5 Plus Jakarta Sans 

    sm: 400 14px/1.5 Plus Jakarta Sans 

  label: 

    lg: 500 14px/1.2 Plus Jakarta Sans 

    md: 500 12px/1.2 Plus Jakarta Sans 

    sm: 500 11px/1.2 Plus Jakarta Sans 

spacing: 

  xs: 4px 

  sm: 8px 

  md: 16px 

  lg: 24px 

  xl: 32px 

  xxl: 48px 

roundness: 

  none: 0px 

  small: 4px 

  medium: 8px 

  large: 16px 

  full: 9999px 

--- 

 

# Campus Curation System Design System 

 

이 디자인 시스템은 대학 주변 식당 정보 서비스인 '학식 말고 뭐 먹지?' 관리자 페이지를 위해 설계되었습니다. 활기찬 오렌지 컬러를 메인으로 사용하여 사용자에게 긍정적이고 식욕을 돋우는 인상을 주며, 명확한 위계와 깨끗한 카드 레이아웃을 통해 복잡한 관리 데이터를 효율적으로 처리할 수 있도록 돕습니다. 

 

## 핵심 원칙 

- **직관성**: 관리자가 즉각적으로 상태를 파악할 수 있도록 상태 배지(Pending, Approved 등)와 컬러 코딩을 적극 활용합니다. 

- **일관성**: 모든 입력 폼과 데이터 리스트는 동일한 간격과 둥글기 값을 유지하여 학습 비용을 최소화합니다. 

- **가독성**: Plus Jakarta Sans 서체를 사용하여 숫자가 포함된 데이터 리스트의 가독성을 높였습니다. 

 

## 주요 컴포넌트 패턴 

- **통계 카드**: 상단에 배치되어 주요 지표를 요약하며, 좌측의 컬러 바를 통해 데이터 성격을 구분합니다. 

- **데이터 리스트**: 그림자가 적용된 흰색 배경의 카드 형태로 구현되어 각 항목의 독립성을 확보합니다. 

- **플로팅 액션 버튼(FAB)**: 식당 추가나 이벤트 등록 등 핵심 액션을 화면 하단에 고정 배치하여 접근성을 높였습니다. 

 