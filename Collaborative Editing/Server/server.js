const {
    CollaborationServer
} = require('@syncfusion/ej2-collaborator-server');
const PdfViewerCollaborationAdapter =
    require('./adapters/PdfViewerCollaborationAdapter');
const {
    registerRoutes,
    registerPdfDocumentRoutes
} = require('./controllers/collaborative-editing-controller');
const PdfStorageService = require('./services/pdf-storage-service');

const cors = require('cors');

// Initialize PDF Storage Service
const pdfStorageService = new PdfStorageService();

const adapter = new PdfViewerCollaborationAdapter({
    storageService: pdfStorageService
});

const server =
    new CollaborationServer({

        port: 8081,

        redis: {

            host:
                'pdfviewercache.redis.cache.windows.net',

            port: 6380,
            username: 'default',

            password:
                'K9dp2I3jyTjFl1KPLkZlj5ekQ3zgER6embOhWquvZJM=',

            tls: {}
        },
        adapter,
        saveThreshold: 2

    });

// Inject transport into adapter for save notifications
adapter.transport = server.getTransport ? server.getTransport() : null;


server.app.use(cors());

// Register collaborative editing routes
registerRoutes(
    server.app,
    server.actionService,
    adapter,
    server
);

// Register PDF document management routes
registerPdfDocumentRoutes(
    server.app,
    pdfStorageService
);

// Health check endpoint
server.app.get('/api/test', (req, res) => {
    res.json({ status: 'PDF Viewer Collaboration Server Running' });
});

server.start();

// Graceful shutdown: Close Puppeteer browser on process termination
const gracefulShutdown = async () => {
    try {
        // Close Puppeteer browser
        await adapter.closeBrowser();
    } catch (ex) {
        console.error('[Shutdown] Error during cleanup:', ex.message);
    }
    process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

