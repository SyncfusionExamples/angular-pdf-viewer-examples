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

function parseRedisConfiguration(connectionString) {
    const trimmed = connectionString.trim();

    if (/^redis(s)?:\/\//i.test(trimmed)) {
        return { url: trimmed };
    }

    const segments = trimmed.split(',').map((part) => part.trim()).filter(Boolean);
    const hostSegment = segments.shift();
    const [host, portText] = hostSegment.split(':');
    const options = {};

    segments.forEach((segment) => {
        const separatorIndex = segment.indexOf('=');
        if (separatorIndex === -1) {
            return;
        }

        const key = segment.slice(0, separatorIndex).trim().toLowerCase();
        const value = segment.slice(separatorIndex + 1).trim();
        options[key] = value;
    });

    const socket = {
        host,
        port: Number(portText || 6379)
    };

    if (isTruthyOption(options.ssl)) {
        socket.tls = true;
    }

    if (options.connecttimeout) {
        socket.connectTimeout = Number(options.connecttimeout);
    }

    return {
        socket,
        password: options.password || undefined,
        username: options.user || options.username || undefined,
        database: options.db ? Number(options.db) : undefined
    };
}

function isTruthyOption(value) {
    return typeof value === 'string' && /^(true|1|yes)$/i.test(value);
}

function tryParseMessage(rawText) {
    try {
        return JSON.parse(rawText);
    } catch (error) {
        return null;
    }
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function getIncomingSnapshot(xfdfData) {
    if (typeof xfdfData === 'string') {
        return xfdfData.trim();
    }

    return '';
}

async function handleJoin(socket, documentId, xfdfData) {
    if (socket.currentDocumentId && socket.currentDocumentId !== documentId) {
        await removeClientFromCurrentRoom(socket);
    }

    if (!rooms.has(documentId)) {
        rooms.set(documentId, new Set());
    }

    const room = rooms.get(documentId);
    room.add(socket);
    socket.currentDocumentId = documentId;

    let snapshot = await getStateSnapshot(documentId);
    const incomingSnapshot = getIncomingSnapshot(xfdfData);

    if (!isNonEmptyString(snapshot) && isNonEmptyString(incomingSnapshot)) {
        snapshot = normalizeSnapshot(incomingSnapshot);
        await setStateSnapshot(documentId, snapshot);
        console.log(`[Collab] Stored join snapshot for room "${documentId}".`);
    }

    socket.send(JSON.stringify({
        type: 'init',
        documentId,
        xfdfData: snapshot || ''
    }));

    console.log(`[Collab] [JOIN] Client joined room "${documentId}" — ${room.size} client(s) connected.`);
}

async function handleAnnotationUpdate(socket, documentId, message) {
    const xfdfData = message.xfdfData.trim();

    if (!xfdfData) {
        console.warn(`[Collab] Ignored empty XFDF update for room "${documentId}".`);
        return;
    }

    const action = resolveMessageAction(message);

    if (action === 'init') {
        const existingSnapshot = await getStateSnapshot(documentId);
        if (!isNonEmptyString(existingSnapshot)) {
            const normalizedSnapshot = normalizeSnapshot(xfdfData);
            await setStateSnapshot(documentId, normalizedSnapshot);
            broadcastToRoom(documentId, JSON.stringify({ type: 'annotationUpdate', documentId, action: 'init', xfdfData: normalizedSnapshot }), socket);
            console.log(`[Collab] Stored initial annotation snapshot for room "${documentId}".`);
        } else {
            console.log(`[Collab] Ignored duplicate initial snapshot for room "${documentId}".`);
        }
        return;
    }

    // Broadcast first so peers receive the change with minimal latency.
    broadcastToRoom(documentId, JSON.stringify({
        type: 'annotationUpdate',
        documentId,
        action,
        xfdfData
    }), socket);

    const currentSnapshot = await getStateSnapshot(documentId);
    const mergedSnapshot = mergeXfdfSnapshot(currentSnapshot, xfdfData);
    await setStateSnapshot(documentId, mergedSnapshot);

    console.log(`[Collab] Broadcast ${action} update for room "${documentId}".`);
}

function resolveMessageAction(message) {
    if (isNonEmptyString(message.action)) {
        return message.action.trim().toLowerCase();
    }

    const incomingDocument = parseXmlDocument(message.xfdfData);
    const incomingRoot = incomingDocument.documentElement;

    if (hasSectionPayload(getFirstChildElementByLocalName(incomingRoot, 'add'))) {
        return 'add';
    }

    if (hasSectionPayload(getFirstChildElementByLocalName(incomingRoot, 'modify'))) {
        return 'modify';
    }

    if (hasSectionPayload(getFirstChildElementByLocalName(incomingRoot, 'delete'))) {
        return 'delete';
    }

    return 'modify';
}

async function getStateSnapshot(documentId) {
    if (isRedisCacheEnabled && redisClient) {
        try {
            const cachedValue = await redisClient.get(getRedisKey(documentId));
            if (isNonEmptyString(cachedValue)) {
                state.set(documentId, cachedValue);
                return cachedValue;
            }
        } catch (error) {
            console.warn(`[Collab] Redis read failed for room "${documentId}".`, error && error.message ? error.message : error);
            isRedisCacheEnabled = false;
        }
    }

    return state.get(documentId) || '';
}

async function setStateSnapshot(documentId, xfdfData) {
    state.set(documentId, xfdfData);

    if (isRedisCacheEnabled && redisClient) {
        try {
            await redisClient.setEx(getRedisKey(documentId), SNAPSHOT_TTL_SECONDS, xfdfData);
        } catch (error) {
            isRedisCacheEnabled = false;
            console.warn(`[Collab] Redis write failed for room "${documentId}".`, error && error.message ? error.message : error);
        }
    }
}

async function clearRoomCache(documentId) {
    if (isRedisCacheEnabled && redisClient) {
        try {
            await redisClient.del(getRedisKey(documentId));
            console.log(`[Collab] [REDIS] Deleted cache key "${getRedisKey(documentId)}".`);
        } catch (error) {
            isRedisCacheEnabled = false;
            console.warn(`[Collab] [REDIS] Failed to delete cache key for room "${documentId}".`, error && error.message ? error.message : error);
        }
    }

    if (state.delete(documentId)) {
        console.log(`[Collab] [MEMORY] Cleared in-memory state for room "${documentId}".`);
    }

    if (rooms.delete(documentId)) {
        console.log(`[Collab] [ROOMS] Removed room "${documentId}".`);
    }
}

async function removeClientFromCurrentRoom(socket) {
    const documentId = socket.currentDocumentId;
    if (!documentId || !rooms.has(documentId)) {
        socket.currentDocumentId = null;
        return;
    }

    const room = rooms.get(documentId);
    room.delete(socket);
    socket.currentDocumentId = null;

    console.log(`[Collab] [LEAVE] Client left room "${documentId}" — ${room.size} client(s) remaining.`);

    if (room.size === 0) {
        console.log(`[Collab] [CACHE_CLEANUP] Room "${documentId}" is now empty.`);
        await clearRoomCache(documentId);
    }
}

function broadcastToRoom(documentId, rawMessage, senderSocket) {
    const room = rooms.get(documentId);
    if (!room) {
        return;
    }

    room.forEach((client) => {
        if (client !== senderSocket && client.readyState === WebSocket.OPEN) {
            client.send(rawMessage);
        }
    });
}

function getRedisKey(documentId) {
    return `doc:${documentId}`;
}

function normalizeSnapshot(xfdfString) {
    const snapshotDocument = parseXmlDocument(xfdfString || '');
    ensureSnapshotStructure(snapshotDocument);
    return xmlSerializer.serializeToString(snapshotDocument);
}

function mergeXfdfSnapshot(existingSnapshot, incomingXfdf) {
    const incomingDocument = parseXmlDocument(incomingXfdf);
    const incomingRoot = incomingDocument.documentElement;

    if (!hasDeltaSections(incomingRoot)) {
        return normalizeSnapshot(incomingXfdf);
    }

    const mergedDocument = parseXmlDocument(existingSnapshot || '');
    ensureSnapshotStructure(mergedDocument);

    const mergedAnnots = ensureAnnotsContainer(mergedDocument);
    const deleteSection = getFirstChildElementByLocalName(incomingRoot, 'delete');
    const addSection = getFirstChildElementByLocalName(incomingRoot, 'add');
    const modifySection = getFirstChildElementByLocalName(incomingRoot, 'modify');

    if (deleteSection) {
        getDeleteIds(deleteSection).forEach((annotationId) => {
            removeDeletedNodes(mergedAnnots, annotationId);
        });
    }

    if (addSection) {
        upsertAnnotationNodes(mergedDocument, mergedAnnots, addSection);
    }

    if (modifySection) {
        upsertAnnotationNodes(mergedDocument, mergedAnnots, modifySection);
    }

    return xmlSerializer.serializeToString(mergedDocument);
}

function parseXmlDocument(xfdfString) {
    if (!isNonEmptyString(xfdfString)) {
        return xmlParser.parseFromString(createEmptySnapshotXml(), 'text/xml');
    }

    return xmlParser.parseFromString(xfdfString, 'text/xml');
}

function createEmptySnapshotXml() {
    return [
        '<?xml version="1.0" encoding="utf-8"?>',
        `<xfdf xmlns="${XFDF_NAMESPACE}" xml:space="preserve">`,
        '  <fields></fields>',
        '  <annots></annots>',
        '  <f href=""></f>',
        '</xfdf>'
    ].join('');
}

function ensureSnapshotStructure(document) {
    const root = document.documentElement;

    if (!getFirstChildElementByLocalName(root, 'fields')) {
        const fieldsElement = document.createElementNS(XFDF_NAMESPACE, 'fields');
        root.appendChild(fieldsElement);
    }

    ensureAnnotsContainer(document);

    if (!getFirstChildElementByLocalName(root, 'f')) {
        const fileElement = document.createElementNS(XFDF_NAMESPACE, 'f');
        fileElement.setAttribute('href', '');
        root.appendChild(fileElement);
    }
}

function ensureAnnotsContainer(document) {
    const root = document.documentElement;
    let annots = getFirstChildElementByLocalName(root, 'annots');

    if (!annots) {
        annots = document.createElementNS(XFDF_NAMESPACE, 'annots');
        root.appendChild(annots);
    }

    return annots;
}

function hasDeltaSections(root) {
    return Boolean(
        getFirstChildElementByLocalName(root, 'add')
        || getFirstChildElementByLocalName(root, 'modify')
        || getFirstChildElementByLocalName(root, 'delete')
    );
}

function hasSectionPayload(sectionElement) {
    if (!sectionElement) {
        return false;
    }

    if (getLocalName(sectionElement) === 'delete') {
        return getDeleteIds(sectionElement).length > 0;
    }

    return getSectionAnnotationNodes(sectionElement).length > 0;
}

function getDeleteIds(deleteSection) {
    return getChildElements(deleteSection)
        .filter((node) => getLocalName(node) === 'id')
        .map((node) => (node.textContent || '').trim())
        .filter(Boolean);
}

function getSectionAnnotationNodes(sectionElement) {
    const directChildren = getChildElements(sectionElement);
    const annotsContainer = directChildren.find((node) => getLocalName(node) === 'annots') || null;

    if (annotsContainer) {
        return getChildElements(annotsContainer);
    }

    return directChildren.filter((node) => getLocalName(node) !== 'name');
}

function getNodeAttribute(node, attributeName) {
    if (!node || typeof node.getAttribute !== 'function') {
        return '';
    }

    return node.getAttribute(attributeName) || '';
}

function getAnnotationIdentity(annotationElement) {
    const name = getNodeAttribute(annotationElement, 'name') || getNodeAttribute(annotationElement, 'id');
    if (name) {
        return `name:${name}`;
    }

    const inReplyTo = getNodeAttribute(annotationElement, 'inreplyto');
    if (inReplyTo) {
        return `reply:${inReplyTo}:${getLocalName(annotationElement)}:${getNodeAttribute(annotationElement, 'page')}`;
    }

    return '';
}

function findMatchingAnnotationNode(annotsContainer, incomingAnnotation) {
    const incomingIdentity = getAnnotationIdentity(incomingAnnotation);
    if (!incomingIdentity) {
        return null;
    }

    return getChildElements(annotsContainer).find((annotationElement) => getAnnotationIdentity(annotationElement) === incomingIdentity) || null;
}

function removeDeletedNodes(annotsContainer, annotationId) {
    getChildElements(annotsContainer).forEach((annotationElement) => {
        const name = getNodeAttribute(annotationElement, 'name') || getNodeAttribute(annotationElement, 'id');
        const inReplyTo = getNodeAttribute(annotationElement, 'inreplyto');

        if (name === annotationId || inReplyTo === annotationId) {
            annotsContainer.removeChild(annotationElement);
        }
    });
}

function upsertAnnotationNodes(targetDocument, annotsContainer, sectionElement) {
    getSectionAnnotationNodes(sectionElement).forEach((incomingAnnotation) => {
        const existingAnnotation = findMatchingAnnotationNode(annotsContainer, incomingAnnotation);
        const newNode = cloneElementIntoDocument(incomingAnnotation, targetDocument);
        if (existingAnnotation) {
            // Replace the existing annotation node in-place to preserve order
            annotsContainer.replaceChild(newNode, existingAnnotation);
        } else {
            // Append new annotation
            annotsContainer.appendChild(newNode);
        }
    });
}

function getChildElements(parentNode) {
    const elements = [];

    if (!parentNode || !parentNode.childNodes) {
        return elements;
    }

    for (let index = 0; index < parentNode.childNodes.length; index += 1) {
        const childNode = parentNode.childNodes[index];
        if (childNode.nodeType === 1) {
            elements.push(childNode);
        }
    }

    return elements;
}

function getFirstChildElementByLocalName(parentNode, localName) {
    return getChildElements(parentNode).find((childElement) => getLocalName(childElement) === localName) || null;
}

function getLocalName(node) {
    return node && (node.localName || node.nodeName.replace(/^.*:/, ''));
}

function cloneElementIntoDocument(element, targetDocument) {
    if (typeof targetDocument.importNode === 'function') {
        return targetDocument.importNode(element, true);
    }

    const serializedElement = xmlSerializer.serializeToString(element);
    const wrapperDocument = xmlParser.parseFromString(`<wrapper>${serializedElement}</wrapper>`, 'text/xml');
    return wrapperDocument.documentElement.firstChild;
}
