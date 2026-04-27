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
  const [status, setStatus] = useState("available");
  const [tenant, setTenant] = useState("");

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setStatus(room.status);
    setTenant(room.tenant === "-" ? "" : room.tenant);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoom(editingRoom.id, {
        status: status,
        tenant: status === 'occupied' ? (tenant || "-") : "-",
      });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">Room Management</h1>
        <button className="btn btn-primary" onClick={() => alert('Future Feature: Add Room Database Form')}>
          <Plus size={20} />
          Add New Room
        </button>
      </div>

      <div className={`card glass ${styles.controls}`}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by room number or tenant..." 
            className="input-field" 
            style={{ paddingLeft: '2.5rem' }} 
          />
        </div>
        <button className="btn btn-outline">
          <Filter size={20} />
          Filters
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
              <p><strong>Type:</strong> {room.type}</p>
              <p><strong>Rent:</strong> ฿{room.price}/mo</p>
              <p><strong>Tenant:</strong> {room.tenant}</p>
            </div>

            <div className={styles.roomActions}>
              <button className="btn btn-outline" style={{ flex: 1 }}>View Details</button>
              <button className={styles.iconBtn} title="Edit Room" onClick={() => handleEditClick(room)}>
                <Edit size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Edit {editingRoom?.name}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status</label>
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tenant Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={tenant} 
                    onChange={(e) => setTenant(e.target.value)}
                    placeholder="Enter tenant name"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
