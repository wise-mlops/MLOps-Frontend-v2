<template>
  <div>
    <UTable
      :rows="paginatedData"
      :columns="columns"
      :loading="pending"
      v-model="modelValue"
      :loading-state="{ icon: 'i-heroicons-arrow-path', label: 'Loading' }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'No items.' }"
      @select="$emit('select', $event)"
    >
      <template v-for="(_, slot) of $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </UTable>
    <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <UPagination v-model="page" :page-count="pageCount" :total="data ? data.length : 0" />
    </div>
  </div>
</template>

<script setup lang="ts">
const columns = defineModel<any>("columns", { default: [] })
const data = defineModel<any>("data", { default: [] })
const pending = defineModel<any>("pending", { default: false })

// rows prop 추가
const props = defineProps<{
  rows?: number
}>()

const page = ref(1)
// props.rows를 사용하고, 기본값은 10
const pageCount = computed(() => props.rows || 10)
const modelValue = defineModel<any>("modelValue", { default: [] })

// 변수명을 더 명확하게 변경
const paginatedData = computed(() => {
  return data.value.slice((page.value - 1) * pageCount.value, page.value * pageCount.value)
})
</script>