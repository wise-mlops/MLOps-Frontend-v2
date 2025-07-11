<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="flex gap-8">
        <!-- Left Side - Run details -->
        <div class="w-1/2 space-y-6">
          <h3 class="text-lg font-semibold">Run details</h3>

          <UFormGroup label="Pipeline" name="pipeline_name">
            <UButtonGroup size="md" orientation="horizontal" class="w-full">
              <UInput v-model="recurringRunForm.pipeline.display_name" placeholder="Pipeline name" size="md"
                autocomplete="off" class="flex-1" disabled />
              <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="pipelineModalOpen = true" />
            </UButtonGroup>
            <UModal v-model="pipelineModalOpen" :ui="{ width: 'max-w-4xl sm:max-w-4xl' }">
              <ModalPipelines v-model:pipeline="recurringRunForm.pipeline" v-model:isOpen="pipelineModalOpen" />
            </UModal>
          </UFormGroup>

          <UFormGroup label="Pipeline version" name="pipeline_version">
            <UButtonGroup size="md" orientation="horizontal" class="w-full">
              <UInput v-model="recurringRunForm.pipeline_version.display_name" placeholder="Pipeline version"
                size="md" autocomplete="off" class="flex-1" disabled />
              <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="pipelineVersionModal" />
            </UButtonGroup>
            <UModal v-model="pipelineVersionModalOpen" :ui="{ width: 'max-w-4xl sm:max-w-4xl' }">
              <ModalPipelineVersions v-model:pipeline="recurringRunForm.pipeline"
                v-model:pipelineVersion="recurringRunForm.pipeline_version" v-model:isOpen="pipelineVersionModalOpen" />
            </UModal>
          </UFormGroup>

          <UFormGroup label="Experiment" name="experiment_name">
            <UButtonGroup size="md" orientation="horizontal" class="w-full">
              <UInput v-model="recurringRunForm.experiment.display_name" placeholder="Experiment" size="md"
                autocomplete="off" class="flex-1" disabled />
              <UButton icon="i-heroicons-magnifying-glass" autocomplete="off" @click="experimentModalOpen = true" />
            </UButtonGroup>
            <UModal v-model="experimentModalOpen" :ui="{ width: 'max-w-4xl sm:max-w-4xl' }">
              <ModalExperiments v-model:experiment="recurringRunForm.experiment" v-model:isOpen="experimentModalOpen" />
            </UModal>
          </UFormGroup>

          <UFormGroup label="Recurring run config name" name="run_name">
            <UInput v-model="recurringRunForm.name" placeholder="Recurring run config name" size="md"
              autocomplete="off" class="w-full" />
          </UFormGroup>
        </div>

        <!-- Right Side - Run trigger -->
        <div class="w-1/2">
          <div class="bg-gray-50 rounded-lg p-6 space-y-4">
            <div>
              <h3 class="text-lg font-semibold">Run trigger</h3>
              <p class="text-sm text-gray-600 mt-1">Choose a method by which new runs will be triggered</p>
            </div>

            <!-- Trigger Type -->
            <UFormGroup label="Trigger type" name="trigger_type">
              <USelectMenu v-model="recurringRunForm.trigger.type" :options="triggerTypes" option-attribute="label"
                value-attribute="value" size="md" class="w-full" />
            </UFormGroup>

            <!-- Maximum concurrent runs -->
            <UFormGroup label="Maximum concurrent runs" name="max_concurrency">
              <UInput v-model="recurringRunForm.trigger.maxConcurrency" type="number" placeholder="10" size="md"
                autocomplete="off" class="w-full" />
            </UFormGroup>

            <!-- Date Settings in one row -->
            <div class="flex items-center space-x-4">
              <UCheckbox v-model="recurringRunForm.trigger.hasStartDate" label="Has start date" />
              <UCheckbox v-model="recurringRunForm.trigger.hasEndDate" label="Has end date" />
            </div>

            <!-- Start Date (compact) -->
            <div v-if="recurringRunForm.trigger.hasStartDate" class="flex items-center space-x-2">
              <span class="text-sm font-medium w-16">Start:</span>
              <UButtonGroup orientation="horizontal" class="flex-1">
                <UInput :model-value="format(recurringRunForm.trigger.startDate, dateFormat)" readonly class="flex-1" size="sm" />
                <UPopover :popper="{ placement: 'bottom-start' }">
                  <UButton icon="i-heroicons-calendar" size="sm" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="recurringRunForm.trigger.startDate" mode="date" @close="close" />
                  </template>
                </UPopover>
              </UButtonGroup>
              <UButtonGroup orientation="horizontal" class="flex-1">
                <UInput :model-value="format(recurringRunForm.trigger.startTime, timeFormat)" readonly class="flex-1" size="sm" />
                <UPopover :popper="{ placement: 'bottom-start' }">
                  <UButton icon="i-heroicons-clock" size="sm" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="recurringRunForm.trigger.startTime" mode="time" />
                  </template>
                </UPopover>
              </UButtonGroup>
            </div>

            <!-- End Date (compact) -->
            <div v-if="recurringRunForm.trigger.hasEndDate" class="flex items-center space-x-2">
              <span class="text-sm font-medium w-16">End:</span>
              <UButtonGroup orientation="horizontal" class="flex-1">
                <UInput :model-value="format(recurringRunForm.trigger.endDate, dateFormat)" readonly class="flex-1" size="sm" />
                <UPopover :popper="{ placement: 'bottom-start' }">
                  <UButton icon="i-heroicons-calendar" size="sm" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="recurringRunForm.trigger.endDate" mode="date" @close="close" />
                  </template>
                </UPopover>
              </UButtonGroup>
              <UButtonGroup orientation="horizontal" class="flex-1">
                <UInput :model-value="format(recurringRunForm.trigger.endTime, timeFormat)" readonly class="flex-1" size="sm" />
                <UPopover :popper="{ placement: 'bottom-start' }">
                  <UButton icon="i-heroicons-clock" size="sm" />
                  <template #panel="{ close }">
                    <ModuleDatePicker v-model="recurringRunForm.trigger.endTime" mode="time" />
                  </template>
                </UPopover>
              </UButtonGroup>
            </div>

            <!-- Catchup -->
            <div class="flex items-center">
              <UCheckbox v-model="recurringRunForm.trigger.catchup" label="Catchup" />
              <span class="text-xs text-gray-500 ml-2">Catch up if behind schedule</span>
            </div>

            <!-- Run every (compact single line) -->
            <div v-if="recurringRunForm.trigger.type === 'periodic'" class="flex items-center space-x-2">
              <span class="text-sm font-medium">Run every</span>
              <UInput v-model="recurringRunForm.trigger.intervalValue" type="number" placeholder="1"
                size="md" autocomplete="off" class="w-20" />
              <USelectMenu v-model="recurringRunForm.trigger.intervalUnit" :options="intervalUnits"
                option-attribute="label" value-attribute="value" size="md" class="w-28" />
            </div>

            <!-- Cron expression -->
            <div v-if="recurringRunForm.trigger.type === 'cron'">
              <UFormGroup label="Cron expression" name="cron_expression">
                <UInput v-model="recurringRunForm.trigger.cronExpression" placeholder="0 9 * * *"
                  size="md" autocomplete="off" class="w-full" />
                <p class="text-xs text-gray-500 mt-1">Example: "0 9 * * *" runs daily at 9:00 AM</p>
              </UFormGroup>
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
const timeFormat = 'HH:mm';
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

const pageTitle = ref('Start a recurring run')

const recurringRunForm = ref({
  name: '',
  description: '',
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
  trigger: {
    type: 'periodic',
    maxConcurrency: 10,
    catchup: true,
    hasStartDate: false,
    startDate: new Date(),
    startTime: new Date(),
    hasEndDate: false,
    endDate: new Date(),
    endTime: new Date(),
    intervalValue: 1,
    intervalUnit: 'hours',
    cronExpression: '0 9 * * *'
  }
})

const pipelineModalOpen = ref(false);
const pipelineVersionModalOpen = ref(false);
const experimentModalOpen = ref(false);

const pipelineVersionModal = () => {
  if (recurringRunForm.value.pipeline.pipeline_id) {
    pipelineVersionModalOpen.value = true
  } else {
    alert('select pipeline')
  }
}

const addRecurringRun = async () => {
  const requestBody: any = {
    experiment_id: recurringRunForm.value.experiment.experiment_id,
    job_name: recurringRunForm.value.name,
    pipeline_id: recurringRunForm.value.pipeline.pipeline_id,
    version_id: recurringRunForm.value.pipeline_version.pipeline_version_id,
    enabled: true,
    enable_caching: true,
    max_concurrency: recurringRunForm.value.trigger.maxConcurrency,
    no_catchup: !recurringRunForm.value.trigger.catchup
  };

  // Start time
  if (recurringRunForm.value.trigger.hasStartDate) {
    const startDateTime = new Date(recurringRunForm.value.trigger.startDate);
    const startTime = new Date(recurringRunForm.value.trigger.startTime);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds());
    requestBody.start_time = startDateTime.toISOString();
  }

  // End time
  if (recurringRunForm.value.trigger.hasEndDate) {
    const endDateTime = new Date(recurringRunForm.value.trigger.endDate);
    const endTime = new Date(recurringRunForm.value.trigger.endTime);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds());
    requestBody.end_time = endDateTime.toISOString();
  }

  // Scheduling type
  if (recurringRunForm.value.trigger.type === 'periodic') {
    const intervalSeconds = convertToSeconds(
      recurringRunForm.value.trigger.intervalValue,
      recurringRunForm.value.trigger.intervalUnit
    );
    requestBody.interval_second = intervalSeconds;
  } else if (recurringRunForm.value.trigger.type === 'cron') {
    requestBody.cron_expression = recurringRunForm.value.trigger.cronExpression;
  }
  console.log(requestBody)

  const response = await createRecurringRun(requestBody);
  if (response.code == 130200) {
    navigateTo(`/recurring-runs`, {
      replace: true,
      redirectCode: 301,
      external: true
    })
  } else {
    alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
  }
}

const convertToSeconds = (value: number, unit: string): number => {
  const multipliers: { [key: string]: number } = {
    'minutes': 60,
    'hours': 3600,
    'days': 86400,
    'weeks': 604800
  };
  return value * (multipliers[unit] || 3600);
}

const triggerTypes = ref([
  { label: 'Periodic', value: 'periodic' },
  { label: 'Cron', value: 'cron' }
])

const intervalUnits = ref([
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' }
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
      click: addRecurringRun
    }
  ]
])
</script>