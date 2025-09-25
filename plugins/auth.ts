import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:created', () => {
    // useAuth는 컴포지션 API 내에서만 사용할 수 있으므로 여기서는 사용하지 않습니다.
    console.log('App created')
  })

  return {    
    provide: {
      authUtils: {
        // 커스텀 도우미 메서드 작성 (필요 시)
      }
    }
  }
})