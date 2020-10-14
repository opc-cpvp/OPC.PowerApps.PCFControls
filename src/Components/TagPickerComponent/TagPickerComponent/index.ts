import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { TagPickerBaseComponent } from "./TagPickerBaseComponent";

/**
 * Interface used to define output.
 */
interface ITagData {
	relatedEntity: string,
	relationshipName: string,
	tags: string[]
}

export class TagPickerComponent extends TagPickerBaseComponent<IInputs, IOutputs> {
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
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement) {
		this.relatedEntity = context.parameters.relatedEntity.raw || "";
		this.relationshipEntity = context.parameters.relationshipEntity.raw || "";
		this.relationshipName = context.parameters.relationshipName.raw || "";

		super.init(context, notifyOutputChanged, state, container);
	}

	/**
	 * It is called by the framework prior to a control receiving new data.
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		const selectedItems: ITagData = {
			relatedEntity: this.relatedEntity,
			relationshipName: this.relationshipName,
			tags: this.selectedItems?.map(items => items.key.toString()) || []
		};

		return {
			tagData: `${this.prefix}${JSON.stringify(selectedItems)}`
		};
	}
}