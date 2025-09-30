interface WebSocketMessage {
  type: 'deployment_log' | 'pod_log' | 'inference_log'
  subType?: string
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
  pod_name: string
  namespace: string
  message: string
  patterns?: any
}

interface InferenceStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  lastUpdated: string
}

interface DeploymentReportData {
  deploymentId: string
  strategy: string
  duration: number
  overallSuccess: boolean
  availability: number
  trafficAnalysis: any
  performanceMetrics: any
  podEvents: any[]
  validationResults: any
  startTime: string
  endTime: string
}

export const useWebSocket = () => {
  const config = useAppConfig()

  // 3채널 WebSocket 연결 관리
  const deploymentWs = ref<WebSocket | null>(null)
  const podWs = ref<WebSocket | null>(null)
  const inferenceWs = ref<WebSocket | null>(null)
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')

  // 채널별 데이터 저장소
  const deploymentLogs = ref<LogEntry[]>([])
  const podLogs = ref<PodLogEntry[]>([])
  const inferenceStats = ref<InferenceStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 0,
    averageResponseTime: 0,
    minResponseTime: 0,
    maxResponseTime: 0,
    lastUpdated: new Date().toISOString()
  })
  const deploymentReport = ref<DeploymentReportData | null>(null)

  // 배포 상태
  const deploymentProgress = ref(0)
  const deploymentStatus = ref('준비 중...')
  const isCompleted = ref(false)

  // 3채널 WebSocket URL 생성
  const getWebSocketUrls = (namespace: string, serviceName: string, deployment_id: string) => {
    const baseUrl = config.api.url.replace(/^http/, 'ws').replace(/\/$/, '')
    const prefix = `${baseUrl}/inference-services/${namespace}/${serviceName}`

    return {
      deploymentUrl: `${prefix}/deployment-logs?deployment_id=${deployment_id}`,
      podUrl: `${prefix}/pod-logs?deployment_id=${deployment_id}`,
      inferenceUrl: `${prefix}/inference-logs?deployment_id=${deployment_id}`
    }
  }

  // 3채널 WebSocket 연결
  const connect3ChannelWebSocket = (namespace: string, serviceName: string, deployment_id: string) => {
    // 기존 연결 종료
    disconnect()

    const urls = getWebSocketUrls(namespace, serviceName, deployment_id)
    console.log('🔗 3채널 WebSocket 연결 시작:', urls)

    connectionStatus.value = 'connecting'

    // 1. 배포 로그 채널
    deploymentWs.value = new WebSocket(urls.deploymentUrl)
    setupWebSocketHandlers(deploymentWs.value, 'deployment')

    // 2. Pod 로그 채널
    podWs.value = new WebSocket(urls.podUrl)
    setupWebSocketHandlers(podWs.value, 'pod')

    // 3. 추론 테스트 채널
    inferenceWs.value = new WebSocket(urls.inferenceUrl)
    setupWebSocketHandlers(inferenceWs.value, 'inference')

    return { deploymentWs: deploymentWs.value, podWs: podWs.value, inferenceWs: inferenceWs.value }
  }

  // WebSocket 핸들러 설정
  const setupWebSocketHandlers = (ws: WebSocket, channel: string) => {
    ws.onopen = () => {
      console.log(`✅ ${channel} WebSocket 연결 성공`)
      if (channel === 'deployment') {
        connectionStatus.value = 'connected'
      }
    }

    ws.onmessage = (event) => {
      try {
        console.log(`🔗 ${channel} raw 메시지 수신:`, event.data)
        const message: WebSocketMessage = JSON.parse(event.data)
        console.log(`📨 ${channel} 파싱된 메시지:`, {
          type: message.type,
          subType: message.subType,
          timestamp: message.timestamp,
          data: message.data
        })
        handleMessage(message)
      } catch (error) {
        console.error(`❌ ${channel} 메시지 파싱 오류:`, error, event.data)
      }
    }

    ws.onerror = (error) => {
      console.error(`❌ ${channel} WebSocket 오류:`, error)
    }

    ws.onclose = (event) => {
      console.log(`🔌 ${channel} WebSocket 연결 종료: code ${event.code}`)
      if (channel === 'deployment') {
        connectionStatus.value = 'disconnected'
      }
    }
  }

  // 메시지 처리
  const handleMessage = (message: WebSocketMessage) => {
    console.log(`🎯 메시지 처리 시작:`, message.type, message.subType)

    switch (message.type) {
      case 'deployment_log':
        console.log(`📋 deployment_log 처리:`, message)
        handleDeploymentLog(message)
        break
      case 'pod_log':
        console.log(`📊 pod_log 처리:`, message)
        handlePodLog(message)
        break
      case 'inference_log':
        console.log(`🔍 inference_log 처리:`, message)
        handleInferenceLog(message)
        break
      default:
        console.warn('❓ 알 수 없는 메시지 타입:', message.type, message)
    }
  }

  // 채널별 메시지 처리 함수들
  const handleDeploymentLog = (message: WebSocketMessage) => {
    const logEntry: LogEntry = {
      timestamp: message.timestamp,
      level: message.data.level || 'info',
      message: message.data.message || JSON.stringify(message.data),
      source: message.subType || 'deployment',
      metadata: message.data
    }
    deploymentLogs.value.push(logEntry)

    // 상태 업데이트 처리
    if (message.subType === 'status_update') {
      if (message.data.status) deploymentStatus.value = message.data.status
      if (message.data.progress !== undefined) deploymentProgress.value = message.data.progress
    }

    // 배포 완료 처리
    if (message.subType === 'deployment_completed') {
      isCompleted.value = true
      deploymentProgress.value = 100

      // 완료 후 보고서 로드
      if (message.data.deploymentId) {
        loadDeploymentReport(message.serviceName!, message.namespace!, message.data.deploymentId)
      }
    }
  }

  const handlePodLog = (message: WebSocketMessage) => {
    const podLogEntry: PodLogEntry = {
      timestamp: message.timestamp,
      pod_name: message.data.podName || 'unknown',
      namespace: message.namespace || 'unknown',
      message: message.data.message || JSON.stringify(message.data),
      patterns: message.data.patterns
    }
    podLogs.value.push(podLogEntry)

    // 중요한 패턴이 감지되면 배포 로그에도 추가
    if (message.data.patterns && Object.keys(message.data.patterns).length > 0) {
      const logEntry: LogEntry = {
        timestamp: message.timestamp,
        level: 'info',
        message: `Pod 패턴 감지: ${message.data.message}`,
        source: 'pod_pattern',
        metadata: message.data.patterns
      }
      deploymentLogs.value.push(logEntry)
    }
  }

  const handleInferenceLog = (message: WebSocketMessage) => {
    // 추론 통계 업데이트
    if (message.data.stats) {
      inferenceStats.value = {
        ...message.data.stats,
        lastUpdated: message.timestamp
      }
    }

    // 개별 추론 결과 로그
    if (message.data.result) {
      const result = message.data.result
      const level = result.success ? 'success' : 'error'
      const logEntry: LogEntry = {
        timestamp: message.timestamp,
        level,
        message: result.success
          ? `추론 성공 (${result.responseTime}ms)`
          : `추론 실패: ${result.errorMessage}`,
        source: 'inference_test',
        metadata: result
      }
      deploymentLogs.value.push(logEntry)
    }
  }

  // 배포 보고서 로드
  const loadDeploymentReport = async (serviceName: string, namespace: string, deploymentId: string) => {
    try {
      const { getDeploymentReport } = await import('~/composables/endpoints')
      const response = await getDeploymentReport(namespace, serviceName, deploymentId)
      if (response.success) {
        deploymentReport.value = response.result
      }
    } catch (error) {
      console.error('배포 보고서 로드 실패:', error)
    }
  }

  // 연결 해제
  const disconnect = () => {
    if (deploymentWs.value) {
      deploymentWs.value.close()
      deploymentWs.value = null
    }
    if (podWs.value) {
      podWs.value.close()
      podWs.value = null
    }
    if (inferenceWs.value) {
      inferenceWs.value.close()
      inferenceWs.value = null
    }
    connectionStatus.value = 'disconnected'
  }

  // 로그 초기화
  const clearLogs = () => {
    deploymentLogs.value = []
    podLogs.value = []
    inferenceStats.value = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      minResponseTime: 0,
      maxResponseTime: 0,
      lastUpdated: new Date().toISOString()
    }
    deploymentReport.value = null
    deploymentProgress.value = 0
    deploymentStatus.value = '준비 중...'
    isCompleted.value = false
  }

  // 정리
  onUnmounted(() => {
    disconnect()
  })

  return {
    // 상태
    connectionStatus: readonly(connectionStatus),
    deploymentLogs: readonly(deploymentLogs),
    podLogs: readonly(podLogs),
    inferenceStats: readonly(inferenceStats),
    deploymentReport: readonly(deploymentReport),
    deploymentProgress: readonly(deploymentProgress),
    deploymentStatus: readonly(deploymentStatus),
    isCompleted: readonly(isCompleted),

    // 메소드
    connect3ChannelWebSocket,
    disconnect,
    clearLogs
  }
}