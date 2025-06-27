<template>
  <div class="flex gap-4 h-96">
    <!-- Left Panel - Input Editor -->
    <div class="w-1/2 bg-white rounded-lg border flex flex-col">
      <!-- Editor Header -->
      <div class="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0 h-12">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span class="text-sm font-medium">INPUT</span>
        </div>
        <!-- 오른쪽 영역: beautify 버튼 + 토글 -->
        <div class="flex items-center gap-2">
          <UButton
            v-if="!isFormMode"
            @click="beautifyJson"
            :disabled="!jsonInput.trim()"
            color="gray"
            variant="ghost"
            size="xs"
          >
            <UIcon name="i-heroicons-sparkles" class="w-3 h-3" />
            beautify
          </UButton>
          <span class="text-xs text-gray-600">{{ isFormMode ? 'Form' : 'JSON' }}</span>
          <UToggle
            v-model="isFormMode"
            :disabled="!canSwitchToForm"
            :ui="{ base: 'w-8 h-4' }"
          />
        </div>
      </div>

      <!-- Form Mode -->
      <div v-if="isFormMode" class="flex-1 p-4 overflow-auto flex flex-col">
        <!-- Tabular Model Form -->
        <div v-if="isTabularModel && formFields.length > 0" class="space-y-4">
          <label class="block text-sm font-medium mb-2">Input Values</label>
          <div class="grid grid-cols-1 gap-3">
            <div v-for="(field, index) in formFields" :key="index" class="flex items-center gap-2">
              <label class="text-xs text-gray-600 min-w-0 flex-shrink-0 w-24 truncate" :title="field">
                {{ field }}:
              </label>
              <UInput
                v-model="formValues[index]"
                type="number"
                step="any"
                size="xs"
                class="flex-1"
                @input="syncFormToJson"
              />
            </div>
          </div>
        </div>

        <!-- Image Classifier Form -->
        <div v-else-if="isImageClassifier" class="flex flex-col h-full">
          <label class="block text-sm font-medium mb-2">Image Name</label>
          <UInput
            v-model="singleValue"
            placeholder="Enter image filename (e.g., truck.jpg)"
            @input="syncFormToJson"
          />
        </div>

        <!-- Text Classifier Form -->
        <div v-else-if="isTextClassifier" class="flex flex-col h-full">
          <label class="block text-sm font-medium mb-2">Text</label>
          <UTextarea
            v-model="singleValue"
            placeholder="Enter text to classify"
            class="flex-1 min-h-0"
            :ui="{
              base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 h-full',
              rounded: 'rounded-md',
              placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',
              size: {
                sm: 'text-xs',
                md: 'text-sm',
                lg: 'text-sm',
                xl: 'text-base'
              },
              padding: {
                sm: 'px-2.5 py-1.5',
                md: 'px-3 py-2',
                lg: 'px-3.5 py-2.5',
                xl: 'px-4 py-3'
              },
              variant: {
                outline: 'shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
                none: 'bg-transparent focus:ring-0 focus:shadow-none'
              }
            }"
            :style="{ resize: 'none' }"
            @input="syncFormToJson"
          />
        </div>

        <!-- No Form Available -->
        <div v-else class="h-full flex items-center justify-center text-gray-500">
          <div class="text-center">
            <UIcon name="i-heroicons-document-text" class="w-8 h-8 mx-auto mb-2" />
            <p class="text-sm">No form fields available</p>
            <p class="text-xs mt-1">Model: {{ modelType }}, Inputs: {{ inputs?.length || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- JSON Editor Mode -->
      <div v-else class="flex-1 relative overflow-hidden">
        <div class="flex h-full">
          <!-- Line Numbers -->
          <div
            ref="lineNumbersRef"
            class="w-10 bg-gray-50 border-r text-xs text-gray-400 font-mono overflow-hidden relative"
          >
            <div
              class="absolute top-0 left-0 w-full"
              :style="{
                paddingTop: '8px',
                transform: `translateY(-${scrollTop}px)`
              }"
            >
              <div
                v-for="lineNumber in totalLines"
                :key="lineNumber"
                class="h-5 flex items-center justify-end pr-2 whitespace-nowrap"
                :style="{ lineHeight: '20px' }"
              >
                {{ lineNumber }}
              </div>
            </div>
          </div>
          <!-- Editor Textarea -->
          <textarea
            ref="textareaRef"
            v-model="jsonInput"
            class="flex-1 font-mono text-xs border-0 resize-none focus:ring-0 focus:outline-none"
            :style="{
              lineHeight: '20px',
              padding: '8px'
            }"
            placeholder="Enter JSON input..."
            @input="handleJsonInput"
            @scroll="syncScroll"
            spellcheck="false"
          />
        </div>
        <!-- JSON Error Display -->
        <div v-if="jsonError" class="absolute bottom-0 left-0 right-0 p-2 bg-red-50 border-t border-red-200 text-red-600 text-xs">
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3" />
            {{ jsonError }}
          </div>
        </div>
      </div>
    </div>

    <!-- Right Panel - Output -->
    <div class="w-1/2 bg-white rounded-lg border flex flex-col">
      <!-- Output Header -->
      <div class="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0 h-12">
        <span class="text-sm font-medium text-gray-900">OUTPUT</span>
        <UButton
          @click="handlePredict"
          :loading="isLoading"
          :disabled="!isValidInput"
          color="blue"
          size="xs"
        >
          <template #trailing>
            <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
          </template>
          compute
        </UButton>
      </div>
      <!-- Output Content -->
      <div class="flex-1 p-3 overflow-hidden">
        <div v-if="!hasResult && !isLoading && !error" class="h-full flex items-center justify-center">
          <div class="text-center text-gray-500">
            <UIcon name="i-heroicons-play" class="w-6 h-6 mx-auto mb-1" />
            <p class="text-xs">compute 버튼을 눌러주세요</p>
          </div>
        </div>
        <div v-else-if="isLoading" class="h-full flex items-center justify-center">
          <div class="text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 mx-auto mb-1 animate-spin text-blue-500" />
            <p class="text-xs text-gray-500">Processing...</p>
          </div>
        </div>
        <div v-else-if="error" class="h-full flex items-center justify-center">
          <div class="text-center text-red-500">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mx-auto mb-1" />
            <p class="text-xs break-words">{{ error }}</p>
          </div>
        </div>
        <div v-else-if="hasResult" class="h-full">
          <pre class="bg-gray-50 p-3 rounded text-xs font-mono overflow-auto h-full leading-5">{{ formattedResult }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Inject로 함수 받기
const predictFunction = inject<(expKey: string, data: any) => Promise<any>>('predictFunction')

interface Props {
  expKey: string;
  defaultInput?: Record<string, any>;
  modelType?: string;
  inputs?: string[];
}

interface JsonError extends Error {
  message: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultInput: () => ({}),
  modelType: '',
  inputs: () => []
});

// Template refs
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const lineNumbersRef = ref<HTMLDivElement | null>(null);

// Reactive data
const isFormMode = ref<boolean>(true);
const jsonInput = ref<string>('');
const jsonError = ref<string>('');
const isLoading = ref<boolean>(false);
const result = ref<any>(null);
const error = ref<string>('');
const scrollTop = ref<number>(0);

// Form data
const formFields = ref<string[]>([]);
const formValues = ref<(string | number)[]>([]);
const singleValue = ref<string>('');

// Computed
const isTabularModel = computed<boolean>(() => {
  return props.modelType !== 'image-classifier' && props.modelType !== 'text-classifier';
});

const isImageClassifier = computed<boolean>(() => {
  return props.modelType === 'image-classifier';
});

const isTextClassifier = computed<boolean>(() => {
  return props.modelType === 'text-classifier';
});

const totalLines = computed<number>(() => {
  const lines = jsonInput.value.split('\n');
  return Math.max(lines.length, 1);
});

// JSON 형식이 올바른지 확인
const isValidJsonFormat = computed<boolean>(() => {
  try {
    if (!jsonInput.value.trim()) return false;
    const parsed = JSON.parse(jsonInput.value);

    if (isTabularModel.value) {
      return parsed.inputs && Array.isArray(parsed.inputs) &&
             // parsed.inputs.length === formFields.value.length &&
             parsed.inputs.every((val: any) => typeof val === 'number' && !isNaN(val));
    } else if (isImageClassifier.value) {
      return parsed.img_name && typeof parsed.img_name === 'string' && parsed.img_name.trim() !== '';
    } else if (isTextClassifier.value) {
      return parsed.text && typeof parsed.text === 'string' && parsed.text.trim() !== '';
    }

    return false;
  } catch (e) {
    return false;
  }
});

// Form 모드로 전환 가능한지 확인
const canSwitchToForm = computed<boolean>(() => {
  if (isFormMode.value) return true; // 현재 Form 모드면 항상 가능
  return isValidJsonFormat.value;
});

const isValidInput = computed<boolean>(() => {
  if (isFormMode.value) {
    if (isTabularModel.value) {
      return formFields.value.length > 0 &&
             formValues.value.length === formFields.value.length &&
             formValues.value.every(val => val !== '' && val !== null && val !== undefined && !isNaN(Number(val)));
    } else if (isImageClassifier.value || isTextClassifier.value) {
      return singleValue.value.trim() !== '';
    }
    return false;
  } else {
    return isValidJsonFormat.value;
  }
});

const hasResult = computed<boolean>(() => {
  return result.value !== null;
});

const formattedResult = computed<string>(() => {
  if (!result.value) return '';
  return JSON.stringify(result.value, null, 2);
});

// Methods
const initializeForm = (): void => {
  // Tabular 모델의 경우에만 inputs 필요
  if (isTabularModel.value && props.inputs && props.inputs.length > 0) {
    formFields.value = [...props.inputs];
    formValues.value = new Array(props.inputs.length).fill(0);
  }

  // Initialize with default input if provided
  if (props.defaultInput && Object.keys(props.defaultInput).length > 0) {
    if (isTabularModel.value && Array.isArray(props.defaultInput.inputs)) {
      formValues.value = [...props.defaultInput.inputs];
    } else if (isImageClassifier.value && props.defaultInput.img_name) {
      singleValue.value = props.defaultInput.img_name;
    } else if (isTextClassifier.value && props.defaultInput.text) {
      singleValue.value = props.defaultInput.text;
    }
  }

  syncFormToJson();
};

const syncFormToJson = (): void => {
  let data: any;

  if (isTabularModel.value) {
    // 빈 값이 있는 경우 빈 배열로, 아니면 숫자 배열로
    // const hasEmptyValues = formValues.value.some(val => val === '' || val === null || val === undefined);
    const processedValues = formValues.value.map(val => Number(val));
    data = { inputs: processedValues };
    // if (hasEmptyValues) {
    //   data = { inputs: [] };
    // } else {
    //   const processedValues = formValues.value.map(val => Number(val));
    //   data = { inputs: processedValues };
    // }
  } else if (isImageClassifier.value) {
    data = { img_name: singleValue.value };
  } else if (isTextClassifier.value) {
    data = { text: singleValue.value };
  }

  jsonInput.value = JSON.stringify(data, null, 2);
  validateJson();
};

const syncJsonToForm = (): void => {
  try {
    if (jsonInput.value.trim()) {
      const parsed = JSON.parse(jsonInput.value);

      if (isTabularModel.value && parsed.inputs && Array.isArray(parsed.inputs)) {
        if (parsed.inputs.length <= formFields.value.length) {
          // inputs의 길이가 formFields와 다르면 parsed.inputs에 0을 추가하여 formValues의 길이로 맞춤
          formFields.value.forEach((field, index) => {
            if (parsed.inputs[index] === undefined) {
              parsed.inputs[index] = 0; // 기본값으로 0 설정
            }
          });
        } else {
          // inputs의 길이가 formFields보다 길면 formFields의 길이로 잘라냄
          parsed.inputs = parsed.inputs.slice(0, formFields.value.length);
        }
        formValues.value = [...parsed.inputs];
      } else if (isImageClassifier.value && parsed.img_name && typeof parsed.img_name === 'string') {
        singleValue.value = parsed.img_name;
      } else if (isTextClassifier.value && parsed.text && typeof parsed.text === 'string') {
        singleValue.value = parsed.text;
      }
    }
  } catch (e) {
    // Invalid JSON, don't sync
  }
};

const validateJson = (): void => {
  try {
    if (jsonInput.value.trim()) {
      JSON.parse(jsonInput.value);
      jsonError.value = '';
    }
  } catch (e: unknown) {
    const error = e as JsonError;
    jsonError.value = `Invalid JSON: ${error.message}`;
  }
};

const beautifyJson = (): void => {
  try {
    if (jsonInput.value.trim()) {
      const parsed: any = JSON.parse(jsonInput.value);
      jsonInput.value = JSON.stringify(parsed, null, 2);
      jsonError.value = '';
    }
  } catch (e: unknown) {
    console.warn('Invalid JSON for beautification:', e);
  }
};

const handleJsonInput = (): void => {
  validateJson();
  // JSON이 유효하고 form 모드가 아닐 때만 동기화 시도
  if (!jsonError.value && !isFormMode.value && isValidJsonFormat.value) {
    syncJsonToForm();
  }
};

const syncScroll = (): void => {
  if (textareaRef.value) {
    scrollTop.value = textareaRef.value.scrollTop;
  }
};

// Watch for mode changes
watch(isFormMode, (newMode) => {
  if (newMode) {
    // Form 모드로 전환할 때는 현재 JSON이 올바른 형식인지 확인 후 동기화
    if (isValidJsonFormat.value) {
      syncJsonToForm();
    }
  } else {
    // JSON 모드로 전환할 때는 항상 form 데이터를 JSON으로 동기화
    syncFormToJson();
  }
});

// 주입된 함수 사용
const handlePredict = async (): Promise<void> => {
  try {
    isLoading.value = true;
    error.value = '';
    result.value = null;

    let requestData: any;

    if (isFormMode.value) {
      if (isTabularModel.value) {
        const processedValues = formValues.value.map(val => Number(val));
        requestData = { inputs: processedValues };
      } else if (isImageClassifier.value) {
        requestData = { img_name: singleValue.value };
      } else if (isTextClassifier.value) {
        requestData = { text: singleValue.value };
      }
    } else {
      requestData = JSON.parse(jsonInput.value);
    }

    // Inject로 받은 함수 사용
    const response = await predictFunction(props.expKey, requestData);
    result.value = response.result || response;
  } catch (e: unknown) {
    const errorObj = e as Error;
    error.value = errorObj.message || 'Prediction failed';
    result.value = null;
  } finally {
    isLoading.value = false;
  }
};

// Watch props changes
watch(() => props.inputs, (newInputs) => {
  initializeForm();
}, { immediate: true });

watch(() => props.modelType, (newModelType) => {
  initializeForm();
}, { immediate: true });

// 초기화
onMounted((): void => {
  initializeForm();
});
</script>