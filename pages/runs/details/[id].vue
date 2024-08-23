<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-96' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col">
      <template #info="{ item }">

      </template>
      <template #pipeline="{ item }">
        <div class="w-full h-full border">
          <Workflow v-model="pipeline" :pannelOpen="false" />
        </div>
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute()

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Runs',
    to: '/runs/'
  },
  {
    label: 'Details',
  },
])



const pageTitle = ref('Run details')
const pipeline = ref<Pipeline>()
const runId = ref(route.params.id)
const runDetails = ref()

const loadRunDetails = async () => {
  const response = await getRunDetails(runId.value);
  runDetails.value = response.result;
  let pipeline_id = runDetails.value.pipeline_version_reference.pipeline_id
  let pipeline_version = runDetails.value.pipeline_version_reference.pipeline_version_id
  const response2 = await getPipelineDetails(pipeline_id, pipeline_version)
  pipeline.value = response2.result

  if (pipeline.value?.nodes !== undefined) {
    pipeline.value.nodes.forEach((node: any, i: number) => {
      let runItem = runDetails.value.run_details.task_details.find((item: any) => {
        return item.display_name === node.data.attribute.type.replace(/_/g, "-");
      })
      pipeline.value ? pipeline.value.nodes[i].data.state = runItem?.state : new Node()
      pipeline.value ? pipeline.value.nodes[i].data.details = runItem : new Node()
    })
  }
}

onBeforeMount(() => {
  loadRunDetails()
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
    slot: 'pipeline',
    label: 'Pipeline'
  },
  {
    slot: 'info',
    label: 'Information'
  },
  {
    slot: 'detail',
    label: 'Detail'
  }
])
</script>
