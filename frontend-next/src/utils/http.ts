import axios, {
    AxiosError,
    AxiosResponse,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
} from 'axios'
import { useUserStore } from '@/stores/userStore'
import Cookies from 'js-cookie'

interface ApiResponse<T = any> {
    code: number
    data: T
    message: string
}

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 0,
    headers: {
        'Content-type': 'application/json',
    },
})

axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 使用 cookie 的方式传递 Token 而不是通过 Authorization 头部
        // if (typeof window !== "undefined") {
        //     const token = localStorage.getItem("token")

        //     if (token && config.headers) {
        //         config.headers.Authorization = `Bearer ${token}`
        //     }
        // }
        // 非安全操作需要从 Cookie 中获取 CSRF Token
        if (config.method &&['post', 'put', 'delete', 'patch'].includes(config.method)) {
            const csrfToken = Cookies.get('csrf_access_token')
            if (csrfToken) {
                config.headers['X-CSRF-TOKEN'] = csrfToken
            }
        }
        return config
    },
    (error: AxiosError) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        // 1. 处理文件下载 (Blob) 或 二进制流
        const responseType = response.config.responseType
        if (responseType === 'blob' || responseType === 'arraybuffer') {
            return response
        }
        return response.data
    },
    (error: AxiosError) => {
        if (error.response) {
            const responseData = error.response?.data as { message?: string; code?: number } | undefined
            const message = responseData?.message ||error.response.statusText
            switch (error.response.status) {
                case 401:
                    // Token 过期或未登录
                    if (typeof window !== 'undefined') {
                        const { clearUser } = useUserStore.getState()
                        if (
                            !window.location.pathname.startsWith('/auth/login')
                        ) {
                            clearUser()
                            const currentPath = window.location.pathname
                            window.location.replace(
                                `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
                            )
                        }
                    }
                    return Promise.reject(new Error(message))
                default:
                    return Promise.reject(new Error(message))
            }
        }
        return Promise.reject(error)
    },
)

export function request<T>(
    config: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
    return axiosInstance(config)
}

export function get<T>(
    url: string,
    config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
    return request<T>({
        method: 'GET',
        url,
        ...config,
    })
}

export function post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
    return request<T>({
        method: 'POST',
        url,
        data,
        ...config,
    })
}

export function put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
    return request<T>({
        method: 'PUT',
        url,
        data,
        ...config,
    })
}

export function del<T>(
    url: string,
    config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
    return request<T>({
        method: 'DELETE',
        url,
        ...config,
    })
}

export function download(
    url: string,
    config?: AxiosRequestConfig,
): Promise<AxiosResponse<Blob>> {
    return axiosInstance({
        method: 'GET',
        url,
        responseType: 'blob',
        ...config,
    })
}
