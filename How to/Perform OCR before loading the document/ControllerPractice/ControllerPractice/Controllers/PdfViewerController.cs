using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Syncfusion.EJ2.PdfViewer;
using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Linq;
using Microsoft.AspNetCore.Http;
using HarfBuzzSharp;
using Syncfusion.Pdf.Parsing;
using Syncfusion.OCRProcessor;

namespace PdfViewerService2.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class PdfViewerController : ControllerBase
    {
        private IHostingEnvironment _hostingEnvironment;
        //Initialize the memory cache object   
        public IMemoryCache _cache;
        public PdfViewerController(IHostingEnvironment hostingEnvironment, IMemoryCache cache)
        {
            _hostingEnvironment = hostingEnvironment;
            _cache = cache;
            Console.WriteLine("PdfViewerController initialized");
        }

        [HttpPost("PerformOCR")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/PerformOCR")]
        //Post action for downloading the PDF documents
        public IActionResult PerformOCR([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            // Get the Base64 string of the PDF document from the request body
            string documentBase = jsonObject["documentBase64"];
            byte[] bytes = Convert.FromBase64String(documentBase);
            MemoryStream ms = new MemoryStream(bytes);
            PdfLoadedDocument loadedDocument = new PdfLoadedDocument(ms);

            //Initialize the OCR processor
            using (OCRProcessor processor = new OCRProcessor())
            {
                //Language to process the OCR
                processor.Settings.Language = Languages.English;

                //Process OCR by providing the PDF document.
                processor.PerformOCR(loadedDocument);
            }

            //Saving the PDF to the MemoryStream
            MemoryStream stream = new MemoryStream();
            loadedDocument.Save(stream);

            //Close the PDF document 
            loadedDocument.Close(true);

            //Set the position as '0'
            stream.Position = 0;

            string updatedDocumentBase = Convert.ToBase64String(stream.ToArray());
            return (Content("data:application/pdf;base64," + updatedDocumentBase));
        }

        //GET api/values
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

