// 薄 fetch 封装：只负责拼装请求（JSON body / Content-Type / Bearer / signal）
// 和统一网络错误，返回原生 Response，把 ok 判断、状态码分支、响应体解析
// 留给各页面自己处理——它们的错误文案和容错策略各不相同，不适合硬统一。

export const isAbortError = (error) => error?.name === 'AbortError'

const DEFAULT_NETWORK_ERROR = '网络请求失败，请检查后端服务是否可达'

/**
 * @param {string} url
 * @param {object}  options
 * @param {string}  [options.method='GET']
 * @param {*}       [options.body]        对象会自动 JSON.stringify 并补 Content-Type；字符串原样发送
 * @param {object}  [options.headers]
 * @param {string}  [options.token]       传入才设置 Authorization；不传则完全不带（外部域名必须不传）
 * @param {AbortSignal} [options.signal]
 * @param {string}  [options.networkErrorMessage]
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, {
  method = 'GET',
  body,
  headers = {},
  token,
  signal,
  networkErrorMessage = DEFAULT_NETWORK_ERROR,
  ...init
} = {}) {
  const finalHeaders = { ...headers }

  if (token !== undefined && !finalHeaders.Authorization && !finalHeaders.authorization) {
    finalHeaders.Authorization = `Bearer ${token ?? ''}`
  }

  const options = { method, headers: finalHeaders, ...init }
  if (signal) options.signal = signal

  if (body !== undefined) {
    if (typeof body === 'string') {
      options.body = body
    } else {
      options.body = JSON.stringify(body)
      if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
        finalHeaders['Content-Type'] = 'application/json'
      }
    }
  }

  try {
    return await fetch(url, options)
  } catch (error) {
    // 取消请求要原样抛出，让调用方识别 AbortError 并跳过错误提示
    if (isAbortError(error)) throw error
    throw new Error(networkErrorMessage)
  }
}
