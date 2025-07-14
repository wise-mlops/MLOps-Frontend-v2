<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <!-- Notebook Name with Status -->
    <div class="mb-6 flex items-center">
      <UIcon
        :name="notebookStatus.ready ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
        :class="notebookStatus.ready ? 'w-6 h-6 text-green-500 mr-2' : 'w-6 h-6 text-red-500 mr-2'"
      />
      <h2 class="text-xl font-semibold">{{ notebookName }}</h2>
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

          <!-- Volumes -->
          <UCard>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">Volumes</h3>
            </div>
            <div class="space-y-4">
              <!-- PersistentVolumeClaims -->
              <div>
                <h4 class="font-medium text-gray-700 mb-2">PersistentVolumeClaims</h4>
                <div v-if="volumeInfo.persistentVolumeClaims.length === 0" class="text-gray-500">
                  No PersistentVolumeClaims
                </div>
                <div v-else>
                  <div
                    v-for="pvc in volumeInfo.persistentVolumeClaims"
                    :key="pvc"
                    class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2"
                  >
                    {{ pvc }}
                  </div>
                </div>
              </div>
              <!-- Memory-backed Volumes -->
              <div>
                <h4 class="font-medium text-gray-700 mb-2">Memory-backed Volumes</h4>
                <div v-if="volumeInfo.memoryBackedVolumes.length === 0" class="text-gray-500">
                  No Memory-backed Volumes
                </div>
                <div v-else>
                  <div
                    v-for="vol in volumeInfo.memoryBackedVolumes"
                    :key="vol"
                    class="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded mr-2 mb-2"
                  >
                    {{ vol }}
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Conditions -->
          <UCard>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold">Conditions</h3>
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

      <template #logs="{ item }">
        <UCard>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Notebook Pod 로그</h3>
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
            <template #reason-data="{ row }">
              {{ row.reason || 'N/A' }}
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
const router = useRouter()
const route = useRoute()

const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'Notebooks', to: '/notebooks/' },
  { label: 'Details' }
])

const pageTitle = ref('Notebook details')
const notebookName = ref(route.params.name)
const namespace = ref('kubeflow-user-example-com')

// 데이터 상태
const notebookData = ref({})
const notebookStatus = ref({ ready: false, phase: 'Unknown' })

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
  { key: 'first_timestamp', label: 'Created at' },
  { key: 'message', label: 'Message' }
])

// Computed
const filteredEventsData = computed(() => {
  if (eventTypeFilter.value === 'all') {
    return eventsData.value
  }
  return eventsData.value.filter(event => event.type === eventTypeFilter.value)
})

const volumeInfo = computed(() => {
  const volumes = notebookData.value.parsed_info?.volumes || {}
  return {
    persistentVolumeClaims: volumes.persistent_volume_claims || [],
    memoryBackedVolumes: volumes.memory_backed_volumes || []
  }
})

const overviewInfo = computed(() => [
  { label: 'Type', value: getNotebookType() },
  { label: 'Minimum CPU', value: getMinCPU() },
  { label: 'Maximum CPU', value: getMaxCPU() },
  { label: 'Minimum memory', value: getMinMemory() },
  { label: 'Maximum memory', value: getMaxMemory() },
  { label: 'Image', value: getImage(), copyable: true },
  { label: 'Shared memory enabled', value: getSharedMemoryEnabled() },
  { label: 'Notebook creator', value: getCreator() },
  { label: 'Configurations', value: 'No configurations available for this notebook.' },
  ...getEnvironmentVars().map(env => ({
    label: 'Environment',
    value: `${env.name}: ${env.value}`,
    badge: true
  }))
])

const yamlContent = computed(() => {
  if (notebookData.value.spec) {
    const yamlObject = {
      apiVersion: 'kubeflow.org/v1',
      kind: 'Notebook',
      metadata: notebookData.value.metadata,
      spec: notebookData.value.spec,
      status: notebookData.value.status
    }
    let yamlString = JSON.stringify(yamlObject, null, 2)
    return jsonToYaml(yamlString)
  }
  return "# YAML 데이터를 불러오는 중..."
})

const tabItems = computed(() => [
  { slot: 'overview', label: 'Overview' },
  { slot: 'logs', label: 'Logs' },
  { slot: 'events', label: 'Events' },
  { slot: 'yaml', label: 'YAML' }
])

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
      click: () => loadAllData()
    }
  ]
])

// 유틸리티 함수들
const isSuccessResponse = (response: any) => {
  return response && (response.code === 130200 || response.success === true)
}

const getNotebookType = () => {
  return notebookData.value.parsed_info?.server_type === 'jupyter' ? 'JupyterLab' :
         notebookData.value.parsed_info?.server_type === 'vscode' ? 'VSCode' : 'Unknown'
}

const getImage = () => notebookData.value.parsed_info?.image || 'N/A'
const getCreator = () => notebookData.value.parsed_info?.creator || 'N/A'
const getMinCPU = () => notebookData.value.parsed_info?.resources?.requests?.cpu || 'N/A'
const getMaxCPU = () => notebookData.value.parsed_info?.resources?.limits?.cpu || 'N/A'
const getMinMemory = () => notebookData.value.parsed_info?.resources?.requests?.memory || 'N/A'
const getMaxMemory = () => notebookData.value.parsed_info?.resources?.limits?.memory || 'N/A'
const getEnvironmentVars = () => notebookData.value.parsed_info?.environment_vars || []

const getSharedMemoryEnabled = () => {
  return notebookData.value.parsed_info?.volumes?.memory_backed_volumes?.length > 0 ? 'Yes' : 'No'
}

const formatRelativeTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : 'Today'
}

const scrollToBottom = async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// API 함수들
const loadNotebookDetails = async () => {
  try {
    conditionsPending.value = true
    const response = await getNotebookStatus(namespace.value, notebookName.value)
    if (isSuccessResponse(response) && response.result) {
      const result = response.result
      notebookData.value = {
        spec: result.spec,
        metadata: result.metadata,
        status: result.status,
        parsed_info: result.parsed_info
      }
      notebookStatus.value = {
        ready: result.ready,
        phase: result.phase
      }
      conditionsData.value = result.conditions || []
    }
  } catch (error) {
    console.error('노트북 상세 정보 로드 에러:', error)
  } finally {
    conditionsPending.value = false
  }
}

const loadPods = async () => {
  try {
    podLoading.value = true
    const response = await getNotebookPods(namespace.value, notebookName.value)
    if (isSuccessResponse(response) && response.result) {
      const pods = response.result
      podOptions.value = pods.map(pod => ({
        label: `${pod.name} (${pod.phase})`,
        value: pod.name,
        containers: pod.containers
      }))

      if (pods.length > 0) {
        selectedPod.value = pods[0].name
        containerOptions.value = pods[0].containers.map(container => ({
          label: container,
          value: container
        }))
        if (pods[0].containers.length > 0) {
          selectedContainer.value = pods[0].containers[0]
        }
      }
    }
  } catch (error) {
    console.error('Pod 로드 에러:', error)
  } finally {
    podLoading.value = false
  }
}

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
    logs.value = [`Error loading logs: ${error.message}`]
  } finally {
    logLoading.value = false
  }
}

const loadEvents = async () => {
  try {
    eventsPending.value = true
    const response = await getNotebookEvents(namespace.value, notebookName.value)
    if (isSuccessResponse(response) && response.result) {
      eventsData.value = response.result.events || response.result || []
    }
  } catch (error) {
    console.error('이벤트 로드 에러:', error)
  } finally {
    eventsPending.value = false
  }
}

const refreshEvents = async () => {
  await loadEvents()
}

const loadAllData = async () => {
  try {
    await loadNotebookDetails()
    await Promise.all([loadPods(), loadEvents()])
    if (selectedPod.value && selectedContainer.value) {
      await refreshLogs()
    }
  } catch (error) {
    console.error('데이터 로드 에러:', error)
  }
}

// Watchers
watch(logs, async (newLogs) => {
  if (newLogs.length > 0) {
    await scrollToBottom()
  }
}, { flush: 'post' })

watch(selectedPod, async (newPod, oldPod) => {
  if (newPod) {
    const selectedPodInfo = podOptions.value.find(pod => pod.value === newPod)
    if (selectedPodInfo) {
      containerOptions.value = selectedPodInfo.containers.map(container => ({
        label: container,
        value: container
      }))
      if (selectedPodInfo.containers.length > 0) {
        selectedContainer.value = selectedPodInfo.containers[0]
      }
    }
    if (oldPod) {
      await refreshLogs()
    }
  }
})

watch(selectedContainer, async (newContainer, oldContainer) => {
  if (newContainer && selectedPod.value && oldContainer) {
    await refreshLogs()
  }
})

// Lifecycle
onBeforeMount(() => {
  loadAllData()
})
</script>