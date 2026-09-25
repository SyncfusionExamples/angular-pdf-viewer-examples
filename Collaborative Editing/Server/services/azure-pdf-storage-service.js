/**
 * Azure Blob Storage Service for PDF Documents
 * 
 * Manages PDF document storage and retrieval using Azure Blob Storage.
 * Provides seamless integration with collaborative editing rooms.
 * 
 * Features:
 * - Store and retrieve PDFs from Azure Blob Storage
 * - Per-room blob container organization
 * - Automatic fallback to default PDF
 * - Convert PDFs to/from Base64 for client transmission
 * 
 * Required Environment Variables:
 * - AZURE_STORAGE_CONNECTION_STRING: Azure Storage connection string
 * - AZURE_STORAGE_CONTAINER_NAME: Base container name (rooms stored as subfolders)
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

class AzurePdfStorageService {
    constructor(options = {}) {
        // Azure configuration
        this.connectionString = options.connectionString || 
            process.env.AZURE_STORAGE_CONNECTION_STRING;
        this.containerName = options.containerName || 
            (process.env.AZURE_STORAGE_CONTAINER_NAME || 'pdfs');
        
        // Local fallback for default PDF
        this.defaultPdfPath = options.defaultPdfPath || 
            path.join(__dirname, '..', 'wwwroot', 'PDF', 'pdf-succinctly.pdf');

        if (!this.connectionString) {
            throw new Error(
                'Azure Storage connection string not provided. ' +
                'Set AZURE_STORAGE_CONNECTION_STRING environment variable or pass in options.'
            );
        }

        // Initialize Azure Blob Service Client
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
            this.connectionString
        );
        this.containerClient = this.blobServiceClient.getContainerClient(
            this.containerName
        );

    }

    /**
     * Get PDF document as Base64 encoded string from Azure Blob Storage
     * 
     * @param {string} fileName - PDF file name (default: "document.pdf")
     * @param {string} roomName - Collaboration room identifier (default: "default")
     * @returns {Promise<Object>} { success, fileName, roomName, content, contentLength, isDefault }
     */
    async getPdfAsync(fileName = 'document.pdf', roomName = 'default') {
        try {
            const resolvedFileName = fileName || 'document.pdf';
            const resolvedRoomName = roomName || 'default';

            

            // Construct blob path: roomName/fileName
            const blobPath = `${resolvedRoomName}/${resolvedFileName}`;
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

            try {
                // Attempt to download from Azure
                const downloadBlockBlobResponse = await blockBlobClient.download();
                const buffer = await this._streamToBuffer(
                    downloadBlockBlobResponse.readableStreamBody
                );
                const base64Content = buffer.toString('base64');


                return {
                    success: true,
                    fileName: resolvedFileName,
                    roomName: resolvedRoomName,
                    content: base64Content,
                    contentLength: buffer.length,
                    isDefault: false
                };
            } catch (azureError) {
                // Blob not found in Azure - try local fallback
                if (azureError.code === 'BlobNotFound' || azureError.code === 'ContainerNotFound') {
                    

                    if (fs.existsSync(this.defaultPdfPath)) {
                        const buffer = fs.readFileSync(this.defaultPdfPath);
                        const base64Content = buffer.toString('base64');

                   

                        return {
                            success: true,
                            fileName: path.basename(this.defaultPdfPath),
                            roomName: resolvedRoomName,
                            content: base64Content,
                            contentLength: buffer.length,
                            isDefault: true,
                            message:
                                'PDF document not found in Azure - serving default document'
                        };
                    }

                    // No fallback available
                    return {
                        success: false,
                        error: `PDF document not found in Azure and default fallback unavailable`,
                        fileName: resolvedFileName,
                        roomName: resolvedRoomName
                    };
                }

                // Other Azure error
                throw azureError;
            }
        } catch (error) {
            console.error('[AzurePdfStorageService.getPdfAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to retrieve PDF: ${error.message}`,
                details: error.toString()
            };
        }
    }

    /**
     * Store a PDF document to Azure Blob Storage for a specific room
     * 
     * @param {Buffer} pdfBuffer - PDF file content as Buffer or Blob
     * @param {string} fileName - PDF file name (default: "document.pdf")
     * @param {string} roomName - Collaboration room identifier (default: "default")
     * @returns {Promise<Object>} { success, blobPath, size }
     */
    async storePdfAsync(pdfBuffer, fileName = 'document.pdf', roomName = 'default') {
        try {
            const resolvedFileName = fileName || 'document.pdf';
            const resolvedRoomName = roomName || 'default';

          

            // Convert Blob to Buffer if needed
            let bufferData = pdfBuffer;
            if (pdfBuffer instanceof Blob || (typeof pdfBuffer === 'object' && pdfBuffer.arrayBuffer)) {
                const arrayBuffer = await pdfBuffer.arrayBuffer();
                bufferData = Buffer.from(arrayBuffer);
            }

            // Construct blob path
            const blobPath = `${resolvedRoomName}/${resolvedFileName}`;
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

            // Upload to Azure
            const uploadBlobResponse = await blockBlobClient.upload(
                bufferData,
                bufferData.length
            );

          

            return {
                success: true,
                blobPath,
                size: bufferData.length,
                requestId: uploadBlobResponse.requestId
            };
        } catch (error) {
            console.error('[AzurePdfStorageService.storePdfAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to store PDF in Azure: ${error.message}`,
                details: error.toString()
            };
        }
    }

    /**
     * Delete a PDF document from Azure Blob Storage
     * 
     * @param {string} fileName - PDF file name
     * @param {string} roomName - Collaboration room identifier
     * @returns {Promise<Object>} { success, blobPath }
     */
    async deletePdfAsync(fileName = 'document.pdf', roomName = 'default') {
        try {
            const blobPath = `${roomName}/${fileName}`;
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

            await blockBlobClient.delete();


            return {
                success: true,
                blobPath
            };
        } catch (error) {
            console.error('[AzurePdfStorageService.deletePdfAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to delete PDF: ${error.message}`
            };
        }
    }

    /**
     * List all PDFs in a room
     * 
     * @param {string} roomName - Collaboration room identifier
     * @returns {Promise<Object>} { success, files: [{name, size, lastModified}] }
     */
    async listPdfsInRoomAsync(roomName = 'default') {
        try {
            const prefix = `${roomName}/`;
            const files = [];

            for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
                // Extract just the filename (without roomName prefix)
                const fileName = blob.name.substring(prefix.length);
                if (fileName) {
                    // Exclude blobs that are just the room folder
                    files.push({
                        name: fileName,
                        size: blob.properties.contentLength,
                        lastModified: blob.properties.lastModified
                    });
                }
            }


            return {
                success: true,
                roomName,
                files
            };
        } catch (error) {
            console.error('[AzurePdfStorageService.listPdfsInRoomAsync] Error:', error.message);
            return {
                success: false,
                error: `Failed to list PDFs: ${error.message}`
            };
        }
    }

    /**
     * Convert readable stream to Buffer
     * @private
     */
    async _streamToBuffer(readableStream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            readableStream.on('data', (data) => {
                chunks.push(data instanceof Buffer ? data : Buffer.from(data));
            });
            readableStream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
            readableStream.on('error', reject);
        });
    }
}

module.exports = AzurePdfStorageService;
