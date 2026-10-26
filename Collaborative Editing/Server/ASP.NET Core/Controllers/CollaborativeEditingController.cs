using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Syncfusion.Collaboration.Core.Interfaces;
using Syncfusion.Collaboration.Core.Models;
using Syncfusion.Collaboration.Core.Services;
using Syncfusion.Collaboration.Core.Transports;
using PdfViewerCollaborativeEditingServer.Models;
using PdfViewerCollaborativeEditingServer.Services;

namespace PdfViewerCollaborativeEditingServer.Controllers
{
    /// <summary>
    /// Collaborative Editing Controller for PDF Viewer.
    /// Implements version-based state management with Redis backend.
    ///
    /// The UpdateAction endpoint uses strongly typed request models
    /// (<see cref="UpdateActionRequest"/>, <see cref="AnnotationData"/>,
    /// <see cref="FormFieldData"/>, <see cref="FormFieldActionData"/> and
    /// <see cref="PageOrganizerData"/>) rather than <c>JObject</c>, so that
    /// the broadcast payload matches the Node.js collaborative editing
    /// server payload exactly - no extra empty arrays, null values or
    /// unwanted serialized properties.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("AllowAllOrigins")]
    public class CollaborativeEditingController : ControllerBase
    {
        private readonly IActionService _actionService;
        private readonly ICollaborationAdapter _adapter;
        private readonly IActiveTransport _transport;
        private readonly IPdfStorageService _pdfStorageService;
        private readonly ILogger<CollaborativeEditingController> _logger;

        public CollaborativeEditingController(
            IActionService actionService,
            ICollaborationAdapter adapter,
            IActiveTransport transport,
            IPdfStorageService pdfStorageService,
            ILogger<CollaborativeEditingController> logger)
        {
            _actionService = actionService;
            _adapter = adapter;
            _transport = transport;
            _pdfStorageService = pdfStorageService;
            _logger = logger;
        }

        /// <summary>
        /// Import/join a collaboration room - returns current state snapshots.
        /// Returns the latest version of:
        /// - Annotations (XFDF snapshot)
        /// - Form fields (merged from all formField-type actions)
        /// - Page organizer (latest single state)
        /// </summary>
        [HttpPost("ImportFile")]
        public async Task<IActionResult> ImportFile([FromBody] ImportFileRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request?.RoomName))
                {
                    return BadRequest(new { error = "RoomName is required" });
                }

                // Get all pending operations for this room
                var allActions = await _actionService.GetPendingOperationsAsync(
                    request.RoomName, 0, -1);

                // Map to control-specific format for client
                var operations = allActions?
                    .Select(x => _adapter.MapGenericToControlAction(x))
                    .ToList() ?? new List<object>();

                _logger.LogInformation(
                    $"[ImportFile] Room: {request.RoomName}, Operations: {operations.Count}");

                return Ok(new
                {
                    roomName = request.RoomName,
                    version = allActions?.Count ?? 0,
                    operations = operations
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[ImportFile] Error: {ex.Message}");
                return StatusCode(500, new
                {
                    error = "Failed to import file",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Unified API for all collaborative update actions.
        ///
        /// Handles all action types:
        /// - "annotation": XFDF-based annotation changes
        /// - "formField": Single form field value update
        /// - "formFieldAction": Form field creation/update/deletion
        /// - "pageOrganizer": Page order, rotation, etc.
        ///
        /// Each action type is bound to a dedicated strongly-typed
        /// request model. The broadcast payload is reconstructed from
        /// those typed models so it matches the Node.js collaborative
        /// editing server exactly: only the required properties are
        /// included, with null values omitted.
        ///
        /// Flow:
        /// 1. Validate RoomName and Type
        /// 2. Convert type-specific data into the matching strongly typed model
        /// 3. Convert to CollaborationAction via adapter
        /// 4. Store in Redis
        /// 5. Broadcast clean request with strongly-typed data to other clients
        /// </summary>
        [HttpPost("UpdateAction")]
        public async Task<IActionResult> UpdateAction([FromBody] UpdateActionRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { error = "Request body is required" });
                }

                if (string.IsNullOrEmpty(request.RoomName))
                {
                    return BadRequest(new { error = "RoomName is required" });
                }

                if (string.IsNullOrEmpty(request.Type))
                {
                    return BadRequest(new { error = "Type is required" });
                }

                string actionDescription;
                object typedData;
                string logAction;

                // Validate and convert type-specific data into the matching
                // strongly-typed model. Each branch ends with `typedData`
                // pointing at the clean, strongly-typed shape that will be
                // broadcast to other clients.
                switch (request.Type.ToLowerInvariant())
                {
                    case "annotation":
                        {
                            var annotationData = ToTypedModel<AnnotationData>(request.Data);
                            if (annotationData == null || string.IsNullOrEmpty(annotationData.XfdfData))
                            {
                                return BadRequest(new { error = "Data.xfdfData is required for annotation type" });
                            }
                            typedData = annotationData;
                            actionDescription = "Annotation updated";
                            logAction = annotationData.Action ?? "";
                            break;
                        }

                    case "formfield":
                        {
                            var formFieldData = ToTypedModel<FormFieldData>(request.Data);
                            if (formFieldData == null || string.IsNullOrEmpty(formFieldData.JsonData))
                            {
                                return BadRequest(new { error = "Data.jsonData is required for formField type" });
                            }
                            typedData = formFieldData;
                            actionDescription = "Form field updated";
                            logAction = formFieldData.Action ?? "";
                            break;
                        }

                    case "formfieldaction":
                        {
                            var formFieldActionData = ToTypedModel<FormFieldActionData>(request.Data);
                            if (formFieldActionData == null || string.IsNullOrEmpty(formFieldActionData.Changes))
                            {
                                return BadRequest(new { error = "Data.changes is required for formFieldAction type" });
                            }

                            // Validate changes JSON format (Node.js parity).
                            try
                            {
                                var changesJson = formFieldActionData.Changes;
                                if (string.IsNullOrEmpty(changesJson))
                                {
                                    return BadRequest(new { error = "Invalid changes JSON format" });
                                }
                                var changesObj = JToken.Parse(changesJson);
                                if (changesObj == null)
                                {
                                    return BadRequest(new { error = "Invalid changes JSON format" });
                                }
                            }
                            catch (JsonReaderException ex)
                            {
                                return BadRequest(new { error = "Failed to parse changes JSON", details = ex.Message });
                            }

                            typedData = formFieldActionData;
                            actionDescription = "Form field action updated";
                            logAction = formFieldActionData.Action ?? "";
                            break;
                        }

                    case "pageorganizer":
                        {
                            var entries = ExtractPageOrganizerEntries(request.Data);
                            if (entries == null || entries.Count == 0)
                            {
                                return BadRequest(new { error = "Data is required for pageOrganizer type and must contain at least one entry" });
                            }
                            
                            // Wrap the entries in PageOrganizerData for consistent handling
                            var pageOrganizerData = new PageOrganizerData { Data = entries };
                            typedData = JsonConvert.SerializeObject(entries); // Use bare array for broadcast to match Node.js
                            actionDescription = "Page organizer updated";
                            logAction = string.Join(", ",
                                    entries
                                        .Select(e => e.Action)
                                        .Where(a => !string.IsNullOrEmpty(a)));
                            break;
                        }

                    default:
                        return BadRequest(new { error = $"Invalid action type: {request.Type}" });
                }

                _logger.LogInformation(
                    $"ConnectionId: {request.ConnectionId} | RoomName: {request.RoomName} | Data Type: {request.Type} | Action: {logAction}");

                // Convert to CollaborationAction. The adapter needs the
                // strongly-typed envelope to persist and replay correctly.
                var collaborationAction = _adapter.MapControlToGenericAction(BuildEnvelope(request, typedData));

                // Store in Redis
                await _actionService.AddOperationAsync(collaborationAction, _adapter);

                // Build the broadcast envelope using the strongly typed
                // models so the payload matches the Node.js server exactly.
                var broadcastRequest = BuildEnvelope(request, typedData);

                // Broadcast to other clients in room
                // Clients filter via connectionId to ignore their own updates
                if (_transport != null)
                {
                    try
                    {
                        await _transport.SendToGroupAsync(request.RoomName, "action", broadcastRequest);
                    }
                    catch (Exception broadcastError)
                    {
                        _logger.LogWarning($"[UpdateAction] Broadcast error: {broadcastError.Message}");
                        // Continue even if broadcast fails - action is already stored
                    }
                }

                return Ok(new
                {
                    success = true,
                    message = actionDescription,
                    data = typedData
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"[UpdateAction] Error: {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new
                {
                    error = "Failed to update action",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Retrieve a stored PDF document as Base64 encoded content.
        ///
        /// Used by clients to:
        /// - Download finalized collaborative documents
        /// - Verify document state before uploading updates
        /// - Archive document versions
        ///
        /// Query Parameters:
        /// - fileName (optional): PDF file name. Defaults to "document.pdf"
        /// - roomName (optional): Collaboration room identifier. Defaults to "default"
        ///
        /// Response:
        /// {
        ///   "success": true,
        ///   "fileName": "document.pdf",
        ///   "roomName": "room123",
        ///   "content": "JVBERi0xLjQKJeLjz9M...",  // Base64 encoded PDF
        ///   "contentLength": 45234,
        ///   "isDefault": false
        /// }
        ///
        /// If document not found in room storage, returns default PDF with isDefault: true
        /// </summary>
        [HttpGet("GetPDFDocument")]
        public async Task<IActionResult> GetPdfDocument(
            [FromQuery] string? fileName,
            [FromQuery] string? roomName)
        {
            try
            {
                if (_pdfStorageService == null)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        error = "PDF Storage Service not initialized"
                    });
                }

                // Get PDF (with fallback to default)
                var result = await _pdfStorageService.GetPdfAsync(
                    fileName ?? "document.pdf",
                    roomName ?? "default");

                if (!result.Success)
                {
                    return NotFound(new
                    {
                        success = false,
                        error = result.Error,
                        message = result.Message
                    });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"[GetPDFDocument] Error: {ex.Message}");
                return StatusCode(500, new
                {
                    success = false,
                    error = "Failed to retrieve PDF",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Extract page organizer entries from the incoming <c>data</c> field.
        /// The client sends a JSON array of page organizer entries (bare array,
        /// not wrapped in an object). This method handles the array arriving in
        /// various forms: as a JArray, as a JSON-stringified string, or as an
        /// already-deserialized list. All action types are supported:
        /// - rotate: originalPageIndex, targetIndex, rotateAngle
        /// - delete: originalPageIndex (with optional null targetIndex)
        /// - rearrange: originalPageIndex, targetIndex, rotateAngle
        /// - insert: targetIndex, rotateAngle, pageSize
        /// - copy: sourceOriginalPageIndex, targetIndex, rotateAngle, pageSize
        /// Extra fields are preserved via JsonExtensionData for round-trip serialization.
        /// </summary>
        private List<PageOrganizerEntry>? ExtractPageOrganizerEntries(object? data)
        {
            if (data == null)
            {
                return null;
            }

            // Case 1: Already a JArray - deserialize directly
            if (data is JArray jArray)
            {
                try
                {
                    return jArray.ToObject<List<PageOrganizerEntry>>();
                }
                catch (Exception ex)
                {
                    _logger?.LogWarning($"[ExtractPageOrganizerEntries] JArray deserialization failed: {ex.Message}");
                    return null;
                }
            }

            // Case 2: A JSON-stringified array string
            if (data is string dataString && !string.IsNullOrEmpty(dataString))
            {
                try
                {
                    var parsed = JToken.Parse(dataString);
                    if (parsed is JArray parsedArray)
                    {
                        return parsedArray.ToObject<List<PageOrganizerEntry>>();
                    }
                }
                catch (Exception ex)
                {
                    _logger?.LogWarning($"[ExtractPageOrganizerEntries] String parse failed: {ex.Message}");
                    return null;
                }
            }

            // Case 3: A JToken (other than JArray) - try to parse its string representation
            if (data is JToken token)
            {
                try
                {
                    var tokenString = token.ToString();
                    var parsed = JToken.Parse(tokenString);
                    if (parsed is JArray parsedArray)
                    {
                        return parsedArray.ToObject<List<PageOrganizerEntry>>();
                    }
                }
                catch (Exception ex)
                {
                    _logger?.LogWarning($"[ExtractPageOrganizerEntries] JToken parse failed: {ex.Message}");
                    return null;
                }
            }

            // Case 4: Already a typed list - return as-is
            if (data is List<PageOrganizerEntry> entries)
            {
                return entries;
            }

            // Case 5: Last-ditch JSON round-trip for any other object type
            try
            {
                var json = JsonConvert.SerializeObject(data);
                return JsonConvert.DeserializeObject<List<PageOrganizerEntry>>(json);
            }
            catch (Exception ex)
            {
                _logger?.LogWarning($"[ExtractPageOrganizerEntries] JSON round-trip failed: {ex.Message}");
                return null;
            }
        }

        /// <summary>
        /// Convert the loose <c>Data</c> field on the incoming request into
        /// the strongly-typed model. Supports the three shapes the wire can
        /// legitimately arrive in: an already-deserialised typed instance,
        /// a <see cref="JToken"/> (Newtonsoft's intermediate form), or a
        /// raw object that needs a round-trip through JSON. Used for all
        /// four action types (<c>annotation</c>, <c>formField</c>,
        /// <c>formFieldAction</c>, <c>pageOrganizer</c>) so the
        /// deserialization path is identical.
        /// </summary>
        private static T? ToTypedModel<T>(object? data) where T : class
        {
            if (data == null)
            {
                return null;
            }

            if (data is T typed)
            {
                return typed;
            }

            if (data is JToken token)
            {
                return token.ToObject<T>();
            }

            // Fall back to a JSON round-trip - keeps backward compatibility
            // for any caller that has somehow passed a raw object.
            return JsonConvert.DeserializeObject<T>(JsonConvert.SerializeObject(data));
        }

        /// <summary>
        /// Build a clean broadcast envelope from the strongly typed
        /// models. Only the values needed for the broadcast are
        /// populated; null values are dropped during JSON serialization
        /// because the request model uses <c>NullValueHandling.Ignore</c>.
        /// </summary>
        private static UpdateActionRequest BuildEnvelope(UpdateActionRequest source, object typedData)
        {
            return new UpdateActionRequest
            {
                RoomName = source.RoomName,
                ConnectionId = source.ConnectionId,
                UserName = source.UserName,
                Type = source.Type,
                CurrentVersion = source.CurrentVersion,
                Data = typedData
            };
        }
    }

    /// <summary>
    /// Request model for ImportFile endpoint.
    /// </summary>
    public class ImportFileRequest
    {
        public string? RoomName { get; set; }
        public string? FileName { get; set; }
        public string? UserName { get; set; }
        public string? ConnectionId { get; set; }
    }
}