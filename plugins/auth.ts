import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:created', () => {
    // useAuth는 컴포지션 API 내에서만 사용할 수 있으므로 여기서는 사용하지 않습니다.
    console.log('App created')
  })

  return {    
    provide: {
      auth: {
        // 필요한 경우 여기에 커스텀 메서드를 추가할 수 있습니다.
        
      }
    }
  }
})