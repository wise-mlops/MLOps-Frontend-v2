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
  let url = encodeURI(`/inference-services/${namespace}/${name}/pods`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
};

export const getPodLogs = async (
  namespace: string,
  podName: string,
  container?: string,
  tailLines: number = 100,
  sinceSeconds?: number
) => {
  const params = new URLSearchParams();
  if (container) params.append('container', container);
  params.append('tail_lines', tailLines.toString());
  params.append('timestamps', 'true');
  if (sinceSeconds) params.append('since_seconds', sinceSeconds.toString());

  let url = encodeURI(`/inference-services/${namespace}/${podName}/logs?${params.toString()}`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
};

export const getEndpointEvents = async (
  namespace: string,
  name: string,
  limit?: number,
  eventType?: string
) => {
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (eventType) params.append('event_type', eventType);

  let url = encodeURI(`/inference-services/${namespace}/${name}/events?${params.toString()}`)

  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
};

export const getInferenceServiceStatus = async (namespace: string, name: string) => {
  let url = encodeURI(`/inference-services/${namespace}/${name}/status`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
};

export const getEndpointContainers = async (namespace: string, name: string) => {
  let url = encodeURI(`/inference-services/${namespace}/${name}/containers`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
};