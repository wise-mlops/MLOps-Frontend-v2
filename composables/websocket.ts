interface WebSocketMessage {
  type: 'deployment_log' | 'pod_log' | 'traffic_metrics' | 'deployment_status' | 'deployment_complete' | 'deployment_error' | 'inference_log' | 'pod_tab_created' | 'pod_tab_removed' | 'pod_log_pattern_matched' | 'deployment_phase_changed' | 'deployment_analysis' | 'strategy_validation_step' | 'strategy_validation_result'
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

  // 로그 무제한 보존 (배포 기간 동안만이므로 메모리 문제 없음)

  // WebSocket URL 생성
  const getWebSocketUrl = (path: string): string => {
    const baseUrl = config.api.url.replace(/^http/, 'ws').replace(/\/$/, '')
    const fullUrl = `${baseUrl}${path}`
    return fullUrl
  }

  // 로그 트리밍 제거 - 모든 로그 보존

  // 배포 로그 WebSocket 연결
  const connectDeploymentLogs = (namespace: string, serviceName: string, deploymentId?: string) => {
    const key = deploymentId
      ? `deployment-${namespace}-${serviceName}-${deploymentId}`
      : `deployment-${namespace}-${serviceName}`

    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    let url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/deployment-logs`)
    if (deploymentId) {
      url += `?deployment_id=${deploymentId}`
    }
    const ws = new WebSocket(url)

    ws.onopen = () => {
      // 연결 알림 제거 - 백엔드 로그만 표시
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        if (message.type === 'inference_log') {
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
          updateInferenceStats(logData)
        } else if (message.type === 'deployment_log') {
          const logEntry: LogEntry = message.data
          deploymentLogs.value.push(logEntry)

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

          // 자동 연결 해제 (배포 완료)
          setTimeout(() => {
            disconnectAll()
          }, 2000) // 2초 후 연결 해제
        } else if (message.type === 'deployment_error') {
          deploymentStatus.value = '재배포 실패'

          // 자동 연결 해제 (배포 실패)
          setTimeout(() => {
            disconnectAll()
          }, 2000) // 2초 후 연결 해제
        } else if (message.type === 'deployment_analysis') {
          // 배포 완료 후 분석 결과
          deploymentLogs.value.push({
            timestamp: new Date().toISOString(),
            level: 'success',
            message: `📊 배포 분석 완료: ${message.data.summary || '분석 결과 확인'}`,
            source: 'websocket',
            metadata: message.data
          })
        } else if (message.type === 'strategy_validation_step') {
          // 배포 전략 검증 단계
          deploymentLogs.value.push({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `🔍 검증 단계: ${message.data.step || '검증 진행 중'}`,
            source: 'websocket',
            metadata: message.data
          })
        } else if (message.type === 'strategy_validation_result') {
          // 배포 전략 검증 결과
          const level = message.data.success ? 'success' : 'warning'
          deploymentLogs.value.push({
            timestamp: new Date().toISOString(),
            level: level,
            message: `✅ 검증 결과: ${message.data.message || '검증 완료'}`,
            source: 'websocket',
            metadata: message.data
          })
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error)
        // 파싱 오류 콘솔 로그만 유지
        console.error('WebSocket message parsing error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Deployment logs WebSocket error:', error)
    }

    ws.onclose = (event) => {
      console.log(`WebSocket closed: ${key}, code: ${event.code}`)
      connections.delete(key)
    }

    connections.set(key, ws)
    return ws
  }

  // Pod 로그 WebSocket 연결
  const connectPodLogs = (namespace: string, serviceName: string, strategy: string, deploymentId?: string, podType?: string) => {
    const key = deploymentId
      ? `pod-${namespace}-${serviceName}-${strategy}-${deploymentId}`
      : `pod-${namespace}-${serviceName}-${strategy}`


    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    // Pod 로그는 특정 pod_name이 필요하므로 임시로 strategy를 사용
    let url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/pod-logs/${strategy}`)
    const params = new URLSearchParams()
    if (deploymentId) {
      params.append('deployment_id', deploymentId)
    }
    if (podType) {
      params.append('pod_type', podType)
    }
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const ws = new WebSocket(url)

    ws.onopen = () => {
      // Pod 로그 연결 알림 제거
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)

        if (message.type === 'pod_log') {
          const podLogEntry: PodLogEntry = message.data
          podLogs.value.push(podLogEntry)
        } else if (message.type === 'deployment_phase_changed') {
          // 배포 단계 변경만 상태 업데이트
          if (message.data.phase) {
            deploymentStatus.value = message.data.phase
          }
        }
      } catch (error) {
        console.error('Pod logs WebSocket message parsing error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Pod logs WebSocket error:', error)
    }

    ws.onclose = (event) => {
      console.log(`Pod logs WebSocket closed: ${key}, code: ${event.code}`)
      connections.delete(key)
    }

    connections.set(key, ws)
    return ws
  }

  // 추론 로그 WebSocket 연결
  const connectInferenceLogs = (namespace: string, serviceName: string, deploymentId?: string) => {
    const key = deploymentId
      ? `inference-${namespace}-${serviceName}-${deploymentId}`
      : `inference-${namespace}-${serviceName}`


    if (connections.has(key)) {
      connections.get(key)?.close()
    }

    let url = getWebSocketUrl(`/inference-services/${namespace}/${serviceName}/inference-logs`)
    if (deploymentId) {
      url += `?deployment_id=${deploymentId}`
    }

    const ws = new WebSocket(url)

    ws.onopen = () => {
      // 추론 로그 연결 알림 제거
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)

        if (message.type === 'inference_log') {
          const logData: InferenceLogData = message.data

          // 추론 로그에 추가
          const logEntry: LogEntry = {
            timestamp: logData.timestamp || new Date().toISOString(),
            level: logData.level,
            message: logData.message,
            source: logData.source || 'inference',
            metadata: logData.response_data
          }

          inferenceLogs.value.push(logEntry)

          // 통계 업데이트
          updateInferenceStats(logData)
        }
      } catch (error) {
        console.error('Inference logs WebSocket message parsing error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Inference logs WebSocket error:', error)
    }

    ws.onclose = (event) => {
      console.log(`Inference logs WebSocket closed: ${key}, code: ${event.code}`)
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

    }

    // 개별 요청 성공/실패 카운트
    if (message.includes('✅') || message.includes('성공')) {
      // 성공 로그는 이미 통계에 반영됨
    } else if (message.includes('❌') || message.includes('실패') || message.includes('오류')) {
      // 실패 로그는 이미 통계에 반영됨
    }
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
    updateInferenceStats,
    updateInferenceStatsFromMessage,
    disconnectAll,
    clearLogs,
    sendPing
  }
}