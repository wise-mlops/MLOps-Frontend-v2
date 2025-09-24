// server/api/auth/[...].ts
import { NuxtAuthHandler } from '#auth'
import { useRuntimeConfig } from '#imports'

// 디버그용 환경변수 및 URL 출력
console.log('🔍 === NextAuth Handler 초기화 ===')
console.log('📌 APP_BASE_URL:', process.env.APP_BASE_URL)
console.log('📌 AUTH_ORIGIN:', process.env.AUTH_ORIGIN)
console.log('📌 KEYCLOAK_URL:', process.env.KEYCLOAK_URL)
console.log('📌 KEYCLOAK_REALM:', process.env.KEYCLOAK_REALM)
console.log('📌 KEYCLOAK_CLIENT_ID:', process.env.KEYCLOAK_CLIENT_ID)
console.log('🎯 Generated signIn URL:', `${process.env.APP_BASE_URL || '/'}login`)
console.log('🎯 Generated signOut URL:', `${process.env.APP_BASE_URL || '/'}logout`)
console.log('🎯 Generated error URL:', `${process.env.APP_BASE_URL || '/'}auth/error`)
console.log('========================================')

// next-auth/providers/keycloak 대신 아래와 같이 직접 Keycloak 제공자 정의
export default NuxtAuthHandler({
  // NextAuth.js 옵션
  debug: true,  // 디버그 모드 활성화
  secret: process.env.AUTH_SECRET || 'your-secret-key',
  
  // 명시적 URL 설정 (Nuxt Auth 오버라이드 방지)
  url: process.env.AUTH_ORIGIN || 'https://labs.wisenut.kr/clusters/local/namespaces/wise-mlops/services/web-v2',
  pages: {
    signIn: `${process.env.APP_BASE_URL || '/'}login`,
    signOut: `${process.env.APP_BASE_URL || '/'}logout`,
    error: `${process.env.APP_BASE_URL || '/'}auth/error`,
  },
  // 세션 관리 설정
  session: {
    strategy: 'jwt',
  },
  // Keycloak 제공자를 직접 정의
  // debug: true,
  providers: [
    {
      id: 'keycloak',
      name: 'Keycloak',
      type: 'oauth',
      wellKnown: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,      
      clientId: process.env.KEYCLOAK_CLIENT_ID || '',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
      
      authorization: { params: { scope: 'openid email profile' } },
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile: any) {
        console.log('🔐 === Keycloak Profile Callback ===')
        console.log('🔐 Profile ID:', profile.sub)
        console.log('🔐 Profile Email:', profile.email)
        console.log('======================================')
        
        return {
          id: profile.sub,
          name: profile.name || profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          // 필요한 경우 추가 프로필 정보
          roles: profile.realm_access?.roles || [],
          // 원본 프로필 정보도 저장
          rawProfile: profile
        }
      }
    }
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      console.log('🔑 === JWT Callback ===')
      console.log('🔑 Account:', account ? 'Present' : 'None')
      console.log('🔑 User:', user ? user.email || user.name : 'None')
      
      if (account && user) {
        console.log('🔑 Setting token data for user:', user.email || user.name)
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.expiresAt = account.expires_at
        token.userInfo = user
      }
      
      return token
    },
    async session({ session, token }) {
      console.log('📋 === Session Callback ===')
      console.log('📋 Token present:', !!token)
      console.log('📋 Session user:', session.user?.email || 'None')
      
      if (token) {
        session.accessToken = token.accessToken
        session.user = token.userInfo
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log('🚀 === Redirect Callback ===')
      console.log('🚀 Original URL:', url)
      console.log('🚀 Base URL:', baseUrl)
      
      // 도메인만 있는 경우 (경로 손실된 경우) → login 페이지로 리다이렉트
      if (url === 'https://labs.wisenut.kr' || url === baseUrl) {
        const correctedUrl = `${process.env.APP_BASE_URL || '/'}login`
        console.log('🔧 Domain-only URL detected, redirecting to login:', correctedUrl)
        console.log('🚀 Final redirect to:', correctedUrl)
        console.log('=========================')
        return correctedUrl
      }
      
      // /login으로 리다이렉트 시 APP_BASE_URL 추가
      if (url === '/login' || url.endsWith('/login')) {
        const correctedUrl = `${process.env.APP_BASE_URL || '/'}login`
        console.log('🔧 Correcting login URL to:', correctedUrl)
        console.log('🚀 Final redirect to:', correctedUrl)
        console.log('=========================')
        return correctedUrl
      }
      
      // 다른 상대경로도 체크
      if (url.startsWith('/') && !url.startsWith(process.env.APP_BASE_URL || '/')) {
        const correctedUrl = `${process.env.APP_BASE_URL || '/'}${url.substring(1)}`
        console.log('🔧 Correcting relative URL to:', correctedUrl)
        console.log('🚀 Final redirect to:', correctedUrl)
        console.log('=========================')
        return correctedUrl
      }
      
      console.log('🚀 Final redirect to:', url)
      console.log('=========================')
      return url
    }
  },
})