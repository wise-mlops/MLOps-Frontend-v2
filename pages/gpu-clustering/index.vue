<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <!-- 작업 제출 폼 -->
    <div class="mb-6">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">새로운 SLURM 작업 제출</h3>
              <p class="text-sm text-gray-600 mt-1">GPU 클러스터에서 실행할 작업을 제출하세요</p>
            </div>
            <UButton
              @click="showJobForm = !showJobForm"
              :variant="showJobForm ? 'soft' : 'solid'"
              color="primary"
            >
              {{ showJobForm ? '폼 숨기기' : '새 작업 제출' }}
            </UButton>
          </div>
        </template>

        <div v-if="showJobForm" class="space-y-6">
          <!-- 기본 작업 설정 -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900">기본 작업 설정</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormGroup label="작업 이름" required>
                <UInput 
                  v-model="jobForm.jobName" 
                  placeholder="gpu-monitor-test"
                />
              </UFormGroup>
              
              <UFormGroup label="노드 선택">
                <USelect 
                  v-model="jobForm.nodelist"
                  :options="nodeOptions"
                  :loading="loadingNodes"
                  value-attribute="value"
                  option-attribute="label"
                  placeholder="자동 할당"
                />
              </UFormGroup>
              
              <UFormGroup label="노드 개수">
                <UInput 
                  v-model="jobForm.nodes"
                  type="number"
                  min="1"
                  max="10"
                />
              </UFormGroup>
              
              <UFormGroup label="실행 시간">
                <USelect 
                  v-model="jobForm.time"
                  :options="timeOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
              </UFormGroup>
              
              <UFormGroup label="태스크/노드">
                <UInput 
                  v-model="jobForm.ntasksPerNode"
                  type="number"
                  min="1"
                  max="8"
                />
              </UFormGroup>
              
              <UFormGroup label="CPU/태스크">
                <UInput 
                  v-model="jobForm.cpusPerTask"
                  type="number"
                  min="1"
                  max="32"
                />
              </UFormGroup>
              
              <UFormGroup label="GPU/태스크">
                <UInput 
                  v-model="jobForm.gpusPerTask"
                  type="number"
                  min="0"
                  max="8"
                />
              </UFormGroup>
            </div>
          </div>

          <!-- 컨테이너 설정 -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900">컨테이너 설정</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UFormGroup label="컨테이너 이미지" class="md:col-span-2">
                <USelect 
                  v-model="jobForm.containerImage"
                  :options="containerImageOptions"
                  value-attribute="value"
                  option-attribute="label"
                />
                <UInput 
                  v-if="jobForm.containerImage === 'custom'"
                  v-model="jobForm.containerImage"
                  placeholder="custom/image:tag"
                  class="mt-2"
                />
              </UFormGroup>
              
              <UFormGroup label="마운트 경로">
                <UInput 
                  v-model="jobForm.containerMounts"
                  placeholder="/host/path:/container/path"
                />
              </UFormGroup>
              
              <UFormGroup label="작업 디렉토리">
                <UInput 
                  v-model="jobForm.containerWorkdir"
                  placeholder="/container/workdir"
                />
              </UFormGroup>
              
              <UFormGroup label="컨테이너 옵션">
                <div class="space-y-2">
                  <UCheckbox 
                    v-model="jobForm.containerWritable"
                    label="쓰기 가능"
                  />
                  <UCheckbox 
                    v-model="jobForm.noContainerMountHome"
                    label="홈 디렉토리 마운트 안함"
                  />
                </div>
              </UFormGroup>
            </div>
          </div>
          
          <!-- 실행 스크립트 -->
          <div class="space-y-4">
            <h4 class="text-md font-medium text-gray-900">실행 스크립트</h4>
            <UFormGroup label="스크립트 내용" required>
              <UTextarea 
                v-model="jobForm.script"
                placeholder="echo 'Hello GPU World!'"
                :rows="8"
              />
            </UFormGroup>
            <div class="flex gap-2">
              <UButton 
                variant="soft" 
                size="sm"
                @click="loadExampleScript"
              >
                예제 스크립트 로드
              </UButton>
              <UButton 
                variant="soft" 
                size="sm"
                @click="clearScript"
              >
                스크립트 초기화
              </UButton>
            </div>
          </div>
          
          <div class="flex justify-end gap-2 pt-4 border-t">
            <UButton 
              variant="soft" 
              color="gray"
              @click="resetJobForm"
            >
              전체 초기화
            </UButton>
            <UButton 
              @click="submitJob"
              :loading="submitting"
              color="primary"
              :disabled="!jobForm.jobName || !jobForm.script"
            >
              작업 제출
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- 작업 목록 -->
    <UCard>
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">SLURM 작업 목록</h3>
            <p class="text-sm text-gray-600 mt-1">제출된 작업들의 현재 상태를 확인하세요</p>
          </div>
          <UButton
            @click="refreshJobs"
            :loading="loading"
            variant="soft"
            icon="i-heroicons-arrow-path"
          >
            새로고침
          </UButton>
        </div>
      </template>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p class="text-sm text-gray-500 mt-2">작업 목록을 불러오는 중...</p>
        </div>
      </div>

      <div v-else-if="jobs.length === 0" class="text-center py-12">
        <div class="text-gray-400">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">작업이 없습니다</h3>
          <p class="mt-1 text-sm text-gray-500">새로운 SLURM 작업을 제출해보세요.</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div 
          v-for="job in jobs" 
          :key="job.id"
          class="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4 cursor-pointer flex-1" @click="goToJobDetail(job.id)">
              <div class="flex-shrink-0">
                <div 
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  :class="getJobStatusColor(job.status)"
                >
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-900">{{ job.name }}</h4>
                <p class="text-xs text-gray-500">작업 ID: {{ job.id }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-gray-600">GPU: {{ extractGpuInfo(job) }}</span>
                  <span class="text-xs text-gray-400">•</span>
                  <span class="text-xs text-gray-600">노드: {{ job.node || 'N/A' }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right">
                <div class="flex flex-col items-end gap-1">
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getJobStatusClass(job.status)"
                  >
                    {{ getJobStatusText(job.status) }}
                  </span>
                  <!-- 만료 예정 경고 -->
                  <span 
                    v-if="isJobExpiringSoon(job) && job.status !== 'COMPLETED'"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                  >
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    곧 만료
                  </span>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ formatTime(job.submitTime) }}</p>
              </div>
              <UDropdown :items="getJobActions(job)">
                <UButton 
                  variant="ghost" 
                  color="gray" 
                  icon="i-heroicons-ellipsis-vertical"
                  size="sm"
                />
              </UDropdown>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- 로그 출력 모달 -->
    <UModal v-model="showOutputModal" :ui="{ width: 'w-full max-w-4xl' }">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">작업 출력 로그 (ID: {{ selectedJobId }})</h3>
            <UButton
              @click="showJobOutput(selectedJobId)"
              :loading="loadingJobOutput"
              variant="soft"
              size="sm"
              icon="i-heroicons-arrow-path"
            >
              새로고침
            </UButton>
          </div>
        </template>
        
        <div class="space-y-4">
          <div v-if="loadingJobOutput" class="flex justify-center items-center py-8">
            <div class="text-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p class="text-sm text-gray-500 mt-2">로그를 불러오는 중...</p>
            </div>
          </div>
          
          <div v-else class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div class="flex items-center justify-between mb-2 pb-2 border-b border-gray-700">
              <span class="text-xs text-gray-400">작업 ID: {{ selectedJobId }}</span>
              <span class="text-xs text-gray-400">{{ new Date().toLocaleTimeString('ko-KR') }}</span>
            </div>
            <pre class="whitespace-pre-wrap text-xs leading-relaxed">{{ selectedJobOutput || '아직 출력이 없습니다.' }}</pre>
          </div>
        </div>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
const { submitJob: submitSlurmJob, getJobStatus, getJobOutput } = useSlurmAPI()

// 페이지 기본 설정
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'GPU Clustering' }
])

const pageTitle = ref('GPU Clustering')

// 상태 관리
const loading = ref(false)
const submitting = ref(false)
const showJobForm = ref(false)
const jobs = ref([])
const availableNodes = ref([])
const loadingNodes = ref(false)
const showOutputModal = ref(false)
const selectedJobOutput = ref('')
const selectedJobId = ref('')
const loadingJobOutput = ref(false)

// 작업 제출 폼
const jobForm = ref({
  // Job 설정
  jobName: '',
  nodes: 1,
  ntasksPerNode: 1,
  cpusPerTask: 4,
  gpusPerTask: 1,
  time: '00:10:00',
  nodelist: '',
  
  // 컨테이너 설정
  containerImage: 'pytorch/pytorch:2.4.1-cuda12.1-cudnn9-devel',
  containerMounts: '/purestorage/project/MLOPS/:/purestorage/project/MLOPS/',
  containerWorkdir: '/purestorage/project/MLOPS/',
  containerWritable: true,
  noContainerMountHome: true,
  
  // 스크립트
  script: ''
})

// 옵션들
const timeOptions = [
  { label: '5분', value: '00:05:00' },
  { label: '10분', value: '00:10:00' },
  { label: '30분', value: '00:30:00' },
  { label: '1시간', value: '01:00:00' },
  { label: '2시간', value: '02:00:00' },
  { label: '6시간', value: '06:00:00' },
  { label: '12시간', value: '12:00:00' },
  { label: '24시간', value: '24:00:00' }
]

const containerImageOptions = [
  { label: 'PyTorch 2.4.1 (CUDA 12.1)', value: 'pytorch/pytorch:2.4.1-cuda12.1-cudnn9-devel' },
  { label: 'TensorFlow 2.15', value: 'tensorflow/tensorflow:2.15.0-gpu' },
  { label: 'NVIDIA PyTorch', value: 'nvcr.io/nvidia/pytorch:24.02-py3' },
  { label: 'Ubuntu 22.04 CUDA', value: 'nvidia/cuda:12.1-devel-ubuntu22.04' },
  { label: '사용자 정의', value: 'custom' }
]

// 노드 옵션들 (computed)
const nodeOptions = computed(() => {
  const options = [
    { label: '자동 할당', value: '' }
  ]
  
  availableNodes.value.forEach(node => {
    options.push({
      label: `${node.name} (${node.status})`,
      value: node.name
    })
  })
  
  return options
})

// 툴바 설정
const toolbarLinks = ref([
  [],
  [{
    label: '새로고침',
    icon: 'i-heroicons-arrow-path',
    click: () => refreshJobs(),
    loading: computed(() => loading.value)
  }, {
    label: '만료 체크',
    icon: 'i-heroicons-clock',
    click: () => debugExpiration(),
    variant: 'soft',
    color: 'gray'
  }]
])

// 만료 체크 함수
const debugExpiration = () => {
  const allJobs = getJobsFromLocalStorage()
  const activeJobs = allJobs.filter(job => !isJobExpired(job))
  
  if (activeJobs.length !== allJobs.length) {
    updateJobsInLocalStorage(activeJobs)
    jobs.value = activeJobs.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime())
  }
}

// 사용 가능한 노드 자동 선택 함수
const selectAvailableNode = async () => {
  try {
    // 최신 노드 정보 가져오기
    await fetchAvailableNodes()
    
    // 사용 가능한 노드들 필터링 (k8s_dummy와 slurm_dummy가 모두 false인 노드)
    const availableNodeList = availableNodes.value.filter(node => node.available)
    
    if (availableNodeList.length === 0) {
      console.warn('사용 가능한 노드가 없습니다')
      return null
    }
    
    // 라운드 로빈 방식으로 노드 선택 (간단한 로드 밸런싱)
    const randomIndex = Math.floor(Math.random() * availableNodeList.length)
    const selectedNode = availableNodeList[randomIndex]
    
    console.log(`자동 할당: ${availableNodeList.length}개 노드 중 ${selectedNode.name} 선택`)
    return selectedNode.name
  } catch (error) {
    console.error('노드 자동 선택 실패:', error)
    return null
  }
}

// 메서드
const submitJob = async () => {
  if (!jobForm.value.jobName || !jobForm.value.script) {
    return
  }

  submitting.value = true
  try {
    // 자동 할당인 경우 사용 가능한 노드 중에서 선택
    let selectedNode = jobForm.value.nodelist
    if (!selectedNode) {
      selectedNode = await selectAvailableNode()
      console.log('자동 할당된 노드:', selectedNode)
    }
    
    // 새로운 API 구조에 맞게 데이터 구성
    const jobData = {
      script: buildSrunCommand(),
      job: {
        "job-name": jobForm.value.jobName,
        "nodes": jobForm.value.nodes,
        "ntasks-per-node": jobForm.value.ntasksPerNode,
        "cpus-per-task": jobForm.value.cpusPerTask,
        "gpus-per-task": jobForm.value.gpusPerTask,
        "time": jobForm.value.time,
        ...(selectedNode && { "nodelist": selectedNode })
      }
    }

    const result = await submitSlurmJob(jobData)
    console.log('Job submitted:', result)
    
    // 제출된 작업을 로컬 스토리지에 저장
    if (result && result.job_id) {
      // 총 GPU 개수 계산: 노드 수 × 태스크/노드 × GPU/태스크
      const totalGpus = jobForm.value.nodes * jobForm.value.ntasksPerNode * jobForm.value.gpusPerTask
      
      saveJobToLocalStorage({
        id: result.job_id.toString(),
        name: jobForm.value.jobName,
        status: 'PENDING',
        submitTime: new Date().toISOString(),
        node: jobForm.value.nodelist || null,
        gpus: totalGpus, // 총 GPU 개수로 저장
        cpus: jobForm.value.cpusPerTask,
        time: jobForm.value.time,
        containerImage: jobForm.value.containerImage
      })
    }
    
    // 폼 초기화 및 목록 새로고침
    resetJobForm()
    showJobForm.value = false
    await refreshJobs()
    
  } catch (error) {
    console.error('Job submission failed:', error)
  } finally {
    submitting.value = false
  }
}

const resetJobForm = () => {
  jobForm.value = {
    // Job 설정
    jobName: '',
    nodes: 1,
    ntasksPerNode: 1,
    cpusPerTask: 4,
    gpusPerTask: 1,
    time: '00:10:00',
    nodelist: '',
    
    // 컨테이너 설정
    containerImage: 'pytorch/pytorch:2.4.1-cuda12.1-cudnn9-devel',
    containerMounts: '/purestorage/project/MLOPS/:/purestorage/project/MLOPS/',
    containerWorkdir: '/purestorage/project/MLOPS/',
    containerWritable: true,
    noContainerMountHome: true,
    
    // 스크립트
    script: ''
  }
}

// srun 명령어 빌드
const buildSrunCommand = () => {
  let srunCmd = `srun --container-image=${jobForm.value.containerImage}`
  
  if (jobForm.value.containerMounts) {
    srunCmd += ` --container-mounts=${jobForm.value.containerMounts}`
  }
  
  if (jobForm.value.containerWorkdir) {
    srunCmd += ` --container-workdir=${jobForm.value.containerWorkdir}`
  }
  
  if (jobForm.value.containerWritable) {
    srunCmd += ` --container-writable`
  }
  
  if (jobForm.value.noContainerMountHome) {
    srunCmd += ` --no-container-mount-home`
  }
  
  srunCmd += ` bash -lc '${jobForm.value.script.replace(/'/g, "'\"'\"'")}'`
  
  return srunCmd
}

// 노드 목록 가져오기
const fetchAvailableNodes = async () => {
  loadingNodes.value = true
  try {
    const { getNodes } = useResourceAPI()
    const result = await getNodes()
    
    if (result && result.nodes) {
      availableNodes.value = Object.entries(result.nodes).map(([name, info]) => ({
        name,
        status: getNodeStatusText(info),
        available: !info.k8s_dummy && !info.slurm_dummy
      }))
    }
  } catch (error) {
    console.error('Failed to fetch nodes:', error)
    availableNodes.value = []
  } finally {
    loadingNodes.value = false
  }
}

// 노드 상태 텍스트 (간단 버전)
const getNodeStatusText = (nodeInfo) => {
  if (!nodeInfo.k8s_dummy && !nodeInfo.slurm_dummy) {
    return '사용가능'
  } else if (nodeInfo.k8s_dummy && !nodeInfo.slurm_dummy) {
    return 'SLURM 활성'
  } else if (!nodeInfo.k8s_dummy && nodeInfo.slurm_dummy) {
    return 'K8s 활성'
  } else {
    return '둘 다 활성'
  }
}

// 예제 스크립트 로드
const loadExampleScript = () => {
  jobForm.value.script = `echo '--- GPU Busy Test (PyTorch + nvidia-smi Monitor) ---'
python - << "PY" &
import torch, time
assert torch.cuda.is_available(), "CUDA not available"
print("GPU:", torch.cuda.get_device_name(0), flush=True)
a = torch.randn(8192, 8192, device="cuda")
b = torch.randn(8192, 8192, device="cuda")
t = time.time()
while time.time() - t < 45:
    c = a @ b
    torch.cuda.synchronize()
print("[PY] done", flush=True)
PY
PY_PID=$!

# nvidia-smi 모니터링 루프 (3초마다 10회)
for i in {1..10}; do
  echo "--- nvidia-smi ($i/10) ---"
  nvidia-smi | head -n 25
  sleep 3
done

# Python 작업 종료 대기
wait $PY_PID
echo '--- Test Complete ---'`
}

const clearScript = () => {
  jobForm.value.script = ''
}

const refreshJobs = async () => {
  loading.value = true
  try {
    // 로컬 스토리지에서 저장된 작업들 가져오기
    const savedJobs = getJobsFromLocalStorage()
    
    // 만료된 작업들 먼저 필터링
    const activeJobs = savedJobs.filter(job => !isJobExpired(job))
    
    // 만료된 작업이 있다면 로컬 스토리지에서도 제거
    if (activeJobs.length !== savedJobs.length) {
      updateJobsInLocalStorage(activeJobs)
    }
    
    // 각 작업의 현재 상태를 API로 확인
    const updatedJobs = await Promise.allSettled(
      activeJobs.map(async (job) => {
        try {
          const result = await getJobStatus(job.id)
          
          // AllocTRES에서 실제 GPU 개수 추출 (상세보기와 동일한 로직)
          let updatedGpus = job.gpus // 기본값은 기존 저장된 값
          if (result.details?.AllocTRES) {
            const allocTres = result.details.AllocTRES
            const gpuMatches = allocTres.match(/gres\/gpu:?\w*=(\d+)/g)
            
            if (gpuMatches && gpuMatches.length > 0) {
              updatedGpus = gpuMatches.reduce((total, match) => {
                const count = parseInt(match.match(/=(\d+)/)[1]) || 0
                return total + count
              }, 0)
            }
          }
          
          return {
            ...job,
            status: result.details?.JobState || job.status,
            node: result.details?.NodeList || job.node,
            gpus: updatedGpus, // 실제 할당된 GPU 개수로 업데이트
            lastUpdated: new Date().toISOString()
          }
        } catch (error) {
          // API 호출 실패 시 만료 여부 재확인
          if (isJobExpired(job)) {
            return null // 만료된 작업은 null로 표시
          }
          // 만료되지 않았다면 기존 정보 유지
          return job
        }
      })
    )
    
    // 성공한 결과만 필터링 (null 제외)
    jobs.value = updatedJobs
      .filter(result => result.status === 'fulfilled' && result.value !== null)
      .map(result => result.value)
      .sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime()) // 최신순 정렬
    
    // 업데이트된 정보를 로컬 스토리지에 다시 저장
    updateJobsInLocalStorage(jobs.value)
    
  } catch (error) {
    console.error('Failed to refresh jobs:', error)
    // 오류 발생 시에도 로컬 스토리지 데이터는 보여줌 (만료된 것 제외)
    const savedJobs = getJobsFromLocalStorage()
    jobs.value = savedJobs.filter(job => !isJobExpired(job))
  } finally {
    loading.value = false
  }
}

const goToJobDetail = (jobId) => {
  navigateTo(`/gpu-clustering/jobs/${jobId}`)
}

// 로컬 스토리지 관리 함수들
const STORAGE_KEY = 'slurm-jobs'

const saveJobToLocalStorage = (job) => {
  try {
    const existingJobs = getJobsFromLocalStorage()
    const updatedJobs = [job, ...existingJobs.filter(j => j.id !== job.id)]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs))
  } catch (error) {
    console.error('Failed to save job to localStorage:', error)
  }
}

const getJobsFromLocalStorage = () => {
  try {
    const jobs = localStorage.getItem(STORAGE_KEY)
    return jobs ? JSON.parse(jobs) : []
  } catch (error) {
    console.error('Failed to get jobs from localStorage:', error)
    return []
  }
}

const updateJobsInLocalStorage = (jobs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs))
  } catch (error) {
    console.error('Failed to update jobs in localStorage:', error)
  }
}

const removeJobFromLocalStorage = (jobId) => {
  try {
    const existingJobs = getJobsFromLocalStorage()
    const updatedJobs = existingJobs.filter(job => job.id !== jobId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedJobs))
    return updatedJobs
  } catch (error) {
    console.error('Failed to remove job from localStorage:', error)
    return getJobsFromLocalStorage()
  }
}

// 작업 액션 메뉴
const getJobActions = (job) => {
  return [[
    {
      label: '상세 보기',
      icon: 'i-heroicons-eye',
      click: () => goToJobDetail(job.id)
    },
    {
      label: '로그 보기',
      icon: 'i-heroicons-document-text',
      click: () => showJobOutput(job.id)
    },
    {
      label: '목록에서 제거',
      icon: 'i-heroicons-trash',
      click: () => removeJobFromList(job.id)
    }
  ]]
}

const removeJobFromList = async (jobId) => {
  try {
    jobs.value = jobs.value.filter(job => job.id !== jobId)
    removeJobFromLocalStorage(jobId)
  } catch (error) {
    console.error('Failed to remove job from list:', error)
  }
}

const showJobOutput = async (jobId) => {
  selectedJobId.value = jobId
  showOutputModal.value = true
  loadingJobOutput.value = true
  
  try {
    const result = await getJobOutput(jobId)
    selectedJobOutput.value = result.output || '출력이 없습니다.'
  } catch (error) {
    console.error('Failed to fetch job output:', error)
    selectedJobOutput.value = '출력을 가져올 수 없습니다.'
  } finally {
    loadingJobOutput.value = false
  }
}

// 작업 만료 체크 함수
const isJobExpired = (job) => {
  if (!job.submitTime || !job.time) {
    return false // 필수 정보가 없으면 만료되지 않은 것으로 간주
  }
  
  try {
    const submitTime = new Date(job.submitTime)
    const timeLimit = job.time // "00:10:00" 형태
    
    // 시간 제한을 밀리초로 변환
    const timeParts = timeLimit.split(':')
    const hours = parseInt(timeParts[0]) || 0
    const minutes = parseInt(timeParts[1]) || 0
    const seconds = parseInt(timeParts[2]) || 0
    const timeLimitMs = (hours * 3600 + minutes * 60 + seconds) * 1000
    
    // 예상 종료 시간 계산
    const expectedEndTime = new Date(submitTime.getTime() + timeLimitMs)
    const now = new Date()
    
    // 버퍼 시간 2분
    const bufferTime = 2 * 60 * 1000 // 2분 버퍼
    const isExpired = now.getTime() > (expectedEndTime.getTime() + bufferTime)
    
    return isExpired
  } catch (error) {
    return false
  }
}

// 만료 예정 작업 체크 (UI에서 경고 표시용)
const isJobExpiringSoon = (job) => {
  if (!job.submitTime || !job.time) {
    return false
  }
  
  try {
    const submitTime = new Date(job.submitTime)
    const timeLimit = job.time
    
    const timeParts = timeLimit.split(':')
    const hours = parseInt(timeParts[0]) || 0
    const minutes = parseInt(timeParts[1]) || 0  
    const seconds = parseInt(timeParts[2]) || 0
    const timeLimitMs = (hours * 3600 + minutes * 60 + seconds) * 1000
    
    const expectedEndTime = new Date(submitTime.getTime() + timeLimitMs)
    const now = new Date()
    
    // 10분 이내에 만료 예정이면 true
    const warningTime = 10 * 60 * 1000 // 10분
    return (expectedEndTime.getTime() - now.getTime()) <= warningTime && now < expectedEndTime
  } catch (error) {
    return false
  }
}

// 유틸리티 함수들
const getJobStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return 'bg-green-500'
    case 'PENDING': return 'bg-yellow-500'
    case 'COMPLETED': return 'bg-blue-500'
    case 'FAILED': return 'bg-red-500'
    case 'CANCELLED': return 'bg-gray-500'
    default: return 'bg-gray-400'
  }
}

const getJobStatusClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return 'bg-green-100 text-green-800'
    case 'PENDING': return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED': return 'bg-blue-100 text-blue-800'
    case 'FAILED': return 'bg-red-100 text-red-800'
    case 'CANCELLED': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getJobStatusText = (status) => {
  switch (status?.toUpperCase()) {
    case 'RUNNING': return '실행 중'
    case 'PENDING': return '대기 중'
    case 'COMPLETED': return '완료'
    case 'FAILED': return '실패'
    case 'CANCELLED': return '취소됨'
    default: return '알 수 없음'
  }
}

const extractGpuInfo = (job) => {
  // job.gpus 필드가 있으면 사용 (로컬 저장된 데이터)
  if (job.gpus) {
    return `GPU ${job.gpus}개`
  }
  
  // gres 필드에서 GPU 정보 추출 (다중 노드 지원)
  if (job.gres) {
    const gpuMatches = job.gres.match(/gpu:?\w*:?(\d+)/g)
    if (gpuMatches && gpuMatches.length > 0) {
      // 모든 GPU 개수를 합산
      const totalGpus = gpuMatches.reduce((total, match) => {
        const countMatch = match.match(/:(\d+)$/)
        const count = countMatch ? parseInt(countMatch[1]) : 1
        return total + count
      }, 0)
      
      return `GPU ${totalGpus}개`
    }
    
    // 단순 gpu 패턴 (숫자 없는 경우)
    if (job.gres.includes('gpu')) {
      return 'GPU 1개'
    }
  }
  
  return 'N/A'
}

const formatTime = (timeString) => {
  try {
    const date = new Date(timeString)
    return date.toLocaleString('ko-KR')
  } catch {
    return timeString || 'N/A'
  }
}

// 생명주기
onMounted(() => {
  // 초기 로딩 시 로컬 스토리지 데이터 먼저 표시 (만료된 것 제외)
  const savedJobs = getJobsFromLocalStorage()
  jobs.value = savedJobs.filter(job => !isJobExpired(job))
  
  // 만료된 작업이 있다면 로컬 스토리지 업데이트
  if (jobs.value.length !== savedJobs.length) {
    updateJobsInLocalStorage(jobs.value)
  }
  
  // 노드 목록과 작업 상태 업데이트
  fetchAvailableNodes()
  refreshJobs()
  
  // 30초마다 자동으로 상태 업데이트 (만료 체크 포함)
  const interval = setInterval(() => {
    if (!loading.value) {
      refreshJobs() // 이미 만료 체크 로직이 포함됨
      fetchAvailableNodes()
    }
  }, 30000)
  
  // 2분마다 만료된 작업 정리
  const cleanupInterval = setInterval(() => {
    const currentJobs = getJobsFromLocalStorage()
    const activeJobs = currentJobs.filter(job => !isJobExpired(job))
    
    if (activeJobs.length !== currentJobs.length) {
      updateJobsInLocalStorage(activeJobs)
      jobs.value = activeJobs.sort((a, b) => new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime())
    }
  }, 2 * 60 * 1000) // 2분마다
  
  // 컴포넌트 언마운트 시 인터벌 정리
  onUnmounted(() => {
    clearInterval(interval)
    clearInterval(cleanupInterval)
  })
})
</script>