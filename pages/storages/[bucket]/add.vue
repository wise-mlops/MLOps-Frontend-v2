<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="space-y-4 w-full">
        <div class="flex items-center justify-center w-full">
          <ModuleFileUpload @files-selected="handleFiles" />
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">

const router = useRouter();
const route = useRoute();
const bucketName = route.params.bucket || ''
const slug = ref<string[]>(route.params.slug ? (Array.isArray(route.params.slug) ? route.params.slug : [route.params.slug]) : []);
const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Storages',
    to: '/storages'
  },
  {
    label: `Bucket: ${bucketName}`,
    to: `/storages/${bucketName}`
  }
])


const pageTitle = ref('Add Object')
const uploadObjects = ref<File[]>([])

const addObject = async () => {
  console.log(uploadObjects.value)
  const response = await createObjects(bucketName, slug.value.join('/'), uploadObjects.value)
  if (response.code == 130200) {
    navigateTo(`/storages/${bucketName}/${slug.value.join('/')}`, {
      replace: true,
      redirectCode: 301,
      external: true
    })
  } else {
    alert("오류[" + response.code + "]: " + response.message)
  }
}

const handleFiles = async (files: File[]) => {
  uploadObjects.value = files
  console.log(uploadObjects.value)

}

const toolbarLinks = ref([
  [
    {
      label: '취소',
      icon: 'i-heroicons-arrow-uturn-left',
      click: () => { router.back() }
    }
  ],
  [
    {
      label: '등록',
      icon: 'i-heroicons-plus-circle',
      click: addObject
    }
  ]
])
</script>