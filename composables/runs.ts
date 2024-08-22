const config = useAppConfig()

export const getRuns = async ( experiment_id : string | string[] | null) => {
  let query: any = {};
  if (experiment_id) query.experiment_id = experiment_id;

  // let url = encodeURI(`/kfp/runs`)
  let url = encodeURI(`/workflows/runs`)
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  console.log(response)
  return response;
}