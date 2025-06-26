const config = useAppConfig()


export const getSimpleMLModels = async () => {
  let url = encodeURI(`/ml-service/ml-models`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}


export const getSimpleMLModelDetails = async ( exp_key: string | string[] ) => {
  let url = encodeURI(`/ml-service/ml-models/${exp_key}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}


export const removeSimpleMLModel = async ( exp_key: string | string[] ) => {
  let url = encodeURI(`/ml-service/ml-models/${exp_key}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url,
  })
  return response
}

// API 함수
export const predictSimpleMLModel = async (expKey: string, data: any): Promise<ResponseBody> => {
  let url = encodeURI(`/ml-service/ml-models/${expKey}/predict`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: data
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  return response;
};

// API 함수
export const trainSimpleMLModel = async (model_type: string, algorithm: string, data: any): Promise<ResponseBody> => {
  let url = encodeURI(`/ml-service/ml-models/${model_type}/${algorithm}/train`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: data
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  return response;
};