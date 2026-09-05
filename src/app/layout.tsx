import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "TRAI IR | International Relations",
  description: "Internal information portal for TRAI International Relations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
