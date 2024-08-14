<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="space-y-4 w-full sm:w-3/5">
        <UFormGroup label="Pipeline" name="pipeline_name" class="py-2">
          <UButtonGroup size="md" orientation="horizontal">
            <UInput placeholder="Pipeline name" size="md" autocomplete="off" class="w-96" />
            <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="pipelineModalOpen = true" />
          </UButtonGroup>
          <UModal v-model="pipelineModalOpen">
            <ModalPipelines />
          </UModal>
        </UFormGroup>
        <UFormGroup label="Pipeline version" name="pipeline_version" class="py-2">
          <UButtonGroup size="md" orientation="horizontal">
            <UInput placeholder="Pipeline version" size="md" autocomplete="off" class="w-96" />
            <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="pipelineVersionModalOpen = true" />
          </UButtonGroup>
          <UModal v-model="pipelineVersionModalOpen">
            <ModalPipelineVersions />
          </UModal>
        </UFormGroup>
        <UFormGroup label="experiment" name="experiment_name" class="py-2">
          <UButtonGroup size="md" orientation="horizontal">
            <UInput placeholder="experiment" size="md" autocomplete="off" class="w-96" />
            <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="experimentModalOpen = true" />
          </UButtonGroup>
          <UModal v-model="experimentModalOpen">
            <ModalExperiments />
          </UModal>
        </UFormGroup>
        <UFormGroup label="Run name" name="run_name" class="py-2">
          <UInput placeholder="Run name" size="md" autocomplete="off" />
        </UFormGroup>
        <URadioGroup v-model="run.runType" legend="Run type" :options="runTypes" class="py-2" />
        <!-- schedule -->
        <div v-if="run.runType == 'schedule'">
          <div class="w-full flex flex-wrap py-2">
            <UFormGroup label="Max Repeat" name="max_repeat" class="w-full sm:w-2/5 mx-2">
              <UInput v-model="run.schedule.maxRepeat" placeholder="Max Repeat" size="md" autocomplete="off" />
            </UFormGroup>
            <UFormGroup label="Term Repeat" name="term_repeat" class="w-full sm:w-2/5 mx-2">
              <USelectMenu v-model="run.schedule.termRepeat" :options="termRepeat" option-attribute="label"
                value-attribute="value" size="md" />
            </UFormGroup>
          </div>
          <div class="w-full py-2">
            <div class="flex flex-row py-2">
              <UCheckbox label="시작일" v-model="run.schedule.start" />
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(run.schedule.startDate, dateFormat)" :disabled="!run.schedule.start" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-calendar" :disabled="!run.schedule.start" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="run.schedule.startDate" mode="date" @close="close" />
                  </template>
                </UPopover>
              </UButtonGroup>
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(run.schedule.startTime, timeFormat)" :disabled="!run.schedule.start" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-clock" :disabled="!run.schedule.start" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="run.schedule.startTime" mode="time" />
                  </template>
                </UPopover>
              </UButtonGroup>
            </div>
            <div class="flex flex-row py-2">
              <UCheckbox label="종료일" v-model="run.schedule.end" />
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(run.schedule.endDate, dateFormat)" :disabled="!run.schedule.end" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-calendar" :disabled="!run.schedule.end" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="run.schedule.endDate" mode="date" @close="close" />
                  </template>
                </UPopover>
              </UButtonGroup>
              <UButtonGroup orientation="horizontal" class="mx-2">
                <UInput :model-value="format(run.schedule.endTime, timeFormat)" :disabled="!run.schedule.end" />
                <UPopover :popper="{ placement: 'bottom-start' }" class="mx-2 ">
                  <UButton icon="i-heroicons-clock" :disabled="!run.schedule.end" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="run.schedule.endTime" mode="time" />
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

const run = ref({
  name: '',
  pipelineId: '',
  pipelineName: '',
  pipelineVersionId: '',
  PipelineVersionName: '',
  experimentId: '',
  experimentName: '',
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

const pipelineModalOpen = ref(false);
const pipelineVersionModalOpen = ref(false);
const experimentModalOpen = ref(false);

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
      // click: createtExperiment
    },
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