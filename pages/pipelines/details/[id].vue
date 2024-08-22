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
              <UInput v-model="pipelineInfo.display_name" placeholder="Input Name" variant="outline" size="md"
                autocomplete="false">
              </UInput>
            </UFormGroup>
            <UFormGroup label="Description" name="pipeline_description" class="py-0">
              <UInput v-model="pipelineInfo.description" placeholder="Input Description" size="md" autocomplete="false">
              </UInput>
            </UFormGroup>
          </div>
        </UCard>
      </template>
      <template #pipeline="{ item }">
        <!-- <UCard class="min-h-10"> -->
        <div class="w-full h-96 relative border">
          <Workflow v-model="pipeline" :pannelOpen="false" />
        </div>
        <!-- </UCard> -->
      </template>
    </UTabs>

  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute()

const pipelineInfo = ref({
  ...{},
  display_name: '',
  description: ''
})
const pipeline = ref<Pipeline>()

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
    label: 'Details',
  },
])
const pageTitle = ref('Pipeline details')
const pipelineId = ref(route.params.id)
const pipelineVersion = ref(route.query.version ? route.query.version.toString() : '')

const loadPipelineDetails = async () => {
  if (!pipelineVersion.value) {
    let pipelineVersions = await getPipelineVersions(pipelineId.value);

    pipelineVersion.value = pipelineVersions.result.result[0]['pipeline_version_id']
  }

  let pipelineVersionDetail = await getPipelineVersionDetails(pipelineId.value, pipelineVersion.value);
  pipelineInfo.value = pipelineVersionDetail.result ? pipelineVersionDetail.result : {}
  console.log(pipelineInfo.value)
  let pipelineDetail = await getPipelineDetails(pipelineId.value, pipelineVersion.value)
  pipeline.value = pipelineDetail.result;
}

onBeforeMount(() => {
  loadPipelineDetails()
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
  [

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