<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard calss="min-h-10">
      <template #header>
        <div>{{ experimentId }}</div>
      </template>
      <div class="space-y-4">

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const router = useRouter();
const route = useRoute()

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Experiments',
    to: '/experiments/'
  },
  {
    label: 'Detail',
  },
])

const pageTitle = ref('Edit Experiment')
const experimentId = ref(route.params.id)

onBeforeMount(() => {
  // experiment 정보 가져오기 
  console.log(experimentId);
})


// toolbar links  
const toolbarLinks = ref([
  [
    {
      label: '취소',
      icon: 'i-heroicons-arrow-uturn-left',
      click: () => { router.back() }
    }
  ],
  [{
    label: '목록 업데이트',
    icon: 'i-heroicons-arrow-path',

  },
  {
    label: '수정',
    icon: 'i-heroicons-plus-circle',
  },
  ]
])

</script>