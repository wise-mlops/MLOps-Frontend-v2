<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="storageColumns" v-model:data="data" v-model:pending="pending">
      <template #_name-data="{ row }">
        <div>
          <UAvatar icon="i-heroicons-archive-box" class="mx-1 bg-primary-500 dark:bg-primary-400"
            :ui="{ icon: { base: 'text-white dark:text-gray-900' } }" size="sm" /> <span>{{ row._name
            }}</span>
        </div>
      </template>
      <template #_creation_date-data="{ row }">
        <div>
          {{ new Date(row._creation_date).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <div>
          <UTooltip text="detail">
            <UButton @click="detailBucket(row._name)" icon="i-heroicons-arrow-right-on-rectangle" variant="ghost"
              class="p-2 mx-2" />
          </UTooltip>
          <!-- <UTooltip text="delete">
            <UButton @click="deleteBucket(row._name)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
          </UTooltip> -->
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
    label: 'Storage',
  },
])
const pageTitle = ref('Storage')
const pending = ref(true)
const data = ref([])

const loadBuckets = async () => {

  const response = await getBuckets();
  data.value = response.result ? response.result.result : []
  pending.value = false;

}

const reloadBuckets = () => {
  pending.value = true;
  data.value = []
  loadBuckets()
}

const detailBucket = async (bucketName: string) => {
  navigateTo(`/storages/${bucketName}`)
}

const deleteBucket = async (bucketName: string) => {
  if (confirm('delete?')) {

    const response = await removeBucket(bucketName);
    if (response.code == 130200) {
      alert('deleted')
      reloadBuckets()
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }

}

onMounted(() => {
  loadBuckets()
})

const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadBuckets
    },
    {
      label: '등록',
      icon: 'i-heroicons-pencil-square-solid',
      to: '/runs/add'
    }]
])

const storageColumns = ref([
  {
    key: '_name',
    label: 'Bucket 이름'
  },
  {
    key: '_creation_date',
    label: '생성일시'
  },
  {
    key: 'action',
    label: '작업'
  },
])

</script>