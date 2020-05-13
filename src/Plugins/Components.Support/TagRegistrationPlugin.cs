using Components.Support.Serialization;
using Microsoft.Xrm.Sdk;
using System;
using System.Linq;
using Newtonsoft.Json;

namespace Components.Support
{
    /*
     * Plugin development guide: https://docs.microsoft.com/powerapps/developer/common-data-service/plug-ins
     * Best practices and guidance: https://docs.microsoft.com/powerapps/developer/common-data-service/best-practices/business-logic/
     */
    public class TagRegistrationPlugin : PluginBase
    {
        public TagRegistrationPlugin(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(TagRegistrationPlugin))
        {
        }

        // Entry point for custom business logic execution
        protected override void ExecuteCdsPlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
                throw new ArgumentNullException("localPluginContext");

            var context = localPluginContext.PluginExecutionContext;

            if (context.MessageName != PluginMessage.Create)
                return;

            if (!(context.InputParameters["Target"] is Entity target))
                return;

            foreach (var attribute in target.Attributes.Values.OfType<string>())
            {
                if (!attribute.StartsWith(TagData.Prefix))
                    continue;

                var data = attribute.Substring(TagData.Prefix.Length);
                var tagData = JsonConvert.DeserializeObject<TagData>(data);

                var entityReferences = tagData.Tags.Select(t => new EntityReference(tagData.RelatedEntity, Guid.Parse(t))).ToList();
                var relatedEntities = new EntityReferenceCollection(entityReferences);
                var relationship = new Relationship(tagData.RelationshipName);

                localPluginContext.CurrentUserService.Associate(target.LogicalName, target.Id, relationship, relatedEntities);
            }
        }
    }
}