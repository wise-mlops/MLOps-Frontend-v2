<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="space-y-4">
        <UFormGroup label="NAME" name="experiment_name" class="py-2">
          <UInput v-model="experiment.name" placeholder="Input Name" variant="outline" size="md" autocomplete="off">
          </UInput>
        </UFormGroup>
        <UFormGroup label="Description" name="experiment_description" class="py-2">
          <UInput v-model="experiment.description" placeholder="Input Description" size="md" autocomplete="off">
          </UInput>
        </UFormGroup>
        <UFormGroup class="py-2">
          <UCheckbox v-model="experiment.createRun" name="createRun" label="Run after Register" disabled />
        </UFormGroup>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const experiment = ref({
  name: '',
  description: '',
  createRun: false
})

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Experiments',
    to: '/experiments/'
  },
  {
    label: 'Add',
  },
])
const pageTitle = ref('Add Experiment')

const createtExperiment = async () => {
  console.log(experiment)
  createExperiment(experiment)
    .then(res => {
      if (res && res.code == 102200) {
        navigateTo(`/experiments`, {
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
      click: createtExperiment
    },
  ]
])

</script>