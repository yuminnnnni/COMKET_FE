import { useState } from "react"
import { useNavigate } from "react-router-dom"
import * as S from "./SignUpForm.Style"
import { COMKET2 } from "@/assets/icons"
import { CheckBox } from "../common/checkbox/CheckBox"
import { registerUser, sendVerificationCode } from "@api/Oauth"

export const SignUpForm = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreements, setAgreements] = useState({
    all: false,
    service: false,
    privacy: false,
    marketing: false,
    information: false,
  })

  const handleAllAgreements = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setAgreements({
      all: checked,
      service: checked,
      privacy: checked,
      marketing: checked,
      information: checked,
    })
  }

  const isFormValid =
    name.trim() !== "" &&
    email.trim() !== "" &&
    verificationCode.trim() !== "" &&
    password.trim().length >= 8 &&
    confirmPassword === password &&
    agreements.service &&
    agreements.privacy;

  const isPasswordMismatch =
    password !== "" && confirmPassword !== "" && password !== confirmPassword;


  const handleAgreementChange = (key: keyof typeof agreements) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked

    // 개별 체크 반영
    const updated = {
      ...agreements,
      [key]: checked,
    }

    // 전체 동의 여부 다시 계산
    updated.all =
      updated.service && updated.privacy && updated.marketing && updated.information

    setAgreements(updated)
  }

  const handleSendVerification = async () => {
    if (!email) {
      alert("이메일을 입력해 주세요.");
      return;
    }

    try {
      const res = await sendVerificationCode(email);
      alert("인증번호가 발송되었습니다!");
      console.log("이메일 인증 응답:", res);
    } catch (err) {
      alert("인증번호 발송에 실패했습니다. 이메일 주소를 확인해주세요.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!agreements.service || !agreements.privacy) {
      alert("필수 약관에 동의해주세요.");
      return;
    }

    try {
      const res = await registerUser({
        email,
        password,
        real_name: name,
      });

      console.log("회원가입 성공:", res);
      alert("회원가입 완료!");
      navigate("/signup/complete");
    } catch (err) {
      alert("회원가입 실패! 다시 시도해주세요.");
    }
  }

  return (
    <S.Container>
      <S.LogoWrapper>
        <COMKET2 />
      </S.LogoWrapper>

      <S.Title>이메일로 회원가입</S.Title>

      <S.Form onSubmit={handleSubmit}>
        <S.FormRow>
          <S.Label>이름</S.Label>
          <S.Input
            type="text"
            placeholder="이름을 입력해 주세요."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </S.FormRow>

        <S.FormRow>
          <S.Label>이메일 주소</S.Label>
          <S.EmailRow>
            <S.EmailInput
              type="email"
              placeholder="이메일 주소를 입력해 주세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <S.VerificationButton type="button" onClick={handleSendVerification}>인증번호 발송</S.VerificationButton>
          </S.EmailRow>
        </S.FormRow>

        <S.FormRow>
          <S.Label>인증번호</S.Label>
          <S.Input
            type="text"
            autoComplete="one-time-code"
            placeholder="인증번호를 입력해 주세요."
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
        </S.FormRow>

        <S.FormRow>
          <S.Label>비밀번호</S.Label>
          <S.Input
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 입력해 주세요. (영문, 숫자 포함 8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </S.FormRow>

        <S.FormRow>
          <S.Label>비밀번호 확인</S.Label>
          <S.Input
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호를 다시 한번 더 입력해 주세요."
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </S.FormRow>

        {isPasswordMismatch && (
          <S.ErrorMessage>비밀번호가 일치하지 않습니다.</S.ErrorMessage>
        )}

        <S.CheckboxContainer>
          <S.CheckboxRow>
            <CheckBox
              label="약관 전체 동의"
              $variant="primary"
              size="md"
              checked={agreements.all}
              onChange={handleAllAgreements}
            />
          </S.CheckboxRow>

          <S.TermRow>
            <CheckBox
              label="[필수] COMKET 서비스 이용 약관"
              $variant="primary"
              size="md"
              checked={agreements.service}
              onChange={handleAgreementChange("service")}
            />
            <S.TermLink href="#">약관 보기</S.TermLink>
          </S.TermRow>

          <S.TermRow>
            <CheckBox
              label="[필수] COMKET 개인 정보 처리 방침"
              $variant="primary"
              size="md"
              checked={agreements.privacy}
              onChange={handleAgreementChange("privacy")}
            />
            <S.TermLink href="#">약관 보기</S.TermLink>
          </S.TermRow>

          <S.TermRow>
            <CheckBox
              label="[선택] 개인 정보 수집 및 이용 동의"
              $variant="primary"
              size="md"
              checked={agreements.marketing}
              onChange={handleAgreementChange("marketing")}
            />
            <S.TermLink href="#">약관 보기</S.TermLink>
          </S.TermRow>

          <S.TermRow>
            <CheckBox
              label="[선택] 마케팅 정보 활용 및 광고성 정보 수신 동의"
              $variant="primary"
              size="md"
              checked={agreements.information}
              onChange={handleAgreementChange("information")}
            />
            <S.TermLink href="#">약관 보기</S.TermLink>
          </S.TermRow>
        </S.CheckboxContainer>

        <S.SignupButton type="submit" onClick={handleSubmit} disabled={!isFormValid}>회원가입</S.SignupButton>
      </S.Form>
    </S.Container>
  )
}
