from pathlib import Path

path = Path("scripts/sync-drive.mjs")
source = path.read_text(encoding="utf-8")

replacements = [
    (
        '''function parseServiceAccount() {
  const raw = env("GOOGLE_SERVICE_ACCOUNT_JSON") || env("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  if (!raw) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_JSON. Store the complete service-account JSON as a GitHub Actions secret.",
    );
  }
''',
        '''function parseServiceAccount() {
  const raw = env("GOOGLE_SERVICE_ACCOUNT_JSON") || env("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64");
  if (!raw) return null;
''',
    ),
    (
        '''async function driveFetch(accessToken, pathname, params = {}) {
  const url = new URL(`${DRIVE_API}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Drive API ${pathname} failed (${response.status}): ${detail.slice(0, 800)}`);
  }
  return response.json();
}

async function listChildren(accessToken, parentId) {
''',
        '''async function createDriveAuth() {
  const apiKey = env("GOOGLE_DRIVE_API_KEY");
  if (apiKey) {
    return { mode: "api-key", apiKey, accessToken: "" };
  }

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    throw new Error(
      "Missing GOOGLE_DRIVE_API_KEY. For a fully public Data Room, create a restricted Google Drive API key and store it as a GitHub Actions secret. GOOGLE_SERVICE_ACCOUNT_JSON remains available as a fallback.",
    );
  }
  return {
    mode: "service-account",
    apiKey: "",
    accessToken: await getAccessToken(serviceAccount),
  };
}

async function driveFetch(auth, pathname, params = {}) {
  const url = new URL(`${DRIVE_API}${pathname}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  if (auth.apiKey) url.searchParams.set("key", auth.apiKey);
  const headers = auth.accessToken ? { authorization: `Bearer ${auth.accessToken}` } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Drive API ${pathname} failed (${response.status}): ${detail.slice(0, 800)}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

async function listChildren(auth, parentId) {
''',
    ),
    (
        'const payload = await driveFetch(accessToken, "/files", {',
        'const payload = await driveFetch(auth, "/files", {',
    ),
    (
        'async function collectTree(accessToken, rootFolderId) {',
        'async function collectTree(auth, rootFolderId) {',
    ),
    (
        'const children = await listChildren(accessToken, folder.id);',
        'const children = await listChildren(auth, folder.id);',
    ),
    (
        '''async function isPublicFile(accessToken, fileId) {
  let pageToken = "";
  do {
    const payload = await driveFetch(accessToken, `/files/${encodeURIComponent(fileId)}/permissions`, {
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      fields:
        "nextPageToken,permissions(id,type,role,allowFileDiscovery,expirationTime,permissionDetails(inherited,inheritedFrom))",
    });
    for (const permission of payload.permissions || []) {
      if (permission.type !== "anyone") continue;
      if (permission.expirationTime && new Date(permission.expirationTime).getTime() <= Date.now()) continue;
      if (["reader", "commenter", "writer", "fileOrganizer", "organizer", "owner"].includes(permission.role)) {
        return true;
      }
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return false;
}
''',
        '''async function isPublicFile(auth, fileId) {
  if (auth.mode === "api-key") {
    try {
      const payload = await driveFetch(auth, `/files/${encodeURIComponent(fileId)}`, {
        supportsAllDrives: true,
        fields: "id,trashed,webViewLink,webContentLink",
      });
      return Boolean(payload.id) && payload.trashed !== true;
    } catch (error) {
      if ([401, 403, 404].includes(error.status)) return false;
      throw error;
    }
  }

  let pageToken = "";
  do {
    const payload = await driveFetch(auth, `/files/${encodeURIComponent(fileId)}/permissions`, {
      pageSize: 100,
      pageToken,
      supportsAllDrives: true,
      fields:
        "nextPageToken,permissions(id,type,role,allowFileDiscovery,expirationTime,permissionDetails(inherited,inheritedFrom))",
    });
    for (const permission of payload.permissions || []) {
      if (permission.type !== "anyone") continue;
      if (permission.expirationTime && new Date(permission.expirationTime).getTime() <= Date.now()) continue;
      if (["reader", "commenter", "writer", "fileOrganizer", "organizer", "owner"].includes(permission.role)) {
        return true;
      }
    }
    pageToken = payload.nextPageToken || "";
  } while (pageToken);
  return false;
}
''',
    ),
    (
        '''  const serviceAccount = parseServiceAccount();
  const accessToken = await getAccessToken(serviceAccount);
  console.log("Authenticated to Google Drive with the configured service account.");

  const treeFiles = await collectTree(accessToken, rootFolderId);
''',
        '''  const auth = await createDriveAuth();
  console.log(
    auth.mode === "api-key"
      ? "Reading the fully public Google Drive Data Room with a restricted API key."
      : "Authenticated to Google Drive with the configured service account fallback.",
  );

  const treeFiles = await collectTree(auth, rootFolderId);
''',
    ),
    (
        'public: await isPublicFile(accessToken, targetId)',
        'public: await isPublicFile(auth, targetId)',
    ),
]

for old, new in replacements:
    if old not in source:
        raise SystemExit(f"Expected source fragment not found:\n{old[:180]}")
    source = source.replace(old, new, 1)

source = source.replace(
    '    warnings.push(`${missingMetadata.length} indexed record(s) use fallback metadata; update the Drive description to improve the public index.`);\n    warnings.push(`${missingMetadata.length} indexed record(s) use fallback metadata; update the Drive description to improve the public index.`);',
    '    warnings.push(`${missingMetadata.length} indexed record(s) use fallback metadata; update the Drive description to improve the public index.`);',
)

path.write_text(source, encoding="utf-8")
print("Applied public Drive API-key mode to scripts/sync-drive.mjs")
