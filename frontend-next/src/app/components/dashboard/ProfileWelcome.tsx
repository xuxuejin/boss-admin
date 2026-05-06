'use client'
import Image from "next/image"
import {useUserStore} from "@/stores/userStore";
import {Skeleton} from '@/components/ui/skeleton'
import {getAvatarSrc} from '@/lib/user'

const ProfileWelcome = () => {
    const isFetching = useUserStore(state => state.isFetching)
    const userInfo = useUserStore(state => state.user)

    if (isFetching) {
        return (
            <div className="flex items-center justify-between bg-lightsecondary rounded-lg p-6 w-full">
                <div className="flex items-center gap-3">
                    {/* 头像占位 */}
                    <Skeleton className="h-12 w-12 rounded-full"/>
                    <div className="flex flex-col gap-2">
                        {/* 标题占位 */}
                        <Skeleton className="h-5 w-32"/>
                        {/* 描述占位 */}
                        <Skeleton className="h-4 w-24"/>
                    </div>
                </div>
            </div>
        );
    }
    if (!userInfo) return null
    return (
        <div className="relative flex items-center justify-between bg-lightsecondary rounded-lg p-6">
            <div className="flex items-center gap-3">
                <div>
                    <Image src={getAvatarSrc(userInfo.avatar)} alt="user-img" width={50} height={50}
                           className="rounded-full"/>
                </div>
                <div className="flex flex-col gap-0.5">
                    <h5 className="card-title">Welcome back! {userInfo.username} 👋</h5>
                    <p className="text-muted-foreground">Check your reports</p>
                </div>
            </div>
            <div className="hidden sm:block absolute right-8 bottom-0">
                <Image src={"/images/dashboard/customer-support-img.png"} alt="support-img" width={145} height={96}
                       style={{width: 'auto', height: 'auto'}}
                />
            </div>
        </div>
    )
}

export default ProfileWelcome
