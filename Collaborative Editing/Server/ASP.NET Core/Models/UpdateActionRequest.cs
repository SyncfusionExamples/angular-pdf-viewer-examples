using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace PdfViewerCollaborativeEditingServer.Models
{
    /// <summary>
    /// Strongly-typed envelope for the UpdateAction API.
    ///
    /// Mirrors the Node.js collaborative editing broadcast payload shape:
    ///     {
    ///         roomName: string,
    ///         connectionId: string,
    ///         userName: string,
    ///         type: 'annotation' | 'formField' | 'formFieldAction' | 'pageOrganizer',
    ///         currentVersion: number | undefined,
    ///         data: AnnotationData | FormFieldData | FormFieldActionData | PageOrganizerData
    ///     }
    ///
    /// All properties are nullable; null values are excluded from the serialized
    /// payload so the .NET broadcast matches the Node.js broadcast exactly.
    /// </summary>
    public class UpdateActionRequest
    {
        [JsonProperty("roomName")]
        public string? RoomName { get; set; }

        [JsonProperty("connectionId")]
        public string? ConnectionId { get; set; }

        [JsonProperty("userName")]
        public string? UserName { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }

        [JsonProperty("currentVersion")]
        public int? CurrentVersion { get; set; }

        /// <summary>
        /// Type-specific payload. Stored as <see cref="object"/> so each
        /// action type can have its own strongly-typed shape (see
        /// <see cref="AnnotationData"/>, <see cref="FormFieldData"/>,
        /// <see cref="FormFieldActionData"/>, <see cref="PageOrganizerData"/>).
        /// Null when no data was provided.
        /// </summary>
        [JsonProperty("data")]
        public object? Data { get; set; }
    }

    /// <summary>
    /// Payload for <c>type = "annotation"</c>.
    /// Matches the Node.js shape:
    ///     { xfdfData: string, action: string, isRedacted: boolean }
    /// </summary>
    public class AnnotationData
    {
        [JsonProperty("xfdfData")]
        public string? XfdfData { get; set; }

        [JsonProperty("action")]
        public string? Action { get; set; }

        [JsonProperty("isRedacted")]
        public bool? IsRedacted { get; set; }
    }

    /// <summary>
    /// Payload for <c>type = "formField"</c>.
    /// Matches the Node.js shape:
    ///     { jsonData: string, action: string }
    /// </summary>
    public class FormFieldData
    {
        [JsonProperty("jsonData")]
        public string? JsonData { get; set; }

        [JsonProperty("action")]
        public string? Action { get; set; }
    }

    /// <summary>
    /// Payload for <c>type = "formFieldAction"</c>.
    /// Matches the Node.js shape:
    ///     { changes: string, action: string }
    /// <c>changes</c> is a JSON-encoded string describing the field
    /// create/update/delete operations.
    /// </summary>
    public class FormFieldActionData
    {
        [JsonProperty("changes")]
        public string? Changes { get; set; }

        [JsonProperty("action")]
        public string? Action { get; set; }
    }

    /// <summary>
    /// Payload for <c>type = "pageOrganizer"</c>.
    /// Strongly-typed wrapper around the page organizer entries, mirroring
    /// the Node.js shape. The wire payload from the client is a JSON array
    /// of <see cref="PageOrganizerEntry"/> entries
    /// (rotate / delete / rearrange / insert / copy). The data may arrive
    /// either as a JArray or as a JSON-stringified array string, both of
    /// which are handled transparently.
    /// </summary>
    public class PageOrganizerData
    {
        [JsonProperty("data")]
        public List<PageOrganizerEntry>? Data { get; set; }
    }

    /// <summary>
    /// A single page organizer action (rotate, delete, rearrange, insert, copy).
    /// Different action types use different fields:
    /// - <c>rotate</c>: action, originalPageIndex, targetIndex, rotateAngle
    /// - <c>delete</c>: action, originalPageIndex (targetIndex may be null)
    /// - <c>rearrange</c>: action, originalPageIndex, targetIndex, rotateAngle
    /// - <c>insert</c>: action, targetIndex, rotateAngle, pageSize (originalPageIndex = -1)
    /// - <c>copy</c>: action, originalPageIndex = -1, targetIndex, sourceOriginalPageIndex, rotateAngle, pageSize
    ///
    /// Extra fields are captured via <c>[JsonExtensionData]</c> to preserve
    /// the original wire payload for broadcast to other clients without losing
    /// action-specific data.
    /// </summary>
    public class PageOrganizerEntry
    {
        [JsonProperty("action")]
        public string? Action { get; set; }

        [JsonProperty("originalPageIndex")]
        public int? OriginalPageIndex { get; set; }

        [JsonProperty("targetIndex")]
        public int? TargetIndex { get; set; }

        [JsonProperty("rotateAngle")]
        public int? RotateAngle { get; set; }

        [JsonProperty("sourceOriginalPageIndex")]
        public int? SourceOriginalPageIndex { get; set; }

        [JsonProperty("pageSize")]
        public PageSize? PageSize { get; set; }

        /// <summary>
        /// Captures any additional JSON properties not explicitly mapped,
        /// allowing round-trip serialization without losing wire data.
        /// </summary>
        [Newtonsoft.Json.JsonExtensionData]
        public IDictionary<string, object>? ExtensionData { get; set; }
    }

    /// <summary>
    /// Page dimensions used by the page organizer <c>insert</c> and
    /// <c>copy</c> actions. Captures width, height, and any additional
    /// properties (top, rotation, etc.) via extension data.
    /// </summary>
    public class PageSize
    {
        [JsonProperty("width")]
        public double? Width { get; set; }

        [JsonProperty("height")]
        public double? Height { get; set; }

        /// <summary>
        /// Captures any additional JSON properties (top, rotation, etc.)
        /// not explicitly mapped, allowing round-trip serialization.
        /// </summary>
        [Newtonsoft.Json.JsonExtensionData]
        public IDictionary<string, object>? ExtensionData { get; set; }
    }

    /// <summary>
    /// Constants for action types recognised by the UpdateAction API.
    /// Keeping these in one place avoids string-literal drift between
    /// controller validation and the strongly-typed switch.
    /// </summary>
    public static class CollaborativeActionTypes
    {
        public const string Annotation = "annotation";
        public const string FormField = "formField";
        public const string FormFieldAction = "formFieldAction";
        public const string PageOrganizer = "pageOrganizer";
    }
}