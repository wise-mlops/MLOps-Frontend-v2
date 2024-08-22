<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="experimentColumns" v-model:data="data" v-model:pending="pending">
      <template #display_name-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-96">
            {{ row.display_name ? row.display_name : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.display_name ? row.display_name : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #description-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-96">
            {{ row.description ? row.description : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.description ? row.description : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #action-data="{ row }">
        <div>
          <UTooltip text="detail">
            <UButton @click="detailExperiment(row.experiment_id)" icon="i-heroicons-pencil-square" variant="ghost"
              class="px-2 py-0" />
          </UTooltip>
        </div>
      </template>
    </ModuleDataTable>
  </div>
</template>

<script lang="ts" setup>


const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Experiments',
  },
])
const pageTitle = ref('Experiments')
const pending = ref(true)
const data = ref([])

const loadExperiments = async () => {
  const response = await getExperiments()
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const reloadExperiments = () => {
  pending.value = true;
  data.value = []
  loadExperiments();
}

const detailExperiment = (experimentId: string) => {
  navigateTo(`/experiments/details/${experimentId}`)
}

onMounted(() => {
  loadExperiments();
})


// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadExperiments

    },
    {
      label: '등록',
      icon: 'i-heroicons-plus-circle',
      to: '/experiments/add'
    }]
])

// data table columns 
const experimentColumns = ref([
  {
    key: 'display_name',
    label: '이름'
  },
  {
    key: 'description',
    label: '설명'
  },
  {
    key: 'created_at',
    label: '생성일시'
  },
  {
    key: 'storage_state',
    label: 'Storage'
  },
  {
    key: 'action',
    label: '작업'
  }

])




</script>

<style></style>