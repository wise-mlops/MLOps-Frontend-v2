// server/api/auth/[...].ts
import { NuxtAuthHandler } from '#auth'
import { useRuntimeConfig } from '#imports'

// next-auth/providers/keycloak 대신 아래와 같이 직접 Keycloak 제공자 정의
export default NuxtAuthHandler({
  // NextAuth.js 옵션
  secret: process.env.AUTH_SECRET || 'your-secret-key',
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  // 세션 관리 설정
  session: {
    strategy: 'jwt',
  },
  // Keycloak 제공자를 직접 정의
  providers: [
    {
      id: 'keycloak',
      name: 'Keycloak',
      type: 'oauth',
      wellKnown: `${useRuntimeConfig().auth.keycloakUrl}/realms/${useRuntimeConfig().auth.keycloakRealm}/.well-known/openid-configuration`,
      clientId: useRuntimeConfig().auth.keycloakClientId,
      clientSecret: useRuntimeConfig().auth.keycloakClientSecret,
      authorization: { params: { scope: 'openid email profile' } },
      idToken: true,
      checks: ['pkce', 'state'],
      profile(profile: any) {
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
      if (account && user) {
        
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.idToken = account.id_token
        token.expiresAt = account.expires_at
        token.userInfo = user
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken
        session.user = token.userInfo
      }
      return session
    }
  },
})