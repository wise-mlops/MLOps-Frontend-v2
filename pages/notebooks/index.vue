<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="notebookColumns" v-model:data="data" v-model:pending="pending">
      <template #status-data="{ row }">
        <div v-if="row.status.hasOwnProperty('running')">
          <UBadge color="green" :ui="{ rounded: 'rounded-full' }">running</UBadge>
        </div>
        <div v-else-if="row.status.hasOwnProperty('waiting')">
          <UBadge color="orange" :ui="{ rounded: 'rounded-full' }">waiting</UBadge>
        </div>
        <div v-else>
          <UBadge color="gray" :ui="{ rounded: 'rounded-full' }">unknown</UBadge>
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
            <UButton @click="detail(row.name)" icon="i-heroicons-pencil-square" variant="ghost" class="px-2 py-0" />
          </UTooltip>
          <UTooltip text="connect">
            <UButton @click="detail(row.name)" icon="i-heroicons-link" variant="ghost" class="px-2 py-0" />
          </UTooltip>
          <UTooltip text="delete">
            <UButton icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
          </UTooltip>
        </div>
      </template>
    </ModuleDataTable>
  </div>
</template>

<script setup lang="ts">
const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Notebooks',
  },
])
const pageTitle = ref('Notebooks')
const pending = ref(true)
const data = ref([])

const loadNotebooks = async () => {
  const response = await getNotebooks('kubeflow-user-example-com')
  data.value = response.result ? response.result : []
  console.log(data.value)
  pending.value = false;
}

const reloadNotebooks = () => {
  pending.value = true;
  data.value = [];
  loadNotebooks();
}

const detail = (notebookName: string) => {
  console.log(notebookName)
}

onMounted(() => {
  loadNotebooks();
})

// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadNotebooks
    },
    {
      label: '등록',
      icon: 'i-heroicons-plus-circle',
      to: '/notebooks/add'
    }]
])

const notebookColumns = ref([
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'name',
    label: '이름'
  },
  {
    key: 'created_at',
    label: 'create at'
  },
  {
    key: 'image',
    label: 'Image'
  },
  {
    key: 'cpus',
    label: 'CPUs'
  },
  {
    key: 'gpus',
    label: 'GPUs'
  },
  {
    key: 'memory',
    label: 'Memory'
  },
  {
    key: 'action',
    label: 'Action'
  },
])

</script>