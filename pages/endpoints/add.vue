<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <form @submit.prevent="saveEndpoint">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 좌측: 기본 정보 -->
        <div class="space-y-6">
          <UCard>
            <template #header>
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                기본 정보
              </h3>
            </template>

            <div class="space-y-4">
              <UFormGroup label="Inference Service Name" name="inference_service_name" required>
                <UInput
                  v-model="formData.inference_service_name"
                  placeholder="추론 서비스 이름을 입력하세요"
                  variant="outline"
                  :disabled="loading"
                  required
                />
              </UFormGroup>

              <UFormGroup label="모델 서빙 방식" name="serving_type" required>
                <USelectMenu
                  v-model="formData.serving_type"
                  :options="servingTypeOptions"
                  option-attribute="label"
                  value-attribute="value"
                  size="md"
                  :disabled="loading"
                  required
                />
              </UFormGroup>
            </div>
          </UCard>
        </div>

        <!-- 우측: 서빙 방식별 설정 -->
        <div class="space-y-6">
          <!-- Standard 모드 설정 -->
          <UCard v-if="formData.serving_type === 'standard'" key="standard-config">
            <template #header>
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Standard 설정
              </h3>
            </template>

            <div class="space-y-4">
              <UFormGroup label="Storage URI" name="storage_uri" required>
                <UInput
                  v-model="formData.storage_uri"
                  placeholder="모델 저장 경로를 입력하세요 (예: s3://bucket/path/to/model)"
                  variant="outline"
                  :disabled="loading"
                  required
                />
              </UFormGroup>

              <UFormGroup label="모델 포맷" name="model_format" required>
                <USelectMenu
                  v-model="formData.model_format"
                  :options="standardModelFormatOptions"
                  option-attribute="label"
                  value-attribute="value"
                  size="md"
                  :disabled="loading"
                  required
                />
              </UFormGroup>

              <UFormGroup label="프로토콜 버전" name="protocol_version" required>
                <USelectMenu
                  v-model="formData.protocol_version"
                  :options="protocolVersionOptions"
                  option-attribute="label"
                  value-attribute="value"
                  size="md"
                  :disabled="loading"
                  required
                />
              </UFormGroup>
            </div>
          </UCard>

          <!-- vLLM 모드 설정 -->
          <UCard v-if="formData.serving_type === 'vllm'" key="vllm-config">
            <template #header>
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                vLLM 설정
              </h3>
            </template>

            <div class="space-y-6">
              <!-- 기본 설정 -->
              <div class="space-y-4">
                <UFormGroup label="vLLM Version" name="vllm_image_tag" required>
                  <UInput
                    v-model="formData.vllm_image_tag"
                    placeholder="예: latest, v0.2.7"
                    variant="outline"
                    :disabled="loading"
                    required
                  />
                  <template #help>
                    <span class="text-sm text-gray-500">vllm/vllm-openai:버전 형태로 사용됩니다</span>
                  </template>
                </UFormGroup>

                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="CPU" name="vllm_cpu">
                    <UInput
                      v-model="formData.vllm_cpu"
                      placeholder="예: 4 (비워두면 할당 안함)"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>

                  <UFormGroup label="Memory" name="vllm_memory">
                    <UInput
                      v-model="formData.vllm_memory"
                      placeholder="예: 50Gi (비워두면 할당 안함)"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="GPU 리소스" name="vllm_gpu">
                    <USelectMenu
                      v-model="formData.vllm_gpu"
                      :options="gpuResourceOptions"
                      option-attribute="label"
                      value-attribute="value"
                      size="md"
                      :disabled="loading"
                    />
                  </UFormGroup>

                  <UFormGroup label="GPU 개수" name="vllm_gpu_count">
                    <UInput
                      v-model="formData.vllm_gpu_count"
                      placeholder="예: 1 (비워두면 GPU 할당 안함)"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>
                </div>

                <UFormGroup
                  v-if="formData.vllm_gpu && formData.vllm_gpu.includes('mig')"
                  label="Target Node (Toleration)"
                  name="vllm_target_node"
                >
                  <UInput
                    v-model="formData.vllm_target_node"
                    placeholder="MIG 사용 시 자동 설정됨"
                    variant="outline"
                    :disabled="true"
                  />
                </UFormGroup>
              </div>

              <!-- 베이스 모델 설정 -->
              <div class="border-t pt-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">베이스 모델</h4>
                <div class="space-y-4">
                  <UFormGroup label="베이스 모델 이름" name="base_model_name" required>
                    <UInput
                      v-model="formData.base_model.name"
                      placeholder="예: base_model"
                      variant="outline"
                      :disabled="loading"
                      required
                    />
                  </UFormGroup>

                  <UFormGroup label="베이스 모델 Storage URI" name="base_model_uri" required>
                    <UInput
                      v-model="formData.base_model.storage_uri"
                      placeholder="예: s3://bucket/path/to/base_model"
                      variant="outline"
                      :disabled="loading"
                      required
                    />
                  </UFormGroup>

                </div>
              </div>

              <!-- 어댑터 모델들 -->
              <div class="border-t pt-4">
                <div class="flex items-center justify-between mb-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white">어댑터 모델들</h4>
                  <UButton
                    @click="addAdapter"
                    icon="i-heroicons-plus"
                    size="sm"
                    variant="outline"
                    :disabled="loading"
                  >
                    어댑터 추가
                  </UButton>
                </div>

                <div v-if="formData.adapters.length === 0" class="text-sm text-gray-500 text-center py-4">
                  어댑터 모델이 없습니다. 위 버튼을 클릭하여 추가하세요.
                </div>

                <div v-for="(adapter, index) in formData.adapters" :key="index" class="border rounded-lg p-4 space-y-4 mb-4">
                  <div class="flex items-center justify-between">
                    <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">어댑터 {{ index + 1 }}</h5>
                    <UButton
                      @click="removeAdapter(index)"
                      icon="i-heroicons-trash"
                      size="sm"
                      variant="ghost"
                      color="red"
                      :disabled="loading"
                    />
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <UFormGroup :label="`어댑터 ${index + 1} 이름`" required>
                      <UInput
                        v-model="adapter.name"
                        placeholder="예: lora_model"
                        variant="outline"
                        :disabled="loading"
                        required
                      />
                    </UFormGroup>

                  </div>

                  <UFormGroup :label="`어댑터 ${index + 1} Storage URI`" required>
                    <UInput
                      v-model="adapter.storage_uri"
                      placeholder="예: s3://bucket/path/to/adapter_model"
                      variant="outline"
                      :disabled="loading"
                      required
                    />
                  </UFormGroup>
                </div>
              </div>

              <!-- 추가 vLLM 옵션 -->
              <div class="border-t pt-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">추가 옵션</h4>
                <div class="space-y-4">
                  <UFormGroup label="Chat Template 경로" name="chat_template">
                    <UInput
                      v-model="formData.vllm_chat_template"
                      placeholder="예: ./examples/tool_chat_template_llama3.2_json.jinja (선택사항)"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>


                  <UFormGroup label="Max Batched Tokens" name="max_batched_tokens">
                    <UInput
                      v-model="formData.vllm_max_batched_tokens"
                      placeholder="예: 1024"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Model Mesh 모드 설정 -->
          <UCard v-if="formData.serving_type === 'modelmesh'" key="modelmesh-config">
            <template #header>
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Model Mesh 설정
              </h3>
            </template>

            <div class="space-y-4">
              <UFormGroup label="Storage URI" name="modelmesh_storage_uri" required>
                <UInput
                  v-model="formData.modelmesh_storage_uri"
                  placeholder="모델 저장 경로를 입력하세요 (예: s3://bucket/path/to/model)"
                  variant="outline"
                  :disabled="loading"
                  required
                />
              </UFormGroup>

              <UFormGroup label="모델 포맷" name="modelmesh_model_format" required>
                <USelectMenu
                  v-model="formData.modelmesh_model_format"
                  :options="modelmeshModelFormatOptions"
                  option-attribute="label"
                  value-attribute="value"
                  size="md"
                  :disabled="loading"
                  required
                />
              </UFormGroup>
            </div>
          </UCard>
        </div>
      </div>

      <!-- 버튼 영역 -->
      <div class="flex justify-end gap-3 mt-6">
        <UButton
          variant="outline"
          @click="cancelForm"
          :disabled="loading"
        >
          취소
        </UButton>
        <UButton
          type="submit"
          :loading="loading"
          :disabled="!isFormValid"
        >
          생성
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Endpoints',
    to: '/endpoints/'
  },
  {
    label: 'Add',
  },
])

const pageTitle = ref('새 Inference Service 추가')
const loading = ref(false)

// 폼 데이터 초기값
const formData = ref({
  // 기본 정보
  inference_service_name: '',
  serving_type: 'standard',

  // Standard 설정
  storage_uri: '',
  model_format: 'mlflow',
  protocol_version: 'v2',

  // vLLM 설정
  vllm_image_tag: 'latest',
  vllm_cpu: '4',
  vllm_memory: '50Gi',
  vllm_gpu: 'nvidia.com/gpu',
  vllm_gpu_count: '1',
  vllm_target_node: '',
  vllm_chat_template: '',
  vllm_max_batched_tokens: '1024',

  // vLLM 베이스 모델
  base_model: {
    name: 'base_model',
    storage_uri: ''
  },

  // vLLM 어댑터들
  adapters: [],

  // Model Mesh 설정
  modelmesh_storage_uri: '',
  modelmesh_model_format: 'sklearn'
})

// 서빙 방식 옵션
const servingTypeOptions = ref([
  { label: 'Standard', value: 'standard' },
  { label: 'vLLM', value: 'vllm' },
  { label: 'Model Mesh', value: 'modelmesh' }
])

// Standard 모델 포맷 옵션
const standardModelFormatOptions = ref([
  { label: 'MLflow', value: 'mlflow' },
  { label: 'Scikit-learn', value: 'sklearn' },
  { label: 'XGBoost', value: 'xgboost' },
  { label: 'LightGBM', value: 'lightgbm' },
  { label: 'OpenVINO IR', value: 'openvino_ir' },
  { label: 'ONNX', value: 'onnx' },
  { label: 'TensorFlow', value: 'tensorflow' },
  { label: 'PyTorch', value: 'pytorch' },
  { label: 'TensorRT', value: 'tensorrt' }
])

// Model Mesh 모델 포맷 옵션 (mlflow 제외)
const modelmeshModelFormatOptions = ref([
  { label: 'Scikit-learn', value: 'sklearn' },
  { label: 'XGBoost', value: 'xgboost' },
  { label: 'LightGBM', value: 'lightgbm' },
  { label: 'OpenVINO IR', value: 'openvino_ir' },
  { label: 'ONNX', value: 'onnx' },
  { label: 'TensorFlow', value: 'tensorflow' },
  { label: 'PyTorch', value: 'pytorch' },
  { label: 'TensorRT', value: 'tensorrt' }
])

// 프로토콜 버전 옵션 (mlflow일 때는 v2만 선택 가능)
const protocolVersionOptions = computed(() => {
  if (formData.value.model_format === 'mlflow') {
    return [{ label: 'v2', value: 'v2' }]
  }
  return [
    { label: 'v1', value: 'v1' },
    { label: 'v2', value: 'v2' }
  ]
})

// GPU 리소스 옵션
const gpuResourceOptions = ref([
  { label: '기본 GPU (nvidia.com/gpu)', value: 'nvidia.com/gpu' },
  { label: 'MIG 3g.40gb (nvidia.com/mig-3g.40gb)', value: 'nvidia.com/mig-3g.40gb' }
])

// GPU 리소스 변경시 Target Node 자동 설정
watch(() => formData.value.vllm_gpu, (newGpuResource) => {
  if (newGpuResource && newGpuResource.includes('mig')) {
    formData.value.vllm_target_node = 'wisenut-232'
  } else {
    formData.value.vllm_target_node = ''
  }
})

// 모델 포맷 변경시 프로토콜 버전 자동 조정
watch(() => formData.value.model_format, (newModelFormat) => {
  if (newModelFormat === 'mlflow') {
    formData.value.protocol_version = 'v2'
  }
})

// 어댑터 추가 함수
const addAdapter = () => {
  formData.value.adapters.push({
    name: '',
    storage_uri: ''
  })
}

// 어댑터 제거 함수
const removeAdapter = (index: number) => {
  formData.value.adapters.splice(index, 1)
}

// 폼 유효성 검사
const isFormValid = computed(() => {
  const baseValid = formData.value.inference_service_name && formData.value.serving_type

  if (formData.value.serving_type === 'standard') {
    return baseValid &&
           formData.value.storage_uri &&
           formData.value.model_format &&
           formData.value.protocol_version
  } else if (formData.value.serving_type === 'vllm') {
    const vllmBaseValid = baseValid &&
                         formData.value.vllm_image_tag &&
                         formData.value.base_model.name &&
                         formData.value.base_model.storage_uri

    // 어댑터가 있다면 모든 어댑터의 필수 필드가 채워져 있어야 함
    const adaptersValid = formData.value.adapters.length === 0 ||
                         formData.value.adapters.every(adapter =>
                           adapter.name && adapter.storage_uri
                         )

    return vllmBaseValid && adaptersValid
  } else if (formData.value.serving_type === 'modelmesh') {
    return baseValid &&
           formData.value.modelmesh_storage_uri &&
           formData.value.modelmesh_model_format
  }

  return false
})

// 엔드포인트 저장 함수
const saveEndpoint = async () => {
  if (!isFormValid.value) {
    alert('필수 필드를 모두 입력해주세요.')
    return
  }

  loading.value = true

  try {
    let inferenceServiceInfo: any = {}
    let namespace = ''

    if (formData.value.serving_type === 'standard') {
      namespace = 'kubeflow-user-example-com'
      inferenceServiceInfo = {
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: {
          name: formData.value.inference_service_name,
          namespace: namespace,
          annotations: {
            'sidecar.istio.io/inject': 'false'
          }
        },
        spec: {
          predictor: {
            serviceAccountName: 'storage-system-minio-sa',
            model: {
              resources: {
                limits: {
                  'nvidia.com/gpu': '1'
                }
              },
              modelFormat: {
                name: formData.value.model_format
              },
              protocolVersion: formData.value.protocol_version,
              storageUri: formData.value.storage_uri
            }
          }
        }
      }
    } else if (formData.value.serving_type === 'vllm') {
      namespace = 'kubeflow-user-example-com'

      // vLLM 컨테이너 설정 구성
      const resources: any = {
        requests: {},
        limits: {}
      }

      if (formData.value.vllm_cpu && formData.value.vllm_cpu.trim()) {
        resources.requests.cpu = formData.value.vllm_cpu
        resources.limits.cpu = formData.value.vllm_cpu
      }

      if (formData.value.vllm_memory && formData.value.vllm_memory.trim()) {
        resources.requests.memory = formData.value.vllm_memory
        resources.limits.memory = formData.value.vllm_memory
      }

      if (formData.value.vllm_gpu && formData.value.vllm_gpu_count && formData.value.vllm_gpu_count.trim()) {
        resources.requests[formData.value.vllm_gpu] = formData.value.vllm_gpu_count
        resources.limits[formData.value.vllm_gpu] = formData.value.vllm_gpu_count
      }

      // vLLM 명령어 구성
      let vllmCommand = `vllm serve /mnt/models/${formData.value.base_model.name} \\
          --port 8080 \\
          --served-model-name ${formData.value.base_model.name} \\
          --trust-remote-code \\
          --enable-chunked-prefill \\
          --enable-lora`

      // 어댑터가 있는 경우 lora-modules 추가
      if (formData.value.adapters.length > 0) {
        const loraModules = formData.value.adapters
          .map(adapter => `${adapter.name}=/mnt/models/${adapter.name}`)
          .join(',')
        vllmCommand += ` \\
          --lora-modules ${loraModules}`
      }


      if (formData.value.vllm_max_batched_tokens) {
        vllmCommand += ` \\
          --max_num_batched_tokens ${formData.value.vllm_max_batched_tokens}`
      }

      if (formData.value.vllm_chat_template) {
        vllmCommand += ` \\
          --chat-template ${formData.value.vllm_chat_template}`
      }

      // STORAGE_URI 환경변수 구성
      let storageUriParts = [`${formData.value.base_model.name}=${formData.value.base_model.storage_uri}`]

      formData.value.adapters.forEach(adapter => {
        storageUriParts.push(`${adapter.name}=${adapter.storage_uri}`)
      })

      const storageUriValue = storageUriParts.join(',')

      const containers = [{
        name: 'kserve-container',
        image: `vllm/vllm-openai:${formData.value.vllm_image_tag}`,
        command: ['/bin/sh', '-c'],
        args: [vllmCommand],
        env: [
          {
            name: 'STORAGE_URI',
            value: storageUriValue
          }
        ],
        ports: [
          {
            containerPort: 8080
          }
        ],
        resources,
        livenessProbe: {
          httpGet: {
            path: '/health',
            port: 8080
          },
          initialDelaySeconds: 60,
          periodSeconds: 10
        },
        readinessProbe: {
          httpGet: {
            path: '/health',
            port: 8080
          },
          initialDelaySeconds: 60,
          periodSeconds: 5
        }
      }]

      const tolerations = formData.value.vllm_target_node ? [{
        key: 'kubernetes.io/hostname',
        operator: 'Equal',
        value: formData.value.vllm_target_node,
        effect: 'NoSchedule'
      }] : []

      inferenceServiceInfo = {
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: {
          name: formData.value.inference_service_name,
          namespace: namespace,
          annotations: {
            'sidecar.istio.io/inject': 'false'
          }
        },
        spec: {
          predictor: {
            serviceAccountName: 'storage-system-minio-sa',
            imagePullSecrets: [
              {
                name: 'component-image-pull-secret'
              }
            ],
            containers,
            ...(tolerations.length > 0 && { tolerations })
          }
        }
      }
    } else if (formData.value.serving_type === 'modelmesh') {
      namespace = 'modelmesh-serving'
      inferenceServiceInfo = {
        apiVersion: 'serving.kserve.io/v1beta1',
        kind: 'InferenceService',
        metadata: {
          name: formData.value.inference_service_name,
          annotations: {
            'serving.kserve.io/deploymentMode': 'ModelMesh',
            'serving.kserve.io/secretKey': 'localMinIO'
          }
        },
        spec: {
          predictor: {
            model: {
              modelFormat: {
                name: formData.value.modelmesh_model_format
              },
              storageUri: formData.value.modelmesh_storage_uri
            }
          }
        }
      }
    }

    const response = await createEndpoint(
      namespace,
      formData.value.inference_service_name,
      inferenceServiceInfo
    )

    if (String(response.code).endsWith('200')) {
      alert('Inference Service가 성공적으로 생성되었습니다.')
      navigateTo('/endpoints', {
        replace: true,
        redirectCode: 301,
      })
    } else {
      alert(`오류[${response.code}]: ${response.message}`)
    }
  } catch (error) {
    console.error('Endpoint creation error:', error)
    alert('Inference Service 생성 중 오류가 발생했습니다: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 취소 함수
const cancelForm = () => {
  navigateTo('/endpoints')
}

const toolbarLinks = ref([
  [],
  []
])
</script>