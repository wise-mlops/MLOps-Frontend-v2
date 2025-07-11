<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <ModuleDataTable v-model:columns="recurringRunColumns" v-model:data="data" v-model:pending="pending">
      <template #display_name-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-64">
            {{ row.display_name ? row.display_name : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.display_name ? row.display_name : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #status-data="{ row }">
        <div>
          <UBadge
            :color="row.status === 'ENABLED' ? 'blue' : 'gray'"
            :variant="row.status === 'ENABLED' ? 'solid' : 'outline'"
            :label="row.status === 'ENABLED' ? 'ENABLED' : 'DISABLED'"
          />
        </div>
      </template>
      <template #trigger-data="{ row }">
        <div>
          {{ formatTrigger(row.trigger) }}
        </div>
      </template>
      <template #experiment_id-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-36">
            {{ row.experiment_id ? row.experiment_id : '' }}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.experiment_id ? row.experiment_id : '' }}
            </div>
          </template>
        </UPopover>
      </template>
      <template #pipeline_version_reference.pipeline_id-data="{ row }">
        <UPopover mode="hover">
          <div class="truncate max-w-36">
            {{ row.pipeline_version_reference?.pipeline_id? row.pipeline_version_reference.pipeline_id : ''}}
          </div>
          <template #panel>
            <div class="text-wrap p-4">
              {{ row.pipeline_version_reference?.pipeline_id? row.pipeline_version_reference.pipeline_id : ''}}
            </div>
          </template>
        </UPopover>
      </template>
      <template #created_at-data="{ row }">
        <div>
          {{ new Date(row.created_at).toLocaleString() }}
        </div>
      </template>
      <template #updated_at-data="{ row }">
        <div>
          {{ new Date(row.updated_at).toLocaleString() }}
        </div>
      </template>
        <template #action-data="{ row }">
          <div>
            <UTooltip :text="row.status === 'ENABLED' ? '정지' : '실행'">
              <UButton
                @click="toggleRecurringRunStatus(row)"
                :icon="row.status === 'ENABLED' ? 'i-heroicons-pause' : 'i-heroicons-play'"
                variant="ghost"
                class="p-1 mx-2"
              />
            </UTooltip>
            <UTooltip text="detail">
              <UButton @click="detailRecurringRun(row.recurring_run_id)" icon="i-heroicons-pencil-square" variant="ghost" class="p-1 mx-2" />
            </UTooltip>
            <UTooltip text="delete">
              <UButton @click="deleteRecurringRun(row.recurring_run_id)" icon="i-heroicons-trash" variant="ghost" class="px-2 py-0" />
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
    label: 'Recurring Runs',
  },
])
const pageTitle = ref('Recurring Runs')
const pending = ref(true)
const data = ref([])

const loadRecurringRuns = async () => {
  const response = await getRecurringRuns(null);
  data.value = response.result ? response.result.result : []
  pending.value = false;
}

const reloadRecurringRuns = () => {
  pending.value = true;
  data.value = []
  loadRecurringRuns();
}

const detailRecurringRun = (recurring_run_id: string) => {
  navigateTo(`/recurring-runs/details/${recurring_run_id}`)
}

const deleteRecurringRun = async (recurring_run_id: string) => {
  if (confirm('delete?')) {
    const response = await removeRecurringRun(recurring_run_id)

    if (response.code == 130200) {
      alert(`deleted`)
      reloadRecurringRuns();
    } else {
      alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
    }
  }
}

// formatTrigger 함수에 weeks와 months 추가
const formatTrigger = (trigger) => {
  if (!trigger) return '-'
  if (trigger.cron_schedule?.cron) {
    return `${trigger.cron_schedule.cron}`
  }
  if (trigger.periodic_schedule?.interval_second) {
    const seconds = parseInt(trigger.periodic_schedule.interval_second)
    const months = Math.floor(seconds / (86400 * 30)) // 대략적인 월 계산
    const weeks = Math.floor(seconds / (86400 * 7))
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor(seconds / 60)

    if (months > 0) return `Every ${months} month${months > 1 ? 's' : ''}`
    if (weeks > 0) return `Every ${weeks} week${weeks > 1 ? 's' : ''}`
    if (days > 0) return `Every ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `Every ${hours} hour${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `Every ${minutes} minute${minutes > 1 ? 's' : ''}`
    return `Every ${seconds} second${seconds > 1 ? 's' : ''}`
  }
  return '-'
}

const toggleRecurringRunStatus = async (recurring_run: any) => {
  const isEnabled = recurring_run.status === 'ENABLED'
  const action = isEnabled ? 'disable' : 'enable'

  if (confirm(`Really ${action} this recurring run?`)) {
    try {
      const response = isEnabled
        ? await disableRecurringRun(recurring_run.recurring_run_id)
        : await enableRecurringRun(recurring_run.recurring_run_id)

      if (response.code == 130200) {
        alert(`${action.charAt(0).toUpperCase() + action.slice(1)}d successfully`)
        await reloadRecurringRuns()
      } else {
        alert("Error[" + response.code + "]: " + response.message)
      }
    } catch (error) {
      alert(`Error ${action}ing recurring run: ${error}`)
    }
  }
}

onMounted(() => {
  loadRecurringRuns();
})
// toolbar links  
const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadRecurringRuns
    },
    {
      label: '등록',
      icon: 'i-heroicons-pencil-square-solid',
      to: '/recurring-runs/add'
    }]
])

const recurringRunColumns = ref([
  {
    key: 'display_name',
    label: '이름'
  },
  {
    key: 'status',
    label: '상태'
  },
  {
    key: 'trigger',
    label: 'Trigger'
  },
  {
    key: 'experiment_id',
    label: 'Experiment'
  },
  {
    key: 'pipeline_version_reference.pipeline_id',
    label: 'Pipeline'
  },
  {
    key: 'created_at',
    label: '생성일시'
  },
  {
    key: 'updated_at',
    label: '최종갱신'
  },
  {
    key: 'action',
    label: '작업'
  },
])
</script>

<style></style>