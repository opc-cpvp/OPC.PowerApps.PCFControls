export interface ITaskManagerBadgeConfigurationItem {
    name: string;
    keys: number[];
    values?: IOptionSetMetadata[]
}

export interface IOptionSetMetadata{
    key: number;
    label:string;
    color: string;
}