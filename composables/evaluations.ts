import type { EvaluationJobResponse, EvaluationLogMessage } from '~/types/evaluation'

const config = useAppConfig()

// 평가 Job 시작
export const startEvaluation = async (modelName: string): Promise<EvaluationJobResponse> => {
  const url = `/evaluation/${modelName}/start`

  try {
    const response = await $fetch<EvaluationJobResponse>(url, {
      method: 'POST',
      baseURL: config.api.url,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  } catch (error) {
    console.error('평가 시작 실패:', error)
    throw error
  }
}

// 평가 Job 중단
export const stopEvaluation = async (modelName: string): Promise<EvaluationJobResponse> => {
  const url = `/evaluation/${modelName}/stop`

  try {
    const response = await $fetch<EvaluationJobResponse>(url, {
      method: 'DELETE',
      baseURL: config.api.url,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  } catch (error) {
    console.error('평가 중단 실패:', error)
    throw error
  }
}

// 평가 Job 상태 조회
export const getEvaluationStatus = async (modelName: string): Promise<EvaluationJobResponse> => {
  const url = `/evaluation/${modelName}/status`

  try {
    const response = await $fetch<EvaluationJobResponse>(url, {
      method: 'GET',
      baseURL: config.api.url,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  } catch (error) {
    console.error('평가 상태 조회 실패:', error)
    throw error
  }
}

// 평가 WebSocket 연결용 Composable (websocket.ts 패턴 참고)
export const useEvaluationWebSocket = () => {
  const config = useAppConfig()

  const evaluationWs = ref<WebSocket | null>(null)
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const logs = ref<EvaluationLogMessage[]>([])
  const error = ref<string | null>(null)

  // WebSocket URL 생성 (Pod 이름 기반)
  const getWebSocketUrl = (podName: string) => {
    const baseUrl = config.api.url.replace(/^http/, 'ws').replace(/\/$/, '')
    return `${baseUrl}/evaluation/pod/${podName}/logs`
  }

  // WebSocket 연결 (Pod 이름 기반)
  const connect = (podName: string) => {
    // 기존 연결 종료
    disconnect()

    const wsUrl = getWebSocketUrl(podName)
    connectionStatus.value = 'connecting'
    error.value = null

    try {
      evaluationWs.value = new WebSocket(wsUrl)
      setupWebSocketHandlers(evaluationWs.value)
    } catch (error) {
      console.error('WebSocket 생성 실패:', error)
      connectionStatus.value = 'error'
      error.value = 'WebSocket 연결에 실패했습니다'
    }
  }

  // WebSocket 핸들러 설정 (websocket.ts 패턴 참고)
  const setupWebSocketHandlers = (ws: WebSocket) => {
    ws.onopen = () => {
      connectionStatus.value = 'connected'
    }

    ws.onmessage = (event) => {
      try {
        const message: EvaluationLogMessage = JSON.parse(event.data)
        handleMessage(message)
      } catch (error) {
        console.error('평가 로그 메시지 파싱 오류:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('평가 WebSocket 오류:', error)
      connectionStatus.value = 'error'
      error.value = '웹소켓 연결 오류가 발생했습니다'
    }

    ws.onclose = (event) => {
      connectionStatus.value = 'disconnected'
    }
  }

  // 메시지 처리
  const handleMessage = (message: EvaluationLogMessage) => {
    logs.value.push(message)

    // 최대 1000개 로그 유지
    if (logs.value.length > 1000) {
      logs.value = logs.value.slice(-1000)
    }
  }

  // 연결 해제
  const disconnect = () => {
    if (evaluationWs.value) {
      evaluationWs.value.close()
      evaluationWs.value = null
    }
    connectionStatus.value = 'disconnected'
  }

  // 로그 초기화
  const clearLogs = () => {
    logs.value = []
  }

  // 정리
  onUnmounted(() => {
    disconnect()
  })

  return {
    // 상태
    connectionStatus: readonly(connectionStatus),
    logs: readonly(logs),
    error: readonly(error),

    // 메소드
    connect,
    disconnect,
    clearLogs
  }
}