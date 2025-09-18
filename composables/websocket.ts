interface WebSocketMessage {
  type: 'deployment_log' | 'pod_log' | 'traffic_metrics' | 'deployment_status' | 'deployment_complete' | 'deployment_error'
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

  // 배포 상태
  const deploymentProgress = ref(0)
  const deploymentStatus = ref('재배포 준비 중...')

  // 성능 최적화 상수
  const MAX_LOGS = 1000
  const LOG_TRIM_SIZE = 100

  // WebSocket URL 생성
  const getWebSocketUrl = (path: string): string => {
    const baseUrl = config.api.url.replace(/^http/, 'ws').replace(/\/$/, '')
    return `${baseUrl}${path}`
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
        console.log('🔔 WebSocket 메시지 수신:', message) // 디버깅용

        if (message.type === 'deployment_log') {
          const logEntry: LogEntry = message.data
          deploymentLogs.value.push(logEntry)
          trimLogs(deploymentLogs)

          // 추론 검증 로그는 inferenceLogs에도 추가 (백엔드 metadata 기반 + 키워드 매칭)
          const inferenceKeywords = ['추론', 'inference', '검증', 'validation', '테스트', 'test', 'verify']
          const isInferenceLog = logEntry.metadata?.type === 'inference' ||
                                 inferenceKeywords.some(keyword =>
                                   logEntry.message.toLowerCase().includes(keyword.toLowerCase())
                                 )

          if (isInferenceLog) {
            inferenceLogs.value.push(logEntry)
            trimLogs(inferenceLogs)
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
      deploymentLogs.value.push({
        timestamp: new Date().toISOString(),
        level: isNormalClose ? 'info' : 'warning',
        message: isNormalClose ? '✅ 배포 로그 연결이 정상 종료되었습니다' : '⚠️ 배포 로그 연결이 예상치 못하게 종료되었습니다',
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

  // 추론 검증 로그 생성 (시뮬레이션)
  const simulateInferenceValidation = (namespace: string, serviceName: string) => {
    const inferenceTestLogs = [
      { level: 'info', message: '추론 검증 시작', timestamp: new Date().toISOString() },
      { level: 'info', message: '테스트 페이로드 전송 중...', timestamp: new Date().toISOString() },
      { level: 'success', message: '추론 요청 성공 (응답시간: 245ms)', timestamp: new Date().toISOString() },
      { level: 'info', message: '응답 검증 중...', timestamp: new Date().toISOString() },
      { level: 'success', message: '추론 결과 검증 완료', timestamp: new Date().toISOString() }
    ]

    let index = 0
    const intervalId = setInterval(() => {
      if (index < inferenceTestLogs.length) {
        inferenceLogs.value.push(inferenceTestLogs[index] as LogEntry)
        index++
      } else {
        clearInterval(intervalId)
      }
    }, 2000)
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
    deploymentProgress: readonly(deploymentProgress),
    deploymentStatus: readonly(deploymentStatus),

    // 메소드
    connectDeploymentLogs,
    connectPodLogs,
    connectTrafficMetrics,
    simulateInferenceValidation,
    disconnectAll,
    clearLogs,
    sendPing
  }
}