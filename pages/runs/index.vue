<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="pipelineColumns" v-model:data="data" v-model:pending="pending">
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
      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #finished_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #experiment_id-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.experiment_id ? row.experiment_id : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.experiment_id ? row.experiment_id : '' }}
            </div>
          </template>
        </UPopover>
      </template>

      <template #pipeline_spec-data="{ row }">
        {{ row.pipeline_spec.pipelineInfo.name }}
      </template>
      <template #detail-data="{ row }">
        <div>
          <UButton>상세보기</UButton>
        </div>
      </template>

    </ModuleDataTable>
  </div>
</template>

<script lang="ts" setup>
const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Runs',
  },
])
const pageTitle = ref('Runs')
const pending = ref(true)
const data = ref([])

const loadRuns = async () => {
  const response = await getRuns(null);
  data.value = response.result ? response.result.runs : []
  console.log(data)
  pending.value = false;
}

const reloadRuns = () => {
  pending.value = true;
  data.value = []
  loadRuns();
}

onMounted(() => {
  loadRuns();
})
// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadRuns
    },
    {
      label: '등록',
      icon: 'i-heroicons-pencil-square-solid',
      to: '/runs/add'
    }]
])

const pipelineColumns = ref([
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
    key: 'experiment_id',
    label: 'Experiment'
  },
  {
    key: 'pipeline_spec',
    label: 'Pipeline'
  },
  {
    key: 'detail',
    label: '상세보기'
  },
])
</script>

<style></style>