<template>
  <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
  <LayoutPageHeader :title="pageTitle" />
  <LayoutPageToolbar :links="toolbarLinks" />
  <ModuleDataTable v-model:columns="endpointColumns" v-model:data="data" v-model:pending="pending">
    <template #predictorSpec.containers-predictorName-data="{ row }">
      {{ row.predictorSpec.containers[0].name }}
    </template>
    <template #predictorSpec.containers-image-data="{ row }">
      {{ row.predictorSpec.containers[0].image }}
    </template>
    <template #creationTimestamp-data="{ row }">
      <div>
        {{ new Date(row.creationTimestamp).toLocaleString() }}
      </div>
    </template>

    <template #action-data="{ row }">
      <UTooltip text="detail">
        <UButton @click="detail(row.name)" icon="i-heroicons-pencil-square" variant="ghost" class="p-1 mx-2" />
      </UTooltip>
    </template>
  </ModuleDataTable>
</template>


<script setup lang="ts">
import { getEndpoints } from '~/composables/endpoints'

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Endpoints',
  },
])

const pageTitle = ref('Endpoints')
const pending = ref(true)
const data = ref([])

const loadEndpoints = async () => {
  const response = await getEndpoints('kubeflow-user-example-com')
  data.value = response.result ? response.result.result : []
  console.log(data.value)
  pending.value = false;

}
const reloadEndpoints = () => {
  pending.value = true;
  data.value = [];
  loadEndpoints();
}

const detail = (endpointName: string) => {
  navigateTo(`/endpoints/detail/${endpointName}`)
}

onMounted(() => {
  loadEndpoints();
})

const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadEndpoints
    },
    // {
    //   label: '등록',
    //   icon: 'i-heroicons-plus-circle',
    //   to: '/notebooks/add'
    // }
  ]
])

const endpointColumns = ref([
  {
    key: 'name',
    label: '이름'
  },
  {
    key: 'predictorSpec.containers-predictorName',
    label: 'Predictor name'
  },
  {
    key: 'predictorSpec.containers-image',
    label: 'Image'
  },

  {
    key: 'creationTimestamp',
    label: 'Create at'
  },
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'action',
    label: 'Action'
  }
])


</script>
