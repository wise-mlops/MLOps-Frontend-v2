<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="space-y-4 w-full sm:w-3/5">
        <UFormGroup label="Pipeline" name="pipeline_name" class="py-2">
          <UButtonGroup size="md" orientation="horizontal">
            <UInput v-model="runForm.pipeline.display_name" placeholder="Pipeline name" size="md" autocomplete="off"
              class="w-96" disabled />
            <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="pipelineModalOpen = true" />
          </UButtonGroup>
          <UModal v-model="pipelineModalOpen" :ui="{ width: 'max-w-4xl sm:max-w-4xl' }">
            <ModalPipelines v-model:pipeline="runForm.pipeline" v-model:isOpen="pipelineModalOpen" />
          </UModal>
        </UFormGroup>
        <UFormGroup label="Pipeline version" name="pipeline_version" class="py-2">
          <UButtonGroup size="md" orientation="horizontal">
            <UInput v-model="runForm.pipeline_version.display_name" placeholder="Pipeline version" size="md"
              autocomplete="off" class="w-96" disabled />
            <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="pipelineVersionModal" />
          </UButtonGroup>
          <UModal v-model="pipelineVersionModalOpen" :ui="{ width: 'max-w-4xl sm:max-w-4xl' }">
            <ModalPipelineVersions v-model:pipeline="runForm.pipeline"
              v-model:pipelineVersion="runForm.pipeline_version" v-model:isOpen="pipelineVersionModalOpen" />
          </UModal>
        </UFormGroup>
        <UFormGroup label="experiment" name="experiment_name" class="py-2">
          <UButtonGroup size="md" orientation="horizontal">
            <UInput v-model="runForm.experiment.display_name" placeholder="experiment" size="md" autocomplete="off"
              class="w-96" disabled />
            <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="experimentModalOpen = true" />
          </UButtonGroup>
          <UModal v-model="experimentModalOpen" :ui="{ width: 'max-w-4xl sm:max-w-4xl' }">
            <ModalExperiments v-model:experiment="runForm.experiment" v-model:isOpen="experimentModalOpen" />
          </UModal>
        </UFormGroup>
        <UFormGroup label="Run name" name="run_name" class="py-2">
          <UInput v-model="runForm.name" placeholder="Run name" size="md" autocomplete="off" />
        </UFormGroup>
        <!-- backend에서 runtype 설정이 구현되지 않아 막아둠 -->
        <!-- <URadioGroup v-model="runForm.runType" legend="Run type" :options="runTypes" class="py-2" /> -->
        <!-- schedule -->
        <div v-if="runForm.runType == 'schedule'">
          <div class="w-full flex flex-wrap py-2">
            <UFormGroup label="Max Repeat" name="max_repeat" class="w-full sm:w-2/5 mx-2">
              <UInput v-model="runForm.schedule.maxRepeat" placeholder="Max Repeat" size="md" autocomplete="off" />
            </UFormGroup>
            <UFormGroup label="Term Repeat" name="term_repeat" class="w-full sm:w-2/5 mx-2">
              <USelectMenu v-model="runForm.schedule.termRepeat" :options="termRepeat" option-attribute="label"
                value-attribute="value" size="md" />
            </UFormGroup>
          </div>
          <div class="w-full py-2">
            <div class="flex flex-row py-2">
              <UCheckbox label="시작일" v-model="runForm.schedule.start" />
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(runForm.schedule.startDate, dateFormat)"
                  :disabled="!runForm.schedule.start" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-calendar" :disabled="!runForm.schedule.start" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="runForm.schedule.startDate" mode="date" @close="close" />
                  </template>
                </UPopover>
              </UButtonGroup>
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(runForm.schedule.startTime, timeFormat)"
                  :disabled="!runForm.schedule.start" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-clock" :disabled="!runForm.schedule.start" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="runForm.schedule.startTime" mode="time" />
                  </template>
                </UPopover>
              </UButtonGroup>
            </div>
            <div class="flex flex-row py-2">
              <UCheckbox label="종료일" v-model="runForm.schedule.end" />
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(runForm.schedule.endDate, dateFormat)" :disabled="!runForm.schedule.end" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-calendar" :disabled="!runForm.schedule.end" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="runForm.schedule.endDate" mode="date" @close="close" />
                  </template>
                </UPopover>
              </UButtonGroup>
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(runForm.schedule.endTime, timeFormat)" :disabled="!runForm.schedule.end" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-clock" :disabled="!runForm.schedule.end" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="runForm.schedule.endTime" mode="time" />
                  </template>
                </UPopover>
              </UButtonGroup>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns';
const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'hh:mm a';


const router = useRouter();
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
    label: 'Add',
  },
])
const pageTitle = ref('Add Runs')

const runForm = ref({
  name: '',
  pipeline: {
    pipeline_id: '',
    display_name: '',
  },
  pipeline_version: {
    pipeline_version_id: '',
    display_name: ''
  },
  experiment: {
    experiment_id: '',
    display_name: '',
  },

  runType: 'once',
  schedule: {
    maxRepeat: 10,
    termRepeat: 'hour',
    start: false,
    startDate: new Date(),
    startTime: new Date(),
    end: false,
    endDate: new Date(),
    endTime: new Date()
  }
})

const run = ref({
  experiment_id: '',
  job_name: '',
  params: {},
  pipeline_id: '',
  version_id: '',
  pipeline_root: '',
  enable_caching: true,

})

const pipelineModalOpen = ref(false);
const pipelineVersionModalOpen = ref(false);
const experimentModalOpen = ref(false);

const pipelineVersionModal = () => {
  if (runForm.value.pipeline.pipeline_id) {
    pipelineVersionModalOpen.value = true
  } else {
    alert('select pipeline')
  }
}

const addRun = async () => {
  run.value.job_name = runForm.value.name;
  run.value.experiment_id = runForm.value.experiment.experiment_id
  run.value.pipeline_id = runForm.value.pipeline.pipeline_id
  run.value.version_id = runForm.value.pipeline_version.pipeline_version_id

  const response = await createRun(run);
  if (response.code == 101200) {
    navigateTo(`/runs`, {
      replace: true,
      redirectCode: 301,
      external: true
    })
  } else {
    alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
  }

}


const runTypes = ref([
  { label: 'Once', value: 'once' },
  { label: 'Repeat', value: 'schedule' }
])

const termRepeat = ref([
  { label: 'Minute', value: 'minute' },
  { label: 'Hour', value: 'hour' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
])

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
      click: addRun
    }
  ]
])

// TODO: 시작-종료일 Validation 

</script>

<style>
.cal {
  display: flex;
  background-color: rgb(34 197 94);
  color: white;
  text-align: center;
  padding: 2px;
}
</style>