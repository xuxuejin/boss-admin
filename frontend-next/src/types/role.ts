export type RoleStatus = 0 | 1

export type RoleDataScope = 1 | 2 | 3 | 4 | 5

export interface RoleApiItem {
    id: number
    name?: string | null
    key?: string | null
    order?: number | null
    status?: RoleStatus | number | null
    create_time?: number | string | null
    remark?: string | null
    menu_ids?: number[] | null
    data_scope?: RoleDataScope | number | null
    menu_check_strictly?: boolean | null
}

export interface RoleListParams {
    id?: number | string
    name?: string
    status?: number | string
    start_time?: string
    end_time?: string
}

export interface RolePayload {
    name: string
    key: string
    order: number
    status: RoleStatus
    remark: string
    menu_ids: number[]
    menu_check_strictly: boolean
}

export interface RoleDataScopePayload {
    data_scope: RoleDataScope
    menu_ids: number[]
    menu_check_strictly: boolean
}

export interface RoleMenuApiItem {
    id: number
    name?: string | null
    parent_id?: number | null
    children?: RoleMenuApiItem[] | null
}

export interface RoleUserApiItem {
    id: number
    username?: string | null
    nickname?: string | null
    email?: string | null
    status?: number | null
    create_time?: number | string | null
}

export interface RoleUsersQuery {
    keyword?: string
    status?: number | string
}
