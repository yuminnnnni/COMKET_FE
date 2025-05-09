import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { googleLogin } from "@/api/Oauth"
import * as S from "./GoogleRedirect.Style"

export const GoogleRedirect = () => {
  const navigate = useNavigate()
  const code = new URL(window.location.href).searchParams.get("code")
  console.log("구글 리디렉션 코드:", code)

  useEffect(() => {
    if (!code) return

    const fetchData = async () => {
      try {
        const result = await googleLogin(code)
        console.log("구글 로그인 결과:", result)

        if (result.accessToken && result.name) {
          // 이미 가입된 유저
          localStorage.setItem("accessToken", result.accessToken)
          localStorage.setItem("nickName", result.name)
          localStorage.setItem("email", result.email)
          alert("로그인 성공!")
          navigate("/workspace")
        } else if (result.email) {
          // 신규 유저
          alert("회원가입이 필요한 사용자입니다.")
          navigate("/signup", { state: { email: result.email } })
        }

      } catch (err: any) {
        if (err.response) {
          const errorCode = err.response.data?.code
          const errorMessage = err.response.data?.message

          switch (errorCode) {
            case "OAUTH2_COMMUNICATION_ERROR":
              alert("구글 서버와 통신 중 오류가 발생했습니다")
              navigate("/login")
              break
            case "OAUTH2_TOKEN_ERROR":
              alert("구글 토큰 발급에 실패했습니다.")
              navigate("/login")
              break
            case "OAUTH2_TOKEN_REQUEST_FAILED":
              alert("구글 토큰 요청에 실패했습니다.")
              navigate("/login")
              break
            case "OAUTH2_USERINFO_REQUEST_FAILED":
              alert("구글 유저 정보 요청에 실패했습니다.")
              navigate("/login")
              break
            case "OAUTH2_SIGNUP_REQUIRED":
              alert("회원가입이 필요한 사용자입니다.")
              navigate("/signup")
              break
            default:
              alert(`알 수 없는 오류가 발생했습니다: ${errorMessage}`)
              navigate("/login")
              break
          }
        } else {
          alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.")
          navigate("/login")
        }
      }
    }

    fetchData()
  }, [code, navigate])

  return (
    <S.LoaderContainer>
      <S.Spinner />
      <S.Text>구글 계정으로 로그인 중입니다...</S.Text>
    </S.LoaderContainer>
  )
}
