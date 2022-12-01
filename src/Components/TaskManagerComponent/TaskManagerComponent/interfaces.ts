import { IObjectWithKey } from "office-ui-fabric-react";
import { IInputs } from "./generated/ManifestTypes";

export interface IOptionSetConfiguration {
    key: number;
    label: string;
    color: string;
}

export interface ITaskManagerBadgeConfigurationItem {
    name: string;
    keys: number[];
    values?: IOptionSetConfiguration[];
}

export interface ITaskItem {
    [additionalPropertyName: string]:
        | string
        | number
        | boolean
        | number[]
        | Date
        | ComponentFramework.EntityReference
        | ComponentFramework.EntityReference[]
        | ComponentFramework.LookupValue
        | ComponentFramework.LookupValue[];
    key: string;
    subject: string;
    description: string;
    statuscode: number;
    isActive: boolean;
}

export interface ITaskManagerProps {
    tasks: ITaskItem[];
    panelTitle: string;
    badgeConfig: ITaskManagerBadgeConfigurationItem[];
    context: ComponentFramework.Context<IInputs>;
}

export interface ITaskManagerState extends React.ComponentState {
    tasks: ITaskItem[];
    selectedItems: IObjectWithKey[];
    showInactive: boolean;
}
