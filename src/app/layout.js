import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import BottomNav from "@/components/BottomNav";
import StatusBar from "@/components/StatusBar";
import { DataProvider } from "./context/DataContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const base = process.env.GITHUB_ACTIONS ? "/Pms" : "";

export const metadata = {
  title: "ครอบครัวตัวน",
  description: "จัดการห้องพัก ผู้เช่า และการเงิน",
  manifest: `${base}/manifest.webmanifest`,
  icons: { apple: `${base}/icons/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "ครอบครัวตัวน", statusBarStyle: "default" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#4F46E5",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <DataProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <StatusBar />
              {children}
            </main>
            <BottomNav />
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
