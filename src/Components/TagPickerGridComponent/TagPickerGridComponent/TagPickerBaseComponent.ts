import * as React from "react";
import * as ReactDOM from "react-dom";
import { ITag } from "office-ui-fabric-react/lib/Pickers";
import { TagPickerBase, ITagPickerProps } from "./TagPicker";
import { EntityMetadataProperties } from "./EntityMetadataProperties";
import { IWebApi, WebApi } from "./WebApi";
import { Languages } from "./Languages";

export abstract class TagPickerBaseComponent<TInputs, TOutputs> implements ComponentFramework.StandardControl<TInputs, TOutputs> {
    /**
     * Parameters passed to the control via CDS.
     */
    public labelText: string;
    public relatedEntity: string;
    public relationshipEntity: string;
    public relationshipName: string;

    /**
     * Extra Filtering and Rules can be created through a view and be used when searching
     */
    public viewId: string;

    /**
     * Selected items cache.
     */
    public selectedItems: ITag[];

    public container: HTMLDivElement;

    /**
     * General PCF properties.
     */
    private context: ComponentFramework.Context<TInputs>;
    private notifyOutputChanged: () => void;

    /**
     * WebApi reference
     */
    private webAPI: IWebApi;

    /**
     * Properties related to the current entity.
     */
    private entityId: string;
    private entityType: string;

    /**
     * Entity metadata.
     */
    private entityMetadata: ComponentFramework.PropertyHelper.EntityMetadata;
    private relatedEntityMetadata: ComponentFramework.PropertyHelper.EntityMetadata;

    /**
     * React component properties.
     */
    private props: ITagPickerProps = {
        labels: {},
        onChange: this.onChange.bind(this),
        onEmptyInputFocus: this.onEmptyInputFocus.bind(this),
        onResolveSuggestions: this.onResolveSuggestions.bind(this)
    };

    constructor() {}

    /**
     * Helper methods used to access common metadata properties.
     */
    private get idAttribute(): string {
        return this.relatedEntityMetadata ? (this.relatedEntityMetadata[EntityMetadataProperties.PrimaryIdAttribute] as string) : "";
    }
    private get nameAttribute(): string {
        return this.relatedEntityMetadata ? (this.relatedEntityMetadata[EntityMetadataProperties.PrimaryNameAttribute] as string) : "";
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     *
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If control is marked control-type='standard', it receives an empty div element within which it can render its content.
     */
    async init(
        context: ComponentFramework.Context<TInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): Promise<void> {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = container;

        const clientUrl = (this.context as any).page.getClientUrl() as string;
        this.webAPI = new WebApi(this.context.webAPI, clientUrl);

        this.entityId = (this.context as any).page.entityId as string;
        this.entityType = (this.context as any).page.entityTypeName as string;

        this.props.labels = {
            input: this.context.resources.getString("tagPicker"),
            noResultsFound: this.context.resources.getString("noResultsFound"),
            removeButton: this.context.resources.getString("remove")
        };

        this.props.labelText = this.getLabelText();

        await this.loadMetadata()
            .then(() => this.getRelatedEntities())
            .then(entities => this.getTags(entities))
            .then(tags => {
                this.props.selectedItems = this.selectedItems = tags;
                this.updateView(context);
            });
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     *
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    updateView(context: ComponentFramework.Context<TInputs>): void {
        ReactDOM.render(React.createElement(TagPickerBase, this.props), this.container);
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. canceling any pending remote calls, removing listeners, etc.
     */
    destroy(): void {
        ReactDOM.unmountComponentAtNode(this.container);
    }

    /**
     * Retrieves the label based on the current language.
     * Accepts the following formats:
     * - Label
     * - en=Label|fr=Étiquette
     */
    private getLabelText(): string {
        if (this.labelText.indexOf("|") === -1) {
            return this.labelText;
        }

        // load the translations from the label
        const translations = new Map<Languages, string>();
        for (const translation of this.labelText.split("|")) {
            const values: string[] = translation.split("=");

            // check if the string is formatted correctly
            if (values.length !== 2) {
                continue;
            }

            const language: Languages = (Languages as any)[values[0]];

            // check if the language is supported
            if (language === undefined) {
                continue;
            }

            const label: string = values[1];
            translations.set(language, label);
        }

        const languageId: number = this.context.userSettings.languageId;
        const userLanguage: Languages = (Languages as any)[languageId];

        // check if the user language is supported, otherwise default to English
        const labelLanguage: number = userLanguage ? languageId : Languages.en;

        return translations.get(labelLanguage) ?? "";
    }

    /**
     * Used to load the metadata for to the entity and related entity.
     */
    private loadMetadata(): Promise<ComponentFramework.PropertyHelper.EntityMetadata[]> {
        return Promise.all([
            this.context.utils.getEntityMetadata(this.entityType).then(value => (this.entityMetadata = value)),
            this.context.utils.getEntityMetadata(this.relatedEntity).then(value => (this.relatedEntityMetadata = value))
        ]);
    }

    /**
     * Used to get the relationship entities linked to the current record.
     */
    private getRelatedEntities(): Promise<ComponentFramework.WebApi.Entity[]> {
        const options = `?$filter=${this.entityType}id eq ${this.entityId}`;
        return this.webAPI.retrieveMultipleRecords(this.relationshipEntity, options).then(results => results.entities);
    }

    /**
     * Used to get the tags for a given set of entities.
     *
     * @param entities A collection of entities that should be returned as tags.
     */
    private getTags(entities: ComponentFramework.WebApi.Entity[]): Promise<ITag[]> {
        if (entities.length < 1) {
            return Promise.resolve([]);
        }

        const promises = [];
        for (const entity of entities) {
            const relatedEntityId = entity[this.idAttribute] as string;
            const options = `?$select=${this.idAttribute},${this.nameAttribute}`;
            promises.push(this.webAPI.retrieveRecord(this.relatedEntity, relatedEntityId, options));
        }

        return Promise.all(promises).then(results =>
            results.map(result => ({ key: result[this.idAttribute], name: result[this.nameAttribute] }))
        );
    }

    /**
     * A callback for what should happen when a user clicks the input.
     *
     * @param selectedItems A collection of selected items.
     */
    private onEmptyInputFocus(selectedItems?: ITag[]): Promise<ITag[]> {
        return this.searchTags(undefined, selectedItems);
    }

    /**
     * A callback for what should happen when a person types text into the input.
     * Returns the already selected items so the resolver can filter them out.
     * If used in conjunction with resolveDelay this will ony kick off after the delay throttle.
     *
     * @param filter Text used to filter suggestions.
     * @param selectedItems A collection of selected items.
     */
    private onResolveSuggestions(filter: string, selectedItems?: ITag[]): Promise<ITag[]> {
        return this.searchTags(filter, selectedItems);
    }

    private listContainsTagList(tag: ITag, tagList?: ITag[]): boolean {
        if (!tagList || !tagList.length || tagList.length === 0) {
            return false;
        }
        return tagList.some(compareTag => compareTag.key === tag.key);
    }

    /**
     * Searches the related entity for a given filter.
     * Returns all the tags if no filter was given.
     * Extra filtering and rules can be applied if a View ID has been given through the control configuration
     *
     * @param filter Text used to filter suggestions.
     */
    private searchTags(filter?: string, selectedItems?: ITag[]): Promise<ITag[]> {
        if (this.viewId) {
            return this.webAPI
                .retrieveRecordsByView(this.relatedEntityMetadata[EntityMetadataProperties.EntitySetName] as string, this.viewId)
                .then(results =>
                    results.text().then(responseText => {
                        const entities = JSON.parse(responseText).value as ComponentFramework.WebApi.Entity[];
                        if (entities.length < 1) {
                            return [];
                        }

                        return entities
                            .map(item => ({ key: item[this.idAttribute], name: item[this.nameAttribute] }))
                            .filter(tag => !this.listContainsTagList(tag, selectedItems) && (filter ? tag.name.includes(filter) : true));
                    })
                );
        } else {
            let options = `?$select=${this.idAttribute},${this.nameAttribute}&$orderby=${this.nameAttribute} asc`;

            if (filter) {
                options = `${options}&$filter=contains(${this.nameAttribute},'${filter}')`;
            }

            return this.webAPI.retrieveMultipleRecords(this.relatedEntity, options).then(results => {
                if (results.entities.length < 1) {
                    return [];
                }

                return results.entities
                    .map(item => ({ key: item[this.idAttribute], name: item[this.nameAttribute] }))
                    .filter(tag => !this.listContainsTagList(tag, selectedItems));
            });
        }
    }

    /**
     * A callback for when the selected list of items changes.
     *
     * @param items A collection containing the items.
     */
    private onChange(items?: ITag[]): void {
        const promises: Promise<Response>[] = [];
        const entityExists: boolean = this.entityId !== undefined && this.entityId !== "00000000-0000-0000-0000-000000000000";

        // We only need to associate / dissasociate items when the entity exists.
        if (entityExists) {
            const parentSetName: string = this.entityMetadata[EntityMetadataProperties.EntitySetName];

            // Associate the added items.
            const itemsAdded = items?.filter(item => !this.selectedItems.some(selectedItem => selectedItem.key === item.key)) || [];
            for (const item of itemsAdded) {
                const childSetName: string = this.relatedEntityMetadata[EntityMetadataProperties.EntitySetName];

                promises.push(
                    this.webAPI.associateRecord(parentSetName, this.entityId, this.relationshipName, childSetName, item.key.toString())
                );
            }

            // Disassociate the removed items.
            const itemsRemoved = this.selectedItems.filter(selectedItem => !items?.some(item => item.key === selectedItem.key));
            for (const item of itemsRemoved) {
                promises.push(this.webAPI.disassociateRecord(parentSetName, this.entityId, this.relationshipName, item.key.toString()));
            }
        }

        Promise.all(promises)
            .then(results => {
                this.props.selectedItems = this.selectedItems = items || [];

                if (!entityExists) {
                    this.notifyOutputChanged();
                }
            })
            .catch(e => {
                console.error("Error updating relationship", e);
            });
    }
}
