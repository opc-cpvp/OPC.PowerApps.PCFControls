import { IObjectWithKey } from "office-ui-fabric-react";
import { IInputs } from "./generated/ManifestTypes";
import EntityReference = ComponentFramework.EntityReference;

export interface IOptionSetConfiguration {
    key: number;
    label: string;
    color: string;
}

export interface ITaskManagerBadgeConfigurationItem {
    name: string;
    keys: number[];
    values?: IOptionSetConfiguration[]
}

export interface ITaskItem {
    key: string;
    subject: string;
    description: string;
    statuscode: number;
    isActive: boolean;
    [additionalPropertyName: string]: string | Date | number | number[] | boolean | EntityReference | EntityReference[];
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