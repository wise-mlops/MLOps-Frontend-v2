<template>
  <div class="w-full h-full flex flex-col">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <UTabs :items="tabItems"
      :ui="{ container: 'relative w-full grow', list: { width: 'w-96' }, base: 'focus:outline-none h-full' }"
      class="grow flex flex-col">
      <template #info="{ item }">
        <UCard class="min-h-10 mb-4">
          <div class="space-y-4">
            <UFormGroup label="NAME" name="pipeline_name" class="py-0">
              <UInput v-model="pipeline.pipeline_name" placeholder="Input Name" variant="outline" size="md"
                autocomplete="false">
              </UInput>
            </UFormGroup>
            <UFormGroup label="Description" name="pipeline_description" class="py-0">
              <UInput v-model="pipeline.pipeline_description" placeholder="Input Description" size="md"
                autocomplete="false">
              </UInput>
            </UFormGroup>
          </div>
        </UCard>
      </template>
      <template #pipeline="{ item }">
        <!-- <UCard class="min-h-10"> -->
        <div class="w-full h-full border">
          <Workflow :isEditable="true" />
        </div>
        <!-- </UCard> -->
      </template>
    </UTabs>

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
const pageTitle = ref('Add Pipeline')

const savePipeline = async () => {
  const pipelineObject = toObject();

  pipeline.value.nodes = pipelineObject.nodes;
  pipeline.value.edges = pipelineObject.edges;
  pipeline.value.position = pipelineObject.position;
  // pipeline.value.zoom = pipelineObject.zoom;
  pipeline.value.zoom = 1
  pipeline.value.viewport = pipelineObject.viewport;

  const response = await createPipeline(pipeline.value)
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