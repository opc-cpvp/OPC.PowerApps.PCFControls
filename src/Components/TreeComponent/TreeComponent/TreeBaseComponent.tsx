import * as React from "react";
import * as ReactDOM from "react-dom";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { WebApi, IWebApi } from "./WebApi";
import { TreeComponent, ITreeSelectProps } from "./TreeComponent";
import { TreeSelectNode } from "./TreeSelectNode";

type TreeDataResponses = [
    ComponentFramework.PropertyHelper.EntityMetadata,
    Response,
    ComponentFramework.WebApi.RetrieveMultipleResponse | undefined
];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export abstract class TreeBaseComponent<TInputs, TOutputs> implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    // Cached context object for the latest updateView
    public context: ComponentFramework.Context<IInputs>;

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

    private notifyOutputChanged: () => void;

    private treeComponentContainer: HTMLDivElement;

    private mainEntityCollectionName: string;

    private webAPI: IWebApi;

    // Specify available props to change
    private props: ITreeSelectProps = {
        selectLabelText: undefined,
        createRecordText: undefined,
        treeData: [],
        selectedItems: [],
        onChange: this.onChange.bind(this),
        maxNameDisplayLength: -1,
        entityExists: false
    };

    /**
     * Empty constructor.
     */
    constructor() {}

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     *
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='starndard', it will receive an empty div element within which it can render its content.
     */
    public async init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): Promise<void> {
        this.context = context;
        this.notifyOutputChanged = notifyOutputChanged;

        const clientUrl = (this.context as any).page.getClientUrl() as string;
        this.webAPI = new WebApi(this.context.webAPI, clientUrl);

        this.props.selectLabelText = this.context.resources.getString("pleaseSelect");
        this.props.createRecordText = this.context.resources.getString("createRecord");
        this.props.maxNameDisplayLength = this.maxNameDisplayLength;

        // Need to track container resize so that control could get the available width. The available height won't be provided even this is true
        context.mode.trackContainerResize(true);

        container.classList.add("pcf_container_element");
        container.classList.add("tree-component");
        this.treeComponentContainer = container;

        const entityTypeName = (this.context as any).page.entityTypeName as string;

        let retrieveMultipleRecordsRequest: Promise<ComponentFramework.WebApi.RetrieveMultipleResponse | undefined> =
            Promise.resolve(undefined);

        // Get selected records if the record already exists
        if ((this.context as any).page.entityId !== undefined) {
            // TODO: May need additional testing to make sur entityTypeName will always stay the same
            const relationshipOptions = `?$filter=${entityTypeName}id eq ${(this.context as any).page.entityId as string}`;
            retrieveMultipleRecordsRequest = this.context.webAPI.retrieveMultipleRecords(
                this.relationshipEntity,
                relationshipOptions,
                5000
            );
        }

        const getMetaDataRequest = this.context.utils.getEntityMetadata(entityTypeName, []);
        const getRecordsByViewRequest = this.webAPI.retrieveRecordsByView(
            this.treeEntityCollectionName,
            this.context.parameters.tableGrid.getViewId()
        );

        // Due to some typescript bug, a tuple can't currently be used for Promise.All as types are not infered properly. Using an array and casting to const seems to infer them properly.
        await Promise.all([getMetaDataRequest, getRecordsByViewRequest, retrieveMultipleRecordsRequest])
            .then(x => this.processTreeDataResponses(x))
            .catch(e => {
                console.error("An error occured starting up the pcf", e);
            });
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     *
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const entityId = (context as any).page.entityId as string;
        this.props.entityExists = entityId !== null && entityId !== "00000000-0000-0000-0000-000000000000";

        ReactDOM.render(React.createElement(TreeComponent, this.props), this.treeComponentContainer);

        this.context = context;
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }

    private async processTreeDataResponses(results: TreeDataResponses): Promise<void> {
        this.mainEntityCollectionName = results[0]?.EntitySetName;

        const recordData = await results[1]?.text();

        const entities = JSON.parse(recordData).value as ComponentFramework.WebApi.Entity[];

        // Sort the items naturally (abc111 would now be placed after abc12 as it contains a bigger number when it would originially be placed first)
        const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
        const sortedEntites = entities.sort((a, b) => collator.compare(a[this.nameAttribute] as string, b[this.nameAttribute] as string));

        // Prepare root node to fill with the entities we fetched
        const rootNode = new TreeSelectNode();
        rootNode.key = "";
        rootNode.children = [];

        this.buildTreeData(sortedEntites, rootNode);
        this.props.treeData = rootNode.children;

        // Set the selected records if the request has been made
        if (results[2] !== undefined) {
            this.selectedItems?.push(...results[2].entities.map(e => e[this.idAttribute] as string));
            this.props.selectedItems = this.selectedItems;
        }

        // Render the component now that we have all data
        this.updateView(this.context);
    }

    private buildTreeData(entities: ComponentFramework.WebApi.Entity[], treeRoot: TreeSelectNode | null) {
        for (const entity of entities) {
            if (treeRoot != null) {
                // Add to tree if root node or tree root is the parent of the current node

                /* eslint-disable eqeqeq */
                if (entity[this.treeEntityAttribute] == (treeRoot.key || null)) {
                    /* eslint-enable eqeqeq */
                    const newNode = new TreeSelectNode();
                    newNode.key = entity[this.idAttribute];
                    newNode.parentKey = entity[this.treeEntityAttribute];
                    newNode.children = [];

                    newNode.description = entity[this.descriptionAttribute];
                    newNode.name = entity[this.nameAttribute];
                    newNode.titleDetails = entity[this.extraTitleDetailsAttribute];

                    newNode.checkable = this.isCheckableAttribute ? entity[this.isCheckableAttribute] : true;

                    if (newNode.titleDetails) {
                        newNode.title = (
                            <div>
                                {newNode.name} | <em>{newNode.titleDetails}</em>
                            </div>
                        );
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
     * A callback for when the selected list of items changes.
     *
     * @param items A collection containing the items.
     */
    private onChange(newItems?: string[]): void {
        const promises: Promise<Response>[] = [];
        const entityId = (this.context as any).page.entityId as string;
        const entityExists: boolean = entityId != null && entityId !== "00000000-0000-0000-0000-000000000000";

        // We only need to associate / dissasociate items when the entity exists.
        if (entityExists) {
            const parentSetName: string = this.mainEntityCollectionName;

            // Associate the added items.
            const itemsAdded =
                newItems?.filter((item: string): boolean => !this.selectedItems?.some(selectedItem => selectedItem === item)) || [];
            for (const item of itemsAdded) {
                promises.push(
                    this.webAPI.associateRecord(parentSetName, entityId, this.relationshipName, this.treeEntityCollectionName, item)
                );
            }

            // Disassociate the removed items.
            const itemsRemoved = this.selectedItems?.filter(selectedItem => !newItems?.includes(selectedItem)) || [];
            for (const item of itemsRemoved) {
                promises.push(this.webAPI.disassociateRecord(parentSetName, entityId, this.relationshipName, item));
            }
        }

        Promise.all(promises)
            .then(_result => {
                this.props.selectedItems = this.selectedItems = newItems || [];

                if (!entityExists) {
                    this.notifyOutputChanged();
                }
            })
            .catch(e => {
                console.error("Error updating relationships", e);
            });
    }
}
