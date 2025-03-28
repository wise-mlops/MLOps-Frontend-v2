const config = useAppConfig()

export const getRuns = async ( experiment_id : string | string[] | null) => {
  let query: any = {
    page_size: 500
  };
  if (experiment_id) query.experiment_id = experiment_id;

  // let url = encodeURI(`/kfp/runs`)
  let url = encodeURI(`/workflows/runs`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    params: query,
    baseURL: config.api.url,
  })
  return response;
}

export const getRunDetails = async( run_id: string | string[] ) => {
  
  let url = encodeURI(`/workflows/runs/${run_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  
  return response;
}

export const createRun = async ( body: any ) => {
  let url = encodeURI(`/workflows/runs`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: body.value
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}

export const removeRun = async ( run_id: string ) => {
  let url = encodeURI(`/workflows/runs/${run_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url
  })
  return response;
}