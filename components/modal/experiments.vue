<template>
  <UCard>
    <template #header>
      EXPERIMENTS
    </template>
    <div>
      <ModuleDataTable v-model:columns="experimentColumns" v-model:data="data" v-model:pending="pending">
        <template #created_at-data="{ row }">
          <div>
            {{ new Date(row.created_at).toLocaleString() }}
          </div>
        </template>

        <template #action-data="{ row }">
          <UTooltip text="select">
            <UButton @click="selectExperiment(row.experiment_id, row.display_name)"
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


const experiment = defineModel<{
  experiment_id: string;
  display_name: string;
}>('experiment', {
  default: {
    experiment_id: '',
    display_name: ''
  }
})

const loadExperiments = async () => {
  const response = await getExperiments()
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const selectExperiment = (experiment_id: string, display_name: string) => {
  experiment.value.experiment_id = experiment_id
  experiment.value.display_name = display_name
  isOpen.value = false
}

onMounted(() => {
  if (isOpen.value) {
    loadExperiments();
  }
})

const experimentColumns = ref([
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
    label: '생성일시'
  },
  {
    key: 'storage_state',
    label: 'Storage'
  },
  {
    key: 'action',
    label: '작업'
  }
])

</script>