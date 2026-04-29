"use client";
import { useState } from "react";
import { Plus, Search, Filter, Mail, Phone, FileText, Edit, Trash2, X, Download, User, Briefcase, Heart, Eye, ChevronDown } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

const LABEL = { display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' };
const ROW2 = { display: 'flex', gap: '1rem' };
const FLEX1 = { flex: 1 };
const W100 = { width: '100%' };
const BTNS = { display: 'flex', gap: '1rem', marginTop: '1rem' };

const emptyForm = () => ({
  name: "", nickname: "", dob: "", age: "", gender: "", room: "", phone: "",
  email: "", socialContact: "", occupation: "", workplace: "", status: "Active",
  contractEnd: "", income: "", province: ""
});

export default function TenantsPage() {
  const { tenants, addTenant, addMultipleTenants, updateTenant, deleteTenant, rooms, importFromGoogleSheets, importLoading, isInitialLoading } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingTenant, setViewingTenant] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [importData, setImportData] = useState([]);
  const [selectedImports, setSelectedImports] = useState(new Set());

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleAddClick = () => { setForm(emptyForm()); setIsAddModalOpen(true); };

  const handleEditClick = (tenant) => {
    setEditingTenant(tenant);
    setForm({
      name: tenant.name || "", nickname: tenant.nickname || "", dob: tenant.dob || "",
      age: tenant.age || "", gender: tenant.gender || "", room: tenant.computedRoom || "",
      phone: tenant.phone || "", email: tenant.email === "-" ? "" : (tenant.email || ""),
      socialContact: tenant.socialContact || "", occupation: tenant.occupation || "",
      workplace: tenant.workplace || "", status: tenant.computedStatus || "Active",
      contractEnd: tenant.contractEnd || "", income: tenant.income || "", province: tenant.province || ""
    });
    setIsEditModalOpen(true);
  };

  const handleViewClick = (tenant) => { setViewingTenant(tenant); setIsDetailModalOpen(true); };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addTenant({ ...form, room: form.room || "-", email: form.email || "-" });
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingTenant) {
      updateTenant(editingTenant.id, { ...form, room: form.room || "-", email: form.email || "-" });
      setIsEditModalOpen(false);
    }
  };

  const handleDeleteClick = (id) => {
    if (window.confirm("คุณต้องการลบข้อมูลผู้เช่านี้ใช่หรือไม่?")) deleteTenant(id);
  };

  const handleImportClick = async () => {
    const data = await importFromGoogleSheets();
    if (data) { setImportData(data); setSelectedImports(new Set()); setIsImportModalOpen(true); }
    else { alert("ไม่สามารถดึงข้อมูลจาก Google Sheets ได้"); }
  };

  const toggleImportSelect = (idx) => {
    setSelectedImports(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const handleImportSelected = () => {
    const toImport = [];
    selectedImports.forEach(idx => { if (importData[idx]) toImport.push(importData[idx]); });
    if (toImport.length > 0) addMultipleTenants(toImport);
    setIsImportModalOpen(false);
  };

  const mappedTenants = (tenants || []).map(t => {
    const linkedRoom = (rooms || []).find(r => r.tenant === t.name);
    return {
      ...t,
      computedRoom: linkedRoom ? (linkedRoom.name || linkedRoom.id) : "-",
      computedStatus: linkedRoom ? "Active" : "Inactive"
    };
  });

  const filteredTenants = mappedTenants.filter(t => {
    const q = searchQuery.toLowerCase();
    const searchMatch = (t.name || "").toLowerCase().includes(q) || (t.phone || "").includes(q) ||
      (t.computedRoom || "").toLowerCase().includes(q) || (t.nickname || "").toLowerCase().includes(q);
    const statusMatch = filterStatus === "all" || t.computedStatus === filterStatus;
    return searchMatch && statusMatch;
  });

  // Shared form fields renderer
  const renderFormFields = () => (
    <>
      {/* Personal Info */}
      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}><User size={14} /> ข้อมูลส่วนตัว (Personal Info)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={LABEL}>ชื่อ-นามสกุล (Full Name) *</label>
            <input type="text" className="input-field" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. สมชาย ใจดี" style={W100} required />
          </div>
          <div style={ROW2}>
            <div style={FLEX1}>
              <label style={LABEL}>ชื่อเล่น (Nickname)</label>
              <input type="text" className="input-field" value={form.nickname} onChange={e => setField('nickname', e.target.value)} placeholder="e.g. ชัย" style={W100} />
            </div>
            <div style={FLEX1}>
              <label style={LABEL}>เพศ (Gender)</label>
              <select className="input-field" value={form.gender} onChange={e => setField('gender', e.target.value)} style={W100}>
                <option value="">- ไม่ระบุ -</option>
                <option value="ชาย">ชาย (Male)</option>
                <option value="หญิง">หญิง (Female)</option>
                <option value="LGBTQ">LGBTQ</option>
              </select>
            </div>
          </div>
          <div style={ROW2}>
            <div style={FLEX1}>
              <label style={LABEL}>วันเดือนปีเกิด (DOB)</label>
              <input type="text" className="input-field" value={form.dob} onChange={e => setField('dob', e.target.value)} placeholder="e.g. 1/1/2000" style={W100} />
            </div>
            <div style={FLEX1}>
              <label style={LABEL}>อายุ (Age)</label>
              <input type="text" className="input-field" value={form.age} onChange={e => setField('age', e.target.value)} placeholder="e.g. 25" style={W100} />
            </div>
          </div>
          <div style={ROW2}>
            <div style={FLEX1}>
              <label style={LABEL}>จังหวัด (Province)</label>
              <input type="text" className="input-field" value={form.province} onChange={e => setField('province', e.target.value)} placeholder="e.g. กรุงเทพฯ" style={W100} />
            </div>
            <div style={FLEX1}>
              <label style={LABEL}>รายได้ต่อเดือน (Income)</label>
              <input type="text" className="input-field" value={form.income} onChange={e => setField('income', e.target.value)} placeholder="e.g. 10,000-20,000" style={W100} />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}><Phone size={14} /> ข้อมูลติดต่อ (Contact)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={ROW2}>
            <div style={FLEX1}>
              <label style={LABEL}>เบอร์โทรศัพท์ (Phone) *</label>
              <input type="text" className="input-field" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="e.g. 081-234-5678" style={W100} required />
            </div>
            <div style={FLEX1}>
              <label style={LABEL}>อีเมล (Email)</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="Optional" style={W100} />
            </div>
          </div>
          <div>
            <label style={LABEL}>ช่องทางติดต่ออื่น (Social: Line/FB/IG)</label>
            <input type="text" className="input-field" value={form.socialContact} onChange={e => setField('socialContact', e.target.value)} placeholder="e.g. Line: myid, FB: myname, IG: @me" style={W100} />
          </div>
        </div>
      </div>

      {/* Work Info */}
      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}><Briefcase size={14} /> ข้อมูลการทำงาน (Work)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={ROW2}>
            <div style={FLEX1}>
              <label style={LABEL}>อาชีพ (Occupation)</label>
              <input type="text" className="input-field" value={form.occupation} onChange={e => setField('occupation', e.target.value)} placeholder="e.g. พนักงานบริษัท" style={W100} />
            </div>
          </div>
          <div>
            <label style={LABEL}>สถานที่ทำงาน (Workplace)</label>
            <input type="text" className="input-field" value={form.workplace} onChange={e => setField('workplace', e.target.value)} placeholder="e.g. อาคารฟอร์จูนทาวน์" style={W100} />
          </div>
        </div>
      </div>

      {/* Rental Info */}
      <div className={styles.formSection}>
        <div className={styles.formSectionTitle}><Heart size={14} /> ข้อมูลการเช่า (Rental)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={ROW2}>
            <div style={FLEX1}>
              <label style={LABEL}>ห้องพัก (Room)</label>
              <select className="input-field" value={form.room} onChange={e => setField('room', e.target.value)} style={W100}>
                <option value="">- ไม่ระบุห้อง -</option>
                {rooms && rooms.map(r => <option key={r.id} value={r.id}>{r.id} {r.name ? `- ${r.name}` : ''}</option>)}
              </select>
            </div>
            <div style={FLEX1}>
              <label style={LABEL}>สถานะ (Status)</label>
              <select className="input-field" value={form.status} onChange={e => setField('status', e.target.value)} style={W100}>
                <option value="Active">กำลังเช่า (Active)</option>
                <option value="Past">อดีตผู้เช่า (Past)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={LABEL}>สิ้นสุดสัญญา (Contract End)</label>
            <input type="date" className="input-field" value={form.contractEnd} onChange={e => setField('contractEnd', e.target.value)} style={W100} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">การจัดการผู้เช่า (Tenant Management)</h1>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className={styles.importBtn} onClick={handleImportClick} disabled={importLoading}>
            <Download size={18} />
            {importLoading ? 'กำลังโหลด...' : 'นำเข้าจากฟอร์ม (Import)'}
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            <Plus size={20} /> เพิ่มผู้เช่า (Add)
          </button>
        </div>
      </div>

      <div className={`card glass ${styles.controls}`}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input type="text" placeholder="ค้นหาด้วยชื่อ, ชื่อเล่น, ห้องพัก, เบอร์โทร..." className="input-field" style={{ paddingLeft: '2.5rem' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <select className="btn btn-outline" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>
            <option value="all">ทั้งหมด (All)</option>
            <option value="Active">กำลังเช่า (Active)</option>
            <option value="Inactive">ไม่ได้เช่า (Inactive)</option>
          </select>
          <Filter size={18} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'inherit' }} />
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div className={styles.tableContainer}>
          <table className={styles.tenantTable}>
            <thead>
              <tr>
                <th>ผู้เช่า (Tenant)</th>
                <th>ห้อง (Room)</th>
                <th>ติดต่อ (Contact)</th>
                <th>อาชีพ (Job)</th>
                <th>สถานะ</th>
                <th>สัญญา</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>กำลังโหลดข้อมูล (Loading...)</td></tr>
              ) : filteredTenants.length > 0 ? filteredTenants.map(t => (
                <tr key={t.id} onClick={() => handleViewClick(t)}>
                  <td>
                    <div className={styles.tenantInfo}>
                      <div className={styles.avatar}>{(t.name || "?").charAt(0).toUpperCase()}</div>
                      <div className={styles.tenantNameBlock}>
                        <strong>{t.name}</strong>
                        {t.nickname && <span className={styles.tenantNickname}>"{t.nickname}"</span>}
                      </div>
                    </div>
                  </td>
                  <td>{t.computedRoom}</td>
                  <td>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactRow}><Phone size={14} /> {t.phone}</div>
                      {t.socialContact && <div className={styles.socialBadge}>{t.socialContact}</div>}
                    </div>
                  </td>
                  <td>
                    {t.occupation && <div className={styles.workInfo}><span>{t.occupation}</span></div>}
                  </td>
                  <td>
                    <span className={`badge ${t.computedStatus === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{t.computedStatus?.toUpperCase()}</span>
                  </td>
                  <td>{t.contractEnd || '-'}</td>
                  <td>
                    <div className={styles.actionCell} onClick={e => e.stopPropagation()}>
                      <button className={styles.iconBtn} title="View" onClick={() => handleViewClick(t)}><Eye size={16} /></button>
                      <button className={styles.iconBtn} title="Edit" onClick={() => handleEditClick(t)}><Edit size={16} /></button>
                      <button className={styles.iconBtn} title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteClick(t.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>ไม่พบข้อมูลผู้เช่า (No tenants found)</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-lg glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>เพิ่มผู้เช่าใหม่ (Add New Tenant)</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveAdd} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {renderFormFields()}
              </div>
              <div style={BTNS}>
                <button type="button" className="btn btn-outline" style={FLEX1} onClick={() => setIsAddModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={FLEX1}>เพิ่มผู้เช่า</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-lg glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>แก้ไขข้อมูลผู้เช่า (Edit Tenant)</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {renderFormFields()}
              </div>
              <div style={BTNS}>
                <button type="button" className="btn btn-outline" style={FLEX1} onClick={() => setIsEditModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={FLEX1}>บันทึก (Save)</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {isDetailModalOpen && viewingTenant && (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="modal-content-lg glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className={styles.avatar} style={{ width: 48, height: 48, fontSize: '1.1rem' }}>{(viewingTenant.name || "?").charAt(0).toUpperCase()}</div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{viewingTenant.name}</h2>
                  {viewingTenant.nickname && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>"{viewingTenant.nickname}"</span>}
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ flex: '1 1 auto', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1rem' }}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}><span className={styles.detailLabel}>ห้อง</span><span className={styles.detailValue}>{viewingTenant.room || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>สถานะ</span><span className={styles.detailValue}><span className={`badge ${viewingTenant.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>{viewingTenant.status}</span></span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>เพศ</span><span className={styles.detailValue}>{viewingTenant.gender || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>อายุ</span><span className={styles.detailValue}>{viewingTenant.age || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>วันเกิด</span><span className={styles.detailValue}>{viewingTenant.dob || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>จังหวัด</span><span className={styles.detailValue}>{viewingTenant.province || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>โทรศัพท์</span><span className={styles.detailValue}>{viewingTenant.phone || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>อีเมล</span><span className={styles.detailValue}>{viewingTenant.email || '-'}</span></div>
                <div className={`${styles.detailItem} ${styles.detailFull}`}><span className={styles.detailLabel}>ช่องทางติดต่ออื่น</span><span className={styles.detailValue}>{viewingTenant.socialContact || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>อาชีพ</span><span className={styles.detailValue}>{viewingTenant.occupation || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>รายได้</span><span className={styles.detailValue}>{viewingTenant.income || '-'}</span></div>
                <div className={`${styles.detailItem} ${styles.detailFull}`}><span className={styles.detailLabel}>สถานที่ทำงาน</span><span className={styles.detailValue}>{viewingTenant.workplace || '-'}</span></div>
                <div className={styles.detailItem}><span className={styles.detailLabel}>สิ้นสุดสัญญา</span><span className={styles.detailValue}>{viewingTenant.contractEnd || '-'}</span></div>
              </div>
            </div>
            <div style={BTNS}>
              <button className="btn btn-outline" style={FLEX1} onClick={() => { setIsDetailModalOpen(false); handleEditClick(viewingTenant); }}>
                <Edit size={16} /> แก้ไข (Edit)
              </button>
              <button className="btn btn-outline" style={FLEX1} onClick={() => setIsDetailModalOpen(false)}>ปิด (Close)</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-lg glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>นำเข้าจากฟอร์ม ({importData.length} รายการ)</h2>
              <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className={styles.importActions}>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={() => setSelectedImports(new Set(importData.map((_, i) => i)))}>เลือกทั้งหมด</button>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }} onClick={() => setSelectedImports(new Set())}>ยกเลิกทั้งหมด</button>
              <span className={styles.importCount}>{selectedImports.size} selected</span>
            </div>
            <div className={styles.importList}>
              {importData.map((item, idx) => (
                <div key={idx} className={styles.importItem}>
                  <input type="checkbox" checked={selectedImports.has(idx)} onChange={() => toggleImportSelect(idx)} />
                  <div className={styles.importItemInfo}>
                    <span className={styles.importItemName}>{item.name} {item.nickname ? `"${item.nickname}"` : ''}</span>
                    <span className={styles.importItemMeta}>ห้อง {item.room} · {item.phone} · {item.occupation || '-'} · {item.gender || '-'}, {item.age || '-'}ปี</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={BTNS}>
              <button className="btn btn-outline" style={FLEX1} onClick={() => setIsImportModalOpen(false)}>ยกเลิก</button>
              <button className="btn btn-primary" style={FLEX1} onClick={handleImportSelected} disabled={selectedImports.size === 0}>
                นำเข้า {selectedImports.size} รายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
