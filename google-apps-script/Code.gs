/**
 * Rental Property — Google Sheet backend
 *
 * วิธีใช้ (ทำครั้งเดียว) ดู google-apps-script/README.md
 *  1. Extensions > Apps Script วางโค้ดนี้ทั้งหมด
 *  2. แก้ API_KEY ด้านล่างเป็นรหัสของคุณเอง
 *  3. เลือกฟังก์ชัน setup แล้วกด Run (อนุญาตสิทธิ์)
 *  4. Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)
 */
const API_KEY = 'CHANGE_ME';

const SCHEMA = {
  Rooms: {
    title: 'ห้องพัก',
    cols: ['id', 'name', 'type', 'price', 'status', 'tenant', 'image',
           'deposit', 'floor', 'size', 'amenities', 'note', 'common_fee', 'common_times',
           'installment', 'installment_months', 'installment_start', 'installment_paid', 'loan_amount',
           'purchase_type', 'purchase_price'],
    labels: ['รหัส', 'ชื่อห้อง', 'ประเภท', 'ค่าเช่า/เดือน', 'สถานะ', 'ผู้เช่า', 'รูป (ลิงก์รูป/Google Drive)',
             'เงินประกัน', 'ชั้น', 'ขนาด (ตร.ม.)', 'สิ่งอำนวยความสะดวก', 'หมายเหตุ',
             'ค่าส่วนกลาง/ครั้ง', 'จ่ายกี่ครั้ง/ปี (ว่าง=2)',
             'ค่างวดผ่อน/เดือน', 'ผ่อนทั้งหมดกี่งวด', 'เริ่มผ่อน (yyyy-mm-dd)', 'ผ่อนไปแล้วกี่งวด (ว่าง=คำนวณจากวันเริ่ม)', 'ยอดกู้',
             'ซื้อแบบ (installment=ผ่อน / cash=ซื้อสด)', 'ราคาซื้อห้อง'],
    widths: [110, 220, 100, 110, 110, 180, 260, 100, 60, 90, 240, 220, 130, 130, 120, 120, 150, 190, 120, 200, 130],
  },
  Tenants: {
    title: 'ผู้เช่า',
    cols: ['id', 'name', 'nickname', 'dob', 'age', 'gender', 'room', 'phone', 'email', 'social_contact',
           'occupation', 'workplace', 'status', 'start_date', 'contract_end', 'due_day', 'income', 'province', 'created_at',
           'move_out_date', 'form_ts'],
    labels: ['รหัส', 'ชื่อ-สกุล', 'ชื่อเล่น', 'วันเกิด', 'อายุ', 'เพศ', 'ห้อง', 'โทรศัพท์', 'อีเมล', 'ช่องทางติดต่อ',
             'อาชีพ', 'สถานที่ทำงาน', 'สถานะ', 'เริ่มสัญญา (yyyy-mm-dd)', 'สิ้นสุดสัญญา (yyyy-mm-dd)', 'วันครบกำหนดจ่าย (1-31)', 'รายได้', 'จังหวัด', 'สร้างเมื่อ',
             'ย้ายออกจริง (yyyy-mm-dd)', 'เวลากรอกแบบสอบถาม'],
    widths: [110, 200, 90, 100, 60, 70, 110, 120, 180, 150, 140, 180, 90, 130, 130, 120, 100, 110, 150, 150, 160],
  },
  Transactions: {
    title: 'การเงิน',
    cols: ['id', 'date', 'description', 'category', 'type', 'expense_type', 'amount', 'status', 'room', 'created_at'],
    labels: ['รหัส', 'วันที่', 'รายละเอียด', 'หมวดหมู่', 'ประเภท', 'ชนิดค่าใช้จ่าย', 'จำนวนเงิน', 'สถานะ', 'ห้อง', 'สร้างเมื่อ'],
    widths: [110, 100, 260, 130, 90, 110, 110, 90, 110, 150],
  },
  // Month-by-month instalment table of each room (same columns as the owner's own spreadsheet)
  LoanPayments: {
    title: 'ตารางผ่อน',
    cols: ['id', 'room', 'month_no', 'installment', 'principal', 'interest', 'extra', 'note'],
    labels: ['รหัส', 'ห้อง', 'เดือนที่', 'งวดละ', 'เงินต้น', 'ดอกเบี้ย', 'เงินทบ (เงินต้นที่ตัดจริง)', 'หมายเหตุ'],
    widths: [110, 110, 80, 110, 120, 110, 170, 220],
  },
};

const HEADER_BG = '#4F46E5';



// ============ Setup (run once) ============
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SCHEMA).forEach(function (name) {
    const def = SCHEMA[name];
    const sh = ss.getSheetByName(name) || ss.insertSheet(name);
    const n = def.cols.length;

    // Row 1 = machine keys (ห้ามแก้), Row 2 = ป้ายภาษาไทย (อ่านง่าย)
    sh.getRange(1, 1, 1, n).setValues([def.cols]);
    sh.getRange(2, 1, 1, n).setValues([def.labels]);
    // เก็บทุกคอลัมน์เป็นข้อความ กันเบอร์โทรขึ้นต้น 0 / วันที่ ถูกแปลงอัตโนมัติ
    sh.getRange(1, 1, sh.getMaxRows(), n).setNumberFormat('@');

    sh.getRange(1, 1, 1, n).setFontColor('#94a3b8').setFontSize(8).setBackground('#f1f5f9');
    sh.getRange(2, 1, 1, n).setBackground(HEADER_BG).setFontColor('#ffffff').setFontWeight('bold')
      .setVerticalAlignment('middle').setHorizontalAlignment('center');
    sh.setRowHeight(2, 32);
    sh.setFrozenRows(2);
    sh.setFrozenColumns(2);
    def.widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });

    const body = sh.getRange(3, 1, sh.getMaxRows() - 2, n);
    body.setVerticalAlignment('middle');
    const bandings = sh.getBandings();
    if (!bandings.length) body.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);

    if (sh.getFilter()) sh.getFilter().remove();
    sh.getRange(2, 1, sh.getMaxRows() - 1, n).createFilter();
    sh.getRange('A1').setNote('แถวที่ 1 คือชื่อคอลัมน์ที่แอปใช้ ห้ามแก้/ลบ');
  });

  addValidation_(ss.getSheetByName('Rooms'), 'status', ['available', 'occupied', 'reserved', 'maintenance']);
  addValidation_(ss.getSheetByName('Rooms'), 'purchase_type', ['installment', 'cash']);
  addValidation_(ss.getSheetByName('Tenants'), 'status', ['Active', 'Past']);
  addValidation_(ss.getSheetByName('Transactions'), 'type', ['income', 'expense']);
  addValidation_(ss.getSheetByName('Transactions'), 'status', ['Paid', 'Pending', 'Overdue', 'Cancelled']);
  addValidation_(ss.getSheetByName('Transactions'), 'expense_type', ['fixed', 'variable']);

  statusColors_(ss.getSheetByName('Rooms'), 'status', {
    available: '#d1fae5', occupied: '#fee2e2', reserved: '#dbeafe', maintenance: '#fef3c7',
  });
  statusColors_(ss.getSheetByName('Transactions'), 'status', {
    Paid: '#d1fae5', Pending: '#fef3c7', Overdue: '#fee2e2', Cancelled: '#e2e8f0',
  });
  statusColors_(ss.getSheetByName('Tenants'), 'status', { Active: '#d1fae5', Past: '#e2e8f0' });

  buildSummary_(ss);

  const first = ss.getSheetByName('Sheet1') || ss.getSheetByName('ชีต1');
  if (first && ss.getSheets().length > 1) ss.deleteSheet(first);
  ss.setActiveSheet(ss.getSheetByName('Summary'));
  ss.moveActiveSheet(1);
}

function colIndex_(sheetName, key) {
  return SCHEMA[sheetName].cols.indexOf(key) + 1;
}

function addValidation_(sh, key, values) {
  const sheetName = sh.getName();
  const c = colIndex_(sheetName, key);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(true).build(); // warn only: never block writes from the app
  sh.getRange(3, c, sh.getMaxRows() - 2, 1).setDataValidation(rule);
}

function statusColors_(sh, key, map) {
  const c = colIndex_(sh.getName(), key);
  const range = sh.getRange(3, c, sh.getMaxRows() - 2, 1);
  const rules = Object.keys(map).map(function (v) {
    return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(v).setBackground(map[v]).setRanges([range]).build();
  });
  sh.setConditionalFormatRules(sh.getConditionalFormatRules().concat(rules));
}

// หน้าสรุป: เปิด Sheet แล้วเห็นภาพรวมทันที (สูตรอัปเดตเอง)
function buildSummary_(ss) {
  const sh = ss.getSheetByName('Summary') || ss.insertSheet('Summary');
  sh.clear();
  const R = "Rooms!$E$3:$E";
  const T = "Transactions!";
  const rows = [
    ['📊 สรุปภาพรวม (Summary)', '', ''],
    ['', '', ''],
    ['ห้องพัก', 'จำนวน', ''],
    ['ทั้งหมด', '=COUNTA(Rooms!$A$3:$A)', ''],
    ['ว่าง (available)', '=COUNTIF(' + R + ',"available")', ''],
    ['มีผู้เช่า (occupied)', '=COUNTIF(' + R + ',"occupied")', ''],
    ['จอง (reserved)', '=COUNTIF(' + R + ',"reserved")', ''],
    ['ซ่อมบำรุง (maintenance)', '=COUNTIF(' + R + ',"maintenance")', ''],
    ['อัตราเข้าพัก', '=IFERROR(B6/B4,0)', ''],
    ['', '', ''],
    ['ผู้เช่า', 'จำนวน', ''],
    ['กำลังเช่า (Active)', '=COUNTIF(Tenants!$M$3:$M,"Active")', ''],
    ['อดีตผู้เช่า (Past)', '=COUNTIF(Tenants!$M$3:$M,"Past")', ''],
    ['', '', ''],
    ['การเงินเดือนนี้ (' + 'yyyy-MM' + ')', 'บาท', ''],
    ['รายรับ', '=SUMPRODUCT((LEFT(' + T + '$B$3:$B,7)=TEXT(TODAY(),"yyyy-MM"))*(' + T + '$E$3:$E="income")*IFERROR(VALUE(SUBSTITUTE(' + T + '$G$3:$G,",","")),0))', ''],
    ['รายจ่าย', '=SUMPRODUCT((LEFT(' + T + '$B$3:$B,7)=TEXT(TODAY(),"yyyy-MM"))*(' + T + '$E$3:$E="expense")*IFERROR(VALUE(SUBSTITUTE(' + T + '$G$3:$G,",","")),0))', ''],
    ['กำไรสุทธิ', '=B16-B17', ''],
    ['ค้างชำระ (Overdue)', '=SUMPRODUCT((' + T + '$H$3:$H="Overdue")*IFERROR(VALUE(SUBSTITUTE(' + T + '$G$3:$G,",","")),0))', ''],
  ];
  sh.getRange(1, 1, rows.length, 3).setValues(rows);
  sh.getRange('A1').setFontSize(16).setFontWeight('bold');
  ['A3:B3', 'A11:B11', 'A15:B15'].forEach(function (a) {
    sh.getRange(a).setBackground(HEADER_BG).setFontColor('#ffffff').setFontWeight('bold');
  });
  sh.getRange('B9').setNumberFormat('0%');
  sh.getRange('B16:B19').setNumberFormat('#,##0');
  sh.getRange('A18:B18').setFontWeight('bold');
  sh.getRange('B4:B19').setHorizontalAlignment('right');
  sh.setColumnWidth(1, 240); sh.setColumnWidth(2, 120);
  sh.getRange('A15').setFormula('="การเงินเดือนนี้ ("&TEXT(TODAY(),"yyyy-MM")&")"');
}

// ============ Web API ============
function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readTable_(name) {
  const def = SCHEMA[name];
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  const last = sh.getLastRow();
  if (last < 3) return [];
  const vals = sh.getRange(3, 1, last - 2, def.cols.length).getDisplayValues();
  const rows = [];
  vals.forEach(function (r) {
    if (!r[0] && !r[1]) return;       // skip blank rows
    const o = {};
    def.cols.forEach(function (c, i) { o[c] = r[i]; });
    rows.push(o);
  });
  return rows;
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.key !== API_KEY) return out_({ ok: false, error: 'unauthorized' });
  return out_({
    ok: true,
    rooms: readTable_('Rooms'),
    tenants: readTable_('Tenants'),
    transactions: readTable_('Transactions'),
    loan_payments: readTableSafe_('LoanPayments'),
  });
}

// before setup() has created a new tab the app must still work
function readTableSafe_(name) {
  try {
    return SpreadsheetApp.getActive().getSheetByName(name) ? readTable_(name) : [];
  } catch (err) {
    return [];
  }
}

function tableName_(t) {
  const m = { rooms: 'Rooms', tenants: 'Tenants', transactions: 'Transactions', loan_payments: 'LoanPayments' };
  if (!m[t]) throw new Error('unknown table: ' + t);
  return m[t];
}

function findRow_(sh, id) {
  const last = sh.getLastRow();
  if (last < 3) return -1;
  const ids = sh.getRange(3, 1, last - 2, 1).getDisplayValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 3;
  return -1;
}

function toRow_(def, rec, existing) {
  return def.cols.map(function (c, i) {
    if (rec[c] !== undefined && rec[c] !== null) return String(rec[c]);
    return existing ? existing[i] : '';
  });
}

function newId_() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.key !== API_KEY) return out_({ ok: false, error: 'unauthorized' });
    if (body.action === 'deleteMany') {
      const nm = tableName_(body.table);
      const shd = SpreadsheetApp.getActive().getSheetByName(nm);
      const ids = (body.ids || []).map(String);
      const lastRow = shd.getLastRow();
      let deleted = 0;
      if (lastRow >= 3) {
        const idv = shd.getRange(3, 1, lastRow - 2, 1).getDisplayValues();
        for (let i = idv.length - 1; i >= 0; i--) {   // bottom-up so row numbers stay valid
          if (ids.indexOf(String(idv[i][0])) >= 0) { shd.deleteRow(i + 3); deleted++; }
        }
      }
      return out_({ ok: true, deleted: deleted });
    }

    if (body.action === 'syncForm') {
      return out_(Object.assign({ ok: true }, syncForm_()));
    }

    if (body.action === 'batch') {
      // many row updates in a single request (one lock, one round trip)
      const results = body.ops.map(function (op) {
        const nm = tableName_(op.table);
        const df = SCHEMA[nm];
        const shh = SpreadsheetApp.getActive().getSheetByName(nm);
        const rw = findRow_(shh, op.id);
        if (rw < 0) return false;
        const cur = shh.getRange(rw, 1, 1, df.cols.length).getDisplayValues()[0];
        const patch = Object.assign({}, op.data);
        delete patch.id;
        shh.getRange(rw, 1, 1, df.cols.length).setValues([toRow_(df, patch, cur)]);
        return true;
      });
      return out_({ ok: true, results: results });
    }

    const name = tableName_(body.table);
    const def = SCHEMA[name];
    const sh = SpreadsheetApp.getActive().getSheetByName(name);
    const now = new Date().toISOString();

    if (body.action === 'insert' || body.action === 'bulkInsert') {
      const recs = body.action === 'insert' ? [body.data] : body.data;
      const created = recs.map(function (rec) {
        rec = Object.assign({}, rec);
        if (!rec.id) rec.id = newId_();
        if (def.cols.indexOf('created_at') >= 0) rec.created_at = now;
        return rec;
      });
      const start = Math.max(sh.getLastRow(), 2) + 1;
      sh.getRange(start, 1, created.length, def.cols.length)
        .setNumberFormat('@')
        .setValues(created.map(function (r) { return toRow_(def, r); }));
      return out_({ ok: true, data: body.action === 'insert' ? created[0] : created });
    }

    const row = findRow_(sh, body.id);
    if (row < 0) return out_({ ok: false, error: 'not found' });

    if (body.action === 'update') {
      const existing = sh.getRange(row, 1, 1, def.cols.length).getDisplayValues()[0];
      const patch = Object.assign({}, body.data); delete patch.id;
      sh.getRange(row, 1, 1, def.cols.length).setValues([toRow_(def, patch, existing)]);
      return out_({ ok: true });
    }
    if (body.action === 'delete') {
      sh.deleteRow(row);
      return out_({ ok: true });
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ============ Customer questionnaire (Google Form) -> Tenants ============
// The form's response sheet is the master list of every customer, old and new.
// Rules: match people by name; add new people; for people already in Tenants only fill EMPTY cells,
// so dates and anything typed by hand are never overwritten. The latest response per room is "Active",
// earlier ones are "Past".
const FORM_SHEET_ID = '1FofsFHPRNCSMybFGesAOSQzCE4eOTXbi0j0E-DZzRKQ';
const FORM_GID = 557988720;
const FORM_FILL_FIELDS = ['nickname', 'dob', 'phone', 'social_contact', 'age', 'gender', 'occupation', 'workplace', 'income', 'province'];

function normName_(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// "56/853", "56 / 835", "56842", "836" -> "56/853", "56/835", "56/842", "56/836"
function roomLabel_(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  let d = s.replace(/\D/g, '');
  if (d.length >= 5 && d.indexOf('56') === 0) d = d.slice(2);
  if (d.length >= 3 && /^[\d\s\/\-]+$/.test(s)) return '56/' + d;
  return s;
}

function phone_(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 9 && d.charAt(0) !== '0') d = '0' + d;   // Sheets drops the leading zero of numbers
  return d;
}

// digits of a room number without the building prefix: "56/853", "56 / 853", "56853", "853" -> "853"
function roomKey_(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length >= 5 && d.indexOf('56') === 0) d = d.slice(2);
  return d;
}

function isBlank_(v) {
  const s = String(v == null ? '' : v).trim();
  return s === '' || s === '-';
}

function syncForm_() {
  const src = SpreadsheetApp.openById(FORM_SHEET_ID);
  let sheet = null;
  src.getSheets().forEach(function (sh) { if (sh.getSheetId() === FORM_GID) sheet = sh; });
  if (!sheet) sheet = src.getSheets()[0];

  const vals = sheet.getDataRange().getDisplayValues();
  const allRows = vals.slice(1).filter(function (r) { return String(r[2] || '').trim(); });

  // The questionnaire also covers rooms owned by other people. Only customers of the rooms listed in
  // the Rooms tab (the owner's own rooms) are imported.
  const owned = {};
  readTable_('Rooms').forEach(function (r) {
    const k = roomKey_(r.name);
    if (k.length >= 3) owned[k] = true;
  });

  // "latest answer per room" is judged on every answer, before filtering
  const latestIdxByRoom = {};
  allRows.forEach(function (r, i) { const k = roomKey_(r[1]); if (k) latestIdxByRoom[k] = i; });
  const isLatestForRoom = function (row) { return latestIdxByRoom[roomKey_(row[1])] === allRows.indexOf(row); };

  const rows = allRows.filter(function (r) { return owned[roomKey_(r[1])]; });
  const lastByName = {};
  rows.forEach(function (r, i) { lastByName[normName_(r[2])] = i; });

  const existing = {};
  readTable_('Tenants').forEach(function (t) { existing[normName_(t.name)] = t; });

  const def = SCHEMA.Tenants;
  const tsh = SpreadsheetApp.getActive().getSheetByName('Tenants');
  const inserts = [];
  const updates = [];

  Object.keys(lastByName).sort(function (a, b) { return lastByName[a] - lastByName[b]; }).forEach(function (key) {
    const i = lastByName[key];
    const r = rows[i];
    const rec = {
      name: String(r[2]).trim(), nickname: r[3], dob: r[4], phone: phone_(r[5]), social_contact: r[6],
      age: r[7], gender: r[8], occupation: r[9], workplace: r[10], income: r[14], province: r[15],
      room: roomLabel_(r[1]), form_ts: r[0],
    };
    const cur = existing[key];
    if (!cur) {
      rec.status = isLatestForRoom(r) ? 'Active' : 'Past';
      rec.email = '-';
      inserts.push(rec);
      return;
    }
    const patch = {};
    FORM_FILL_FIELDS.forEach(function (f) {
      if (isBlank_(cur[f]) && !isBlank_(rec[f])) patch[f] = rec[f];
    });
    if (isBlank_(cur.room) && rec.room && isBlank_(cur.move_out_date)) patch.room = rec.room;
    if (isBlank_(cur.form_ts)) patch.form_ts = rec.form_ts;
    if (Object.keys(patch).length) updates.push({ id: cur.id, patch: patch });
  });

  const now = new Date().toISOString();
  if (inserts.length) {
    const base = Date.now();
    const created = inserts.map(function (rec, n) {
      const row = Object.assign({}, rec);
      row.id = String(base) + ('00' + n).slice(-3) + Math.floor(Math.random() * 10);
      row.created_at = now;
      return toRow_(def, row);
    });
    const start = Math.max(tsh.getLastRow(), 2) + 1;
    tsh.getRange(start, 1, created.length, def.cols.length).setNumberFormat('@').setValues(created);
  }
  updates.forEach(function (u) {
    const rw = findRow_(tsh, u.id);
    if (rw < 0) return;
    const cur = tsh.getRange(rw, 1, 1, def.cols.length).getDisplayValues()[0];
    tsh.getRange(rw, 1, 1, def.cols.length).setValues([toRow_(def, u.patch, cur)]);
  });

  return { added: inserts.length, updated: updates.length, total: rows.length, skippedOtherRooms: allRows.length - rows.length };
}
