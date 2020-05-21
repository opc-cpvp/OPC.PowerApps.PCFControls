import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ITag } from 'office-ui-fabric-react/lib/Pickers';
import { TagPickerBase, ITagPickerProps } from './TagPicker';
import 'whatwg-fetch';

// https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/entity-metadata
enum EntityMetadataProperties {
	EntitySetName = "EntitySetName",
	PrimaryIdAttribute = "PrimaryIdAttribute",
	PrimaryNameAttribute  = "PrimaryNameAttribute",
	DisplayCollectionName  = "DisplayCollectionName"
}

export abstract class TagPickerBaseComponent<TInputs, TOutputs> implements ComponentFramework.StandardControl<TInputs, TOutputs> {
    private context: ComponentFramework.Context<TInputs>;
	private notifyOutputChanged: () => void;
    public container: HTMLDivElement;

    private entityId: string;
    private entityType: string;

	private get tagDisplayName(): string { return this.relatedEntityMetadata ? this.relatedEntityMetadata[EntityMetadataProperties.DisplayCollectionName] : null; }
	private get idAttribute(): string { return this.relatedEntityMetadata ? this.relatedEntityMetadata[EntityMetadataProperties.PrimaryIdAttribute] : ""; }
	private get nameAttribute(): string { return this.relatedEntityMetadata ? this.relatedEntityMetadata[EntityMetadataProperties.PrimaryNameAttribute] : ""; }

    private entityMetadata: ComponentFramework.PropertyHelper.EntityMetadata;
    private relatedEntityMetadata: ComponentFramework.PropertyHelper.EntityMetadata;

    private props: ITagPickerProps = {
		onChange: this.onChange.bind(this),
		onEmptyInputFocus: this.onEmptyInputFocus.bind(this),
		onResolveSuggestions: this.onResolveSuggestions.bind(this)
	}

	public labelText: string;
    public relatedEntity: string;
    public relationshipEntity: string;
    public relationshipName: string;

    public selectedItems: ITag[];

    constructor()
    {
    }

    init(context: ComponentFramework.Context<TInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = container;

        this.entityId = (<any>this.context).page.entityId;
		this.entityType =  (<any>this.context).page.entityTypeName;

		this.props.labelText = this.labelText;

        this.loadMetadata().then(() => {
			this.props.tagDisplayName = this.tagDisplayName;
			return this.getRelatedEntities();
		})
		.then(entities => {
			return this.getTags(entities);
		})
		.then(tags => {
			this.props.selectedItems = this.selectedItems = tags;
			this.updateView(context);
		});
    }

    updateView(context: ComponentFramework.Context<TInputs>): void
    {
        ReactDOM.render(
			React.createElement(
				TagPickerBase,
				this.props
			),
			this.container
		);
    }

    destroy(): void
    {
        ReactDOM.unmountComponentAtNode(this.container);
    }

    /**
	 * Used to load the metadata for to the entity and related entity.
	 */
	private loadMetadata(): Promise<ComponentFramework.PropertyHelper.EntityMetadata> {
		return Promise.all([
			this.context.utils.getEntityMetadata(this.entityType).then(value => this.entityMetadata = value),
			this.context.utils.getEntityMetadata(this.relatedEntity).then(value => this.relatedEntityMetadata = value)
		]);
	}

	/**
	 * Used to get the relationship entities linked to the current record.
	 */
	private getRelatedEntities(): Promise<ComponentFramework.WebApi.Entity[]> {
		const options = `?$filter=${this.entityType}id eq ${this.entityId}`;
		return this.context.webAPI.retrieveMultipleRecords(this.relationshipEntity, options).then(
			results => { return results.entities; }
		);
	}

	/**
	 * Used to get the tags for a given set of entities.
	 * @param entities A collection of entities that should be returned as tags.
	 */
	private getTags(entities: ComponentFramework.WebApi.Entity[]): Promise<ITag[]> {
		if (entities.length < 1) {
			return Promise.resolve([]);
		}

		const promises = [];
		for(let entity of entities) {
			const relatedEntityId = entity[this.idAttribute];
			const options = `?$select=${this.idAttribute},${this.nameAttribute}`;
			promises.push(this.context.webAPI.retrieveRecord(this.relatedEntity, relatedEntityId, options));
		}

		return Promise.all(promises).then(
			results => {
				return results.map(result => ({ key: result[this.idAttribute], name: result[this.nameAttribute] }));
			}
		);
	}

    /**
	 * A callback for what should happen when a user clicks the input.
	 * @param selectedItems A collection of selected items.
	 */
	private onEmptyInputFocus(selectedItems?: ITag[]): Promise<ITag[]> {
		return this.searchTags();
	}

	/**
	 * A callback for what should happen when a person types text into the input.
	 * Returns the already selected items so the resolver can filter them out.
	 * If used in conjunction with resolveDelay this will ony kick off after the delay throttle.
	 * @param filter Text used to filter suggestions.
	 * @param selectedItems A collection of selected items.
	 */
	private onResolveSuggestions(filter: string, selectedItems?: ITag[]): Promise<ITag[]> {
		return this.searchTags(filter);
	}

	/**
	 * Searches the related entity for a given filter.
	 * Returns all the tags if no filter was given.
	 * @param filter Text used to filter suggestions.
	 */
	private searchTags(filter?: string): Promise<ITag[]> {
		let options = `?$select=${this.idAttribute},${this.nameAttribute}&$orderby=${this.nameAttribute} asc`;

		if (filter)
			options = `${options}&$filter=contains(${this.nameAttribute},'${filter}')`;

		return this.context.webAPI.retrieveMultipleRecords(this.relatedEntity, options).then(
			results => {
				if (results.entities.length < 1)
					return [];

				return results.entities.map(item => ({ key: item[this.idAttribute], name: item[this.nameAttribute] }));
			}
		);
	}

	/**
	 * A callback for when the selected list of items changes.
	 * @param items A collection containing the items.
	 */
	private onChange(items?: ITag[]) : void {
		const promises: Promise<Response>[] = [];
		const entityExists: boolean = (this.entityId !== undefined && this.entityId !== "00000000-0000-0000-0000-000000000000");

		// We only need to associate / dissasociate items when the entity exists.
		if (entityExists)
		{
			// Associate the added items.
			const itemsAdded = items?.filter(item => !this.selectedItems.some(selectedItem => selectedItem.key === item.key)) || [];
			for(let item of itemsAdded) {
				promises.push(this.associateItem(item));
			}

			// Disassociate the removed items.
			const itemsRemoved = this.selectedItems.filter(selectedItem => !items?.some(item => item.key === selectedItem.key));
			for (let item of itemsRemoved) {
				promises.push(this.disassociateItem(item));
			}
		}

		Promise.all(promises).then(
			results => {
				this.props.selectedItems = this.selectedItems = items || [];

				if (!entityExists)
					this.notifyOutputChanged();
			}
		);
    }

	/**
	 * Associate the item with the entity.
	 * @param item The item to associate.
	 */
	private associateItem(item: ITag): Promise<Response> {
		const clientUrl: string = (<any>this.context).page.getClientUrl();

		const entityCollectionName = this.entityMetadata[EntityMetadataProperties.EntitySetName];
		const payload = { "@odata.id" : `${clientUrl}/api/data/v9.1/${entityCollectionName}(${this.entityId})` };

		const relatedEntityCollectionName: string = this.relatedEntityMetadata[EntityMetadataProperties.EntitySetName];

		// https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/webapi/associate-disassociate-entities-using-web-api
		return window.fetch(`${clientUrl}/api/data/v9.1/${relatedEntityCollectionName}(${item.key})/${this.relationshipName}/$ref`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Accept": "application/json",
				"OData-MaxVersion": "4.0",
				"OData-Version": "4.0"
			},
			body: JSON.stringify(payload)
		});
	}

	/**
	 * Disassociate the item with the entity.
	 * @param item The item to disassociate.
	 */
	private disassociateItem(item: ITag): Promise<Response> {
		const clientUrl: string = (<any>this.context).page.getClientUrl();

		const entityCollectionName = this.entityMetadata[EntityMetadataProperties.EntitySetName];

		// https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/webapi/associate-disassociate-entities-using-web-api
		return window.fetch(`${clientUrl}/api/data/v9.1/${entityCollectionName}(${this.entityId})/${this.relationshipName}(${item.key})/$ref`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Accept": "application/json",
				"OData-MaxVersion": "4.0",
				"OData-Version": "4.0"
			}
		});
	}
}