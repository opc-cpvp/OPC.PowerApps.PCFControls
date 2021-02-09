import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { TreeBaseComponent } from "./TreeBaseComponent";

/**
 * Interface used to define output.
 */
interface ITagData {
	relatedEntity: string,
	relationshipName: string,
	tags: string[]
}

// TODO: May need to go with tag picker grid container index instead

export class TreeComponent<TInputs, TOutputs> extends TreeBaseComponent<IInputs, IOutputs> {
	private readonly prefix: string = "TAGDATA:";

	/**
	 * Empty constructor.
	 */
	constructor() {
		super();
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
		// Passed control variables
		if (context.parameters.treeEntityAttribute != null)
			this.treeEntityAttribute = `_${context.parameters.treeEntityAttribute.raw}_value`;

		console.log(context.parameters.maxNameDisplayLength.raw);

		this.treeEntityCollectionName = context.parameters.treeEntityCollectionName.raw || ""; // Rename treeEntityName when ready to commit and publish
		this.idAttribute = context.parameters.idAttribute.raw || "";
		this.nameAttribute = context.parameters.nameAttribute.raw || "";
		this.relationshipEntity = context.parameters.relationshipEntity.raw || "";
		this.relationshipName = context.parameters.relationshipName.raw || "";
		this.maxNameDisplayLength = context.parameters.maxNameDisplayLength.raw || -1;
		this.descriptionAttribute = context.parameters.descriptionAttribute.raw || "";
		this.extraTitleDetailsAttribute = context.parameters.extraTitleDetailsAttribute.raw || "";
		this.isCheckableAttribute = context.parameters.isCheckableAttribute.raw || "";

		console.log(this.maxNameDisplayLength);

		super.init(context, notifyOutputChanged, state, container);
	}

	/** 
	 * It is called by the framework prior to a control receiving new data. 
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		const selectedItems: ITagData = {
			relatedEntity: this.relationshipEntity,
			relationshipName: this.relationshipName,
			tags: this.selectedItems || []
		};

		return {
			tagData: `${this.prefix}${JSON.stringify(selectedItems)}`
		};
	}
}