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
          <div v-if="selectedDataset && isTabularModel" class="dataset-config-section">
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
            <!-- Input Features - 새로운 태그 방식 -->
            <UFormGroup label="Input Features" class="py-2">
              <div class="space-y-3">
                <!-- 선택된 특성들을 태그로 표시 -->
                <div class="selected-features-container">
                  <div class="flex flex-wrap gap-2 min-h-[40px] p-3 border rounded-md bg-white">
                    <template v-if="selectedInputs.length > 0">
                      <div
                        v-for="feature in selectedInputs"
                        :key="feature"
                        class="feature-tag"
                      >
                        <span class="feature-tag-text">{{ feature }}</span>
                        <button
                          type="button"
                          @click="removeFeature(feature)"
                          :disabled="!isEditable"
                          class="feature-tag-remove"
                        >
                          <Icon name="heroicons:x-mark" class="w-3 h-3" />
                        </button>
                      </div>
                    </template>
                    <span v-else class="text-gray-400 text-sm self-center">
                      특성을 선택하세요
                    </span>
                  </div>
                </div>

                <!-- 사용 가능한 특성들 선택 버튼 -->
                <div v-if="availableInputColumns.length > 0" class="available-features-container">
                  <div class="text-xs font-medium text-gray-600 mb-2">사용 가능한 특성:</div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="column in unselectedColumns"
                      :key="column"
                      type="button"
                      @click="addFeature(column)"
                      :disabled="!isEditable"
                      class="available-feature-btn"
                    >
                      <Icon name="heroicons:plus" class="w-3 h-3 mr-1" />
                      {{ column }}
                    </button>
                  </div>
                </div>

                <!-- 빠른 선택 버튼들 -->
                <div v-if="availableInputColumns.length > 0" class="quick-select-container">
                  <div class="flex gap-2">
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
                </div>

                <!-- 선택 상태 표시 -->
                <div class="text-xs text-gray-500">
                  선택된 특성: {{ selectedInputs.length }}개
                  <span v-if="availableInputColumns.length > 0">
                    / 전체 {{ availableInputColumns.length }}개
                  </span>
                </div>

                <div v-if="availableInputColumns.length === 0" class="text-gray-400 text-sm text-center py-4 border rounded-md bg-gray-50">
                  <Icon name="heroicons:exclamation-circle" class="w-5 h-5 mx-auto mb-1" />
                  <div>선택 가능한 특성이 없습니다</div>
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
          <!-- 학습 옵션 설정 -->
          <div v-if="selectedAlgorithm && allOptions.length > 0" class="options-section">
            <h4 class="text-md font-semibold mb-3">학습 옵션</h4>
            <div v-for="option in allOptions" :key="option.id">
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
            </div>
          </div>
          <!-- 설정이 없을 때 안내 -->
          <div v-else class="text-center py-8 text-gray-500">
            <div class="mb-2">
              <Icon name="heroicons:cog-6-tooth" class="w-12 h-12 mx-auto text-gray-300" />
            </div>
            <p class="text-sm">알고리즘을 선택하면</p>
            <p class="text-sm">학습 설정이 표시됩니다</p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'Simple ML', to: '/simple-ml/' },
  { label: 'Train ML Model' }
])
const pageTitle = ref('Train ML Model')

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

// Reactive state
const selectedModelType = ref<{label: string, value: string} | null>(null)
const selectedAlgorithm = ref<{label: string, value: string} | null>(null)
const selectedDataset = ref<{label: string, value: string} | null>(null)
const selectedTarget = ref<{label: string, value: string} | null>(null)
const allOptions = ref<Option[]>([])
// Tabular 모델 전용 설정
const trainTestSplit = ref(0.2)
const selectedInputs = ref<string[]>([])
const isEditable = ref(true)

// 모델 타입 정의
const modelTypes = ref([
  { label: 'Image Classifier', value: 'image-classifier' },
  { label: 'Text Classifier', value: 'text-classifier' },
  { label: 'Tabular Classifier', value: 'classifier' },
  { label: 'Tabular Regressor', value: 'regressor' }
])

// 알고리즘 매핑
const algorithmMap = ref({
  'image-classifier': [
    { label: 'VGG19', value: 'vgg19' },
    { label: 'ResNet50', value: 'resnet50' },
    { label: 'DenseNet121', value: 'densenet121' },
    { label: 'MobileNet V2', value: 'mobilenet_v2' },
    { label: 'Mobile Vision Transformer', value: 'mobile_vit' },
    { label: 'Pyramid Vision Transformer V2', value: 'pvt_v2' }
  ],
  'text-classifier': [
    { label: 'RNN', value: 'rnn' },
    { label: 'Transformer', value: 'transformer' },
    { label: 'Switch Transformer', value: 'switch-transformer' }
  ],
  'classifier': [
    { label: 'Decision Tree', value: 'decision-tree' },
    { label: 'Gaussian Naive Bayes', value: 'gaussian-naive-bayes' },
    { label: 'Logistic Regression', value: 'logistic-regression' },
    { label: 'Multinomial Naive Bayes', value: 'multinomial-naive-bayes' },
    { label: 'Random Forest', value: 'random-forest' },
    { label: 'Support Vector Classification', value: 'support-vector-classification' }
  ],
  'regressor': [
    { label: 'Bayesian Ridge', value: 'bayesian-ridge' },
    { label: 'Decision Tree', value: 'decision-tree' },
    { label: 'Elastic Net', value: 'elastic-net' },
    { label: 'Gradient Boosting', value: 'gradient-boosting' },
    { label: 'Kernel Ridge', value: 'kernel-ridge' },
    { label: 'Linear Regression', value: 'linear-regression' },
    { label: 'SGD', value: 'sgd' },
    { label: 'Support Vector Regression', value: 'support-vector-regression' }
  ]
})

// 데이터셋 매핑
const datasetMap = ref({
  'image-classifier': [{ label: 'CIFAR-10', value: 'cifar10' }],
  'text-classifier': [{ label: 'Newsgroup 20', value: 'newsgroup20' }],
  'classifier': [
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
  ],
  'regressor': [
    {
      label: 'Boston Housing',
      value: 'boston',
      columns: ["crim", "zn", "indus", "chas", "nox", "rm", "age", "dis", "rad", "tax", "ptratio", "b", "lstat", "medv"],
      targets: [{ label: "medv", value: "medv" }]
    }
  ]
})

// 옵션 템플릿 정의
const optionTemplates = ref({
  // Image/Text 공통 옵션
  'image-text-common': [
    { id: 'epochs', label: 'Epochs', type: 'number', min: 1, max: 1000, step: 1, value: 10, description: '모델 학습 에폭 수' },
    { id: 'batch_size', label: 'Batch Size', type: 'number', min: 1, max: 512, step: 1, value: 32, description: '모델 학습 배치 사이즈' },
    { id: 'learning_rate', label: 'Learning Rate', type: 'number', min: 0.0001, max: 1, step: 0.0001, value: 0.001, description: '모델 학습 learning rate' }
  ],
  // Image Classifier 전용
  'image-classifier': [
    { id: 'momentum', label: 'Momentum', type: 'number', min: 0, max: 1, step: 0.1, value: 0.9, description: '모멘텀' }
  ],
  'mobile_vit': [
    { id: 'pretrained', label: 'Pretrained', type: 'bool', value: false, description: '사전 학습된 모델 사용 여부' }
  ],
  'pvt_v2': [
    { id: 'pretrained', label: 'Pretrained', type: 'bool', value: false, description: '사전 학습된 모델 사용 여부' },
    { id: 'weight_decay', label: 'Weight Decay', type: 'number', min: 0, max: 1, step: 0.0001, value: 0.0001, description: '가중치 감소' }
  ],
  // Text Classifier 전용
  'text-classifier': [
    { id: 'embed_dim', label: 'Embedding Dimension', type: 'number', min: 16, max: 512, step: 16, value: 32, description: '임베딩 차원' },
    { id: 'num_heads', label: 'Number of Heads', type: 'number', min: 1, max: 16, step: 1, value: 2, description: '헤드 수' },
    { id: 'ff_dim', label: 'Feed Forward Dimension', type: 'number', min: 16, max: 512, step: 16, value: 32, description: '피드포워드 차원' },
    { id: 'sequence_length', label: 'Sequence Length', type: 'number', min: 50, max: 1000, step: 50, value: 200, description: '시퀀스 길이' },
    { id: 'vocab_size', label: 'Vocab Size', type: 'number', min: 1000, max: 100000, step: 1000, value: 20000, description: '어휘 크기' }
  ],
  'rnn': [
    { id: 'num_neurons', label: 'Hidden Neurons', type: 'number', min: 16, max: 512, step: 16, value: 64, description: '은닉층 뉴런 수' },
    { id: 'output_dim', label: 'Output Dimension', type: 'number', min: 1, max: 10, step: 1, value: 1, description: '출력 차원' },
    { id: 'dense_neurons', label: 'Dense Neurons', type: 'number', min: 16, max: 256, step: 16, value: 32, description: '밀집층 뉴런 수' }
  ],
  // Switch Transformer 추가
  'switch-transformer': [
    { id: 'num_experts', label: 'Number of Experts', type: 'number', min: 2, max: 16, step: 1, value: 2, description: '전문가 수' },
    { id: 'dropout_rate', label: 'Dropout Rate', type: 'number', min: 0, max: 0.9, step: 0.1, value: 0.1, description: '드롭아웃 비율' }
  ],

  // === Classifier 하이퍼파라미터 ===
  'decision-tree': [
    {
      id: 'criterion',
      label: 'Criterion',
      type: 'select',
      options: [
        { label: 'Gini', value: 'gini' },
        { label: 'Entropy', value: 'entropy' },
        { label: 'Squared Error', value: 'squared_error' },
        { label: 'Friedman MSE', value: 'friedman_mse' }
      ],
      value: 'gini',
      description: '분할 품질을 측정하는 기능',
      isHyperParameter: true
    },
    { id: 'max_depth', label: 'Max Depth', type: 'number', min: 1, max: 100, step: 1, value: 100, description: '트리의 최대 깊이 설정', isHyperParameter: true },
    { id: 'min_samples_split', label: 'Min Samples Split', type: 'number', min: 2, max: 20, step: 1, value: 2, description: '자식 노드를 분할하는데 필요한 최소 샘플 수', isHyperParameter: true },
    { id: 'min_samples_leaf', label: 'Min Samples Leaf', type: 'number', min: 1, max: 20, step: 1, value: 1, description: '리프 노드에 있어야 할 최소 샘플 수', isHyperParameter: true }
  ],
  'gaussian-naive-bayes': [
    { id: 'var_smoothing', label: 'Var Smoothing', type: 'number', min: 1e-10, max: 1e-6, step: 1e-10, value: 1e-9, description: '계산 안정성을 위해 분산에 추가되는 모든 특성 중 가장 큰 분산 부분', isHyperParameter: true }
  ],
  'logistic-regression': [
    {
      id: 'penalty',
      label: 'Penalty',
      type: 'select',
      options: [
        { label: 'L1', value: 'l1' },
        { label: 'L2', value: 'l2' },
        { label: 'Elastic Net', value: 'elasticnet' },
        { label: 'None', value: 'none' }
      ],
      value: 'l2',
      description: '정규화에 사용할 Norm 설정',
      isHyperParameter: true
    },
    { id: 'C', label: 'Regularization (C)', type: 'number', min: 0.001, max: 100, step: 0.001, value: 1.0, description: '값이 작을수록 더 강력한 정규화', isHyperParameter: true },
    { id: 'max_iter', label: 'Max Iterations', type: 'number', min: 100, max: 10000, step: 100, value: 100, description: '모델 수렴에 걸리는 최대 반복 횟수', isHyperParameter: true }
  ],
  'multinomial-naive-bayes': [
    { id: 'alpha', label: 'Alpha', type: 'number', min: 0.001, max: 10, step: 0.001, value: 0.1, description: '과적합 방지를 위한 값', isHyperParameter: true },
    { id: 'force_alpha', label: 'Force Alpha', type: 'bool', value: false, description: 'True 시 alpha의 값 변경 없음', isHyperParameter: true },
    { id: 'fit_prior', label: 'Fit Prior', type: 'bool', value: false, description: '클래스의 사전 확률 학습 여부(False 시 균일)', isHyperParameter: true }
  ],
  'random-forest': [
    { id: 'n_estimators', label: 'N Estimators', type: 'number', min: 10, max: 1000, step: 10, value: 100, description: '트리의 개수', isHyperParameter: true },
    { id: 'max_depth', label: 'Max Depth', type: 'number', min: 1, max: 100, step: 1, value: 100, description: '각 트리의 최대 깊이', isHyperParameter: true },
    { id: 'min_samples_split', label: 'Min Samples Split', type: 'number', min: 2, max: 20, step: 1, value: 2, description: '자식 노드를 분할하는데 필요한 최소 샘플 수', isHyperParameter: true },
    {
      id: 'max_features',
      label: 'Max Features',
      type: 'select',
      options: [
        { label: 'Sqrt', value: 'sqrt' },
        { label: 'Log2', value: 'log2' },
        { label: 'All', value: 'auto' }
      ],
      value: 'sqrt',
      description: '최상의 분할을 찾을 때 고려할 특징 수',
      isHyperParameter: true
    }
  ],
  'support-vector-classification': [
    { id: 'C', label: 'Regularization (C)', type: 'number', min: 0.001, max: 100, step: 0.001, value: 1.0, description: '값이 작을수록 더 강력한 정규화', isHyperParameter: true },
    {
      id: 'kernel',
      label: 'Kernel',
      type: 'select',
      options: [
        { label: 'RBF', value: 'rbf' },
        { label: 'Linear', value: 'linear' },
        { label: 'Polynomial', value: 'poly' },
        { label: 'Sigmoid', value: 'sigmoid' }
      ],
      value: 'rbf',
      description: '데이터를 고차원 공간으로 매핑하는 함수',
      isHyperParameter: true
    },
    { id: 'max_iter', label: 'Max Iterations', type: 'number', min: -1, max: 10000, step: 1, value: -1, description: '모델 수렴에 걸리는 최대 반복 횟수', isHyperParameter: true }
  ],

  // === Regressor 하이퍼파라미터 ===
  'bayesian-ridge': [
    { id: 'alpha_1', label: 'Alpha 1', type: 'number', min: 1e-6, max: 1e-3, step: 1e-6, value: 1e-6, description: '감마 분포 사전 확률로서 alpha 매개변수에 대한 형상 매개변수', isHyperParameter: true },
    { id: 'alpha_2', label: 'Alpha 2', type: 'number', min: 1e-6, max: 1e-3, step: 1e-6, value: 1e-6, description: 'alpha 매개변수에 대한 감마 분포 사전 확률의 역 스케일 매개변수', isHyperParameter: true },
    { id: 'lambda_1', label: 'Lambda 1', type: 'number', min: 1e-6, max: 1e-3, step: 1e-6, value: 1e-6, description: 'lambda 매개변수에 대한 감마 분포 사전 확률', isHyperParameter: true },
    { id: 'lambda_2', label: 'Lambda 2', type: 'number', min: 1e-6, max: 1e-3, step: 1e-6, value: 1e-6, description: 'lambda 매개변수에 대한 감마 분포 사전 확률의 역 스케일 매개변수', isHyperParameter: true },
    { id: 'tol', label: 'Tolerance', type: 'number', min: 1e-5, max: 1e-1, step: 1e-5, value: 0.001, description: '최적화 단계에서 정밀도에 대한 허용 오차', isHyperParameter: true }
  ],
  'elastic-net': [
    { id: 'alpha', label: 'Alpha', type: 'number', min: 0.001, max: 10, step: 0.001, value: 0.1, description: '과적합 방지를 위한 값', isHyperParameter: true },
    { id: 'l1_ratio', label: 'L1 Ratio', type: 'number', min: 0, max: 1, step: 0.01, value: 0.5, description: 'Elastic Net은 L1규제(라쏘)와 L2규제(릿지)를 결합한 모델로 두 규제의 상대적인 강도를 조절', isHyperParameter: true },
    { id: 'max_iter', label: 'Max Iterations', type: 'number', min: 100, max: 10000, step: 100, value: 1000, description: '모델 수렴에 걸리는 최대 반복 횟수', isHyperParameter: true },
    { id: 'tol', label: 'Tolerance', type: 'number', min: 1e-5, max: 1e-1, step: 1e-5, value: 1e-4, description: '최적화 단계에서 정밀도에 대한 허용 오차', isHyperParameter: true }
  ],
  'gradient-boosting': [
    { id: 'learning_rate', label: 'Learning Rate', type: 'number', min: 0.001, max: 1, step: 0.001, value: 0.1, description: '최적화 과정에서 Loss를 줄이기 위해 파라미터를 변경하는 정도', isHyperParameter: true },
    { id: 'n_estimators', label: 'N Estimators', type: 'number', min: 10, max: 1000, step: 10, value: 100, description: '트리의 개수', isHyperParameter: true },
    {
      id: 'criterion',
      label: 'Criterion',
      type: 'select',
      options: [
        { label: 'Friedman MSE', value: 'friedman_mse' },
        { label: 'Squared Error', value: 'squared_error' }
      ],
      value: 'friedman_mse',
      description: '분할 품질을 측정하는 기능',
      isHyperParameter: true
    },
    { id: 'min_samples_split', label: 'Min Samples Split', type: 'number', min: 2, max: 20, step: 1, value: 2, description: '자식 노드를 분할하는데 필요한 최소 샘플 수', isHyperParameter: true },
    { id: 'min_samples_leaf', label: 'Min Samples Leaf', type: 'number', min: 1, max: 20, step: 1, value: 1, description: '리프 노드에 있어야 할 최소 샘플 수', isHyperParameter: true },
    { id: 'max_depth', label: 'Max Depth', type: 'number', min: 1, max: 20, step: 1, value: 3, description: '트리의 최대 깊이 설정', isHyperParameter: true }
  ],
  'kernel-ridge': [
    { id: 'alpha', label: 'Alpha', type: 'number', min: 0.001, max: 10, step: 0.001, value: 0.01, description: '과적합 방지를 위한 값', isHyperParameter: true },
    {
      id: 'kernel',
      label: 'Kernel',
      type: 'select',
      options: [
        { label: 'Linear', value: 'linear' },
        { label: 'RBF', value: 'rbf' },
        { label: 'Polynomial', value: 'poly' },
        { label: 'Sigmoid', value: 'sigmoid' }
      ],
      value: 'rbf',
      description: '데이터를 고차원 공간으로 매핑하는 함수',
      isHyperParameter: true
    },
    { id: 'gamma', label: 'Gamma', type: 'number', min: 0.001, max: 10, step: 0.001, value: 1, description: '일반화 성능 향상과 과적합을 방지하는 상수', isHyperParameter: true },
    { id: 'degree', label: 'Degree', type: 'number', min: 1, max: 10, step: 1, value: 2, description: '다항식 커널의 차수', isHyperParameter: true }
  ],
  'linear-regression': [
    { id: 'fit_intercept', label: 'Fit Intercept', type: 'bool', value: true, description: '절편을 계산할지 여부', isHyperParameter: true },
    { id: 'copy_X', label: 'Copy X', type: 'bool', value: true, description: 'True(X가 복사), False(덮어쓰기)', isHyperParameter: true },
    { id: 'positive', label: 'Positive', type: 'bool', value: false, description: 'True(계수를 강제로 양수)', isHyperParameter: true }
  ],
  'sgd': [
    {
      id: 'loss',
      label: 'Loss',
      type: 'select',
      options: [
        { label: 'Squared Error', value: 'squared_error' },
        { label: 'Huber', value: 'huber' },
        { label: 'Epsilon Insensitive', value: 'epsilon_insensitive' }
      ],
      value: 'squared_error',
      description: '손실함수',
      isHyperParameter: true
    },
    { id: 'max_iter', label: 'Max Iterations', type: 'number', min: 100, max: 10000, step: 100, value: 100, description: '모델 수렴에 걸리는 최대 반복 횟수', isHyperParameter: true },
    { id: 'tol', label: 'Tolerance', type: 'number', min: 1e-5, max: 1e-1, step: 1e-5, value: 0.001, description: '최적화 단계에서 정밀도에 대한 허용 오차', isHyperParameter: true },
    {
      id: 'penalty',
      label: 'Penalty',
      type: 'select',
      options: [
        { label: 'L1', value: 'l1' },
        { label: 'L2', value: 'l2' },
        { label: 'Elastic Net', value: 'elasticnet' }
      ],
      value: 'l2',
      description: '정규화에 사용할 Norm 설정',
      isHyperParameter: true
    },
    { id: 'alpha', label: 'Alpha', type: 'number', min: 0.0001, max: 1, step: 0.0001, value: 0.0001, description: '과적합 방지를 위한 값', isHyperParameter: true }
  ],
  'support-vector-regression': [
    { id: 'C', label: 'Regularization (C)', type: 'number', min: 0.001, max: 100, step: 0.001, value: 1.0, description: '값이 작을수록 더 강력한 정규화', isHyperParameter: true },
    {
      id: 'kernel',
      label: 'Kernel',
      type: 'select',
      options: [
        { label: 'RBF', value: 'rbf' },
        { label: 'Linear', value: 'linear' },
        { label: 'Polynomial', value: 'poly' },
        { label: 'Sigmoid', value: 'sigmoid' }
      ],
      value: 'rbf',
      description: '데이터를 고차원 공간으로 매핑하는 함수',
      isHyperParameter: true
    },
    { id: 'epsilon', label: 'Epsilon', type: 'number', min: 0.01, max: 1, step: 0.01, value: 0.1, description: '모델이 허용하는 예측 오차의 한계를 결정', isHyperParameter: true }
  ]
})
import {trainSimpleMLModel} from "~/composables/simple-ml";

// API 호출 함수
const handleTrain = async () => {
  if (!canTrain.value) return;

  try {
    const response = await trainSimpleMLModel(
      selectedModelType.value?.value!,
      selectedAlgorithm.value?.value!,
      requestBody.value
    );

    if (String(response.code).endsWith('200')) {
      navigateTo(`/simple-ml`, {
        replace: true,
        redirectCode: 301,
        external: true
      });
    } else {
      alert("오류[" + response.code + "]: " + response.message);
    }
  } catch (error) {
    console.error('Training failed:', error);
    alert("학습 시작 중 오류가 발생했습니다.");
  }
};

const toolbarLinks = ref([
  [{ label: '취소', icon: 'i-heroicons-arrow-uturn-left', click: () => router.back() }],
  [{ label: '학습 시작', icon: 'i-heroicons-plus-circle', click: () => handleTrain() }]
])

// Computed properties
const availableAlgorithms = computed(() => {
  if (!selectedModelType.value?.value) return []
  return algorithmMap.value[selectedModelType.value.value as keyof typeof algorithmMap.value] || []
})

const availableDatasets = computed(() => {
  if (!selectedModelType.value?.value) return []
  return datasetMap.value[selectedModelType.value.value as keyof typeof datasetMap.value] || []
})

const availableTargetOptions = computed(() => {
  if (!selectedDataset.value || !isTabularModel.value) return []
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  if (!dataset || !(dataset as any).targets) return []
  return (dataset as any).targets
})

const isTabularModel = computed(() => {
  return selectedModelType.value?.value === 'classifier' || selectedModelType.value?.value === 'regressor'
})

const availableInputColumns = computed(() => {
  if (!selectedDataset.value || !isTabularModel.value || !selectedTarget.value) return []
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  if (!dataset || !(dataset as any).columns) return []
  return (dataset as any).columns.filter((column: string) => column !== selectedTarget.value.value)
})

// 새로운 computed property: 선택되지 않은 컬럼들
const unselectedColumns = computed(() => {
  return availableInputColumns.value.filter(column => !selectedInputs.value.includes(column))
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
    // 하이퍼파라미터 분리
    const hp: {[key: string]: any} = {}
    allOptions.value.forEach(option => {
      if (option.isHyperParameter && option.value !== undefined && option.value !== null && option.value !== '') {
        hp[option.id] = option.value
      } else if (!option.isHyperParameter && option.value !== undefined && option.value !== null && option.value !== '') {
        body[option.id] = option.value
      }
    })
    if (Object.keys(hp).length > 0) {
      body.hp = hp
    }
  } else {
    // 비 Tabular 모델의 경우 모든 옵션을 직접 추가
    allOptions.value.forEach(option => {
      if (option.value !== undefined && option.value !== null && option.value !== '') {
        body[option.id] = option.value
      }
    })
  }
  return body
})

const canTrain = computed(() => {
  const hasDataset = selectedDataset.value !== null
  const hasTabularRequirements = !isTabularModel.value || (selectedInputs.value.length > 0 && selectedTarget.value)
  return selectedModelType.value && selectedAlgorithm.value && hasDataset && hasTabularRequirements
})

// 새로운 기능 함수들
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

// 옵션 생성 함수
const generateOptions = () => {
  if (!selectedModelType.value || !selectedAlgorithm.value) {
    allOptions.value = []
    return
  }

  let options: Option[] = []
  const modelType = selectedModelType.value.value
  const algorithm = selectedAlgorithm.value.value

  if (modelType === 'classifier' || modelType === 'regressor') {
    // Tabular 모델 - 알고리즘별 하이퍼파라미터
    const algorithmOptions = optionTemplates.value[algorithm as keyof typeof optionTemplates.value] || []
    options = [...algorithmOptions]
  } else {
    // Image/Text 모델
    options = [...optionTemplates.value['image-text-common']]
    if (modelType === 'image-classifier') {
      if (algorithm === 'mobile-vit') {
        options = [...options, ...optionTemplates.value['mobile_vit']]
      } else if (algorithm === 'pvt-v2') {
        options = [...options, ...optionTemplates.value['pvt_v2']]
      } else {
        options = [...options, ...optionTemplates.value['image-classifier']]
      }
    } else if (modelType === 'text-classifier') {
      if (algorithm === 'rnn') {
        options = [...options, ...optionTemplates.value['rnn']]
      } else {
        options = [...options, ...optionTemplates.value['text-classifier']]
        if (algorithm === 'switch-transformer') {
          options = [...options, ...optionTemplates.value['switch-transformer']]
        }
      }
    }
  }

  allOptions.value = JSON.parse(JSON.stringify(options))
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
  // 타겟 자동 선택 (첫 번째 옵션)
  if (datasetWithTarget.targets && datasetWithTarget.targets.length > 0) {
    selectedTarget.value = datasetWithTarget.targets[0]
  }

  // 기본 입력 특성 설정 (타겟 제외한 모든 컬럼)
  if (datasetWithTarget.columns && Array.isArray(datasetWithTarget.columns) && selectedTarget.value) {
    selectedInputs.value = datasetWithTarget.columns.filter((col: string) => col !== selectedTarget.value.value)
  }
}

const toggleInput = (column: string, checked: boolean) => {
  if (checked) {
    if (!selectedInputs.value.includes(column)) {
      selectedInputs.value.push(column)
    }
  } else {
    const index = selectedInputs.value.indexOf(column)
    if (index > -1) {
      selectedInputs.value.splice(index, 1)
    }
  }
}

// Watchers
watch(selectedModelType, (newType) => {
  if (!newType?.value) return
  selectedAlgorithm.value = null
  selectedDataset.value = null
  selectedTarget.value = null
  allOptions.value = []
  selectedInputs.value = []
  trainTestSplit.value = 0.2
})

watch(selectedAlgorithm, (newAlgorithm) => {
  if (!newAlgorithm?.value || !selectedModelType.value?.value) return
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

// 타겟 변경 시 입력 특성 업데이트
watch(selectedTarget, (newTarget) => {
  if (!newTarget || !selectedDataset.value || !isTabularModel.value) return
  const dataset = availableDatasets.value.find(d => d.value === selectedDataset.value?.value)
  if (!dataset) return

  const datasetWithColumns = dataset as any
  if (datasetWithColumns.columns && Array.isArray(datasetWithColumns.columns)) {
    // 기존 선택된 특성들 중 새로운 타겟과 겹치지 않는 것들만 유지
    selectedInputs.value = selectedInputs.value.filter(input => input !== newTarget.value)
    // 타겟이 아닌 모든 컬럼을 기본으로 선택 (사용자가 이미 해제한 것들 제외)
    const availableColumns = datasetWithColumns.columns.filter((col: string) => col !== newTarget.value)
    availableColumns.forEach((col: string) => {
      if (!selectedInputs.value.includes(col)) {
        selectedInputs.value.push(col)
      }
    })
  }
})

// 데이터셋 선택 시 자동 선택 처리
watch(availableDatasets, (newDatasets) => {
  if (newDatasets.length === 1 && !selectedDataset.value) {
    // 데이터셋이 하나만 있으면 자동 선택
    selectedDataset.value = newDatasets[0]
  }
}, { immediate: true })

// 타겟 옵션이 하나만 있을 때 자동 선택
watch(availableTargetOptions, (newTargets) => {
  if (newTargets.length === 1 && !selectedTarget.value) {
    selectedTarget.value = newTargets[0]
  }
}, { immediate: true })
</script>

<style scoped>
.model-selection-panel {
  min-height: 400px;
}

.config-panel {
  min-height: 400px;
}

.dataset-config-section {
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

.options-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  color: #495057;
  font-size: 1rem;
  font-weight: 600;
}

/* 새로운 태그 스타일 */
.selected-features-container {
  margin-bottom: 12px;
}

.feature-tag {
  @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200;
  transition: all 0.2s ease;
}

.feature-tag:hover {
  @apply bg-blue-200 border-blue-300;
}

.feature-tag-text {
  margin-right: 6px;
}

.feature-tag-remove {
  @apply inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1;
  transition: background-color 0.15s ease;
}

.feature-tag-remove:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.available-features-container {
  margin-bottom: 12px;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.available-feature-btn {
  @apply inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1;
  transition: all 0.15s ease;
}

.available-feature-btn:disabled {
  @apply opacity-50 cursor-not-allowed hover:bg-white hover:border-gray-300;
}

.quick-select-container {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

@media (max-width: 1023px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* 태그 애니메이션 */
.feature-tag {
  animation: fadeInScale 0.2s ease-out;
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

/* 호버 효과 개선 */
.available-feature-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.feature-tag:hover .feature-tag-remove {
  background-color: rgba(59, 130, 246, 0.15);
}

/* 반응형 디자인 개선 */
@media (max-width: 640px) {
  .feature-tag {
    @apply text-xs px-2 py-1;
  }

  .available-feature-btn {
    @apply text-xs px-2 py-1;
  }

  .quick-select-container .flex {
    @apply flex-col space-y-2;
    gap: 0;
  }
}
</style>