import { del, get, post, put } from '@/utils/http'

export interface DepartmentApiItem {
    id: number
    name: string
    parent_id: number | null
    status?: number | null
    create_time?: number | null
    order?: number | null
    leader?: string | null
    phone?: string | null
    email?: string | null
}

export interface DepartmentPayload {
    name: string
    parent_id: number | null
    order: number
    leader: string
    phone: string
    email: string
    status: number
}

export const getDepartments = () =>
    get<DepartmentApiItem[] | null>('/department')

export const createDepartment = (data: DepartmentPayload) =>
    post<DepartmentApiItem>('/department', data)

export const updateDepartment = (id: number, data: DepartmentPayload) =>
    put<DepartmentApiItem>(`/department/${id}`, data)

export const deleteDepartment = (id: number) =>
    del<null>(`/department/${id}`)
