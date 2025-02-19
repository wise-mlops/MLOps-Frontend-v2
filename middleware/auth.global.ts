export default defineNuxtRouteMiddleware((to, from) => {
  
  const { status } = useAuth()
  console.log('status', status.value)

  // 로그인 구현 완료될 때까지 임시로 주석처리
  if (status.value === 'unauthenticated' && to.path !== '/login') {
    return navigateTo('/login')
  }
})