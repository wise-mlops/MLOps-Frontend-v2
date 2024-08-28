<template>
  <div>
    <UTable :rows="pipelineVersions" :columns="pipelineVersionColumns" :loading="pending"
      :loading-state="{ icon: 'i-heroicons-arrow-path', label: '' }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'No items.' }"
      :ui="{ loadingState: { wrapper: 'py-0' } }">
      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <UTooltip text="detail">
          <UButton @click="pipelineVersionDetail(row.pipeline_id, row.version_id)" icon="i-heroicons-pencil-square"
            variant="ghost" class="px-2 py-0" />
        </UTooltip>
        <UTooltip text="delete">
          <UButton @click="deletePipelineVersion(row.pipeline_id, row.version_id)" icon="i-heroicons-trash"
            variant="ghost" class="px-2 py-0" />
        </UTooltip>

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
  pipelineVersions.value = response.result ? response.result.result : []
  pending.value = false;
}

const pipelineVersionDetail = (pipelineId: string, pipelineVersion: string) => {
  navigateTo(`/pipelines/details/${pipelineId}?version=${pipelineVersion}`);
}

const deletePipelineVersion = async (pipelineId: string, pipelineVersion: string) => {
  if (confirm('delete?')) {
    const response = await removePipelineVersion(pipelineId, pipelineVersion)
    if (response.code == 130200) {
      alert(`deleted`)
      loadPipelineVersion()
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + response.result)
    }
  }
}

onMounted(() => {
  loadPipelineVersion();
})

const pipelineVersionColumns = ref([
  {
    key: 'pipeline_name',
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
