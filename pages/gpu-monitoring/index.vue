<template>
  <div class="w-full">
    <LayoutPageBreadcrumb :breadcrumbs="breadcrumbs" />
    <LayoutPageHeader :title="pageTitle" />
    <LayoutPageToolbar :links="toolbarLinks" />

    <!-- 연결 상태 및 필터 -->
    <div class="mb-6">
      <UCard>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full transition-colors" :class="isConnected ? 'bg-green-500' : 'bg-red-500'"></div>
              <span class="text-sm text-gray-600">{{ isConnected ? '연결됨' : '연결 끊김' }}</span>
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
const loading = ref(false)
const isConnected = ref(false)
const selectedPeriod = ref(15)
const selectedInstanceFilter = ref('all')
const currentMetrics = ref({})
const timeSeriesData = ref({})

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

  const interval = setInterval(() => {
    if (!loading.value) {
      fetchData()
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