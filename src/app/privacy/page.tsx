export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-gray-800">
      <h1 className="mb-2 text-2xl font-bold">개인정보처리방침</h1>
      <p className="mb-8 text-gray-500">시행일자: 2026년 8월 23일</p>

      <p className="mb-8">
        &ldquo;학식 말고 뭐 먹지?&rdquo;(이하 &ldquo;서비스&rdquo;)는 이용자의 개인정보를
        중요시하며, 「개인정보 보호법」 등 관련 법령을 준수하기 위하여 노력하고 있습니다.
        서비스는 본 개인정보처리방침을 통해 이용자가 제공하는 개인정보가 어떠한 용도와
        방식으로 이용되고 있으며, 개인정보 보호를 위해 어떠한 조치가 취해지고 있는지
        알려드립니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목 및 수집 방법">
        <p className="mb-2 font-medium">가. 소셜 로그인(카카오, 구글)</p>
        <p className="mb-4">
          로그인 시 카카오 및 구글로부터 이용자의 식별값(고유 ID), 닉네임을 제공받습니다.
          이메일, 프로필 사진 등 그 외 개인정보는 요청하지 않습니다.
        </p>

        <p className="mb-2 font-medium">나. 리뷰 및 제보 작성 시</p>
        <p className="mb-4">
          이용자가 직접 작성하는 리뷰 텍스트, 선택한 태그, 첨부 사진, 식당 제보 내용이
          수집됩니다.
        </p>

        <p className="mb-2 font-medium">다. 서비스 이용 과정에서 자동 수집되는 정보</p>
        <p className="mb-4">
          접속 로그, 서비스 이용 기록, 기기 정보(OS, 앱 버전) 등이 서비스 운영 및 오류
          대응 목적으로 자동 수집될 수 있습니다.
        </p>

        <p className="mb-2 font-medium">라. 푸시 알림(앱 버전)</p>
        <p>
          앱에서 푸시 알림 수신에 동의한 이용자에 한해, 알림 발송을 위한 기기 토큰 값이
          수집됩니다.
        </p>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <ul className="list-disc space-y-1 pl-5">
          <li>회원 식별 및 로그인 서비스 제공</li>
          <li>리뷰·제보 등 이용자 생성 콘텐츠 서비스 제공 및 관리</li>
          <li>부적절한 콘텐츠(비속어 등) 필터링 및 운영자 검토를 통한 서비스 품질 관리</li>
          <li>서비스 개선을 위한 이용 통계 분석</li>
          <li>공지사항, 알림 등 정보 전달(푸시 알림 동의 시)</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <p>
          이용자의 개인정보는 회원 탈퇴 시 지체 없이 파기함을 원칙으로 합니다. 다만
          관계 법령의 규정에 의하여 보존할 필요가 있는 경우 서비스는 관계 법령에서
          정한 일정한 기간 동안 회원정보를 보관합니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p>
          서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 이용자가
          사전에 동의한 경우, 또는 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진
          절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
        </p>
      </Section>

      <Section title="5. 개인정보 처리 위탁">
        <p className="mb-2">
          서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 외부
          업체에 위탁하고 있습니다.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Vercel Inc. — 서비스 호스팅 및 배포</li>
          <li>Neon (PostgreSQL) — 데이터베이스 운영</li>
          <li>Kakao Corp. — 소셜 로그인, 지도 서비스</li>
          <li>Google LLC — 소셜 로그인</li>
          <li>Firebase(Google) — 푸시 알림 발송(앱 버전)</li>
        </ul>
      </Section>

      <Section title="6. 이용자 및 법정대리인의 권리와 행사 방법">
        <p>
          이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며,
          가입 해지를 요청할 수도 있습니다. 개인정보 조회, 수정, 삭제를 원하시는 경우
          아래 &lsquo;개인정보 보호책임자&rsquo;에게 이메일로 연락하시면 지체 없이
          조치하겠습니다.
        </p>
      </Section>

      <Section title="7. 개인정보의 안전성 확보 조치">
        <p>
          서비스는 이용자의 개인정보를 안전하게 관리하기 위하여 비밀번호 등 주요 정보의
          암호화, 접근권한 제한 등 기술적·관리적 조치를 취하고 있습니다.
        </p>
      </Section>

      <Section title="8. 개인정보 보호책임자">
        <p>
          서비스 이용 중 발생하는 개인정보 관련 문의, 불만 처리 등에 관한 사항은 아래
          담당자에게 문의하시기 바랍니다.
        </p>
        <p className="mt-2">
          이메일:{" "}
          <a
            href="mailto:team.rainbow7.dev@gmail.com"
            className="text-blue-600 underline"
          >
            team.rainbow7.dev@gmail.com
          </a>
        </p>
      </Section>

      <Section title="9. 고지의 의무">
        <p>
          본 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우 시행 최소 7일
          전부터 서비스 내 공지사항을 통하여 고지할 것입니다.
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}
