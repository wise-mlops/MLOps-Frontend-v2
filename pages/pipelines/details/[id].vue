<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-96' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col">

      <template #info="{ item }">
        <UCard class="min-h-10 mb-4">
          <template #header>
            <div>Pipeline Information</div>
          </template>
          <div>
            <ModuleLabelValue v-model="pipelineAttributes" />
          </div>
        </UCard>
      </template>

      <template #pipeline="{ item }">
        <div class="w-full h-full border">
          <Workflow v-if="latestPipeline" v-model="latestPipeline" :pannelOpen="false" :isEditable="false" />
          <div v-else class="flex items-center justify-center h-64 text-gray-500">
            파이프라인을 불러오는 중입니다...
          </div>
        </div>
      </template>

      <template #versions="{ item }">
        <UCard class="min-h-64">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold">Pipeline Versions</h3>
              <div class="flex gap-2">
                <UButton @click="showAddVersionModal" icon="i-heroicons-plus" color="primary" size="sm">
                  버전 등록
                </UButton>
              </div>
            </div>
          </template>
          <div class="space-y-4">
            <!-- 필터 입력 -->
            <div>
              <UInput
                v-model="versionsFilter"
                placeholder="Filter versions"
                icon="i-heroicons-magnifying-glass"
                size="sm"
              />
            </div>
            <!-- Versions 테이블 -->
            <ModuleDataTable
              v-model:columns="versionColumns"
              v-model:data="filteredVersions"
              v-model:pending="versionsPending"
            >
              <template #pipeline_name-data="{ row }">
                <UPopover mode="hover">
                  <div class="truncate max-w-64">
                    {{ row.pipeline_name || 'Unnamed Pipeline' }}
                  </div>
                  <template #panel>
                    <div class="text-wrap p-4">
                      {{ row.pipeline_name || 'Unnamed Pipeline' }}
                    </div>
                  </template>
                </UPopover>
              </template>
              <template #pipeline_description-data="{ row }">
                <UPopover mode="hover" v-if="row.pipeline_description">
                  <div class="truncate max-w-48">
                    {{ row.pipeline_description }}
                  </div>
                  <template #panel>
                    <div class="text-wrap p-4 max-w-sm">
                      {{ row.pipeline_description }}
                    </div>
                  </template>
                </UPopover>
                <span v-else class="text-gray-400 text-sm">-</span>
              </template>
              <template #version_id-data="{ row }">
                <div class="text-xs font-mono">{{ row.version_id }}</div>
              </template>
              <template #created_at-data="{ row }">
                <div class="text-sm">{{ formatDateTime(row.created_at) }}</div>
              </template>
              <template #actions-data="{ row }">
                <div class="flex gap-2">
                  <UTooltip text="Details">
                    <UButton
                      @click="showVersionDetail(row)"
                      icon="i-heroicons-eye"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                  <UTooltip text="Delete">
                    <UButton
                      @click="deleteVersion(row.version_id)"
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

    <!-- Version Add Modal -->
    <UModal
      v-model="showAddVersionModalOpen"
      :ui="{ width: 'sm:max-w-[60vw]' }"
      prevent-close
    >
      <div class="w-full h-full flex flex-col" style="height: 80vh;">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b bg-white">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold">Add Pipeline Version</h3>
          </div>
          <UButton @click="closeAddVersionModal" icon="i-heroicons-x-mark" variant="ghost" size="sm" />
        </div>

        <!-- Information Section -->
        <UCard class="m-4 mb-2">
          <div class="flex gap-4">
            <div class="w-1/4">
              <UFormGroup label="NAME" name="version_name" class="py-0">
                <UInput
                  v-model="newVersionPipeline.pipeline_name"
                  placeholder="Input Version Name"
                  variant="outline"
                  size="md"
                  autocomplete="false"
                />
              </UFormGroup>
            </div>
            <div class="w-3/4">
              <UFormGroup label="Description" name="version_description" class="py-0">
                <UInput
                  v-model="newVersionPipeline.pipeline_description"
                  placeholder="Input Description"
                  size="md"
                  autocomplete="false"
                />
              </UFormGroup>
            </div>
          </div>
        </UCard>

        <!-- Pipeline Section -->
        <div class="flex-1 m-4 mt-2 border rounded-lg bg-white shadow">
          <Workflow
            v-if="showAddVersionModalOpen"
            v-model="newVersionPipeline"
            :isEditable="true"
            :key="workflowKey"
          />
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 p-6 border-t bg-white">
          <UButton @click="closeAddVersionModal" variant="ghost">취소</UButton>
          <UButton @click="addPipelineVersion" color="primary" :loading="addingVersion">등록</UButton>
        </div>
      </div>
    </UModal>

    <!-- Version Details 모달 -->
    <UModal v-model="showVersionDetailModal" :ui="{ width: 'sm:max-w-7xl' }" prevent-close>
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold">Pipeline Version Details</h3>
          </div>
        </template>
        <div class="h-[600px]">
          <UTabs
            :items="versionDetailTabItems"
            :ui="{
              container: 'relative w-full h-full',
              list: { width: 'w-96' },
              base: 'focus:outline-none h-full'
            }"
            class="h-full flex flex-col"
          >
            <template #info="{ item }">
              <UCard class="min-h-64">
                <template #header>
                  <div>Version Details</div>
                </template>
                <div>
                  <ModuleLabelValue v-model="selectedVersionAttributes" />
                </div>
              </UCard>
            </template>
            <template #pipeline="{ item }">
              <div class="w-full h-full border">
                <Workflow
                  v-if="selectedVersionPipeline"
                  v-model="selectedVersionPipeline"
                  :pannelOpen="false"
                  :isEditable="false"
                />
                <div v-else class="flex items-center justify-center h-64 text-gray-500">
                  파이프라인을 불러오는 중입니다...
                </div>
              </div>
            </template>
            <template #detail="{ item }">
              <UCard class="min-h-64">
                <MonacoEditor
                  v-model="selectedVersionDetail"
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
            <UButton @click="closeVersionDetailModal" variant="ghost">닫기</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core';

const router = useRouter();
const route = useRoute()
const { toObject } = useVueFlow()

// 기본 정보
const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Pipelines',
    to: '/pipelines/'
  },
  {
    label: 'Details',
  },
])

const pageTitle = ref('Pipeline Details')
const pipelineId = ref(route.params.id)

// 파이프라인 정보
const pipelineInfo = ref({})
const latestPipeline = ref<Pipeline>()
const pipelineAttributes = ref([
  {
    id: 'pipeline_id',
    label: 'Pipeline ID',
    value: ''
  },
  {
    id: 'pipeline_name',
    label: 'Pipeline Name',
    value: ''
  },
  {
    id: 'pipeline_description',
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
    id: 'last_version_id',
    label: 'Latest Version',
    value: ''
  },
  {
    id: 'pipeline_type',
    label: 'Pipeline Type',
    value: ''
  }
])

// 버전 관련 상태
const versions = ref([])
const versionsPending = ref(false)
const versionsFilter = ref('')

// 버전 테이블 컬럼 (Description 컬럼 추가)
const versionColumns = ref([
  {
    key: 'pipeline_name',
    label: '버전명'
  },
  {
    key: 'pipeline_description',
    label: '설명'
  },
  {
    key: 'version_id',
    label: '버전 ID'
  },
  {
    key: 'created_at',
    label: '생성일시'
  },
  {
    key: 'actions',
    label: '작업'
  },
])

// 필터링된 버전 데이터
const filteredVersions = computed(() => {
  const safeData = Array.isArray(versions.value) ? versions.value : []
  if (!versionsFilter.value) return safeData
  return safeData.filter(item => {
    const nameValue = item?.pipeline_name || ''
    const descValue = item?.pipeline_description || ''
    const filterLower = versionsFilter.value.toLowerCase()
    return nameValue.toLowerCase().includes(filterLower) ||
           descValue.toLowerCase().includes(filterLower)
  })
})

// 버전 추가 모달
const showAddVersionModalOpen = ref(false)
const addingVersion = ref(false)
const workflowKey = ref(0) // 워크플로우 강제 리렌더링용
const newVersionPipeline = ref<Pipeline>({
  pipeline_name: '',
  pipeline_description: '',
  nodes: [],
  edges: [],
  position: [0, 0],
  zoom: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
  created_at: new Date(),
  updated_at: new Date(),
})

// 버전 상세 모달
const showVersionDetailModal = ref(false)
const selectedVersionAttributes = ref([])
const selectedVersionDetail = ref('')
const selectedVersionPipeline = ref(null)

// 버전 상세 탭
const versionDetailTabItems = ref([
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'pipeline',
    label: 'Pipeline'
  },
  {
    slot: 'detail',
    label: 'Detail'
  }
])

// 유틸리티 함수
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// 데이터 새로고침
const refreshData = async () => {
  await loadVersions()
  await loadLatestPipelineInfo()
}

// 최신 파이프라인 정보 로드
const loadLatestPipelineInfo = async () => {
  try {
    const versionsResponse = await getPipelineVersions(pipelineId.value)
    const latestVersionId = versionsResponse.result?.result?.[0]?.version_id

    if (latestVersionId) {
      const response = await getPipelineDetails(pipelineId.value, latestVersionId)

      if (response.result) {
        const data = response.result
        pipelineInfo.value = data
        latestPipeline.value = data

        // 속성 값 설정
        pipelineAttributes.value = pipelineAttributes.value.map((item: any) => {
          let value = data[item.id] || '-'
          if (item.id === 'created_at' || item.id === 'updated_at') {
            value = value !== '-' ? formatDateTime(value) : '-'
          }
          return {
            ...item,
            value: value
          }
        })
      }
    }
  } catch (error) {
    console.error('Failed to load pipeline info:', error)
  }
}

// 버전 목록 로드
const loadVersions = async () => {
  versionsPending.value = true
  try {
    const response = await getPipelineVersions(pipelineId.value)
    versions.value = response.result?.result || []
  } catch (error) {
    console.error('Failed to load versions:', error)
    versions.value = []
  } finally {
    versionsPending.value = false
  }
}

// 버전 추가 모달 열기
const showAddVersionModal = () => {
  // 새 버전 폼 초기화
  newVersionPipeline.value = {
    pipeline_name: '',
    pipeline_description: '',
    nodes: [],
    edges: [],
    position: [0, 0],
    zoom: 1,
    viewport: { x: 0, y: 0, zoom: 1 },
    created_at: new Date(),
    updated_at: new Date(),
  }
  workflowKey.value++ // 워크플로우 강제 리렌더링
  showAddVersionModalOpen.value = true
}

// 버전 추가 모달 닫기
const closeAddVersionModal = () => {
  showAddVersionModalOpen.value = false
}

// 파이프라인 버전 추가
const addPipelineVersion = async () => {
  if (!newVersionPipeline.value.pipeline_name) {
    alert('버전 이름을 입력해주세요.')
    return
  }

  addingVersion.value = true
  try {
    // Workflow에서 현재 상태 가져오기
    const pipelineObject = toObject();
    newVersionPipeline.value.nodes = pipelineObject.nodes;
    newVersionPipeline.value.edges = pipelineObject.edges;
    newVersionPipeline.value.position = pipelineObject.position;
    newVersionPipeline.value.zoom = 1;
    newVersionPipeline.value.viewport = pipelineObject.viewport;

    // 파이프라인 ID 설정
    newVersionPipeline.value.pipeline_id = pipelineId.value;

    const response = await createPipelineVersion(pipelineId.value, newVersionPipeline.value)
    if (response.code === 130200) {
      alert('버전이 성공적으로 등록되었습니다.')
      closeAddVersionModal()
      await refreshData()
    } else {
      alert(`오류[${response.code}]: ${response.message}`)
    }
  } catch (error) {
    console.error('Failed to add version:', error)
    alert('버전 등록에 실패했습니다.')
  } finally {
    addingVersion.value = false
  }
}

// 버전 상세 보기
const showVersionDetail = async (version: any) => {
  try {
    const response = await getPipelineDetails(pipelineId.value, version.version_id)

    if (response.result) {
      const versionDetails = response.result

      selectedVersionAttributes.value = [
        {
          id: 'version_id',
          label: 'Version ID',
          value: version.version_id || ''
        },
        {
          id: 'pipeline_name',
          label: 'Version Name',
          value: version.pipeline_name || ''
        },
        {
          id: 'pipeline_description',
          label: 'Description',
          value: version.pipeline_description || ''
        },
        {
          id: 'created_at',
          label: 'Created at',
          value: formatDateTime(version.created_at) || ''
        },
        {
          id: 'pipeline_type',
          label: 'Pipeline Type',
          value: versionDetails.pipeline_type || ''
        }
      ]

      selectedVersionDetail.value = JSON.stringify(versionDetails, null, 2)
      selectedVersionPipeline.value = versionDetails

      showVersionDetailModal.value = true
    }
  } catch (error) {
    console.error('Failed to load version details:', error)
    alert('버전 상세 정보를 불러오는데 실패했습니다.')
  }
}

// 버전 상세 모달 닫기
const closeVersionDetailModal = () => {
  showVersionDetailModal.value = false
  selectedVersionAttributes.value = []
  selectedVersionDetail.value = ''
  selectedVersionPipeline.value = null
}

// 버전 삭제
const deleteVersion = async (versionId: string) => {
  if (confirm('정말로 이 버전을 삭제하시겠습니까?')) {
    try {
      const response = await removePipelineVersion(pipelineId.value, versionId)
      if (response.code === 130200) {
        alert('버전이 삭제되었습니다.')
        await refreshData()
      } else {
        alert(`오류[${response.code}]: ${response.message}`)
      }
    } catch (error) {
      console.error('Failed to delete version:', error)
      alert('버전 삭제에 실패했습니다.')
    }
  }
}

// 초기화
onBeforeMount(async () => {
  await loadVersions()
  await loadLatestPipelineInfo()
})

// toolbar links (새로고침 버튼 추가)
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
      label: '새로고침',
      icon: 'i-heroicons-arrow-path',
      click: refreshData
    }
  ]
])

// 탭 아이템
const tabItems = ref([
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'pipeline',
    label: 'Pipeline'
  },
  {
    slot: 'versions',
    label: 'Versions'
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