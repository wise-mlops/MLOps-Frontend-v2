<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <!-- 탭 네비게이션 -->
    <div class="mb-6">
      <UCard>
        <div class="flex border-b border-gray-200">
          <button
            @click="activeTab = 'internal'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'internal' 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500"></div>
              Kubernetes GPU 모니터링
            </div>
          </button>
          <button
            @click="activeTab = 'external'"
            :class="[
              'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'external' 
                ? 'border-blue-500 text-blue-600 bg-blue-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full transition-colors" :class="resourceHealth ? 'bg-green-500' : 'bg-yellow-500'"></div>
              Slurm GPU 모니터링
            </div>
          </button>
        </div>
      </UCard>
    </div>

    <!-- 내부 GPU 모니터링 탭 -->
    <div v-if="activeTab === 'internal'">
      <!-- 연결 상태 및 필터 -->
      <div class="mb-6">
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Kubernetes GPU 모니터링</h3>
                <p class="text-sm text-gray-600 mt-1">Kubernetes 클러스터 내 GPU 장비들의 실시간 성능 모니터링</p>
              </div>
            </div>
          </template>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full transition-colors" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
                <span class="text-sm text-gray-600">{{ isConnected ? 'Prometheus 연결됨' : 'Prometheus 연결 끊김' }}</span>
              </div>
              <div class="flex gap-1">
                <UButton
                  v-for="period in timePeriods"
                  :key="period.value"
                  @click="changePeriod(period.value)"
                  :variant="selectedPeriod === period.value ? 'solid' : 'soft'"
                  :color="selectedPeriod === period.value ? 'primary' : 'gray'"
                  size="sm"
                >
                  {{ period.label }}
                </UButton>
              </div>
            </div>
            <USelectMenu
              v-model="selectedInstanceFilter"
              :options="instanceOptions"
              value-attribute="value"
              option-attribute="label"
              placeholder="인스턴스 선택"
              class="w-48"
              @change="onInstanceFilterChange"
            />
          </div>
        </UCard>
      </div>

      <!-- GPU 메트릭 대시보드 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <!-- GPU Temperature -->
      <UCard class="metric-panel">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">GPU Temperature</h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600">Avg:</span>
              <span class="text-xl font-bold text-blue-600">{{ avgTemperature.toFixed(1) }}°C</span>
            </div>
          </div>
        </template>
        <div class="flex flex-col">
          <div class="p-4 h-64">
            <canvas ref="tempChart"></canvas>
          </div>
          <div class="p-4 pt-0">
            <div class="table-headers">
              <span></span>
              <span>Instance</span>
              <span>GPU</span>
              <span>Max</span>
              <span>Avg</span>
              <span>Current</span>
            </div>
            <div class="space-y-1">
              <div v-for="item in aggregatedData.temperature" :key="item.displayKey" class="table-row">
                <div class="flex justify-center">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getUniqueColor(item.displayKey) }"></div>
                </div>
                <div class="text-center">
                  <UTooltip :text="item.hostname">
                    <span class="cursor-help text-xs truncate">{{ formatInstanceName(item.hostname) }}</span>
                  </UTooltip>
                </div>
                <span class="text-center text-xs">{{ item.gpuDisplay }}</span>
                <span class="text-center text-xs font-mono">{{ item.maxValue }}°C</span>
                <span class="text-center text-xs font-mono">{{ item.avgValue }}°C</span>
                <span class="text-center text-xs font-bold font-mono">{{ item.currentValue }}°C</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- GPU Power Usage -->
      <UCard class="metric-panel">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">GPU Power Usage</h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600">Total:</span>
              <span class="text-xl font-bold text-blue-600">{{ totalPower.toFixed(1) }} W</span>
            </div>
          </div>
        </template>
        <div class="flex flex-col">
          <div class="p-4 h-64">
            <canvas ref="powerChart"></canvas>
          </div>
          <div class="p-4 pt-0">
            <div class="table-headers">
              <span></span>
              <span>Instance</span>
              <span>GPU</span>
              <span>Max</span>
              <span>Avg</span>
              <span>Current</span>
            </div>
            <div class="space-y-1">
              <div v-for="item in aggregatedData.power" :key="item.displayKey" class="table-row">
                <div class="flex justify-center">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getUniqueColor(item.displayKey) }"></div>
                </div>
                <div class="text-center">
                  <UTooltip :text="item.hostname">
                    <span class="cursor-help text-xs truncate">{{ formatInstanceName(item.hostname) }}</span>
                  </UTooltip>
                </div>
                <span class="text-center text-xs">{{ item.gpuDisplay }}</span>
                <span class="text-center text-xs font-mono">{{ item.maxValue }} W</span>
                <span class="text-center text-xs font-mono">{{ item.avgValue }} W</span>
                <span class="text-center text-xs font-bold font-mono">{{ item.currentValue }} W</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- GPU Framebuffer Memory -->
      <UCard class="metric-panel">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">GPU Framebuffer Mem Used</h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600">Total:</span>
              <span class="text-xl font-bold text-blue-600">{{ totalMemory.toFixed(1) }} GB</span>
            </div>
          </div>
        </template>
        <div class="flex flex-col">
          <div class="p-4 h-64">
            <canvas ref="memoryChart"></canvas>
          </div>
          <div class="p-4 pt-0">
            <div class="table-headers">
              <span></span>
              <span>Instance</span>
              <span>GPU</span>
              <span>Max</span>
              <span>Avg</span>
              <span>Current</span>
            </div>
            <div class="space-y-1">
              <div v-for="item in aggregatedData.frameBufferUsed" :key="item.displayKey" class="table-row">
                <div class="flex justify-center">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getUniqueColor(item.displayKey) }"></div>
                </div>
                <div class="text-center">
                  <UTooltip :text="item.hostname">
                    <span class="cursor-help text-xs truncate">{{ formatInstanceName(item.hostname) }}</span>
                  </UTooltip>
                </div>
                <span class="text-center text-xs">{{ item.gpuDisplay }}</span>
                <span class="text-center text-xs font-mono">{{ formatMemoryValue(item.maxValue) }}</span>
                <span class="text-center text-xs font-mono">{{ formatMemoryValue(item.avgValue) }}</span>
                <span class="text-center text-xs font-bold font-mono">{{ formatMemoryValue(item.currentValue) }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- GPU SM Clocks -->
      <UCard class="metric-panel">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">GPU SM Clocks</h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600">Avg:</span>
              <span class="text-xl font-bold text-blue-600">{{ formatClockValue(avgClock) }}</span>
            </div>
          </div>
        </template>
        <div class="flex flex-col">
          <div class="p-4 h-64">
            <canvas ref="clockChart"></canvas>
          </div>
          <div class="p-4 pt-0">
            <div class="table-headers">
              <span></span>
              <span>Instance</span>
              <span>GPU</span>
              <span>Max</span>
              <span>Avg</span>
              <span>Current</span>
            </div>
            <div class="space-y-1">
              <div v-for="item in aggregatedData.smClock" :key="item.displayKey" class="table-row">
                <div class="flex justify-center">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getUniqueColor(item.displayKey) }"></div>
                </div>
                <div class="text-center">
                  <UTooltip :text="item.hostname">
                    <span class="cursor-help text-xs truncate">{{ formatInstanceName(item.hostname) }}</span>
                  </UTooltip>
                </div>
                <span class="text-center text-xs">{{ item.gpuDisplay }}</span>
                <span class="text-center text-xs font-mono">{{ formatClockValue(item.maxValue) }}</span>
                <span class="text-center text-xs font-mono">{{ formatClockValue(item.avgValue) }}</span>
                <span class="text-center text-xs font-bold font-mono">{{ formatClockValue(item.currentValue) }}</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- GPU Utilization -->
      <UCard class="metric-panel">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">GPU Utilization</h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600">Avg:</span>
              <span class="text-xl font-bold text-blue-600">{{ avgUtilization.toFixed(1) }}%</span>
            </div>
          </div>
        </template>
        <div class="flex flex-col">
          <div class="p-4 h-64">
            <canvas ref="utilizationChart"></canvas>
          </div>
          <div class="p-4 pt-0">
            <div class="table-headers">
              <span></span>
              <span>Instance</span>
              <span>GPU</span>
              <span>Max</span>
              <span>Avg</span>
              <span>Current</span>
            </div>
            <div class="space-y-1">
              <div v-for="item in aggregatedData.utilization" :key="item.displayKey" class="table-row">
                <div class="flex justify-center">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getUniqueColor(item.displayKey) }"></div>
                </div>
                <div class="text-center">
                  <UTooltip :text="item.hostname">
                    <span class="cursor-help text-xs truncate">{{ formatInstanceName(item.hostname) }}</span>
                  </UTooltip>
                </div>
                <span class="text-center text-xs">{{ item.gpuDisplay }}</span>
                <span class="text-center text-xs font-mono">{{ item.maxValue }}%</span>
                <span class="text-center text-xs font-mono">{{ item.avgValue }}%</span>
                <span class="text-center text-xs font-bold font-mono">{{ item.currentValue }}%</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Tensor Core Utilization -->
      <UCard class="metric-panel">
        <template #header>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900">Tensor Core Utilization</h3>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-600">Avg:</span>
              <span class="text-xl font-bold text-blue-600">{{ avgTensorUtil.toFixed(1) }}%</span>
            </div>
          </div>
        </template>
        <div class="flex flex-col">
          <div class="p-4 h-64">
            <canvas ref="tensorChart"></canvas>
          </div>
          <div class="p-4 pt-0">
            <div class="table-headers">
              <span></span>
              <span>Instance</span>
              <span>GPU</span>
              <span>Max</span>
              <span>Avg</span>
              <span>Current</span>
            </div>
            <div class="space-y-1">
              <div v-for="item in aggregatedData.tensorUtil" :key="item.displayKey" class="table-row">
                <div class="flex justify-center">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getUniqueColor(item.displayKey) }"></div>
                </div>
                <div class="text-center">
                  <UTooltip :text="item.hostname">
                    <span class="cursor-help text-xs truncate">{{ formatInstanceName(item.hostname) }}</span>
                  </UTooltip>
                </div>
                <span class="text-center text-xs">{{ item.gpuDisplay }}</span>
                <span class="text-center text-xs font-mono">{{ item.maxValue }}%</span>
                <span class="text-center text-xs font-mono">{{ item.avgValue }}%</span>
                <span class="text-center text-xs font-bold font-mono">{{ item.currentValue }}%</span>
              </div>
            </div>
          </div>
        </div>
      </UCard>
      </div>
    </div>

    <!-- 외부 리소스 탭 -->
    <div v-if="activeTab === 'external'">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Slurm GPU 모니터링</h3>
              <p class="text-sm text-gray-600 mt-1">Slurm 워크로드 매니저를 통한 GPU 리소스 관리 및 모니터링</p>
              <div v-if="nodesInfo && nodesInfo.timestamp" class="text-xs text-gray-500 mt-1">
                마지막 업데이트: {{ nodesInfo.timestamp }}
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div v-if="nodeStats" class="text-sm text-gray-600">
                총 {{ nodeStats.total }}개 노드 • K8s: {{ nodeStats.k8sActive }}개 • SLURM: {{ nodeStats.slurmActive }}개
              </div>
            </div>
          </div>
        </template>
        
        <div v-if="!resourceHealth" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-center gap-2 text-yellow-800">
            <div class="w-4 h-4 rounded-full bg-yellow-400"></div>
            <span class="text-sm font-medium">Cubox API 서버에 연결할 수 없습니다</span>
          </div>
          <div class="text-xs text-yellow-700 mt-2 ml-6 space-y-1">
            <p>다음 사항을 확인해주세요:</p>
            <ul class="list-disc list-inside space-y-1 ml-2">
              <li>mlops.cubox.ai 서버가 실행 중인지 확인</li>
              <li>네트워크 연결 상태 확인</li>
              <li>방화벽 또는 프록시 설정 확인</li>
              <li>CORS 정책 설정 확인</li>
            </ul>
            <div class="mt-2 pt-2 border-t border-yellow-300">
              <p class="text-yellow-600">API 서버 URL: <span class="font-mono">http://mlops.cubox.ai</span> (프록시: /api/cubox)</p>
              <div class="mt-2 flex gap-2">
                <button 
                  @click="testApiConnection"
                  class="px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs hover:bg-yellow-300 transition-colors"
                >
                  연결 테스트
                </button>
                <span v-if="connectionTestResult" class="text-xs px-2 py-1 rounded" :class="connectionTestResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ connectionTestResult.message }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else>
          <!-- 클러스터 개요 -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="p-4 bg-green-50 rounded-lg border border-green-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-800">총 노드</p>
                  <p class="text-2xl font-bold text-green-900">{{ nodeStats ? nodeStats.total : 0 }}</p>
                </div>
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-blue-800">K8s 활성</p>
                  <p class="text-2xl font-bold text-blue-900">{{ nodeStats ? nodeStats.k8sActive : 0 }}</p>
                  <p class="text-xs text-blue-600 mt-1">작업 실행 중</p>
                </div>
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-purple-800">SLURM 활성</p>
                  <p class="text-2xl font-bold text-purple-900">{{ nodeStats ? nodeStats.slurmActive : 0 }}</p>
                  <p class="text-xs text-purple-600 mt-1">작업 실행 중</p>
                </div>
                <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="p-4 bg-green-50 rounded-lg border border-green-200">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-green-800">사용가능 노드</p>
                  <p class="text-2xl font-bold text-green-900">{{ nodeStats ? nodeStats.available : 0 }}</p>
                  <p class="text-xs text-green-600 mt-1">새 작업 할당 가능</p>
                </div>
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 노드 상세 리스트 -->
          <div class="bg-white rounded-lg border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h4 class="text-lg font-medium text-gray-900">노드 상세 현황</h4>
              <p class="text-sm text-gray-600 mt-1">각 노드의 Kubernetes 및 SLURM 상태를 확인할 수 있습니다.</p>
            </div>
            <div v-if="nodesInfo && nodesInfo.nodes" class="divide-y divide-gray-200">
              <div 
                v-for="(nodeInfo, nodeName) in nodesInfo.nodes" 
                :key="nodeName"
                class="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                      <div 
                        class="w-10 h-10 rounded-full flex items-center justify-center"
                        :class="getNodeStatusColor(nodeInfo)"
                      >
                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2"/>
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h5 class="text-sm font-medium text-gray-900">{{ nodeName }}</h5>
                      <p class="text-xs text-gray-500">{{ getNodeDescription(nodeInfo) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getK8sStatusClass(nodeInfo)"
                    >
                      <div 
                        class="w-1.5 h-1.5 rounded-full mr-1.5"
                        :class="getK8sStatusDotClass(nodeInfo)"
                      ></div>
                      K8s {{ getK8sStatusText(nodeInfo) }}
                    </span>
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="getSlurmStatusClass(nodeInfo)"
                    >
                      <div 
                        class="w-1.5 h-1.5 rounded-full mr-1.5"
                        :class="getSlurmStatusDotClass(nodeInfo)"
                      ></div>
                      SLURM {{ getSlurmStatusText(nodeInfo) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="px-6 py-8 text-center">
              <div class="text-gray-400">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">노드 정보 없음</h3>
                <p class="mt-1 text-sm text-gray-500">데이터를 로딩 중이거나 연결에 문제가 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup>
// 페이지 기본 설정
const breadcrumbs = ref([
  { label: 'Home', to: '/' },
  { label: 'GPU Monitoring' }
])

const pageTitle = ref('GPU Monitoring')

// GPU 모니터링 로직
const { fetchCurrentMetrics, fetchTimeSeriesData, testConnection } = useGpuMetrics()
// Resource API 추가
const { healthCheck, getResourceInfo, getResourceStatus, getNodes } = useResourceAPI()
const { submitJob, getJobStatus, getJobOutput } = useSlurmAPI()
const loading = ref(false)
const isConnected = ref(false)
const selectedPeriod = ref(15)
const selectedInstanceFilter = ref('all')
const currentMetrics = ref({})
const timeSeriesData = ref({})

// Resource API 관련 상태
const resourceHealth = ref(false)
const resourceInfo = ref(null)
const resourceStatus = ref(null)
const nodesInfo = ref(null)
const connectionTestResult = ref(null)

// 탭 상태
const activeTab = ref('internal')

// 탭 변경 시 차트 재초기화
watch(activeTab, async (newTab) => {
  if (newTab === 'internal') {
    await nextTick()
    // 차트 DOM이 완전히 렌더링된 후 초기화
    setTimeout(async () => {
      await initCharts()
      updateCharts()
    }, 200)
  }
})

const timePeriods = [
  { value: 15, label: '15분' },
  { value: 60, label: '1시간' },
  { value: 360, label: '6시간' },
  { value: 1440, label: '24시간' }
]

// 툴바 설정
const toolbarLinks = ref([
  [],
  [{
    label: '새로고침',
    icon: 'i-heroicons-arrow-path',
    click: () => refreshData(),
    loading: computed(() => loading.value)
  }]
])

// 차트 참조
const tempChart = ref(null)
const powerChart = ref(null)
const clockChart = ref(null)
const utilizationChart = ref(null)
const tensorChart = ref(null)
const memoryChart = ref(null)

// 색상 관리
const colorMap = new Map()
const colorPalette = [
  '#73BF69', '#FADE2A', '#FF9830', '#F2495C', '#5794F2', '#B877D9',
  '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6',
  '#06B6D4', '#84CC16', '#F97316', '#E11D48', '#7C3AED', '#059669'
]

// 차트 관리
let Chart = null
const charts = {}

// 인스턴스 옵션
const availableInstances = computed(() => {
  const instances = new Set()
  Object.values(currentMetrics.value).forEach(metricArray => {
    if (Array.isArray(metricArray)) {
      metricArray.forEach(item => {
        if (item.hostname && item.hostname !== 'unknown') {
          instances.add(item.hostname)
        }
      })
    }
  })
  return Array.from(instances).sort()
})

const instanceOptions = computed(() => {
  const options = [{ label: '모든 인스턴스', value: 'all' }]
  availableInstances.value.forEach(instance => {
    options.push({
      label: formatInstanceName(instance),
      value: instance
    })
  })
  return options
})

// 필터링된 데이터
const filteredData = computed(() => {
  const result = {}
  Object.entries(currentMetrics.value).forEach(([key, data]) => {
    if (!Array.isArray(data)) {
      result[key] = []
      return
    }
    if (selectedInstanceFilter.value === 'all') {
      result[key] = data.sort((a, b) => {
        const hostCompare = a.hostname.localeCompare(b.hostname)
        if (hostCompare !== 0) return hostCompare
        const aGpu = a.gpuId || a.gpu
        const bGpu = b.gpuId || b.gpu
        return parseInt(aGpu) - parseInt(bGpu)
      })
    } else {
      result[key] = data.filter(item => {
        return item.hostname === selectedInstanceFilter.value ||
               item.instance === selectedInstanceFilter.value
      }).sort((a, b) => {
        const aGpu = a.gpuId || a.gpu
        const bGpu = b.gpuId || b.gpu
        return parseInt(aGpu) - parseInt(bGpu)
      })
    }
  })
  return result
})

// 데이터 통합
const aggregatedData = computed(() => {
  const result = {}
  Object.entries(timeSeriesData.value).forEach(([metricType, seriesData]) => {
    const aggregated = new Map()
    Object.values(seriesData).forEach(series => {
      const gpuKey = series.gpuId || series.gpu
      const groupKey = `${series.hostname}-gpu${gpuKey}${series.gpuProfile ? `-${series.gpuProfile}` : ''}`
      if (!aggregated.has(groupKey)) {
        aggregated.set(groupKey, {
          hostname: series.hostname,
          gpu: series.gpu,
          gpuId: series.gpuId || series.gpu,
          gpuProfile: series.gpuProfile || '',
          displayKey: groupKey,
          allData: [],
          instance: series.instance
        })
      }
      const validData = series.data.filter(val => !isNaN(val) && val !== null && val !== undefined)
      aggregated.get(groupKey).allData.push(...validData)
    })

    result[metricType] = Array.from(aggregated.values()).map(group => {
      const currentItem = filteredData.value[metricType]?.find(item => {
        const itemGpuId = item.gpuId || item.gpu
        const groupGpuId = group.gpuId || group.gpu
        return item.hostname === group.hostname && itemGpuId === groupGpuId
      })

      let maxValue = 0
      let avgValue = 0
      let currentValue = currentItem ? currentItem.value : 0

      if (group.allData.length > 0) {
        maxValue = Math.max(...group.allData)
        avgValue = group.allData.reduce((sum, val) => sum + val, 0) / group.allData.length
      }

      // 메트릭별 반올림 적용
      let formattedMax, formattedAvg, formattedCurrent
      switch(metricType) {
        case 'temperature':
          formattedMax = Math.round(maxValue)
          formattedAvg = Math.round(avgValue)
          formattedCurrent = Math.round(currentValue)
          break
        case 'power':
          formattedMax = Math.round(maxValue * 10) / 10
          formattedAvg = Math.round(avgValue * 10) / 10
          formattedCurrent = Math.round(currentValue * 10) / 10
          break
        case 'smClock':
          formattedMax = Math.round(maxValue * 100) / 100
          formattedAvg = Math.round(avgValue * 100) / 100
          formattedCurrent = Math.round(currentValue * 100) / 100
          break
        case 'utilization':
        case 'tensorUtil':
          formattedMax = Math.round(maxValue)
          formattedAvg = Math.round(avgValue)
          formattedCurrent = Math.round(currentValue)
          break
        case 'frameBufferUsed':
          formattedMax = Math.round(maxValue * 10) / 10
          formattedAvg = Math.round(avgValue * 10) / 10
          formattedCurrent = Math.round(currentValue * 10) / 10
          break
        default:
          formattedMax = Math.round(maxValue * 100) / 100
          formattedAvg = Math.round(avgValue * 100) / 100
          formattedCurrent = currentValue
      }

      let gpuDisplay
      if (group.gpuProfile) {
        gpuDisplay = `GPU${group.gpu} (${group.gpuProfile})`
      } else {
        gpuDisplay = `GPU${group.gpu}`
      }

      return {
        ...group,
        maxValue: formattedMax,
        avgValue: formattedAvg,
        currentValue: formattedCurrent,
        gpuDisplay: gpuDisplay,
        unit: currentItem ? currentItem.unit : 'GB'
      }
    }).filter(item => {
      if (selectedInstanceFilter.value === 'all') return true
      return item.hostname === selectedInstanceFilter.value ||
             item.instance === selectedInstanceFilter.value
    }).sort((a, b) => {
      const hostCompare = a.hostname.localeCompare(b.hostname)
      if (hostCompare !== 0) return hostCompare
      return parseInt(a.gpuId) - parseInt(b.gpuId)
    })
  })
  return result
})

// 물리 GPU 데이터
const physicalGpuData = computed(() => {
  const result = {}
  Object.entries(currentMetrics.value).forEach(([metricType, data]) => {
    if (!Array.isArray(data)) {
      result[metricType] = []
      return
    }
    const physicalGroups = new Map()
    data.forEach(item => {
      const physicalKey = `${item.hostname}-gpu${item.gpu}`
      if (!physicalGroups.has(physicalKey)) {
        physicalGroups.set(physicalKey, {
          hostname: item.hostname,
          gpu: item.gpu,
          values: []
        })
      }
      physicalGroups.get(physicalKey).values.push(item.value)
    })

    result[metricType] = Array.from(physicalGroups.values()).map(group => {
      let representativeValue
      if (metricType === 'temperature') {
        representativeValue = group.values.reduce((sum, val) => sum + val, 0) / group.values.length
      } else if (metricType === 'power') {
        representativeValue = Math.max(...group.values)
      } else {
        representativeValue = group.values.reduce((sum, val) => sum + val, 0) / group.values.length
      }
      return {
        ...group,
        value: representativeValue
      }
    }).filter(item => {
      if (selectedInstanceFilter.value === 'all') return true
      return item.hostname === selectedInstanceFilter.value
    })
  })
  return result
})

// 계산된 평균값들
const avgTemperature = computed(() => {
  const temps = physicalGpuData.value.temperature || []
  if (temps.length === 0) return 0
  return temps.reduce((sum, item) => sum + item.value, 0) / temps.length
})

const totalPower = computed(() => {
  const powers = physicalGpuData.value.power || []
  return powers.reduce((sum, item) => sum + item.value, 0)
})

const totalMemory = computed(() => {
  const memories = aggregatedData.value.frameBufferUsed || []
  return memories.reduce((sum, item) => sum + item.currentValue, 0)
})

const avgClock = computed(() => {
  const clocks = aggregatedData.value.smClock || []
  if (clocks.length === 0) return 0
  return clocks.reduce((sum, item) => sum + item.currentValue, 0) / clocks.length
})

const avgUtilization = computed(() => {
  const utils = aggregatedData.value.utilization || []
  if (utils.length === 0) return 0
  return utils.reduce((sum, item) => sum + item.currentValue, 0) / utils.length
})

const avgTensorUtil = computed(() => {
  const tensors = aggregatedData.value.tensorUtil || []
  if (tensors.length === 0) return 0
  return tensors.reduce((sum, item) => sum + item.currentValue, 0) / tensors.length
})

// 노드 통계 계산
const nodeStats = computed(() => {
  if (!nodesInfo.value || !nodesInfo.value.nodes) return null
  
  const nodes = nodesInfo.value.nodes
  const total = Object.keys(nodes).length
  // k8s_dummy=true면 SLURM이 활성상태, slurm_dummy=true면 K8s가 활성상태
  const k8sActive = Object.values(nodes).filter(node => node.slurm_dummy).length
  const slurmActive = Object.values(nodes).filter(node => node.k8s_dummy).length
  // 둘 다 false일 때 사용가능
  const available = Object.values(nodes).filter(node => !node.k8s_dummy && !node.slurm_dummy).length
  
  return {
    total,
    k8sActive,
    slurmActive,
    available
  }
})

// 유틸리티 함수들
const getUniqueColor = (displayKey) => {
  if (colorMap.has(displayKey)) {
    return colorMap.get(displayKey)
  }
  let hash = 0
  for (let i = 0; i < displayKey.length; i++) {
    const char = displayKey.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const colorIndex = Math.abs(hash) % colorPalette.length
  const color = colorPalette[colorIndex]
  colorMap.set(displayKey, color)
  return color
}

const formatInstanceName = (hostname) => {
  if (hostname.includes('wisenut-')) {
    return hostname.replace('wisenut-', '')
  }
  if (hostname.includes('.')) {
    const parts = hostname.split('.')
    return parts[parts.length - 1]
  }
  return hostname.length > 8 ? hostname.substring(0, 8) : hostname
}

const formatClockValue = (value) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} GHz`
  }
  return `${Math.round(value)} MHz`
}

const formatMemoryValue = (value) => {
  return `${value} GB`
}

// 노드 상태 관련 헬퍼 함수들
const getNodeStatusColor = (nodeInfo) => {
  // k8s_dummy=true면 SLURM 활성, slurm_dummy=true면 K8s 활성
  const k8sActive = nodeInfo.slurm_dummy
  const slurmActive = nodeInfo.k8s_dummy
  
  if (k8sActive && slurmActive) {
    return 'bg-red-500' // 둘 다 활성상태 (사용 불가)
  } else if (k8sActive || slurmActive) {
    return 'bg-yellow-500' // 하나만 활성상태
  } else {
    return 'bg-green-500' // 둘 다 사용가능 (둘 다 false)
  }
}

const getNodeDescription = (nodeInfo) => {
  // k8s_dummy=true면 SLURM 활성, slurm_dummy=true면 K8s 활성
  const k8sActive = nodeInfo.slurm_dummy
  const slurmActive = nodeInfo.k8s_dummy
  
  if (slurmActive) {
    return 'SLURM 작업 실행 중 (K8s 사용 불가)'
  } else if (k8sActive) {
    return 'K8s 작업 실행 중 (SLURM 사용 불가)'
  } else {
    return '모든 서비스 사용가능'
  }
}

// K8s 상태 관련 함수들
const getK8sStatusClass = (nodeInfo) => {
  // k8s_dummy=true면 SLURM 활성, slurm_dummy=true면 K8s 활성
  const slurmActive = nodeInfo.k8s_dummy  // k8s_dummy=true면 SLURM이 활성
  const k8sActive = nodeInfo.slurm_dummy  // slurm_dummy=true면 K8s가 활성
  
  if (slurmActive) {
    // SLURM이 활성상태면 K8s는 사용 불가
    return 'bg-gray-100 text-gray-800'
  } else if (k8sActive) {
    // K8s 활성상태
    return 'bg-blue-100 text-blue-800'
  } else {
    // K8s 사용가능 (둘 다 false)
    return 'bg-green-100 text-green-800'
  }
}

const getK8sStatusDotClass = (nodeInfo) => {
  const slurmActive = nodeInfo.k8s_dummy
  const k8sActive = nodeInfo.slurm_dummy
  
  if (slurmActive) {
    return 'bg-gray-400'  // SLURM 활성으로 인한 사용 불가
  } else if (k8sActive) {
    return 'bg-blue-400'  // K8s 활성상태
  } else {
    return 'bg-green-400' // K8s 사용가능
  }
}

const getK8sStatusText = (nodeInfo) => {
  const slurmActive = nodeInfo.k8s_dummy
  const k8sActive = nodeInfo.slurm_dummy
  
  if (slurmActive) {
    return '사용 불가'  // SLURM 활성으로 인한 사용 불가
  } else if (k8sActive) {
    return '활성상태'   // K8s 작업 실행 중
  } else {
    return '사용가능'   // K8s 사용가능
  }
}

// SLURM 상태 관련 함수들
const getSlurmStatusClass = (nodeInfo) => {
  // k8s_dummy=true면 SLURM 활성, slurm_dummy=true면 K8s 활성
  const k8sActive = nodeInfo.slurm_dummy  // slurm_dummy=true면 K8s가 활성
  const slurmActive = nodeInfo.k8s_dummy  // k8s_dummy=true면 SLURM이 활성
  
  if (k8sActive) {
    // K8s가 활성상태면 SLURM은 사용 불가
    return 'bg-gray-100 text-gray-800'
  } else if (slurmActive) {
    // SLURM 활성상태
    return 'bg-purple-100 text-purple-800'
  } else {
    // SLURM 사용가능 (둘 다 false)
    return 'bg-green-100 text-green-800'
  }
}

const getSlurmStatusDotClass = (nodeInfo) => {
  const k8sActive = nodeInfo.slurm_dummy
  const slurmActive = nodeInfo.k8s_dummy
  
  if (k8sActive) {
    return 'bg-gray-400'    // K8s 활성으로 인한 사용 불가
  } else if (slurmActive) {
    return 'bg-purple-400'  // SLURM 활성상태
  } else {
    return 'bg-green-400'   // SLURM 사용가능
  }
}

const getSlurmStatusText = (nodeInfo) => {
  const k8sActive = nodeInfo.slurm_dummy
  const slurmActive = nodeInfo.k8s_dummy
  
  if (k8sActive) {
    return '사용 불가'  // K8s 활성으로 인한 사용 불가
  } else if (slurmActive) {
    return '활성상태'   // SLURM 작업 실행 중
  } else {
    return '사용가능'   // SLURM 사용가능
  }
}

// 이벤트 핸들러
const changePeriod = (period) => {
  selectedPeriod.value = period
  fetchData()
}

const onInstanceFilterChange = () => {
  nextTick(() => {
    updateCharts()
  })
}

const refreshData = async () => {
  await fetchData()
  await fetchResourceData()
}

const testApiConnection = async () => {
  connectionTestResult.value = { success: false, message: '테스트 중...' }
  
  try {
    // 프록시를 통한 테스트
    const response = await fetch('/api/cubox/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      connectionTestResult.value = { 
        success: true, 
        message: `연결 성공 (${response.status})` 
      }
    } else {
      connectionTestResult.value = { 
        success: false, 
        message: `HTTP ${response.status} 오류` 
      }
    }
  } catch (error) {
    console.error('Connection test error:', error)
    connectionTestResult.value = { 
      success: false, 
      message: `연결 실패: ${error.message}` 
    }
  }
}

const fetchResourceData = async () => {
  try {
    // 헬스 체크
    try {
      await healthCheck()
      resourceHealth.value = true
    } catch (error) {
      resourceHealth.value = false
      // 헬스 체크 실패 시 다른 API 호출하지 않음
      return
    }

    // 리소스 정보와 상태는 필요하지 않으므로 제거

    // 노드 정보 가져오기
    try {
      nodesInfo.value = await getNodes()
    } catch (error) {
      // 조용히 실패 처리 (콘솔 로그 제거)
      nodesInfo.value = null
    }
  } catch (error) {
    // 전체 실패 시에만 로그
    console.warn('Resource API temporarily unavailable')
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    isConnected.value = await testConnection()
    if (isConnected.value) {
      const [current, timeSeries] = await Promise.all([
        fetchCurrentMetrics(),
        fetchTimeSeriesData(selectedPeriod.value)
      ])
      currentMetrics.value = current
      timeSeriesData.value = timeSeries
      await nextTick()
      updateCharts()
    }
  } catch (error) {
    isConnected.value = false
  } finally {
    loading.value = false
  }
}

const initCharts = async () => {
  try {
    const chartModule = await import('chart.js/auto')
    Chart = chartModule.default
    const chartConfigs = [
      {
        ref: tempChart,
        key: 'temperature',
        max: 100,
        yAxisFormatter: (value) => `${value}°C`
      },
      {
        ref: powerChart,
        key: 'power',
        yAxisFormatter: (value) => `${value} W`
      },
      {
        ref: clockChart,
        key: 'smClock',
        yAxisFormatter: (value) => {
          if (value >= 1000) {
            return `${(value / 1000).toFixed(2)} GHz`
          }
          return `${value} MHz`
        }
      },
      {
        ref: utilizationChart,
        key: 'utilization',
        max: 100,
        yAxisFormatter: (value) => `${value}%`
      },
      {
        ref: tensorChart,
        key: 'tensorUtil',
        max: 100,
        yAxisFormatter: (value) => `${value}%`
      },
      {
        ref: memoryChart,
        key: 'frameBufferUsed',
        yAxisFormatter: (value) => `${value} GB`
      }
    ]

    chartConfigs.forEach(config => {
      if (config.ref.value) {
        charts[config.key] = new Chart(config.ref.value, {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                grid: {
                  color: '#f3f4f6',
                  display: true
                },
                ticks: {
                  font: { size: 10 },
                  maxTicksLimit: 6,
                  color: '#6b7280'
                }
              },
              y: {
                grid: {
                  color: '#f3f4f6',
                  display: true
                },
                ticks: {
                  font: { size: 10 },
                  color: '#6b7280',
                  callback: function(value) {
                    return config.yAxisFormatter ? config.yAxisFormatter(value) : value
                  }
                },
                ...(config.max && { max: config.max, min: 0 })
              }
            },
            elements: {
              line: {
                tension: 0.1,
                borderWidth: 2
              },
              point: {
                radius: 0,
                hoverRadius: 4
              }
            },
            interaction: {
              intersect: false,
              mode: 'index'
            }
          }
        })
      }
    })
  } catch (error) {
    console.error('Chart initialization failed:', error)
  }
}

const updateCharts = () => {
  if (!Chart || Object.keys(charts).length === 0) {
    return
  }

  Object.entries(charts).forEach(([key, chart]) => {
    const seriesData = timeSeriesData.value[key] || {}
    const datasets = []
    let labels = []
    const processedGroups = new Map()

    Object.entries(seriesData).forEach(([uniqueId, series]) => {
      const shouldInclude = selectedInstanceFilter.value === 'all' ||
                           series.hostname === selectedInstanceFilter.value ||
                           series.instance === selectedInstanceFilter.value

      if (shouldInclude) {
        const gpuKey = series.gpuId || series.gpu
        const groupKey = `${series.hostname}-gpu${gpuKey}${series.gpuProfile ? `-${series.gpuProfile}` : ''}`

        if (!processedGroups.has(groupKey)) {
          const color = getUniqueColor(groupKey)
          const instanceName = formatInstanceName(series.hostname)
          let gpuLabel
          if (series.gpuProfile) {
            gpuLabel = `${instanceName}:GPU${series.gpu} (${series.gpuProfile})`
          } else {
            gpuLabel = `${instanceName}:GPU${series.gpu}`
          }

          const groupSeries = Object.values(seriesData).filter(s => {
            const sGpuKey = s.gpuId || s.gpu
            return `${s.hostname}-gpu${sGpuKey}${s.gpuProfile ? `-${s.gpuProfile}` : ''}` === groupKey
          })

          // 시간순으로 정렬하고 데이터 병합
          const allPoints = []
          groupSeries.forEach(s => {
            s.data.forEach((value, index) => {
              if (s.labels[index] && !isNaN(value) && value !== null) {
                allPoints.push({
                  time: s.labels[index],
                  value: value
                })
              }
            })
          })

          // 시간순 정렬
          allPoints.sort((a, b) => a.time.localeCompare(b.time))

          // 중복 시간 제거 (최신 값 사용)
          const uniquePoints = new Map()
          allPoints.forEach(point => {
            uniquePoints.set(point.time, point.value)
          })

          const sortedTimes = Array.from(uniquePoints.keys()).sort()
          const sortedValues = sortedTimes.map(time => uniquePoints.get(time))

          datasets.push({
            label: gpuLabel,
            data: sortedValues,
            borderColor: color,
            backgroundColor: color + '20',
            tension: 0.1,
            fill: false,
            pointBackgroundColor: color,
            pointBorderColor: color,
            borderWidth: 2,
            pointRadius: 0
          })

          if (labels.length === 0 || sortedTimes.length > labels.length) {
            labels = sortedTimes
          }

          processedGroups.set(groupKey, true)
        }
      }
    })

    chart.data.labels = labels
    chart.data.datasets = datasets
    chart.update('none')
  })
}

// 생명주기
const cleanupFunctions = ref([])

onMounted(async () => {
  await initCharts()
  await fetchData()
  await fetchResourceData()

  const interval = setInterval(() => {
    if (!loading.value) {
      fetchData()
      fetchResourceData()
    }
  }, 30000)

  cleanupFunctions.value.push(() => {
    clearInterval(interval)
    Object.values(charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy()
      }
    })
  })
})

onUnmounted(() => {
  cleanupFunctions.value.forEach(cleanup => cleanup())
})
</script>

<style scoped>
.metric-panel {
  min-width: 0;
  width: 100%;
}

.table-headers {
  @apply grid gap-2 pb-3 mb-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center;
  grid-template-columns: 20px 2fr 2.5fr 1.5fr 1.5fr 2fr;
  align-items: center;
  min-width: 400px;
}

.table-row {
  @apply grid gap-2 items-center py-2 text-sm hover:bg-gray-50 rounded-md transition-colors;
  grid-template-columns: 20px 2fr 2.5fr 1.5fr 1.5fr 2fr;
  min-height: 32px;
  min-width: 400px;
}

/* 테이블 영역에 스크롤 추가 */
.metric-panel .p-4.pt-0 {
  overflow-x: auto;
}

/* 스크롤바 스타일 개선 */
.metric-panel .p-4.pt-0::-webkit-scrollbar {
  height: 6px;
}

.metric-panel .p-4.pt-0::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.metric-panel .p-4.pt-0::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.metric-panel .p-4.pt-0::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>