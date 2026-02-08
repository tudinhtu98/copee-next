import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL })

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession()
    const token = (session as any)?.accessToken
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
  }
  return config
})

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err?.config
    if (
      err?.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !originalRequest?._retry
    ) {
      // Thử refresh token 1 lần trước khi logout
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = tryRefreshToken()
      }

      const refreshed = await refreshPromise
      isRefreshing = false
      refreshPromise = null

      if (refreshed) {
        // Refresh thành công → retry request gốc với token mới
        originalRequest._retry = true
        const session = await getSession()
        const newToken = (session as any)?.accessToken
        if (newToken) {
          originalRequest.headers.Authorization = 'Bearer ' + newToken
        }
        return api(originalRequest)
      }

      // Refresh thất bại → logout
      await signOut({ callbackUrl: '/login' })
    }
    return Promise.reject(err)
  },
)
