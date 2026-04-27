"use client";
import { useState } from "react";
import { Plus, Search, Filter, Edit, X, Info } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function RoomsPage() {
  const { rooms, updateRoom, addRoom } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [editingRoom, setEditingRoom] = useState(null);
  const [viewingRoom, setViewingRoom] = useState(null);

  // Form state
  const [roomName, setRoomName] = useState("");
  const [status, setStatus] = useState("available");
  const [tenant, setTenant] = useState("");
  const [roomType, setRoomType] = useState("Standard");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomImage, setRoomImage] = useState("");

  const handleEditClick = (room) => {
    setEditingRoom(room);
    setRoomName(room.name || `Room ${room.id}`);
    setStatus(room.status);
    setTenant(room.tenant === "-" ? "" : room.tenant);
    setRoomType(room.type || "Standard");
    setRoomPrice(room.price || "");
    setRoomImage(room.image || "");
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setRoomName("");
    setStatus("available");
    setTenant("");
    setRoomType("Standard");
    setRoomPrice("");
    setRoomImage("");
    setIsAddModalOpen(true);
  };

  const handleDetailsClick = (room) => {
    setViewingRoom(room);
    setIsDetailsModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingRoom) {
      updateRoom(editingRoom.id, {
        name: roomName,
        type: roomType,
        price: roomPrice || "0",
        status: status,
        tenant: status === 'occupied' ? (tenant || "-") : "-",
        image: roomImage,
      });
      setIsModalOpen(false);
    }
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addRoom({
      name: roomName,
      type: roomType,
      price: roomPrice || "0",
      status: status,
      tenant: status === 'occupied' ? (tenant || "-") : "-",
      image: roomImage,
    });
    setIsAddModalOpen(false);
  };

  const filteredRooms = rooms.filter(room => {
    const nameMatch = room.name ? room.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const tenantMatch = room.tenant ? room.tenant.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    const matchesSearch = nameMatch || tenantMatch;
    
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">การจัดการห้องพัก (Room Management)</h1>
        <button className="btn btn-primary" onClick={handleAddClick}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select 
            className="btn btn-outline" 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}
          >
            <option value="all">ทั้งหมด (All)</option>
            <option value="available">ว่าง (Available)</option>
            <option value="occupied">มีผู้เช่า (Occupied)</option>
            <option value="maintenance">ซ่อมบำรุง (Maintenance)</option>
          </select>
          <Filter size={18} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'inherit' }} />
        </div>
      </div>

      <div className={styles.roomGrid}>
        {filteredRooms.map((room) => (
          <div key={room.id} className={`card glass ${styles.roomCard}`}>
            <div className={styles.roomImageContainer}>
              <img src={room.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"} alt={room.name} className={styles.roomImage} />
            </div>
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
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleDetailsClick(room)}>
                ดูรายละเอียด (Details)
              </button>
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
            
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Image URL (ลิงก์รูปภาพ)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={roomImage} 
                  onChange={(e) => setRoomImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Type (ประเภท)</label>
                  <input 
                    list="room-types"
                    className="input-field" 
                    value={roomType} 
                    onChange={(e) => setRoomType(e.target.value)}
                    placeholder="e.g. Standard"
                    style={{ width: '100%' }}
                    required
                  />
                  <datalist id="room-types">
                    <option value="Standard" />
                    <option value="Deluxe" />
                    <option value="Suite" />
                  </datalist>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Rent (ค่าเช่า/เดือน)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={roomPrice} 
                    onChange={(e) => setRoomPrice(e.target.value)}
                    placeholder="e.g. 5,000"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>เพิ่มห้องใหม่ (Add New Room)</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Room Name (ชื่อห้อง)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. C-1. New Room"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Image URL (ลิงก์รูปภาพ)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={roomImage} 
                  onChange={(e) => setRoomImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Type (ประเภท)</label>
                  <input 
                    list="room-types"
                    className="input-field" 
                    value={roomType} 
                    onChange={(e) => setRoomType(e.target.value)}
                    placeholder="e.g. Standard"
                    style={{ width: '100%' }}
                    required
                  />
                  <datalist id="room-types">
                    <option value="Standard" />
                    <option value="Deluxe" />
                    <option value="Suite" />
                  </datalist>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Rent (ค่าเช่า/เดือน)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={roomPrice} 
                    onChange={(e) => setRoomPrice(e.target.value)}
                    placeholder="e.g. 5,000"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
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
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>ยกเลิก (Cancel)</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>เพิ่มห้อง (Add Room)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && viewingRoom && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={24} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>รายละเอียดห้อง (Room Details)</h2>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className={styles.roomImageContainer} style={{ margin: '0 0 1rem 0', borderRadius: 'var(--radius-lg)' }}>
                <img src={viewingRoom.image || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"} alt={viewingRoom.name} className={styles.roomImage} />
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>รหัสห้อง (Room ID)</p>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>{viewingRoom.id}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ชื่อห้อง (Room Name)</p>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>{viewingRoom.name || '-'}</p>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ประเภท (Type)</p>
                  <p style={{ fontSize: '1rem', fontWeight: '500' }}>{viewingRoom.type}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ค่าเช่า (Rent)</p>
                  <p style={{ fontSize: '1rem', fontWeight: '500' }}>฿{viewingRoom.price}/เดือน</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>สถานะ (Status)</p>
                <span className={`badge ${
                  viewingRoom.status === 'available' ? 'badge-success' : 
                  viewingRoom.status === 'occupied' ? 'badge-danger' : 'badge-warning'
                }`}>
                  {viewingRoom.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ชื่อผู้เช่า (Tenant)</p>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>{viewingRoom.tenant}</p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setIsDetailsModalOpen(false)}>
                ปิด (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
