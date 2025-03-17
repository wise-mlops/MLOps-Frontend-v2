<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>로그인</h1>
        <p>시스템에 접속하려면 Keycloak 계정으로 로그인하세요.</p>
      </div>

      <div class="login-body">
        <div v-if="loading" class="loading-spinner">
          <div class="spinner"></div>
          <p>로그인 처리 중...</p>
        </div>

        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button @click="resetError" class="btn btn-secondary">다시 시도</button>
        </div>

        <div v-else class="login-options">
          <button @click="loginWithKeycloak" class="btn btn-primary">
            <span class="icon">🔐</span>
            Keycloak으로 로그인
          </button>

          <div class="alternative-login">
            <p>또는</p>
            <button @click="navigateToRegister" class="btn btn-text">
              계정이 없으신가요? 회원가입
            </button>
          </div>
        </div>
      </div>

      <div class="login-footer">
        <p>© {{ currentYear }} 회사명. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
function enableCustomLayout() {
  setPageLayout('login')
}

definePageMeta({
  layout: false,
});
import { ref, computed } from 'vue'
const { signIn } = useAuth()
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref(null)

const currentYear = computed(() => new Date().getFullYear())

const loginWithKeycloak = async () => {
  try {
    loading.value = true
    error.value = null

    // Keycloak 로그인 시작
    await signIn('keycloak', { callbackUrl: '/' })

    // 참고: 위 코드는 리디렉션을 발생시키므로 아래 코드는 실행되지 않습니다.
    // 이 코드는 리디렉션이 발생하지 않았을 경우를 위한 폴백입니다.
    loading.value = false
  } catch (err) {
    console.error('로그인 오류:', err)
    loading.value = false
    error.value = '로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'
  }
}

const resetError = () => {
  error.value = null
}

const navigateToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-header {
  padding: 30px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eaeaea;
  text-align: center;
}

.login-header h1 {
  margin: 0 0 10px;
  font-size: 24px;
  color: #333;
}

.login-header p {
  margin: 0;
  color: #666;
}

.login-body {
  padding: 40px 30px;
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
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

.btn-text {
  background: none;
  color: #4285f4;
  padding: 8px;
}

.btn-text:hover {
  text-decoration: underline;
  background: none;
}

.icon {
  margin-right: 10px;
  font-size: 18px;
}

.alternative-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.alternative-login p {
  margin: 15px 0;
  color: #666;
  position: relative;
  width: 100%;
  text-align: center;
}

.alternative-login p::before,
.alternative-login p::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: #e0e0e0;
}

.alternative-login p::before {
  left: 0;
}

.alternative-login p::after {
  right: 0;
}

.login-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #eaeaea;
}

.login-footer p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  text-align: center;
  color: #d93025;
  padding: 15px;
  border: 1px solid #fadde1;
  background-color: #fef2f2;
  border-radius: 4px;
  margin-bottom: 20px;
}
</style>