import { Plus, Search, Filter, Mail, Phone, FileText, Edit, Trash2 } from "lucide-react";
import styles from "./page.module.css";

export default function TenantsPage() {
  const tenants = [
    { id: 1, name: "Somchai Sripasert", room: "101", phone: "081-234-5678", email: "somchai@example.com", status: "Active", contractEnd: "2026-12-31" },
    { id: 2, name: "Somsri Maneerat", room: "104", phone: "089-876-5432", email: "somsri.m@example.com", status: "Active", contractEnd: "2026-10-15" },
    { id: 3, name: "Wichai Thongkam", room: "201", phone: "082-345-6789", email: "-", status: "Active", contractEnd: "2027-01-20" },
    { id: 4, name: "Amonrat Sukjai", room: "-", phone: "083-456-7890", email: "amonrat@example.com", status: "Past", contractEnd: "2025-12-31" },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">การจัดการผู้เช่า (Tenant Management)</h1>
        <button className="btn btn-primary">
          <Plus size={20} />
          เพิ่มผู้เช่าใหม่ (Add Tenant)
        </button>
      </div>

      <div className={`card glass ${styles.controls}`}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input type="text" placeholder="ค้นหาผู้เช่าด้วยชื่อ, ห้องพัก, หรือเบอร์โทร..." className="input-field" style={{ paddingLeft: '2.5rem' }} />
        </div>
        <button className="btn btn-outline">
          <Filter size={20} />
          ตัวกรอง (Filters)
        </button>
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
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className={styles.tenantInfo}>
                      <div className={styles.avatar}>{tenant.name.charAt(0)}</div>
                      <strong>{tenant.name}</strong>
                    </div>
                  </td>
                  <td>{tenant.room}</td>
                  <td>
                    <div className={styles.contactInfo}>
                      <div className={styles.contactRow}><Phone size={14} /> {tenant.phone}</div>
                      {tenant.email !== "-" && <div className={styles.contactRow}><Mail size={14} /> {tenant.email}</div>}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${tenant.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td>{tenant.contractEnd}</td>
                  <td>
                    <div className={styles.actionCell}>
                      <button className={styles.iconBtn} title="View Contract"><FileText size={16} /></button>
                    </div>
                  </td>
                  <td>
                    <div className={styles.actionCell}>
                      <button className={styles.iconBtn} title="Edit Tenant"><Edit size={16} /></button>
                      <button className={styles.iconBtn} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
