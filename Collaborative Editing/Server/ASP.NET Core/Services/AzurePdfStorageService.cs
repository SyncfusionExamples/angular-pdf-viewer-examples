using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace PdfViewerCollaborativeEditingServer.Services
{
    /// <summary>
    /// Azure Blob Storage Service for PDF Documents.
    /// Manages PDF document storage and retrieval using Azure Blob Storage.
    /// </summary>
    public class AzurePdfStorageService : IAzurePdfStorageService
    {
        private readonly string _connectionString;
        private readonly string _containerName;
        private readonly string _defaultPdfPath;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly BlobContainerClient _containerClient;
        private readonly ILogger<AzurePdfStorageService> _logger;

        public AzurePdfStorageService(
            IConfiguration configuration,
            IWebHostEnvironment hostingEnvironment,
            ILogger<AzurePdfStorageService> logger)
        {
            _logger = logger;

            // Azure configuration
            _connectionString = configuration["AzureStorage:ConnectionString"]
                ?? throw new InvalidOperationException("Azure Storage connection string not configured");

            _containerName = configuration["AzureStorage:ContainerName"] ?? "pdfs";

            // Local fallback for default PDF
            _defaultPdfPath = Path.Combine(hostingEnvironment.WebRootPath, "PDF", "pdf-succinctly.pdf");

            // Initialize Azure Blob Service Client
            _blobServiceClient = new BlobServiceClient(_connectionString);
            _containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
        }

        /// <summary>
        /// Get PDF document as Base64 encoded string from Azure Blob Storage.
        /// </summary>
        public async Task<PdfStorageResult> GetPdfAsync(string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string resolvedFileName = fileName ?? "document.pdf";
                string resolvedRoomName = roomName ?? "default";

                // Construct blob path: roomName/fileName
                string blobPath = $"{resolvedRoomName}/{resolvedFileName}";
                BlobClient blockBlobClient = _containerClient.GetBlobClient(blobPath);

                try
                {
                    // Attempt to download from Azure
                    BlobDownloadInfo download = await blockBlobClient.DownloadAsync();
                    
                    using (var ms = new MemoryStream())
                    {
                        await download.Content.CopyToAsync(ms);
                        byte[] buffer = ms.ToArray();
                        string base64Content = Convert.ToBase64String(buffer);

                        _logger.LogInformation($"[AzureStorage] Retrieved PDF from Azure: {blobPath}");

                        return new PdfStorageResult
                        {
                            Success = true,
                            FileName = resolvedFileName,
                            RoomName = resolvedRoomName,
                            Content = base64Content,
                            ContentLength = buffer.Length,
                            IsDefault = false
                        };
                    }
                }
                catch (Azure.RequestFailedException ex) when (ex.Status == 404)
                {
                    // Blob not found in Azure - try local fallback
                    _logger.LogInformation($"[AzureStorage] Blob not found in Azure: {blobPath}. Trying local fallback.");

                    if (File.Exists(_defaultPdfPath))
                    {
                        byte[] buffer = await File.ReadAllBytesAsync(_defaultPdfPath);
                        string base64Content = Convert.ToBase64String(buffer);

                        return new PdfStorageResult
                        {
                            Success = true,
                            FileName = resolvedFileName,
                            RoomName = resolvedRoomName,
                            Content = base64Content,
                            ContentLength = buffer.Length,
                            IsDefault = true,
                            Message = "Using local default PDF"
                        };
                    }

                    return new PdfStorageResult
                    {
                        Success = false,
                        FileName = resolvedFileName,
                        RoomName = resolvedRoomName,
                        Error = "PDF not found in Azure and local fallback unavailable"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"[AzureStorage] Error retrieving PDF: {ex.Message}");
                return new PdfStorageResult
                {
                    Success = false,
                    Error = $"Failed to retrieve PDF: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Store a PDF document to Azure Blob Storage for a specific room.
        /// </summary>
        public async Task<StorageResult> StorePdfAsync(byte[] pdfBuffer, string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string resolvedFileName = fileName ?? "document.pdf";
                string resolvedRoomName = roomName ?? "default";

                // Construct blob path
                string blobPath = $"{resolvedRoomName}/{resolvedFileName}";
                BlobClient blockBlobClient = _containerClient.GetBlobClient(blobPath);

                // Upload to Azure
                using (var ms = new MemoryStream(pdfBuffer))
                {
                    Azure.Response<BlobContentInfo> uploadResponse = await blockBlobClient.UploadAsync(ms, overwrite: true);

                    _logger.LogInformation($"[AzureStorage] PDF stored to Azure: {blobPath} ({pdfBuffer.Length} bytes)");

                    return new StorageResult
                    {
                        Success = true,
                        BlobPath = blobPath,
                        Size = pdfBuffer.Length,
                        Message = $"PDF stored: {resolvedRoomName}/{resolvedFileName}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"[AzureStorage] Error storing PDF: {ex.Message}");
                return new StorageResult
                {
                    Success = false,
                    Error = $"Failed to store PDF: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Check if a PDF exists in Azure Blob Storage.
        /// </summary>
        public async Task<bool> PdfExistsForRoomAsync(string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string blobPath = $"{roomName ?? "default"}/{fileName ?? "document.pdf"}";
                BlobClient blockBlobClient = _containerClient.GetBlobClient(blobPath);

                return await blockBlobClient.ExistsAsync();
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Delete a PDF document from Azure Blob Storage.
        /// </summary>
        public async Task<StorageResult> DeletePdfAsync(string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string blobPath = $"{roomName ?? "default"}/{fileName ?? "document.pdf"}";
                BlobClient blockBlobClient = _containerClient.GetBlobClient(blobPath);

                await blockBlobClient.DeleteAsync();

                _logger.LogInformation($"[AzureStorage] PDF deleted: {blobPath}");

                return new StorageResult
                {
                    Success = true,
                    BlobPath = blobPath,
                    Message = $"PDF deleted: {roomName}/{fileName}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[AzureStorage] Error deleting PDF: {ex.Message}");
                return new StorageResult
                {
                    Success = false,
                    Error = $"Failed to delete PDF: {ex.Message}"
                };
            }
        }
    }
}
