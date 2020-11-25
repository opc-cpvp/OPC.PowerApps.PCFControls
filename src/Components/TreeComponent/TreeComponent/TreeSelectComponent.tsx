import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { TreeSelect } from 'antd/lib/';
import { TreeSelectProps } from 'antd/lib/tree-select';
import 'antd/lib/tree-select/style/index.css';


const { SHOW_PARENT } = TreeSelect;

// Temp data
const treeData = [
  {
    title: 'parent 0',
    key: '0-0',
    children: [
      {
        title: 'leaf 0-0',
        key: '0-0-0',
        isLeaf: true,
      },
      {
        title: 'leaf 0-1',
        key: '0-0-1',
        isLeaf: true,
      },
    ],
  },
  {
    title: 'parent 1',
    key: '0-1',
    children: [
      {
        title: 'stuff',
        key: '0-1-0',
        isLeaf: true,
      },
      {
        title: 'leaf 1-1',
        key: '0-1-1',
        isLeaf: true,
      },
    ],
  },
];

// export interface ITagPickerLabelProps {
//     input?: string;
//     noResultsFound?: string;
//     removeButton?: string;
// }

// export interface Tree {
//     labels?: ITagPickerLabelProps,
//     labelText?: string;
//     selectedItems?: ITag[];
//     onChange?: (items?: ITag[]) => void;
//     onEmptyInputFocus?: (selectedItems?: ITag[]) => Promise<ITag[]>;
//     onResolveSuggestions?: (filter: string, selectedItems?: ITag[]) => Promise<ITag[]>;
// }

// Customize to whatever needs to be changed
export interface ITreeSelectProps {
  // labels?: ITagPickerLabelProps,
  // labelText?: string;
  // selectedItems?: ITag[];
  // onChange?: (items?: ITag[]) => void;
  // onEmptyInputFocus?: (selectedItems?: ITag[]) => Promise<ITag[]>;
  // onResolveSuggestions?: (filter: string, selectedItems?: ITag[]) => Promise<ITag[]>;
}

export interface ITreeSelectState extends React.ComponentState, ITreeSelectProps {
}

export class TreeSelectComponent extends React.Component<ITreeSelectProps, ITreeSelectState> {

  constructor(props: ITreeSelectProps) {
    super(props);

    // this.state = {
    //     selectedItems: props.selectedItems || []
    // };
  }

  state = {
    value: ['0-0-0'],
  };

  onChange = (value: any) => {
    console.log('onChange ', value);
    this.setState({ value });
  };

  public render(): JSX.Element {
    const tProps: TreeSelectProps<ITreeSelectState> = {
      treeData,
      value: this.state.value,
      onChange: this.onChange,
      treeCheckable: true,
      showCheckedStrategy: SHOW_PARENT,
      placeholder: 'Please select',
      style: {
        width: '100%',
      },
    };
    return (
      <TreeSelect
        treeData={treeData}
        value={this.state.value}
        onChange={this.onChange}
        treeCheckable={true}
        showCheckedStrategy={SHOW_PARENT}
        placeholder={'Please select'}
        style={{
          width: '100%',
        }} />
    );
  }
}

