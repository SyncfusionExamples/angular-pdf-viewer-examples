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
using System.Net;

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

        [AcceptVerbs("LoadPdf")]
        [HttpPost("LoadPdf")]
        [Route("[controller]/LoadPdf")]
        public IActionResult LoadPdf([FromBody] DocumentInfo jsonObject)
        {
            WebClient WebClient = new WebClient();
            byte[] pdfDoc = WebClient.DownloadData(jsonObject.data);
            string base64String = "data:application/pdf;base64," + Convert.ToBase64String(pdfDoc);
            return Ok(new { base64String = base64String });
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

    public class DocumentInfo
    {
        public string data { get; set; }
    }
}
