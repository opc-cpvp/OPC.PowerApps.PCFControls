import { IOptionSetConfiguration } from "./IOptionSetConfiguration";

export interface ITaskManagerBadgeConfigurationItem {
    name: string;
    keys: number[];
    values?: IOptionSetConfiguration[]
}