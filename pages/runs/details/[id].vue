<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-96' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col">
      <template #pipeline="{ item }">
        <div class="w-full h-full border">
          <Workflow v-model="pipeline" :pannelOpen="false" :v-model:isEditable="false" />
        </div>
      </template>
      <template #info="{ item }">
        <UCard class="min-h-64">
          <template #header>
            <div>Run Details</div>
          </template>
          <div>
            <ModuleLabelValue v-model="attribute" />
          </div>
        </UCard>
      </template>
      <template #detail="{ item }">
        <UCard class="min-h-64">
          <MonacoEditor v-model="detail" :options="{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }"
            class="w-full h-96" />

        </UCard>
      </template>

    </UTabs>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const route = useRoute()


const attribute = ref([
  {
    id: 'run_id',
    label: 'Run ID',
    value: ''
  },
  {
    id: 'display_name',
    label: 'Workflow name',
    value: ''
  },
  {
    id: 'state',
    label: 'Status',
    value: ''
  },
  {
    id: 'description',
    label: 'Description',
    value: ''
  },
  {
    id: 'created_at',
    label: 'Created at',
    value: ''
  },
  {
    id: 'scheduled_at',
    label: 'Started at',
    value: ''
  },
  {
    id: 'finished_at',
    label: 'Finished at',
    value: ''
  },
  {
    id: 'experiment_id',
    label: 'Experiment ID',
    value: ''
  },
  {
    id: 'pipeline_id',
    label: 'Pipeline ID',
    value: ''
  },
  {
    id: 'pipeline_version',
    label: 'Pipeline Version',
    value: ''
  }
])

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
const detail = ref<string>('')
const runDetails = ref()

const loadRunDetails = async () => {
  const response = await getRunDetails(runId.value);
  runDetails.value = response.result;
  let pipeline_id = runDetails.value.pipeline_version_reference.pipeline_id
  let pipeline_version = runDetails.value.pipeline_version_reference.pipeline_version_id

  // information attribute 값 할당
  attribute.value = attribute.value.map((item: any) => {
    let value = item.value;
    if (item.id === 'pipeline_id') {
      value = pipeline_id
    } else if (item.id === 'pipeline_version') {
      value = pipeline_version
    } else {
      value = runDetails.value[item.id] !== undefined ? runDetails.value[item.id] : item.value
    }
    return {
      ...item,
      value: value
    }
  });

  // 상세정보 표시
  detail.value = JSON.stringify(runDetails.value.run_details, null, 2)

  // pipeline 정보 
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
