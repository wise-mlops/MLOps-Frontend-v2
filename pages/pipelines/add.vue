<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <!-- 복제 모드 알림 -->
    <UAlert 
      v-if="isCloneMode" 
      icon="i-heroicons-document-duplicate" 
      color="blue" 
      variant="subtle" 
      title="파이프라인 복제" 
      description="기존 파이프라인을 기반으로 새로운 파이프라인을 생성합니다. 설정을 수정한 후 등록해주세요."
      class="mb-4"
    />

    <!-- Information Section -->
    <UCard class="mb-4">
      <div class="flex gap-4">
        <div class="w-1/4">
          <UFormGroup label="NAME" name="pipeline_name" class="py-0">
            <UInput v-model="pipeline.pipeline_name" placeholder="Input Name" variant="outline" size="md"
              autocomplete="false">
            </UInput>
          </UFormGroup>
        </div>
        <div class="w-3/4">
          <UFormGroup label="Description" name="pipeline_description" class="py-0">
            <UInput v-model="pipeline.pipeline_description" placeholder="Input Description" size="md"
              autocomplete="false">
            </UInput>
          </UFormGroup>
        </div>
      </div>
    </UCard>

    <!-- Pipeline Section -->
    <div class="flex-1 border rounded-lg bg-white shadow">
      <Workflow v-model="pipeline" :isEditable="true" :key="workflowKey" />
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
import { useVueFlow } from '@vue-flow/core';
const { toObject } = useVueFlow()

const pipeline = ref<Pipeline>({
  pipeline_name: '',
  pipeline_description: '',
  nodes: [],
  edges: [],
  position: [0, 0],
  zoom: 0,
  viewport: { x: 0, y: 0, zoom: 0 },
  created_at: new Date(),
  updated_at: new Date(),
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

const route = useRoute();
const isCloneMode = computed(() => route.query.clone === 'true');
const pageTitle = computed(() => isCloneMode.value ? 'Clone Pipeline' : 'Add Pipeline');

const workflowKey = ref(0);

const loadSourcePipeline = async () => {
  if (isCloneMode.value && route.query.sourceId) {
    try {
      pipeline.value.pipeline_name = `${route.query.sourceName}_Copy`;
      pipeline.value.pipeline_description = route.query.sourceDescription as string;
      
      const versionsResponse = await getPipelineVersions(route.query.sourceId as string);
      const latestVersionId = versionsResponse.result?.result?.[0]?.version_id;

      if (latestVersionId) {
        const sourceResponse = await getPipelineDetails(route.query.sourceId as string, latestVersionId);
        
        if (sourceResponse.code === 130200 && sourceResponse.result) {
          const sourceData = sourceResponse.result;
          
          if (sourceData.nodes && sourceData.edges) {
            pipeline.value.nodes = sourceData.nodes;
            pipeline.value.edges = sourceData.edges;
            pipeline.value.position = sourceData.position || [0, 0];
            pipeline.value.zoom = sourceData.zoom || 1;
            pipeline.value.viewport = sourceData.viewport || { x: 0, y: 0, zoom: 1 };
            
            workflowKey.value++;
          }
        }
      }
    } catch (error) {
      console.error('Failed to load source pipeline:', error);
      alert('소스 파이프라인을 불러오는데 실패했습니다.');
    }
  }
};

const savePipeline = async () => {
  const pipelineObject = toObject();
  pipeline.value.nodes = pipelineObject.nodes;
  pipeline.value.edges = pipelineObject.edges;
  pipeline.value.position = pipelineObject.position;
  pipeline.value.zoom = 1
  pipeline.value.viewport = pipelineObject.viewport;

  const response = await createPipeline(pipeline.value)
  console.log(response)
  if (response.code == 130200) {
    navigateTo(`/pipelines`, {
      replace: true,
      redirectCode: 301,
      external: true
    })
  } else {
    alert("오류[" + response.code + "]: " + response.message)
  }
}

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
      click: savePipeline
    },
  ]
])

onMounted(() => {
  loadSourcePipeline();
});
</script>