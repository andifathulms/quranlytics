"use client";

import { Toaster } from "@/components/ui/Toaster";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ReaderSettingsProvider } from "@/lib/reader/ReaderSettings";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ToastProvider } from "@/lib/toast/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ReaderSettingsProvider>
            {children}
            <Toaster />
          </ReaderSettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
