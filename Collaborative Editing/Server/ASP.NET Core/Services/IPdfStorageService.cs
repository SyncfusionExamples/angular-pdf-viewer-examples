namespace PdfViewerCollaborativeEditingServer.Services
{
    /// <summary>
    /// Interface for PDF document storage and retrieval.
    /// </summary>
    public interface IPdfStorageService
    {
        /// <summary>
        /// Retrieve a stored PDF document as Base64 encoded content.
        /// </summary>
        /// <param name="fileName">PDF file name (default: "document.pdf")</param>
        /// <param name="roomName">Collaboration room identifier (default: "default")</param>
        /// <returns>Result object with PDF content and metadata</returns>
        Task<PdfStorageResult> GetPdfAsync(string fileName = "document.pdf", string roomName = "default");

        /// <summary>
        /// Store a PDF document for a specific room.
        /// </summary>
        /// <param name="pdfBuffer">PDF file content as byte array</param>
        /// <param name="fileName">PDF file name (default: "document.pdf")</param>
        /// <param name="roomName">Collaboration room identifier (default: "default")</param>
        /// <returns>Result object with storage path and size</returns>
        Task<StorageResult> StorePdfAsync(byte[] pdfBuffer, string fileName = "document.pdf", string roomName = "default");

        /// <summary>
        /// Check if a PDF exists for a specific room.
        /// </summary>
        Task<bool> PdfExistsForRoomAsync(string fileName = "document.pdf", string roomName = "default");

        /// <summary>
        /// Delete a PDF document for a specific room.
        /// </summary>
        Task<StorageResult> DeletePdfAsync(string fileName = "document.pdf", string roomName = "default");
    }

    /// <summary>
    /// Result object for PDF retrieval operations.
    /// </summary>
    public class PdfStorageResult
    {
        public bool Success { get; set; }
        public string? FileName { get; set; }
        public string? RoomName { get; set; }
        public string? Content { get; set; } // Base64 encoded PDF
        public int ContentLength { get; set; }
        public bool IsDefault { get; set; }
        public string? Error { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Result object for storage operations.
    /// </summary>
    public class StorageResult
    {
        public bool Success { get; set; }
        public string? FilePath { get; set; }
        public string? BlobPath { get; set; }
        public int Size { get; set; }
        public string? Error { get; set; }
        public string? Message { get; set; }
    }

    /// <summary>
    /// Interface for Azure Blob Storage operations.
    /// </summary>
    public interface IAzurePdfStorageService : IPdfStorageService
    {
    }
}
