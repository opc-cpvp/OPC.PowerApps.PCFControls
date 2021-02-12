import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { WebApi, IWebApi } from "./WebApi";
import { TreeComponent, ITreeSelectProps, TreeSelectNode } from './TreeComponent';

type TreeDataRequests = [Promise<ComponentFramework.PropertyHelper.EntityMetadata>, Promise<Response>]
type TreeDataResponses = [ComponentFramework.PropertyHelper.EntityMetadata, Response]

export abstract class TreeBaseComponent<TInputs, TOutputs> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    // Cached context object for the latest updateView
    public context: ComponentFramework.Context<IInputs>;
    private notifyOutputChanged: () => void;

    private treeComponentContainer: HTMLDivElement;

    private mainEntityCollectionName: string;

    public treeEntityCollectionName: string;
    public relationshipEntity: string;
    public relationshipName: string;
    public treeEntityAttribute: string;
    public idAttribute: string;
    public nameAttribute: string;
    public descriptionAttribute: string;
    public extraTitleDetailsAttribute: string;
    public maxNameDisplayLength: number;
    public isCheckableAttribute: string;

    public selectedItems?: string[] = [];

    private webAPI: IWebApi;

	/**
	 * Empty constructor.
	 */
    constructor() {

    }

    // Specify available props to change
    private props: ITreeSelectProps = {
        selectLabelText: undefined,
        createRecordText: undefined,
        treeData: [],
        selectedItems: [],
        onChange: this.onChange.bind(this),
        maxNameDisplayLength: -1,
        entityExists: false
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

        const clientUrl = (this.context as any).page.getClientUrl();
        this.webAPI = new WebApi(this.context.webAPI, clientUrl);

        this.props.selectLabelText = this.context.resources.getString("pleaseSelect");
        this.props.createRecordText = this.context.resources.getString("createRecord");
        this.props.maxNameDisplayLength = this.maxNameDisplayLength;

        // Need to track container resize so that control could get the available width. The available height won't be provided even this is true
        context.mode.trackContainerResize(true);

        container.classList.add("pcf_container_element");
        container.classList.add("tree-component");
        this.treeComponentContainer = container;

        const entityTypeName = (this.context as any).page.entityTypeName;

        // Get selected records if the record already exists
        if ((this.context as any).page.entityId !== undefined) {
            let relationshipOptions = "?$filter=" + entityTypeName + "id eq " + (this.context as any).page.entityId;
            this.context.webAPI.retrieveMultipleRecords(this.relationshipEntity, relationshipOptions, 5000)
                .then(x => this.processSelectedRecordsResponse(x))
        }

        const promiseArray: TreeDataRequests = [
            this.context.utils.getEntityMetadata(entityTypeName, []),
            this.webAPI.retrieveRecordsByView(this.treeEntityCollectionName, this.context.parameters.tableGrid.getViewId())
        ];

        await Promise.all(promiseArray).
            then(x => this.processTreeDataResponses(x))
            .catch(e => {
                console.error("An error occured starting up the pcf", e);
            });
    }

    private processSelectedRecordsResponse(result: ComponentFramework.WebApi.RetrieveMultipleResponse): void {
        let selectedEntities = result;
        for (var i in selectedEntities.entities) {
            this.selectedItems?.push(selectedEntities.entities[i][this.idAttribute]);
        }
        this.props.selectedItems = this.selectedItems;
        this.updateView(this.context);
    }

    private async processTreeDataResponses(results: TreeDataResponses): Promise<void> {
        this.mainEntityCollectionName = results[0].EntitySetName;

        let recordData = await results[1].text();

        let entities = JSON.parse(recordData).value as ComponentFramework.WebApi.Entity[];

        // Sort the items naturally (abc111 would now be placed after abc12 as it contains a bigger number when it would originially be placed first)
        const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
        const sortedEntites = entities.sort((a, b) => collator.compare(a[this.nameAttribute], b[this.nameAttribute]));

        // Prepare root node to fill with the entities we fetched
        let rootNode = new TreeSelectNode();
        rootNode.key = "";
        rootNode.children = [];

        this.buildTreeData(sortedEntites, rootNode);
        this.props.treeData = rootNode.children;

        // Render the component now that we have all data
        this.updateView(this.context);
    }

    private buildTreeData(entities: ComponentFramework.WebApi.Entity, treeRoot: TreeSelectNode | null) {
        for (var node in entities) {
            let entity = entities[node];
            if (entity != null && treeRoot != null) {
                // Add to tree if root node or tree root is the parent of the current node
                if (entity[this.treeEntityAttribute] == (treeRoot.key || null)) {

                    let newNode = new TreeSelectNode();
                    newNode.key = entity[this.idAttribute];
                    newNode.parentKey = entity[this.treeEntityAttribute];
                    newNode.children = [];

                    newNode.description = entity[this.descriptionAttribute];
                    newNode.name = entity[this.nameAttribute];
                    newNode.titleDetails = entity[this.extraTitleDetailsAttribute];

                    newNode.checkable = this.isCheckableAttribute ? entity[this.isCheckableAttribute] : true;

                    if (newNode.titleDetails) {
                        newNode.title = <div>{newNode.name} | <em>{newNode.titleDetails}</em></div>;
                    } else {
                        newNode.title = newNode.name;
                    }

                    newNode.inputTitle = newNode.name;

                    treeRoot.children.push(newNode);
                    this.buildTreeData(entities, newNode);
                }
            }
        }
    }

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.props.entityExists = ((context as any).page.entityId && (context as any).page.entityId !== "00000000-0000-0000-0000-000000000000");

        ReactDOM.render(
            React.createElement(
                TreeComponent,
                this.props,
            ),
            this.treeComponentContainer
        );

        this.context = context;
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
        const entityExists: boolean = ((this.context as any).page.entityId && (this.context as any).page.entityId !== "00000000-0000-0000-0000-000000000000");

        // We only need to associate / dissasociate items when the entity exists.
        if (entityExists) {
            const parentSetName: string = this.mainEntityCollectionName;

            // Associate the added items.
            const itemsAdded = newItems?.filter((item: string): boolean => !this.selectedItems?.some(selectedItem => selectedItem === item)) || [];
            for (let item of itemsAdded) {
                promises.push(this.webAPI.associateRecord(parentSetName, (this.context as any).page.entityId, this.relationshipName, this.treeEntityCollectionName, item));
            }

            // Disassociate the removed items.
            const itemsRemoved = this.selectedItems?.filter(selectedItem => !newItems?.includes(selectedItem)) || [];
            for (let item of itemsRemoved) {
                promises.push(this.webAPI.disassociateRecord(parentSetName, (this.context as any).page.entityId, this.relationshipName, item));
            }
        }

        Promise.all(promises).then(
            _result => {
                this.props.selectedItems = this.selectedItems = newItems || [];

                if (!entityExists)
                    this.notifyOutputChanged();
            }
        ).catch(e => {
            console.error("Error updating relationships", e);
        });
    }
}