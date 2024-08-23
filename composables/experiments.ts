const config = useAppConfig()

export const getExperiments = async () => {
  // let url = encodeURI(`/kfp/experiments`)
  let url = encodeURI(`/workflows/experiments`)
  
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })

  return response;
}

export const createExperiment = async ( body:any ) => {
  // let url = encodeURI(`/kfp/experiments`)
  let url = encodeURI(`/workflows/experiments`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: body.value
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  
  return response;
}

export const removeExperiment = async ( experiment_id: string ) => {
   
  let url = encodeURI (`/workflows/experiments/${experiment_id}`)
  const options = {
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
    baseURL: config.api.url
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  
  return response;
}