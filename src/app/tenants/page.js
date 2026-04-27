"use client";
import { useState } from "react";
import { Plus, Search, Filter, Mail, Phone, FileText, Edit, Trash2, X } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function TenantsPage() {
  const { tenants, addTenant, updateTenant, deleteTenant } = useData();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Active");
  const [contractEnd, setContractEnd] = useState("");

  const handleAddClick = () => {
    setName("");
    setRoom("");
    setPhone("");
    setEmail("");
    setStatus("Active");
    setContractEnd("");
    setIsAddModalOpen(true);
  };

  const handleEditClick = (tenant) => {
    setEditingTenant(tenant);
    setName(tenant.name);
    setRoom(tenant.room);
    setPhone(tenant.phone);
    setEmail(tenant.email === "-" ? "" : tenant.email);
    setStatus(tenant.status);
    setContractEnd(tenant.contractEnd);
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addTenant({ 
      name, 
      room: room || "-", 
      phone, 
      email: email || "-", 
      status, 
      contractEnd 
    });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingTenant) {
      updateTenant(editingTenant.id, { 
        name, 
        room: room || "-", 
        phone, 
        email: email || "-", 
        status, 
        contractEnd 
      });
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("คุณต้องการลบข้อมูลผู้เช่านี้ใช่หรือไม่? (Are you sure you want to delete this tenant?)")) {
      deleteTenant(id);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const searchMatch = (tenant.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) || 
                        (tenant.phone || "").includes(searchQuery) ||
                        (tenant.room || "").toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch = filterStatus === "all" || tenant.status === filterStatus;
    return searchMatch && statusMatch;
  });

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">การจัดการผู้เช่า (Tenant Management)</h1>
        <button className="btn btn-primary" onClick={handleAddClick}>
          <Plus size={20} />
          เพิ่มผู้เช่าใหม่ (Add Tenant)
        </button>
      </div>

      <div className={`card glass ${styles.controls}`}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="ค้นหาผู้เช่าด้วยชื่อ, ห้องพัก, หรือเบอร์โทร..." 
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
            <option value="Active">กำลังเช่า (Active)</option>
            <option value="Past">อดีตผู้เช่า (Past)</option>
          </select>
          <Filter size={18} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'inherit' }} />
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div className={styles.tableContainer}>
          <table className={styles.tenantTable}>
            <thead>
              <tr>
                <th>ชื่อผู้เช่า (Tenant Name)</th>
                <th>ห้อง (Room)</th>
                <th>ข้อมูลติดต่อ (Contact Info)</th>
                <th>สถานะ (Status)</th>
                <th>สิ้นสุดสัญญา (Contract End)</th>
                <th>เอกสาร (Documents)</th>
                <th>จัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div className={styles.tenantInfo}>
                        <div className={styles.avatar}>{tenant.name.charAt(0).toUpperCase()}</div>
                        <strong>{tenant.name}</strong>
                      </div>
                    </td>
                    <td>{tenant.room}</td>
                    <td>
                      <div className={styles.contactInfo}>
                        <div className={styles.contactRow}><Phone size={14} /> {tenant.phone}</div>
                        {tenant.email && tenant.email !== "-" && <div className={styles.contactRow}><Mail size={14} /> {tenant.email}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${tenant.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                        {tenant.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{tenant.contractEnd || '-'}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button className={styles.iconBtn} title="View Contract"><FileText size={16} /></button>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button className={styles.iconBtn} title="Edit Tenant" onClick={() => handleEditClick(tenant)}><Edit size={16} /></button>
                        <button className={styles.iconBtn} title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteClick(tenant.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    ไม่พบข้อมูลผู้เช่า (No tenants found)
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tenant Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>เพิ่มผู้เช่าใหม่ (Add New Tenant)</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdd} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>ชื่อ-นามสกุล (Full Name)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. สมชาย ใจดี"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>ห้องพัก (Room)</label>
                  <input 
                    type="text"
                    className="input-field" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. 101"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>เบอร์โทรศัพท์ (Phone)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 081-234-5678"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>อีเมล (Email)</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. email@example.com (Optional)"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>สถานะ (Status)</label>
                  <select 
                    className="input-field" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Active">กำลังเช่า (Active)</option>
                    <option value="Past">อดีตผู้เช่า (Past)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>สิ้นสุดสัญญา (Contract End)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={contractEnd} 
                    onChange={(e) => setContractEnd(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>ยกเลิก (Cancel)</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>เพิ่มผู้เช่า (Add Tenant)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>แก้ไขข้อมูลผู้เช่า (Edit Tenant Details)</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>ชื่อ-นามสกุล (Full Name)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>ห้องพัก (Room)</label>
                  <input 
                    type="text"
                    className="input-field" 
                    value={room} 
                    onChange={(e) => setRoom(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>เบอร์โทรศัพท์ (Phone)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>อีเมล (Email)</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>สถานะ (Status)</label>
                  <select 
                    className="input-field" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Active">กำลังเช่า (Active)</option>
                    <option value="Past">อดีตผู้เช่า (Past)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>สิ้นสุดสัญญา (Contract End)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={contractEnd} 
                    onChange={(e) => setContractEnd(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)}>ยกเลิก (Cancel)</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึก (Save Changes)</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
