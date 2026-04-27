"use client";
import { Plus, Search, Filter, Edit } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function RoomsPage() {
  const { rooms, updateRoom } = useData();

  const handleEdit = (room) => {
    const newStatus = prompt(`Update status for Room ${room.id} (available, occupied, maintenance):`, room.status);
    if (!newStatus) return;
    
    let newTenant = room.tenant;
    if (newStatus === 'occupied') {
      newTenant = prompt(`Enter tenant name for Room ${room.id}:`, room.tenant === '-' ? '' : room.tenant) || '-';
    } else {
      newTenant = '-';
    }

    updateRoom(room.id, { status: newStatus.toLowerCase(), tenant: newTenant });
  };

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">Room Management</h1>
        <button className="btn btn-primary" onClick={() => alert('Add room modal would open here.')}>
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
              <button className={styles.iconBtn} title="Edit Room" onClick={() => handleEdit(room)}>
                <Edit size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
