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
      <div v-else-if="item.id == 'model_name'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <UInput type="text" v-model="item.value" placeholder="Enter model name" variant="outline" size="md" autocomplete="off" :disabled="!isEditable" />
        </UFormGroup>
      </div>
      <div v-else-if="item.id == 'model_type'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <USelectMenu v-model="item.value" :options="item.options" size="md" :disabled="!isEditable" />
        </UFormGroup>
      </div>
      <div v-else-if="item.id == 'algorithm'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <USelectMenu v-model="item.value" :options="item.options" size="md" :disabled="!isEditable" />
        </UFormGroup>
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
  if (!newItems) return;
  const newAttribute = itemsToAttribute(newItems)
  if (params.value['type'] === componentType.value) {
    params.value = newAttribute
  }
}, { deep: true })

// componentType 변경 감지
watch(componentTypeValue, (newType: any) => {
  if (!newType) return
  
  // newType이 객체인 경우 처리
  const typeValue = typeof newType === 'object' ? newType.value : newType
  componentType.value = typeValue
  
  let template = itemTemplate.value[typeValue]
  if (params.value['type'] == typeValue) {
    items.value = attributeToItems(params.value, template)
  } else {
    items.value = JSON.parse(JSON.stringify(template)) // 깊은 복사
    params.value = itemsToAttribute(items.value)
  }
})

// model_type 변경 감지 추가
watch(items, (newItems) => {
  if (!newItems) return;
  
  const modelTypeItem = newItems.find(item => item.id === 'model_type')
  const algorithmItem = newItems.find(item => item.id === 'algorithm')
  
  if (modelTypeItem && algorithmItem) {
    // model_type이 변경되면 algorithm options 업데이트
    const newOptions = algorithmList.value[modelTypeItem.value] || []
    if (JSON.stringify(algorithmItem.options) !== JSON.stringify(newOptions)) {
      algorithmItem.options = newOptions
      // 현재 선택된 algorithm이 새로운 options에 없으면 초기화
      if (!newOptions.includes(algorithmItem.value)) {
        algorithmItem.value = ''
      }
    }
  }
}, { deep: true })

onMounted(() => {
  // 초기값 설정
  if (params.value['type']) {
    componentType.value = params.value['type']
    componentTypeValue.value = componentTypes.value.find(ct => ct.value === params.value['type']) || params.value['type']
    items.value = attributeToItems(params.value, itemTemplate.value[params.value['type']])
  }
})

// Attribute 객체를 items 배열로 변환하는 함수
const attributeToItems = (attr: Attribute, existingItems: Item[] = []) => {
  return existingItems.map(templateItem => {
    const value = attr[templateItem.id] !== undefined ? attr[templateItem.id] : templateItem.value
    return {
      ...templateItem,
      value: value
    }
  })
}

// items 배열을 Attribute 객체로 변환하는 함수
const itemsToAttribute = (items: Item[]) => {
  const attribute: Attribute = {}
  items.forEach(item => {
    attribute[item.id] = item.value;
  });
  return attribute as Attribute;
}

const componentTypes = ref([
  {
    label: 'Train Model with CSV',
    value: 'train_model_with_csv'
  },
])

const algorithmList = ref<EnumItem>({
  classifier: ["decision_tree", "gaussian_naive_bayes", "logistic_regression", "multinomial_naive_bayes", "random_forest", "support_vector_classification"],
  regressor: ["bayesian_ridge", "decision_tree", "elastic_net", "gradient_boosting", "kernel_ridge", "linear_regression", "sgd", "support_vector_regression"]
})

const itemTemplate = ref<ItemTemplate>({
  train_model_with_csv: [
    {
      id: 'type',
      label: 'Train Model with CSV',
      type: 'type',
      value: 'train_model_with_csv'
    },
    {
      id: 'model_name',
      label: 'Model Name',
      type: 'string',
      value: ''
    },
    {
      id: 'model_type',
      label: 'Model Type',
      type: 'list',
      options: ['classifier', 'regressor'],
      value: ''
    },
    {
      id: 'algorithm',
      label: 'Algorithm',
      type: 'list',
      options: [], // 초기값은 빈 배열, model_type 선택 시 업데이트됨
      value: ''
    },
    {
      id: 'hyperparameters',
      label: 'Hyperparameters',
      type: 'map',
      value: {
        criterion: "gini",
        max_depth: 100,
        min_samples_split: 2,
        min_samples_leaf: 1,
      }
    },
    {
      id: 'target_column',
      label: 'Target Column',
      type: 'string',
      value: ''
    },
    {
      id: 'input_columns',
      label: 'Input Columns',
      type: 'string',
      value: ''
    },
    {
      id: 'test_size_ratio',
      label: 'Test Size Ratio',
      type: 'float',
      value: 0.2
    },
    {
      id: 'experiment_name',
      label: 'Experiment Name',
      type: 'string',
      value: ''
    }
  ],
})
</script>