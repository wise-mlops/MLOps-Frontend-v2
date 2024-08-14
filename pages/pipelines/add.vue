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
        <div class="w-full h-96 relative border">
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
const pipeline = ref({

  pipeline_name: '',
  pipeline_description: '',
  nodes: [],
  edges: [],
  position: [],
  zoom: 0,
  viewport: {},
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
  pipeline.value.zoom = pipelineObject.zoom;
  pipeline.value.viewport = pipelineObject.viewport;
  console.log(pipeline.value)

  createPipeline(pipeline.value)
    .then(res => {
      console.log(res)
      if (res && res.code == 100200) {
        navigateTo(`/pipelines`, {
          replace: true,
          redirectCode: 301,
          external: true
        })
      } else {
        alert("오류[" + res.code + "]: " + res.message)
      }
    })

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