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
    label: 'Full fine tune modeel(CSV)',
    value: 'full_fine_tune_model_with_csv'
  },
  {
    label: 'SFT fine tune model(CSV)',
    value: 'sft_fine_tune_model_with_csv'
  },
  {
    label: 'LoRA fine tune model(CSV)',
    value: 'lora_fine_tune_model_with_csv'
  },
  {
    label: 'LoRA SFT fine tune model(CSV)',
    value: 'lora_sft_fine_tune_model_with_csv'
  },
  {
    label: 'AdaLoRA fine tune model(CSV)',
    value: 'adalora_fine_tune_model_with_csv'
  },
  {
    label: 'AdaLoRA SFT fine tune model(CSV)',
    value: 'adalora_sft_fine_tune_model_with_csv'
  },
])

/* 
type: adalora_fine_tune_model_with_csv

experiment_name	Experiment Name	STRING
model_name	Model Name	STRING
target_column	Target Column	STRING
batch_size	Batch Size	INT
gradient_accumulation_steps	Gradient Accumulation Steps	INT
epochs	Epochs	INT
gradient_checkpointing	Gradient Checkpointing	BOOL
fp16	FP16 Training	BOOL
max_grad_norm	Max Gradient Norm	FLOAT
learning_rate	Learning Rate	FLOAT
save_strategy	Save Strategy	STRING
save_steps	Save Step Interval	INT
logging_steps	Logging Step Interval	INT
evaluation_strategy	Evaluation Strategy	STRING
eval_steps	Evaluation Step Interval	INT
save_total_limit	Save Total Limit	INT
prediction_loss_only	Prediction Loss Only	BOOL
max_length	Max Length	INT
init_r	Initial Rank	INT
target_r	Target Rank	INT
beta1	Beta 1	FLOAT
beta2	Beta 2	FLOAT
tinit	Initialization Steps	INT
lora_alpha	LoRA Alpha	INT
target_modules	Target Modules	LIST
lora_dropout	LoRA Dropout	FLOAT
bias	Bias	STRING
input_requirement		BOOL
output_requirement		BOOL
image_url		STRING
secret_name		STRING
use_gpu		BOOL
*/
const itemTemplate = ref<ItemTemplate>(
  {
    full_fine_tune_model_with_csv: [
      {
        id: 'type',
        label: 'Ful Fine Tune Model With CSV',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'training_type',
        label: 'Training Type',
        type: 'string',
        value: 'unsupervised'
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
        id: 'source_column',
        label: 'Source Column',
        type: 'string',
        value: ''
      },
      {
        id: 'epochs',
        label: 'epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 2
      },
      {
        id: 'save_steps',
        label: 'Save Steps',
        type: 'number',
        value: 500
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'endpoint',
        label: 'Endpoint URL',
        type: 'string',
        value: 'http://minio.storage-system.svc.cluster.local:9000'
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ],
    sft_fine_tune_model_with_csv: [
      {
        id: 'type',
        label: 'SFT Fine Tune Model(CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'training_type',
        label: 'Training Type',
        type: 'string',
        value: 'supervised'
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'source_column',
        label: 'Source Column',
        type: 'string',
        value: ''
      },
      {
        id: 'label_column',
        label: 'Label Column',
        type: 'string',
        value: ''
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 1
      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 16
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 3
      },
      {
        id: 'gradient_checkpointing',
        label: 'Gradient Checkpointing',
        type: 'bool',
        value: true
      },
      {
        id: 'fp16',
        label: 'FP16',
        type: 'bool',
        value: true
      },
      {
        id: 'max_grad_norm',
        label: 'Max Grad Norm',
        type: 'number',
        value: 0.5
      },
      {
        id: 'learning_rate',
        label: 'Learning Rate',
        type: 'number',
        value: 0.00005
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        type: 'list',
        options: ['steps', 'epoch', 'no', 'best'],
        value: 'steps'
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
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        type: 'list',
        options: ['no', 'steps', 'epoch'],
        value: 'no'
      },
      {
        id: 'eval_steps',
        label: 'Evaluation Step Interval',
        type: 'number',
        value: 100
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 3
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ],
    lora_fine_tune_model_with_csv: [
      {
        id: 'type',
        label: 'LoRA Fine Tune Model(CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'training_type',
        label: 'Training Type',
        type: 'string',
        value: 'unsupervised'
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'source_column',
        label: 'Source Column',
        type: 'string',
        value: ''
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 8

      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 1
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'gradient_checkpointing',
        label: 'Gradient Checkpointing',
        type: 'bool',
        value: false
      },
      {
        id: 'fp16',
        label: 'FP16 Training',
        type: 'bool',
        value: false
      },
      {
        id: 'max_grad_norm',
        label: 'Max Grad Norm',
        type: 'number',
        value: 1.0
      },
      {
        id: 'learning_rate',
        label: 'Learning Rate',
        type: 'number',
        value: 0.00005
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        type: 'list',
        options: ['steps', 'epoch', 'no', 'best'],
        value: 'steps'
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
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        type: 'list',
        options: ['no', 'steps', 'epoch'],
        value: 'no'
      },
      {
        id: 'eval_steps',
        label: 'Evaluation Step Interval',
        type: 'number',
        value: 100
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'prediction_loss_only',
        label: 'Prediction Loss Only',
        type: 'bool',
        value: true
      },
      {
        id: 'r',
        label: 'LoRA Rank',
        type: 'number',
        value: 8
      },
      {
        id: 'lora_alpha',
        label: 'LoRA Alpha',
        type: 'number',
        value: 16
      },
      {
        id: 'target_modules',
        label: 'Target Modules',
        type: 'list',
        options: ['q_proj', 'v_proj'],
        value: 'q_proj'
      },
      {
        id: 'lora_dropout',
        label: 'LoRA Dropout',
        type: 'number',
        value: 0.1
      },
      {
        id: 'bias',
        label: 'Bias',
        type: 'string',
        options: ['none', 'all', 'lora_only'],
        value: 'none'
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
        id: 'endpoint',
        label: 'Endpoint URL',
        type: 'string',
        value: 'http://minio.storage-system.svc.cluster.local:9000'
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ],
    lora_sft_fine_tune_model_with_csv: [
      {
        id: 'type',
        label: 'Lora SFT Fine Tune Model (CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'training_type',
        label: 'Training Type',
        type: 'string',
        value: 'supervised'
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'source_column',
        label: 'Source Column',
        type: 'string',
        value: ''
      },
      {
        id: 'label_column',
        label: 'Label Column',
        type: 'string',
        value: ''
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 8

      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 1
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'gradient_checkpointing',
        label: 'Gradient Checkpointing',
        type: 'bool',
        value: false
      },
      {
        id: 'fp16',
        label: 'FP16 Training',
        type: 'bool',
        value: false
      },
      {
        id: 'max_grad_norm',
        label: 'Max Grad Norm',
        type: 'number',
        value: 1.0
      },
      {
        id: 'learning_rate',
        label: 'Learning Rate',
        type: 'number',
        value: 0.00005
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        type: 'list',
        options: ['steps', 'epoch', 'no', 'best'],
        value: 'steps'
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
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        type: 'list',
        options: ['no', 'steps', 'epoch'],
        value: 'no'
      },
      {
        id: 'eval_steps',
        label: 'Evaluation Step Interval',
        type: 'number',
        value: 100
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'prediction_loss_only',
        label: 'Prediction Loss Only',
        type: 'bool',
        value: true
      },
      {
        id: 'r',
        label: 'LoRA Rank',
        type: 'number',
        value: 8
      },
      {
        id: 'lora_alpha',
        label: 'LoRA Alpha',
        type: 'number',
        value: 16
      },
      {
        id: 'target_modules',
        label: 'Target Modules',
        type: 'list',
        options: ['q_proj', 'v_proj'],
        value: 'q_proj'
      },
      {
        id: 'lora_dropout',
        label: 'LoRA Dropout',
        type: 'number',
        value: 0.1
      },
      {
        id: 'bias',
        label: 'Bias',
        type: 'string',
        options: ['none', 'all', 'lora_only'],
        value: 'none'
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
        id: 'endpoint',
        label: 'Endpoint URL',
        type: 'string',
        value: 'http://minio.storage-system.svc.cluster.local:9000'
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ],
    adalora_fine_tune_model_with_csv: [
      {
        id: 'type',
        label: 'AdaLoRA Fine Tune Model (CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'training_type',
        label: 'Training Type',
        type: 'string',
        value: 'unsupervised'
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'source_column',
        label: 'Source Column',
        type: 'string',
        value: ''
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 8
      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 8
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'gradient_checkpointing',
        label: 'Gradient Checkpointing',
        type: 'bool',
        value: false
      },
      {
        id: 'fp16',
        label: 'FP16 Training',
        type: 'bool',
        value: false
      },
      {
        id: 'max_grad_norm',
        label: 'Max Grad Norm',
        type: 'number',
        value: 1.0
      },
      {
        id: 'learning_rate',
        label: 'Learning Rate',
        type: 'number',
        value: 0.00005
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        type: 'list',
        options: ['steps', 'epoch', 'no', 'best'],
        value: 'steps'
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
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        type: 'list',
        options: ['no', 'steps', 'epoch'],
        value: 'no'
      },
      {
        id: 'eval_steps',
        label: 'Evaluation Step Interval',
        type: 'number',
        value: 100
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'prediction_loss_only',
        label: 'Prediction Loss Only',
        type: 'bool',
        value: true
      },
      {
        id: 'max_length',
        label: 'Max Length',
        type: 'number',
        value: 256
      },
      {
        id: 'init_r',
        label: 'Initial Rank',
        type: 'number',
        value: 12
      },
      {
        id: 'target_r',
        label: 'Target Rank',
        type: 'number',
        value: 6
      },
      {
        id: 'beta1',
        label: 'Beta 1',
        type: 'number',
        value: 0.85
      },
      {
        id: 'beta2',
        label: 'Beta 2',
        type: 'number',
        value: 0.85
      },
      {
        id: 'tinit',
        label: 'Initialization Steps',
        type: 'number',
        value: 200
      },
      {
        id: 'lora_alpha',
        label: 'LoRA Alpha',
        type: 'number',
        value: 16
      },
      {
        id: 'target_modules',
        label: 'Target Modules',
        type: 'list',
        options: ['q_proj', 'v_proj'],
        value: 'q_proj'
      },
      {
        id: 'lora_dropout',
        label: 'LoRA Dropout',
        type: 'number',
        value: 0.1
      },
      {
        id: 'bias',
        label: 'Bias',
        type: 'string',
        options: ['none', 'all', 'lora_only'],
        value: 'none'
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
        id: 'endpoint',
        label: 'Endpoint URL',
        type: 'string',
        value: 'http://minio.storage-system.svc.cluster.local:9000'
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ],
    adalora_sft_fine_tune_model_with_csv: [
      {
        id: 'type',
        label: 'AdaLoRA SFT Fine Tune Model (CSV)',
        type: 'type',
        value: 'llm_fine_tune_model_with_csv'
      },
      {
        id: 'training_type',
        label: 'Training Type',
        type: 'string',
        value: 'supervised'
      },
      {
        id: 'experiment_name',
        label: 'Experiment Name',
        type: 'string',
        value: ''
      },
      {
        id: 'model_name',
        label: 'Model Name',
        type: 'string',
        value: ''
      },
      {
        id: 'source_column',
        label: 'Source Column',
        type: 'string',
        value: ''
      },
      {
        id: 'label_column',
        label: 'Label Column',
        type: 'string',
        value: ''
      },
      {
        id: 'batch_size',
        label: 'Batch Size',
        type: 'number',
        value: 8

      },
      {
        id: 'gradient_accumulation_steps',
        label: 'Gradient Accumulation Steps',
        type: 'number',
        value: 8
      },
      {
        id: 'epochs',
        label: 'Epochs',
        type: 'number',
        value: 1
      },
      {
        id: 'gradient_checkpointing',
        label: 'Gradient Checkpointing',
        type: 'bool',
        value: false
      },
      {
        id: 'fp16',
        label: 'FP16 Training',
        type: 'bool',
        value: false
      },
      {
        id: 'max_grad_norm',
        label: 'Max Grad Norm',
        type: 'number',
        value: 1.0
      },
      {
        id: 'learning_rate',
        label: 'Learning Rate',
        type: 'number',
        value: 0.00005
      },
      {
        id: 'save_strategy',
        label: 'Save Strategy',
        type: 'list',
        options: ['steps', 'epoch', 'no', 'best'],
        value: 'steps'
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
        id: 'evaluation_strategy',
        label: 'Evaluation Strategy',
        type: 'list',
        options: ['no', 'steps', 'epoch'],
        value: 'no'
      },
      {
        id: 'eval_steps',
        label: 'Evaluation Step Interval',
        type: 'number',
        value: 100
      },
      {
        id: 'save_total_limit',
        label: 'Save Total Limit',
        type: 'number',
        value: 2
      },
      {
        id: 'prediction_loss_only',
        label: 'Prediction Loss Only',
        type: 'bool',
        value: true
      },
      {
        id: 'max_length',
        label: 'Max Length',
        type: 'number',
        value: 256
      },
      {
        id: 'init_r',
        label: 'Initial Rank',
        type: 'number',
        value: 12
      },
      {
        id: 'target_r',
        label: 'Target Rank',
        type: 'number',
        value: 6
      },
      {
        id: 'beta1',
        label: 'Beta 1',
        type: 'number',
        value: 0.85
      },
      {
        id: 'beta2',
        label: 'Beta 2',
        type: 'number',
        value: 0.85
      },
      {
        id: 'tinit',
        label: 'Initialization Steps',
        type: 'number',
        value: 200
      },
      {
        id: 'lora_alpha',
        label: 'LoRA Alpha',
        type: 'number',
        value: 16
      },
      {
        id: 'target_modules',
        label: 'Target Modules',
        type: 'list',
        options: ['q_proj', 'v_proj'],
        value: 'q_proj'
      },
      {
        id: 'lora_dropout',
        label: 'LoRA Dropout',
        type: 'number',
        value: 0.1
      },
      {
        id: 'bias',
        label: 'Bias',
        type: 'string',
        options: ['none', 'all', 'lora_only'],
        value: 'none'
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
        id: 'endpoint',
        label: 'Endpoint URL',
        type: 'string',
        value: 'http://minio.storage-system.svc.cluster.local:9000'
      },
      {
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ],

  })


</script>
