declare namespace ComponentFramework {
    export class WebApi {
        clientUrl: string;

        /**
         * Associates a child record to a parent record.
         * @param parentSetName Set name of the parent entity.
         * @param parentId ID of the parent record.
         * @param relationshipName Relationship name between the parent and child record.
         * @param childSetName Set name of the child entity.
         * @param childId ID of the child record.
         */
        associateRecord(parentSetName:string, parentId:string, relationshipName: string, childSetName: string, childId: string): Promise<Response>;

        /**
         * Disassociates a child record from a parent record.
         * @param parentSetName Set name of the parent entity.
         * @param parentId ID of the parent record.
         * @param relationshipName Relationship name between the parent and child record.
         * @param childId ID of the child record.
         */
        disassociateRecord(parentSetName:string, parentId:string, relationshipName: string, childId: string): Promise<Response>;
    }
}

ComponentFramework.WebApi.prototype.associateRecord = function(parentSetName:string, parentId:string, relationshipName: string, childSetName: string, childId: string): Promise<Response> {
    const payload = { "@odata.id" : `${this.clientUrl}/api/data/v9.1/${parentSetName}(${parentId})` };

    // https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/webapi/associate-disassociate-entities-using-web-api
    return window.fetch(`${this.clientUrl}/api/data/v9.1/${childSetName}(${childId})/${relationshipName}/$ref`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        },
        body: JSON.stringify(payload)
    });
}

ComponentFramework.WebApi.prototype.disassociateRecord = function(parentSetName:string, parentId:string, relationshipName: string, childId: string): Promise<Response> {
    // https://docs.microsoft.com/en-us/powerapps/developer/common-data-service/webapi/associate-disassociate-entities-using-web-api
    return window.fetch(`${this.clientUrl}/api/data/v9.1/${parentSetName}(${parentId})/${relationshipName}(${childId})/$ref`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json",
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0"
        }
    });
}