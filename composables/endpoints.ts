const config = useAppConfig()

export const getEndpoints = async ( namespace: string | null) => {
  let url = encodeURI(`/inference-services/${namespace}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const getEndpointDetails = async ( namespace: string | null, name: string | string[] ) => {
  let url = encodeURI(`/inference-services/${namespace}/${name}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const removeEndpoint = async ( namespace: string | null, name: string | string[] ) => {
  let url = encodeURI(`/inference-services/${namespace}/${name}`)
  const options = {
    headers: { "Content-Type": "application/json"},
    method: "DELETE",
    baseURL: config.api.url
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response;
}

export const getEndpointPods = async (namespace: string, name: string) => {
  let url = encodeURI(`/k8s-managements/namespaces/${namespace}/inference-services/${name}/pods`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })

  return response;
}

export const getEndpointEvents = async (namespace: string, name: string) => {
  let url = encodeURI(`/k8s-managements/namespaces/${namespace}/inference-services/${name}/events`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })

  return response;
}

export const getInferenceServiceStatus = async (namespace: string, name: string) => {
  let url = encodeURI(`/k8s-managements/namespaces/${namespace}/inference-services/${name}/status`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })

  return response;
}

export const getInputExample = async (storageUri: string) => {
  try {
    let cleanUri = storageUri.replace(/^(s3:\/\/|minio:\/\/|gs:\/\/|\/\/)/, '')
    const firstSlashIndex = cleanUri.indexOf('/')
    if (firstSlashIndex === -1) {
      throw new Error('Invalid storage URI format')
    }
    
    const bucketName = cleanUri.substring(0, firstSlashIndex)
    const objectPath = cleanUri.substring(firstSlashIndex + 1)
    
    const inputExamplePath = objectPath.endsWith('/') 
      ? `${objectPath}input_example.json`
      : `${objectPath}/input_example.json`
    
    const blob = await downloadObjects(bucketName, [inputExamplePath])

    const text = await blob.text()
    const jsonData = JSON.parse(text)
    
    return jsonData
    
  } catch (error) {
    console.error('Failed to fetch input_example.json:', error)
    throw error
  }
}

export const getEndpointWithInputExample = async (namespace: string | null, name: string | string[]) => {
  try {

    const endpointDetails = await getEndpointDetails(namespace, name)
    const storageUri = endpointDetails?.result.spec?.predictor?.model?.storageUri

    let inputExample = null
    if (storageUri) {
      try {
        inputExample = await getInputExample(storageUri)
      } catch (error) {
        console.warn('Could not load input example:', error)
      }
    }
    return {
      endpoint: endpointDetails,
      inputExample
    }
  } catch (error) {
    console.error('Failed to fetch endpoint with input example:', error)
    throw error
  }
}

// LLM 모델인지 확인하는 함수
export const isLLMModel = (endpointDetails: any): boolean => {
  // VLLM 런타임이나 LLM 관련 정보가 있는지 확인
  const containers = endpointDetails?.result?.spec?.predictor?.containers || []
  const envs = endpointDetails?.result?.spec?.predictor?.model?.env || []
  
  // containers 배열에서 VLLM 관련 이미지나 설정이 있는지 확인
  const hasVllmContainer = containers.some((container: any) => {
    const image = container?.image || ''
    const containerEnvs = container?.env || []
    
    // 컨테이너 이미지에 vllm이 포함되어 있는지 확인
    if (image.toLowerCase().includes('vllm')) {
      return true
    }
    
    // 컨테이너 환경변수에 VLLM 관련 설정이 있는지 확인
    return containerEnvs.some((env: any) => 
      env.name && env.name.toLowerCase().includes('vllm')
    )
  })
  
  if (hasVllmContainer) {
    return true
  }
  
  // 모델 레벨 환경변수에 VLLM 관련 설정이 있으면 LLM으로 판단
  const hasVllmEnv = envs.some((env: any) => 
    env.name && env.name.toLowerCase().includes('vllm')
  )
  
  if (hasVllmEnv) {
    return true
  }
  
  return false
}

// VLLM API를 통한 LLM 추론
export const runLLMInference = async (
  namespace: string, 
  name: string, 
  prompt: string, 
  max_tokens: number = 256, 
  temperature: number = 0.7
) => {
  const url = `/inference-services/${namespace}/${name}/infer-vllm`
  
  const response = await $fetch<ResponseBody>(url, {
    method: 'POST',
    baseURL: config.api.url,
    body: {
      prompt: prompt,
      max_tokens: max_tokens,
      temperature: temperature
    },
    headers: {
      "Content-Type": "application/json",
      "wisenut-authorization": "miracle-wisenut",
    },
  })
  
  return response
}

// MLFlow 모델인지 확인하는 함수
export const isMLFlowModel = (endpointDetails: any): boolean => {
  const predictor = endpointDetails?.result?.spec?.predictor
  const modelFormat = predictor?.model?.modelFormat?.name
  
  return modelFormat === 'mlflow'
}

// === Inference Result Processing Utilities ===

export const formatNumber = (value: any): string => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value !== "number" || isNaN(value)) return String(value);
  try {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (error) {
    return String(value);
  }
}

export const hasLLMText = (result: any): boolean => {
  return !!(result?.choices?.[0]?.text || result?.result?.choices?.[0]?.text);
}

export const getLLMText = (result: any): string => {
  return result?.choices?.[0]?.text || result?.result?.choices?.[0]?.text || '';
}

export const getLLMUsage = (result: any) => {
  return result?.usage || result?.result?.usage;
}

// MLFlow 숫자 배열 결과인지 확인 (result.result가 숫자 배열인 경우)
export const isNumericArrayResult = (result: any): boolean => {
  return !!(result?.result && Array.isArray(result.result) && result.result.length > 0 && typeof result.result[0] === 'number');
}

export const getResultTitle = (isMLFlow: boolean, result: any): string => {
  return !isMLFlow && hasLLMText(result) ? 'Generated Text' : 'Prediction';
}

export const isMLFlowArrayResult = (result: any): boolean => {
  return !!(result?.result && Array.isArray(result.result));
}

export const isDirectArrayResult = (result: any): boolean => {
  return !!(result && Array.isArray(result));
}

export const isObjectResult = (result: any): boolean => {
  return !!(result && typeof result === 'object' && !Array.isArray(result));
}