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

  return (
    <DataContext.Provider value={{ rooms, setRooms, updateRoom, addRoom }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
