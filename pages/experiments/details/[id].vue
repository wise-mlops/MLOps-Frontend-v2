<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <div class="flex-1 p-4 space-y-6">
      <!-- 실험 정보 + Recurring runs 카드 (가로 분할) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 실험 정보 카드 (왼쪽) -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">실험 정보</h3>
            </div>
          </template>
          <ModuleLabelValue v-model="experimentInfo" />
        </UCard>
        <!-- Recurring runs 카드 (오른쪽) -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">Recurring runs</h3>
              <div class="flex gap-2">
                <UButton @click="refreshRecurringRuns" icon="i-heroicons-arrow-path" variant="ghost" size="sm">
                  새로고침
                </UButton>
              </div>
            </div>
          </template>
          <div class="space-y-4">
            <!-- 필터 입력 -->
            <div>
              <UInput
                v-model="recurringRunsFilter"
                placeholder="Filter recurring runs"
                icon="i-heroicons-magnifying-glass"
                size="sm"
              />
            </div>
            <!-- Recurring runs 테이블 -->
            <ModuleDataTable
              v-model:columns="recurringRunsColumns"
              v-model:data="filteredRecurringRuns"
              v-model:pending="recurringRunsPending"
              :rows="3"
            >
              <template #display_name-data="{ row }">
                <UPopover mode="hover">
                  <div class="truncate max-w-36">
                    {{ row.display_name ? row.display_name : '' }}
                  </div>
                  <template #panel>
                    <div class="text-wrap p-4">
                      {{ row.display_name ? row.display_name : '' }}
                    </div>
                  </template>
                </UPopover>
              </template>
              <template #status-data="{ row }">
                <div>
                  <UBadge
                    :color="row.status === 'ENABLED' ? 'blue' : 'gray'"
                    :variant="row.status === 'ENABLED' ? 'solid' : 'outline'"
                    :label="row.status === 'ENABLED' ? 'ENABLED' : 'DISABLED'"
                  />
                </div>
              </template>
              <template #created_at-data="{ row }">
                <div class="text-sm">{{ formatDateTime(row.created_at) }}</div>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-2">
                  <UTooltip :text="row.status === 'ENABLED' ? '정지' : '실행'">
                    <UButton
                      @click="toggleRecurringRunStatus(row)"
                      :icon="row.status === 'ENABLED' ? 'i-heroicons-pause' : 'i-heroicons-play'"
                      variant="ghost"
                      class="p-1 mx-2"
                    />
                  </UTooltip>
                  <UTooltip text="details">
                    <UButton
                      @click="showRecurringRunDetail(row)"
                      icon="i-heroicons-eye"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                  <UTooltip text="delete">
                    <UButton @click="deleteRecurringRun(row.recurring_run_id)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
                  </UTooltip>
                </div>
              </template>
            </ModuleDataTable>
          </div>
        </UCard>
      </div>

      <!-- Runs 카드 -->
      <UCard>
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
        <!-- 필터 입력 -->
        <div>
          <UInput
            v-model="runsFilter"
            placeholder="Filter runs"
            icon="i-heroicons-magnifying-glass"
            size="sm"
          />
        </div>
        <ModuleDataTable
          v-model:columns="runColumns"
          v-model:data="filteredRuns"
          v-model:pending="runsPending"
          :rows="5"
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
          <template #pipeline_version_reference.pipeline_id-data="{ row }">
            <UPopover mode="hover">
              <div class="truncate max-w-36">
                {{ row.pipeline_version_reference.pipeline_id ? row.pipeline_version_reference.pipeline_id : '' }}
              </div>
              <template #panel>
                <div class="text-wrap p-4">
                  {{ row.pipeline_version_reference.pipeline_id ? row.pipeline_version_reference.pipeline_id : '' }}
                </div>
              </template>
            </UPopover>
          </template>
          <template #created_at-data="{ row }">
            <div class="text-sm">{{ formatDateTime(row.created_at) }}</div>
          </template>
          <template #finished_at-data="{ row }">
            <div class="text-sm">{{ formatDateTime(row.finished_at) }}</div>
          </template>
          <template #actions-data="{ row }">
            <div class="flex gap-2">
              <UTooltip text="details">
                <UButton
                  @click="showRunDetail(row)"
                  icon="i-heroicons-eye"
                  variant="ghost"
                  size="sm"
                />
              </UTooltip>
              <UTooltip text="delete">
                <UButton @click="deleteRun(row.run_id)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
              </UTooltip>
            </div>
          </template>
        </ModuleDataTable>
      </UCard>
    </div>

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

    <!-- Recurring Run Details 모달 -->
    <UModal v-model="showRecurringRunDetailModal" :ui="{ width: 'sm:max-w-7xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="text-blue-500" />
            <h3 class="text-lg font-semibold">Recurring Run Details</h3>
          </div>
        </template>
        <div class="h-[600px]">
          <UTabs
            :items="recurringRunDetailTabItems"
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
                  v-if="selectedRecurringRunPipeline"
                  v-model="selectedRecurringRunPipeline"
                  :pannelOpen="false"
                  :isEditable="false"
                />
              </div>
            </template>
            <template #info="{ item }">
              <UCard class="min-h-64">
                <template #header>
                  <div>Recurring Run Details</div>
                </template>
                <div>
                  <ModuleLabelValue v-model="selectedRecurringRunAttributes" />
                </div>
              </UCard>
            </template>
            <template #detail="{ item }">
              <UCard class="min-h-64">
                <MonacoEditor
                  v-model="selectedRecurringRunDetail"
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
          <div class="flex justify-end gap-2">
            <UButton @click="closeRecurringRunDetailModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute();

// URL에서 실험 ID 추출
const experimentId = ref(route.params.id as string);

// 상태 관리
const experimentInfo = ref([
  {
    id: 'experiment_id',
    label: 'Experiment ID',
    value: ''
  },
  {
    id: 'display_name',
    label: 'Experiment name',
    value: ''
  },
  {
    id: 'description',
    label: 'Description',
    value: ''
  },
  {
    id: 'namespace',
    label: 'Namespace',
    value: ''
  },
  {
    id: 'storage_state',
    label: 'Storage State',
    value: ''
  },
  {
    id: 'created_at',
    label: 'Created at',
    value: ''
  }
])

const experimentDetails = ref({});
const runs = ref([]);
const runsPending = ref(false);
const runsFilter = ref('');

// Recurring runs 관련 상태
const recurringRuns = ref([]);
const recurringRunsPending = ref(false);
const recurringRunsFilter = ref('');

// 모달 상태
const showRunDetailModal = ref(false);
const showRecurringRunDetailModal = ref(false);

// Run Detail 모달 관련 상태
const selectedRunAttributes = ref([]);
const selectedRunDetail = ref('');
const selectedRunPipeline = ref(null);

// Recurring Run Detail 모달 관련 상태
const selectedRecurringRunAttributes = ref([]);
const selectedRecurringRunDetail = ref('');
const selectedRecurringRunPipeline = ref(null);

// 페이지 정보
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'Experiments', to: '/experiments/' },
  { label: 'Details' }
]);
const pageTitle = ref('Experiment Details');

// 툴바 설정
const toolbarLinks = ref([
  [
    { label: '뒤로', icon: 'i-heroicons-arrow-uturn-left', click: () => router.back() }
  ],
  [
    { label: '새로고침', icon: 'i-heroicons-arrow-path', click: refreshAllData }
  ]
]);

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
    key: 'pipeline_version_reference.pipeline_id',
    label: 'Pipeline'
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

// Recurring runs 컬럼 설정
const recurringRunsColumns = ref([
  { key: 'display_name', label: 'Run name' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created at', sortable: true },
  { key: 'actions', label: '작업' }
]);

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
]);

// Recurring Run Detail 탭 설정
const recurringRunDetailTabItems = ref([
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
]);

// 헬퍼 함수 생성
const safeFilter = (data: any[], filterValue: string, field: string = 'display_name') => {
  const safeData = Array.isArray(data) ? data : [];
  if (!filterValue) return safeData;
  return safeData.filter(item => {
    const fieldValue = item?.[field] || '';
    return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
  });
};

// 필터링된 데이터
const filteredRuns = computed(() =>
  safeFilter(runs.value, runsFilter.value)
);

const filteredRecurringRuns = computed(() =>
  safeFilter(recurringRuns.value, recurringRunsFilter.value)
);

// 유틸리티 함수들
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
};

function getStatusText(status: string) {
  const textMap = {
    'pending': '대기중',
    'running': '실행중',
    'completed': '완료',
    'succeeded': '성공',
    'failed': '실패',
    'cancelled': '취소됨'
  };
  return textMap[status] || status;
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

// Recurring runs 관련 함수들
const toggleRecurringRunStatus = async (recurring_run: any) => {
  const isEnabled = recurring_run.status === 'ENABLED'
  const action = isEnabled ? 'disable' : 'enable'

  if (confirm(`Really ${action} this recurring run?`)) {
    try {
      const response = isEnabled
        ? await disableRecurringRun(recurring_run.recurring_run_id)
        : await enableRecurringRun(recurring_run.recurring_run_id)

      if (response.code == 130200) {
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`)
        await refreshRecurringRuns()
      } else {
        alert("Error[" + response.code + "]: " + response.message)
      }
    } catch (error) {
      alert(`Error ${action}ing recurring run: ${error}`)
    }
  }
}

const deleteRecurringRun = async (recurring_run_id: string) => {
  if (confirm('delete?')) {
    const response = await removeRecurringRun(recurring_run_id)

    if (response.code == 130200) {
      alert(`deleted`)
      await refreshRecurringRuns();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

// Recurring Run 상세보기 모달 함수들
async function showRecurringRunDetail(recurringRun: any) {
  try {
    // Recurring Run 상세 정보 로드
    const response = await getRecurringRunDetails(recurringRun.recurring_run_id);
    const recurringRunDetails = response.result;

    // 기본 속성 설정
    selectedRecurringRunAttributes.value = [
      {
        id: 'recurring_run_id',
        label: 'Recurring Run ID',
        value: recurringRunDetails.recurring_run_id || ''
      },
      {
        id: 'display_name',
        label: 'Display Name',
        value: recurringRunDetails.display_name || ''
      },
      {
        id: 'status',
        label: 'Status',
        value: recurringRunDetails.status || ''
      },
      {
        id: 'description',
        label: 'Description',
        value: recurringRunDetails.description || ''
      },
      {
        id: 'created_at',
        label: 'Created at',
        value: recurringRunDetails.created_at ? new Date(recurringRunDetails.created_at).toLocaleString() : '-'
      },
      {
        id: 'updated_at',
        label: 'Updated at',
        value: recurringRunDetails.updated_at ? new Date(recurringRunDetails.updated_at).toLocaleString() : '-'
      },
      {
        id: 'mode',
        label: 'Enabled',
        value: recurringRunDetails.mode === 'ENABLE' ? 'Yes' : 'No'
      },
      {
        id: 'trigger',
        label: 'Trigger',
        value: formatTrigger(recurringRunDetails.trigger)
      },
      {
        id: 'max_concurrency',
        label: 'Max. concurrent runs',
        value: recurringRunDetails.max_concurrency || '-'
      },
      {
        id: 'no_catchup',
        label: 'Catchup',
        value: recurringRunDetails.no_catchup ? 'false' : 'true'
      },
      {
        id: 'service_account',
        label: 'Service Account',
        value: recurringRunDetails.service_account || '-'
      },
      {
        id: 'experiment_id',
        label: 'Experiment ID',
        value: recurringRunDetails.experiment_id || '-'
      },
      {
        id: 'pipeline_id',
        label: 'Pipeline ID',
        value: recurringRunDetails.pipeline_version_reference?.pipeline_id || '-'
      },
      {
        id: 'pipeline_version',
        label: 'Pipeline Version',
        value: recurringRunDetails.pipeline_version_reference?.pipeline_version_id || '-'
      }
    ];

    // 상세 정보 설정
    selectedRecurringRunDetail.value = JSON.stringify(recurringRunDetails, null, 2);

    // Pipeline 정보 로드
    if (recurringRunDetails.pipeline_version_reference) {
      const pipelineId = recurringRunDetails.pipeline_version_reference.pipeline_id;
      const pipelineVersion = recurringRunDetails.pipeline_version_reference.pipeline_version_id;
      const pipelineResponse = await getPipelineDetails(pipelineId, pipelineVersion);
      selectedRecurringRunPipeline.value = pipelineResponse.result;
    }

    showRecurringRunDetailModal.value = true;
  } catch (error) {
    console.error('Recurring Run 상세 정보 로드 실패:', error);
    alert('Recurring Run 상세 정보를 불러오는데 실패했습니다.');
  }
}

function closeRecurringRunDetailModal() {
  showRecurringRunDetailModal.value = false;
  selectedRecurringRunAttributes.value = [];
  selectedRecurringRunDetail.value = '';
  selectedRecurringRunPipeline.value = null;
}

// 모달 관련 함수들
async function showRunDetail(run: any) {
  try {
    // Run 상세 정보 로드
    const response = await getRunDetails(run.run_id);
    const runDetails = response.result;

    // 기본 속성 설정
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
    ];

    // 상세 정보 설정
    selectedRunDetail.value = JSON.stringify(runDetails.run_details, null, 2);

    // Pipeline 정보 로드
    if (runDetails.pipeline_version_reference) {
      const pipelineId = runDetails.pipeline_version_reference.pipeline_id;
      const pipelineVersion = runDetails.pipeline_version_reference.pipeline_version_id;
      const pipelineResponse = await getPipelineDetails(pipelineId, pipelineVersion);
      selectedRunPipeline.value = pipelineResponse.result;

      // Pipeline 노드에 실행 상태 적용
      if (selectedRunPipeline.value?.nodes && runDetails.run_details?.task_details) {
        selectedRunPipeline.value.nodes.forEach((node, i) => {
          const runItem = runDetails.run_details.task_details.find(item => {
            return item.display_name === node.data.attribute.type.replace(/_/g, "-");
          });
          if (runItem) {
            selectedRunPipeline.value.nodes[i].data.state = runItem.state;
            selectedRunPipeline.value.nodes[i].data.details = runItem;
          }
        });
      }
    }

    showRunDetailModal.value = true;
  } catch (error) {
    console.error('Run 상세 정보 로드 실패:', error);
    alert('Run 상세 정보를 불러오는데 실패했습니다.');
  }
}

function closeRunDetailModal() {
  showRunDetailModal.value = false;
  selectedRunAttributes.value = [];
  selectedRunDetail.value = '';
  selectedRunPipeline.value = null;
}

async function refreshRuns() {
  await loadRuns();
}

async function refreshRecurringRuns() {
  await loadRecurringRuns();
}

async function refreshAllData() {
  await Promise.all([
    loadExperimentData(),
    loadRuns(),
    loadRecurringRuns()
  ]);
}

function editExperiment() {
  router.push(`/experiments/${experimentId.value}/edit`);
}

const deleteRun = async (run_id: string) => {
  if (confirm('delete?')) {
    const response = await removeRun(run_id)
    if (response.code == 130200) {
      alert(`deleted`)
      await refreshRuns();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

// 데이터 로딩 함수들
async function loadExperimentData() {
  try {
    const response = await getExperimentDetails(experimentId.value);
    experimentDetails.value = response.result
    experimentInfo.value = experimentInfo.value.map((item: any) => ({
      ...item,
      value: experimentDetails.value[item.id] !== undefined ? experimentDetails.value[item.id] : item.value
    }));
  } catch (error) {
    console.error('실험 데이터 로드 실패:', error);
  }
}

async function loadRuns() {
  runsPending.value = true;
  try {
    const response = await getRunsByExperimentKey(experimentId.value);
    runs.value = response.result?.result || []; // 안전한 접근
  } catch (error) {
    console.error('Runs 로드 실패:', error);
    runs.value = []; // 에러 시 빈 배열로 설정
  } finally {
    runsPending.value = false; // 항상 false로 설정
  }
}

async function loadRecurringRuns() {
  recurringRunsPending.value = true;
  try {
    const response = await getRecurringRunsByExperimentKey(experimentId.value);
    recurringRuns.value = response.result?.result || []; // 안전한 접근
  } catch (error) {
    console.error('Recurring runs 로드 실패:', error);
    recurringRuns.value = []; // 에러 시 빈 배열로 설정
  } finally {
    recurringRunsPending.value = false; // 항상 false로 설정
  }
}

// 라이프사이클
onMounted(() => {
  loadExperimentData();
  loadRuns();
  loadRecurringRuns();
});
</script>

<style scoped>
.truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>