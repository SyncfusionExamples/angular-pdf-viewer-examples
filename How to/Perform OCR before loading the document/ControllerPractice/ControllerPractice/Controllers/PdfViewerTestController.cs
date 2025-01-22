//using Microsoft.AspNetCore.Hosting;
//using Microsoft.AspNetCore.Mvc;
//using Microsoft.Extensions.Caching.Memory;
//using Newtonsoft.Json;
//using Newtonsoft.Json.Linq;
//using Syncfusion.EJ2.PdfViewer;
//using Syncfusion.Pdf;
////using Syncfusion.Pdf.Redaction;
//using Syncfusion.Pdf.Graphics;
//using Syncfusion.Pdf.Interactive;
//using Syncfusion.Pdf.Parsing;
//using System;
//using System.Collections.Generic;
//using System.Drawing;
//using System.IO;
//using System.Text;
//using Syncfusion.Pdf.Tables;
//using System.Data;
//using System.Reflection;
//using System.Linq;
//using System.Net;

//namespace PdfViewerService2.Controllers
//{
//    [Route("[controller]")]
//    [ApiController]
//    public class PdfViewerTestController : ControllerBase
//    {
//        private IHostingEnvironment _hostingEnvironment;
//        //Initialize the memory cache object   
//        public IMemoryCache _cache;

//        public PdfViewerTestController(IHostingEnvironment hostingEnvironment, IMemoryCache cache)
//        {
//            _hostingEnvironment = hostingEnvironment;
//            _cache = cache;
//            Console.WriteLine("PdfViewerController initialized");
//        }

//        [HttpPost("Load")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/Load")]
//        //Post action for loading the PDF documents 
//        public IActionResult Load(jsonObjects jsonObject)
//        {
//            Console.WriteLine("Load called");
//            //Initialize the PDF viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            MemoryStream stream = new MemoryStream();
//            var jsonData = JsonConverter(jsonObject);
//            object jsonResult = new object();

//            if (jsonObject != null && jsonData.ContainsKey("document"))
//            {
//                if (bool.Parse(jsonData["isFileName"]))
//                {
//                    string documentPath = GetDocumentPath(jsonData["document"]);
//                    if (!string.IsNullOrEmpty(documentPath))
//                    {
//                        byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
//                        stream = new MemoryStream(bytes);
//                    }
//                    else
//                    {
//                        string fileName = jsonData["document"].Split(new string[] { "://" }, StringSplitOptions.None)[0];
//                        if (fileName == "http" || fileName == "https")
//                        {
//                            WebClient WebClient = new WebClient();
//                            byte[] pdfDoc = WebClient.DownloadData(jsonData["document"]);
//                            stream = new MemoryStream(pdfDoc);
//                        }
//                        else
//                        {
//                            return this.Content(jsonData["document"] + " is not found");
//                        }
//                    }
//                }
//                else
//                {
//                    byte[] bytes = Convert.FromBase64String(jsonData["document"]);
//                    stream = new MemoryStream(bytes);
//                }
//            }
//            jsonResult = pdfviewer.Load(stream, jsonData);
//            var result = JsonConvert.SerializeObject(jsonResult);
//            var result1 = Content(JsonConvert.SerializeObject(jsonResult));
//            return Content(JsonConvert.SerializeObject(jsonResult));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("Bookmarks")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/Bookmarks")]
//        //Post action for processing the bookmarks from the PDF documents
//        public IActionResult Bookmarks(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            var jsonResult = pdfviewer.GetBookmarks(jsonData);
//            var result = JsonConvert.SerializeObject(jsonResult);
//            var result1 = Content(JsonConvert.SerializeObject(jsonResult));
//            return Content(JsonConvert.SerializeObject(jsonResult));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("RenderPdfPages")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/RenderPdfPages")]
//        //Post action for processing the PDF documents  
//        public IActionResult RenderPdfPages(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            object jsonResult = pdfviewer.GetPage(jsonData);
//            var results = JsonConvert.SerializeObject(jsonResult);
//            var results1 = Content(JsonConvert.SerializeObject(jsonResult));
//            return Content(JsonConvert.SerializeObject(jsonResult));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("RenderPdfTexts")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/RenderPdfTexts")]
//        //Post action for processing the PDF texts  
//        public IActionResult RenderPdfTexts(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            object jsonResult = pdfviewer.GetDocumentText(jsonData);
//            var results = JsonConvert.SerializeObject(jsonResult);
//            var results1 = Content(JsonConvert.SerializeObject(jsonResult));
//            return Content(JsonConvert.SerializeObject(jsonResult));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("RenderThumbnailImages")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/RenderThumbnailImages")]
//        //Post action for rendering the thumbnail images
//        public IActionResult RenderThumbnailImages(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            object result = pdfviewer.GetThumbnailImages(jsonData);
//            var results = JsonConvert.SerializeObject(result);
//            var results1 = Content(JsonConvert.SerializeObject(result));
//            return Content(JsonConvert.SerializeObject(result));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("RenderAnnotationComments")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/RenderAnnotationComments")]
//        //Post action for rendering the annotations
//        public IActionResult RenderAnnotationComments(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            object jsonResult = pdfviewer.GetAnnotationComments(jsonData);
//            var results = JsonConvert.SerializeObject(jsonResult);
//            var results1 = Content(JsonConvert.SerializeObject(jsonResult));
//            return Content(JsonConvert.SerializeObject(jsonResult));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("ExportAnnotations")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/ExportAnnotations")]
//        //Post action to export annotations
//        public IActionResult ExportAnnotations(jsonObjects jsonObject)
//        {
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            string jsonResult = pdfviewer.ExportAnnotation(jsonData);
//            return Content(jsonResult);
//        }
//        [AcceptVerbs("Post")]
//        [HttpPost("ImportAnnotations")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/ImportAnnotations")]
//        //Post action to import annotations
//        public IActionResult ImportAnnotations(jsonObjects jsonObject)
//        {
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            string jsonResult = string.Empty;
//            object JsonResult;
//            if (jsonObject != null && jsonData.ContainsKey("fileName"))
//            {
//                string documentPath = GetDocumentPath(jsonData["fileName"]);
//                if (!string.IsNullOrEmpty(documentPath))
//                {
//                    jsonResult = System.IO.File.ReadAllText(documentPath);
//                }
//                else
//                {
//                    return this.Content(jsonData["document"] + " is not found");
//                }
//            }
//            else
//            {
//                string extension = Path.GetExtension(jsonData["importedData"]);
//                if (extension != ".xfdf")
//                {
//                    JsonResult = pdfviewer.ImportAnnotation(jsonData);
//                    return Content(JsonConvert.SerializeObject(JsonResult));
//                }
//                else
//                {
//                    string documentPath = GetDocumentPath(jsonData["importedData"]);
//                    if (!string.IsNullOrEmpty(documentPath))
//                    {
//                        byte[] bytes = System.IO.File.ReadAllBytes(documentPath);
//                        jsonData["importedData"] = Convert.ToBase64String(bytes);
//                        JsonResult = pdfviewer.ImportAnnotation(jsonData);
//                        return Content(JsonConvert.SerializeObject(JsonResult));
//                    }
//                    else
//                    {
//                        return this.Content(jsonData["document"] + " is not found");
//                    }
//                }
//            }
//            return Content(jsonResult);
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("ExportFormFields")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/ExportFormFields")]
//        //Post action to export form fields
//        public ActionResult ExportFormFields(jsonObjects jsonObject)

//        {
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            string jsonResult = pdfviewer.ExportFormFields(jsonData);
//            return Content(jsonResult);
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("ImportFormFields")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/ImportFormFields")]
//        //Post action to import form fields
//        public IActionResult ImportFormFields(jsonObjects jsonObject)
//        {
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            //jsonObject["data"] = GetDocumentPath(jsonObject["data"]);
//            object jsonResult = pdfviewer.ImportFormFields(jsonData);
//            return Content(JsonConvert.SerializeObject(jsonResult));
//        }

//        [AcceptVerbs("Post")]
//        [HttpPost("Unload")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/Unload")]
//        //Post action for unloading and disposing the PDF document resources  
//        public IActionResult Unload(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            pdfviewer.ClearCache(jsonData);
//            return this.Content("Document cache is cleared");
//        }


//        [HttpPost("Download")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/Download")]
//        //Post action for downloading the PDF documents
//        public IActionResult Download(jsonObjects jsonObject)
//        {
//            //jsonObject = null;
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            //FileStream fontStream = new FileStream(GetDocumentPath("arial.ttf"), FileMode.Open);
//            //Dictionary<string, Stream> key = new Dictionary<string, Stream>()
//            //{
//            //    ["arial"] = fontStream,
//            //};
//            //pdfviewer.FallbackFontCollection = key;
//            string documentBase = pdfviewer.GetDocumentAsBase64(jsonData);
//            //fontStream.Close();
//            return Content(documentBase);
//        }

//        [HttpPost("PrintImages")]
//        /*        [Microsoft.AspNetCore.Cors.EnableCors("MyPolicy")]*/
//        [Route("[controller]/PrintImages")]
//        //Post action for printing the PDF documents
//        public IActionResult PrintImages(jsonObjects jsonObject)
//        {
//            //Initialize the PDF Viewer object with memory cache object
//            PdfRenderer pdfviewer = new PdfRenderer(_cache);
//            var jsonData = JsonConverter(jsonObject);
//            object pageImage = pdfviewer.GetPrintImage(jsonData);
//            var result = Content(JsonConvert.SerializeObject(pageImage));
//            return Content(JsonConvert.SerializeObject(pageImage));
//        }

//        //Returns the PDF document path
//        private string GetDocumentPath(string document)
//        {
//            string documentPath = string.Empty;
//            if (!System.IO.File.Exists(document))
//            {
//                var path = _hostingEnvironment.ContentRootPath;
//                if (System.IO.File.Exists(path + "/Data/" + document))
//                    documentPath = path + "/Data/" + document;
//            }
//            else
//            {
//                documentPath = document;
//            }
//            Console.WriteLine(documentPath);
//            return documentPath;
//        }

//        //GET api/values
//        [HttpGet]
//        public IEnumerable<string> Get()
//        {
//            return new string[] { "value1", "value2" };
//        }

//        // GET api/values/5
//        [HttpGet("{id}")]
//        public string Get(int id)
//        {
//            return "value";
//        }

//        public Dictionary<string, string> JsonConverter(jsonObjects results)
//        {
//            Dictionary<string, object> resultObjects = new Dictionary<string, object>();
//            resultObjects = results.GetType().GetProperties(BindingFlags.Instance | BindingFlags.Public)
//                .ToDictionary(prop => prop.Name, prop => prop.GetValue(results, null));
//            var emptyObjects = (from kv in resultObjects
//                                where kv.Value != null
//                                select kv).ToDictionary(kv => kv.Key, kv => kv.Value);
//            Dictionary<string, string> jsonResult = emptyObjects.ToDictionary(k => k.Key, k => k.Value.ToString());
//            return jsonResult;
//        }

//        public class jsonObjects
//        {
//            public string document { get; set; }
//            public string password { get; set; }
//            public string zoomFactor { get; set; }
//            public string isFileName { get; set; }
//            public string xCoordinate { get; set; }
//            public string yCoordinate { get; set; }
//            public string pageNumber { get; set; }
//            public string documentId { get; set; }
//            public string hashId { get; set; }
//            public string sizeX { get; set; }
//            public string sizeY { get; set; }
//            public string startPage { get; set; }
//            public string endPage { get; set; }
//            public string stampAnnotations { get; set; }
//            public string textMarkupAnnotations { get; set; }
//            public string stickyNotesAnnotation { get; set; }
//            public string shapeAnnotations { get; set; }
//            public string measureShapeAnnotations { get; set; }
//            public string action { get; set; }
//            public string pageStartIndex { get; set; }
//            public string pageEndIndex { get; set; }
//            public string fileName { get; set; }
//            public string elementId { get; set; }
//            public string pdfAnnotation { get; set; }
//            public string importPageList { get; set; }
//            public string uniqueId { get; set; }
//            public string data { get; set; }
//            public string viewPortWidth { get; set; }
//            public string viewPortHeight { get; set; }
//            public string tilecount { get; set; }
//            public bool isCompletePageSizeNotReceived { get; set; }
//            public string freeTextAnnotation { get; set; }
//            public string signatureData { get; set; }
//            public string fieldsData { get; set; }
//            public string formDesigner { get; set; }
//            public bool isSignatureEdited { get; set; }
//            public string inkSignatureData { get; set; }
//            public bool hideEmptyDigitalSignatureFields { get; set; }
//            public bool showDigitalSignatureAppearance { get; set; }
//            public bool isClientsideLoading { get; set; }
//            public bool digitalSignaturePresent { get; set; }
//            public string tileXCount { get; set; }
//            public string tileYCount { get; set; }
//            public string digitalSignaturePageList { get; set; }
//            public string annotationCollection { get; set; }
//            public string annotationsPageList { get; set; }
//            public string formFieldsPageList { get; set; }
//            public bool isAnnotationsExist { get; set; }
//            public bool isFormFieldAnnotationsExist { get; set; }
//            public string documentLiveCount { get; set; }
//            public string annotationDataFormat { get; set; }
//            public string importedData { get; set; }

//        }

//    }
//}