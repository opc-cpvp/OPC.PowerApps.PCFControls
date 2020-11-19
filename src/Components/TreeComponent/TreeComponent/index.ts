import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { WebApi, IWebApi } from "pcf-project-shared";
import * as $ from 'jquery';
import 'jstree';
/*
/// <reference types="@types/[jstree]" />
*/

// TODO: 
//		Lazy loading (jstree supported)
// 		More cleanup
// 		Better icons?
// 		Styling

class jsTreeNodeState {
	opened: boolean;
	disabled: boolean;
	selected: boolean;
}
class jsTreeNode {
	id: string | null;
	text: string;
	children: jsTreeNode[];
	state: jsTreeNodeState;
}

//declare var $: any;

declare var Xrm: any;

export class TreeComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {

	// TODO: clean variables up (copy the other PCF's in this project)
	private root: jsTreeNode;
	private selectedItems: string[] = [];

	// Cached context object for the latest updateView
	private context: ComponentFramework.Context<IInputs>;

	// Div element created as part of this control's main container
	private mainContainer: HTMLDivElement;

	private relationshipName: string;
	private treeEntityCollectionName: string;
	private mainEntityCollectionName: string;

	private relationshipEntity: string;
	private treeEntityName: string;
	private treeEntityAttribute: string;
	private idAttribute: string;
	private nameAttribute: string;
	private jstreeContainer: JQuery<HTMLElement>;

	private webAPI: IWebApi;

	/**
	 * Empty constructor.
	 */
	constructor() {

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

		this.root = new jsTreeNode();
		this.root.id = null;
		this.root.children = [];

		// Need to track container resize so that control could get the available width. The available height won't be provided even this is true
		context.mode.trackContainerResize(true);

		// Create main table container div. 
		this.mainContainer = document.createElement("div");
		this.mainContainer.classList.add("pcf_container_element");
		this.mainContainer.classList.add("tree-component");

		// Unique ID is most likely needed to prevent collisions if same component if added twice to a form, but maybe just go for a guid instead
		const controlId = "tree_" + Math.random().toString(36).substr(2, 9);

		// Set basic html for jstree
		this.mainContainer.innerHTML = `
			<div class="pcf_overlay_element" id="${controlId}_overlay"></div>
			<div id="search-container"></div>
		    <div id="${controlId}" class="pcf_main_element test jstree-open">
			  Loading...
			</div>
		`;

		container.appendChild(this.mainContainer);

		this.jstreeContainer = $("#" + controlId);

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

		// TODO: Handle errors properly
		await Promise.all(promiseArray).then(results => {
			this.mainEntityCollectionName = results[0].EntitySetName;
			this.treeEntityCollectionName = results[1].EntitySetName;

			// Entities that are selected from the tree
			let taggedEntities = results[2];
			for (var i in taggedEntities.entities) {
				console.log(taggedEntities.entities[i][this.idAttribute]);
				this.selectedItems.push(taggedEntities.entities[i][this.idAttribute]);
			}

			// All entities that will be displayed on the tree
			let allEntities = results[3];
			console.log(allEntities);
			this.addChildElements(allEntities, this.root);
			this.initTree();
			this.setReadonly();
		}).catch(e => {
			console.error("An error occured starting up the pcf", e);
		});
	}

	public addChildElements(entities: ComponentFramework.WebApi.RetrieveMultipleResponse, root: jsTreeNode | null) {
		for (var i in entities.entities) {
			let current = entities.entities[i];
			if (current != null && root != null) {
				if (current[this.treeEntityAttribute] == root.id) {

					var newNode: jsTreeNode = new jsTreeNode();
					newNode.id = current[this.idAttribute];
					newNode.text = current[this.nameAttribute];
					newNode.children = [];

					var checked = this.selectedItems.indexOf(<string>newNode.id) > -1;
					newNode.state = new jsTreeNodeState();

					newNode.state.disabled = false;
					newNode.state.opened = false;
					newNode.state.selected = checked;

					root.children.push(newNode);
					this.addChildElements(entities, newNode);
				}
			}
		}
	}

	public initTree(): void {
		this.jstreeContainer
			.jstree({
				"plugins": ["checkbox", "search"],
				"checkbox": { cascade: "", three_state: false },
				"core": {
					"data": this.root.children,
					"themes": {
						dots: false
					},
				},
				"search": {
					"case_insensitive": true,
					"show_only_matches": true
				},
				"types": {
					"default": {
						"icon": "glyphicon glyphicon-flash"
					}
				}
			})
			.on('select_node.jstree', function (e: any, data: any) {
				if (data.event) {
					data.instance.select_node(data.node.children_d);
				}
			})
			.on('deselect_node.jstree', function (e: any, data: any) {
				if (data.event) {
					data.instance.deselect_node(data.node.children_d);
				}
			});


		// Bind this to other variable so we can still use it in the callback
		const _self = this;
		this.jstreeContainer.on("changed.jstree",
			function (e: any, data: any) {
				setTimeout(() => { _self.nodeClick(data); }, 50);// TODO: Check if timeout can be removed and don't "trigger" the click
			}
		);

		// set up the search
		$("#search-container").append(
			`
			<form id="search-form" class="form-inline my-2 my-lg-0">
				<input type="search" placeholder="search" id="search" class="form-control mr-sm-2"/>
				<button type="submit" class="btn btn-primary my-2 my-sm-0">Search</button>
			</form>
			`
		);

		$("#search-form").submit(function (e) {
			e.preventDefault();
			_self.jstreeContainer.jstree(true).search($("#search").val() as string);
		});
	}

	public nodeClick(data: any) {
		if (data.action == "select_node") {
			this.webAPI.associateRecord(this.mainEntityCollectionName, (<any>this.context).page.entityId, this.relationshipName, this.treeEntityCollectionName, data.node.id)
				.catch(e => {
					console.error(e);
				});
		}
		else if (data.action == "deselect_node") {
			this.webAPI.disassociateRecord(this.mainEntityCollectionName, (<any>this.context).page.entityId, this.relationshipName, data.node.id)
				.catch(e => {
					console.error(e);
				});
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
		this.context = context;
		this.setReadonly();
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
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
}