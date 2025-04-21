<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems" :ui="{ list: { width: 'w-3/5' } }">
      <template #status="{ item }">
        <UCard class="min-h-10 mb-4">
          <UFormGroup label="URL" name="url" class="py-2">
            <UInput type="text" v-model="item.data.url" variant="none" size="md" :disabled="true" />
          </UFormGroup>
          <UFormGroup label="ObservedGeneration" name="observedGeneration" class="py-2">
            <UInput type="text" v-model="item.data.observedGeneration" variant="none" size="md" :disabled="true" />
          </UFormGroup>
        </UCard>
      </template>
      <template #spec="{ item }">
        <UCard class="min-h-10 mb-4">
          <UFormGroup label="Containers" name="Containers" class="py-2">
            <div>
              {{ item.data.predictor }}
              <!-- <MonacoEditor v-model="item.data.predictor" lang="json"
                :options="{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }" class="w-full h-96" /> -->

            </div>
          </UFormGroup>
        </UCard>
      </template>
      <template #metadata="{ item }">
        <UCard class="min-h-10 mb-4">
          {{ item.data }}
        </UCard>
      </template>

    </UTabs>

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
    label: 'Endpoints',
    to: '/endpoints/'
  },
  {
    label: 'Details',
  },
])

const pageTitle = ref('Endpoint details')
const endpointName = ref(route.params.name)
const data = ref({
  status: {},
  spec: {},
  metadata: {}
})

const loadEndpointDetails = async () => {
  const response = await getEndpointDetails('kubeflow-user-example-com', endpointName.value)

  data.value = response.result ? response.result : {}
  console.log(data.value)
}

const reloadEndpointDetails = () => {
  loadEndpointDetails()
}


onBeforeMount(() => {
  loadEndpointDetails()
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
    {
      label: '업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadEndpointDetails
    },
  ]
])

const tabItems = computed(() => [
  {
    slot: 'status',
    label: 'Information',
    data: data.value['status']
  },
  {
    slot: 'spec',
    label: 'Spec',
    data: data.value['spec']
  },
  {
    slot: 'metadata',
    label: 'Event',
    data: data.value['metadata']
  },
])
</script>