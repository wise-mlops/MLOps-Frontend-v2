<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div class="grid grid-cols-5 gap-6">
      <!-- 좌측: 재배포 설정 폼 (40%) -->
      <div class="col-span-2 space-y-6">
        <!-- 기본 정보 (읽기 전용) -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              기본 정보
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Inference Service Name">
              <UInput :value="serviceName" disabled />
            </UFormGroup>

            <UFormGroup label="서빙 방식">
              <UBadge :label="servingType" :color="getServingTypeBadgeColor(servingType)" />
            </UFormGroup>

            <UFormGroup label="현재 상태">
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ currentStatus }}</span>
            </UFormGroup>
          </div>
        </UCard>

        <!-- 재배포 전략 선택 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              재배포 전략
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup label="배포 전략" name="strategy" required>
              <URadioGroup
                v-model="formData.strategy"
                :options="availableStrategies"
                :disabled="loading"
              />
            </UFormGroup>

            <!-- 전략별 설정 -->
            <div v-if="formData.strategy" class="border-t pt-4">
              <!-- LoRA Adapter 설정 -->
              <div v-if="formData.strategy === 'lora-adapter'" class="space-y-4">
                <UFormGroup label="LoRA Adapter 이름" required>
                  <UInput
                    v-model="formData.loraName"
                    placeholder="예: new-adapter"
                    variant="outline"
                    :disabled="loading"
                    required
                  />
                </UFormGroup>

                <UFormGroup label="LoRA Adapter 경로" required>
                  <UInput
                    v-model="formData.loraPath"
                    placeholder="예: s3://bucket/path/to/adapter"
                    variant="outline"
                    :disabled="loading"
                    required
                  />
                </UFormGroup>
              </div>

              <!-- Canary 설정 -->
              <div v-if="formData.strategy === 'canary'" class="space-y-4">
                <UFormGroup label="트래픽 비율 (%)">
                  <URange
                    v-model="formData.trafficPercent"
                    :min="1"
                    :max="99"
                    :disabled="loading"
                  />
                  <div class="text-sm text-gray-500 mt-1">{{ formData.trafficPercent }}%</div>
                </UFormGroup>
              </div>

              <!-- Storage URI (LoRA 제외한 모든 전략) -->
              <div v-if="formData.strategy !== 'lora-adapter'" class="space-y-4">
                <UFormGroup label="Storage URI" required>
                  <UInput
                    v-model="formData.storageUri"
                    placeholder="예: s3://bucket/path/to/model"
                    variant="outline"
                    :disabled="loading"
                    required
                  />
                </UFormGroup>
              </div>

              <!-- ModelMesh 추가 설정 -->
              <div v-if="formData.strategy === 'modelmesh'" class="space-y-4">
                <UFormGroup label="모델 포맷">
                  <USelectMenu
                    v-model="formData.modelFormat"
                    :options="modelFormatOptions"
                    option-attribute="label"
                    value-attribute="value"
                    :disabled="loading"
                  />
                </UFormGroup>
              </div>
            </div>

            <!-- 재배포 실행 버튼 -->
            <div class="flex justify-end gap-3 pt-4">
              <UButton
                variant="outline"
                @click="cancelRedeploy"
                :disabled="loading"
              >
                취소
              </UButton>
              <UButton
                @click="startRedeploy"
                :loading="loading"
                :disabled="!isFormValid"
              >
                재배포 시작
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 우측: 실시간 모니터링 (60%) -->
      <div class="col-span-3 space-y-6">
        <!-- 진행 상황 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              재배포 진행 상황
            </h3>
          </template>

          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <UProgress :value="deploymentProgress" :max="100" />
              </div>
              <span class="text-sm font-medium">{{ deploymentProgress }}%</span>
            </div>

            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ deploymentStatus }}
            </div>

            <div v-if="deploymentStarted" class="text-sm">
              성공률: <span class="font-medium" :class="getSuccessRateColor()">{{ successRate }}%</span>
            </div>
          </div>
        </UCard>

        <!-- 실시간 로그 -->
        <UCard>
          <template #header>
            <UTabs v-model="activeTab" :items="logTabs" />
          </template>

          <div class="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <!-- 배포 로그 -->
            <div v-if="activeTab === 0" class="space-y-2">
              <div
                v-for="(log, index) in deploymentLogs"
                :key="index"
                class="text-sm font-mono"
                :class="getLogLevelClass(log.level)"
              >
                [{{ formatTime(log.timestamp) }}] {{ log.message }}
              </div>
              <div v-if="deploymentLogs.length === 0" class="text-gray-500 text-center py-8">
                재배포 시작을 기다리는 중...
              </div>
            </div>

            <!-- 추론 검증 로그 -->
            <div v-if="activeTab === 1" class="space-y-2">
              <div
                v-for="(log, index) in inferenceLogs"
                :key="index"
                class="text-sm font-mono"
                :class="getLogLevelClass(log.level)"
              >
                [{{ formatTime(log.timestamp) }}] {{ log.message }}
              </div>
              <div v-if="inferenceLogs.length === 0" class="text-gray-500 text-center py-8">
                추론 검증 로그가 표시됩니다...
              </div>
            </div>

            <!-- Pod 로그 -->
            <div v-if="activeTab === 2" class="space-y-2">
              <div
                v-for="(log, index) in podLogs"
                :key="index"
                class="text-sm font-mono"
              >
                [{{ formatTime(log.timestamp) }}] <span class="text-blue-600">{{ log.podName }}</span>: {{ log.message }}
              </div>
              <div v-if="podLogs.length === 0" class="text-gray-500 text-center py-8">
                Pod 로그가 표시됩니다...
              </div>
            </div>

            <!-- 메트릭 -->
            <div v-if="activeTab === 3" class="space-y-4">
              <div v-if="metrics" class="grid grid-cols-2 gap-4">
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">총 요청</div>
                  <div class="text-2xl font-bold">{{ metrics.totalRequests }}</div>
                </div>
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">성공 요청</div>
                  <div class="text-2xl font-bold text-green-600">{{ metrics.successfulRequests }}</div>
                </div>
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">평균 응답시간</div>
                  <div class="text-2xl font-bold">{{ metrics.averageResponseTime || 0 }}ms</div>
                </div>
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">성공률</div>
                  <div class="text-2xl font-bold" :class="getSuccessRateColor()">{{ metrics.successRate }}%</div>
                </div>
              </div>
              <div v-else class="text-gray-500 text-center py-8">
                메트릭 데이터를 수집하는 중...
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const serviceName = route.params.name as string

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Endpoints',
    to: '/endpoints/'
  },
  {
    label: 'Redeploy',
  },
])

const pageTitle = ref(`재배포: ${serviceName}`)
const loading = ref(false)
const deploymentStarted = ref(false)
const deploymentProgress = ref(0)
const deploymentStatus = ref('재배포 준비 중...')
const successRate = ref(100)

// 현재 서비스 정보
const servingType = ref('Standard')
const currentStatus = ref('단일 라우팅')

// 폼 데이터
const formData = ref({
  strategy: '',
  storageUri: '',
  loraName: '',
  loraPath: '',
  trafficPercent: 20,
  modelFormat: 'sklearn'
})

// 서빙 방식별 사용 가능한 전략
const availableStrategies = computed(() => {
  switch (servingType.value) {
    case 'vLLM':
      return [
        { label: 'LoRA Adapter (권장)', value: 'lora-adapter' },
        { label: 'Blue-Green', value: 'blue-green' }
      ]
    case 'ModelMesh':
      return [
        { label: 'ModelMesh', value: 'modelmesh' }
      ]
    default: // Standard
      return [
        { label: 'Blue-Green', value: 'blue-green' },
        { label: 'Canary', value: 'canary' }
      ]
  }
})

// 기본 전략 설정
watch(availableStrategies, (strategies) => {
  if (strategies.length > 0 && !formData.value.strategy) {
    formData.value.strategy = strategies[0].value
  }
}, { immediate: true })

const modelFormatOptions = ref([
  { label: 'Scikit-learn', value: 'sklearn' },
  { label: 'XGBoost', value: 'xgboost' },
  { label: 'LightGBM', value: 'lightgbm' },
  { label: 'ONNX', value: 'onnx' },
  { label: 'TensorFlow', value: 'tensorflow' },
  { label: 'PyTorch', value: 'pytorch' }
])

// 폼 유효성 검사
const isFormValid = computed(() => {
  if (!formData.value.strategy) return false

  switch (formData.value.strategy) {
    case 'lora-adapter':
      return formData.value.loraName && formData.value.loraPath
    case 'modelmesh':
      return formData.value.storageUri && formData.value.modelFormat
    default:
      return formData.value.storageUri
  }
})

// 로그 관련
const activeTab = ref(0)
const logTabs = [
  { label: '배포 로그' },
  { label: '추론 검증' },
  { label: 'Pod 로그' },
  { label: '메트릭' }
]

const deploymentLogs = ref([])
const inferenceLogs = ref([])
const podLogs = ref([])
const metrics = ref(null)

// 유틸리티 함수들
const getServingTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'vLLM': return 'blue'
    case 'ModelMesh': return 'purple'
    default: return 'gray'
  }
}

const getSuccessRateColor = () => {
  if (successRate.value === 100) return 'text-green-600'
  if (successRate.value >= 95) return 'text-yellow-600'
  return 'text-red-600'
}

const getLogLevelClass = (level: string) => {
  switch (level) {
    case 'error': return 'text-red-600'
    case 'warning': return 'text-yellow-600'
    case 'success': return 'text-green-600'
    default: return 'text-gray-700 dark:text-gray-300'
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 액션 함수들
const startRedeploy = async () => {
  if (!isFormValid.value) return

  loading.value = true
  deploymentStarted.value = true
  deploymentStatus.value = '재배포 시작 중...'

  try {
    // 재배포 설정 구성
    let config: any = {}

    switch (formData.value.strategy) {
      case 'lora-adapter':
        config = {
          loraName: formData.value.loraName,
          loraPath: formData.value.loraPath
        }
        break
      case 'canary':
        config = {
          storageUri: formData.value.storageUri,
          trafficPercent: formData.value.trafficPercent
        }
        break
      case 'modelmesh':
        config = {
          modelPath: formData.value.storageUri,
          modelFormat: formData.value.modelFormat
        }
        break
      default: // blue-green
        config = {
          storageUri: formData.value.storageUri
        }
    }

    // 네임스페이스 결정
    const namespace = servingType.value === 'ModelMesh' ? 'modelmesh-serving' : 'kubeflow-user-example-com'

    // 재배포 API 호출
    const response = await deployInferenceService(namespace, serviceName, formData.value.strategy, config)

    if (response.code === '200') {
      deploymentStatus.value = '재배포 진행 중...'
      deploymentProgress.value = 20

      // 배포 로그 추가
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `${formData.value.strategy} 재배포 시작됨`
      })

      // TODO: WebSocket 연결로 실시간 모니터링 시작
      console.log('재배포 시작 성공:', response)
    } else {
      throw new Error(response.message || '재배포 시작 실패')
    }

  } catch (error) {
    console.error('재배포 시작 실패:', error)
    deploymentStatus.value = '재배포 실패'
    deploymentLogs.value.push({
      timestamp: new Date().toISOString(),
      level: 'error',
      message: `재배포 실패: ${error.message}`
    })
    loading.value = false
  }
}

const cancelRedeploy = () => {
  router.push('/endpoints')
}

// 현재 서비스 정보 로드
onMounted(async () => {
  try {
    // 서비스 상세 정보 로드
    const endpointDetails = await getEndpointDetails('kubeflow-user-example-com', serviceName)

    // 서빙 방식 감지
    const detectedServingType = detectServingType(endpointDetails)
    servingType.value = detectedServingType === 'standard' ? 'Standard' :
                       detectedServingType === 'vllm' ? 'vLLM' : 'ModelMesh'

    // 트래픽 상태 확인
    const trafficStatus = getTrafficStatus(endpointDetails)
    currentStatus.value = trafficStatus === 'distributed' ? '트래픽 분산' : '단일 라우팅'

    console.log('서비스 정보 로드 완료:', {
      name: serviceName,
      servingType: servingType.value,
      status: currentStatus.value
    })
  } catch (error) {
    console.error('서비스 정보 로드 실패:', error)
    // 기본값 유지
  }
})

const toolbarLinks = ref([
  [],
  []
])
</script>