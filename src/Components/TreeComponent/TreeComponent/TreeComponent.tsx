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
  // TODO: Future feature for hover data?
}

export interface ITreeSelectProps {
  selectLabel: string | undefined;
  selectedItems?: string[];
  onChange(selectedItems?: string[]): void;
  treeData: TreeSelectNode[]; // Can't seem to find the real type, keep any for now
  maxNameDisplayLength: number;
}

export interface ITreeSelectState extends React.ComponentState { // Check if extending props is the way to go, but don't state for all props so probably not
  selectedItems?: string[];
  treeData?: any; // The modified tree nodes given by the props
}

export class TreeComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {
  constructor(props: ITreeSelectProps) {
    super(props);

    let rootNode = new TreeSelectNode();
    rootNode.key = "";
    rootNode.children = [];

    this.buildTreeData(props.treeData, rootNode);

    console.log(props.selectedItems);

    this.state = {
      selectedItems: props.selectedItems,
      treeData: rootNode.children
    };
  }

  // Create the tree from the flat array
  //TODO: if possible, either check if there's a way o add parentless children (they have a prent id but the parent is not present in the list) or configure the pcf some more to skip headings if chosen
  public buildTreeData(treeNodes: TreeSelectNode[], treeRoot: TreeSelectNode | null) {
    for (var node in treeNodes) {
      let currentNode = treeNodes[node];
      if (node != null && treeRoot != null) {
        // Add to tree if root node or tree root is the parent of the current node
        if (currentNode.parentKey == (treeRoot.key || null)) {
          treeRoot.children.push(currentNode);

          if (currentNode.titleDetails) {
            currentNode.title = <div>{currentNode.name} | <em>{currentNode.titleDetails}</em></div>;
          } else {
            currentNode.title = currentNode.name;
          }

          currentNode.inputTitle = currentNode.name;

          // If a max display length is set and the max reached, truncate the title
          if (this.props.maxNameDisplayLength > -1 && currentNode.title.toString().length > this.props.maxNameDisplayLength) {
            currentNode.title = currentNode.title.toString().substr(0, this.props.maxNameDisplayLength - 1) + "...";
          }

          this.buildTreeData(treeNodes, currentNode);
        }
      }
    }
  }

  // TODO: Deprecated, use componentDidUpdate instead (but needs tweaks) https://reactjs.org/docs/react-component.html#componentdidupdate
  public componentWillReceiveProps(newProps: ITreeSelectProps): void {
    let rootNode = new TreeSelectNode();
    rootNode.key = "";
    rootNode.children = [];

    this.buildTreeData(newProps.treeData, rootNode);
    console.log(newProps.selectedItems);
    this.setState({
      selectedItems: newProps.selectedItems,
      treeData: rootNode.children
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

    return includesIgnoreCase(treeNode.description, inputValue) || includesIgnoreCase(treeNode.name, inputValue);
  }

  public render(): JSX.Element {
    return (
      <TreeSelect
        treeData={this.state.treeData}
        value={this.state.selectedItems}
        onChange={this.onChange}
        treeCheckable={true}
        showCheckedStrategy={SHOW_CHILD}
        placeholder={this.props.selectLabel}
        filterTreeNode={this.filter}
        treeNodeLabelProp="inputTitle"
        style={{
          width: '100%',
        }} />
    );
  }
}

