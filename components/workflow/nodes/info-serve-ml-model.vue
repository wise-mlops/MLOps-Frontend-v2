<template>
  <div>
    <div>
      <!-- selectbox로 선택하게 해야 함-->
      <UFormGroup label="Component Type" class="py-2">
        <USelectMenu v-model="componentTypeValue" :options="componentTypes" size="md" :disabled="!isEditable" />
      </UFormGroup>
    </div>
    <div v-for="item in items" :key="item.id">
      <div v-if="item.type == 'type'">
        <UInput type="hidden" v-model="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off" />
      </div>
      <div v-else-if="item.type === 'map'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <ModuleKeyValue v-model="item.value" :isEditable="isEditable" />
        </UFormGroup>
      </div>
      <div v-else>
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <UInput type="text" v-model="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off"
            :disabled="!isEditable" />
        </UFormGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Attribute {
  [key: string]: any
}

interface Item {
  id: string
  label: string
  type: string
  options?: string[]
  value: any
}

interface EnumItem {
  [key: string]: string[]
}

interface ItemTemplate {
  [key: string]: Item[]
}

const params = defineModel<Attribute>({ default: [] })
const isEditable = defineModel('isEditable', { default: false })


const items = ref<Item[]>()
const componentType = ref('')
const componentTypeValue = ref('')



// items 변경 감지
watch(items, (newItems) => {
  // 재귀 방지를 위해 값이 실제로 변경되었는지 확인
  if (!newItems) return;
  const newAttribute = itemsToAttribute(newItems)
  if (params.value['type'] === componentType.value) {
    params.value = newAttribute
  }
}, { deep: true })

// componentType 변경 감지
watch(componentTypeValue, (newType: any) => {

  if (!newType.value) {
    return
  }
  componentType.value = newType.value
  let template = itemTemplate.value[newType.value]
  items.value = template

  if (params.value['type'] == newType.value) {
    items.value = attributeToItems(params.value, itemTemplate.value[componentTypeValue.value])
  } else {
    params.value = itemsToAttribute(template)
  }
})

onMounted(() => {
  // 초기값 설정
  if (params.value['type']) {
    componentType.value = params.value['type']
    componentTypeValue.value = params.value['type']
    items.value = attributeToItems(params.value, itemTemplate.value[componentTypeValue.value])
  }

})

// Attribute 객체를 items 배열로 변환하는 함수
const attributeToItems = (attr: Attribute, existingItems: Item[] = []) => {

  return Object.entries(attr).map(([key, value]) => {
    // 기존 items에서 동일한 id를 가진 항목 찾
    const existingItem = existingItems.find(item => item.id === key)
    return {
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // snake_case를 타이틀 케이스로 변환
      // type: typeof value,
      type: existingItem?.type || '',
      options: existingItem?.options || [],
      value: value
    };
  }) as Item[];
};
// items 배열을 Attribute 객체로 변환하는 함수
const itemsToAttribute = (items: Item[]) => {

  const attribute: Attribute = {}
  items.forEach(item => {
    attribute[item.id] = item.value;

  });

  return attribute as Attribute;
};



const componentTypes = ref([
  {
    label: 'Serve Model',
    value: 'serve_model'
  },
])


const itemTemplate = ref<ItemTemplate>(
  {
    serve_model: [
      {
        id: 'type',
        label: 'Serve Model',
        type: 'type',
        value: 'serve_model'
      },
      {
        id: 'inference_service_name',
        label: 'Inference Service Name',
        type: 'string',
        value: ''
      },
      {
        id: 'model_format',
        label: 'Model Format',
        type: 'string',
        value: 'llm'
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'storage_uri',
        label: 'Storage URI',
        type: 'string',
        value: ''
      },
      {
        id: 'protocol_version',
        label: 'Protocol Version',
        type: 'string',
        value: 'v2'
      },
      {
        id: 'namespace',
        label: 'Namespace',
        type: 'string',
        value: 'kubeflow-user-example-com'
      },
      {
        id: 'service_account_name',
        label: 'Service Account Name',
        type: 'string',
        value: 'storage-system-minio-sa'
      },
      {
        id: 'vllm_options',
        label: 'VLLM Options',
        type: 'map',
        value: {}
      },
      {
        id: 'vllm_envs',
        label: 'VLLM Envs',
        type: 'map',
        value: {}
      },
      {
        id: 'resources',
        label: 'Resources',
        type: 'map',
        value: {}
      },
      {
        id: 'target_node',
        label: 'Target Node',
        type: 'string',
        value: ''
      },
      {
        id: 'annotations',
        label: 'Annotations',
        type: 'map',
        value: {}
      }

    ],
  })


</script>