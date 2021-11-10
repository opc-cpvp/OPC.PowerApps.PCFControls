import * as React from "react";
import * as ReactDOM from "react-dom";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { TaskManager } from "./TaskManager";
import { WebApi } from "./WebApi";
import { Utils } from "./Utils";
import { ITaskItem, ITaskManagerBadgeConfigurationItem, ITaskManagerProps } from "./interfaces";

export class TaskManagerComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    public container: HTMLDivElement;
    private _props: ITaskManagerProps;

    /**
     * Empty constructor.
     */
    constructor() {}

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     *
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        // Add control initialization code
        this.container = container;
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     *
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public async updateView(context: ComponentFramework.Context<IInputs>): Promise<void> {
        this._props = {
            tasks: this.mapTasks(context.parameters.tasks),
            panelTitle: Utils.extractMultilingualText(context.parameters.panelTitle.raw || "", context.userSettings.languageId),
            context: context,
            badgeConfig: await this.loadBadgeConfiguration(context)
        };

        ReactDOM.render(React.createElement(TaskManager, this._props), this.container);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     *
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

    private async loadBadgeConfiguration(context: ComponentFramework.Context<IInputs>): Promise<ITaskManagerBadgeConfigurationItem[]> {
        // Load badge configuration if present
        let parsedBadgeConfig: ITaskManagerBadgeConfigurationItem[];
        try {
            parsedBadgeConfig = JSON.parse(context.parameters.badgeConfig.raw ?? "");
        } catch (e) {
            parsedBadgeConfig = [];
            console.error("The badge configuration does not appear to be properly formatted.\n", e);
        }

        const clientUrl = (context as any).page.getClientUrl();
        const webapi = new WebApi(context.webAPI, clientUrl as string);

        for (const badgeConfigItem of parsedBadgeConfig) {
            try {
                // Retrieve metadata for the given attribute/column
                const response = await webapi.retrieveOptionSetMetadata("task", badgeConfigItem.name);
                const jsonResponse = await response.json();

                // Only exctract the metadata of the options that are in the config then convert it to a BadgeConfigurationItem
                badgeConfigItem.values = jsonResponse.OptionSet.Options.filter((opt: { Value: number }) =>
                    badgeConfigItem.keys.includes(opt.Value)
                ).map((optBadge: { Value: any; Label: { UserLocalizedLabel: { Label: any } }; Color: any }) => ({
                    key: optBadge.Value,
                    label: optBadge.Label.UserLocalizedLabel.Label,
                    color: optBadge.Color
                }));
            } catch (e) {
                console.error("Error occured while loading the badge configuration.", e);
            }
        }

        return parsedBadgeConfig;
    }

    private mapTasks(dataset: ComponentFramework.PropertyTypes.DataSet): ITaskItem[] {
        // Throw an exception if the mandatory columns are not in the selected view.
        if (
            !dataset.columns.find(c => c.name === "statecode") ||
            !dataset.columns.find(c => c.name === "subject") ||
            !dataset.columns.find(c => c.name === "description") ||
            !dataset.columns.find(c => c.name === "statuscode")
        ) {
            throw new Error("All the mandatory columns are not available in the view: statecode, statuscode, subject, description.");
        }

        // Return an empty array if there is nothing in the resultset
        if (!dataset.records) {
            return [];
        }

        const tasks: ITaskItem[] = [];
        try {
            let task: ITaskItem;
            for (const taskId of dataset.sortedRecordIds) {
                // Map main properties
                task = {
                    key: dataset.records[taskId].getRecordId(),
                    isActive: dataset.records[taskId].getValue("statecode") === 0 ? true : false,
                    subject: dataset.records[taskId].getValue("subject") as string,
                    description: dataset.records[taskId].getValue("description") as string,
                    statuscode: dataset.records[taskId].getValue("statuscode") as number
                };

                // Map any additional column as indexed properties
                for (const col of dataset.columns) {
                    task[col.name] = dataset.records[taskId].getValue(col.name);
                }
                tasks.push(task);
            }
        } catch (e) {
            console.error(e);
        }
        return tasks;
    }
}
