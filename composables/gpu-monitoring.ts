export const useGpuMetrics = () => {
  const config = useRuntimeConfig()
  const prometheusUrl = config.public.prometheusUrl || 'http://localhost:9090'

  const dcgmQueries = {
    temperature: 'DCGM_FI_DEV_GPU_TEMP',
    power: 'DCGM_FI_DEV_POWER_USAGE',
    smClock: 'DCGM_FI_DEV_SM_CLOCK',
    utilization: 'DCGM_FI_DEV_GPU_UTIL',
    tensorUtil: 'DCGM_FI_PROF_PIPE_TENSOR_ACTIVE',
    frameBufferUsed: 'DCGM_FI_DEV_FB_USED'
  }

  const queryPrometheus = async (query) => {
    try {
      const response = await fetch(`${prometheusUrl}/api/v1/query?query=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.status === 'success' && data.data.result) {
        return data.data.result
      }
      return []
    } catch (error) {
      console.error('Prometheus query error:', error)
      return []
    }
  }

  const queryRangePrometheus = async (query, start, end, step = '30s') => {
    try {
      const params = new URLSearchParams({
        query,
        start: start.toString(),
        end: end.toString(),
        step
      })
      const response = await fetch(`${prometheusUrl}/api/v1/query_range?${params}`)
      const data = await response.json()
      if (data.status === 'success' && data.data.result) {
        return data.data.result
      }
      return []
    } catch (error) {
      console.error('Prometheus range query error:', error)
      return []
    }
  }

  const deduplicateMetrics = (metrics) => {
    const uniqueMetrics = new Map()
    metrics.forEach(item => {
      const metricKeys = Object.keys(item.metric).sort()
      const keyParts = metricKeys.map(key => `${key}=${item.metric[key]}`).join('|')
      const uniqueKey = `${keyParts}|${item.value[1]}`
      if (!uniqueMetrics.has(uniqueKey)) {
        uniqueMetrics.set(uniqueKey, item)
      }
    })
    return Array.from(uniqueMetrics.values())
  }

  // GPU 정보 파싱 함수
  const parseGpuInfo = (metric) => {
    // 실제 GPU 번호 추출 (물리적 GPU)
    const physicalGpu = metric.gpu || metric.device || metric.GPU || metric.gpuid || metric.device_id || '0'

    // MIG 정보 확인
    const hasMig = !!(metric.GPU_I_ID || metric.GPU_I_PROFILE)

    let gpu, gpuId, gpuProfile = ''

    if (hasMig) {
      // MIG 환경: 물리적 GPU는 그대로, MIG 정보 추가
      gpu = physicalGpu
      gpuId = metric.GPU_I_ID || physicalGpu
      gpuProfile = metric.GPU_I_PROFILE || ''
    } else {
      // 일반 환경
      gpu = physicalGpu
      gpuId = physicalGpu
    }

    return {
      gpu: gpu,           // 물리적 GPU 번호 (0, 1, 2...)
      gpuId: gpuId,       // MIG 인스턴스 ID 또는 GPU 번호
      gpuProfile: gpuProfile  // MIG 프로필 (3g.40gb 등)
    }
  }

  // Frame Buffer 값 처리 함수
  const processFrameBufferValue = (rawValue) => {
    // MIG 환경에서는 MiB 단위로 보고됨
    if (rawValue > 1000) {
      // MiB to GB 변환
      return rawValue / 1024
    } else if (rawValue > 1) {
      // 작은 MiB 값
      return rawValue / 1024
    } else {
      // 이미 GB 단위거나 매우 작은 값
      return rawValue
    }
  }

  // 값 처리 함수
  const processMetricValue = (key, rawValue) => {
    let value = parseFloat(rawValue)

    switch (key) {
      case 'smClock':
        // MHz to GHz 변환이 필요한 경우
        if (value > 100000) {
          value = value / 1000000
        }
        return Math.round(value * 100) / 100

      case 'frameBufferUsed':
        value = processFrameBufferValue(value)
        return Math.round(value * 10) / 10

      case 'power':
        return Math.round(value * 10) / 10

      case 'temperature':
      case 'utilization':
      case 'tensorUtil':
        return Math.round(value)

      default:
        return Math.round(value * 100) / 100
    }
  }

  const fetchCurrentMetrics = async () => {
    const results = {}

    for (const [key, query] of Object.entries(dcgmQueries)) {
      const rawData = await queryPrometheus(query)
      const deduplicatedData = deduplicateMetrics(rawData)

      results[key] = deduplicatedData.map((item, index) => {
        const metric = item.metric
        const rawValue = parseFloat(item.value[1])
        const processedValue = processMetricValue(key, rawValue)

        // GPU 정보 파싱
        const gpuInfo = parseGpuInfo(metric)

        // 인스턴스 정보
        const instance = metric.instance || 'unknown'
        const hostname = metric.Hostname || metric.hostname || instance.split(':')[0] || 'unknown'

        // UUID 정보
        const uuid = metric.UUID || metric.uuid || metric.device_uuid || ''
        const shortUuid = uuid ? uuid.substring(0, 8) : ''

        // 고유 ID 생성
        const uniqueId = `${hostname}-gpu${gpuInfo.gpu}${gpuInfo.gpuProfile ? `-${gpuInfo.gpuProfile}` : ''}-${index}${shortUuid ? '-' + shortUuid : ''}`

        // GPU 식별자 생성
        let gpuIdentifier = `GPU${gpuInfo.gpu}`
        if (gpuInfo.gpuProfile) {
          gpuIdentifier += ` (${gpuInfo.gpuProfile})`
        }

        return {
          instance,
          gpu: gpuInfo.gpu,
          gpuId: gpuInfo.gpuId,
          gpuProfile: gpuInfo.gpuProfile,
          gpuIdentifier,
          hostname,
          uuid,
          uniqueId,
          index,
          value: processedValue,
          unit: key === 'frameBufferUsed' ? 'GB' : '',
          rawValue: rawValue,
          allMetricFields: metric
        }
      })
    }

    return results
  }

  const fetchTimeSeriesData = async (minutes = 15) => {
    const end = Math.floor(Date.now() / 1000)
    const start = end - (minutes * 60)
    const results = {}

    for (const [key, query] of Object.entries(dcgmQueries)) {
      const data = await queryRangePrometheus(query, start, end, '30s')
      results[key] = {}

      data.forEach((series, seriesIndex) => {
        const metric = series.metric

        // GPU 정보 파싱
        const gpuInfo = parseGpuInfo(metric)

        // 인스턴스 정보
        const instance = metric.instance || 'unknown'
        const hostname = metric.Hostname || metric.hostname || instance.split(':')[0] || 'unknown'

        // UUID 정보
        const uuid = metric.UUID || metric.uuid || metric.device_uuid || ''
        const shortUuid = uuid ? uuid.substring(0, 8) : ''

        // 고유 ID 생성
        const uniqueId = `${hostname}-gpu${gpuInfo.gpu}${gpuInfo.gpuProfile ? `-${gpuInfo.gpuProfile}` : ''}-${seriesIndex}${shortUuid ? '-' + shortUuid : ''}`

        if (series.values && series.values.length > 0) {
          // 값 처리
          const values = series.values.map(v => {
            const rawValue = parseFloat(v[1])
            return processMetricValue(key, rawValue)
          })

          // 시간 라벨 생성
          const labels = series.values.map(v => {
            const date = new Date(v[0] * 1000)
            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
          })

          results[key][uniqueId] = {
            instance,
            hostname,
            gpu: gpuInfo.gpu,
            gpuId: gpuInfo.gpuId,
            gpuProfile: gpuInfo.gpuProfile,
            uuid,
            uniqueId,
            seriesIndex,
            labels: labels,
            data: values
          }
        }
      })
    }

    return results
  }

  const testConnection = async () => {
    try {
      const response = await fetch(`${prometheusUrl}/api/v1/query?query=up{job="dcgm"}`)
      const data = await response.json()
      return response.ok && data.status === 'success'
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }

  return {
    fetchCurrentMetrics,
    fetchTimeSeriesData,
    testConnection
  }
}