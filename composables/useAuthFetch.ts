import { useAuth } from '#auth'

export const useAuthFetch = () => {
  const { data } = useAuth()
  
  const authFetch = async (url, options = {}) => {
    if (!data.value?.accessToken) {
      throw new Error('인증 토큰이 없습니다.')
    }
    
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${data.value.accessToken}`
    }
    
    return await useFetch(url, {
      ...options,
      headers
    })
  }
  
  return { authFetch }
}