"use client";
import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

// Google Sheets CSV URL for form responses
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1FofsFHPRNCSMybFGesAOSQzCE4eOTXbi0j0E-DZzRKQ/export?format=csv";

// Parse CSV handling quoted fields with commas/newlines
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

export const DataProvider = ({ children }) => {
  const [rooms, setRooms] = useState([
    { id: "101", name: "A-1. AniYuki", type: "Standard", price: "5,000", status: "occupied", tenant: "Somchai S.", image: "" },
    { id: "102", name: "B-5. Guest House", type: "Standard", price: "5,000", status: "available", tenant: "-", image: "" },
    { id: "103", name: "B-6. TOMA HOUSE", type: "Deluxe", price: "7,500", status: "maintenance", tenant: "-", image: "" },
    { id: "104", name: "FRONTIER VILLAGE@1", type: "Standard", price: "5,000", status: "occupied", tenant: "Somsri M.", image: "" },
    { id: "105", name: "FRONTIER VILLAGE@2", type: "Standard", price: "5,000", status: "available", tenant: "-", image: "" },
    { id: "201", name: "HB-1. Miyata", type: "Suite", price: "12,000", status: "occupied", tenant: "Wichai T.", image: "" },
  ]);

  const [tenants, setTenants] = useState([
    { id: 1, name: "Somchai Sripasert", nickname: "", dob: "", age: "", gender: "", room: "101", phone: "081-234-5678", email: "somchai@example.com", socialContact: "", occupation: "", workplace: "", status: "Active", contractEnd: "2026-12-31", income: "", province: "" },
    { id: 2, name: "Somsri Maneerat", nickname: "", dob: "", age: "", gender: "", room: "104", phone: "089-876-5432", email: "somsri.m@example.com", socialContact: "", occupation: "", workplace: "", status: "Active", contractEnd: "2026-10-15", income: "", province: "" },
    { id: 3, name: "Wichai Thongkam", nickname: "", dob: "", age: "", gender: "", room: "201", phone: "082-345-6789", email: "-", socialContact: "", occupation: "", workplace: "", status: "Active", contractEnd: "2027-01-20", income: "", province: "" },
    { id: 4, name: "Amonrat Sukjai", nickname: "", dob: "", age: "", gender: "", room: "-", phone: "083-456-7890", email: "amonrat@example.com", socialContact: "", occupation: "", workplace: "", status: "Past", contractEnd: "2025-12-31", income: "", province: "" },
  ]);

  const [importLoading, setImportLoading] = useState(false);

  const updateRoom = (id, updatedData) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, ...updatedData } : r));
  };

  const addRoom = (newRoomData) => {
    const newRoom = {
      id: Date.now().toString(),
      ...newRoomData
    };
    setRooms([...rooms, newRoom]);
  };

  const updateTenant = (id, updatedData) => {
    setTenants(tenants.map(t => t.id === id ? { ...t, ...updatedData } : t));
  };

  const addTenant = (newTenantData) => {
    const newTenant = {
      id: Date.now(),
      ...newTenantData
    };
    setTenants([...tenants, newTenant]);
  };

  const deleteTenant = (id) => {
    setTenants(tenants.filter(t => t.id !== id));
  };

  // Import tenants from Google Sheets (form responses)
  const importFromGoogleSheets = async () => {
    setImportLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_CSV_URL);
      if (!response.ok) throw new Error("Failed to fetch data");
      const text = await response.text();
      const rows = parseCSV(text);

      // Skip header row (index 0)
      // Columns: 0=Timestamp, 1=Room, 2=FullName, 3=Nickname, 4=DOB, 5=Phone,
      //          6=SocialContact, 7=Age, 8=Gender, 9=Occupation, 10=Workplace,
      //          11=ReasonForRenting, 12=WhatLookFor, 13=Improvements, 14=Income, 15=Province
      const imported = [];
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 3) continue;

        imported.push({
          id: Date.now() + i,
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
      tenants, setTenants, updateTenant, addTenant, deleteTenant,
      importFromGoogleSheets, importLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
