// 평가 관련 타입 정의

export interface EvaluationJobResponse {
  success: boolean
  message: string
  job_name: string
  pod_name?: string
  status?: EvaluationJobStatus
}

export interface EvaluationJobStatus {
  phase: string
  active?: number
  succeeded?: number
  failed?: number
  conditions?: Array<{
    type: string
    status: string
    lastTransitionTime?: string
    reason?: string
    message?: string
  }>
}

export interface EvaluationLogMessage {
  timestamp: string
  job_name: string
  message: string
  phase: string
  type?: string
}

export interface EvaluationModel {
  name: string
  namespace: string
  serving_type: string
  status: string
  created_at: string
}