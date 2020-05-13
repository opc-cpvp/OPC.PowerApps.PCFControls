using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using System;
using System.Collections.Generic;

namespace Components.Support.Tests.Entities
{
    [EntityLogicalName("tag")]
    internal class Tag : Entity
    {
        public const string EntityLogicalName = "tag";

        [AttributeLogicalName("tagid")]
        public Guid? tagid
        {
            get { return GetAttributeValue<Guid?>("tagid"); }
            set { base.Id = value.HasValue ? value.Value : Guid.Empty; }
        }

        [AttributeLogicalName("name")]
        public string name
        {
            get { return GetAttributeValue<string>("name"); }
            set { SetAttributeValue("name", value); }
        }

        [RelationshipSchemaName("placeholder_tags")]
        public IEnumerable<Placeholder> placeholder_tags
        {
            get { return GetRelatedEntities<Placeholder>("placeholder_tags", null); }
            set { SetRelatedEntities("placeholder_tags", null, value); }
        }

        public Tag() :
                base(EntityLogicalName)
        {
        }
    }
}
