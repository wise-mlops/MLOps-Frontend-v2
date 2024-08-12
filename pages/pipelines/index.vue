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
      <template #display_name-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate w-96">
            {{ row.display_name ? row.display_name : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.display_name ? row.display_name : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #description-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate w-96">
            {{ row.description ? row.description : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.description ? row.description : '' }}
            </div>
          </template>
        </UPopover>
      </template>

      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <div>
          <UButton @click="detailPipeline" icon="i-heroicons-pencil-square" variant="ghost" class="px-2 py-0" />
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
    label: 'Pipelines',
  },
])
const pageTitle = ref('Pipelines')
const pending = ref(true)
const data = ref([])

const loadPipelies = async () => {
  const response = await getPipelines();
  data.value = response.result ? response.result.pipelines : []
  pending.value = false;
}

const reloadPipelines = () => {
  pending.value = true;
  data.value = []
  loadPipelies();
}

const detailPipeline = (pipelineId: string) => {
  navigateTo(`/pipelines/details/${pipelineId}`)
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
    key: 'display_name',
    label: '이름'
  },
  {
    key: 'description',
    label: '설명'
  },
  {
    key: 'created_at',
    label: '최종갱신'
  },
  {
    key: 'action',
    label: '작업'
  },
])

</script>

<style></style>