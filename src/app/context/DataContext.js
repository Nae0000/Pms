"use client";
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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

// ============ Default Data ============
const DEFAULT_ROOMS = [
  { id: "101", name: "A-1. AniYuki", type: "Standard", price: "5,000", status: "occupied", tenant: "Somchai S.", image: "" },
  { id: "102", name: "B-5. Guest House", type: "Standard", price: "5,000", status: "available", tenant: "-", image: "" },
  { id: "103", name: "B-6. TOMA HOUSE", type: "Deluxe", price: "7,500", status: "maintenance", tenant: "-", image: "" },
  { id: "104", name: "FRONTIER VILLAGE@1", type: "Standard", price: "5,000", status: "occupied", tenant: "Somsri M.", image: "" },
  { id: "105", name: "FRONTIER VILLAGE@2", type: "Standard", price: "5,000", status: "available", tenant: "-", image: "" },
  { id: "201", name: "HB-1. Miyata", type: "Suite", price: "12,000", status: "occupied", tenant: "Wichai T.", image: "" },
];

const DEFAULT_TENANTS = [
  { name: "Somchai Sripasert", nickname: "", dob: "", age: "", gender: "", room: "101", phone: "081-234-5678", email: "somchai@example.com", socialContact: "", occupation: "", workplace: "", status: "Active", contractEnd: "2026-12-31", income: "", province: "" },
  { name: "Somsri Maneerat", nickname: "", dob: "", age: "", gender: "", room: "104", phone: "089-876-5432", email: "somsri.m@example.com", socialContact: "", occupation: "", workplace: "", status: "Active", contractEnd: "2026-10-15", income: "", province: "" },
  { name: "Wichai Thongkam", nickname: "", dob: "", age: "", gender: "", room: "201", phone: "082-345-6789", email: "-", socialContact: "", occupation: "", workplace: "", status: "Active", contractEnd: "2027-01-20", income: "", province: "" },
  { name: "Amonrat Sukjai", nickname: "", dob: "", age: "", gender: "", room: "-", phone: "083-456-7890", email: "amonrat@example.com", socialContact: "", occupation: "", workplace: "", status: "Past", contractEnd: "2025-12-31", income: "", province: "" },
];

// ============ Mappers ============
function mapTenantFromDB(t) {
  return {
    ...t,
    socialContact: t.social_contact || '',
    contractEnd: t.contract_end || ''
  };
}

function mapTenantToDB(t) {
  const { socialContact, contractEnd, created_at, ...rest } = t;
  return {
    ...rest,
    social_contact: socialContact || '',
    contract_end: contractEnd || ''
  };
}

// ============ Provider ============
export const DataProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsInitialLoading(true);
    
    // 1. Fetch Rooms
    const { data: roomsData, error: roomsError } = await supabase.from('rooms').select('*');
    if (roomsError) {
      console.error("Error fetching rooms:", roomsError);
    } else if (roomsData) {
      setRooms(roomsData);
    }

    // 2. Fetch Tenants
    const { data: tenantsData, error: tenantsError } = await supabase.from('tenants').select('*');
    if (tenantsError) {
      console.error("Error fetching tenants:", tenantsError);
    } else if (tenantsData) {
      setTenants(tenantsData.map(mapTenantFromDB));
    }
    
    setIsInitialLoading(false);
  };

  const updateRoom = async (id, updatedData) => {
    // Optimistic UI update
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    const { error } = await supabase.from('rooms').update(updatedData).eq('id', id);
    if (error) console.error("Error updating room:", error);
  };

  const addRoom = async (newRoomData) => {
    const newRoom = {
      id: Date.now().toString(),
      ...newRoomData
    };
    const { data, error } = await supabase.from('rooms').insert([newRoom]).select();
    if (error) {
      console.error("Error adding room:", error);
    } else if (data) {
      setRooms(prev => [...prev, data[0]]);
    }
  };

  const updateTenant = async (id, updatedData) => {
    // Optimistic UI update
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    const dbData = mapTenantToDB(updatedData);
    const { error } = await supabase.from('tenants').update(dbData).eq('id', id);
    if (error) console.error("Error updating tenant:", error);
  };

  const addTenant = async (newTenantData) => {
    const { id: _oldId, ...rest } = newTenantData;
    const dbData = mapTenantToDB(rest);
    const { data, error } = await supabase.from('tenants').insert([dbData]).select();
    if (error) {
      console.error("Error adding tenant:", error);
    } else if (data) {
      setTenants(prev => [...prev, mapTenantFromDB(data[0])]);
    }
  };

  const addMultipleTenants = async (tenantsArray) => {
    const dbDataArray = tenantsArray.map(t => {
      const { id: _oldId, ...rest } = t;
      return mapTenantToDB(rest);
    });
    
    const { data, error } = await supabase.from('tenants').insert(dbDataArray).select();
    if (error) {
      console.error("Error bulk adding tenants:", error);
    } else if (data) {
      const mapped = data.map(mapTenantFromDB);
      setTenants(prev => [...prev, ...mapped]);
    }
  };

  const deleteTenant = async (id) => {
    // Optimistic UI update
    setTenants(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('tenants').delete().eq('id', id);
    if (error) console.error("Error deleting tenant:", error);
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

  return (
    <DataContext.Provider value={{ 
      rooms, setRooms, updateRoom, addRoom,
      tenants, setTenants, updateTenant, addTenant, addMultipleTenants, deleteTenant,
      importFromGoogleSheets, importLoading, isInitialLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
