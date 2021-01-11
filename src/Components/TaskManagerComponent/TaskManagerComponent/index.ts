import React = require("react");
import ReactDOM = require("react-dom");
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import DataSetInterfaces = ComponentFramework.PropertyHelper.DataSetApi;
type DataSet = ComponentFramework.PropertyTypes.DataSet;
import { ITaskItem, ITaskManagerProps, TaskManager } from "./TaskManager";
import { ITaskManagerBadgeConfigurationItem } from "./ITaskManagerBadgeConfigurationItem";
import { WebApi } from "./WebApi";

export class TaskManagerComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	public container: HTMLDivElement;
	private _props: ITaskManagerProps;

	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement) {
		// Add control initialization code
		this.container = container;
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {

		// Load badge configuration if present
		let parsedBadgeConfig: ITaskManagerBadgeConfigurationItem[];
		try {
			parsedBadgeConfig = JSON.parse(context.parameters.badgeConfig.raw ?? "");
		} catch (e) {
			parsedBadgeConfig = [];
			console.error("The badge configuration does not appear to be properly formatted.\n", e);
		}

		for (let badgeConfigItem of parsedBadgeConfig) {
			try {
				const clientUrl = (<any>context).page.getClientUrl();
				const webapi = new WebApi(context.webAPI, clientUrl);
				webapi.retrieveOptionSetMetadata("task", badgeConfigItem.name)
					.then(x => {
						x.json().then(y => {
							const badgeConfig = parsedBadgeConfig?.find(cfg => cfg.name === badgeConfigItem.name);
							if (badgeConfig !== undefined) {
								badgeConfig.values = y.OptionSet.Options.filter((opt: { Value: number; }) => badgeConfig?.keys.includes(opt.Value)).map((optBadge: {
									Value: any;
									Label: { UserLocalizedLabel: { Label: any; }; };
									Color: any;
								}) => {
									return { key: optBadge.Value, label: optBadge.Label.UserLocalizedLabel.Label, color: optBadge.Color }
								});
							}
						})
					});
			} catch (e) { console.error(e); }
		}

		this._props = {
			getTasks: () => this.mapTasks(context.parameters.tasks),
			context: context,
			badgeConfig: parsedBadgeConfig
		}

		ReactDOM.render(
			React.createElement(
				TaskManager,
				this._props
			),
			this.container
		);
	}

	private mapTasks(dataset: ComponentFramework.PropertyTypes.DataSet): ITaskItem[] {

		if (!dataset.records) return [];

		const tasks: ITaskItem[] = [];
		try {
			for (let taskId of dataset.sortedRecordIds) {
				let task = {
					key: dataset.records[taskId].getRecordId(),
					isActive: dataset.records[taskId].getValue("statecode") == 0 ? true : false,
					subject: dataset.records[taskId].getValue("subject") as string,
					description: dataset.records[taskId].getValue("description") as string,
					statuscode: dataset.records[taskId].getValue("statuscode") as string
				}

				for (let col of dataset.columns) {
					(task as any)[col.name] = dataset.records[taskId].getValue(col.name);
				}
				tasks.push(task);
			}
		} catch (e) {
			console.error(e);
		}
		return tasks;
	}

	/**
	 * It is called by the framework prior to a control receiving new data.
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {};
	}

	/**
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Add code to cleanup control if necessary
	}

}