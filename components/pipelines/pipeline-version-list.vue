<template>
  <div>
    <UTable :rows="pipelineVersions" :columns="pipelineVersionColumns" :loading="pending"
      :loading-state="{ icon: 'i-heroicons-arrow-path', label: 'Loading' }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'No items.' }">
      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <div>
          <UButton @click="pipelineVersionDetail(row.pipeline_id, row.pipeline_version_id)"
            icon="i-heroicons-pencil-square" variant="ghost" class="px-2 py-0" />
        </div>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
const pipelineId = defineModel<string>('pipelineId', { default: '' })
const pending = ref(true)
const pipelineVersions = ref<any>([])

const loadPipelineVersion = async () => {
  pending.value = true;
  const response = await getPipelineVersions(pipelineId.value)
  pipelineVersions.value = response.result ? response.result.pipeline_versions : []
  pending.value = false;
}

const pipelineVersionDetail = (pipelineId: string, pipelineVersion: string) => {
  navigateTo(`/pipelines/details/${pipelineId}?version=${pipelineVersion}`);
}

onMounted(() => {
  loadPipelineVersion();
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
