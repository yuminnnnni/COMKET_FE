import { useNavigate } from "react-router-dom"
import { LocalNavBar } from "@/components/common/navBar/LocalNavBar"
import { GlobalNavBar } from "@/components/common/navBar/GlobalNavBar"
import * as S from "./AccountInfoPage.Style"
import { GoogleIcon } from "@assets/icons"
import { logOut } from "@/api/Oauth"
import { toast } from "react-toastify"
import { useUserStore } from "@/stores/userStore"

export const AccountInfoPage = () => {
  const email = useUserStore((state) => state.email)
  const loginMethod = useUserStore((state) => state.loginPlatformInfo)
  const { clearUser } = useUserStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logOut()
      clearUser()
      toast.success("로그아웃 되었습니다.")
      navigate("/login")
    } catch (error) {
      toast.error("로그아웃에 실패했습니다.")
    }
  }

  const handleWithdraw = () => {
    if (window.confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.")) {
      toast.success("탈퇴 처리되었습니다.")
      //회원 탈퇴 API 호출
    }
  }

  return (
    <S.PageContainer>
      <S.GNBContainer>
        <GlobalNavBar variant="workspace" />
      </S.GNBContainer>

      <S.MainContainer>
        <S.LNBContainer>
          <LocalNavBar variant="settings" />
        </S.LNBContainer>

        <S.Content>
          <S.Title>계정 정보</S.Title>

          <S.Section>
            <S.SectionTitle>이메일</S.SectionTitle>
            <S.SectionContent>
              <S.EmailText>{email}</S.EmailText>
            </S.SectionContent>
          </S.Section>

          <S.Divider />

          <S.Section>
            <S.SectionTitle>로그인 정보</S.SectionTitle>
            <S.SectionContent>
              <S.LoginMethodContainer>
                <S.LoginMethodInfo>
                  {loginMethod === "GOOGLE" && (
                    <>
                      <GoogleIcon width={16} height={16} />
                      <S.LoginMethodText>Google 계정으로 로그인</S.LoginMethodText>
                    </>
                  )}
                </S.LoginMethodInfo>
                <S.LogoutButton onClick={handleLogout}>로그아웃</S.LogoutButton>
              </S.LoginMethodContainer>
            </S.SectionContent>
          </S.Section>

          <S.Divider />

          <S.Section>
            <S.SectionTitle>서비스 탈퇴</S.SectionTitle>
            <S.SectionContent>
              <S.WithdrawContainer>
                <S.WithdrawText>탈퇴 시 계정 및 이용 기록은 모두 삭제되며, 복구가 불가능합니다.</S.WithdrawText>
                <S.WithdrawButton onClick={handleWithdraw}>탈퇴하기</S.WithdrawButton>
              </S.WithdrawContainer>
            </S.SectionContent>
          </S.Section>
        </S.Content>
      </S.MainContainer>
    </S.PageContainer>
  )
}
