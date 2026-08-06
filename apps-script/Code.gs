/**
 * Cellpinda Global Data Room public JSON feed.
 *
 * This Apps Script uses the built-in DriveApp service and therefore does not
 * require the user to create or manage a Google Cloud Console project.
 * Deploy it as a web app that executes as the deploying user and is accessible
 * to anyone. GitHub Actions reads the resulting /exec URL once per day.
 */
const CONFIG = Object.freeze({
  ROOT_FOLDER_ID: '1f7GoC25SGkIyRZa85qGdbmf0Rb0Pkde6',
  ROOT_FOLDER_NAME: 'Cellpinda Global Data Room',
  SCHEMA_VERSION: '1.0.0',
  CACHE_SECONDS: 300,
  MAX_FILES: 2000,
  EXCLUDED_FOLDER_NAMES: Object.freeze([
    '00_ADMIN_AND_INDEX',
    '02_CONTROLLED_ACCESS',
    '03_NDA_ONLY',
    '04_COUNTRY_PACKS',
    '05_SHIPMENT_DOCUMENTS',
    '06_EXPIRED_SUPERSEDED',
    'LEGACY_PUBLIC_DOWNLOADS_EMPTY',
  ]),
});

const GOOGLE_MIME = Object.freeze({
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  DRAWING: 'application/vnd.google-apps.drawing',
  SHORTCUT: 'application/vnd.google-apps.shortcut',
});

function doGet(e) {
  try {
    const refresh = e && e.parameter && String(e.parameter.refresh || '') !== '';
    return jsonOutput_(buildFeed_(refresh));
  } catch (error) {
    return jsonOutput_({
      ok: false,
      schemaVersion: CONFIG.SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      error: error && error.message ? error.message : String(error),
    });
  }
}

function testFeed() {
  const payload = buildFeed_(true);
  const summary = {
    ok: payload.ok,
    rootFolderId: payload.rootFolderId,
    rootFolderName: payload.rootFolderName,
    files: payload.files.length,
    foldersVisited: payload.foldersVisited,
    privateFilesExcluded: payload.privateFilesExcluded,
    warnings: payload.warnings,
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

function getWebAppUrl() {
  const url = ScriptApp.getService().getUrl();
  console.log(url || 'The web app has not been deployed yet.');
  return url;
}

function buildFeed_(forceRefresh) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'cellpinda-public-drive-feed-v1';
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const root = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  if (root.getName() !== CONFIG.ROOT_FOLDER_NAME) {
    throw new Error(
      'Configured root folder name mismatch. Expected "' + CONFIG.ROOT_FOLDER_NAME +
      '", received "' + root.getName() + '".',
    );
  }

  const rootPublic = isPublicAccess_(root.getSharingAccess());
  if (!rootPublic) {
    throw new Error('Cellpinda Global Data Room is not shared as Anyone with the link / Viewer.');
  }

  const state = { files: [], foldersVisited: 0, privateFilesExcluded: 0, warnings: [] };
  walkFolder_(root, [], true, state);

  state.files.sort(function (a, b) {
    const pathA = a.path.join('/').toLowerCase();
    const pathB = b.path.join('/').toLowerCase();
    return pathA < pathB ? -1 : pathA > pathB ? 1 : 0;
  });

  const payload = {
    ok: true,
    schemaVersion: CONFIG.SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    sourceMode: 'apps-script-drive-feed',
    rootFolderId: CONFIG.ROOT_FOLDER_ID,
    rootFolderName: root.getName(),
    rootPublic: rootPublic,
    foldersVisited: state.foldersVisited,
    privateFilesExcluded: state.privateFilesExcluded,
    files: state.files,
    warnings: state.warnings,
  };

  const serialized = JSON.stringify(payload);
  if (serialized.length < 95000) cache.put(cacheKey, serialized, CONFIG.CACHE_SECONDS);
  return payload;
}

function walkFolder_(folder, relativePath, inheritedPublic, state) {
  state.foldersVisited += 1;
  const folderName = folder.getName();
  if (relativePath.length && CONFIG.EXCLUDED_FOLDER_NAMES.indexOf(folderName) !== -1) {
    state.warnings.push('Excluded reserved folder: ' + relativePath.concat(folderName).join('/'));
    return;
  }

  const folderPublic = inheritedPublic || isPublicAccess_(safeSharingAccess_(folder));
  const currentPath = relativePath.length ? relativePath.concat(folderName) : relativePath;

  const files = folder.getFiles();
  while (files.hasNext()) {
    if (state.files.length >= CONFIG.MAX_FILES) {
      throw new Error('Public feed exceeded the safety limit of ' + CONFIG.MAX_FILES + ' files.');
    }
    const file = files.next();
    const directPublic = isPublicAccess_(safeSharingAccess_(file));
    const effectivePublic = folderPublic || directPublic;
    if (!effectivePublic) {
      state.privateFilesExcluded += 1;
      continue;
    }
    state.files.push(fileRecord_(file, currentPath.concat(file.getName()), directPublic, folderPublic));
  }

  const folders = folder.getFolders();
  while (folders.hasNext()) {
    const child = folders.next();
    if (CONFIG.EXCLUDED_FOLDER_NAMES.indexOf(child.getName()) !== -1) {
      state.warnings.push('Excluded reserved folder: ' + currentPath.concat(child.getName()).join('/'));
      continue;
    }
    walkFolder_(child, currentPath, folderPublic, state);
  }
}

function fileRecord_(file, path, directPublic, inheritedPublic) {
  let id = file.getId();
  let mimeType = file.getMimeType();
  let shortcutTargetId = null;
  let shortcutTargetMimeType = null;

  if (mimeType === GOOGLE_MIME.SHORTCUT) {
    try {
      shortcutTargetId = file.getTargetId();
      shortcutTargetMimeType = file.getTargetMimeType();
      if (shortcutTargetId) id = shortcutTargetId;
      if (shortcutTargetMimeType) mimeType = shortcutTargetMimeType;
    } catch (error) {
      // Keep the shortcut record when target metadata cannot be resolved.
    }
  }

  const resourceKey = safeCall_(function () { return file.getResourceKey(); }, '');
  return {
    id: id,
    name: file.getName(),
    mimeType: mimeType,
    description: safeCall_(function () { return file.getDescription(); }, ''),
    createdTime: file.getDateCreated().toISOString(),
    modifiedTime: file.getLastUpdated().toISOString(),
    size: safeCall_(function () { return file.getSize(); }, null),
    webViewLink: appendResourceKey_(file.getUrl(), resourceKey),
    webContentLink: buildDownloadUrl_(id, mimeType, resourceKey, file),
    resourceKey: resourceKey || null,
    directPublic: directPublic,
    inheritedPublic: inheritedPublic,
    public: true,
    sharingAccess: enumName_(safeSharingAccess_(file)),
    sharingPermission: enumName_(safeCall_(function () { return file.getSharingPermission(); }, null)),
    shortcutTargetId: shortcutTargetId,
    shortcutTargetMimeType: shortcutTargetMimeType,
    path: path,
    trashed: file.isTrashed(),
  };
}

function buildDownloadUrl_(id, mimeType, resourceKey, file) {
  const encodedId = encodeURIComponent(id);
  let url = '';
  if (mimeType === GOOGLE_MIME.DOCUMENT) {
    url = 'https://docs.google.com/document/d/' + encodedId + '/export?format=pdf';
  } else if (mimeType === GOOGLE_MIME.SPREADSHEET) {
    url = 'https://docs.google.com/spreadsheets/d/' + encodedId + '/export?format=xlsx';
  } else if (mimeType === GOOGLE_MIME.PRESENTATION) {
    url = 'https://docs.google.com/presentation/d/' + encodedId + '/export/pdf';
  } else if (mimeType === GOOGLE_MIME.DRAWING) {
    url = 'https://docs.google.com/drawings/d/' + encodedId + '/export/pdf';
  } else {
    url = safeCall_(function () { return file.getDownloadUrl(); }, '');
    if (!url) url = 'https://drive.google.com/uc?export=download&id=' + encodedId;
  }
  return appendResourceKey_(url, resourceKey);
}

function appendResourceKey_(url, resourceKey) {
  if (!url || !resourceKey || url.indexOf('resourcekey=') !== -1) return url;
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'resourcekey=' + encodeURIComponent(resourceKey);
}

function safeSharingAccess_(item) {
  return safeCall_(function () { return item.getSharingAccess(); }, DriveApp.Access.PRIVATE);
}

function isPublicAccess_(access) {
  return access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK;
}

function enumName_(value) {
  return value === null || value === undefined ? null : String(value);
}

function safeCall_(callback, fallback) {
  try {
    const value = callback();
    return value === undefined ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function jsonOutput_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
