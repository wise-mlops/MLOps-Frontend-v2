import { method } from "lodash";

const config = useAppConfig()


export const getNotebooks = async ( namespace: string | null ) => {
  // let url = encodeURI(`/crds/namespaces/${namespace}/notebooks`)
  let url = encodeURI(`/k8s-managements/namespaces/${namespace}/notebooks`)
  
  const response  = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  
  return response;
}

export const getNotebookDetails = async( namespace: string | null, name: string | string[] ) => {
  // let url = encodeURI(`/crds/namespaces/${namespace}/notebooks/${name}`)
  let url = encodeURI(`/k8s-managements/namespaces/${namespace}/notebooks/${name}`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  
  return response;
}

export const createNotebook = async ( namespace: string | null, body: any ) => {
  let url = encodeURI (`/k8s-managements/namespaces/${namespace}/notebooks`)
  const options = {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    baseURL: config.api.url,
    body: body.value
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  return response;
}


export const removeNotebook = async ( namespace: string | null, name: string ) => {
   
  let url = encodeURI (`/k8s-managements/namespaces/${namespace}/notebooks/${name}`)
  const options = {
    headers: { "Content-Type": "application/json" },
    method: "DELETE",
    baseURL: config.api.url
  }
  const response = await $fetch<ResponseBody>(url, options as object)
  
  return response;
}