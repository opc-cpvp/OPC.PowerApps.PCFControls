import * as React from "react";
import { TreeSelect } from "antd/lib";
import { TreeSelectNode } from "./TreeSelectNode";
import "antd/dist/antd.css";

const { SHOW_CHILD } = TreeSelect;

export interface ITreeSelectProps {
    selectLabelText: string | undefined;
    createRecordText: string | undefined;
    selectedItems?: string[];
    treeData: TreeSelectNode[];
    maxNameDisplayLength: number;
    entityExists: boolean;
    onChange(selectedItems?: string[]): void;
}

export interface ITreeSelectState extends React.ComponentState {
    selectedItems?: string[];
}

export class TreeComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {
    constructor(props: ITreeSelectProps) {
        super(props);

        this.state = {
            selectedItems: props.selectedItems
        };
    }

    onChange = (selectedItems: string[]): void => {
        this.setState({ selectedItems: selectedItems });
        this.props.onChange(selectedItems);
    };

    public componentDidUpdate(prevProps: ITreeSelectProps): void {
        if (this.props.selectedItems !== prevProps.selectedItems) {
            this.setState((_status, newProps) => ({
                selectedItems: newProps.selectedItems
            }));
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    filter = (inputValue: string, treeNode: any): boolean => {
        const includesIgnoreCase = (value1: string, value2: string): boolean =>
            value1 && value2 ? value1.toLowerCase().includes(value2.toLowerCase()) : false;

        return (
            includesIgnoreCase(treeNode.description as string, inputValue) ||
            includesIgnoreCase(treeNode.name as string, inputValue) ||
            includesIgnoreCase(treeNode.titleDetails as string, inputValue)
        );
    };

    public render(): JSX.Element {
        if (!this.props.entityExists) {
            return <p>{this.props.createRecordText}</p>;
        }

        return (
            <TreeSelect
                treeData={this.props.treeData}
                value={this.state.selectedItems}
                onChange={this.onChange}
                treeCheckable={true}
                showCheckedStrategy={SHOW_CHILD}
                placeholder={this.props.selectLabelText}
                filterTreeNode={this.filter}
                treeDefaultExpandAll={true}
                treeNodeLabelProp="inputTitle"
                style={{
                    width: "100%"
                }}
            />
        );
    }
}
