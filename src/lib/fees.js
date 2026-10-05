// Common-area fee (ค่าส่วนกลาง) is paid a few times a year; spread it over 12 months for reporting.
const num = (v) => parseFloat(String(v ?? "").replace(/,/g, "")) || 0;

export const DEFAULT_FEE_TIMES = 2;

export function monthlyCommonFee(room) {
  const fee = num(room?.common_fee);
  if (!fee) return 0;
  const times = num(room?.common_times) || DEFAULT_FEE_TIMES;
  return (fee * times) / 12;
}
