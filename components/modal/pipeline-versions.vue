<template>
  <UCard>
    <template #header>
      PIPELINE VERSIONS
    </template>
    <div>
      <ModuleDataTable v-model:columns="pipelineVersionColumns" v-model:data="data" v-model:pending="pending">
        <template #created_at-data="{ row }">
          <div>
            {{ new Date(row.created_at).toLocaleString() }}
          </div>
        </template>
        <template #action-data="{ row }">
          <UTooltip text="select">
            <UButton @click="selectPipelineVersion(row.pipeline_version_id, row.display_name)"
              icon="i-heroicons-arrow-right-start-on-rectangle" variant="ghost" class="p-1 mx-2" />
          </UTooltip>
        </template>
      </ModuleDataTable>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const pending = ref(true)
const data = ref([])

const isOpen = defineModel('isOpen')
const pipeline = defineModel<{
  pipeline_id: string;
  display_name: string;
}>('pipeline', {
  default: {
    pipeline_id: '',
    display_name: ''
  }
})

const pipelineVersion = defineModel<{
  pipeline_version_id: string;
  display_name: string;
}>('pipelineVersion', {
  default: {
    pipeline_version_id: '',
    display_name: ''
  }
})

const loadPipelineVersions = async () => {

  const response = await getPipelineVersions(pipeline.value.pipeline_id)
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const selectPipelineVersion = (pipeline_version_id: string, display_name: string) => {
  pipelineVersion.value.pipeline_version_id = pipeline_version_id;
  pipelineVersion.value.display_name = display_name;
  isOpen.value = false;
}

onMounted(() => {
  if (isOpen.value) {
    loadPipelineVersions()
  }
})


const pipelineVersionColumns = ref([
  {
    key: 'display_name',
    label: '이름'
  },
  {
    key: 'created_at',
    label: '최종갱신'
  },
  {
    key: 'action',
    label: '상세보기'
  },
])

</script>