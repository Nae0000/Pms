"use client";
import { useState } from "react";
import { Plus, Download, X, Edit, Trash2 } from "lucide-react";
import styles from "./page.module.css";
import { useData } from "../context/DataContext";

export default function FinancesPage() {
  const { transactions, rooms, addTransaction, updateTransaction, deleteTransaction, isInitialLoading } = useData();
  const [activeTab, setActiveTab] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [categories, setCategories] = useState(["Rent", "Deposit", "Utilities", "Maintenance", "Insurance", "Other"]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);
  const [editCatIdx, setEditCatIdx] = useState(-1);
  const [editCatValue, setEditCatValue] = useState("");

  const emptyForm = () => ({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: categories[0] || "Other",
    type: "income",
    expense_type: "",
    amount: "",
    status: "Paid",
    room: "",
  });

  const [form, setForm] = useState(emptyForm());
  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ============ Dynamic Categories ============
  const usedCategories = [...new Set((transactions || []).map((t) => t.category).filter(Boolean))];
  const allCategories = [...new Set([...categories, ...usedCategories])];

  // ============ Filtering ============
  const filteredTx = (transactions || []).filter((t) => {
    // Top dropdown filters
    if (filterRoom !== "all" && t.room !== filterRoom) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;

    if (activeTab === "income") return t.type === "income";
    if (activeTab === "expense") return t.type === "expense";
    if (activeTab === "fixed") return t.type === "expense" && t.expense_type === "fixed";
    if (activeTab === "variable") return t.type === "expense" && t.expense_type === "variable";
    return true;
  });

  // ============ Summary ============
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const thisMonthTx = (transactions || []).filter((t) => {
    const d = new Date(t.date);
    const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (!isThisMonth) return false;
    
    // Top dropdown filters
    if (filterRoom !== "all" && t.room !== filterRoom) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    
    return true;
  });

  const totalIncome = thisMonthTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);

  const totalExpense = thisMonthTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);

  const fixedExpense = thisMonthTx
    .filter((t) => t.type === "expense" && t.expense_type === "fixed")
    .reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);

  const variableExpense = thisMonthTx
    .filter((t) => t.type === "expense" && t.expense_type === "variable")
    .reduce((sum, t) => sum + parseFloat(String(t.amount).replace(/,/g, "") || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const formatNumber = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 0 });

  // ============ Handlers ============
  const handleAddClick = () => {
    setForm(emptyForm());
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e) => {
    e.preventDefault();
    addTransaction({ ...form, amount: form.amount.replace(/,/g, "") });
    setIsAddModalOpen(false);
  };

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setForm({
      date: tx.date || "",
      description: tx.description || "",
      category: tx.category || "Rent",
      type: tx.type || "income",
      expense_type: tx.expense_type || "",
      amount: String(tx.amount || ""),
      status: tx.status || "Paid",
      room: tx.room || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (editingTx) {
      updateTransaction(editingTx.id, { ...form, amount: form.amount.replace(/,/g, "") });
      setIsEditModalOpen(false);
    }
  };

  const handleDelete = (id) => {
    if (confirm("คุณต้องการลบรายการนี้? (Delete this transaction?)")) {
      deleteTransaction(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Description", "Room", "Category", "Type", "Expense Type", "Amount", "Status"];
    const rows = (transactions || []).map((t) => [t.date, t.description, t.room || "-", t.category, t.type, t.expense_type || "-", t.amount, t.status]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finances_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ Form Render ============
  const renderFormFields = () => (
    <>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>วันที่ (Date) *</label>
          <input type="date" className="input-field" value={form.date} onChange={(e) => setField("date", e.target.value)} style={W100} required />
        </div>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>ประเภท (Type) *</label>
          <select className="input-field" value={form.type} onChange={(e) => { setField("type", e.target.value); if (e.target.value === "income") setField("expense_type", ""); }} style={W100}>
            <option value="income">รายรับ (Income)</option>
            <option value="expense">รายจ่าย (Expense)</option>
          </select>
        </div>
      </div>
      {form.type === "expense" && (
        <div>
          <label style={LABEL}>ประเภทรายจ่าย (Expense Type) *</label>
          <select className="input-field" value={form.expense_type} onChange={(e) => setField("expense_type", e.target.value)} style={W100} required>
            <option value="">-- เลือกประเภท --</option>
            <option value="fixed">รายจ่ายคงที่ (Fixed)</option>
            <option value="variable">รายจ่ายผันแปร (Variable)</option>
          </select>
        </div>
      )}
      <div>
        <label style={LABEL}>รายละเอียด (Description) *</label>
        <input type="text" className="input-field" value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="e.g. Rent Payment - Room 101" style={W100} required />
      </div>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>ห้องพัก (Room)</label>
          <select className="input-field" value={form.room} onChange={(e) => setField("room", e.target.value)} style={W100}>
            <option value="">-- ไม่ระบุ / ส่วนกลาง (None/Common) --</option>
            {(rooms || []).map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>หมวดหมู่ (Category)</label>
          {isAddingCategory ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="พิมพ์หมวดหมู่ใหม่..."
                style={{ flex: 1 }}
                autoFocus
              />
              <button type="button" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => {
                if (newCategory.trim()) {
                  setCategories(prev => [...prev, newCategory.trim()]);
                  setField('category', newCategory.trim());
                  setNewCategory('');
                  setIsAddingCategory(false);
                }
              }}>เพิ่ม</button>
              <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} onClick={() => { setIsAddingCategory(false); setNewCategory(''); }}>ยกเลิก</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="input-field" value={form.category} onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  setIsAddingCategory(true);
                } else if (e.target.value === '__manage__') {
                  setIsCategoryManageOpen(true);
                } else {
                  setField('category', e.target.value);
                }
              }} style={{ flex: 1 }}>
                {allCategories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
                <option value="__add_new__">➕ เพิ่มหมวดหมู่ใหม่</option>
                <option value="__manage__">✏️ จัดการหมวดหมู่</option>
              </select>
            </div>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label style={LABEL}>จำนวนเงิน (Amount) *</label>
          <input type="text" className="input-field" value={form.amount} onChange={(e) => setField("amount", e.target.value)} placeholder="e.g. 5000" style={W100} required />
        </div>
      </div>
      <div>
        <label style={LABEL}>สถานะ (Status)</label>
        <select className="input-field" value={form.status} onChange={(e) => setField("status", e.target.value)} style={W100}>
          <option value="Paid">ชำระแล้ว (Paid)</option>
          <option value="Pending">รอชำระ (Pending)</option>
          <option value="Overdue">เลยกำหนด (Overdue)</option>
        </select>
      </div>
    </>
  );

  const LABEL = { display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 };
  const W100 = { width: "100%" };
  const BTNS = { display: "flex", gap: "1rem", marginTop: "1rem" };
  const FLEX1 = { flex: 1 };

  if (isInitialLoading) {
    return (
      <div className="page-container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>กำลังโหลดข้อมูล (Loading...)...</p>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">ภาพรวมการเงิน (Financial Overview)</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-outline" onClick={handleExportCSV}>
            <Download size={20} />
            ส่งออก CSV (Export CSV)
          </button>
          <button className="btn btn-primary" onClick={handleAddClick}>
            <Plus size={20} />
            เพิ่มรายการ (Add Transaction)
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", alignItems: "center", background: "var(--bg-card)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
        <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>ตัวกรอง (Filters):</span>
        <select className="input-field" value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} style={{ width: "200px", padding: "0.5rem" }}>
          <option value="all">ทุกห้อง (All Rooms)</option>
          <option value="">ไม่ระบุ / ส่วนกลาง</option>
          {(rooms || []).map(r => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>
        <select className="input-field" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: "200px", padding: "0.5rem" }}>
          <option value="all">ทุกหมวดหมู่ (All Categories)</option>
          {allCategories.map((c, i) => (
            <option key={i} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className={styles.summaryCards}>
        <div className={`${styles.summaryCard} ${styles.incomeCard}`}>
          <h3>รายรับทั้งหมด (Total Income - {monthNames[currentMonth]})</h3>
          <p>+฿{formatNumber(totalIncome)}</p>
        </div>
        <div className={`${styles.summaryCard} ${styles.expenseCard}`}>
          <h3>รายจ่ายทั้งหมด (Total Expenses - {monthNames[currentMonth]})</h3>
          <p>-฿{formatNumber(totalExpense)}</p>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>คงที่: ฿{formatNumber(fixedExpense)}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ผันแปร: ฿{formatNumber(variableExpense)}</span>
          </div>
        </div>
        <div className={`${styles.summaryCard} ${styles.balanceCard}`}>
          <h3>ยอดคงเหลือสุทธิ (Net Balance)</h3>
          <p style={{ color: netBalance >= 0 ? "var(--secondary)" : "var(--danger)" }}>฿{formatNumber(netBalance)}</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0 }}>
        <div className={styles.tabs} style={{ padding: "0 1.5rem", paddingTop: "1.5rem" }}>
          <button className={`${styles.tab} ${activeTab === "all" ? styles.tabActive : ""}`} onClick={() => setActiveTab("all")}>
            ทั้งหมด (All)
          </button>
          <button className={`${styles.tab} ${activeTab === "income" ? styles.tabActive : ""}`} onClick={() => setActiveTab("income")}>
            รายรับ (Income)
          </button>
          <button className={`${styles.tab} ${activeTab === "expense" ? styles.tabActive : ""}`} onClick={() => setActiveTab("expense")}>
            รายจ่ายทั้งหมด (All Expenses)
          </button>
          <button className={`${styles.tab} ${activeTab === "fixed" ? styles.tabActive : ""}`} onClick={() => setActiveTab("fixed")}>
            คงที่ (Fixed)
          </button>
          <button className={`${styles.tab} ${activeTab === "variable" ? styles.tabActive : ""}`} onClick={() => setActiveTab("variable")}>
            ผันแปร (Variable)
          </button>
        </div>

        <div className={styles.tableContainer} style={{ padding: "0 1.5rem 1.5rem" }}>
          <table className={styles.financeTable}>
            <thead>
              <tr>
                <th>วันที่ (Date)</th>
                <th>รายละเอียด (Description)</th>
                <th>ห้อง (Room)</th>
                <th>หมวดหมู่ (Category)</th>
                <th>จำนวนเงิน (Amount)</th>
                <th>สถานะ (Status)</th>
                <th>จัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                    ไม่พบรายการ (No transactions found)
                  </td>
                </tr>
              ) : (
                filteredTx.map((t) => (
                  <tr key={t.id}>
                    <td data-label="วันที่ (Date)">{t.date}</td>
                    <td data-label="รายละเอียด (Description)">{t.description}</td>
                    <td data-label="ห้อง (Room)">{t.room ? <span className="badge badge-info">{t.room}</span> : <span style={{ color: "var(--text-muted)" }}>-</span>}</td>
                    <td data-label="หมวดหมู่ (Category)">
                      <span className="badge badge-neutral">{t.category}</span>
                      {t.type === 'expense' && t.expense_type && (
                        <span className={`badge ${t.expense_type === 'fixed' ? 'badge-info' : 'badge-warning'}`} style={{ marginLeft: '0.4rem', fontSize: '0.7rem' }}>
                          {t.expense_type === 'fixed' ? 'คงที่' : 'ผันแปร'}
                        </span>
                      )}
                    </td>
                    <td data-label="จำนวนเงิน (Amount)" className={t.type === "income" ? styles.amountIncome : styles.amountExpense}>
                      {t.type === "income" ? "+" : "-"}฿{parseFloat(String(t.amount).replace(/,/g, "") || 0).toLocaleString()}
                    </td>
                    <td data-label="สถานะ (Status)">
                      <span className={`badge ${t.status === "Paid" ? "badge-success" : t.status === "Overdue" ? "badge-danger" : "badge-warning"}`}>{t.status}</span>
                    </td>
                    <td data-label="จัดการ (Actions)">
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button className={styles.actionBtn} title="แก้ไข (Edit)" onClick={() => handleEditClick(t)}>
                          <Edit size={16} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="ลบ (Delete)" onClick={() => handleDelete(t.id)}>
                          <Trash2 size={16} />
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>เพิ่มรายการ (Add Transaction)</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveAdd} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {renderFormFields()}
              <div style={BTNS}>
                <button type="button" className="btn btn-outline" style={FLEX1} onClick={() => setIsAddModalOpen(false)}>
                  ยกเลิก (Cancel)
                </button>
                <button type="submit" className="btn btn-primary" style={FLEX1}>
                  เพิ่มรายการ (Add)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>แก้ไขรายการ (Edit Transaction)</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {renderFormFields()}
              <div style={BTNS}>
                <button type="button" className="btn btn-outline" style={FLEX1} onClick={() => setIsEditModalOpen(false)}>
                  ยกเลิก (Cancel)
                </button>
                <button type="submit" className="btn btn-primary" style={FLEX1}>
                  บันทึก (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryManageOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>จัดการหมวดหมู่ (Manage Categories)</h2>
              <button onClick={() => { setIsCategoryManageOpen(false); setEditCatIdx(-1); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allCategories.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  {editCatIdx === idx ? (
                    <>
                      <input
                        type="text"
                        className="input-field"
                        value={editCatValue}
                        onChange={(e) => setEditCatValue(e.target.value)}
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                        autoFocus
                      />
                      <button type="button" className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => {
                        if (editCatValue.trim() && editCatValue.trim() !== cat) {
                          const oldName = cat;
                          const newName = editCatValue.trim();
                          // Update in categories list
                          setCategories(prev => prev.map(c => c === oldName ? newName : c));
                          // Update all existing transactions with this category
                          (transactions || []).forEach(t => {
                            if (t.category === oldName) {
                              updateTransaction(t.id, { category: newName });
                            }
                          });
                          // Update form if currently selected
                          if (form.category === oldName) setField('category', newName);
                        }
                        setEditCatIdx(-1);
                      }}>บันทึก</button>
                      <button type="button" className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setEditCatIdx(-1)}>ยกเลิก</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, fontSize: '0.9rem' }}>{cat}</span>
                      <button type="button" className={styles.actionBtn} title="แก้ไข" onClick={() => { setEditCatIdx(idx); setEditCatValue(cat); }}>
                        <Edit size={14} />
                      </button>
                      <button type="button" className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="ลบ" onClick={() => {
                        if (confirm(`ลบหมวดหมู่ "${cat}" ? รายการที่ใช้หมวดหมู่นี้จะถูกเปลี่ยนเป็น "Other"`)) {
                          setCategories(prev => prev.filter(c => c !== cat));
                          (transactions || []).forEach(t => {
                            if (t.category === cat) {
                              updateTransaction(t.id, { category: 'Other' });
                            }
                          });
                          if (form.category === cat) setField('category', 'Other');
                        }
                      }}>
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => { setIsCategoryManageOpen(false); setEditCatIdx(-1); }}>เสร็จสิ้น (Done)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
