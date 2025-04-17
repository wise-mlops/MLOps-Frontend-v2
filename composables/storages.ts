const config = useAppConfig()

export const getBuckets = async () => {
  let url = encodeURI(`/storages`)  
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
  })
  return response
}

export const createBucket = async ( bucket_name: string ) => {
  let url = encodeURI(`/storages/${bucket_name}`)
  const options = {
    headers: { "Content-type": "application/json" },
    method: 'POST',
    baseURL: config.api.url,
    body: {
      location: bucket_name,
      object_loack: false
    }
  }
  const response = await $fetch<ResponseBody>(url, options as object)
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

export const getObjects = async ( bucket_name: string | string[], slug: string  ) => {
  let url = encodeURI(`/storages/${bucket_name}/objects`)
  const response = await $fetch<ResponseBody>(url, {
    method: 'GET',
    baseURL: config.api.url,
    params: {
      prefix: slug,
      reverse: true
    },
  })  
  return response
}

export const createObjects = async ( bucket_name: string | string[], folder_path: string, files: File[] ) => {
  let url = encodeURI(`/storages/${bucket_name}/objects/upload`)
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  
  
  const response = await $fetch<ResponseBody>(url, {
    method: 'POST',
    baseURL: config.api.url,
    params: {
      folder_path: folder_path
    },
    body: formData
  })
  
  return response
  
}

export const downloadObject = async (bucket_name: string | string[], object_names: string[]) => {
  
  // object_names 배열을 직렬화
  const serializedParams = object_names
    .map((name) => `object_names=${name}`)
    .join('&');
    
  // URL에 직렬화된 파라미터 추가
  const url = encodeURI(`/storages/${bucket_name}/objects/download?${serializedParams}`);

  
  const blob = await $fetch<Blob>(url, {
    method: 'GET',
    responseType: 'blob', // 중요!
    baseURL: config.api.url,
    headers: {
      'Accept': 'application/octet-stream',
    }
  });
  
  return blob
  
};