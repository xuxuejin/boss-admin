import { formatDateTime } from '@/utils/date'
import type {
    RoleApiItem,
    RoleDataScope,
    RoleMenuApiItem,
    RoleStatus,
    RoleUserApiItem,
} from '@/types/role'

export type RoleRecord = {
    id: number
    name: string
    key: string
    order: number
    status: RoleStatus
    createTime: string
    remark: string
    menuIds: number[]
    menuCheckStrictly: boolean
    dataScope: RoleDataScope
}

export type MenuNode = {
    id: number
    name: string
    parentId: number | null
    children?: MenuNode[]
}

export type RoleUserRecord = {
    id: number
    username: string
    nickname: string
    email: string
    status: RoleStatus
    createTime: string
}

export const DATA_SCOPE_OPTIONS: { value: RoleDataScope; label: string }[] = [
    { value: 1, label: '全部数据权限' },
    { value: 2, label: '自定数据权限' },
    { value: 3, label: '本部门数据权限' },
    { value: 4, label: '本部门及以下数据权限' },
    { value: 5, label: '仅本人数据权限' },
]

export const mapRoleFromApi = (item: RoleApiItem): RoleRecord => ({
    id: item.id,
    name: item.name ?? '',
    key: item.key ?? '',
    order: typeof item.order === 'number' ? item.order : 0,
    status: item.status === 0 ? 0 : 1,
    createTime: formatDateTime(item.create_time),
    remark: item.remark ?? '',
    menuIds: Array.isArray(item.menu_ids) ? item.menu_ids : [],
    menuCheckStrictly: item.menu_check_strictly ?? true,
    dataScope:
        typeof item.data_scope === 'number' &&
        item.data_scope >= 1 &&
        item.data_scope <= 5
            ? (item.data_scope as RoleDataScope)
            : 1,
})

export const mapRoleUserFromApi = (item: RoleUserApiItem): RoleUserRecord => ({
    id: item.id,
    username: item.username ?? '',
    nickname: item.nickname ?? '-',
    email: item.email ?? '-',
    status: item.status === 0 ? 0 : 1,
    createTime: formatDateTime(item.create_time),
})

const normalizeNestedNode = (item: RoleMenuApiItem): MenuNode => ({
    id: item.id,
    name: item.name ?? '',
    parentId:
        typeof item.parent_id === 'number' || item.parent_id === null
            ? item.parent_id
            : null,
    children:
        item.children && item.children.length > 0
            ? item.children.map(normalizeNestedNode)
            : undefined,
})

const buildTreeFromFlat = (items: RoleMenuApiItem[]): MenuNode[] => {
    const nodeMap = new Map<number, MenuNode>()
    const roots: MenuNode[] = []

    items.forEach((item) => {
        nodeMap.set(item.id, {
            id: item.id,
            name: item.name ?? '',
            parentId:
                typeof item.parent_id === 'number' || item.parent_id === null
                    ? item.parent_id
                    : null,
            children: [],
        })
    })

    nodeMap.forEach((node) => {
        if (node.parentId === null) {
            roots.push(node)
            return
        }

        const parentNode = nodeMap.get(node.parentId)
        if (parentNode) {
            parentNode.children = [...(parentNode.children ?? []), node]
            return
        }

        roots.push(node)
    })

    const normalizeChildren = (nodes: MenuNode[]): MenuNode[] =>
        nodes
            .map((node) => ({
                ...node,
                children:
                    node.children && node.children.length > 0
                        ? normalizeChildren(node.children)
                        : undefined,
            }))
            .sort((a, b) => a.id - b.id)

    return normalizeChildren(roots)
}

export const normalizeMenuTree = (
    items: RoleMenuApiItem[] | null | undefined,
): MenuNode[] => {
    const source = items ?? []
    if (source.length === 0) return []

    const hasNestedData = source.some(
        (item) => Array.isArray(item.children) && item.children.length > 0,
    )

    if (hasNestedData) {
        return source.map(normalizeNestedNode)
    }

    return buildTreeFromFlat(source)
}

const collectDescendantIds = (node: MenuNode): number[] =>
    (node.children ?? []).flatMap((child) => [
        child.id,
        ...collectDescendantIds(child),
    ])

const buildMenuLookups = (tree: MenuNode[]) => {
    const nodeMap = new Map<number, MenuNode>()
    const parentMap = new Map<number, number | null>()

    const dfs = (nodes: MenuNode[], parentId: number | null) => {
        nodes.forEach((node) => {
            nodeMap.set(node.id, node)
            parentMap.set(node.id, parentId)
            dfs(node.children ?? [], node.id)
        })
    }

    dfs(tree, null)
    return { nodeMap, parentMap }
}

const getChildIds = (node: MenuNode) =>
    (node.children ?? []).map((child) => child.id)

export const toggleMenuSelection = ({
    tree,
    selectedIds,
    targetId,
    nextChecked,
    strictLinkage,
}: {
    tree: MenuNode[]
    selectedIds: number[]
    targetId: number
    nextChecked: boolean
    strictLinkage: boolean
}): number[] => {
    const selectedSet = new Set(selectedIds)

    if (!strictLinkage) {
        if (nextChecked) {
            selectedSet.add(targetId)
        } else {
            selectedSet.delete(targetId)
        }
        return Array.from(selectedSet)
    }

    const { nodeMap, parentMap } = buildMenuLookups(tree)
    const targetNode = nodeMap.get(targetId)
    if (!targetNode) return selectedIds

    const impactIds = [targetNode.id, ...collectDescendantIds(targetNode)]

    if (nextChecked) {
        impactIds.forEach((id) => selectedSet.add(id))

        let parentId = parentMap.get(targetNode.id)
        while (parentId !== undefined && parentId !== null) {
            const parentNode = nodeMap.get(parentId)
            if (!parentNode) break

            const childIds = getChildIds(parentNode)
            const allChildrenSelected = childIds.every((id) =>
                selectedSet.has(id),
            )

            if (allChildrenSelected) {
                selectedSet.add(parentNode.id)
            }

            parentId = parentMap.get(parentNode.id)
        }
    } else {
        impactIds.forEach((id) => selectedSet.delete(id))

        let parentId = parentMap.get(targetNode.id)
        while (parentId !== undefined && parentId !== null) {
            selectedSet.delete(parentId)
            parentId = parentMap.get(parentId)
        }
    }

    return Array.from(selectedSet)
}

const hasAnySelectedDescendant = (
    node: MenuNode,
    selectedSet: Set<number>,
): boolean =>
    (node.children ?? []).some((child) =>
        selectedSet.has(child.id)
            ? true
            : hasAnySelectedDescendant(child, selectedSet),
    )

export const getMenuCheckedState = (
    node: MenuNode,
    selectedIds: number[],
): boolean | 'indeterminate' => {
    const selectedSet = new Set(selectedIds)
    const currentChecked = selectedSet.has(node.id)
    const descendantSelected = hasAnySelectedDescendant(node, selectedSet)

    if (currentChecked && !descendantSelected) {
        return true
    }

    if (currentChecked || descendantSelected) {
        if (!node.children || node.children.length === 0) {
            return currentChecked
        }

        const childStates = node.children.map((child) =>
            getMenuCheckedState(child, selectedIds),
        )
        const allChecked = childStates.every((state) => state === true)

        if (allChecked && currentChecked) {
            return true
        }

        return 'indeterminate'
    }

    return false
}
