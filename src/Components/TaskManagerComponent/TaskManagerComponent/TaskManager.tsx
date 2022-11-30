import * as React from "react";
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
    IDetailsRowProps
} from "office-ui-fabric-react";
import { initializeIcons } from "@uifabric/icons";
import { IconButton } from "@fluentui/react/lib/Button";
import { SharedColors } from "@fluentui/theme";
import { IInputs } from "./generated/ManifestTypes";
import { ITaskItem, ITaskManagerProps, ITaskManagerState } from "./interfaces";
import { TaskStatus } from "./enums";
initializeIcons();

export class TaskManager extends React.Component<ITaskManagerProps, ITaskManagerState> {
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
            onSelectionChanged: () => this.handleOnSelectionChanged()
        });

        this.state = {
            tasks: props.tasks,
            selectedItems: this._selection.getSelection(),
            showInactive: false
        };

        // Define columns
        this._columns = [
            {
                key: "name",
                name: this._context.resources.getString("label_name"),
                fieldName: "name",
                minWidth: 100,
                isResizable: true
            }
        ];
    }

    public componentDidUpdate(prevProps: ITaskManagerProps): void {
        // If props are different it means changes are not tracked in the state
        if (this.props.tasks !== prevProps.tasks) {
            this.setState((prevState, newProps) => ({ tasks: newProps.tasks, selectedItems: [] }));
        }
    }

    public render(): JSX.Element {
        const buttonStyles: Partial<IButtonStyles> = {
            icon: {
                color: SharedColors.gray40
            }
        };

        return (
            <div>
                <div style={{ display: "flex", padding: "10px 10px 0 10px" }}>
                    <h3>{this.props.panelTitle}</h3>
                    <div style={{ marginLeft: "auto" }}>
                        <IconButton
                            iconProps={{ iconName: "Add" }}
                            title={this._context.resources.getString("label_addtask")}
                            ariaLabel={this._context.resources.getString("label_addtask")}
                            styles={buttonStyles}
                            onClick={() => this.handleAddOnClick()}
                        />
                        <IconButton
                            iconProps={{ iconName: "AllApps" }}
                            title={this._context.resources.getString("label_toggletaskvisibility")}
                            ariaLabel={this._context.resources.getString("label_toggletaskvisibility")}
                            styles={buttonStyles}
                            onClick={() => this.handleShowAllClick()}
                        />
                    </div>
                </div>
                <DetailsList
                    componentRef={this._root}
                    setKey={"set"} // This is required to keep selection, but documentation lacks on why and it appears to be a known issue: https://github.com/microsoft/fluentui/issues/7817
                    getKey={(task: ITaskItem) => task.key}
                    items={this.state.tasks.filter(i => i.isActive || (!i.isActive && this.state.showInactive))}
                    columns={this._columns}
                    ariaLabelForSelectionColumn={this._context.resources.getString("label_toggletaskcompleted")}
                    checkButtonAriaLabel={this._context.resources.getString("label_toggletaskcompleted")}
                    onRenderDetailsHeader={(props, defaultrender) => this.handleRenderDetailsHeader(props, defaultrender)}
                    isHeaderVisible={false}
                    checkboxVisibility={CheckboxVisibility.always}
                    onRenderItemColumn={(item: ITaskItem, index, column) => this.handleRenderColumn(item, index, column)}
                    onRenderRow={props => this.handleRenderRow(props)}
                    onRenderCheckbox={props => this.handleRenderCheckbox(props)}
                    selection={this._selection}
                    selectionPreservedOnEmptyClick={true}
                    selectionMode={SelectionMode.multiple}
                />
            </div>
        );
    }

    private bindThis() {
        this.handleRenderColumn = this.handleRenderColumn.bind(this);
        this.handleShowAllClick = this.handleShowAllClick.bind(this);
        this.handleAddOnClick = this.handleAddOnClick.bind(this);
        this.handleDeleteTask = this.handleDeleteTask.bind(this);
        this.handleRenderRow = this.handleRenderRow.bind(this);
        this.handleOnSelectionChanged = this.handleOnSelectionChanged.bind(this);
    }

    private handleOnSelectionChanged(): void {
        try {
            // Isolate checked and unchecked item delta between state and current UI
            const currentSelection = this._selection.getSelection();
            const checked = currentSelection.filter(t => !this.state.selectedItems.find(s => s.key === t.key));
            const unchecked = this.state.selectedItems.filter(t => !currentSelection.find(s => s.key === t.key));

            this.setState((prevState, props) => ({ selectedItems: this._selection.getSelection() }));

            if (checked.length > 0) {
                this._context.webAPI
                    .updateRecord("task", checked[0].key as string, { statecode: 1, statuscode: TaskStatus.Completed })
                    .catch(ex => console.error(ex));
            } else if (unchecked.length > 0) {
                this._context.webAPI
                    .updateRecord("task", unchecked[0].key as string, { statecode: 0, statuscode: TaskStatus.InProgress })
                    .catch(ex => console.error(ex));
            }
        } catch (e) {
            console.error(e);
        }
    }

    private handleAddOnClick(): void {
        // Get page context to pass in to quick create
        // NOTE: There appear to be a mismatch between EntityReference referred in context object and what's defined in XrmDefinitelyTyped. Interestingly only the latter works.
        const pageContext = (this.props.context as any).mode.contextInfo;
        const entityRef = {
            id: pageContext.entityId,
            name: pageContext.entityRecordName,
            entityType: pageContext.entityTypeName
        };

        this.props.context?.navigation
            .openForm(
                {
                    entityName: "task",
                    useQuickCreateForm: true,
                    createFromEntity: entityRef
                },
                undefined
            )
            .then(
                taskRef => {
                    // Component should magically refresh
                },
                rejected => {
                    console.error(rejected);
                }
            );
    }

    private handleShowAllClick(): void {
        this.setState((prevState, props) => ({ showInactive: !prevState.showInactive }));
    }

    private handleRenderRow(props?: IDetailsRowProps) {
        // If rendering an inactive task do not show checkbox
        if (props && !(props.item as ITaskItem).isActive) {
            props.checkboxVisibility = CheckboxVisibility.hidden;
            return (
                <DetailsRow
                    data-selection-disabled={true}
                    {...props}
                    styles={{ root: { alignItems: "center" } }}
                    rowFieldsAs={(fieldProps: IDetailsRowFieldsProps) => this.handleRenderRowFields(fieldProps)}
                />
            );
        }
        return props ? (
            <DetailsRow
                {...props}
                styles={{ root: { alignItems: "center" } }}
                rowFieldsAs={(fieldProps: IDetailsRowFieldsProps) => this.handleRenderRowFields(fieldProps)}
            />
        ) : null;
    }

    private handleRenderRowFields(props: IDetailsRowFieldsProps): JSX.Element {
        return (
            // BUG: Not perfect here, there seems to be a single pixel that allows selection
            <span data-selection-disabled={true}>
                <DetailsRowFields {...props} />
            </span>
        );
    }

    private handleRenderCheckbox(props?: IDetailsListCheckboxProps): JSX.Element {
        return (
            <div style={{ pointerEvents: "none" }}>
                <Checkbox checked={props?.checked} />
            </div>
        );
    }

    private handleRenderDetailsHeader(props?: IDetailsHeaderProps, _defaultRender?: IRenderFunction<IDetailsHeaderProps>): JSX.Element {
        return (
            <DetailsHeader
                {...(props ?? {
                    columns: undefined,
                    selection: undefined,
                    selectMode: undefined,
                    layoutMode: DetailsListLayoutMode.fixedColumns
                })}
                ariaLabelForToggleAllGroupsButton={"Expand collapse groups"}
            />
        );
    }

    private handleRenderColumn(item?: ITaskItem, index?: number, column?: IColumn): JSX.Element {
        return (
            <div className="task-wrapper" onDoubleClick={() => this.handleRowDoubleClick(item)}>
                <div className="task-content">
                    <span className="task-title">{item?.subject}</span>
                    {this.props.badgeConfig?.map(badgeConfigItem => {
                        const optionKey = item ? item[badgeConfigItem.name] : null;
                        // Strictly equal is not used here for user convenience and because there seems to be an issue fetching optionset value which are returned as string from the library fetching the data.
                        /* eslint-disable eqeqeq */
                        const optionMetadata = badgeConfigItem.values?.find(v => v.key == optionKey);
                        /* eslint-enable eqeqeq */

                        // This transforms all badge configurations into <span> elements if the current value matches something in the configuration.
                        // If the value was not mapped in the configuration, don't do anything with it.
                        if (optionMetadata) {
                            return (
                                <span
                                    className="badge"
                                    style={{ backgroundColor: optionMetadata.color ?? "gray" }}
                                    key={(item?.key as string) + "badge" + optionMetadata.label}
                                >
                                    {optionMetadata.label}
                                </span>
                            );
                        }
                    })}
                    <div className="task-description">{item?.description}</div>
                </div>
                <div className="task-action">
                    {item?.isActive && (
                        <IconButton
                            iconProps={{ iconName: "Delete" }}
                            title={this._context.resources.getString("label_canceltask")}
                            ariaLabel={this._context.resources.getString("label_canceltask")}
                            styles={{ icon: { color: SharedColors.red10 } }}
                            onClick={() => this.handleDeleteTask(item?.key)}
                        />
                    )}
                </div>
            </div>
        );
        // TODO: RemoveFromTrash (Un-delete task)
    }

    private handleRowDoubleClick(item: ITaskItem | undefined): React.MouseEventHandler<HTMLDivElement> | undefined {
        if (!item) {
            return;
        }

        this.props.context?.navigation
            .navigateTo(
                { pageType: "entityrecord", entityName: "task", entityId: item.key },
                {
                    target: 2,
                    position: 2,
                    width: { value: 25, unit: "%" }
                }
            )
            .then(() => {
                console.log("opened");
            })
            .catch((error: any) => console.error(error));
        return undefined;
    }

    private handleDeleteTask(taskid?: string): void {
        if (taskid) {
            this._context.webAPI
                .updateRecord("task", taskid, { statecode: 2, statuscode: TaskStatus.Canceled })
                .then(r => {
                    this.setState((prevState, props) => {
                        // Clone array, update deleted item to inactive then update state which will re-render.
                        const clonedItems = [...prevState.tasks];
                        const task = clonedItems.find(i => i.key === taskid);
                        if (task) {
                            task.isActive = false;
                            task.statuscode = TaskStatus.Canceled;
                        }
                        return { tasks: clonedItems };
                    });
                })
                .catch(ex => console.error(ex));
        }
    }
}
