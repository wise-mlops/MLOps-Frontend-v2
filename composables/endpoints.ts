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

export const createEndpoint = async (namespace: string, name: string, inferenceServiceInfo: any) => {
  let url = encodeURI(`/inference-services/${namespace}/${name}`)
  const options = {
    headers: { "Content-Type": "application/json"},
    method: "POST",
    baseURL: config.api.url,
    body: inferenceServiceInfo
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response;
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

// MLmodel에서 dtype을 MLFlow 형식으로 매핑하는 함수
export const mapDtypeToMLFlow = (dtype: string): string => {
  const dtypeMap: Record<string, string> = {
    'int64': 'INT64',
    'int32': 'INT32', 
    'float64': 'FP64',
    'float32': 'FP32',
    'double': 'FP64',
    'float': 'FP32',
    'long': 'INT64',
    'int': 'INT32'
  }
  
  return dtypeMap[dtype.toLowerCase()] || 'FP64' // 기본값은 FP64
}

// MLmodel 파일에서 signature의 input dtype을 파싱하는 함수
export const getMLModelSignature = async (storageUri: string) => {
  try {
    let cleanUri = storageUri.replace(/^(s3:\/\/|minio:\/\/|gs:\/\/|\/\/)/, '')
    const firstSlashIndex = cleanUri.indexOf('/')
    if (firstSlashIndex === -1) {
      throw new Error('Invalid storage URI format')
    }
    
    const bucketName = cleanUri.substring(0, firstSlashIndex)
    const objectPath = cleanUri.substring(firstSlashIndex + 1)
    
    const mlModelPath = objectPath.endsWith('/') 
      ? `${objectPath}MLmodel`
      : `${objectPath}/MLmodel`
    
    const blob = await downloadObjects(bucketName, [mlModelPath])
    const text = await blob.text()
    
    // 여러 패턴으로 signature inputs 부분 추출 시도
    let inputsStr = null
    
    // 패턴 1: 작은따옴표로 감싸진 경우
    let match = text.match(/inputs:\s*'([^']+)'/s)
    if (match) {
      inputsStr = match[1]
    } else {
      // 패턴 2: 큰따옴표로 감싸진 경우  
      match = text.match(/inputs:\s*"([^"]+)"/s)
      if (match) {
        inputsStr = match[1].replace(/\\"/g, '"')
      } else {
        // 패턴 3: 따옴표 없이 JSON 형태
        match = text.match(/inputs:\s*(\[.*?\])/s)
        if (match) {
          inputsStr = match[1]
        }
      }
    }
    
    if (!inputsStr) {
      throw new Error('No inputs found in signature')
    }
    
    const inputs = JSON.parse(inputsStr)
    
    // 첫 번째 input의 dtype과 shape 추출
    if (inputs && inputs.length > 0) {
      const firstInput = inputs[0]
      const tensorSpec = firstInput['tensor-spec']
      
      if (tensorSpec && tensorSpec.dtype) {
        return {
          dtype: mapDtypeToMLFlow(tensorSpec.dtype),
          shape: tensorSpec.shape || [-1]
        }
      }
    }
    
    return null
    
  } catch (error) {
    console.error('Failed to fetch MLmodel:', error)
    return null
  }
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
    let mlModelSignature = null
    
    if (storageUri) {
      try {
        inputExample = await getInputExample(storageUri)
      } catch (error) {
        console.warn('Could not load input example:', error)
      }
      
      try {
        mlModelSignature = await getMLModelSignature(storageUri)
      } catch (error) {
        console.error('Failed to load MLmodel signature:', error)
        mlModelSignature = null
      }
    }
    return {
      endpoint: endpointDetails,
      inputExample,
      mlModelSignature
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