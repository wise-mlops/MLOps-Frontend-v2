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