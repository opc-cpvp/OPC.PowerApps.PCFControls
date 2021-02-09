import * as React from 'react';
import { TreeSelect } from 'antd/lib';

const { SHOW_CHILD } = TreeSelect;

export class TreeSelectNode {
  title: React.ReactNode | null
  inputTitle: string
  name: string
  key: string
  isLeaf: boolean
  children: TreeSelectNode[]
  summary: string
  description: string
  checkable: boolean
  parentKey: string
  titleDetails: string
}

export interface ITreeSelectProps {
  selectLabel: string | undefined;
  selectedItems?: string[];
  onChange(selectedItems?: string[]): void;
  treeData: TreeSelectNode[];
  maxNameDisplayLength: number;
}

export interface ITreeSelectState extends React.ComponentState {
  selectedItems?: string[];
}

export class TreeComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {
  constructor(props: ITreeSelectProps) {
    super(props);

    this.state = {
      selectedItems: props.selectedItems,
    };
  }

  public componentDidUpdate(prevProps: any) {
    if (this.props.selectedItems !== prevProps.selectedItems) {
      this.setState({
        selectedItems: this.props.selectedItems,
      });
    }
  }

  onChange = (selectedItems: string[]): void => {
    this.setState({ selectedItems });
    this.props.onChange(selectedItems);
  }

  filter = (inputValue: string, treeNode: any): boolean => {
    const includesIgnoreCase = (value1: string, value2: string) =>
      (value1 && value2) ? value1.toLowerCase().includes(value2.toLowerCase()) : false;

    return includesIgnoreCase(treeNode.description, inputValue) ||
      includesIgnoreCase(treeNode.name, inputValue) ||
      includesIgnoreCase(treeNode.titleDetails, inputValue);
  }

  public render(): JSX.Element {
    return (
      <TreeSelect
        treeData={this.props.treeData}
        value={this.state.selectedItems}
        onChange={this.onChange}
        treeCheckable={true}
        showCheckedStrategy={SHOW_CHILD}
        placeholder={this.props.selectLabel}
        filterTreeNode={this.filter}
        treeDefaultExpandAll={true}
        treeNodeLabelProp="inputTitle"
        style={{
          width: '100%',
        }} />
    );
  }
}

