interface WebSocketMessage {
  type: 'deployment_log' | 'pod_log' | 'traffic_metrics' | 'deployment_status' | 'deployment_complete' | 'deployment_error' | 'inference_log'
  timestamp: string
  data: any
  serviceName?: string
  namespace?: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  source?: string
  metadata?: any
}

interface PodLogEntry {
  timestamp: string
  podName: string
  podType: 'blue' | 'green' | 'stable' | 'canary' | 'runtime' | 'base'
  containerName: string
  message: string
}

interface TrafficMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  averageResponseTime?: number
}

interface InferenceLogData {
  message: string
  level: 'success' | 'error' | 'warning' | 'info'
  timestamp: string
  source: string
  response_data?: {
    status_code: number
    request_id: number
    success: boolean
    elapsed_time: number
  }
}

interface InferenceStats {
  total: number
  success: number
  error: number
  warning: number
  successRate: number
}

export const useWebSocket = () => {
  const config = useAppConfig()

  // WebSocket 연결 맵
  const connections = new Map<string, WebSocket>()

  // 로그 저장소
  const deploymentLogs = ref<LogEntry[]>([])
  const podLogs = ref<PodLogEntry[]>([])
  const inferenceLogs = ref<LogEntry[]>([])

  // 메트릭 상태
  const metrics = ref<TrafficMetrics | null>(null)
  const inferenceStats = ref<InferenceStats>({
    total: 0,
    success: 0,
    error: 0,
    warning: 0,
    successRate: 0
  })

  // 배포 상태
  const deploymentProgress = ref(0)
  const deploymentStatus = ref('재배포 준비 중...')

  // 성능 최적화 상수
  const MAX_LOGS = 1000
  const LOG_TRIM_SIZE = 100

  // WebSocket URL 생성
  const getWebSocketUrl = (path: string): string => {
    const baseUrl = config.api.url.replace(/^http/, 'ws').replace(/\/$/, '')
    const fullUrl = `${baseUrl}${path}`
    console.log('🔧 WebSocket URL 생성:', { baseUrl, path, fullUrl })
    return fullUrl
  }

  // 로그 메모리 관리
  const trimLogs = (logs: Ref<any[]>) => {
    if (logs.value.length > MAX_LOGS) {
      logs.value = logs.value.slice(-MAX_LOGS + LOG_TRIM_SIZE)
    }
  }

  // 배포 로그 WebSocket 연결
  const connectDeploymentLogs = (namespace: string, serviceName: string, deploymentId?: string) => {
    const key = `deployment-${namespace}-${serviceName}`

    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    let url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/deployment-logs`)
    if (deploymentId) {
      url += `?deployment_id=${deploymentId}`
    }

    const ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('🔗 WebSocket 연결 성공:', url)
      // 연결 확인을 위한 초기 로그
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `🔗 배포 로그 스트리밍 연결됨: ${serviceName}`,
        source: 'websocket'
      })
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('🔔 배포 로그 WebSocket 메시지 수신:', {
          type: message.type,
          source: 'deployment-logs',
          fullMessage: message
        })

        if (message.type === 'inference_log') {
          console.log('⚠️ inference_log가 deployment-logs WebSocket으로 수신됨!')
          // 이 경우 inference logs로 라우팅
          const logData: InferenceLogData = message.data
          const logEntry: LogEntry = {
            timestamp: logData.timestamp || new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            source: logData.source || 'inference',
            metadata: logData.response_data
          }
          inferenceLogs.value.push(logEntry)
          trimLogs(inferenceLogs)
          updateInferenceStats(logData)
        } else if (message.type === 'deployment_log') {
          const logEntry: LogEntry = message.data
          deploymentLogs.value.push(logEntry)
          trimLogs(deploymentLogs)

          // 진행 상황 로그 스팸 방지 - "📊 추론 테스트 진행" 메시지 필터링
          const isProgressSpam = logEntry.message.includes('📊 추론 테스트 진행') ||
                                 logEntry.message.includes('가용성 테스트 진행')

          if (!isProgressSpam) {
            // 추론 검증 로그는 inferenceLogs에도 추가 (백엔드 metadata 기반 + 키워드 매칭)
            const inferenceKeywords = [
              '추론', 'inference', '검증', 'validation', '테스트', 'test', 'verify',
              '응답', 'response', '가용성', 'availability', '엔드포인트', 'endpoint',
              '요청', 'request', '성공률', 'success rate', '시뮬레이션', 'simulation'
            ]
            const isInferenceLog = logEntry.metadata?.type === 'inference' ||
                                   inferenceKeywords.some(keyword =>
                                     logEntry.message.toLowerCase().includes(keyword.toLowerCase())
                                   )

            if (isInferenceLog) {
              inferenceLogs.value.push(logEntry)
              trimLogs(inferenceLogs)

              // 추론 통계 업데이트 (성공률 파싱)
              updateInferenceStatsFromMessage(logEntry)
            }
          } else {
            // 진행 상황 로그는 통계만 업데이트하고 로그에는 추가하지 않음
            updateInferenceStatsFromMessage(logEntry)
          }

          // 진행률 업데이트 로직
          updateDeploymentProgress(logEntry)
        } else if (message.type === 'deployment_status') {
          deploymentStatus.value = message.data.message || deploymentStatus.value
          if (message.data.progress !== undefined) {
            deploymentProgress.value = message.data.progress
          }
        } else if (message.type === 'deployment_complete') {
          deploymentProgress.value = 100
          deploymentStatus.value = '재배포 완료'

          // 완료 로그 추가
          deploymentLogs.value.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: `${serviceName} 재배포 완료`,
            source: 'websocket'
          })
        } else if (message.type === 'deployment_error') {
          deploymentStatus.value = '재배포 실패'

          // 에러 로그 추가
          deploymentLogs.value.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `재배포 실패: ${message.data.error || '알 수 없는 오류'}`,
            source: 'websocket'
          })
        }
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error)
        // 파싱 오류도 로그로 표시
        deploymentLogs.value.push({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: `메시지 파싱 오류: ${error.message}`,
          source: 'websocket'
        })
      }
    }

    ws.onerror = (error) => {
      console.error('배포 로그 WebSocket 오류:', error)
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '❌ WebSocket 연결 오류 발생',
        source: 'websocket'
      })
    }

    ws.onclose = (event) => {
      const isNormalClose = event.code === 1000
      console.log('🔌 WebSocket 연결 종료:', { code: event.code, reason: event.reason, wasClean: event.wasClean })
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: isNormalClose ? 'info' : 'warning',
        message: isNormalClose ? '✅ 배포 로그 연결이 정상 종료되었습니다' : `⚠️ 배포 로그 연결이 예상치 못하게 종료되었습니다 (코드: ${event.code})`,
        source: 'websocket'
      })
      connections.delete(key)
    }

    connections.set(key, ws)
    return ws
  }

  // Pod 로그 WebSocket 연결
  const connectPodLogs = (namespace: string, serviceName: string, strategy: string, podType?: string) => {
    const key = `pod-${namespace}-${serviceName}-${strategy}`

    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    let url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/pod-logs/${strategy}`)
    if (podType) {
      url += `?pod_type=${podType}`
    }

    const ws = new WebSocket(url)

    ws.onopen = () => {
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `🔗 Pod 로그 연결됨: ${strategy} 전략`,
        source: 'websocket'
      })
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)

        if (message.type === 'pod_log') {
          const podLogEntry: PodLogEntry = message.data
          podLogs.value.push(podLogEntry)
          trimLogs(podLogs)
        }
      } catch (error) {
        console.error('Pod 로그 WebSocket 메시지 파싱 오류:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Pod 로그 WebSocket 오류:', error)
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '❌ Pod 로그 연결 오류 발생',
        source: 'websocket'
      })
    }

    ws.onclose = (event) => {
      const isNormalClose = event.code === 1000
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: isNormalClose ? 'info' : 'warning',
        message: isNormalClose ? '✅ Pod 로그 연결이 정상 종료되었습니다' : '⚠️ Pod 로그 연결이 예상치 못하게 종료되었습니다',
        source: 'websocket'
      })
      connections.delete(key)
    }

    connections.set(key, ws)
    return ws
  }

  // 추론 로그 WebSocket 연결
  const connectInferenceLogs = (namespace: string, serviceName: string) => {
    const key = `inference-${namespace}-${serviceName}`

    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    const url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/inference-logs`)

    const ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('🔗 추론 로그 WebSocket 연결 성공:', url)
      console.log('📡 inference_log 타입 메시지 수신 대기 중...')
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `🎯 추론 로그 연결됨: ${serviceName} (inference_log 타입 수신 대기)`,
        source: 'websocket'
      })
    }

    ws.onmessage = (event) => {
      try {
        console.log('📡 추론 로그 WebSocket 원본 데이터:', event.data)
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log('🎯 추론 로그 WebSocket 메시지 수신:', {
          type: message.type,
          timestamp: message.timestamp,
          dataKeys: Object.keys(message.data || {}),
          fullMessage: message
        })

        if (message.type === 'inference_log') {
          console.log('✅ inference_log 타입 메시지 처리 시작')
          const logData: InferenceLogData = message.data

          // 추론 로그에 추가
          const logEntry: LogEntry = {
            timestamp: logData.timestamp || new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            source: logData.source || 'inference',
            metadata: logData.response_data
          }

          console.log('📝 추론 로그 엔트리 생성:', logEntry)
          inferenceLogs.value.push(logEntry)
          trimLogs(inferenceLogs)

          // 통계 업데이트
          updateInferenceStats(logData)
          console.log('📊 추론 통계 업데이트 완료:', inferenceStats.value)
        } else {
          console.log('⚠️ 알 수 없는 메시지 타입:', message.type)
        }
      } catch (error) {
        console.error('❌ 추론 로그 WebSocket 메시지 파싱 오류:', error)
        console.error('원본 데이터:', event.data)
      }
    }

    ws.onerror = (error) => {
      console.error('추론 로그 WebSocket 오류:', error)
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '❌ 추론 로그 연결 오류 발생',
        source: 'websocket'
      })
    }

    ws.onclose = (event) => {
      const isNormalClose = event.code === 1000
      console.log('🔌 추론 로그 WebSocket 연결 종료:', { code: event.code, reason: event.reason })
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: isNormalClose ? 'info' : 'warning',
        message: isNormalClose ? '✅ 추론 로그 연결이 정상 종료되었습니다' : `⚠️ 추론 로그 연결이 예상치 못하게 종료되었습니다 (코드: ${event.code})`,
        source: 'websocket'
      })
      connections.delete(key)
    }

    connections.set(key, ws)
    return ws
  }

  // 추론 통계 업데이트
  const updateInferenceStats = (logData: InferenceLogData) => {
    inferenceStats.value.total++

    if (logData.level === 'success') {
      inferenceStats.value.success++
    } else if (logData.level === 'error') {
      inferenceStats.value.error++
    } else if (logData.level === 'warning') {
      inferenceStats.value.warning++
    }

    // 성공률 계산
    inferenceStats.value.successRate = inferenceStats.value.total > 0
      ? Math.round((inferenceStats.value.success / inferenceStats.value.total) * 100)
      : 0
  }

  // 배포 로그 메시지에서 추론 통계 파싱 및 업데이트
  const updateInferenceStatsFromMessage = (logEntry: LogEntry) => {
    const message = logEntry.message

    // "N회 요청, 성공률 X.X%" 패턴 파싱
    const statsMatch = message.match(/(\d+)회 요청.*성공률[:\s]*(\d+\.?\d*)%/)
    if (statsMatch) {
      const totalRequests = parseInt(statsMatch[1])
      const successRate = parseFloat(statsMatch[2])

      // 기존 통계 업데이트
      inferenceStats.value.total = totalRequests
      inferenceStats.value.success = Math.round((totalRequests * successRate) / 100)
      inferenceStats.value.error = totalRequests - inferenceStats.value.success
      inferenceStats.value.successRate = Math.round(successRate)

      console.log('📊 추론 통계 업데이트:', {
        total: inferenceStats.value.total,
        success: inferenceStats.value.success,
        error: inferenceStats.value.error,
        successRate: inferenceStats.value.successRate
      })
    }

    // 개별 요청 성공/실패 카운트
    if (message.includes('✅') || message.includes('성공')) {
      // 성공 로그는 이미 통계에 반영됨
    } else if (message.includes('❌') || message.includes('실패') || message.includes('오류')) {
      // 실패 로그는 이미 통계에 반영됨
    }
  }

  // 트래픽 메트릭 WebSocket 연결
  const connectTrafficMetrics = (namespace: string, serviceName: string) => {
    const key = `metrics-${namespace}-${serviceName}`

    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    const url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/traffic-metrics`)

    const ws = new WebSocket(url)

    ws.onopen = () => {
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `📊 트래픽 메트릭 연결됨: ${serviceName}`,
        source: 'websocket'
      })
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)

        if (message.type === 'traffic_metrics') {
          metrics.value = message.data as TrafficMetrics
        }
      } catch (error) {
        console.error('메트릭 WebSocket 메시지 파싱 오류:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('트래픽 메트릭 WebSocket 오류:', error)
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: '❌ 트래픽 메트릭 연결 오류 발생',
        source: 'websocket'
      })
    }

    ws.onclose = (event) => {
      const isNormalClose = event.code === 1000
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: isNormalClose ? 'info' : 'warning',
        message: isNormalClose ? '✅ 트래픽 메트릭 연결이 정상 종료되었습니다' : '⚠️ 트래픽 메트릭 연결이 예상치 못하게 종료되었습니다',
        source: 'websocket'
      })
      connections.delete(key)
    }

    connections.set(key, ws)
    return ws
  }

  // 진행률 업데이트 로직
  const updateDeploymentProgress = (logEntry: LogEntry) => {
    const message = logEntry.message.toLowerCase()

    // 로그 메시지 기반 진행률 추정
    if (message.includes('시작') || message.includes('start')) {
      deploymentProgress.value = Math.max(deploymentProgress.value, 10)
    } else if (message.includes('pod') && message.includes('생성')) {
      deploymentProgress.value = Math.max(deploymentProgress.value, 30)
    } else if (message.includes('ready') || message.includes('준비')) {
      deploymentProgress.value = Math.max(deploymentProgress.value, 50)
    } else if (message.includes('트래픽') || message.includes('traffic')) {
      deploymentProgress.value = Math.max(deploymentProgress.value, 70)
    } else if (message.includes('검증') || message.includes('validation')) {
      deploymentProgress.value = Math.max(deploymentProgress.value, 90)
    } else if (message.includes('완료') || message.includes('complete')) {
      deploymentProgress.value = 100
    }

    // 상태 메시지 업데이트
    deploymentStatus.value = logEntry.message
  }

  // 추론 검증 로그 생성 (mlops-deployment-certification 스타일 시뮬레이션)
  const simulateInferenceValidation = (namespace: string, serviceName: string) => {
    // 실제 백엔드 데이터 구조와 동일한 개별 추론 요청 시뮬레이션
    const simulatedInferenceRequests = [
      {
        level: 'success',
        message: '✅ 추론 성공 #1 (156.23ms)',
        timestamp: new Date().toISOString(),
        metadata: {
          endpoint: `http://211.39.140.216:31894/v1/models/${serviceName}:predict`,
          payload_type: 'sklearn',
          success: true,
          status_code: 200,
          elapsed_time: 156.23,
          response_size: 95,
          success_rate: 100.0,
          predictions_count: 1,
          request_id: 1,
          response_content: {
            predictions: [[0.1, 0.7, 0.2]]
          }
        }
      },
      {
        level: 'success',
        message: '✅ 추론 성공 #2 (203.45ms)',
        timestamp: new Date().toISOString(),
        metadata: {
          endpoint: `http://211.39.140.216:31894/v1/models/${serviceName}:predict`,
          payload_type: 'sklearn',
          success: true,
          status_code: 200,
          elapsed_time: 203.45,
          response_size: 98,
          success_rate: 100.0,
          predictions_count: 1,
          request_id: 2,
          response_content: {
            predictions: [[0.3, 0.4, 0.3]]
          }
        }
      },
      {
        level: 'error',
        message: '❌ 추론 실패 #3 (5000ms)',
        timestamp: new Date().toISOString(),
        metadata: {
          endpoint: `http://211.39.140.216:31894/v1/models/${serviceName}:predict`,
          payload_type: 'sklearn',
          success: false,
          status_code: 500,
          elapsed_time: 5000,
          success_rate: 66.7,
          request_id: 3,
          error: 'Internal Server Error',
          error_content: {
            error: 'Model prediction failed',
            details: 'Connection timeout'
          }
        }
      },
      {
        level: 'success',
        message: '✅ 추론 성공 #4 (189.67ms)',
        timestamp: new Date().toISOString(),
        metadata: {
          endpoint: `http://211.39.140.216:31894/v1/models/${serviceName}:predict`,
          payload_type: 'sklearn',
          success: true,
          status_code: 200,
          elapsed_time: 189.67,
          response_size: 102,
          success_rate: 75.0,
          predictions_count: 1,
          request_id: 4,
          response_content: {
            predictions: [[0.2, 0.3, 0.5]]
          }
        }
      }
    ]

    let index = 0
    const intervalId = setInterval(() => {
      if (index < simulatedInferenceRequests.length) {
        const log = simulatedInferenceRequests[index] as LogEntry
        inferenceLogs.value.push(log)
        trimLogs(inferenceLogs)

        // 통계 업데이트
        if (log.metadata) {
          updateInferenceStatsFromIndividualRequest(log.metadata)
        }

        index++
      } else {
        clearInterval(intervalId)
      }
    }, 3000) // 3초 간격으로 개별 요청 표시
  }

  // 개별 추론 요청 메타데이터로부터 통계 업데이트
  const updateInferenceStatsFromIndividualRequest = (metadata: any) => {
    if (metadata.request_id) {
      inferenceStats.value.total = metadata.request_id
      inferenceStats.value.successRate = Math.round(metadata.success_rate || 0)
      inferenceStats.value.success = Math.round((inferenceStats.value.total * inferenceStats.value.successRate) / 100)
      inferenceStats.value.error = inferenceStats.value.total - inferenceStats.value.success

      console.log('📊 개별 요청 통계 업데이트:', {
        total: inferenceStats.value.total,
        success: inferenceStats.value.success,
        error: inferenceStats.value.error,
        successRate: inferenceStats.value.successRate
      })
    }
  }

  // 모든 연결 종료
  const disconnectAll = () => {
    connections.forEach((ws) => {
      ws.close()
    })
    connections.clear()
  }

  // 로그 초기화
  const clearLogs = () => {
    deploymentLogs.value = []
    podLogs.value = []
    inferenceLogs.value = []
    metrics.value = null
    inferenceStats.value = {
      total: 0,
      success: 0,
      error: 0,
      warning: 0,
      successRate: 0
    }
    deploymentProgress.value = 0
    deploymentStatus.value = '재배포 준비 중...'
  }

  // Ping 전송 (연결 유지)
  const sendPing = (ws: WebSocket) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }))
    }
  }

  // 정리 함수
  onUnmounted(() => {
    disconnectAll()
  })

  return {
    // 상태
    deploymentLogs: readonly(deploymentLogs),
    podLogs: readonly(podLogs),
    inferenceLogs: readonly(inferenceLogs),
    metrics: readonly(metrics),
    inferenceStats: readonly(inferenceStats),
    deploymentProgress: readonly(deploymentProgress),
    deploymentStatus: readonly(deploymentStatus),

    // 메소드
    connectDeploymentLogs,
    connectPodLogs,
    connectInferenceLogs,
    connectTrafficMetrics,
    simulateInferenceValidation,
    updateInferenceStats,
    updateInferenceStatsFromMessage,
    updateInferenceStatsFromIndividualRequest,
    disconnectAll,
    clearLogs,
    sendPing
  }
}