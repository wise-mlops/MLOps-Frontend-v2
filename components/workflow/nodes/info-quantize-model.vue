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

// 재귀 방지를 위한 플래그
const isUpdatingParameters = ref(false)

// 이전 값들을 추적
const previousType = ref('bnb')
const previousBits = ref(4)

// items 변경 감지
watch(items, (newItems) => {
  // 재귀 방지를 위해 값이 실제로 변경되었는지 확인
  if (!newItems || isUpdatingParameters.value) return;
  
  // quantized_type 또는 quantized_bits 변경 감지
  const quantizedTypeItem = newItems.find(item => item.id === 'quantized_type')
  const quantizedBitsItem = newItems.find(item => item.id === 'quantized_bits')
  
  const currentType = quantizedTypeItem?.value || 'bnb'
  const currentBits = quantizedBitsItem?.value || 4
  
  // 실제로 값이 변경되었을 때만 업데이트
  if (currentType !== previousType.value || currentBits !== previousBits.value) {
    previousType.value = currentType
    previousBits.value = currentBits
    updateConditionalParameters(currentType, currentBits)
  }
  
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
  items.value = [...template] // 깊은 복사
  
  // 초기 조건부 파라미터 적용
  const defaultType = 'bnb'
  const defaultBits = 4
  previousType.value = defaultType
  previousBits.value = defaultBits
  updateConditionalParameters(defaultType, defaultBits)

  if (params.value['type'] == newType.value) {
    items.value = attributeToItems(params.value, itemTemplate.value[componentTypeValue.value])
  } else {
    params.value = itemsToAttribute(items.value)
  }
})

onMounted(() => {
  // 초기값 설정
  if (params.value['type']) {
    componentType.value = params.value['type']
    componentTypeValue.value = params.value['type']
    items.value = attributeToItems(params.value, itemTemplate.value[componentTypeValue.value])
    
    // 저장된 값이 있을 때 조건부 파라미터 적용
    const savedType = params.value['quantized_type'] || 'bnb'
    const savedBits = params.value['quantized_bits'] || 4
    previousType.value = savedType
    previousBits.value = savedBits
    updateConditionalParameters(savedType, savedBits)
  }
})

// Attribute 객체를 items 배열로 변환하는 함수
const attributeToItems = (attr: Attribute, existingItems: Item[] = []) => {
  const items: Item[] = []
  
  Object.entries(attr).forEach(([key, value]) => {
    const existingItem = existingItems.find(item => item.id === key)
    items.push({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      type: existingItem?.type || '',
      options: existingItem?.options || [],
      value: value
    })
  })
  
  return items
}

// items 배열을 Attribute 객체로 변환하는 함수
const itemsToAttribute = (items: Item[]) => {
  const attribute: Attribute = {}
  items.forEach(item => {
    attribute[item.id] = item.value;
  });
  return attribute as Attribute;
}

// 조건부 파라미터 업데이트 함수
const updateConditionalParameters = (quantizedType: string, quantizedBits: number) => {
  if (!items.value || isUpdatingParameters.value) return;
  
  // 재귀 방지 플래그 설정
  isUpdatingParameters.value = true
  
  // 현재 값들 보존
  const currentValues: Record<string, any> = {}
  items.value.forEach(item => {
    currentValues[item.id] = item.value
  })
  
  // 조건부 파라미터들 정의
  const conditionalParams = {
    // 8bit BnB에서만 필요
    bit8_outlier: quantizedType === 'bnb' && quantizedBits === 8,
    // GPTQ, AWQ에서 필요
    group_size: ['gptq', 'awq'].includes(quantizedType),
    // AWQ에서 필요  
    trust_remote_code: quantizedType === 'awq'
  }
  
  // 기본 파라미터들 (항상 표시)
  const baseItems = items.value.filter(item => 
    !['bit8_outlier', 'group_size', 'trust_remote_code'].includes(item.id)
  )
  
  // 조건부 파라미터들 추가
  const conditionalItems: Item[] = []
  
  if (conditionalParams.group_size) {
    conditionalItems.push({
      id: 'group_size',
      label: 'Group Size',
      type: 'number',
      value: currentValues.group_size || 128
    })
  }
  
  if (conditionalParams.bit8_outlier) {
    conditionalItems.push({
      id: 'bit8_outlier',
      label: '8-bit Outlier Threshold',
      type: 'number',
      value: currentValues.bit8_outlier || 6.0
    })
  }
  
  if (conditionalParams.trust_remote_code) {
    conditionalItems.push({
      id: 'trust_remote_code',
      label: 'Trust Remote Code',
      type: 'bool',
      value: currentValues.trust_remote_code !== undefined ? currentValues.trust_remote_code : true
    })
  }
  
  // 조건부 파라미터들을 적절한 위치에 삽입
  const insertIndex = baseItems.findIndex(item => item.id === 'endpoint')
  if (insertIndex !== -1) {
    baseItems.splice(insertIndex, 0, ...conditionalItems)
  } else {
    baseItems.push(...conditionalItems)
  }
  
  items.value = baseItems
  
  // 다음 틱에서 플래그 해제
  nextTick(() => {
    isUpdatingParameters.value = false
  })
}

const componentTypes = ref([
  {
    label: 'Quantize Model',
    value: 'model_quantized'
  },
])

const itemTemplate = ref<ItemTemplate>(
  {
    model_quantized: [
      {
        id: 'type',
        label: 'Quantize Model',
        type: 'type',
        value: 'model_quantized'
      },
      {
        id: 'quantized_type',
        label: 'Quantization Type',
        type: 'list',
        options: ['bnb', 'gptq', 'awq'],
        value: 'bnb'
      },
      {
        id: 'quantized_bits',
        label: 'Quantized Bits',
        type: 'list',
        options: [4, 8],
        value: 4
      },
      {
        id: 'endpoint',
        label: 'S3 Endpoint URL',
        type: 'string',
        value: 'http://minio.storage-system.svc.cluster.local:9000'
      },
      {
        id: 'key',
        label: 'AWS Access Key ID',
        type: 'string',
        value: 'minio'
      },
      {
        id: 'secret',
        label: 'AWS Secret Access Key',
        type: 'string',
        value: 'minio123'
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
        id: 'use_gpu',
        label: 'Use GPU',
        type: 'bool',
        value: true
      }
    ]
  })

</script>