'use client'
import {ReactNode} from 'react'
import Header from './layout/header/Header'
import Sidebar from './layout/sidebar/Sidebar'
import {useUserInfo} from '@/hooks/useUserInfo';

export default function Layout({children}: Readonly<{ children: ReactNode }>) {
    useUserInfo();
    return (
        <div className='flex w-full min-h-screen'>
            <div className='page-wrapper flex min-w-0'>
                <div className='xl:block hidden'>
                    <Sidebar/>
                </div>
                <div className='body-wrapper min-w-0 w-full bg-background'>
                    <Header/>
                    <div className='w-full px-6 py-30'>{children}</div>
                </div>
            </div>
        </div>
    )
}
