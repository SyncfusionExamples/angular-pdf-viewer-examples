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

        [HttpPost("Load")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/Load")]
        //Post action for loading the PDF documents 
        public IActionResult Load([FromBody] Dictionary<string, string> jsonObject)
        {
            Console.WriteLine("Load called");
            //Initialize the PDF viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            MemoryStream stream = new MemoryStream();

            object jsonResult = new object();

            if (jsonObject != null && jsonObject.ContainsKey("document"))
            {
                if (bool.Parse(jsonObject["isFileName"]))
                {
                    string documentPath = GetDocumentPath(jsonObject["document"]);
                    if (!string.IsNullOrEmpty(documentPath))
                    {
                        byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
                        stream = new MemoryStream(bytes);
                    }
                    else
                    {
                        string fileName = jsonObject["document"].Split(new string[] { "://" }, StringSplitOptions.None)[0];
                        if (fileName == "http" || fileName == "https")
                        {
                            WebClient WebClient = new WebClient();
                            byte[] pdfDoc = WebClient.DownloadData(jsonObject["document"]);
                            stream = new MemoryStream(pdfDoc);
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
            PdfLoadedDocument loadedDocument = new PdfLoadedDocument(stream);

            //Initialize the OCR processor
            using (OCRProcessor processor = new OCRProcessor())
            {
                //Language to process the OCR
                processor.Settings.Language = Languages.English;

                //Process OCR by providing the PDF document.
                processor.PerformOCR(loadedDocument);
            }
            //Saving the PDF to the MemoryStream
            MemoryStream stream1 = new MemoryStream();
            loadedDocument.Save(stream1);
            //Close the PDF document 
            loadedDocument.Close(true);
            jsonResult = pdfviewer.Load(stream1, jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("Bookmarks")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/Bookmarks")]
        //Post action for processing the bookmarks from the PDF documents
        public IActionResult Bookmarks([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            var jsonResult = pdfviewer.GetBookmarks(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("RenderPdfPages")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/RenderPdfPages")]
        //Post action for processing the PDF documents  
        public IActionResult RenderPdfPages([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            object jsonResult = pdfviewer.GetPage(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("RenderPdfTexts")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/RenderPdfTexts")]
        //Post action for processing the PDF texts  
        public IActionResult RenderPdfTexts([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            object jsonResult = pdfviewer.GetDocumentText(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("RenderThumbnailImages")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/RenderThumbnailImages")]
        //Post action for rendering the thumbnail images
        public IActionResult RenderThumbnailImages([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            object result = pdfviewer.GetThumbnailImages(jsonObject);
            return Content(JsonConvert.SerializeObject(result));
        }

        [AcceptVerbs("Post")]
        [HttpPost("RenderTaggedContent")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/RenderTaggedContent")]
        //Post action for processing the PDF texts  
        public IActionResult RenderTaggedContent([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            object jsonResult = pdfviewer.GetTaggedElements(jsonObject);
            System.Diagnostics.Debug.WriteLine(JsonConvert.SerializeObject(jsonResult));
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("RenderAnnotationComments")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/RenderAnnotationComments")]
        //Post action for rendering the annotations
        public IActionResult RenderAnnotationComments([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            object jsonResult = pdfviewer.GetAnnotationComments(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("ExportAnnotations")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/ExportAnnotations")]
        //Post action to export annotations
        public IActionResult ExportAnnotations([FromBody] Dictionary<string, string> jsonObject)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            string jsonResult = pdfviewer.ExportAnnotation(jsonObject);
            return Content(jsonResult);
        }

        [AcceptVerbs("Post")]
        [HttpPost("ImportAnnotations")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/ImportAnnotations")]
        //Post action to import annotations
        public IActionResult ImportAnnotations([FromBody] Dictionary<string, string> jsonObject)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            string jsonResult = string.Empty;
            object JsonResult;
            if (jsonObject != null && jsonObject.ContainsKey("fileName"))
            {
                string documentPath = GetDocumentPath(jsonObject["fileName"]);
                if (!string.IsNullOrEmpty(documentPath))
                {
                    jsonResult = System.IO.File.ReadAllText(documentPath);
                    string[] searchStrings = { "textMarkupAnnotation", "measureShapeAnnotation", "freeTextAnnotation", "stampAnnotations", "signatureInkAnnotation", "stickyNotesAnnotation", "signatureAnnotation", "AnnotationType" };
                    bool isnewJsonFile = !searchStrings.Any(jsonResult.Contains);
                    if (isnewJsonFile)
                    {
                        byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
                        jsonObject["importedData"] = Convert.ToBase64String(bytes);
                        JsonResult = pdfviewer.ImportAnnotation(jsonObject);
                        jsonResult = JsonConvert.SerializeObject(JsonResult);
                    }
                }
                else
                {
                    return this.Content(jsonObject["document"] + " is not found");
                }
            }
            else
            {
                string extension = System.IO.Path.GetExtension(jsonObject["importedData"]);
                if (extension != ".xfdf")
                {
                    JsonResult = pdfviewer.ImportAnnotation(jsonObject);
                    return Content(JsonConvert.SerializeObject(JsonResult));
                }
                else
                {
                    string documentPath = GetDocumentPath(jsonObject["importedData"]);
                    if (!string.IsNullOrEmpty(documentPath))
                    {
                        byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
                        jsonObject["importedData"] = Convert.ToBase64String(bytes);
                        JsonResult = pdfviewer.ImportAnnotation(jsonObject);
                        return Content(JsonConvert.SerializeObject(JsonResult));
                    }
                    else
                    {
                        return this.Content(jsonObject["document"] + " is not found");
                    }
                }
            }
            return Content(jsonResult);
        }

        [AcceptVerbs("Post")]
        [HttpPost("ExportFormFields")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/ExportFormFields")]
        //Post action to export form fields
        public IActionResult ExportFormFields([FromBody] Dictionary<string, string> jsonObject)

        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            string jsonResult = pdfviewer.ExportFormFields(jsonObject);
            return Content(jsonResult);
        }

        [AcceptVerbs("Post")]
        [HttpPost("ImportFormFields")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/ImportFormFields")]
        //Post action to import form fields
        public IActionResult ImportFormFields([FromBody] Dictionary<string, string> jsonObject)
        {
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            if (jsonObject["formFieldDataFormat"] == "Json")
            {
                try
                {
                    jsonObject["data"] = JsonConvert.DeserializeObject(jsonObject["data"]).ToString();
                }
                catch (Exception e)
                {
                    jsonObject["data"] = jsonObject["data"];
                    jsonObject["data"] = GetDocumentPath(jsonObject["data"]);
                }

            }
            object jsonResult = pdfviewer.ImportFormFields(jsonObject);
            return Content(JsonConvert.SerializeObject(jsonResult));
        }

        [AcceptVerbs("Post")]
        [HttpPost("Unload")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/Unload")]
        //Post action for unloading and disposing the PDF document resources  
        public IActionResult Unload([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            pdfviewer.ClearCache(jsonObject);
            return this.Content("Document cache is cleared");
        }


        [HttpPost("Download")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/Download")]
        //Post action for downloading the PDF documents
        public IActionResult Download([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            string documentBase = pdfviewer.GetDocumentAsBase64(jsonObject);
            return Content(documentBase);
        }

        [HttpPost("PerformOCR")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/PerformOCR")]
        //Post action for downloading the PDF documents
        public IActionResult PerformOCR([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            string documentBase = pdfviewer.GetDocumentAsBase64(jsonObject);
            string convertedBase = documentBase.Substring(documentBase.LastIndexOf(',') + 1);
            byte[] bytes = Convert.FromBase64String(convertedBase);
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

        [HttpPost("SaveChunk")]
        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
        [Route("[controller]/SaveChunk")]
        //Post action for downloading the PDF documents
        public IActionResult SaveChunk([FromBody] IFormFile jsonObject)
        {
            //var chunk = jsonObject["chunk"];
            //var chunkName = jsonObject["chunkName"];
            //bool.TryParse(jsonObject["isNewFile"], out bool isNewFile);
            return Content("Saved");
        }

        [HttpPost("PrintImages")]
        //[Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]
        [Route("[controller]/PrintImages")]
        //Post action for printing the PDF documents
        public IActionResult PrintImages([FromBody] Dictionary<string, string> jsonObject)
        {
            //Initialize the PDF Viewer object with memory cache object
            PdfRenderer pdfviewer = new PdfRenderer(_cache);
            object pageImage = pdfviewer.GetPrintImage(jsonObject);
            return Content(JsonConvert.SerializeObject(pageImage));
        }

        //Returns the PDF document path
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

