export default function SupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-gray-800">
      <h1 className="mb-2 text-2xl font-bold">고객 지원</h1>
      <p className="mb-8 text-gray-500">
        &ldquo;학식 말고 뭐 먹지?&rdquo; 이용 중 궁금한 점이나 불편한 점이 있으신가요?
      </p>

      <Section title="문의하기">
        <p>
          아래 이메일로 문의 주시면 확인 후 답변드리겠습니다.
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

      <Section title="자주 묻는 질문">
        <div className="flex flex-col gap-6">
          <QA question="로그인이 안 돼요">
            카카오 또는 구글 계정으로 로그인할 수 있습니다. 로그인 화면이 뜨지 않거나
            오류가 발생하면, 앱을 완전히 종료한 뒤 다시 실행해보세요. 문제가 계속되면
            위 이메일로 사용 중인 기기(iOS/Android)와 함께 문의해주세요.
          </QA>

          <QA question="식당 정보가 실제와 달라요">
            식당 상세페이지의 &ldquo;정보 수정 제보&rdquo; 메뉴를 통해 잘못된 정보를
            알려주시면, 검토 후 반영합니다.
          </QA>

          <QA question="목록에 없는 식당이 있어요">
            앱 내 &ldquo;식당 제보&rdquo; 기능으로 새로운 식당을 등록 요청하실 수
            있습니다. 관리자 검토 후 목록에 추가됩니다.
          </QA>

          <QA question="작성한 리뷰를 수정하거나 삭제하고 싶어요">
            마이페이지에서 본인이 작성한 리뷰 목록을 확인하고 수정·삭제할 수 있습니다.
          </QA>

          <QA question="부적절한 리뷰를 발견했어요">
            해당 리뷰의 신고 버튼을 눌러 신고해주시면 운영자가 확인 후 조치합니다.
          </QA>

          <QA question="회원 탈퇴는 어떻게 하나요">
            마이페이지에서 직접 탈퇴할 수 있습니다. 탈퇴 시 작성한 리뷰는 삭제되지
            않고 남지만, 즐겨찾기·제보 내역은 모두 삭제되며 되돌릴 수 없습니다.
            탈퇴 후 개인정보 처리에 대한 자세한 내용은{" "}
            <a href="/privacy" className="text-blue-600 underline">
              개인정보처리방침
            </a>
            을 참고해주세요.
          </QA>
        </div>
      </Section>

      <Section title="버그 및 개선 제안">
        <p>
          앱 이용 중 오류를 발견하셨거나 개선했으면 하는 점이 있다면 언제든 위
          이메일로 알려주세요. 소중한 의견 감사히 반영하겠습니다.
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

function QA({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-medium">Q. {question}</p>
      <p className="text-gray-700">{children}</p>
    </div>
  );
}
