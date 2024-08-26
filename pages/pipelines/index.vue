<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="pipelineColumns" v-model:data="data" v-model:pending="pending">\
      <template #expand="{ row }" :on-click="test">
        <div class="px-8 bg-slate-100 dark:bg-slate-800">
          <PipelinesPipelineVersionList v-model:pipeline-id="row.pipeline_id" />
        </div>
      </template>
      <template #pipeline_name-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.pipeline_name ? row.pipeline_name : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.pipeline_name ? row.pipeline_name : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #pipeline_description-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.pipeline_description ? row.pipeline_description : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.pipeline_description ? row.pipeline_description : '' }}
            </div>
          </template>
        </UPopover>
      </template>

      <template #updated_at-data="{ row }">
        <div>
          {{ new Date(row.updated_at).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <UTooltip text="detail">
          <UButton @click="pipelineDetail(row.pipeline_id, row.last_version_id)" icon="i-heroicons-pencil-square"
            variant="ghost" class="px-2 py-0" />
        </UTooltip>
        <UTooltip text="delete">
          <UButton @click="deletePipeline(row.pipeline_id)" icon="i-heroicons-trash" variant="ghost"
            class="px-2 py-0" />
        </UTooltip>
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
    label: 'Pipelines',
  },
])
const pageTitle = ref('Pipelines')
const pending = ref(true)
const data = ref([])

const loadPipelies = async () => {
  const response = await getPipelines();
  data.value = response.result ? response.result.result : []
  console.log(data.value)
  pending.value = false;
}

const reloadPipelines = () => {
  pending.value = true;
  data.value = []
  loadPipelies();
}

const pipelineDetail = (pipelineId: string, pipelineVersion: string) => {
  navigateTo(`/pipelines/details/${pipelineId}?version=${pipelineVersion}`);
}

const deletePipeline = async (pipelineId: string) => {
  if (confirm('delete?')) {
    const response = await removePipeline(pipelineId)

    if (response.code == 130200) {
      alert(`deleted`)
      reloadPipelines();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

onMounted(() => {
  loadPipelies();
})

const test = () => {
  console.log('test');
}


// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadPipelines
    },
    {
      label: '등록',
      icon: 'i-heroicons-plus-circle',
      to: '/pipelines/add'
    }]
])

const pipelineColumns = ref([
  {
    key: 'pipeline_name',
    label: '이름'
  },
  {
    key: 'pipeline_description',
    label: '설명'
  },
  {
    key: 'updated_at',
    label: '최종갱신'
  },
  {
    key: 'action',
    label: '작업'
  },
])

</script>

<style></style>