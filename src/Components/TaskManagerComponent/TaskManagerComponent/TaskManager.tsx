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
  Selection,
  IDetailsListCheckboxProps,
  IObjectWithKey
} from 'office-ui-fabric-react';
import { initializeIcons } from '@uifabric/icons';
import { IconButton } from '@fluentui/react/lib/Button';
import { SharedColors } from '@fluentui/theme';
import { IInputs } from "./generated/ManifestTypes";
import { exception } from "console";
import { ITaskManagerBadgeConfigurationItem } from "./ITaskManagerBadgeConfigurationItem";
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

export interface ITaskItem {
  key: string;
  subject: string;
  description: string;
  statuscode: string;
  isActive: boolean;
}

export interface ITaskManagerProps {
  items: () => ITaskItem[];
  badgeConfig?: ITaskManagerBadgeConfigurationItem[];
  context?: ComponentFramework.Context<IInputs>;
  showInactive?: boolean;
}

export interface ITaskManagerState extends React.ComponentState, ITaskManagerProps {
  selectedItems: IObjectWithKey[];
}

export class TaskManager extends React.Component<ITaskManagerProps, ITaskManagerState>{
  private _root = React.createRef<IDetailsList>();
  private _columns: IColumn[];
  private _context: ComponentFramework.Context<IInputs>;
  private _selection: Selection;

  constructor(props: ITaskManagerProps) {
    super(props);

    // Enable 'this' reference for these method calls
    this._onRenderColumn = this._onRenderColumn.bind(this);
    this._onShowAllClick = this._onShowAllClick.bind(this);
    this._handleAddOnClick = this._handleAddOnClick.bind(this);
    this.handleDeleteTask = this.handleDeleteTask.bind(this);

    this._context = props.context as ComponentFramework.Context<IInputs>; // TODO: verify this cast
    this._selection = new Selection({
      onSelectionChanged: () => {
        const currentSelection = this._selection.getSelection();
        const checked = currentSelection.filter(t => !this.state.selectedItems.find(s => s.key === t.key));
        const unchecked = this.state.selectedItems.filter(t => !currentSelection.find(s => s.key === t.key));

        this.setState({ selectedItems: currentSelection });
        if (checked.length > 0) {
          this._context.webAPI.updateRecord("task", checked[0].key as string, { statecode: 1, statuscode: 5 })
            .catch(ex => console.error(ex));
        }
        else if (unchecked.length > 0) {
          this._context.webAPI.updateRecord("task", unchecked[0].key as string, { statecode: 0, statuscode: 3 })
            .catch(ex => console.error(ex));
        }
      }
    });
    this.state = {
      items: props.items,
      context: props.context,
      showInactive: false,
      selectedItems: this._selection.getSelection(),
      badgeConfig: props.badgeConfig
      // This is based on the definition of items
      // groups: [
      //   { key: 'todo', name: 'To do', startIndex: 0, count: 2 },
      //   { key: 'done', name: 'Done', startIndex: 2, count: 0, isCollapsed: true },
      // ],
      // showItemIndexInView: false,
      // isCompactMode: false,
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
    const { items, isCompactMode, selectedItems } = this.state;
    const buttonStyles: Partial<IButtonStyles> = {
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
        <div style={{ display: "flex", padding: "10px 10px 0 10px" }}>
          <h3>Tasks</h3>
          <div style={{ marginLeft: "auto" }}>
            <IconButton iconProps={{ iconName: 'Add' }} title="Add" ariaLabel="Add" styles={buttonStyles} onClick={this._handleAddOnClick} />
            <IconButton iconProps={{ iconName: 'AllApps' }} title="Show all" ariaLabel="AllApps" styles={buttonStyles} onClick={this._onShowAllClick} />
          </div>
        </div>
        <DetailsList
          componentRef={this._root}
          setKey={"set"} // This is required to keep selection, but document lacks on why and it appears to be a known issue: https://github.com/microsoft/fluentui/issues/7817
          getKey={(task: ITaskItem) => task.key}
          items={items().filter(i => i.isActive || (!i.isActive && this.state.showInactive))}
          columns={this._columns}
          ariaLabelForSelectAllCheckbox="Toggle selection for all items"
          ariaLabelForSelectionColumn="Toggle selection"
          checkButtonAriaLabel="Mark this item as done"
          onRenderDetailsHeader={this._onRenderDetailsHeader}
          isHeaderVisible={false}
          checkboxVisibility={CheckboxVisibility.always}
          onRenderItemColumn={this._onRenderColumn}
          onRenderRow={this._onRenderRow}
          onRenderCheckbox={this._onRenderCheckbox}
          onActiveItemChanged={this._onActiveItemChanged}
          selection={this._selection}
          selectionPreservedOnEmptyClick={true}
          compact={isCompactMode}
          selectionMode={SelectionMode.multiple}
        />
      </div>
    );
  }

  private _onActiveItemChanged(item?: any, index?: number | undefined) {
    // console.log("active item changed");
    // console.log(item);
  }

  private _handleAddOnClick() {

    // Get page context to pass in to quick create
    // NOTE: There appear to be a mismatch between EntityReference referred in context object and what's defined in XrmDefinitelyTyped. Interestingly only the latter works.
    const pageContext = (this.props.context as any).mode.contextInfo;
    const entityRef = {
      id: pageContext.entityId,
      name: pageContext.entityRecordName,
      entityType: pageContext.entityTypeName
    };

    this.props.context?.navigation.openForm({
      entityName: "task",
      useQuickCreateForm: true,
      createFromEntity: entityRef
    }, undefined)
      .then(
        task => {
          this._context?.factory.requestRender();
        },
        rejected => {
          console.error(rejected);
        }
      );
  }

  private _onShowAllClick() {
    this.setState({ showInactive: !this.state.showInactive });
  }

  private _onRenderRow: IDetailsListProps['onRenderRow'] = props => {

    // Skip of it's an inactive record and showInactive mode is not enabled
    //if(!props?.item?.isActive && !this.state.showInactive) return null;

    const customStyles: Partial<IDetailsRowStyles> = {
      root: { alignItems: "center" }
    };
    if (props) {
      return <DetailsRow {...props} styles={customStyles} rowFieldsAs={this.renderRowFields} />;
    }
    return null;
  };

  private renderRowFields(props: IDetailsRowFieldsProps) {
    return (
      // BUG: Not perfect here, there seems to be a single pixel that allows selection
      <span data-selection-disabled={true}>
        <DetailsRowFields {...props} />
      </span>
    );
  }
  _onRenderCheckbox(props?: IDetailsListCheckboxProps) {
    return (
      <div style={{ pointerEvents: 'none' }}>
        <Checkbox checked={props?.checked} />
      </div>
    );
  }

  private _onRenderDetailsHeader(props?: IDetailsHeaderProps, _defaultRender?: IRenderFunction<IDetailsHeaderProps>) {
    return <DetailsHeader {...(props ?? { columns: undefined, selection: undefined, selectMode: undefined, layoutMode: DetailsListLayoutMode.fixedColumns })} ariaLabelForToggleAllGroupsButton={'Expand collapse groups'} />;
  }

  private _onRenderColumn(item?: ITaskItem, index?: number, column?: IColumn) {

    const value =
      item && column?.fieldName ? item[column.fieldName as keyof ITaskItem] || '' : '';
    const buttonStyles: Partial<IButtonStyles> = {
      icon: {
        color: SharedColors.red10
      }
    };

      return <div className="task-wrapper">
        <div className="task-content">
          <span className="task-title">{item?.subject}</span>
          {this.props.badgeConfig?.map((badgeConfigItem) => {
            // Cast as any to access property value from variable name which represent the attribute name
            const optionKey = (item as any)[badgeConfigItem.name];
            const optionMetadata = badgeConfigItem.values?.find(v => v.key == optionKey);

            // If the value was not mapped in the configuration, don't do anything with it.
            if (optionMetadata) {
              return <span className="badge" style={{ backgroundColor: optionMetadata.color ?? "gray" }}>{optionMetadata?.label}</span>
            }
          })}
          <div className="task-description">{item?.description}</div>
        </div>
        <div className="task-action"><IconButton iconProps={{ iconName: 'Delete' }} title="Delete" ariaLabel="Delete" styles={buttonStyles} onClick={() => this.handleDeleteTask(item?.key)} /></div>
      </div>;
  }

  private handleDeleteTask = (taskid?: string): void => {

    if (taskid) {
      this._context.webAPI.updateRecord("task", taskid, { statecode: 2, statuscode: 6 })
        .then(r => {
          // Clone array, update deleted item to inactive then update state which will re-render.
          const clonedItems = [...this.state.items()];
          const task = clonedItems.find(i => i.key === taskid);
          if (task) {
            task.isActive = false;
          }
          this.setState({ items: () => clonedItems });
        })
        .catch(ex => console.error(ex));
    }
  }


  private _onShowItemIndexInViewChanged = (event: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    this.setState({ showItemIndexInView: checked ?? false });
  };

  private _onChangeCompactMode = (ev?: React.MouseEvent<HTMLElement>, checked?: boolean): void => {
    this.setState({ isCompactMode: checked ?? false });
  };
}


