// Relationships between sheets. Everything is linked by human-readable NAME so the Google Sheet stays easy to edit:
//   Rooms.tenant        = tenant's name
//   Tenants.room        = room's name   (older rows may hold the room id)
//   Transactions.room   = room's name
// This file finds those links, reports where they disagree and proposes the fixes.

export const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
export const isBlank = (v) => !String(v ?? "").trim() || String(v).trim() === "-";

const numericLike = (v) => /^[\d\s/-]+$/.test(String(v ?? "").trim());
// "56/853", "56 / 853", "56853" and "853" all describe the same room
export function roomKey(v) {
  let d = String(v ?? "").replace(/\D/g, "");
  if (d.length >= 5 && d.startsWith("56")) d = d.slice(2);
  return d;
}

export function findRoom(rooms, ref) {
  if (isBlank(ref)) return null;
  const s = String(ref).trim();
  const exact =
    (rooms || []).find((r) => r.id === s) ||
    (rooms || []).find((r) => r.name === s) ||
    (rooms || []).find((r) => norm(r.name) === norm(s));
  if (exact) return exact;
  if (numericLike(s) && roomKey(s).length >= 3) {
    const k = roomKey(s);
    const hits = (rooms || []).filter((r) => numericLike(r.name) && roomKey(r.name) === k);
    if (hits.length === 1) return hits[0];
  }
  return null;
}

export function findTenant(tenants, name) {
  if (isBlank(name)) return null;
  return (
    (tenants || []).find((t) => t.name === name) ||
    (tenants || []).find((t) => norm(t.name) === norm(name)) ||
    null
  );
}

const roomLabel = (r) => r.name || `ห้อง ${r.id}`;

/**
 * Returns [{ id, level: "fix" | "warn", title, detail, ops?: [{table, id, data}] }].
 * "fix" issues carry ops that make the data agree without guessing; "warn" ones need a human decision.
 */
export function healthCheck({ rooms = [], tenants = [], transactions = [] }) {
  const issues = [];
  const add = (i) => issues.push({ id: `${i.kind}:${issues.length}`, ...i });

  // --- duplicates -------------------------------------------------------------------------
  const group = (list, keyFn) => {
    const m = new Map();
    list.forEach((x) => {
      const k = keyFn(x);
      if (!k) return;
      m.set(k, [...(m.get(k) || []), x]);
    });
    return [...m.values()].filter((g) => g.length > 1);
  };
  group(rooms, (r) => norm(r.name)).forEach((g) =>
    add({ kind: "dup-room", level: "warn", title: `ชื่อห้องซ้ำ: ${g[0].name}`, detail: `มี ${g.length} แถวในแท็บ Rooms ลบหรือเปลี่ยนชื่อแถวที่ซ้ำ` })
  );
  group(tenants, (t) => norm(t.name)).forEach((g) =>
    add({
      kind: "dup-tenant",
      level: "warn",
      title: `ผู้เช่าชื่อซ้ำ: ${g[0].name}`,
      detail: `มี ${g.length} แถวในแท็บ Tenants (${g.map((t) => t.phone || "ไม่มีเบอร์").join(", ")}) เก็บแถวที่ถูกต้องไว้แถวเดียว`,
    })
  );

  // --- rooms -> tenants -------------------------------------------------------------------
  rooms.forEach((room) => {
    const hasTenant = !isBlank(room.tenant);
    if (hasTenant) {
      const tenant = findTenant(tenants, room.tenant);
      if (!tenant) {
        add({
          kind: "room-unknown-tenant",
          level: "warn",
          title: `${roomLabel(room)}: ไม่พบผู้เช่า "${room.tenant}" ในแท็บผู้เช่า`,
          detail: "ชื่อในแท็บ Rooms ต้องตรงกับแท็บ Tenants (สะกดผิด หรือยังไม่ได้เพิ่มผู้เช่า)",
        });
      } else {
        const linked = findRoom(rooms, tenant.room);
        const sameRoom = linked && linked.id === room.id;
        const ops = [];
        if (!sameRoom || tenant.room !== room.name) ops.push({ table: "tenants", id: tenant.id, data: { room: room.name } });
        if (tenant.status !== "Active") ops.push({ table: "tenants", id: tenant.id, data: { status: "Active" } });
        if (ops.length) {
          add({
            kind: "link-tenant",
            level: "fix",
            title: `${roomLabel(room)} ↔ ${tenant.name}: ข้อมูลฝั่งผู้เช่าไม่ตรง`,
            detail: `ผู้เช่าบันทึกห้องเป็น "${tenant.room || "-"}" สถานะ "${tenant.status || "-"}" จะแก้เป็น "${room.name}" / Active`,
            ops: [{ table: "tenants", id: tenant.id, data: { room: room.name, status: "Active" } }],
          });
        }
      }
      if (room.status !== "occupied") {
        add({
          kind: "room-status",
          level: "fix",
          title: `${roomLabel(room)}: มีผู้เช่าแต่สถานะเป็น "${room.status}"`,
          detail: 'จะแก้สถานะห้องเป็น "occupied"',
          ops: [{ table: "rooms", id: room.id, data: { status: "occupied" } }],
        });
      }
    } else if (room.status === "occupied") {
      add({
        kind: "room-no-tenant",
        level: "warn",
        title: `${roomLabel(room)}: สถานะ occupied แต่ไม่มีชื่อผู้เช่า`,
        detail: "ใส่ชื่อผู้เช่าในแท็บ Rooms หรือเปลี่ยนสถานะเป็น available",
      });
    }
  });

  // --- tenants -> rooms -------------------------------------------------------------------
  const seenInRoom = new Map();
  rooms.forEach((r) => {
    if (!isBlank(r.tenant)) seenInRoom.set(norm(r.tenant), [...(seenInRoom.get(norm(r.tenant)) || []), r]);
  });
  seenInRoom.forEach((rs, key) => {
    if (rs.length > 1) {
      add({ kind: "tenant-two-rooms", level: "warn", title: `ผู้เช่าอยู่ ${rs.length} ห้องพร้อมกัน: ${rs[0].tenant}`, detail: rs.map(roomLabel).join(", ") });
    }
  });

  const missingRooms = new Map(); // label -> tenant that currently lives there
  tenants.forEach((tenant) => {
    if (isBlank(tenant.room)) return;
    const room = findRoom(rooms, tenant.room);
    if (!room) {
      if (tenant.status === "Active") missingRooms.set(String(tenant.room).trim(), tenant);
      return;
    }
    if (tenant.status === "Active") {
      if (isBlank(room.tenant)) {
        add({
          kind: "link-room",
          level: "fix",
          title: `${tenant.name} → ${roomLabel(room)}: ห้องยังไม่ระบุผู้เช่า`,
          detail: 'จะใส่ชื่อผู้เช่าให้ห้อง และตั้งสถานะเป็น "occupied"',
          ops: [{ table: "rooms", id: room.id, data: { tenant: tenant.name, status: "occupied" } }],
        });
      } else if (norm(room.tenant) !== norm(tenant.name)) {
        add({
          kind: "room-conflict",
          level: "warn",
          title: `ห้องชน: ${roomLabel(room)}`,
          detail: `${tenant.name} ระบุว่าอยู่ห้องนี้ แต่แท็บ Rooms เป็น "${room.tenant}"`,
        });
      }
    } else if (norm(room.tenant) === norm(tenant.name)) {
      add({
        kind: "past-still-in-room",
        level: "warn",
        title: `${tenant.name} เป็นอดีตผู้เช่า แต่ยังอยู่ในห้อง ${roomLabel(room)}`,
        detail: 'ตั้งห้องเป็น available และเคลียร์ผู้เช่า หรือเปลี่ยนสถานะผู้เช่าเป็น Active',
      });
    }
  });
  if (missingRooms.size) {
    const list = [...missingRooms.entries()];
    add({
      kind: "create-rooms",
      level: "fix",
      title: `ยังไม่มีห้องในระบบ ${list.length} ห้อง (มีผู้เช่าอยู่ตามแบบสอบถาม)`,
      detail: `จะสร้างห้องให้และใส่ผู้เช่าให้เลย: ${list.map(([label]) => label).slice(0, 12).join(", ")}${list.length > 12 ? " ..." : ""} (ค่าเช่า/ประเภท กรอกทีหลังได้)`,
      ops: list.map(([label, tenant]) => ({
        insert: true,
        table: "rooms",
        data: { name: label, type: "", price: "0", status: "occupied", tenant: tenant.name },
      })),
    });
  }

  // contract dates are filled in later, after the contract is signed: list who is still missing them
  const noDates = tenants.filter((t) => t.status === "Active" && (isBlank(t.start_date) || isBlank(t.contractEnd)));
  if (noDates.length) {
    add({
      kind: "todo-dates",
      level: "todo",
      title: `ยังไม่ได้กรอกวันเข้าพัก/วันหมดสัญญา: ${noDates.length} คน`,
      detail: `${noDates.map((t) => t.name).slice(0, 15).join(", ")}${noDates.length > 15 ? " ..." : ""} (กรอกในหน้า "ผู้เช่า" หรือใน Sheet)`,
    });
  }

  // --- transactions -> rooms --------------------------------------------------------------
  const badTx = new Map();
  transactions.forEach((t) => {
    if (isBlank(t.room)) return;
    if (rooms.some((r) => r.name === t.room)) return;
    const byAlias = findRoom(rooms, t.room);
    if (byAlias) {
      add({
        kind: "tx-room-alias",
        level: "fix",
        title: `รายการเงิน ${t.date || ""} ${t.description || ""}: ห้อง "${t.room}" → ${byAlias.name}`,
        detail: "จะแก้ชื่อห้องให้ตรงกับแท็บ Rooms",
        ops: [{ table: "transactions", id: t.id, data: { room: byAlias.name } }],
      });
    } else {
      badTx.set(t.room, (badTx.get(t.room) || 0) + 1);
    }
  });
  badTx.forEach((n, name) =>
    add({ kind: "tx-unknown-room", level: "warn", title: `รายการเงิน ${n} รายการอ้างห้อง "${name}" ที่ไม่มีแล้ว`, detail: "แก้ชื่อห้องในแท็บ Transactions หรือเว้นว่างถ้าเป็นค่าส่วนกลาง" })
  );

  return issues;
}

// merge ops that touch the same row so each row is written once
export function mergeOps(ops) {
  const map = new Map();
  ops.forEach((o) => {
    const k = `${o.table}:${o.id}`;
    map.set(k, { ...(map.get(k) || { table: o.table, id: o.id, data: {} }), data: { ...(map.get(k)?.data || {}), ...o.data } });
  });
  return [...map.values()];
}
