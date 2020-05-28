using Components.Support.Serialization;
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
        const string relationshipName = "placeholder_tags";
        private static TagRegistrationPlugin pluginInstance = null;

        private static TagRegistrationPlugin PluginInstance
        {
            get
            {
                if (pluginInstance is null)
                    pluginInstance = new TagRegistrationPlugin(string.Empty, string.Empty);

                return pluginInstance;
            }
        }

        private static XrmFakedContext GenerateBaseContext()
        {
            var context = new XrmFakedContext();

            // configure the relationship
            context.AddRelationship(relationshipName, new XrmFakedRelationship
            {
                IntersectEntity = PlaceholderTags.EntityLogicalName,
                Entity1LogicalName = Placeholder.EntityLogicalName,
                Entity1Attribute = "placeholderid",
                Entity2LogicalName = Tag.EntityLogicalName,
                Entity2Attribute = "tagid"
            });

            return context;
        }

        private static string GenerateTagData(string relatedEntity, string relationshipName, IEnumerable<Guid> tags, string prefix = TagData.Prefix)
        {
            var tagIds = string.Join(",", tags.Select(t => $"\"{t}\""));
            return $"{prefix}{{\"relatedEntity\":\"{relatedEntity}\",\"relationshipName\":\"{relationshipName}\",\"tags\":[{tagIds}]}}";
        }

        public class when_tags_are_empty
        {
            [Fact]
            public void relationships_shouldnt_be_created()
            {
                // Arrange
                var context = GenerateBaseContext();

                var tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    name = "tag"
                };

                var placeholder = new Placeholder
                {
                    Id = Guid.NewGuid(),
                    tags = string.Empty
                };

                context.Initialize(new Entity[] { tag, placeholder });

                // Act
                context.ExecutePluginWithTarget(PluginInstance, placeholder, PluginMessage.Create);

                // Assert
                var placeholderTags = context.CreateQuery<PlaceholderTags>().ToList();
                placeholderTags.Should().BeEmpty();
            }
        }

        public class when_tags_arent_supplied
        {
            [Fact]
            public void relationships_shouldnt_be_created()
            {
                // Arrange
                var context = GenerateBaseContext();

                var tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    name = "tag"
                };

                var placeholder = new Placeholder
                {
                    Id = Guid.NewGuid(),
                    tags = GenerateTagData(Tag.EntityLogicalName, relationshipName, new Guid[] { })
                };

                context.Initialize(new Entity[] { tag, placeholder });

                // Act
                context.ExecutePluginWithTarget(PluginInstance, placeholder, PluginMessage.Create);

                // Assert
                var placeholderTags = context.CreateQuery<PlaceholderTags>().ToList();
                placeholderTags.Should().BeEmpty();
            }
        }

        public class when_prefix_doesnt_match
        {
            [Fact]
            public void relationships_shouldnt_be_created()
            {
                // Arrange
                var context = GenerateBaseContext();

                var tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    name = "tag"
                };

                var placeholder = new Placeholder
                {
                    Id = Guid.NewGuid(),
                    tags = GenerateTagData(Tag.EntityLogicalName, relationshipName, new Guid[] { tag.Id }, "NOTTAGDATA:")
                };

                context.Initialize(new Entity[] { tag, placeholder });

                // Act
                context.ExecutePluginWithTarget(PluginInstance, placeholder, PluginMessage.Create);

                // Assert
                var placeholderTags = context.CreateQuery<PlaceholderTags>().ToList();
                placeholderTags.Should().BeEmpty();
            }
        }

        public class when_tagging_an_entity
        {
            [Fact]
            public void relationship_entity_should_be_created()
            {
                // Arrange
                var context = GenerateBaseContext();

                var tag = new Tag
                {
                    Id = Guid.NewGuid(),
                    name = "tag"
                };

                var placeholder = new Placeholder
                {
                    Id = Guid.NewGuid(),
                    tags = GenerateTagData(Tag.EntityLogicalName, relationshipName, new Guid[] { tag.Id })
                };

                context.Initialize(new Entity[] { tag, placeholder });

                // Act
                context.ExecutePluginWithTarget(PluginInstance, placeholder, PluginMessage.Create);

                // Assert
                var placeholderTags = context.CreateQuery<PlaceholderTags>().ToList();
                placeholderTags.Should().ContainSingle();

                var placeholderTag = placeholderTags.First();
                placeholderTag.tagid.Should().Be(tag.Id);
                placeholderTag.placeholderid.Should().Be(placeholder.Id);
            }
        }

        public class when_tagging_multiple_entities
        {
            [Fact]
            public void relationship_entities_should_be_created()
            {
                // Arrange
                var context = GenerateBaseContext();

                var tags = new Tag[]
                {
                    new Tag { Id = Guid.NewGuid(), name = "first" },
                    new Tag { Id = Guid.NewGuid(), name = "second" }
                };

                var tagIds = tags.Select(t => t.Id);

                var placeholder = new Placeholder
                {
                    Id = Guid.NewGuid(),
                    tags = GenerateTagData(Tag.EntityLogicalName, relationshipName, tagIds)
                };

                var entities = new List<Entity>(tags);
                entities.Add(placeholder);

                context.Initialize(entities);

                // Act
                context.ExecutePluginWithTarget(new TagRegistrationPlugin(string.Empty, string.Empty), placeholder, PluginMessage.Create);

                // Assert
                var placeholderTags = context.CreateQuery<PlaceholderTags>().ToList();
                placeholderTags.Count.Should().Be(tags.Length);
                placeholderTags.TrueForAll(pt =>
                    tagIds.Contains(pt.tagid.Value) &&
                    pt.Id.Equals(placeholder.Id)
                );
            }
        }
    }
}
