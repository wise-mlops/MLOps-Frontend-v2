const config = useAppConfig()

export const getRecurringRuns = async ( experiment_id : string | string[] | null) => {
  let query: any = {
    page_size: 500
  };
  if (experiment_id) query.experiment_id = experiment_id;

  // let url = encodeURI(`/kfp/runs`)
  let url = encodeURI(`/workflows/recurring-runs`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    params: query,
    baseURL: config.api.url,
  })
  return response;
}

export const getRecurringRunDetails = async( recurring_run_id: string | string[] ) => {
  
  let url = encodeURI(`/workflows/recurring-runs/${recurring_run_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  
  return response;
}

export const createRecurringRun = async ( body: any ) => {
  let url = encodeURI(`/workflows/recurring-runs`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: body
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}

export const removeRecurringRun = async ( recurring_run_id: string ) => {
  let url = encodeURI(`/workflows/recurring-runs/${recurring_run_id}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url
  })
  return response;
}

export const getRunsByRecurringRunId = async (recurring_run_id: string) => {
  let query: any = {
    page_size: 500
  };
  if (recurring_run_id) {
    query.search_column = 'recurring_run_id';
    query.search_keyword = recurring_run_id;
  }

  // let url = encodeURI(`/kfp/runs`)
  let url = encodeURI(`/workflows/runs`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    params: query,
    baseURL: config.api.url,
  })
  return response;
}

export const enableRecurringRun = async ( recurring_run_id: string ) => {
  let url = encodeURI(`/workflows/recurring-runs/${recurring_run_id}/enable`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'PATCH',
    baseURL: config.api.url
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}

export const disableRecurringRun = async ( recurring_run_id: string ) => {
  let url = encodeURI(`/workflows/recurring-runs/${recurring_run_id}/disable`);
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'PATCH',
    baseURL: config.api.url
  }
  const response = await $fetch<ResponseBody>(url, options as object)

  return response
}
