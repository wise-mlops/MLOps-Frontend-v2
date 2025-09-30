<template>
  <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
  <LayoutPageHeader :title="pageTitle" />
  <LayoutPageToolbar :links="toolbarLinks" />
  <ModuleDataTable v-model:columns="endpointColumns" v-model:data="data" v-model:pending="pending">
    <template #status-data="{ row }">
      <UIcon
        :name="getStatusIcon(row)"
        :class="getStatusIconClass(row)"
      />
    </template>
    <template #name-data="{ row }">
      <span>{{ row.name }}</span>
    </template>
    <template #createdAt-data="{ row }">
      <div>
        {{ formatRelativeTime(row.creationTimestamp) }}
      </div>
    </template>
    <template #predictor-data="{ row }">
      <div class="flex justify-center">
        <UBadge :label="getPredictorType(row)" :color="getPredictorTypeColor(row)" />
      </div>
    </template>
    <template #servingType-data="{ row }">
      <div class="flex justify-center">
        <UBadge :label="getServingType(row)" :color="getServingTypeColor(row)" />
      </div>
    </template>
    <template #deploymentStatus-data="{ row }">
      <div class="flex justify-center">
        <UBadge :label="getDeploymentStatus(row)" :color="getDeploymentStatusColor(row)" />
      </div>
    </template>
    <template #runtime-data="{ row }">
      <div>
        {{ getRuntime(row) }}
      </div>
    </template>
    <template #protocol-data="{ row }">
      <div>
        {{ getProtocol(row) }}
      </div>
    </template>
    <template #storageUri-data="{ row }">
      <UPopover mode="hover">
        <div class="truncate max-w-xs cursor-pointer">
          {{ getStorageUri(row) }}
        </div>
        <template #panel>
          <div class="text-wrap p-4 storage-uri-panel">
            {{ getStorageUriFull(row) }}
          </div>
        </template>
      </UPopover>
    </template>
    <template #action-data="{ row }">
      <div class="flex items-center space-x-1">
        <UTooltip text="인퍼런스">
          <UButton
            @click="runInference(row)"
            icon="i-heroicons-play"
            variant="ghost"
            size="sm"
          />
        </UTooltip>
        <UTooltip text="상세보기">
          <UButton
            @click="detail(row)"
            icon="i-heroicons-eye"
            variant="ghost"
            size="sm"
          />
        </UTooltip>
        <UTooltip text="재배포">
          <UButton
            @click="redeploy(row)"
            icon="i-heroicons-arrow-path"
            variant="ghost"
            size="sm"
          />
        </UTooltip>
        <UTooltip text="배포">
          <UButton
            @click="openDeployModal(row)"
            icon="i-heroicons-rocket-launch"
            variant="ghost"
            size="sm"
          />
        </UTooltip>
        <UTooltip text="삭제">
          <UButton
            @click="deleteEndpoint(row)"
            icon="i-heroicons-trash"
            variant="ghost"
            size="sm"
            :loading="deleteLoading && selectedEndpoint?.name === row.name"
          />
        </UTooltip>
      </div>
    </template>
  </ModuleDataTable>

  <!-- 배포 모달 -->
  <UModal v-model="deployModalOpen" :ui="{ width: 'sm:max-w-md' }">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">배포: {{ selectedEndpoint?.name }}</h3>
      </template>

      <div class="space-y-4">
        <UFormGroup label="서빙 타입">
          <USelect
            v-model="deployConfig.serving_type"
            :options="servingTypeOptions"
            :disabled="deploying"
          />
        </UFormGroup>

        <UFormGroup label="배포 전략">
          <USelect
            v-model="deployConfig.deployment_strategy"
            :options="deploymentStrategyOptions"
            :disabled="deploying"
          />
        </UFormGroup>

        <UFormGroup v-if="deployConfig.deployment_strategy === 'canary'" label="트래픽 비율 (%)">
          <URange
            v-model="deployConfig.canary_traffic_percent"
            :min="10"
            :max="90"
            :disabled="deploying"
          />
          <div class="text-sm text-gray-500 mt-1">{{ deployConfig.canary_traffic_percent }}%</div>
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            @click="deployModalOpen = false"
            :disabled="deploying"
          >
            취소
          </UButton>
          <UButton
            @click="deploy"
            :loading="deploying"
          >
            배포
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const breadcrumbs = ref([
  {
    label: 'Home',
    to: '/'
  },
  {
    label: 'Endpoints',
  },
])

const pageTitle = ref('Endpoints')
const pending = ref(true)
const data = ref([])

// 삭제 관련 상태
const deleteLoading = ref(false)
const selectedEndpoint = ref(null)

// 배포 모달 관련 상태
const deployModalOpen = ref(false)
const deploying = ref(false)
const deployConfig = ref({
  serving_type: 'standard',
  deployment_strategy: 'blue-green',
  canary_traffic_percent: 20
})

// 서빙 타입 옵션
const servingTypeOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'vLLM', value: 'vllm' },
  { label: 'ModelMesh', value: 'modelmesh' }
]

// 배포 전략 옵션 (서빙 타입 기반)
const deploymentStrategyOptions = computed(() => {
  switch (deployConfig.value.serving_type) {
    case 'vllm':
      return [
        { label: 'Blue-Green', value: 'blue-green' },
        { label: 'LoRA Adapter', value: 'lora-adapter' }
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

// 배포 상태 표시
const getDeploymentStatus = (row: any) => {
  const ready = getReadyStatus(row)
  return ready ? '준비됨' : '배포 중'
}

const getDeploymentStatusColor = (row: any) => {
  const ready = getReadyStatus(row)
  return ready ? 'green' : 'yellow'
}

// 상태 아이콘 가져오기 (안전한 상태 확인)
const getStatusIcon = (row: any) => {
  try {
    const ready = getReadyStatus(row)
    return ready ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
  } catch (error) {
    console.error('Error getting status icon:', error, row)
    return 'i-heroicons-question-mark-circle'
  }
}

// 상태 아이콘 클래스
const getStatusIconClass = (row: any) => {
  try {
    const ready = getReadyStatus(row)
    return ready ? 'w-5 h-5 text-green-500' : 'w-5 h-5 text-red-500'
  } catch (error) {
    console.error('Error getting status icon class:', error, row)
    return 'w-5 h-5 text-gray-500'
  }
}

// Ready 상태 확인 함수 (다양한 소스에서 상태 확인)
const getReadyStatus = (row: any) => {
  // 1. 기존 단순 status 필드 체크 (백업용)
  if (row.status === 'True') {
    return true
  }

  // 2. conditions 배열에서 Ready=True 확인
  if (row.conditions && Array.isArray(row.conditions)) {
    const readyCondition = row.conditions.find((condition: any) => condition.type === 'Ready')
    if (readyCondition?.status === 'True') {
      return true
    }
  }

  // 3. 중첩된 status.conditions 체크
  if (row.status && row.status.conditions && Array.isArray(row.status.conditions)) {
    const readyCondition = row.status.conditions.find((condition: any) => condition.type === 'Ready')
    if (readyCondition?.status === 'True') {
      return true
    }
  }

  // 4. predicatorReady나 기타 ready 관련 필드들 체크
  if (row.predicatorReady === true || row.ready === true) {
    return true
  }

  // 기본값: false
  return false
}

// 모델 포맷 확인 함수 (predictorSpec 구조 사용)
const getPredictorType = (row: any) => {
  const predictor = row.predictorSpec
  if (predictor?.model?.modelFormat?.name) {
    return predictor.model.modelFormat.name
  }
  if (predictor?.containers) {
    // vLLM 컨테이너 확인
    const container = predictor.containers[0]
    if (container?.image?.includes('vllm')) {
      return 'LLM'
    }
    return 'custom'
  }
  return 'unknown'
}

// 모델 포맷별 색상
const getPredictorTypeColor = (row: any) => {
  const type = getPredictorType(row)
  switch (type) {
    case 'tensorflow':
      return 'orange'
    case 'pytorch':
      return 'red'
    case 'sklearn':
      return 'yellow'
    case 'xgboost':
      return 'pink'
    case 'lightgbm':
      return 'indigo'
    case 'onnx':
      return 'amber'
    case 'openvino_ir':
      return 'cyan'
    case 'tensorrt':
      return 'fuchsia'
    case 'mlflow':
      return 'blue'
    case 'LLM':
      return 'teal'
    case 'custom':
      return 'lime'
    case 'pmml':
      return 'pink'
    case 'paddle':
      return 'rose'
    default:
      return 'gray'
  }
}

// 런타임 정보 (정확한 모델 포맷명 매핑)
const getRuntime = (row: any) => {
  const predictor = row.predictorSpec
  const modelFormat = predictor?.model?.modelFormat?.name

  // 디버깅용 (필요시 활성화)
  // console.log('Runtime debug:', {
  //   serviceName: row.name,
  //   predictor,
  //   modelFormat,
  //   containers: predictor?.containers,
  //   image: predictor?.containers?.[0]?.image
  // })

  // Custom 컨테이너인 경우 이미지명 반환
  if (predictor?.containers?.[0]?.image) {
    return predictor.containers[0].image
  }

  // 모델 포맷별 런타임 매핑 (정확한 대소문자)
  switch (modelFormat) {
    case 'tensorflow':
      return 'Tensorflow ModelServer'
    case 'pytorch':
      return 'PyTorch ModelServer'
    case 'sklearn':
      return 'Scikit-learn ModelServer'
    case 'xgboost':
      return 'XGBoost ModelServer'
    case 'pmml':
      return 'PMML ModelServer'
    case 'lightgbm':
      return 'LightGBM ModelServer'
    case 'paddle':
      return 'Paddle ModelServer'
    case 'mlflow':
      return 'MLFlow ModelServer'
    case 'onnx':
      return 'ONNX ModelServer'
    default:
      // 기본값이 아닌 경우에 대한 처리
      if (predictor?.containers) {
        return 'Custom Container'
      }
      if (modelFormat) {
        return `${modelFormat} ModelServer`
      }
      return 'KServe ModelServer'
  }
}

// 프로토콜 정보
const getProtocol = (row: any) => {
  const predictor = row.predictorSpec

  if (predictor?.model?.protocolVersion) {
    return predictor.model.protocolVersion
  }

  // Custom 컨테이너인 경우 기본값
  if (predictor?.containers) {
    return 'v1'
  }

  return 'v1'
}

// Storage URI 가져오기 (목록용 - 첫 번째만)
const getStorageUri = (row: any) => {
  const predictor = row.predictorSpec

  // Model 기반인 경우
  if (predictor?.model?.storageUri) {
    return predictor.model.storageUri
  }

  // Container 기반인 경우 (vLLM 등)
  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((env: any) => env.name === 'STORAGE_URI')
    if (storageEnv?.value) {
      const uri = storageEnv.value

      // {model_name}=s3://path 형태로 파싱 (첫 번째만 표시)
      if (uri.includes('=')) {
        const models = uri.split(',').map(item => item.trim())
        const [name, path] = models[0].split('=')
        const remainingCount = models.length - 1
        return `${name} → ${path}${remainingCount > 0 ? ` (+${remainingCount}개)` : ''}`
      }

      // 기존 형태인 경우
      return uri
    }
  }

  return '설정되지 않음'
}

// Storage URI 전체 가져오기 (hover용)
const getStorageUriFull = (row: any) => {
  const predictor = row.predictorSpec

  // Model 기반인 경우
  if (predictor?.model?.storageUri) {
    return predictor.model.storageUri
  }

  // Container 기반인 경우 (vLLM 등)
  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((env: any) => env.name === 'STORAGE_URI')
    if (storageEnv?.value) {
      const uri = storageEnv.value

      // {model_name}=s3://path 형태로 파싱 (전체 표시)
      if (uri.includes('=')) {
        const models = uri.split(',').map(item => item.trim())
        return models.map(model => {
          const [name, path] = model.split('=')
          return `${name} → ${path}`
        }).join('\n')
      }

      // 기존 형태인 경우
      return uri
    }
  }

  return '설정되지 않음'
}

// 시간 포맷팅 (그림과 동일하게)
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } else {
    return 'Today'
  }
}

const deleteEndpoint = async (row: any) => {
  if (confirm(`정말로 '${row.name}' Endpoint를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
    deleteLoading.value = true
    selectedEndpoint.value = row

    try {
      const namespace = row.namespace || 'kubeflow-user-example-com'
      const endpointName = row.name

      // DELETE 요청
      const response = await removeEndpoint(namespace, endpointName)

      // response.code가 200으로 끝나는지 확인
      if (String(response.code).endsWith('200')) {
        alert(`deleted`)
        await loadEndpoints()
      } else {
        alert("오류[" + response.code + "]: " + response.message + ' ' + JSON.stringify(response.result))
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('삭제 중 오류가 발생했습니다: ' + error.message)
    } finally {
      deleteLoading.value = false
      selectedEndpoint.value = null
    }
  }
}

const loadEndpoints = async () => {
  try {
    // null을 전달하면 기본값으로 kubeflow-user-example-com,modelmesh-serving 모두 조회
    const response = await getEndpoints(null)
    data.value = response.result ? response.result.result : []

    // 디버깅 (필요시 주석 해제)
    console.log('Full API response:', response)
    console.log('Extracted data:', data.value)
    if (data.value.length > 0) {
      const firstEndpoint = data.value[0]
      console.log('First endpoint structure:', firstEndpoint)
      console.log('Ready status result:', getReadyStatus(firstEndpoint))
      console.log('Namespace:', firstEndpoint.namespace)
      console.log('Serving type:', getServingType(firstEndpoint))
    }
  } catch (error) {
    console.error('Failed to load endpoints:', error)
    data.value = []
  } finally {
    pending.value = false
  }
}

const reloadEndpoints = () => {
  pending.value = true
  data.value = []
  loadEndpoints()
}

const detail = (row: any) => {
  const namespace = row.namespace || 'kubeflow-user-example-com'
  navigateTo(`/endpoints/detail/${row.name}?namespace=${namespace}`)
}

const runInference = (row: any) => {
  const namespace = row.namespace || 'kubeflow-user-example-com'
  navigateTo(`/endpoints/inference/${row.name}?namespace=${namespace}`)
}

// 서빙 방식 감지 함수 (네임스페이스와 컨테이너 이미지 기반)
const getServingType = (row: any) => {
  // ModelMesh: modelmesh-serving 네임스페이스
  if (row.namespace === 'modelmesh-serving') {
    return 'ModelMesh'
  }

  const predictor = row.predictorSpec
  // vLLM: 커스텀 컨테이너 + vllm 이미지
  if (predictor?.containers?.[0]?.image?.includes('vllm')) {
    return 'vLLM'
  }

  // 나머지는 Standard
  return 'Standard'
}

// 서빙 방식별 색상
const getServingTypeColor = (row: any) => {
  const servingType = getServingType(row)
  switch (servingType) {
    case 'vLLM':
      return 'emerald'
    case 'ModelMesh':
      return 'purple'
    default: // Standard
      return 'gray'
  }
}

const redeploy = (row: any) => {
  const namespace = row.namespace || 'kubeflow-user-example-com'
  navigateTo(`/endpoints/redeploy/${row.name}?namespace=${namespace}`)
}

// 배포 모달 열기
const openDeployModal = (row: any) => {
  selectedEndpoint.value = row

  // 현재 서빙 타입 감지
  const servingType = getServingType(row)
  deployConfig.value.serving_type = servingType.toLowerCase()

  // 기본 전략 설정
  const strategies = deploymentStrategyOptions.value
  if (strategies.length > 0) {
    deployConfig.value.deployment_strategy = strategies[0].value
  }

  deployModalOpen.value = true
}

// 배포 실행
const deploy = async () => {
  if (!selectedEndpoint.value) return

  deploying.value = true

  try {
    const namespace = selectedEndpoint.value.namespace || 'kubeflow-user-example-com'

    // 기존 서비스 정보를 기반으로 InferenceServiceInfo 생성 (스키마에 맞게)
    const inferenceServiceInfo = {
      predictor: {
        service_account_name: 'storage-system-minio-sa'
        // 백엔드에서 기존 설정을 자동으로 채우기 때문에 최소한으로 설정
      },
      sidecar_inject: false
    }

    // 전략별 파라미터 선별 전달
    const canaryPercent = deployConfig.value.deployment_strategy === 'canary'
      ? deployConfig.value.canary_traffic_percent
      : undefined

    const response = await deployInferenceService(
      namespace,
      selectedEndpoint.value.name,
      inferenceServiceInfo,
      deployConfig.value.serving_type,
      deployConfig.value.deployment_strategy,
      canaryPercent // canary 전략일 때만 전달
    )

    if (response.code === 130200) {
      // 배포 성공
      deployModalOpen.value = false

      // deployment_id가 있으면 모니터링 페이지로 이동
      const deploymentId = response.result?.deployment_id
      if (deploymentId) {
        navigateTo(`/endpoints/redeploy/${selectedEndpoint.value.name}?namespace=${namespace}&deployment_id=${deploymentId}`)
      } else {
        // 목록 새로고침
        await loadEndpoints()
      }
    } else {
      alert(`배포 실패: ${response.message}`)
    }
  } catch (error) {
    console.error('배포 실패:', error)
    alert('배포 중 오류가 발생했습니다.')
  } finally {
    deploying.value = false
  }
}

onMounted(() => {
  loadEndpoints()
})

const toolbarLinks = ref([
  [],
  [
    {
      label: '목록 업데이트',
      icon: 'i-heroicons-arrow-path',
      click: reloadEndpoints
    },
    {
      label: '등록',
      icon: 'i-heroicons-plus',
      to: '/endpoints/add'
    },
  ]
])

const endpointColumns = ref([
  {
    key: 'status',
    label: 'Status'
  },
  {
    key: 'name',
    label: 'Name'
  },
  {
    key: 'createdAt',
    label: 'Created at'
  },
  {
    key: 'servingType',
    label: 'Serving Type'
  },
  {
    key: 'deploymentStatus',
    label: 'Deployment Status'
  },
  {
    key: 'predictor',
    label: 'Model Format'
  },
  {
    key: 'runtime',
    label: 'Runtime'
  },
  {
    key: 'protocol',
    label: 'Protocol'
  },
  {
    key: 'storageUri',
    label: 'Storage URI'
  },
  {
    key: 'action',
    label: 'Action'
  }
])
</script>

<style scoped>
.storage-uri-panel {
  white-space: pre-line !important;
  max-width: 400px;
}
</style>