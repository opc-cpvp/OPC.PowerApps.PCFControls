import React = require("react");
import {
  DetailsHeader,
  DetailsList,
  IColumn,
  IDetailsHeaderProps,
  IDetailsList,
  IRenderFunction,
  IButtonStyles,
  DetailsListLayoutMode,
  CheckboxVisibility,
  Checkbox,
  DetailsRow,
  SelectionMode,
  DetailsRowFields,
  IDetailsRowFieldsProps,
  Selection,
  IDetailsListCheckboxProps,
  IObjectWithKey,
  IDetailsRowProps,
} from 'office-ui-fabric-react';
import { initializeIcons } from '@uifabric/icons';
import { IconButton } from '@fluentui/react/lib/Button';
import { SharedColors } from '@fluentui/theme';
import { IInputs } from "./generated/ManifestTypes";
import { ITaskManagerBadgeConfigurationItem } from "./ITaskManagerBadgeConfigurationItem";
import EntityReference = ComponentFramework.EntityReference;
initializeIcons();
export interface ITaskItem {
  key: string;
  subject: string;
  description: string;
  statuscode: string;
  isActive: boolean;
  [additionalPropertyName: string] : string | Date | number | number[] | boolean | EntityReference | EntityReference[];
}

export interface ITaskManagerProps {
  getTasks: () => ITaskItem[];
  badgeConfig: ITaskManagerBadgeConfigurationItem[];
  context: ComponentFramework.Context<IInputs>;
}

export interface ITaskManagerState extends React.ComponentState, ITaskManagerProps {
  selectedItems: IObjectWithKey[];
  showInactive: boolean;
}

export class TaskManager extends React.Component<ITaskManagerProps, ITaskManagerState>{
  private _root = React.createRef<IDetailsList>();
  private _columns: IColumn[];
  private _context: ComponentFramework.Context<IInputs>;
  private _selection: Selection;

  constructor(props: ITaskManagerProps) {
    super(props);

    // Enable 'this' reference for handlers registered in this method
    this.bindThis();

    this._context = props.context;
    this._selection = new Selection({
      onSelectionChanged: this.handleOnSelectionChanged
    });

    this.state = {
      getTasks: props.getTasks,
      context: props.context,
      showInactive: false,
      selectedItems: this._selection.getSelection(),
      badgeConfig: props.badgeConfig
    };

    // Define columns
    this._columns = [{
        key: 'name',
        name: 'Name', // TODO: i18n
        fieldName: 'name',
        minWidth: 100,
        isResizable: true
    }];
  }

  private bindThis(){
    this.handleRenderColumn = this.handleRenderColumn.bind(this);
    this.handleShowAllClick = this.handleShowAllClick.bind(this);
    this.handleAddOnClick = this.handleAddOnClick.bind(this);
    this.handleDeleteTask = this.handleDeleteTask.bind(this);
    this.handleRenderRow = this.handleRenderRow.bind(this);
  }

  public render() {
    const buttonStyles: Partial<IButtonStyles> = {
      icon: {
        color: SharedColors.gray40
      }
    };

    return (
      <div>
        <div style={{ display: "flex", padding: "10px 10px 0 10px" }}>
          <h3>Tasks</h3>
          <div style={{ marginLeft: "auto" }}>
            <IconButton iconProps={{ iconName: 'Add' }} title={this._context.resources.getString("label_addtask")} ariaLabel={this._context.resources.getString("label_addtask")} styles={buttonStyles} onClick={this.handleAddOnClick} />
            <IconButton iconProps={{ iconName: 'AllApps' }} title={this._context.resources.getString("label_toggletaskvisibility")} ariaLabel={this._context.resources.getString("label_toggletaskvisibility")} styles={buttonStyles} onClick={this.handleShowAllClick} />
          </div>
        </div>
        <DetailsList
          componentRef={this._root}
          setKey={"set"} // This is required to keep selection, but documentation lacks on why and it appears to be a known issue: https://github.com/microsoft/fluentui/issues/7817
          getKey={(task: ITaskItem) => task.key}
          items={this.state.getTasks().filter(i => i.isActive || (!i.isActive && this.state.showInactive))}
          columns={this._columns}
          //ariaLabelForSelectAllCheckbox="Toggle selection for all items"
          ariaLabelForSelectionColumn={this._context.resources.getString("label_toggletaskcompleted")}
          checkButtonAriaLabel={this._context.resources.getString("label_toggletaskcompleted")}
          onRenderDetailsHeader={this.handleRenderDetailsHeader}
          isHeaderVisible={false}
          checkboxVisibility={CheckboxVisibility.always}
          onRenderItemColumn={this.handleRenderColumn}
          onRenderRow={this.handleRenderRow}
          onRenderCheckbox={this.handlerRenderCheckbox}
          selection={this._selection}
          selectionPreservedOnEmptyClick={true}
          selectionMode={SelectionMode.multiple}
        />
      </div>
    );
  }

private handleOnSelectionChanged(){

    // Isolate checked and unchecked item delta between state and current UI
    const currentSelection = this._selection.getSelection();
    const checked = currentSelection.filter(t => !this.state.selectedItems.find(s => s.key === t.key));
    const unchecked = this.state.selectedItems.filter(t => !currentSelection.find(s => s.key === t.key));
    // this.setState((prevState, props) => {
    //   return { count: prevState.count + 1 }
    // });
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

  private handleAddOnClick() {

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

  private handleShowAllClick() {
    // this.setState((prevState, props) => {
    //   return { count: prevState.count + 1 }
    // });
    this.setState({ showInactive: !this.state.showInactive });
  }

  private handleRenderRow(props?: IDetailsRowProps) {
      return props ? <DetailsRow {...props} styles={{root: {alignItems: "center"}}} rowFieldsAs={this.handleRenderRowFields} /> : null;
  };

  private handleRenderRowFields(props: IDetailsRowFieldsProps) {
    return (
      // BUG: Not perfect here, there seems to be a single pixel that allows selection
      <span data-selection-disabled={true}>
        <DetailsRowFields {...props} />
      </span>
    );
  }

  private handlerRenderCheckbox(props?: IDetailsListCheckboxProps) {
    return (
      <div style={{ pointerEvents: 'none' }}>
        <Checkbox checked={props?.checked} />
      </div>
    );
  }

  private handleRenderDetailsHeader(props?: IDetailsHeaderProps, _defaultRender?: IRenderFunction<IDetailsHeaderProps>) {
    return <DetailsHeader {...(props ?? { columns: undefined, selection: undefined, selectMode: undefined, layoutMode: DetailsListLayoutMode.fixedColumns })} ariaLabelForToggleAllGroupsButton={'Expand collapse groups'} />;
  }

  private handleRenderColumn(item?: ITaskItem, index?: number, column?: IColumn) {
      return <div className="task-wrapper">
        <div className="task-content">
          <span className="task-title">{item?.subject}</span>
          {this.props.badgeConfig?.map((badgeConfigItem) => {
            // Cast as any to access property value from variable name which represent the attribute name
            const optionKey = (item as any)[badgeConfigItem.name];
            const optionMetadata = badgeConfigItem.values?.find(v => v.key == optionKey);

            // This transforms all badge configurations into <span> elements if the current value matches something in the configuration.
            // If the value was not mapped in the configuration, don't do anything with it.
            if (optionMetadata) {
              return <span className="badge" style={{ backgroundColor: optionMetadata.color ?? "gray" }} key={item?.key+"badge"+optionMetadata.label}>{optionMetadata.label}</span>
            }
          })}
          <div className="task-description">{item?.description}</div>
        </div>
        <div className="task-action">
          <IconButton iconProps={{ iconName: 'Delete' }} title={this._context.resources.getString("label_canceltask")} ariaLabel={this._context.resources.getString("label_canceltask")} styles={{icon:{color: SharedColors.red10}}} onClick={() => this.handleDeleteTask(item?.key)} />
        </div>
      </div>;
  }

  private handleDeleteTask(taskid?: string) {
    if (taskid) {
      this._context.webAPI.updateRecord("task", taskid, { statecode: 2, statuscode: 6 })
        .then(r => {
          // Clone array, update deleted item to inactive then update state which will re-render.
          const clonedItems = [...this.state.getTasks()];
          const task = clonedItems.find(i => i.key === taskid);
          if (task) {
            task.isActive = false;
          }
          // this.setState((prevState, props) => {
          //   return { count: prevState.count + 1 }
          // });
          this.setState({ getTasks: () => clonedItems });
        })
        .catch(ex => console.error(ex));
    }
  }
}


