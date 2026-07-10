import { PagePlaceholder } from "@/components/page-placeholder";

export default function SignupPage() {
  return (
    <PagePlaceholder
      title="회원가입"
      description="회원 계정을 생성한다. POST /api/auth/signup."
      features={["이메일 (중복 불가)", "비밀번호", "닉네임"]}
    />
  );
}
