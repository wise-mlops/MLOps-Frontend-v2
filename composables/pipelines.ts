const config = useAppConfig()

export const getPipelines = async () => {
  let url = encodeURI(`/kfp/pipelines`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
}


export const getPipelineVersions = async (pipelineId: string | string[]) => {
  let url = encodeURI(`/kfp/pipelines/versions/${pipelineId}`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,    
  })  
  return response;
}