<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />
    <UCard class="min-h-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 왼쪽: 모델 선택 및 데이터셋 설정 -->
        <div class="model-selection-panel">
          <!-- Model Type 선택 -->
          <UFormGroup label="Model Type" class="py-2">
            <USelectMenu
              v-model="selectedModelType"
              :options="modelTypes"
              size="md"
              :disabled="!isEditable"
              placeholder="모델 타입을 선택하세요"
            />
          </UFormGroup>
          <!-- Algorithm 선택 -->
          <UFormGroup v-if="selectedModelType" label="Algorithm" class="py-2">
            <USelectMenu
              v-model="selectedAlgorithm"
              :options="availableAlgorithms"
              size="md"
              :disabled="!isEditable"
              placeholder="알고리즘을 선택하세요"
            />
          </UFormGroup>
          <!-- Dataset 선택 -->
          <UFormGroup v-if="selectedModelType && availableDatasets.length > 0" label="Dataset" class="py-2">
            <USelectMenu
              v-model="selectedDataset"
              :options="availableDatasets"
              size="md"
              :disabled="!isEditable"
              placeholder="데이터셋을 선택하세요"
            />
          </UFormGroup>
          <!-- 데이터셋 설정 (Tabular 모델용) -->
          <div v-if="selectedDataset && isTabularModel" class="dataset-config">
            <!-- Target 선택 -->
            <UFormGroup label="Target" class="py-2">
              <USelectMenu
                v-model="selectedTarget"
                :options="availableTargetOptions"
                size="md"
                :disabled="!isEditable"
                placeholder="타겟 컬럼을 선택하세요"
              />
              <template #help>
                <span class="text-gray-500 text-sm">예측할 대상 컬럼</span>
              </template>
            </UFormGroup>
            <!-- Input Features -->
            <UFormGroup label="Input Features" class="py-2">
              <div class="space-y-3">
                <!-- 선택된 특성들 태그 표시 -->
                <div class="feature-tags-container">
                  <template v-if="selectedInputs.length > 0">
                    <div v-for="feature in selectedInputs" :key="feature" class="feature-tag">
                      <span>{{ feature }}</span>
                      <button
                        type="button"
                        @click="removeFeature(feature)"
                        :disabled="!isEditable"
                        class="feature-remove-btn"
                      >
                        <Icon name="heroicons:x-mark" class="w-3 h-3" />
                      </button>
                    </div>
                  </template>
                  <span v-else class="text-gray-400 text-sm">특성을 선택하세요</span>
                </div>
                <!-- 사용 가능한 특성들 -->
                <div v-if="unselectedColumns.length > 0" class="available-features">
                  <div class="text-xs font-medium text-gray-600 mb-2">사용 가능한 특성:</div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="column in unselectedColumns"
                      :key="column"
                      @click="addFeature(column)"
                      :disabled="!isEditable"
                      class="feature-add-btn"
                    >
                      <Icon name="heroicons:plus" class="w-3 h-3 mr-1" />
                      {{ column }}
                    </button>
                  </div>
                </div>
                <!-- 빠른 선택 버튼 -->
                <div v-if="availableInputColumns.length > 0" class="quick-actions">
                  <UButton
                    size="xs"
                    variant="outline"
                    @click="selectAllFeatures"
                    :disabled="!isEditable || selectedInputs.length === availableInputColumns.length"
                  >
                    <Icon name="heroicons:check" class="w-3 h-3 mr-1" />
                    전체 선택
                  </UButton>
                  <UButton
                    size="xs"
                    variant="outline"
                    @click="clearAllFeatures"
                    :disabled="!isEditable || selectedInputs.length === 0"
                  >
                    <Icon name="heroicons:x-mark" class="w-3 h-3 mr-1" />
                    전체 해제
                  </UButton>
                </div>
                <div class="text-xs text-gray-500">
                  선택된 특성: {{ selectedInputs.length }}개
                  <span v-if="availableInputColumns.length > 0">
                    / 전체 {{ availableInputColumns.length }}개
                  </span>
                </div>
              </div>
              <template #help>
                <span class="text-gray-500 text-sm">모델 학습에 사용할 입력 특성들을 선택하세요</span>
              </template>
            </UFormGroup>
            <!-- Train Test Split -->
            <UFormGroup label="Train Test Split" class="py-2">
              <UInput
                type="number"
                v-model="trainTestSplit"
                :min="0.1"
                :max="0.9"
                :step="0.1"
                variant="outline"
                size="md"
                :disabled="!isEditable"
              />
              <template #help>
                <span class="text-gray-500 text-sm">학습/테스트 데이터 분할 비율</span>
              </template>
            </UFormGroup>
          </div>
        </div>
        <!-- 오른쪽: 학습 설정 -->
        <div class="config-panel">
          <div v-if="selectedAlgorithm && allOptions.length > 0" class="options-section">
            <h4 class="text-md font-semibold mb-3">학습 옵션</h4>
            <template v-for="option in allOptions" :key="option.id">
              <!-- Boolean Toggle -->
              <UFormGroup v-if="option.type === 'bool'" :label="option.label" class="py-2">
                <UToggle v-model="option.value" size="md" :disabled="!isEditable" />
                <template v-if="option.description" #help>
                  <span class="text-gray-500 text-sm">{{ option.description }}</span>
                </template>
              </UFormGroup>
              <!-- Number Input -->
              <UFormGroup v-else-if="option.type === 'number'" :label="option.label" class="py-2">
                <UInput
                  type="number"
                  v-model="option.value"
                  :placeholder="option.placeholder || 'Value'"
                  :min="option.min"
                  :max="option.max"
                  :step="option.step"
                  variant="outline"
                  size="md"
                  :disabled="!isEditable"
                />
                <template v-if="option.description" #help>
                  <span class="text-gray-500 text-sm">{{ option.description }}</span>
                </template>
              </UFormGroup>
              <!-- Select -->
              <UFormGroup v-else-if="option.type === 'select'" :label="option.label" class="py-2">
                <USelectMenu
                  v-model="option.value"
                  :options="option.options"
                  size="md"
                  :disabled="!isEditable"
                />
                <template v-if="option.description" #help>
                  <span class="text-gray-500 text-sm">{{ option.description }}</span>
                </template>
              </UFormGroup>
              <!-- Text Input -->
              <UFormGroup v-else :label="option.label" class="py-2">
                <UInput
                  type="text"
                  v-model="option.value"
                  :placeholder="option.placeholder || 'Value'"
                  variant="outline"
                  size="md"
                  autocomplete="off"
                  :disabled="!isEditable"
                />
                <template v-if="option.description" #help>
                  <span class="text-gray-500 text-sm">{{ option.description }}</span>
                </template>
              </UFormGroup>
            </template>
          </div>
          <!-- 설정이 없을 때 안내 -->
          <div v-else class="text-center py-8 text-gray-500">
            <Icon name="heroicons:cog-6-tooth" class="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p class="text-sm">알고리즘을 선택하면 학습 설정이 표시됩니다</p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

// 기본 페이지 정보
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'Simple ML', to: '/simple-ml/' },
  { label: 'Train ML Model' }
])
const pageTitle = ref('Train ML Model')

// 인터페이스 정의
interface Option {
  id: string
  label: string
  type: 'number' | 'bool' | 'text' | 'select'
  value: any
  min?: number
  max?: number
  step?: number
  options?: Array<{label: string, value: any}>
  placeholder?: string
  description?: string
  isHyperParameter?: boolean
}

// 상태 관리
const selectedModelType = ref<{label: string, value: string} | null>(null)
const selectedAlgorithm = ref<{label: string, value: string} | null>(null)
const selectedDataset = ref<{label: string, value: string} | null>(null)
const selectedTarget = ref<{label: string, value: string} | null>(null)
const selectedInputs = ref<string[]>([])
const trainTestSplit = ref(0.2)
const allOptions = ref<Option[]>([])
const isEditable = ref(true)

// 모델 타입 정의
const modelTypes = [
  { label: 'Image Classification Model', value: 'image-classifier' },
  { label: 'Image Segmentation Model', value: 'image-segmentation' },
  { label: 'Text Classification Model', value: 'text-classifier' },
  { label: 'Tabular Classifier', value: 'classifier' },
  { label: 'Tabular Regressor', value: 'regressor' }
]

// 모델 설정 구조화
const MODEL_CONFIGS = {
  'image-classifier': {
    algorithms: [
      { label: 'VGG19', value: 'vgg19' },
      { label: 'ResNet50', value: 'resnet50' },
      { label: 'DenseNet121', value: 'densenet121' },
      { label: 'MobileNet V2', value: 'mobilenet_v2' },
      { label: 'Mobile Vision Transformer', value: 'mobile_vit' },
      { label: 'Pyramid Vision Transformer V2', value: 'pvt_v2' }
    ],
    datasets: [{ label: 'CIFAR-10', value: 'cifar10' }]
  },
  'image-segmentation': {
    algorithms: [{ label: 'Auto Focus Former', value: 'afformer' }],
    datasets: [{ label: 'PENNFUDAN', value: 'pennfudan' }]
  },
  'text-classifier': {
    algorithms: [
      { label: 'GRU', value: 'gru' },
      { label: 'LSTM', value: 'lstm' },
      { label: 'Transformer', value: 'transformer' },
      { label: 'Switch Transformer', value: 'switch-transformer' }
    ],
    datasets: [
      { label: 'Newsgroup 20', value: 'newsgroup20' },
      { label: 'Rotten Tomatoes reviews', value: 'rotten_tomatoes_reviews' }
    ]
  },
  'classifier': {
    algorithms: [
      { label: 'Decision Tree', value: 'decision-tree' },
      { label: 'Gaussian Naive Bayes', value: 'gaussian-naive-bayes' },
      { label: 'Logistic Regression', value: 'logistic-regression' },
      { label: 'Multinomial Naive Bayes', value: 'multinomial-naive-bayes' },
      { label: 'Random Forest', value: 'random-forest' },
      { label: 'Support Vector Classification', value: 'support-vector-classification' }
    ],
    datasets: [
      {
        label: 'Wine Dataset',
        value: 'wine',
        columns: ["alcohol", "sugar", "pH", "class"],
        targets: [{ label: "class", value: "class" }]
      },
      {
        label: 'Iris Dataset',
        value: 'iris',
        columns: ["sepal.length", "sepal.width", "petal.length", "petal.width", "variety"],
        targets: [{ label: "variety", value: "variety" }]
      }
    ]
  },
  'regressor': {
    algorithms: [
      { label: 'Bayesian Ridge', value: 'bayesian-ridge' },
      { label: 'Decision Tree', value: 'decision-tree' },
      { label: 'Elastic Net', value: 'elastic-net' },
      { label: 'Gradient Boosting', value: 'gradient-boosting' },
      { label: 'Kernel Ridge', value: 'kernel-ridge' },
      { label: 'Linear Regression', value: 'linear-regression' },
      { label: 'SGD', value: 'sgd' },
      { label: 'Support Vector Regression', value: 'support-vector-regression' }
    ],
    datasets: [
      {
        label: 'Boston Housing',
        value: 'boston',
        columns: ["crim", "zn", "indus", "chas", "nox", "rm", "age", "dis", "rad", "tax", "ptratio", "b", "lstat", "medv"],
        targets: [{ label: "medv", value: "medv" }]
      }
    ]
  }
}

// 헬퍼 함수
const createSelectOption = (id: string, label: string, options: Array<{label: string, value: any}>, defaultValue: any, description?: string, isHyperParameter = false) => {
  const defaultOption = options.find(opt => opt.value === defaultValue) || options[0]
  return {
    id,
    label,
    type: 'select' as const,
    options,
    value: defaultOption,
    description,
    isHyperParameter
  }
}

const createNumberOption = (id: string, label: string, min: number, max: number, step: number, defaultValue: number, description?: string, isHyperParameter = false) => ({
  id, label, type: 'number' as const, min, max, step, value: defaultValue, description, isHyperParameter
})

const createBoolOption = (id: string, label: string, defaultValue: boolean, description?: string, isHyperParameter = false) => ({
  id, label, type: 'bool' as const, value: defaultValue, description, isHyperParameter
})

// 옵션 템플릿 구조화
const optionTemplates = {
  // 기본 공통 옵션들
  'common': [
    createNumberOption('epochs', 'Epochs', 1, 1000, 1, 10, '모델 학습 에폭 수'),
    createNumberOption('batch_size', 'Batch Size', 1, 512, 1, 32, '모델 학습 배치 사이즈'),
    createNumberOption('learning_rate', 'Learning Rate', 0.0001, 1, 0.0001, 0.001, '모델 학습 learning rate')
  ],

  // 모델 타입별 공통 옵션
  'cnn-common': [  // VGG, ResNet, DenseNet, MobileNet V2용
    createNumberOption('momentum', 'Momentum', 0, 1, 0.1, 0.9, '모멘텀')
  ],

  'text-classifier-common': [
    createNumberOption('sequence_length', 'Sequence Length', 50, 1000, 50, 200, '시퀀스 길이'),
    createNumberOption('vocab_size', 'Vocab Size', 1000, 100000, 1000, 20000, '어휘 크기'),
    createNumberOption('embed_dim', 'Embedding Dimension', 16, 512, 16, 32, '임베딩 차원')
  ],

  'rnn-common': [
    createNumberOption('num_neurons', 'Hidden Neurons', 16, 512, 16, 64, '은닉층 뉴런 수'),
    createNumberOption('num_layers', 'Number of Layers', 1, 16, 1, 1, '계층 수'),
    createBoolOption('bidirectional', 'Bidirectional', true, '양방향 순환 신경망 사용 여부')
  ],

  'transformer-common': [
    createNumberOption('num_heads', 'Number of Heads', 1, 16, 1, 2, '헤드 수'),
    createNumberOption('ff_dim', 'Feed Forward Dimension', 16, 512, 16, 32, '피드포워드 차원')
  ],

  // 알고리즘별 특화 옵션
  'mobile_vit': [
    createBoolOption('pretrained', 'Pretrained', false, '사전 학습된 모델 사용 여부')
  ],

  'pvt_v2': [
    createBoolOption('pretrained', 'Pretrained', false, '사전 학습된 모델 사용 여부'),
    createNumberOption('weight_decay', 'Weight Decay', 0, 1, 0.0001, 0.0001, '가중치 감소')
  ],

  'afformer': [
    createBoolOption('pretrained', 'Pretrained', false, '사전 학습된 모델 사용 여부'),
    createNumberOption('weight_decay', 'Weight Decay', 0, 1, 0.0001, 0.0001, '가중치 감소'),
    createNumberOption('power', 'Power', 0.1, 2.0, 0.1, 1.0, '학습률을 점진적으로 줄이는 스케줄러의 감소 속도 제어'),
    createNumberOption('warmup_epoch', 'Warmup Epochs', 0, 50, 1, 0, '학습률 워밍업을 위한 에폭 수'),
    createNumberOption('warmup_ratio', 'Warmup Ratio', 0.000001, 0.01, 0.000001, 0.000001, '학습률 워밍업을 위한 초기 비율')
  ],

  'switch-transformer': [
    createNumberOption('num_experts', 'Number of Experts', 2, 16, 1, 2, '전문가 수'),
    createNumberOption('dropout_rate', 'Dropout Rate', 0, 0.9, 0.1, 0.1, '드롭아웃 비율')
  ],

  // Tabular 모델 알고리즘들
  'decision-tree': [
    createSelectOption('criterion', 'Criterion', [
      { label: 'Gini', value: 'gini' },
      { label: 'Entropy', value: 'entropy' },
      { label: 'Squared Error', value: 'squared_error' },
      { label: 'Friedman MSE', value: 'friedman_mse' }
    ], 'gini', '분할 품질을 측정하는 기능', true),
    createNumberOption('max_depth', 'Max Depth', 1, 100, 1, 100, '트리의 최대 깊이 설정', true),
    createNumberOption('min_samples_split', 'Min Samples Split', 2, 20, 1, 2, '자식 노드를 분할하는데 필요한 최소 샘플 수', true),
    createNumberOption('min_samples_leaf', 'Min Samples Leaf', 1, 20, 1, 1, '리프 노드에 있어야 할 최소 샘플 수', true)
  ],

  'gaussian-naive-bayes': [
    createNumberOption('var_smoothing', 'Var Smoothing', 1e-10, 1e-6, 1e-10, 1e-9, '계산 안정성을 위해 분산에 추가되는 모든 특성 중 가장 큰 분산 부분', true)
  ],

  'logistic-regression': [
    createSelectOption('penalty', 'Penalty', [
      { label: 'L1', value: 'l1' },
      { label: 'L2', value: 'l2' },
      { label: 'Elastic Net', value: 'elasticnet' },
      { label: 'None', value: 'none' }
    ], 'l2', '정규화에 사용할 Norm 설정', true),
    createNumberOption('C', 'Regularization (C)', 0.001, 100, 0.001, 1.0, '값이 작을수록 더 강력한 정규화', true),
    createNumberOption('max_iter', 'Max Iterations', 100, 10000, 100, 100, '모델 수렴에 걸리는 최대 반복 횟수', true)
  ],

  'multinomial-naive-bayes': [
    createNumberOption('alpha', 'Alpha', 0.001, 10, 0.001, 0.1, '과적합 방지를 위한 값', true),
    createBoolOption('force_alpha', 'Force Alpha', false, 'True 시 alpha의 값 변경 없음', true),
    createBoolOption('fit_prior', 'Fit Prior', false, '클래스의 사전 확률 학습 여부(False 시 균일)', true)
  ],

  'random-forest': [
    createNumberOption('n_estimators', 'N Estimators', 10, 1000, 10, 100, '트리의 개수', true),
    createNumberOption('max_depth', 'Max Depth', 1, 100, 1, 100, '각 트리의 최대 깊이', true),
    createNumberOption('min_samples_split', 'Min Samples Split', 2, 20, 1, 2, '자식 노드를 분할하는데 필요한 최소 샘플 수', true),
    createSelectOption('max_features', 'Max Features', [
      { label: 'Sqrt', value: 'sqrt' },
      { label: 'Log2', value: 'log2' },
      { label: 'All', value: 'auto' }
    ], 'sqrt', '최상의 분할을 찾을 때 고려할 특징 수', true)
  ],

  'support-vector-classification': [
    createNumberOption('C', 'Regularization (C)', 0.001, 100, 0.001, 1.0, '값이 작을수록 더 강력한 정규화', true),
    createSelectOption('kernel', 'Kernel', [
      { label: 'RBF', value: 'rbf' },
      { label: 'Linear', value: 'linear' },
      { label: 'Polynomial', value: 'poly' },
      { label: 'Sigmoid', value: 'sigmoid' }
    ], 'rbf', '데이터를 고차원 공간으로 매핑하는 함수', true),
    createNumberOption('max_iter', 'Max Iterations', -1, 10000, 1, -1, '모델 수렴에 걸리는 최대 반복 횟수', true)
  ],

  'bayesian-ridge': [
    createNumberOption('alpha_1', 'Alpha 1', 1e-6, 1e-3, 1e-6, 1e-6, '감마 분포 사전 확률로서 alpha 매개변수에 대한 형상 매개변수', true),
    createNumberOption('alpha_2', 'Alpha 2', 1e-6, 1e-3, 1e-6, 1e-6, 'alpha 매개변수에 대한 감마 분포 사전 확률의 역 스케일 매개변수', true),
    createNumberOption('lambda_1', 'Lambda 1', 1e-6, 1e-3, 1e-6, 1e-6, 'lambda 매개변수에 대한 감마 분포 사전 확률', true),
    createNumberOption('lambda_2', 'Lambda 2', 1e-6, 1e-3, 1e-6, 1e-6, 'lambda 매개변수에 대한 감마 분포 사전 확률의 역 스케일 매개변수', true),
    createNumberOption('tol', 'Tolerance', 1e-5, 1e-1, 1e-5, 0.001, '최적화 단계에서 정밀도에 대한 허용 오차', true)
  ],

  'elastic-net': [
    createNumberOption('alpha', 'Alpha', 0.001, 10, 0.001, 0.1, '과적합 방지를 위한 값', true),
    createNumberOption('l1_ratio', 'L1 Ratio', 0, 1, 0.01, 0.5, 'Elastic Net은 L1규제(라쏘)와 L2규제(릿지)를 결합한 모델로 두 규제의 상대적인 강도를 조절', true),
    createNumberOption('max_iter', 'Max Iterations', 100, 10000, 100, 1000, '모델 수렴에 걸리는 최대 반복 횟수', true),
    createNumberOption('tol', 'Tolerance', 1e-5, 1e-1, 1e-5, 1e-4, '최적화 단계에서 정밀도에 대한 허용 오차', true)
  ],

  'gradient-boosting': [
    createNumberOption('learning_rate', 'Learning Rate', 0.001, 1, 0.001, 0.1, '최적화 과정에서 Loss를 줄이기 위해 파라미터를 변경하는 정도', true),
    createNumberOption('n_estimators', 'N Estimators', 10, 1000, 10, 100, '트리의 개수', true),
    createSelectOption('criterion', 'Criterion', [
      { label: 'Friedman MSE', value: 'friedman_mse' },
      { label: 'Squared Error', value: 'squared_error' }
    ], 'friedman_mse', '분할 품질을 측정하는 기능', true),
    createNumberOption('min_samples_split', 'Min Samples Split', 2, 20, 1, 2, '자식 노드를 분할하는데 필요한 최소 샘플 수', true),
    createNumberOption('min_samples_leaf', 'Min Samples Leaf', 1, 20, 1, 1, '리프 노드에 있어야 할 최소 샘플 수', true),
    createNumberOption('max_depth', 'Max Depth', 1, 20, 1, 3, '트리의 최대 깊이 설정', true)
  ],

  'kernel-ridge': [
    createNumberOption('alpha', 'Alpha', 0.001, 10, 0.001, 0.01, '과적합 방지를 위한 값', true),
    createSelectOption('kernel', 'Kernel', [
      { label: 'Linear', value: 'linear' },
      { label: 'RBF', value: 'rbf' },
      { label: 'Polynomial', value: 'poly' },
      { label: 'Sigmoid', value: 'sigmoid' }
    ], 'rbf', '데이터를 고차원 공간으로 매핑하는 함수', true),
    createNumberOption('gamma', 'Gamma', 0.001, 10, 0.001, 1, '일반화 성능 향상과 과적합을 방지하는 상수', true),
    createNumberOption('degree', 'Degree', 1, 10, 1, 2, '다항식 커널의 차수', true)
  ],

  'linear-regression': [
    createBoolOption('fit_intercept', 'Fit Intercept', true, '절편을 계산할지 여부', true),
    createBoolOption('copy_X', 'Copy X', true, 'True(X가 복사), False(덮어쓰기)', true),
    createBoolOption('positive', 'Positive', false, 'True(계수를 강제로 양수)', true)
  ],

  'sgd': [
    createSelectOption('loss', 'Loss', [
      { label: 'Squared Error', value: 'squared_error' },
      { label: 'Huber', value: 'huber' },
      { label: 'Epsilon Insensitive', value: 'epsilon_insensitive' }
    ], 'squared_error', '손실함수', true),
    createNumberOption('max_iter', 'Max Iterations', 100, 10000, 100, 100, '모델 수렴에 걸리는 최대 반복 횟수', true),
    createNumberOption('tol', 'Tolerance', 1e-5, 1e-1, 1e-5, 0.001, '최적화 단계에서 정밀도에 대한 허용 오차', true),
    createSelectOption('penalty', 'Penalty', [
      { label: 'L1', value: 'l1' },
      { label: 'L2', value: 'l2' },
      { label: 'Elastic Net', value: 'elasticnet' }
    ], 'l2', '정규화에 사용할 Norm 설정', true),
    createNumberOption('alpha', 'Alpha', 0.0001, 1, 0.0001, 0.0001, '과적합 방지를 위한 값', true)
  ],

  'support-vector-regression': [
    createNumberOption('C', 'Regularization (C)', 0.001, 100, 0.001, 1.0, '값이 작을수록 더 강력한 정규화', true),
    createSelectOption('kernel', 'Kernel', [
      { label: 'RBF', value: 'rbf' },
      { label: 'Linear', value: 'linear' },
      { label: 'Polynomial', value: 'poly' },
      { label: 'Sigmoid', value: 'sigmoid' }
    ], 'rbf', '데이터를 고차원 공간으로 매핑하는 함수', true),
    createNumberOption('epsilon', 'Epsilon', 0.01, 1, 0.01, 0.1, '모델이 허용하는 예측 오차의 한계를 결정', true)
  ]
}

// Computed Properties
const availableAlgorithms = computed(() => {
  if (!selectedModelType.value?.value) return []
  return MODEL_CONFIGS[selectedModelType.value.value as keyof typeof MODEL_CONFIGS]?.algorithms || []
})

const availableDatasets = computed(() => {
  if (!selectedModelType.value?.value) return []
  return MODEL_CONFIGS[selectedModelType.value.value as keyof typeof MODEL_CONFIGS]?.datasets || []
})

const isTabularModel = computed(() => {
  return selectedModelType.value?.value === 'classifier' || selectedModelType.value?.value === 'regressor'
})

const availableTargetOptions = computed(() => {
  if (!selectedDataset.value || !isTabularModel.value) return []
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  return (dataset as any)?.targets || []
})

const availableInputColumns = computed(() => {
  if (!selectedDataset.value || !isTabularModel.value || !selectedTarget.value) return []
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  if (!dataset || !(dataset as any).columns) return []
  return (dataset as any).columns.filter((column: string) => column !== selectedTarget.value?.value)
})

const unselectedColumns = computed(() => {
  return availableInputColumns.value.filter(column => !selectedInputs.value.includes(column))
})

const canTrain = computed(() => {
  const hasDataset = selectedDataset.value !== null
  const hasTabularReqs = !isTabularModel.value || (selectedInputs.value.length > 0 && selectedTarget.value)
  return selectedModelType.value && selectedAlgorithm.value && hasDataset && hasTabularReqs
})

const requestBody = computed(() => {
  const body: {[key: string]: any} = {}
  if (selectedDataset.value?.value) {
    body.dataset_name = selectedDataset.value.value
  }
  if (isTabularModel.value) {
    body.train_test_split = trainTestSplit.value
    if (selectedInputs.value.length > 0) body.inputs = selectedInputs.value
    if (selectedTarget.value?.value) body.target = selectedTarget.value.value
    const hp: {[key: string]: any} = {}
    allOptions.value.forEach(option => {
      if (option.value !== undefined && option.value !== null && option.value !== '') {
        const optionValue = option.type === 'select' && typeof option.value === 'object' && option.value.value !== undefined
          ? option.value.value
          : option.value
        if (option.isHyperParameter) {
          hp[option.id] = optionValue
        } else {
          body[option.id] = optionValue
        }
      }
    })
    if (Object.keys(hp).length > 0) {
      body.hp = hp
    }
  } else {
    allOptions.value.forEach(option => {
      if (option.value !== undefined && option.value !== null && option.value !== '') {
        const optionValue = option.type === 'select' && typeof option.value === 'object' && option.value.value !== undefined
          ? option.value.value
          : option.value
        body[option.id] = optionValue
      }
    })
  }
  return body
})

// 툴바 설정
const toolbarLinks = computed(() => [
  [{ label: '취소', icon: 'i-heroicons-arrow-uturn-left', click: () => router.back() }],
  [{ label: '학습 시작', icon: 'i-heroicons-plus-circle', click: handleTrain }]
])

// 메서드들
const addFeature = (feature: string) => {
  if (!selectedInputs.value.includes(feature)) {
    selectedInputs.value.push(feature)
  }
}

const removeFeature = (feature: string) => {
  const index = selectedInputs.value.indexOf(feature)
  if (index > -1) {
    selectedInputs.value.splice(index, 1)
  }
}

const selectAllFeatures = () => {
  selectedInputs.value = [...availableInputColumns.value]
}

const clearAllFeatures = () => {
  selectedInputs.value = []
}

// 개선된 generateOptions 함수
const generateOptions = () => {
  if (!selectedModelType.value || !selectedAlgorithm.value) {
    allOptions.value = []
    return
  }

  let options: Option[] = []
  const modelType = selectedModelType.value.value
  const algorithm = selectedAlgorithm.value.value

  // 1. 기본 공통 옵션 (딥러닝 모델들)
  if (['image-classifier', 'image-segmentation', 'text-classifier'].includes(modelType)) {
    options.push(...optionTemplates.common)
  }

  // 2. 특정 CNN 모델들 공통 옵션 (momentum 필요한 것들만)
  if (['vgg19', 'resnet50', 'densenet121', 'mobilenet_v2'].includes(algorithm)) {
    options.push(...optionTemplates['cnn-common'])
  }

  // 3. Text Classifier 공통 옵션
  if (modelType === 'text-classifier') {
    options.push(...optionTemplates['text-classifier-common'])
  }

  // 4. RNN 계열 공통 옵션
  if (['gru', 'lstm'].includes(algorithm)) {
    options.push(...optionTemplates['rnn-common'])
  }

  // 5. Transformer 계열 공통 옵션
  if (['transformer', 'switch-transformer'].includes(algorithm)) {
    options.push(...optionTemplates['transformer-common'])
  }

  // 6. 알고리즘별 특화 옵션
  const algorithmOptions = optionTemplates[algorithm as keyof typeof optionTemplates] || []
  options.push(...algorithmOptions)

  // 7. 중복 제거
  const uniqueOptions = options.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.id === current.id)
    if (existingIndex >= 0) {
      acc[existingIndex] = current
    } else {
      acc.push(current)
    }
    return acc
  }, [] as Option[])

  allOptions.value = JSON.parse(JSON.stringify(uniqueOptions))
}

const initializeDatasetConfig = () => {
  if (!selectedDataset.value || !isTabularModel.value) {
    selectedInputs.value = []
    selectedTarget.value = null
    return
  }
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  if (!dataset) return
  const datasetWithTarget = dataset as any
  if (datasetWithTarget.targets && datasetWithTarget.targets.length > 0) {
    selectedTarget.value = datasetWithTarget.targets[0]
  }
  if (datasetWithTarget.columns && Array.isArray(datasetWithTarget.columns) && selectedTarget.value) {
    selectedInputs.value = datasetWithTarget.columns.filter((col: string) => col !== selectedTarget.value?.value)
  }
}

const handleTrain = async () => {
  if (!canTrain.value) return
  try {
    const response = await trainSimpleMLModel(
      selectedModelType.value?.value!,
      selectedAlgorithm.value?.value!,
      requestBody.value
    )
    if (String(response.code).endsWith('200')) {
      navigateTo('/simple-ml', { replace: true })
    } else {
      alert(`오류[${response.code}]: ${response.message}`)
    }
  } catch (error) {
    console.error('Training failed:', error)
    alert('학습 시작 중 오류가 발생했습니다.')
  }
}

// Watchers
watch(selectedModelType, () => {
  selectedAlgorithm.value = null
  selectedDataset.value = null
  selectedTarget.value = null
  allOptions.value = []
  selectedInputs.value = []
  trainTestSplit.value = 0.2
})

watch(selectedAlgorithm, () => {
  if (!selectedAlgorithm.value?.value || !selectedModelType.value?.value) return
  generateOptions()
})

watch(selectedDataset, (newDataset) => {
  if (!newDataset) {
    selectedInputs.value = []
    selectedTarget.value = null
    return
  }
  nextTick(() => {
    initializeDatasetConfig()
  })
})

watch(selectedTarget, (newTarget) => {
  if (!newTarget || !selectedDataset.value || !isTabularModel.value) return
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  if (!dataset) return
  const datasetWithColumns = dataset as any
  if (datasetWithColumns.columns && Array.isArray(datasetWithColumns.columns)) {
    selectedInputs.value = selectedInputs.value.filter(input => input !== newTarget.value)
    const availableColumns = datasetWithColumns.columns.filter((col: string) => col !== newTarget.value)
    availableColumns.forEach((col: string) => {
      if (!selectedInputs.value.includes(col)) {
        selectedInputs.value.push(col)
      }
    })
  }
})

// 자동 선택 처리
watch(availableDatasets, (newDatasets) => {
  if (newDatasets.length === 1 && !selectedDataset.value) {
    selectedDataset.value = newDatasets[0]
  }
}, { immediate: true })

watch(availableTargetOptions, (newTargets) => {
  if (newTargets.length === 1 && !selectedTarget.value) {
    selectedTarget.value = newTargets[0]
  }
}, { immediate: true })
</script>

<style scoped>
.model-selection-panel,
.config-panel {
  min-height: 400px;
}

.dataset-config {
  margin-top: 20px;
  padding: 16px;
  background-color: #f0fdf4;
  border-radius: 8px;
  border: 1px solid #bbf7d0;
}

.options-section {
  margin-top: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.feature-tags-container {
  @apply flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-white;
}

.feature-tag {
  @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200;
  animation: fadeInScale 0.2s ease-out;
}

.feature-tag:hover {
  @apply bg-blue-200 border-blue-300;
}

.feature-remove-btn {
  @apply ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.available-features {
  @apply p-3 bg-gray-50 border rounded-md;
}

.feature-add-btn {
  @apply inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500;
  transition: all 0.15s ease;
}

.feature-add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quick-actions {
  @apply flex gap-2 pb-2 border-b border-gray-200;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 640px) {
  .feature-tag,
  .feature-add-btn {
    @apply text-xs px-2 py-1;
  }
  .quick-actions {
    @apply flex-col space-y-2;
  }
}
</style>