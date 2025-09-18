<template>
  <div class="flex flex-wrap w-full">
    <UTable :rows="items" :columns="columns"
      :ui="{
        th: { padding: 'p-2', size: 'text-xs' },
        td: { padding: 'p-2', size: 'text-xs' }
      }"
      class="w-full label-value-table">
      <template #label-data="{ row }">
        <div class="font-bold text-nowrap">
          {{ row.label }}
        </div>
      </template>
      <template #value-data="{ row }">
        <div class="break-words" style="white-space: pre-line;">
          {{ row.value }}
        </div>
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

<style scoped>
.label-value-table :deep(td:first-child) {
  width: 200px;
  min-width: 150px;
}
.label-value-table :deep(td:last-child) {
  width: auto;
}
</style>