import * as React from "react";

export class TreeSelectNode {
    title: React.ReactNode | null;
    inputTitle: string;
    name: string;
    key: string;
    value: string;
    isLeaf: boolean;
    children: TreeSelectNode[];
    summary: string;
    description: string;
    checkable: boolean;
    parentKey: string;
    titleDetails: string;
}
