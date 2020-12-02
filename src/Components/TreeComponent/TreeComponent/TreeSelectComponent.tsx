import * as React from 'react';
import { TreeSelect, Popover, Button } from 'antd/lib';

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

// Customize to whatever needs to be changed
export interface ITreeSelectProps {
  selectedItems?: string[];
  onChange(selectedItems?: string[]): void;
  treeData: any; // Can't seem to find the real type, keep any for now
}

export interface ITreeSelectState extends React.ComponentState { // Check if extending props is the way to go, but don't state for all props so probably not
  selectedItems?: string[];
}

export class TreeSelectComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {

  // TODO: Create custom array of tree nodes and create the real tree "here"
  constructor(props: ITreeSelectProps) {
    super(props);

    this.state = {
      selectedItems: props.selectedItems
    };
  }

  // TODO: Deprecated, use componentDidUpdate instead (but needs tweaks) https://reactjs.org/docs/react-component.html#componentdidupdate
  public componentWillReceiveProps(newProps: ITreeSelectProps): void {
    console.log("Will recieve props:", newProps.selectedItems)
    this.setState({
      //treeData: newProps.treeData,
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
  onChange = (selectedItems: string[]) => {
    console.log('onChange ', selectedItems);
    this.setState({ selectedItems }); // Not sure if this will affect props in a negative manner
    this.props.onChange(selectedItems);
  };

  filter = (inputValue: string, treeNode: any): boolean => {
    const includesIgnoreCase = (value1: string, value2: string) =>
      (value1 && value2) ? value1.toLowerCase().includes(value2.toLowerCase()) : false;

    return includesIgnoreCase(treeNode.summary, inputValue) ||
      includesIgnoreCase(treeNode.description, inputValue) || // description may be removed since it's not currently displayed
      includesIgnoreCase(treeNode.name, inputValue);
  }

  // Can possibly just use props instead of state
  public render(): JSX.Element {
    return (
      <TreeSelect
        treeData={this.props.treeData}
        value={this.state.selectedItems} // Value is the currently selected nodes. may be the only thing that requires state
        onChange={this.onChange}
        treeCheckable={true}
        showCheckedStrategy={SHOW_CHILD}
        placeholder={'Please select'}
        filterTreeNode={this.filter}
        style={{
          width: '100%',
        }} />
    );
  }
}

