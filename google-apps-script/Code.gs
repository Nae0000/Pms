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
           'deposit', 'floor', 'size', 'amenities', 'note', 'common_fee', 'common_times'],
    labels: ['รหัส', 'ชื่อห้อง', 'ประเภท', 'ค่าเช่า/เดือน', 'สถานะ', 'ผู้เช่า', 'รูป (ลิงก์รูป/Google Drive)',
             'เงินประกัน', 'ชั้น', 'ขนาด (ตร.ม.)', 'สิ่งอำนวยความสะดวก', 'หมายเหตุ',
             'ค่าส่วนกลาง/ครั้ง', 'จ่ายกี่ครั้ง/ปี (ว่าง=2)'],
    widths: [110, 220, 100, 110, 110, 180, 260, 100, 60, 90, 240, 220, 130, 130],
  },
  Tenants: {
    title: 'ผู้เช่า',
    cols: ['id', 'name', 'nickname', 'dob', 'age', 'gender', 'room', 'phone', 'email', 'social_contact',
           'occupation', 'workplace', 'status', 'start_date', 'contract_end', 'due_day', 'income', 'province', 'created_at'],
    labels: ['รหัส', 'ชื่อ-สกุล', 'ชื่อเล่น', 'วันเกิด', 'อายุ', 'เพศ', 'ห้อง', 'โทรศัพท์', 'อีเมล', 'ช่องทางติดต่อ',
             'อาชีพ', 'สถานที่ทำงาน', 'สถานะ', 'เริ่มสัญญา (yyyy-mm-dd)', 'สิ้นสุดสัญญา (yyyy-mm-dd)', 'วันครบกำหนดจ่าย (1-31)', 'รายได้', 'จังหวัด', 'สร้างเมื่อ'],
    widths: [110, 200, 90, 100, 60, 70, 110, 120, 180, 150, 140, 180, 90, 130, 130, 120, 100, 110, 150],
  },
  Transactions: {
    title: 'การเงิน',
    cols: ['id', 'date', 'description', 'category', 'type', 'expense_type', 'amount', 'status', 'room', 'created_at'],
    labels: ['รหัส', 'วันที่', 'รายละเอียด', 'หมวดหมู่', 'ประเภท', 'ชนิดค่าใช้จ่าย', 'จำนวนเงิน', 'สถานะ', 'ห้อง', 'สร้างเมื่อ'],
    widths: [110, 100, 260, 130, 90, 110, 110, 90, 110, 150],
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
  addValidation_(ss.getSheetByName('Tenants'), 'status', ['Active', 'Past']);
  addValidation_(ss.getSheetByName('Transactions'), 'type', ['income', 'expense']);
  addValidation_(ss.getSheetByName('Transactions'), 'status', ['Paid', 'Pending', 'Overdue']);
  addValidation_(ss.getSheetByName('Transactions'), 'expense_type', ['fixed', 'variable']);

  statusColors_(ss.getSheetByName('Rooms'), 'status', {
    available: '#d1fae5', occupied: '#fee2e2', reserved: '#dbeafe', maintenance: '#fef3c7',
  });
  statusColors_(ss.getSheetByName('Transactions'), 'status', {
    Paid: '#d1fae5', Pending: '#fef3c7', Overdue: '#fee2e2',
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
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
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
  });
}

function tableName_(t) {
  const m = { rooms: 'Rooms', tenants: 'Tenants', transactions: 'Transactions' };
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
