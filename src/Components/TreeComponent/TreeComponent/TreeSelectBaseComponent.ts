import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { WebApi, IWebApi } from "./WebApi";
import { TreeSelectComponent, ITreeSelectProps, TreeSelectNode } from './TreeSelectComponent';

// Only needed when creating relationships
interface ITagData {
	relatedEntity: string,
	relationshipName: string,
	tags: string[]
}

export abstract class TreeSelectBaseComponent<TInputs, TOutputs> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	// Cached context object for the latest updateView
	public context: ComponentFramework.Context<IInputs>;
	private notifyOutputChanged: () => void;

	// Div element created as part of this control's main container. TODO: Will probably remove or change in some way
    private mainContainer: HTMLDivElement;
    private treeComponentContainer: HTMLDivElement;

	private mainEntityCollectionName: string;

	public treeEntityCollectionName: string;
    public relationshipEntity: string;
	public relationshipName: string;
	public treeEntityAttribute: string;
	public idAttribute: string;
	public nameAttribute: string;
    public treeNameAttribute: string;
    
    public selectedItems?: string[];

	private webAPI: IWebApi;

	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	// Specify available props to change
	private props: ITreeSelectProps = {
		selectLabel: undefined,
		treeData: [],
		selectedItems: [],
		onChange: this.onChange.bind(this)
	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
	 */
	public async init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): Promise<void> {

		this.context = context;
		this.notifyOutputChanged = notifyOutputChanged;
		
		const clientUrl = (<any>this.context).page.getClientUrl();
		this.webAPI = new WebApi(this.context.webAPI, clientUrl);

		this.props.selectLabel = this.context.resources.getString("pleaseSelect");

		// Need to track container resize so that control could get the available width. The available height won't be provided even this is true
		context.mode.trackContainerResize(true);

        // TODO: Clean this up if possible
		// Create main table container div. 
		this.mainContainer = document.createElement("div");
		this.mainContainer.classList.add("pcf_container_element");
		this.mainContainer.classList.add("tree-component");

		const controlId = "tree_" + Math.random().toString(36).substr(2, 9);
		this.mainContainer.innerHTML = `
				<div class="pcf_overlay_element" id="${controlId}_overlay"></div>				
				<div id="${controlId}" class="pcf_main_element test jstree-open">
					Loading...
				</div>
		`;

		container.appendChild(this.mainContainer);

		this.treeComponentContainer = document.getElementById(controlId) as HTMLDivElement;

		const entityTypeName = (<any>this.context).page.entityTypeName;
		let relationshipOptions = "?$filter=" + entityTypeName + "id eq " + (<any>this.context).page.entityId;

		const promiseArray: [
			ComponentFramework.PropertyHelper.EntityMetadata,
			Promise<ComponentFramework.WebApi.RetrieveMultipleResponse>,
			Promise<Response>] = [
				this.context.utils.getEntityMetadata(entityTypeName, []),
				this.context.webAPI.retrieveMultipleRecords(this.relationshipEntity, relationshipOptions, 5000),
				this.webAPI.retrieveRecordsByView(this.treeEntityCollectionName, this.context.parameters.tableGrid.getViewId())
			];

		await Promise.all(promiseArray).then(async results => {
			this.mainEntityCollectionName = results[0].EntitySetName;

			// Entities that are selected from the tree
			let taggedEntities = results[1];
			for (var i in taggedEntities.entities) {
                this.selectedItems?.push(taggedEntities.entities[i][this.idAttribute]);
				this.props.selectedItems = this.selectedItems;
			}

			// This works, but isn't pretty, maybe just use some interface instead if possible
			let entities = JSON.parse(await results[2].text()).value as ComponentFramework.WebApi.Entity[];// clean this
			const allEntities = entities

			// Sort the items naturally (abc111 would now be placed after abc12 as it contains a bigger number when it would originially be placed first)
			const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
			const sortedEntites = allEntities.sort((a, b) => collator.compare(a.name, b.name));

			// Not optomized, may just pass straight to component instead.....
			let treeNodes = this.createTreeNodes(sortedEntites);

			this.props.treeData = treeNodes;

			console.log("Index tree data", this.props.treeData);

			// May not be needed here
			this.setReadonly();

			// Render the component now that we have all data
			this.updateView(context);

		}).catch(e => {
			console.error("An error occured starting up the pcf", e);
		});
    }
    
	public createTreeNodes(entities: ComponentFramework.WebApi.Entity): TreeSelectNode[] {
		let treeNodes: TreeSelectNode[] = [];

		for (var i in entities) {

			let entity = entities[i];

			let newNode = new TreeSelectNode();
			newNode.key = entity[this.idAttribute];
			newNode.parentKey = entity[this.treeEntityAttribute];
			newNode.title = entity[this.nameAttribute];
			newNode.children = [];

            // TODO: One or two of these will change to do the "extra detail" aggregation for marginal note
			// Multilanguage plugin will take car of this when ready, for now, use english
			newNode.description = entity["opc_englishdescription"];
			newNode.inputTitle = entity[this.treeNameAttribute]; // THis should be "name" not tree name... something is inversed..
			newNode.name = entity[this.nameAttribute];
			newNode.checkable = entity["opc_ischeckable"];

			treeNodes.push(newNode);
		}

		return treeNodes;
	}

	public setReadonly(): void {
		(<HTMLElement>this.mainContainer.firstElementChild).style.display = this.context.mode.isControlDisabled == false ? "none" : "block";
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public updateView(context: ComponentFramework.Context<IInputs>): void {
		ReactDOM.render(
			React.createElement(
				TreeSelectComponent,
				this.props,
			),
			this.treeComponentContainer
		);

		this.context = context;
		this.setReadonly();
	}

	/** 
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Add code to cleanup control if necessary
	}

	/**
     * A callback for when the selected list of items changes.
     * @param items A collection containing the items.
     */
	private onChange(newItems?: string[]): void {
		const promises: Promise<Response>[] = [];
		const entityExists: boolean = ((<any>this.context).page.entityId !== undefined && (<any>this.context).page.entityId !== "00000000-0000-0000-0000-000000000000");

		// We only need to associate / dissasociate items when the entity exists.
		if (entityExists) {
			const parentSetName: string = this.mainEntityCollectionName;

			// Associate the added items.
			const itemsAdded = newItems?.filter((item: string): boolean => !this.props.selectedItems?.some(selectedItem => selectedItem === item)) || [];
			for (let item of itemsAdded) {
				promises.push(this.webAPI.associateRecord(parentSetName, (<any>this.context).page.entityId, this.relationshipName, this.treeEntityCollectionName, item));
			}

			// Disassociate the removed items.
			const itemsRemoved = this.props.selectedItems?.filter(selectedItem => !newItems?.includes(selectedItem)) || [];
			for (let item of itemsRemoved) {
				promises.push(this.webAPI.disassociateRecord(parentSetName, (<any>this.context).page.entityId, this.relationshipName, item));
			}
		}

		Promise.all(promises).then(
			_ => {
				this.props.selectedItems = this.selectedItems = newItems || [];

				if (!entityExists)
					this.notifyOutputChanged();
			}
		);
	}
}