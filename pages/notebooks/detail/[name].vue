<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UTabs :items="tabItems" :ui="{ list: { width: 'w-3/5' } }">
      <template #info="{ item }">
        <UCard class="min-h-10 mb-4">
          <div>info</div>
        </UCard>
      </template>
      <template #logs="{ item }">
        <UCard class="min-h-10 mb-4">
          <div>logs</div>
        </UCard>
      </template>
      <template #event="{ item }">
        <UCard class="min-h-10 mb-4">
          <div>event</div>
        </UCard>
      </template>
      <template #yaml="{ item }">
        <UCard class="min-h-20 mb-4">
          <MonacoEditor v-model="yamlString" :options="{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }"
            class="w-full h-96" />
        </UCard>
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
    label: 'Notebooks',
    to: '/notebooks/'
  },
  {
    label: 'Details',
  },
])
const pageTitle = ref('Notebook details')
const notebookName = ref(route.params.name)

const yaml = ref([])
const yamlString = ref<string>('')

const loadNotebookDetails = async () => {

  const response = await getNotebookDetails('kubeflow-user-example-com', notebookName.value)

  yaml.value = response.result ? response.result.yaml : []

  yamlString.value = jsonToYaml(JSON.stringify(yaml.value))


}

onBeforeMount(() => {
  loadNotebookDetails()
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
    slot: 'logs',
    label: 'Logs'
  },
  {
    slot: 'event',
    label: 'Event'
  },
  {
    slot: 'yaml',
    label: 'YAML'
  },
])
</script>