<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-2/5' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col">
      <template #pipeline="{ item }">
        <div class="w-full h-full border">
          <Workflow v-model="pipeline" :pannelOpen="false" :v-model:isEditable="false" />
        </div>
      </template>
      <template #info="{ item }">
        <UCard class="min-h-64">
          <template #header>
            <div>Recurring Run Details</div>
          </template>
          <div>
            <ModuleLabelValue v-model="attribute" />
          </div>
        </UCard>
      </template>
      <template #detail="{ item }">
        <UCard class="min-h-64">
          <MonacoEditor v-model="detail" :options="{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }"
            class="w-full h-96" />
        </UCard>
      </template>
      <template #runs="{ item }">
        <UCard class="min-h-64">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">Runs</h3>
              <div class="flex gap-2">
                <UButton @click="refreshRuns" icon="i-heroicons-arrow-path" variant="ghost" size="sm">
                  새로고침
                </UButton>
              </div>
            </div>
          </template>
          <div class="space-y-4">
            <!-- 필터 입력 -->
            <div>
              <UInput
                v-model="runsFilter"
                placeholder="Filter runs"
                icon="i-heroicons-magnifying-glass"
                size="sm"
              />
            </div>
            <!-- Runs 테이블 -->
            <ModuleDataTable
              v-model:columns="runColumns"
              v-model:data="filteredRuns"
              v-model:pending="runsPending"
            >
              <template #display_name-data="{ row }">
                <UPopover mode="hover">
                  <div class="truncate max-w-64">
                    {{ row.display_name ? row.display_name : '' }}
                  </div>
                  <template #panel>
                    <div class="text-wrap p-4">
                      {{ row.display_name ? row.display_name : '' }}
                    </div>
                  </template>
                </UPopover>
              </template>
              <template #state-data="{ row }">
                <UBadge
                  :color="getStatusBadgeColor(row.state)"
                  :label="getStatusText(row.state)"
                />
              </template>
              <template #created_at-data="{ row }">
                <div class="text-sm">{{ formatDateTime(row.created_at) }}</div>
              </template>
              <template #finished_at-data="{ row }">
                <div class="text-sm">{{ formatDateTime(row.finished_at) }}</div>
              </template>
              <template #pipeline_spec-data="{ row }">
                <span class="text-sm">{{ row.pipeline_spec?.pipeline_name || '-' }}</span>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-2">
                  <UTooltip text="Details">
                    <UButton
                      @click="showRunDetail(row)"
                      icon="i-heroicons-eye"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                  <UTooltip text="Delete">
                    <UButton
                      @click="deleteRun(row.run_id)"
                      icon="i-heroicons-trash"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </div>
        </UCard>
      </template>
    </UTabs>

    <!-- Run Details 모달 -->
    <UModal v-model="showRunDetailModal" :ui="{ width: 'sm:max-w-7xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-information-circle" class="text-blue-500" />
            <h3 class="text-lg font-semibold">Run Details</h3>
          </div>
        </template>
        <div class="h-[600px]">
          <UTabs
            :items="runDetailTabItems"
            :ui="{
              container: 'relative w-full h-full',
              list: { width: 'w-96' },
              base: 'focus:outline-none h-full'
            }"
            class="h-full flex flex-col"
          >
            <template #pipeline="{ item }">
              <div class="w-full h-full border">
                <Workflow
                  v-if="selectedRunPipeline"
                  v-model="selectedRunPipeline"
                  :pannelOpen="false"
                  :isEditable="false"
                />
              </div>
            </template>
            <template #info="{ item }">
              <UCard class="min-h-64">
                <template #header>
                  <div>Run Details</div>
                </template>
                <div>
                  <ModuleLabelValue v-model="selectedRunAttributes" />
                </div>
              </UCard>
            </template>
            <template #detail="{ item }">
              <UCard class="min-h-64">
                <MonacoEditor
                  v-model="selectedRunDetail"
                  :options="{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 13
                  }"
                  class="w-full h-96"
                />
              </UCard>
            </template>
          </UTabs>
        </div>
        <template #footer>
          <div class="flex justify-end">
            <UButton @click="closeRunDetailModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute()

// 기존 상태들
const attribute = ref([
  {
    id: 'recurring_run_id',
    label: 'Recurring Run ID',
    value: ''
  },
  {
    id: 'display_name',
    label: 'Display Name',
    value: ''
  },
  {
    id: 'status',
    label: 'Status',
    value: ''
  },
  {
    id: 'description',
    label: 'Description',
    value: ''
  },
  {
    id: 'created_at',
    label: 'Created at',
    value: ''
  },
  {
    id: 'updated_at',
    label: 'Updated at',
    value: ''
  },
  {
    id: 'mode',
    label: 'Enabled',
    value: ''
  },
  {
    id: 'trigger',
    label: 'Trigger',
    value: ''
  },
  {
    id: 'max_concurrency',
    label: 'Max. concurrent runs',
    value: ''
  },
  {
    id: 'no_catchup',
    label: 'Catchup',
    value: ''
  },
  {
    id: 'service_account',
    label: 'Service Account',
    value: ''
  },
  {
    id: 'experiment_id',
    label: 'Experiment ID',
    value: ''
  },
  {
    id: 'pipeline_id',
    label: 'Pipeline ID',
    value: ''
  },
  {
    id: 'pipeline_version',
    label: 'Pipeline Version',
    value: ''
  }
])

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Recurring Runs',
    to: '/recurring-runs/'
  },
  {
    label: 'Details',
  },
])

const pageTitle = ref('Recurring Run Details')
const pipeline = ref<Pipeline>()
const recurringRunId = ref(route.params.id)
const detail = ref<string>('')
const recurringRunDetails = ref()

// Runs 관련 새로 추가된 상태들
const runs = ref([])
const runsPending = ref(false)
const runsFilter = ref('')
const showRunDetailModal = ref(false)
const selectedRunAttributes = ref([])
const selectedRunDetail = ref('')
const selectedRunPipeline = ref(null)

// 테이블 컬럼 설정
const runColumns = ref([
  {
    key: 'display_name',
    label: '이름'
  },
  {
    key: 'state',
    label: '상태'
  },
  {
    key: 'created_at',
    label: '생성일시'
  },
  {
    key: 'finished_at',
    label: '최종실행일시'
  },
  {
    key: 'actions',
    label: '작업'
  },
])

// Run Detail 탭 설정
const runDetailTabItems = ref([
  {
    slot: 'pipeline',
    label: 'Pipeline'
  },
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'detail',
    label: 'Detail'
  }
])

// 필터링된 데이터
const filteredRuns = computed(() => {
  const safeData = Array.isArray(runs.value) ? runs.value : []
  if (!runsFilter.value) return safeData
  return safeData.filter(item => {
    const fieldValue = item?.display_name || ''
    return fieldValue.toLowerCase().includes(runsFilter.value.toLowerCase())
  })
})

// 유틸리티 함수들
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

function getStatusText(status: string) {
  const textMap = {
    'pending': '대기중',
    'running': '실행중',
    'completed': '완료',
    'succeeded': '성공',
    'failed': '실패',
    'cancelled': '취소됨'
  }
  return textMap[status] || status
}

function getStatusBadgeColor(status: string) {
  const colorMap = {
    'PENDING': 'gray',
    'RUNNING': 'blue',
    'COMPLETED': 'green',
    'SUCCEEDED': 'green',
    'FAILED': 'red',
    'CANCELLED': 'gray'
  }
  return colorMap[status] || 'gray'
}

// formatTrigger 함수에 weeks와 months 추가
const formatTrigger = (trigger) => {
  if (!trigger) return '-'
  if (trigger.cron_schedule?.cron) {
    return `${trigger.cron_schedule.cron}`
  }
  if (trigger.periodic_schedule?.interval_second) {
    const seconds = parseInt(trigger.periodic_schedule.interval_second)
    const months = Math.floor(seconds / (86400 * 30)) // 대략적인 월 계산
    const weeks = Math.floor(seconds / (86400 * 7))
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor(seconds / 60)

    if (months > 0) return `Every ${months} month${months > 1 ? 's' : ''}`
    if (weeks > 0) return `Every ${weeks} week${weeks > 1 ? 's' : ''}`
    if (days > 0) return `Every ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `Every ${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `Every ${minutes} minute${minutes > 1 ? 's' : ''}`
    return `Every ${seconds} second${seconds > 1 ? 's' : ''}`
  }
  return '-'
}

// Runs 관련 함수들
async function loadRuns() {
  runsPending.value = true
  try {
    // recurring run에 대한 runs를 가져오는 API 호출
    // API 함수명은 실제 구현에 맞게 수정해주세요
    const response = await getRunsByRecurringRunId(recurringRunId.value)
    runs.value = response.result?.result || []
  } catch (error) {
    console.error('Runs 로드 실패:', error)
    runs.value = []
  } finally {
    runsPending.value = false
  }
}

async function refreshRuns() {
  await loadRuns()
}

// Run Detail 모달 관련 함수들
async function showRunDetail(run: any) {
  try {
    const response = await getRunDetails(run.run_id)
    const runDetails = response.result

    selectedRunAttributes.value = [
      {
        id: 'run_id',
        label: 'Run ID',
        value: runDetails.run_id || ''
      },
      {
        id: 'display_name',
        label: 'Workflow name',
        value: runDetails.display_name || ''
      },
      {
        id: 'state',
        label: 'Status',
        value: runDetails.state || ''
      },
      {
        id: 'description',
        label: 'Description',
        value: runDetails.description || ''
      },
      {
        id: 'created_at',
        label: 'Created at',
        value: runDetails.created_at || ''
      },
      {
        id: 'scheduled_at',
        label: 'Started at',
        value: runDetails.scheduled_at || ''
      },
      {
        id: 'finished_at',
        label: 'Finished at',
        value: runDetails.finished_at || ''
      }
    ]

    selectedRunDetail.value = JSON.stringify(runDetails.run_details, null, 2)

    // Pipeline 정보 로드 (수정된 부분)
    if (runDetails.pipeline_version_reference) {
      const pipelineId = runDetails.pipeline_version_reference.pipeline_id
      const pipelineVersion = runDetails.pipeline_version_reference.pipeline_version_id

      try {
        const pipelineResponse = await getPipelineDetails(pipelineId, pipelineVersion)

        // 기존 방식: getPipelineDetails에 nodes가 있는 경우
        if (pipelineResponse.result && pipelineResponse.result.nodes && pipelineResponse.result.nodes.length > 0) {
          selectedRunPipeline.value = pipelineResponse.result

          // 기존 상태 매핑 로직 유지
          if (selectedRunPipeline.value?.nodes && runDetails.run_details?.task_details) {
            selectedRunPipeline.value.nodes.forEach((node, i) => {
              const runItem = runDetails.run_details.task_details.find(item => {
                return item.display_name === node.data.attribute.type.replace(/_/g, "-")
              })
              if (runItem) {
                selectedRunPipeline.value.nodes[i].data.state = runItem.state
                selectedRunPipeline.value.nodes[i].data.details = runItem
              }
            })
          }
        }
        // 새로운 방식: getPipelineDetails에 결과가 없거나 빈 경우 getPipelineVersionDetailsKFP 호출
        else {
          try {
            const versionResponse = await getPipelineVersionDetailsKFP(pipelineId, pipelineVersion)
            if (versionResponse.result && versionResponse.result.pipeline_spec) {
              // KFP 스펙을 워크플로우로 변환
              selectedRunPipeline.value = convertKFPToWorkflow(versionResponse.result, runDetails)
            } else {
              // 그래도 데이터가 없는 경우 빈 pipeline
              selectedRunPipeline.value = {
                pipeline_name: 'Unknown Pipeline',
                pipeline_description: '',
                nodes: [],
                edges: [],
                position: [0, 0],
                zoom: 1,
                pipeline_id: pipelineId,
                pipeline_type: 'unknown',
                last_version_id: pipelineVersion,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            }
          } catch (error) {
            console.error('Failed to load pipeline version detail:', error)
            // 에러 발생 시 빈 pipeline
            selectedRunPipeline.value = {
              pipeline_name: 'Error Loading Pipeline',
              pipeline_description: '',
              nodes: [],
              edges: [],
              position: [0, 0],
              zoom: 1,
              pipeline_id: pipelineId,
              pipeline_type: 'error',
              last_version_id: pipelineVersion,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        }
      } catch (error) {
        console.error('Failed to load pipeline details:', error)
        selectedRunPipeline.value = null
      }
    }

    showRunDetailModal.value = true
  } catch (error) {
    console.error('Run 상세 정보 로드 실패:', error)
    alert('Run 상세 정보를 불러오는데 실패했습니다.')
  }
}

function closeRunDetailModal() {
  showRunDetailModal.value = false
  selectedRunAttributes.value = []
  selectedRunDetail.value = ''
  selectedRunPipeline.value = null
}

const deleteRun = async (run_id: string) => {
  if (confirm('delete?')) {
    const response = await removeRun(run_id)
    if (response.code == 130200) {
      alert(`deleted`)
      await refreshRuns()
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

// 기존 함수들
const loadRecurringRunDetails = async () => {
  const response = await getRecurringRunDetails(recurringRunId.value);
  recurringRunDetails.value = response.result;
  let pipeline_id = recurringRunDetails.value.pipeline_version_reference?.pipeline_id
  let pipeline_version = recurringRunDetails.value.pipeline_version_reference?.pipeline_version_id

  // information attribute 값 할당
  attribute.value = attribute.value.map((item: any) => {
    let value = item.value;
    if (item.id === 'trigger') {
      value = formatTrigger(recurringRunDetails.value.trigger)
    } else if (item.id === 'mode') {
      value = recurringRunDetails.value.mode === 'ENABLE' ? 'Yes' : 'No'
    } else if (item.id === 'no_catchup') {
      value = recurringRunDetails.value.no_catchup ? 'false' : 'true'
    } else if (item.id === 'created_at' || item.id === 'updated_at') {
      value = recurringRunDetails.value[item.id] ? new Date(recurringRunDetails.value[item.id]).toLocaleString() : '-'
    } else if (item.id === 'pipeline_id') {
      value = pipeline_id
    } else if (item.id === 'pipeline_version') {
      value = pipeline_version
    } else {
      value = recurringRunDetails.value[item.id] !== undefined ? recurringRunDetails.value[item.id] : '-'
    }
    return {
      ...item,
      value: value
    }
  });

  detail.value = JSON.stringify(recurringRunDetails.value, null, 2)

  // Pipeline 정보 로드 (수정된 부분)
  if (pipeline_id && pipeline_version) {
    try {
      const response2 = await getPipelineDetails(pipeline_id, pipeline_version)

      // 기존 방식: getPipelineDetails에 nodes가 있는 경우
      if (response2.result && response2.result.nodes && response2.result.nodes.length > 0) {
        pipeline.value = response2.result
      }
      // 새로운 방식: getPipelineDetails에 결과가 없거나 빈 경우 getPipelineVersionDetailsKFP 호출
      else {
        try {
          const versionResponse = await getPipelineVersionDetailsKFP(pipeline_id, pipeline_version)
          if (versionResponse.result && versionResponse.result.pipeline_spec) {
            // KFP 스펙을 워크플로우로 변환 (runDetails가 없으므로 빈 객체 전달)
            pipeline.value = convertKFPToWorkflow(versionResponse.result, { run_details: { task_details: [] } })
          } else {
            pipeline.value = {
              pipeline_name: 'Unknown Pipeline',
              pipeline_description: '',
              nodes: [],
              edges: [],
              position: [0, 0],
              zoom: 1,
              pipeline_id: pipeline_id,
              pipeline_type: 'unknown',
              last_version_id: pipeline_version,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        } catch (error) {
          console.error('Failed to load pipeline version detail:', error)
          pipeline.value = {
            pipeline_name: 'Error Loading Pipeline',
            pipeline_description: '',
            nodes: [],
            edges: [],
            position: [0, 0],
            zoom: 1,
            pipeline_id: pipeline_id,
            pipeline_type: 'error',
            last_version_id: pipeline_version,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
    } catch (error) {
      console.error('Failed to load pipeline details:', error)
      pipeline.value = null
    }
  }
}

// 상태 토글 함수 추가
const toggleRecurringRunStatus = async () => {
  const isEnabled = recurringRunDetails.value?.status === 'ENABLED'
  const action = isEnabled ? 'disable' : 'enable'

  if (confirm(`Really ${action} this recurring run?`)) {
    try {
      const response = isEnabled
        ? await disableRecurringRun(recurringRunId.value)
        : await enableRecurringRun(recurringRunId.value)

      if (response.code == 130200) {
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`)
        await loadRecurringRunDetails()
      } else {
        alert("Error[" + response.code + "]: " + response.message)
      }
    } catch (error) {
      alert(`Error ${action}ing recurring run: ${error}`)
    }
  }
}

// 초기화 함수 수정
onBeforeMount(() => {
  loadRecurringRunDetails()
  loadRuns() // Runs 데이터도 함께 로드
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
      label: computed(() => recurringRunDetails.value?.status === 'ENABLED' ? 'Disable' : 'Enable'),
      icon: computed(() => recurringRunDetails.value?.status === 'ENABLED' ? 'i-heroicons-pause' : 'i-heroicons-play'),
      click: toggleRecurringRunStatus
    }
  ]
])

// 탭 아이템에 Runs 탭 추가
const tabItems = ref([
  {
    slot: 'pipeline',
    label: 'Pipeline'
  },
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'detail',
    label: 'Detail'
  },
  {
    slot: 'runs',
    label: 'Runs'
  }
])
</script>

<style scoped>
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>