const config = useAppConfig()

export const getAvailableDataset = async () => {
  let url = encodeURI(`/ml-service/auto-ml/datasets`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const removeAutoMLExperiments = async ( exp_keys: string) => {
  let url = encodeURI(`/ml-service/auto-ml`)
  if (exp_keys) {
    url += `?exp_keys=${exp_keys}`
  }

  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url,
  })
  return response
}

export const getNASExperiments = async () => {
  let url = encodeURI(`/ml-service/auto-ml/nas`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const getNASExperimentDetails = async (expKey: string) => {
  let url = encodeURI(`/ml-service/auto-ml/nas/${expKey}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const startNAS = async (data: any): Promise<ResponseBody> => {
  let url = encodeURI(`/ml-service/auto-ml/nas`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: data
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  return response;
};

export const getNASExperimentStatus = async (expKey: string) => {
  let url = encodeURI(`/ml-service/auto-ml/nas/${expKey}/status`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const getRetrainExperiments = async (expKey: string) => {
  let url = encodeURI(`/ml-service/auto-ml/retrain?nas_exp=${expKey}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const getRetrainExperimentStatus = async (expKey: string) => {
  let url = encodeURI(`/ml-service/auto-ml/retrain/${expKey}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const startRetrain = async (data: any): Promise<ResponseBody> => {
  let url = encodeURI(`/ml-service/auto-ml/retrain`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: data
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  return response;
};

export const getHPOExperiments = async (expKey: string) => {
  let url = encodeURI(`/ml-service/auto-ml/hpo?nas_exp=${expKey}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const getHPOExperimentStatus = async (expKey: string) => {
  let url = encodeURI(`/ml-service/auto-ml/hpo/${expKey}`)

  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const startHPO = async (data: any): Promise<ResponseBody> => {
  let url = encodeURI(`/ml-service/auto-ml/hpo`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: data
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  return response;
};
