import { IInputs, IOutputs } from "./generated/ManifestTypes"
import { TagPickerBaseComponent } from "./TagPickerBaseComponent"

export class TagPickerGridComponent extends TagPickerBaseComponent<IInputs, IOutputs> {
    public static readonly BodyContainerDataId = "data-set-body-container";
    public static readonly BodyContainerClass = "tagPickerGridBodyContainer";
    public static readonly ContainerClass = "tagPickerGridContainer";

    private observer: MutationObserver;

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
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement) {
        this.relatedEntity = context.parameters.relatedEntity.raw || "";
        this.relationshipEntity = context.parameters.relationshipEntity.raw || "";
        this.relationshipName = context.parameters.relationshipName.raw || "";
        this.labelText = context.parameters.labelText.raw || "";

        super.init(context, notifyOutputChanged, state, container);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        super.updateView(context);

        this.applyContainerStyles();
    }

    public destroy(): void {
        super.destroy();

        if (this.observer !== undefined)
            this.observer.disconnect();
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Applies the styles to the container.
     */
    private applyContainerStyles(): void {
        this.container.classList.add(TagPickerGridComponent.ContainerClass);

        // exit if the observer is already configured
        if (this.observer !== undefined)
            return;

        const bodyContainer = this.getBodyContainer();

        if (bodyContainer !== null) {
            bodyContainer.classList.add(TagPickerGridComponent.BodyContainerClass);

            const options: MutationObserverInit = {
                attributes: true,
                attributeFilter: ["class"],
                childList: false
            };

            // Add an observer to watch for changes to the container class attribute
            this.observer = new MutationObserver((mutations, observer) => {
                observer.disconnect();

                if (!bodyContainer.classList.contains(TagPickerGridComponent.BodyContainerClass))
                    bodyContainer.classList.add(TagPickerGridComponent.BodyContainerClass);

                observer.observe(bodyContainer, options);
            });

            this.observer.observe(bodyContainer, options);
        }
    }

    /**
     * Retrieves the body container of the grid.
     */
    private getBodyContainer(): HTMLElement | null {
        let parent = this.container.parentElement;

        while (parent !== null) {
            if (!parent.hasAttribute("data-id")) {
                parent = parent.parentElement;
                continue;
            }

            const dataId = parent.getAttribute("data-id");
            parent = parent.parentElement;

            if (dataId === TagPickerGridComponent.BodyContainerDataId)
                break;
        }

        return parent;
    }
}