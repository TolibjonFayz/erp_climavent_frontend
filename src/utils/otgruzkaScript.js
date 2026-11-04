// "Отгрузка Трекер" jadvaliga o'rnatiladigan Google Apps Script matni.
// Vazifasi: 1) ERP yuborgan o'zgarishlarni jadvalga yozish (Web App, doPost);
//           2) jadval qo'lda tahrirlanganda ERP'ga darhol signal yuborish (onEdit/onChange trigger).
// Sozlamalar sahifasida maxfiy kalit va ERP manzili qo'yilgan holda ko'rsatiladi.
// DIQQAT: ustunlarni topish qoidalari backend'dagi otgruzka-parser.ts bilan bir xil bo'lishi kerak.

const TEMPLATE = String.raw`// Climavent ERP ⇄ "Отгрузка Трекер" — ikki tomonlama sinxron.
// O'rnatish: Kengaytmalar → Apps Script → shu kodni joylang → setup funksiyasini ishga tushiring
// → Joylashtirish (Deploy) → Web ilova: "Men nomimdan", kirish "Hamma" → URL'ni ERP'ga qo'ying.

const SECRET = '__SECRET__';
const ERP_HOOK = '__HOOK__';
const MAIN_GID = 1422524437; // "Главная"
const WATCH_GIDS = [1422524437, 0]; // "Главная", "Лист1"

// ─── ERP → jadval ───────────────────────────────────────────────────
function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return out_({ ok: false, error: 'bad_json' });
  }
  if (!body || body.secret !== SECRET) return out_({ ok: false, error: 'forbidden' });
  var lock = LockService.getDocumentLock();
  lock.waitLock(25000);
  try {
    var sheet = mainSheet_();
    var results = [];
    var ops = body.ops || [];
    for (var i = 0; i < ops.length; i++) results.push(apply_(sheet, ops[i]));
    SpreadsheetApp.flush();
    var ok = results.every(function (r) { return r.ok; });
    return out_({ ok: ok, results: results });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function mainSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) if (sheets[i].getSheetId() === MAIN_GID) return sheets[i];
  return ss.getSheetByName('Главная');
}

function clean_(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function low_(v) { return clean_(v).toLowerCase(); }
function companyKey_(v) {
  return low_(String(v == null ? '' : v).replace(/["'«»\x60ʻʼ‘’]/g, ' ')
    .replace(/(^|\s)(mchj|мчж|ооо|ooo|xk|хк|qk|ао|оао|чп|ип|ntm|нтм|llc|ltd|лтд)(?=\s|$)/gi, ' '));
}
function numberKey_(v) {
  var s = clean_(v);
  return /^\d+([.,]0+)?$/.test(s) ? String(parseInt(s, 10)) : s;
}

var RULES_ = [
  ['inn', function (h) { return h === 'инн'; }],
  ['contact', function (h) { return h.indexOf('клиент фио') === 0 || h === 'клиент'; }],
  ['phone', function (h) { return h.indexOf('тел') >= 0; }],
  ['manager', function (h) { return h.indexOf('менеджер') === 0; }],
  ['date', function (h) { return h.indexOf('дата регистр') === 0; }],
  ['number', function (h) { return h.indexOf('дог') === 0 && h.indexOf('номер') >= 0; }],
  ['company', function (h) { return h.indexOf('компания') === 0; }],
  ['ready', function (h) { return h.indexOf('готовность') === 0; }],
  ['didox_contract', function (h) { return h === 'договор'; }],
  ['didox_poa', function (h) { return h.indexOf('доверенност') === 0; }],
  ['sum', function (h) { return h.indexOf('сумма по дог') === 0; }],
  ['paid', function (h) { return /^(оплеч|оплач)/.test(h); }],
  ['shipped', function (h) { return h.indexOf('отгруженн') === 0; }],
  ['invoice', function (h) { return h.indexOf('счет') === 0 || h.indexOf('счёт') === 0; }],
  ['status', function (h) { return h.indexOf('статус товар') === 0; }],
  ['pay_status', function (h) { return h.indexOf('статус оплат') === 0; }],
  ['sgp', function (h) { return h.indexOf('дата готовност') === 0; }]
];

function layout_(sheet) {
  var values = sheet.getDataRange().getDisplayValues();
  var hi = -1;
  for (var r = 0; r < values.length && hi < 0; r++) {
    var hasNum = false, hasComp = false;
    for (var c = 0; c < values[r].length; c++) {
      var h = low_(values[r][c]);
      if (h.indexOf('дог') === 0 && h.indexOf('номер') >= 0) hasNum = true;
      if (h.indexOf('компания') === 0) hasComp = true;
    }
    if (hasNum && hasComp) hi = r;
  }
  if (hi < 0) throw new Error('header_not_found');
  var header = values[hi].map(low_);
  var col = {};
  for (var i = 0; i < header.length; i++) {
    if (!header[i]) continue;
    for (var k = 0; k < RULES_.length; k++) {
      if (col[RULES_[k][0]] === undefined && RULES_[k][1](header[i])) { col[RULES_[k][0]] = i; break; }
    }
  }
  var after = (col.pay_status !== undefined ? col.pay_status : col.status) + 1;
  var notes = [];
  for (var j = after; j < header.length && notes.length < 2; j++) {
    if (!header[j]) notes.push(j); else break;
  }
  if (notes[0] !== undefined) col.note_main = notes[0];
  if (notes[1] !== undefined) col.note_extra = notes[1];
  return { values: values, headerRow: hi + 1, col: col };
}

// Qatorni topish: avval ERP bilgan qator raqami tekshiriladi, keyin raqam + kompaniya bo'yicha qidiriladi
function findRow_(L, key) {
  var want = numberKey_(key.number);
  var comp = companyKey_(key.company);
  function match(r) {
    var row = L.values[r - 1];
    if (!row) return false;
    if (numberKey_(row[L.col.number]) !== want) return false;
    return !comp || companyKey_(row[L.col.company]) === comp;
  }
  if (key.row && match(key.row)) return key.row;
  var hits = [];
  for (var r = L.headerRow + 1; r <= L.values.length; r++) if (match(r)) hits.push(r);
  if (!hits.length) return 0;
  var nth = key.nth || 1;
  return hits[Math.min(nth, hits.length) - 1];
}

function colLetter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

var DATE_COLS_ = { date: true, sgp: true };

function write_(sheet, L, row, set) {
  var skipped = [];
  for (var k in set) {
    if (!Object.prototype.hasOwnProperty.call(set, k)) continue;
    var c = L.col[k];
    if (c === undefined) { skipped.push(k); continue; }
    var cell = sheet.getRange(row, c + 1);
    var v = set[k];
    if (v === null && k === 'status' && L.col.shipped !== undefined) {
      // Yakuniy holat olib tashlandi — jadvaldagi asl formula qaytariladi
      var o = colLetter_(L.col.shipped + 1) + row;
      cell.setFormula('=IF(' + o + '="", "", IF(' + o + '>=1, "Готово", IF(' + o + '>0, "Частично отгружен", "Ожидание")))');
    } else if (v === null) {
      cell.setValue('');
    } else if (DATE_COLS_[k] && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      var p = v.split('-');
      cell.setValue(new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])));
    } else {
      cell.setValue(v);
    }
  }
  return skipped;
}

function apply_(sheet, op) {
  if (op.op === 'ping') {
    var L0 = layout_(sheet);
    return { ok: true, sheet: sheet.getName(), header_row: L0.headerRow, columns: Object.keys(L0.col) };
  }
  var L = layout_(sheet);
  if (op.op === 'update') {
    var row = findRow_(L, op.key || {});
    if (!row) return { ok: false, error: 'row_not_found', key: op.key };
    return { ok: true, row: row, skipped: write_(sheet, L, row, op.set || {}) };
  }
  if (op.op === 'append') {
    // Oxirgi to'ldirilgan qatordan keyingi qator (pastdagi tayyor shablon qatorlari formulalari bilan qoladi)
    var last = L.headerRow;
    for (var r = L.headerRow + 1; r <= L.values.length; r++) {
      var rv = L.values[r - 1];
      if (clean_(rv[L.col.number]) || clean_(rv[L.col.company])) last = r;
    }
    var target = last + 1;
    if (target > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 1);
    return { ok: true, row: target, skipped: write_(sheet, L, target, op.set || {}) };
  }
  return { ok: false, error: 'unknown_op' };
}

// ─── Jadval → ERP: qo'lda tahrirlanganda darhol signal ──────────────
function onSheetEdit(e) {
  try {
    if (e && e.range) {
      var gid = e.range.getSheet().getSheetId();
      if (WATCH_GIDS.indexOf(gid) < 0) return;
    }
    notifyErp_();
  } catch (err) {
    console.warn(err);
  }
}

function notifyErp_() {
  var cache = CacheService.getDocumentCache();
  if (cache.get('erp_ping')) return; // 5 soniyada bir martadan ko'p emas
  cache.put('erp_ping', '1', 5);
  UrlFetchApp.fetch(ERP_HOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ secret: SECRET }),
    muteHttpExceptions: true
  });
}

// Bir marta ishga tushiriladi: tahrir triggerlarini o'rnatadi va ERP bilan aloqani tekshiradi
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSheetEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onChange().create();
  var res = UrlFetchApp.fetch(ERP_HOOK, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ secret: SECRET, ping: true }),
    muteHttpExceptions: true
  });
  Logger.log('ERP javobi: ' + res.getResponseCode() + ' ' + res.getContentText());
}
`

export function buildOtgruzkaScript({ secret, hookUrl }) {
  return TEMPLATE.replace('__SECRET__', secret || '').replace('__HOOK__', hookUrl || '')
}

/** ERP webhook manzili (frontend qaysi backend'ga ulangan bo'lsa, o'sha) */
export function otgruzkaHookUrl() {
  const base = String(import.meta.env?.VITE_APP_BASE_URL || '').replace(/\/?$/, '/')
  return `${base}otgruzka/hook`
}
