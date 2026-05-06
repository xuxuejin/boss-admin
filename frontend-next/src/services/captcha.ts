import {get} from '@/utils/http'

interface CaptchaRes {
    img: string;
    uuid: string;
}

export const getCaptcha = () => get<CaptchaRes>('/captcha')