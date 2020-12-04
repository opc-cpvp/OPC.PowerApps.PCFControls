import React = require("react");
import {
  DefaultButton,
  DetailsHeader,
  DetailsList,
  IColumn,
  IDetailsHeaderProps,
  IDetailsList,
  IGroup,
  IRenderFunction,
  IToggleStyles,
  mergeStyles,
  Toggle,
  IButtonStyles,
  DetailsListLayoutMode,
  CheckboxVisibility,
  Checkbox,
  IDetailsRowStyles,
  IDetailsRowProps,
  DetailsRow,
  IDetailsListProps,
  SelectionMode,
  DetailsRowFields,
  IDetailsRowFieldsProps,
  IButtonGridStyles,
} from 'office-ui-fabric-react';
import { initializeIcons } from '@uifabric/icons';
import { IconButton } from '@fluentui/react/lib/Button';
import { SharedColors } from '@fluentui/theme';
initializeIcons();

const margin = '0 20px 20px 0';
const controlWrapperClass = mergeStyles({
  display: 'flex',
  flexWrap: 'wrap',
});
const toggleStyles: Partial<IToggleStyles> = {
  root: { margin: margin },
  label: { marginLeft: 10 },
};
const addItemButtonStyles: Partial<IButtonStyles> = { root: { margin: margin } };
const _blueGroupIndex = 2;

export interface IDetailsListGroupedExampleItem {
  key: string;
  name: string;
}

export interface ITaskManagerProps {
  items: IDetailsListGroupedExampleItem[];
  groups: IGroup[];
  showItemIndexInView: boolean;
  isCompactMode: boolean;
}

export interface ITaskManagerState extends React.ComponentState, ITaskManagerProps {

}

export class TaskManager extends React.Component<ITaskManagerProps, ITaskManagerState>{
  private _root = React.createRef<IDetailsList>();
  private _columns: IColumn[];

  constructor(props: ITaskManagerProps) {
    super(props);

    this.state = {
      items: [
        { key: 'a', name: 'a' },
        { key: 'b', name: 'b' },
        { key: 'c', name: 'c' },
        { key: 'd', name: 'd' },
        { key: 'e', name: 'e' },
      ],
      // This is based on the definition of items
      groups: [
        { key: 'todo', name: 'To do', startIndex: 0, count: 2 },
        { key: 'done', name: 'Done', startIndex: 2, count: 0, isCollapsed: true },
      ],
      showItemIndexInView: false,
      isCompactMode: false,
    };

    this._columns = [
      { key: 'name', name: 'Name', fieldName: 'name', minWidth: 100, isResizable: true },
    ];
  }

  public componentWillUnmount() {
    if (this.state.showItemIndexInView) {
      const itemIndexInView = this._root.current!.getStartItemIndexInView();
      alert('first item index that was in view: ' + itemIndexInView);
    }
  }

  public render() {
    const { items, groups, isCompactMode } = this.state;
    const buttonStyles : Partial<IButtonStyles> = {
      icon: {
        color: SharedColors.gray40
      }
    };


    return (
      <div>
        {/* <div className={controlWrapperClass}>
          <DefaultButton onClick={this._addItem} text="Add an item" styles={addItemButtonStyles} />
          <Toggle
            label="Compact mode"
            inlineLabel
            checked={isCompactMode}
            onChange={this._onChangeCompactMode}
            styles={toggleStyles}
          />
          <Toggle
            label="Show index of first item in view when unmounting"
            inlineLabel
            checked={this.state.showItemIndexInView}
            onChange={this._onShowItemIndexInViewChanged}
            styles={toggleStyles}
          />
        </div> */}
        <div style={{display:"flex", padding: "10px 10px 0 10px"}}>
          <h3>Tasks</h3>
          <div style={{ marginLeft: "auto"}}>
            <IconButton iconProps={{ iconName: 'Add' }} title="Add" ariaLabel="Add" styles={buttonStyles} />
            <IconButton iconProps={{ iconName: 'AllApps' }} title="Show all" ariaLabel="AllApps" styles={buttonStyles} />
          </div>
        </div>
        <DetailsList
          componentRef={this._root}
          items={items}
          columns={this._columns}
          ariaLabelForSelectAllCheckbox="Toggle selection for all items"
          ariaLabelForSelectionColumn="Toggle selection"
          checkButtonAriaLabel="Row checkbox"
          onRenderDetailsHeader={this._onRenderDetailsHeader}
          isHeaderVisible={false}
          checkboxVisibility={CheckboxVisibility.always}
          onRenderItemColumn={this._onRenderColumn}
          onRenderRow={this._onRenderRow}
          onRenderCheckbox={this._onRenderCheckbox}
          selectionPreservedOnEmptyClick={true}
          compact={isCompactMode}
          selectionMode={SelectionMode.multiple}
        />
      </div>
    );
  }

  private _onRenderRow: IDetailsListProps['onRenderRow'] = props => {
    const customStyles: Partial<IDetailsRowStyles> = {
      root: {alignItems: "center"}
    };
    if (props) {
      return <DetailsRow {...props} styles={customStyles} rowFieldsAs={this.renderRowFields} />;
    }
    return null;
  };

  private renderRowFields(props: IDetailsRowFieldsProps) {
    return (
      // Not perfect here, there seems to be a single pixel that allows selection
      <span data-selection-disabled={true}>
        <DetailsRowFields {...props} /> 
      </span>
    );
  }
  _onRenderCheckbox(props: any) {
    return (
      <div style={{ pointerEvents: 'none' }}> 
        <Checkbox checked={props.checked} />
      </div>
    );
  }

  private _addItem = (): void => {
    const items = this.state.items;
    const groups = [...this.state.groups];
    groups[_blueGroupIndex].count++;

    this.setState(
      {
        items: items.concat([
          {
            key: 'item-' + items.length,
            name: 'New item ' + items.length,
          },
        ]),
        groups,
      },
      () => {
        if (this._root.current) {
          this._root.current.focusIndex(items.length, true);
        }
      },
    );
  };

  private _onRenderDetailsHeader(props?: IDetailsHeaderProps, _defaultRender?: IRenderFunction<IDetailsHeaderProps>) {
    return <DetailsHeader {...(props ?? { columns: undefined, selection: undefined, selectMode: undefined, layoutMode: DetailsListLayoutMode.fixedColumns })} ariaLabelForToggleAllGroupsButton={'Expand collapse groups'} />;
  }

  private _onRenderColumn(item?: IDetailsListGroupedExampleItem, index?: number, column?: IColumn) {
    const value =
      item && column?.fieldName ? item[column.fieldName as keyof IDetailsListGroupedExampleItem] || '' : '';
    const buttonStyles : Partial<IButtonStyles> = {
      icon: {
        color: SharedColors.red10
      }
    };

    return <div className="task-wrapper">
      <div className="task-content">
        <span className="task-title">{value}</span>
        <span className="badge badge-red">Required</span>
        <div className="task-description">lorem ipsum ipsum lorem tacos carnitas taquitos</div>
      </div>
      <div className="task-action"><IconButton iconProps={{ iconName: 'Delete' }} title="Delete" ariaLabel="Delete" styles={buttonStyles} /></div>
    </div>;
  }

  private _onShowItemIndexInViewChanged = (event: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    this.setState({ showItemIndexInView: checked ?? false });
  };

  private _onChangeCompactMode = (ev?: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    this.setState({ isCompactMode: checked ?? false });
  };
}
