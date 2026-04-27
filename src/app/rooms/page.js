import { Plus, Search, Filter, Edit } from "lucide-react";
import styles from "./page.module.css";

export default function RoomsPage() {
  // Mock data สำหรับแสดงผลเบื้องต้น
  const rooms = [
    { id: "101", type: "Standard", price: "5,000", status: "occupied", tenant: "Somchai S." },
    { id: "102", type: "Standard", price: "5,000", status: "available", tenant: "-" },
    { id: "103", type: "Deluxe", price: "7,500", status: "maintenance", tenant: "-" },
    { id: "104", type: "Standard", price: "5,000", status: "occupied", tenant: "Somsri M." },
    { id: "105", type: "Standard", price: "5,000", status: "available", tenant: "-" },
    { id: "201", type: "Suite", price: "12,000", status: "occupied", tenant: "Wichai T." },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">Room Management</h1>
        <button className="btn btn-primary">
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
              <h2>Room {room.id}</h2>
              <span className={`badge ${
                room.status === 'available' ? 'badge-success' : 
                room.status === 'occupied' ? 'badge-danger' : 'badge-warning'
              }`}>
                {room.status}
              </span>
            </div>
            
            <div className={styles.roomDetails}>
              <p><strong>Type:</strong> {room.type}</p>
              <p><strong>Rent:</strong> ฿{room.price}/mo</p>
              <p><strong>Tenant:</strong> {room.tenant}</p>
            </div>

            <div className={styles.roomActions}>
              <button className="btn btn-outline" style={{ flex: 1 }}>View Details</button>
              <button className={styles.iconBtn} title="Edit Room">
                <Edit size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
