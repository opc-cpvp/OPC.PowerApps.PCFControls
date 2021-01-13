import * as React from 'react';
import { TreeSelect } from 'antd/lib';

const { SHOW_CHILD } = TreeSelect;

export class TreeSelectNode {
  title: React.ReactNode | null
  name: string
  key: string
  isLeaf: boolean
  children: TreeSelectNode[]
  summary: string
  description: string
}

export interface ITreeSelectProps {
  selectLabel: string | undefined;
  selectedItems?: string[];
  onChange(selectedItems?: string[]): void;
  treeData: any; // Can't seem to find the real type, keep any for now
}

export interface ITreeSelectState extends React.ComponentState { // Check if extending props is the way to go, but don't state for all props so probably not
  selectedItems?: string[];
}

export class TreeSelectComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {
  constructor(props: ITreeSelectProps) {
    super(props);

    this.state = {
      selectedItems: props.selectedItems
    };
  }

  // TODO: Deprecated, use componentDidUpdate instead (but needs tweaks) https://reactjs.org/docs/react-component.html#componentdidupdate
  public componentWillReceiveProps(newProps: ITreeSelectProps): void {
    this.setState({
      selectedItems: newProps.selectedItems
    });
  }

  // public componentDidUpdate(prevProps: any){
  //   if(this.props.treeData !== prevProps.treeData){
  //     this.setState({
  //       treeData: newProps.treeData, hovered: false,
  //       clicked: false,
  //     });
  //   }
  // }

  // On change shows the keys of the nodes that are selected only, this is where we'll associate (if the entity already exists)
  onChange = (selectedItems: string[]): void => {
    this.setState({ selectedItems });
    this.props.onChange(selectedItems);
  }

  filter = (inputValue: string, treeNode: any): boolean => {
    const includesIgnoreCase = (value1: string, value2: string) =>
      (value1 && value2) ? value1.toLowerCase().includes(value2.toLowerCase()) : false;

    return includesIgnoreCase(treeNode.summary, inputValue) ||
      includesIgnoreCase(treeNode.description, inputValue) ||
      includesIgnoreCase(treeNode.name, inputValue);
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
        style={{
          width: '100%',
        }} />
    );
  }
}

