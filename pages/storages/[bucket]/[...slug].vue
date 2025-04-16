<template>
  <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
  <LayoutPageHeader :title="pageTitle" />
  <LayoutPageToolbar :links="toolbarLinks" />
  <ModuleDataTable v-model:columns="storageColumns" v-model="selected" v-model:data="data" v-model:pending="pending">
    <template #_object_name-data="{ row }">
      <div v-if="row._etag">
        <UIcon name="i-heroicons-document" class="w-6 h-5" /><span>{{ getFName(row._object_name) }}</span>
      </div>
      <div v-else>
        <UIcon name="i-heroicons-folder" class="w-6 h-5" /><span>{{ getDName(row._object_name) }}</span>
      </div>
    </template>
    <template #action-data="{ row }">
      <!-- 파일인 경우 -->
      <div v-if="row._etag">
        <UTooltip text="download">
          <UButton @click="handleDownload(row._object_name)" icon="i-heroicons-arrow-down-tray" variant="ghost"
            class="p-2 mx-2" />
        </UTooltip>
        <UTooltip text="share">
          <UButton @click="handleCopyUrl(row._object_name)" icon="i-heroicons-share" variant="ghost" class="p-2 mx-2" />
        </UTooltip>
      </div>
      <!-- 폴더인 경우-->
      <div v-else>
        <UTooltip text="move">
          <UButton @click="handleFolderClick(row)" icon="i-heroicons-arrow-right-on-rectangle" variant="ghost"
            class="p-2 mx-2" />
        </UTooltip>
      </div>
    </template>
  </ModuleDataTable>
</template>

<script lang="ts" setup>
const route = useRoute();
const bucketName = route.params.bucket || ''
const slug = ref<string[]>(route.params.slug ? (Array.isArray(route.params.slug) ? route.params.slug : [route.params.slug]) : []);

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Storage',
    to: '/storages'
  },
  {
    label: `Bucket: ${bucketName}`,
    to: `/storages/${bucketName}`
  }
])
const pageTitle = ref(`Bucket: ${bucketName}`)
const pending = ref(true)
const data = ref([])
const selected = ref([])

const loadObjects = async () => {
  const response = await getObjects(bucketName, slug.value.join('/'));
  data.value = response.result ? response.result.result : []
  pending.value = false;

}

const reloadObjects = () => {
  pending.value = true;
  data.value = []
  loadObjects()
}

onMounted(() => {
  loadObjects()
  let basepath = ""
  slug.value.forEach((item: string) => {
    if (item == "") return
    breadcrumbs.value.push({
      label: item,
      to: `/storages/${bucketName}${basepath}/${item}/`
    })
    basepath += '/' + item
  })
})


const getFName = (name: string): string => {
  const nameSplit: string[] = name.split("/");
  return nameSplit.at(-1) || '';
}

const getDName = (name: string): string => {
  const nameSplit: string[] = name.split("/");
  return nameSplit.at(-2) || '';
}

const handleDownload = async (objectName: string) => {

  const blob = await downloadObject(bucketName, [objectName])




  const filename = getFName(objectName)
  // TODO: 
  // 파일 1개일때는 파일명으로 다운로드
  // 파일 여러개일때는 zip파일로 다운로드(랜덤생성 파일명.zip)

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = decodeURIComponent(filename)
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const handleCopyUrl = (objectName: string) => {

  // const url = `${window.location.origin}/storages/${bucketName}/${objectName}`
  const url = "s3://" + bucketName + "/" + objectName;
  navigator.clipboard.writeText(url).then(() => {
    alert('URL copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy: ', err)
  })
}
const handleFolderClick = (row: any) => {
  navigateTo(`/storages/${bucketName}/${row._object_name}`)
}


const toolbarLinks = ref([
  [
    {
      label: '이전',
      icon: 'i-heroicons-arrow-left',
      click: () => {
        history.back()
      }
    }
  ],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadObjects
    },
    {
      label: '업로드',
      icon: 'i-heroicons-pencil-square-solid',
      to: '/runs/add'
    },
    {
      label: '다운로드',
      icon: 'i-heroicons-pencil-square-solid',
    },
    {
      label: '삭제',
      icon: 'i-heroicons-pencil-square-solid',
    }
  ]
])

const storageColumns = ref([
  {
    key: '_object_name',
    label: '이름'
  },
  {
    key: '_size',
    label: '크기'
  },
  {
    key: '_last_modified',
    label: '최종 수정일시'
  },
  {
    key: 'action',
    label: '작업'
  },
])

</script>