import {create} from "zustand";
import {persist} from "zustand/middleware";
import {UserInfo} from "@/types/user";

interface UserState {
    user: UserInfo | null;
    isFetching: boolean;   // ✅ 是否正在请求
    setUser: (user: UserInfo | null) => void;
    clearUser: () => void;
    setFetching: (v: boolean) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isFetching: false,
            setUser: (user) => set({user}),
            clearUser: () => set({user: null}),
            setFetching: (v) => set({isFetching: v})
        }),
        {
            name: "user-storage",
            partialize: (state) => ({
                user: state.user,
            }),
        }
    )
);