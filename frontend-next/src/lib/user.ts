const DEFAULT_AVATAR = '/images/profile/user-1.jpg'

export const getAvatarSrc = (avatar?: string | null) => {
    if (typeof avatar !== 'string') {
        return DEFAULT_AVATAR
    }

    const normalizedAvatar = avatar.trim()
    return normalizedAvatar || DEFAULT_AVATAR
}

export {DEFAULT_AVATAR}
