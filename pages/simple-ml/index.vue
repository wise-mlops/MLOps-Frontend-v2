<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="simpleMLModelColumns" v-model:data="data" v-model:pending="pending">
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
      <template #status-data="{ row }">
        <UBadge
          :color="row.status === 'COMPLETED' ? 'green' : row.status === 'TRAINING' ? 'yellow' : 'gray'"
          :label="row.status"
        />
      </template>
      <template #model_type-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.model_type ? row.model_type : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.model_type ? row.model_type : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #algorithm-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.algorithm ? row.algorithm : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.algorithm ? row.algorithm : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #val_acc-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.val_acc ? row.val_acc : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.val_acc ? row.val_acc : '' }}
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
          <UTooltip text="detail">
            <UButton @click="detailSimpleMLModel(row.exp_key)" icon="i-heroicons-pencil-square" variant="ghost" class="p-1 mx-2" />
          </UTooltip>
          <UTooltip text="delete">
            <UButton @click="deleteSimpleMLModel(row.exp_key)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
          </UTooltip>
        </div>
      </template>
    </ModuleDataTable>
  </div>
</template>

<script lang="ts" setup>
import {getSimpleMLModels, removeSimpleMLModel} from "~/composables/simple-ml";

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Simple ML',
  },
])
const pageTitle = ref('Simple ML')
const pending = ref(true)
const data = ref([])

const loadSimpleMLModels = async () => {
  const response = await getSimpleMLModels();
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const reloadSimpleMLModels = () => {
  pending.value = true;
  data.value = []
  loadSimpleMLModels();
}

const detailSimpleMLModel = (exp_key: string) => {
  navigateTo(`/simple-ml/details/${exp_key}`)
}

const deleteSimpleMLModel = async (exp_key: string) => {
  if (confirm('delete?')) {
    const response = await removeSimpleMLModel(exp_key)

    if (response.code == 130200) {
      alert(`deleted`)
      reloadSimpleMLModels();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

onMounted(() => {
  loadSimpleMLModels();
})
// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadSimpleMLModels
    },
    {
      label: '모델 학습',
      icon: 'i-heroicons-pencil-square-solid',
      to: '/simple-ml/train'
    }]
])

const simpleMLModelColumns = ref([
  {
    key: 'exp_key',
    label: '실험키'
  },
  {
    key: 'status',
    label: '상태'
  },
  {
    key: 'model_type',
    label: '모델 유형'
  },
  {
    key: 'algorithm',
    label: '학습 알고리즘'
  },
  {
    key: 'val_acc',
    label: '모델 예측 정확도'
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