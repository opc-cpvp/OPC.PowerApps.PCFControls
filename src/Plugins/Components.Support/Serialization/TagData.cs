using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System.Collections.Generic;

namespace Components.Support.Serialization
{
    public class TagData
    {
        public static readonly string Prefix = "TAGDATA:";

        [JsonProperty("relatedEntity")]
        public string RelatedEntity { get; set; }

        [JsonProperty("relationshipName")]
        public string RelationshipName { get; set; }

        [JsonProperty("tags")]
        public List<string> Tags { get; set; }
    }
}