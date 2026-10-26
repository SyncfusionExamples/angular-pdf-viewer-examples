namespace PdfViewerCollaborativeEditingServer.Services
{
    /// <summary>
    /// PDF Storage Service for local file system storage.
    /// Manages PDF document storage and retrieval for collaborative editing rooms.
    /// </summary>
    public class PdfStorageService : IPdfStorageService
    {
        private readonly string _baseStoragePath;
        private readonly string _defaultPdfPath;
        private readonly ILogger<PdfStorageService> _logger;

        public PdfStorageService(IConfiguration configuration, IWebHostEnvironment hostingEnvironment, ILogger<PdfStorageService> logger)
        {
            _logger = logger;

            // Base storage path - use config or default
            _baseStoragePath = configuration["PdfStorage:StoragePath"] 
                ?? Path.Combine(hostingEnvironment.ContentRootPath, "storage", "pdfs");

            // Default PDF path - use config or default
            _defaultPdfPath = configuration["PdfStorage:DefaultPdfPath"]
                ?? Path.Combine(hostingEnvironment.WebRootPath, "PDF", "pdf-succinctly.pdf");

            // Ensure base directory exists
            EnsureDirectoryExists(_baseStoragePath);
        }

        /// <summary>
        /// Get PDF document as Base64 encoded string.
        /// </summary>
        public async Task<PdfStorageResult> GetPdfAsync(string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string resolvedFileName = fileName ?? "document.pdf";
                string resolvedRoomName = roomName ?? "default";

                // Construct room-specific storage path
                string roomStoragePath = Path.Combine(_baseStoragePath, resolvedRoomName);
                string pdfPath = Path.Combine(roomStoragePath, resolvedFileName);

                // Check if room-specific PDF exists
                if (FileExists(pdfPath))
                {
                    byte[] buffer = await ReadFileAsync(pdfPath);
                    string base64Content = Convert.ToBase64String(buffer);

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

                _logger.LogInformation($"[PdfStorage] Room-specific PDF not found: {pdfPath}. Trying default.");

                // Try default PDF
                if (FileExists(_defaultPdfPath))
                {
                    byte[] buffer = await ReadFileAsync(_defaultPdfPath);
                    string base64Content = Convert.ToBase64String(buffer);

                    return new PdfStorageResult
                    {
                        Success = true,
                        FileName = resolvedFileName,
                        RoomName = resolvedRoomName,
                        Content = base64Content,
                        ContentLength = buffer.Length,
                        IsDefault = true,
                        Message = "Using default PDF"
                    };
                }

                // Neither found
                _logger.LogError($"[PdfStorage] PDF not found - room: {pdfPath}, default: {_defaultPdfPath}");

                return new PdfStorageResult
                {
                    Success = false,
                    FileName = resolvedFileName,
                    RoomName = resolvedRoomName,
                    Error = "PDF document not found",
                    Message = "Document not in room storage and default fallback not available"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[PdfStorage] Error: {ex.Message}");
                return new PdfStorageResult
                {
                    Success = false,
                    Error = $"Failed to retrieve PDF: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Store a PDF document for a specific room.
        /// </summary>
        public async Task<StorageResult> StorePdfAsync(byte[] pdfBuffer, string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string resolvedFileName = fileName ?? "document.pdf";
                string resolvedRoomName = roomName ?? "default";

                // Create room directory
                string roomStoragePath = Path.Combine(_baseStoragePath, resolvedRoomName);
                EnsureDirectoryExists(roomStoragePath);

                // Write PDF file
                string filePath = Path.Combine(roomStoragePath, resolvedFileName);
                await WriteFileAsync(filePath, pdfBuffer);

                _logger.LogInformation($"[PdfStorage] PDF stored: {filePath} ({pdfBuffer.Length} bytes)");

                return new StorageResult
                {
                    Success = true,
                    FilePath = filePath,
                    Size = pdfBuffer.Length,
                    Message = $"PDF stored: {resolvedRoomName}/{resolvedFileName}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[PdfStorage] Storage error: {ex.Message}");
                return new StorageResult
                {
                    Success = false,
                    Error = $"Failed to store PDF: {ex.Message}"
                };
            }
        }

        /// <summary>
        /// Check if a PDF exists for a specific room.
        /// </summary>
        public async Task<bool> PdfExistsForRoomAsync(string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string resolvedFileName = fileName ?? "document.pdf";
                string resolvedRoomName = roomName ?? "default";
                string roomStoragePath = Path.Combine(_baseStoragePath, resolvedRoomName);
                string pdfPath = Path.Combine(roomStoragePath, resolvedFileName);

                return FileExists(pdfPath);
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Delete a PDF document for a specific room.
        /// </summary>
        public async Task<StorageResult> DeletePdfAsync(string fileName = "document.pdf", string roomName = "default")
        {
            try
            {
                string resolvedFileName = fileName ?? "document.pdf";
                string resolvedRoomName = roomName ?? "default";

                string roomStoragePath = Path.Combine(_baseStoragePath, resolvedRoomName);
                string filePath = Path.Combine(roomStoragePath, resolvedFileName);

                if (!FileExists(filePath))
                {
                    return new StorageResult
                    {
                        Success = false,
                        Error = "PDF not found",
                        FilePath = filePath
                    };
                }

                await DeleteFileAsync(filePath);

                _logger.LogInformation($"[PdfStorage] PDF deleted: {filePath}");

                return new StorageResult
                {
                    Success = true,
                    FilePath = filePath,
                    Message = $"PDF deleted: {resolvedRoomName}/{resolvedFileName}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"[PdfStorage] Delete error: {ex.Message}");
                return new StorageResult
                {
                    Success = false,
                    Error = $"Failed to delete PDF: {ex.Message}"
                };
            }
        }

        // ========== Private Helper Methods ==========

        private void EnsureDirectoryExists(string dirPath)
        {
            if (!Directory.Exists(dirPath))
            {
                Directory.CreateDirectory(dirPath);
            }
        }

        private bool FileExists(string filePath)
        {
            return File.Exists(filePath);
        }

        private async Task<byte[]> ReadFileAsync(string filePath)
        {
            return await File.ReadAllBytesAsync(filePath);
        }

        private async Task WriteFileAsync(string filePath, byte[] data)
        {
            await File.WriteAllBytesAsync(filePath, data);
        }

        private async Task DeleteFileAsync(string filePath)
        {
            await Task.Run(() => File.Delete(filePath));
        }
    }
}
