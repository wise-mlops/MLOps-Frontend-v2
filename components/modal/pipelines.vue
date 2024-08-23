<template>
  <UCard>
    <template #header>
      PIPELINES
    </template>
    <div>
      <ModuleDataTable v-model:columns="pipelineColumns" v-model:data="data" v-model:pending="pending">
        <template #description-data="{ row }">
          <UPopover mode="hover">
            <div class="truncate max-w-48">
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
          <UTooltip text="select">
            <UButton @click="selectPipeline(row.pipeline_id, row.display_name)"
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

const loadPipelines = async () => {
  const response = await getPipelines()
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const selectPipeline = (pipeline_id: string, display_name: string) => {
  pipeline.value.pipeline_id = pipeline_id;
  pipeline.value.display_name = display_name
  isOpen.value = false;
}


onMounted(() => {
  if (isOpen.value) {
    loadPipelines()
  }
})


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