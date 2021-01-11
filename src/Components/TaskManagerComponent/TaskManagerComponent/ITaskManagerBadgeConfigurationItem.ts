export interface ITaskManagerBadgeConfigurationItem {
    name: string;
    keys: number[];
    values?: IOptionSetConfiguration[]
}

export interface IOptionSetConfiguration{
    key: number;
    label:string;
    color: string;
}
