"use client";
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import * as api from '../../lib/sheetsApi';

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

export const DataProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
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
    try {
      const data = await api.fetchAll();
      setRooms((data.rooms || []).map(r => ({ ...r, status: r.status || 'available', tenant: r.tenant || '-' })));
      setTenants((data.tenants || []).map(mapTenantFromDB));
      setTransactions(
        (data.transactions || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
      );
      setLoadError("");
    } catch (err) {
      console.error("Error loading data:", err);
      if (!silent) setLoadError(errMsg(err));
    }
    lastFetch.current = Date.now();
    setIsInitialLoading(false);
  };

  useEffect(() => {
    fetchData();
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

  // ============ Rooms ============
  const updateRoom = async (id, updatedData) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    await run(() => api.updateRow('rooms', id, updatedData));
  };

  const addRoom = async (newRoomData) => {
    const row = await run(() => api.insertRow('rooms', newRoomData));
    if (row) setRooms(prev => [...prev, row]);
  };

  // ============ Tenants ============
  const updateTenant = async (id, updatedData) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    await run(() => api.updateRow('tenants', id, mapTenantToDB(updatedData)));
  };

  const addTenant = async (newTenantData) => {
    const { id: _oldId, ...rest } = newTenantData;
    const row = await run(() => api.insertRow('tenants', mapTenantToDB(rest)));
    if (row) setTenants(prev => [...prev, mapTenantFromDB(row)]);
  };

  const addMultipleTenants = async (tenantsArray) => {
    const dbDataArray = tenantsArray.map(t => {
      const { id: _oldId, ...rest } = t;
      return mapTenantToDB(rest);
    });
    const rows = await run(() => api.insertRows('tenants', dbDataArray));
    if (rows) setTenants(prev => [...prev, ...rows.map(mapTenantFromDB)]);
  };

  const deleteTenant = async (id) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    await run(() => api.deleteRow('tenants', id));
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
      loadError, saveError, setSaveError, saving: pending > 0, refresh: () => fetchData()
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
