'use client'
import Image from 'next/image'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import {Icon} from '@iconify/react/dist/iconify.js'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {useState, useEffect, useRef, type ChangeEvent} from 'react'
import BreadcrumbComp from '@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useUserStore} from "@/stores/userStore";
import {toast} from 'sonner'
import {getUserInfo, uploadUserAvatar} from '@/services/user'
import {getAvatarSrc} from '@/lib/user'

const UserProfile = () => {
    const userInfo = useUserStore((state) => state.user)
    const setUser = useUserStore((state) => state.setUser)
    const [openModal, setOpenModal] = useState(false)
    const [modalType, setModalType] = useState<'personal' | 'address' | null>(null)
    const [personal, setPersonal] = useState(null)
    const [address, setAddress] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState('')
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)


    const [tempPersonal, setTempPersonal] = useState({
        username: '',
        email: '',
        phone: '',
        position: ''
    })
    const [tempAddress, setTempAddress] = useState({location: '', state: '', pin: '', zip: '', taxNo: ''})
    const currentAvatarSrc = avatarPreview || getAvatarSrc(userInfo?.avatar)

    useEffect(() => {
        if (openModal) {
            if (modalType === 'personal' && userInfo) {
                setTempPersonal({
                    username: userInfo.username || '',
                    email: userInfo.email || '',
                    phone: userInfo.phone_number || '',
                    position: userInfo.position_name || '',
                })
            }
        }
    }, [openModal, modalType, userInfo])

    useEffect(() => {
        setAvatarPreview(getAvatarSrc(userInfo?.avatar))
    }, [userInfo?.avatar])

    useEffect(() => {
        return () => {
            if (typeof avatarPreview === 'string' && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview)
            }
        }
    }, [avatarPreview])

    const handleSave = () => {
        if (modalType === 'personal') {
            console.log("提交个人信息:", tempPersonal)
            // 调用你的 API 或 store 更新方法
            // setUser({...userInfo, ...tempPersonal})
        } else if (modalType === 'address') {
            // setAddress(tempAddress)
        }
        setOpenModal(false)
    }

    const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        if (!file || !userInfo) {
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.error('请上传图片文件')
            event.target.value = ''
            return
        }

        const maxSize = 2 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error('图片大小不能超过 2MB')
            event.target.value = ''
            return
        }

        const previousAvatar = currentAvatarSrc
        const previewUrl = URL.createObjectURL(file)
        if (typeof avatarPreview === 'string' && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview)
        }
        setAvatarPreview(previewUrl)

        try {
            setIsUploadingAvatar(true)
            const {code, message} = await uploadUserAvatar(file)
            if (code !== 0) {
                throw new Error(message || '头像上传失败')
            }

            const userRes = await getUserInfo()
            if (userRes.code === 0) {
                setUser(userRes.data)
            }
            toast.success('头像上传成功')
        } catch (error: any) {
            setAvatarPreview(previousAvatar)
            URL.revokeObjectURL(previewUrl)
            toast.error(error?.message || '头像上传失败')
        } finally {
            setIsUploadingAvatar(false)
            event.target.value = ''
        }
    }

    const socialLinks = [
        {
            href: 'https://www.facebook.com/wrappixel',
            icon: 'streamline-logos:facebook-logo-2-solid',
        },
        {
            href: 'https://twitter.com/wrappixel',
            icon: 'streamline-logos:x-twitter-logo-solid',
        },
        {href: 'https://github.com/wrappixel', icon: 'ion:logo-github'},
        {
            href: 'https://dribbble.com/wrappixel',
            icon: 'streamline-flex:dribble-logo-remix',
        },
    ]

    const BCrumb = [
        {
            to: '/',
            title: 'Home',
        },
        {
            title: 'Userprofile',
        },
    ]
    return (
        <>
            <BreadcrumbComp title='User Profile' items={BCrumb}/>
            <div className='flex flex-col gap-6'>
                <CardBox className='p-6 overflow-hidden'>
                    <div
                        className='flex flex-col sm:flex-row items-center gap-6 rounded-xl relative w-full break-words'>
                        <div className='relative'>
                            {userInfo && (
                                <>
                                    <button
                                        type='button'
                                        disabled={isUploadingAvatar}
                                        onClick={() => fileInputRef.current?.click()}
                                        className='group relative h-20 w-20 overflow-hidden rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-80'
                                    >
                                        <Image
                                            src={currentAvatarSrc}
                                            alt='image'
                                            width={80}
                                            height={80}
                                            className='h-20 w-20 rounded-full object-cover'
                                        />
                                        <span className='absolute inset-0 flex items-center justify-center bg-black/45 px-2 text-center text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100'>
                                            {isUploadingAvatar ? '上传中...' : '上传头像'}
                                        </span>
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type='file'
                                        accept='image/*'
                                        className='hidden'
                                        onChange={handleAvatarUpload}
                                    />
                                </>
                            )}
                        </div>
                        <div className='flex flex-wrap gap-4 justify-center sm:justify-between items-center w-full'>
                            <div className='flex flex-col sm:text-left text-center gap-1.5'>
                                <h5 className='card-title'>
                                    {userInfo?.username}
                                </h5>
                                <div className='flex flex-wrap items-center gap-1 md:gap-3'>
                                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                                        {userInfo?.position_name || '--'}
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center gap-2'>
                                {socialLinks.map((item, index) => (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        target='_blank'
                                        className='flex h-11 w-11 items-center justify-center gap-2 rounded-full shadow-md border border-border hover:bg-gray-50 dark:hover:bg-white/[0.03] dark:hover:text-gray-200'>
                                        <Icon icon={item.icon} width='20' height='20'/>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardBox>

                <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                    <div className='space-y-6 rounded-xl border border-border  md:p-6 p-4 relative w-full break-words'>
                        <h5 className='card-title'>Personal Information</h5>
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32'>
                            <div>
                                <p className='text-xs text-gray-500'>Name</p>
                                <p>{userInfo?.username}</p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Phone</p>
                                <p>{userInfo?.phone_number || '--'}</p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Email</p>
                                <p>{userInfo?.email || '--'}</p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Position</p>
                                <p>{userInfo?.position_name || '--'}</p>
                            </div>
                        </div>
                        <div className='flex justify-end'>
                            <Button
                                onClick={() => {
                                    setModalType('personal')
                                    setOpenModal(true)
                                }}
                                color={'primary'}
                                className='flex items-center gap-1.5 rounded-md'>
                                <Icon icon='ic:outline-edit' width='18' height='18'/> Edit
                            </Button>
                        </div>
                    </div>

                    <div className='space-y-6 rounded-xl border border-border  md:p-6 p-4 relative w-full break-words'>
                        <h5 className='card-title'>Address Details</h5>
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-7 2xl:gap-x-32'>
                            <div>
                                <p className='text-xs text-gray-500'>Location</p>
                                <p>--</p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Province / State</p>
                                <p>--</p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>PIN Code</p>
                                <p>--</p>
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>ZIP</p>
                                <p>--</p>
                            </div>
                        </div>
                        <div className='flex justify-end'>
                            <Button
                                onClick={() => {
                                    setModalType('address')
                                    setOpenModal(true)
                                }}
                                color={'primary'}
                                className='flex items-center gap-1.5 rounded-md'>
                                <Icon icon='ic:outline-edit' width='18' height='18'/> Edit
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
                <DialogContent className='max-w-2xl'>
                    <DialogHeader>
                        <DialogTitle className='mb-4'>
                            {modalType === 'personal'
                                ? 'Edit Personal Information'
                                : 'Edit Address Details'}
                        </DialogTitle>
                    </DialogHeader>

                    {modalType === 'personal' ? (
                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='username'>Name</Label>
                                <Input
                                    id='username'
                                    placeholder='Name'
                                    value={tempPersonal.username}
                                    onChange={(e) =>
                                        setTempPersonal({
                                            ...tempPersonal,
                                            username: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='email'>Email</Label>
                                <Input
                                    id='email'
                                    placeholder='Email'
                                    value={tempPersonal.email}
                                    onChange={(e) =>
                                        setTempPersonal({...tempPersonal, email: e.target.value})
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='phone'>Phone</Label>
                                <Input
                                    id='phone'
                                    placeholder='Phone'
                                    value={tempPersonal.phone}
                                    onChange={(e) =>
                                        setTempPersonal({...tempPersonal, phone: e.target.value})
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='position'>Position</Label>
                                <Input
                                    id='position'
                                    placeholder='Position'
                                    value={tempPersonal.position}
                                    onChange={(e) =>
                                        setTempPersonal({
                                            ...tempPersonal,
                                            position: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='location'>Location</Label>
                                <Input
                                    id='location'
                                    placeholder='Location'
                                    value={tempAddress.location}
                                    onChange={(e) =>
                                        setTempAddress({...tempAddress, location: e.target.value})
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='state'>Province / State</Label>
                                <Input
                                    id='state'
                                    placeholder='Province / State'
                                    value={tempAddress.state}
                                    onChange={(e) =>
                                        setTempAddress({...tempAddress, state: e.target.value})
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='pin'>PIN Code</Label>
                                <Input
                                    id='pin'
                                    placeholder='PIN Code'
                                    value={tempAddress.pin}
                                    onChange={(e) =>
                                        setTempAddress({...tempAddress, pin: e.target.value})
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='zip'>ZIP</Label>
                                <Input
                                    id='zip'
                                    placeholder='ZIP'
                                    value={tempAddress.zip}
                                    onChange={(e) =>
                                        setTempAddress({...tempAddress, zip: e.target.value})
                                    }
                                />
                            </div>
                            <div className='flex flex-col gap-2'>
                                <Label htmlFor='taxNo'>Federal Tax No.</Label>
                                <Input
                                    id='taxNo'
                                    placeholder='Federal Tax No.'
                                    value={tempAddress.taxNo}
                                    onChange={(e) =>
                                        setTempAddress({...tempAddress, taxNo: e.target.value})
                                    }
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className='flex gap-2 mt-4'>
                        <Button
                            color={'primary'}
                            className='rounded-md'
                            onClick={handleSave}>
                            Save Changes
                        </Button>
                        <Button
                            color={'lighterror'}
                            className='rounded-md bg-lighterror dark:bg-darkerror text-error hover:bg-error hover:text-white'
                            onClick={() => setOpenModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default UserProfile
