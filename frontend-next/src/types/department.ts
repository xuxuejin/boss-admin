export interface Department {
    id: number;
    name: string;
    order: number;
    status: number; // 1: 正常, 0: 停用
    createTime: string;
    children?: Department[]; // 递归子节点
}