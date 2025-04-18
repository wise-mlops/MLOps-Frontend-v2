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