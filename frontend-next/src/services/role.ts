import { del, get, post, put } from '@/utils/http'
import type {
    RoleApiItem,
    RoleDataScopePayload,
    RoleListParams,
    RoleMenuApiItem,
    RolePayload,
    RoleStatus,
    RoleUserApiItem,
    RoleUsersQuery,
} from '@/types/role'

export const getRoles = (params?: RoleListParams) =>
    get<RoleApiItem[] | null>('/role', {
        params,
    })

export const getRoleDetail = (id: number) => get<RoleApiItem>(`/role/${id}`)

export const createRole = (data: RolePayload) =>
    post<RoleApiItem>('/role', data)

export const updateRole = (id: number, data: RolePayload) =>
    put<RoleApiItem>(`/role/${id}`, data)

export const deleteRole = (id: number) => del<null>(`/role/${id}`)

export const updateRoleStatus = (id: number, status: RoleStatus) =>
    put<RoleApiItem>(`/role/${id}/status`, {
        status,
    })

export const getRoleMenuTree = (roleId?: number) =>
    get<RoleMenuApiItem[] | null>(
        roleId ? `/role/${roleId}/menus` : '/menu/tree',
    )

export const updateRoleDataScope = (id: number, data: RoleDataScopePayload) =>
    put<RoleApiItem>(`/role/${id}/data-scope`, data)

export const getRoleAssignedUsers = (roleId: number, params?: RoleUsersQuery) =>
    get<RoleUserApiItem[] | null>(`/role/${roleId}/users`, {
        params,
    })

export const getRoleUnassignedUsers = (
    roleId: number,
    params?: RoleUsersQuery,
) =>
    get<RoleUserApiItem[] | null>(`/role/${roleId}/users/unassigned`, {
        params,
    })

export const assignUsersToRole = (roleId: number, userIds: number[]) =>
    post<null>(`/role/${roleId}/users`, {
        user_ids: userIds,
    })

export const removeUserFromRole = (roleId: number, userId: number) =>
    del<null>(`/role/${roleId}/users/${userId}`)
