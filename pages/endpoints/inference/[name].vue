<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" :badge="headerBadge" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div class="space-y-4">
      <!-- 상태 표시 -->
      <div class="flex justify-end">
        <UBadge
          :color="modelStatus === 'ready' ? 'green' : 'yellow'"
          variant="subtle"
        >
          {{ modelStatus }}
        </UBadge>
      </div>

      <!-- 입력/출력 패널 -->
      <div class="flex gap-6 items-start">
        <!-- 좌측: 입력 패널 - 고정 높이 -->
        <div
          class="w-1/2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm flex flex-col h-[600px]"
        >
          <!-- 입력 헤더 -->
          <div
            class="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0"
          >
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <h3 class="text-lg font-semibold">🤖 Model Input</h3>
            </div>
          </div>

          <!-- 입력 방식 토글 -->
          <div class="px-4 pt-4 pb-3 flex-shrink-0" v-if="isMLFlow">
            <div
              class="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <button
                @click="setInputMethod('json')"
                :class="[
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center',
                  inputMethod === 'json'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ]"
              >
                <UIcon name="i-heroicons-code-bracket" class="mr-2 w-4 h-4" />
                JSON
              </button>
              <button
                @click="setInputMethod('form')"
                :class="[
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center',
                  inputMethod === 'form'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                ]"
              >
                <UIcon name="i-heroicons-document-text" class="mr-2 w-4 h-4" />
                Form
              </button>
            </div>
          </div>

          <!-- LLM 모드 (MLFlow가 아닌 경우) -->
          <div v-if="!isMLFlow" class="flex-1 p-4 pt-2 overflow-auto">
            <div class="space-y-4">
              <!-- Prompt 입력 -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <UTextarea
                  v-model="llmData.prompt"
                  :rows="6"
                  placeholder="Enter your prompt here..."
                  class="w-full"
                />
              </div>

              <!-- LLM 파라미터 -->
              <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                <h5 class="text-sm font-medium mb-3">LLM Parameters</h5>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      Max Tokens
                    </label>
                    <UInput
                      v-model="llmData.max_tokens"
                      type="number"
                      :min="1"
                      :max="8192"
                      size="xs"
                      placeholder="100"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">
                      Temperature
                    </label>
                    <UInput
                      v-model="llmData.temperature"
                      type="number"
                      :min="0"
                      :max="2"
                      :step="0.1"
                      size="xs"
                      placeholder="0.7"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Form 모드 (MLFlow인 경우) -->
          <div
            v-if="inputMethod === 'form' && isMLFlow"
            class="flex-1 p-4 pt-2 overflow-auto"
          >
            <div class="space-y-4">
              <!-- 기본 정보 섹션 -->
              <div class="bg-gray-50 p-3 rounded-lg">
                <h5 class="text-sm font-medium mb-3">Input Configuration</h5>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1"
                      >Name</label
                    >
                    <UInput
                      v-model="formData.name"
                      size="xs"
                      placeholder="input"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1"
                      >Data Type</label
                    >
                    <USelectMenu
                      v-model="formData.datatype"
                      :options="[
                        { label: 'FP64', value: 'FP64' },
                        { label: 'FP32', value: 'FP32' },
                        { label: 'INT64', value: 'INT64' },
                        { label: 'INT32', value: 'INT32' }
                      ]"
                      size="xs"
                    />
                  </div>
                </div>
                <div class="mt-3">
                  <label class="block text-xs font-medium text-gray-700 mb-1"
                    >Shape</label
                  >
                  <div class="flex items-center gap-2">
                    <UInput
                      v-model="formData.shape[0]"
                      type="number"
                      size="xs"
                      class="w-20"
                    />
                    <span class="text-xs text-gray-500">×</span>
                    <UInput
                      v-model="formData.shape[1]"
                      type="number"
                      size="xs"
                      class="w-20"
                    />
                  </div>
                </div>
              </div>

              <!-- 데이터 입력 섹션 -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="block text-sm font-medium text-gray-700"
                    >Input Values ({{ formData.data.length }}/{{
                      totalInputs
                    }})</label
                  >
                  <div class="flex gap-1">
                    <UButton
                      @click="fillRandomData"
                      variant="outline"
                      size="xs"
                    >
                      Random
                    </UButton>
                    <UButton @click="fillZeroData" variant="outline" size="xs">
                      Clear All
                    </UButton>
                  </div>
                </div>

                <!-- 입력 필드들을 그리드로 배치 -->
                <div class="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                  <div
                    v-for="(value, index) in formData.data"
                    :key="index"
                    class="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span class="text-xs text-gray-500 min-w-[60px] font-mono">
                      data[{{ index }}]:
                    </span>
                    <UInput
                      v-model="formData.data[index]"
                      type="number"
                      step="any"
                      size="xs"
                      class="flex-1"
                      :placeholder="`Value ${index + 1}`"
                      @input="syncFormToJson"
                    />
                  </div>
                </div>
              </div>

              <!-- 빠른 입력 템플릿 -->
              <div class="bg-blue-50 p-3 rounded-lg">
                <h5 class="text-sm font-medium mb-2 text-blue-800">
                  Quick Templates
                </h5>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    @click="() => useTemplate('example', inputExampleData)"
                    variant="soft"
                    color="blue"
                    size="xs"
                  >
                    Example Data
                  </UButton>
                  <UButton
                    @click="() => useTemplate('zeros', inputExampleData)"
                    variant="soft"
                    color="gray"
                    size="xs"
                  >
                    All Zeros
                  </UButton>
                  <UButton
                    @click="() => useTemplate('ones', inputExampleData)"
                    variant="soft"
                    color="gray"
                    size="xs"
                  >
                    All Ones
                  </UButton>
                </div>
              </div>
            </div>
          </div>

          <!-- JSON 모드 (MLFlow인 경우) -->
          <div
            v-else-if="inputMethod === 'json' && isMLFlow"
            class="flex-1 relative overflow-hidden"
          >
            <!-- JSON Input 라벨과 Example 버튼 -->
            <div
              class="flex justify-between items-center px-4 pb-3 flex-shrink-0"
            >
              <label class="text-sm font-medium">JSON Input</label>
              <UButton @click="useExampleJson" variant="outline" size="xs">
                Example
              </UButton>
            </div>

            <!-- JSON 에디터 영역 -->
            <div class="flex px-4 pb-4 h-full">
              <!-- 라인 번호 -->
              <div
                class="w-10 bg-gray-50 dark:bg-gray-800 border-r text-sm text-gray-400 font-mono overflow-hidden relative rounded-l"
              >
                <div
                  class="absolute top-0 left-0 w-full"
                  :style="{
                    paddingTop: '8px',
                    transform: `translateY(-${scrollTop}px)`,
                  }"
                >
                  <div
                    v-for="lineNumber in totalLines"
                    :key="lineNumber"
                    class="h-5 flex items-center justify-end pr-2"
                    :style="{ lineHeight: '20px' }"
                  >
                    {{ lineNumber }}
                  </div>
                </div>
              </div>
              <!-- JSON 에디터 -->
              <textarea
                ref="textareaRef"
                v-model="jsonInput"
                class="flex-1 font-mono text-sm border border-gray-200 resize-none focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white rounded-r"
                :style="{
                  lineHeight: '20px',
                  padding: '8px',
                }"
                placeholder="Enter JSON data here..."
                @input="handleJsonInput"
                @scroll="syncScroll"
                spellcheck="false"
              />
            </div>

            <!-- JSON 에러 표시 -->
            <div
              v-if="jsonError"
              class="absolute bottom-0 left-0 right-0 p-2 bg-red-50 border-t border-red-200 text-red-600 text-sm"
            >
              <div class="flex items-center gap-1">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="w-4 h-4"
                />
                {{ jsonError }}
              </div>
            </div>
          </div>

          <!-- 하단 버튼 영역 -->
          <div
            class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between flex-shrink-0"
          >
            <UButton
              @click="() => clearFormInput(isMLFlow)"
              variant="outline"
              color="gray"
            >
              Clear
            </UButton>
            <UButton
              @click="runInference"
              :loading="isLoading"
              :disabled="!canSubmitForm"
              color="green"
            >
              <UIcon name="i-heroicons-play" class="w-4 h-4 mr-2" />
              {{ isLoading ? "Processing..." : "Compute" }}
            </UButton>
          </div>
        </div>

        <!-- 우측: 출력 패널 - 고정 높이 -->
        <div
          class="w-1/2 bg-white dark:bg-gray-800 rounded-lg border shadow-sm flex flex-col h-[600px]"
        >
          <!-- 출력 헤더 -->
          <div
            class="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0"
          >
            <h3 class="text-lg font-semibold">📊 Results</h3>
            <UButton
              v-if="result && !isLoading"
              @click="downloadResult"
              variant="outline"
              size="xs"
              icon="i-heroicons-arrow-down-tray"
            >
              Download
            </UButton>
          </div>

          <!-- 출력 내용 -->
          <div class="flex-1 p-4 overflow-auto">
            <!-- 초기 상태 -->
            <div
              v-if="!result && !isLoading && !error"
              class="h-full flex items-center justify-center"
            >
              <div class="text-center text-gray-500">
                <UIcon
                  name="i-heroicons-cpu-chip"
                  class="w-12 h-12 mx-auto text-gray-300 mb-4"
                />
                <p class="text-sm">Compute to see results</p>
              </div>
            </div>

            <!-- 로딩 상태 -->
            <div
              v-else-if="isLoading"
              class="h-full flex items-center justify-center"
            >
              <div class="text-center">
                <UIcon
                  name="i-heroicons-cpu-chip"
                  class="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500"
                />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Processing...
                </p>
              </div>
            </div>

            <!-- 에러 상태 -->
            <div
              v-else-if="error"
              class="h-full flex items-center justify-center"
            >
              <div class="text-center text-red-500">
                <UIcon
                  name="i-heroicons-exclamation-triangle"
                  class="w-8 h-8 mx-auto mb-4"
                />
                <p class="text-sm break-words mb-4">{{ error }}</p>
                <UButton
                  @click="retryInference"
                  variant="outline"
                  color="red"
                  icon="i-heroicons-arrow-path"
                >
                  Retry
                </UButton>
              </div>
            </div>

            <!-- 결과 표시 -->
            <div v-else-if="result" class="space-y-4">
              <UAlert
                color="green"
                variant="subtle"
                icon="i-heroicons-check-circle"
                title="Inference Complete"
                :description="`Processed in ${executionTime}ms`"
              />

              <!-- 결과 내용 -->
              <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <!-- LLM 모델 결과 (isMLFlow: false) -->
                <template v-if="!isMLFlow">
                  <h4 class="text-sm font-medium mb-4">Generated Text</h4>

                  <!-- LLM 텍스트 결과가 있는 경우 -->
                  <div v-if="hasLlmText">
                    <div class="bg-white dark:bg-gray-700 rounded-lg p-4">
                      <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{{ llmText }}</pre>
                    </div>

                    <!-- 토큰 사용량 정보 -->
                    <div v-if="llmUsage" class="mt-3 text-xs text-gray-500 flex gap-4">
                      <span>Prompt Tokens: {{ llmUsage.prompt_tokens }}</span>
                      <span>Completion Tokens: {{ llmUsage.completion_tokens }}</span>
                      <span>Total Tokens: {{ llmUsage.total_tokens }}</span>
                    </div>
                  </div>

                  <!-- LLM 텍스트 결과가 없는 경우 -->
                  <div v-else class="text-center py-4 text-gray-500">
                    No generated text available
                  </div>
                </template>

                <!-- MLFlow 모델 결과 (isMLFlow: true) -->
                <template v-else>
                  <h4 class="text-sm font-medium mb-4">Prediction</h4>

                  <!-- 단일 예측값 -->
                  <div v-if="mlflowResultType === 'single'" class="text-center">
                    <div class="inline-block p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl">
                      <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {{ formatNumber(mlflowResult[0]) }}
                      </div>
                      <div class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        Predicted Value
                      </div>
                    </div>
                  </div>
                  
                  <!-- 다중 예측값 -->
                  <div v-else-if="mlflowResultType === 'multiple'" class="space-y-2">
                    <div
                      v-for="(value, index) in mlflowResult"
                      :key="`result-${index}`"
                      class="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded"
                    >
                      <span class="font-medium">Result {{ index + 1 }}</span>
                      <span class="text-lg font-mono text-blue-600">{{ formatNumber(value) }}</span>
                    </div>
                  </div>

                  <!-- 객체 형태 결과 -->
                  <div v-else-if="mlflowResultType === 'object'" class="space-y-2">
                    <div
                      v-for="(value, key) in result.value"
                      :key="key"
                      class="flex justify-between items-center p-3 bg-white dark:bg-gray-700 rounded"
                    >
                      <span class="font-medium">{{ key }}</span>
                      <span class="text-sm font-mono text-blue-600">
                        {{ typeof value === "object" ? JSON.stringify(value) : value }}
                      </span>
                    </div>
                  </div>

                  <!-- 결과가 없는 경우 -->
                  <div v-else class="text-center py-4 text-gray-500">
                    No prediction results available
                  </div>
                </template>
              </div>

              <!-- Raw JSON - 고정 높이로 스크롤 -->
              <details class="mt-4" @toggle="handleJsonToggle">
                <summary
                  class="cursor-pointer text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <UIcon
                    :name="
                      isJsonExpanded
                        ? 'i-heroicons-chevron-down'
                        : 'i-heroicons-chevron-right'
                    "
                    class="w-4 h-4 mr-1"
                  />
                  View Raw JSON
                </summary>
                <div v-if="isJsonExpanded" class="mt-3">
                  <pre
                    class="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-auto h-60 whitespace-pre-wrap break-all"
                    >{{ JSON.stringify(result, null, 2) }}</pre
                  >
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      <!-- 히스토리 섹션 -->
      <UCard v-if="history.length > 0" class="mt-4">
        <template #header>
          <h3 class="text-lg font-semibold">Recent Compute</h3>
        </template>
        <div class="space-y-3">
          <div
            v-for="(item, index) in history.slice(0, 3)"
            :key="index"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            @click="loadFromHistory(item)"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">오전 {{ item.timestamp }}</span>
              <UButton
                @click.stop="removeFromHistory(index)"
                variant="ghost"
                size="xs"
                color="red"
              >
                <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
              </UButton>
            </div>
            <!-- 가로 스크롤 가능한 preview -->
            <div class="overflow-x-auto max-w-full">
              <p class="text-sm text-gray-500 whitespace-nowrap min-w-0">
                {{ item.preview }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
// 리팩토링 전 직접 로직으로 되돌림

// Route params
const route = useRoute();
const router = useRouter();
const endpointName = route.params.name as string;

// 엔드포인트 정보와 input example 로드
const endpointInfo = ref(null);
const inputExampleData = ref(null);
const mlModelSignature = ref(null);

// Form management composable
const {
  llmData,
  formData,
  jsonInput,
  jsonError,
  inputMethod,
  totalInputs,
  canSubmit,
  updateDataArray,
  syncFormToJson,
  validateJson,
  clearInput: clearFormInput,
  fillRandomData,
  fillZeroData,
  useTemplate,
  setInputMethod,
  loadFromHistory: loadFormFromHistory,
} = useInferenceForm();

// 브레드크럼 설정
const breadcrumbs = ref([
  { label: "Home", to: "/" },
  { label: "Endpoints", to: "/endpoints" },
  { label: endpointName },
]);

// 페이지 제목과 배지
const pageTitle = ref(endpointName);
const headerBadge = ref({
  label: "inference",
  color: "blue",
  variant: "subtle",
});

// 툴바 링크
const toolbarLinks = ref([
  [
    {
      label: "취소",
      icon: "i-heroicons-arrow-uturn-left",
      click: () => {
        router.back();
      },
    },
  ],
]);

// Template refs
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 상태 관리
const modelStatus = ref("ready");
const isLoading = ref(false);
const result = ref(null);
const error = ref("");
const executionTime = ref(0);
const scrollTop = ref(0);
const isJsonExpanded = ref(false);

// 히스토리
const history = ref([]);

// Computed
const totalLines = computed(() => {
  const lines = jsonInput.value.split("\n");
  return Math.max(lines.length, 1);
});

// MLFlow 모델인지 확인
const isMLFlow = computed(() => {
  if (!endpointInfo.value) {
    return true; // 기본값은 true (MLFlow)
  }
  
  // LLM 모델이면 MLFlow가 아님
  if (isLLMModel(endpointInfo.value)) {
    return false;
  }
  
  // 그렇지 않으면 MLFlow 모델인지 확인
  return isMLFlowModel(endpointInfo.value);
});

// Form submission validation
const canSubmitForm = computed(() => {
  return canSubmit.value(isMLFlow.value);
});

// LLM 응답 데이터 추출 computed
const llmText = computed(() => {
  return result.value?.result?.choices?.[0]?.text || result.value?.choices?.[0]?.text || '';
});

const llmUsage = computed(() => {
  return result.value?.result?.usage || result.value?.usage || null;
});

const hasLlmText = computed(() => {
  return !!llmText.value;
});

// MLFlow 응답 데이터 추출 computed
const mlflowResult = computed(() => {
  if (result.value?.result && Array.isArray(result.value.result)) {
    return result.value.result;
  }
  if (result.value && Array.isArray(result.value)) {
    return result.value;
  }
  return null;
});

const hasMlflowResult = computed(() => {
  return !!mlflowResult.value;
});

// MLFlow 결과 표시 타입 판별
const mlflowResultType = computed(() => {
  if (!result.value) return 'none';
  
  if (mlflowResult.value) {
    return mlflowResult.value.length === 1 ? 'single' : 'multiple';
  }
  
  if (result.value && typeof result.value === 'object' && !Array.isArray(result.value)) {
    return 'object';
  }
  
  return 'none';
});

// 숫자 포맷팅 함수
const formatNumber = (value: any): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value !== "number" || isNaN(value)) return String(value);
  try {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    return String(value);
  }
};

// 페이지 로드시 엔드포인트 정보와 input example 가져오기
onMounted(async () => {
  try {
    const namespace = "kubeflow-user-example-com";
    const { endpoint, inputExample, mlModelSignature: signature } = await getEndpointWithInputExample(
      namespace,
      endpointName
    );

    endpointInfo.value = endpoint;
    inputExampleData.value = inputExample;
    mlModelSignature.value = signature;

    // MLmodel signature가 있으면 datatype을 자동 설정
    if (signature && signature.dtype) {
      formData.value.datatype = signature.dtype;
    }

    // input example이 있으면 shape와 기본 데이터 자동 설정
    if (
      inputExample &&
      Array.isArray(inputExample) &&
      inputExample.length > 0
    ) {
      const firstArray = inputExample[0];

      if (Array.isArray(firstArray)) {
        // 2차원 배열인 경우
        formData.value.shape = [1, firstArray.length]; // 첫 번째 배열만 사용하므로 [1, length]
        formData.value.data = [...firstArray]; // 첫 번째 배열의 값들을 그대로 사용
      } else {
        // 1차원 배열인 경우 (inputExample 자체가 데이터 배열)
        formData.value.shape = [1, inputExample.length];
        formData.value.data = [...inputExample];
      }

      // JSON도 동기화
      syncFormToJson();
    }
  } catch (error) {
    console.error("Failed to load endpoint info:", error);
  }
});

watch(
  () => [formData.value.shape[0], formData.value.shape[1]],
  () => {
    updateDataArray();
  },
  { deep: true }
);

const handleJsonToggle = (event) => {
  isJsonExpanded.value = event.target.open;
};

const useExampleJson = () => {
  useTemplate("example", inputExampleData.value);
};

const removeFromHistory = (index) => {
  history.value.splice(index, 1);
};

const handleJsonInput = () => {
  validateJson();
};

const syncScroll = () => {
  if (textareaRef.value) {
    scrollTop.value = textareaRef.value.scrollTop;
  }
};

// 공통 추론 실행 전후 처리
const executeInference = async (inferenceFunction: () => Promise<any>, previewData: any, previewText: string) => {
  isLoading.value = true;
  error.value = "";
  result.value = null;
  const startTime = Date.now();

  try {
    const response = await inferenceFunction();
    result.value = response || {};
    executionTime.value = Date.now() - startTime;

    addToHistory({
      timestamp: new Date().toLocaleTimeString(),
      status: "success",
      preview: previewText,
      data: previewData,
      result: result.value,
    });
  } catch (err) {
    error.value = `API Error: ${err?.message || "Unknown error occurred"}`;
    addToHistory({
      timestamp: new Date().toLocaleTimeString(),
      status: "error",
      preview: "Error occurred",
      error: error.value,
    });
  } finally {
    isLoading.value = false;
  }
};

const runLLMInferenceLocal = async () => {
  await executeInference(
    () => runLLMInference(
      "kubeflow-user-example-com",
      endpointName,
      llmData.value.prompt,
      llmData.value.max_tokens,
      llmData.value.temperature
    ),
    llmData.value,
    `Prompt: ${llmData.value.prompt.substring(0, 50)}...`
  );
};

const runMLFlowInferenceLocal = async () => {
  const inputData = inputMethod.value === "json" 
    ? JSON.parse(jsonInput.value)
    : {
        name: formData.value.name,
        shape: formData.value.shape,
        datatype: formData.value.datatype,
        data: formData.value.data.map((val) => Number(val) || 0),
      };

  await executeInference(
    async () => {
      const namespace = "kubeflow-user-example-com";
      const apiUrl = `/inference-services/${namespace}/${endpointName}/infer`;
      const config = useAppConfig();

      return await $fetch(apiUrl, {
        method: "POST",
        baseURL: config.api?.url,
        body: inputData,
        headers: {
          "Content-Type": "application/json",
          "wisenut-authorization": "miracle-wisenut",
        },
      });
    },
    inputData,
    JSON.stringify(inputData).substring(0, 80) + "..."
  );
};

const runInference = async () => {
  if (!isMLFlow.value) {
    await runLLMInferenceLocal();
  } else {
    await runMLFlowInferenceLocal();
  }
};

const retryInference = () => {
  error.value = "";
  runInference();
};

const addToHistory = (item) => {
  history.value.unshift(item);
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10);
  }
};

const loadFromHistory = (item) => {
  loadFormFromHistory(item, isMLFlow.value);
};

const downloadResult = () => {
  if (!result.value) return;
  const blob = new Blob([JSON.stringify(result.value, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inference_result_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Watchers
watch(jsonInput, validateJson);

// SEO
useHead({
  title: `Inference - ${endpointName}`,
});
</script>
