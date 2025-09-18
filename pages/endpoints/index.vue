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
      <UBadge :label="getPredictorType(row)" :color="getPredictorTypeColor(row)" />
    </template>
    <template #servingType-data="{ row }">
      <UBadge :label="getServingType(row)" :color="getServingTypeColor(row)" />
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
          <div class="text-wrap p-4">
            {{ getStorageUri(row) }}
          </div>
        </template>
      </UPopover>
    </template>
    <template #action-data="{ row }">
      <div class="flex items-center space-x-1">
        <UTooltip text="인퍼런스">
          <UButton
            @click="runInference(row.name)"
            icon="i-heroicons-play"
            variant="ghost"
            size="sm"
          />
        </UTooltip>
        <UTooltip text="상세보기">
          <UButton
            @click="detail(row.name)"
            icon="i-heroicons-eye"
            variant="ghost"
            size="sm"
          />
        </UTooltip>
        <UTooltip text="재배포">
          <UButton
            @click="redeploy(row.name)"
            icon="i-heroicons-arrow-path"
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

// 상태 아이콘 가져오기 (API 응답의 status 필드 사용)
const getStatusIcon = (row: any) => {
  return row.status === 'True' ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'
}

// 상태 아이콘 클래스
const getStatusIconClass = (row: any) => {
  return row.status === 'True' ? 'w-5 h-5 text-green-500' : 'w-5 h-5 text-red-500'
}

// 예측기 타입 확인 함수 (predictorSpec 구조 사용)
const getPredictorType = (row: any) => {
  const predictor = row.predictorSpec
  if (predictor?.model?.modelFormat?.name) {
    return predictor.model.modelFormat.name
  }
  if (predictor?.containers) {
    return 'custom'
  }
  return 'unknown'
}

// 예측기 타입별 색상
const getPredictorTypeColor = (row: any) => {
  const type = getPredictorType(row)
  switch (type) {
    case 'tensorflow':
      return 'orange'
    case 'pytorch':
      return 'red'
    case 'sklearn':
      return 'purple'
    case 'xgboost':
      return 'yellow'
    case 'pmml':
      return 'pink'
    case 'lightgbm':
      return 'lime'
    case 'paddle':
      return 'cyan'
    case 'mlflow':
      return 'blue'
    case 'onnx':
      return 'indigo'
    case 'custom':
      return 'green'
    default:
      return 'gray'
  }
}

// 런타임 정보 (정확한 모델 포맷명 매핑)
const getRuntime = (row: any) => {
  const predictor = row.predictorSpec
  const modelFormat = predictor?.model?.modelFormat?.name

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

// Storage URI 가져오기
const getStorageUri = (row: any) => {
  const predictor = row.predictorSpec

  // Model 기반인 경우
  if (predictor?.model?.storageUri) {
    return predictor.model.storageUri
  }

  // Container 기반인 경우 환경변수에서 STORAGE_URI 찾기
  if (predictor?.containers?.[0]?.env) {
    const storageEnv = predictor.containers[0].env.find((env: any) => env.name === 'STORAGE_URI')
    if (storageEnv?.value) {
      return storageEnv.value
    }
  }

  return ''
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
      const namespace = 'kubeflow-user-example-com'
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
    const response = await getEndpoints('kubeflow-user-example-com')
    data.value = response.result ? response.result.result : []
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

const detail = (endpointName: string) => {
  navigateTo(`/endpoints/detail/${endpointName}`)
}

const runInference = (endpointName: string) => {
  navigateTo(`/endpoints/inference/${endpointName}`)
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
      return 'blue'
    case 'ModelMesh':
      return 'purple'
    default: // Standard
      return 'gray'
  }
}

const redeploy = (endpointName: string) => {
  navigateTo(`/endpoints/redeploy/${endpointName}`)
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
    key: 'predictor',
    label: 'Predictor'
  },
  {
    key: 'servingType',
    label: 'Serving Type'
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