using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using System;
using System.Collections.Generic;

namespace Components.Support.Tests.Entities
{
    [EntityLogicalName("placeholder")]
    internal class Placeholder : Entity
    {
        public const string EntityLogicalName = "placeholder";

        [AttributeLogicalName("placeholderid")]
        public Guid? placeholderid
        {
            get { return GetAttributeValue<Guid?>("placeholderid"); }
            set { base.Id = value.HasValue ? value.Value : Guid.Empty; }
        }

        [AttributeLogicalName("tags")]
        public string tags
        {
            get { return GetAttributeValue<string>("tags"); }
            set { SetAttributeValue("tags", value); }
        }

        [RelationshipSchemaName("placeholder_tags")]
        public IEnumerable<Tag> placeholder_tags
        {
            get { return GetRelatedEntities<Tag>("placeholder_tags", null); }
            set { SetRelatedEntities("placeholder_tags", null, value); }
        }

        public Placeholder() :
                base(EntityLogicalName)
        {
        }
    }
}
