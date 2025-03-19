<template>
  <div class="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-gray-600">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }" class="w-96">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl text-center font-bold mb-4">로그아웃</h1>
        </div>
      </template>
      <Placeholder class="h-32">
        <UProgress v-if="isLoggingOut" v-model="isLoggingOut" color="blue" animation="carousel"
          :max="['로그아웃 처리 중...']" />
        <div v-else-if="isLoggedIn">
          <p class="text-center">정말 로그아웃 하시겠습니까?</p>
          <div class="text-center py-4">
            <UButton size="lg" class="px-4 mx-4" color="primary" @click="handleLogout">로그아웃</UButton>
            <UButton size="lg" class="px-4 mx-4" color="gray" @click="cancelLogout">취소</UButton>
          </div>
        </div>
        <div v-else-if="logoutSuccess" class="text-center">
          <UAvatar icon="i-heroicons-check-16-solid" size="2xl" color="primary"
            :ui="{ background: 'bg-primary dark:bg-primary-500', icon: { base: 'text-white dark:text-white' } }" />
          <p class="text-center py-4">성공적으로 로그아웃되었습니다.</p>
          <UButton size="lg" color="primary" @click="goToHome">홈으로 이동</UButton>
        </div>
        <div v-else class="text-center">
          <p class="text-center py-4">현재 로그인되어 있지 않습니다.</p>
          <UButton size="lg" color="primary" @click="goToLogin">로그인 페이지로 이동</UButton>
        </div>
      </Placeholder>
      <template #footer>
        <div class="text-sm text-gray-500 text-center">
          © Wisenut. All rights reserved.
        </div>
      </template>
    </UCard>
  </div>
</template>
<script setup>
definePageMeta({
  layout: false,
});
const router = useRouter()
const { status, data, signOut } = useAuth()
const isLoggingOut = ref(false)
const logoutSuccess = ref(false)
const isLoggedIn = computed(() => status.value === 'authenticated')



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
    await signOut({ callbackUrl: window.location.origin + '/login' })

    isLoggingOut.value = false
    logoutSuccess.value = true
  } catch (err) {
    console.error('로그아웃 오류:', err)
    isLoggingOut.value = false

  }
}

const cancelLogout = () => {
  router.back() // 이전 페이지로 이동

}

const goToHome = () => {
  router.push('./')
}

const goToLogin = () => {
  router.push('./login')
}

// URL 파라미터에서 success 확인
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('success') === 'true') {
    logoutSuccess.value = true
  }
}
</script>