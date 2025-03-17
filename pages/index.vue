<template>
  <div class="profile-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>사용자 정보를 불러오는 중...</p>
    </div>

    <div v-else-if="!isAuthenticated" class="not-authenticated">
      <div class="message-card">
        <div class="warning-icon">
          <span>!</span>
        </div>
        <h2>로그인이 필요합니다</h2>
        <p>이 페이지를 보려면 로그인이 필요합니다.</p>
        <button @click="navigateToLogin" class="btn btn-primary">로그인하기</button>
      </div>
    </div>

    <div v-else class="profile-content">
      <div class="profile-header">
        <div class="profile-avatar">
          {{ getUserInitials() }}
        </div>
        <div class="profile-title">
          <h1>{{ userData?.name || userData?.preferred_username || '사용자' }}</h1>
          <p class="email">{{ userData?.email || '이메일 정보 없음' }}</p>
        </div>
        <button @click="navigateToLogout" class="btn btn-secondary logout-btn">
          로그아웃
        </button>
      </div>

      <div class="profile-sections">
        <div class="profile-section">
          <h2>기본 정보</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">사용자 ID</span>
              <span class="info-value">{{ userData?.sub || '정보 없음' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">사용자명</span>
              <span class="info-value">{{ userData?.preferred_username || '정보 없음' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이름</span>
              <span class="info-value">{{ userData?.name || '정보 없음' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이메일</span>
              <span class="info-value">{{ userData?.email || '정보 없음' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">이메일 인증</span>
              <span class="info-value">
                <span :class="userData?.email_verified ? 'verified' : 'not-verified'">
                  {{ userData?.email_verified ? '인증됨' : '인증되지 않음' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="profile-section" v-if="userRoles && userRoles.length > 0">
          <h2>사용자 역할</h2>
          <div class="roles-container">
            <span v-for="(role, index) in userRoles" :key="index" class="role-badge">
              {{ role }}
            </span>
          </div>
        </div>

        <div class="profile-section">
          <h2>액세스 토큰 정보</h2>
          <div class="token-info">
            <div class="token-header">
              <span>액세스 토큰</span>
              <button @click="toggleTokenVisibility" class="btn btn-text">
                {{ showToken ? '숨기기' : '보기' }}
              </button>
            </div>
            <div v-if="showToken" class="token-content">
              <pre>{{ tokenInfo }}</pre>
            </div>
            <div v-else class="token-placeholder">
              <p>보안을 위해 토큰이 숨겨져 있습니다. "보기" 버튼을 클릭하여 확인할 수 있습니다.</p>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h2>로그인 세션</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">인증 시간</span>
              <span class="info-value">{{ formatDate(userData?.auth_time) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">세션 만료</span>
              <span class="info-value">{{ formatDate(userData?.exp) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
const { signIn } = useAuth()
import { useRouter } from 'vue-router'

const router = useRouter()
const { status, data } = useAuth()
const loading = ref(true)
const showToken = ref(false)

// 인증 상태 및 사용자 데이터
const isAuthenticated = computed(() => status.value === 'authenticated')
const userData = computed(() => {
  if (!data.value?.user?.rawProfile) {
    console.log(data.value.user)
    return data.value?.user.rawProfile
  }
  return data.value.user.rawProfile
})

// 사용자 역할 추출
const userRoles = computed(() => {
  const rawProfile = data.value?.user?.rawProfile
  // realm_access 필드에서 roles 배열 추출 또는 기타 역할 정보 추출
  return rawProfile?.realm_access?.roles || []
})

// 토큰 정보
const tokenInfo = computed(() => {
  const token = data.value?.accessToken
  if (!token) return '토큰 정보가 없습니다.'

  // 토큰 정보 포맷팅 (보안을 위해 전체 토큰이 아닌 일부만 표시)
  const tokenParts = token.split('.')
  if (tokenParts.length >= 2) {
    try {
      const payload = JSON.parse(atob(tokenParts[1]))
      return JSON.stringify(payload, null, 2)
    } catch (e) {
      return '토큰 디코딩 중 오류가 발생했습니다.'
    }
  }
  return '토큰 형식이 올바르지 않습니다.'
})

onMounted(() => {
  // 페이지 로딩 시 데이터 처리
  setTimeout(() => {
    loading.value = false
  }, 500)
})

// 사용자 이니셜 생성
const getUserInitials = () => {
  const name = userData.value?.name || userData.value?.preferred_username || ''
  if (!name) return '?'
  return name.split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// 날짜 포맷팅
const formatDate = (timestamp) => {
  if (!timestamp) return '정보 없음'
  try {
    // 타임스탬프가 초 단위인 경우 밀리초로 변환
    const dateObj = new Date(typeof timestamp === 'number' && timestamp < 9999999999
      ? timestamp * 1000
      : timestamp)

    return dateObj.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return '유효하지 않은 날짜'
  }
}

// 토큰 표시 여부 전환
const toggleTokenVisibility = () => {
  showToken.value = !showToken.value
}

// 페이지 이동
const navigateToLogin = () => {
  router.push('/login')
}

const navigateToLogout = () => {
  router.push('/logout')
}
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4285f4;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.not-authenticated {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.message-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 40px;
  text-align: center;
  max-width: 400px;
}

.warning-icon {
  width: 60px;
  height: 60px;
  background-color: #f44336;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 32px;
  font-weight: bold;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  background-color: #4285f4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  margin-right: 20px;
  flex-shrink: 0;
}

.profile-title {
  flex-grow: 1;
}

.profile-title h1 {
  margin: 0 0 5px;
  font-size: 24px;
  color: #333;
}

.email {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.logout-btn {
  position: absolute;
  top: 20px;
  right: 20px;
}

.profile-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.profile-section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

.profile-section h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.info-value {
  font-size: 16px;
  color: #333;
  word-break: break-word;
}

.verified {
  color: #0f9d58;
  font-weight: 500;
}

.not-verified {
  color: #d93025;
  font-weight: 500;
}

.roles-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.role-badge {
  background-color: #f1f3f4;
  border-radius: 16px;
  padding: 5px 12px;
  font-size: 14px;
  color: #333;
}

.token-info {
  border: 1px solid #eee;
  border-radius: 4px;
}

.token-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.token-content {
  padding: 15px;
  overflow-x: auto;
  background-color: #f8f9fa;
}

.token-content pre {
  margin: 0;
  font-family: monospace;
  font-size: 14px;
  white-space: pre-wrap;
}

.token-placeholder {
  padding: 20px;
  text-align: center;
  color: #666;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
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

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }

  .profile-avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .logout-btn {
    position: static;
    margin-top: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>