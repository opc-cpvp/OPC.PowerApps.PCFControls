declare namespace ComponentFramework {
    type SizeValueUnit = "%" | "px";

    const enum NavigationOptionsTarget {
        PageInline = 1,
        Dialog = 2
    }

    const enum NavigationOptionsPosition {
        Center = 1,
        Side = 2
    }

    const enum EntityFormRelationshipType {
        OneToMany = 1,
        ManyToMany = 2
    }

    const enum EntityFormRelationshipRoleType {
        Referencing = 1,
        AssociationEntity = 2
    }

    interface Navigation {
        navigateTo(pageInput: EntityRecord, navigationOptions?: NavigationOptions): Promise<undefined>;
    }

    interface NavigationOptions {
        /**
         * Specify 1 to open the page inline; 2 to open the page in a dialog. Entity lists can only be opened inline; web resources can be opened either inline or in a dialog
         */
        target: NavigationOptionsTarget;

        /**
         * The width of dialog. To specify the width in pixels, just type a numeric value. To specify the width in percentage, specify an object of type SizeValue
         */
        width?: number | SizeValue;

        /**
         * The height of dialog. To specify the width in pixels, just type a numeric value. To specify the width in percentage, specify an object of type SizeValue
         */
        height?: number | SizeValue;

        /**
         * Number. Specify 1 to open the dialog in center; 2 to open the dialog on the side. Default is 1 (center).
         */
        position?: NavigationOptionsPosition;

        /**
         * String. The dialog title on top of the center or side dialog.
         */
        title?: string;
    }

    interface SizeValue {
        /**
         * The numerical value.
         */
        value: number;

        /**
         * The unit of measurement.Specify "%" or "px".Default value is "px".
         */
        unit: SizeValueUnit;
    }

    interface EntityRecord {
        /**
         * The type of the page.
         */
        pageType: "entityrecord";

        /**
         * Logical name of the entity to display the form for.
         */
        entityName: string;

        /**
         * ID of the entity record to display the form for. If you don't specify this value, the form will be opened in create mode.
         */
        entityId?: string;

        /**
         * Designates a record that will provide default values based on mapped attribute values.
         */
        createFromEntity?: LookupValue;

        /**
         * A dictionary object that passes extra parameters to the form.
         */
        data?: object;

        /**
         * ID of the form instance to be displayed.
         */
        formId?: string;

        /**
         * Indicates whether the form is navigated to from a different entity using cross-entity business process flow.
         */
        isCrossEntityNavigate?: boolean;

        /**
         * Indicates whether there are any offline sync errors.
         */
        isOfflineSyncError?: boolean;

        /**
         * ID of the business process to be displayed on the form.
         */
        processId?: string;

        /**
         * ID of the business process instance to be displayed on the form.
         */
        processInstanceId?: string;

        /**
         * Define a relationship object to display the related records on the form
         */
        relationship?: EntityFormRelationship;

        /**
         * ID of the selected stage in business process instance.
         */
        selectedStageId?: string;
    }

    interface EntityFormRelationship {
        /**
         * Name of the attribute used for relationship.
         */
        attributeName: string;

        /**
         * Name of the relationship.
         */
        name: string;

        /**
         * Name for the navigation property for this relationship.
         */
        navigationPropertyName: string;

        /**
         * Relationship type.
         */
        relationshipType: EntityFormRelationshipType;

        /**
         * Role type in relationship.
         */
        roleType: EntityFormRelationshipRoleType;
    }
}
