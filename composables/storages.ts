const config = useAppConfig()

export const getBuckets = async () => {
  let url = encodeURI(`/storages`)  
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const removeBucket = async ( bucket_name: string | string[] ) => {
  let url = encodeURI(`/storages/${bucket_name}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'DELETE',
    baseURL: config.api.url,
  })
  return response
}