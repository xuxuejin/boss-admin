'use client'
import Link from 'next/link'
import Image from 'next/image'
import {Icon} from '@iconify/react'
import * as profileData from './data'
import SimpleBar from 'simplebar-react'
import {Button} from '@/components/ui/button'
import {Skeleton} from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {useRouter} from "next/navigation";
import {logout} from '@/services/auth'
import {toast} from "sonner";
import {useUserStore} from "@/stores/userStore";
import {getAvatarSrc} from '@/lib/user'

const Profile = () => {
    const isFetching = useUserStore((state) => state.isFetching);
    const userInfo = useUserStore((state) => state.user)
    const router = useRouter()
    const handleLogout = async () => {
        try {
            const {code, message} = await logout()
            if (code === 0) {
                toast.success(message)
                router.push('/auth/login')
            } else {
                toast.error(message)
            }
        } catch (e: any) {
            toast.error(e?.message)
        }
    }
    if (isFetching) return <Skeleton className="h-9 w-9 rounded-full"/>;

    if (!userInfo) return null;

    return (
        <div className='relative group/menu ps-15 shrink-0'>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
          <span
              className='hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary'>
            <Image
                src={getAvatarSrc(userInfo.avatar)}
                alt='logo'
                height={35}
                width={35}
                className='rounded-full'
            />
          </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align='end'
                    className='w-screen sm:w-50 pb-4 pt-2 rounded-sm'>
                    <SimpleBar>
                        {profileData.profileDD.map((item, index) => (
                            <DropdownMenuItem key={index} asChild>
                                <Link
                                    href={item.url}
                                    className='px-4 py-2 flex justify-between items-center group/link w-full hover:bg-lightprimary hover:text-primary'>
                                    <div className='flex items-center gap-3 w-full'>
                                        <Icon
                                            icon={item.icon}
                                            className='text-lg text-muted-foreground group-hover/link:text-primary'
                                        />
                                        <h5 className='mb-0 text-sm text-muted-foreground group-hover/link:text-primary'>
                                            {item.title}
                                        </h5>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </SimpleBar>

                    <DropdownMenuSeparator className='my-2'/>

                    <div className='px-4'>
                        <Button variant='outline' className='w-full rounded-md' onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default Profile
