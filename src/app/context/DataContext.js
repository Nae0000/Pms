"use client";
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as api from '../../lib/sheetsApi';
import { findRoom, findTenant, norm, isBlank, mergeOps } from '../../lib/links';

const DataContext = createContext();

// Google Sheets CSV URL for form responses
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1FofsFHPRNCSMybFGesAOSQzCE4eOTXbi0j0E-DZzRKQ/export?format=csv";

// ============ CSV Parser ============
function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(current.trim());
        current = '';
      } else if (char === '\r' && next === '\n') {
        row.push(current.trim());
        if (row.length > 1) rows.push(row);
        row = [];
        current = '';
        i++; // skip \n
      } else if (char === '\n') {
        row.push(current.trim());
        if (row.length > 1) rows.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }
  }
  // last row
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.length > 1) rows.push(row);
  }
  return rows;
}

// ============ Mappers ============
function mapTenantFromDB(t) {
  return {
    ...t,
    socialContact: t.social_contact || '',
    contractEnd: t.contract_end || ''
  };
}

function mapTenantToDB(t) {
  const { socialContact, contractEnd, created_at, timestamp, computedRoom, computedStatus, ...rest } = t;
  return {
    ...rest,
    social_contact: socialContact || '',
    contract_end: contractEnd || ''
  };
}

// ============ Provider ============
const errMsg = (e) => (e && e.message) || String(e);
const CACHE_KEY = 'pms-cache-v1';

export const DataProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loanPayments, setLoanPayments] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState(api.isConfigured ? "" : "NOT_CONFIGURED");
  const [saveError, setSaveError] = useState("");
  const [pending, setPending] = useState(0);

  const lastFetch = useRef(0);
  const writing = useRef(0);

  const fetchData = async (silent = false) => {
    if (!api.isConfigured) {
      setIsInitialLoading(false);
      return;
    }
    if (!silent) setIsInitialLoading(true);
    setIsRefreshing(true);
    try {
      const data = await api.fetchAll();
      setRooms((data.rooms || []).map(r => ({ ...r, status: r.status || 'available', tenant: r.tenant || '-' })));
      setTenants((data.tenants || []).map(mapTenantFromDB));
      setTransactions(
        (data.transactions || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
      );
      setLoanPayments(data.loan_payments || []);
      setLoadError("");
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          rooms: data.rooms || [], tenants: data.tenants || [], transactions: data.transactions || [], loan_payments: data.loan_payments || [],
        }));
      } catch (e) { /* storage full or blocked: caching is optional */ }
    } catch (err) {
      console.error("Error loading data:", err);
      setLoadError(errMsg(err));
    }
    lastFetch.current = Date.now();
    setIsRefreshing(false);
    setIsInitialLoading(false);
  };


  // New customers fill in the questionnaire; the script copies them into Tenants. Runs when the app
  // opens (at most every 30 min) or on demand. Returns { added, updated, total } or null.
  const SYNC_KEY = 'pms-form-sync-at';
  const syncFromForm = async (manual = false) => {
    if (!api.isConfigured) return null;
    try {
      if (!manual && Date.now() - Number(localStorage.getItem(SYNC_KEY) || 0) < 30 * 60 * 1000) return null;
    } catch (e) { /* storage blocked: just sync */ }
    setSyncing(true);
    try {
      const result = await api.syncForm();
      try { localStorage.setItem(SYNC_KEY, String(Date.now())); } catch (e) { /* ignore */ }
      if (result.added || result.updated) await fetchData(true);
      return result;
    } catch (err) {
      console.error('Questionnaire sync failed:', err);
      if (manual) setSaveError(`ดึงข้อมูลจากแบบสอบถามไม่สำเร็จ: ${errMsg(err)}`);
      return null;
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && cached.rooms) {
        setRooms(cached.rooms);
        setTenants(cached.tenants || []);
        setTransactions(cached.transactions || []);
        setLoanPayments(cached.loan_payments || []);
        setIsInitialLoading(false);
      }
    } catch (e) { /* storage unavailable or corrupt: just load normally */ }
    fetchData(Boolean(localStorage.getItem(CACHE_KEY))).then(() => syncFromForm(false));
  }, []);

  // Pick up edits made directly in the Google Sheet when the user comes back to the app.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && !writing.current && Date.now() - lastFetch.current > 20000) {
        fetchData(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Run a write; on failure surface it and reload so the UI matches the sheet.
  const run = async (fn) => {
    setPending(n => n + 1);
    writing.current += 1;
    setSaveError("");
    try {
      return await fn();
    } catch (err) {
      console.error("Save failed:", err);
      setSaveError(errMsg(err));
      fetchData();
      return null;
    } finally {
      writing.current -= 1;
      setPending(n => n - 1);
    }
  };

  // ============ Linked writes ============
  // Rooms.tenant, Tenants.room and Transactions.room all refer to each other by name, so every
  // write below also updates the other side. `ops` are applied to local state at once (optimistic)
  // and then sent to the sheet one by one.
  // Tenants use camelCase locally; only convert the keys that are actually present so a link-only
  // patch (e.g. { room }) can never blank out the other columns.
  const stripLocal = (table, data) => {
    if (table !== 'tenants') return data;
    const { socialContact, contractEnd, created_at, timestamp, computedRoom, computedStatus, ...rest } = data;
    if (socialContact !== undefined) rest.social_contact = socialContact || '';
    if (contractEnd !== undefined) rest.contract_end = contractEnd || '';
    return rest;
  };

  const commit = async (ops, extra) => {
    const list = mergeOps(ops);
    if (!list.length && !extra) return null;
    list.forEach(({ table, id, data }) => {
      const upd = (prev) => prev.map(r => (r.id === id ? { ...r, ...data } : r));
      if (table === 'rooms') setRooms(upd);
      else if (table === 'tenants') setTenants(upd);
      else if (table === 'transactions') setTransactions(upd);
      else if (table === 'loan_payments') setLoanPayments(upd);
    });
    return run(async () => {
      const payload = list.map(({ table, id, data }) => ({ table, id, data: stripLocal(table, data) }));
      if (payload.length) {
        let done = false;
        try {
          done = await api.batchUpdate(payload);
        } catch (err) {
          // an older deployment of the script has no batch action: fall back to one request per row
          if (!/unknown/i.test(String(err && err.message))) throw err;
          for (const op of payload) await api.updateRow(op.table, op.id, op.data);
          done = true;
        }
        if (!done) throw new Error("ไม่พบแถวที่ต้องแก้ไขใน Sheet");
      }
      return extra ? extra() : true;
    });
  };

  const fail = (message) => {
    setSaveError(message);
    return null;
  };

  const freeRoomOps = (room) => [{ table: 'rooms', id: room.id, data: { tenant: '-', status: 'available' } }];

  // ---- rooms ----
  const updateRoom = async (id, updatedData) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const next = { ...room, ...updatedData };

    if (updatedData.name && updatedData.name !== room.name &&
        rooms.some(r => r.id !== id && norm(r.name) === norm(updatedData.name))) {
      return fail(`มีห้องชื่อ "${updatedData.name}" อยู่แล้ว`);
    }

    const ops = [{ table: 'rooms', id, data: updatedData }];
    const oldT = isBlank(room.tenant) ? '' : room.tenant;
    const newT = isBlank(next.tenant) ? '' : next.tenant;

    if (oldT !== newT) {
      const oldTenant = findTenant(tenants, oldT);
      if (oldTenant && findRoom(rooms, oldTenant.room)?.id === id) {
        ops.push({ table: 'tenants', id: oldTenant.id, data: { room: '-' } });
      }
      const newTenant = findTenant(tenants, newT);
      if (newTenant) {
        ops.push({ table: 'tenants', id: newTenant.id, data: { room: next.name, status: 'Active' } });
        // a person can only live in one room: free the one they were in
        rooms.filter(r => r.id !== id && !isBlank(r.tenant) && norm(r.tenant) === norm(newT))
          .forEach(r => ops.push(...freeRoomOps(r)));
      }
    } else if (newT && updatedData.name && updatedData.name !== room.name) {
      const t = findTenant(tenants, newT);
      if (t) ops.push({ table: 'tenants', id: t.id, data: { room: updatedData.name } });
    }

    // renaming a room keeps every reference to it intact
    if (updatedData.name && updatedData.name !== room.name) {
      tenants.filter(t => !isBlank(t.room) && (t.room === room.name || t.room === room.id))
        .forEach(t => ops.push({ table: 'tenants', id: t.id, data: { room: updatedData.name } }));
      transactions.filter(t => t.room === room.name)
        .forEach(t => ops.push({ table: 'transactions', id: t.id, data: { room: updatedData.name } }));
      loanPayments.filter(p => p.room === room.name)
        .forEach(p => ops.push({ table: 'loan_payments', id: p.id, data: { room: updatedData.name } }));
    }
    await commit(ops);
  };

  const addRoom = async (newRoomData) => {
    if (rooms.some(r => norm(r.name) === norm(newRoomData.name))) {
      return fail(`มีห้องชื่อ "${newRoomData.name}" อยู่แล้ว`);
    }
    const row = await run(() => api.insertRow('rooms', newRoomData));
    if (!row) return;
    setRooms(prev => [...prev, row]);
    const tenant = findTenant(tenants, row.tenant);
    if (tenant) {
      const ops = [{ table: 'tenants', id: tenant.id, data: { room: row.name, status: 'Active' } }];
      rooms.filter(r => !isBlank(r.tenant) && norm(r.tenant) === norm(tenant.name)).forEach(r => ops.push(...freeRoomOps(r)));
      await commit(ops);
    }
  };

  // ---- tenants ----
  const updateTenant = async (id, updatedData) => {
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;
    const next = { ...tenant, ...updatedData };

    if (updatedData.name && norm(updatedData.name) !== norm(tenant.name) &&
        tenants.some(t => t.id !== id && norm(t.name) === norm(updatedData.name))) {
      return fail(`มีผู้เช่าชื่อ "${updatedData.name}" อยู่แล้ว`);
    }

    const wantsRoom = next.status !== 'Past' ? findRoom(rooms, next.room) : null;
    if (wantsRoom && !isBlank(wantsRoom.tenant) && norm(wantsRoom.tenant) !== norm(tenant.name)) {
      return fail(`ห้อง ${wantsRoom.name} มีผู้เช่า "${wantsRoom.tenant}" อยู่แล้ว`);
    }

    const data = { ...updatedData };
    if ('room' in data) data.room = wantsRoom ? wantsRoom.name : (isBlank(data.room) ? '-' : data.room);
    const ops = [{ table: 'tenants', id, data }];

    // leave any room this person was recorded in, unless it is the one they keep
    rooms.filter(r => !isBlank(r.tenant) && norm(r.tenant) === norm(tenant.name) && r.id !== wantsRoom?.id)
      .forEach(r => ops.push(...freeRoomOps(r)));
    if (wantsRoom) {
      ops.push({ table: 'rooms', id: wantsRoom.id, data: { tenant: next.name, status: 'occupied' } });
    }
    await commit(ops);
  };

  const addTenant = async (newTenantData) => {
    const { id: _oldId, ...rest } = newTenantData;
    if (tenants.some(t => norm(t.name) === norm(rest.name))) {
      return fail(`มีผู้เช่าชื่อ "${rest.name}" อยู่แล้ว`);
    }
    const wantsRoom = rest.status !== 'Past' ? findRoom(rooms, rest.room) : null;
    if (wantsRoom && !isBlank(wantsRoom.tenant)) {
      return fail(`ห้อง ${wantsRoom.name} มีผู้เช่า "${wantsRoom.tenant}" อยู่แล้ว`);
    }
    const toSave = { ...rest, room: wantsRoom ? wantsRoom.name : (isBlank(rest.room) ? '-' : rest.room) };
    const row = await run(() => api.insertRow('tenants', mapTenantToDB(toSave)));
    if (!row) return;
    setTenants(prev => [...prev, mapTenantFromDB(row)]);
    if (wantsRoom) await commit([{ table: 'rooms', id: wantsRoom.id, data: { tenant: row.name, status: 'occupied' } }]);
  };

  // Returns { added, skipped } so the UI can say how many were already in the sheet.
  const addMultipleTenants = async (tenantsArray) => {
    const seen = new Set(tenants.map(t => `${norm(t.name)}|${String(t.phone || '').replace(/\D/g, '')}`));
    const names = new Set(tenants.map(t => norm(t.name)));
    const fresh = [];
    let skipped = 0;
    tenantsArray.forEach(t => {
      const key = `${norm(t.name)}|${String(t.phone || '').replace(/\D/g, '')}`;
      if (seen.has(key) || names.has(norm(t.name))) { skipped += 1; return; }
      seen.add(key); names.add(norm(t.name));
      const room = findRoom(rooms, t.room);
      const { id: _oldId, ...rest } = t;
      fresh.push({ ...rest, room: room ? room.name : (isBlank(t.room) ? '-' : t.room) });
    });
    if (!fresh.length) return { added: 0, skipped };
    const rows = await run(() => api.insertRows('tenants', fresh.map(mapTenantToDB)));
    if (!rows) return { added: 0, skipped };
    setTenants(prev => [...prev, ...rows.map(mapTenantFromDB)]);

    const ops = [];
    const taken = new Set(rooms.filter(r => !isBlank(r.tenant)).map(r => r.id));
    rows.forEach(r => {
      const room = findRoom(rooms, r.room);
      if (room && !taken.has(room.id) && r.status !== 'Past') {
        taken.add(room.id);
        ops.push({ table: 'rooms', id: room.id, data: { tenant: r.name, status: 'occupied' } });
      }
    });
    if (ops.length) await commit(ops);
    return { added: rows.length, skipped };
  };

  // ---- month-by-month instalment table ----
  const addLoanPayment = async (row) => {
    const saved = await run(() => api.insertRow('loan_payments', row));
    if (saved) setLoanPayments(prev => [...prev, saved]);
  };
  // Pasted from a spreadsheet: one request. Not retried automatically (a retry could add the rows twice).
  const addLoanPayments = async (rows) => {
    const saved = await run(() => api.insertRows('loan_payments', rows));
    if (saved) setLoanPayments(prev => [...prev, ...saved]);
    return saved ? saved.length : 0;
  };
  const updateLoanPayment = async (id, data) => { await commit([{ table: 'loan_payments', id, data }]); };
  const deleteLoanPayment = async (id) => {
    setLoanPayments(prev => prev.filter(p => p.id !== id));
    await commit([], () => api.deleteRow('loan_payments', id));
  };

  // Deleting a room clears the room field of anyone recorded in it (their own data is kept).
  const deleteRoom = async (id) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    setRooms(prev => prev.filter(r => r.id !== id));
    const ops = tenants
      .filter(t => !isBlank(t.room) && findRoom([room], t.room)?.id === id)
      .map(t => ({ table: 'tenants', id: t.id, data: { room: '-' } }));
    await commit(ops, () => api.deleteRow('rooms', id));
  };

  const deleteTenant = async (id) => {
    const tenant = tenants.find(t => t.id === id);
    setTenants(prev => prev.filter(t => t.id !== id));
    const ops = tenant
      ? rooms.filter(r => !isBlank(r.tenant) && norm(r.tenant) === norm(tenant.name)).flatMap(freeRoomOps)
      : [];
    await commit(ops, () => api.deleteRow('tenants', id));
  };

  // Apply the fixes proposed by healthCheck()
  const applyFixes = async (ops) => {
    const inserts = ops.filter(o => o.insert);
    if (inserts.length) {
      const rows = await run(() => api.insertRows('rooms', inserts.map(o => o.data)));
      if (rows) setRooms(prev => [...prev, ...rows]);
    }
    await commit(ops.filter(o => !o.insert));
  };

  // Import tenants from Google Sheets (form responses)
  const importFromGoogleSheets = async () => {
    setImportLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL);
      if (!response.ok) throw new Error("Failed to fetch data");
      const text = await response.text();
      const rows = parseCSV(text);

      const imported = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 3) continue;

        imported.push({
          id: Date.now() + i, // Temp ID for React key/selection before insert
          timestamp: r[0] || "",
          room: r[1] || "-",
          name: r[2] || "",
          nickname: r[3] || "",
          dob: r[4] || "",
          phone: r[5] || "",
          socialContact: r[6] || "",
          age: r[7] || "",
          gender: r[8] || "",
          occupation: r[9] || "",
          workplace: r[10] || "",
          email: "-",
          status: "Active",
          contractEnd: "",
          income: r[14] || "",
          province: r[15] || "",
        });
      }

      setImportLoading(false);
      return imported;
    } catch (err) {
      console.error("Import error:", err);
      setImportLoading(false);
      return null;
    }
  };

  // ============ Transaction CRUD ============
  const addTransaction = async (txData) => {
    const row = await run(() => api.insertRow('transactions', txData));
    if (row) setTransactions(prev => [row, ...prev]);
  };

  const updateTransaction = async (id, updatedData) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    await run(() => api.updateRow('transactions', id, updatedData));
  };

  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await run(() => api.deleteRow('transactions', id));
  };

  return (
    <DataContext.Provider value={{ 
      rooms, setRooms, updateRoom, addRoom,
      tenants, setTenants, updateTenant, addTenant, addMultipleTenants, deleteTenant,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      importFromGoogleSheets, importLoading, isInitialLoading,
      loadError, saveError, setSaveError, saving: pending > 0, refresh: () => fetchData(), applyFixes, deleteRoom, loanPayments, addLoanPayment, addLoanPayments, updateLoanPayment, deleteLoanPayment, isRefreshing, syncing, syncFromForm
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
