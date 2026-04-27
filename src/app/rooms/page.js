"use client";
import { useState } from "react";
import { Plus, Search, Filter, Edit, X } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function RoomsPage() {
  const { rooms, updateRoom } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  // Form state
  const [roomName, setRoomName] = useState("");
  const [status, setStatus] = useState("available");
  const [tenant, setTenant] = useState("");

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setRoomName(room.name || `Room ${room.id}`);
    setStatus(room.status);
    setTenant(room.tenant === "-" ? "" : room.tenant);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoom(editingRoom.id, {
        name: roomName,
        status: status,
        tenant: status === 'occupied' ? (tenant || "-") : "-",
      });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">การจัดการห้องพัก (Room Management)</h1>
        <button className="btn btn-primary" onClick={() => alert('Future Feature: Add Room Database Form')}>
          <Plus size={20} />
          เพิ่มห้องใหม่ (Add Room)
        </button>
      </div>

      <div className={`card glass ${styles.controls}`}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อห้องพัก หรือ ชื่อผู้เช่า..." 
            className="input-field" 
            style={{ paddingLeft: '2.5rem' }} 
          />
        </div>
        <button className="btn btn-outline">
          <Filter size={20} />
          ตัวกรอง (Filters)
        </button>
      </div>

      <div className={styles.roomGrid}>
        {rooms.map((room) => (
          <div key={room.id} className={`card glass ${styles.roomCard}`}>
            <div className={styles.roomHeader}>
              <h2>{room.name || `Room ${room.id}`}</h2>
              <span className={`badge ${
                room.status === 'available' ? 'badge-success' : 
                room.status === 'occupied' ? 'badge-danger' : 'badge-warning'
              }`}>
                {room.status.toUpperCase()}
              </span>
            </div>
            
            <div className={styles.roomDetails}>
              <p><strong>ประเภท (Type):</strong> {room.type}</p>
              <p><strong>ค่าเช่า (Rent):</strong> ฿{room.price}/เดือน</p>
              <p><strong>ผู้เช่า (Tenant):</strong> {room.tenant}</p>
            </div>

            <div className={styles.roomActions}>
              <button className="btn btn-outline" style={{ flex: 1 }}>ดูรายละเอียด (Details)</button>
              <button className={styles.iconBtn} title="Edit Room" onClick={() => handleEditClick(room)}>
                <Edit size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>แก้ไขข้อมูลห้อง (Edit Room Details)</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Room Name (ชื่อห้อง)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. A-1. AniYuki"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status (สถานะ)</label>
                <select 
                  className="input-field" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="available">Available (ว่าง)</option>
                  <option value="occupied">Occupied (มีผู้เช่า)</option>
                  <option value="maintenance">Maintenance (ซ่อมบำรุง)</option>
                </select>
              </div>

              {status === 'occupied' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tenant Name (ชื่อผู้เช่า)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={tenant} 
                    onChange={(e) => setTenant(e.target.value)}
                    placeholder="ใส่ชื่อผู้เช่า (Enter tenant name)"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>ยกเลิก (Cancel)</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึก (Save Changes)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
