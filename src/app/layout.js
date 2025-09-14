import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import ClientLayout from "@/component/ClientLayout";
import { NetworkStatusProvider } from "@/context/NetworkStatusProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Employee Management",
  description:
    "Employee Management Sytem for generating payroll, timestamp and other HR related services.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <ClientLayout>
            <NetworkStatusProvider>{children}</NetworkStatusProvider>
          </ClientLayout>
        </UserProvider>
      </body>
    </html>
  );
}
