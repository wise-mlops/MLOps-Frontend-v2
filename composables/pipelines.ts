const config = useAppConfig()

export const getPipelines = async () => {
  // let url = encodeURI(`/kfp/pipelines`)
  let url = encodeURI(`/workflows/ml-pipelines`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
}


export const getPipelineVersions = async ( pipeline_id: string | string[] ) => {
  // let url = encodeURI(`/kfp/pipelines/versions/${pipelineId}`)
  let url = encodeURI(`/workflows/ml-pipelines/${pipeline_id}/versions`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,    
  })  
  return response;
}

export const getPipelineDetails = async ( pipeline_id: string | string[], version: string ) => {
  // let url = encodeURI(`/pipeline/${pipeline_id}`)
  let url = encodeURI(`/workflows/ml-pipelines/${pipeline_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url
  })
  return response;
}

export const getPipelineVersionDetails = async ( pipeline_id: string | string[], version_id: string ) => {
  // let url = encodeURI(`/kfp/pipelines/versions/${id}/${version}`)
  let url = encodeURI(`/workflows/ml-pipelines/${pipeline_id}/versions/${version_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url
  })
  return response;
}

export const getPipelineVersionDetailsKFP = async ( pipeline_id: string | string[], version_id: string ) => {
  // let url = encodeURI(`/kfp/pipelines/versions/${id}/${version}`)
  let url = encodeURI(`/workflows/pipelines/${pipeline_id}/versions/${version_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url
  })
  return response;
}

export const createPipeline = async ( pipeline: any ) => {
  // let url = encodeURI(`/workflow/pipeline`);
  let url = encodeURI(`/workflows/ml-pipelines`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    params: {
      start_run: false
    },
    body: pipeline
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}

export const createPipelineVersion = async ( pipeline_id: string, pipeline: any ) => {
  // let url = encodeURI(`/workflow/pipeline`);
  let url = encodeURI(`/workflows/ml-pipelines/${pipeline_id}/versions`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    params: {
      start_run: false
    },
    body: pipeline
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}

export const removePipeline = async ( pipeline_id : string ) => {
  // let url = encodeURI(`/kfp/pipelines/${pipeline_id}`)
  let url = encodeURI(`/workflows/ml-pipelines/${pipeline_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url
  })
  return response;
}

export const removePipelineVersion = async ( pipeline_id : string , version_id: string) =>  {
  // let url = encodeURI(`/kfp/pipelines/versions/${pipeline_id}/${pipeline_version_id}`)
  let url = encodeURI(`/workflows/ml-pipelines/${pipeline_id}/versions/${version_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url
  })
  return response;
}

export const getPipelineComponentTypes = async () => {
  let url = encodeURI(`/workflows/components`);
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url
  })
  return response;
}



