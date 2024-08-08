const config = useAppConfig()

export const getExperiments = async () => {
  let url = encodeURI(`/kfp/experiments`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
}


export const createExperiment = async ( body:any ) => {
  let url = encodeURI(`/kfp/experiments`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: body.value
  }
  console.log(options)
  const response = await $fetch<ResponseBody>(url, options as object)
  
  return response;
}