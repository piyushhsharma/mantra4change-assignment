import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PBL Program Intelligence & Grant Reporting Assistant",
  description: "Education NGO program intelligence and grant reporting system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
