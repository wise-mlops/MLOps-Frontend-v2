<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div class="grid grid-cols-5 gap-6">
      <!-- 좌측: 재배포 설정 폼 (40%) -->
      <div class="col-span-2 space-y-6">
        <!-- 기본 정보 (읽기 전용) -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              기본 정보
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup label="Inference Service Name">
              <UInput v-model="serviceNameInput" disabled />
            </UFormGroup>

            <UFormGroup label="서빙 방식">
              <UBadge :label="servingType" :color="getServingTypeBadgeColor(servingType)" />
            </UFormGroup>

            <UFormGroup label="현재 상태">
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ currentStatus }}</span>
            </UFormGroup>
          </div>
        </UCard>


        <!-- 재배포 전략 선택 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              재배포 전략
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup label="배포 전략" name="strategy" required>
              <URadioGroup
                v-model="formData.strategy"
                :options="availableStrategies"
                :disabled="loading"
              />
            </UFormGroup>

            <!-- 전략별 설정 -->
            <div v-if="formData.strategy" class="border-t pt-4">
              <!-- vLLM Blue-Green 설정 -->
              <div v-if="formData.strategy === 'blue-green' && servingType === 'vLLM'" class="space-y-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">vLLM 설정</h4>

                <UFormGroup label="vLLM Version" required>
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
                  <UFormGroup label="CPU">
                    <UInput
                      v-model="formData.vllm_cpu"
                      placeholder="예: 4 (비워두면 할당 안함)"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>

                  <UFormGroup label="Memory">
                    <UInput
                      v-model="formData.vllm_memory"
                      placeholder="예: 50Gi (비워두면 할당 안함)"
                      variant="outline"
                      :disabled="loading"
                    />
                  </UFormGroup>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="GPU 리소스">
                    <USelectMenu
                      v-model="formData.vllm_gpu"
                      :options="gpuResourceOptions"
                      option-attribute="label"
                      value-attribute="value"
                      size="md"
                      :disabled="loading"
                    />
                  </UFormGroup>

                  <UFormGroup label="GPU 개수">
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
                >
                  <UInput
                    v-model="formData.vllm_target_node"
                    placeholder="MIG 사용 시 자동 설정됨"
                    variant="outline"
                    :disabled="true"
                  />
                </UFormGroup>

                <!-- 베이스 모델 설정 -->
                <div class="border-t pt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">베이스 모델</h4>
                  <div class="space-y-4">
                    <UFormGroup label="베이스 모델 이름" required>
                      <UInput
                        v-model="formData.base_model.name"
                        placeholder="예: base_model"
                        variant="outline"
                        :disabled="loading"
                        required
                      />
                    </UFormGroup>

                    <UFormGroup label="베이스 모델 Storage URI" required>
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
                </div>

                <!-- 추가 vLLM 옵션 -->
                <div class="border-t pt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">추가 옵션</h4>
                  <div class="space-y-4">
                    <UFormGroup label="Chat Template 경로">
                      <UInput
                        v-model="formData.vllm_chat_template"
                        placeholder="예: ./examples/tool_chat_template_llama3.2_json.jinja (선택사항)"
                        variant="outline"
                        :disabled="loading"
                      />
                    </UFormGroup>

                    <UFormGroup label="Max Batched Tokens">
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

              <!-- LoRA Adapter 설정 -->
              <div v-if="formData.strategy === 'lora-adapter'" class="space-y-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">기존 vLLM 설정 (수정 불가)</h4>

                <UFormGroup label="vLLM Version">
                  <UInput
                    v-model="formData.vllm_image_tag"
                    disabled
                    variant="outline"
                  />
                </UFormGroup>

                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="CPU">
                    <UInput
                      v-model="formData.vllm_cpu"
                      disabled
                      variant="outline"
                    />
                  </UFormGroup>

                  <UFormGroup label="Memory">
                    <UInput
                      v-model="formData.vllm_memory"
                      disabled
                      variant="outline"
                    />
                  </UFormGroup>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <UFormGroup label="GPU 리소스">
                    <USelectMenu
                      v-model="formData.vllm_gpu"
                      :options="gpuResourceOptions"
                      option-attribute="label"
                      value-attribute="value"
                      size="md"
                      disabled
                    />
                  </UFormGroup>

                  <UFormGroup label="GPU 개수">
                    <UInput
                      v-model="formData.vllm_gpu_count"
                      disabled
                      variant="outline"
                    />
                  </UFormGroup>
                </div>

                <UFormGroup
                  v-if="formData.vllm_gpu && formData.vllm_gpu.includes('mig')"
                  label="Target Node (Toleration)"
                >
                  <UInput
                    v-model="formData.vllm_target_node"
                    disabled
                    variant="outline"
                  />
                </UFormGroup>

                <!-- 베이스 모델 설정 (고정) -->
                <div class="border-t pt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">베이스 모델 (고정)</h4>
                  <div class="space-y-4">
                    <UFormGroup label="베이스 모델 이름">
                      <UInput
                        v-model="formData.base_model.name"
                        disabled
                        variant="outline"
                      />
                    </UFormGroup>

                    <UFormGroup label="베이스 모델 Storage URI">
                      <UInput
                        v-model="formData.base_model.storage_uri"
                        disabled
                        variant="outline"
                      />
                    </UFormGroup>
                  </div>
                </div>

                <!-- 기존 어댑터들 (고정) -->
                <div v-if="currentSettings.adapters && currentSettings.adapters.length > 0" class="border-t pt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">기존 어댑터들 (고정)</h4>
                  <div v-for="(adapter, index) in currentSettings.adapters" :key="`existing-adapter-${index}`" class="border rounded-lg p-4 space-y-4 mb-4 bg-gray-50 dark:bg-gray-800">
                    <div class="grid grid-cols-2 gap-4">
                      <UFormGroup :label="`어댑터 ${index + 1} 이름`">
                        <UInput
                          :model-value="adapter.name"
                          disabled
                          variant="outline"
                        />
                      </UFormGroup>

                      <UFormGroup :label="`어댑터 ${index + 1} Storage URI`">
                        <UInput
                          :model-value="adapter.storage_uri"
                          disabled
                          variant="outline"
                        />
                      </UFormGroup>
                    </div>
                  </div>
                </div>

                <!-- 새 어댑터 추가 -->
                <div class="border-t pt-4">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">새 LoRA Adapter 추가</h4>
                  <div class="space-y-4">
                    <UFormGroup label="새 LoRA Adapter 이름" required>
                      <UInput
                        v-model="formData.loraName"
                        placeholder="예: new-adapter"
                        variant="outline"
                        :disabled="loading"
                        required
                      />
                    </UFormGroup>

                    <UFormGroup label="새 LoRA Adapter Storage URI" required>
                      <UInput
                        v-model="formData.loraPath"
                        placeholder="예: s3://bucket/path/to/adapter"
                        variant="outline"
                        :disabled="loading"
                        required
                      />
                    </UFormGroup>
                  </div>
                </div>
              </div>

              <!-- Canary 설정 -->
              <div v-if="formData.strategy === 'canary'" class="space-y-4">
                <UFormGroup label="트래픽 비율 (%)">
                  <URange
                    v-model="formData.trafficPercent"
                    :min="1"
                    :max="99"
                    :disabled="loading"
                  />
                  <div class="text-sm text-gray-500 mt-1">{{ formData.trafficPercent }}%</div>
                </UFormGroup>
              </div>

              <!-- Storage URI (LoRA 및 vLLM Blue-Green 제외한 모든 전략) -->
              <div v-if="formData.strategy !== 'lora-adapter' && !(formData.strategy === 'blue-green' && servingType === 'vLLM')" class="space-y-4">
                <UFormGroup label="Storage URI" required>
                  <UInput
                    v-model="formData.storageUri"
                    placeholder="예: s3://bucket/path/to/model"
                    variant="outline"
                    :disabled="loading"
                    required
                  />
                </UFormGroup>
              </div>

              <!-- ModelMesh 추가 설정 -->
              <div v-if="formData.strategy === 'modelmesh'" class="space-y-4">
                <UFormGroup label="모델 포맷">
                  <USelectMenu
                    v-model="formData.modelFormat"
                    :options="modelFormatOptions"
                    option-attribute="label"
                    value-attribute="value"
                    :disabled="loading"
                  />
                </UFormGroup>
              </div>
            </div>

            <!-- 재배포 실행 버튼 -->
            <div class="flex justify-end gap-3 pt-4">
              <UButton
                variant="outline"
                @click="cancelRedeploy"
                :disabled="loading"
              >
                취소
              </UButton>
              <UButton
                @click="startRedeploy"
                :loading="loading"
                :disabled="!isFormValid"
              >
                재배포 시작
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <!-- 우측: 실시간 모니터링 (60%) -->
      <div class="col-span-3 space-y-6">
        <!-- 진행 상황 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              재배포 진행 상황
            </h3>
          </template>

          <div class="space-y-4">
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <UProgress :value="deploymentProgress" :max="100" />
              </div>
              <span class="text-sm font-medium">{{ deploymentProgress }}%</span>
            </div>

            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600 dark:text-gray-400">{{ deploymentStatus }}</span>
              <div v-if="deploymentStarted" class="flex items-center space-x-4">
                <div class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-signal" class="w-4 h-4 text-blue-500" />
                  <span class="text-gray-600">성공률:</span>
                  <span class="font-medium" :class="getSuccessRateColor()">{{ successRate }}%</span>
                </div>
                <div v-if="metrics" class="flex items-center space-x-1">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4 text-green-500" />
                  <span class="text-gray-600">응답시간:</span>
                  <span class="font-medium">{{ metrics.averageResponseTime || 0 }}ms</span>
                </div>
              </div>
            </div>

            <!-- 배포 단계 표시 -->
            <div v-if="deploymentStarted" class="mt-4">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>배포 단계</span>
                <span>{{ Math.round((Object.values(validationProgress).filter(Boolean).length / getValidationCriteria.criteria.length) * 100) }}% 완료</span>
              </div>
              <div class="flex space-x-1">
                <div
                  v-for="(criterion, index) in getValidationCriteria.criteria"
                  :key="criterion.name"
                  class="flex-1 h-2 rounded-full"
                  :class="validationProgress[criterion.name] ? 'bg-green-500' : index < Object.values(validationProgress).filter(Boolean).length + 1 ? 'bg-blue-500' : 'bg-gray-200'"
                ></div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- 실시간 로그 -->
        <UCard>
          <template #header>
            <UTabs v-model="activeTab" :items="logTabs" />
          </template>

          <div class="h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <!-- 배포 로그 -->
            <div v-if="activeTab === 0" class="space-y-2">
              <div
                v-for="(log, index) in deploymentLogs"
                :key="index"
                class="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <UIcon
                  :name="log.level === 'error' ? 'i-heroicons-exclamation-triangle' :
                        log.level === 'warning' ? 'i-heroicons-exclamation-circle' :
                        log.level === 'success' ? 'i-heroicons-check-circle' : 'i-heroicons-information-circle'"
                  :class="getLogLevelClass(log.level)"
                  class="w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-500 font-mono">{{ formatTime(log.timestamp) }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full uppercase" :class="
                      log.level === 'error' ? 'bg-red-100 text-red-800' :
                      log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      log.level === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    ">
                      {{ log.level }}
                    </span>
                  </div>
                  <div class="text-sm mt-1" :class="getLogLevelClass(log.level)">{{ log.message }}</div>
                </div>
              </div>
              <div v-if="deploymentLogs.length === 0" class="text-gray-500 text-center py-8">
                재배포 시작을 기다리는 중...
              </div>
            </div>

            <!-- 추론 검증 로그 -->
            <div v-if="activeTab === 1" class="space-y-2">
              <div
                v-for="(log, index) in inferenceLogs"
                :key="index"
                class="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <UIcon
                  :name="log.level === 'error' ? 'i-heroicons-exclamation-triangle' :
                        log.level === 'warning' ? 'i-heroicons-exclamation-circle' :
                        log.level === 'success' ? 'i-heroicons-check-circle' : 'i-heroicons-information-circle'"
                  :class="getLogLevelClass(log.level)"
                  class="w-4 h-4 mt-0.5 flex-shrink-0"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-500 font-mono">{{ formatTime(log.timestamp) }}</span>
                    <UIcon name="i-heroicons-cpu-chip" class="w-3 h-3 text-purple-500" />
                    <span class="text-xs text-purple-600 font-medium">INFERENCE</span>
                  </div>
                  <div class="text-sm mt-1" :class="getLogLevelClass(log.level)">{{ log.message }}</div>
                </div>
              </div>
              <div v-if="inferenceLogs.length === 0" class="text-gray-500 text-center py-8">
                추론 검증 로그가 표시됩니다...
              </div>
            </div>

            <!-- Pod 로그 -->
            <div v-if="activeTab === 2" class="space-y-2">
              <div
                v-for="(log, index) in podLogs"
                :key="index"
                class="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <UIcon
                  name="i-heroicons-cube"
                  class="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <span class="text-xs text-gray-500 font-mono">{{ formatTime(log.timestamp) }}</span>
                    <div class="flex items-center space-x-1">
                      <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">{{ log.podType }}</span>
                      <span class="text-xs text-blue-600 font-medium">{{ log.podName }}</span>
                    </div>
                  </div>
                  <div class="text-sm mt-1 text-gray-700 dark:text-gray-300">{{ log.message }}</div>
                </div>
              </div>
              <div v-if="podLogs.length === 0" class="text-gray-500 text-center py-8">
                Pod 로그가 표시됩니다...
              </div>
            </div>

            <!-- 메트릭 -->
            <div v-if="activeTab === 3" class="space-y-4">
              <!-- 성능 메트릭 -->
              <div v-if="metrics" class="grid grid-cols-2 gap-4">
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">총 요청</div>
                  <div class="text-2xl font-bold">{{ metrics.totalRequests }}</div>
                </div>
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">성공 요청</div>
                  <div class="text-2xl font-bold text-green-600">{{ metrics.successfulRequests }}</div>
                </div>
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">평균 응답시간</div>
                  <div class="text-2xl font-bold">{{ metrics.averageResponseTime || 0 }}ms</div>
                </div>
                <div class="bg-white dark:bg-gray-700 p-4 rounded">
                  <div class="text-sm text-gray-500">성공률</div>
                  <div class="text-2xl font-bold" :class="getSuccessRateColor()">{{ successRate }}%</div>
                </div>
              </div>

              <!-- 검증 기준 -->
              <div class="border-t pt-4">
                <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">{{ getValidationCriteria.title }}</h4>
                <div class="space-y-2">
                  <div
                    v-for="criterion in getValidationCriteria.criteria"
                    :key="criterion.name"
                    class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div>
                      <div class="font-medium text-sm">{{ criterion.name }}</div>
                      <div class="text-xs text-gray-500">{{ criterion.condition }}</div>
                    </div>
                    <div class="flex items-center">
                      <UIcon
                        :name="validationProgress[criterion.name] ? 'i-heroicons-check-circle' : 'i-heroicons-clock'"
                        :class="validationProgress[criterion.name] ? 'text-green-500' : 'text-gray-400'"
                        class="w-5 h-5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="!metrics" class="text-gray-500 text-center py-8">
                메트릭 데이터를 수집하는 중...
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const serviceName = route.params.name as string
const serviceNameInput = ref(serviceName)

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
    label: 'Redeploy',
  },
])

const pageTitle = ref(`재배포: ${serviceName}`)
const loading = ref(false)
const deploymentStarted = ref(false)

// 현재 서비스 정보
const servingType = ref('Standard')
const currentStatus = ref('단일 라우팅')

// 현재 설정 정보
const currentSettings = ref({
  storageUri: '',
  modelFormat: '',
  protocolVersion: '',
  dockerImage: '',
  baseModelName: '',
  baseModelStorageUri: '',
  vllmImageTag: '',
  adapters: [],
  resources: {
    cpu: '',
    memory: '',
    gpu: ''
  }
})

// 폼 데이터
const formData = ref({
  strategy: '',
  storageUri: '',
  loraName: '',
  loraPath: '',
  trafficPercent: 20,
  modelFormat: 'sklearn',

  // vLLM Blue-Green 설정
  vllm_image_tag: 'latest',
  vllm_cpu: '',
  vllm_memory: '',
  vllm_gpu: 'nvidia.com/gpu',
  vllm_gpu_count: '',
  vllm_target_node: '',
  vllm_chat_template: '',
  vllm_max_batched_tokens: '',

  // vLLM 베이스 모델
  base_model: {
    name: 'base_model',
    storage_uri: ''
  },

  // vLLM 어댑터들
  adapters: []
})

// 서빙 방식별 사용 가능한 전략
const availableStrategies = computed(() => {
  switch (servingType.value) {
    case 'vLLM':
      return [
        { label: 'LoRA Adapter (권장)', value: 'lora-adapter' },
        { label: 'Blue-Green', value: 'blue-green' }
      ]
    case 'ModelMesh':
      return [
        { label: 'ModelMesh', value: 'modelmesh' }
      ]
    default: // Standard
      return [
        { label: 'Blue-Green', value: 'blue-green' },
        { label: 'Canary', value: 'canary' }
      ]
  }
})

// 서빙 방식별 기본 전략 설정
watch(servingType, (newServingType) => {
  const strategies = availableStrategies.value
  if (strategies.length > 0) {
    // vLLM은 항상 LoRA Adapter가 기본값
    if (newServingType === 'vLLM') {
      formData.value.strategy = 'lora-adapter'
    } else {
      formData.value.strategy = strategies[0].value
    }
  }
}, { immediate: true })

const modelFormatOptions = ref([
  { label: 'Scikit-learn', value: 'sklearn' },
  { label: 'XGBoost', value: 'xgboost' },
  { label: 'LightGBM', value: 'lightgbm' },
  { label: 'ONNX', value: 'onnx' },
  { label: 'TensorFlow', value: 'tensorflow' },
  { label: 'PyTorch', value: 'pytorch' }
])

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
  if (!formData.value.strategy) return false

  switch (formData.value.strategy) {
    case 'lora-adapter':
      return formData.value.loraName && formData.value.loraPath
    case 'blue-green':
      if (servingType.value === 'vLLM') {
        const vllmValid = formData.value.vllm_image_tag &&
                         formData.value.base_model.name &&
                         formData.value.base_model.storage_uri
        const adaptersValid = formData.value.adapters.length === 0 ||
                             formData.value.adapters.every(adapter =>
                               adapter.name && adapter.storage_uri
                             )
        return vllmValid && adaptersValid
      }
      return formData.value.storageUri
    case 'modelmesh':
      return formData.value.storageUri && formData.value.modelFormat
    default:
      return formData.value.storageUri
  }
})

// WebSocket 연동
const {
  deploymentLogs,
  podLogs,
  inferenceLogs,
  metrics,
  deploymentProgress,
  deploymentStatus,
  connectDeploymentLogs,
  connectPodLogs,
  connectTrafficMetrics,
  simulateInferenceValidation,
  disconnectAll,
  clearLogs
} = useWebSocket()

// 로그 관련
const activeTab = ref(0)
const logTabs = [
  { label: '배포 로그' },
  { label: '추론 검증' },
  { label: 'Pod 로그' },
  { label: '메트릭' }
]

// 유틸리티 함수들
const getServingTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'vLLM': return 'blue'
    case 'ModelMesh': return 'purple'
    default: return 'gray'
  }
}

// 성공률 계산 (메트릭 기반)
const successRate = computed(() => {
  if (!metrics.value) return 100
  if (metrics.value.totalRequests === 0) return 100
  return Math.round((metrics.value.successfulRequests / metrics.value.totalRequests) * 100)
})

const getSuccessRateColor = () => {
  if (successRate.value === 100) return 'text-green-600'
  if (successRate.value >= 95) return 'text-yellow-600'
  return 'text-red-600'
}

const getLogLevelClass = (level: string) => {
  switch (level) {
    case 'error': return 'text-red-600'
    case 'warning': return 'text-yellow-600'
    case 'success': return 'text-green-600'
    default: return 'text-gray-700 dark:text-gray-300'
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 서빙 방식별 특화 검증 로직
const getValidationCriteria = computed(() => {
  const strategy = formData.value.strategy
  const servingTypeValue = servingType.value

  switch (strategy) {
    case 'lora-adapter':
      return {
        title: 'LoRA Adapter 검증',
        criteria: [
          { name: 'Adapter 로딩', condition: 'LoRA 어댑터가 성공적으로 로드됨' },
          { name: '추론 정확성', condition: '기존 베이스 모델과 동일한 추론 결과 출력' },
          { name: '응답 시간', condition: '평균 응답 시간이 기존 대비 150% 이내' },
          { name: '무중단 전환', condition: '추론 서비스 중단 없음 (100% 가용성)' }
        ]
      }
    case 'blue-green':
      if (servingTypeValue === 'vLLM') {
        return {
          title: 'vLLM Blue-Green 검증',
          criteria: [
            { name: 'Green 환경 준비', condition: 'vLLM 새 버전이 정상 기동됨' },
            { name: '모델 로딩', condition: '베이스 모델 및 어댑터 로딩 완료' },
            { name: '추론 검증', condition: '새 환경에서 정상 추론 응답 확인' },
            { name: '트래픽 전환', condition: '100% 트래픽이 Green으로 전환됨' },
            { name: 'Blue 환경 정리', condition: '기존 Blue 환경 안전하게 종료됨' }
          ]
        }
      } else {
        return {
          title: 'Standard Blue-Green 검증',
          criteria: [
            { name: 'Green 환경 준비', condition: '새 모델 서버가 정상 기동됨' },
            { name: '헬스체크', condition: '새 환경 헬스체크 통과' },
            { name: '추론 검증', condition: '새 모델로 정상 추론 수행됨' },
            { name: '트래픽 전환', condition: '모든 트래픽이 새 환경으로 이동됨' }
          ]
        }
      }
    case 'canary':
      return {
        title: 'Canary 배포 검증',
        criteria: [
          { name: 'Canary 환경 준비', condition: '새 버전 Canary 서버 준비 완료' },
          { name: '부분 트래픽 라우팅', condition: `${formData.value.trafficPercent}% 트래픽이 Canary로 분산됨` },
          { name: '성능 모니터링', condition: 'Canary 버전 성능이 기준치 이상 유지됨' },
          { name: '오류율 검증', condition: 'Canary 버전 오류율이 Stable 버전과 동일 수준' },
          { name: '점진적 확장', condition: '트래픽 비율을 100%까지 안전하게 확장됨' }
        ]
      }
    case 'modelmesh':
      return {
        title: 'ModelMesh 모델 교체 검증',
        criteria: [
          { name: '새 모델 등록', condition: 'ModelMesh에 새 모델이 등록됨' },
          { name: '모델 로딩', condition: '새 모델이 메모리에 로드됨' },
          { name: '모델 전환 감지', condition: '추론 요청이 새 모델로 라우팅됨' },
          { name: '이전 모델 정리', condition: '사용되지 않는 이전 모델이 언로드됨' }
        ]
      }
    default:
      return {
        title: '기본 검증',
        criteria: [
          { name: '서비스 가용성', condition: '배포 과정에서 서비스 중단 없음' },
          { name: '추론 정확성', condition: '새 모델이 정상적으로 추론 수행' }
        ]
      }
  }
})

// 검증 진행 상황 (로그 기반으로 추정)
const validationProgress = computed(() => {
  if (!deploymentLogs.value.length) return {}

  const criteria = getValidationCriteria.value.criteria
  const progress: Record<string, boolean> = {}

  criteria.forEach(criterion => {
    const name = criterion.name
    let isCompleted = false

    // 로그 메시지 기반 검증 완료 여부 판단
    for (const log of deploymentLogs.value) {
      const message = log.message.toLowerCase()

      switch (name) {
        case 'Adapter 로딩':
        case '모델 로딩':
          isCompleted = message.includes('load') && message.includes('success') ||
                       message.includes('로드') && message.includes('완료')
          break
        case 'Green 환경 준비':
        case 'Canary 환경 준비':
          isCompleted = message.includes('ready') || message.includes('준비')
          break
        case '트래픽 전환':
          isCompleted = message.includes('traffic') && message.includes('switch') ||
                       message.includes('트래픽') && message.includes('전환')
          break
        case '추론 검증':
          isCompleted = message.includes('inference') && message.includes('success') ||
                       message.includes('추론') && message.includes('성공')
          break
        case '헬스체크':
          isCompleted = message.includes('health') && message.includes('pass') ||
                       message.includes('헬스') && message.includes('통과')
          break
        case '모델 전환 감지':
          isCompleted = message.includes('model') && message.includes('switch') ||
                       message.includes('모델') && message.includes('전환')
          break
      }

      if (isCompleted) break
    }

    progress[name] = isCompleted
  })

  return progress
})

// 액션 함수들
const startRedeploy = async () => {
  if (!isFormValid.value) return

  loading.value = true
  deploymentStarted.value = true

  // 로그 초기화 및 WebSocket 연결
  clearLogs()

  try {
    // 재배포 설정 구성
    let config: any = {}

    switch (formData.value.strategy) {
      case 'lora-adapter':
        config = {
          loraName: formData.value.loraName,
          loraPath: formData.value.loraPath
        }
        break
      case 'canary':
        config = {
          storageUri: formData.value.storageUri,
          trafficPercent: formData.value.trafficPercent
        }
        break
      case 'modelmesh':
        config = {
          modelPath: formData.value.storageUri,
          modelFormat: formData.value.modelFormat
        }
        break
      case 'blue-green':
        if (servingType.value === 'vLLM') {
          // vLLM Blue-Green 설정
          config = {
            vllm_image_tag: formData.value.vllm_image_tag,
            vllm_cpu: formData.value.vllm_cpu,
            vllm_memory: formData.value.vllm_memory,
            vllm_gpu: formData.value.vllm_gpu,
            vllm_gpu_count: formData.value.vllm_gpu_count,
            vllm_target_node: formData.value.vllm_target_node,
            vllm_chat_template: formData.value.vllm_chat_template,
            vllm_max_batched_tokens: formData.value.vllm_max_batched_tokens,
            base_model: formData.value.base_model,
            adapters: formData.value.adapters
          }
        } else {
          // Standard Blue-Green 설정
          config = {
            storageUri: formData.value.storageUri
          }
        }
        break
      default:
        config = {
          storageUri: formData.value.storageUri
        }
    }

    // 네임스페이스 결정
    const namespace = servingType.value === 'ModelMesh' ? 'modelmesh-serving' : 'kubeflow-user-example-com'

    // 재배포 API 호출
    console.log('🚀 재배포 API 호출 시작:', { namespace, serviceName, strategy: formData.value.strategy, config })
    const response = await deployInferenceService(namespace, serviceName, formData.value.strategy, config)
    console.log('📡 재배포 API 응답:', response)

    if (response.code === 130200) {
      console.log('✅ API 성공 - WebSocket 연결 시작:', response.result?.deploymentId)
      // WebSocket 연결 시작
      connectDeploymentLogs(namespace, serviceName, response.result?.deploymentId)
      connectPodLogs(namespace, serviceName, formData.value.strategy)
      connectTrafficMetrics(namespace, serviceName)

      // 추론 검증은 백엔드에서 WebSocket으로 자동 전송됨

      // 타임아웃 처리는 WebSocket composable에서 처리됨

      console.log('재배포 시작 성공:', response)
    } else {
      throw new Error(response.message || '재배포 시작 실패')
    }

  } catch (error) {
    console.error('재배포 시작 실패:', error)
    loading.value = false
  }
}

const cancelRedeploy = () => {
  disconnectAll()
  router.push('/endpoints')
}

// 현재 설정 파싱 함수
const parseCurrentSettings = (endpointDetails: any, detectedServingType: string) => {
  const spec = endpointDetails.result?.spec
  const predictor = spec?.predictor

  if (detectedServingType === 'standard') {
    // Standard 설정 파싱
    currentSettings.value = {
      storageUri: predictor?.model?.storageUri || '',
      modelFormat: predictor?.model?.modelFormat?.name || '',
      protocolVersion: predictor?.model?.protocolVersion || '',
      dockerImage: '',
      baseModelName: '',
      baseModelStorageUri: '',
      vllmImageTag: '',
      adapters: [],
      resources: {}
    }
  } else if (detectedServingType === 'vllm') {
    // vLLM 설정 파싱
    const container = predictor?.containers?.[0]
    const env = container?.env || []
    const resources = container?.resources

    // STORAGE_URI에서 베이스 모델과 어댑터 파싱
    const storageUriEnv = env.find((e: any) => e.name === 'STORAGE_URI')
    const storageUriParts = storageUriEnv?.value?.split(',') || []

    const adapters = []
    let baseModelStorageUri = ''
    let baseModelName = 'base_model'

    // vLLM Args에서 베이스 모델명 추출 (--served-model-name 사용)
    const args = container?.args?.[0] || ''
    const servedModelNameMatch = args.match(/--served-model-name\s+([^\s\\]+)/)
    if (servedModelNameMatch) {
      baseModelName = servedModelNameMatch[1]
    }

    // STORAGE_URI에서 베이스 모델과 어댑터 분리
    if (storageUriParts.length > 0) {
      // 모든 파트를 순회하면서 베이스 모델과 어댑터 구분
      storageUriParts.forEach((part: string, index: number) => {
        const [name, uri] = part.split('=')

        if (uri) {
          // name=uri 형태
          // served-model-name과 일치하는지 확인
          if (name === baseModelName) {
            // served-model-name과 일치하면 베이스 모델
            baseModelStorageUri = uri
          } else if (index === 0 && !baseModelStorageUri) {
            // served-model-name과 일치하는 것이 없고 첫 번째라면 베이스 모델로 간주
            baseModelName = name
            baseModelStorageUri = uri
          } else {
            // 나머지는 어댑터
            adapters.push({ name, storage_uri: uri })
          }
        } else {
          // 단일 URI인 경우 (첫 번째만)
          if (index === 0) {
            baseModelStorageUri = part
          }
        }
      })
    }

    // Docker 이미지에서 태그 추출
    const dockerImage = container?.image || ''
    const imageTagMatch = dockerImage.match(/vllm\/vllm-openai:(.+)/)
    const vllmImageTag = imageTagMatch ? imageTagMatch[1] : 'latest'

    currentSettings.value = {
      storageUri: baseModelStorageUri,
      modelFormat: '',
      protocolVersion: '',
      dockerImage: dockerImage,
      baseModelName,
      baseModelStorageUri,
      adapters,
      vllmImageTag,
      resources: {
        cpu: resources?.requests?.cpu || resources?.limits?.cpu || '',
        memory: resources?.requests?.memory || resources?.limits?.memory || '',
        gpu: Object.keys(resources?.requests || {}).find(key => key.includes('gpu')) ||
             Object.keys(resources?.limits || {}).find(key => key.includes('gpu')) || ''
      }
    }

  } else if (detectedServingType === 'modelmesh') {
    // ModelMesh 설정 파싱
    currentSettings.value = {
      storageUri: predictor?.model?.storageUri || '',
      modelFormat: predictor?.model?.modelFormat?.name || '',
      protocolVersion: '',
      dockerImage: '',
      baseModelName: '',
      baseModelStorageUri: '',
      vllmImageTag: '',
      adapters: [],
      resources: {}
    }
  }

  // 현재 설정을 폼 기본값으로 설정
  if (detectedServingType === 'standard') {
    formData.value.storageUri = currentSettings.value.storageUri
    formData.value.modelFormat = currentSettings.value.modelFormat
  } else if (detectedServingType === 'vllm') {
    // vLLM Blue-Green용 설정
    formData.value.vllm_image_tag = currentSettings.value.vllmImageTag || 'latest'
    formData.value.base_model.name = currentSettings.value.baseModelName
    formData.value.base_model.storage_uri = currentSettings.value.baseModelStorageUri
    formData.value.adapters = [...currentSettings.value.adapters]
    formData.value.vllm_cpu = currentSettings.value.resources.cpu || '4'
    formData.value.vllm_memory = currentSettings.value.resources.memory || '50Gi'
    formData.value.vllm_gpu_count = '1'

    // GPU 리소스 설정
    if (currentSettings.value.resources.gpu) {
      formData.value.vllm_gpu = currentSettings.value.resources.gpu
      // GPU 개수 추출 (예: "2" -> 2)
      const gpuCount = Object.entries(currentSettings.value.resources).find(([key]) => key.includes('gpu'))?.[1]
      if (gpuCount) {
        formData.value.vllm_gpu_count = String(gpuCount)
      }
    }

    // LoRA Adapter용 설정 (새 어댑터 추가용)
    // 기본값은 비워둠 (사용자가 새로 입력)
  } else if (detectedServingType === 'modelmesh') {
    formData.value.storageUri = currentSettings.value.storageUri
    formData.value.modelFormat = currentSettings.value.modelFormat
  }
}

// 현재 서비스 정보 로드
onMounted(async () => {
  try {
    // 네임스페이스 결정 (기본적으로 kubeflow, ModelMesh일 수도 있음)
    let namespace = 'kubeflow-user-example-com'

    // 먼저 kubeflow에서 시도
    let endpointDetails
    try {
      endpointDetails = await getEndpointDetails(namespace, serviceName)
    } catch {
      // kubeflow에서 실패하면 modelmesh에서 시도
      namespace = 'modelmesh-serving'
      endpointDetails = await getEndpointDetails(namespace, serviceName)
    }

    // 서빙 방식 감지
    const detectedServingType = detectServingType(endpointDetails)
    servingType.value = detectedServingType === 'standard' ? 'Standard' :
                       detectedServingType === 'vllm' ? 'vLLM' : 'ModelMesh'

    // 트래픽 상태 확인
    const trafficStatus = getTrafficStatus(endpointDetails)
    currentStatus.value = trafficStatus === 'distributed' ? '트래픽 분산' : '단일 라우팅'

    // 현재 설정 파싱
    parseCurrentSettings(endpointDetails, detectedServingType)

    // 서비스 정보 로드 완료
    // console.log('서비스 정보 로드 완료:', {
    //   name: serviceName,
    //   servingType: servingType.value,
    //   status: currentStatus.value,
    //   settings: currentSettings.value,
    //   adaptersCount: currentSettings.value.adapters?.length || 0
    // })
  } catch (error) {
    console.error('서비스 정보 로드 실패:', error)
    // 기본값 유지
  }
})

const toolbarLinks = ref([
  [],
  []
])
</script>