import { Plus, Download, ArrowUpRight, ArrowDownRight } from "lucide-react";
import styles from "./page.module.css";

export default function FinancesPage() {
  const transactions = [
    { id: 1, date: "2026-04-01", description: "Rent Payment - Room 101", category: "Rent", type: "income", amount: "5,000", status: "Paid" },
    { id: 2, date: "2026-04-02", description: "Deposit - Room 104", category: "Deposit", type: "income", amount: "10,000", status: "Paid" },
    { id: 3, date: "2026-04-05", description: "Water Bill (PEA)", category: "Utilities", type: "expense", amount: "1,250", status: "Paid" },
    { id: 4, date: "2026-04-10", description: "AC Maintenance - Room 201", category: "Maintenance", type: "expense", amount: "800", status: "Paid" },
    { id: 5, date: "2026-04-12", description: "Rent Payment - Room 104", category: "Rent", type: "income", amount: "5,000", status: "Pending" },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className={styles.header}>
        <h1 className="page-title">ภาพรวมการเงิน (Financial Overview)</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline">
            <Download size={20} />
            ส่งออก CSV (Export CSV)
          </button>
          <button className="btn btn-primary">
            <Plus size={20} />
            เพิ่มรายการ (Add Transaction)
          </button>
        </div>
      </div>

      <div className={styles.summaryCards}>
        <div className={`${styles.summaryCard} ${styles.incomeCard}`}>
          <h3>รายรับทั้งหมด (Total Income - April)</h3>
          <p>+฿15,000</p>
        </div>
        <div className={`${styles.summaryCard} ${styles.expenseCard}`}>
          <h3>รายจ่ายทั้งหมด (Total Expenses - April)</h3>
          <p>-฿2,050</p>
        </div>
        <div className={`${styles.summaryCard} ${styles.balanceCard}`}>
          <h3>ยอดคงเหลือสุทธิ (Net Balance)</h3>
          <p>฿12,950</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0 }}>
        <div className={styles.tabs} style={{ padding: '0 1.5rem', paddingTop: '1.5rem' }}>
          <button className={`${styles.tab} ${styles.tabActive}`}>ธุรกรรมทั้งหมด (All)</button>
          <button className={styles.tab}>รายรับ (Income)</button>
          <button className={styles.tab}>รายจ่าย (Expenses)</button>
        </div>

        <div className={styles.tableContainer} style={{ padding: '0 1.5rem 1.5rem' }}>
          <table className={styles.financeTable}>
            <thead>
              <tr>
                <th>วันที่ (Date)</th>
                <th>รายละเอียด (Description)</th>
                <th>หมวดหมู่ (Category)</th>
                <th>จำนวนเงิน (Amount)</th>
                <th>สถานะ (Status)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.description}</td>
                  <td><span className="badge badge-neutral">{t.category}</span></td>
                  <td className={t.type === 'income' ? styles.amountIncome : styles.amountExpense}>
                    {t.type === 'income' ? '+' : '-'}฿{t.amount}
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
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
