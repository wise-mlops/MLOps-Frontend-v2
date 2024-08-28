<template>
  <div v-if="isEditable" class="flex flex-wrap w-full py-2">
    <div class="w-full sm:w-2/5">
      <UInput v-model="addItems.key" size="sm" class="px-2" />
    </div>
    <div class="w-full sm:w-2/5">
      <UInput v-model="addItems.value" size="sm" class="px-2" />
    </div>
    <div class="w-full sm:w-1/5">
      <UButton label="ADD" @click="addParam" size="sm"></UButton>
    </div>
  </div>
  <UTable :rows="tableData" :columns="columns" :loading-state="{ icon: 'i-heroicons-arrow-path', label: 'Loading' }"
    :progress="{ color: 'primary', animation: 'carousel' }"
    :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'No items.' }"
    :ui="{ th: { padding: 'p-2', size: 'text-xs' }, td: { padding: 'p-2', size: 'text-xs' } }" class="w-full">
    <template v-if="isEditable" #action-data="{ row }">
      <div class="w-1/6">
        <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" @click="deleteParam(row.key)" class="p-0" />
      </div>
    </template>
    <template #key-data="{ row }">
      <div class="w-2/6 text-wrap">
        {{ row.key }}
      </div>
    </template>
    <template #value-data="{ row }">
      <div class="w-3/6 text-wrap">
        {{ row.value }}
      </div>
    </template>
  </UTable>

</template>

<script setup lang="ts">


const items = defineModel({ default: [] });
const isEditable = defineModel('isEditable', { default: false })
const tableData = ref([])
const addItems = ref({
  key: '',
  value: ''
})

const deleteParam = (key: string) => {
  delete items.value[key]
  convertTableData();
}

const addParam = () => {
  items.value[addItems.value.key] = addItems.value.value
  addItems.value.key = ''
  addItems.value.value = ''
  convertTableData();
}

const convertTableData = () => {
  tableData.value = [items.value].map((item: any) => {
    return Object.entries(item).map(([key, value]) => {
      return { key: key, value: value }
    })
  }).flat();
}

onMounted(() => {
  convertTableData();
})

const columns = ref([
  {
    key: 'action',
    label: ' '
  },
  {
    key: 'key',
    label: 'Key'
  },
  {
    key: 'value',
    label: 'value'
  }

])


</script>