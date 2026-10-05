// One rule for "does this transaction count as money actually received/spent":
// Paid (or no status) counts; Pending, Overdue and Cancelled do not.
export const isCounted = (t) => {
  const s = String(t?.status ?? "").trim();
  return s === "" || s === "Paid";
};
