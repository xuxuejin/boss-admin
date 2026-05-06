'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Controller, type SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
    createDepartment,
    deleteDepartment,
    getDepartments,
    type DepartmentApiItem,
    type DepartmentPayload,
    updateDepartment,
} from '@/services/department'
import { formatDateTime } from '@/utils/date'
import { cn } from '@/lib/utils'

type DepartmentStatus = 0 | 1
type DialogMode = 'create' | 'edit'

type DepartmentRecord = {
    id: number
    parentId: number | null
    name: string
    order: number
    status: DepartmentStatus
    createTime: string
    leader: string
    phone: string
    email: string
}

type DepartmentNode = DepartmentRecord & {
    children?: DepartmentNode[]
}

type DepartmentFormData = {
    parentId: string
    name: string
    order: number
    leader: string
    phone: string
    email: string
    status: DepartmentStatus
}

type ParentOption = {
    id: number
    name: string
    level: number
}

const ROOT_PARENT_VALUE = 'root'

const defaultFormData: DepartmentFormData = {
    parentId: '',
    name: '',
    order: 0,
    leader: '',
    phone: '',
    email: '',
    status: 1,
}

const mapDepartmentFromApi = (item: DepartmentApiItem): DepartmentRecord => ({
    id: item.id,
    parentId: item.parent_id ?? null,
    name: item.name ?? '',
    order: typeof item.order === 'number' ? item.order : 0,
    status: item.status === 0 ? 0 : 1,
    createTime: formatDateTime(item.create_time),
    leader: item.leader ?? '',
    phone: item.phone ?? '',
    email: item.email ?? '',
})

const buildDepartmentTree = (records: DepartmentRecord[]): DepartmentNode[] => {
    const sortedRecords = [...records].sort(
        (a, b) => a.order - b.order || a.id - b.id,
    )
    const nodeMap = new Map<number, DepartmentNode>()
    const roots: DepartmentNode[] = []

    sortedRecords.forEach((record) => {
        nodeMap.set(record.id, { ...record, children: [] })
    })

    sortedRecords.forEach((record) => {
        const currentNode = nodeMap.get(record.id)
        if (!currentNode) return

        if (record.parentId === null) {
            roots.push(currentNode)
            return
        }

        const parentNode = nodeMap.get(record.parentId)
        if (parentNode) {
            parentNode.children = [...(parentNode.children ?? []), currentNode]
        }
    })

    const normalizeChildren = (
        nodesToNormalize: DepartmentNode[],
    ): DepartmentNode[] =>
        nodesToNormalize.map((node) => ({
            ...node,
            children:
                node.children && node.children.length > 0
                    ? normalizeChildren(
                          [...node.children].sort(
                              (a, b) => a.order - b.order || a.id - b.id,
                          ),
                      )
                    : undefined,
        }))

    return normalizeChildren(roots)
}

const normalizeDepartmentTree = (
    items: DepartmentApiItem[] | null | undefined,
): DepartmentNode[] => buildDepartmentTree((items ?? []).map(mapDepartmentFromApi))

const collectNodeIds = (nodes: DepartmentNode[]): number[] =>
    nodes.flatMap((node) => [node.id, ...collectNodeIds(node.children ?? [])])

const collectDescendantIds = (node: DepartmentNode): number[] =>
    (node.children ?? []).flatMap((child) => [
        child.id,
        ...collectDescendantIds(child),
    ])

const collectParentOptions = (
    nodes: DepartmentNode[],
    excludedIds: Set<number>,
    level = 0,
): ParentOption[] =>
    nodes.flatMap((node) => {
        if (excludedIds.has(node.id)) {
            return []
        }

        return [
            {
                id: node.id,
                name: node.name,
                level,
            },
            ...collectParentOptions(node.children ?? [], excludedIds, level + 1),
        ]
    })

const filterTree = (
    nodes: DepartmentNode[],
    filters: { name: string; status: string },
): DepartmentNode[] => {
    const keyword = filters.name.trim()

    return nodes.reduce<DepartmentNode[]>((acc, node) => {
        const children = filterTree(node.children ?? [], filters)
        const nameMatched = keyword ? node.name.includes(keyword) : true
        const statusMatched =
            filters.status === 'all' || String(node.status) === filters.status

        if ((nameMatched && statusMatched) || children.length > 0) {
            acc.push({
                ...node,
                children: children.length > 0 ? children : undefined,
            })
        }

        return acc
    }, [])
}

const FormItem = ({
    label,
    required,
    children,
    error,
}: {
    label: string
    required?: boolean
    children: ReactNode
    error?: string
}) => (
    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
        <Label
            className={cn(
                'text-right font-medium',
                error && 'text-destructive',
            )}
        >
            {required && <span className="mr-1 text-destructive">*</span>}
            {label}
        </Label>
        <div className="flex flex-col gap-1.5">
            <div className={cn(error && '[&_input]:border-destructive')}>
                {children}
            </div>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    </div>
)

const DepartmentPage = () => {
    const [departments, setDepartments] = useState<DepartmentNode[]>([])
    const [parentSource, setParentSource] = useState<DepartmentNode[]>([])
    const [expandedIds, setExpandedIds] = useState<number[]>([])
    const [filters, setFilters] = useState({ name: '', status: 'all' })
    const [openDialog, setOpenDialog] = useState(false)
    const [dialogMode, setDialogMode] = useState<DialogMode>('create')
    const [editingDept, setEditingDept] = useState<DepartmentNode | null>(null)
    const [lockedParent, setLockedParent] = useState<DepartmentNode | null>(null)
    const [tableLoading, setTableLoading] = useState(true)
    const [parentLoading, setParentLoading] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DepartmentFormData>({
        defaultValues: defaultFormData,
    })

    const filteredData = useMemo(
        () => filterTree(departments, filters),
        [departments, filters],
    )

    const allVisibleIds = useMemo(
        () => collectNodeIds(filteredData),
        [filteredData],
    )

    const shouldRequireParent = departments.length > 0

    const parentOptions = useMemo(() => {
        const excludedIds = new Set<number>()

        if (editingDept) {
            excludedIds.add(editingDept.id)
            collectDescendantIds(editingDept).forEach((id) =>
                excludedIds.add(id),
            )
        }

        return collectParentOptions(parentSource, excludedIds)
    }, [editingDept, parentSource])

    const loadDepartments = async () => {
        setTableLoading(true)

        try {
            const { code, data, message } = await getDepartments()

            if (code === 0) {
                setDepartments(normalizeDepartmentTree(data))
                return
            }

            toast.error(message || '获取部门列表失败')
            setDepartments([])
        } catch (error: any) {
            toast.error(error?.message || '获取部门列表失败')
            setDepartments([])
        } finally {
            setTableLoading(false)
        }
    }

    const loadParentOptions = async () => {
        setParentLoading(true)

        try {
            const { code, data, message } = await getDepartments()

            if (code === 0) {
                setParentSource(normalizeDepartmentTree(data))
                return
            }

            toast.error(message || '获取上级部门失败')
            setParentSource([])
        } catch (error: any) {
            toast.error(error?.message || '获取上级部门失败')
            setParentSource([])
        } finally {
            setParentLoading(false)
        }
    }

    useEffect(() => {
        void loadDepartments()
    }, [])

    const resetDialogState = () => {
        reset(defaultFormData)
        setParentSource([])
        setEditingDept(null)
        setLockedParent(null)
        setOpenDialog(false)
    }

    const openCreateDialog = (parent?: DepartmentNode) => {
        setDialogMode('create')
        setEditingDept(null)
        setLockedParent(parent ?? null)
        reset({
            ...defaultFormData,
            parentId: parent ? String(parent.id) : '',
        })
        setOpenDialog(true)

        if (departments.length > 0) {
            void loadParentOptions()
        } else {
            setParentSource([])
        }
    }

    const openEditDialog = (node: DepartmentNode) => {
        setDialogMode('edit')
        setEditingDept(node)
        setLockedParent(null)
        reset({
            parentId:
                node.parentId === null
                    ? ROOT_PARENT_VALUE
                    : String(node.parentId),
            name: node.name,
            order: node.order,
            leader: node.leader,
            phone: node.phone,
            email: node.email,
            status: node.status,
        })
        setOpenDialog(true)

        if (departments.length > 0) {
            void loadParentOptions()
        } else {
            setParentSource([])
        }
    }

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        )
    }

    const onSubmit: SubmitHandler<DepartmentFormData> = async (formData) => {
        const payload: DepartmentPayload = {
            name: formData.name.trim(),
            parent_id:
                !formData.parentId || formData.parentId === ROOT_PARENT_VALUE
                    ? null
                    : Number(formData.parentId),
            order: formData.order,
            leader: formData.leader.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            status: formData.status,
        }

        setSubmitLoading(true)

        try {
            const response =
                dialogMode === 'edit' && editingDept
                    ? await updateDepartment(editingDept.id, payload)
                    : await createDepartment(payload)

            if (response.code === 0) {
                toast.success(
                    response.message ||
                        (dialogMode === 'edit' ? '修改成功' : '新增成功'),
                )
                await loadDepartments()
                resetDialogState()
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

    const handleDelete = async (node: DepartmentNode) => {
        const confirmed = window.confirm(
            `确认删除部门“${node.name}”吗？${
                (node.children?.length ?? 0) > 0 ? '该部门下还有下级部门。' : ''
            }`,
        )

        if (!confirmed) {
            return
        }

        setDeletingId(node.id)

        try {
            const { code, message } = await deleteDepartment(node.id)

            if (code === 0) {
                toast.success(message || '删除成功')
                await loadDepartments()
                return
            }

            toast.error(message || '删除失败')
        } catch (error: any) {
            toast.error(error?.message || '删除失败')
        } finally {
            setDeletingId(null)
        }
    }

    const renderRows = (nodes: DepartmentNode[], level = 0): ReactNode[] =>
        nodes.flatMap((node) => {
            const hasChildren = (node.children?.length ?? 0) > 0
            const isExpanded = expandedIds.includes(node.id)

            const currentRow = (
                <TableRow key={node.id}>
                    <TableCell
                        style={{ paddingLeft: `${level * 24 + 16}px` }}
                        className="w-[220px] align-middle"
                    >
                        <div className="flex items-center justify-center gap-2 text-center">
                            {hasChildren ? (
                                <button
                                    type="button"
                                    onClick={() => toggleExpand(node.id)}
                                    className="shrink-0 text-slate-500"
                                >
                                    <Icon
                                        icon={
                                            isExpanded
                                                ? 'ic:round-expand-more'
                                                : 'ic:round-chevron-right'
                                        }
                                        className="text-lg"
                                    />
                                </button>
                            ) : (
                                <span className="w-5 shrink-0" />
                            )}
                            <span className="truncate" title={node.name}>
                                {node.name}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="w-[84px] text-center align-middle">
                        <Badge
                            variant={
                                node.status === 1 ? 'default' : 'secondary'
                            }
                        >
                            {node.status === 1 ? '正常' : '停用'}
                        </Badge>
                    </TableCell>
                    <TableCell className="w-[180px] text-center align-middle">
                        {node.createTime}
                    </TableCell>
                    <TableCell className="w-[96px] text-center align-middle">
                        {node.leader || '-'}
                    </TableCell>
                    <TableCell className="w-[124px] text-center align-middle">
                        {node.phone || '-'}
                    </TableCell>
                    <TableCell className="w-[220px] text-center align-middle">
                        <span className="block truncate" title={node.email || '-'}>
                            {node.email || '-'}
                        </span>
                    </TableCell>
                    <TableCell className="w-[200px] pr-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-3 whitespace-nowrap">
                            <button
                                type="button"
                                onClick={() => openEditDialog(node)}
                                className="text-blue-500 hover:underline"
                            >
                                修改
                            </button>
                            <button
                                type="button"
                                onClick={() => openCreateDialog(node)}
                                className="text-blue-500 hover:underline"
                            >
                                新增下级
                            </button>
                            <button
                                type="button"
                                disabled={deletingId === node.id}
                                onClick={() => void handleDelete(node)}
                                className="text-error hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deletingId === node.id ? '删除中' : '删除'}
                            </button>
                        </div>
                    </TableCell>
                </TableRow>
            )

            if (!hasChildren || !isExpanded) {
                return [currentRow]
            }

            return [currentRow, ...renderRows(node.children ?? [], level + 1)]
        })

    return (
        <div className="min-w-0 space-y-4">
            <div className="border-border flex flex-wrap items-center gap-2 rounded-lg border bg-white p-4">
                <Button onClick={() => openCreateDialog()}>
                    <Icon icon="ic:round-add" />
                    新增
                </Button>
                <Button
                    variant="outline"
                    disabled={departments.length === 0}
                    onClick={() =>
                        setExpandedIds((prev) =>
                            prev.length === allVisibleIds.length ? [] : allVisibleIds,
                        )
                    }
                >
                    <Icon icon="ic:round-unfold-more" />
                    展开/折叠
                </Button>
                <Input
                    placeholder="部门名称"
                    className="h-9 w-48"
                    value={filters.name}
                    onChange={(event) =>
                        setFilters((prev) => ({
                            ...prev,
                            name: event.target.value,
                        }))
                    }
                />
                <Select
                    value={filters.status}
                    onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, status: value }))
                    }
                >
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="部门状态" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全部</SelectItem>
                        <SelectItem value="1">正常</SelectItem>
                        <SelectItem value="0">停用</SelectItem>
                    </SelectContent>
                </Select>
                <Button type="button">
                    <Icon icon="ic:round-search" />
                    搜索
                </Button>
                <Button
                    variant="outline"
                    onClick={() =>
                        setFilters({
                            name: '',
                            status: 'all',
                        })
                    }
                >
                    <Icon icon="ic:round-refresh" />
                    重置
                </Button>
            </div>

            <div className="min-w-0 rounded-lg border bg-white">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[220px] text-center">部门名称</TableHead>
                            <TableHead className="w-[84px] text-center">状态</TableHead>
                            <TableHead className="w-[180px] text-center">创建时间</TableHead>
                            <TableHead className="w-[96px] text-center">负责人</TableHead>
                            <TableHead className="w-[124px] text-center">联系电话</TableHead>
                            <TableHead className="w-[220px] text-center">邮箱</TableHead>
                            <TableHead className="w-[200px] pr-4 text-center">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tableLoading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-12 text-center text-sm text-slate-500"
                                >
                                    数据加载中...
                                </TableCell>
                            </TableRow>
                        ) : departments.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="py-12 text-center text-sm text-slate-500"
                                >
                                    暂无部门数据
                                </TableCell>
                            </TableRow>
                        ) : (
                            renderRows(filteredData)
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={openDialog}
                onOpenChange={(open) => {
                    setOpenDialog(open)

                    if (!open) {
                        resetDialogState()
                    }
                }}
            >
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === 'edit' ? '修改部门' : '新增部门'}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col gap-y-6 py-6"
                    >
                        <FormItem
                            label="上级部门"
                            required={shouldRequireParent}
                            error={errors.parentId?.message}
                        >
                            {lockedParent ? (
                                <Input
                                    value={lockedParent.name}
                                    disabled
                                    className="h-10 w-full"
                                />
                            ) : shouldRequireParent ? (
                                <Controller
                                    name="parentId"
                                    control={control}
                                    rules={{
                                        validate: (value) =>
                                            value ? true : '请选择上级部门',
                                    }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || undefined}
                                            onValueChange={field.onChange}
                                            disabled={parentLoading}
                                        >
                                            <SelectTrigger className="h-10 w-full">
                                                <SelectValue
                                                    placeholder={
                                                        parentLoading
                                                            ? '加载中...'
                                                            : '请选择上级部门'
                                                    }
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={ROOT_PARENT_VALUE}>
                                                    无
                                                </SelectItem>
                                                {parentOptions.map((option) => (
                                                    <SelectItem
                                                        key={option.id}
                                                        value={String(option.id)}
                                                    >
                                                        {`${'\u00A0\u00A0'.repeat(
                                                            option.level,
                                                        )}${option.name}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            ) : (
                                <Input
                                    value="无"
                                    disabled
                                    className="h-10 w-full"
                                />
                            )}
                        </FormItem>

                        <FormItem
                            label="部门名称"
                            required
                            error={errors.name?.message}
                        >
                            <Input
                                placeholder="请输入部门名称"
                                className="h-10 w-full"
                                {...register('name', {
                                    required: '请输入部门名称',
                                    validate: (value) =>
                                        value.trim() !== '' || '请输入部门名称',
                                })}
                            />
                        </FormItem>

                        <FormItem
                            label="显示排序"
                            error={errors.order?.message}
                        >
                            <Input
                                type="number"
                                min={0}
                                placeholder="0"
                                className="h-10 w-full"
                                {...register('order', {
                                    setValueAs: (value) =>
                                        value === '' ? 0 : Number(value),
                                    validate: (value) =>
                                        (Number.isFinite(value) && value >= 0) ||
                                        '排序不能小于0',
                                })}
                            />
                        </FormItem>

                        <FormItem label="负责人">
                            <Input
                                placeholder="请输入负责人"
                                className="h-10 w-full"
                                {...register('leader')}
                            />
                        </FormItem>

                        <FormItem label="联系电话">
                            <Input
                                placeholder="请输入联系电话"
                                className="h-10 w-full"
                                {...register('phone')}
                            />
                        </FormItem>

                        <FormItem label="邮箱">
                            <Input
                                placeholder="请输入邮箱"
                                className="h-10 w-full"
                                {...register('email')}
                            />
                        </FormItem>

                        <FormItem label="部门状态">
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <RadioGroup
                                        value={String(field.value)}
                                        onValueChange={(value) =>
                                            field.onChange(
                                                Number(value) as DepartmentStatus,
                                            )
                                        }
                                        className="flex items-center gap-6"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="1"
                                                id="status-normal"
                                            />
                                            <Label
                                                htmlFor="status-normal"
                                                className="cursor-pointer font-normal"
                                            >
                                                正常
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem
                                                value="0"
                                                id="status-stop"
                                            />
                                            <Label
                                                htmlFor="status-stop"
                                                className="cursor-pointer font-normal"
                                            >
                                                停用
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                )}
                            />
                        </FormItem>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetDialogState}
                            >
                                取消
                            </Button>
                            <Button type="submit" disabled={submitLoading}>
                                {submitLoading ? '提交中...' : '确定'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DepartmentPage
