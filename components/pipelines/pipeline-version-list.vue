<template>
  <div>
    <UTable :rows="pipelineVersions" :columns="pipelineVersionColumns" :loading="pending"
      :loading-state="{ icon: 'i-heroicons-arrow-path', label: 'Loading' }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'No items.' }">
      <template #loading-state>
        <div class="flex items-center justify-center h-12">

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
    key: 'detail',
    label: '상세보기'
  },
])

</script>
