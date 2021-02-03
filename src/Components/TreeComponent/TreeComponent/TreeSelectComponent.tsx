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
}

export interface ITreeSelectProps {
  selectLabel: string | undefined;
  selectedItems?: string[];
  onChange(selectedItems?: string[]): void;
  treeData: TreeSelectNode[]; // Can't seem to find the real type, keep any for now
}

export interface ITreeSelectState extends React.ComponentState { // Check if extending props is the way to go, but don't state for all props so probably not
  selectedItems?: string[];
  treeData?: any; // The modified tree nodes given by the props
}

export class TreeSelectComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {
  constructor(props: ITreeSelectProps) {
    super(props);

    let rootNode = new TreeSelectNode();
    rootNode.key = "";
    rootNode.children = [];

    this.buildTreeData(props.treeData, rootNode);

    this.state = {
      selectedItems: props.selectedItems,
      treeData: rootNode.children
    };

    console.log(this.state.treeData);
  }


  // Create the tree from the flat array
  public buildTreeData(treeNodes: TreeSelectNode[], treeRoot: TreeSelectNode | null) {
    console.log("Rebuilding tree");
    for (var node in treeNodes) {
      let currentNode = treeNodes[node];
      if (node != null && treeRoot != null) {
        // Add to tree if root node or tree root is the parent of the current node
        if (currentNode.parentKey == (treeRoot.key || null)) {
          treeRoot.children.push(currentNode);

         
          // TODO: Create new entity columns for only marginal note and append here (configure to add "extra title")
          // Can actually make the hover stuff work here I think too, coukd be usuful to show the full marginal note and maybe even descriptions if really wanted
          currentNode.title = <div><i>Test</i></div>; // Display as html, we want this
          currentNode.name = "<div><i>Test</i></div>"; // Display as plain string
          currentNode.inputTitle = "<div><i>Test</i></div>";

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

