import axios from 'axios'
import { getSession, signOut } from 'next-auth/react'

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE_URL })

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession()
    const token = (session as any)?.accessToken
    if (token) {
      config.headers = { ...config.headers, Authorization: 'Bearer ' + token }
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401 && typeof window !== 'undefined') {
      await signOut({ callbackUrl: '/login' })
    }
    return Promise.reject(err)
  },
)
