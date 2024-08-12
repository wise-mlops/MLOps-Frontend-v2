const config = useAppConfig()


export const getNotebooks = async ( namespace: string | null ) => {
  let url = encodeURI(`/crds/namespaces/${namespace}/notebooks`)
  
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
}

export const getNotebookDetails = async( namespace: string | null, name: string | string[] ) => {
  let url = encodeURI(`/crds/namespaces/${namespace}/notebooks/${name}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response;
}
