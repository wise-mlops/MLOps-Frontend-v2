<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <!-- 좌측: 재배포 설정 폼 (30%) -->
      <div class="lg:col-span-3 space-y-6">
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

              <!-- ModelMesh는 추가 설정 없음 (기존 모델 포맷 유지) -->
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

      <!-- 우측: 실시간 모니터링 (70%) -->
      <div class="lg:col-span-7 space-y-6">
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


            <!-- 배포 상태 -->
            <div class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              {{ deploymentStatus }}
            </div>
          </div>
        </UCard>

        <!-- 실시간 로그 -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <UTabs v-model="activeTab" :items="logTabs" />
              <div class="flex items-center space-x-2">
                <UButton
                  @click="downloadTabLogs(activeTab)"
                  variant="outline"
                  size="sm"
                  icon="i-heroicons-arrow-down-tray"
                  :disabled="!deploymentStarted"
                >
                  이 탭 다운로드
                </UButton>
                <UButton
                  @click="downloadReport('json')"
                  variant="outline"
                  size="sm"
                  icon="i-heroicons-document-arrow-down"
                  :disabled="!deploymentStarted"
                >
                  전체 다운로드
                </UButton>
              </div>
            </div>
          </template>

          <div class="min-h-[600px] max-h-[80vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded">
            <!-- 로그 검색/필터 -->
            <div class="mb-4 flex items-center space-x-4">
              <div class="flex-1">
                <UInput
                  v-model="logSearchQuery"
                  placeholder="로그 검색..."
                  icon="i-heroicons-magnifying-glass"
                  size="sm"
                />
              </div>
              <div class="flex items-center space-x-2">
                <UButton
                  @click="logLevelFilter = ''"
                  variant="ghost"
                  size="sm"
                  :class="logLevelFilter === '' ? 'bg-blue-50 text-blue-600' : ''"
                >
                  전체
                </UButton>
                <UButton
                  @click="logLevelFilter = 'error'"
                  variant="ghost"
                  size="sm"
                  :class="logLevelFilter === 'error' ? 'bg-red-50 text-red-600' : ''"
                >
                  오류
                </UButton>
                <UButton
                  @click="logLevelFilter = 'warning'"
                  variant="ghost"
                  size="sm"
                  :class="logLevelFilter === 'warning' ? 'bg-yellow-50 text-yellow-600' : ''"
                >
                  경고
                </UButton>
                <UButton
                  @click="logLevelFilter = 'success'"
                  variant="ghost"
                  size="sm"
                  :class="logLevelFilter === 'success' ? 'bg-green-50 text-green-600' : ''"
                >
                  성공
                </UButton>
              </div>
            </div>

            <!-- 배포 로그 -->
            <div v-if="activeTab === 0" class="font-mono text-sm space-y-1">
              <div
                v-for="(log, index) in filteredDeploymentLogs"
                :key="index"
                class="p-1"
              >
                <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
                <span class="ml-2">{{ log.message }}</span>
              </div>
              <div v-if="filteredDeploymentLogs.length === 0 && deploymentLogs.length > 0" class="text-gray-500 text-center py-8">
                검색 결과가 없습니다.
              </div>
              <div v-else-if="deploymentLogs.length === 0" class="text-gray-500 text-center py-8">
                재배포 시작을 기다리는 중...
              </div>
            </div>

            <!-- 추론 검증 로그 -->
            <div v-if="activeTab === 1" class="font-mono text-sm space-y-1">
              <div
                v-for="(log, index) in filteredInferenceLogs"
                :key="index"
                class="p-1"
              >
                <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
                <span class="ml-2">{{ log.message }}</span>

                <!-- 개별 추론 요청의 metadata가 있으면 표시 -->
                <div v-if="log.metadata && isInferenceRequestLog(log)" class="ml-12 mt-1 text-xs text-gray-600">
                  <div v-if="log.metadata.endpoint">
                    Endpoint: {{ log.metadata.endpoint }}
                  </div>
                  <div v-if="log.metadata.success !== undefined">
                    Status: {{ log.metadata.success ? 'SUCCESS' : 'FAILED' }}
                  </div>
                  <div v-if="log.metadata.response_content">
                    Response: {{ formatJsonResponse(log.metadata.response_content) }}
                  </div>
                  <div v-if="log.metadata.error_content">
                    Error: {{ formatJsonResponse(log.metadata.error_content) }}
                  </div>
                </div>
              </div>
              <div v-if="filteredInferenceLogs.length === 0 && inferenceLogs.length > 0" class="text-gray-500 text-center py-8">
                검색 결과가 없습니다.
              </div>
              <div v-else-if="inferenceLogs.length === 0" class="text-gray-500 text-center py-8">
                추론 검증 로그가 실시간으로 표시됩니다...
              </div>
            </div>

            <!-- Pod 로그 -->
            <div v-if="activeTab === 2" class="font-mono text-sm space-y-1">
              <div
                v-for="(log, index) in filteredPodLogs"
                :key="index"
                class="p-1"
              >
                <span class="text-gray-500">{{ formatTime(log.timestamp) }}</span>
                <span class="ml-2 text-blue-600">[{{ log.podName }}]</span>
                <span class="ml-2">{{ log.message }}</span>
              </div>
              <div v-if="filteredPodLogs.length === 0 && podLogs.length > 0" class="text-gray-500 text-center py-8">
                검색 결과가 없습니다.
              </div>
              <div v-else-if="podLogs.length === 0" class="text-gray-500 text-center py-8">
                Pod 로그가 표시됩니다...
              </div>
            </div>

            <!-- 배포 보고서 -->
            <div v-if="activeTab === 3" class="space-y-6">
              <!-- 무중단 배포 검증 보고서 -->
              <div class="bg-white dark:bg-gray-700 p-6 rounded-lg">
                <h4 class="text-lg font-semibold mb-6">무중단 배포 검증 보고서</h4>

                <!-- 배포 요약 -->
                <div class="mb-6">
                  <h5 class="font-medium mb-3 text-gray-900 dark:text-white">배포 요약</h5>
                  <div class="space-y-2 text-sm">
                    <div>• 서비스: {{ serviceName }}</div>
                    <div>• 전략: {{ formData.strategy || '선택 안됨' }}</div>
                    <div>• 서빙방식: {{ servingType }}</div>
                    <div>• 시작시간: {{ deploymentStarted ? '배포 진행중' : '대기중' }}</div>
                    <div>• 상태: {{ deploymentStatus }}</div>
                  </div>
                </div>

                <!-- 검증 결과 -->
                <div class="mb-6">
                  <h5 class="font-medium mb-3 text-gray-900 dark:text-white">검증 결과</h5>
                  <div class="space-y-2 text-sm">
                    <div>• 서비스 가용성: {{ deploymentProgress === 100 ? '100% (중단시간 0초)' : '검증 중...' }}</div>
                    <div>• 추론 성공률: {{ inferenceStats.total > 0 ? `${inferenceStats.successRate}% (${inferenceStats.success}/${inferenceStats.total})` : '검증 대기중' }}</div>
                    <div>• 배포 전략: {{ deploymentProgress === 100 ? '정상 적용' : '진행 중...' }}</div>
                  </div>
                </div>

                <!-- 다운로드 -->
                <div>
                  <h5 class="font-medium mb-3 text-gray-900 dark:text-white">다운로드</h5>
                  <div class="flex gap-3">
                    <UButton
                      @click="downloadAllLogs()"
                      variant="outline"
                      icon="i-heroicons-document-text"
                      :disabled="!deploymentStarted"
                    >
                      전체 로그 다운로드
                    </UButton>
                    <UButton
                      @click="downloadReport('json')"
                      variant="outline"
                      icon="i-heroicons-code-bracket"
                      :disabled="!deploymentStarted"
                    >
                      보고서 JSON
                    </UButton>
                  </div>
                  <div v-if="!deploymentStarted" class="text-xs text-gray-500 mt-2">
                    배포 시작 후 다운로드가 가능합니다
                  </div>
                </div>
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
      return formData.value.storageUri
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
  inferenceStats,
  deploymentProgress,
  deploymentStatus,
  connectDeploymentLogs,
  connectPodLogs,
  connectInferenceLogs,
  disconnectAll,
  clearLogs
} = useWebSocket()

// 로그 관련
const activeTab = ref(0)
const logTabs = [
  { label: '배포 로그' },
  { label: '추론 검증' },
  { label: 'Pod 로그' },
  { label: '배포 보고서' }
]

// 로그 검색/필터 관련
const logSearchQuery = ref('')
const logLevelFilter = ref('')

// 필터링된 로그들
const filteredDeploymentLogs = computed(() => {
  return deploymentLogs.value.filter(log => {
    const matchesSearch = !logSearchQuery.value ||
                         log.message.toLowerCase().includes(logSearchQuery.value.toLowerCase())
    const matchesLevel = !logLevelFilter.value || log.level === logLevelFilter.value
    return matchesSearch && matchesLevel
  })
})

const filteredInferenceLogs = computed(() => {
  return inferenceLogs.value.filter(log => {
    const matchesSearch = !logSearchQuery.value ||
                         log.message.toLowerCase().includes(logSearchQuery.value.toLowerCase())
    const matchesLevel = !logLevelFilter.value || log.level === logLevelFilter.value
    return matchesSearch && matchesLevel
  })
})

const filteredPodLogs = computed(() => {
  return podLogs.value.filter(log => {
    const matchesSearch = !logSearchQuery.value ||
                         log.message.toLowerCase().includes(logSearchQuery.value.toLowerCase()) ||
                         log.podName.toLowerCase().includes(logSearchQuery.value.toLowerCase())
    // Pod 로그는 레벨이 없으므로 레벨 필터는 적용하지 않음
    return matchesSearch
  })
})

// 유틸리티 함수들
const getServingTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'vLLM': return 'blue'
    case 'ModelMesh': return 'purple'
    default: return 'gray'
  }
}

// Pod 타입별 배지 색상
const getPodTypeBadgeClass = (podType: string) => {
  switch (podType) {
    case 'blue': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'green': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'stable': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    case 'canary': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'cleanup': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'runtime': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'base': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
}

// Pod 타입별 텍스트 색상
const getPodTypeTextClass = (podType: string) => {
  switch (podType) {
    case 'blue': return 'text-blue-600 dark:text-blue-400'
    case 'green': return 'text-green-600 dark:text-green-400'
    case 'stable': return 'text-gray-600 dark:text-gray-400'
    case 'canary': return 'text-yellow-600 dark:text-yellow-400'
    case 'cleanup': return 'text-red-600 dark:text-red-400'
    case 'runtime': return 'text-purple-600 dark:text-purple-400'
    case 'base': return 'text-indigo-600 dark:text-indigo-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
}

// 성공률 계산 (추론 통계 기반)
const successRate = computed(() => {
  return inferenceStats.value.successRate
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

const formatTime = (timestamp: string | Date) => {
  try {
    let date: Date

    // 이미 Date 객체인 경우
    if (timestamp instanceof Date) {
      date = timestamp
    } else if (typeof timestamp === 'string') {
      // 문자열인 경우 다양한 형식 시도
      if (timestamp.includes('T') || timestamp.includes('Z')) {
        // ISO 형식 (2024-01-01T12:00:00Z)
        date = new Date(timestamp)
      } else if (timestamp.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)) {
        // SQL 형식 (2024-01-01 12:00:00)
        date = new Date(timestamp.replace(' ', 'T') + 'Z')
      } else if (timestamp.match(/^\d+$/)) {
        // Unix timestamp (밀리초)
        date = new Date(parseInt(timestamp))
      } else {
        // 기본 Date 파싱 시도
        date = new Date(timestamp)
      }
    } else {
      // 현재 시간 사용
      date = new Date()
    }

    // Invalid Date 체크
    if (isNaN(date.getTime())) {
      // 파싱 실패시 현재 시간 반환
      return new Date().toLocaleTimeString('ko-KR', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    return date.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch (error) {
    // 에러 발생시 현재 시간 반환
    return new Date().toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}


const formatJsonResponse = (responseContent: any) => {
  try {
    return JSON.stringify(responseContent, null, 2)
  } catch (error) {
    return String(responseContent)
  }
}

// 메시지 파싱 함수들

const getEndpointFromMessage = (message: string) => {
  // "🎯 추론 엔드포인트: http://..." 패턴 파싱
  const endpointMatch = message.match(/엔드포인트:\s*(https?:\/\/[^\s]+)/)
  return endpointMatch ? endpointMatch[1] : null
}

const getStatsFromMessage = (message: string) => {
  // "N회 요청, 성공률 X.X%" 패턴 파싱
  const statsMatch = message.match(/(\d+)회 요청.*성공률[:\s]*(\d+\.?\d*)%/)
  if (statsMatch) {
    return {
      requests: parseInt(statsMatch[1]),
      successRate: parseFloat(statsMatch[2])
    }
  }
  return null
}

const getErrorFromMessage = (message: string) => {
  // "오류: ..." 또는 "Cannot connect to host..." 패턴 파싱
  const errorMatch = message.match(/오류:\s*(.+)$/) || message.match(/(Cannot connect to host[^)]+)/)
  return errorMatch ? errorMatch[1] : null
}

// 개별 추론 요청 로그인지 확인 (mlops-deployment-certification과 동일한 방식)
const isInferenceRequestLog = (log: any) => {
  return log.metadata && (
    log.metadata.endpoint ||
    log.metadata.response_content ||
    log.metadata.error_content ||
    log.metadata.payload_type ||
    typeof log.metadata.success === 'boolean'
  )
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
          modelPath: formData.value.storageUri
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
    const response = await deployInferenceService(namespace, serviceName, formData.value.strategy, config)

    if (response.code === 130200) {
      // 응답에서 deployment_id 추출
      const deploymentId = response.result?.deploymentId

      // WebSocket 연결 시작 (deployment_id 포함)
      connectDeploymentLogs(namespace, serviceName, deploymentId)
      connectPodLogs(namespace, serviceName, formData.value.strategy, deploymentId)
      connectInferenceLogs(namespace, serviceName, deploymentId)

      // 로딩 상태 해제
      loading.value = false
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

    // 재배포에서는 기존 서비스의 프로토콜 버전을 백엔드에서 자동으로 판단함
    // 프론트엔드에서는 modelFormat만 백엔드로 전달하고, 백엔드에서 적절한 프로토콜 버전 결정
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
    // query parameter로 받은 namespace 사용
    const namespace = route.query.namespace as string || 'kubeflow-user-example-com'

    // 직접 해당 namespace에서 조회
    const endpointDetails = await getEndpointDetails(namespace, serviceName)

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

// 추론 로그 자동 스크롤
const logContainer = ref<HTMLElement>()

// 추론 로그 자동 스크롤
watch(inferenceLogs, (newLogs) => {
  // 추론 로그가 업데이트될 때 자동 스크롤
  nextTick(() => {
    if (logContainer.value && activeTab.value === 1) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}, { deep: true })

const toolbarLinks = ref([
  [],
  []
])

// 전체 로그 다운로드 함수 (순수 텍스트 형태)
const downloadAllLogs = () => {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-')

  // 모든 로그를 시간순으로 정렬
  const allLogs = [
    ...deploymentLogs.value.map(log => ({
      timestamp: log.timestamp,
      type: 'DEPLOY',
      message: log.message
    })),
    ...podLogs.value.map(log => ({
      timestamp: log.timestamp,
      type: `POD:${log.podName}`,
      message: log.message
    })),
    ...inferenceLogs.value.map(log => ({
      timestamp: log.timestamp,
      type: 'INFERENCE',
      message: log.message
    }))
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // 텍스트 파일 생성
  const logText = allLogs.map(log =>
    `${formatTime(log.timestamp)} [${log.type}] ${log.message}`
  ).join('\n')

  const filename = `deployment-complete-${serviceName}-${timestamp}.log`
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 보고서 다운로드 함수 (간소화된 버전)
const downloadReport = (format: 'json') => {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-')

  // 간소화된 보고서
  const simpleReport = {
    serviceName: serviceName,
    strategy: formData.value.strategy,
    servingType: servingType.value,
    startTime: deploymentStarted.value ? new Date().toISOString() : null,
    status: deploymentStatus.value,
    progress: deploymentProgress.value,
    inferenceStats: inferenceStats.value,
    totalLogs: deploymentLogs.value.length + podLogs.value.length + inferenceLogs.value.length,
    generatedAt: new Date().toISOString()
  }

  const filename = `deployment-report-${serviceName}-${timestamp}.json`
  const blob = new Blob([JSON.stringify(simpleReport, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 탭별 개별 다운로드 함수
const downloadTabLogs = (tabIndex: number) => {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-')
  let tabName = ''
  let tabData = {}

  switch (tabIndex) {
    case 0: // 배포 로그
      tabName = 'deployment-logs'
      tabData = {
        meta: {
          serviceName: serviceName,
          tabType: 'deployment',
          exportedAt: new Date().toISOString(),
          totalLogs: deploymentLogs.value.length
        },
        logs: deploymentLogs.value
      }
      break
    case 1: // 추론 검증
      tabName = 'inference-logs'
      tabData = {
        meta: {
          serviceName: serviceName,
          tabType: 'inference',
          exportedAt: new Date().toISOString(),
          totalLogs: inferenceLogs.value.length,
          stats: inferenceStats.value
        },
        logs: inferenceLogs.value
      }
      break
    case 2: // Pod 로그
      tabName = 'pod-logs'
      tabData = {
        meta: {
          serviceName: serviceName,
          tabType: 'pod',
          exportedAt: new Date().toISOString(),
          totalLogs: podLogs.value.length
        },
        logs: podLogs.value
      }
      break
    case 3: // 배포 보고서
      tabName = 'deployment-report'
      tabData = {
        meta: {
          serviceName: serviceName,
          tabType: 'report',
          exportedAt: new Date().toISOString()
        },
        summary: {
          strategy: formData.value.strategy,
          servingType: servingType.value,
          progress: deploymentProgress.value,
          status: deploymentStatus.value,
          metrics: inferenceStats.value
        },
        validation: {
          criteria: getValidationCriteria.value,
          progress: validationProgress.value
        }
      }
      break
  }

  const filename = `${tabName}-${serviceName}-${timestamp}.json`
  const blob = new Blob([JSON.stringify(tabData, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
/* JSON 응답 프리 블록 스타일링 */
pre {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.4;
}
</style>