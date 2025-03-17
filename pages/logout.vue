<template>
  <div class="logout-container">
    <div class="logout-card">
      <div class="logout-header">
        <h1>로그아웃</h1>
      </div>

      <div class="logout-body">
        <div v-if="isLoggingOut" class="logging-out">
          <div class="spinner"></div>
          <p>로그아웃 처리 중...</p>
        </div>

        <div v-else-if="isLoggedIn" class="logout-confirmation">
          <p>정말 로그아웃 하시겠습니까?</p>
          <div class="button-group">
            <button @click="handleLogout" class="btn btn-primary">로그아웃</button>
            <button @click="cancelLogout" class="btn btn-secondary">취소</button>
          </div>
        </div>

        <div v-else-if="logoutSuccess" class="logout-success">
          <div class="success-icon">✓</div>
          <p>성공적으로 로그아웃되었습니다.</p>
          <button @click="goToHome" class="btn btn-primary">홈으로 이동</button>
        </div>

        <div v-else class="not-logged-in">
          <p>현재 로그인되어 있지 않습니다.</p>
          <button @click="goToLogin" class="btn btn-primary">로그인 페이지로 이동</button>
        </div>
      </div>

      <div class="logout-footer">
        <p>© {{ currentYear }} 회사명. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const { signIn } = useAuth()
import { useRouter } from 'vue-router'

const router = useRouter()
const { status, data, signOut } = useAuth()
const isLoggingOut = ref(false)
const logoutSuccess = ref(false)
const isLoggedIn = computed(() => status.value === 'authenticated')
const currentYear = computed(() => new Date().getFullYear())

onMounted(() => {
  // URL 파라미터에서 자동 로그아웃 플래그 확인
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('auto') === 'true' && isLoggedIn.value) {
    handleLogout()
  }
})

const handleLogout = async () => {
  try {
    isLoggingOut.value = true

    // Keycloak을 통한 로그아웃 처리
    await signOut({ callbackUrl: window.location.origin + '/login' })

    // 참고: 위 코드는 리디렉션을 발생시키므로 아래 코드는 일반적으로 실행되지 않습니다.
    // 이 코드는 리디렉션이 발생하지 않았을 경우를 위한 폴백입니다.
    isLoggingOut.value = false
    logoutSuccess.value = true
  } catch (err) {
    console.error('로그아웃 오류:', err)
    isLoggingOut.value = false
    // 에러 처리 로직 추가 (필요시)
  }
}

const cancelLogout = () => {
  router.back() // 이전 페이지로 이동
}

const goToHome = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}

// URL 파라미터에서 success 확인
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('success') === 'true') {
    logoutSuccess.value = true
  }
}
</script>

<style scoped>
.logout-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.logout-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.logout-header {
  padding: 25px 30px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  text-align: center;
}

.logout-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.logout-body {
  padding: 40px 30px;
  text-align: center;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 4px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.btn:active {
  transform: translateY(1px);
}

.btn-primary {
  background-color: #4285f4;
  color: white;
}

.btn-primary:hover {
  background-color: #3367d6;
}

.btn-secondary {
  background-color: #f1f3f4;
  color: #333;
}

.btn-secondary:hover {
  background-color: #e8eaed;
}

.logout-confirmation p,
.logout-success p,
.not-logged-in p,
.logging-out p {
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.logout-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #eaeaea;
}

.logout-footer p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #0f9d58;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin: 0 auto 20px;
}

.logging-out {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>