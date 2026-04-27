import axios, { AxiosError } from 'axios'
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'

const TOKEN_KEY = 'token'
const TOKEN_EXPIRY_KEY = 'token_expiry'
const TOKEN_TTL = 3 * 24 * 60 * 60 * 1000 // 3 天

const getStoredToken = (): string | null => {
  const token = window.localStorage.getItem(TOKEN_KEY)
  const expiry = Number(window.localStorage.getItem(TOKEN_EXPIRY_KEY))
  if (!token || !expiry || Date.now() >= expiry) {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_KEY)
    return null
  }
  return token
}

const setStoredToken = (token: string) => {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + TOKEN_TTL))
}

export const clearStoredToken = () => {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

export const isTokenValid = () => Boolean(getStoredToken())
export const setToken = (token: string) => setStoredToken(token)

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 统一处理响应数据结构
    return response.data
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      const message = (error.response.data as any)?.message || error.message
      console.error('[HTTP]', status, message)
    } else {
      console.error('[HTTP] Network Error', error.message)
    }
    return Promise.reject(error)
  },
)

export interface IServiceRequestConfig<T = any> extends AxiosRequestConfig {
  data?: T
}

export function request<T = any>(config: IServiceRequestConfig): Promise<T> {
  return service.request<T>(config) as Promise<T>
}

export function get<T = any>(
  url: string,
  params?: object,
  config?: AxiosRequestConfig,
): Promise<T> {
  return service.get<T>(url, { params, ...config }) as Promise<T>
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  return service.post<T>(url, data, config) as Promise<T>
}

export default service
