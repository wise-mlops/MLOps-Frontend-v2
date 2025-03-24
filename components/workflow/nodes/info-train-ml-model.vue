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
          <USelectMenu v-model="modelName" :options="item.options" size="md" :disabled="!isEditable" />
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
          <UInput type="text" v-model="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off" />
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
// const isEditable = defineModel('isEditable', { default: false })
const isEditable = ref(true)

const items = ref<Item[]>()
const componentType = ref('')
const componentTypeValue = ref('')
const modelName = ref('')


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
  if (params.value['model_name']) {
    modelName.value = params.value['model_name']
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


// modelName 변경 감지
watch(modelName, (newModelName) => {
  if (!newModelName) return;

  // items 배열에서 algorithm 항목의 options 업데이트

  items.value = items.value?.map(item => {

    if (item.id === 'model_name') {
      item.value = newModelName
    }
    if (item.id === 'algorithm') {
      //현재 item.value의 값이 algorithmList.value[newModelName] 배열 안에 없으면 초기화
      if (!algorithmList.value[newModelName]?.includes(item.value)) {
        item.value = ''
      }

      item.options = algorithmList.value[newModelName] || [] // modelName에 따른 options 설정        item.options: algorithmList.value[newModelName] || [] // modelName에 따른 options 설정
    }

    return item;
  });

}, { deep: true })


const componentTypes = ref([
  {
    label: 'Train Model with CSV',
    value: 'train_model_with_csv'
  },
])


const modelList = ref<string[]>([
  "classifier",
  "regressor"
])

const algorithmList = ref<EnumItem>({
  classifier: ["decision_tree", "gaussian_naive_bayes", "logistic_regression", "multinomial_naive_bayes", "random_forest", "support_vector_classification"],
  regressor: ["bayesian_ridge", "decision_tree", "elastic_net", "gradient_boosting", "kernel_ridge", "linear_regression", "sgd", "support_vector_regression"]
})

const itemTemplate = ref<ItemTemplate>(
  {
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
        type: 'list',
        options: ['classifier', 'regressor'],
        value: modelName.value
      },
      {
        id: 'algorithm',
        label: 'Algorithm',
        type: 'list',
        options: [],
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