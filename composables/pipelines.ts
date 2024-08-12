const config = useAppConfig()

export const getPipelines = async () => {
  let url = encodeURI(`/kfp/pipelines`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
}


export const getPipelineVersions = async ( pipelineId: string | string[] ) => {
  let url = encodeURI(`/kfp/pipelines/versions/${pipelineId}`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,    
  })  
  return response;
}

export const getPipelineDetails = async ( pipeline_id: string | string[], version: string ) => {
  let url = encodeURI(`/pipeline/${pipeline_id}`)
  console.log(url)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url
  })
  return response;
}

export const getPipelineVersionDetails = async ( id: string | string[], version: string ) => {
  let url = encodeURI(`/kfp/pipelines/versions/${id}/${version}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url
  })
  return response;
}

export const createPipeline = async ( pipeline: any ) => {
  let url = encodeURI(`/workflow/pipeline`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: pipeline
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}