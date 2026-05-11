'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    assignUsersToRole,
    getRoleAssignedUsers,
    getRoleDetail,
    getRoleUnassignedUsers,
    removeUserFromRole,
} from '@/services/role'
import type { RoleUsersQuery } from '@/types/role'
import {
    mapRoleFromApi,
    mapRoleUserFromApi,
    type RoleRecord,
    type RoleUserRecord,
} from '../../shared'

type UserFilters = {
    keyword: string
    status: string
}

const defaultUserFilters: UserFilters = {
    keyword: '',
    status: 'all',
}

const toUserQuery = (filters: UserFilters): RoleUsersQuery => {
    const params: RoleUsersQuery = {}
    if (filters.keyword.trim()) {
        params.keyword = filters.keyword.trim()
    }
    if (filters.status !== 'all') {
        params.status = filters.status
    }
    return params
}

const AssignUsersContent = () => {
    const params = useParams<{ id: string }>()
    const roleId = Number(params.id)

    const [pageLoading, setPageLoading] = useState(true)
    const [roleInfo, setRoleInfo] = useState<RoleRecord | null>(null)
    const [filters, setFilters] = useState<UserFilters>(defaultUserFilters)

    const [assignedUsers, setAssignedUsers] = useState<RoleUserRecord[]>([])
    const [unassignedUsers, setUnassignedUsers] = useState<RoleUserRecord[]>([])
    const [assignedLoading, setAssignedLoading] = useState(false)
    const [unassignedLoading, setUnassignedLoading] = useState(false)

    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
    const [assignLoading, setAssignLoading] = useState(false)
    const [removeLoadingId, setRemoveLoadingId] = useState<number | null>(null)

    const invalidRoleId = useMemo(
        () => !Number.isFinite(roleId) || roleId <= 0,
        [roleId],
    )

    const loadRoleInfo = async () => {
        const { code, data, message } = await getRoleDetail(roleId)
        if (code !== 0 || !data) {
            throw new Error(message || '获取角色详情失败')
        }

        setRoleInfo(mapRoleFromApi(data))
    }

    const loadAssignedUsers = async (nextFilters?: UserFilters) => {
        setAssignedLoading(true)
        try {
            const { code, data, message } = await getRoleAssignedUsers(
                roleId,
                toUserQuery(nextFilters ?? filters),
            )
            if (code === 0) {
                setAssignedUsers((data ?? []).map(mapRoleUserFromApi))
                return
            }

            toast.error(message || '获取已分配用户失败')
            setAssignedUsers([])
        } catch (error: any) {
            toast.error(error?.message || '获取已分配用户失败')
            setAssignedUsers([])
        } finally {
            setAssignedLoading(false)
        }
    }

    const loadUnassignedUsers = async (nextFilters?: UserFilters) => {
        setUnassignedLoading(true)
        try {
            const { code, data, message } = await getRoleUnassignedUsers(
                roleId,
                toUserQuery(nextFilters ?? filters),
            )
            if (code === 0) {
                const nextRows = (data ?? []).map(mapRoleUserFromApi)
                setUnassignedUsers(nextRows)
                setSelectedUserIds((prev) =>
                    prev.filter((id) => nextRows.some((row) => row.id === id)),
                )
                return
            }

            toast.error(message || '获取待分配用户失败')
            setUnassignedUsers([])
            setSelectedUserIds([])
        } catch (error: any) {
            toast.error(error?.message || '获取待分配用户失败')
            setUnassignedUsers([])
            setSelectedUserIds([])
        } finally {
            setUnassignedLoading(false)
        }
    }

    const loadUserLists = async (nextFilters?: UserFilters) => {
        await Promise.all([
            loadAssignedUsers(nextFilters),
            loadUnassignedUsers(nextFilters),
        ])
    }

    useEffect(() => {
        if (invalidRoleId) {
            setPageLoading(false)
            return
        }

        void (async () => {
            setPageLoading(true)
            try {
                await loadRoleInfo()
                await loadUserLists(defaultUserFilters)
            } catch (error: any) {
                toast.error(error?.message || '加载角色信息失败')
            } finally {
                setPageLoading(false)
            }
        })()
    }, [roleId])

    const handleAssignUsers = async () => {
        if (selectedUserIds.length === 0) {
            toast.error('请先选择待分配用户')
            return
        }

        setAssignLoading(true)
        try {
            const { code, message } = await assignUsersToRole(
                roleId,
                selectedUserIds,
            )
            if (code === 0) {
                toast.success(message || '分配成功')
                setSelectedUserIds([])
                await loadUserLists()
                return
            }

            toast.error(message || '分配失败')
        } catch (error: any) {
            toast.error(error?.message || '分配失败')
        } finally {
            setAssignLoading(false)
        }
    }

    const handleRemoveUser = async (user: RoleUserRecord) => {
        const confirmed = window.confirm(`确认移除用户“${user.username}”吗？`)
        if (!confirmed) {
            return
        }

        setRemoveLoadingId(user.id)

        try {
            const { code, message } = await removeUserFromRole(roleId, user.id)
            if (code === 0) {
                toast.success(message || '移除成功')
                await loadUserLists()
                return
            }

            toast.error(message || '移除失败')
        } catch (error: any) {
            toast.error(error?.message || '移除失败')
        } finally {
            setRemoveLoadingId(null)
        }
    }

    const allSelected =
        unassignedUsers.length > 0 &&
        selectedUserIds.length === unassignedUsers.length
    const headerCheckedState: boolean | 'indeterminate' = allSelected
        ? true
        : selectedUserIds.length > 0
          ? 'indeterminate'
          : false

    const selectedUserIdSet = useMemo(
        () => new Set(selectedUserIds),
        [selectedUserIds],
    )

    if (invalidRoleId) {
        return (
            <div className="border-border rounded-lg border bg-white p-6">
                <div className="text-error mb-4 text-base">角色ID无效</div>
                <Button
                    asChild
                    variant="outline"
                >
                    <Link href="/system/roles">返回角色管理</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="min-w-0 space-y-4">
            <div className="border-border flex items-center justify-between rounded-lg border bg-white p-4">
                <div>
                    <h2 className="text-lg font-semibold">分配用户</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        给角色配置可使用该角色的用户
                    </p>
                </div>
                <Button
                    asChild
                    variant="outline"
                >
                    <Link href="/system/roles">
                        <Icon icon="ic:round-arrow-back" />
                        返回角色管理
                    </Link>
                </Button>
            </div>

            <div className="border-border rounded-lg border bg-white p-4">
                {pageLoading ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                        数据加载中...
                    </div>
                ) : !roleInfo ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                        未找到角色信息
                    </div>
                ) : (
                    <>
                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-1.5">
                                <Label>角色名称</Label>
                                <Input
                                    value={roleInfo.name}
                                    disabled
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>权限字符</Label>
                                <Input
                                    value={roleInfo.key}
                                    disabled
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>用户关键字</Label>
                                <Input
                                    placeholder="用户名 / 昵称"
                                    value={filters.keyword}
                                    onChange={(event) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            keyword: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>用户状态</Label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            status: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="请选择状态" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            全部
                                        </SelectItem>
                                        <SelectItem value="1">正常</SelectItem>
                                        <SelectItem value="0">停用</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mb-4 flex items-center justify-end gap-2">
                            <Button onClick={() => void loadUserLists()}>
                                查询
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setFilters(defaultUserFilters)
                                    void loadUserLists(defaultUserFilters)
                                }}
                            >
                                重置
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <div className="border-border rounded-md border">
                                <div className="border-border flex items-center justify-between border-b px-4 py-3">
                                    <h3 className="font-semibold">
                                        待分配用户
                                    </h3>
                                    <Button
                                        size="sm"
                                        onClick={() => void handleAssignUsers()}
                                        disabled={assignLoading}
                                    >
                                        {assignLoading
                                            ? '分配中...'
                                            : '批量分配'}
                                    </Button>
                                </div>
                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-13 text-center">
                                                <Checkbox
                                                    checked={headerCheckedState}
                                                    onCheckedChange={(value) =>
                                                        setSelectedUserIds(
                                                            value === true
                                                                ? unassignedUsers.map(
                                                                      (item) =>
                                                                          item.id,
                                                                  )
                                                                : [],
                                                        )
                                                    }
                                                />
                                            </TableHead>
                                            <TableHead className="text-center">
                                                用户名
                                            </TableHead>
                                            <TableHead className="text-center">
                                                昵称
                                            </TableHead>
                                            <TableHead className="text-center">
                                                状态
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unassignedLoading ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="py-8 text-center text-sm text-slate-500"
                                                >
                                                    数据加载中...
                                                </TableCell>
                                            </TableRow>
                                        ) : unassignedUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="py-8 text-center text-sm text-slate-500"
                                                >
                                                    暂无待分配用户
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            unassignedUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={selectedUserIdSet.has(
                                                                user.id,
                                                            )}
                                                            onCheckedChange={(
                                                                value,
                                                            ) =>
                                                                setSelectedUserIds(
                                                                    (prev) => {
                                                                        if (
                                                                            value !==
                                                                            true
                                                                        ) {
                                                                            return prev.filter(
                                                                                (
                                                                                    id,
                                                                                ) =>
                                                                                    id !==
                                                                                    user.id,
                                                                            )
                                                                        }
                                                                        return [
                                                                            ...new Set(
                                                                                [
                                                                                    ...prev,
                                                                                    user.id,
                                                                                ],
                                                                            ),
                                                                        ]
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {user.username}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {user.nickname}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={
                                                                user.status ===
                                                                1
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {user.status === 1
                                                                ? '正常'
                                                                : '停用'}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="border-border rounded-md border">
                                <div className="border-border border-b px-4 py-3">
                                    <h3 className="font-semibold">
                                        已分配用户
                                    </h3>
                                </div>
                                <Table className="table-fixed">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center">
                                                用户名
                                            </TableHead>
                                            <TableHead className="text-center">
                                                邮箱
                                            </TableHead>
                                            <TableHead className="text-center">
                                                状态
                                            </TableHead>
                                            <TableHead className="text-center">
                                                操作
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignedLoading ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="py-8 text-center text-sm text-slate-500"
                                                >
                                                    数据加载中...
                                                </TableCell>
                                            </TableRow>
                                        ) : assignedUsers.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="py-8 text-center text-sm text-slate-500"
                                                >
                                                    暂无已分配用户
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            assignedUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="text-center">
                                                        {user.username}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {user.email}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={
                                                                user.status ===
                                                                1
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {user.status === 1
                                                                ? '正常'
                                                                : '停用'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <button
                                                            type="button"
                                                            className="text-error hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                                            disabled={
                                                                removeLoadingId ===
                                                                user.id
                                                            }
                                                            onClick={() =>
                                                                void handleRemoveUser(
                                                                    user,
                                                                )
                                                            }
                                                        >
                                                            {removeLoadingId ===
                                                            user.id
                                                                ? '移除中...'
                                                                : '移除'}
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

const AssignUsersPage = () => (
    <Suspense
        fallback={
            <div className="border-border rounded-lg border bg-white p-6 text-center text-sm text-slate-500">
                数据加载中...
            </div>
        }
    >
        <AssignUsersContent />
    </Suspense>
)

export default AssignUsersPage
