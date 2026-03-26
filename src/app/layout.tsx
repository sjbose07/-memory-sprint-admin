import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MCQ Admin Panel | Manage Content & Users",
  description: "A comprehensive administration dashboard for the MCQ Practice App. Manage subjects, chapters, questions, and students efficiently.",
  openGraph: {
    title: "MCQ Admin Panel | Search Engine Optimization",
    description: "Manage content, questions and tests effortlessly.",
    type: "website",
  },
  keywords: ["education", "mcq", "admin", "management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
