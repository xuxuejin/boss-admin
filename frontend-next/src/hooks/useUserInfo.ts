import {useEffect, useState} from 'react';
import {getUserInfo} from '@/services/user';
import {useUserStore} from '@/stores/userStore';
import {toast} from "sonner";

export const useUserInfo = () => {
    const setUser = useUserStore((state) => state.setUser); // 使用 zustand 设置用户信息
    const user = useUserStore((state) => state.user);
    const isFetching = useUserStore((state) => state.isFetching);
    const setFetching = useUserStore((state) => state.setFetching);

    useEffect(() => {
        if (isFetching) return;
        const fetchUserInfo = async () => {
            setFetching(true);
            try {
                const {code, data, message} = await getUserInfo();
                if (code == 0) {
                    setUser(data)
                } else {
                    toast.error(message || 'Failed to fetch user info')
                }
            } catch (error: any) {
                toast.error(error?.message || 'Failed to fetch user info')
            } finally {
                setFetching(false);
            }
        };
        void fetchUserInfo();
    }, []);

    return {user, loading: isFetching};
};