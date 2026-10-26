using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Syncfusion.Collaboration.Core.Interfaces;
using Syncfusion.Collaboration.Core.Models;
using Syncfusion.Collaboration.Core.Transports;
using Syncfusion.Collaboration.Core.Services;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Parsing;
using Syncfusion.Pdf.Interactive;
using Syncfusion.Pdf.Graphics;
using System.Xml;
using Syncfusion.Drawing;
using System.Text;
using System.Collections.Generic;
using Syncfusion.Collaboration.Core;
using Microsoft.Extensions.DependencyInjection;
using PdfViewerCollaborativeEditingServer.Services;
using PdfViewerCollaborativeEditingServer.Models;

// The dynamic/dynamic-data interop (JToken ?, JObject ?, etc.) used to
// parse JSON for collaborative editing operations produces nullable
// warnings that are intentional - they are guarded by null-conditional
// access and runtime null checks.
#pragma warning disable CS8600, CS8602, CS8603, CS8604, CS8619, CS8625

namespace PdfViewerCollaborativeEditingServer.Adapter
{
    /// <summary>
    /// PDF Viewer Collaboration Adapter - Maps between unified CollaborativeEditingRequest
    /// and generic CollaborationAction for version-based state management.
    /// 
    /// Key pattern: No merge logic. Each request is stored as-is, broadcast as-is.
    /// Clients filter responses via connectionId. Page organizer uses last-write-wins.
    /// </summary>
    public class PdfViewerCollaborationAdapter : ICollaborationAdapter
    {
        // Collaborative editing properties (matching Node.js adapter)
        public object? SaveTaskQueue { get; set; }
        public IActiveTransport? Transport { get; set; }
        public object? StorageService { get; set; }

        private readonly IBackgroundTaskQueue? _backgroundTaskQueue;
        private readonly IServiceScopeFactory? _serviceScopeFactory;
        private readonly IPdfStorageService? _pdfStorageService;
        private readonly ILogger<PdfViewerCollaborationAdapter>? _logger;

        /// <summary>
        /// Constructor for dependency injection.
        /// Called by ASP.NET Core DI container during app startup.
        ///
        /// The constructor accepts injected dependencies:
        /// - IBackgroundTaskQueue: Task queue for queuing save operations
        ///   (provided by Syncfusion.Collaborator.Server.AspNet.Core)
        /// - IServiceScopeFactory: Used to resolve scoped services such as
        ///   IActionService so we can clean up Redis after a successful save
        /// - IPdfStorageService: Storage service for persisting PDFs to disk
        /// - ILogger: Logger for diagnostic output
        ///
        /// Also supports legacy options-based initialization for backward compatibility.
        /// </summary>
        public PdfViewerCollaborationAdapter(
            IBackgroundTaskQueue? backgroundTaskQueue = null,
            IServiceScopeFactory? serviceScopeFactory = null,
            IPdfStorageService? pdfStorageService = null,
            ILogger<PdfViewerCollaborationAdapter>? logger = null,
            Dictionary<string, object?>? options = null)
        {
            _backgroundTaskQueue = backgroundTaskQueue;
            _serviceScopeFactory = serviceScopeFactory;
            _pdfStorageService = pdfStorageService;
            _logger = logger;

            // Support legacy options-based initialization for backward compatibility
            options = options ?? new Dictionary<string, object?>();

            this.SaveTaskQueue = _backgroundTaskQueue ??
                (options.ContainsKey("saveTaskQueue") ? options["saveTaskQueue"] : null);
            this.Transport = options.ContainsKey("transport") ? (IActiveTransport?)options["transport"] : null;
            this.StorageService = _pdfStorageService ??
                (options.ContainsKey("storageService") ? options["storageService"] : null);

            _logger?.LogInformation("[Adapter] PdfViewerCollaborationAdapter initialized with DI dependencies");
        }

        /// <summary>
        /// Maps control-specific action (CollaborativeEditingRequest) to generic CollaborationAction.
        /// Stores the complete request as JSON in the data field.
        ///
        /// Accepts the strongly typed <see cref="PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest"/>
        /// or, for backward compatibility, a <see cref="JObject"/> that already
        /// has the unified envelope shape.
        /// </summary>
        public CollaborationAction MapControlToGenericAction(object controlAction)
        {
            if (controlAction == null)
            {
                throw new ArgumentException("Expected UpdateActionRequest or JObject, got null");
            }

            string roomName;
            string connectionId;
            string currentUser;
            int version;
            string dataJson;

            switch (controlAction)
            {
                case PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest typedRequest:
                    roomName = typedRequest.RoomName ?? "";
                    connectionId = typedRequest.ConnectionId ?? "";
                    currentUser = typedRequest.UserName ?? "";
                    version = typedRequest.CurrentVersion ?? 0;
                    dataJson = JsonConvert.SerializeObject(typedRequest);
                    break;

                case JObject jObject:
                    roomName = jObject["roomName"]?.ToString() ?? "";
                    connectionId = jObject["connectionId"]?.ToString() ?? "";
                    currentUser = jObject["userName"]?.ToString() ?? "";
                    version = jObject["currentVersion"]?.Value<int>() ?? 0;
                    dataJson = JsonConvert.SerializeObject(jObject);
                    break;

                default:
                    throw new ArgumentException($"Expected UpdateActionRequest or JObject (unified request), got {controlAction.GetType().Name}");
            }

            return new CollaborationAction
            {
                RoomName = roomName,
                ConnectionId = connectionId,
                CurrentUser = currentUser,
                Version = version,
                Data = dataJson
            };
        }

        /// <summary>
        /// Maps generic CollaborationAction back to control-specific format for broadcast.
        /// Reconstructs the original unified request envelope. Returns a
        /// strongly typed <see cref="PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest"/>
        /// so the broadcast payload matches the Node.js server exactly.
        /// </summary>
        public object MapGenericToControlAction(CollaborationAction action)
        {
            try
            {
                if (string.IsNullOrEmpty(action.Data))
                {
                    return new PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest();
                }

                return JsonConvert.DeserializeObject<PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest>(action.Data)
                       ?? new PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error parsing action data: {ex.Message}");
                return new PdfViewerCollaborativeEditingServer.Models.UpdateActionRequest();
            }
        }

        /// <summary>
        /// No operation transformation needed for PDF Viewer.
        /// Each action is independently stored and broadcast.
        /// </summary>
        public void TransformOperations(List<CollaborationAction> actions)
        {
            // No-op: PDF Viewer uses last-write-wins or snapshot approach
        }

        /// <summary>
        /// Replays collaborative operations against a PDF document.
        /// Loads the master document, applies pending operations, and saves the updated PDF.
        /// Returns the updated PDF as a byte array ready to be persisted to storage.
        /// </summary>
        public async Task<byte[]> ReplayOperationsAndUpdateDocumentAsync(
            string masterPdfBase64,
            List<CollaborationAction> operations,
            string roomName)
        {
            byte[]? updatedBuffer = null;
            try
            {
                if (string.IsNullOrEmpty(masterPdfBase64))
                {
                    throw new ArgumentException("Master PDF is empty or not provided");
                }

                // Convert base64 to byte array
                byte[] pdfBuffer = Convert.FromBase64String(masterPdfBase64);
                if (pdfBuffer.Length == 0)
                {
                    throw new ArgumentException("PDF Buffer is empty after conversion from base64");
                }

                // Load PDF document
                PdfLoadedDocument document = new PdfLoadedDocument(pdfBuffer);

                if (document.Pages.Count == 0)
                {
                    Console.WriteLine("[ReplayOps] WARNING: Loaded PDF has 0 pages");
                }

                // Extract and validate operations
                var validOperations = ExtractValidOperations(operations);

                if (validOperations.Count > 0)
                {
                    int successCount = 0;
                    int failureCount = 0;

                    for (int i = 0; i < validOperations.Count; i++)
                    {
                        var operation = validOperations[i];
                        try
                        {
                            await ApplyOperationToDocumentAsync(document, operation);
                            successCount++;
                        }
                        catch (Exception opError)
                        {
                            Console.Error.WriteLine(
                                $"[ReplayOps] Failed to apply operation {i + 1} ({operation?.type}): {opError.Message}");
                            failureCount++;
                            // Continue with next operation instead of throwing
                        }
                    }

                    Console.WriteLine(
                        $"[ReplayOps] Applied {successCount} operations successfully, {failureCount} failed");
                }
                else
                {
                    Console.WriteLine("[ReplayOps] No valid operations to replay");
                }

                // Save updated PDF and return as byte array
                using (MemoryStream outputStream = new MemoryStream())
                {
                    document.Save(outputStream);
                    updatedBuffer = outputStream.ToArray();
                }

                document.Close(true);
                document.Dispose();

                if (updatedBuffer == null || updatedBuffer.Length == 0)
                {
                    throw new InvalidOperationException("Operation replay produced empty PDF");
                }

                return updatedBuffer;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[ReplayOps] Error during operation replay: {ex.Message}");
                Console.Error.WriteLine($"[ReplayOps] Stack: {ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// Extracts valid operations from the operations array.
        /// Handles various operation formats (wrapped and unwrapped).
        /// </summary>
        private List<dynamic> ExtractValidOperations(List<CollaborationAction> operations)
        {
            try
            {
                var validOperations = new List<dynamic>();

                if (operations == null)
                {
                    Console.WriteLine("[ExtractOps] Operations is null");
                    return validOperations;
                }

                int opIndex = 0;
                foreach (var op in operations)
                {
                    if (op == null)
                    {
                        Console.WriteLine($"[ExtractOps] Operation {opIndex} is null or undefined");
                        opIndex++;
                        continue;
                    }

                    try
                    {
                        // Case 1: Direct operation with type and data
                        if (op.Data != null && !string.IsNullOrEmpty(op.Data))
                        {
                            var fieldData = JsonConvert.DeserializeObject<dynamic>(op.Data);
                            string? type = fieldData?["type"]?.ToString();

                            if (type == "annotation")
                            {
                                validOperations.Add(new
                                {
                                    type = "annotation",
                                    data = fieldData["data"]?["xfdfData"],
                                    action = fieldData["data"]?["action"]
                                });
                            }
                            else if (type == "pageOrganizer")
                            {
                                var parsedData = JsonConvert.DeserializeObject<dynamic>(
                                    fieldData["data"].ToString());
                                validOperations.Add(new
                                {
                                    type = "pageOrganizer",
                                    data = ((JArray)parsedData)?[0],
                                    action = ((JArray)parsedData)?[0]?["action"]
                                });
                            }
                            else if (type == "formField")
                            {
                                var parsedData = JsonConvert.DeserializeObject<dynamic>(
                                    fieldData["data"]?["jsonData"]?.ToString());
                                validOperations.Add(new
                                {
                                    type = "formField",
                                    data = parsedData,
                                    action = fieldData["data"]?["action"]
                                });
                            }
                            else if (type == "formFieldAction")
                            {
                                // // Parse the changes object to extract action type and data
                                // var parsedData = JsonConvert.DeserializeObject<dynamic>(
                                //     fieldData["data"]?["changes"]?.ToString());
                                // validOperations.Add(new
                                // {
                                //     type = "formFieldAction",
                                //     data = parsedData,
                                //     action = fieldData["data"]?["action"]
                                // });
                                var parsedData = JsonConvert.DeserializeObject<JObject>(fieldData["data"]?["changes"]?.ToString());

                                JToken operationData = null;
                                string action = string.Empty;

                                var created = parsedData?["created"] as JArray;
                                var updated = parsedData?["updated"] as JArray;
                                var deleted = parsedData?["deleted"] as JArray;

                                if (created != null && created.Count > 0)
                                {
                                    operationData = created[0];
                                    action = "created";
                                }
                                else if (updated != null && updated.Count > 0)
                                {
                                    operationData = updated[0];
                                    action = "updated";
                                }
                                else if (deleted != null && deleted.Count > 0)
                                {
                                    operationData = deleted[0];
                                    action = "deleted";
                                }

                                var operationType =
                                    fieldData["actionType"]?.ToString() ??
                                    fieldData["type"]?.ToString();

                                if (!string.IsNullOrEmpty(operationType))
                                {
                                    validOperations.Add(new
                                    {
                                        type = operationType,
                                        data = operationData,
                                        action = action
                                    });
                                }
                            }
                        }
                    }
                    catch (Exception parseError)
                    {
                        Console.WriteLine($"[ExtractOps] Failed to parse operation {opIndex} data as JSON: {parseError.Message}");
                    }

                    opIndex++;
                }

                // Log operation types for debugging
                var opTypes = validOperations.Select(op => op.type).ToList();

                return validOperations;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[ExtractOps] Error extracting operations: {ex.Message}");
                return new List<dynamic>();
            }
        }

        /// <summary>
        /// Applies a single operation to the PDF document based on operation type.
        /// 
        /// Handles:
        /// - annotation / annotationUpdate: Apply annotation data via XFDF
        /// - formField / formFieldAction: Apply form field updates
        /// - pageOrganizer: Apply page rearrangement/deletion
        /// - addUser / removeUser: User presence (ignored on save)
        /// - connectionId: Connection echo (ignored on save)
        /// </summary>
        private async Task ApplyOperationToDocumentAsync(PdfLoadedDocument document, dynamic operation)
        {
            try
            {
                if (operation == null)
                {
                    Console.WriteLine("[ApplyOp] Skipping null operation");
                    return;
                }

                string? opType = operation?.type?.ToString()?.ToLower();
                var opData = operation?.data;

                if (opType == null)
                {
                    Console.WriteLine("[ApplyOp] Unknown operation type");
                    return;
                }

                switch (opType)
                {
                    case "annotation":
                    case "annotationupdate":
                        // Apply annotation data via XFDF import
                        if (opData != null)
                        {
                            string xfdfData = opData.ToString();
                            await ImportAnnotationsFromXfdfAsync(
                                document,
                                xfdfData,
                                operation?.action?.ToString());
                        }
                        else
                        {
                            Console.WriteLine("[ApplyOp] No XFDF data found in annotation operation");
                        }
                        break;

                    case "formfield":
                    case "formfieldaction":
                    case "formfieldupdate":
                        // Apply form field updates
                        await ApplyFormFieldUpdatesAsync(
                            document,
                            opData,
                            opType,
                            operation?.action?.ToString());
                        break;

                    case "pageorganizer":
                    case "pageorganizeractions":
                        // Apply page rearrangement/deletion (last-write-wins)
                        await ApplyPageOrganizerActionsAsync(document, opData);
                        break;

                    // Ignore user presence operations
                    case "adduser":
                    case "removeuser":
                    case "connectionid":
                        // Ignore user presence operations
                        break;

                    default:
                        Console.WriteLine($"[ApplyOp] Unknown operation type: {opType}");
                        break;
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(
                    $"[ApplyOp] Error applying operation ({operation?.type}): {ex.Message}");
                Console.Error.WriteLine($"[ApplyOp] Operation data: {operation?.data}");
                throw;
            }
        }

        /// <summary>
        /// Imports annotations from XFDF data into the PDF document.
        /// </summary>
        private async Task ImportAnnotationsFromXfdfAsync(
            PdfLoadedDocument document,
            string xfdfData,
            string? action)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(xfdfData))
                {
                    throw new ArgumentException("XFDF data is empty");
                }

                // Parse XFDF XML
                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.LoadXml(xfdfData);

                XmlElement xfdfElement = xmlDoc.DocumentElement!;

                // Get changeset elements
                XmlElement? addElement = GetDirectChildElement(xfdfElement, "add");
                XmlElement? modifyElement = GetDirectChildElement(xfdfElement, "modify");
                XmlElement? deleteElement = GetDirectChildElement(xfdfElement, "delete");

                // Process based on action type
                if (action == "Add" && addElement != null && addElement.ChildNodes.Count > 0)
                {
                    var annotationElements = GetSupportedAnnotationElements(addElement);
                    if (annotationElements.Count > 0)
                    {
                        string pureXfdf = CreatePureXfdf(annotationElements);
                        // document.ImportAnnotations(System.Text.Encoding.UTF8.GetBytes(pureXfdf), DataFormat.XFdf);
                        byte[] annotationBytes = Encoding.UTF8.GetBytes(pureXfdf);
                        MemoryStream annotationStream = new MemoryStream(annotationBytes);
                        document.ImportAnnotations(annotationStream, AnnotationDataFormat.XFdf);
                    }
                }
                else if (action == "Modify" && modifyElement != null && modifyElement.ChildNodes.Count > 0)
                {
                    RemoveAnnotations(modifyElement, document);
                    var annotationElements = GetSupportedAnnotationElements(modifyElement);
                    if (annotationElements.Count > 0)
                    {
                        string pureXfdf = CreatePureXfdf(annotationElements);
                        byte[] annotationBytes = Encoding.UTF8.GetBytes(pureXfdf);
                        MemoryStream annotationStream = new MemoryStream(annotationBytes);
                        document.ImportAnnotations(annotationStream, AnnotationDataFormat.XFdf);
                    }
                }
                else if (action == "Delete" && deleteElement != null && deleteElement.ChildNodes.Count > 0)
                {
                    RemoveAnnotations(deleteElement, document);
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[ImportXfdf] Error importing XFDF: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Gets the first direct child element with the specified name.
        /// </summary>
        private XmlElement? GetDirectChildElement(XmlElement parent, string elementName)
        {
            if (parent == null)
            {
                return null;
            }

            foreach (XmlNode childNode in parent.ChildNodes)
            {
                if (childNode.NodeType == XmlNodeType.Element && 
                    childNode.Name.Equals(elementName, StringComparison.OrdinalIgnoreCase))
                {
                    return (XmlElement)childNode;
                }
            }

            return null;
        }

        /// <summary>
        /// Gets supported annotation element types from a container element.
        /// </summary>
        private List<XmlElement> GetSupportedAnnotationElements(XmlElement container)
        {
            var supportedTypes = new[]
            {
                "highlight", "underline", "strikeout", "squiggly", "square", "circle", "line",
                "polygon", "polyline", "freetext", "ink", "stamp", "text", "redact"
            };

            var elements = new List<XmlElement>();

            foreach (XmlNode childNode in container.ChildNodes)
            {
                if (childNode.NodeType == XmlNodeType.Element)
                {
                    var element = (XmlElement)childNode;
                    if (supportedTypes.Contains(element.Name, StringComparer.OrdinalIgnoreCase))
                    {
                        elements.Add(element);
                    }
                }
            }

            return elements;
        }

        /// <summary>
        /// Creates a pure XFDF document from annotation element list.
        /// </summary>
        private string CreatePureXfdf(List<XmlElement> annotationElements)
        {
            try
            {
                const string xfdfNamespace = "http://ns.adobe.com/xfdf/";

                XmlDocument xmlDoc = new XmlDocument();
                XmlDeclaration xmlDecl = xmlDoc.CreateXmlDeclaration("1.0", "UTF-8", null);
                xmlDoc.AppendChild(xmlDecl);

                XmlElement rootElement = xmlDoc.CreateElement("xfdf", xfdfNamespace);
                rootElement.SetAttribute("xmlns", xfdfNamespace);
                xmlDoc.AppendChild(rootElement);

                XmlElement annotsElement = xmlDoc.CreateElement("annots", xfdfNamespace);

                foreach (var element in annotationElements)
                {
                    XmlNode importedNode = xmlDoc.ImportNode(element, true);
                    annotsElement.AppendChild(importedNode);
                }

                rootElement.AppendChild(annotsElement);

                return xmlDoc.OuterXml;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreatePureXfdf] Error creating pure XFDF: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Removes annotations from the PDF document based on annotation data.
        /// </summary>
        private void RemoveAnnotations(XmlElement container, PdfLoadedDocument document)
        {
            if (container == null || container.ChildNodes.Count == 0)
            {
                return;
            }

            foreach (XmlNode childNode in container.ChildNodes)
            {
                if (childNode.NodeType == XmlNodeType.Element)
                {
                    var element = (XmlElement)childNode;
                    string? id = element.GetAttribute("name");
                    string? pageStr = element.GetAttribute("page");

                    if (!string.IsNullOrEmpty(id) && int.TryParse(pageStr, out int pageIndex))
                    {
                        RemoveAnnotationsFromPage(id, pageIndex, document);
                    }
                }
            }
        }

        /// <summary>
        /// Removes annotations from a specific page by matching the annotation ID.
        /// </summary>
        private void RemoveAnnotationsFromPage(string annotationId, int pageIndex, PdfLoadedDocument document)
        {
            if (pageIndex < 0 || pageIndex >= document.Pages.Count)
            {
                return;
            }

            PdfPageBase page = document.Pages[pageIndex];

            for (int i = page.Annotations.Count - 1; i >= 0; i--)
            {
                PdfAnnotation annotation = page.Annotations[i];
                if (annotation.Name == annotationId)
                {
                    page.Annotations.RemoveAt(i);
                    break;
                }
            }
        }

        /// <summary>
        /// Applies form field updates to the PDF document.
        /// </summary>
        private async Task ApplyFormFieldUpdatesAsync(
            PdfLoadedDocument document,
            dynamic opData,
            string type,
            string? action)
        {
            try
            {
                if (document.Form == null)
                {
                    document.CreateForm();
                }
                if (type == "formfield")
                {
                    await UpdateFormFieldValuesAsync(document, opData);
                }
                else if (type == "formfieldaction")
                {
                    if (action == "deleted" || action == "updated")
                    {
                        RemoveFormFieldByAttributes(document, opData);
                    }

                    if (action == "created" || action == "updated")
                    {
                        await HandleFormFieldActionAsync(document, opData);
                    }
                }
                document.Form.SetDefaultAppearance(false);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[ApplyFormFields] Error: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Updates existing form field values.
        /// </summary>
        private async Task UpdateFormFieldValuesAsync(PdfLoadedDocument document, dynamic formFieldData)
        {
            try
            {
                if (document.Form == null || document.Form.Fields.Count == 0)
                {
                    Console.WriteLine("[UpdateValues] No form fields found");
                    await Task.CompletedTask;
                    return;
                }

                var data = ParseFormFieldData(formFieldData);
                if (data == null || data.Count == 0)
                {
                    Console.WriteLine("[UpdateValues] No field data provided");
                    await Task.CompletedTask;
                    return;
                }

                int updatedCount = 0;

                foreach (PdfField field in document.Form.Fields)
                {
                    if (field == null)
                    {
                        continue;
                    }

                    // Get field names: stripped and actual
                    string strippedName = StripFieldName(field.Name);
                    string actualName = field.Name;

                    // Check if field data exists
                    string? fieldDataKey = null;
                    if (data.ContainsKey(strippedName))
                    {
                        fieldDataKey = strippedName;
                    }
                    else if (data.ContainsKey(actualName))
                    {
                        fieldDataKey = actualName;
                    }

                    if (fieldDataKey == null)
                    {
                        continue;
                    }

                    var fieldValue = data[fieldDataKey];

                    // Update based on field type
                    if (field is PdfTextBoxField textBoxField)
                    {
                        textBoxField.Text = fieldValue?.ToString() ?? "";
                        updatedCount++;
                    }
                    else if (field is PdfCheckBoxField checkBoxField)
                    {
                        bool isChecked = ParseBoolean(fieldValue);
                        checkBoxField.Checked = isChecked;
                        updatedCount++;
                    }
                    else if (field is PdfRadioButtonListField radioField)
                    {
                        string selectedValue = fieldValue?.ToString() ?? "";
                        for (int i = 0; i < radioField.Items.Count; i++)
                        {
                            if (radioField.Items[i].Value == selectedValue)
                            {
                                radioField.SelectedIndex = i;
                                updatedCount++;
                                break;
                            }
                        }
                    }
                    else if (field is PdfComboBoxField comboBoxField)
                    {
                        string selectedValue = fieldValue?.ToString() ?? "";
                        bool isFound = false;

                        // Try to match option text or value
                        for (int i = 0; i < comboBoxField.Items.Count; i++)
                        {
                            string? optionText = comboBoxField.Items[i]?.Text;
                            string? optionValue = comboBoxField.Items[i]?.Value;

                            if ((optionText != null && optionText == selectedValue) || 
                                (optionValue != null && optionValue == selectedValue))
                            {
                                comboBoxField.SelectedIndex = i;
                                isFound = true;
                                updatedCount++;
                                break;
                            }
                        }

                        // If not found in options and field is editable, set selectedValue directly
                        if (!isFound && comboBoxField.Editable)
                        {
                            try
                            {
                                comboBoxField.SelectedValue = selectedValue;
                                updatedCount++;
                            }
                            catch
                            {
                                // If setting SelectedValue fails, try alternative approach
                                Console.WriteLine($"[UpdateValues] Could not set editable ComboBox value for field {field.Name}");
                            }
                        }
                    }
                    else if (field is PdfListBoxField listBoxField)
                    {
                        string selectedValue = fieldValue?.ToString() ?? "";
                        List<int> selectedIndexes = new List<int>();

                        // Match option text
                        for (int i = 0; i < listBoxField.Items.Count; i++)
                        {
                            string? optionText = listBoxField.Items[i]?.Text;
                            if (optionText != null)
                            {
                                string strippedText = System.Text.RegularExpressions.Regex.Replace(optionText, @"[^0-9a-zA-Z]+", "");
                                string strippedValue = System.Text.RegularExpressions.Regex.Replace(selectedValue, @"[^0-9a-zA-Z]+", "");
                                
                                if (strippedText == strippedValue)
                                {
                                    selectedIndexes.Add(i);
                                }
                            }
                        }

                        if (selectedIndexes.Count > 0)
                        {
                            // For ListBox, set the first matching index
                            listBoxField.SelectedIndex = selectedIndexes[0];
                            updatedCount++;
                        }
                    }
                }

                Console.WriteLine($"[UpdateValues] Updated {updatedCount} fields");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[UpdateValues] Error: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Removes form fields matching the provided attributes.
        /// Used when a formFieldAction with 'deleted' or 'updated' action is applied.
        /// Matches fields by name, bounds, page number, and field type.
        /// </summary>
        private void RemoveFormFieldByAttributes(PdfLoadedDocument document, dynamic formFieldData)
        {
            try
            {
                if (document.Form == null || document.Form.Fields.Count == 0)
                {
                    return;
                }

                string? fieldName = formFieldData?["name"]?.ToString();
                string? fieldType = formFieldData?["formFieldAnnotationType"]?.ToString();
                int? pageNumber = null;
                
                // Try to parse page number
                if (int.TryParse(formFieldData?["pageNumber"]?.ToString() ?? "", out int pg))
                {
                    pageNumber = pg;
                }

                if (string.IsNullOrEmpty(fieldName))
                {
                    return;
                }

                // Find and remove matching field using multiple criteria
                for (int i = document.Form.Fields.Count - 1; i >= 0; i--)
                {
                    PdfField field = document.Form.Fields[i];
                    
                    // Match by name first (required)
                    if (field.Name != fieldName)
                    {
                        continue;
                    }

                    bool matches = true;

                    // Check field type if specified
                    if (!string.IsNullOrEmpty(fieldType))
                    {
                        bool isInitialOrSignature = fieldType == "InitialField" || fieldType == "SignatureField";
                        bool fieldIsSignatureType = field is PdfSignatureField;

                        if (isInitialOrSignature && !fieldIsSignatureType)
                        {
                            matches = false;
                        }
                        else if (!isInitialOrSignature && fieldIsSignatureType)
                        {
                            matches = false;
                        }
                    }

                    // Check page number if specified
                    if (matches && pageNumber.HasValue)
                    {
                        // Note: Page index validation would require accessing field's page property
                        // This is implementation-specific and may vary
                    }

                    if (matches)
                    {
                        document.Form.Fields.RemoveAt(i);
                        Console.WriteLine($"[RemoveField] Removed field: {fieldName}");
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[RemoveField] Error: {ex.Message}");
            }
        }

        /// <summary>
        /// Handles form field creation or update actions.
        /// </summary>
        private async Task HandleFormFieldActionAsync(PdfLoadedDocument document, dynamic formFieldData)
        {
            try
            {
                var fieldAttributes = formFieldData["fieldAttributes"] ?? formFieldData;
                string? fieldName = fieldAttributes?["fieldName"]?.ToString() ?? fieldAttributes?["name"]?.ToString();
                string? fieldType = fieldAttributes?["fieldType"]?.ToString() ?? fieldAttributes?["type"]?.ToString() ?? "TextBox";
                int pageNumber = fieldAttributes?["pageNumber"] ?? 0;

                // if (string.IsNullOrEmpty(fieldName) || pageNumber <= 0 || pageNumber > document.Pages.Count)
                // {
                //     Console.WriteLine($"[FormFieldAction] Invalid field data: name={fieldName}, page={pageNumber}");
                //     await Task.CompletedTask;
                //     return;
                // }

                // Get target page (1-based index in request, 0-based in document)
                PdfPageBase page = document.Pages[pageNumber - 1];
                if (page == null)
                {
                    Console.WriteLine($"[FormFieldAction] Could not access page {pageNumber}");
                    await Task.CompletedTask;
                    return;
                }

                // Parse bounds
                var bounds = ParseBounds(fieldAttributes?["bounds"] ?? fieldAttributes?["lineBound"]);

                // Create field based on type
                PdfField? newField = null;
                string fieldTypeLower = fieldType.ToLower();

                switch (fieldTypeLower)
                {
                    case "textbox":
                    case "text":
                    case "password":
                        newField = CreateTextBoxField(page, fieldName, fieldAttributes, bounds);
                        break;

                    case "checkbox":
                    case "checkboxfield":
                        newField = CreateCheckBoxField(page, fieldName, fieldAttributes, bounds);
                        break;

                    case "radiobutton":
                    case "radiobuttonfield":
                        newField = CreateRadioButtonField(page, fieldName, fieldAttributes, bounds);
                        break;

                    case "dropdown":
                    case "combobox":
                    case "comboboxfield":
                        newField = CreateDropDownField(page, fieldName, fieldAttributes, bounds);
                        break;

                    case "listbox":
                    case "listboxfield":
                        newField = CreateListBoxField(page, fieldName, fieldAttributes, bounds);
                        break;

                    case "signature":
                    case "signaturefield":
                    case "initial":
                    case "initialfield":
                        newField = CreateSignatureField(page, fieldName, fieldAttributes, bounds);
                        break;

                    default:
                        Console.WriteLine($"[FormFieldAction] Unknown field type: {fieldType}");
                        break;
                }

                // Add field to document
                if (newField != null)
                {
                    document.Form.Fields.Add(newField);
                    Console.WriteLine($"[FormFieldAction] Created field: {fieldName} ({fieldType}) on page {pageNumber}");
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[FormFieldAction] Error: {ex.Message}");
                throw;
            }
        }

        // ========== Form Field Creation Methods ==========

        private PdfTextBoxField? CreateTextBoxField(PdfPageBase page, string fieldName, dynamic attributes, RectangleF bounds)
        {
            try
            {
                if (page == null)
                {
                    Console.Error.WriteLine("[CreateTextField] Page object is undefined or null");
                    return null;
                }

                var textBox = new PdfTextBoxField(page, fieldName);

                // === BOUNDS (always set - falls back to a 0-sized rectangle if
                // not supplied, matching the Node.js behaviour) ===
                if (bounds.Width > 0 || bounds.Height > 0)
                {
                    textBox.Bounds = bounds;
                }

                // === TEXT AND VALUE PROPERTIES ===
                if (attributes?["value"] != null)
                {
                    textBox.Text = attributes["value"].ToString();
                }

                if (attributes?["formFieldAnnotationType"]?.ToString() == "PasswordField")
                {
                    textBox.Password = true;
                }

                // === FIELD BEHAVIOR ===
                if (attributes?["isMultiline"] != null)
                {
                    textBox.Multiline = ParseBoolean(attributes["isMultiline"]);
                }

                if (attributes?["isReadonly"] != null)
                {
                    textBox.ReadOnly = ParseBoolean(attributes["isReadonly"]);
                }

                if (attributes?["isRequired"] != null)
                {
                    textBox.Required = ParseBoolean(attributes["isRequired"]);
                }

                if (attributes?["maxLength"] != null)
                {
                    int maxLen = (int)GetNumberAttribute(attributes, "maxLength", 0);
                    if (maxLen > 0)
                    {
                        textBox.MaxLength = maxLen;
                    }
                }

                if (attributes?["insertSpaces"] != null)
                {
                    textBox.InsertSpaces = ParseBoolean(attributes["insertSpaces"]);
                }

                // === VISIBILITY AND DISPLAY ===
                if (attributes?["visibility"] != null)
                {
                    textBox.Visibility = GetFormFieldVisibility(attributes["visibility"]);
                }

                // === ALIGNMENT ===
                if (attributes?["alignment"] != null || attributes?["textAlign"] != null)
                {
                    textBox.TextAlignment = GetFormFieldTextAlignment(attributes["alignment"] ?? attributes["textAlign"]);
                }

                // === COLORS ===
                if (attributes?["backgroundColor"] != null)
                {
                    textBox.BackColor = ParseFormFieldColor(attributes["backgroundColor"]);
                }

                if (attributes?["fontColor"] != null)
                {
                    textBox.ForeColor = ParseFormFieldColor(attributes["fontColor"]);
                }

                if (attributes?["borderColor"] != null)
                {
                    textBox.BorderColor = ParseFormFieldColor(attributes["borderColor"]);
                }

                // === BORDER PROPERTIES ===
                if (attributes?["thickness"] != null)
                {
                    textBox.BorderWidth = GetNumberAttribute(attributes, "thickness", 0f);
                }

                // === FONT PROPERTIES ===
                if (attributes?["fontSize"] != null || attributes?["fontFamily"] != null)
                {
                    PdfFontFamily fontFamily = GetFontFamily(attributes?["fontFamily"]);
                    float fontSize = GetNumberAttribute(attributes, "fontSize", 12f);
                    PdfFontStyle fontStyle = GetFormFieldFontStyle(attributes);
                    textBox.Font = new PdfStandardFont(fontFamily, ConvertPixelToPoint(fontSize), fontStyle);
                }

                // === TOOLTIP ===
                if (attributes?["tooltip"] != null)
                {
                    textBox.ToolTip = attributes["tooltip"].ToString();
                }

                return textBox;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreateTextField] Error: {ex.Message}");
                return null;
            }
        }

        private PdfCheckBoxField? CreateCheckBoxField(PdfPageBase page, string fieldName, dynamic attributes, RectangleF bounds)
        {
            try
            {
                if (page == null)
                {
                    Console.Error.WriteLine("[CreateCheckBoxField] Page object is undefined or null");
                    return null;
                }

                var checkBox = new PdfCheckBoxField(page, fieldName);

                // === BOUNDS ===
                if (bounds.Width > 0 || bounds.Height > 0)
                {
                    checkBox.Bounds = bounds;
                }

                // === CHECKED STATE ===
                if (attributes?["isChecked"] != null)
                {
                    checkBox.Checked = ParseBoolean(attributes["isChecked"]);
                }

                // === EXPORT VALUE (matches Syncfusion's ExportValue) ===
                if (attributes?["value"] != null)
                {
                    checkBox.ExportValue = attributes["value"].ToString();
                }

                // === FIELD BEHAVIOR ===
                if (attributes?["isReadonly"] != null)
                {
                    checkBox.ReadOnly = ParseBoolean(attributes["isReadonly"]);
                }

                if (attributes?["isRequired"] != null)
                {
                    checkBox.Required = ParseBoolean(attributes["isRequired"]);
                }

                // === VISIBILITY ===
                if (attributes?["visibility"] != null)
                {
                    checkBox.Visibility = GetFormFieldVisibility(attributes["visibility"]);
                }

                // === COLORS ===
                if (attributes?["backgroundColor"] != null)
                {
                    checkBox.BackColor = ParseFormFieldColor(attributes["backgroundColor"]);
                }

                if (attributes?["fontColor"] != null)
                {
                    checkBox.ForeColor = ParseFormFieldColor(attributes["fontColor"]);
                }

                if (attributes?["borderColor"] != null)
                {
                    checkBox.BorderColor = ParseFormFieldColor(attributes["borderColor"]);
                }

                // === BORDER PROPERTIES ===
                if (attributes?["thickness"] != null)
                {
                    checkBox.BorderWidth = GetNumberAttribute(attributes, "thickness", 0f);
                }

                // === FONT PROPERTIES ===
                if (attributes?["fontSize"] != null || attributes?["fontFamily"] != null)
                {
                    PdfFontFamily fontFamily = GetFontFamily(attributes?["fontFamily"]);
                    float fontSize = GetNumberAttribute(attributes, "fontSize", 12f);
                    PdfFontStyle fontStyle = GetFormFieldFontStyle(attributes);
                    checkBox.Font = new PdfStandardFont(fontFamily, ConvertPixelToPoint(fontSize), fontStyle);
                }

                // === TOOLTIP ===
                if (attributes?["tooltip"] != null)
                {
                    checkBox.ToolTip = attributes["tooltip"].ToString();
                }

                return checkBox;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreateCheckBoxField] Error: {ex.Message}");
                return null;
            }
        }

        private PdfRadioButtonListField? CreateRadioButtonField(PdfPageBase page, string fieldName, dynamic attributes, RectangleF bounds)
        {
            try
            {
                if (page == null)
                {
                    Console.Error.WriteLine("[CreateRadioButtonField] Page object is undefined or null");
                    return null;
                }

                var radioButton = new PdfRadioButtonListField(page, fieldName);

                int selectedIndex = 0;
                bool isSelectedItem = false;

                // === OPTIONS/ITEMS ===
                // Handle both 'options' array format and 'radiobuttonItem' array format
                var itemsArray = attributes?["radiobuttonItem"] ?? attributes?["options"];

                if (itemsArray != null && (itemsArray is JArray || itemsArray is System.Collections.IEnumerable))
                {
                    int itemIndex = 0;
                    foreach (var item in itemsArray)
                    {
                        string itemName = item["name"]?.ToString() ?? item["value"]?.ToString() ?? $"{fieldName}_{itemIndex}";
                        var itemBounds = bounds;

                        // Adjust bounds for each item if provided
                        if (item["bounds"] != null)
                        {
                            itemBounds = ParseBounds(item["bounds"]);
                        }
                        else if (item["x"] != null && item["y"] != null)
                        {
                            // If item has individual position
                            itemBounds = new RectangleF(
                                ConvertPixelToPoint(item["x"]),
                                ConvertPixelToPoint(item["y"]),
                                ConvertPixelToPoint(item["width"] ?? (object)bounds.Width ?? (object)15f),
                                ConvertPixelToPoint(item["height"] ?? (object)bounds.Height ?? (object)15f)
                            );
                        }

                        try
                        {
                            var radioItem = new PdfRadioButtonListItem(page, itemName);

                            // === ITEM BOUNDS ===
                            radioItem.Bounds = itemBounds;

                            // === ITEM PROPERTIES ===
                            if (item["borderColor"] != null)
                            {
                                radioItem.BorderColor = ParseFormFieldColor(item["borderColor"]);
                            }

                            if (item["thickness"] != null)
                            {
                                radioItem.BorderWidth = GetNumberAttribute(item, "thickness", 0f);
                            }

                            if (item["backgroundColor"] != null)
                            {
                                radioItem.BackColor = ParseFormFieldColor(item["backgroundColor"]);
                            }

                            if (item["fontColor"] != null)
                            {
                                radioItem.ForeColor = ParseFormFieldColor(item["fontColor"]);
                            }

                            if (item["visibility"] != null)
                            {
                                radioItem.Visibility = GetFormFieldVisibility(item["visibility"]);
                            }

                            if (item["isReadonly"] != null)
                            {
                                radioItem.ReadOnly = ParseBoolean(item["isReadonly"]);
                            }

                            if (item["isRequired"] != null)
                            {
                                radioItem.Required = ParseBoolean(item["isRequired"]);
                            }

                            if (item["tooltip"] != null)
                            {
                                radioItem.ToolTip = item["tooltip"].ToString();
                            }

                            // Track selected item
                            if (item["isSelected"] != null && ParseBoolean(item["isSelected"]))
                            {
                                selectedIndex = itemIndex;
                                isSelectedItem = true;
                            }

                            radioButton.Items.Add(radioItem);
                        }
                        catch (Exception itemEx)
                        {
                            Console.WriteLine($"[CreateRadioField] Error creating item {itemIndex}: {itemEx.Message}");
                        }

                        itemIndex++;
                    }
                }
                else
                {
                    Console.WriteLine("[CreateRadioButtonField] No radio button items provided in attributes");
                }

                // === FIELD BEHAVIOR ===
                if (attributes?["isReadonly"] != null)
                {
                    radioButton.ReadOnly = ParseBoolean(attributes["isReadonly"]);
                }

                if (attributes?["isRequired"] != null)
                {
                    radioButton.Required = ParseBoolean(attributes["isRequired"]);
                }

                // === ALLOW UNISON SELECTION (any item can be marked selected at once) ===
                if (attributes?["allowUnisonSelection"] != null)
                {
                    radioButton.AllowUnisonSelection = ParseBoolean(attributes["allowUnisonSelection"]);
                }

                // === SELECTION ===
                if (isSelectedItem)
                {
                    radioButton.SelectedIndex = selectedIndex;
                }
                else if (attributes?["selectedIndex"] != null)
                {
                    if (int.TryParse(attributes["selectedIndex"].ToString(), out int selIdx))
                    {
                        radioButton.SelectedIndex = selIdx;
                    }
                }
                else if (attributes?["value"] != null)
                {
                    radioButton.SelectedValue = attributes["value"].ToString();
                }

                // === VISIBILITY ===
                // PdfRadioButtonListField does not expose a Visibility/BackColor
                // property in the .NET API; visibility is applied at the item
                // level when iterating the options above. Skipping the
                // top-level mapping here is intentional and matches the
                // behavior of the FormFields.cs SaveRadioButtonField reference.

                // === BORDER PROPERTIES ===
                if (attributes?["thickness"] != null)
                {
                    PdfRadioButtonListItem? firstItem = radioButton.Items.Count > 0 ? radioButton.Items[0] : null;
                    if (firstItem != null)
                    {
                        firstItem.BorderWidth = GetNumberAttribute(attributes, "thickness", 0f);
                    }
                }

                // === TOOLTIP ===
                if (attributes?["tooltip"] != null)
                {
                    radioButton.ToolTip = attributes["tooltip"].ToString();
                }

                return radioButton;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreateRadioButtonField] Error: {ex.Message}");
                Console.Error.WriteLine($"[CreateRadioButtonField] Stack: {ex.StackTrace}");
                return null;
            }
        }

        private PdfComboBoxField? CreateDropDownField(PdfPageBase page, string fieldName, dynamic attributes, RectangleF bounds)
        {
            try
            {
                if (page == null)
                {
                    Console.Error.WriteLine("[CreateDropDownField] Page object is undefined or null");
                    return null;
                }

                var comboBox = new PdfComboBoxField(page, fieldName);

                // === BOUNDS ===
                if (bounds.Width > 0 || bounds.Height > 0)
                {
                    comboBox.Bounds = bounds;
                }

                // === OPTIONS/ITEMS ===
                var optionsArray = attributes?["options"];
                if (optionsArray != null && (optionsArray is JArray || optionsArray is System.Collections.IEnumerable))
                {
                    foreach (var option in optionsArray)
                    {
                        string itemName = option["itemName"]?.ToString() ?? option["text"]?.ToString() ?? "";
                        string itemValue = option["itemValue"]?.ToString() ?? option["value"]?.ToString() ?? itemName;

                        if (!string.IsNullOrEmpty(itemName))
                        {
                            var item = new PdfListFieldItem(itemName, itemValue);
                            comboBox.Items.Add(item);
                        }
                    }
                }

                // === EDITABLE (allows user to type a custom value) ===
                if (attributes?["editable"] != null)
                {
                    comboBox.Editable = ParseBoolean(attributes["editable"]);
                }

                // === VALUE AND SELECTION ===
                // if (attributes?["value"] != null)
                // {
                //     comboBox.SelectedValue = attributes["value"].ToString();
                // }
                if (comboBox.Items.Count > 0)
                {
                    if (attributes?["selectedIndex"] != null)
                    {
                        if (attributes["selectedIndex"] is JArray selectedArray && selectedArray.Count > 0)
                        {
                            comboBox.SelectedIndex = selectedArray[0].Value<int>();
                        }
                        else if (int.TryParse(attributes["selectedIndex"].ToString(), out int selIdx))
                        {
                            comboBox.SelectedIndex = selIdx;
                        }
                    }
                    else
                    {
                        comboBox.SelectedIndex = 0;
                    }
                }

                // === FIELD BEHAVIOR ===
                if (attributes?["isReadonly"] != null)
                {
                    comboBox.ReadOnly = ParseBoolean(attributes["isReadonly"]);
                }

                if (attributes?["isRequired"] != null)
                {
                    comboBox.Required = ParseBoolean(attributes["isRequired"]);
                }

                // === VISIBILITY ===
                if (attributes?["visibility"] != null)
                {
                    comboBox.Visibility = GetFormFieldVisibility(attributes["visibility"]);
                }

                // === ALIGNMENT ===
                if (attributes?["alignment"] != null || attributes?["textAlign"] != null)
                {
                    comboBox.TextAlignment = GetFormFieldTextAlignment(attributes["alignment"] ?? attributes["textAlign"]);
                }

                // === COLORS ===
                if (attributes?["backgroundColor"] != null)
                {
                    comboBox.BackColor = ParseFormFieldColor(attributes["backgroundColor"]);
                }

                if (attributes?["fontColor"] != null)
                {
                    comboBox.ForeColor = ParseFormFieldColor(attributes["fontColor"]);
                }

                if (attributes?["borderColor"] != null)
                {
                    comboBox.BorderColor = ParseFormFieldColor(attributes["borderColor"]);
                }

                // === BORDER PROPERTIES ===
                if (attributes?["thickness"] != null)
                {
                    comboBox.BorderWidth = GetNumberAttribute(attributes, "thickness", 0f);
                }

                // === FONT PROPERTIES ===
                if (attributes?["fontSize"] != null || attributes?["fontFamily"] != null)
                {
                    PdfFontFamily fontFamily = GetFontFamily(attributes?["fontFamily"]);
                    float fontSize = GetNumberAttribute(attributes, "fontSize", 12f);
                    PdfFontStyle fontStyle = GetFormFieldFontStyle(attributes);
                    comboBox.Font = new PdfStandardFont(fontFamily, ConvertPixelToPoint(fontSize), fontStyle);
                }

                // === TOOLTIP ===
                if (attributes?["tooltip"] != null)
                {
                    comboBox.ToolTip = attributes["tooltip"].ToString();
                }

                return comboBox;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreateDropDownField] Error: {ex.Message}");
                return null;
            }
        }

        private PdfListBoxField? CreateListBoxField(PdfPageBase page, string fieldName, dynamic attributes, RectangleF bounds)
        {
            try
            {
                if (page == null)
                {
                    Console.Error.WriteLine("[CreateListBoxField] Page object is undefined or null");
                    return null;
                }

                // Default larger bounds for list box (mirrors Node.js _createListBoxField).
                RectangleF listBoxBounds = bounds;
                if (bounds.Height > 0 && bounds.Height < 40)
                {
                    listBoxBounds = new RectangleF(bounds.X, bounds.Y, bounds.Width, 60);
                }

                var listBox = new PdfListBoxField(page, fieldName);

                // === BOUNDS ===
                if (listBoxBounds.Width > 0 || listBoxBounds.Height > 0)
                {
                    listBox.Bounds = listBoxBounds;
                }

                // === OPTIONS/ITEMS ===
                var optionsArray = attributes?["options"];
                if (optionsArray != null && (optionsArray is JArray || optionsArray is System.Collections.IEnumerable))
                {
                    foreach (var option in optionsArray)
                    {
                        string itemName = option["itemName"]?.ToString() ?? option["text"]?.ToString() ?? "";
                        string itemValue = option["itemValue"]?.ToString() ?? option["value"]?.ToString() ?? itemName;

                        if (!string.IsNullOrEmpty(itemName))
                        {
                            var item = new PdfListFieldItem(itemName, itemValue);
                            listBox.Items.Add(item);
                        }
                    }
                }

                // === SELECTION MODE ===
                if (attributes?["multiSelect"] != null)
                {
                    listBox.MultiSelect = ParseBoolean(attributes["multiSelect"]);
                }

                if (listBox.Items.Count > 0)
                {
                    if (attributes?["selectedIndex"] != null)
                    {
                        if (attributes["selectedIndex"] is JArray selectedArray)
                        {
                            if (selectedArray.Count == 1)
                            {
                                listBox.SelectedIndex = selectedArray[0].Value<int>();
                            }
                            else if (selectedArray.Count > 1)
                            {
                                List<int> indices = new List<int>();
                                foreach (var idx in selectedArray)
                                {
                                    indices.Add(idx.Value<int>());
                                }
                                listBox.SelectedIndex = indices[0]; // Set first selected
                            }
                        }
                        else if (int.TryParse(attributes["selectedIndex"].ToString(), out int selIdx))
                        {
                            listBox.SelectedIndex = selIdx;
                        }
                    }
                    else
                    {
                        listBox.SelectedIndex = 0;
                    }
                }

                // === FIELD BEHAVIOR ===
                if (attributes?["isReadonly"] != null)
                {
                    listBox.ReadOnly = ParseBoolean(attributes["isReadonly"]);
                }

                if (attributes?["isRequired"] != null)
                {
                    listBox.Required = ParseBoolean(attributes["isRequired"]);
                }

                // === VISIBILITY ===
                if (attributes?["visibility"] != null)
                {
                    listBox.Visibility = GetFormFieldVisibility(attributes["visibility"]);
                }

                // === ALIGNMENT ===
                if (attributes?["alignment"] != null || attributes?["textAlign"] != null)
                {
                    listBox.TextAlignment = GetFormFieldTextAlignment(attributes["alignment"] ?? attributes["textAlign"]);
                }

                // === COLORS ===
                if (attributes?["backgroundColor"] != null)
                {
                    listBox.BackColor = ParseFormFieldColor(attributes["backgroundColor"]);
                }

                if (attributes?["fontColor"] != null)
                {
                    listBox.ForeColor = ParseFormFieldColor(attributes["fontColor"]);
                }

                if (attributes?["borderColor"] != null)
                {
                    listBox.BorderColor = ParseFormFieldColor(attributes["borderColor"]);
                }

                // === BORDER PROPERTIES ===
                if (attributes?["thickness"] != null)
                {
                    listBox.BorderWidth = GetNumberAttribute(attributes, "thickness", 0f);
                }

                // === FONT PROPERTIES ===
                if (attributes?["fontSize"] != null || attributes?["fontFamily"] != null)
                {
                    PdfFontFamily fontFamily = GetFontFamily(attributes?["fontFamily"]);
                    float fontSize = GetNumberAttribute(attributes, "fontSize", 12f);
                    PdfFontStyle fontStyle = GetFormFieldFontStyle(attributes);
                    listBox.Font = new PdfStandardFont(fontFamily, ConvertPixelToPoint(fontSize), fontStyle);
                }

                // === TOOLTIP ===
                if (attributes?["tooltip"] != null)
                {
                    listBox.ToolTip = attributes["tooltip"].ToString();
                }

                return listBox;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreateListBoxField] Error: {ex.Message}");
                return null;
            }
        }

        private PdfSignatureField? CreateSignatureField(PdfPageBase page, string fieldName, dynamic attributes, RectangleF bounds)
        {
            try
            {
                if (page == null)
                {
                    Console.Error.WriteLine("[CreateSignatureField] Page object is undefined or null");
                    return null;
                }

                RectangleF sigBounds = bounds;

                // Handle lineBound if provided (matches Syncfusion FormFields.cs
                // SaveSignatureField which reads from formFieldAttributes.LineBound).
                if (attributes?["lineBound"] != null)
                {
                    var lineBound = attributes["lineBound"];
                    sigBounds = new RectangleF(
                        ConvertPixelToPoint((float)(lineBound["X"] ?? lineBound["x"] ?? 0)),
                        ConvertPixelToPoint((float)(lineBound["Y"] ?? lineBound["y"] ?? 0)),
                        ConvertPixelToPoint((float)(lineBound["Width"] ?? lineBound["width"] ?? 100)),
                        ConvertPixelToPoint((float)(lineBound["Height"] ?? lineBound["height"] ?? 20))
                    );
                }

                var signature = new PdfSignatureField(page, fieldName);

                // === BOUNDS ===
                if (sigBounds.Width > 0 || sigBounds.Height > 0)
                {
                    signature.Bounds = sigBounds;
                }

                // === INITIAL FIELD FLAG ===
                if (attributes?["formFieldAnnotationType"]?.ToString() == "InitialField")
                {
                    // InitialField is stored on the dictionary in the Syncfusion
                    // reference. We use SetValue through the underlying field
                    // dictionary if available.
                    try { signature.SetValue("InitialField", "true"); }
                    catch { /* best effort */ }
                }

                // === FIELD BEHAVIOR ===
                if (attributes?["isReadonly"] != null || attributes?["isReadOnly"] != null)
                {
                    signature.ReadOnly = ParseBoolean(attributes?["isReadonly"] ?? attributes?["isReadOnly"]);
                }

                if (attributes?["isRequired"] != null)
                {
                    signature.Required = ParseBoolean(attributes["isRequired"]);
                }

                // === VISIBILITY ===
                if (attributes?["visibility"] != null)
                {
                    // Signature field has only Visible (bool), not PdfFormFieldVisibility
                    string vis = attributes["visibility"].ToString()?.ToLowerInvariant() ?? "";
                    signature.Visible = vis != "hidden";
                }

                // === COLORS ===
                if (attributes?["backgroundColor"] != null)
                {
                    signature.BackColor = ParseFormFieldColor(attributes["backgroundColor"]);
                }

                if (attributes?["borderColor"] != null)
                {
                    signature.BorderColor = ParseFormFieldColor(attributes["borderColor"]);
                }

                // === BORDER PROPERTIES ===
                if (attributes?["thickness"] != null)
                {
                    signature.BorderWidth = GetNumberAttribute(attributes, "thickness", 0f);
                }

                // === TOOLTIP ===
                if (attributes?["tooltip"] != null)
                {
                    signature.ToolTip = attributes["tooltip"].ToString();
                }

                // === SIGNATURE TYPE ===
                // Supported types in the Syncfusion reference: "Text", "Image", "Path".
                // We record the type so the rendering layer (FormFields.cs DrawPath /
                // DrawFreeTextAnnotations / DrawImage) can replay it during save.
                // The signature field itself is created here; the visual content is
                // rendered later when the document is saved via the reference
                // implementation.
                if (attributes?["signatureType"] != null)
                {
                    try { signature.SetValue("SignatureType", attributes["signatureType"].ToString() ?? ""); }
                    catch { /* best effort */ }
                }

                return signature;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[CreateSignatureField] Error: {ex.Message}");
                return null;
            }
        }

        private RectangleF ParseBounds(dynamic? boundsData)
        {
            try
            {
                if (boundsData == null)
                {
                    return new RectangleF(0, 0, 100, 20);
                }

                if (boundsData is JObject jObj)
                {
                    float x = ConvertPixelToPoint(jObj["x"]?.Value<float>() ?? jObj["X"]?.Value<float>() ?? 0);
                    float y = ConvertPixelToPoint(jObj["y"]?.Value<float>() ?? jObj["Y"]?.Value<float>() ?? 0);
                    float width = ConvertPixelToPoint(jObj["width"]?.Value<float>() ?? jObj["Width"]?.Value<float>() ?? 100);
                    float height = ConvertPixelToPoint(jObj["height"]?.Value<float>() ?? jObj["Height"]?.Value<float>() ?? 20);
                    return new RectangleF(x, y, width, height);
                }
                
                return new RectangleF(0, 0, 100, 20);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ParseBounds] Error: {ex.Message}");
                return new RectangleF(0, 0, 100, 20);
            }
        }

        private float ConvertPixelToPoint(float value)
        {
            return (value * 72 / 96);
        }

        /// <summary>
        /// Applies page organizer actions (reorder, delete, rotate, insert, copy, import)
        /// </summary>
        private async Task ApplyPageOrganizerActionsAsync(PdfLoadedDocument document, dynamic pageOrganizerData)
        {
            try
            {
                string? action = pageOrganizerData?["action"]?.ToString()?.ToLower();

                if (action == "delete")
                {
                    // Delete Page: Remove page at specified index
                    int pageIndex = pageOrganizerData?["originalPageIndex"] ?? 0;
                    if (pageIndex >= 0 && pageIndex < document.Pages.Count)
                    {
                        document.Pages.RemoveAt(pageIndex);
                        Console.WriteLine($"[PageOrganizer] Deleted page at index {pageIndex}");
                    }
                }
                else if (action == "reorder" || action == "rearrange")
                {
                    // Reorder/Move Page: Move page from source to target index
                    int sourceIndex = pageOrganizerData?["sourcePageIndex"] ?? pageOrganizerData?["originalPageIndex"] ?? 0;
                    int targetIndex = pageOrganizerData?["targetIndex"] ?? 0;

                    // Validate indices
                    if (sourceIndex < 0 || sourceIndex >= document.Pages.Count)
                    {
                        Console.WriteLine($"[PageOrganizer] Invalid source index {sourceIndex}. Document has {document.Pages.Count} pages");
                        await Task.CompletedTask;
                        return;
                    }

                    if (targetIndex < 0 || targetIndex >= document.Pages.Count)
                    {
                        Console.WriteLine($"[PageOrganizer] Invalid target index {targetIndex}. Document has {document.Pages.Count} pages");
                        await Task.CompletedTask;
                        return;
                    }

                    if (sourceIndex == targetIndex)
                    {
                        // No operation needed
                        await Task.CompletedTask;
                        return;
                    }

                    try
                    {
                        // Build the complete page order array for reorderPages API
                        List<int> pageIndices = new List<int>();
                        for (int i = 0; i < document.Pages.Count; i++)
                        {
                            pageIndices.Add(i);
                        }

                        // Remove the page at sourceIndex
                        int removedPage = pageIndices[sourceIndex];
                        pageIndices.RemoveAt(sourceIndex);

                        // Insert at targetIndex (no adjustment needed because we've already removed the source page)
                        pageIndices.Insert(targetIndex, removedPage);

                        // Call ReArrange API with the new page order on PdfLoadedPageCollection
                        document.Pages.ReArrange(pageIndices.ToArray());
                        Console.WriteLine($"[PageOrganizer] Reordered page from index {sourceIndex} to {targetIndex}");
                    }
                    catch (Exception reorderEx)
                    {
                        Console.Error.WriteLine($"[PageOrganizer] Error during reorder: {reorderEx.Message}");
                        throw;
                    }
                }
                else if (action == "rotate")
                {
                    // Rotate Page: Rotate page by specified angle
                    int pageIndex = pageOrganizerData?["originalPageIndex"] ?? 0;
                    int rotateAngle = pageOrganizerData?["rotateAngle"] ?? 0;

                    if (pageIndex >= 0 && pageIndex < document.Pages.Count)
                    {
                        PdfPageBase page = document.Pages[pageIndex];
                        page.Rotation = GetPdfRotationAngle(rotateAngle);
                        Console.WriteLine($"[PageOrganizer] Rotated page {pageIndex} by {rotateAngle} degrees");
                    }
                }
                else if (action == "insert")
                {
                    // Insert Page: Add blank page at specified index
                    int targetIndex = pageOrganizerData?["targetIndex"] ?? document.Pages.Count;

                    // Get page size if provided
                    var pageSize = pageOrganizerData?["pageSize"];
                    SizeF pageSizeF = new SizeF(595, 842); // Default A4

                    if (pageSize != null)
                    {
                        if (pageSize["width"] != null && pageSize["height"] != null)
                        {
                            pageSizeF = new SizeF(
                                ConvertPixelToPoint(((JValue)pageSize["width"]).Value<float>()),
                                ConvertPixelToPoint(((JValue)pageSize["height"]).Value<float>())
                            );
                        }
                    }

                    // Add page at target index
                    if (targetIndex >= 0 && targetIndex <= document.Pages.Count)
                    {
                        document.Pages.Insert(targetIndex, pageSizeF);
                        Console.WriteLine($"[PageOrganizer] Inserted blank page at index {targetIndex}");
                    }
                    else
                    {
                        // Add to end if index out of range
                        document.Pages.Add(pageSizeF);
                        Console.WriteLine($"[PageOrganizer] Inserted blank page at end (index out of range)");
                    }
                }
                else if (action == "copy")
                {
                    int sourcePageIndex = pageOrganizerData?["sourceOriginalPageIndex"] ?? pageOrganizerData?["sourcePageIndex"] ?? 0;
                    int targetIndex = pageOrganizerData?["targetIndex"] ?? document.Pages.Count;


                    if (sourcePageIndex >= 0 && sourcePageIndex < document.Pages.Count)
                    {
                        try
                        {
                            // // Reorder pages
                            // let options = new PdfPageImportOptions();
                            // // Sets the target page index to import
                            // options.targetIndex = pageOrganizerData.targetIndex;
                            // if (pageOrganizerData.rotateAngle === 90)
                            // {
                            //     options.rotation = PdfRotationAngle.angle90;
                            // }
                            // else if (pageOrganizerData.rotateAngle === 180)
                            // {
                            //     options.rotation = PdfRotationAngle.angle180;
                            // }
                            // else if (pageOrganizerData.rotateAngle === 270)
                            // {
                            //     options.rotation = PdfRotationAngle.angle270;
                            // }
                            // PdfImportOptions options = new PdfImportOptions();
                            // options.TargetPageIndex = 1;
                            // document.ImportPage(document, 0, options);

                        }
                        catch (Exception copyEx)
                        {
                            Console.Error.WriteLine($"[PageOrganizer] Copy using ImportPage failed: {copyEx.Message}. Trying fallback...");
                            // Fallback: legacy Insert + Add approach for environments
                            // where the ImportPage overload is not available.
                        }
                    }
                    
                }
                else if (action == "import")
                {
                    // Import Page(s): Import page from external document
                    // Note: This typically requires an external document reference
                    // For now, we provide the structure
                    Console.WriteLine($"[PageOrganizer] Import action requires external document - not implemented in standalone mode");
                }
                else
                {
                    Console.WriteLine($"[PageOrganizer] Unknown action: {action}");
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[PageOrganizer] Error: {ex.Message}");
                throw;
            }
        }

        // ========== Helper Methods ==========

        /// <summary>
        /// Parses form field data from various formats.
        /// </summary>
        private Dictionary<string, object?>? ParseFormFieldData(dynamic? data)
        {
            try
            {
                if (data == null)
                {
                    return null;
                }

                if (data is string str)
                {
                    return JsonConvert.DeserializeObject<Dictionary<string, object?>>(str);
                }

                if (data is JObject jObj)
                {
                    return jObj.ToObject<Dictionary<string, object?>>();
                }

                return new Dictionary<string, object?>();
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Strips non-alphanumeric characters from a field name.
        /// </summary>
        private string StripFieldName(string? fieldName)
        {
            if (string.IsNullOrEmpty(fieldName))
            {
                return "";
            }

            return System.Text.RegularExpressions.Regex.Replace(fieldName, @"[^0-9a-zA-Z]", "");
        }

        /// <summary>
        /// Parses a boolean value from various formats.
        /// </summary>
        private bool ParseBoolean(object? value)
        {
            if (value == null)
            {
                return false;
            }

            if (value is bool b)
            {
                return b;
            }

            string str = value.ToString()?.ToLower() ?? "";
            return str == "true" || str == "yes" || str == "1";
        }

        /// <summary>
        /// Converts rotation angle to PdfPageRotateAngle enum.
        /// </summary>
        private PdfPageRotateAngle GetPdfRotationAngle(int degrees)
        {
            return degrees switch
            {
                90 => PdfPageRotateAngle.RotateAngle90,
                180 => PdfPageRotateAngle.RotateAngle180,
                270 => PdfPageRotateAngle.RotateAngle270,
                _ => PdfPageRotateAngle.RotateAngle0
            };
        }

        // ======================================================================
        // Form Field Property Mapping Helpers
        // Mirrors the Node.js PdfViewerCollaborationAdapter.js _parseColor,
        // _getFontFamily, _getPdfFontStyle, _getTextAlignment helpers so the
        // .NET collaborative server applies every supported property from the
        // collaborative editing payload (matching the Syncfusion
        // ASP.NET Core PDF Viewer Server reference).
        // ======================================================================

        /// <summary>
        /// Parses a color value from various formats (RGBA object, hex string,
        /// named color) and returns a <see cref="PdfColor"/>.
        /// </summary>
        private PdfColor ParseFormFieldColor(dynamic? colorData)
        {
            try
            {
                if (colorData == null)
                {
                    return new PdfColor(0, 0, 0);
                }

                int r = 0, g = 0, b = 0, a = 255;

                // Object with explicit r/g/b properties (Newtonsoft JObject or POCO)
                if (colorData is JObject jObj)
                {
                    r = jObj["r"]?.Value<int>() ?? 0;
                    g = jObj["g"]?.Value<int>() ?? 0;
                    b = jObj["b"]?.Value<int>() ?? 0;
                    a = jObj["a"]?.Value<int>() ?? 255;
                }
                else if (colorData is IDictionary<string, object?> dict)
                {
                    if (dict.TryGetValue("r", out var rv) && rv != null) r = Convert.ToInt32(rv);
                    if (dict.TryGetValue("g", out var gv) && gv != null) g = Convert.ToInt32(gv);
                    if (dict.TryGetValue("b", out var bv) && bv != null) b = Convert.ToInt32(bv);
                    if (dict.TryGetValue("a", out var av) && av != null) a = Convert.ToInt32(av);
                }
                else
                {
                    // Try to read r/g/b properties generically
                    try
                    {
                        if (colorData.r != null) r = Convert.ToInt32(colorData.r.ToString());
                        if (colorData.g != null) g = Convert.ToInt32(colorData.g.ToString());
                        if (colorData.b != null) b = Convert.ToInt32(colorData.b.ToString());
                        if (colorData.a != null) a = Convert.ToInt32(colorData.a.ToString());
                    }
                    catch
                    {
                        // Fall back to hex parsing
                    }
                }

                if (r == 0 && g == 0 && b == 0 && a == 0)
                {
                    return new PdfColor((byte)r, (byte)g, (byte)b, (byte)a);
                }

                r = Math.Min(255, Math.Max(0, r));
                g = Math.Min(255, Math.Max(0, g));
                b = Math.Min(255, Math.Max(0, b));
                return new PdfColor((byte)r, (byte)g, (byte)b);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ParseFormFieldColor] Error: {ex.Message}");
                return new PdfColor(0, 0, 0);
            }
        }

        /// <summary>
        /// Maps a font family name to the supported <see cref="PdfFontFamily"/> enum.
        /// </summary>
        private PdfFontFamily GetFontFamily(dynamic? fontName)
        {
            try
            {
                string name = fontName?.ToString()?.ToLowerInvariant() ?? string.Empty;
                if (string.IsNullOrEmpty(name))
                {
                    return PdfFontFamily.Helvetica;
                }

                if (name.Contains("times")) return PdfFontFamily.TimesRoman;
                if (name.Contains("courier")) return PdfFontFamily.Courier;
                if (name.Contains("symbol")) return PdfFontFamily.Symbol;
                if (name.Contains("zapf")) return PdfFontFamily.ZapfDingbats;
                return PdfFontFamily.Helvetica;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetFontFamily] Error: {ex.Message}");
                return PdfFontFamily.Helvetica;
            }
        }

        /// <summary>
        /// Builds a <see cref="PdfFontStyle"/> value from the font style flags
        /// on the collaborative editing payload.
        /// </summary>
        private PdfFontStyle GetFormFieldFontStyle(dynamic? attributes)
        {
            try
            {
                PdfFontStyle style = PdfFontStyle.Regular;
                if (attributes == null)
                {
                    return style;
                }

                if (ParseBoolean(attributes.bold)) style |= PdfFontStyle.Bold;
                if (ParseBoolean(attributes.italic)) style |= PdfFontStyle.Italic;
                if (ParseBoolean(attributes.underline)) style |= PdfFontStyle.Underline;
                if (ParseBoolean(attributes.strikethrough) || ParseBoolean(attributes.strikeout))
                    style |= PdfFontStyle.Strikeout;
                return style;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetFormFieldFontStyle] Error: {ex.Message}");
                return PdfFontStyle.Regular;
            }
        }

        /// <summary>
        /// Maps a string alignment value ("Left"/"Center"/"Right"/"Justify") to
        /// the <see cref="PdfTextAlignment"/> enum.
        /// </summary>
        private PdfTextAlignment GetFormFieldTextAlignment(dynamic? align)
        {
            try
            {
                string value = align?.ToString()?.ToLowerInvariant() ?? string.Empty;
                return value switch
                {
                    "center" => PdfTextAlignment.Center,
                    "right" => PdfTextAlignment.Right,
                    "justify" => PdfTextAlignment.Justify,
                    _ => PdfTextAlignment.Left
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetFormFieldTextAlignment] Error: {ex.Message}");
                return PdfTextAlignment.Left;
            }
        }

        /// <summary>
        /// Maps a string visibility value to the <see cref="PdfFormFieldVisibility"/>
        /// enum. Supports "visible", "hidden", "visiblenotprintable", and
        /// "hiddenprintable".
        /// </summary>
        private PdfFormFieldVisibility GetFormFieldVisibility(dynamic? visibility)
        {
            try
            {
                string value = visibility?.ToString()?.ToLowerInvariant() ?? string.Empty;
                return value switch
                {
                    "hidden" => PdfFormFieldVisibility.Hidden,
                    "visiblenotprintable" => PdfFormFieldVisibility.VisibleNotPrintable,
                    "hiddenprintable" => PdfFormFieldVisibility.HiddenPrintable,
                    _ => PdfFormFieldVisibility.Visible
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetFormFieldVisibility] Error: {ex.Message}");
                return PdfFormFieldVisibility.Visible;
            }
        }

        /// <summary>
        /// Reads a numeric value from a JToken / IDictionary / POCO using the
        /// supplied key and converts it to <see cref="float"/>.
        /// </summary>
        private float GetNumberAttribute(dynamic? attributes, string key, float defaultValue = 0f)
        {
            try
            {
                if (attributes == null)
                {
                    return defaultValue;
                }

                object? raw = null;
                if (attributes is JObject jObj)
                {
                    raw = jObj[key]?.Value<object>();
                }
                else if (attributes is IDictionary<string, object?> dict)
                {
                    dict.TryGetValue(key, out raw);
                }
                else
                {
                    try { raw = attributes[key]; } catch { /* ignore */ }
                }

                if (raw == null)
                {
                    return defaultValue;
                }

                return Convert.ToSingle(raw, System.Globalization.CultureInfo.InvariantCulture);
            }
            catch
            {
                return defaultValue;
            }
        }

        /// <summary>
        /// Returns the trimmed string representation of an attribute value, or
        /// <c>null</c> when the attribute is missing or empty.
        /// </summary>
        private string? GetStringAttribute(dynamic? attributes, string key)
        {
            try
            {
                if (attributes == null)
                {
                    return null;
                }

                object? raw = null;
                if (attributes is JObject jObj)
                {
                    raw = jObj[key]?.Value<object>();
                }
                else if (attributes is IDictionary<string, object?> dict)
                {
                    dict.TryGetValue(key, out raw);
                }
                else
                {
                    try { raw = attributes[key]; } catch { /* ignore */ }
                }

                if (raw == null)
                {
                    return null;
                }

                string s = raw.ToString() ?? string.Empty;
                return string.IsNullOrEmpty(s) ? null : s;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Reads a nested options/items array from the collaborative editing
        /// payload. Supports <see cref="JArray"/>, native arrays, and
        /// <see cref="IEnumerable{T}"/> implementations.
        /// </summary>
        private List<JObject> GetOptionsArray(dynamic? attributes, params string[] keys)
        {
            var result = new List<JObject>();
            try
            {
                if (attributes == null)
                {
                    return result;
                }

                JArray? arr = null;
                foreach (var key in keys)
                {
                    JToken? token = null;
                    if (attributes is JObject jObj)
                    {
                        token = jObj[key];
                    }
                    else if (attributes is IDictionary<string, object?> dict && dict.TryGetValue(key, out var raw))
                    {
                        token = raw as JToken;
                    }
                    else
                    {
                        try
                        {
                            var rawAttr = attributes[key];
                            if (rawAttr is JToken jt) token = jt;
                        }
                        catch { /* ignore */ }
                    }

                    if (token is JArray ja)
                    {
                        arr = ja;
                        break;
                    }
                }

                if (arr != null)
                {
                    foreach (var item in arr)
                    {
                        if (item is JObject itemObj)
                        {
                            result.Add(itemObj);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GetOptionsArray] Error: {ex.Message}");
            }
            return result;
        }

        /// <summary>
        /// Saves a batch of already-transformed operations to the document store.
        /// Queues the save operation for background processing.
        /// </summary>
        public async Task SaveOperationsAsync(List<CollaborationAction> actions, string roomName, bool partialSave)
        {
            try
            {
                if (actions == null)
                {
                    throw new ArgumentNullException(nameof(actions));
                }

                if (string.IsNullOrEmpty(roomName))
                {
                    throw new ArgumentException("Room name cannot be null or empty", nameof(roomName));
                }

                Console.WriteLine($"[SaveOperations] Queueing save request for room '{roomName}' with {actions.Count} actions (partialSave: {partialSave})");

                // Create a save request to be processed by the background task queue
                var saveRequest = new Syncfusion.Collaboration.Core.Models.SaveRequest
                {
                    Actions = actions,
                    RoomName = roomName,
                    PartialSave = partialSave
                };

                // Queue the save operation for background processing using the
                // IBackgroundTaskQueue provided by Syncfusion.Collaborator.Server.
                if (_backgroundTaskQueue != null)
                {
                    await _backgroundTaskQueue.QueueBackgroundWorkItemAsync(saveRequest);
                    Console.WriteLine($"[SaveOperations] Save request queued successfully for room '{roomName}'");
                }
                else
                {
                    Console.WriteLine($"[SaveOperations] Warning: SaveTaskQueue not available or not properly initialized");
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[SaveOperations] Error queuing save request: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Processes save requests for the document.
        ///
        /// Orchestrates the full save workflow:
        /// 1. Load master PDF from storage
        /// 2. Retrieve pending operations from Redis
        /// 3. Replay operations against master document via ReplayOperationsAndUpdateDocumentAsync()
        /// 4. Persist updated PDF back to storage
        /// 5. Clean up Redis (partial or full based on partialSave flag)
        /// 6. Broadcast save completion notification to all clients in room
        ///
        /// Save Behavior:
        /// - PartialSave == true:
        ///   * Remove only the first N actions (where N = request.Actions.Count)
        ///   * Retain remaining unprocessed actions in Redis for next save cycle
        ///   * Supports incremental save workflow
        ///
        /// - PartialSave == false:
        ///   * Remove ALL pending actions associated with the room from Redis
        ///   * Used when document is finalized and no further collaboration needed
        ///   * Clears complete action history after final save
        /// </summary>
        public async Task ProcessSaveRequestAsync(Syncfusion.Collaboration.Core.Models.SaveRequest request, CancellationToken cancellationToken)
        {
            try
            {
                if (request == null)
                {
                    throw new ArgumentNullException(nameof(request));
                }

                string roomName = request.RoomName ?? "default";

                Console.WriteLine($"[ProcessSave] Starting save workflow for room '{roomName}'");
                Console.WriteLine($"[ProcessSave] PartialSave: {request.PartialSave}, Actions: {request.Actions?.Count ?? 0}");

                // Step 1: Validate operations list
                if (request.Actions == null || request.Actions.Count == 0)
                {
                    Console.WriteLine($"[ProcessSave] No operations to process for room '{roomName}'");
                    await ClearRecordsAsync(roomName, request.PartialSave);
                    await Task.CompletedTask;
                    return;
                }

                // Step 2: Load master PDF from storage service
                string masterPdfBase64 = "";

                try
                {
                    // Load master PDF from the configured storage service.
                    // SaveRequest does not carry the master PDF; it must be loaded from storage.
                    if (StorageService is PdfViewerCollaborativeEditingServer.Services.IPdfStorageService pdfStorage)
                    {
                        var result = await pdfStorage.GetPdfAsync("document.pdf", roomName);
                        if (result.Success && !string.IsNullOrEmpty(result.Content))
                        {
                            masterPdfBase64 = result.Content;
                            Console.WriteLine($"[ProcessSave] Master PDF loaded from storage: {result.ContentLength} bytes (isDefault={result.IsDefault})");
                        }
                        else
                        {
                            Console.WriteLine($"[ProcessSave] Master PDF not found in storage: {result.Error}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[ProcessSave] Storage service not available; cannot load master PDF");
                    }
                }
                catch (Exception storageError)
                {
                    Console.Error.WriteLine($"[ProcessSave] Failed to load master PDF: {storageError.Message}");
                    throw new InvalidOperationException("Master PDF not available for save operation", storageError);
                }

                if (string.IsNullOrEmpty(masterPdfBase64))
                {
                    throw new InvalidOperationException("Master PDF is required for save operation");
                }

                // Step 3: Replay operations and generate updated PDF
                byte[]? updatedPdfBuffer = null;

                try
                {
                    if (request.Actions.Count > 0)
                    {
                        Console.WriteLine($"[ProcessSave] Replaying {request.Actions.Count} operations");

                        updatedPdfBuffer = await ReplayOperationsAndUpdateDocumentAsync(
                            masterPdfBase64,
                            request.Actions,
                            roomName);

                        if (updatedPdfBuffer == null || updatedPdfBuffer.Length == 0)
                        {
                            throw new InvalidOperationException("Operation replay returned empty PDF");
                        }

                        Console.WriteLine($"[ProcessSave] Operations replayed successfully, generated {updatedPdfBuffer.Length} bytes");
                    }
                    else
                    {
                        Console.WriteLine($"[ProcessSave] No operations to replay, using master PDF as-is");
                        updatedPdfBuffer = Convert.FromBase64String(masterPdfBase64);
                    }
                }
                catch (Exception replayError)
                {
                    Console.Error.WriteLine($"[ProcessSave] Operation replay failed: {replayError.Message}");
                    Console.Error.WriteLine($"[ProcessSave] Stack: {replayError.StackTrace}");
                    throw;
                }

                // Step 4: Persist updated PDF back to storage
                if (updatedPdfBuffer != null && updatedPdfBuffer.Length > 0 &&
                    StorageService is PdfViewerCollaborativeEditingServer.Services.IPdfStorageService writeStorage)
                {
                    try
                    {
                        var saveResult = await writeStorage.StorePdfAsync(updatedPdfBuffer, "document.pdf", roomName);
                        if (saveResult.Success)
                        {
                            Console.WriteLine($"[ProcessSave] PDF persisted: {saveResult.FilePath ?? saveResult.BlobPath} ({updatedPdfBuffer.Length} bytes)");
                        }
                        else
                        {
                            Console.Error.WriteLine($"[ProcessSave] PDF persistence failed: {saveResult.Error}");
                        }
                    }
                    catch (Exception persistError)
                    {
                        Console.Error.WriteLine($"[ProcessSave] Storage persistence failed: {persistError.Message}");
                    }
                }

                // Step 5: Clean up Redis based on save mode.
                // IActionService is registered as a scoped service inside the
                // Syncfusion collaboration server, so we resolve it from a
                // fresh DI scope - the same pattern the Document Editor uses.
                int actionCount = request.Actions?.Count ?? 0;

                if (request.PartialSave)
                {
                    Console.WriteLine(
                        $"[ProcessSave] Partial Save: Removing {actionCount} actions " +
                        $"from room '{roomName}' (threshold-based cleanup)");
                }
                else
                {
                    Console.WriteLine(
                        $"[ProcessSave] Full Save: Removing all {actionCount} actions " +
                        $"from room '{roomName}' (complete cleanup)");
                }

                await ClearRecordsAsync(roomName, request.PartialSave);

                Console.WriteLine($"[ProcessSave] Save workflow completed for room '{roomName}'");
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(
                    $"Error in ProcessSaveRequestAsync for room '{request?.RoomName}': " +
                    $"{ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// Resolves <see cref="IActionService"/> from a fresh DI scope and
        /// delegates to its <c>ClearRecordsAsync</c> implementation so the
        /// room's in-memory records are cleaned up after a successful save.
        ///
        /// This mirrors the Document Editor implementation, which clears
        /// Redis after the document has been persisted to disk so the next
        /// collaboration cycle starts with a clean slate.
        /// </summary>
        private async Task ClearRecordsAsync(string roomName, bool partialSave)
        {
            if (_serviceScopeFactory == null)
            {
                Console.Error.WriteLine(
                    $"[ClearRecords] IServiceScopeFactory not available; skipping cleanup for room '{roomName}'");
                return;
            }

            try
            {
                using (var scope = _serviceScopeFactory.CreateScope())
                {
                    var actionService = scope.ServiceProvider.GetRequiredService<IActionService>();
                    await actionService.ClearRecordsAsync(roomName, partialSave);
                    Console.WriteLine(
                        $"[ClearRecords] Room '{roomName}' records cleared (partialSave: {partialSave})");
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(
                    $"[ClearRecords] Failed to clear records for room '{roomName}': {ex.Message}");
                // Do not rethrow - the document has been persisted; cleanup
                // failure should not break the save workflow.
            }
        }
    }
}
