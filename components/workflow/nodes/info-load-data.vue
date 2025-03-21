<template>
  <div>
    <div>
      <!-- selectbox로 선택하게 해야 함-->
      <!-- <UFormGroup label="Component Type" class="py-2">
        <USelectMenu v-model="componentType" :options="componentTypes" size="md" :disabled="!isEditable" />
      </UFormGroup> -->
    </div>
    <div v-for="item in items" :key="item.id">
      <UFormGroup :label="item.label" :name="item.id" class="py-2">
        <UInput type="text" v-model="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off" />
      </UFormGroup>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Attribute {
  // type: string
  [key: string]: any
}

const params = defineModel<Attribute>({ default: [] })
// const isEditable = defineModel('isEditable', { default: false })
const isEditable = ref(true)

const items = ref([
  {
    id: 'type',
    label: 'Load Data From Storage',
    type: 'string',
    value: 'load_data_from_storage'
  },
  {
    id: 'endpoint_url',
    label: 'Endpoint URL',
    type: 'string',
    value: 'http://storage-system-minio.storage-system.svc.cluster.local:9000'
  },
  {
    id: 'access_key',
    label: 'Access Key',
    type: 'string',
    value: 'minio'
  },
  {
    id: 'secret_key',
    label: 'Secret Key',
    type: 'string',
    value: 'minio123'
  },
  {
    id: 'bucket_name',
    label: 'Bucket Name',
    type: 'string',
    value: ''
  },
  {
    id: 'object_path',
    label: 'Object Path',
    type: 'string',
    value: ''
  },

])

// const componentTypes = ref([
//   {
//     label: 'Load Data From Storage',
//     value: 'load_data_from_storage'
//   },
// ])

const componentType = ref('')

// items 변경 감지
watch(items, (newItems) => {
  // 재귀 방지를 위해 값이 실제로 변경되었는지 확인

  const newAttribute = itemsToAttribute(newItems)
  if (JSON.stringify(newAttribute) !== JSON.stringify(params.value)) {
    params.value = newAttribute
  }
}, { deep: true })

// componentType 변경 감지
// watch(componentType, (newType) => {
//   if (params.value) {
//     console.log(params.value)
//     // items.value = attributeToItems(params.value)

//     // params.value.type = newType.value

//   }
// })

// params 변경 감지
// watch(() => params.value, (newParams) => {

//   if (newParams && Object.keys(newParams).length > 0) {
//     const newItems = attributeToItems(newParams)
//     if (JSON.stringify(newItems) !== JSON.stringify(items.value)) {
//       items.value = newItems
//     }
//   }
// }, { deep: true })

onMounted(() => {
  // 초기값 설정
  console.log(params.value.value)
  if (params.value) {
    console.log('=-=')
    items.value = attributeToItems(params.value.value)
  }
  console.log(items.value)


})

// Attribute 객체를 items 배열로 변환하는 함수
const attributeToItems = (attr: Attribute) => {

  return Object.entries(attr)
    .map(([key, value]) => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // snake_case를 타이틀 케이스로 변환
      type: typeof value,
      value: value
    }));
};

// items 배열을 Attribute 객체로 변환하는 함수
const itemsToAttribute = (items: any[]) => {

  // const attribute: Attribute = {
  //   type: componentType.value // 기존 componentType 유지
  // };
  const attribute: Attribute = {}

  items.forEach(item => {
    attribute[item.id] = item.value;
  });

  return attribute;
};


</script>
