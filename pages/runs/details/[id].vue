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

  // 기존 방식: getPipelineDetails에 nodes가 있는 경우
  if (response2.result && response2.result.nodes && response2.result.nodes.length > 0) {
    pipeline.value = response2.result
    // 기존 상태 매핑 로직 유지
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
  // 새로운 방식: getPipelineDetails에 결과가 없거나 빈 경우 getPipelineVersionDetail 호출
  else {
    try {
      const versionResponse = await getPipelineVersionDetailsKFP(pipeline_id, pipeline_version)
      if (versionResponse.result && versionResponse.result.pipeline_spec) {
        // KFP 스펙을 워크플로우로 변환
        pipeline.value = convertKFPToWorkflow(versionResponse.result, runDetails.value)
      } else {
        // 그래도 데이터가 없는 경우 빈 pipeline
        pipeline.value = {
          pipeline_name: 'Unknown Pipeline',
          pipeline_description: '',
          nodes: [],
          edges: [],
          position: [0, 0],
          zoom: 1,
          pipeline_id: pipeline_id,
          pipeline_type: 'unknown',
          last_version_id: pipeline_version,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to load pipeline version detail:', error)
      // 에러 발생 시 빈 pipeline
      pipeline.value = {
        pipeline_name: 'Error Loading Pipeline',
        pipeline_description: '',
        nodes: [],
        edges: [],
        position: [0, 0],
        zoom: 1,
        pipeline_id: pipeline_id,
        pipeline_type: 'error',
        last_version_id: pipeline_version,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
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
