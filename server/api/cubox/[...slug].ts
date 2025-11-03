export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const query = getQuery(event)
  const body = await readBody(event).catch(() => null)
  
  // slug가 배열인지 문자열인지 확인
  const slugPath = Array.isArray(slug) ? slug.join('/') : slug
  const targetUrl = `http://mlops.cubox.ai/${slugPath}`
  
  try {
    const response = await $fetch(targetUrl, {
      method: event.node.req.method,
      query,
      body,
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://mlops.cubox.ai',
        'Referer': 'http://mlops.cubox.ai',
        // 클라이언트에서 온 SLURM 헤더 전달
        ...(event.node.req.headers['x-slurm-user'] && {
          'X-SLURM-USER': event.node.req.headers['x-slurm-user']
        }),
        ...(event.node.req.headers['x-slurm-password'] && {
          'X-SLURM-PASSWORD': event.node.req.headers['x-slurm-password']
        })
      }
    })
    
    return response
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Proxy Error'
    })
  }
})