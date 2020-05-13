using Components.Support;
using Components.Support.Tests.Entities;
using FakeXrmEasy;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace Components.Support.Tests
{
    public class TagRegistrationPluginTests
    {
        public class when_tagging_an_entity
        {
            [Fact]
            public void relationship_entity_should_be_created()
            {
                // Arrange
                var context = new XrmFakedContext();

                var tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    name = "tag"
                };

                var placeholder = new Placeholder
                {
                    Id = Guid.NewGuid(),
                    tags = $"TAGDATA:{{\"relatedEntity\":\"tag\",\"relationshipName\":\"placeholder_tags\",\"tags\":[\"{tag.Id}\"]}}"
                };

                context.Initialize(new Entity[] { tag, placeholder });

                // configure the relationship
                context.AddRelationship("placeholder_tags", new XrmFakedRelationship
                {
                    IntersectEntity = PlaceholderTags.EntityLogicalName,
                    Entity1LogicalName = Placeholder.EntityLogicalName,
                    Entity1Attribute = "placeholderid",
                    Entity2LogicalName = Tag.EntityLogicalName,
                    Entity2Attribute = "tagid"
                });

                // Act
                context.ExecutePluginWithTarget(new TagRegistrationPlugin(string.Empty, string.Empty), placeholder, PluginMessage.Create);

                // Assert
                var placeholderTags = context.CreateQuery<PlaceholderTags>().ToList();
                placeholderTags.Should().ContainSingle();

                var placeholderTag = placeholderTags.First();
                placeholderTag.tagid.Should().Be(tag.Id);
                placeholderTag.placeholderid.Should().Be(placeholder.Id);
            }
        }
    }
}
