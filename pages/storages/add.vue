<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="space-y-4 w-full sm:w-3/5">
        <UFormGroup label="NAME" name="Bucket Name" class="py-0">
          <UInput v-model="bucketName" placeholder="Input Name" variant="outline" size="md" autocomplete="false">
          </UInput>
        </UFormGroup>

      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">

const router = useRouter();
const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Storages',
    to: '/storages/'
  },
  {
    label: 'Add',
  },
])

const pageTitle = ref('Add Bucket')
const bucketName = ref('')

const addBucket = async () => {

  const response = await createBucket(bucketName.value.trim())
  if (response.code == 130200) {
    navigateTo(`/storages`, {
      replace: true,
      redirectCode: 301,
      external: true
    })
  } else {
    alert("오류[" + response.code + "]: " + response.message)
  }

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
      click: addBucket
    }
  ]
])
</script>