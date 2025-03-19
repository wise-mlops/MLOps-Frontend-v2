<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UContainer v-if="loading" class="">
      <UProgress v-model="loading" color="blue" animation="carousel" :max="['사용자 정보를 불러오는 중...']" />
    </UContainer>
    <div v-else-if="!isAuthenticated" class="flex items-center justify-center">
      <UCard class="w-96">
        <UAlert title="Error!" description="로그인이 필요합니다." color="red" variant="soft" icon="i-heroicons-command-line"
          :actions="[{ variant: 'solid', size: 'md', color: 'gray', 'label': '로그인 하기', 'click': navigateToLogin }]">
        </UAlert>
      </UCard>
    </div>
    <div v-else>
      <UAlert :title="userData?.name || userData?.preferred_username || '사용자'"
        :description="userData?.email || '이메일 정보 없음'"
        :actions="[{ variant: 'solid', size: 'md', color: 'gray', 'label': '로그아웃', 'click': navigateToLogout }]">
        <template #avatar="{ avatar }">
          <UAvatar :alt="getUserInitials()" size="2xl" />
        </template>
      </UAlert>
      <UCard class="min-h-10 my-4">
        <template #header>
          <div class="font-bold">기본정보</div>
        </template>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <UFormGroup size="xl" label="사용자ID">
              <div class="text-gray-500 dark:text-gray-300">
                {{ userData?.sub || '정보 없음' }}
              </div>
            </UFormGroup>
          </div>
          <div>
            <UFormGroup size="xl" label="사용자명">
              <div class="text-gray-500 dark:text-gray-300">
                {{ userData?.preferred_username || '정보 없음' }}
              </div>
            </UFormGroup>
          </div>
          <div>
            <UFormGroup size="xl" label="이름">
              <div class="text-gray-500 dark:text-gray-300">
                {{ userData?.name || '정보 없음' }}
              </div>
            </UFormGroup>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 pt-8">
          <div>
            <UFormGroup size="xl" label="이메일">
              <div class="text-gray-500 dark:text-gray-300">
                {{ userData?.email || '정보 없음' }} </div>
            </UFormGroup>
          </div>
          <div>
            <UFormGroup size="xl" label="이메일 인증">
              <div class="text-gray-500 dark:text-gray-300">
                <span :class="userData?.email_verified ? 'text-green-500 font-semibold' : 'text-red-500'">
                  {{ userData?.email_verified ? '인증됨' : '인증되지 않음' }}
                </span>
              </div>
            </UFormGroup>
          </div>
        </div>
      </UCard>
      <UCard class="min-h-10 my-4">
        <template #header>
          <div class="font-bold">액세스 토큰 정보</div>
        </template>
        <div>
          <UAccordion :items="[{ label: '엑세스 토큰', defaultOpen: false, content: tokenInfo }]">
            <template #default="{ item, index, open }">
              <UButton color="gray" variant="ghost"
                class="border-b py-4 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700"
                :ui="{ rounded: 'rounded-none', padding: { sm: 'p-3' } }">
                <span class="truncate font-bold">{{ item.label }}</span>
                <template #trailing>
                  <div class="w-15 h-5 ms-auto duration-200 text-blue-500 dark:text-blue-200">보기</div>
                </template>

              </UButton>
            </template>
            <template #item="{ item }">
              <UTextarea :model-value="item.content" :rows="15" readonly />
            </template>
          </UAccordion>

        </div>
      </UCard>
      <UCard class="min-h-10 my-4">
        <template #header>
          <div class="font-bold">로그인 세션</div>
        </template>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <UFormGroup size="xl" label="인증시간">
              <div class="text-gray-500 dark:text-gray-300">
                {{ formatDate(userData?.auth_time) }}
              </div>
            </UFormGroup>
          </div>
          <div>
            <UFormGroup size="xl" label="세션만료">
              <div class="text-gray-500 dark:text-gray-300">
                {{ formatDate(userData?.exp) }}
              </div>
            </UFormGroup>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const router = useRouter()
const { status, data } = useAuth()
const loading = ref(true)

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Profiles',
  },
])
const pageTitle = ref('Profiles')

// 인증 상태 및 사용자 데이터
const isAuthenticated = computed(() => status.value === 'authenticated')

const userData = computed(() => {

  if (!data.value?.user?.rawProfile) {
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
  loading.value = false
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


// 페이지 이동
const navigateToLogin = () => {
  router.push('/login')
}

const navigateToLogout = () => {
  router.push('/logout')
}

// toolbar links  
const toolbarLinks = ref([
  [],
  []
])

</script>
