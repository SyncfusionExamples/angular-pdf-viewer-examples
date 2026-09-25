/**
 * PDF Storage Service for Node.js Collaboration Server
 * 
 * Manages PDF document storage and retrieval for collaborative editing rooms.
 * 
 * Features:
 * - Store and retrieve PDFs by roomName and fileName
 * - Provide fallback to default PDF when document not found
 * - Convert PDFs to Base64 for client transmission
 * - Handle file system operations safely
 */

const fs = require('fs');
const path = require('path');

class PdfStorageService {
    constructor(baseStoragePath = null, defaultPdfPath = null) {
        /**
         * Base storage path for PDF files
         * Default: project root/storage/pdfs
         */
        this.baseStoragePath = baseStoragePath || 
            path.join(__dirname, '..', 'storage', 'pdfs');

        /**
         * Default PDF path for fallback
         * Default: wwwroot/PDF/pdf-succinctly.pdf
         */
        this.defaultPdfPath = defaultPdfPath || 
            path.join(__dirname, '..', 'wwwroot', 'PDF', 'pdf-succinctly.pdf');

        // Ensure base storage directory exists
        this._ensureDirectoryExists(this.baseStoragePath);

    }

    /**
     * Get PDF document as Base64 encoded string
     * 
     * @param {string} fileName - PDF file name (default: "document.pdf")
     * @param {string} roomName - Collaboration room identifier (default: "default")
     * @returns {Promise<Object>} { success, fileName, roomName, content, contentLength, isDefault }
     */
    async getPdfAsync(fileName = 'document.pdf', roomName = 'default') {
        try {
            const resolvedFileName = fileName || 'document.pdf';
            const resolvedRoomName = roomName || 'default';


            // Construct room-specific storage path
            const roomStoragePath = path.join(this.baseStoragePath, resolvedRoomName);
            const pdfPath = path.join(roomStoragePath, resolvedFileName);

            // Check if room-specific PDF exists
            if (this._fileExists(pdfPath)) {
                const buffer = await this._readFileAsync(pdfPath);
                const base64Content = buffer.toString('base64');

                return {
                    success: true,
                    fileName: resolvedFileName,
                    roomName: resolvedRoomName,
                    content: base64Content,
                    contentLength: buffer.length,
                    isDefault: false
                };
            }

           

            if (this._fileExists(this.defaultPdfPath)) {
                const buffer = await this._readFileAsync(this.defaultPdfPath);
                const base64Content = buffer.toString('base64');

                return {
                    success: true,
                    fileName: path.basename(this.defaultPdfPath),
                    roomName: resolvedRoomName,
                    content: base64Content,
                    contentLength: buffer.length,
                    isDefault: true,
                    message: 'PDF document not found in room storage - serving default document'
                };
            }

            // Neither room-specific nor default PDF found
            console.error(`[PdfStorageService] PDF not found - room: ${pdfPath}, default: ${this.defaultPdfPath}`);
            
            return {
                success: false,
                error: `PDF document not found: ${resolvedFileName}`,
                fileName: resolvedFileName,
                roomName: resolvedRoomName,
                message: 'Document not in room storage and default fallback not available',
                searchedPaths: [pdfPath, this.defaultPdfPath]
            };
        } catch (error) {
            console.error('[PdfStorageService.getPdfAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to retrieve PDF: ${error.message}`,
                details: error.toString()
            };
        }
    }

    /**
     * Store a PDF document for a specific room
     * 
     * @param {Buffer} pdfBuffer - PDF file content as Buffer
     * @param {string} fileName - PDF file name (default: "document.pdf")
     * @param {string} roomName - Collaboration room identifier (default: "default")
     * @returns {Promise<Object>} { success, filePath, size }
     */
    async storePdfAsync(pdfBuffer, fileName = 'document.pdf', roomName = 'default') {
        try {
            const resolvedFileName = fileName || 'document.pdf';
            const resolvedRoomName = roomName || 'default';


            // Create room directory
            const roomStoragePath = path.join(this.baseStoragePath, resolvedRoomName);
            this._ensureDirectoryExists(roomStoragePath);

            // Write PDF file
            const filePath = path.join(roomStoragePath, resolvedFileName);
            await this._writeFileAsync(filePath, pdfBuffer);


            return {
                success: true,
                filePath,
                size: pdfBuffer.length
            };
        } catch (error) {
            console.error('[PdfStorageService.storePdfAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to store PDF: ${error.message}`,
                details: error.toString()
            };
        }
    }

    /**
     * Check if a PDF exists for a specific room
     * 
     * @param {string} fileName - PDF file name
     * @param {string} roomName - Collaboration room identifier
     * @returns {boolean} true if room-specific PDF exists
     */
    pdfExistsForRoom(fileName = 'document.pdf', roomName = 'default') {
        const resolvedFileName = fileName || 'document.pdf';
        const resolvedRoomName = roomName || 'default';
        const roomStoragePath = path.join(this.baseStoragePath, resolvedRoomName);
        const pdfPath = path.join(roomStoragePath, resolvedFileName);
        return this._fileExists(pdfPath);
    }

    /**
     * Delete a PDF document for a specific room
     * 
     * @param {string} fileName - PDF file name
     * @param {string} roomName - Collaboration room identifier
     * @returns {Promise<Object>} { success, message }
     */
    async deletePdfAsync(fileName = 'document.pdf', roomName = 'default') {
        try {
            const resolvedFileName = fileName || 'document.pdf';
            const resolvedRoomName = roomName || 'default';

            const roomStoragePath = path.join(this.baseStoragePath, resolvedRoomName);
            const filePath = path.join(roomStoragePath, resolvedFileName);

            if (!this._fileExists(filePath)) {
                return {
                    success: false,
                    error: `PDF not found: ${filePath}`
                };
            }

            await this._deleteFileAsync(filePath);

            return {
                success: true,
                message: `PDF deleted: ${resolvedRoomName}/${resolvedFileName}`
            };
        } catch (error) {
            console.error('[PdfStorageService.deletePdfAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to delete PDF: ${error.message}`
            };
        }
    }

    // ============================================================================
    // Private Helper Methods
    // ============================================================================

    /**
     * Ensure directory exists, create if needed
     */
    _ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Check if file exists
     */
    _fileExists(filePath) {
        return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
    }

    /**
     * Read file asynchronously
     */
    _readFileAsync(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    /**
     * Write file asynchronously
     */
    _writeFileAsync(filePath, data) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, data, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    /**
     * Delete file asynchronously
     */
    _deleteFileAsync(filePath) {
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = PdfStorageService;
