<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <div class="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <!-- 좌측: 재배포 설정 폼 (30%) -->
      <div class="lg:col-span-3 space-y-6">
        <!-- 기본 정보 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              기본 정보
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup label="서비스명">
              <UInput v-model="serviceName" disabled />
            </UFormGroup>

            <UFormGroup label="서빙 타입">
              <UBadge :label="servingType" :color="getServingTypeBadgeColor(servingType)" />
            </UFormGroup>

            <UFormGroup label="네임스페이스">
              <UInput v-model="namespace" disabled />
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
                v-model="formData.deployment_strategy"
                :options="availableStrategies"
                :disabled="loading"
              />
            </UFormGroup>

            <!-- Canary 전략 추가 설정 -->
            <div v-if="formData.deployment_strategy === 'canary'" class="space-y-4">
              <UFormGroup label="트래픽 비율 (%)">
                <URange
                  v-model="formData.canary_traffic_percent"
                  :min="10"
                  :max="90"
                  :disabled="loading"
                />
                <div class="text-sm text-gray-500 mt-1">{{ formData.canary_traffic_percent }}%</div>
              </UFormGroup>
            </div>

            <!-- Storage URI (필요한 전략만) -->
            <div v-if="needsStorageUri && servingType !== 'vLLM'" class="space-y-4">
              <UFormGroup label="Storage URI" required>
                <UInput
                  v-model="formData.storage_uri"
                  placeholder="예: s3://bucket/path/to/model"
                  :disabled="loading"
                />
              </UFormGroup>
            </div>

            <!-- vLLM 설정 -->
            <div v-if="servingType === 'vLLM'" class="space-y-4">

              <!-- LoRA Adapter 전략 -->
              <div v-if="formData.deployment_strategy === 'lora-adapter'" class="border rounded-lg p-4">
                <!-- 현재 설정 표시 (참고용) -->
                <div class="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 mb-4">
                  <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">현재 설정</h6>
                  <div class="text-sm space-y-1">
                    <div><span class="font-medium">베이스 모델:</span> {{ currentVllmSettings.base_model_name }}</div>
                    <div v-if="currentVllmSettings.adapters.length > 0">
                      <span class="font-medium">기존 어댑터:</span>
                      {{ currentVllmSettings.adapters.map(a => a.name).join(', ') }}
                    </div>
                  </div>
                </div>

                <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-3">새 LoRA Adapter 추가</h5>
                <div class="space-y-4">
                  <UFormGroup label="새 어댑터 이름" required>
                    <UInput
                      v-model="formData.adapter_name"
                      placeholder="예: new-adapter"
                      :disabled="loading"
                    />
                  </UFormGroup>
                  <UFormGroup label="새 어댑터 경로" required>
                    <UInput
                      v-model="formData.adapter_path"
                      placeholder="예: s3://bucket/path/to/adapter"
                      :disabled="loading"
                    />
                  </UFormGroup>
                </div>
              </div>

              <!-- Blue-Green 전략 - 완전한 새 vLLM 설정 -->
              <div v-if="formData.deployment_strategy === 'blue-green'" class="space-y-6">
                <h5 class="text-sm font-medium text-gray-900 dark:text-white mb-4">새 vLLM 설정 (Blue-Green 배포)</h5>

                <!-- 기본 설정 -->
                <div class="space-y-4">
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
                </div>

                <!-- 베이스 모델 설정 -->
                <div class="border-t pt-4">
                  <h6 class="text-sm font-medium text-gray-900 dark:text-white mb-4">베이스 모델</h6>
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
                    <h6 class="text-sm font-medium text-gray-900 dark:text-white">어댑터 모델들</h6>
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
                      <h6 class="text-sm font-medium text-gray-700 dark:text-gray-300">어댑터 {{ index + 1 }}</h6>
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

                <!-- 추가 옵션 -->
                <div class="border-t pt-4">
                  <h6 class="text-sm font-medium text-gray-900 dark:text-white mb-4">추가 옵션</h6>
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
            </div>

            <UFormGroup label="추가 테스트 시간 (초)">
              <UInput
                v-model="formData.additional_test_duration"
                type="number"
                :min="30"
                :max="300"
                :disabled="loading"
              />
            </UFormGroup>
          </div>

          <!-- 버튼 -->
          <template #footer>
            <div class="flex justify-end gap-3">
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
          </template>
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
                <UProgress :value="localDeploymentProgress" :max="100" />
              </div>
              <span class="text-sm font-medium">{{ localDeploymentProgress }}%</span>
            </div>

            <div class="text-center text-sm text-gray-600 dark:text-gray-400">
              {{ localDeploymentStatus }}
            </div>

          </div>
        </UCard>

        <!-- 추론 통계 -->
        <UCard>
          <template #header>
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              추론 테스트 통계
            </h3>
          </template>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600">{{ inferenceStats.totalRequests }}</div>
              <div class="text-sm text-gray-500">총 요청</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ inferenceStats.successfulRequests }}</div>
              <div class="text-sm text-gray-500">성공</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">{{ inferenceStats.failedRequests }}</div>
              <div class="text-sm text-gray-500">실패</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold" :class="getSuccessRateColor()">
                {{ Math.round(inferenceStats.successRate) }}%
              </div>
              <div class="text-sm text-gray-500">성공률</div>
            </div>
          </div>
        </UCard>

        <!-- 실시간 로그 -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <UTabs v-model="activeTab" :items="logTabs" />
              <!-- 배포 완료 후 보고서 관련 버튼들 -->
              <div v-if="isCompleted && deploymentId" class="flex gap-2">
                <UButton
                  @click="viewDeploymentReport"
                  :loading="reportLoading"
                  variant="outline"
                  size="sm"
                  icon="i-heroicons-document-text"
                >
                  배포 보고서 보기
                </UButton>
                <UButton
                  @click="downloadReportDirectly"
                  :loading="reportDownloadLoading"
                  variant="outline"
                  size="sm"
                  icon="i-heroicons-arrow-down-tray"
                >
                  보고서 다운로드
                </UButton>
              </div>
            </div>
          </template>

          <div
            ref="logContainer"
            class="min-h-[600px] max-h-[80vh] overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded"
          >
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
                <div v-if="log.metadata && isInferenceRequestLog(log)" class="ml-4 mt-2 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded border">
                  <div class="grid grid-cols-2 gap-2 mb-2">
                    <div v-if="log.metadata.request_url" class="text-gray-600 dark:text-gray-400">
                      <span class="font-medium">Endpoint:</span><br>
                      <span class="text-blue-600 break-all">{{ log.metadata.request_url }}</span>
                    </div>
                    <div v-if="log.metadata.status_code" class="text-gray-600 dark:text-gray-400">
                      <span class="font-medium">Status:</span>
                      <span :class="log.metadata.status_code === 200 ? 'text-green-600' : 'text-red-600'" class="ml-1">
                        {{ log.metadata.status_code }}
                      </span>
                    </div>
                    <div v-if="log.metadata.success !== undefined" class="text-gray-600 dark:text-gray-400">
                      <span class="font-medium">Result:</span>
                      <span :class="log.metadata.success ? 'text-green-600' : 'text-red-600'" class="ml-1">
                        {{ log.metadata.success ? 'SUCCESS' : 'FAILED' }}
                      </span>
                    </div>
                    <div v-if="log.metadata.responseTime" class="text-gray-600 dark:text-gray-400">
                      <span class="font-medium">Response Time:</span>
                      <span class="ml-1">{{ log.metadata.responseTime.toFixed(2) }}ms</span>
                    </div>
                  </div>
                  <div v-if="log.metadata.response_body" class="text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Response:</span>
                    <div class="mt-1 p-2 bg-white dark:bg-gray-700 rounded text-xs">
                      <pre class="whitespace-pre-wrap">{{ formatJsonResponse(log.metadata.response_body) }}</pre>
                    </div>
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

          </div>
        </UCard>
      </div>
    </div>

    <!-- 배포 보고서 모달 -->
    <UModal v-model="isReportModalOpen" :ui="{ width: 'w-full max-w-4xl' }">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">배포 보고서</h3>
            <UButton
              @click="downloadReport"
              variant="outline"
              size="sm"
              icon="i-heroicons-arrow-down-tray"
            >
              다운로드
            </UButton>
          </div>
        </template>

        <div v-if="manualReportData" class="space-y-6">
          <!-- 배포 요약 -->
          <div class="bg-white dark:bg-gray-700 p-6 rounded-lg border">
            <h4 class="text-lg font-semibold mb-4">배포 요약</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">전략</div>
                <div class="font-medium">{{ manualReportData.strategy }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">소요시간</div>
                <div class="font-medium">{{ manualReportData.duration?.toFixed(1) || 'N/A' }}초</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">가용성</div>
                <div class="font-medium text-green-600">{{ manualReportData.availability?.toFixed(1) || 'N/A' }}%</div>
              </div>
              <div>
                <div class="text-sm text-gray-600 dark:text-gray-400">성공 여부</div>
                <div :class="manualReportData.overallSuccess ? 'text-green-600' : 'text-red-600'" class="font-medium">
                  {{ manualReportData.overallSuccess ? '성공' : '실패' }}
                </div>
              </div>
            </div>
          </div>

          <!-- 상세 정보 -->
          <div class="bg-white dark:bg-gray-700 p-6 rounded-lg border">
            <h4 class="text-lg font-semibold mb-4">상세 정보</h4>
            <div class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">배포 ID</div>
                  <div class="font-mono text-sm">{{ manualReportData.deploymentId || deploymentId }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">시작 시간</div>
                  <div class="text-sm">{{ formatDateTime(manualReportData.startTime) }}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">종료 시간</div>
                  <div class="text-sm">{{ formatDateTime(manualReportData.endTime) }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">서비스명</div>
                  <div class="font-medium">{{ serviceName }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- JSON 데이터 (개발자용) -->
          <div class="bg-white dark:bg-gray-700 p-6 rounded-lg border">
            <h4 class="text-lg font-semibold mb-4">전체 보고서 데이터</h4>
            <pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-auto max-h-64">{{ JSON.stringify(manualReportData, null, 2) }}</pre>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <div class="text-gray-500">보고서를 로드하는 중...</div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const serviceName = route.params.name as string
const pageTitle = `재배포: ${serviceName}`

// 기본 상태
const loading = ref(false)
const reportLoading = ref(false)
const reportDownloadLoading = ref(false)
const deploymentStarted = ref(false)
const servingType = ref('Standard')
const namespace = ref('kubeflow-user-example-com')
const deploymentId = ref<string | null>(null)

// 보고서 모달 관련
const isReportModalOpen = ref(false)
const manualReportData = ref<any>(null)

// 로컬 배포 상태 (WebSocket readonly 상태 대신 사용)
const localDeploymentStatus = ref('준비 중...')
const localDeploymentProgress = ref(0)

// 로그 관련
const activeTab = ref(0)
const logTabs = [
  { label: '배포 로그' },
  { label: '추론 검증' }
]

// 로그 검색/필터 관련
const logSearchQuery = ref('')
const logLevelFilter = ref('')

// 로그 컨테이너 ref
const logContainer = ref<HTMLElement>()

// vLLM 현재 설정 (읽기 전용)
const currentVllmSettings = ref({
  base_model_name: '',
  base_model_path: '',
  adapters: [] as Array<{ name: string; path: string }>
})

// 폼 데이터
const formData = ref({
  serving_type: 'standard',
  deployment_strategy: 'blue-green',
  canary_traffic_percent: 20,
  storage_uri: '',
  adapter_name: '',
  adapter_path: '',
  additional_test_duration: 60,

  // vLLM Blue-Green 설정
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
  adapters: [] as Array<{ name: string; storage_uri: string }>
})

// 서빙 타입 옵션
// GPU 리소스 옵션
const gpuResourceOptions = [
  { label: '기본 GPU (nvidia.com/gpu)', value: 'nvidia.com/gpu' },
  { label: 'MIG 3g.40gb (nvidia.com/mig-3g.40gb)', value: 'nvidia.com/mig-3g.40gb' }
]

// 사용 가능한 전략 (서빙 타입별)
const availableStrategies = computed(() => {
  switch (formData.value.serving_type) {
    case 'vllm':
      return [
        { label: 'LoRA Adapter (권장)', value: 'lora-adapter' },
        { label: 'Blue-Green', value: 'blue-green' }
      ]
    case 'modelmesh':
      return [
        { label: 'ModelMesh', value: 'modelmesh' }
      ]
    default: // standard
      return [
        { label: 'Blue-Green', value: 'blue-green' },
        { label: 'Canary', value: 'canary' }
      ]
  }
})

// Storage URI가 필요한 전략인지
const needsStorageUri = computed(() => {
  return ['blue-green', 'canary', 'modelmesh'].includes(formData.value.deployment_strategy)
})

// 폼 유효성 검사
const isFormValid = computed(() => {
  if (formData.value.deployment_strategy === 'lora-adapter') {
    return formData.value.adapter_name && formData.value.adapter_path
  }
  if (formData.value.deployment_strategy === 'blue-green' && servingType.value === 'vLLM') {
    // vLLM Blue-Green: 베이스 모델 필수, 어댑터들 유효성 검사
    const baseModelValid = formData.value.base_model.name && formData.value.base_model.storage_uri
    const adaptersValid = formData.value.adapters.length === 0 ||
                         formData.value.adapters.every(adapter => adapter.name && adapter.storage_uri)
    return baseModelValid && adaptersValid
  }
  if (needsStorageUri.value) {
    return !!formData.value.storage_uri
  }
  return true
})

// WebSocket 연동
const {
  connectionStatus,
  deploymentLogs,
  inferenceLogs,
  inferenceStats,
  deploymentReport,
  deploymentProgress,
  deploymentStatus,
  isCompleted,
  connect3ChannelWebSocket,
  disconnect,
  clearLogs,
  updateDeploymentReport,
  setCurrentDeploymentId,
  getInferenceLogs,
  getDeploymentLogCache
} = useWebSocket()

// 필터링된 로그들 (c13f282 스타일)
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


// c13f282에서 사용하는 유틸리티 함수들
const isInferenceRequestLog = (log: any) => {
  return log.metadata && (log.metadata.request_url || log.metadata.success !== undefined)
}

const formatJsonResponse = (responseContent: any) => {
  try {
    if (typeof responseContent === 'string') {
      return responseContent
    }
    return JSON.stringify(responseContent)
  } catch {
    return String(responseContent)
  }
}



// 브레드크럼
const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Endpoints', to: '/endpoints/' },
  { label: 'Redeploy' }
]

const toolbarLinks = ref([[], []])

// 유틸리티 함수들
const getServingTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'vLLM': return 'blue'
    case 'ModelMesh': return 'purple'
    default: return 'gray'
  }
}


const getSuccessRateColor = () => {
  const rate = inferenceStats.value.successRate
  if (rate >= 95) return 'text-green-600'
  if (rate >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

const formatTime = (timestamp: string) => {
  try {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return new Date().toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }
}


// 액션 함수들
const startRedeploy = async () => {
  if (!isFormValid.value) {
    return
  }

  loading.value = true
  deploymentStarted.value = true
  clearLogs()

  // 기본 상태 메시지
  localDeploymentStatus.value = '재배포 시작 중...'
  localDeploymentProgress.value = 10

  try {
    // InferenceServiceInfo 객체 구성 (전략별)
    let inferenceServiceInfo: any = {
      predictor: {
        service_account_name: 'storage-system-minio-sa'
      },
      sidecar_inject: false
    }

    if (formData.value.deployment_strategy === 'lora-adapter') {
      // LoRA Adapter: 기존 설정 + 새 어댑터
      inferenceServiceInfo.predictor.containers = [{
        name: 'kserve-container',
        env: [
          {
            name: 'NEW_ADAPTER_NAME',
            value: formData.value.adapter_name
          },
          {
            name: 'NEW_ADAPTER_PATH',
            value: formData.value.adapter_path
          }
        ]
      }]
    } else if (formData.value.deployment_strategy === 'blue-green' && servingType.value === 'vLLM') {
      // vLLM Blue-Green: 완전한 새 vLLM 설정
      let storageUriParts = [`${formData.value.base_model.name}=${formData.value.base_model.storage_uri}`]
      formData.value.adapters.forEach(adapter => {
        storageUriParts.push(`${adapter.name}=${adapter.storage_uri}`)
      })
      const storageUriValue = storageUriParts.join(',')

      // vLLM 커맨드 생성
      let vllmCommand = `python -m vllm.entrypoints.openai.api_server --host 0.0.0.0 --port 8080 --model ${formData.value.base_model.name}`
      if (formData.value.vllm_chat_template) {
        vllmCommand += ` --chat-template ${formData.value.vllm_chat_template}`
      }
      if (formData.value.vllm_max_batched_tokens) {
        vllmCommand += ` --max-num-batched-tokens ${formData.value.vllm_max_batched_tokens}`
      }
      if (formData.value.adapters.length > 0) {
        const adapterNames = formData.value.adapters.map(a => a.name).join(',')
        vllmCommand += ` --enable-lora --lora-modules ${adapterNames}`
      }

      // 리소스 설정
      const resources: any = {}
      if (formData.value.vllm_cpu || formData.value.vllm_memory || formData.value.vllm_gpu_count) {
        resources.requests = {}
        resources.limits = {}
        if (formData.value.vllm_cpu) {
          resources.requests.cpu = formData.value.vllm_cpu
          resources.limits.cpu = formData.value.vllm_cpu
        }
        if (formData.value.vllm_memory) {
          resources.requests.memory = formData.value.vllm_memory
          resources.limits.memory = formData.value.vllm_memory
        }
        if (formData.value.vllm_gpu_count) {
          resources.requests[formData.value.vllm_gpu] = parseInt(formData.value.vllm_gpu_count)
          resources.limits[formData.value.vllm_gpu] = parseInt(formData.value.vllm_gpu_count)
        }
      }

      inferenceServiceInfo.predictor.containers = [{
        name: 'kserve-container',
        image: `vllm/vllm-openai:${formData.value.vllm_image_tag}`,
        command: ['/bin/sh', '-c'],
        args: [vllmCommand],
        env: [{
          name: 'STORAGE_URI',
          value: storageUriValue
        }],
        ports: [{ containerPort: 8080 }],
        ...(Object.keys(resources).length > 0 && { resources })
      }]

      // MIG 사용시 Toleration 추가
      if (formData.value.vllm_target_node) {
        inferenceServiceInfo.predictor.tolerations = [{
          key: 'kubernetes.io/hostname',
          operator: 'Equal',
          value: formData.value.vllm_target_node,
          effect: 'NoSchedule'
        }]
      }
    } else if (formData.value.storage_uri) {
      // 기본 전략 (Blue-Green, Canary)
      inferenceServiceInfo.predictor.model = {
        storage_uri: formData.value.storage_uri,
        format: { name: 'sklearn' },
        protocol_version: 'v1'
      }
    }

    // API 호출
    const response = await redeployInferenceService(
      namespace.value,
      serviceName,
      formData.value, // 전체 formData 전달
      formData.value.serving_type, // 백엔드 호환성을 위해 소문자 버전 사용
      formData.value.deployment_strategy
    )

    if (response.code === 130200) {
      // deployment_id 추출하여 WebSocket 연결
      const responseDeploymentId = response.result?.data?.deploymentId || response.result?.deploymentId

      if (responseDeploymentId) {
        deploymentId.value = responseDeploymentId

        // WebSocket composable에 배포 ID 설정
        setCurrentDeploymentId(responseDeploymentId)

        // WebSocket 연결 (이후 진행 상황은 WebSocket 메시지로 관리)
        connect3ChannelWebSocket(namespace.value, serviceName, responseDeploymentId)
      } else {
        console.error('deployment_id가 응답에 없습니다:', response.result)
        alert('deployment_id를 받지 못했습니다. 재배포는 시작되었지만 실시간 모니터링을 할 수 없습니다.')
      }
    } else {
      throw new Error(response.message || '재배포 시작 실패')
    }
  } catch (error) {
    let errorMessage = '알 수 없는 오류'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error, null, 2)
    }

    alert('재배포 시작 중 오류가 발생했습니다: ' + errorMessage)
  } finally {
    loading.value = false
  }
}

const cancelRedeploy = () => {
  disconnect()
  router.push('/endpoints')
}

// 배포 보고서 보기 (모달 열기)
const viewDeploymentReport = async () => {
  if (!deploymentId.value) {
    alert('배포 ID가 없습니다.')
    return
  }

  reportLoading.value = true
  isReportModalOpen.value = true
  manualReportData.value = null

  try {
    const { getDeploymentReport } = await import('~/composables/endpoints')
    const response = await getDeploymentReport(namespace.value, serviceName, deploymentId.value)

    if (response.code === 130200) {
      manualReportData.value = response.result
    } else {
      alert('보고서 로드에 실패했습니다: ' + (response.message || '알 수 없는 오류'))
      isReportModalOpen.value = false
    }
  } catch (error) {
    alert('보고서 로드 중 오류가 발생했습니다: ' + (error as Error).message)
    isReportModalOpen.value = false
  } finally {
    reportLoading.value = false
  }
}

// 모달에서 보고서 다운로드 (기존 데이터 사용)
const downloadReport = () => {
  if (!manualReportData.value) return

  const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-')

  const reportData = {
    serviceName,
    namespace: namespace.value,
    timestamp: new Date().toISOString(),
    ...manualReportData.value
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `deployment-report-${serviceName}-${timestamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 직접 보고서 다운로드 (API 호출)
const downloadReportDirectly = async () => {
  if (!deploymentId.value) {
    alert('배포 ID가 없습니다.')
    return
  }

  reportDownloadLoading.value = true

  try {
    const { getDeploymentReport } = await import('~/composables/endpoints')
    const response = await getDeploymentReport(namespace.value, serviceName, deploymentId.value)

    if (response.code === 130200) {
      const timestamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-')

      const reportData = {
        serviceName,
        namespace: namespace.value,
        timestamp: new Date().toISOString(),
        ...response.result
      }

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `deployment-report-${serviceName}-${timestamp}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      alert('보고서 다운로드에 실패했습니다: ' + (response.message || '알 수 없는 오류'))
    }
  } catch (error) {
    alert('보고서 다운로드 중 오류가 발생했습니다: ' + (error as Error).message)
  } finally {
    reportDownloadLoading.value = false
  }
}

// 날짜 포맷팅 함수
const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return dateString
  }
}

// 서비스 정보 로드
onMounted(async () => {
  try {
    const queryNamespace = route.query.namespace as string || 'kubeflow-user-example-com'
    namespace.value = queryNamespace

    // 서비스 정보 조회
    const endpointDetails = await getEndpointDetails(queryNamespace, serviceName)

    // 서빙 타입 감지
    const detectedType = detectServingType(endpointDetails)
    servingType.value = detectedType === 'standard' ? 'Standard' :
                       detectedType === 'vllm' ? 'vLLM' : 'ModelMesh'

    formData.value.serving_type = detectedType

    // 네임스페이스 업데이트
    if (detectedType === 'modelmesh') {
      namespace.value = 'modelmesh-serving'
    }

    // 기본 전략 설정
    const strategies = availableStrategies.value
    if (strategies.length > 0) {
      formData.value.deployment_strategy = strategies[0].value
    }

    // 기존 Storage URI 자동 채우기 (Standard/ModelMesh용)
    if (detectedType !== 'vllm') {
      const currentStorageUri = extractStorageUri(endpointDetails)
      if (currentStorageUri) {
        formData.value.storage_uri = currentStorageUri
      }
    }

    // vLLM 서비스의 경우 베이스 모델과 어댑터 정보 추출 및 기본값 설정
    if (detectedType === 'vllm') {
      const vllmSettings = extractVllmSettings(endpointDetails)
      currentVllmSettings.value = vllmSettings

      // Blue-Green 전략을 위한 기본값 설정 (현재 설정을 기반으로)
      formData.value.base_model.name = vllmSettings.base_model_name
      formData.value.base_model.storage_uri = vllmSettings.base_model_path
      formData.value.adapters = vllmSettings.adapters.map(adapter => ({
        name: adapter.name,
        storage_uri: adapter.path
      }))
    }

  } catch (error) {
    console.error('서비스 정보 로드 실패:', error)
  }
})

// Storage URI 추출 함수
const extractStorageUri = (endpointDetails: any): string => {
  const predictor = endpointDetails.result?.spec?.predictor

  // Model 기반 서비스 (Standard, ModelMesh)
  if (predictor?.model?.storageUri) {
    return predictor.model.storageUri
  }

  // Container 기반 서비스 (vLLM)
  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((env: any) => env.name === 'STORAGE_URI')
    if (storageEnv?.value) {
      const uri = storageEnv.value

      // {model_name}=s3://path 형태인 경우 첫 번째 모델 경로 추출
      if (uri.includes('=')) {
        const models = uri.split(',').map((item: string) => item.trim())
        const [, path] = models[0].split('=')
        return path || uri
      }

      return uri
    }
  }

  return ''
}

// vLLM 설정 추출 함수
const extractVllmSettings = (endpointDetails: any) => {
  const predictor = endpointDetails.result?.spec?.predictor
  const settings = {
    base_model_name: 'base_model',
    base_model_path: '',
    adapters: [] as Array<{ name: string; path: string }>
  }

  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((env: any) => env.name === 'STORAGE_URI')
    if (storageEnv?.value) {
      const uri = storageEnv.value

      // {model_name}=s3://path 형태 파싱
      if (uri.includes('=')) {
        const models = uri.split(',').map((item: string) => item.trim())

        models.forEach((model: string, index: number) => {
          const [name, path] = model.split('=')
          if (index === 0) {
            // 첫 번째는 베이스 모델
            settings.base_model_name = name
            settings.base_model_path = path
          } else {
            // 나머지는 어댑터
            settings.adapters.push({ name, path })
          }
        })
      } else {
        // 단일 URI인 경우
        settings.base_model_path = uri
      }
    }
  }

  return settings
}

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

// GPU 리소스 변경시 Target Node 자동 설정
watch(() => formData.value.vllm_gpu, (newGpuResource) => {
  if (newGpuResource && newGpuResource.includes('mig')) {
    formData.value.vllm_target_node = 'wisenut-232'
  } else {
    formData.value.vllm_target_node = ''
  }
})

// WebSocket 상태와 로컬 상태 동기화
watch(deploymentStatus, (newStatus) => {
  if (newStatus && newStatus !== '준비 중...') {
    localDeploymentStatus.value = newStatus
  }
})

watch(deploymentProgress, (newProgress) => {
  if (newProgress > localDeploymentProgress.value) {
    localDeploymentProgress.value = newProgress
  }
})

// WebSocket 연결 상태 변화 감지
watch(connectionStatus, (newStatus) => {
  if (newStatus === 'connecting') {
    localDeploymentStatus.value = 'WebSocket 연결 중...'
    localDeploymentProgress.value = 50
  } else if (newStatus === 'connected') {
    localDeploymentStatus.value = '배포 모니터링 중...'
    localDeploymentProgress.value = 60
  } else if (newStatus === 'disconnected' && deploymentStarted.value) {
    // 배포 시작 후 연결이 끊어진 경우에만 메시지 표시
    localDeploymentStatus.value = '연결 끊어짐...'
  }
})

// 정리
onUnmounted(() => {
  disconnect()
})
</script>