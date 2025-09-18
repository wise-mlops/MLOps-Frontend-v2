<template>
  <div>
    <UTable
      :rows="paginatedData"
      :columns="columns"
      :loading="pending"
      v-model="modelValue"
      :sort="sort"
      :loading-state="{ icon: 'i-heroicons-arrow-path', label: 'Loading' }"
      :progress="{ color: 'primary', animation: 'carousel' }"
      :empty-state="{ icon: 'i-heroicons-circle-stack', label: 'No items.' }"
      @select="emit('select', $event)"
      @update:sort="onSortChange"
    >
      <template v-for="(_, slot) of $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope" />
      </template>
    </UTable>
    <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <UPagination v-model="page" :page-count="pageCount" :total="sortedData.length" />
    </div>
  </div>
</template>

<script setup lang="ts">
const columns = defineModel<any>("columns", { default: [] })
const data = defineModel<any>("data", { default: [] })
const pending = defineModel<any>("pending", { default: false })

const props = defineProps<{
  rows?: number
  defaultSort?: {
    column: string
    direction: 'asc' | 'desc'
  }
}>()

const emit = defineEmits(['select'])

const page = ref(1)
const pageCount = computed(() => props.rows || 10)
const modelValue = defineModel<any>("modelValue", { default: [] })

// 정렬 상태 관리
// 기본 정렬 설정 - created_at 컬럼이 있으면 자동으로 설정
const getDefaultSort = () => {
  if (props.defaultSort) return props.defaultSort

  // columns에서 created_at이 있는지 확인
  const hasCreatedAt = columns.value.some((col: any) => col.key === 'created_at')
  if (hasCreatedAt) {
    return { column: 'created_at', direction: 'desc' as const }
  }

  // updated_at이 있는지 확인
  const hasUpdatedAt = columns.value.some((col: any) => col.key === 'updated_at')
  if (hasUpdatedAt) {
    return { column: 'updated_at', direction: 'desc' as const }
  }

  return { column: '', direction: 'asc' as const }
}

const sort = ref(getDefaultSort())

// columns가 변경될 때 기본 정렬도 업데이트
watch(columns, () => {
  if (!props.defaultSort && sort.value.column === '') {
    sort.value = getDefaultSort()
  }
}, { immediate: true })

// 정렬된 데이터
const sortedData = computed(() => {
  if (!sort.value.column || !data.value.length) {
    return data.value
  }

  return [...data.value].sort((a, b) => {
    const aValue = getNestedValue(a, sort.value.column)
    const bValue = getNestedValue(b, sort.value.column)

    // null/undefined 처리
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sort.value.direction === 'asc' ? 1 : -1
    if (bValue == null) return sort.value.direction === 'asc' ? -1 : 1

    // 문자열과 숫자 구분해서 정렬
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sort.value.direction === 'asc' ? comparison : -comparison
    }

    if (aValue < bValue) return sort.value.direction === 'asc' ? -1 : 1
    if (aValue > bValue) return sort.value.direction === 'asc' ? 1 : -1
    return 0
  })
})

// 페이지네이션된 데이터 (정렬된 데이터 기준)
const paginatedData = computed(() => {
  return sortedData.value.slice((page.value - 1) * pageCount.value, page.value * pageCount.value)
})

// 정렬 변경 핸들러
const onSortChange = (newSort: { column: string; direction: 'asc' | 'desc' }) => {
  sort.value = newSort
  page.value = 1 // 정렬 변경 시 첫 페이지로 이동
}

// 중첩된 객체 속성 값 가져오기 (예: 'user.name')
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}
</script>