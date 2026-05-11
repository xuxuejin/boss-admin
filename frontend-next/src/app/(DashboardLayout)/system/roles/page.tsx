'use client'

import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/navigation'
import { Controller, type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import {
    createRole,
    deleteRole,
    getRoleDetail,
    getRoleMenuTree,
    getRoles,
    updateRole,
    updateRoleDataScope,
    updateRoleStatus,
} from '@/services/role'
import type { RoleDataScope, RoleListParams, RoleStatus } from '@/types/role'
import { FormItem, MenuPermissionTree } from './components'
import {
    DATA_SCOPE_OPTIONS,
    type MenuNode,
    type RoleRecord,
    mapRoleFromApi,
    normalizeMenuTree,
    toggleMenuSelection,
} from './shared'

type DialogMode = 'create' | 'edit'

type QueryFilters = {
    roleId: string
    roleName: string
    status: string
    startDate: string
    endDate: string
}

type RoleFormData = {
    name: string
    key: string
    order: number
    status: RoleStatus
    remark: string
}

const defaultFilters: QueryFilters = {
    roleId: '',
    roleName: '',
    status: 'all',
    startDate: '',
    endDate: '',
}

const defaultRoleFormData: RoleFormData = {
    name: '',
    key: '',
    order: 1,
    status: 1,
    remark: '',
}

const normalizeRoleList = (rows: RoleRecord[]) =>
    [...rows].sort((a, b) => a.order - b.order || a.id - b.id)

const formatDateValue = (date?: Date) => {
    if (!date) return ''

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

const parseDateValue = (value: string) => {
    if (!value) return undefined

    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return undefined

    return new Date(year, month - 1, day)
}

const displayDateValue = (value: string) => value.replaceAll('-', '/')

const DateFilter = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) => (
    <div className="space-y-1.5">
        <Label>{label}</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-between px-3 text-left font-normal text-slate-900 hover:text-white"
                >
                    <span className="leading-none">
                        {value ? displayDateValue(value) : '请选择'}
                    </span>
                    <Icon
                        icon="ic:round-calendar-today"
                        className="text-base"
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-auto p-0"
            >
                <Calendar
                    mode="single"
                    selected={parseDateValue(value)}
                    onSelect={(date) => onChange(formatDateValue(date))}
                    captionLayout="dropdown"
                    styles={{
                        dropdown: {
                            maxHeight: '15rem',
                            overflowY: 'auto',
                        },
                    }}
                />
                <div className="border-border flex items-center justify-between border-t p-2">
                    <Button
                        type="button"
                        variant="ghostprimary"
                        size="sm"
                        onClick={() => onChange('')}
                    >
                        清除
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onChange(formatDateValue(new Date()))}
                    >
                        今天
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    </div>
)

const toRoleQueryParams = (filters: QueryFilters): RoleListParams => {
    const params: RoleListParams = {}

    if (filters.roleId.trim()) {
        params.id = filters.roleId.trim()
    }
    if (filters.roleName.trim()) {
        params.name = filters.roleName.trim()
    }
    if (filters.status !== 'all') {
        params.status = filters.status
    }
    if (filters.startDate) {
        params.start_time = filters.startDate
    }
    if (filters.endDate) {
        params.end_time = filters.endDate
    }

    return params
}

const RolePage = () => {
    const router = useRouter()
    const [filters, setFilters] = useState<QueryFilters>(defaultFilters)
    const [tableLoading, setTableLoading] = useState(true)
    const [roles, setRoles] = useState<RoleRecord[]>([])
    const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([])
    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(
        null,
    )

    const [openRoleDialog, setOpenRoleDialog] = useState(false)
    const [dialogMode, setDialogMode] = useState<DialogMode>('create')
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null)
    const [submitLoading, setSubmitLoading] = useState(false)

    const [menuLoading, setMenuLoading] = useState(false)
    const [menuTree, setMenuTree] = useState<MenuNode[]>([])
    const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([])
    const [menuCheckStrictly, setMenuCheckStrictly] = useState(true)

    const [dataScopeRole, setDataScopeRole] = useState<RoleRecord | null>(null)
    const [dataScopeValue, setDataScopeValue] = useState<RoleDataScope>(1)
    const [dataScopeMenuTree, setDataScopeMenuTree] = useState<MenuNode[]>([])
    const [dataScopeMenuIds, setDataScopeMenuIds] = useState<number[]>([])
    const [dataScopeMenuCheckStrictly, setDataScopeMenuCheckStrictly] =
        useState(true)
    const [dataScopeLoading, setDataScopeLoading] = useState(false)
    const [dataScopeSubmitLoading, setDataScopeSubmitLoading] = useState(false)

    const [deletingRole, setDeletingRole] = useState<RoleRecord | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RoleFormData>({
        defaultValues: defaultRoleFormData,
    })

    const loadRoles = async (nextFilters?: QueryFilters) => {
        const targetFilters = nextFilters ?? filters
        setTableLoading(true)

        try {
            const { code, data, message } = await getRoles(
                toRoleQueryParams(targetFilters),
            )

            if (code === 0) {
                const nextRoles = normalizeRoleList(
                    (data ?? []).map(mapRoleFromApi),
                )
                setRoles(nextRoles)
                setSelectedRoleIds((prev) =>
                    prev.filter((id) =>
                        nextRoles.some((role) => role.id === id),
                    ),
                )
                return
            }

            toast.error(message || '获取角色列表失败')
            setRoles([])
            setSelectedRoleIds([])
        } catch (error: any) {
            toast.error(error?.message || '获取角色列表失败')
            setRoles([])
            setSelectedRoleIds([])
        } finally {
            setTableLoading(false)
        }
    }

    const loadMenuTree = async (roleId?: number) => {
        setMenuLoading(true)

        try {
            const { code, data, message } = await getRoleMenuTree(roleId)
            if (code === 0) {
                setMenuTree(normalizeMenuTree(data))
                return
            }

            toast.error(message || '获取菜单权限失败')
            setMenuTree([])
        } catch (error: any) {
            toast.error(error?.message || '获取菜单权限失败')
            setMenuTree([])
        } finally {
            setMenuLoading(false)
        }
    }

    useEffect(() => {
        void loadRoles()
    }, [])

    const resetRoleDialogState = () => {
        setOpenRoleDialog(false)
        setDialogMode('create')
        setEditingRole(null)
        setSubmitLoading(false)
        setMenuTree([])
        setSelectedMenuIds([])
        setMenuCheckStrictly(true)
        reset(defaultRoleFormData)
    }

    const openCreateDialog = () => {
        setDialogMode('create')
        setEditingRole(null)
        setSelectedMenuIds([])
        setMenuCheckStrictly(true)
        reset(defaultRoleFormData)
        setOpenRoleDialog(true)
        void loadMenuTree()
    }

    const openEditDialog = (role: RoleRecord) => {
        setDialogMode('edit')
        setEditingRole(role)
        reset({
            name: role.name,
            key: role.key,
            order: role.order,
            status: role.status,
            remark: role.remark,
        })
        setSelectedMenuIds(role.menuIds)
        setMenuCheckStrictly(role.menuCheckStrictly)
        setOpenRoleDialog(true)

        void loadMenuTree(role.id)

        void (async () => {
            try {
                const { code, data, message } = await getRoleDetail(role.id)
                if (code !== 0 || !data) {
                    toast.error(message || '获取角色详情失败')
                    return
                }

                const detail = mapRoleFromApi(data)
                setEditingRole(detail)
                reset({
                    name: detail.name,
                    key: detail.key,
                    order: detail.order,
                    status: detail.status,
                    remark: detail.remark,
                })
                setSelectedMenuIds(detail.menuIds)
                setMenuCheckStrictly(detail.menuCheckStrictly)
            } catch (error: any) {
                toast.error(error?.message || '获取角色详情失败')
            }
        })()
    }

    const resetDataScopeDialogState = () => {
        setDataScopeRole(null)
        setDataScopeValue(1)
        setDataScopeMenuTree([])
        setDataScopeMenuIds([])
        setDataScopeMenuCheckStrictly(true)
        setDataScopeLoading(false)
        setDataScopeSubmitLoading(false)
    }

    const openDataScopeDialog = (role: RoleRecord) => {
        setDataScopeRole(role)
        setDataScopeValue(role.dataScope)
        setDataScopeMenuIds(role.menuIds)
        setDataScopeMenuCheckStrictly(role.menuCheckStrictly)
        setDataScopeLoading(true)

        void (async () => {
            try {
                const [roleRes, menuRes] = await Promise.all([
                    getRoleDetail(role.id),
                    getRoleMenuTree(role.id),
                ])

                if (roleRes.code === 0 && roleRes.data) {
                    const detail = mapRoleFromApi(roleRes.data)
                    setDataScopeRole(detail)
                    setDataScopeValue(detail.dataScope)
                    setDataScopeMenuIds(detail.menuIds)
                    setDataScopeMenuCheckStrictly(detail.menuCheckStrictly)
                } else {
                    toast.error(roleRes.message || '获取角色详情失败')
                }

                if (menuRes.code === 0) {
                    setDataScopeMenuTree(normalizeMenuTree(menuRes.data))
                } else {
                    toast.error(menuRes.message || '获取菜单权限失败')
                    setDataScopeMenuTree([])
                }
            } catch (error: any) {
                toast.error(error?.message || '获取数据权限信息失败')
                setDataScopeMenuTree([])
            } finally {
                setDataScopeLoading(false)
            }
        })()
    }

    const handleDataScopeSubmit = async () => {
        if (!dataScopeRole) {
            return
        }

        setDataScopeSubmitLoading(true)

        try {
            const { code, message } = await updateRoleDataScope(
                dataScopeRole.id,
                {
                    data_scope: dataScopeValue,
                    menu_ids: dataScopeMenuIds,
                    menu_check_strictly: dataScopeMenuCheckStrictly,
                },
            )

            if (code === 0) {
                toast.success(message || '数据权限更新成功')
                await loadRoles()
                resetDataScopeDialogState()
                return
            }

            toast.error(message || '数据权限更新失败')
        } catch (error: any) {
            toast.error(error?.message || '数据权限更新失败')
        } finally {
            setDataScopeSubmitLoading(false)
        }
    }

    const onSubmit: SubmitHandler<RoleFormData> = async (formData) => {
        const payload = {
            name: formData.name.trim(),
            key: formData.key.trim(),
            order: formData.order,
            status: formData.status,
            remark: formData.remark.trim(),
            menu_ids: selectedMenuIds,
            menu_check_strictly: menuCheckStrictly,
        }

        setSubmitLoading(true)

        try {
            const response =
                dialogMode === 'edit' && editingRole
                    ? await updateRole(editingRole.id, payload)
                    : await createRole(payload)

            if (response.code === 0) {
                toast.success(
                    response.message ||
                        (dialogMode === 'edit' ? '修改成功' : '新增成功'),
                )
                await loadRoles()
                resetRoleDialogState()
                return
            }

            toast.error(
                response.message ||
                    (dialogMode === 'edit' ? '修改失败' : '新增失败'),
            )
        } catch (error: any) {
            toast.error(
                error?.message ||
                    (dialogMode === 'edit' ? '修改失败' : '新增失败'),
            )
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleRoleStatusChange = async (
        role: RoleRecord,
        checked: boolean,
    ) => {
        const nextStatus: RoleStatus = checked ? 1 : 0
        if (nextStatus === role.status) {
            return
        }

        setStatusUpdatingId(role.id)

        try {
            const { code, message } = await updateRoleStatus(
                role.id,
                nextStatus,
            )
            if (code === 0) {
                setRoles((prev) =>
                    prev.map((item) =>
                        item.id === role.id
                            ? { ...item, status: nextStatus }
                            : item,
                    ),
                )
                return
            }

            toast.error(message || '状态修改失败')
        } catch (error: any) {
            toast.error(error?.message || '状态修改失败')
        } finally {
            setStatusUpdatingId(null)
        }
    }

    const confirmDeleteRole = (role: RoleRecord) => {
        setDeletingRole(role)
    }

    const handleDeleteRole = async () => {
        if (!deletingRole) {
            return
        }

        setDeleteLoading(true)

        try {
            const { code, message } = await deleteRole(deletingRole.id)

            if (code === 0) {
                toast.success(message || '删除成功')
                await loadRoles()
                setDeletingRole(null)
                return
            }

            toast.error(message || '删除失败')
        } catch (error: any) {
            toast.error(error?.message || '删除失败')
        } finally {
            setDeleteLoading(false)
        }
    }

    const allSelected =
        roles.length > 0 && selectedRoleIds.length === roles.length
    const headerCheckedState: boolean | 'indeterminate' = allSelected
        ? true
        : selectedRoleIds.length > 0
          ? 'indeterminate'
          : false

    const selectedRoleIdSet = useMemo(
        () => new Set(selectedRoleIds),
        [selectedRoleIds],
    )

    return (
        <div className="min-w-0 space-y-4">
            <div className="border-border rounded-lg border bg-white p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1.5">
                        <Label>角色编号</Label>
                        <Input
                            placeholder="请输入"
                            value={filters.roleId}
                            onChange={(event) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    roleId: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>角色名称</Label>
                        <Input
                            placeholder="请输入"
                            value={filters.roleName}
                            onChange={(event) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    roleName: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>角色状态</Label>
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
                                <SelectValue placeholder="请选择角色状态" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全部</SelectItem>
                                <SelectItem value="1">正常</SelectItem>
                                <SelectItem value="0">停用</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DateFilter
                        label="开始时间"
                        value={filters.startDate}
                        onChange={(value) =>
                            setFilters((prev) => ({
                                ...prev,
                                startDate: value,
                            }))
                        }
                    />
                    <DateFilter
                        label="结束时间"
                        value={filters.endDate}
                        onChange={(value) =>
                            setFilters((prev) => ({
                                ...prev,
                                endDate: value,
                            }))
                        }
                    />
                    <div className="flex items-end justify-start gap-2 md:justify-end xl:col-span-1">
                        <Button
                            type="button"
                            onClick={() => void loadRoles()}
                        >
                            查询
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setFilters(defaultFilters)
                                void loadRoles(defaultFilters)
                            }}
                        >
                            重置
                        </Button>
                    </div>
                </div>
            </div>

            <div className="border-border rounded-lg border bg-white">
                <div className="border-border flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold">查询表格</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={openCreateDialog}
                        >
                            <Icon icon="ic:round-add" />
                            新建
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => void loadRoles()}
                            aria-label="刷新"
                        >
                            <Icon
                                icon="ic:round-refresh"
                                className="text-xl"
                            />
                        </Button>
                    </div>
                </div>

                <Table className="table-fixed">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-14 text-center">
                                <Checkbox
                                    checked={headerCheckedState}
                                    onCheckedChange={(value) =>
                                        setSelectedRoleIds(
                                            value === true
                                                ? roles.map((role) => role.id)
                                                : [],
                                        )
                                    }
                                />
                            </TableHead>
                            <TableHead className="w-30 text-center">
                                角色编号
                            </TableHead>
                            <TableHead className="w-45 text-center">
                                角色名称
                            </TableHead>
                            <TableHead className="w-45 text-center">
                                权限字符
                            </TableHead>
                            <TableHead className="w-30 text-center">
                                显示顺序
                            </TableHead>
                            <TableHead className="w-35 text-center">
                                角色状态
                            </TableHead>
                            <TableHead className="w-50 text-center">
                                创建时间
                            </TableHead>
                            <TableHead className="w-65 text-center">
                                操作
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-12 text-center text-sm text-slate-500"
                                >
                                    数据加载中...
                                </TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className="py-12 text-center text-sm text-slate-500"
                                >
                                    暂无角色数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="text-center">
                                        <Checkbox
                                            checked={selectedRoleIdSet.has(
                                                role.id,
                                            )}
                                            onCheckedChange={(value) =>
                                                setSelectedRoleIds((prev) => {
                                                    if (value !== true) {
                                                        return prev.filter(
                                                            (id) =>
                                                                id !== role.id,
                                                        )
                                                    }
                                                    return [
                                                        ...new Set([
                                                            ...prev,
                                                            role.id,
                                                        ]),
                                                    ]
                                                })
                                            }
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {role.id}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {role.name}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {role.key}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {role.order}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Badge
                                                variant={
                                                    role.status === 1
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {role.status === 1
                                                    ? '正常'
                                                    : '停用'}
                                            </Badge>
                                            <Switch
                                                checked={role.status === 1}
                                                disabled={
                                                    statusUpdatingId === role.id
                                                }
                                                onCheckedChange={(checked) =>
                                                    void handleRoleStatusChange(
                                                        role,
                                                        checked,
                                                    )
                                                }
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {role.createTime}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    openEditDialog(role)
                                                }
                                                className="text-primary hover:underline"
                                            >
                                                编辑
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    confirmDeleteRole(role)
                                                }
                                                className="text-error hover:underline"
                                            >
                                                删除
                                            </button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="text-primary flex items-center gap-1 hover:underline"
                                                    >
                                                        更多
                                                        <Icon icon="ic:round-expand-more" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            openDataScopeDialog(
                                                                role,
                                                            )
                                                        }
                                                    >
                                                        数据权限
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            router.push(
                                                                `/system/roles/${role.id}/assign-users`,
                                                            )
                                                        }
                                                    >
                                                        分配用户
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={openRoleDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        resetRoleDialogState()
                    } else {
                        setOpenRoleDialog(true)
                    }
                }}
            >
                <DialogContent className="sm:max-w-215">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'edit' ? '编辑角色' : '新建角色'}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-y-6 py-3"
                    >
                        <FormItem
                            label="角色名称"
                            required
                            error={errors.name?.message}
                        >
                            <Input
                                placeholder="请输入角色名称"
                                className="h-10 w-full"
                                {...register('name', {
                                    required: '请输入角色名称',
                                    validate: (value) =>
                                        value.trim() !== '' || '请输入角色名称',
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="权限字符"
                            required
                            error={errors.key?.message}
                        >
                            <Input
                                placeholder="请输入权限字符"
                                className="h-10 w-full"
                                {...register('key', {
                                    required: '请输入权限字符',
                                    validate: (value) =>
                                        value.trim() !== '' || '请输入权限字符',
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="显示顺序"
                            required
                            error={errors.order?.message}
                        >
                            <Input
                                type="number"
                                min={0}
                                placeholder="请输入显示顺序"
                                className="h-10 w-full"
                                {...register('order', {
                                    setValueAs: (value) =>
                                        value === '' ? 0 : Number(value),
                                    validate: (value) =>
                                        (Number.isFinite(value) &&
                                            value >= 0) ||
                                        '显示顺序不能小于0',
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="角色状态"
                            required
                        >
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={String(field.value)}
                                        onValueChange={(value) =>
                                            field.onChange(
                                                Number(value) as RoleStatus,
                                            )
                                        }
                                        className="flex items-center gap-6"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="1"
                                                id="role-status-normal"
                                            />
                                            <Label
                                                htmlFor="role-status-normal"
                                                className="cursor-pointer font-normal"
                                            >
                                                正常
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="0"
                                                id="role-status-stop"
                                            />
                                            <Label
                                                htmlFor="role-status-stop"
                                                className="cursor-pointer font-normal"
                                            >
                                                停用
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </FormItem>

                        <FormItem
                            label="菜单权限"
                            required
                            alignStart
                        >
                            <MenuPermissionTree
                                tree={menuTree}
                                checkedIds={selectedMenuIds}
                                strictLinkage={menuCheckStrictly}
                                loading={menuLoading}
                                onStrictLinkageChange={setMenuCheckStrictly}
                                onToggleCheck={(menuId, checked) =>
                                    setSelectedMenuIds((prev) =>
                                        toggleMenuSelection({
                                            tree: menuTree,
                                            selectedIds: prev,
                                            targetId: menuId,
                                            nextChecked: checked,
                                            strictLinkage: menuCheckStrictly,
                                        }),
                                    )
                                }
                            />
                        </FormItem>

                        <FormItem
                            label="备注"
                            alignStart
                        >
                            <Textarea
                                placeholder="请输入备注"
                                className="mt-0 min-h-24"
                                {...register('remark')}
                            />
                        </FormItem>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetRoleDialogState}
                            >
                                取消
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitLoading}
                            >
                                {submitLoading ? '提交中...' : '确定'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!dataScopeRole}
                onOpenChange={(open) => {
                    if (!open) {
                        resetDataScopeDialogState()
                    }
                }}
            >
                <DialogContent className="sm:max-w-215">
                    <DialogHeader>
                        <DialogTitle>数据权限</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-y-6 py-3">
                        <FormItem
                            label="角色名称"
                            required
                        >
                            <Input
                                value={dataScopeRole?.name ?? ''}
                                disabled
                                className="h-10 w-full"
                            />
                        </FormItem>

                        <FormItem
                            label="权限字符"
                            required
                        >
                            <Input
                                value={dataScopeRole?.key ?? ''}
                                disabled
                                className="h-10 w-full"
                            />
                        </FormItem>

                        <FormItem
                            label="权限范围"
                            required
                        >
                            <Select
                                value={String(dataScopeValue)}
                                onValueChange={(value) =>
                                    setDataScopeValue(
                                        Number(value) as RoleDataScope,
                                    )
                                }
                            >
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="请选择权限范围" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DATA_SCOPE_OPTIONS.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={String(option.value)}
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>

                        <FormItem
                            label="菜单权限"
                            required
                            alignStart
                        >
                            <MenuPermissionTree
                                tree={dataScopeMenuTree}
                                checkedIds={dataScopeMenuIds}
                                strictLinkage={dataScopeMenuCheckStrictly}
                                loading={dataScopeLoading}
                                onStrictLinkageChange={
                                    setDataScopeMenuCheckStrictly
                                }
                                onToggleCheck={(menuId, checked) =>
                                    setDataScopeMenuIds((prev) =>
                                        toggleMenuSelection({
                                            tree: dataScopeMenuTree,
                                            selectedIds: prev,
                                            targetId: menuId,
                                            nextChecked: checked,
                                            strictLinkage:
                                                dataScopeMenuCheckStrictly,
                                        }),
                                    )
                                }
                            />
                        </FormItem>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetDataScopeDialogState}
                            >
                                取消
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    dataScopeLoading || dataScopeSubmitLoading
                                }
                                onClick={() => void handleDataScopeSubmit()}
                            >
                                {dataScopeSubmitLoading ? '提交中...' : '确定'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!deletingRole}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingRole(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-130">
                    <DialogHeader className="flex-row items-center gap-3 space-y-0">
                        <div className="bg-warning flex h-9 w-9 items-center justify-center rounded-full text-white">
                            <Icon
                                icon="ic:round-priority-high"
                                className="text-xl"
                            />
                        </div>
                        <DialogTitle>删除</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 text-base">
                        确定删除角色“{deletingRole?.name || '-'}”吗？
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingRole(null)}
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleDeleteRole()}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? '删除中...' : '确认'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default RolePage
