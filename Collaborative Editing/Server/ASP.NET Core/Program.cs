using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Serialization;
using Syncfusion.Collaboration.Core.Extensions;
using Syncfusion.Collaboration.Core.Interfaces;
using PdfViewerCollaborativeEditingServer.Adapter;
using PdfViewerCollaborativeEditingServer.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
// Use Newtonsoft.Json for MVC so the collaborative editing payloads (which are
// deserialized into Newtonsoft.Json.Linq.JObject / JToken) bind correctly.
// The default System.Text.Json pipeline cannot convert arbitrary JSON values
// into Newtonsoft JToken, which would cause the [ApiController] automatic
// 400 response ("The request field is required.") on UpdateAction.
builder.Services
    .AddControllersWithViews()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
        options.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
    });

// Disable the [ApiController] automatic 400 model state validation so that
// action methods that take a JSON body (e.g. JObject) and want to return
// their own 4xx response (or run a manual null check) are not blocked by
// the framework before the action body is invoked.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = true;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", corsBuilder =>
    {
        corsBuilder.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Configure Redis connection
var redisConnectionString = builder.Configuration.GetConnectionString("Redis")
    ?? "localhost:6379";

builder.Services.AddCollaborationServer(options =>
{
    options.ConnectionString = redisConnectionString;
    options.ConnectionType = CollaborationConnectionType.SignalR;
    options.SaveThreshold = 2;

});

// Register PDF Storage Services
builder.Services.AddSingleton<IPdfStorageService, PdfStorageService>();

// Register PDF Viewer Collaboration Adapter
// The adapter is injected with the background task queue and storage service
builder.Services.AddSingleton<ICollaborationAdapter, PdfViewerCollaborationAdapter>();

// Register Azure Storage Service (optional - can be enabled via configuration)
if (builder.Configuration.GetValue<bool>("UseAzureStorage"))
{
    builder.Services.AddSingleton<IAzurePdfStorageService, AzurePdfStorageService>();
}

var app = builder.Build();

// Configure middleware
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowAllOrigins");
app.UseWebSockets();

// Map collaboration endpoints
app.MapControllers();
app.MapCollaborationServer();

// Health check endpoint
app.MapGet("/api/test", () => new { status = "PDF Viewer Collaboration Server Running" });

app.Run();
