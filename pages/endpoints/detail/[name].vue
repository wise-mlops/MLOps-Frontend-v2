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
                :disabled="podOptions.length === 0"
                :loading="podLoading"
              />
              <USelect
                v-model="selectedContainer"
                :options="containerOptions"
                placeholder="Container 선택"
                :disabled="containerOptions.length === 0"
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
            <h3 class="text-lg font-semibold">YAML</h3>
          </div>
          <MonacoEditor
            v-model="yamlContent"
            lang="yaml"
            :options="{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              theme: 'vs'
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
const namespace = ref('kubeflow-user-example-com')
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

// API 응답 체크 헬퍼 함수
const isSuccessResponse = (response: any) => {
  return response && (response.code === 130200 || response.success === true)
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

// Pod 로드 함수
const loadPods = async () => {
  try {
    podLoading.value = true
    const response = await getEndpointPods(namespace.value, endpointName.value)

    if (isSuccessResponse(response) && response.result) {
      const pods = response.result

      podOptions.value = pods.map(pod => ({
        label: `${pod.name} (${pod.phase})`,
        value: pod.name,
        containers: pod.containers,
        phase: pod.phase,
        ready: pod.ready
      }))

      // 첫 번째 Pod 자동 선택
      if (pods.length > 0) {
        selectedPod.value = pods[0].name

        // 컨테이너 옵션 설정
        containerOptions.value = pods[0].containers.map(container => ({
          label: container,
          value: container
        }))

        // 첫 번째 컨테이너 자동 선택 (kserve-container 우선)
        if (pods[0].containers.length > 0) {
          const kserveContainer = pods[0].containers.find(c => c === 'kserve-container')
          selectedContainer.value = kserveContainer || pods[0].containers[0]
        }
      }
    }
  } catch (error) {
    console.error('Error loading pods:', error)
  } finally {
    podLoading.value = false
  }
}

// 로그 새로고침
const refreshLogs = async () => {
  if (!selectedPod.value) return

  try {
    logLoading.value = true
    logs.value = []

    const response = await getPodLogs(
      namespace.value,
      selectedPod.value,
      selectedContainer.value,
      200
    )

    if (isSuccessResponse(response) && response.result) {
      logs.value = response.result.logs || response.result || []
      await scrollToBottom()
    } else {
      logs.value = [`Error: ${response.message || '로그를 가져올 수 없습니다'}`]
    }
  } catch (error) {
    console.error('Error loading logs:', error)
    logs.value = [`Error loading logs: ${error.message}`]
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

// 상태 로드
const loadStatus = async () => {
  try {
    const response = await getInferenceServiceStatus(namespace.value, endpointName.value)

    if (isSuccessResponse(response) && response.result) {
      endpointStatus.value = {
        ready: response.result.ready,
        phase: response.result.phase
      }
    }
  } catch (error) {
    console.error('Error loading status:', error)
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
const getExternalUrl = () => data.value?.status?.url || 'N/A'
const getInternalUrl = () => data.value?.status?.url || 'N/A'
const getStorageUri = () => {
  const predictor = data.value?.spec?.predictor
  if (predictor?.model?.storageUri) return predictor.model.storageUri
  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((env: any) => env.name === 'STORAGE_URI')
    return storageEnv?.value || 'N/A'
  }
  return 'N/A'
}

const getPredictorType = () => {
  const predictor = data.value?.spec?.predictor
  if (predictor?.model?.modelFormat?.name) return predictor.model.modelFormat.name
  if (predictor?.containers) return 'custom'
  return 'N/A'
}

const getRuntime = () => {
  const predictor = data.value?.spec?.predictor
  if (predictor?.model?.modelFormat?.name === 'mlflow') return 'MLFlow ModelServer'
  if (predictor?.containers) return 'Custom ModelServer'
  return 'N/A'
}

const getProtocolVersion = () => data.value?.spec?.predictor?.model?.protocolVersion || ''
const getConditions = () => data.value?.status?.conditions || []
const getIstioInject = () => data.value?.metadata?.annotations?.['sidecar.istio.io/inject'] || 'false'
const isContainerBased = () => !!data.value?.spec?.predictor?.containers
const isModelBased = () => !!data.value?.spec?.predictor?.model
const getContainerName = () => data.value?.spec?.predictor?.containers?.[0]?.name || 'N/A'
const getContainerImage = () => data.value?.spec?.predictor?.containers?.[0]?.image || 'N/A'
const getContainerCommand = () => {
  const container = data.value?.spec?.predictor?.containers?.[0]
  if (container?.command && container?.args) {
    return `${container.command.join(' ')} ${container.args.join(' ')}`
  }
  return 'N/A'
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
  { label: 'Predictor', value: getPredictorType() },
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
      { label: 'Predictor', value: getPredictorType() },
      { label: 'Runtime', value: getRuntime() },
      { label: 'Protocol Version', value: getProtocolVersion() }
    )
  }
  if (getServiceAccount()) {
    info.push({ label: 'Service account', value: getServiceAccount() })
  }
  return info
})

const yamlContent = computed(() => {
  let yamlString = JSON.stringify(data.value, null, 2)
  return jsonToYaml(yamlString)
})

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
    label: 'Yaml',
    data: data.value
  }
])
</script>