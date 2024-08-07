<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <UTabs :items="tabItems" :ui="{ list: { width: 'w-96' } }">
      <template #info="{ item }">
        <UCard class="min-h-10 mb-4">
          <div class="space-y-4">
            <UFormGroup label="NAME" name="pipeline_name" class="py-0">
              <UInput v-model="pipeline.name" placeholder="Input Name" variant="outline" size="md" autocomplete="false">
              </UInput>
            </UFormGroup>
            <UFormGroup label="Description" name="pipeline_description" class="py-0">
              <UInput v-model="pipeline.description" placeholder="Input Description" size="md" autocomplete="false">
              </UInput>
            </UFormGroup>
          </div>
        </UCard>
      </template>
      <template #pipeline="{ item }">
        <!-- <UCard class="min-h-10"> -->
        <div class="w-full h-96 relative border">
          <Workflow />
        </div>
        <!-- </UCard> -->
      </template>
    </UTabs>

  </div>
</template>

<script setup lang="ts">


const router = useRouter();
const pipeline = ref({
  name: '',
  description: '',
  pipeline: {},
  nodeInfo: {},
})

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Pipelines',
    to: '/pipelines/'
  },
  {
    label: 'Add',
  },
])
const pageTitle = ref('Add Pipeline')


// toolbar links  
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

    },
  ]
])

const tabItems = ref([
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'pipeline',
    label: 'Pipeline'
  }
])
</script>