export default defineNuxtRouteMiddleware((to, from) => {
  // 인증 기능 임시 비활성화 - 나중에 이 return을 제거하면 다시 활성화됨
  return

  const { status } = useAuth()
  console.log('status', status.value)

  // 로그인 구현 완료될 때까지 임시로 주석처리
  if (status.value === 'unauthenticated' && to.path !== '/login') {
        return navigateTo('/login')
  }
})