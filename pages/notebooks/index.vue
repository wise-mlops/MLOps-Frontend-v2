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
          <UBadge color="yellow" :ui="{ rounded: 'rounded-full' }">waiting</UBadge>
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
      <template #image-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.image ? row.image : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.image ? row.image : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #action-data="{ row }">
        <div>
          <UTooltip text="detail">
            <UButton @click="detail(row.name)" icon="i-heroicons-pencil-square" variant="ghost" class="p-1 mx-2" />
          </UTooltip>
          <UTooltip text="connect">
            <div v-if="row.status.hasOwnProperty('running')">
              <UButton @click="connect(row.connect)" icon="i-heroicons-link" variant="ghost" class="p-1 mx-2" />
            </div>
            <div v-else>
              <UButton icon="i-heroicons-link" variant="ghost" class="p-1 mx-2" disabled />
            </div>
          </UTooltip>
          <UTooltip text="delete">
            <UButton @click="deleteNotebook(row.name)" icon="i-heroicons-trash" variant="ghost" class="p-1 mx-2" />
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
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const reloadNotebooks = () => {
  pending.value = true;
  data.value = [];
  loadNotebooks();
}

const detail = (notebookName: string) => {
  navigateTo(`/notebooks/detail/${notebookName}`)
}

const connect = (connect: string) => {
  navigateTo(connect, { external: true, open: { target: '_blank' } })
}

const deleteNotebook = async (notebookName: string) => {
  if (confirm('delete?')) {
    const response = await removeNotebook('kubeflow-user-example-com', notebookName);
    if (response.code == 103200) {
      alert(`deleted`)
      reloadNotebooks()
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
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
