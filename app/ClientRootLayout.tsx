// app/ClientRootLayout.tsx
'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModalProvider } from "@/components/modal-provider";
import { Toaster } from "@/components/ui/toaster";
import SessionAutoLogout from "@/components/SessionAutoLogout";
import CheckLogoutOnReturn from "@/components/CheckLogoutOnReturn";

const queryClient = new QueryClient();

export function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider />
      <SessionAutoLogout />
      <CheckLogoutOnReturn />
      {children}
      <Toaster/>
    </QueryClientProvider>
  );
}