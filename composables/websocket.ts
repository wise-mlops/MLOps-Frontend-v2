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

interface InferenceLogEntry {
  timestamp: string
  type: 'summary' | 'detail'
  success?: boolean
  responseTime?: number
  message: string
  request?: any
  response?: any
  expandable?: boolean
  expanded?: boolean
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

  // Non-reactive 캐시 시스템 (메모리 효율)
  let fullLogCache: {
    deployment: LogEntry[]
    pods: PodLogEntry[] // 단일 배열로 단순화
    inference: LogEntry[] // LogEntry로 통일
  } = { deployment: [], pods: [], inference: [] }

  // 화면 표시용 반응형 데이터 (최소한으로)
  const visibleLogs = ref<LogEntry[]>([])
  const currentPage = ref(0)
  const logsPerPage = 50

  // 기존 반응형 데이터 (가벼운 것들만 유지)
  const deploymentLogs = ref<LogEntry[]>([]) // 호환성을 위해 유지하되 사용 최소화
  const podLogs = ref<PodLogEntry[]>([]) // 호환성을 위해 유지하되 사용 최소화
  const inferenceLogs = ref<LogEntry[]>([]) // 추론 로그 reactive 추가
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

  // 로그 관리 상수 (기본 방식)
  const MAX_LOGS = 200 // 전체 로그 수 제한
  const MAX_POD_LOGS = 100 // Pod 로그 수 제한
  let cleanupInterval: NodeJS.Timeout | null = null

  // 기본 로그 추가 함수
  const addLogWithLimit = (logs: any[], newLog: any) => {
    logs.push(newLog)

    // 기본 제한: 최대 개수 초과시 앞쪽 절반 제거
    if (logs.length > MAX_LOGS) {
      const removeCount = Math.floor(MAX_LOGS / 2)
      logs.splice(0, removeCount)
    }
  }

  // Pod 로그 기본 추가 함수
  const addPodLogWithLimit = (logs: any[], newLog: any) => {
    logs.push(newLog)

    // Pod 로그 제한
    if (logs.length > MAX_POD_LOGS) {
      const removeCount = Math.floor(MAX_POD_LOGS / 2)
      logs.splice(0, removeCount)
    }
  }

  // Pod 타입 감지 함수 (디버깅용으로만 사용)
  const detectPodType = (podName: string): string => {
    console.log(`🔍 Pod 로그 수신: "${podName}"`) // 디버깅용

    if (podName.includes('canary')) return 'canary'
    if (podName.includes('green')) return 'green'
    if (podName.includes('blue')) return 'blue'
    if (podName.includes('stable')) return 'stable'
    if (podName.includes('predictor')) return 'predictor'

    return 'unknown'
  }

  // 기본 시간 기반 정리
  const timeBasedCleanup = () => {
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000 // 5분 전 로그만 정리

    // 배포 로그 정리 (5분 이상 된 로그만 제거)
    const beforeDeploy = fullLogCache.deployment.length
    fullLogCache.deployment = fullLogCache.deployment
      .filter(log => new Date(log.timestamp).getTime() > fiveMinutesAgo)
      .slice(-MAX_LOGS)

    // Pod 로그 정리
    const beforePod = fullLogCache.pods.length
    fullLogCache.pods = fullLogCache.pods
      .filter(log => new Date(log.timestamp).getTime() > fiveMinutesAgo)
      .slice(-MAX_POD_LOGS)

    // 추론 로그 정리
    const beforeInference = fullLogCache.inference.length
    fullLogCache.inference = fullLogCache.inference
      .filter(log => new Date(log.timestamp).getTime() > fiveMinutesAgo)
      .slice(-200)

    if (beforeDeploy !== fullLogCache.deployment.length || beforePod !== fullLogCache.pods.length || beforeInference !== fullLogCache.inference.length) {
      console.log(`시간 정리 - 배포: ${beforeDeploy}→${fullLogCache.deployment.length}, Pod: ${beforePod}→${fullLogCache.pods.length}, 추론: ${beforeInference}→${fullLogCache.inference.length}`)
    }
  }

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

    // 로그 정리 타이머 시작
    startCleanupTimer()

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

    // Non-reactive 캐시에 저장 (메모리 효율)
    addLogWithLimit(fullLogCache.deployment, logEntry)
    console.log(`📋 배포 로그 추가됨 (총 ${fullLogCache.deployment.length}개):`, logEntry.message)

    // 호환성을 위해 기존 reactive 배열에도 추가 (제한적으로)
    deploymentLogs.value.push(logEntry)
    if (deploymentLogs.value.length > 100) {
      deploymentLogs.value = deploymentLogs.value.slice(-50) // 최소한으로 유지
    }

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

    // 기본 방식으로 Pod 로그 추가
    addPodLogWithLimit(fullLogCache.pods, podLogEntry)
    addPodLogWithLimit(podLogs.value, podLogEntry)

    console.log(`📊 Pod 로그 추가됨 (총 ${podLogs.value.length}개):`, podLogEntry.message.substring(0, 100))

    // 중요한 패턴이 감지되면 배포 로그에도 추가
    if (message.data.patterns && Object.keys(message.data.patterns).length > 0) {
      const logEntry: LogEntry = {
        timestamp: message.timestamp,
        level: 'info',
        message: `Pod 패턴 감지: ${message.data.message}`,
        source: 'pod_pattern',
        metadata: message.data.patterns
      }
      addLogWithLimit(fullLogCache.deployment, logEntry)
      deploymentLogs.value.push(logEntry)
    }
  }

  const handleInferenceLog = (message: WebSocketMessage) => {
    console.log(`🔍 Inference 로그 수신:`, message.data) // 디버깅

    // 추론 통계 업데이트 (가벼우므로 reactive 유지)
    if (message.data.stats) {
      inferenceStats.value = {
        ...message.data.stats,
        lastUpdated: message.timestamp
      }
      console.log(`📊 추론 통계 업데이트:`, inferenceStats.value)
    }

    // 상세 추론 결과 처리
    if (message.data.result) {
      const result = message.data.result

      // LogEntry 형태로 추론 로그 생성
      const logEntry: LogEntry = {
        timestamp: message.timestamp,
        level: result.success ? 'success' : 'error',
        message: result.success
          ? `✅ 추론 성공 (${result.responseTime}ms)`
          : `❌ 추론 실패: ${result.errorMessage}`,
        source: 'inference_response',
        metadata: {
          success: result.success,
          responseTime: result.responseTime,
          request: result.request,
          response: result.response,
          ...result
        }
      }

      addLogWithLimit(fullLogCache.inference, logEntry)
      addLogWithLimit(inferenceLogs.value, logEntry)
      console.log(`🔍 추론 상세 로그 추가됨:`, {
        success: result.success,
        hasRequest: !!result.request,
        hasResponse: !!result.response,
        level: logEntry.level,
        totalInferenceLogs: fullLogCache.inference.length,
        reactiveCount: inferenceLogs.value.length
      })

    } else {
      // result가 없는 경우에도 기본 로그 생성 (일반 메시지)
      const basicLog: LogEntry = {
        timestamp: message.timestamp,
        level: 'info',
        message: message.data.message || JSON.stringify(message.data),
        source: 'inference',
        metadata: message.data
      }

      addLogWithLimit(fullLogCache.inference, basicLog)
      addLogWithLimit(inferenceLogs.value, basicLog)
      console.log(`🔍 추론 기본 로그 추가됨:`, basicLog.message)
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

    // 정리 타이머 중지
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }

  // 로그 초기화
  const clearLogs = () => {
    // Non-reactive 캐시 초기화
    fullLogCache = { deployment: [], pods: [], inference: [] }

    // Reactive 데이터 초기화
    deploymentLogs.value = []
    podLogs.value = []
    inferenceLogs.value = []
    visibleLogs.value = []
    currentPage.value = 0

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

  // 3채널 WebSocket 연결 시작
  const startCleanupTimer = () => {
    // 기존 타이머가 있으면 정리
    if (cleanupInterval) {
      clearInterval(cleanupInterval)
    }

    // 30초마다 정리 시작 (더 자주)
    cleanupInterval = setInterval(timeBasedCleanup, 30000)
    console.log('로그 정리 타이머 시작 (30초 주기)')
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
    inferenceLogs: readonly(inferenceLogs),
    inferenceStats: readonly(inferenceStats),
    deploymentReport: readonly(deploymentReport),
    deploymentProgress: readonly(deploymentProgress),
    deploymentStatus: readonly(deploymentStatus),
    isCompleted: readonly(isCompleted),

    // 새로운 최적화된 상태
    visibleLogs: readonly(visibleLogs),
    currentPage: readonly(currentPage),

    // 메소드
    connect3ChannelWebSocket,
    disconnect,
    clearLogs,

    // 새로운 캐시 접근 함수들
    getFullLogCache: () => fullLogCache,
    getPodTypes: () => [], // 단일 Pod 탭 구조에서는 사용하지 않음
    getPodLogs: (podType?: string) => fullLogCache.pods, // podType 무시하고 모든 Pod 로그 반환
    getInferenceLogs: () => fullLogCache.inference,
    getDeploymentLogCache: () => fullLogCache.deployment
  }
}