/** @type {import('next').NextConfig} */
const nextConfig = {
  // เปิดโหมด export ให้ Next.js สร้างไฟล์ Static HTML
  output: 'export',
  
  // กำหนด basePath เฉพาะตอนที่รันบน GitHub Actions
  basePath: process.env.GITHUB_ACTIONS ? '/Pms' : '',
  
  // GitHub Pages ไม่รองรับ Next.js Image Optimization ต้องปิดไว้
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
