'use client'

import React, {useEffect, useState} from 'react'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import Link from 'next/link'
import Image from "next/image"
import {Label} from '@/components/ui/label'
import {Checkbox} from '@/components/ui/checkbox'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {getCaptcha} from '@/services/captcha'
import {login} from '@/services/auth'
import {toast} from "sonner";
import {useRouter} from 'next/navigation'

export const Login = () => {
    const router = useRouter()
    const [captchaImg, setCaptchaImg] = useState('');
    const [captchaKey, setCaptchaKey] = useState('');
    const [userInputCaptcha, setUserInputCaptcha] = useState('');

    const [username, setUsername] = useState('boss')
    const [password, setPassword] = useState('boss')
    const [loading, setLoading] = useState(false)

    const loadCaptcha = async () => {
        setLoading(true)
        try {
            const {code, data, message} = await getCaptcha()

            if (code == 0) {
                const {img, uuid} = data;
                setCaptchaImg(img)
                setCaptchaKey(uuid)
                setUserInputCaptcha('')
            } else {
                toast.error(message)
            }
        } catch (e: any) {
            toast.error(e?.message || 'generateCaptcha error')
        } finally {
            setLoading(false)
        }
    };

    const handleLogin = async () => {
        // 简单的前端校验（可选更严格的校验）
        if (!username.trim()) return toast.error('请输入用户名')
        if (!password) return toast.error('请输入密码')
        if (!userInputCaptcha.trim()) return toast.error('请输入验证码')

        setLoading(true)

        try {
            const {code, data, message} = await login({
                username,
                password,
                captcha_code: userInputCaptcha,
                captcha_id: captchaKey,
            })

            if (code === 0) {
                toast.success('登录成功')
                router.push('/')
            } else {
                toast.error(message || '登录失败')
                void loadCaptcha()
            }
        } catch (err: any) {
            toast.error(err.message || '网络错误，请稍后重试')
            void loadCaptcha()
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadCaptcha()
    }, []);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void handleLogin()
    }

    return (
        <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
            <div className='md:min-w-112.5 min-w-max'>
                <CardBox>
                    <form onSubmit={handleSubmit}>
                        <div className='flex justify-center mb-4'>
                            <FullLogo/>
                        </div>
                        <p className='text-sm text-muted-foreground text-center mb-6'>
                            Welcome to Boss admin
                        </p>

                        {/* 用户名 */}
                        <div>
                            <div className='mb-2 block'>
                                <Label htmlFor='username1' className='font-medium'>Username</Label>
                            </div>
                            <Input id='username1' type='text' placeholder='Enter your username' value={username}
                                   onChange={(e) => setUsername(e.target.value)} required/>
                        </div>

                        {/* 密码 */}
                        <div className='mt-6'>
                            <div className='mb-2 block'>
                                <Label htmlFor='password1' className='font-medium'>Password</Label>
                            </div>
                            <Input id='password1' type='password' placeholder='Enter your password' value={password}
                                   onChange={(e) => setPassword(e.target.value)} required/>
                        </div>

                        {/* 图形验证码 - 点击图片自动刷新 */}
                        <div className='mt-6'>
                            <div className='mb-2 block'>
                                <Label htmlFor='captcha' className='font-medium'>Verification Code</Label>
                            </div>
                            <div className='flex gap-3'>
                                <Input
                                    id='captcha'
                                    className='flex-1'
                                    placeholder='Enter code'
                                    value={userInputCaptcha}
                                    onChange={(e) => setUserInputCaptcha(e.target.value)}
                                    required
                                />
                                <div
                                    onClick={loadCaptcha}
                                    className='w-32 h-10 bg-slate-100 border border-input rounded-md flex items-center justify-center cursor-pointer hover:bg-slate-200 active:bg-slate-300 transition-all select-none overflow-hidden'
                                    title="点击刷新验证码"
                                >
                                    {loading ? (<span className="text-xs text-muted-foreground">加载中...</span>) : (
                                        <Image src={`data:image/jpg;base64,${captchaImg}`} width={128} height={40}
                                               alt="captcha-image" unoptimized/>)}
                                </div>
                            </div>
                        </div>

                        <div className='flex flex-wrap gap-6 items-center justify-between my-6'>
                            <div className='flex items-center gap-2'>
                                <Checkbox id='remember' checked/>
                                <Label className='text-link font-normal text-sm' htmlFor='remember'>
                                    Remember this device
                                </Label>
                            </div>
                            <Link href='#' className='text-sm font-medium text-primary hover:text-primaryemphasis'>
                                Forgot Password ?
                            </Link>
                        </div>

                        <Button type='submit' className='w-full' disabled={loading}>
                            {loading ? 'Loading...' : 'Sign In'}
                        </Button>

                        <div className='flex items-center gap-2 justify-center mt-6 flex-wrap'>
                            <p className='text-base font-medium text-muted-foreground'>
                                New to BossAdmin?
                            </p>
                            <Link href='/auth/register'
                                  className='text-sm font-medium text-primary hover:text-primaryemphasis'>
                                Create an account
                            </Link>
                        </div>
                    </form>
                </CardBox>
            </div>
        </div>
    )
}
