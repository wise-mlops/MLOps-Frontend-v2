export default defineNuxtRouteMiddleware((to, from) => {
  // 1) 인증 제외 경로: 반드시 최상단에서 빠르게 패스
  const whitelist = ['/login', '/auth/error', '/logout']
  if (to.path.startsWith('/api/auth') || whitelist.includes(to.path)) return

  // 2) 일반 보호 로직
  const { status } = useAuth()
  if (status.value === 'unauthenticated') {
    return navigateTo('/login')
  }
})
