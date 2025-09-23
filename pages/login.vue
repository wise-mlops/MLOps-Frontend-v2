<template>
  <div class="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-gray-600">
    <UCard class="w-96">
      <template #header>
        <div>
          <h1 class="text-2xl text-center font-bold mb-4">WISE-MLOps</h1>
          <p class="text-sm text-gray-500 text-center">시스템에 접속하려면 Keycloak 계정으로 로그인하세요.</p>
        </div>
      </template>
      <Placeholder class="h-32">
        <UProgress v-if="loading" v-model="loading" color="blue" animation="carousel" :max="['로그인 처리 중...']" />
        <UAlert v-else-if="error" title="Error!" :description="error" color="red" variant="soft"
          icon="i-heroicons-command-line"
          :actions="[{ variant: 'solid', size: 'md', color: 'gray', 'label': '다시 시도', 'click': resetError }]">
        </UAlert>
        <div v-else>
          <UButton @click="loginWithKeycloak" size="md" variant="solid" color="primary" block
            class="px-8 py-3 text-base transform hover:scale-105 transition duration-300">
            <span>🔐</span>
            Keycloak으로 로그인
          </UButton>
          <UDivider class="py-6" label="또는" />
          <UButton size="sm" variant="link" color="blue" block class="text-base text-center">
            관리자에게 문의
          </UButton>
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
function enableCustomLayout() {
  setPageLayout('login')
}

definePageMeta({
  layout: false,
});


const { signIn } = useAuth()
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref(null)

const loginWithKeycloak = async () => {
  try {
    loading.value = true
    error.value = null
    // Keycloak 로그인 시작
    const config = useRuntimeConfig()
    await signIn('keycloak', { callbackUrl: config.public.baseURL })
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
</script>
