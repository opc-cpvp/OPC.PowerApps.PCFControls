import "whatwg-fetch";

export interface IWebApi extends ComponentFramework.WebApi {
    associateRecord(
        parentSetName: string,
        parentId: string,
        relationshipName: string,
        childSetName: string,
        childId: string
    ): Promise<Response>;
    disassociateRecord(parentSetName: string, parentId: string, relationshipName: string, childId: string): Promise<Response>;
    retrieveOptionSetMetadata(entityType: string, attributeName: string): Promise<Response>;
}

export class WebApi implements IWebApi {
    private static readonly API_RELATIVEPREFIX: string = "api/data/v9.2";
    private static readonly API_HEADERS: HeadersInit = {
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0"
    };
    private webApi: ComponentFramework.WebApi;
    private clientUrl: string;

    constructor(webApi: ComponentFramework.WebApi, clientUrl: string) {
        this.webApi = webApi;
        this.clientUrl = clientUrl;
    }

    retrieveOptionSetMetadata(entityType: string, attributeName: string): Promise<Response> {
        return window.fetch(
            `${this.clientUrl}/${
                WebApi.API_RELATIVEPREFIX
            }/EntityDefinitions(LogicalName='${entityType}')/Attributes(LogicalName='${attributeName}')/Microsoft.Dynamics.CRM.${
                attributeName === "statuscode" ? "StatusAttributeMetadata" : "PicklistAttributeMetadata"
            }?$select=LogicalName&$expand=OptionSet($select=Options)`,
            {
                method: "GET",
                headers: WebApi.API_HEADERS
            }
        );
    }

    /**
     * Associates a child record to a parent record.
     *
     * @param parentSetName Set name of the parent entity.
     * @param parentId ID of the parent record.
     * @param relationshipName Relationship name between the parent and child record.
     * @param childSetName Set name of the child entity.
     * @param childId ID of the child record.
     */
    associateRecord(
        parentSetName: string,
        parentId: string,
        relationshipName: string,
        childSetName: string,
        childId: string
    ): Promise<Response> {
        const payload = { "@odata.id": `${this.clientUrl}/${WebApi.API_RELATIVEPREFIX}/${parentSetName}(${parentId})` };

        // https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/webapi/associate-disassociate-entities-using-web-api
        return window.fetch(`${this.clientUrl}/${WebApi.API_RELATIVEPREFIX}/${childSetName}(${childId})/${relationshipName}/$ref`, {
            method: "POST",
            headers: WebApi.API_HEADERS,
            body: JSON.stringify(payload)
        });
    }

    /**
     * Creates an entity record.
     *
     * @param entityType logical name of the entity type record to create
     * @param data dictionary with attribute schema name and value
     * @returns The deferred object for the result of the operation. The created record object will be resolved if successful.
     */
    createRecord(entityType: string, data: ComponentFramework.WebApi.Entity): Promise<ComponentFramework.LookupValue> {
        return this.webApi.createRecord(entityType, data);
    }

    /**
     * Deletes an entity record.
     *
     * @param id GUID of the entity record you want to delete.
     * @param entityType logical name of the entity type record to delete
     * @returns The deferred object for the result of the operation. The deleted record object will be resolved if successful.
     */
    deleteRecord(entityType: string, id: string): Promise<ComponentFramework.LookupValue> {
        return this.webApi.deleteRecord(entityType, id);
    }

    /**
     * Disassociates a child record from a parent record.
     *
     * @param parentSetName Set name of the parent entity.
     * @param parentId ID of the parent record.
     * @param relationshipName Relationship name between the parent and child record.
     * @param childId ID of the child record.
     */
    disassociateRecord(parentSetName: string, parentId: string, relationshipName: string, childId: string): Promise<Response> {
        // https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/webapi/associate-disassociate-entities-using-web-api
        return window.fetch(
            `${this.clientUrl}/${WebApi.API_RELATIVEPREFIX}/${parentSetName}(${parentId})/${relationshipName}(${childId})/$ref`,
            {
                method: "DELETE",
                headers: WebApi.API_HEADERS
            }
        );
    }

    /**
     * Updates an entity record.
     *
     * @param id GUID of the entity record you want to update.
     * @param data dictionary containing to-change attributes with schema name and value
     * @param entityType logical name of the entity type record to update
     * @returns The deferred object for the result of the operation. The updated record object will be resolved if successful.
     */
    updateRecord(entityType: string, id: string, data: ComponentFramework.WebApi.Entity): Promise<ComponentFramework.LookupValue> {
        return this.webApi.updateRecord(entityType, id, data);
    }

    /**
     * Retrieves a collection of entity records.
     *
     * @param entityType logical name of the entity type record to retrieve
     * @param options OData system query options or FetchXML query to retrieve your data.
     * For support options, please refer to https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/clientapi/reference/xrm-webapi/retrievemultiplerecords
     * @param maxPageSize Max number of records to be retrieved per page
     * @returns The deferred object for the result of the operation. An object with interface RetrieveMultipleResponse will be resolved if successful.
     */
    retrieveMultipleRecords(
        entityType: string,
        options?: string | undefined,
        maxPageSize?: number | undefined
    ): Promise<ComponentFramework.WebApi.RetrieveMultipleResponse> {
        return this.webApi.retrieveMultipleRecords(entityType, options, maxPageSize);
    }

    /**
     * Retrieves an entity record.
     *
     * @param id GUID of the entity record you want to retrieve.
     * @param entityType logical name of the entity type record to retrieve
     * @param options OData system query options, $select and $expand, to retrieve your data.
     * For support options, please refer to https://docs.microsoft.com/en-us/dynamics365/customer-engagement/developer/clientapi/reference/xrm-webapi/retrieverecord
     * @returns The deferred object for the result of the operation. A JSON object with the retrieved properties and values will be resolved if successful.
     */
    retrieveRecord(entityType: string, id: string, options?: string | undefined): Promise<ComponentFramework.WebApi.Entity> {
        return this.webApi.retrieveRecord(entityType, id, options);
    }
}
