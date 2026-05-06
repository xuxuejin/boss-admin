import {post} from '@/utils/http'

interface LoginRes {
    access_token: string;
}

interface LoginReq {
    username: string;
    password: string;
    captcha_code: string;
    captcha_id: string;
}

export const login = (data: LoginReq) => post<LoginRes>('/auth/login', {...data})

export const logout = () => post('/auth/logout')
