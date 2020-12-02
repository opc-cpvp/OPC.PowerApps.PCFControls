import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { WebApi, IWebApi } from "./WebApi";
import { TreeSelectComponent, ITreeSelectProps, TreeSelectNode } from './TreeSelectComponent';

class JsTreeNodeState {
	opened: boolean;
	disabled: boolean;
	selected: boolean;
}

// Only needed when creating relationships
interface ITagData {
	relatedEntity: string,
	relationshipName: string,
	tags: string[]
}

export class TreeComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	private readonly prefix: string = "TAGDATA:";

	//private selectedItems: string[] = [];

	private treeSelectRoot: TreeSelectNode;

	// Cached context object for the latest updateView
	private context: ComponentFramework.Context<IInputs>;
	private notifyOutputChanged: () => void;

	// Div element created as part of this control's main container
	private mainContainer: HTMLDivElement;

	private relationshipName: string;
	private treeEntityCollectionName: string; //Needed?
	private mainEntityCollectionName: string; //Needed?

	private relationshipEntity: string;
	private treeEntityName: string;
	private treeEntityAttribute: string;
	private idAttribute: string;
	private nameAttribute: string;
	private treeComponentContainer: HTMLDivElement;

	// Flat list of tree items
	private items: ComponentFramework.WebApi.Entity[];

	private webAPI: IWebApi;

	/**
	 * Empty constructor.
	 */
	constructor() {

	}

	// Specify available props to change
	private props: ITreeSelectProps = {
		//labels: {},
		//     onChange: this.onChange.bind(this),
		//     onEmptyInputFocus: this.onEmptyInputFocus.bind(this),
		//     onResolveSuggestions: this.onResolveSuggestions.bind(this)
		treeData: null,
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

		// Passed control variables
		if (this.context.parameters.treeEntityAttribute != null)
			this.treeEntityAttribute = '_' + this.context.parameters.treeEntityAttribute.raw + '_value';

		this.treeEntityName = this.context.parameters.treeEntityName.raw || "";
		this.idAttribute = this.context.parameters.idAttribute.raw || "";
		this.nameAttribute = this.context.parameters.nameAttribute.raw || "";
		this.relationshipEntity = this.context.parameters.relationshipEntity.raw || "";
		this.relationshipName = this.context.parameters.relationshipName.raw || "";

		const clientUrl = (<any>this.context).page.getClientUrl();
		this.webAPI = new WebApi(this.context.webAPI, clientUrl);

		this.treeSelectRoot = new TreeSelectNode();
		this.treeSelectRoot.key = ""; // Check this out please, this is causing the populating issue
		this.treeSelectRoot.children = [];

		// Need to track container resize so that control could get the available width. The available height won't be provided even this is true
		context.mode.trackContainerResize(true);

		// Create main table container div. 
		this.mainContainer = document.createElement("div");
		this.mainContainer.classList.add("pcf_container_element");
		this.mainContainer.classList.add("tree-component");

		// Unique ID is most likely needed to prevent collisions if same component if added twice to a form, but maybe just go for a guid instead
		const controlId = "tree_" + Math.random().toString(36).substr(2, 9);

		// TODO: Create like container above
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
		let treeEntityOptions = "?$orderby=" + this.nameAttribute + " asc";

		const promiseArray: [
			ComponentFramework.PropertyHelper.EntityMetadata,
			ComponentFramework.PropertyHelper.EntityMetadata,
			Promise<ComponentFramework.WebApi.RetrieveMultipleResponse>,
			Promise<ComponentFramework.WebApi.RetrieveMultipleResponse>] = [

				this.context.utils.getEntityMetadata(entityTypeName, []),
				this.context.utils.getEntityMetadata(this.treeEntityName, []),
				this.context.webAPI.retrieveMultipleRecords(this.relationshipEntity, relationshipOptions, 5000),
				this.context.webAPI.retrieveMultipleRecords(this.treeEntityName, treeEntityOptions, 5000)
			];

		await Promise.all(promiseArray).then(results => {
			this.mainEntityCollectionName = results[0].EntitySetName;
			this.treeEntityCollectionName = results[1].EntitySetName;

			// Entities that are selected from the tree
			let taggedEntities = results[2];
			for (var i in taggedEntities.entities) {
				console.log("Tagged entity: ", taggedEntities.entities[i][this.idAttribute]);
				this.props.selectedItems?.push(taggedEntities.entities[i][this.idAttribute]);
			}
			let allEntities = results[3];

			this.items = results[3].entities; // needed for filtering onm the onchange

			this.addChildElements(allEntities, this.treeSelectRoot);
			this.props.treeData = this.treeSelectRoot.children;

			// May not be needed
			this.setReadonly();

			// Render the component now that we have all data
			this.updateView(context);

		}).catch(e => {
			console.error("An error occured starting up the pcf", e);
		});
	}

	// TODO: Optimize
	public addChildElements(entities: ComponentFramework.WebApi.RetrieveMultipleResponse, treeRoot: TreeSelectNode | null) {

		for (var i in entities.entities) {
			let current = entities.entities[i];
			if (current != null && treeRoot != null) {
				// Add to tree if root node or tree root is the parent of the current node
				if (current[this.treeEntityAttribute] == (treeRoot.key || null)) {

					let newNode = new TreeSelectNode();
					newNode.key = current[this.idAttribute];
					newNode.title = current[this.nameAttribute];
					newNode.children = [];
					// Multilangual plugin will most likely handle the bilinugal problem, could go with the tag picker route and specify wich field to use if "en" or "fr" etc..
					newNode.description = current["opc_englishdescription"];
					newNode.summary = current["opc_englishtitle"];
					newNode.name = current[this.nameAttribute]; // Same as title but won't be modified to include other content

					treeRoot.children.push(newNode);
					this.addChildElements(entities, newNode);
				}
			}
		}
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
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		const selectedItems: ITagData = {
			relatedEntity: this.relationshipEntity,
			relationshipName: this.relationshipName,
			tags: this.props.selectedItems || []
		};

		return {
			tagData: `${this.prefix}${JSON.stringify(selectedItems)}`
		};
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
		// TODO: property for entity id

		console.log("custom on change called with:", newItems);
		const entityExists: boolean = ((<any>this.context).page.entityId !== undefined && (<any>this.context).page.entityId !== "00000000-0000-0000-0000-000000000000");

		// We only need to associate / dissasociate items when the entity exists.
		if (entityExists) {
			const parentSetName: string = this.mainEntityCollectionName;
			console.log("Selected", this.props.selectedItems); // Should work now...
			console.log("Newly tagged (all currently tagged)", newItems); // Should work now...

			//this.entityMetadata[EntityMetadataProperties.EntitySetName];

			// Associate the added items.
			// Will need to keep a flat array of the original items to filter everything
			const itemsAdded = newItems?.filter((item: string): boolean => !this.props.selectedItems?.some(selectedItem => selectedItem === item)) || [];
			console.log("Items added", itemsAdded);
			for (let item of itemsAdded) {
				const childSetName: string = this.treeEntityCollectionName;//  this.relatedEntityMetadata[EntityMetadataProperties.EntitySetName]; // Need metadata

				promises.push(this.webAPI.associateRecord(parentSetName, (<any>this.context).page.entityId, this.relationshipName, childSetName, item));
			}

			// Disassociate the removed items.
			const itemsRemoved = this.props.selectedItems?.filter(selectedItem => {

				let newItemsIncludeCurrentlySelected = !newItems?.includes(selectedItem);

				console.log("Current selected item is in new selected items?", selectedItem, newItemsIncludeCurrentlySelected);
				return newItemsIncludeCurrentlySelected
			}
			) || [];
			console.log("Items removed", itemsRemoved);
			for (let item of itemsRemoved) {
				promises.push(this.webAPI.disassociateRecord(parentSetName, (<any>this.context).page.entityId, this.relationshipName, item));
			}
		}

		Promise.all(promises).then(
			_ => {
				this.props.selectedItems = this.props.selectedItems = newItems || [];

				if (!entityExists)
					this.notifyOutputChanged();
			}
		);
	}
}