const { CollaborationServer } = require('@syncfusion/ej2-collaborator-server');
const { PdfDocument, PdfFontFamily, PdfListFieldItem, PdfPage, PdfPageImportOptions, PdfPageSettings, DataFormat, PdfTextBoxField, PdfCheckBoxField, PdfComboBoxField, PdfListBoxField, PdfRadioButtonListField, PdfRotationAngle } = require('@syncfusion/ej2-pdf');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

// Make DOMParser and XMLSerializer available globally for Syncfusion PDF library
if (typeof global.DOMParser === 'undefined') {
    global.DOMParser = DOMParser;
}
if (typeof global.XMLSerializer === 'undefined') {
    global.XMLSerializer = XMLSerializer;
}

/**
* PDF Viewer Collaboration Adapter - Maps between unified CollaborativeEditingRequest
* and generic CollaborationAction for version-based state management.
* 
* Key pattern: No merge logic. Each request is stored as-is, broadcast as-is.
* Clients filter responses via connectionId. Page organizer uses last-write-wins.
*/
class PdfViewerCollaborationAdapter {
    constructor(options = {}) {
        this.saveTaskQueue = options.saveTaskQueue || null;
        this.transport = options.transport || null;
        this.storageService = options.storageService || null;
    }

    /**
     * Maps control-specific action (CollaborativeEditingRequest) to generic CollaborationAction.
     * Stores the complete request as JSON in the data field.
     */
    mapControlToGenericAction(controlAction) {
        if (!controlAction || typeof controlAction !== 'object') {
            throw new Error(
                `Expected CollaborativeEditingRequest, got ${typeof controlAction}`
            );
        }

        return {
            roomName: controlAction.roomName || '',
            connectionId: controlAction.connectionId || '',
            currentUser: controlAction.userName || '',
            version: controlAction.currentVersion || 0,
            data: JSON.stringify(controlAction)
        };
    }

    /**
     * Maps generic CollaborationAction back to control-specific format for broadcast.
     * Reconstructs the original unified request envelope.
     */
    mapGenericToControlAction(collaborationAction) {
        try {
            return collaborationAction.data
                ? JSON.parse(collaborationAction.data)
                : {};
        } catch (e) {
            console.error('Error parsing action data:', e.message);
            return {};
        }
    }

    /**
     * No operation transformation needed for PDF Viewer.
     * Each action is independently stored and broadcast.
     */
    transformOperations(actions) {
        // No-op: PDF Viewer uses last-write-wins or snapshot approach
    }

    /**
     * Replays collaborative operations against a PDF document using @syncfusion/ej2-pdf.
     * 
     * Loads the master document, applies pending operations (annotations, form fields,
     * page organizer), and saves the updated PDF as a Buffer.
     * 
     * Uses server-side PDF manipulation for better performance (no JSDOM required).
     * 
     * @param {string} masterPdfBase64 - Master PDF encoded as base64
     * @param {Array} operations - Pending operations to replay
     * @returns {Promise<Blob>} Updated PDF as Blob (ready for upload)
     */
    async replayOperationsAndUpdateDocument(masterPdfBase64, operations) {
        try {
            if (!masterPdfBase64 || masterPdfBase64.length === 0) {
                throw new Error('Master PDF is empty or not provided');
            }

            // Convert base64 to Buffer
            const pdfBuffer = Buffer.from(masterPdfBase64, 'base64');
            if (pdfBuffer.length === 0) {
                throw new Error('PDF Buffer is empty after conversion from base64');
            }

            // Load PDF document using Syncfusion PDF library
            const document = new PdfDocument(pdfBuffer);

            if (document.pageCount === 0) {
                console.warn('[ReplayOps] WARNING: Loaded PDF has 0 pages');
            }

            // Extract and validate operations
            const validOperations = this._extractValidOperations(operations);

            if (validOperations.length > 0) {

                let successCount = 0;
                let failureCount = 0;

                for (let i = 0; i < validOperations.length; i++) {
                    const operation = validOperations[i];
                    try {
                        await this.applyOperationToDocument(document, operation);
                        successCount++;
                    } catch (opError) {
                        console.error(
                            `[ReplayOps] Failed to apply operation ${i + 1} (${operation.type}): ${opError.message}`
                        );
                        failureCount++;
                        // Continue with next operation instead of throwing
                    }
                }

            } else {
                console.warn('[ReplayOps] No valid operations to replay');
            }

            // Save updated PDF as Buffer
            const updatedPdfBuffer = await document.save();

            if (!updatedPdfBuffer || updatedPdfBuffer.length === 0) {
                throw new Error('Failed to save PDF: document.save() returned empty buffer');
            }

            // Convert Buffer to Blob for compatibility
            const updatedPdfBlob = new Blob([updatedPdfBuffer], { type: 'application/pdf' });

            return updatedPdfBlob;
        } catch (ex) {
            console.error('[ReplayOps] Error during operation replay:', ex.message);
            console.error('[ReplayOps] Stack:', ex.stack);
            throw ex;
        }
    }

    /**
     * Extracts valid operations from the operations array.
     * Handles various operation formats (wrapped and unwrapped).
     * 
     * @param {Array} operations - Raw operations array
     * @returns {Array} Array of valid operation objects
     */
    _extractValidOperations(operations) {
        try {
            if (!Array.isArray(operations)) {
                console.warn('[ExtractOps] Operations is not an array:', typeof operations);
                return [];
            }

            const validOperations = [];

            for (let i = 0; i < operations.length; i++) {
                const op = operations[i];

                if (!op) {
                    console.warn(`[ExtractOps] Operation ${i} is null or undefined`);
                    continue;
                }

                // Case 1: Direct operation with type and data
                if (op.type && op.data) {
                    validOperations.push(op);
                    continue;
                }

                // Case 2: Operation wrapped in CollaborationAction format with data as JSON string
                if (op.data && typeof op.data === 'string') {
                    try {
                        const fieldData = JSON.parse(op.data);
                        if (fieldData.type === 'annotation') {
                            validOperations.push({
                                type: fieldData.type,
                                data: fieldData.data.xfdfData,
                                action: fieldData.data.action
                            });
                        } else if (fieldData.type === 'pageOrganizer') {
                            const parsedData = JSON.parse(fieldData.data);
                            validOperations.push({
                                type: fieldData.type,
                                data: parsedData[0],
                                action: parsedData[0].action
                            });
                        } else if (fieldData.type === 'formField') {
                            const parsedData = JSON.parse(fieldData.data.jsonData);
                            validOperations.push({
                                type: fieldData.type,
                                data: parsedData,
                                action: fieldData.data.action
                            });
                        }
                        else if (fieldData.type === 'formFieldAction') {
                            const parsedData = JSON.parse(fieldData.data.changes);
                            const data = parsedData.created.length > 0 ? parsedData.created[0] : (parsedData.updated.length ? parsedData.updated[0] : parsedData.deleted[0]);
                            const action = parsedData.created.length > 0 ? 'created' : (parsedData.updated.length ? 'updated' : parsedData.deleted.length > 0 ? 'deleted' : '');
                            // Extract the actual action from parsed data
                            if (fieldData.actionType) {
                                validOperations.push({
                                    type: fieldData.actionType,
                                    data: data,
                                    action: action
                                });
                            } else if (fieldData.type) {
                                validOperations.push({
                                    type: fieldData.type,
                                    data: data,
                                    action: action
                                });
                            }
                        }
                    } catch (parseError) {
                        console.warn(
                            `[ExtractOps] Failed to parse operation ${i} data as JSON:`,
                            parseError.message
                        );
                    }
                }

                // Case 3: Operation has nested action object
                if (op.action && typeof op.action === 'string') {
                    validOperations.push({
                        type: op.action,
                        data: op,
                        action: action
                    });
                }
            }

            // Log operation types for debugging
            const opTypes = validOperations.map(op => op.type);

            return validOperations;
        } catch (ex) {
            console.error('[ExtractOps] Error extracting operations:', ex.message);
            return [];
        }
    }

    /**
     * Applies a single operation to the PDF document based on operation type.
     * 
     * Handles:
     * - annotation / annotationUpdate: Apply annotation data via XFDF
     * - formField / formFieldAction: Apply form field updates
     * - pageOrganizer: Apply page rearrangement/deletion
     * - addUser / removeUser: User presence (ignored on save)
     * - connectionId: Connection echo (ignored on save)
     * 
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {Object} operation - Operation to apply (must have type and data)
     */
    async applyOperationToDocument(document, operation) {
        if (!operation) {
            console.warn('[ApplyOp] Skipping null operation');
            return;
        }

        const opType = operation.type || 'unknown';
        const opData = operation.data || {};

        try {

            switch (opType.toLowerCase()) {
                case 'annotation':
                case 'annotationupdate':
                    // Apply annotation data via XFDF import
                    if (opData) {
                        const xfdfData = opData;
                        await this._importAnnotationsFromXfdf(document, xfdfData, operation.action);
                    } else {
                        console.warn('[ApplyOp] No XFDF data found in annotation operation');
                    }
                    break;

                case 'formfield':
                case 'formfieldaction':
                case 'formfieldupdate':
                    // Apply form field updates
                    await this._applyFormFieldUpdates(document, opData, operation.type, operation.action);
                    break;

                case 'pageorganizer':
                case 'pageOrganizer':
                case 'pageorganizeractions':
                    // Apply page rearrangement/deletion (last-write-wins)
                    await this._applyPageOrganizerActions(document, opData);
                    break;

                // Ignore user presence operations
                case 'adduser':
                case 'removeuser':
                case 'connectionid':
                    break;

                default:
                    console.warn(`[ApplyOp] Unknown operation type: ${opType}`);
            }

        } catch (ex) {
            console.error(
                `[ApplyOp] Error applying operation (${opType}): ${ex.message}`
            );
            console.error('[ApplyOp] Operation data:', opData);
            throw ex;
        }
    }

    /**
     * Imports annotations from XFDF data into the PDF document.
     * Parses XFDF, handles changesets (add/modify/delete), generates pure XFDF,
     * and applies annotations to the document.
     *
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {string} xfdfData - XFDF XML string containing annotations
     * @param {string} action - Action type (add/modify/delete)
     */
    async _importAnnotationsFromXfdf(document, xfdfData, action) {
        try {
            if (typeof xfdfData !== 'string' || xfdfData.trim() === '') {
                throw new Error('Unrecognized XFDF structure');
            }
            // Parse XFDF document
            const xmlDocument = this._parseXfdfDocument(xfdfData, 'importAnnotationCommand');
            const xfdfElement = xmlDocument.documentElement;
            // Get direct child elements
            const addElement = this._getDirectChildElement(xfdfElement, 'add');
            const modifyElement = this._getDirectChildElement(xfdfElement, 'modify');
            const deleteElement = this._getDirectChildElement(xfdfElement, 'delete');
            let pureXfdf = null;
            const annotationElements = [];
            if (action === 'Add' && addElement && addElement.children.length > 0) {
                const addElements = this._getSupportedAnnotationElements(addElement);
                annotationElements.push(...addElements);
            }
            else if (action === 'Modify' && modifyElement && modifyElement.children.length > 0) {
                this._removeAnnotations(modifyElement, document);
                const modElements = this._getSupportedAnnotationElements(modifyElement);
                annotationElements.push(...modElements);
            }
            else if (action === 'Delete' && deleteElement && deleteElement.children.length > 0) {
                this._removeAnnotations(deleteElement, document);
            }
            if (annotationElements.length > 0) {
                const serializedElements = annotationElements.map(element => this._serializeXmlNode(element));
                pureXfdf = this._createPureXfdf(serializedElements);
            }
            // Import pure XFDF to document
            if (pureXfdf) {
                document.importAnnotations(new TextEncoder().encode(pureXfdf), DataFormat.xfdf);
            } else {
                console.warn('[ImportXfdf] No valid annotations found to import');
            }
        } catch (ex) {
            console.error('[ImportXfdf] Error importing XFDF:', ex.message);
            console.error('[ImportXfdf] Stack:', ex.stack);
            throw ex;
        }
    }

    /**
     * Parses XFDF data into an XML document.
     * Validates XML structure and throws error if parsing fails.
     *
     * @param {string} data - XFDF XML string
     * @param {string} commandName - Command name for error reporting
     * @returns {Document} Parsed XML document
     */
    _parseXfdfDocument(data, commandName) {
        try {
            const parser = new DOMParser();
            const xmlDocument = parser.parseFromString(data, 'text/xml');

            // Check for parse errors
            const parseErrors = xmlDocument.getElementsByTagName('parsererror');
            if (parseErrors && parseErrors.length > 0) {
                const parseError = parseErrors[0];
                const errorMsg = parseError.textContent || 'Malformed XML';
                throw new Error(`${commandName}: ${errorMsg}`);
            }

            return xmlDocument;
        } catch (ex) {
            console.error(`[ParseXfdf] Error parsing XFDF: ${ex.message}`);
            throw ex;
        }
    }

    /**
     * Gets the first direct child element with the specified name.
     *
     * @param {Element} parent - Parent element
     * @param {string} elementName - Name of child element to find
     * @returns {Element|null} Found element or null
     */
    _getDirectChildElement(parent, elementName) {
        if (!parent) {
            return null;
        }
        for (let i = 0; i < parent.childNodes.length; i++) {
            const childNode = parent.childNodes[i];
            if (childNode.nodeType === 1) { // Element node
                if (this._getNodeName(childNode) === elementName) {
                    return childNode;
                }
            }
        }
        return null;
    }

    /**
     * Gets the local or node name of an element, lowercased.
     *
     * @param {Element} element - XML element
     * @returns {string} Element name in lowercase
     */
    _getNodeName(element) {
        const localName = element.localName || element.nodeName;
        return localName ? localName.toLowerCase() : '';
    }

    /**
     * Removes annotations from the PDF document based on annotation data in a container element.
     * Iterates through child annotation elements and removes matching annotations from the loaded document.
     * This method performs side effects (removes annotations) and does not return any value.
     *
     * @param {Element} container - Container element with annotation children (add/modify elements)
     * @param {PdfDocument} document - Syncfusion PdfDocument instance to remove annotations from
     * @returns {void} No return value - performs annotation removal as side effect
     */
    _removeAnnotations(container, document) {
        if (!container || !container.childNodes) {
            return;
        }
        for (let i = 0; i < container.childNodes.length; i++) {
            const childNode = container.childNodes[i];
            // Skip non-element nodes (text, comments, etc.)
            if (childNode.nodeType !== 1) {
                continue;
            }
            const id = childNode.getAttribute('name');
            const pageIndex = Number(childNode.getAttribute('page'));
            if (id) {
                this.removeAnnotationsInLoadedDocument(id, pageIndex, document);
                break;
            }
        }
    }

    /**
     * Removes annotations from the PDF document by matching the annotation ID.
     * Searches through all annotations on a specific page and removes the one with matching ID.
     * Iterates in reverse order to safely remove items during iteration.
     * Does not return any value - performs removal as a side effect.
     *
     * @param {string} id - The annotation ID to match and remove
     * @param {number} pageIndex - Zero-based page index where the annotation is located
     * @param {PdfDocument} document - Syncfusion PdfDocument instance containing the annotations
     * @returns {void} No return value - performs annotation removal as side effect
     */
    removeAnnotationsInLoadedDocument(id, pageIndex, document) {
        const page = document.getPage(pageIndex);
        if (page && page.annotations && page.annotations.count > 0) {
            // Iterate in reverse to safely remove items
            for (let j = page.annotations.count - 1; j >= 0; j--) {
                const annotationObject = page.annotations.at(j);
                if (annotationObject && annotationObject.name === id) {
                    page.annotations.removeAt(j);
                    break; // Remove only the matching annotation
                }
            }
        }
    }

    /**
     * Filters and returns only supported annotation element types.
     * Excludes elements that are not annotation data.
     *
     * @param {Element} container - Container element with potential annotation children
     * @returns {Array<Element>} Array of supported annotation elements
     */
    _getSupportedAnnotationElements(container) {
        const supportedTypes = [
            'highlight', 'underline', 'strikeout', 'squiggly', 'square', 'circle', 'line',
            'polygon', 'polyline', 'freetext', 'ink', 'stamp', 'text', 'redact'
        ];
        const elements = [];
        if (!container || !container.childNodes) {
            return elements;
        }
        for (let i = 0; i < container.childNodes.length; i++) {
            const childNode = container.childNodes[i];
            // Skip non-element nodes (text, comments, etc.)
            if (childNode.nodeType !== 1) {
                continue;
            }
            const element = childNode;
            if (supportedTypes.includes(this._getNodeName(element))) {
                elements.push(element);
            } else {
                console.warn(`[GetSupportedAnnots] Skipping unsupported annotation type: ${this._getNodeName(element)}`);
            }
        }
        return elements;
    }

    /**
     * Serializes an XML node to string representation.
     *
     * @param {Node} node - XML node to serialize
     * @returns {string} Serialized XML string
     */
    _serializeXmlNode(node) {
        return new XMLSerializer().serializeToString(node);
    }

    /**
     * Creates a pure XFDF document from annotation element strings using DOM API.
     * Constructs valid XFDF structure with annots container using proper DOM methods.
     * Avoids hardcoded XML strings and ensures proper namespace handling.
     *
     * @param {Array<string>} annotationElements - Serialized annotation XML strings
     * @returns {string} Complete XFDF XML string with proper namespace
     */
    _createPureXfdf(annotationElements) {
        try {
            const XFDF_XMLNS = 'http://ns.adobe.com/xfdf/';
            // Create a blank XFDF document using DOM API
            const xmlDoc = this._createBlankXfdfDocument(XFDF_XMLNS);
            const rootElement = xmlDoc.documentElement;
            const annotsElement = xmlDoc.createElementNS(XFDF_XMLNS, 'annots');
            let successCount = 0;
            const parser = new DOMParser();
            // Parse and append annotation elements safely using proper DOM methods
            for (let i = 0; i < annotationElements.length; i++) {
                const elementStr = annotationElements[i];
                try {
                    if (!elementStr || elementStr.trim() === '') {
                        console.warn(`[CreatePureXfdf] Element ${i} is empty, skipping`);
                        continue;
                    }
                    // Parse the annotation element string
                    const tempDoc = parser.parseFromString(elementStr, 'text/xml');
                    // Check for parse errors
                    if (tempDoc.documentElement && tempDoc.documentElement.nodeName !== 'parsererror') {
                        const element = tempDoc.documentElement;
                        const tagName = this._getNodeName(element);
                        // Import and append the element using DOM API
                        const importedNode = xmlDoc.importNode(element, true);
                        annotsElement.appendChild(importedNode);
                        successCount++;
                    } else {
                        console.warn(`[CreatePureXfdf] Element ${i} has parse error, skipping`);
                    }
                } catch (error) {
                    console.warn(`[CreatePureXfdf] Element ${i} error: ${error.message}`);
                    continue;
                }
            }
            if (successCount === 0) {
                throw new Error('No valid annotation elements found to create XFDF');
            }
            // Append annots element to root
            rootElement.appendChild(annotsElement);
            // Serialize to string
            const serializer = new XMLSerializer();
            return serializer.serializeToString(xmlDoc);
        } catch (ex) {
            console.error('[CreatePureXfdf] Error creating pure XFDF:', ex.message);
            console.error('[CreatePureXfdf] Stack:', ex.stack);
            throw ex;
        }
    }

    /**
     * Creates a blank XFDF document with proper namespace and structure.
     * Works in both browser and Node.js environments using DOMParser.
     *
     * @param {string} xfdfNamespace - XFDF XML namespace URI
     * @returns {XMLDocument} Properly initialized XFDF document
     */
    _createBlankXfdfDocument(xfdfNamespace) {
        try {
            const parser = new DOMParser();
            // Create XFDF document by parsing an XML string
            // This approach works in both browser and Node.js environments
            const xfdfString = `<?xml version="1.0" encoding="UTF-8"?> <xfdf xmlns="${xfdfNamespace}" xml:space="preserve"></xfdf>`;
            const xmlDoc = parser.parseFromString(xfdfString, 'text/xml');
            // Validate parsing
            if (xmlDoc.documentElement && xmlDoc.documentElement.nodeName !== 'parsererror') {
                return xmlDoc;
            } else {
                throw new Error('Failed to parse XFDF template');
            }
        } catch (ex) {
            console.error('[CreateBlankXfdf] Error creating blank XFDF document:', ex.message);
            throw ex;
        }
    }

    /**
     * Applies form field updates to the PDF document.
     * Handles two modes:
     * - formField: Simple value updates on existing fields
     * - formFieldAction: Creates new fields in Form Designer mode or updates existing ones
     * 
     * Checks if field already exists. If yes, updates the latest value. If no, creates new field.
     * 
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {Object} formFieldData - Form field update data
     */
    async _applyFormFieldUpdates(document, formFieldData, type, action) {
        try {

            // Case 1: formField type - update existing field values only
            if (type === 'formField') {
                await this._updateFormFieldValues(document, formFieldData);
            }
            // Case 2: formFieldAction type - add new fields or update existing ones in Form Designer mode
            else if (type === 'formFieldAction') {
                if (action === 'deleted' || action === 'updated') {
                    for (let i = 0; i < document.form.count; i++) {
                        if (document.form.fieldAt(i).name === formFieldData.name) {
                            if (formFieldData.formFieldAnnotationType === 'InitialField' || formFieldData.formFieldAnnotationType === 'SignatureField') {
                                if (Math.floor(document.form.fieldAt(i).bounds.x) === Math.floor(formFieldData.lineBound.X) &&
                                    Math.floor(document.form.fieldAt(i).bounds.y) === Math.floor(formFieldData.lineBound.Y) &&
                                    (document.form.fieldAt(i).page._pageIndex + 1 === formFieldData.pageNumber)) {
                                    document.form.removeFieldAt(i);
                                }
                            }
                            else if (Math.floor(document.form.fieldAt(i).bounds.x) === Math.floor(this.convertPixelToPoint(formFieldData.bounds.x)) &&
                                Math.floor(document.form.fieldAt(i).bounds.y) === Math.floor(this.convertPixelToPoint(formFieldData.bounds.y)) &&
                                (document.form.fieldAt(i).page._pageIndex + 1 === formFieldData.pageNumber)) {
                                document.form.removeFieldAt(i);
                            }
                        }
                    }
                }
                if (action === 'created' || action === 'updated') {
                    await this._handleFormFieldAction(document, formFieldData);
                }

                if (document.form) {
                    for (let i = 0; i < document.form.count; i++) {
                        const field = document.form.fieldAt(i);
                        field.setAppearance(true);
                    }
                }
            }
        } catch (ex) {
            console.error('[ApplyFormFields] Error applying form field updates:', ex.message);
            console.error('[ApplyFormFields] Full error:', ex);
            throw ex;
        }
    }

    /**
     * Updates existing form field values using field name mapping.
     * Properly handles all field types: TextBox, CheckBox, RadioButton, ComboBox, ListBox.
     * Ignores SignatureField and InitialField types.
     * 
     * Implements the Syncfusion pattern:
     * 1. Retrieve field name (both stripped and actual)
     * 2. Match against input data object keys
     * 3. Update based on field type and value
     * 
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {Object} formFieldData - Object with field names as keys and values as values: { "fieldName": value, ... }
     */
    async _updateFormFieldValues(document, formFieldData) {
        try {

            // Get total form field count from document
            if (!document.form) {
                console.warn('[UpdateValues] No form found in document');
                return;
            }

            const fieldCount = document.form.count || (document.form._fields ? document.form._fields.length : 0);
            if (fieldCount === 0) {
                console.warn('[UpdateValues] No form fields found in document');
                return;
            }

            // Input data mapping object: { "fieldName": value }
            // Handle both string and object formats
            let data = formFieldData;
            if (typeof formFieldData === 'string') {
                try {
                    data = JSON.parse(formFieldData);
                } catch (e) {
                    console.error('[UpdateValues] Failed to parse formFieldData as JSON:', e.message);
                    return;
                }
            }

            if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                console.warn('[UpdateValues] No field data provided for update');
                return;
            }

            let updatedCount = 0;

            // Iterate through all document form fields
            for (let i = 0; i < fieldCount; i++) {
                const currentField = document.form.fieldAt(i);
                if (!currentField) {
                    continue;
                }

                // Get field names: stripped (no special chars) and actual
                let currentFieldName = '';
                let actualFieldName = '';

                if (currentField.name) {
                    // Stripped name: remove all non-alphanumeric chars and spaces
                    currentFieldName = currentField.name.replace(/[^0-9a-zA-Z]+/g, '').replace(/\s+/g, '');
                    // Actual name: original with spaces and special chars
                    actualFieldName = currentField.name;
                }

                const fieldType = currentField.constructor ? currentField.constructor.name : '';
                // Check if field data exists for this field (by stripped or actual name)
                let hasData = false;
                let fieldDataKey = null;

                if (Object.prototype.hasOwnProperty.call(data, currentFieldName)) {
                    hasData = true;
                    fieldDataKey = currentFieldName;
                } else if (Object.prototype.hasOwnProperty.call(data, actualFieldName)) {
                    hasData = true;
                    fieldDataKey = actualFieldName;
                }

                if (!hasData) {
                    continue;
                }

                const fieldValue = data[fieldDataKey];

                // Handle field types: TextBox, CheckBox, RadioButton, ComboBox, ListBox
                // Skip: SignatureField, InitialField

                // TextBox / Password Field
                if (currentField instanceof PdfTextBoxField) {
                    if (fieldValue !== null && fieldValue !== undefined) {
                        currentField.text = String(fieldValue);
                        currentField.value = String(fieldValue);
                        updatedCount++;
                    }
                }
                // CheckBox Field
                else if (currentField instanceof PdfCheckBoxField) {
                    const fieldValueString = String(fieldValue).toLowerCase();
                    const isChecked = fieldValueString === 'true' || fieldValueString === 'yes' || fieldValue === true;

                    currentField.checked = isChecked;
                    updatedCount++;
                }
                // RadioButton / RadioButtonList Field
                else if (currentField instanceof PdfRadioButtonListField) {
                    const selectedValue = String(fieldValue);
                    const itemsCount = currentField.itemsCount || 0;

                    for (let j = 0; j < itemsCount; j++) {
                        const item = currentField.itemAt(j);
                        if (item && (item.value === selectedValue || item._optionValue === selectedValue)) {
                            currentField.selectedIndex = j;
                            updatedCount++;
                            break;
                        }
                    }
                }
                // ComboBox / Dropdown Field
                else if (currentField instanceof PdfComboBoxField) {
                    const selectedValue = String(fieldValue);
                    const itemsCount = currentField.itemsCount || 0;
                    let isFound = false;

                    // Try to match option text or value
                    for (let j = 0; j < itemsCount; j++) {
                        let optionText = null;

                        // Try itemAt() method
                        if (currentField.itemAt && currentField.itemAt(j)) {
                            optionText = currentField.itemAt(j).text;
                        }
                        // Try _dictionary approach
                        else if (currentField._dictionary && currentField._dictionary.has('Opt')) {
                            const optionArray = currentField._dictionary.get('Opt');
                            optionText = optionArray[j];
                        }

                        if (optionText && (optionText === selectedValue || (Array.isArray(optionText) && optionText[1] === selectedValue))) {
                            currentField.selectedIndex = j;
                            isFound = true;
                            updatedCount++;
                            break;
                        }
                    }

                    // If not found in options and field is editable, set selectedValue directly
                    if (!isFound && currentField.editable) {
                        currentField.selectedValue = selectedValue;
                        updatedCount++;
                    }
                }
                // ListBox Field
                else if (currentField instanceof PdfListBoxField) {
                    const selectedValue = String(fieldValue);
                    const itemsCount = currentField.itemsCount || 0;
                    const selectedIndexes = [];

                    // Match option text
                    for (let j = 0; j < itemsCount; j++) {
                        const optionText = currentField.itemAt(j) ? currentField.itemAt(j).text : null;
                        if (optionText) {
                            const strippedText = optionText.replace(/[^0-9a-zA-Z]+/g, '');
                            const strippedValue = selectedValue.replace(/[^0-9a-zA-Z]+/g, '');
                            if (strippedText === strippedValue) {
                                selectedIndexes.push(j);
                            }
                        }
                    }

                    if (selectedIndexes.length > 0) {
                        currentField.selectedIndex = selectedIndexes;
                        updatedCount++;
                    }
                }
            }

            return document;
        } catch (ex) {
            console.error('[UpdateValues] Error updating field values:', ex.message);
            console.error('[UpdateValues] Stack:', ex.stack);
            throw ex;
        }
    }

    /**
     * Handles Form Designer action - create or update fields.
     * Checks if field exists; if yes, updates it; if no, creates it.
     * 
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {Object} formFieldData - Form Designer action data
     */
    async _handleFormFieldAction(document, formFieldData) {
        try {
            const fieldAttributes = formFieldData.fieldAttributes || formFieldData;
            const fieldName = fieldAttributes.fieldName || fieldAttributes.name;

            await this._createFormField(document, fieldAttributes);
        } catch (ex) {
            console.error('[FormFieldAction] Error handling field action:', ex.message);
            throw ex;
        }
    }

    /**
     * Updates properties of an existing form field.
     * Ensures changes are properly persisted to the document.
     * 
     * @param {PdfField} field - Existing PDF field to update
     * @param {Object} attributes - New field attributes
     */
    async _updateExistingField(field, attributes) {
        try {
            if (!field) {
                console.warn('[UpdateField] Field object is null or undefined');
                return;
            }
            // Update value - try multiple property names
            if (attributes.value !== undefined) {
                field.value = attributes.value;
                field.Value = attributes.value;
                field.text = attributes.value;
                field.Text = attributes.value;
            }

            // Update visibility - try multiple property names
            if (attributes.visibility !== undefined) {
                field.visibility = attributes.visibility;
                field.Visibility = attributes.visibility;
            }

            // Update read-only status - try multiple property names
            if (attributes.readOnly !== undefined) {
                field.readOnly = attributes.readOnly;
                field.ReadOnly = attributes.readOnly;
            }

            // Update required status - try multiple property names
            if (attributes.required !== undefined) {
                field.required = attributes.required;
                field.Required = attributes.required;
            }

            // Update field-specific properties
            if (attributes.multiLine !== undefined) {
                field.multiLine = attributes.multiLine;
                field.MultiLine = attributes.multiLine;
            }

            if (attributes.maxLength !== undefined) {
                field.maxLength = attributes.maxLength;
                field.MaxLength = attributes.maxLength;
            }

            if (attributes.insertSpaces !== undefined) {
                field.insertSpaces = attributes.insertSpaces;
                field.InsertSpaces = attributes.insertSpaces;
            }

            // Update font properties if available
            if (attributes.fontSize !== undefined) {
                if (field.font) {
                    field.font.size = attributes.fontSize;
                }
            }

            // Update colors if available
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                field.backColor = bgColor;
                field.BackColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                field.color = fontColor;
                field.Color = fontColor;
            }

        } catch (ex) {
            console.error('[UpdateField] Error updating field:', ex.message);
            console.error('[UpdateField] Stack:', ex.stack);
            throw ex;
        }
    }

    /**
     * Creates a new form field in the PDF document.
     * Supports TextBox, CheckBox, RadioButton, DropDown, ListBox, and Signature fields.
     * 
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {Object} fieldAttributes - Field attributes including type, bounds, page number, etc.
     */
    async _createFormField(document, fieldAttributes) {
        try {
            const fieldType = fieldAttributes.fieldType || fieldAttributes.type || 'TextBox';
            const pageNumber = fieldAttributes.pageNumber || fieldAttributes.pageIndex || 0;
            const fieldName = fieldAttributes.fieldName || fieldAttributes.name;

            // // Validate page number
            // if (pageNumber < 0 || pageNumber >= document.pageCount) {
            //     console.warn(
            //         `[CreateField] Invalid page number ${pageNumber}. Document has ${document.pageCount} pages`
            //     );
            //     return;
            // }

            const page = document.getPage(pageNumber - 1);
            if (!page) {
                console.warn(`[CreateField] Could not get page ${pageNumber}`);
                return;
            }

            // Parse bounds if provided
            let bounds = this._parseBounds(fieldAttributes.bounds);

            // Create field based on type
            let field = null;

            switch (fieldType.toLowerCase()) {
                case 'textbox':
                case 'text':
                case 'password':
                    field = this._createTextBoxField(page, fieldName, fieldAttributes, bounds);
                    break;

                case 'checkbox':
                case 'checkboxfield':
                    field = this._createCheckBoxField(page, fieldName, fieldAttributes, bounds);
                    break;

                case 'radiobutton':
                case 'radiobuttonfield':
                    field = this._createRadioButtonField(page, fieldName, fieldAttributes, bounds);
                    break;

                case 'dropdown':
                case 'combobox':
                case 'comboboxfield':
                    field = this._createDropDownField(page, fieldName, fieldAttributes, bounds);
                    break;

                case 'listbox':
                case 'listboxfield':
                    field = this._createListBoxField(page, fieldName, fieldAttributes, bounds);
                    break;

                case 'signature':
                case 'signaturefield':
                case 'initial':
                case 'initialfield':
                    // if (fieldAttributes.lineBound) {
                    //     bounds = fieldAttributes.lineBound;
                    // }
                    field = this._createSignatureField(page, fieldName, fieldAttributes, bounds);
                    break;

                default:
                    console.warn(`[CreateField] Unknown field type: ${fieldType}`);
                    return;
            }

            if (field) {
                const id = fieldAttributes.id;
                if (field._dictionary) {
                    field._dictionary.set('Id', id);
                }
                // Validate document form exists
                if (!document.form) {
                    console.error('[CreateField] Document form is undefined or null');
                    return;
                }

                // Add field to form
                try {
                    document.form.add(field);
                } catch (addError) {
                    console.error('[CreateField] Error adding field to form:', addError.message);
                    throw addError;
                }
            } else {
                console.warn(`[CreateField] Field creation returned null for type: ${fieldType}`);
            }
        } catch (ex) {
            console.error('[CreateField] Error creating form field:', ex.message);
            console.error('[CreateField] Stack trace:', ex.stack);
            throw ex;
        }
    }

    /**
     * Parses color from various formats (object with r,g,b,a, hex string, or named color).
     * Returns RGB object compatible with PdfDocument color properties.
     * 
     * @param {*} colorData - Color in various formats
     * @returns {Object} Parsed color object {r, g, b} or {r, g, b, a}
     */
    _parseColor(colorData) {
        try {
            if (!colorData) {
                return { r: 0, g: 0, b: 0 };
            }

            // Already RGBA object
            if (typeof colorData === 'object' && colorData.r !== undefined && colorData.g !== undefined && colorData.b !== undefined) {
                return {
                    r: Math.min(255, Math.max(0, colorData.r)),
                    g: Math.min(255, Math.max(0, colorData.g)),
                    b: Math.min(255, Math.max(0, colorData.b)),
                    a: colorData.a !== undefined ? colorData.a : 255
                };
            }

            // Hex string (e.g., "#FF0000" or "FF0000")
            if (typeof colorData === 'string' && colorData.startsWith('#')) {
                const hex = colorData.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                return { r, g, b, a: 255 };
            }

            // Named colors
            const namedColors = {
                'red': { r: 255, g: 0, b: 0 },
                'green': { r: 0, g: 128, b: 0 },
                'blue': { r: 0, g: 0, b: 255 },
                'black': { r: 0, g: 0, b: 0 },
                'white': { r: 255, g: 255, b: 255 },
                'gray': { r: 128, g: 128, b: 128 },
                'yellow': { r: 255, g: 255, b: 0 },
                'cyan': { r: 0, g: 255, b: 255 },
                'magenta': { r: 255, g: 0, b: 255 }
            };

            if (typeof colorData === 'string' && namedColors[colorData.toLowerCase()]) {
                return { ...namedColors[colorData.toLowerCase()], a: 255 };
            }

            return { r: 0, g: 0, b: 0, a: 255 };
        } catch (ex) {
            console.warn('[ParseColor] Error parsing color:', ex.message);
            return { r: 0, g: 0, b: 0, a: 255 };
        }
    }

    /**
     * Gets PdfFontFamily enum value based on font name.
     * 
     * @param {string} fontName - Font name (e.g., "Helvetica", "Times New Roman", "Courier")
     * @returns {*} PdfFontFamily enum value
     */
    _getFontFamily(fontName) {
        try {
            // const { PdfFontFamily } = require('@syncfusion/ej2-pdf');

            if (!fontName) return PdfFontFamily.helvetica;

            const fontNameLower = fontName.toLowerCase();

            if (fontNameLower.includes('times')) return PdfFontFamily.timesRoman;
            if (fontNameLower.includes('courier')) return PdfFontFamily.courier;
            if (fontNameLower.includes('symbol')) return PdfFontFamily.symbol;
            if (fontNameLower.includes('zapf')) return PdfFontFamily.zapfDingbats;

            return PdfFontFamily.helvetica;
        } catch (ex) {
            console.warn('[GetFontFamily] Error:', ex.message);
            return null;
        }
    }

    /**
     * Gets PdfFontStyle enum value based on attributes.
     * Supports bold, italic, underline, strikethrough.
     * 
     * @param {Object} attributes - Field attributes containing font style flags
     * @returns {*} PdfFontStyle enum value
     */
    _getPdfFontStyle(attributes) {
        try {
            const { PdfFontStyle } = require('@syncfusion/ej2-pdf');

            let style = PdfFontStyle.regular;

            if (attributes.bold) {
                style |= PdfFontStyle.bold;
            }

            if (attributes.italic) {
                style |= PdfFontStyle.italic;
            }

            if (attributes.underline) {
                style |= PdfFontStyle.underline;
            }

            if (attributes.strikethrough) {
                style |= PdfFontStyle.strikeout;
            }

            return style;
        } catch (ex) {
            console.warn('[GetPdfFontStyle] Error:', ex.message);
            return null;
        }
    }

    /**
     * Gets text alignment enum value.
     * 
     * @param {string} align - Alignment value (e.g., "Left", "Center", "Right", "Justified")
     * @returns {*} PdfTextAlignment enum value
     */
    _getTextAlignment(align) {
        try {
            const { PdfTextAlignment } = require('@syncfusion/ej2-pdf');

            if (!align) return PdfTextAlignment.left;

            const alignLower = align.toLowerCase();

            if (alignLower === 'center') return PdfTextAlignment.center;
            if (alignLower === 'right') return PdfTextAlignment.right;
            if (alignLower === 'justify') return PdfTextAlignment.justify;

            return PdfTextAlignment.left;
        } catch (ex) {
            console.warn('[GetTextAlignment] Error:', ex.message);
            return null;
        }
    }

    /**
     * Parses bounds from various formats (object, string, array).
     * Returns default bounds if not provided.
     * 
     * @param {*} boundsData - Bounds data in various formats
     * @returns {Object} Parsed bounds object {x, y, width, height}
     */
    _parseBounds(boundsData) {
        // Default bounds
        const defaultBounds = { x: 0, y: 0, width: 100, height: 20 };

        if (!boundsData) {
            return defaultBounds;
        }

        try {
            // If already an object with x, y, width, height
            if (typeof boundsData === 'object' && (boundsData.x !== undefined || boundsData.X !== undefined) && (boundsData.y !== undefined || boundsData.Y !== undefined)) {
                return {
                    x: this.convertPixelToPoint(boundsData.x !== undefined ? boundsData.x : boundsData.X),
                    y: this.convertPixelToPoint(boundsData.y !== undefined ? boundsData.y : boundsData.Y),
                    width: this.convertPixelToPoint(boundsData.width !== undefined ? boundsData.width : (boundsData.Width !== undefined ? boundsData.Width : 100)),
                    height: this.convertPixelToPoint(boundsData.height !== undefined ? boundsData.height : (boundsData.Height !== undefined ? boundsData.Height : 20))
                };
            }

            // If string representation
            if (typeof boundsData === 'string') {
                const parsed = JSON.parse(boundsData);
                return this._parseBounds(parsed);
            }

            // If array [x, y, width, height]
            if (Array.isArray(boundsData) && boundsData.length >= 4) {
                return {
                    x: this.convertPixelToPoint(boundsData[0]),
                    y: this.convertPixelToPoint(boundsData[1]),
                    width: this.convertPixelToPoint(boundsData[2]),
                    height: this.convertPixelToPoint(boundsData[3])
                };
            }
        } catch (ex) {
            console.warn('[ParseBounds] Error parsing bounds:', ex.message);
        }

        return defaultBounds;
    }

    convertPixelToPoint(value) {
        return (value * 72 / 96);
    }

    convertPointtoPixel(value) {
        return (value * 96 / 72);
    }

    /**
     * Creates a TextBox form field with comprehensive property support.
     * Supports all text, styling, validation, and visual properties.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes
     * @param {Object} bounds - Field bounds
     * @returns {PdfTextBoxField|null}
     */
    _createTextBoxField(page, fieldName, attributes, bounds) {
        try {
            // Validate page parameter
            if (!page) {
                console.error('[CreateTextField] Page object is undefined or null');
                return null;
            }

            const { PdfTextBoxField, PdfStandardFont, PdfFontStyle } = require('@syncfusion/ej2-pdf');

            const textBox = new PdfTextBoxField(page, fieldName, bounds);

            // === TEXT AND VALUE PROPERTIES ===
            if (attributes.value !== undefined) {
                textBox.text = attributes.value;
            }
            if (attributes.formFieldAnnotationType === 'PasswordField') {
                textBox.password = true;
            }

            // === FIELD BEHAVIOR ===
            if (attributes.isMultiline !== undefined) {
                textBox.multiLine = attributes.isMultiline;
            }

            if (attributes.isReadonly !== undefined) {
                textBox.readOnly = attributes.isReadonly;
            }

            if (attributes.isRequired !== undefined) {
                textBox.required = attributes.isRequired;
            }

            if (attributes.maxLength !== undefined && attributes.maxLength > 0) {
                textBox.maxLength = attributes.maxLength;
            }

            if (attributes.insertSpaces !== undefined) {
                textBox.insertSpaces = attributes.insertSpaces;
            }

            // === VISIBILITY AND DISPLAY ===
            if (attributes.visibility !== undefined) {
                textBox.visibility = attributes.visibility;
            }

            // === ALIGNMENT ===
            if (attributes.alignment !== undefined) {
                textBox.textAlignment = this._getTextAlignment(attributes.alignment);
            }

            // === COLORS ===
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                textBox.backColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                textBox.color = fontColor;
            }

            if (attributes.borderColor !== undefined) {
                const brdrColor = this._parseColor(attributes.borderColor);
                textBox.borderColor = brdrColor;
            }

            // === BORDER PROPERTIES ===
            if (attributes.thickness !== undefined) {
                textBox.border.width = attributes.thickness;
            }

            if (attributes.borderStyle !== undefined) {
                // Set border style if supported by PdfStandardBorder
                textBox.border.style = attributes.borderStyle;
            }

            // === FONT PROPERTIES ===
            if (attributes.fontSize !== undefined || attributes.fontFamily !== undefined) {
                const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
                const fontSize = attributes.fontSize || 12;
                const fontStyle = this._getPdfFontStyle(attributes);
                textBox._dictionary.set('FontStyle', fontStyle);
                textBox.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
            }

            if (attributes.fontStyle !== undefined) {
                // Set font style (bold, italic, underline, strikethrough)
                const fontStyle = this._getPdfFontStyle(attributes);
                if (textBox.font) {
                    textBox.font.style = fontStyle;
                } else {
                    const { PdfFontFamily } = require('@syncfusion/ej2-pdf');
                    const fontFamily = PdfFontFamily.Helvetica;
                    const fontSize = attributes.fontSize || 12;
                    textBox.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
                }
            }

            // === TOOLTIP ===
            if (attributes.tooltip !== undefined) {
                textBox.toolTip = attributes.tooltip;
            }

            // === ADDITIONAL PROPERTIES ===
            if (attributes.customData !== undefined) {
                // Custom data can be stored as user data if supported
                // textBox.userData = attributes.customData;
            }

            return textBox;
        } catch (ex) {
            console.error('[CreateTextField] Error:', ex.message);
            return null;
        }
    }

    /**
     * Creates a CheckBox form field with comprehensive property support.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes
     * @param {Object} bounds - Field bounds
     * @returns {PdfCheckBoxField|null}
     */
    _createCheckBoxField(page, fieldName, attributes, bounds) {
        try {
            // Validate page parameter
            if (!page) {
                console.error('[CreateCheckBoxField] Page object is undefined or null');
                return null;
            }

            const { PdfCheckBoxField, PdfStandardFont } = require('@syncfusion/ej2-pdf');

            const checkBox = new PdfCheckBoxField(fieldName, bounds, page);

            // === CHECKED STATE ===
            if (attributes.isChecked !== undefined) {
                checkBox.checked = attributes.isChecked;
            }

            // if (attributes.value !== undefined) {
            //     // For checkboxes, value is typically "Yes" or "No"
            //     checkBox.checked = (attributes.value === 'Yes' || attributes.value === true);
            // }

            // === FIELD BEHAVIOR ===
            if (attributes.isReadonly !== undefined) {
                checkBox.readOnly = attributes.isReadonly;
            }

            if (attributes.isRequired !== undefined) {
                checkBox.required = attributes.isRequired;
            }

            // === VISIBILITY ===
            if (attributes.visibility !== undefined) {
                checkBox.visibility = attributes.visibility;
            }

            // === COLORS ===
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                checkBox.backColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                checkBox.color = fontColor;
            }

            if (attributes.borderColor !== undefined) {
                const brdrColor = this._parseColor(attributes.borderColor);
                checkBox.borderColor = brdrColor;
            }

            // === BORDER PROPERTIES ===
            if (attributes.thickness !== undefined) {
                checkBox.border.width = attributes.thickness;
            }

            if (attributes.borderStyle !== undefined) {
                checkBox.border.style = attributes.borderStyle;
            }

            // === FONT PROPERTIES ===
            if (attributes.fontSize !== undefined || attributes.fontFamily !== undefined) {
                const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
                const fontSize = attributes.fontSize || 12;
                const fontStyle = this._getPdfFontStyle(attributes);
                checkBox._dictionary.set('FontStyle', fontStyle);
                checkBox.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
            }

            // === TOOLTIP ===
            if (attributes.tooltip !== undefined) {
                checkBox.toolTip = attributes.tooltip;
            }

            return checkBox;
        } catch (ex) {
            console.error('[CreateCheckBoxField] Error:', ex.message);
            return null;
        }
    }

    /**
     * Creates a RadioButton form field with comprehensive property support.
     * 
     * Properly creates PdfRadioButtonListItem objects for each option and adds them
     * to the field. This ensures the radio buttons are correctly rendered in the PDF.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes (includes radiobuttonItem array or options)
     * @param {Object} bounds - Field bounds
     * @returns {PdfRadioButtonListField|null}
     */
    _createRadioButtonField(page, fieldName, attributes, bounds) {
        try {
            // Validate page parameter
            if (!page) {
                console.error('[CreateRadioButtonField] Page object is undefined or null');
                return null;
            }

            const { PdfRadioButtonListField, PdfRadioButtonListItem, PdfStandardFont } = require('@syncfusion/ej2-pdf');

            const radioButton = new PdfRadioButtonListField(page, fieldName);

            let selectedIndex = 0;
            let isSelectedItem = false;
            let isReadOnly = false;
            let isRequired = false;
            let itemCount = 0;

            // === OPTIONS/ITEMS ===
            // Handle both 'options' array format and 'radiobuttonItem' array format
            const itemsArray = attributes.radiobuttonItem || attributes.options || [];

            if (Array.isArray(itemsArray) && itemsArray.length > 0) {
                for (let i = 0; i < itemsArray.length; i++) {
                    const item = itemsArray[i];

                    // Get or create bounds for this item
                    let itemBounds = bounds;
                    if (item.bounds) {
                        itemBounds = this._parseBounds(item.bounds);
                    } else if (item.x !== undefined && item.y !== undefined) {
                        // If item has individual position
                        itemBounds = {
                            x: this.convertPixelToPoint(item.x),
                            y: this.convertPixelToPoint(item.y),
                            width: this.convertPixelToPoint(item.width || bounds.width || 15),
                            height: this.convertPixelToPoint(item.height || bounds.height || 15)
                        };
                    }

                    // Determine the radio button name/value
                    const radioButtonName = item.value || item.name || `${fieldName}_${i}`;

                    // Create PdfRadioButtonListItem for this specific radio button
                    try {
                        const radioButtonItem = new PdfRadioButtonListItem(radioButtonName, itemBounds, page);

                        // === ITEM PROPERTIES ===
                        if (item.borderColor) {
                            radioButtonItem.borderColor = {
                                r: item.borderColor.r || 0,
                                g: item.borderColor.g || 0,
                                b: item.borderColor.b || 0
                            };

                            // Check for transparent border
                            if (item.borderColor.r === 0 && item.borderColor.g === 0 &&
                                item.borderColor.b === 0 && item.borderColor.a === 0) {
                                radioButtonItem.borderColor = {
                                    r: item.borderColor.r,
                                    g: item.borderColor.g,
                                    b: item.borderColor.b,
                                    isTransparent: true
                                };
                            }
                        }

                        if (item.thickness !== undefined) {
                            radioButtonItem.border.width = item.thickness;
                        }

                        if (item.backgroundColor) {
                            radioButtonItem.backColor = {
                                r: item.backgroundColor.r || 0,
                                g: item.backgroundColor.g || 0,
                                b: item.backgroundColor.b || 0
                            };

                            // Check for transparent background
                            if (item.backgroundColor.r === 0 && item.backgroundColor.g === 0 &&
                                item.backgroundColor.b === 0 && item.backgroundColor.a === 0) {
                                radioButtonItem.backColor = {
                                    r: item.backgroundColor.r,
                                    g: item.backgroundColor.g,
                                    b: item.backgroundColor.b,
                                    isTransparent: true
                                };
                            }
                        }

                        if (item.visibility !== undefined) {
                            radioButtonItem.visibility = item.visibility;
                        }

                        if (item.isReadonly !== undefined) {
                            isReadOnly = item.isReadonly || isReadOnly;
                        }

                        if (item.isRequired !== undefined) {
                            isRequired = item.isRequired || isRequired;
                        }

                        // === ADD ITEM TO FIELD ===
                        radioButton.add(radioButtonItem);
                        itemCount++;

                        // Track selected item
                        if (item.isSelected) {
                            selectedIndex = i;
                            isSelectedItem = true;
                        }

                    } catch (itemError) {
                        console.error(`[CreateRadioButtonField] Error creating item ${i}:`, itemError.message);
                        // Continue with next item even if one fails
                    }
                }

            } else {
                console.warn('[CreateRadioButtonField] No radio button items provided in attributes');
            }

            // === FIELD BEHAVIOR ===
            radioButton.readOnly = isReadOnly;
            radioButton.required = isRequired;

            if (attributes.isReadOnly !== undefined) {
                radioButton.readOnly = attributes.isReadOnly;
            }

            if (attributes.isRequired !== undefined) {
                radioButton.required = attributes.isRequired;
            }

            // === SELECTION ===
            if (isSelectedItem) {
                radioButton.selectedIndex = selectedIndex;
            } else if (attributes.selectedIndex !== undefined) {
                radioButton.selectedIndex = attributes.selectedIndex;
            } else if (attributes.value !== undefined) {
                radioButton.selectedValue = attributes.value;
            }

            // === VISIBILITY ===
            if (attributes.visibility !== undefined) {
                radioButton.visibility = attributes.visibility;
            }

            // === COLORS ===
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                radioButton.backColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                radioButton.color = fontColor;
            }

            if (attributes.borderColor !== undefined) {
                const brdrColor = this._parseColor(attributes.borderColor);
                radioButton.borderColor = brdrColor;
            }

            // === BORDER PROPERTIES ===
            if (attributes.thickness !== undefined) {
                radioButton.border.width = attributes.thickness;
            }

            if (attributes.borderStyle !== undefined) {
                radioButton.border.style = attributes.borderStyle;
            }

            // === FONT PROPERTIES ===
            if (attributes.fontSize !== undefined || attributes.fontFamily !== undefined) {
                const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
                const fontSize = attributes.fontSize || 12;
                const fontStyle = this._getPdfFontStyle(attributes);
                radioButton._dictionary.set('FontStyle', fontStyle);
                radioButton.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
            }

            // === TOOLTIP ===
            if (attributes.tooltip !== undefined) {
                radioButton.toolTip = attributes.tooltip;
            }

            // === CUSTOM DATA ===
            if (attributes.customData !== undefined) {
                try {
                    const customData = JSON.stringify(attributes.customData);
                    if (radioButton._dictionary) {
                        radioButton._dictionary.set('CustomData', customData);
                    }
                } catch (customDataError) {
                    console.warn('[CreateRadioButtonField] Could not set custom data:', customDataError.message);
                }
            }

            return radioButton;
        } catch (ex) {
            console.error('[CreateRadioButtonField] Error:', ex.message);
            console.error('[CreateRadioButtonField] Stack:', ex.stack);
            return null;
        }
    }

    /**
     * Creates a DropDown (ComboBox) form field with comprehensive property support.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes
     * @param {Object} bounds - Field bounds
     * @returns {PdfComboBoxField|null}
     */
    _createDropDownField(page, fieldName, attributes, bounds) {
        try {
            // Validate page parameter
            if (!page) {
                console.error('[CreateDropDownField] Page object is undefined or null');
                return null;
            }

            const { PdfComboBoxField, PdfStandardFont } = require('@syncfusion/ej2-pdf');

            const comboBox = new PdfComboBoxField(page, fieldName, bounds);

            // === OPTIONS/ITEMS ===
            if (attributes.options && Array.isArray(attributes.options)) {
                for (const option of attributes.options) {
                    const item = new PdfListFieldItem(option.itemName,
                        option.itemValue);
                    comboBox.addItem(item);
                }
            }

            // === VALUE AND SELECTION ===
            if (attributes.value !== undefined) {
                comboBox.selectedValue = attributes.value;
            }

            if (attributes.selectedIndex !== undefined) {
                comboBox.selectedIndex = attributes.selectedIndex;
            }

            // === FIELD BEHAVIOR ===
            if (attributes.isReadonly !== undefined) {
                comboBox.readOnly = attributes.isReadonly;
            }

            if (attributes.isRequired !== undefined) {
                comboBox.required = attributes.isRequired;
            }

            // === VISIBILITY ===
            if (attributes.visibility !== undefined) {
                comboBox.visibility = attributes.visibility;
            }

            // === ALIGNMENT ===
            if (attributes.alignment !== undefined) {
                comboBox.textAlignment = this._getTextAlignment(attributes.alignment);
            }

            // === COLORS ===
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                comboBox.backColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                comboBox.color = fontColor;
            }

            if (attributes.borderColor !== undefined) {
                const brdrColor = this._parseColor(attributes.borderColor);
                comboBox.borderColor = brdrColor;
            }

            // === BORDER PROPERTIES ===
            if (attributes.thickness !== undefined) {
                comboBox.border.width = attributes.thickness;
            }

            if (attributes.borderStyle !== undefined) {
                comboBox.border.style = attributes.borderStyle;
            }

            // === FONT PROPERTIES ===
            if (attributes.fontSize !== undefined || attributes.fontFamily !== undefined) {
                const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
                const fontSize = attributes.fontSize || 12;
                const fontStyle = this._getPdfFontStyle(attributes);
                comboBox._dictionary.set('FontStyle', fontStyle);
                comboBox.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
            }

            // === TOOLTIP ===
            if (attributes.tooltip !== undefined) {
                comboBox.toolTip = attributes.tooltip;
            }

            return comboBox;
        } catch (ex) {
            console.error('[CreateDropDownField] Error:', ex.message);
            return null;
        }
    }

    /**
     * Creates a ListBox form field with comprehensive property support.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes
     * @param {Object} bounds - Field bounds
     * @returns {PdfListBoxField|null}
     */
    _createListBoxField(page, fieldName, attributes, bounds) {
        try {
            // Validate page parameter
            if (!page) {
                console.error('[CreateListBoxField] Page object is undefined or null');
                return null;
            }

            const { PdfListBoxField, PdfStandardFont } = require('@syncfusion/ej2-pdf');

            // Default larger bounds for list box
            const listBoxBounds = bounds.height < 40
                ? { ...bounds, height: 60 }
                : bounds;

            const listBox = new PdfListBoxField(page, fieldName, listBoxBounds);

            // === OPTIONS/ITEMS ===
            if (attributes.options && Array.isArray(attributes.options)) {
                for (const option of attributes.options) {
                    const item = new PdfListFieldItem(option.itemName,
                        option.itemValue);
                    listBox.addItem(item);
                }
            }

            // === SELECTION MODE ===
            if (attributes.multiSelect !== undefined) {
                listBox.multiSelect = attributes.multiSelect;
            }
            if (listBox.itemsCount > 0) {
                const count = attributes.selectedIndex.length;
                if (attributes.selectedIndex !== undefined && Array.isArray(attributes.selectedIndex) && count > 0) {
                    if (count === 1) {
                        listBox.selectedIndex = attributes.selectedIndex[0];
                    } else {
                        const selectedIndexes = [];
                        for (let j = 0; j < count; j++) {
                            selectedIndexes.push(attributes.selectedIndex[j]);
                        }
                        listBox.selectedIndex = selectedIndexes;
                    }
                } else {
                    listBox.selectedIndex = 0;
                }
            }

            // === FIELD BEHAVIOR ===
            if (attributes.isReadonly !== undefined) {
                listBox.readOnly = attributes.isReadonly;
            }

            if (attributes.isRequired !== undefined) {
                listBox.required = attributes.isRequired;
            }

            // === VISIBILITY ===
            if (attributes.visibility !== undefined) {
                listBox.visibility = attributes.visibility;
            }

            // === ALIGNMENT ===
            if (attributes.alignment !== undefined) {
                listBox.textAlignment = this._getTextAlignment(attributes.alignment);
            }

            // === COLORS ===
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                listBox.backColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                listBox.color = fontColor;
            }

            if (attributes.borderColor !== undefined) {
                const brdrColor = this._parseColor(attributes.borderColor);
                listBox.borderColor = brdrColor;
            }

            // === BORDER PROPERTIES ===
            if (attributes.thickness !== undefined) {
                listBox.border.width = attributes.thickness;
            }

            if (attributes.borderStyle !== undefined) {
                listBox.border.style = attributes.borderStyle;
            }

            // === FONT PROPERTIES ===
            if (attributes.fontSize !== undefined || attributes.fontFamily !== undefined) {
                const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
                const fontSize = attributes.fontSize || 12;
                const fontStyle = this._getPdfFontStyle(attributes);
                listBox._dictionary.set('FontStyle', fontStyle);
                listBox.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
            }

            // === TOOLTIP ===
            if (attributes.tooltip !== undefined) {
                listBox.toolTip = attributes.tooltip;
            }

            return listBox;
        } catch (ex) {
            console.error('[CreateListBoxField] Error:', ex.message);
            return null;
        }
    }

    /**
     * Creates a Signature form field with comprehensive property support.
     * Also renders the signature content as annotations based on signatureType.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes
     * @param {Object} bounds - Field bounds
     * @returns {PdfSignatureField|null}
     */
    _createSignatureField(page, fieldName, attributes, bounds) {
        try {
            // Validate page parameter
            if (!page) {
                console.error('[CreateSignatureField] Page object is undefined or null');
                return null;
            }
            const { PdfSignatureField, PdfStandardFont } = require('@syncfusion/ej2-pdf');

            let signatureField;

            if (!attributes.lineBound) {
                signatureField = new PdfSignatureField(page, fieldName, bounds);
            }
            else {
                bounds.x = attributes.lineBound.X
                bounds.y = attributes.lineBound.Y
                bounds.width = attributes.lineBound.Width
                bounds.height = attributes.lineBound.height
                signatureField = new PdfSignatureField(page, fieldName, bounds);
            }

            if (attributes.formFieldAnnotationType === 'InitialField') {
                signatureField._dictionary.set('InitialField', true);
            }
            // === FIELD BEHAVIOR ===
            if (attributes.isReadOnly !== undefined) {
                signatureField.readOnly = attributes.isReadOnly;
            }

            if (attributes.isRequired !== undefined) {
                signatureField.required = attributes.isRequired;
            }

            // === VISIBILITY ===
            if (attributes.visibility !== undefined) {
                signatureField.visibility = attributes.visibility;
            }

            // === COLORS ===
            if (attributes.backgroundColor !== undefined) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                signatureField.backColor = bgColor;
            }

            if (attributes.fontColor !== undefined) {
                const fontColor = this._parseColor(attributes.fontColor);
                signatureField.color = fontColor;
            }

            if (attributes.borderColor !== undefined) {
                const brdrColor = this._parseColor(attributes.borderColor);
                signatureField.borderColor = brdrColor;
            }

            // === BORDER PROPERTIES ===
            if (attributes.thickness !== undefined) {
                signatureField.border.width = attributes.thickness;
            }

            if (attributes.borderStyle !== undefined) {
                signatureField.border.style = attributes.borderStyle;
            }

            // === FONT PROPERTIES ===
            if (attributes.fontSize !== undefined || attributes.fontFamily !== undefined) {
                const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
                const fontSize = attributes.fontSize || 12;
                const fontStyle = this._getPdfFontStyle(attributes);
                signatureField._dictionary.set('FontStyle', fontStyle);
                signatureField.font = new PdfStandardFont(fontFamily, this.convertPixelToPoint(fontSize), fontStyle);
            }

            // === TOOLTIP ===
            if (attributes.tooltip !== undefined) {
                signatureField.toolTip = attributes.tooltip;
            }

            // === RENDER SIGNATURE CONTENT ===
            // Draw the actual signature value as an annotation on the page
            if (attributes.value || attributes.signatureType) {
                // Parse bounds if provided
                let signBounds = this._parseBounds(attributes.signatureBound);
                this._drawSignatureContent(page, fieldName, attributes, signBounds);
            }

            return signatureField;
        } catch (ex) {
            console.error('[CreateSignatureField] Error:', ex.message);
            return null;
        }
    }

    /**
     * Draws the signature content (value) as an annotation on the page.
     * Handles three signature types: Text, Image, and Path/Draw.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Signature field name
     * @param {Object} attributes - Field attributes including signatureType and value
     * @param {Object} bounds - Field bounds
     */
    _drawSignatureContent(page, fieldName, attributes, bounds) {
        try {
            const signatureType = attributes.signatureType || 'Text';
            const value = attributes.value;

            if (!value) {
                return;
            }

            if (signatureType === 'Text') {
                this._drawTextSignature(page, fieldName, attributes, bounds);
            } else if (signatureType === 'Image') {
                this._drawImageSignature(page, fieldName, attributes, bounds);
            } else if (signatureType === 'Path' || signatureType === 'Draw') {
                this._drawPathSignature(page, fieldName, attributes, bounds);
            } else {
                console.warn(`[DrawSignature] Unknown signature type: ${signatureType}`);
            }
        } catch (ex) {
            console.error('[DrawSignature] Error drawing signature content:', ex.message);
        }
    }

    /**
     * Draws a text-based signature as a FreeTextAnnotation.
     * Renders the signature text with font properties at the specified bounds.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes
     * @param {Object} bounds - Field bounds
     */
    _drawTextSignature(page, fieldName, attributes, bounds) {
        try {
            const { PdfFreeTextAnnotation, PdfStandardFont, PdfTextAlignment, PdfAnnotationFlag } = require('@syncfusion/ej2-pdf');

            const text = attributes.value;
            const fontSize = attributes.fontSize || 12;
            const fontFamily = this._getFontFamily(attributes.fontFamily || 'Helvetica');
            const fontStyle = this._getPdfFontStyle(attributes);

            // Create free text annotation
            const annotation = new PdfFreeTextAnnotation({
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
            });

            // Set font
            annotation.font = new PdfStandardFont(
                fontFamily,
                this.convertPixelToPoint(fontSize),
                fontStyle
            );

            // Set text
            annotation.text = text;

            // Set text alignment
            annotation.textAlignment = PdfTextAlignment.center;

            // Set colors
            if (attributes.fontColor) {
                const fontColor = this._parseColor(attributes.fontColor);
                annotation.color = fontColor;
            }

            if (attributes.backgroundColor) {
                const bgColor = this._parseColor(attributes.backgroundColor);
                annotation.backColor = bgColor;
            }

            // Set border
            if (attributes.borderColor) {
                const borderColor = this._parseColor(attributes.borderColor);
                annotation.borderColor = borderColor;
            }
            annotation.border.width = attributes.thickness || 1;

            // Set visibility
            annotation.flags = PdfAnnotationFlag.print;
            if (attributes.visibility === 'hidden') {
                annotation.flags = PdfAnnotationFlag.hidden;
            }

            // Mark as signature annotation
            annotation.setValues('AnnotationType', 'Signature');
            annotation._dictionary.set('T', fieldName);

            annotation.setAppearance(true);
            page.annotations.add(annotation);

        } catch (ex) {
            console.error('[DrawTextSignature] Error:', ex.message);
        }
    }

    /**
     * Draws an image-based signature as a RubberStampAnnotation.
     * Renders the signature image at the specified bounds.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes (value should be base64 image or data URL)
     * @param {Object} bounds - Field bounds
     */
    _drawImageSignature(page, fieldName, attributes, bounds) {
        try {
            const { PdfRubberStampAnnotation, PdfBitmap, PdfAnnotationFlag } = require('@syncfusion/ej2-pdf');

            const imageValue = attributes.value;
            if (!imageValue) {
                console.warn('[DrawImageSignature] No image data provided');
                return;
            }

            // Extract base64 from data URL if needed (format: "data:image/png;base64,...")
            let imageData = imageValue;
            if (typeof imageValue === 'string' && imageValue.includes(',')) {
                imageData = imageValue.split(',')[1];
            }

            try {
                // Create bitmap from base64 image data
                const bitmap = new PdfBitmap(imageData);

                // Create rubber stamp annotation
                const annotation = new PdfRubberStampAnnotation({
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height
                });

                // Draw the image on the annotation's appearance
                const imageRect = {
                    x: 0,
                    y: 0,
                    width: bounds.width,
                    height: bounds.height
                };
                annotation.appearance.normal.graphics.drawImage(bitmap, imageRect);

                // Set visibility and flags
                annotation.flags = PdfAnnotationFlag.print;
                if (attributes.visibility === 'hidden') {
                    annotation.flags = PdfAnnotationFlag.hidden;
                }

                // Mark as signature annotation
                annotation._dictionary.set('T', fieldName);

                page.annotations.add(annotation);

            } catch (imageError) {
                console.error('[DrawImageSignature] Error creating bitmap from image data:', imageError.message);
            }
        } catch (ex) {
            console.error('[DrawImageSignature] Error:', ex.message);
        }
    }

    /**
     * Draws a path/draw-based signature as an InkAnnotation.
     * Renders the freehand drawing signature at the specified bounds.
     * 
     * Based on EJ2 PDF Viewer's drawDesignerFieldPath implementation.
     * Properly handles zoom, page rotation, min/max bounds, Y-coordinate normalization, and multiple strokes.
     * 
     * @param {PdfPage} page - Target page
     * @param {string} fieldName - Field name
     * @param {Object} attributes - Field attributes including value (JSON stringified path points), zoomValue, signatureBound
     * @param {Object} bounds - Field bounds
     */
    _drawPathSignature(page, fieldName, attributes, bounds) {
        try {
            const { PdfInkAnnotation, PdfAnnotationFlag, PdfPath } = require('@syncfusion/ej2-pdf');

            const pathValue = attributes.value;
            if (!pathValue) {
                console.warn('[DrawPathSignature] No path data provided');
                return;
            }

            try {
                // Parse path points from JSON or array format
                let stampObjects = [];
                if (typeof pathValue === 'string') {
                    stampObjects = JSON.parse(pathValue);
                } else if (Array.isArray(pathValue)) {
                    stampObjects = pathValue;
                }

                if (!Array.isArray(stampObjects) || stampObjects.length === 0) {
                    console.warn('[DrawPathSignature] Invalid or empty path data');
                    return;
                }

                // === CRITICAL FIXES ===
                // 1. Extract zoom value (used to scale input coordinates)
                const zoomValue = attributes.zoomValue || 1;

                // 2. Get page rotation angle
                const pageRotationAngle = page.rotation || 0;

                // 3. Get signature bounds (from attributes or fallback to bounds)
                const signatureBounds = attributes.signatureBound || bounds;
                const boundsObjects = {
                    X: signatureBounds.x || bounds.x,
                    Y: signatureBounds.y || bounds.y,
                    Width: signatureBounds.width || bounds.width,
                    Height: signatureBounds.height || bounds.height
                };

                // 4. Convert bounds from pixels to points, accounting for zoom
                // let signBounds = {
                //     X: this.convertPixelToPoint(boundsObjects.X / zoomValue),
                //     Y: this.convertPixelToPoint(boundsObjects.Y / zoomValue),
                //     Width: this.convertPixelToPoint(boundsObjects.Width / zoomValue),
                //     Height: this.convertPixelToPoint(boundsObjects.Height / zoomValue)
                // };

                // 5. Adjust bounds for page rotation
                signBounds = this._adjustBoundsForPageRotation(
                    signBounds,
                    page.size.height,
                    page.size.width,
                    pageRotationAngle
                );

                // 6. Calculate rotation angle for ink annotation
                const rotationAngle = this._calculateInkRotationAngle(pageRotationAngle);

                // === STEP 1: Calculate min/max bounds of all path points ===
                let minimumX = -1;
                let minimumY = -1;
                let maximumX = -1;
                let maximumY = -1;

                const drawingPath = new PdfPath();
                for (let p = 0; p < stampObjects.length; p++) {
                    const val = stampObjects[p];
                    if (val.x !== undefined && val.y !== undefined) {
                        drawingPath.addLine({ x: val.x, y: val.y }, { x: 0, y: 0 });
                    }
                }

                // Get rotated path for min/max calculation
                const rotatedPath = this._getRotatedPathForMinMax(drawingPath, rotationAngle);

                // Calculate min/max from rotated path
                if (rotatedPath && rotatedPath.length > 0) {
                    for (let k = 0; k < rotatedPath.length; k++) {
                        const point = rotatedPath[k];
                        const value0 = point[0];
                        const value1 = point[1];

                        if (minimumX === -1) {
                            minimumX = value0;
                            minimumY = value1;
                            maximumX = value0;
                            maximumY = value1;
                        } else {
                            if (minimumX >= value0) minimumX = value0;
                            if (minimumY >= value1) minimumY = value1;
                            if (maximumX <= value0) maximumX = value0;
                            if (maximumY <= value1) maximumY = value1;
                        }
                    }
                }

                // Prevent division by zero
                if (minimumX === maximumX || minimumY === maximumY) {
                    console.warn('[DrawPathSignature] Invalid path bounds (min === max)');
                    return;
                }

                const left = signBounds.X;
                const top = signBounds.Y;
                const width = signBounds.Width;
                const height = signBounds.Height;

                const newDifferenceX = (maximumX - minimumX) / width;
                const newDifferenceY = (maximumY - minimumY) / height;

                // === STEP 2: Normalize first stroke ===
                let linePoints = [];
                let isNewValues = 0;
                const pageHeight = page.size.height;

                if (rotationAngle !== 0) {
                    // Rotated case: collect first stroke
                    for (let j = 0; j < stampObjects.length; j++) {
                        const value = stampObjects[j];
                        const path = value.command ? value.command.toString() : '';

                        if (path === 'M' && j !== 0) {
                            isNewValues = j;
                            break;
                        }

                        linePoints.push({
                            x: parseFloat(value.x) || 0,
                            y: parseFloat(value.y) || 0
                        });
                    }

                    const rotatedPoints = this._getRotatedPath(linePoints, rotationAngle);
                    linePoints = [];

                    for (let z = 0; z < rotatedPoints.length; z++) {
                        const rotatedPoint = rotatedPoints[z];
                        linePoints.push({
                            x: (rotatedPoint[0] - minimumX) / newDifferenceX + left,
                            y: pageHeight - (rotatedPoint[1] - minimumY) / newDifferenceY - top
                        });
                    }
                } else {
                    // Non-rotated case: normalize first stroke
                    for (let k = 0; k < stampObjects.length; k++) {
                        const value = stampObjects[k];
                        const path = value.command ? value.command.toString() : '';

                        if (path === 'M' && k !== 0) {
                            isNewValues = k;
                            break;
                        }

                        const newX = (parseFloat(value.y) - minimumY) / newDifferenceY;
                        linePoints.push({
                            x: (parseFloat(value.x) - minimumX) / newDifferenceX + left,
                            y: pageHeight - newX - top
                        });
                    }
                }

                // === STEP 3: Create ink annotation ===
                const annotation = new PdfInkAnnotation(
                    {
                        x: left,
                        y: top,
                        width: width,
                        height: height
                    },
                    linePoints
                );

                // === STEP 4: Process additional strokes ===
                if (isNewValues > 0) {
                    if (rotationAngle !== 0) {
                        // Rotated case
                        const pathCollection = [];

                        for (let t = isNewValues; t < stampObjects.length; t++) {
                            const value = stampObjects[t];
                            const path = value.command ? value.command.toString() : '';

                            if (path === 'M' && t !== isNewValues) {
                                pathCollection.push([...linePoints]);
                                linePoints = [];
                            }

                            linePoints.push({
                                x: parseFloat(value.x) || 0,
                                y: parseFloat(value.y) || 0
                            });
                        }

                        if (linePoints.length > 0) {
                            pathCollection.push(linePoints);
                        }

                        for (let w = 0; w < pathCollection.length; w++) {
                            const pointsCollections = pathCollection[w];
                            linePoints = [];

                            if (pointsCollections.length > 0) {
                                const rotatedPoints = this._getRotatedPath(pointsCollections, rotationAngle);

                                for (let z = 0; z < rotatedPoints.length; z++) {
                                    const rotatedPoint = rotatedPoints[z];
                                    linePoints.push({
                                        x: (rotatedPoint[0] - minimumX) / newDifferenceX + left,
                                        y: pageHeight - (rotatedPoint[1] - minimumY) / newDifferenceY - top
                                    });
                                }

                                annotation.inkPointsCollection.push(linePoints);
                            }
                        }
                    } else {
                        // Non-rotated case
                        for (let r = isNewValues; r < stampObjects.length; r++) {
                            const value = stampObjects[r];
                            const path = value.command ? value.command.toString() : '';

                            if (path === 'M' && r !== isNewValues) {
                                annotation.inkPointsCollection.push(linePoints);
                                linePoints = [];
                            }

                            const newX = (parseFloat(value.y) - minimumY) / newDifferenceY;
                            linePoints.push({
                                x: (parseFloat(value.x) - minimumX) / newDifferenceX + left,
                                y: pageHeight - newX - top
                            });
                        }

                        if (linePoints.length > 0) {
                            annotation.inkPointsCollection.push(linePoints);
                        }
                    }
                }

                // === STEP 5: Set annotation properties ===
                annotation.bounds = {
                    x: signBounds.X,
                    y: signBounds.Y,
                    width: signBounds.Width,
                    height: signBounds.Height
                };

                annotation.border.width = 0;
                annotation.flags = PdfAnnotationFlag.print;
                if (attributes.visibility === 'hidden') {
                    annotation.flags = PdfAnnotationFlag.hidden;
                }

                const strokeColor = this._parseColor(attributes.fontColor || 'black');
                annotation.color = strokeColor;

                annotation._dictionary.set('T', fieldName);
                annotation.setValues('annotationSignature', 'annotationSignature');
                annotation.rotationAngle = Math.abs(this._getRotateAngle(pageRotationAngle));

                annotation.setAppearance(true);
                page.annotations.add(annotation);

            } catch (pathError) {
                console.error('[DrawPathSignature] Error processing path data:', pathError.message);
                console.error('[DrawPathSignature] Stack:', pathError.stack);
            }
        } catch (ex) {
            console.error('[DrawPathSignature] Error:', ex.message);
            console.error('[DrawPathSignature] Stack:', ex.stack);
        }
    }

    /**
     * Adjusts bounds for page rotation.
     * Accounts for 90°, 180°, 270° rotations.
     * 
     * @param {Object} bounds - Original bounds {X, Y, Width, Height}
     * @param {number} pageHeight - Page height in points
     * @param {number} pageWidth - Page width in points
     * @param {number} pageRotationAngle - Rotation angle (0, 90, 180, 270 or 0, 1, 2, 3)
     * @returns {Object} Adjusted bounds
     */
    _adjustBoundsForPageRotation(bounds, pageHeight, pageWidth, pageRotationAngle) {
        try {
            const normalizedAngle = ((pageRotationAngle || 0) % 360) / 90;

            if (normalizedAngle === 1 || normalizedAngle === 3) {
                // 90° or 270° rotation
                if (normalizedAngle === 1) {
                    // 90° clockwise
                    return {
                        X: pageHeight - (bounds.Y + bounds.Height),
                        Y: bounds.X,
                        Width: bounds.Height,
                        Height: bounds.Width
                    };
                } else {
                    // 270° clockwise
                    return {
                        X: bounds.Y,
                        Y: pageWidth - (bounds.X + bounds.Width),
                        Width: bounds.Height,
                        Height: bounds.Width
                    };
                }
            } else if (normalizedAngle === 2) {
                // 180° rotation
                return {
                    X: pageWidth - (bounds.X + bounds.Width),
                    Y: pageHeight - (bounds.Y + bounds.Height),
                    Width: bounds.Width,
                    Height: bounds.Height
                };
            }

            return bounds; // No rotation
        } catch (ex) {
            console.warn('[AdjustBoundsForPageRotation] Error:', ex.message);
            return bounds;
        }
    }

    /**
     * Calculates ink rotation angle from page rotation.
     * 
     * @param {number} pageRotationAngle - Page rotation
     * @returns {number} Rotation angle in degrees
     */
    _calculateInkRotationAngle(pageRotationAngle) {
        try {
            const normalizedAngle = ((pageRotationAngle || 0) % 360);

            if (normalizedAngle === 90 || normalizedAngle === 1) return 90;
            if (normalizedAngle === 180 || normalizedAngle === 2) return 180;
            if (normalizedAngle === 270 || normalizedAngle === 3) return 270;

            return 0;
        } catch (ex) {
            console.warn('[CalculateInkRotationAngle] Error:', ex.message);
            return 0;
        }
    }

    /**
     * Gets rotated path points for min/max calculation.
     * 
     * @param {PdfPath} drawingPath - Original path
     * @param {number} rotationAngle - Rotation angle
     * @returns {Array} Array of [x, y] coordinates
     */
    _getRotatedPathForMinMax(drawingPath, rotationAngle) {
        try {
            if (!drawingPath || !drawingPath._points || drawingPath._points.length === 0) {
                return [];
            }

            if (rotationAngle === 0) {
                return drawingPath._points;
            }

            return this._rotatePoints(drawingPath._points, rotationAngle);
        } catch (ex) {
            console.warn('[GetRotatedPathForMinMax] Error:', ex.message);
            return [];
        }
    }

    /**
     * Gets rotated path from point array.
     * 
     * @param {Array} points - Array of {x, y} points
     * @param {number} rotationAngle - Rotation angle in degrees
     * @returns {Array} Array of [x, y] rotated coordinates
     */
    _getRotatedPath(points, rotationAngle) {
        try {
            if (!Array.isArray(points) || points.length === 0) {
                return [];
            }

            if (rotationAngle === 0) {
                return points.map(p => [p.x || 0, p.y || 0]);
            }

            const arrayPoints = points.map(p => [p.x || 0, p.y || 0]);
            return this._rotatePoints(arrayPoints, rotationAngle);
        } catch (ex) {
            console.warn('[GetRotatedPath] Error:', ex.message);
            return points.map(p => [p.x || 0, p.y || 0]);
        }
    }

    /**
     * Rotates points by given angle around origin (0, 0).
     * 
     * @param {Array} points - Array of [x, y] coordinates
     * @param {number} angle - Rotation angle in degrees
     * @returns {Array} Rotated points
     */
    _rotatePoints(points, angle) {
        try {
            const radians = (angle * Math.PI) / 180;
            const cos = Math.cos(radians);
            const sin = Math.sin(radians);

            return points.map(point => {
                const x = point[0];
                const y = point[1];
                return [
                    x * cos - y * sin,
                    x * sin + y * cos
                ];
            });
        } catch (ex) {
            console.warn('[RotatePoints] Error:', ex.message);
            return points;
        }
    }

    /**
     * Gets rotation angle from page rotation value.
     * Handles both degree values (0, 90, 180, 270) and index values (0, 1, 2, 3).
     * 
     * @param {number} pageRotation - Page rotation
     * @returns {number} Absolute rotation angle
     */
    _getRotateAngle(pageRotation) {
        try {
            const normalizedAngle = ((pageRotation || 0) % 360);

            if (normalizedAngle === 90 || normalizedAngle === 1) return 90;
            if (normalizedAngle === 180 || normalizedAngle === 2) return 180;
            if (normalizedAngle === 270 || normalizedAngle === 3) return 270;

            return 0;
        } catch (ex) {
            console.warn('[GetRotateAngle] Error:', ex.message);
            return 0;
        }
    }

    /**
     * Applies page organizer actions to the PDF document.
     * Handles page deletion, reordering, and insertion.
     * 
     * @param {PdfDocument} document - Syncfusion PdfDocument instance
     * @param {Object} pageOrganizerData - Page organizer action data
     */
    async _applyPageOrganizerActions(document, pageOrganizerData) {
        try {

            // Handle different page organizer action types
            if (pageOrganizerData.action === 'delete') {
                if (pageOrganizerData.originalPageIndex >= 0 && pageOrganizerData.originalPageIndex < document.pageCount) {
                    document.removePage(pageOrganizerData.originalPageIndex);
                }
            } else if (pageOrganizerData.action === 'reorder' || pageOrganizerData.action === 'rearrange') {
                // Reorder page: Move page from sourceIndex to targetIndex
                const sourceIndex = pageOrganizerData.sourcePageIndex !== undefined
                    ? pageOrganizerData.sourcePageIndex
                    : pageOrganizerData.originalPageIndex;
                const targetIndex = pageOrganizerData.targetIndex;

                // Validate indices
                if (sourceIndex < 0 || sourceIndex >= document.pageCount) {
                    console.warn(`[PageOrganizer] Invalid source index ${sourceIndex}. Document has ${document.pageCount} pages`);
                    return;
                }

                if (targetIndex < 0 || targetIndex >= document.pageCount) {
                    console.warn(`[PageOrganizer] Invalid target index ${targetIndex}. Document has ${document.pageCount} pages`);
                    return;
                }

                // If source and target are the same, no operation needed
                if (sourceIndex === targetIndex) {
                    return;
                }

                try {
                    // Build the complete page order array for reorderPages API
                    // This is cleaner than manual array manipulation

                    // Step 1: Create array of all current page indices [0, 1, 2, ..., pageCount-1]
                    const pageIndices = Array.from({ length: document.pageCount }, (_, i) => i);

                    // Step 2: Remove the page at sourceIndex
                    const removedPage = pageIndices[sourceIndex];
                    pageIndices.splice(sourceIndex, 1);

                    // Step 3: Insert at targetIndex
                    // Note: No adjustment needed because we've already removed the source page
                    pageIndices.splice(targetIndex, 0, removedPage);

                    // Step 4: Call reorderPages API with the new page order
                    if (document.reorderPages && typeof document.reorderPages === 'function') {
                        try {
                            document.reorderPages(pageIndices);
                        } catch (reorderError) {
                            console.error('[PageOrganizer] reorderPages() failed:', reorderError.message);
                            throw reorderError;
                        }
                    } else {
                        console.error('[PageOrganizer] document.reorderPages() method not available');
                        throw new Error('reorderPages API not available on PdfDocument');
                    }

                } catch (reorderError) {
                    console.error('[PageOrganizer] Error during reorder operation:', reorderError.message);
                    console.error('[PageOrganizer] Stack:', reorderError.stack);
                    throw reorderError;
                }
            } else if (pageOrganizerData.action === 'rotate') {
                const page = document.getPage(pageOrganizerData.originalPageIndex);
                if (pageOrganizerData.rotateAngle === 90) {
                    page.rotation = PdfRotationAngle.angle90;
                } else if (pageOrganizerData.rotateAngle === 180) {
                    page.rotation = PdfRotationAngle.angle180;
                } else if (pageOrganizerData.rotateAngle === 270) {
                    page.rotation = PdfRotationAngle.angle270;
                }
            } else if (pageOrganizerData.action === 'insert') {
                let pageSettings2 = new PdfPageSettings();
                pageSettings2.width = pageOrganizerData.pageSize.width;
                pageSettings2.height = pageOrganizerData.pageSize.height;
                document.addPage(pageOrganizerData.targetIndex, pageSettings2);
            } else if (pageOrganizerData.action === 'copy') {
                // Reorder pages
                let options = new PdfPageImportOptions();
                // Sets the target page index to import
                options.targetIndex = pageOrganizerData.targetIndex;
                if (pageOrganizerData.rotateAngle === 90) {
                    options.rotation = PdfRotationAngle.angle90;
                } else if (pageOrganizerData.rotateAngle === 180) {
                    options.rotation = PdfRotationAngle.angle180;
                } else if (pageOrganizerData.rotateAngle === 270) {
                    options.rotation = PdfRotationAngle.angle270;
                }
                document.importPage(pageOrganizerData.sourceOriginalPageIndex, options);
            }
        } catch (ex) {
            console.error('[PageOrganizer] Error applying page organizer actions:', ex.message);
            throw ex;
        }
    }

    /**
     * Process save request asynchronously with Redis action cleanup.
     * 
     * Orchestrates the full merge workflow:
     * 1. Load master PDF from storage (via controller or passed in request)
     * 2. Retrieve pending operations from Redis
     * 3. Replay operations against master document via replayOperationsAndUpdateDocument()
     * 4. Persist updated PDF back to storage
     * 5. Clean up Redis (partial or full based on partialSave flag)
     * 6. Broadcast save completion notification to all clients in room
     * 
     * Save Behavior:
     * - PartialSave == true:
     *   * Remove only the first N actions (where N = SaveThreshold count)
     *   * Retain remaining unprocessed actions in Redis for next save cycle
     *   * Supports incremental save workflow
     * 
     * - PartialSave == false:
     *   * Remove ALL pending actions associated with the room from Redis
     *   * Used when document is finalized and no further collaboration needed
     *   * Clears complete action history after final save
     * 
     * @param {Object} request - Save request with roomName, actions, partialSave flag
     */
    async processSaveRequestAsync(request) {
        try {
            // debugger;  // Breakpoint: Entry point of save request
            if (!request) {
                return;
            }

            if (!request.roomName) {
                return;
            }

            // Step 1: Retrieve all pending operations for this room
            const allOperations = request.actions;

            // Step 2: Load master PDF from storage service
            let masterPdfBase64 = '';
            if (this.storageService) {
                const pdfResult = await this.storageService.getPdfAsync(
                    request.fileName || 'document.pdf',
                    request.roomName
                );

                if (pdfResult.success) {
                    masterPdfBase64 = pdfResult.content;
                } else {
                    throw new Error(
                        `Failed to retrieve PDF from storage: ${pdfResult.error}`
                    );
                }
            }

            if (!masterPdfBase64) {
                throw new Error(
                    'Master PDF not provided in request and storage service unavailable'
                );
            }

            // Step 3: Replay operations and generate updated PDF
            let updatedPdfBlob = null;

            if (allOperations && allOperations.length > 0) {
                try {
                    updatedPdfBlob = await this.replayOperationsAndUpdateDocument(
                        masterPdfBase64,
                        allOperations
                    );

                    if (!updatedPdfBlob || updatedPdfBlob.size === 0) {
                        throw new Error('Operation replay returned empty PDF');
                    }

                } catch (replayError) {
                    console.error('[ProcessSave] Operation replay failed:', replayError.message);
                    console.error('[ProcessSave] Stack:', replayError.stack);
                    throw replayError;
                }
            } else {
                console.warn('[ProcessSave] No operations to replay, using master PDF as-is');

                // If no operations, use master PDF as-is
                const pdfBuffer = Buffer.from(masterPdfBase64, 'base64');
                updatedPdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
            }

            // Step 4: Persist updated PDF
            if (!updatedPdfBlob || updatedPdfBlob.size === 0) {
                throw new Error('Updated PDF is empty or invalid before persistence');
            }

            if (this.storageService) {
                try {
                    // Convert Blob to Buffer for storage
                    const arrayBuffer = await updatedPdfBlob.arrayBuffer();
                    const pdfBuffer = Buffer.from(arrayBuffer);

                    const saveResult = await this.storageService.storePdfAsync(
                        pdfBuffer,
                        request.fileName || 'document.pdf',
                        request.roomName
                    );

                    if (!saveResult.success) {
                        throw new Error(`Failed to save PDF: ${saveResult.error}`);
                    }

                } catch (storageError) {
                    console.error('[ProcessSave] Storage persistence failed:', storageError.message);
                    throw storageError;
                }
            } else {
                console.warn('[ProcessSave] No storage service available, skipping persistence');
            }

            request.updatedPdfSize = updatedPdfBlob.size;

            // Step 5: Clean up Redis based on save mode
            const actionCount = (request.actions && request.actions.length) || 0;

            // if (request.partialSave) {
            //     console.log(
            //         `[ProcessSave] Partial Save: Removing ${actionCount} actions ` +
            //         `from room '${request.roomName}' (threshold-based cleanup)`
            //     );
            // } else {
            //     console.log(
            //         `[ProcessSave] Full Save: Removing all ${actionCount} actions ` +
            //         `from room '${request.roomName}' (complete cleanup)`
            //     );
            // }
        } catch (ex) {
            console.error(
                `Error in processSaveRequestAsync for room '${request?.roomName}': ` +
                `${ex.message}\n${ex.stack}`
            );
            throw ex;
        }
    }
}

module.exports = PdfViewerCollaborationAdapter;
