import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { DataProvider } from "./context/DataContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Luma Estate | Property Management",
  description: "Comprehensive management system for rental properties and tenants.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <DataProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </DataProvider>
      </body>
    </html>
  );
}
