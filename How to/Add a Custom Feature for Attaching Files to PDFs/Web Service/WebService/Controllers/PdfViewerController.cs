using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Hosting;
using Syncfusion.EJ2.PdfViewer;
using System;
using System.Collections.Generic;
using System.IO;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Parsing;
using Syncfusion.Pdf.Interactive;
using System.Reflection.Metadata;
using System.Net.Mail;

namespace WebService.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class PdfViewerController : Controller
    {
        private Microsoft.AspNetCore.Hosting.IHostingEnvironment _hostingEnvironment;
        public IMemoryCache _cache;
        public PdfViewerController(Microsoft.AspNetCore.Hosting.IHostingEnvironment hostingEnvironment, IMemoryCache cache)
        {
            _hostingEnvironment = hostingEnvironment;
            _cache = cache;
        }

        [AcceptVerbs("Post")]
        [HttpPost("AttachSavePdf")]
        [Route("[controller]/AttachSavePdf")]
        public IActionResult AttachSavePdf([FromBody] DocumentRequest jsonObject)
        {
            try
            {
                byte[] primaryDocumentBytes = Convert.FromBase64String(jsonObject.PrimaryDocument);
                List<(string Name, byte[] Bytes, string Type)> attachedDocuments = new List<(string Name, byte[] Bytes, string Type)>();
                foreach (var doc in jsonObject.AttachedDocuments)
                {
                    attachedDocuments.Add((doc.Name, Convert.FromBase64String(doc.Base64), doc.Type));
                }
                using (MemoryStream primaryStream = new MemoryStream(primaryDocumentBytes))
                {
                    PdfLoadedDocument primaryPdf = new PdfLoadedDocument(primaryStream);
                    foreach (var attachedDoc in attachedDocuments)
                    {
                        using (MemoryStream attachedStream = new MemoryStream(attachedDoc.Bytes))
                        {
                            PdfAttachment attachment = new PdfAttachment(attachedDoc.Name, attachedStream);
                            attachment.ModificationDate = DateTime.Now;
                            attachment.Description = attachedDoc.Name;
                            attachment.MimeType = attachedDoc.Type;
                            if (primaryPdf.Attachments == null)
                                primaryPdf.CreateAttachment();
                            primaryPdf.Attachments.Add(attachment);
                        }
                    }
                    using (MemoryStream outputStream = new MemoryStream())
                    {
                        primaryPdf.Save(outputStream);
                        primaryPdf.Close(true);
                        string mergedBase64 = Convert.ToBase64String(outputStream.ToArray());
                        return Ok(new { attachedPDF = mergedBase64 });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [AcceptVerbs("Post")]
        [HttpPost("LoadedPdf")]
        [Route("[controller]/LoadedPdf")]
        public IActionResult LoadedPdf([FromBody] DocumentRequest jsonObject)
        {
            try
            {
                byte[] loadedDocumentBytes = Convert.FromBase64String(jsonObject.PrimaryDocument);
                using (MemoryStream loadedStream = new MemoryStream(loadedDocumentBytes))
                {
                    PdfLoadedDocument loadedPdf = new PdfLoadedDocument(loadedStream);
                    List<DocumentInfo> documentCollection = new List<DocumentInfo>();
                    if (loadedPdf.Attachments != null)
                    {
                        foreach (PdfAttachment attachment in loadedPdf.Attachments)
                        {
                            using (MemoryStream memoryStream = new MemoryStream())
                            {
                                memoryStream.Position = 0;
                                string mergedBase64 = Convert.ToBase64String(attachment.Data);
                                documentCollection.Add(new DocumentInfo { Name = attachment.FileName, Base64 = mergedBase64, Type = attachment .MimeType});
                            }
                        }
                        return Ok(new { documentCollections = documentCollection });
                    }
                    else { return Ok(new { documentCollections = documentCollection }); }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpGet]
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/values/5
        [HttpGet("{id}")]
        public string Get(int id)
        {
            return "value";
        }
    }
    public class DocumentRequest
    {
        public string PrimaryDocument { get; set; }
        public List<DocumentInfo> AttachedDocuments { get; set; }
    }

    public class DocumentInfo
    {
        public string Name { get; set; }
        public string Base64 { get; set; }
        public string Type { get; set; }
    }
}
