import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ModalProvider } from "@/components/modal-provider";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import SessionAutoLogout from "@/components/SessionAutoLogout";
import CheckLogoutOnReturn from "@/components/CheckLogoutOnReturn";
import { ClientRootLayout } from "./ClientRootLayout";
import SidebarTutorial from "@/components/SidebarTutorial";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NinjaText-AI",
  description: "Generate Reports",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={cn(inter.className, "bg-slate-800")}>
          <ModalProvider />
          <SessionAutoLogout />
          <CheckLogoutOnReturn />
          <SidebarTutorial />
          <ClientRootLayout>{children}</ClientRootLayout>
          <Toaster/>
        </body>
      </html>
    </ClerkProvider>
  );
}
