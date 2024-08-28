<template>
  <div class="flex flex-wrap w-full">
    <UTable :rows="items" :columns="columns"
      :ui="{ th: { padding: 'p-2', size: 'text-xs' }, td: { padding: 'p-2', size: 'text-xs' } }" class="w-full">
      <template #label-data="{ row }">
        <div class="font-bold lg:w-8 lg:text-nowrap w-16 text-wrap grow">{{ row.label }}</div>
      </template>
      <template #value-data="{ row }">
        <div class="xs:text-wrap">{{ row.value }}</div>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
const items = defineModel({ default: [] })
const isEditable = defineModel('isEditable', { default: false })


const columns = ref([
  {
    key: 'label',
    label: ''
  },
  {
    key: 'value',
    label: ''
  }
])

</script>