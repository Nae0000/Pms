# เชื่อมแอปกับ Google Sheet (ทำครั้งเดียว ~5 นาที)

Google Sheet: https://docs.google.com/spreadsheets/d/10Hv9bbHymylP5WU-2Zd-kQ8aCKCUf9KcT10v0XTpClg/edit
(เจ้าของ: nae.nitis9999@gmail.com)

## 1) ติดตั้งสคริปต์
1. เปิด Sheet > **Extensions > Apps Script**
2. ลบโค้ดเดิม วางเนื้อหา `Code.gs` ทั้งหมด
3. แก้ `const API_KEY = 'CHANGE_ME'` เป็นรหัสที่คุณตั้งเอง (ยาวๆ สุ่มๆ)
4. เลือกฟังก์ชัน **setup** > กด **Run** > อนุญาตสิทธิ์
   → จะสร้างแท็บ `Summary`, `Rooms`, `Tenants`, `Transactions` พร้อมหัวตาราง ตัวกรอง dropdown สีสถานะ และสูตรสรุป

## 2) Deploy เป็น API
**Deploy > New deployment > Web app**
- Execute as: **Me**
- Who has access: **Anyone**

คัดลอก URL (ลงท้าย `/exec`)

## 3) ตั้งค่าบน GitHub (repo Nae0000/Pms > Settings > Secrets and variables > Actions)
| ประเภท | ชื่อ | ค่า |
|---|---|---|
| Variable | `SHEETS_API_URL` | URL `/exec` ข้อ 2 |
| Secret | `SHEETS_API_KEY` | รหัสเดียวกับ `API_KEY` |
| Variable | `SHEET_URL` | ลิงก์ Google Sheet (ไว้ให้ปุ่มเปิด Sheet) |

จากนั้น push หรือรัน workflow **Deploy Next.js site to Pages** ใหม่

## 4) ใช้บนมือถือ
เปิด `https://nae0000.github.io/Pms/` แล้ว
- iPhone (Safari): แชร์ > เพิ่มไปที่หน้าจอโฮม
- Android (Chrome): เมนู ⋮ > ติดตั้งแอป

## รันในเครื่อง
สร้าง `.env.local`:
```
NEXT_PUBLIC_SHEETS_API_URL=...
NEXT_PUBLIC_SHEETS_API_KEY=...
NEXT_PUBLIC_SHEET_URL=...
```

## หมายเหตุ
- แถวที่ 1 ของแต่ละแท็บคือชื่อคอลัมน์ที่แอปใช้ **ห้ามแก้** (แถวที่ 2 เป็นป้ายภาษาไทย) แก้ข้อมูลในแถว 3 ลงไปได้ตรงๆ
- `API_KEY` ฝังอยู่ในเว็บ (เป็นเว็บ static) จึงเป็นแค่การกันคนสุ่มเข้าถึง ไม่ใช่ระบบล็อกอิน อย่าแชร์ URL เว็บให้คนที่ไม่ไว้ใจ
- ถ้าแก้โค้ด Apps Script ต้อง Deploy > Manage deployments > แก้เวอร์ชันใหม่ ถึงจะมีผล
