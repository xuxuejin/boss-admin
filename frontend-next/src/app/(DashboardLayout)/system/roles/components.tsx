'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { type MenuNode, getMenuCheckedState } from './shared'

export const FormItem = ({
    label,
    required,
    children,
    error,
    alignStart = false,
}: {
    label: string
    required?: boolean
    children: ReactNode
    error?: string
    alignStart?: boolean
}) => (
    <div
        className={cn(
            'grid grid-cols-[110px_1fr] items-center gap-4',
            alignStart && 'items-start',
        )}
    >
        <Label
            className={cn(
                'text-right font-medium',
                alignStart && 'pt-2',
                error && 'text-destructive',
            )}
        >
            {required && <span className="text-destructive mr-1">*</span>}
            {label}
        </Label>
        <div className="flex flex-col gap-1.5">
            <div className={cn(error && '[&_input]:border-destructive')}>
                {children}
            </div>
            {error && <span className="text-destructive text-xs">{error}</span>}
        </div>
    </div>
)

const collectAllIds = (nodes: MenuNode[]): number[] =>
    nodes.flatMap((node) => [node.id, ...collectAllIds(node.children ?? [])])

const TreeRow = ({
    node,
    level,
    expandedIds,
    onToggleExpand,
    checkedIds,
    onToggleCheck,
    disabled,
}: {
    node: MenuNode
    level: number
    expandedIds: number[]
    onToggleExpand: (id: number) => void
    checkedIds: number[]
    onToggleCheck: (id: number, checked: boolean) => void
    disabled?: boolean
}) => {
    const hasChildren = (node.children?.length ?? 0) > 0
    const isExpanded = expandedIds.includes(node.id)
    const checkedState = getMenuCheckedState(node, checkedIds)

    return (
        <>
            <div
                className="flex items-center gap-2 py-1.5"
                style={{ paddingLeft: `${level * 18}px` }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => onToggleExpand(node.id)}
                        className="text-slate-500"
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
                    <span className="inline-block w-4.5" />
                )}
                <Checkbox
                    checked={checkedState}
                    disabled={disabled}
                    onCheckedChange={(value) =>
                        onToggleCheck(node.id, value === true)
                    }
                    id={`menu-${node.id}`}
                />
                <Label
                    htmlFor={`menu-${node.id}`}
                    className={cn(
                        'cursor-pointer font-normal',
                        disabled && 'cursor-not-allowed opacity-70',
                    )}
                >
                    {node.name}
                </Label>
            </div>

            {hasChildren &&
                isExpanded &&
                node.children?.map((child) => (
                    <TreeRow
                        key={child.id}
                        node={child}
                        level={level + 1}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                        checkedIds={checkedIds}
                        onToggleCheck={onToggleCheck}
                        disabled={disabled}
                    />
                ))}
        </>
    )
}

export const MenuPermissionTree = ({
    tree,
    checkedIds,
    strictLinkage,
    loading,
    disabled,
    onStrictLinkageChange,
    onToggleCheck,
}: {
    tree: MenuNode[]
    checkedIds: number[]
    strictLinkage: boolean
    loading?: boolean
    disabled?: boolean
    onStrictLinkageChange?: (checked: boolean) => void
    onToggleCheck: (id: number, checked: boolean) => void
}) => {
    const [expandedIds, setExpandedIds] = useState<number[]>([])
    const allIds = useMemo(() => collectAllIds(tree), [tree])

    useEffect(() => {
        setExpandedIds(allIds)
    }, [allIds])

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        )
    }

    return (
        <div className="space-y-3">
            {onStrictLinkageChange && (
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="menu-strict-linkage"
                        checked={strictLinkage}
                        onCheckedChange={(value) =>
                            onStrictLinkageChange(value === true)
                        }
                        disabled={disabled}
                    />
                    <Label
                        htmlFor="menu-strict-linkage"
                        className={cn(
                            'cursor-pointer text-sm font-normal',
                            disabled && 'cursor-not-allowed opacity-70',
                        )}
                    >
                        父子联动
                    </Label>
                </div>
            )}

            <div className="border-border max-h-80 overflow-auto rounded-md border p-3">
                <div className="mb-2 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="text-primary text-xs hover:underline"
                        onClick={() => setExpandedIds(allIds)}
                    >
                        全部展开
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                        type="button"
                        className="text-primary text-xs hover:underline"
                        onClick={() => setExpandedIds([])}
                    >
                        全部折叠
                    </button>
                </div>

                {loading ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                        菜单加载中...
                    </div>
                ) : tree.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                        暂无菜单数据
                    </div>
                ) : (
                    tree.map((node) => (
                        <TreeRow
                            key={node.id}
                            node={node}
                            level={0}
                            expandedIds={expandedIds}
                            onToggleExpand={toggleExpand}
                            checkedIds={checkedIds}
                            onToggleCheck={onToggleCheck}
                            disabled={disabled}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
