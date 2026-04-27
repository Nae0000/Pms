"use client";
import React, { createContext, useState, useContext } from 'react';

const DataContext = createContext();

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
    { id: 1, name: "Somchai Sripasert", room: "101", phone: "081-234-5678", email: "somchai@example.com", status: "Active", contractEnd: "2026-12-31" },
    { id: 2, name: "Somsri Maneerat", room: "104", phone: "089-876-5432", email: "somsri.m@example.com", status: "Active", contractEnd: "2026-10-15" },
    { id: 3, name: "Wichai Thongkam", room: "201", phone: "082-345-6789", email: "-", status: "Active", contractEnd: "2027-01-20" },
    { id: 4, name: "Amonrat Sukjai", room: "-", phone: "083-456-7890", email: "amonrat@example.com", status: "Past", contractEnd: "2025-12-31" },
  ]);

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

  return (
    <DataContext.Provider value={{ 
      rooms, setRooms, updateRoom, addRoom,
      tenants, setTenants, updateTenant, addTenant, deleteTenant
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
