import { IInputs, IOutputs } from "./generated/ManifestTypes";
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

	private _onNodeCheckClick: any;

	private _relationshipName: string;
	private _treeEntityCollectionName: string;
	private _mainEntityCollectionName: string;

	private _relationshipEntity: string;
	private _treeEntityName: string;
	private _treeEntityAttribute: string;
	private _idAttribute: string;
	private _nameAttribute: string;
	private controlId: string;
	private container: HTMLDivElement;
	private scriptElement: HTMLScriptElement;

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
		this.container = container;
		this.context = context;
		// Need to track container resize so that control could get the available width. The available height won't be provided even this is true
		context.mode.trackContainerResize(true);
		// Create main table container div. 
		this.mainContainer = document.createElement("div");
		this.mainContainer.classList.add("pcf_container_element");

		// Unique ID is most likely needed to prevent collisions if same component if added twice to a form, but maybe just go for a guid instead
		this.controlId = "tree_" + Math.random().toString(36).substr(2, 9);

		// Set basic html for jstree
		this.mainContainer.innerHTML = `
			<div class="pcf_overlay_element" id="${this.controlId}_overlay"></div>
			<div id="search-container"></div>
		    <div id="${this.controlId}" class="pcf_main_element jstree-open">
			  Loading...
			</div>
		`;

		container.appendChild(this.mainContainer);

		if (this.context.parameters.treeEntityName != null)
			this._treeEntityName = this.context.parameters.treeEntityName.raw;
		if (this.context.parameters.treeEntityAttribute != null)
			this._treeEntityAttribute = '_' + this.context.parameters.treeEntityAttribute.raw + '_value';
		if (this.context.parameters.idAttribute != null)
			this._idAttribute = this.context.parameters.idAttribute.raw;
		if (this.context.parameters.nameAttribute != null)
			this._nameAttribute = this.context.parameters.nameAttribute.raw;
		if (this.context.parameters.relationshipEntity != null)
			this._relationshipEntity = this.context.parameters.relationshipEntity.raw;
		if (this.context.parameters.relationshipName != null)
			this._relationshipName = this.context.parameters.relationshipName.raw;

		this.root = new jsTreeNode();
		this.root.id = null;
		this.root.children = [];

		this._onNodeCheckClick = this.nodeClick.bind(this);

		const promiseArray: [
			ComponentFramework.PropertyHelper.EntityMetadata,
			ComponentFramework.PropertyHelper.EntityMetadata,
			Promise<ComponentFramework.WebApi.RetrieveMultipleResponse>,
			Promise<ComponentFramework.WebApi.RetrieveMultipleResponse>] = [

				this.context.utils.getEntityMetadata((<any>this.context).page.entityTypeName, []),
				this.context.utils.getEntityMetadata(this._treeEntityName, []),
				this.context.webAPI.retrieveMultipleRecords(this._relationshipEntity, "?$filter=" + (<any>this.context).page.entityTypeName + "id eq " + (<any>this.context).page.entityId, 5000),
				this.context.webAPI.retrieveMultipleRecords(this._treeEntityName, "?$orderby=" + this._nameAttribute + " asc", 5000)
			];

		// TODO: Handle errors properly
		await Promise.all(promiseArray).then(results => {
			this._mainEntityCollectionName = results[0].EntitySetName;
			this._treeEntityCollectionName = results[1].EntitySetName;

			// Items that are selected from the tree
			let selectedTagsResult = results[2];
			for (var i in selectedTagsResult.entities) {
				console.log(selectedTagsResult.entities[i][this._idAttribute]);
				this.selectedItems.push(selectedTagsResult.entities[i][this._idAttribute]);
			}

			let tagsResult = results[3];

			try {
				// Tree is ready to go
				this.addChildElements(tagsResult, this.root);
				this.initTree();
				this.setReadonly();
			} catch (e) {
				console.log(e);
			}
		});
	}

	// TODO : Give type to "value"
	public addChildElements(value: any, root: jsTreeNode | null) {
		for (var i in value.entities) {
			var current: any = value.entities[i];
			if (current != null && root != null) {
				if (current[this._treeEntityAttribute] == root.id) {

					var newNode: jsTreeNode = new jsTreeNode();
					newNode.id = current[this._idAttribute];
					newNode.text = current[this._nameAttribute];
					newNode.children = [];

					var checked = this.selectedItems.indexOf(<string>newNode.id) > -1;
					newNode.state = new jsTreeNodeState();

					newNode.state.disabled = false;
					newNode.state.opened = false;
					newNode.state.selected = checked;

					root.children.push(newNode);
					this.addChildElements(value, newNode);
				}
			}
		}
	}

	public errorCallback(value: any) {
		alert(value);
	}

	public initTree(): void {
		$("#" + this.controlId)
			.jstree({

				"plugins": ["checkbox", "search"],
				"checkbox": { cascade: "", three_state: false },
				"core": {
					"data": this.root.children
				},
				"search": {
					"case_insensitive": true,
					"show_only_matches": true
				}
			})
			//.hide_dots() does not exist?
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
		$("#" + this.controlId).on("changed.jstree",
			function (e: any, data: any) {
				setTimeout(() => { _self._onNodeCheckClick(data); }, 50);// TODO: Check if timeout can be removed and don't "trigger" the click
			}
		);

		// set up the search
		$("#search-container").append(
			`
			<form id="search-form">
				<input type="search" id="search" class="form-control"/>
				<button type="submit" class="btn btn-primary">Search</button>
			</form>
			`
		);

		$("#search-form").submit(function (e) {
			// TODO: Loading/spinner
			e.preventDefault();
			$("#" + _self.controlId).jstree(true).search($("#search").val() as string);
		});
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

	public nodeClick(data: any) {
		// TODO: Most likely refactor a bit, take example of other custom components in this project
		var url: string = (<any>Xrm).Utility.getGlobalContext().getClientUrl();
		// TODO: figure out if there's a better way to get the ID (and all these requests)
		var recordUrl: string = url + "/api/data/v9.1/" + this._mainEntityCollectionName + "(" + (<any>this.context).page.entityId + ")";

		if (data.action == "select_node") {
			//See himbap samples here: http://himbap.com/blog/?p=2063
			var associate = {
				"@odata.id": recordUrl
			};

			var req = new XMLHttpRequest();
			req.open("POST", url + "/api/data/v9.1/" + this._treeEntityCollectionName + "(" + data.node.id + ")/" + this._relationshipName + "/$ref", true);
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.onreadystatechange = function () {
				if (this.readyState == 4 /* complete */) {
					req.onreadystatechange = null;
					if (this.status == 204) {
						//alert('Record Associated');
					} else {
						var error = JSON.parse(this.response).error;
						alert(error.message);
					}
				}
			};

			req.send(JSON.stringify(associate));
		}
		else if (data.action == "deselect_node") {
			var req = new XMLHttpRequest();
			req.open("DELETE", url + "/api/data/v9.1/" + this._treeEntityCollectionName + "(" + data.node.id + ")/" + this._relationshipName + "/$ref" + "?$id=" + recordUrl, true);
			req.setRequestHeader("Accept", "application/json");
			req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
			req.setRequestHeader("OData-MaxVersion", "4.0");
			req.setRequestHeader("OData-Version", "4.0");
			req.onreadystatechange = function () {
				if (this.readyState == 4 /* complete */) {
					req.onreadystatechange = null;
					if (this.status == 204) {
						//alert('Record Disassociated');
					} else {
						var error = JSON.parse(this.response).error;
						alert(error.message);
					}
				}
			};
			req.send();
		}
	}
}