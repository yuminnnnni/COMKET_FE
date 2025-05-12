import { useState } from "react"
import { useNavigate } from "react-router-dom"
import * as S from "./LoginForm.Style"
import { OauthLoginButton } from "./OauthLoginButton"
import { TextInput } from "@/components/common/textInput/TextInput"
import { CheckBox } from "../common/checkbox/CheckBox"
import { COMKET2 } from "@/assets/icons"
import { logIn } from "@api/Oauth"
import { toast } from "react-toastify"

export const LoginForm = () => {
  const [rememberEmail, setRememberEmail] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleCheckboxChange = () => {
    setRememberEmail(!rememberEmail)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const data = await logIn({ email, password })
      toast.success("로그인 성공!")
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("email", data.email)
      navigate('/workspace')

    } catch (error) {
      console.error("로그인 실패:", error)
      alert("로그인에 실패했습니다. 이메일 또는 비밀번호를 확인해주세요.")
    }
  }

  return (
    <S.Container>
      <S.Header>
        <COMKET2 />
        <S.Title>로그인</S.Title>
      </S.Header>

      <S.FormWrapper>
        <form onSubmit={handleSubmit}>
          <S.FormRow>
            <TextInput type="default" size="md" state="enable" value={email} onChange={setEmail} placeholder="이메일" />
          </S.FormRow>

          <S.FormRow>
            <TextInput type="password" size="md" state="enable" value={password} onChange={setPassword} placeholder="비밀번호" />
          </S.FormRow>

          <S.RememberSignupRow>
            <CheckBox
              label="이메일 기억하기"
              $variant="primary"
              visualState={rememberEmail ? "checked" : "unchecked"}
              onChange={handleCheckboxChange}
              size="md"
              interactionState="default"
              className="checkbox"
            />
            <S.SignupLink href="/signup">회원가입</S.SignupLink>
          </S.RememberSignupRow>

          <S.LoginButton type="submit">로그인</S.LoginButton>

          <S.Divider>
            <S.DividerText>또는</S.DividerText>
          </S.Divider>

          <S.FormRow>
            <OauthLoginButton buttonStyle="Google">Google 계정으로 로그인</OauthLoginButton>
          </S.FormRow>
        </form>
      </S.FormWrapper>
    </S.Container>
  )
}

