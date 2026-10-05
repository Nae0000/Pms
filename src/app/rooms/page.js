"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Edit, X, Info, LayoutGrid, List } from "lucide-react";
import styles from "./page.module.css";
import { roomImageSrc, PLACEHOLDER_IMG } from "@/lib/image";
import { monthlyCommonFee, DEFAULT_FEE_TIMES } from "@/lib/fees";
import { installmentInfo } from "@/lib/installment";
import { norm, isBlank } from "@/lib/links";
import { useData } from "../context/DataContext";

const baht = (n) => `฿${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

export default function RoomsPage() {
  const { rooms, updateRoom, addRoom, deleteRoom, tenants, loanPayments } = useData();
  const paymentsOf = (room) => (loanPayments || []).filter((p) => p.room === room.name);
  const activeTenants = (tenants || []).filter(t => t.status === 'Active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
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
    setTenantSearch("");
    setRoomType(room.type || "Standard");
    setRoomPrice(room.price || "");
    setRoomImage(room.image || "");
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setRoomName("");
    setStatus("available");
    setTenant("");
    setTenantSearch("");
    setRoomType("Standard");
    setRoomPrice("");
    setRoomImage("");
    setIsAddModalOpen(true);
  };

  // Downscale to keep the data URL small enough for a Google Sheet cell (50k char limit)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 360;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        let q = 0.7;
        let out = canvas.toDataURL("image/jpeg", q);
        while (out.length > 45000 && q > 0.2) {
          q -= 0.1;
          out = canvas.toDataURL("image/jpeg", q);
        }
        setRoomImage(out.length > 45000 ? "" : out);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
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
  }).sort((a, b) => {
    const nameA = a.name || "";
    const nameB = b.name || "";
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <>
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">การจัดการห้องพัก<span className="en-title"> (Room Management)</span></h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/loans" className="btn btn-outline">ตารางผ่อนห้อง</Link>
          <button className="btn btn-primary" onClick={handleAddClick}>
            <Plus size={20} />
            เพิ่มห้องใหม่ (Add Room)
          </button>
        </div>
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
            <option value="reserved">จอง (Reserved)</option>
            <option value="occupied">มีผู้เช่า (Occupied)</option>
            <option value="maintenance">ซ่อมบำรุง (Maintenance)</option>
          </select>
          <Filter size={18} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'inherit' }} />
        </div>
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.toggleBtnActive : ''}`} 
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleBtnActive : ''}`} 
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {(() => {
        const infos = (rooms || []).map((r) => installmentInfo(r, new Date(), paymentsOf(r))).filter(Boolean);
        if (!infos.length) return null;
        const monthly = infos.filter((i) => !i.done).reduce((a, i) => a + i.amount, 0);
        const paid = infos.reduce((a, i) => a + i.paidAmount, 0);
        const left = infos.reduce((a, i) => a + (i.remainingAmount || 0), 0);
        const fmt = (n) => `฿${Math.round(n).toLocaleString("en-US")}`;
        return (
          <div className={`card glass ${styles.instSummary}`}>
            <div><span>ผ่อนรวม/เดือน</span><strong>{fmt(monthly)}</strong></div>
            <div><span>ผ่อนไปแล้วรวม</span><strong>{fmt(paid)}</strong></div>
            <div><span>คงเหลือรวม</span><strong>{fmt(left)}</strong></div>
          </div>
        );
      })()}

      {viewMode === 'grid' ? (
        <div className={styles.roomGrid}>
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className={`card glass ${styles.roomCard}`}
              role="button"
              tabIndex={0}
              onClick={() => handleDetailsClick(room)}
              onKeyDown={(e) => { if (e.key === "Enter") handleDetailsClick(room); }}
            >
              <div className={styles.thumb}>
                <img src={roomImageSrc(room.image, 300) || PLACEHOLDER_IMG} alt={room.name} className={styles.roomImage} loading="lazy" />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <h2>{room.name || `Room ${room.id}`}</h2>
                  <span className={`badge ${
                    room.status === 'available' ? 'badge-success' :
                    room.status === 'reserved' ? 'badge-info' :
                    room.status === 'occupied' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {({ available: 'ว่าง', occupied: 'มีผู้เช่า', reserved: 'จอง', maintenance: 'ซ่อม' })[room.status] || room.status}
                  </span>
                </div>
                <div className={styles.price}>฿{room.price}<small>/เดือน</small></div>
                <div className={styles.meta}>
                  {[room.type, room.floor && `ชั้น ${room.floor}`, room.size && `${room.size} ตร.ม.`].filter(Boolean).join(" · ")}
                </div>
                <div className={styles.tenantLine}>
                  {room.tenant && room.tenant !== "-" ? room.tenant : <span style={{ opacity: 0.7 }}>ยังไม่มีผู้เช่า</span>}
                </div>
              </div>
              <button className={styles.iconBtn} title="แก้ไข (Edit)" aria-label="แก้ไข" onClick={(e) => { e.stopPropagation(); handleEditClick(room); }}>
                <Edit size={18} />
              </button>
              {(() => {
                const inst = installmentInfo(room, new Date(), paymentsOf(room));
                if (!inst) return null;
                return (
                  <div className={styles.loanBox}>
                    <div className={styles.loanNums}>
                      <span>ยอดกู้ <b>{inst.loan ? baht(inst.loan) : "-"}</b></span>
                      <span>ผ่อนไปแล้ว <b>{baht(inst.paidAmount)}</b></span>
                    </div>
                    <div className={styles.loanBar} aria-label={`ผ่อนแล้ว ${inst.percent ?? 0}%`}>
                      <div className={styles.loanFill} style={{ width: `${inst.percent ?? 0}%` }} />
                    </div>
                    <div className={styles.loanFoot}>
                      <span className={`${styles.loanStatus} ${styles["ls_" + inst.status]}`}>{inst.statusLabel}</span>
                      <span>{inst.paidCount}{inst.total ? ` / ${inst.total}` : ""} งวด{inst.percent !== null ? ` · ${inst.percent}%` : ""}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="card glass" style={{ padding: 0 }}>
          <div className={styles.tableContainer} style={{ padding: "0 1.5rem 1.5rem", marginTop: "1.5rem" }}>
            <table className={styles.roomTable}>
              <thead>
                <tr>
                  <th>รูป (Image)</th>
                  <th>ห้อง (Room)</th>
                  <th>สถานะ (Status)</th>
                  <th>ประเภท (Type)</th>
                  <th>ค่าเช่า (Rent)</th>
                  <th>ผู้เช่า (Tenant)</th>
                  <th>จัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                      ไม่พบห้องพัก (No rooms found)
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.id}>
                      <td data-label="รูป (Image)">
                        <img 
                          src={roomImageSrc(room.image, 200) || PLACEHOLDER_IMG} 
                          alt={room.name} 
                          style={{ width: "60px", height: "40px", objectFit: "cover", borderRadius: "4px" }} 
                        />
                      </td>
                      <td data-label="ห้อง (Room)" style={{ fontWeight: 600 }}>{room.name || `Room ${room.id}`}</td>
                      <td data-label="สถานะ (Status)">
                        <span className={`badge ${
                          room.status === 'available' ? 'badge-success' : 
                          room.status === 'reserved' ? 'badge-info' :
                          room.status === 'occupied' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {room.status === 'reserved' ? 'RESERVED' : room.status.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="ประเภท (Type)">{room.type}</td>
                      <td data-label="ค่าเช่า (Rent)">฿{room.price}/เดือน</td>
                      <td data-label="ผู้เช่า (Tenant)">{room.tenant !== "-" ? room.tenant : <span style={{ color: "var(--text-muted)" }}>ไม่มี (None)</span>}</td>
                      <td data-label="จัดการ (Actions)">
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button className={styles.iconBtn} title="ดูรายละเอียด (Details)" onClick={() => handleDetailsClick(room)}>
                            <Info size={16} />
                          </button>
                          <button className={styles.iconBtn} title="แก้ไข (Edit)" onClick={() => handleEditClick(room)}>
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>อัปโหลดรูปภาพฝังตัว (Upload Embedded Image)</label>
              <input 
                type="file" 
                accept="image/*"
                className="input-field" 
                onChange={handleImageChange}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              {roomImage && roomImage.startsWith('data:image') && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                  ✓ รูปภาพถูกฝังลงในระบบเรียบร้อยแล้ว
                </div>
              )}
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
                <option value="reserved">Reserved (จอง)</option>
                <option value="occupied">Occupied (มีผู้เช่า)</option>
                <option value="maintenance">Maintenance (ซ่อมบำรุง)</option>
              </select>
            </div>

            {status === 'occupied' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tenant Name (ชื่อผู้เช่า)</label>
                <input 
                  type="text"
                  placeholder="พิมพ์เพื่อค้นหาชื่อผู้เช่า..."
                  className="input-field"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                />
                <select 
                  className="input-field" 
                  value={tenant} 
                  onChange={(e) => setTenant(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- เลือกผู้เช่า (Select Tenant) --</option>
                  {activeTenants.filter(t => {
                    const fullText = `${t.name || ""} ${t.nickname || ""} ${t.room || "-"}`.toLowerCase();
                    return fullText.includes(tenantSearch.toLowerCase());
                  }).map((t, i) => (
                    <option key={i} value={t.name}>{t.name}{t.nickname ? ` "${t.nickname}"` : ''} — {(() => { const r = (rooms || []).find(x => !isBlank(x.tenant) && norm(x.tenant) === norm(t.name)); return r ? `ย้ายจาก ${r.name}` : 'ยังไม่มีห้อง'; })()}</option>
                  ))}
                </select>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>อัปโหลดรูปภาพฝังตัว (Upload Embedded Image)</label>
              <input 
                type="file" 
                accept="image/*"
                className="input-field" 
                onChange={handleImageChange}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              {roomImage && roomImage.startsWith('data:image') && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                  ✓ รูปภาพถูกฝังลงในระบบเรียบร้อยแล้ว
                </div>
              )}
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
                <option value="reserved">Reserved (จอง)</option>
                <option value="occupied">Occupied (มีผู้เช่า)</option>
                <option value="maintenance">Maintenance (ซ่อมบำรุง)</option>
              </select>
            </div>

            {status === 'occupied' && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tenant Name (ชื่อผู้เช่า)</label>
                <input 
                  type="text"
                  placeholder="พิมพ์เพื่อค้นหาชื่อผู้เช่า..."
                  className="input-field"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                />
                <select 
                  className="input-field" 
                  value={tenant} 
                  onChange={(e) => setTenant(e.target.value)}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- เลือกผู้เช่า (Select Tenant) --</option>
                  {activeTenants.filter(t => {
                    const fullText = `${t.name || ""} ${t.nickname || ""} ${t.room || "-"}`.toLowerCase();
                    return fullText.includes(tenantSearch.toLowerCase());
                  }).map((t, i) => (
                    <option key={i} value={t.name}>{t.name}{t.nickname ? ` "${t.nickname}"` : ''} — {(() => { const r = (rooms || []).find(x => !isBlank(x.tenant) && norm(x.tenant) === norm(t.name)); return r ? `ย้ายจาก ${r.name}` : 'ยังไม่มีห้อง'; })()}</option>
                  ))}
                </select>
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
              <img src={roomImageSrc(viewingRoom.image) || PLACEHOLDER_IMG} alt={viewingRoom.name} className={styles.roomImage} />
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
            {(viewingRoom.deposit || viewingRoom.floor || viewingRoom.size) && (
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {viewingRoom.deposit && <div><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>เงินประกัน</p><p style={{ fontSize: '1rem', fontWeight: '500' }}>฿{viewingRoom.deposit}</p></div>}
                {viewingRoom.floor && <div><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ชั้น</p><p style={{ fontSize: '1rem', fontWeight: '500' }}>{viewingRoom.floor}</p></div>}
                {viewingRoom.size && <div><p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ขนาด</p><p style={{ fontSize: '1rem', fontWeight: '500' }}>{viewingRoom.size} ตร.ม.</p></div>}
              </div>
            )}
            {(() => {
              const inst = installmentInfo(viewingRoom, new Date(), paymentsOf(viewingRoom));
              if (!inst) return null;
              const baht = (n) => `฿${Math.round(n).toLocaleString("en-US")}`;
              return (
                <div className={styles.instBox}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>การผ่อนห้อง</p>
                  {inst.total > 0 && (
                    <div className={styles.instBar} style={{ height: 10, marginBottom: '0.5rem' }}>
                      <div className={styles.instFill} style={{ width: `${inst.percent}%` }} />
                    </div>
                  )}
                  <div className={styles.instGrid}>
                    {inst.loan > 0 && <div><span>ยอดกู้</span><strong>{baht(inst.loan)}</strong></div>}
                    <div><span>ค่างวด</span><strong>{baht(inst.amount)}/เดือน</strong></div>
                    <div><span>ผ่อนแล้ว</span><strong>{inst.paidCount}{inst.total ? ` / ${inst.total}` : ""} งวด{inst.percent !== null ? ` (${inst.percent}%)` : ""}</strong></div>
                    <div><span>จ่ายไปแล้ว</span><strong>{baht(inst.paidAmount)}</strong></div>
                    {inst.remainingAmount !== null && <div><span>คงเหลือ</span><strong>{baht(inst.remainingAmount)} ({inst.remainingCount} งวด)</strong></div>}
                    {inst.endLabel && <div><span>ผ่อนหมด</span><strong>{inst.done ? "ครบแล้ว" : inst.endLabel}</strong></div>}
                  </div>
                </div>
              );
            })()}
            {viewingRoom.common_fee && (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>ค่าส่วนกลาง</p>
                <p style={{ fontSize: '1rem', fontWeight: '500' }}>
                  ฿{viewingRoom.common_fee} × {viewingRoom.common_times || DEFAULT_FEE_TIMES} ครั้ง/ปี
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> = เฉลี่ย ฿{Math.round(monthlyCommonFee(viewingRoom)).toLocaleString('en-US')}/เดือน</span>
                </p>
              </div>
            )}
            {viewingRoom.amenities && (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>สิ่งอำนวยความสะดวก</p>
                <p style={{ fontSize: '1rem' }}>{viewingRoom.amenities}</p>
              </div>
            )}
            {viewingRoom.note && (
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>หมายเหตุ</p>
                <p style={{ fontSize: '1rem' }}>{viewingRoom.note}</p>
              </div>
            )}
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

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => {
                const has = viewingRoom.tenant && viewingRoom.tenant !== '-';
                const msg = `ลบห้อง ${viewingRoom.name} ?` + (has ? `\n\nผู้เช่า "${viewingRoom.tenant}" จะไม่ถูกลบ แต่ช่องห้องของเขาจะถูกเคลียร์` : '') + '\n\nการลบย้อนกลับไม่ได้';
                if (window.confirm(msg)) {
                  deleteRoom(viewingRoom.id);
                  setIsDetailsModalOpen(false);
                }
              }}
            >
              ลบห้อง
            </button>
            <button className="btn btn-primary" onClick={() => setIsDetailsModalOpen(false)}>
              ปิด (Close)
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
