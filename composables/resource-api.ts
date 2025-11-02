export const useResourceAPI = () => {
  const baseURL = '/api/cubox'

  const healthCheck = async () => {
    const response = await $fetch('/health', {
      method: 'GET',
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  }

  const getResourceInfo = async () => {
    const response = await $fetch('/resource', {
      method: 'GET',
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  }

  const getResourceStatus = async () => {
    const response = await $fetch('/resource/status', {
      method: 'GET',
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  }

  const getNodes = async () => {
    const response = await $fetch('/resource/status', {
      method: 'GET',
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response
  }

  return {
    healthCheck,
    getResourceInfo,
    getResourceStatus,
    getNodes
  }
}

export const useSlurmAPI = () => {
  const baseURL = '/api/cubox'
  const defaultHeaders = {
    'Content-Type': 'application/json'
  }

  const submitJob = async (jobData: any) => {
    const response = await $fetch('/slurm_api/submit', {
      method: 'POST',
      baseURL,
      headers: defaultHeaders,
      body: jobData
    })
    return response
  }

  const getJobStatus = async (jobId: string) => {
    const response = await $fetch(`/slurm_api/job/${jobId}`, {
      method: 'GET',
      baseURL,
      headers: defaultHeaders
    })
    return response
  }

  const getJobOutput = async (jobId: string) => {
    const response = await $fetch(`/slurm_api/job/${jobId}/output`, {
      method: 'GET',
      baseURL,
      headers: defaultHeaders
    })
    return response
  }

  return {
    submitJob,
    getJobStatus,
    getJobOutput
  }
}