export default defineNuxtRouteMiddleware((to, from) => {
  
  const { status } = useAuth()
  console.log('status', status.value)

  // 로그인 구현 완료될 때까지 임시로 주석처리
  if (status.value === 'unauthenticated' && to.path !== '/login') {
    // APP_BASE_URL을 포함한 올바른 login 경로로 리다이렉트
    const loginPath = `${process.env.APP_BASE_URL || '/'}login`
    console.log('🔧 Global middleware redirecting to:', loginPath)
    return navigateTo(loginPath)
  }
})