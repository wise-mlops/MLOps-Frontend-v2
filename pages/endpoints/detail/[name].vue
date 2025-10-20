<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <!-- Endpoint Name with Status -->
    <div class="mb-6 flex items-center">
      <UIcon
        :name="endpointStatus.ready ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
        :class="endpointStatus.ready ? 'w-6 h-6 text-green-500 mr-2' : 'w-6 h-6 text-red-500 mr-2'"
      />
      <h2 class="text-xl font-semibold">{{ endpointName }}</h2>
      <!-- 디버깅: 상태 값 표시 -->
      <span class="ml-2 text-xs text-gray-500">
        (ready: {{ endpointStatus.ready }}, phase: {{ endpointStatus.phase }})
      </span>
    </div>
    <UTabs :items="tabItems" :ui="{ list: { width: 'w-2/5' } }">
      <template #overview="{ item }">
        <div class="space-y-6">
          <!-- Basic Information -->
          <UCard>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">기본 정보</h3>
            </div>
            <ModuleLabelValue v-model="overviewInfo" />
          </UCard>
          <!-- InferenceService Conditions -->
          <UCard>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">InferenceService Conditions</h3>
            </div>
            <ModuleDataTable
              v-model:columns="conditionColumns"
              v-model:data="conditionsData"
              v-model:pending="conditionsPending"
              :show-search="false"
              :show-pagination="false"
            >
              <template #status-data="{ row }">
                <UIcon v-if="row.status === 'True'" name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
                <UIcon v-else name="i-heroicons-x-circle" class="w-5 h-5 text-red-500" />
              </template>
              <template #lastTransitionTime-data="{ row }">
                {{ formatRelativeTime(row.lastTransitionTime) }}
              </template>
            </ModuleDataTable>
          </UCard>
        </div>
      </template>
      <template #details="{ item }">
        <div class="space-y-6">
          <!-- Metadata -->
          <UCard>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">메타데이터</h3>
            </div>
            <ModuleLabelValue v-model="metadataInfo" />
          </UCard>
          <!-- Predictor Spec -->
          <UCard>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">Predictor 구성</h3>
            </div>
            <ModuleLabelValue v-model="predictorInfo" />
          </UCard>
        </div>
      </template>
      <template #logs="{ item }">
        <UCard>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">로그</h3>
            <div class="flex space-x-2">
              <USelect
                v-model="selectedPod"
                :options="podOptions"
                placeholder="Pod 선택"
                :disabled="podLoading || podOptions.length === 0"
                :loading="podLoading"
              />
              <USelect
                v-model="selectedContainer"
                :options="containerOptions"
                placeholder="Container 선택"
                :disabled="!selectedPod || containerOptions.length === 0"
              />
              <UButton
                @click="refreshLogs"
                icon="i-heroicons-arrow-path"
                variant="outline"
                size="sm"
                :disabled="!selectedPod"
                :loading="logLoading"
              >
                새로고침
              </UButton>
            </div>
          </div>
          <div
            ref="logContainer"
            class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto"
          >
            <div v-if="logs.length === 0" class="text-gray-500">
              {{ selectedPod ? (logLoading ? '로그를 불러오는 중...' : '로그가 없습니다') : 'Pod를 선택하세요' }}
            </div>
            <div v-else>
              <div v-for="(log, index) in logs" :key="index" class="mb-1 whitespace-pre-wrap">
                {{ log }}
              </div>
            </div>
          </div>
        </UCard>
      </template>
      <template #events="{ item }">
        <UCard>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">이벤트</h3>
            <div class="flex space-x-2">
              <USelect
                v-model="eventTypeFilter"
                :options="eventTypeOptions"
                placeholder="이벤트 타입 필터"
              />
              <UButton
                @click="refreshEvents"
                icon="i-heroicons-arrow-path"
                variant="outline"
                size="sm"
                :loading="eventsPending"
              >
                새로고침
              </UButton>
            </div>
          </div>
          <ModuleDataTable
            v-model:columns="eventColumns"
            v-model:data="filteredEventsData"
            v-model:pending="eventsPending"
            :show-search="false"
          >
            <template #type-data="{ row }">
              <UBadge :color="row.type === 'Normal' ? 'green' : 'red'" variant="subtle" size="sm">
                {{ row.type }}
              </UBadge>
            </template>
            <template #first_timestamp-data="{ row }">
              {{ formatRelativeTime(row.first_timestamp) }}
            </template>
            <template #source-data="{ row }">
              {{ row.source?.component || 'N/A' }}
            </template>
          </ModuleDataTable>
        </UCard>
      </template>
      <template #yaml="{ item }">
        <UCard>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">JSON</h3>
          </div>
          <MonacoEditor
            :model-value="yamlContent"
            lang="json"
            :options="{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              theme: 'vs',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true
            }"
            class="w-full h-96 border rounded-lg overflow-hidden"
          />
        </UCard>
      </template>
    </UTabs>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const route = useRoute()

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
    label: 'Details',
  },
])

const pageTitle = ref('Endpoint details')
const endpointName = ref(route.params.name)
const namespace = ref(route.query.namespace as string || 'kubeflow-user-example-com')
const data = ref({})

// 상태 관리
const endpointStatus = ref({
  ready: false
})

// 로그 관련 상태
const logs = ref([])
const selectedPod = ref('')
const selectedContainer = ref('')
const podOptions = ref([])
const containerOptions = ref([])
const podLoading = ref(false)
const logLoading = ref(false)
const logContainer = ref<HTMLElement>()

// 이벤트 관련 상태
const conditionsPending = ref(false)
const eventsPending = ref(false)
const conditionsData = ref([])
const eventsData = ref([])
const eventTypeFilter = ref('all')
const eventTypeOptions = ref([
  { label: '전체', value: 'all' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Warning', value: 'Warning' }
])

// 필터된 이벤트 데이터
const filteredEventsData = computed(() => {
  if (eventTypeFilter.value === 'all') {
    return eventsData.value
  }
  return eventsData.value.filter(event => event.type === eventTypeFilter.value)
})

// 테이블 컬럼 정의
const conditionColumns = ref([
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'lastTransitionTime', label: 'Last Transition Time' },
  { key: 'reason', label: 'Reason' },
  { key: 'message', label: 'Message' }
])

const eventColumns = ref([
  { key: 'type', label: 'Type' },
  { key: 'reason', label: 'Reason' },
  { key: 'first_timestamp', label: 'Age' },
  { key: 'source', label: 'From' },
  { key: 'message', label: 'Message' }
])

// API 응답 체크 헬퍼 함수 (다른 API들과 동일한 패턴으로 통일)
const isSuccessResponse = (response: any) => {
  return response && (String(response.code).endsWith('200') || response.success === true)
}

// 스크롤을 맨 아래로 이동
const scrollToBottom = async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
    setTimeout(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight
      }
    }, 100)
  }
}

// Pod 로드 함수 (더 안전하고 상세한 처리)
const loadPods = async () => {
  try {
    podLoading.value = true
    const response = await getEndpointPods(namespace.value, endpointName.value)

    if (isSuccessResponse(response)) {
      const pods = response.result || []

      if (Array.isArray(pods) && pods.length > 0) {
        podOptions.value = pods.map(pod => {
          const containers = Array.isArray(pod.containers) ? pod.containers : []
          return {
            label: `${pod.name || 'Unknown'} (${pod.phase || 'Unknown'})`,
            value: pod.name || 'Unknown',
            containers: containers,
            phase: pod.phase || 'Unknown',
            ready: pod.ready || false
          }
        })

        // 첫 번째 Pod 자동 선택
        if (pods.length > 0 && pods[0].name) {
          selectedPod.value = pods[0].name

          // 컨테이너 옵션 설정
          const containers = Array.isArray(pods[0].containers) ? pods[0].containers : []
          containerOptions.value = containers.map(container => ({
            label: container,
            value: container
          }))

          // 첫 번째 컨테이너 자동 선택 (kserve-container 우선)
          if (containers.length > 0) {
            const kserveContainer = containers.find(c => c === 'kserve-container')
            selectedContainer.value = kserveContainer || containers[0]
          }
        }
      } else {
        // 빈 Pod 목록일 때 수동 입력 옵션 제공
        podOptions.value = [
          { label: '수동 입력...', value: 'manual', containers: ['kserve-container', 'transformer', 'storage-initializer'] }
        ]
        containerOptions.value = [
          { label: 'kserve-container', value: 'kserve-container' },
          { label: 'transformer', value: 'transformer' },
          { label: 'storage-initializer', value: 'storage-initializer' }
        ]

        // 기본 선택값 설정
        selectedPod.value = 'manual'
        selectedContainer.value = 'kserve-container'
      }
    } else {
      // API 응답 실패 원인에 따라 다른 메시지 표시
      let errorLabel = '수동 입력 (API 오류)'
      if (response.code === 130503 || response.message === 'SERVICE_UNAVAILABLE') {
        errorLabel = '수동 입력 (K8s 서비스 연결 불가)'
      }

      // API 실패시에도 수동 옵션 제공
      podOptions.value = [
        { label: errorLabel, value: 'manual', containers: ['kserve-container', 'transformer', 'storage-initializer'] }
      ]
      containerOptions.value = [
        { label: 'kserve-container', value: 'kserve-container' },
        { label: 'transformer', value: 'transformer' },
        { label: 'storage-initializer', value: 'storage-initializer' }
      ]

      // 기본 선택값 설정
      selectedPod.value = 'manual'
      selectedContainer.value = 'kserve-container'
    }
  } catch (error) {
    console.error('Error loading pods:', error)
    // 에러시에도 수동 옵션 제공
    podOptions.value = [
      { label: '수동 입력 (네트워크 오류)', value: 'manual', containers: ['kserve-container', 'transformer', 'storage-initializer'] }
    ]
    containerOptions.value = [
      { label: 'kserve-container', value: 'kserve-container' },
      { label: 'transformer', value: 'transformer' },
      { label: 'storage-initializer', value: 'storage-initializer' }
    ]

    // 기본 선택값 설정
    selectedPod.value = 'manual'
    selectedContainer.value = 'kserve-container'
  } finally {
    podLoading.value = false
  }
}

// 로그 새로고침
const refreshLogs = async () => {
  if (!selectedPod.value || !selectedContainer.value) {
    logs.value = ['Pod 또는 Container를 선택하세요']
    return
  }

  // 수동 입력 모드일 때는 실제 Pod 이름 추정
  let actualPodName = selectedPod.value
  if (selectedPod.value === 'manual') {
    // 서비스 이름을 기반으로 Pod 이름 추정 (KServe 명명 규칙)
    actualPodName = `${endpointName.value}-predictor-default-00001-deployment-`
    logs.value = [
      `🔍 수동 모드로 Pod 로그 시도중...`,
      `📋 추정된 Pod 패턴: ${actualPodName}*`,
      `🎯 컨테이너: ${selectedContainer.value}`,
      `⚠️  정확한 Pod 이름이 다를 수 있습니다.`,
      `────────────────────────────────────`
    ]
  }

  try {
    logLoading.value = true

    // 수동 모드가 아닐 때만 로그 초기화
    if (selectedPod.value !== 'manual') {
      logs.value = []
    }

    const response = await getPodLogs(
      namespace.value,
      actualPodName,
      selectedContainer.value,
      200
    )

    if (isSuccessResponse(response)) {
      // 응답 구조 확인 및 유연한 파싱
      let logData = []
      if (response.result) {
        if (Array.isArray(response.result)) {
          // result가 배열인 경우
          logData = response.result
        } else if (response.result.logs && Array.isArray(response.result.logs)) {
          // result.logs가 배열인 경우
          logData = response.result.logs
        } else if (typeof response.result === 'string') {
          // result가 문자열인 경우 (줄바꿈으로 분할)
          logData = response.result.split('\n').filter(line => line.trim())
        } else {
          logData = [`Unexpected log format: ${JSON.stringify(response.result)}`]
        }
      } else {
        logData = [`No logs available`]
      }

      if (selectedPod.value === 'manual') {
        // 수동 모드일 때는 기존 메시지에 결과 추가
        logs.value = [...logs.value, '', '📥 로그 결과:', ...logData]
      } else {
        logs.value = logData
      }
      await scrollToBottom()
    } else {
      const errorMessages = [
        `❌ 로그 로드 실패: ${response.message || '로그를 가져올 수 없습니다'}`,
        `📊 응답 코드: ${response.code}`
      ]

      if (selectedPod.value === 'manual') {
        // 수동 모드일 때는 기존 메시지에 오류 추가
        logs.value = [...logs.value, '', ...errorMessages]
      } else {
        logs.value = errorMessages
      }
    }
  } catch (error) {
    console.error('Error loading logs:', error)
    const errorMessages = [
      `🚨 네트워크 오류: ${error.message}`,
      `📞 관리자에게 문의하세요.`
    ]

    if (selectedPod.value === 'manual') {
      // 수동 모드일 때는 기존 메시지에 오류 추가
      logs.value = [...logs.value, '', ...errorMessages]
    } else {
      logs.value = errorMessages
    }
  } finally {
    logLoading.value = false
  }
}

// 이벤트 로드
const loadEvents = async () => {
  try {
    eventsPending.value = true
    const response = await getEndpointEvents(namespace.value, endpointName.value)

    if (isSuccessResponse(response) && response.result) {
      eventsData.value = response.result.events || response.result || []
    }
  } catch (error) {
    console.error('Error loading events:', error)
  } finally {
    eventsPending.value = false
  }
}

// 이벤트 새로고침
const refreshEvents = async () => {
  await loadEvents()
}

// 상태 로드 (더 안전하고 유연한 처리)
const loadStatus = async () => {
  try {
    // 별도 상태 API 시도
    const response = await getInferenceServiceStatus(namespace.value, endpointName.value)

    if (isSuccessResponse(response) && response.result) {
      endpointStatus.value = {
        ready: response.result.ready,
        phase: response.result.phase
      }
    } else {
      // 별도 API 실패시 메인 데이터에서 상태 추출
      extractStatusFromMainData()
    }
  } catch (error) {
    console.error('Error loading status from dedicated API:', error)
    // API 오류시 메인 데이터에서 상태 추출 시도
    extractStatusFromMainData()
  }
}

// 메인 데이터에서 상태 추출 (목록과 동일한 로직)
const extractStatusFromMainData = () => {
  if (!data.value) return

  let ready = false

  try {
    // 1. conditions 배열에서 Ready=True 확인
    if (data.value.status?.conditions && Array.isArray(data.value.status.conditions)) {
      const readyCondition = data.value.status.conditions.find((condition: any) => condition.type === 'Ready')
      if (readyCondition?.status === 'True') {
        ready = true
      }
    }

    // 2. 최상위 조건들 확인
    if (data.value.conditions && Array.isArray(data.value.conditions)) {
      const readyCondition = data.value.conditions.find((condition: any) => condition.type === 'Ready')
      if (readyCondition?.status === 'True') {
        ready = true
      }
    }

    // 3. 직접적인 ready 필드 확인
    if (data.value.ready === true || data.value.status?.ready === true) {
      ready = true
    }

    // 상태 업데이트
    endpointStatus.value = {
      ready,
      phase: data.value.status?.phase || 'Unknown'
    }

  } catch (error) {
    console.error('Error extracting status from main data:', error)
    endpointStatus.value = { ready: false, phase: 'Error' }
  }
}

// Watch logs 배열 변경을 감지해서 자동 스크롤
watch(logs, async (newLogs) => {
  if (newLogs.length > 0) {
    await scrollToBottom()
  }
}, { flush: 'post' })

// Watch Pod 변경
watch(selectedPod, async (newPod, oldPod) => {
  if (newPod) {
    // 선택된 Pod의 컨테이너 목록 업데이트
    const selectedPodInfo = podOptions.value.find(pod => pod.value === newPod)

    if (selectedPodInfo) {
      containerOptions.value = selectedPodInfo.containers.map(container => ({
        label: container,
        value: container
      }))

      // 첫 번째 컨테이너 자동 선택 (kserve-container 우선)
      if (selectedPodInfo.containers.length > 0) {
        const kserveContainer = selectedPodInfo.containers.find(c => c === 'kserve-container')
        selectedContainer.value = kserveContainer || selectedPodInfo.containers[0]
      }
    }

    // Pod 변경 시에만 로그 새로고침 (초기 로드 제외)
    if (oldPod) {
      await refreshLogs()
    }
  }
})

// Watch Container 변경
watch(selectedContainer, async (newContainer, oldContainer) => {
  if (newContainer && selectedPod.value && oldContainer) {
    await refreshLogs()
  }
})

// 메인 로드 함수
const loadEndpointDetails = async () => {
  try {
    // query parameter로 받은 namespace 직접 사용
    const response = await getEndpointDetails(namespace.value, endpointName.value)
    data.value = response.result ? response.result : {}

    conditionsData.value = getConditions()

    await Promise.all([
      loadStatus(),
      loadPods(),
      loadEvents()
    ])

    // 모든 데이터 로드 완료 후 초기 로그 로드
    if (selectedPod.value && selectedContainer.value) {
      await refreshLogs()
    }
  } catch (error) {
    console.error('Error loading endpoint details:', error)
  }
}

// 초기 로드 완료 후 스크롤 처리
onMounted(() => {
  setTimeout(() => {
    if (logs.value.length > 0) {
      scrollToBottom()
    }
  }, 300)
})

// 기존 유틸리티 함수들
const getExternalUrl = () => data.value?.status?.url || '서비스 준비 중'
const getInternalUrl = () => data.value?.status?.url || '서비스 준비 중'
const getStorageUri = () => {
  const predictor = data.value?.spec?.predictor

  // Model 기반인 경우
  if (predictor?.model?.storageUri) {
    return predictor.model.storageUri
  }

  // Container 기반인 경우 (vLLM 등)
  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((e: any) => e.name === 'STORAGE_URI')
    if (storageEnv?.value) {
      const uri = storageEnv.value

      // {model_name}=s3://path 형태를 화살표로 파싱
      if (uri.includes('=')) {
        const models = uri.split(',').map(item => item.trim())
        return models.map(model => {
          const [name, path] = model.split('=')
          return `${name} → ${path}`
        }).join('\n')
      }

      // 기존 형태인 경우
      return uri
    }
  }

  return '설정되지 않음'
}

const getPredictorType = () => {
  const predictor = data.value?.spec?.predictor
  if (predictor?.model?.modelFormat?.name) return predictor.model.modelFormat.name
  if (predictor?.containers) {
    // vLLM 컨테이너 확인
    const container = predictor.containers[0]
    if (container?.image?.includes('vllm')) {
      return 'LLM'
    }
    return 'custom'
  }
  return 'unknown'
}

const getRuntime = () => {
  const predictor = data.value?.spec?.predictor
  const modelFormat = predictor?.model?.modelFormat?.name

  // Custom 컨테이너인 경우 이미지명 반환
  if (predictor?.containers?.[0]?.image) {
    return predictor.containers[0].image
  }

  // 모델 포맷별 런타임 매핑 (목록과 동일한 로직)
  switch (modelFormat) {
    case 'tensorflow':
      return 'Tensorflow ModelServer'
    case 'pytorch':
      return 'PyTorch ModelServer'
    case 'sklearn':
      return 'Scikit-learn ModelServer'
    case 'xgboost':
      return 'XGBoost ModelServer'
    case 'pmml':
      return 'PMML ModelServer'
    case 'lightgbm':
      return 'LightGBM ModelServer'
    case 'paddle':
      return 'Paddle ModelServer'
    case 'mlflow':
      return 'MLFlow ModelServer'
    case 'onnx':
      return 'ONNX ModelServer'
    default:
      return 'KServe ModelServer'
  }
}

const getProtocolVersion = () => data.value?.spec?.predictor?.model?.protocolVersion || ''
const getConditions = () => data.value?.status?.conditions || []
const getIstioInject = () => data.value?.metadata?.annotations?.['sidecar.istio.io/inject'] || 'false'
const isContainerBased = () => !!data.value?.spec?.predictor?.containers
const isModelBased = () => !!data.value?.spec?.predictor?.model
const getContainerName = () => data.value?.spec?.predictor?.containers?.[0]?.name || 'kserve-container'
const getContainerImage = () => data.value?.spec?.predictor?.containers?.[0]?.image || '설정되지 않음'
const getContainerCommand = () => {
  const container = data.value?.spec?.predictor?.containers?.[0]
  if (container?.command && container?.args) {
    return `${container.command.join(' ')} ${container.args.join(' ')}`
  }
  if (container?.command) {
    return container.command.join(' ')
  }
  if (container?.args) {
    return container.args.join(' ')
  }
  return '기본 명령어'
}
const getEnvironmentVars = () => data.value?.spec?.predictor?.containers?.[0]?.env || []
const getResources = () => data.value?.spec?.predictor?.containers?.[0]?.resources || {}
const getServiceAccount = () => data.value?.spec?.predictor?.serviceAccountName || ''

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  else if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  else return 'Today'
}

// Computed properties
const overviewInfo = computed(() => [
  { label: 'URL external', value: getExternalUrl(), copyable: true },
  { label: 'URL internal', value: getInternalUrl(), copyable: true },
  { label: 'Component', value: 'predictor', badge: true },
  { label: 'Storage URI', value: getStorageUri() },
  { label: 'Model Format', value: getPredictorType() },
  { label: 'Runtime', value: getRuntime() },
  ...(getProtocolVersion() ? [{ label: 'Protocol Version', value: getProtocolVersion() }] : [])
])

const metadataInfo = computed(() => [
  { label: 'Name', value: data.value?.metadata?.name || 'N/A' },
  { label: 'Namespace', value: data.value?.metadata?.namespace || 'N/A' },
  { label: 'URL external', value: getExternalUrl(), copyable: true },
  { label: 'Annotations', value: `sidecar.istio.io/inject: ${getIstioInject()}`, badge: true },
  { label: 'Created', value: formatRelativeTime(data.value?.metadata?.creationTimestamp) }
])

const predictorInfo = computed(() => {
  const info = []
  if (isContainerBased()) {
    info.push(
      { label: 'Container name', value: getContainerName(), copyable: true },
      { label: 'Image', value: getContainerImage(), copyable: true },
      { label: 'Command', value: getContainerCommand() },
      ...getEnvironmentVars().map(env => ({
        label: 'Environment',
        value: `${env.name}: ${env.value}`,
        badge: true
      })),
      ...(getResources().limits?.cpu ? [{ label: 'CPU limits', value: getResources().limits.cpu }] : []),
      ...(getResources().requests?.cpu ? [{ label: 'CPU requests', value: getResources().requests.cpu }] : []),
      ...(getResources().limits?.memory ? [{ label: 'Memory limits', value: getResources().limits.memory }] : []),
      ...(getResources().requests?.memory ? [{ label: 'Memory requests', value: getResources().requests.memory }] : [])
    )
  } else if (isModelBased()) {
    info.push(
      { label: 'Storage uri', value: getStorageUri() },
      { label: 'Model Format', value: getPredictorType() },
      { label: 'Runtime', value: getRuntime() },
      { label: 'Protocol Version', value: getProtocolVersion() }
    )
  }
  if (getServiceAccount()) {
    info.push({ label: 'Service account', value: getServiceAccount() })
  }
  return info
})

// YAML 내용을 ref로 변경 (MonacoEditor의 v-model 호환)
const yamlContent = ref('')

// 데이터 변경시 YAML 내용 업데이트
watch(data, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    try {
      // 더 나은 YAML 변환을 위해 JSON을 정리된 형태로 표시
      yamlContent.value = JSON.stringify(newData, null, 2)
    } catch (error) {
      console.error('Error converting to JSON:', error)
      yamlContent.value = 'Error converting data to JSON'
    }
  }
}, { immediate: true, deep: true })

const reloadEndpointDetails = () => {
  loadEndpointDetails()
}

onBeforeMount(() => {
  loadEndpointDetails()
})

// toolbar links
const toolbarLinks = ref([
  [
    {
      label: '취소',
      icon: 'i-heroicons-arrow-uturn-left',
      click: () => { router.back() }
    }
  ],
  [
    {
      label: '업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadEndpointDetails
    },
  ]
])

const tabItems = computed(() => [
  {
    slot: 'overview',
    label: 'Overview',
    data: data.value
  },
  {
    slot: 'details',
    label: 'Details',
    data: data.value
  },
  {
    slot: 'logs',
    label: 'Logs',
    data: data.value
  },
  {
    slot: 'events',
    label: 'Event',
    data: data.value
  },
  {
    slot: 'yaml',
    label: 'JSON',
    data: data.value
  }
])
</script>