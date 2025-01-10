using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Syncfusion.EJ2.PdfViewer;
using Syncfusion.Pdf.Graphics;
using Syncfusion.Pdf.Interactive;
using Syncfusion.Pdf.Parsing;
using Syncfusion.Pdf;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using Syncfusion.Pdf.Redaction;
using System.Drawing;
using Syncfusion.DocIO;
using Syncfusion.DocIO.DLS;
using Syncfusion.DocIORenderer;
using Syncfusion.EJ2.Navigations;

namespace PdfViewerWebService_8
{
    [Route("[controller]")]
    [ApiController]
    public class PdfViewerController : ControllerBase
    {
        private IWebHostEnvironment _hostingEnvironment;
        //Initialize the memory cache object   
        public IMemoryCache _cache;
        public PdfViewerController(IWebHostEnvironment hostingEnvironment, IMemoryCache cache)
        {
            _hostingEnvironment = hostingEnvironment;
            _cache = cache;
            Console.WriteLine("PdfViewerController initialized");
        }

        [HttpPost("Load")]
        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]
        [Route("[controller]/Load")]
        public IActionResult Load([FromBody] Dictionary<string, string> jsonObject)
        {
            Console.WriteLine("Load called");
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            MemoryStream stream = new MemoryStream();

            // Process the document
            if (jsonObject != null && jsonObject.ContainsKey("document"))
            {
                if (bool.Parse(jsonObject["isFileName"]))
                {
                    string documentPath = GetDocumentPath(jsonObject["document"]);
                    if (!string.IsNullOrEmpty(documentPath))
                    {
                        if (documentPath.EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                        {
                            stream = ConvertDocxToPdfStream(documentPath);
                        }
                        else
                        {
                            byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
                            stream = new MemoryStream(bytes);
                        }
                    }
                    else
                    {
                        string fileName = jsonObject["document"].Split(new string[] { "://" }, StringSplitOptions.None)[0];
                        if (fileName == "http" || fileName == "https")
                        {
                            WebClient webClient = new WebClient();
                            byte[] fileBytes = webClient.DownloadData(jsonObject["document"]);
                            if (jsonObject["document"].EndsWith(".docx", StringComparison.OrdinalIgnoreCase))
                            {
                                string tempDocxPath = Path.GetTempFileName() + ".docx";
                                System.IO.File.WriteAllBytes(tempDocxPath, fileBytes);
                                stream = ConvertDocxToPdfStream(tempDocxPath);
                            }
                            else
                            {
                                stream = new MemoryStream(fileBytes);
                            }
                        }
                        else
                        {
                            return this.Content(jsonObject["document"] + " is not found");
                        }
                    }
                }
                else
                {
                    byte[] bytes = Convert.FromBase64String(jsonObject["document"]);
                    stream = new MemoryStream(bytes);
                }
            }

            byte[] pdfData = stream.ToArray();

            return File(pdfData, "application/pdf");
        }

        private MemoryStream ConvertDocxToPdfStream(string docxPath)
        {
            MemoryStream pdfStream = new MemoryStream();

            using (FileStream fileStream = new FileStream(docxPath, FileMode.Open, FileAccess.Read))
            {
                using (WordDocument wordDocument = new Syncfusion.DocIO.DLS.WordDocument(fileStream, FormatType.Automatic))
                {
                    using (DocIORenderer renderer = new DocIORenderer())
                    {
                        using (Syncfusion.Pdf.PdfDocument pdfDocument = renderer.ConvertToPDF(wordDocument))
                        {
                            pdfDocument.Save(pdfStream);
                            pdfStream.Position = 0; 
                        }
                    }
                }
            }

            return pdfStream;
        }



        [HttpPost("Download")]
        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]
        [Route("[controller]/Download")]
        //Post action for downloading the PDF documents
        public IActionResult Download([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            //string documentBase = pdfviewer.GetDocumentAsBase64(jsonObject);
            //return Content(documentBase);
            string base64 = jsonObject["base64String"];
            string base64String = base64.Split(new string[] { "data:application/pdf;base64," }, StringSplitOptions.None)[1];
            byte[] byteArray = Convert.FromBase64String(base64String);
            MemoryStream ms = new MemoryStream(byteArray);
            var path = _hostingEnvironment.ContentRootPath;
            System.IO.File.WriteAllBytes(path + "/ouptut.pdf", byteArray);
            return Content(string.Empty);
            //return Ok(String.Empty); 
        }

       

        
        //Gets the path of the PDF document
        private string GetDocumentPath(string document)
        {
            string documentPath = string.Empty;
            if (!System.IO.File.Exists(document))
            {
                var path = _hostingEnvironment.ContentRootPath;
                if (System.IO.File.Exists(path + "/Data/" + document))
                    documentPath = path + "/Data/" + document;
            }
            else
            {
                documentPath = document;
            }
            Console.WriteLine(documentPath);
            return documentPath;
        }
        // GET api/values
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
}