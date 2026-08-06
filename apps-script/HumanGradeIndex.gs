/**
 * Optional Google Sheets metadata layer for the Cellpinda human-grade index.
 *
 * Add this file to the same Apps Script project as Code.gs, set the Script
 * Property HUMAN_GRADE_SHEET_ID, and create a PUBLIC_INDEX tab using the
 * columns in content/human-grade-schema.json.
 */
const HUMAN_GRADE = Object.freeze({
  SHEET_PROPERTY: 'HUMAN_GRADE_SHEET_ID',
  TAB_NAME: 'PUBLIC_INDEX',
  CACHE_SECONDS: 300,
  PUBLIC_STATUS: 'published',
});

function buildHumanGradeFeed_(language, audience) {
  const sheetId = PropertiesService.getScriptProperties().getProperty(HUMAN_GRADE.SHEET_PROPERTY);
  if (!sheetId) {
    return {
      ok: true,
      configured: false,
      generatedAt: new Date().toISOString(),
      records: [],
      warning: 'HUMAN_GRADE_SHEET_ID is not configured.',
    };
  }

  const cacheKey = ['human-grade-index-v1', language || 'all', audience || 'all'].join(':');
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(HUMAN_GRADE.TAB_NAME);
  if (!sheet) throw new Error('Missing sheet tab: ' + HUMAN_GRADE.TAB_NAME);

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return { ok: true, configured: true, generatedAt: new Date().toISOString(), records: [] };

  const headers = values[0].map(function (value) { return String(value).trim(); });
  const records = values.slice(1).map(function (row) {
    const record = {};
    headers.forEach(function (header, index) { record[header] = row[index] || ''; });
    return normalizeHumanGradeRecord_(record, language);
  }).filter(function (record) {
    if (record.status !== HUMAN_GRADE.PUBLIC_STATUS) return false;
    if (audience && record.audiences.indexOf(audience) === -1) return false;
    return true;
  });

  const payload = {
    ok: true,
    configured: true,
    generatedAt: new Date().toISOString(),
    language: language || null,
    audience: audience || null,
    records: records,
  };

  const serialized = JSON.stringify(payload);
  if (serialized.length < 95000) cache.put(cacheKey, serialized, HUMAN_GRADE.CACHE_SECONDS);
  return payload;
}

function normalizeHumanGradeRecord_(record, language) {
  const lang = ['ko', 'en', 'ja', 'zh'].indexOf(language) !== -1 ? language : 'en';
  const audiences = String(record.audiences || '')
    .split(',')
    .map(function (value) { return value.trim(); })
    .filter(Boolean);

  return {
    id: record.id,
    status: String(record.status || '').toLowerCase(),
    title: record['title_' + lang] || record.title_en || record.title_ko || '',
    summary: record['summary_' + lang] || record.summary_en || record.summary_ko || '',
    localized: {
      ko: { title: record.title_ko || '', summary: record.summary_ko || '' },
      en: { title: record.title_en || '', summary: record.summary_en || '' },
      ja: { title: record.title_ja || '', summary: record.summary_ja || '' },
      zh: { title: record.title_zh || '', summary: record.summary_zh || '' },
    },
    audiences: audiences,
    category: record.category || '',
    subcategory: record.subcategory || '',
    country: record.country || '',
    evidenceLevel: record.evidence_level || '',
    regulatoryStatus: record.regulatory_status || '',
    driveFileId: record.drive_file_id || '',
    publicUrl: record.public_url || '',
    publishedAt: record.published_at || '',
    updatedAt: record.updated_at || '',
  };
}

/**
 * Replace the existing doGet body with routing to this function when the
 * Sheets layer is activated. Existing Drive feed behavior remains the default.
 */
function routePublicFeed_(e) {
  const params = e && e.parameter ? e.parameter : {};
  if (String(params.resource || '') === 'human-grade') {
    return jsonOutput_(buildHumanGradeFeed_(String(params.lang || ''), String(params.audience || '')));
  }
  const refresh = String(params.refresh || '') !== '';
  return jsonOutput_(buildFeed_(refresh));
}
