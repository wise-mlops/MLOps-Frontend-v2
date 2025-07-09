<template>
  <div class="w-full">
    <!-- 로딩 오버레이 -->
    <div v-if="isStartingNAS" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <UCard class="w-80">
        <div class="text-center p-6">
          <div class="flex justify-center mb-4">
            <svg class="animate-spin h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">탐색 시작 중...</h3>
          <p class="text-gray-600">Neural Architecture Search를 시작하고 있습니다.</p>
        </div>
      </UCard>
    </div>

    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Left Column -->
        <div class="space-y-6">
          <!-- Dataset Selection -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Dataset</h3>
            <UFormGroup name="dataset_name" class="py-2">
              <USelect
                v-model="nasConfig.dataset_name"
                :options="datasetOptions"
                placeholder="Select Dataset"
                variant="outline"
                :loading="loadingDatasets"
                :disabled="isStartingNAS"
              />
            </UFormGroup>
          </div>
          <!-- Search Algorithm -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Search Algorithm</h3>
            <div class="flex flex-wrap gap-6 py-2">
              <div
                v-for="algorithm in algorithmOptions"
                :key="algorithm.value"
                class="flex items-center gap-3"
              >
                <UToggle
                  :model-value="algorithm.value === selectedAlgorithm"
                  :disabled="!algorithm.enabled || isStartingNAS"
                  size="sm"
                  @update:model-value="selectAlgorithm(algorithm.value)"
                />
                <span :class="algorithm.enabled ? 'text-gray-900 font-medium' : 'text-gray-400'">
                  {{ algorithm.label }}
                </span>
              </div>
            </div>
          </div>
          <!-- Layer Operations -->
          <div>
            <h3 class="text-lg font-semibold mb-3">Layer</h3>
            <div class="grid grid-cols-4 gap-3 py-2">
              <UCheckbox
                v-for="layer in layerOptions"
                :key="layer.value"
                v-model="nasConfig.layer_operations"
                :value="layer.value"
                :label="layer.label"
                :disabled="isStartingNAS"
              />
            </div>
          </div>
        </div>
        <!-- Right Column -->
        <div>
          <!-- 하이퍼파라미터 설정 -->
          <div class="options-section">
            <h4 class="text-md font-semibold mb-3">하이퍼파라미터</h4>
            <div class="grid grid-cols-2 gap-4">
              <!-- Max Epochs -->
              <UFormGroup label="Max Epochs" name="max_epochs" class="py-2">
                <UInput
                  v-model.number="nasConfig.max_epochs"
                  type="number"
                  :min="1"
                  :max="999"
                  placeholder="5"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Batch Size -->
              <UFormGroup label="Batch Size" name="batch_size" class="py-2">
                <UInput
                  v-model.number="nasConfig.batch_size"
                  type="number"
                  :min="1"
                  :max="1024"
                  placeholder="64"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Learning Rate -->
              <UFormGroup label="Learning Rate" name="learning_rate" class="py-2">
                <UInput
                  v-model.number="nasConfig.learning_rate"
                  type="number"
                  step="0.001"
                  placeholder="0.001"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Momentum -->
              <UFormGroup label="Momentum" name="momentum" class="py-2">
                <UInput
                  v-model.number="nasConfig.momentum"
                  type="number"
                  step="0.01"
                  placeholder="0.9"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Weight Decay -->
              <UFormGroup label="Weight Decay" name="weight_decay" class="py-2">
                <UInput
                  v-model.number="nasConfig.weight_decay"
                  type="number"
                  step="0.0001"
                  placeholder="0.0001"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Auxiliary Loss Weight -->
              <UFormGroup label="Auxiliary Loss Weight" name="auxiliary_loss_weight" class="py-2">
                <UInput
                  v-model.number="nasConfig.auxiliary_loss_weight"
                  type="number"
                  step="0.1"
                  placeholder="0.4"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Gradient Clip Val -->
              <UFormGroup label="Gradient Clip Val" name="gradient_clip_val" class="py-2">
                <UInput
                  v-model.number="nasConfig.gradient_clip_val"
                  type="number"
                  step="0.1"
                  placeholder="5.0"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Width -->
              <UFormGroup label="Width" name="width" class="py-2">
                <UInput
                  v-model.number="nasConfig.width"
                  type="number"
                  :min="1"
                  placeholder="16"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
              <!-- Number of Cells -->
              <UFormGroup label="Number of Cells" name="num_cells" class="py-2">
                <UInput
                  v-model.number="nasConfig.num_cells"
                  type="number"
                  :min="1"
                  placeholder="8"
                  variant="outline"
                  :disabled="isStartingNAS"
                />
              </UFormGroup>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

// Loading states
const loadingDatasets = ref(false)
const isStartingNAS = ref(false) // 추가된 로딩 상태

// Options
const datasetOptions = ref<Array<{label: string, value: string}>>([])

// 고정된 알고리즘 옵션
const algorithmOptions = ref([
  { label: 'enas', value: 'enas', enabled: false },
  { label: 'darts', value: 'darts', enabled: true },
  { label: 'pdarts', value: 'pdarts', enabled: false }
])

// 고정된 레이어 옵션
const layerOptions = ref([
  { label: 'max_pool_3x3', value: 'max_pool_3x3' },
  { label: 'avg_pool_3x3', value: 'avg_pool_3x3' },
  { label: 'skip_connect', value: 'skip_connect' },
  { label: 'sep_conv_3x3', value: 'sep_conv_3x3' },
  { label: 'sep_conv_5x5', value: 'sep_conv_5x5' },
  { label: 'dil_conv_3x3', value: 'dil_conv_3x3' },
  { label: 'dil_conv_5x5', value: 'dil_conv_5x5' },
])

const selectedAlgorithm = ref('darts')
const nasConfig = ref({
  dataset_name: '',
  max_epochs: 5,
  batch_size: 64,
  learning_rate: null as number | null,
  momentum: null as number | null,
  weight_decay: null as number | null,
  auxiliary_loss_weight: null as number | null,
  gradient_clip_val: null as number | null,
  width: null as number | null,
  num_cells: null as number | null,
  layer_operations: ['max_pool_3x3', 'sep_conv_5x5', 'skip_connect', 'sep_conv_3x3'] as string[]
})

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Auto ML',
    to: '/auto-ml/'
  },
  {
    label: 'Neural Architecture Search',
  },
])

const pageTitle = ref('Neural Architecture Search')

const isFormValid = computed(() => {
  return nasConfig.value.dataset_name &&
         nasConfig.value.max_epochs >= 1 &&
         nasConfig.value.max_epochs <= 999 &&
         nasConfig.value.layer_operations.length > 0 &&
         selectedAlgorithm.value
})

// API function to fetch datasets
async function fetchDatasetOptions() {
  loadingDatasets.value = true
  try {
    const response = await getAvailableDataset()
    console.log(response)
    // API 응답 형태에 맞춰서 처리
    if (response.code === 130200 && response.result && response.result.datasets) {
      datasetOptions.value = response.result.datasets.map((dataset: string) => ({
        label: dataset.toUpperCase(),
        value: dataset
      }))
      // 첫 번째 데이터셋을 기본값으로 설정
      if (datasetOptions.value.length > 0) {
        nasConfig.value.dataset_name = datasetOptions.value[0].value
      }
    }
  } catch (error) {
    console.error('Failed to fetch datasets:', error)
    // Fallback data
    datasetOptions.value = [
      { label: 'BEANS', value: 'beans' },
      { label: 'BRAINTUMOR', value: 'BrainTumor' },
      { label: 'CATSANDDOGS', value: 'catsanddogs' },
      { label: 'CIFAR10', value: 'cifar10' },
      { label: 'CIFAR100', value: 'cifar100' },
      { label: 'MNIST', value: 'mnist' },
      { label: 'FASHION-MNIST', value: 'fashion-mnist' }
    ]
    nasConfig.value.dataset_name = 'beans'
  } finally {
    loadingDatasets.value = false
  }
}

function selectAlgorithm(algorithm: string) {
  const option = algorithmOptions.value.find(opt => opt.value === algorithm)
  if (option && option.enabled) {
    selectedAlgorithm.value = algorithm
  }
}

const startNeuralArchitectureSearch = async () => {
  if (!isFormValid.value) {
    alert("필수 항목을 입력해주세요.")
    return
  }

  isStartingNAS.value = true // 로딩 시작

  const searchConfig = {
    algorithm: selectedAlgorithm.value,
    ...nasConfig.value
  }

  Object.keys(searchConfig).forEach(key => {
    if (searchConfig[key as keyof typeof searchConfig] === null ||
        searchConfig[key as keyof typeof searchConfig] === undefined ||
        searchConfig[key as keyof typeof searchConfig] === '') {
      delete searchConfig[key as keyof typeof searchConfig]
    }
  })

  try {
    const response = await startNAS(searchConfig)
    if (response.code == 130200) {
      navigateTo(`/auto-ml`, {
        replace: true,
        redirectCode: 301,
        external: true
      })
    } else {
      alert("오류[" + response.code + "]: " + response.message)
    }
  } catch (error) {
    console.error('NAS Search creation failed:', error)
    alert("검색 시작 중 오류가 발생했습니다.")
  } finally {
    isStartingNAS.value = false // 로딩 종료
  }
}

const toolbarLinks = ref([
  [
    {
      label: '취소',
      icon: 'i-heroicons-arrow-uturn-left',
      click: () => { router.back() },
      disabled: computed(() => isStartingNAS.value) // 로딩 중 비활성화
    }
  ],
  [
    {
      label: computed(() => isStartingNAS.value ? '탐색 시작 중...' : '탐색 시작'), // 동적 라벨
      icon: isStartingNAS.value ? 'i-heroicons-arrow-path' : 'i-heroicons-magnifying-glass', // 동적 아이콘
      color: 'green' as const,
      click: startNeuralArchitectureSearch,
      disabled: computed(() => !isFormValid.value || isStartingNAS.value), // 로딩 중 비활성화
      loading: isStartingNAS.value // Nuxt UI의 loading prop 사용
    },
  ]
])

onMounted(() => {
  fetchDatasetOptions()
})
</script>

<style scoped>
.options-section {
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.options-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}
</style>