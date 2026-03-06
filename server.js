const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_BOOKMARKS_PATH = path.join(PUBLIC_DIR, "data", "bookmarks.json");
const RUNTIME_BOOKMARKS_PATH = path.join(DATA_DIR, "bookmarks.runtime.json");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon"
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";

  if (!raw) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw)) {
    return raw;
  }

  return `https://${raw}`;
}

function normalizeBookmark(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const name = typeof item.name === "string" ? item.name.trim() : "";
  const url = typeof item.url === "string" ? normalizeUrl(item.url) : "";

  if (!name || !url) {
    return null;
  }

  return { name, url };
}

function normalizeGroup(group) {
  if (!group || typeof group !== "object") {
    return null;
  }

  const title = typeof group.title === "string" && group.title.trim() ? group.title.trim() : "Unnamed Group";
  const items = Array.isArray(group.items) ? group.items.map(normalizeBookmark).filter(Boolean) : [];

  return { title, items };
}

function sanitizeBookmarks(data) {
  if (!data || !Array.isArray(data.groups)) {
    throw new Error("Invalid bookmark schema");
  }

  return {
    groups: data.groups.map(normalizeGroup).filter(Boolean)
  };
}

function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

function readBookmarksPayload() {
  const sourcePath = fs.existsSync(RUNTIME_BOOKMARKS_PATH) ? RUNTIME_BOOKMARKS_PATH : DEFAULT_BOOKMARKS_PATH;
  const source = sourcePath === RUNTIME_BOOKMARKS_PATH ? "server" : "default";
  const data = sanitizeBookmarks(readJsonFile(sourcePath));

  return { data, source };
}

function writeRuntimeBookmarks(data) {
  ensureDataDir();
  const nextPath = `${RUNTIME_BOOKMARKS_PATH}.tmp`;
  fs.writeFileSync(nextPath, JSON.stringify(sanitizeBookmarks(data), null, 2));
  fs.renameSync(nextPath, RUNTIME_BOOKMARKS_PATH);
}

function json(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(body);
}

function text(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(message);
}

function sendFile(response, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const type = MIME_TYPES[extension] || "application/octet-stream";
  const noCache = extension === ".html" || extension === ".json";

  response.writeHead(200, {
    "Cache-Control": noCache ? "no-cache, must-revalidate" : "public, max-age=31536000, immutable",
    "Content-Type": type
  });

  fs.createReadStream(filePath).pipe(response);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1024 * 1024) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function handleBookmarksGet(response) {
  const { data, source } = readBookmarksPayload();
  json(response, 200, { ...data, meta: { source } });
}

async function handleBookmarksPut(request, response) {
  const raw = await readRequestBody(request);
  const nextState = sanitizeBookmarks(JSON.parse(raw || "{}"));

  writeRuntimeBookmarks(nextState);
  json(response, 200, { ...nextState, meta: { source: "server" } });
}

async function handleBookmarksReset(response) {
  if (fs.existsSync(RUNTIME_BOOKMARKS_PATH)) {
    fs.unlinkSync(RUNTIME_BOOKMARKS_PATH);
  }

  const { data, source } = readBookmarksPayload();
  json(response, 200, { ...data, meta: { source } });
}

function resolveStaticPath(urlPath) {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const absolutePath = path.join(PUBLIC_DIR, requestedPath);
  const normalizedPath = path.normalize(absolutePath);
  const hasExtension = path.extname(requestedPath) !== "";

  if (!normalizedPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  if (fs.existsSync(normalizedPath) && fs.statSync(normalizedPath).isFile()) {
    return normalizedPath;
  }

  if (hasExtension) {
    return null;
  }

  return path.join(PUBLIC_DIR, "index.html");
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

    if (url.pathname === "/api/health") {
      json(response, 200, { ok: true });
      return;
    }

    if (url.pathname === "/api/bookmarks" && request.method === "GET") {
      await handleBookmarksGet(response);
      return;
    }

    if (url.pathname === "/api/bookmarks" && request.method === "PUT") {
      await handleBookmarksPut(request, response);
      return;
    }

    if (url.pathname === "/api/bookmarks/reset" && request.method === "POST") {
      await handleBookmarksReset(response);
      return;
    }

    const filePath = resolveStaticPath(url.pathname);

    if (!filePath) {
      text(response, 404, "Not Found");
      return;
    }

    sendFile(response, filePath);
  } catch (error) {
    console.error(error);
    text(response, 500, "Internal Server Error");
  }
});

ensureDataDir();
server.listen(PORT, HOST, () => {
  console.log(`lighter-page listening on http://${HOST}:${PORT}`);
});
