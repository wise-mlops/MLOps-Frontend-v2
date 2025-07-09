<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="autoMLExperimentColumns" v-model:data="data" v-model:pending="pending">
      <template #exp_key-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.exp_key ? row.exp_key : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.exp_key ? row.exp_key : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #dataset_name-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.auto_ml_config?.dataset_name || '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.auto_ml_config?.dataset_name || '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #search_algorithm-data="{ row }">
        <div>
          {{ row.auto_ml_config?.search_algorithm || '' }}
        </div>
      </template>
      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <div>
          <UTooltip text="detail">
            <UButton @click="detailNASExperiment(row.exp_key)" icon="i-heroicons-eye" variant="ghost" class="p-1 mx-2" />
          </UTooltip>
          <UTooltip text="delete">
            <UButton @click="deleteNASExperiment(row.exp_key)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
          </UTooltip>
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
    label: 'Auto ML',
  },
])
const pageTitle = ref('Auto ML')
const pending = ref(true)
const data = ref([])

const loadNASExperiments = async () => {
  const response = await getNASExperiments();
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const reloadNASExperiments = () => {
  pending.value = true;
  data.value = []
  loadNASExperiments();
}

const detailNASExperiment = (exp_key: string) => {
  navigateTo(`/auto-ml/details/${exp_key}`)
}

const deleteNASExperiment = async (exp_key: string) => {
  if (confirm('delete?')) {
    const retrainExpKeys = []
    const hpoExpKeys = []

    const retrainExperiments = await getRetrainExperiments(exp_key);
    if (retrainExperiments?.result?.result) {
      retrainExpKeys.push(...retrainExperiments.result.result.map(item => item.exp_key));
    }
    const hpoExperiments = await getHPOExperiments(exp_key);
    if (hpoExperiments?.result?.result) {
      hpoExpKeys.push(...hpoExperiments.result.result.map(item => item.exp_key));
    }

    const allExpKeys = [exp_key, ...retrainExpKeys, ...hpoExpKeys];
    const expKeysString = allExpKeys.join(',');
    const response = await removeAutoMLExperiments(expKeysString)

    if (response.code == 130200) {
      alert(`deleted`)
      reloadNASExperiments();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

onMounted(() => {
  loadNASExperiments();
})
// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadNASExperiments
    },
    {
      label: '신경망 구조 탐색',
      icon: 'i-heroicons-pencil-square-solid',
      to: '/auto-ml/nas'
    }]
])

const autoMLExperimentColumns = ref([
  {
    key: 'exp_key',
    label: '실험키'
  },
  {
    key: 'dataset_name',
    label: '데이터셋'
  },
  {
    key: 'search_algorithm',
    label: '탐색 알고리즘'
  },
  {
    key: 'created_at',
    label: '생성일시'
  },
  {
    key: 'action',
    label: '작업'
  },
])
</script>

<style></style>