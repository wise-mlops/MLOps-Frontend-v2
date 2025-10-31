<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p class="text-sm text-gray-500 mt-2">작업 정보를 불러오는 중...</p>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-400">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">작업 정보를 불러올 수 없습니다</h3>
        <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="jobDetails" class="space-y-6">
      <!-- 작업 개요 -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">{{ jobDetails.details?.JobName || 'Unknown Job' }}</h3>
              <p class="text-sm text-gray-600 mt-1">작업 ID: {{ jobDetails.job_id }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span 
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                :class="getJobStatusClass(jobDetails.details?.JobState)"
              >
                <div 
                  class="w-2 h-2 rounded-full mr-2"
                  :class="getJobStatusDotClass(jobDetails.details?.JobState)"
                ></div>
                {{ getJobStatusText(jobDetails.details?.JobState) }}
              </span>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- GPU 사용량 -->
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-blue-800">GPU 사용량</p>
                <p class="text-2xl font-bold text-blue-900">{{ getGpuCount() }}</p>
                <p class="text-xs text-blue-600 mt-1">{{ getGpuType() }}</p>
              </div>
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- CPU 사용량 -->
          <div class="p-4 bg-green-50 rounded-lg border border-green-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-green-800">CPU</p>
                <p class="text-2xl font-bold text-green-900">{{ jobDetails.details?.NumCPUs || 'N/A' }}</p>
                <p class="text-xs text-green-600 mt-1">코어</p>
              </div>
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 메모리 -->
          <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-purple-800">메모리</p>
                <p class="text-2xl font-bold text-purple-900">{{ getMemoryUsage() }}</p>
                <p class="text-xs text-purple-600 mt-1">할당됨</p>
              </div>
              <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- 실행 시간 -->
          <div class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-yellow-800">실행 시간</p>
                <p class="text-2xl font-bold text-yellow-900">{{ jobDetails.details?.RunTime || 'N/A' }}</p>
                <p class="text-xs text-yellow-600 mt-1">{{ getTimeRemaining() }}</p>
              </div>
              <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 작업 세부 정보 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 기본 정보 -->
        <UCard>
          <template #header>
            <h4 class="text-lg font-medium text-gray-900">기본 정보</h4>
          </template>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">작업 ID</span>
              <span class="text-sm text-gray-900 font-mono">{{ jobDetails.job_id }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">작업 이름</span>
              <span class="text-sm text-gray-900">{{ jobDetails.details?.JobName || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">파티션</span>
              <span class="text-sm text-gray-900">{{ jobDetails.details?.Partition || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">노드</span>
              <span class="text-sm text-gray-900 font-mono">{{ jobDetails.details?.NodeList || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">사용자</span>
              <span class="text-sm text-gray-900">{{ getUserInfo() }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">QOS</span>
              <span class="text-sm text-gray-900">{{ jobDetails.details?.QOS || 'N/A' }}</span>
            </div>
          </div>
        </UCard>

        <!-- 시간 정보 -->
        <UCard>
          <template #header>
            <h4 class="text-lg font-medium text-gray-900">시간 정보</h4>
          </template>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">제출 시간</span>
              <span class="text-sm text-gray-900">{{ formatDateTime(jobDetails.details?.SubmitTime) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">시작 시간</span>
              <span class="text-sm text-gray-900">{{ formatDateTime(jobDetails.details?.StartTime) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">종료 시간</span>
              <span class="text-sm text-gray-900">{{ formatDateTime(jobDetails.details?.EndTime) }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">시간 제한</span>
              <span class="text-sm text-gray-900">{{ jobDetails.details?.TimeLimit || 'N/A' }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100">
              <span class="text-sm font-medium text-gray-600">실행 시간</span>
              <span class="text-sm text-gray-900">{{ jobDetails.details?.RunTime || 'N/A' }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 리소스 할당 정보 -->
      <UCard>
        <template #header>
          <h4 class="text-lg font-medium text-gray-900">리소스 할당 정보</h4>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-3">
            <h5 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">요청된 리소스</h5>
            <div class="bg-gray-50 p-4 rounded-lg">
              <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ jobDetails.details?.ReqTRES || 'N/A' }}</pre>
            </div>
          </div>
          <div class="space-y-3">
            <h5 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">할당된 리소스</h5>
            <div class="bg-gray-50 p-4 rounded-lg">
              <pre class="text-xs text-gray-700 whitespace-pre-wrap">{{ jobDetails.details?.AllocTRES || 'N/A' }}</pre>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 작업 명령어 및 파일 정보 -->
      <UCard>
        <template #header>
          <h4 class="text-lg font-medium text-gray-900">실행 정보</h4>
        </template>
        <div class="space-y-4">
          <div>
            <h5 class="text-sm font-semibold text-gray-700 mb-2">실행 명령어</h5>
            <div class="bg-gray-50 p-4 rounded-lg">
              <pre class="text-sm text-gray-700 whitespace-pre-wrap">{{ jobDetails.details?.Command || 'N/A' }}</pre>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 class="text-sm font-semibold text-gray-700 mb-2">작업 디렉토리</h5>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-700 font-mono break-all">{{ jobDetails.details?.WorkDir || 'N/A' }}</p>
              </div>
            </div>
            <div>
              <h5 class="text-sm font-semibold text-gray-700 mb-2">표준 출력</h5>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-700 font-mono break-all">{{ jobDetails.details?.StdOut || 'N/A' }}</p>
              </div>
            </div>
            <div>
              <h5 class="text-sm font-semibold text-gray-700 mb-2">표준 오류</h5>
              <div class="bg-gray-50 p-3 rounded-lg">
                <p class="text-xs text-gray-700 font-mono break-all">{{ jobDetails.details?.StdErr || 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- 작업 출력 로그 -->
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h4 class="text-lg font-medium text-gray-900">작업 출력 로그</h4>
            <div class="flex items-center gap-2">
              <UButton
                @click="toggleAutoRefresh"
                :variant="autoRefreshOutput ? 'solid' : 'soft'"
                :color="autoRefreshOutput ? 'green' : 'gray'"
                size="sm"
                icon="i-heroicons-arrow-path"
              >
                {{ autoRefreshOutput ? '자동 새로고침 ON' : '자동 새로고침 OFF' }}
              </UButton>
              <UButton
                @click="fetchJobOutput"
                :loading="loadingOutput"
                variant="soft"
                size="sm"
                icon="i-heroicons-arrow-path"
              >
                새로고침
              </UButton>
            </div>
          </div>
        </template>
        
        <div class="space-y-4">
          <div v-if="loadingOutput" class="flex justify-center items-center py-8">
            <div class="text-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p class="text-sm text-gray-500 mt-2">로그를 불러오는 중...</p>
            </div>
          </div>
          
          <div v-else class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div class="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
              <span class="text-xs text-gray-400">작업 ID: {{ route.params.id }}</span>
              <span class="text-xs text-gray-400">{{ new Date().toLocaleTimeString('ko-KR') }}</span>
            </div>
            <pre class="whitespace-pre-wrap text-xs leading-relaxed">{{ jobOutput || '아직 출력이 없습니다.' }}</pre>
          </div>
          
          <!-- 로그 액션 버튼들 -->
          <div class="flex gap-2">
            <UButton
              variant="soft"
              color="gray"
              size="sm"
              icon="i-heroicons-document-duplicate"
              @click="copyOutput"
            >
              출력 복사
            </UButton>
            <UButton
              variant="soft"
              color="gray"
              size="sm"
              icon="i-heroicons-arrow-down-tray"
              @click="downloadOutput"
            >
              로그 다운로드
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
const { getJobStatus, getJobOutput } = useSlurmAPI()
const route = useRoute()

// 페이지 기본 설정
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'GPU Clustering', to: '/gpu-clustering' },
  { label: '작업 상세' }
])

const pageTitle = ref('작업 상세 정보')

// 상태 관리
const loading = ref(true)
const error = ref(null)
const jobDetails = ref(null)
const jobOutput = ref('')
const loadingOutput = ref(false)
const autoRefreshOutput = ref(false)

// 툴바 설정
const toolbarLinks = ref([
  [],
  [{
    label: '목록으로',
    icon: 'i-heroicons-arrow-left',
    to: '/gpu-clustering'
  }, {
    label: '새로고침',
    icon: 'i-heroicons-arrow-path',
    click: () => fetchJobDetails(),
    loading: computed(() => loading.value)
  }]
])

// 메서드
const fetchJobDetails = async () => {
  loading.value = true
  error.value = null
  
  try {
    const jobId = route.params.id
    const result = await getJobStatus(jobId)
    jobDetails.value = result
    pageTitle.value = `${result.details?.JobName || 'Job'} (${jobId})`
    
    // 작업 세부정보 가져온 후 출력도 가져오기
    await fetchJobOutput()
  } catch (err) {
    error.value = err.message || '작업 정보를 불러오는데 실패했습니다'
    console.error('Failed to fetch job details:', err)
  } finally {
    loading.value = false
  }
}

const fetchJobOutput = async () => {
  if (!route.params.id) return
  
  loadingOutput.value = true
  try {
    const jobId = route.params.id
    const result = await getJobOutput(jobId)
    jobOutput.value = result.output || '출력이 없습니다.'
  } catch (err) {
    console.warn('Failed to fetch job output:', err)
    jobOutput.value = '출력을 가져올 수 없습니다.'
  } finally {
    loadingOutput.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefreshOutput.value = !autoRefreshOutput.value
}

const copyOutput = async () => {
  try {
    await navigator.clipboard.writeText(jobOutput.value)
    // 토스트 알림을 추가할 수 있음
    console.log('출력이 클립보드에 복사되었습니다.')
  } catch (err) {
    console.error('복사 실패:', err)
  }
}

const downloadOutput = () => {
  const jobId = route.params.id
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `job-${jobId}-output-${timestamp}.log`
  
  const element = document.createElement('a')
  const file = new Blob([jobOutput.value], { type: 'text/plain' })
  element.href = URL.createObjectURL(file)
  element.download = filename
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

// 유틸리티 함수들
const getJobStatusClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return 'bg-green-100 text-green-800'
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED': return 'bg-blue-100 text-blue-800'
    case 'FAILED': return 'bg-red-100 text-red-800'
    case 'CANCELLED': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getJobStatusDotClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return 'bg-green-400'
    case 'PENDING': return 'bg-yellow-400'
    case 'COMPLETED': return 'bg-blue-400'
    case 'FAILED': return 'bg-red-400'
    case 'CANCELLED': return 'bg-gray-400'
    default: return 'bg-gray-400'
  }
}

const getJobStatusText = (status) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return '실행 중'
    case 'PENDING': return '대기 중'
    case 'COMPLETED': return '완료'
    case 'FAILED': return '실패'
    case 'CANCELLED': return '취소됨'
    default: return '알 수 없음'
  }
}

const getGpuCount = () => {
  const allocTres = jobDetails.value?.details?.AllocTRES || ''
  
  // gres/gpu 패턴으로 GPU 개수 찾기 (다중 노드 지원)
  const gpuMatches = allocTres.match(/gres\/gpu:?\w*=(\d+)/g)
  
  if (gpuMatches && gpuMatches.length > 0) {
    // 모든 GPU 개수를 합산
    const totalGpus = gpuMatches.reduce((total, match) => {
      const count = parseInt(match.match(/=(\d+)/)[1]) || 0
      return total + count
    }, 0)
    
    return `${totalGpus}개`
  }
  
  return 'N/A'
}

const getGpuType = () => {
  const allocTres = jobDetails.value?.details?.AllocTRES || ''
  const gpuMatch = allocTres.match(/gres\/gpu:(\w+)=\d+/)
  return gpuMatch ? gpuMatch[1].toUpperCase() : 'GPU'
}

const getMemoryUsage = () => {
  const allocTres = jobDetails.value?.details?.AllocTRES || ''
  
  // mem=515810M 패턴 찾기
  const memMatch = allocTres.match(/mem=(\d+)([MG]?)/)
  if (memMatch) {
    const value = parseInt(memMatch[1])
    const unit = memMatch[2] || 'M' // 단위가 없으면 기본값 M
    
    if (unit === 'M') {
      // MB를 GB로 변환
      return `${Math.round(value / 1024)} GB`
    } else if (unit === 'G') {
      return `${value} GB`
    }
  }
  
  return 'N/A'
}

const getTimeRemaining = () => {
  const timeLimit = jobDetails.value?.details?.TimeLimit
  const runTime = jobDetails.value?.details?.RunTime
  
  if (timeLimit && runTime && timeLimit !== 'N/A' && runTime !== 'N/A') {
    return `남은 시간: ${timeLimit}`
  }
  return timeLimit ? `제한: ${timeLimit}` : 'N/A'
}

const getUserInfo = () => {
  const userId = jobDetails.value?.details?.UserId
  if (userId) {
    const match = userId.match(/(\w+)\((\d+)\)/)
    return match ? match[1] : userId
  }
  return 'N/A'
}

const formatDateTime = (dateTimeStr) => {
  if (!dateTimeStr || dateTimeStr === 'N/A' || dateTimeStr === 'None') {
    return 'N/A'
  }
  
  try {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('ko-KR')
  } catch {
    return dateTimeStr
  }
}

// 생명주기
onMounted(() => {
  fetchJobDetails()
  
  // 자동 새로고침 감시
  const outputInterval = setInterval(() => {
    if (autoRefreshOutput.value && !loadingOutput.value) {
      fetchJobOutput()
    }
    
    // 실행 중인 작업의 경우 30초마다 상태도 업데이트
    if (jobDetails.value?.details?.JobState === 'RUNNING' && !loading.value) {
      fetchJobDetails()
    }
  }, 30000)
  
  // 컴포넌트 언마운트 시 인터벌 정리
  onUnmounted(() => {
    clearInterval(outputInterval)
  })
})
</script>