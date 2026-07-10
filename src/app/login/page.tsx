import { PagePlaceholder } from "@/components/page-placeholder";

export default function LoginPage() {
  return (
    <PagePlaceholder
      title="로그인"
      description="이메일/비밀번호 기반 커스텀 인증. POST /api/auth/login."
      features={["이메일", "비밀번호", "회원가입 페이지 링크"]}
    />
  );
}
