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
    headers: { "Content-Type": "application/json" },
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