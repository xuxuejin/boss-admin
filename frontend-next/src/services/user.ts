import {get, post} from '@/utils/http'
import {UserInfo} from "@/types/user";

type UserRes = UserInfo;

export const getUserInfo = () => get<UserRes>('/users/me')

export const uploadUserAvatar = (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)

    return post<unknown>('/users/me/avatar', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
