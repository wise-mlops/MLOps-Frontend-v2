<template>
  <div>
    <div>
      <!-- selectbox로 선택하게 해야 함-->
      <UFormGroup label="Component Type" class="py-2">
        <USelectMenu v-model="componentTypeValue" :options="componentTypes" size="md" :disabled="!isEditable" />
      </UFormGroup>
    </div>
    <div v-for="item in items" :key="item.id">
      <div v-if="item.type === 'type'">
        <UInput type="hidden" v-model="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off" />
      </div>
      <div v-else-if="item.type === 'list'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <USelectMenu v-model="item.value" :options="item.options" size="md" :disabled="!isEditable" />
        </UFormGroup>
      </div>
      <div v-else-if="item.type === 'bool'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <!--Toggle-->
          <UToggle v-model="item.value" size="md" :disabled="!isEditable" />
        </UFormGroup>
      </div>
      <div v-else-if="item.type === 'number'">
        <UFormGroup :label="item.label" :name="item.id" class="py-2">
          <UInput type="number" v-model.number="item.value" placeholder="Value" variant="outline" size="md" autocomplete="off"
            :disabled="!isEditable" />
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
  // if (JSON.stringify(newAttribute) !== JSON.stringify(params.value)) {
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
    items.value = attributeToItems(params.value)
  } else {
    params.value = itemsToAttribute(template)
  }
})

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
  if (params.value['type']) {
    componentType.value = params.value['type']
    componentTypeValue.value = params.value['type']
    items.value = attributeToItems(params.value, itemTemplate.value[componentTypeValue.value])
  }
})

// Attribute 객체를 items 배열로 변환하는 함수
const attributeToItems = (attr: Attribute, existingItems: Item[] = []) => {
  const items: Item[] = []
  
  // technique_params를 분해하여 개별 파라미터로 처리
  Object.entries(attr).forEach(([key, value]) => {
    if (key === 'technique_params' && typeof value === 'object' && value !== null) {
      // technique_params 내부의 각 파라미터를 개별 item으로 추가
      Object.entries(value).forEach(([techKey, techValue]) => {
        const existingItem = existingItems.find(item => item.id === techKey)
        items.push({
          id: techKey,
          label: techKey.charAt(0).toUpperCase() + techKey.slice(1).replace(/_/g, ' '),
          type: existingItem?.type || '',
          options: existingItem?.options || [],
          value: techValue
        })
      })
    } else {
      // 일반 파라미터 처리
      const existingItem = existingItems.find(item => item.id === key)
      items.push({
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), // snake_case를 타이틀 케이스로 변환
        type: existingItem?.type || '',
        options: existingItem?.options || [],
        value: value
      })
    }
  })
  
  return items
};
// items 배열을 Attribute 객체로 변환하는 함수
const itemsToAttribute = (items: Item[]) => {

  const attribute: Attribute = {}
  const techniqueParams: Record<string, any> = {}
  
  let currentTechnique = 'prompt' // prompt tuning component이므로 기본값을 prompt로 설정
  
  items.forEach(item => {
    // technique별 파라미터들을 technique_params로 묶기
    const isTechniqueParam = (
      currentTechnique === 'prompt' && 
      ['task_type', 'num_virtual_tokens', 'prompt_tuning_init', 'prompt_tuning_init_text', 'prompt_template_type'].includes(item.id)
    ) || (
      currentTechnique === 'prefix' && 
      ['task_type', 'num_virtual_tokens'].includes(item.id)
    )
    
    if (isTechniqueParam) {
      techniqueParams[item.id] = item.value
    } else {
      attribute[item.id] = item.value
    }
  });
  
  // technique_params가 비어있지 않으면 추가
  if (Object.keys(techniqueParams).length > 0) {
    attribute['technique_params'] = techniqueParams
  }

  return attribute as Attribute;
};

const componentTypes = ref([
  {
    label: 'Prompt Tuning Model (CSV)',
    value: 'prompt_tuning_model_with_csv'
  },
  {
    label: 'Prefix Tuning Model (CSV)',
    value: 'prefix_tuning_model_with_csv'
  },

])

const itemTemplate = ref<ItemTemplate>(
  {
    prompt_tuning_model_with_csv: [
      {
        id: 'type',
        label: 'Prompt Tuning Model (CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'prompt_template',
        label: 'Prompt Template',
        type: 'string',
        value: ''
      },
      {
        id: 'max_length',
        label: 'Max Length',
        type: 'number',
        value: 256
      },
      {
        id: 'text_column',
        label: 'Text Column',
        type: 'string',
        value: 'text'
      },
      {
        id: 'label_column',
        label: 'Label Column',
        type: 'string',
        value: 'label'
      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 1
      },
      {
        id: 'fp16',
        label: 'Use FP16',
        type: 'boolean',
        value: false
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        options: ['steps', 'epoch', 'no', 'best'],
        type: 'list',
        value: 'steps'
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 8
      },
      {
        id: 'save_steps',
        label: 'Save Steps',
        type: 'number',
        value: 100
      },
      {
        id: 'logging_steps',
        label: 'Logging Steps',
        type: 'number',
        value: 10
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        options: ['steps', 'epoch', 'no'],
        type: 'list',
        value: 'steps'
      },
      {
        id: 'eval_steps',
        label: 'Eval Steps',
        type: 'number',
        value: 100
      },
      {
        id: 'prediction_loss_only',
        label: 'Prediction Loss Only',
        type: 'bool',
        value: true
      },
      {
        id: 'input_requirement',
        label: 'Input Requirement',
        type: 'bool',
        value: true
      },
      {
        id: 'output_requirement',
        label: 'Output Requirement',
        type: 'bool',
        value: true
      },
      {
        id: 'image_url',
        label: 'Image URL',
        type: 'string',
        value: ''
      },
      {
        id: 'secret_name',
        label: 'Secret Name',
        type: 'string',
        value: ''
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      },
      // Technique-specific parameters for prompt tuning
      {
        id: 'task_type',
        label: 'Task Type',
        type: 'list',
        options: ['CAUSAL_LM', 'SEQ_2_SEQ_LM'],
        value: 'CAUSAL_LM'
      },
      {
        id: 'num_virtual_tokens',
        label: 'Virtual Tokens Count',
        type: 'number',
        value: 20
      },
      {
        id: 'prompt_tuning_init',
        label: 'Prompt Tuning Init',
        type: 'list',
        options: ['TEXT', 'RANDOM'],
        value: 'RANDOM'
      },
      {
        id: 'prompt_tuning_init_text',
        label: 'Prompt Tuning Init Text',
        type: 'string',
        value: ''
      },
      {
        id: 'prompt_template_type',
        label: 'Prompt Template Type',
        type: 'list',
        options: ['classification', 'sentiment', 'summarization', 'qa', 'generation', 'translation', 'ner', 'paraphrase'],
        value: 'classification'
      },
    ],
    prefix_tuning_model_with_csv: [
      {
        id: 'type',
        label: 'Prefix Tuning Model (CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'prompt_template',
        label: 'Prompt Template',
        type: 'string',
        value: ''
      },
      {
        id: 'max_length',
        label: 'Max Length',
        type: 'number',
        value: 256
      },
      {
        id: 'text_column',
        label: 'Text Column',
        type: 'string',
        value: 'text'
      },
      {
        id: 'label_column',
        label: 'Label Column',
        type: 'string',
        value: 'label'
      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 1
      },
      {
        id: 'fp16',
        label: 'Use FP16',
        type: 'boolean',
        value: false
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        options: ['steps', 'epoch', 'no', 'best'],
        type: 'list',
        value: 'steps'
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 8
      },
      {
        id: 'save_steps',
        label: 'Save Steps',
        type: 'number',
        value: 100
      },
      {
        id: 'logging_steps',
        label: 'Logging Steps',
        type: 'number',
        value: 10
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        options: ['steps', 'epoch', 'no'],
        type: 'list',
        value: 'steps'
      },
      {
        id: 'eval_steps',
        label: 'Eval Steps',
        type: 'number',
        value: 100
      },
      {
        id: 'prediction_loss_only',
        label: 'Prediction Loss Only',
        type: 'bool',
        value: true
      },
      {
        id: 'input_requirement',
        label: 'Input Requirement',
        type: 'bool',
        value: true
      },
      {
        id: 'output_requirement',
        label: 'Output Requirement',
        type: 'bool',
        value: true
      },
      {
        id: 'image_url',
        label: 'Image URL',
        type: 'string',
        value: ''
      },
      {
        id: 'secret_name',
        label: 'Secret Name',
        type: 'string',
        value: ''
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      },
      // Technique-specific parameters for prefix tuning
      {
        id: 'task_type',
        label: 'Task Type',
        type: 'list',
        options: ['CAUSAL_LM', 'SEQ_2_SEQ_LM'],
        value: 'CAUSAL_LM'
      },
      {
        id: 'num_virtual_tokens',
        label: 'Virtual Tokens Count',
        type: 'number',
        value: 20
      },
    ]

  })


</script>
