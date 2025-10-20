<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <!-- 좌측: 모델 선택 및 평가 제어 (30%) -->
      <div class="lg:col-span-3 space-y-6">
        <!-- 모델 선택 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              모델 선택
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup label="평가할 모델">
              <USelectMenu
                v-model="selectedModel"
                :options="availableModels"
                option-attribute="label"
                value-attribute="value"
                size="lg"
                :disabled="isEvaluationRunning"
              />
            </UFormGroup>

            <div v-if="selectedModel" class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">선택된 모델 정보</h4>
              <div class="text-sm space-y-1">
                <div><span class="font-medium">모델명:</span> {{ getSelectedModelInfo().label }}</div>
                <div><span class="font-medium">Model Name:</span> {{ selectedModel }}</div>
                <div><span class="font-medium">버전:</span> {{ getSelectedModelInfo().version }}</div>
              </div>
            </div>

            <!-- 평가 제어 버튼 -->
            <div v-if="selectedModel" class="flex flex-col space-y-3 pt-4">
              <UButton
                @click="startEvaluationJob"
                :loading="operationLoading"
                :disabled="!canStartEvaluation"
                color="primary"
                size="lg"
                block
              >
                <template #leading>
                  <UIcon name="i-heroicons-play" />
                </template>
                평가 시작
              </UButton>

              <UButton
                @click="stopEvaluationJob"
                :loading="operationLoading"
                :disabled="!canStopEvaluation"
                color="red"
                variant="outline"
                size="lg"
                block
              >
                <template #leading>
                  <UIcon name="i-heroicons-stop" />
                </template>
                평가 중단
              </UButton>
            </div>
          </div>
        </UCard>

      </div>

      <!-- 우측: 실시간 모니터링 (70%) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- 실시간 로그 -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                실시간 평가 로그
              </h3>
              <div class="flex items-center space-x-2">
                <UBadge :label="getConnectionStatusLabel()" :color="getConnectionStatusColor()" />
              </div>
            </div>
          </template>

          <div
            ref="logContainer"
            class="min-h-[600px] max-h-[80vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded"
          >
            <!-- 로그 검색 -->
            <div class="mb-4 flex items-center space-x-4">
              <div class="flex-1">
                <UInput
                  v-model="logSearchQuery"
                  placeholder="로그 검색..."
                  icon="i-heroicons-magnifying-glass"
                  size="sm"
                />
              </div>
            </div>

            <!-- 모델 선택 안내 -->
            <div v-if="!selectedModel" class="text-gray-500 text-center py-8">
              좌측에서 평가할 모델을 선택해주세요.
            </div>

            <!-- 로그 내용 -->
            <div v-else class="font-mono text-sm space-y-1">
              <div
                v-for="(log, index) in filteredLogs"
                :key="index"
                class="p-1"
              >
                <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
                <span class="ml-2 text-blue-600">[{{ log.job_name }}]</span>
                <span class="ml-2">{{ log.message }}</span>
              </div>
              <div v-if="filteredLogs.length === 0 && logs.length > 0" class="text-gray-500 text-center py-8">
                검색 결과가 없습니다.
              </div>
              <div v-else-if="logs.length === 0 && selectedModel" class="text-gray-500 text-center py-8">
                {{ getSelectedModelInfo().label }} 모델의 평가 로그가 실시간으로 표시됩니다...
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { startEvaluation, stopEvaluation, useEvaluationWebSocket } from '~/composables/evaluations'

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Evaluations',
  },
])

const pageTitle = ref('모델 평가')

// 사용 가능한 모델 목록 (고정)
const availableModels = ref([
  {
    label: '객체 탐지 모델 v1.0',
    value: 'before',
    version: 'v1.0'
  },
  {
    label: '객체 탐지 모델 v1.1',
    value: 'after',
    version: 'v1.1'
  }
])

// 선택된 모델 (기본값: before)
const selectedModel = ref('before')

// 평가 상태 관련
const operationLoading = ref(false)
const operationMessage = ref('')
const jobInfo = ref<any>(null)
const currentPodName = ref('')

// 로그 관련
const logSearchQuery = ref('')
const logContainer = ref<HTMLElement>()

// WebSocket 연동 (websocket.ts 패턴 참고)
const wsComposable = useEvaluationWebSocket()
const { logs, connectionStatus, error } = wsComposable

// 모델 선택 변경시 상태 초기화
watch(selectedModel, (newModel, oldModel) => {
  if (oldModel) {
    // WebSocket 연결 해제
    wsComposable.disconnect()

    // 로그 초기화
    wsComposable.clearLogs()
  }

  // 상태 초기화
  jobInfo.value = null
  currentPodName.value = ''
  operationMessage.value = ''
})

// 유틸리티 함수들
const getSelectedModelInfo = () => {
  return availableModels.value.find(model => model.value === selectedModel.value) || {}
}


const getConnectionStatusLabel = () => {
  switch (connectionStatus.value) {
    case 'connected': return '연결됨'
    case 'connecting': return '연결 중'
    case 'error': return '오류'
    default: return '연결 안됨'
  }
}

const getConnectionStatusColor = () => {
  switch (connectionStatus.value) {
    case 'connected': return 'green'
    case 'connecting': return 'blue'
    case 'error': return 'red'
    default: return 'gray'
  }
}

const formatTime = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return new Date().toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}

// 필터링된 로그
const filteredLogs = computed(() => {
  if (!logSearchQuery.value) return logs.value

  return logs.value.filter(log =>
    log.message.toLowerCase().includes(logSearchQuery.value.toLowerCase())
  )
})

// 평가 제어 가능 여부
const isEvaluationRunning = computed(() => {
  return !!currentPodName.value && connectionStatus.value === 'connected'
})

const canStartEvaluation = computed(() => {
  return selectedModel.value && !operationLoading.value && !isEvaluationRunning.value
})

const canStopEvaluation = computed(() => {
  return selectedModel.value && !operationLoading.value && isEvaluationRunning.value
})

// 액션 함수들
const startEvaluationJob = async () => {
  if (!selectedModel.value) return

  operationLoading.value = true
  operationMessage.value = '평가를 시작하고 있습니다...'

  // 기존 WebSocket 연결 해제 및 로그 초기화
  wsComposable.disconnect()
  wsComposable.clearLogs()

  try {
    const response = await startEvaluation(selectedModel.value)
    if (response.success) {
      operationMessage.value = response.message
      jobInfo.value = response

      // Pod 이름이 있으면 WebSocket 연결
      if (response.pod_name) {
        currentPodName.value = response.pod_name
        wsComposable.connect(response.pod_name)
      }
    }
  } catch (error: any) {
    console.error('평가 시작 실패:', error)
    operationMessage.value = `평가 시작 실패: ${error.message || '알 수 없는 오류'}`
  } finally {
    operationLoading.value = false
  }
}

const stopEvaluationJob = async () => {
  if (!selectedModel.value) return

  operationLoading.value = true
  operationMessage.value = '평가를 중단하고 있습니다...'

  try {
    const response = await stopEvaluation(selectedModel.value)
    if (response.success) {
      operationMessage.value = response.message

      // WebSocket 연결 해제 및 상태 초기화
      wsComposable.disconnect()
      currentPodName.value = ''
    }
  } catch (error: any) {
    console.error('평가 중단 실패:', error)
    operationMessage.value = `평가 중단 실패: ${error.message || '알 수 없는 오류'}`
  } finally {
    operationLoading.value = false
  }
}

const toolbarLinks = ref([[], []])

// 정리
onUnmounted(() => {
  wsComposable.disconnect()
})
</script>