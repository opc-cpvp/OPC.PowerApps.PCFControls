using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using System;
using System.Collections.Generic;

namespace Components.Support.Tests.Entities
{
    [EntityLogicalName("placeholdertags")]
    internal class PlaceholderTags : Entity
    {
        public const string EntityLogicalName = "placeholdertags";

        [AttributeLogicalName("placeholderid")]
        public Guid? placeholderid
        {
            get { return GetAttributeValue<Guid?>("placeholderid"); }
        }

        [AttributeLogicalName("tagid")]
        public Guid? tagid
        {
            get { return GetAttributeValue<Guid?>("tagid"); }
        }

        [AttributeLogicalName("placeholdertagsid")]
        public Guid? placeholdertagsid
        {
            get { return GetAttributeValue<Guid?>("placeholdertagsid"); }
        }

        [AttributeLogicalName("placeholdertagsid")]
        public override Guid Id
        {
            get { return base.Id; }
            set { base.Id = value; }
        }

        [RelationshipSchemaName("placeholder_tags")]
        public IEnumerable<Tag> placeholder_tags
        {
            get { return GetRelatedEntities<Tag>("placeholder_tags", null); }
            set { SetRelatedEntities("placeholder_tags", null, value); }
        }

        public PlaceholderTags() :
                base(EntityLogicalName)
        {
        }
    }
}
