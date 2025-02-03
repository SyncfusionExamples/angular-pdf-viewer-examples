using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Syncfusion.EJ2.PdfViewer;
using System.IO;
using System.Net;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using System.Web.Helpers;
using Microsoft.Ajax.Utilities;
using Syncfusion.Pdf;
using Syncfusion.Pdf.Graphics;
using Syncfusion.Drawing;
using Syncfusion.Pdf.Parsing;

namespace PdfViewerLatestDemo.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class PdfViewerController : Controller
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

        [HttpGet("GetDocument")]
        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]
        [Route("[controller]/GetDocument")]
        public IActionResult GetDocument(string fileName)

        {
            WebClient WebClient = new WebClient();
            string documentPath = GetDocumentPath(fileName);
            // Read the file content into a byte array
            byte[] pdfDoc = System.IO.File.ReadAllBytes(documentPath);
            var stream = new MemoryStream(pdfDoc);
            var base64 = Convert.ToBase64String(stream.ToArray());
            return Content("data:application/pdf;base64," + base64);
        }

        //Returns the PDF document path
        private string GetDocumentPath(string document)
        {
            string documentPath = string.Empty;
            if (!System.IO.File.Exists(document))
            {
                var path = _hostingEnvironment.ContentRootPath;
                if (System.IO.File.Exists(path + "/wwwroot/Data/" + document))
                    documentPath = path + "/wwwroot/Data/" + document;
            }
            else
            {
                documentPath = document;
            }
            Console.WriteLine(documentPath);
            return documentPath;
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
        public IActionResult Index()
        {
            return View();
        }
    }
}
